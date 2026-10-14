#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  digest,
  pointer,
  project,
  sha,
  jsonBytes,
  validateRecipeProtectionStructure,
} from './native-renderer.mjs';

export const FROZEN_INPUT = Object.freeze({
  commit: '04012bcddb593debacf555d11bfc9fa78f6b9759',
  source: 'specs/public-semantic-source.json',
  source_sha256: 'f60589a8bd3146ca0250ba1043e2463093b064780d5f5d9cf8dd6950f658050f',
  recipe: 'scripts/public-contract/native-output-recipe.json',
  recipe_sha256: 'd9d5df7fddf8eb7e142c111f2e45dbc114d706a6277cd5acf2ee6296384606f3',
});
export const FROZEN_DOCUMENTS = Object.freeze([
  Object.freeze({
    path: 'specs/public-contract-decisions.json',
    accepted_design_index: 2,
    source_pointer: '/accepted_designs/2',
    bytes: 50851,
    sha256: '378375ba0a316e4fe2e17191e2992082ff8770ab8373c39b4037795190c98844',
  }),
  Object.freeze({
    path: 'specs/public-version-policy.md',
    accepted_design_index: 4,
    source_pointer: '/accepted_designs/4',
    bytes: 13074,
    sha256: '52d89826151d3b9308214552aaa835b013952a5cef39e021899458da279624c8',
  }),
  Object.freeze({
    path: 'specs/read-contract.md',
    accepted_design_index: 5,
    source_pointer: '/accepted_designs/5',
    bytes: 11722,
    sha256: '0dadef023d8c482bacd618aeef2a69dec9d628834ba34ca998565f2ce1d4f09c',
  }),
  Object.freeze({
    path: 'specs/protection-admission.md',
    source_pointer: '/protection_admission/specification',
    bytes: 38233,
    sha256: '496a8f4ff3e96fe9c7ae0071becfc5657415d2bc26d58c47358f4bc8873e7162',
  }),
]);
const DOCUMENT_WORDING = Object.freeze({
  from: 'This browser package candidate is unpublished.',
  to: 'This stable distribution candidate requires exact artifact review and registry acquisition before publication is established.',
});
const VERSION_POLICY_WORDING = Object.freeze({
  from: 'The browser candidate above is unpublished and requires its own artifact and installed-consumer acceptance.',
  to: 'The exact candidate pair requires its own artifact review and installed-consumer acceptance; publication is established only by matching release and registry evidence.',
});
const OBSERVATION_DATE = Object.freeze({ before: '2026-10-14', after: '2026-10-14' });
const OLD_COORDINATES = Object.freeze({ core: '0.37.5', read: '0.13.0' });
function formatRecipe(recipe) {
  const require = createRequire(import.meta.url);
  const manifestPath = require.resolve('prettier/package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  equal(manifest.version, '3.9.4', 'RECIPE_FORMATTER', 'Locked recipe formatter version differs');
  equal(manifest.bin, './bin/prettier.cjs', 'RECIPE_FORMATTER', 'Recipe formatter entry differs');
  const formatted = execFileSync(
    process.execPath,
    [
      path.resolve(path.dirname(manifestPath), manifest.bin),
      '--parser',
      'json',
      '--print-width',
      '100',
      '--tab-width',
      '2',
      '--end-of-line',
      'lf',
      '--no-config',
      '--no-editorconfig',
    ],
    { input: jsonBytes(recipe), maxBuffer: 32 * 1024 * 1024 },
  );
  equal(
    digest(JSON.parse(formatted)),
    digest(recipe),
    'RECIPE_FORMATTER',
    'Recipe formatting changed semantic values',
  );
  return formatted;
}
function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}
function equal(actual, expected, code, message) {
  if (actual !== expected) fail(code, message);
}
export function readFrozenInputs(root) {
  const read = (relative) =>
    execFileSync('git', ['-C', root, 'show', FROZEN_INPUT.commit + ':' + relative], {
      maxBuffer: 32 * 1024 * 1024,
    });
  return {
    sourceBytes: read(FROZEN_INPUT.source),
    recipeBytes: read(FROZEN_INPUT.recipe),
    documentBytes: Object.fromEntries(FROZEN_DOCUMENTS.map((row) => [row.path, read(row.path)])),
  };
}
function coordinateTable(core, read) {
  const versions = { core, read };
  return Object.entries(OLD_COORDINATES).map(([role, from]) => {
    const to = versions[role];
    if (typeof to !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(to))
      fail('COORDINATE', 'A stable numeric semantic version is required for ' + role);
    if (to.split('.').some((part) => !Number.isSafeInteger(Number(part))))
      fail('COORDINATE', 'Unsafe version component');
    return { role, from, to };
  });
}
function substitute(text, table) {
  for (const { from, to } of table) text = text.replaceAll(from, to);
  return text;
}
function transform(value, table, bindings, location = '') {
  const binding = bindings?.get(location);
  if (binding) {
    equal(
      value,
      binding.before,
      'DOCUMENT_METADATA_PREIMAGE',
      'Document metadata preimage differs at ' + location,
    );
    return binding.after;
  }
  if (typeof value === 'string') return substitute(value, table);
  if (Array.isArray(value))
    return value.map((item, index) => transform(item, table, bindings, location + '/' + index));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        transform(item, table, bindings, location + '/' + escapePointer(key)),
      ]),
    );
  return value;
}
const escapePointer = (key) => key.replaceAll('~', '~0').replaceAll('/', '~1');
function scalarChanges(before, after, location = '', result = []) {
  if (before && typeof before === 'object') {
    for (const key of Object.keys(before))
      scalarChanges(before[key], after[key], location + '/' + escapePointer(key), result);
  } else if (before !== after) result.push({ pointer: location, before, after });
  return result;
}
function lineDiff(before, after, relative) {
  const oldLines = before.split('\n'),
    newLines = after.split('\n');
  equal(oldLines.length, newLines.length, 'DOCUMENT_TRANSFORM', 'Document line layout changed');
  const rows = [`--- a/${relative}`, `+++ b/${relative}`];
  for (let index = 0; index < oldLines.length; index++) {
    if (oldLines[index] === newLines[index]) continue;
    rows.push(`@@ -${index + 1} +${index + 1} @@`, '-' + oldLines[index], '+' + newLines[index]);
  }
  return rows.join('\n') + '\n';
}
function deriveDecisionDocument(oldText, table) {
  const original = JSON.parse(oldText);
  equal(
    jsonBytes(original).toString('utf8'),
    oldText,
    'DOCUMENT_TRANSFORM',
    'Frozen decisions encoding differs',
  );
  const bindings = [];
  for (const [index, coordinate] of table.entries()) {
    const prefix = '/version_policy/planned_packages/' + index;
    equal(
      pointer(original, prefix + '/name'),
      '@aikdna/kdna-' + coordinate.role,
      'DOCUMENT_TRANSFORM',
      'Frozen decisions package ownership differs',
    );
    // A coordinate this transition does not move keeps its recorded source
    // observation; only a moved package gets a new version and observation date.
    if (coordinate.from === coordinate.to) continue;
    for (const field of ['candidate_version', 'current_source_version'])
      bindings.push({
        kind: 'version_coordinate',
        pointer: prefix + '/' + field,
        before: coordinate.from,
        after: coordinate.to,
      });
    // A same-day re-observation keeps the recorded date: the row is only
    // rewritten when the observation date genuinely moves.
    if (OBSERVATION_DATE.before !== OBSERVATION_DATE.after)
      bindings.push({
        kind: 'source_observation_date',
        pointer: prefix + '/current_source_version_observed',
        before: OBSERVATION_DATE.before,
        after: OBSERVATION_DATE.after,
      });
  }
  const result = transform(original, [], new Map(bindings.map((row) => [row.pointer, row])));
  equal(
    digest(scalarChanges(original, result).sort((a, b) => a.pointer.localeCompare(b.pointer))),
    digest(
      bindings
        .map(({ pointer, before, after }) => ({ pointer, before, after }))
        .sort((a, b) => a.pointer.localeCompare(b.pointer)),
    ),
    'DOCUMENT_TRANSFORM',
    'Only the six declared decisions leaves may change',
  );
  return { text: jsonBytes(result).toString('utf8'), transformations: bindings };
}
function deriveDocuments(oldSource, documentBytes, table) {
  const documents = [],
    bindings = [];
  if (
    !documentBytes ||
    Object.keys(documentBytes).sort().join('\n') !==
      FROZEN_DOCUMENTS.map((row) => row.path)
        .sort()
        .join('\n')
  )
    fail('FROZEN_DOCUMENT_IDENTITY', 'Exactly the declared frozen document inputs are required');
  for (const frozen of FROZEN_DOCUMENTS) {
    const oldBytes = documentBytes[frozen.path];
    if (
      !Buffer.isBuffer(oldBytes) ||
      oldBytes.length !== frozen.bytes ||
      sha(oldBytes) !== frozen.sha256
    )
      fail('FROZEN_DOCUMENT_IDENTITY', 'Frozen document differs: ' + frozen.path);
    const oldRow = pointer(oldSource, frozen.source_pointer);
    equal(
      digest(oldRow),
      digest({ path: frozen.path, bytes: frozen.bytes, sha256: frozen.sha256 }),
      'FROZEN_DOCUMENT_BINDING',
      'Frozen document/source binding differs',
    );
    const oldText = oldBytes.toString('utf8');
    let text, transformations;
    if (frozen.path === 'specs/public-contract-decisions.json') {
      ({ text, transformations } = deriveDecisionDocument(oldText, table));
    } else {
      text = substitute(oldText, table);
      const wordings = [DOCUMENT_WORDING];
      if (frozen.path === 'specs/public-version-policy.md') wordings.push(VERSION_POLICY_WORDING);
      const applied = [];
      for (const wording of wordings) {
        const occurrences = text.split(wording.from).length - 1;
        // A baseline that already carries the reviewed wording has nothing to
        // rewrite; the sentence must then be present exactly once as the target.
        if (occurrences === 0) {
          equal(
            text.split(wording.to).length - 1,
            1,
            'DOCUMENT_TRANSFORM',
            'Expected exactly one reviewed publication-status sentence',
          );
          continue;
        }
        equal(
          occurrences,
          1,
          'DOCUMENT_TRANSFORM',
          'Expected exactly one reviewed publication-status sentence',
        );
        text = text.replace(wording.from, wording.to);
        applied.push({ ...wording, occurrences: 1 });
      }
      transformations = [
        ...table.map((row) => ({
          kind: 'version_coordinate',
          ...row,
          occurrences: oldText.split(row.from).length - 1,
        })),
        ...applied.map((wording) => ({ kind: 'wording', ...wording })),
      ];
    }
    const bytes = Buffer.from(text);
    const nextRow = { path: frozen.path, bytes: bytes.length, sha256: sha(bytes) };
    for (const field of ['bytes', 'sha256'])
      bindings.push({
        kind: 'generated_metadata',
        pointer: frozen.source_pointer + '/' + field,
        before: oldRow[field],
        after: nextRow[field],
        provenance: { commit: FROZEN_INPUT.commit, file: frozen.path, sha256: frozen.sha256 },
      });
    documents.push({
      path: frozen.path,
      bytes,
      report: {
        path: frozen.path,
        source_pointer: frozen.source_pointer,
        before: { bytes: oldBytes.length, sha256: sha(oldBytes) },
        after: { bytes: bytes.length, sha256: sha(bytes) },
        transformations,
        protocol_semantics_changed: false,
        text_diff: lineDiff(oldText, text, frozen.path),
      },
    });
  }
  return { documents, bindings };
}
// These projections select unchanged source values from the base generator's
// construction. They do not read maintained/generated files as preimage input.
function baseProjectionInput(source, output) {
  if (output === 'packages/kdna-core/src/public-contract/generated-contract.json')
    return { value: { r2_semantics: source.r2_semantics }, sourcePrefix: '' };
  if (output === 'packages/kdna-core/src/public-contract/protected-source-contract.generated.json')
    return { value: source.protected_source, sourcePrefix: '/protected_source' };
  if (output === 'packages/kdna-core/src/public-contract/protection-contract.generated.json')
    return { value: source.protection_admission, sourcePrefix: '/protection_admission' };
  if (output === 'packages/kdna-core/schema/public-vocabulary.json')
    return { value: {}, sourcePrefix: null };
  fail('BASE_PROJECTION_SOURCE', 'No reviewed frozen source binding for ' + output);
}
function deriveOperations(
  oldValue,
  oldOperations,
  sourcePrefix,
  recipePointer,
  table,
  bindings,
  rows,
) {
  let oldState = structuredClone(oldValue);
  const operations = [];
  for (const [index, original] of oldOperations.entries()) {
    const location = `${recipePointer}/${index}`;
    const operation = transform(original, table);
    if (!['replace', 'delete', 'add'].includes(original.action))
      fail('PROJECTION_ACTION', 'Unknown frozen operation');
    if (original.action !== 'add') {
      const oldPreimage = pointer(oldState, original.pointer);
      const oldDigest = digest(oldPreimage);
      equal(
        oldDigest,
        original.expected_before_sha256,
        'PROJECTION_GUARD',
        'Frozen operation preimage differs at ' + location,
      );
      const derivedPreimage = transform(
        oldPreimage,
        table,
        bindings,
        sourcePrefix + original.pointer,
      );
      operation.expected_before_sha256 = digest(derivedPreimage);
      rows.push({
        kind: 'operation_preimage',
        pointer: location + '/expected_before_sha256',
        before: oldDigest,
        after: operation.expected_before_sha256,
        provenance: {
          commit: FROZEN_INPUT.commit,
          file: FROZEN_INPUT.source,
          source_pointer: sourcePrefix + original.pointer,
          preceding_operations: index,
          old_value: oldPreimage,
          derivation:
            'coordinate and verified document-identity substitution of verified frozen preimage',
        },
      });
    } else {
      if (original.expected_absent !== true)
        fail('PROJECTION_GUARD', 'Frozen add operation must guard absence');
      rows.push({
        kind: 'operation_absence',
        pointer: location + '/expected_absent',
        before: true,
        after: true,
        provenance: {
          commit: FROZEN_INPUT.commit,
          file: FROZEN_INPUT.source,
          source_pointer: sourcePrefix + original.pointer,
          preceding_operations: index,
        },
      });
    }
    oldState = project(oldState, [original]);
    operations.push(operation);
  }
  // The new operation checks use values derived from verified OLD preimages.
  // Applying them to transformed source is a separate validation, never a repair.
  const projected = project(transform(oldValue, table, bindings, sourcePrefix), operations);
  equal(
    digest(projected),
    digest(transform(oldState, table, bindings, sourcePrefix)),
    'COORDINATE_PROJECTION',
    'Coordinate substitution and projection do not commute',
  );
  return { operations, oldProjected: oldState, projected };
}
export function deriveCoordinates({ sourceBytes, recipeBytes, documentBytes, core, read }) {
  equal(
    sha(sourceBytes),
    FROZEN_INPUT.source_sha256,
    'FROZEN_SOURCE_IDENTITY',
    'Frozen source differs',
  );
  equal(
    sha(recipeBytes),
    FROZEN_INPUT.recipe_sha256,
    'FROZEN_RECIPE_IDENTITY',
    'Frozen recipe differs',
  );
  const oldSource = JSON.parse(sourceBytes),
    oldRecipe = JSON.parse(recipeBytes);
  validateRecipeProtectionStructure(oldRecipe);
  equal(
    oldRecipe.input_sha256,
    sha(sourceBytes),
    'SOURCE_IDENTITY',
    'Frozen source/recipe mismatch',
  );
  const table = coordinateTable(core, read),
    rows = [];
  const sourceText = sourceBytes.toString('utf8');
  const coordinateBytes = Buffer.from(substitute(sourceText, table));
  const coordinateSource = JSON.parse(coordinateBytes),
    recipe = transform(oldRecipe, table);
  equal(
    digest(coordinateSource),
    digest(transform(oldSource, table)),
    'COORDINATE_SOURCE',
    'Non-scalar source change',
  );
  // Formatting is part of the frozen input: the specified metadata identities can be
  // replaced without introducing unrelated serialization changes.
  equal(
    sha(jsonBytes(oldSource)),
    sha(sourceBytes),
    'FROZEN_SOURCE_ENCODING',
    'Frozen source encoding differs',
  );
  const documentResult = deriveDocuments(oldSource, documentBytes, table);
  const bindings = new Map(documentResult.bindings.map((row) => [row.pointer, row]));
  const source = transform(oldSource, table, bindings);
  const sourceResult = jsonBytes(source);
  recipe.input_sha256 = sha(sourceResult);
  rows.push({
    kind: 'source_identity',
    pointer: '/input_sha256',
    before: oldRecipe.input_sha256,
    after: recipe.input_sha256,
  });
  for (const [index, original] of oldRecipe.registered_preimages.entries()) {
    const oldValue = pointer(oldSource, original.pointer);
    equal(
      digest(oldValue),
      original.digest,
      'REGISTERED_PREIMAGE',
      'Frozen definition preimage differs',
    );
    const after = digest(transform(oldValue, table, bindings, original.pointer));
    recipe.registered_preimages[index].digest = after;
    rows.push({
      kind: 'registered_preimage',
      pointer: `/registered_preimages/${index}/digest`,
      source_pointer: original.pointer,
      before: original.digest,
      after,
    });
  }
  for (const [index, original] of oldRecipe.module_projections.entries()) {
    const value = pointer(oldSource, original.pointer),
      location = `/module_projections/${index}`;
    equal(
      digest(value),
      original.input_digest,
      'MODULE_PREIMAGE',
      'Frozen module preimage differs',
    );
    const derived = deriveOperations(
      value,
      original.operations,
      original.pointer,
      location + '/operations',
      table,
      bindings,
      rows,
    );
    equal(
      digest(derived.oldProjected),
      original.output_digest,
      'MODULE_PROJECTION',
      'Frozen module projection differs',
    );
    const next = recipe.module_projections[index];
    next.operations = derived.operations;
    next.input_digest = digest(transform(value, table, bindings, original.pointer));
    next.output_digest = digest(derived.projected);
    for (const field of ['input_digest', 'output_digest'])
      rows.push({
        kind: 'module_' + field,
        pointer: location + '/' + field,
        source_pointer: original.pointer,
        before: original[field],
        after: next[field],
      });
  }
  for (const [index, original] of oldRecipe.base_json_projections.entries()) {
    const input = baseProjectionInput(oldSource, original.output);
    recipe.base_json_projections[index].operations = deriveOperations(
      input.value,
      original.operations,
      input.sourcePrefix,
      `/base_json_projections/${index}/operations`,
      table,
      bindings,
      rows,
    ).operations;
  }
  validateRecipeProtectionStructure(recipe);
  const recipeResult = formatRecipe(recipe);
  return {
    sourceBytes: sourceResult,
    recipeBytes: recipeResult,
    documents: documentResult.documents.map(({ path, bytes }) => ({ path, bytes })),
    report: {
      format: 'kdna.coordinate-derivation/1',
      frozen: FROZEN_INPUT,
      coordinates: table.map((row) => ({
        ...row,
        occurrences: sourceText.split(row.from).length - 1,
      })),
      source_changes: scalarChanges(oldSource, source).map((row) => ({
        ...row,
        classification: bindings.has(row.pointer) ? 'generated_metadata' : 'version_coordinate',
      })),
      documents: documentResult.documents.map((row) => row.report),
      document_bindings: documentResult.bindings,
      counts: {
        registered: oldRecipe.registered_preimages.length,
        modules: oldRecipe.module_projections.length,
        module_operations: oldRecipe.module_projections.reduce(
          (sum, row) => sum + row.operations.length,
          0,
        ),
        base_operations: oldRecipe.base_json_projections.reduce(
          (sum, row) => sum + row.operations.length,
          0,
        ),
      },
      result: { source_sha256: sha(sourceResult), recipe_sha256: sha(recipeResult) },
      guards: rows,
    },
  };
}
export function humanReport(report) {
  return (
    '# Coordinate derivation\n\nFrozen commit: `' +
    report.frozen.commit +
    '`.\n\n' +
    '| Guard | Before | After |\n|---|---|---|\n' +
    report.guards.map((row) => `| ${row.pointer} | ${row.before} | ${row.after} |`).join('\n') +
    '\n\n## Accepted document identities\n\n' +
    report.document_bindings
      .map((row) => `- ${row.pointer}: ${row.before} → ${row.after}`)
      .join('\n') +
    '\n\nOnly the declared coordinate text, publication-status wording, exact source-observation dates and derived document identities change; protocol, decision, acceptance and publication semantics do not change.\n\n' +
    report.documents.map((row) => '```diff\n' + row.text_diff + '```\n').join('\n')
  );
}
export function runDerivation(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (
      !['--root', '--out-dir', '--core-version', '--read-version'].includes(key) ||
      Object.hasOwn(options, key) ||
      !argv[i + 1] ||
      argv[i + 1].startsWith('--')
    )
      fail('ARGUMENT', 'Unknown, duplicate or incomplete argument');
    options[key] = argv[++i];
  }
  if (Object.keys(options).length !== 4) fail('ARGUMENT', 'All four arguments are required');
  const root = fs.realpathSync(options['--root']);
  const requested = path.resolve(options['--out-dir']);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  if (output === root || output.startsWith(root + path.sep) || root.startsWith(output + path.sep))
    fail('OUTPUT_PATH', 'Derivation requires a new scratch directory outside the repository');
  if (fs.existsSync(output)) fail('OUTPUT_PATH', 'Scratch directory must not already exist');
  const result = deriveCoordinates({
    ...readFrozenInputs(root),
    core: options['--core-version'],
    read: options['--read-version'],
  });
  fs.mkdirSync(output);
  for (const [name, bytes] of [
    ['public-semantic-source.json', result.sourceBytes],
    ['native-output-recipe.json', result.recipeBytes],
    ['report.json', jsonBytes(result.report)],
    ['report.md', humanReport(result.report)],
  ])
    fs.writeFileSync(path.join(output, name), bytes, { flag: 'wx' });
  for (const document of result.documents) {
    const file = path.join(output, document.path);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, document.bytes, { flag: 'wx' });
  }
  return { status: 'DERIVED', output, ...result.report.result, counts: result.report.counts };
}
let isEntry = false;
if (process.argv[1]) {
  try {
    isEntry = fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
      fail('ENTRY_PATH', 'Unresolvable coordinate derivation entry');
  }
}
if (isEntry) {
  try {
    console.log(JSON.stringify(runDerivation(process.argv.slice(2))));
  } catch (error) {
    console.error(
      JSON.stringify({
        status: 'ERROR',
        code: error.code ?? 'DERIVATION_ERROR',
        message: error.message,
      }),
    );
    process.exitCode = 1;
  }
}
