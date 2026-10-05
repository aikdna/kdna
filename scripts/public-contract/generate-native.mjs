#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOutputs, BASE_OUTPUT_PATHS } from './generate.mjs';
import {
  UniqueOutputMap,
  mergeOutputs,
  compareOutputs,
  writeOutputs,
} from './generation-writer.mjs';
import {
  loadRecipe,
  sha,
  jsonBytes,
  byteIdentity,
  project,
  nativeOutputPaths,
  buildNativeOutputs,
} from './native-renderer.mjs';

const self = fileURLToPath(import.meta.url),
  directory = path.dirname(self),
  manifestPath = 'specs/native-generation-manifest.json';
function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}
function argumentsFor(argv) {
  const options = { check: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--check') {
      if (options.check) fail('ARGUMENT', 'Duplicate --check');
      options.check = true;
      continue;
    }
    if (!['--source', '--root', '--out-dir', '--scratch-dir', '--dependency-root'].includes(flag))
      fail('ARGUMENT', 'Unknown generation argument');
    const key = flag.slice(2);
    if (options[key] || !argv[i + 1] || argv[i + 1].startsWith('--'))
      fail('ARGUMENT', 'Missing or duplicate ' + flag);
    options[key] = path.resolve(argv[++i]);
  }
  for (const key of ['source', 'root', 'out-dir', 'dependency-root'])
    if (!options[key]) fail('ARGUMENT', 'Required --' + key);
  if (!options.check && !options['scratch-dir'])
    fail('ARGUMENT', 'Generation requires --scratch-dir');
  return options;
}
function regular(file) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) fail('INPUT_PATH', 'Expected regular input');
  return fs.readFileSync(file);
}
export function buildAllOutputs(options) {
  const sourceBytes = regular(options.source),
    source = JSON.parse(sourceBytes),
    { recipe, identity: recipeIdentity } = loadRecipe();
  if (sha(sourceBytes) !== recipe.input_sha256)
    fail('SOURCE_IDENTITY', 'Source and generation recipe must be reconciled together');
  const names = recipe.base_type_order;
  if (
    names.length !== 431 ||
    new Set(names).size !== names.length ||
    names.some((name) => !Object.hasOwn(source.types, name))
  )
    fail('BASE_OWNERSHIP', 'Expected the declared base type ownership');
  // This is an in-memory ownership view. All semantic values come from one source;
  // neither a predecessor tree nor a second editable flat definition is an input.
  const baseSource = {
    ...source,
    types: Object.fromEntries(names.map((name) => [name, source.types[name]])),
  };
  const base = buildOutputs(baseSource, options, sourceBytes),
    outputs = new UniqueOutputMap(base.outputs);
  const producer = {
    recipe: recipeIdentity,
    scripts: [
      'generate-native.mjs',
      'native-renderer.mjs',
      'generation-writer.mjs',
      'generate.mjs',
    ].map((name) =>
      byteIdentity('scripts/public-contract/' + name, regular(path.join(directory, name))),
    ),
  };
  for (const row of recipe.base_json_projections) {
    if (!outputs.has(row.output)) fail('BASE_PROJECTION', 'Missing base projection output');
    if (row.operations.length) {
      const value = project(JSON.parse(outputs.get(row.output)), row.operations);
      outputs.delete(row.output);
      outputs.set(row.output, jsonBytes(value));
    }
  }
  // Refresh current integration identities after the explicit public projection.
  const baseManifest = JSON.parse(outputs.get('specs/public-generation-manifest.json'));
  for (const row of baseManifest.integration) {
    const bytes = outputs.get(row.path);
    if (!bytes) fail('BASE_MANIFEST', 'Missing integration member');
    row.bytes = bytes.length;
    row.sha256 = sha(bytes);
  }
  baseManifest.type_ownership = {
    recipe: recipeIdentity,
    base_types: names.length,
    canonical_types: Object.keys(source.types).length,
  };
  outputs.delete('specs/public-generation-manifest.json');
  outputs.set('specs/public-generation-manifest.json', jsonBytes(baseManifest));
  const native = buildNativeOutputs(
    source,
    sourceBytes,
    recipe,
    producer,
    options['dependency-root'],
  );
  mergeOutputs(outputs, native.outputs);
  const mirrorPaths = [];
  for (const mirror of recipe.base_mirrors ?? []) {
    if (
      Object.keys(mirror).sort().join(',') !== 'output,source' ||
      !BASE_OUTPUT_PATHS.includes(mirror.source) ||
      !outputs.has(mirror.source)
    )
      fail('BASE_MIRROR', 'Mirror must name an output from this base generation');
    outputs.set(mirror.output, outputs.get(mirror.source));
    mirrorPaths.push(mirror.output);
  }
  const nativePaths = nativeOutputPaths(recipe),
    allowed = new Set([...BASE_OUTPUT_PATHS, ...nativePaths, ...mirrorPaths, manifestPath]);
  if (allowed.size !== BASE_OUTPUT_PATHS.length + nativePaths.length + mirrorPaths.length + 1)
    fail('OUTPUT_OWNERSHIP', 'Base and native output ownership overlap');
  const artifacts = [...outputs]
    .map(([relative, bytes]) => byteIdentity(relative, bytes))
    .sort((a, b) => Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)));
  outputs.set(
    manifestPath,
    jsonBytes({
      format: 'kdna.native-generation-manifest/1',
      candidate_only: true,
      source: native.sourceIdentity,
      producer,
      base_types: names.length,
      canonical_types: Object.keys(source.types).length,
      owners: native.ownerRows,
      dispatch_roots: recipe.whole_dispatch.roots,
      artifacts,
      scope:
        'One source, explicit type ownership and public metadata projection. Generated structure and provenance do not establish runtime, consumer, protection or release acceptance.',
    }),
  );
  return { outputs, allowed, ownerRows: native.ownerRows, sourceIdentity: native.sourceIdentity };
}
export function generateNative(argv) {
  const options = argumentsFor(argv),
    result = buildAllOutputs(options),
    writer = { root: options['out-dir'], scratch: options['scratch-dir'], allowed: result.allowed };
  if (options.check) {
    const drift = compareOutputs(result.outputs, writer);
    if (drift.length) fail('GENERATED_DRIFT', JSON.stringify(drift));
    return {
      status: 'CHECK_MATCH',
      source: result.sourceIdentity,
      owners: result.ownerRows,
      writes: 0,
    };
  }
  const { writes } = writeOutputs(result.outputs, writer);
  return { status: 'GENERATED', source: result.sourceIdentity, owners: result.ownerRows, writes };
}
let entry = false;
if (process.argv[1])
  try {
    entry = fs.realpathSync(process.argv[1]) === fs.realpathSync(self);
  } catch {
    if (path.resolve(process.argv[1]) === path.resolve(self))
      fail('ENTRY_PATH', 'Unresolvable generation entry');
  }
if (entry)
  try {
    console.log(JSON.stringify(generateNative(process.argv.slice(2))));
  } catch (error) {
    console.error(error.code ?? 'GENERATION_FAILED', error.message);
    process.exitCode = 1;
  }
