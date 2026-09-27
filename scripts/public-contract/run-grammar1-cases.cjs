#!/usr/bin/env node
'use strict';
// Runs the grammar.1 Core admission case set against the real Core runtime.
//
//   KDNA_RUNTIME_ROOT=<shadow root with node_modules> \
//   node scripts/public-contract/run-grammar1-cases.cjs [--cases <file>] [--json]
//     [--allow-unpinned-runtime]
//
// Each case builds one asset from the shared conformance fixture, applies its
// declarative edits and asserts the admission outcome. Nothing is written; the
// runner only reads the repository and the case file.
//
// Before any case runs, the declared `engineering.toolchain_pin` is enforced:
// the current Node interpreter must satisfy the pinned runtime requirement and
// the Ajv resolved on this runtime must equal the pinned validator version. The
// pin is data in the machine source; this script is the execution path that
// makes it binding. A pin that cannot be evaluated is refused, never guessed.
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FIXTURES = path.join(REPO_ROOT, 'conformance', 'public-contract', 'test', 'bytes-fixtures.cjs');
const DEFAULT_CASES = path.join(REPO_ROOT, 'conformance', 'public-contract', 'grammar-1-core-cases.json');

function parseArgs(argv) {
  const out = {cases: DEFAULT_CASES, json: false, allowUnpinnedRuntime: false};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') { out.json = true; continue; }
    if (argv[i] === '--cases') { out.cases = path.resolve(argv[++i]); continue; }
    if (argv[i] === '--allow-unpinned-runtime') { out.allowUnpinnedRuntime = true; continue; }
    throw new Error('unknown argument ' + argv[i]);
  }
  return out;
}

// --- toolchain pin ---------------------------------------------------------
// `engineering.toolchain_pin` is declarative data in specs/public-semantic-source.json.
// It is not generated into src/public-contract/generated-contract.json, so the
// generated contract is consulted first and the machine source is the fallback.
const PIN_POINTER = ['engineering', 'toolchain_pin'];

function locatePin(root, label) {
  if (!root) return null;
  let document;
  try {
    document = JSON.parse(fs.readFileSync(root, 'utf8'));
  } catch {
    return null;
  }
  let node = document;
  for (const key of PIN_POINTER) {
    if (!node || typeof node !== 'object' || !Object.hasOwn(node, key)) return null;
    node = node[key];
  }
  return node && typeof node === 'object' ? {pin: node, source: label} : null;
}

function readToolchainPin(coreDir) {
  const candidates = [
    [path.join(coreDir, 'src', 'public-contract', 'generated-contract.json'), 'generated-contract.json'],
    [path.join(REPO_ROOT, 'specs', 'public-semantic-source.json'), 'specs/public-semantic-source.json'],
  ];
  for (const [file, label] of candidates) {
    const found = locatePin(file, `${label}#/${PIN_POINTER.join('/')}`);
    if (found) return found;
  }
  return {pin: null, source: `neither ${candidates.map(([file]) => file).join(' nor ')}`};
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(String(value ?? ''));
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function compareVersion(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return 0;
}

// Accepts the comparator form the pin records ("\>=20", "\>=20 <21"). Any other
// range syntax is refused: a pin that cannot be evaluated is not a pin.
function satisfiesRange(range, version) {
  const parts = String(range ?? '').split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return {ok: false, reason: 'the pinned runtime range is empty'};
  for (const part of parts) {
    const match = /^(>=|<=|>|<|=)?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(part);
    if (!match) return {ok: false, reason: `unsupported comparator ${JSON.stringify(part)}`};
    const bound = [Number(match[2]), Number(match[3] ?? 0), Number(match[4] ?? 0)];
    const order = compareVersion(version, bound);
    const operator = match[1] ?? '=';
    const pass =
      operator === '>=' ? order >= 0
        : operator === '>' ? order > 0
          : operator === '<=' ? order <= 0
            : operator === '<' ? order < 0
              : order === 0;
    if (!pass) return {ok: false, reason: `current interpreter does not satisfy ${JSON.stringify(part)}`};
  }
  return {ok: true};
}

function pinRefusal(axis, detail) {
  return Object.assign(new Error(detail.join('\n')), {pinRefusal: true, axis});
}

function declarePinnedRuntime(axis, required, observed, source) {
  return pinRefusal(axis, [
    `TOOLCHAIN_PIN_REFUSED axis=${axis} required=${JSON.stringify(required)} observed=${JSON.stringify(observed)} source=${source}`,
    `  the pinned requirement is recorded by the machine source and this run cannot satisfy it`,
    `  hint: --allow-unpinned-runtime runs anyway and marks the result as NOT toolchain-pinned evidence`,
  ]);
}

function enforceToolchainPin(args, req, coreDir) {
  const {pin, source} = readToolchainPin(coreDir);
  if (!pin) {
    throw pinRefusal('toolchain_pin', [
      `TOOLCHAIN_PIN_REFUSED axis=toolchain_pin required=present observed=absent source=${source}`,
      '  the declared toolchain pin could not be read, so this run cannot be pinned evidence',
      '  hint: --allow-unpinned-runtime runs anyway and marks the result as NOT toolchain-pinned evidence',
    ]);
  }
  const declared = pin.runtime_requirement?.declared
    ?? pin.runtime_requirement?.range
    ?? readEngineRequirement(coreDir);
  const nodeRequirement = satisfiesRange(declared, parseVersion(process.versions.node) ?? [0, 0, 0]);
  const ajvPin = pin.ajv?.pin ?? null;
  if (ajvPin === null) {
    throw pinRefusal('build.ajv', [
      `TOOLCHAIN_PIN_REFUSED axis=build.ajv required=present observed=absent source=${source}`,
      '  the pinned validator version could not be read, so this run cannot be pinned evidence',
    ]);
  }
  let observedAjv = null;
  let ajvPath = null;
  try {
    ajvPath = req.resolve('ajv/package.json');
    observedAjv = JSON.parse(fs.readFileSync(ajvPath, 'utf8')).version ?? null;
  } catch (error) {
    throw pinRefusal('build.ajv', [
      `TOOLCHAIN_PIN_REFUSED axis=build.ajv required=${JSON.stringify(ajvPin)} observed=unresolvable source=${source}`,
      `  ajv/package.json could not be resolved from this runtime: ${error?.code ?? error?.message ?? error}`,
      '  the validator pin is not waivable: install the pinned validator on the runtime, or run in the pinned runtime',
    ]);
  }
  const waived = [];
  if (!nodeRequirement.ok) {
    if (!args.allowUnpinnedRuntime) throw declarePinnedRuntime('runtime.node', declared, process.versions.node, source);
    waived.push(`runtime.node (${nodeRequirement.reason})`);
  }
  if (observedAjv !== ajvPin) {
    // The validator pin is a build-closure identity, not a runtime preference:
    // --allow-unpinned-runtime exists for the interpreter axis and never widens
    // into "any validator is fine".
    throw pinRefusal('build.ajv', [
      `TOOLCHAIN_PIN_REFUSED axis=build.ajv required=${JSON.stringify(ajvPin)} observed=${JSON.stringify(observedAjv)} resolved=${ajvPath} source=${source}`,
      '  a different validator resolves over a different schema semantics; the validator pin is not waivable',
      '  hint: run with NODE_PATH pointing at the pinned ajv 8.20.0 install',
    ]);
  }
  const summary = `TOOLCHAIN_PIN_OK runtime.node=${process.versions.node} required=${JSON.stringify(declared)} ajv=${observedAjv} ajv_path=${ajvPath} pin_source=${source}`;
  console.error(summary + (waived.length ? ` WAIVED=${waived.join(';')}` : ''));
}

function readEngineRequirement(coreDir) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(coreDir, 'package.json'), 'utf8'));
    return manifest?.engines?.node ?? null;
  } catch {
    return null;
  }
}

function resolvePointer(root, pointer) {
  const parts = pointer.split('/').slice(1).map((p) => p.replaceAll('~1', '/').replaceAll('~0', '~'));
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]];
  return {parent: node, key: parts[parts.length - 1]};
}

function applyEdits(asset, edits) {
  for (const edit of edits ?? []) {
    const {parent, key} = resolvePointer(asset, edit.pointer);
    if (edit.remove === true) {
      if (Array.isArray(parent)) parent.splice(Number(key), 1);
      else delete parent[key];
      continue;
    }
    parent[key] = JSON.parse(JSON.stringify(edit.value));
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const runtimeRoot = process.env.KDNA_RUNTIME_ROOT;
  const F = require(FIXTURES);
  const {req, coreDir} = runtimeRoot ? F.runtime(runtimeRoot) : F.runtime(REPO_ROOT);
  try {
    enforceToolchainPin(args, req, coreDir);
  } catch (error) {
    if (error?.pinRefusal !== true) throw error;
    console.error(error.message);
    process.exitCode = 2;
    return;
  }
  const core = req('@aikdna/kdna-core');
  const tuple = require(path.join(coreDir, 'src/public-contract/generated-contract.json')).versionTuple;
  const cases = JSON.parse(fs.readFileSync(args.cases, 'utf8'));

  const results = [];
  for (const spec of cases) {
    const asset = F.blank(tuple, spec.count ?? 1, {
      dropForm: spec.dropForm === true,
      form: spec.form,
      dropCapability: spec.dropCapability === true,
      capability: spec.capability,
    });
    if (Array.isArray(spec.forms)) spec.forms.forEach((form, i) => { asset.payload.judgments[i].form = form; });
    applyEdits(asset, spec.edits);
    let bytes = null;
    let result = null;
    try {
      bytes = F.encode(asset, req);
      result = core.admitBytes(bytes);
    } catch (error) {
      result = {status: 'threw', reason: error?.reason ?? error?.code ?? 'ENCODE_ERROR', message: String(error?.message ?? error)};
    }
    const observed = result.status === 'accepted' ? 'accepted' : 'rejected';
    const ok = observed === spec.expect
      && (spec.expect !== 'rejected' || spec.reason === undefined || result.reason === spec.reason)
      && (spec.expect !== 'rejected' || spec.rule === undefined || String(result.diagnostics?.[0]?.field ?? '').length > 0);
    results.push({
      id: spec.id,
      expect: spec.expect,
      observed,
      reason: result.reason ?? null,
      field: result.diagnostics?.[0]?.field ?? null,
      bytes: bytes ? bytes.length : null,
      ok,
      note: spec.note ?? null,
    });
  }

  const payload = {
    status: results.every((r) => r.ok) ? 'ALL_CASES_MATCH' : 'CASE_MISMATCH',
    tuple: {core: tuple.core, ir: tuple.ir, read: tuple.read},
    total: results.length,
    accepted: results.filter((r) => r.observed === 'accepted').length,
    rejected: results.filter((r) => r.observed === 'rejected').length,
    results,
  };
  if (args.json) console.log(JSON.stringify(payload, null, 2));
  else {
    for (const r of results) {
      console.log(`${r.ok ? 'MATCH  ' : 'MISMATCH'}  ${r.id}  expect=${r.expect} observed=${r.observed}${r.reason ? ' reason=' + r.reason : ''}${r.field ? ' field=' + r.field : ''}${r.bytes ? ' bytes=' + r.bytes : ''}`);
    }
    console.log(`${payload.status} {"total":${payload.total},"accepted":${payload.accepted},"rejected":${payload.rejected}}`);
  }
  process.exitCode = results.every((r) => r.ok) ? 0 : 1;
}

main();
