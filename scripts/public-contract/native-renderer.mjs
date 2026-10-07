import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { UniqueOutputMap } from './generation-writer.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
export const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
export const jsonBytes = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
export const byteIdentity = (relative, bytes) => ({
  path: relative,
  bytes: bytes.length,
  sha256: sha(bytes),
});
function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}
export function pointer(value, location) {
  if (location === '') return value;
  if (typeof location !== 'string' || !location.startsWith('/'))
    fail('SOURCE_POINTER', 'Expected a JSON pointer');
  for (const token of location.slice(1).split('/')) {
    if (/~(?![01])/.test(token)) fail('SOURCE_POINTER', 'Invalid JSON pointer escape');
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, key))
      fail('SOURCE_POINTER', 'Missing ' + location);
    value = value[key];
  }
  return value;
}
// These registered metadata preimages have ASCII keys and safe integer values.
// Reject unsupported encodings instead of silently using a different digest domain.
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((key) => {
          if (!/^[\x20-\x7e]*$/.test(key))
            fail('CANONICAL_KEY', 'Registered metadata key is not ASCII');
          return JSON.stringify(key) + ':' + canonical(value[key]);
        })
        .join(',') +
      '}'
    );
  if (typeof value === 'number' && !Number.isSafeInteger(value))
    fail('CANONICAL_NUMBER', 'Registered metadata number is not a safe integer');
  if (typeof value === 'string')
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = value.charCodeAt(++i);
        if (!(next >= 0xdc00 && next <= 0xdfff)) fail('CANONICAL_STRING', 'Unpaired surrogate');
      } else if (code >= 0xdc00 && code <= 0xdfff) fail('CANONICAL_STRING', 'Unpaired surrogate');
    }
  const text = JSON.stringify(value);
  if (text === undefined) fail('CANONICAL_VALUE', 'Non-JSON metadata');
  return text;
}
export const digest = (value) => 'sha256:' + sha(canonical(value));
export function project(value, operations) {
  const result = structuredClone(value),
    seen = new Set();
  for (const operation of operations) {
    const location = operation.pointer;
    if (seen.has(location)) fail('PROJECTION_DUPLICATE', 'Duplicate projection pointer');
    seen.add(location);
    const split = location.lastIndexOf('/'),
      parent = pointer(result, location.slice(0, split)),
      key = location
        .slice(split + 1)
        .replaceAll('~1', '/')
        .replaceAll('~0', '~');
    if (
      !parent ||
      typeof parent !== 'object' ||
      !key ||
      ['__proto__', 'constructor', 'prototype'].includes(key)
    )
      fail('PROJECTION_PATH', 'Invalid projection property');
    if (
      Array.isArray(parent) &&
      (operation.action !== 'replace' ||
        !/^(0|[1-9][0-9]*)$/.test(key) ||
        Number(key) >= parent.length)
    )
      fail('PROJECTION_PATH', 'Array projection may only replace an existing index');
    const present = Object.hasOwn(parent, key);
    if (operation.action === 'add') {
      if (present || operation.expected_absent !== true)
        fail('PROJECTION_GUARD', 'Expected absent projection property');
    } else if (!present || digest(parent[key]) !== operation.expected_before_sha256)
      fail('PROJECTION_GUARD', 'Projection preimage changed at ' + location);
    if (operation.action === 'delete') delete parent[key];
    else if (operation.action === 'replace' || operation.action === 'add')
      parent[key] = structuredClone(operation.value);
    else fail('PROJECTION_ACTION', 'Unknown projection action');
  }
  return result;
}
export function loadRecipe() {
  const bytes = fs.readFileSync(
      process.env.KDNA_NATIVE_RECIPE || path.join(directory, 'native-output-recipe.json'),
    ),
    recipe = JSON.parse(bytes);
  if (recipe.format !== 'kdna.native-output-recipe/1')
    fail('RECIPE_FORMAT', 'Unsupported generation recipe');
  return {
    recipe,
    identity: byteIdentity('scripts/public-contract/native-output-recipe.json', bytes),
  };
}
export function compileTypes(source) {
  function compile(value) {
    if (Array.isArray(value)) return value.map(compile);
    if (value && typeof value === 'object') {
      if (value.$opaque) return false;
      if (value.$value) {
        const scalar = pointer(source, value.$value);
        if (scalar !== null && !['string', 'boolean', 'number'].includes(typeof scalar))
          fail('SOURCE_VALUE', 'Expected scalar source binding');
        return {
          const: scalar,
          type:
            scalar === null
              ? 'null'
              : typeof scalar === 'number' && Number.isInteger(scalar)
                ? 'integer'
                : typeof scalar,
        };
      }
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, compile(item)]));
    }
    return value;
  }
  return compile(source.types);
}
function references(value, found = new Set()) {
  if (value && typeof value === 'object') {
    if (value.$ref) {
      if (!value.$ref.startsWith('#/$defs/'))
        fail('SOURCE_REFERENCE', 'Only local type references are supported');
      found.add(value.$ref.slice(8));
    }
    for (const child of Object.values(value)) references(child, found);
  }
  return found;
}
export function closure(types, roots) {
  const found = new Set(),
    queue = [...roots];
  while (queue.length) {
    const name = queue.pop();
    if (found.has(name)) continue;
    if (!Object.hasOwn(types, name)) fail('SOURCE_TYPE', 'Missing ' + name);
    found.add(name);
    queue.push(...references(types[name]));
  }
  return Object.fromEntries([...found].sort().map((name) => [name, types[name]]));
}
function renderType(value, source, tuples, parent = {}) {
  if (value === false || value.$opaque) return 'never';
  if (value.$value) return JSON.stringify(pointer(source, value.$value));
  if (value.$ref) return value.$ref.slice(8);
  if (Object.hasOwn(value, 'const')) return JSON.stringify(value.const);
  if (value.enum) return value.enum.map((item) => JSON.stringify(item)).join(' | ');
  const union = value.oneOf ?? value.anyOf;
  if (union && !value.type)
    return (
      '(' +
      union
        .map((item) => renderType(item, source, tuples, value.properties ?? parent))
        .join(' | ') +
      ')'
    );
  let result;
  if (value.type === 'object' || value.properties)
    result =
      '{ ' +
      Object.entries(value.properties ?? {})
        .map(
          ([key, item]) =>
            'readonly ' +
            JSON.stringify(key) +
            (value.required?.includes(key) ? '' : '?') +
            ': ' +
            renderType(item, source, tuples) +
            ';',
        )
        .join(' ') +
      ' }';
  else if (value.type === 'array') {
    if (value.prefixItems) {
      if (
        !tuples ||
        value.items !== false ||
        value.minItems !== value.prefixItems.length ||
        value.maxItems !== value.prefixItems.length
      )
        fail('UNSUPPORTED_PREFIX_ITEMS_CARDINALITY', 'Only declared fixed tuples are supported');
      result =
        'readonly [' +
        value.prefixItems.map((item) => renderType(item, source, tuples)).join(', ') +
        ']';
    } else
      result =
        value.maxItems === 0
          ? 'readonly []'
          : 'ReadonlyArray<' + renderType(value.items, source, tuples) + '>';
  } else if (['integer', 'number'].includes(value.type)) result = 'number';
  else if (['string', 'boolean', 'null'].includes(value.type)) result = value.type;
  else if (value.required)
    result =
      '{ ' +
      value.required
        .map((key) => {
          if (!Object.hasOwn(parent, key)) fail('TYPE_RENDER', 'Unbound required property');
          return (
            'readonly ' + JSON.stringify(key) + ': ' + renderType(parent[key], source, tuples) + ';'
          );
        })
        .join(' ') +
      ' }';
  else result = null;
  if (value.allOf) {
    const branches = value.allOf
      .map((item) => renderType(item, source, tuples, value.properties ?? parent))
      .filter((item) => item !== null);
    if (branches.length)
      result = [...(result === null ? [] : [result]), ...branches]
        .map((item) => '(' + item + ')')
        .join(' & ');
  }
  return result;
}
function typeDeclarations(owner, all, source) {
  const lines = [owner.typescript.original_header],
    local = new Set(owner.typescript.opaque_brands_declared_here);
  const imported = new Map(
    owner.typescript.import_export_rows
      .filter((row) => row.action === 'import')
      .flatMap((row) => row.names.map((name) => [name, row.coordinate])),
  );
  for (const name of Object.keys(all)) {
    const raw = source.types[name];
    if (raw.$opaque) {
      if (local.has(name))
        lines.push(
          'declare const ' + name + 'Brand: unique symbol;',
          'export type ' + name + ' = { readonly [' + name + 'Brand]: true };',
        );
      else if (imported.has(name)) {
        const coordinate = imported.get(name);
        lines.push(
          'import type { ' + name + " } from '" + coordinate + "';",
          'export type { ' + name + " } from '" + coordinate + "';",
        );
      } else fail('OPAQUE_OWNER', 'Missing declared opaque owner for ' + name);
    } else
      lines.push(
        'export type ' +
          name +
          ' = ' +
          renderType(raw, source, owner.typescript.prefixItems_support) +
          ';',
      );
  }
  return Buffer.from(lines.join('\n') + '\n');
}
function sourceFacade(text, adapter) {
  const rows = adapter.additional_imports;
  const line = (row) =>
    (row.action === 'export' ? 'export type *' : 'import type { ' + row.names.join(', ') + ' }') +
    " from '" +
    row.coordinate +
    "';\n";
  const named = rows.filter((row) => row.action === 'import');
  const markers = [
    'export declare function protectSectionSourceNode',
    'export type ProtectedNativeSourceBundle06',
    'export declare function previewProtectedSectionSourceRevision',
  ];
  for (const marker of markers)
    if (text.split(marker).length !== 2)
      fail('API_ADAPTER', 'Source facade adapter anchor changed');
  return (
    line(rows.find((row) => row.action === 'export')) +
    line(named[0]) +
    text
      .replace(markers[0], '\n' + markers[0])
      .replace(markers[1], '\n' + line(named[1]) + markers[1])
      .replace(markers[2], '\n' + line(named[2]) + markers[2])
  );
}
export function nativeOutputPaths(recipe) {
  const result = [];
  for (const owner of recipe.owners) {
    result.push(
      ...owner.members,
      ...owner.schemas.map((row) => row.package_target).filter(Boolean),
      ...owner.apis.map((row) => row.active_facade_target).filter(Boolean),
    );
  }
  result.push(
    ...recipe.sections_mirrors,
    recipe.whole_dispatch.directory + '/native-whole-validators.cjs',
    recipe.whole_dispatch.directory + '/native-whole-schemas.json',
  );
  if (new Set(result).size !== result.length)
    fail('RECIPE_DUPLICATE', 'Duplicate native output declaration');
  return result;
}
export function buildNativeOutputs(source, sourceBytes, recipe, producer, dependencyRoot) {
  if (sha(sourceBytes) !== recipe.input_sha256)
    fail('SOURCE_IDENTITY', 'Maintained source changed; reconcile generation recipe first');
  if (source.representation_candidate?.candidate_only !== true)
    fail('SOURCE_STATUS', 'Native candidate source required');
  for (const row of recipe.registered_preimages)
    if (digest(pointer(source, row.pointer)) !== row.digest)
      fail('REGISTERED_PREIMAGE', 'Registered definition preimage differs');
  const require = createRequire(path.join(dependencyRoot, 'package.json')),
    Ajv = require('ajv/dist/2020.js'),
    standalone = require('ajv/dist/standalone/index.js');
  if (require('ajv/package.json').version !== source.tooling.ajv)
    fail('DEPENDENCY_VERSION', 'Declared Ajv version differs');
  const types = compileTypes(source),
    outputs = new UniqueOutputMap(),
    sourceIdentity = byteIdentity(recipe.source, sourceBytes),
    ownerRows = [];
  for (const owner of recipe.owners) {
    const selected = pointer(source, owner.roots_pointer),
      names = Array.isArray(selected) ? selected : Object.keys(selected);
    if (
      names.length !== owner.root_count ||
      new Set(names).size !== names.length ||
      JSON.stringify(names) !== JSON.stringify(owner.schemas.map((row) => row.name)) ||
      names.some((name) => !/^[A-Za-z][A-Za-z0-9_]*$/.test(name))
    )
      fail('SOURCE_ROOTS', 'Native roots changed for ' + owner.id);
    const moduleRecipe = recipe.module_projections.find(
      (row) => row.pointer === owner.source_module_pointer,
    );
    const rawModule = pointer(source, owner.source_module_pointer);
    if (digest(rawModule) !== moduleRecipe.input_digest)
      fail('MODULE_PREIMAGE', 'Native module preimage differs for ' + owner.id);
    const module = project(rawModule, moduleRecipe.operations);
    if (digest(module) !== moduleRecipe.output_digest)
      fail('MODULE_PROJECTION', 'Native module projection differs for ' + owner.id);
    const all = closure(types, names);
    if (Object.keys(all).length !== owner.type_closure_count)
      fail('SOURCE_CLOSURE', 'Native type closure changed for ' + owner.id);
    const start = new Set(outputs.keys()),
      ajv = new Ajv(owner.ajv_options),
      roots = {};
    for (const row of owner.schemas) {
      const schema = {
        $schema: pointer(source, owner.schema_dialect_pointer),
        $id: row.schema_id,
        title: row.name,
        description: owner.original_schema_description,
        $ref: '#/$defs/' + row.name,
        $defs: closure(types, [row.name]),
      };
      if (row.package_target) outputs.set(row.package_target, jsonBytes(schema));
      ajv.addSchema(schema);
      roots[row.name] = schema.$id;
    }
    const validator = owner.members.find((relative) => relative.endsWith('/validators.cjs'));
    // The original sections header is a literal LF escape in its generator recipe.
    let validatorText =
      owner.validator_header.replaceAll('\\n', '\n') + standalone(ajv, roots) + '\n';
    if (owner.validator_final_newline !== undefined) {
      if (owner.validator_final_newline !== 'single')
        fail('RECIPE_VALIDATOR_NEWLINE', 'Unsupported validator newline policy');
      validatorText = validatorText.replace(/\n+$/u, '') + '\n';
    }
    outputs.set(validator, Buffer.from(validatorText));
    if (owner.typescript.generated)
      outputs.set(
        owner.members.find((relative) => relative.endsWith('/types.d.ts')),
        typeDeclarations(owner, all, source),
      );
    outputs.set(
      moduleRecipe.output,
      jsonBytes({
        candidate_only: true,
        source: sourceIdentity,
        historical_original_source: moduleRecipe.historical_original_source,
        module,
        types: all,
      }),
    );
    for (const api of owner.apis) {
      let text = pointer(source, api.source_pointer);
      if (typeof text !== 'string') fail('SOURCE_API', 'API must be source text');
      const directory = path.dirname(moduleRecipe.output);
      const basename =
        owner.id === 'retained-browser'
          ? api.role === 'core'
            ? 'core-api.d.ts'
            : 'read-api.d.ts'
          : api.role === 'read'
            ? 'read-api.d.ts'
            : api.role === 'planned'
              ? 'planned-whole-api.d.ts'
              : 'api.d.ts';
      const intermediate = directory + '/' + basename;
      if (owner.members.includes(intermediate)) outputs.set(intermediate, Buffer.from(text));
      if (api.active_facade_target) {
        if (owner.id === 'source') text = sourceFacade(text, recipe.source_facade_adapter);
        if (api.type_imports) {
          const imports = api.type_imports,
            names = Object.keys(pointer(source, imports.roots_pointer)).sort();
          if (
            !names.length ||
            names.some(
              (name) => !/^[A-Za-z][A-Za-z0-9_]*$/.test(name) || !Object.hasOwn(all, name),
            ) ||
            typeof imports.from !== 'string' ||
            !/^\.\/[A-Za-z0-9_/-]+\.js$/.test(imports.from)
          )
            fail('SOURCE_API_IMPORT', 'Invalid local API type imports');
          text =
            'import type { ' +
            names.join(', ') +
            " } from '" +
            imports.from +
            "';\n" +
            (imports.export_star ? "export type * from '" + imports.from + "';\n" : '') +
            text;
        }
        outputs.set(api.active_facade_target, Buffer.from(text));
      }
    }
    const descriptor = owner.members.find((relative) => relative.endsWith('/descriptor.json'));
    if (descriptor)
      outputs.set(
        descriptor,
        jsonBytes({ id: module.id, version: module.version, definition_digest: digest(module) }),
      );
    for (const mirror of owner.output_mirrors ?? []) {
      if (
        !owner.members.includes(mirror.from) ||
        !owner.members.includes(mirror.to) ||
        !outputs.has(mirror.from)
      )
        fail('OUTPUT_MIRROR', 'Mirror must copy a generated member of its owner');
      outputs.set(mirror.to, outputs.get(mirror.from));
    }
    const rows = [...outputs]
      .filter(([relative]) => !start.has(relative))
      .map(([relative, bytes]) => byteIdentity(relative, bytes));
    const manifest = owner.members.find((relative) =>
      relative.endsWith('/generation-manifest.json'),
    );
    if (manifest)
      outputs.set(
        manifest,
        jsonBytes({
          format: 'kdna.native-generation-manifest/1',
          candidate_only: true,
          source: sourceIdentity,
          producer,
          owner: owner.id,
          module_digest: digest(module),
          roots: names,
          reachable_types: Object.keys(all),
          artifacts: rows,
          scope:
            'Generated structure and provenance only; runtime admission and authorization require actual native implementations.',
        }),
      );
    ownerRows.push({
      owner: owner.id,
      roots: names.length,
      types: Object.keys(all).length,
      module_digest: digest(module),
    });
  }
  const sections = recipe.module_projections.find(
    (row) => row.pointer === '/representation_candidate',
  ).output;
  for (const relative of recipe.sections_mirrors) {
    const basename = path.basename(relative),
      original = path.dirname(sections) + '/' + basename;
    outputs.set(relative, outputs.get(original));
  }
  const dispatch = recipe.whole_dispatch,
    dispatchAjv = new Ajv(dispatch.options),
    roots = {},
    schemas = {};
  if (dispatch.roots.length !== 16 || new Set(dispatch.roots).size !== 16)
    fail('WHOLE_ROOTS', 'Native whole dispatch must have sixteen roots');
  const sectionTypes = JSON.parse(outputs.get(sections)).types;
  for (const name of dispatch.roots) {
    const id = 'urn:kdna:browser-native-whole:' + name,
      schema = {
        $schema: source.schema_dialect,
        $id: id,
        $ref: '#/$defs/' + name,
        $defs: closure(sectionTypes, [name]),
      };
    dispatchAjv.addSchema(schema);
    roots[name] = id;
    schemas[name] = schema;
  }
  outputs.set(
    dispatch.directory + '/native-whole-validators.cjs',
    Buffer.from(standalone(dispatchAjv, roots) + '\n'),
  );
  outputs.set(dispatch.directory + '/native-whole-schemas.json', jsonBytes(schemas));
  return { outputs, ownerRows, sourceIdentity };
}
