#!/usr/bin/env node
// Restricted additive-window classifier for the single public semantic source.
//
// Decision A1 (see private/kdna-rebuild-plan-20260919/02-决策记录-20260919.md)
// introduces a restricted additive window: a same-coordinate change may only
// *add* optional structure in a way that cannot change the interpretation of any
// existing field or invalidate any already-published asset. Everything else
// requires a new coordinate.
//
// This file classifies structural changes; it cannot prove natural-language
// semantics or runtime compatibility. Additive shape alone requires semantic
// review. Evidence pins require their own review, not a fictitious wire change.
// Only identical source trees establish compatibility here without more proof.
//
// Usage:
//   node window-check.mjs --old <a.json> --new <b.json>
//   node window-check.mjs --cases <window-cases.json>
//
// Exit code 0 = IN_WINDOW (or every case matched its expectation), 1 = any
// non-passing pair verdict (or a case mismatch), 2 = usage/IO error.

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SELF = fileURLToPath(import.meta.url);

const IN_WINDOW = 'IN_WINDOW';
const REQUIRES_NEW_COORDINATE = 'REQUIRES_NEW_COORDINATE';
const NEEDS_SEMANTIC_REVIEW = 'NEEDS_SEMANTIC_REVIEW';
const EVIDENCE_UPDATE_REVIEW_REQUIRED = 'EVIDENCE_UPDATE_REVIEW_REQUIRED';
const INDETERMINATE = 'INDETERMINATE';
const OBSERVATIONAL_ENGINEERING = new Set([
  'rule_coverage', 'runtime_enforcement_claims', 'runtime_not_implemented',
]);

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isScalar(v) {
  return v === null || typeof v !== 'object';
}

function stableStringify(v) {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  if (isPlainObject(v)) {
    return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

function depthOf(v) {
  if (Array.isArray(v)) return 1 + Math.max(0, ...v.map(depthOf));
  if (isPlainObject(v)) return 1 + Math.max(0, ...Object.values(v).map(depthOf));
  return 0;
}

// --------------------------------------------------------------- leaf diff ---

/**
 * Produce the list of leaf-level differences between two JSON trees.
 * A node that exists on only one side is reported once, at its own pointer, and
 * is not expanded further (a whole new `$defs` type is one `added` entry).
 */
export function diffLeaves(oldV, newV, pointer = '', out = []) {
  const oldHas = oldV !== undefined;
  const newHas = newV !== undefined;
  if (!oldHas && newHas) {
    out.push({pointer, kind: 'added'});
    return out;
  }
  if (oldHas && !newHas) {
    out.push({pointer, kind: 'removed'});
    return out;
  }
  if (Array.isArray(oldV) && Array.isArray(newV)) {
    if (oldV.every(isScalar) && newV.every(isScalar)) {
      if (stableStringify(oldV) !== stableStringify(newV)) out.push({pointer, kind: 'changed'});
      return out;
    }
    const n = Math.max(oldV.length, newV.length);
    for (let i = 0; i < n; i++) diffLeaves(oldV[i], newV[i], `${pointer}/${i}`, out);
    return out;
  }
  if (isPlainObject(oldV) && isPlainObject(newV)) {
    const keys = new Set([...Object.keys(oldV), ...Object.keys(newV)]);
    for (const k of [...keys].sort()) {
      const escaped = k.replaceAll('~', '~0').replaceAll('/', '~1');
      diffLeaves(oldV[k], newV[k], `${pointer}/${escaped}`, out);
    }
    return out;
  }
  if (stableStringify(oldV) !== stableStringify(newV)) out.push({pointer, kind: 'changed'});
  return out;
}

// ------------------------------------------------------------ reachability ---

function collectRefs(node, out) {
  if (Array.isArray(node)) {
    for (const v of node) collectRefs(v, out);
    return out;
  }
  if (isPlainObject(node)) {
    if (typeof node.$ref === 'string' && node.$ref.startsWith('#/$defs/')) out.add(node.$ref.slice(8));
    for (const v of Object.values(node)) collectRefs(v, out);
  }
  return out;
}

/**
 * Types reachable in the NEW source from something that already existed:
 * a type that existed in the old source, or a root/export named outside /types
 * (artifacts, transport_admission, component_semantics, ...).
 *
 * Three kinds of source-declared seed are honoured, because the source itself
 * names them without using a `$ref`:
 *   * `$ref` occurrences anywhere outside /types (must be `#/$defs/<Name>`);
 *   * `artifacts[].root`, `artifacts[].exports[]`, `transport_admission.root`,
 *     `transport_admission.exports[]` (bare `$defs` names);
 *   * the keys of `static_policy.definition.types`, which the source declares as
 *     the participant set of the static-policy carrier definition.
 */
export function reachableTypes(oldSource, newSource) {
  const oldNames = new Set(Object.keys(oldSource?.types ?? {}));
  const newTypes = newSource?.types ?? {};
  const newNames = new Set(Object.keys(newTypes));
  const seeds = new Set([...oldNames].filter(n => newNames.has(n)));
  for (const [k, v] of Object.entries(newSource ?? {})) {
    if (k === 'types') continue;
    for (const ref of collectRefs(v, new Set())) seeds.add(ref);
  }
  const addBare = (name) => {
    if (typeof name === 'string' && name.length > 0) seeds.add(name);
  };
  for (const artifact of Array.isArray(newSource?.artifacts) ? newSource.artifacts : []) {
    addBare(artifact?.root);
    for (const name of Array.isArray(artifact?.exports) ? artifact.exports : []) addBare(name);
  }
  const transport = newSource?.transport_admission;
  if (isPlainObject(transport)) {
    addBare(transport.root);
    for (const name of Array.isArray(transport.exports) ? transport.exports : []) addBare(name);
  }
  const declaredPolicyTypes = newSource?.static_policy?.definition?.types;
  if (isPlainObject(declaredPolicyTypes)) for (const name of Object.keys(declaredPolicyTypes)) addBare(name);
  const visited = new Set();
  const queue = [...seeds].filter(n => newNames.has(n));
  while (queue.length > 0) {
    const name = queue.pop();
    if (visited.has(name)) continue;
    visited.add(name);
    for (const ref of collectRefs(newTypes[name], new Set())) {
      if (newNames.has(ref) && !visited.has(ref)) queue.push(ref);
    }
  }
  return visited;
}

// ------------------------------------------------------------ classifying ---

function requiresNew(reason) {
  return {classification: REQUIRES_NEW_COORDINATE, structural_classification: 'NON_ADDITIVE',
    reason, review_required: false, review_scope: 'A new coordinate is required; review cannot waive this structural result.'};
}

function semanticReview(structure, reason) {
  return {classification: NEEDS_SEMANTIC_REVIEW, structural_classification: structure,
    reason, review_required: true,
    review_scope: 'Independently establish absence remains unprovided and all existing asset meanings and validity are unchanged; include actual affected implementation behavior.'};
}

function evidenceReview(reason) {
  return {classification: EVIDENCE_UPDATE_REVIEW_REQUIRED, structural_classification: 'EVIDENCE_UPDATE',
    reason, review_required: true,
    review_scope: 'Inspect old and new referenced bytes or observed facts and their authority. A hash, assertion, comment or review boolean does not establish unchanged semantics or actual test execution.'};
}

function isPinChange(segs, ctx) {
  if (segs[0] !== 'accepted_designs' || segs.length !== 3 || !/^(0|[1-9]\d*)$/.test(segs[1])) return false;
  if (!['bytes', 'sha256'].includes(segs[2])) return false;
  const oldRow = ctx.oldSource.accepted_designs?.[Number(segs[1])];
  const newRow = ctx.newSource.accepted_designs?.[Number(segs[1])];
  return isPlainObject(oldRow) && isPlainObject(newRow) &&
    typeof oldRow.path === 'string' && oldRow.path === newRow.path;
}

export function classifyChange(change, ctx) {
  const {pointer, kind} = change;
  const segs = decodePointer(pointer);
  const key = segs.length > 0 ? segs[segs.length - 1] : '';

  if (isPinChange(segs, ctx) && kind !== 'removed') {
    return evidenceReview(`accepted-design ${key} pin changed at ${pointer}; the referenced content must be reviewed separately`);
  }

  if (kind === 'removed') {
    return requiresNew(`removed ${pointer}; removing or renaming an existing key or value is never additive`);
  }

  if (kind === 'changed') {
    if (segs[0] === 'versionTuple') return requiresNew('any versionTuple change requires a new coordinate');
    if (segs.includes('additionalProperties')) return requiresNew('additionalProperties changed; open/closed object policy is not additive');
    if (segs.includes('enum')) return requiresNew('an existing enum value set changed');
    if (segs.includes('required')) return requiresNew('an existing required list changed');
    return requiresNew(`existing definition changed: ${pointer}`);
  }

  // kind === 'added'
  if (segs[0] === 'versionTuple') return requiresNew('any versionTuple change requires a new coordinate');

  if (segs[0] === 'types' && segs.length === 2) {
    // A whole new $defs type. It is in the window only if it is reachable from
    // something that already existed; an orphan type is dead weight that a
    // reader could not bind to any root.
    if (ctx.reachable.has(key)) {
      return semanticReview('ADDITIVE_CANDIDATE', `new type ${key} is reachable; reachability does not prove existing meanings or validity are unchanged`);
    }
    return requiresNew(`new type ${key} is not reachable from any existing root or type`);
  }

  if (segs[0] === 'types' && segs[2] === 'properties' && segs.length === 4) {
    const typeName = segs[1];
    const required = ctx.newSource?.types?.[typeName]?.required;
    const isRequired = Array.isArray(required) && required.includes(key);
    if (isRequired) return requiresNew(`added property ${key} to ${typeName} is listed in required`);
    return semanticReview('ADDITIVE_CANDIDATE', `added optional property ${key} to existing type ${typeName}; absence from required proves only a structural property, not semantic compatibility`);
  }

  if (segs[0] === 'non_schema_rules') {
    return semanticReview('ADDITIVE_CANDIDATE', 'added non-schema rule content can invalidate every old asset despite leaving existing rows untouched');
  }

  if (segs[0] === 'accepted_designs') {
    return evidenceReview('added accepted-design input; its content and semantic effect have not been verified');
  }

  if (segs[0] === 'engineering') {
    if (OBSERVATIONAL_ENGINEERING.has(segs[1])) {
      return evidenceReview(`added observational engineering claims at ${pointer}; declarations are not observed runtime evidence`);
    }
    return semanticReview('UNCLASSIFIED_ADDITION', `added engineering data at ${pointer}; this domain also contains runtime limits, generated bindings and typed semantics, so it is not automatically inert`);
  }

  if (segs[0] === 'types' && ['title', 'description', '$comment'].includes(key)) {
    return semanticReview('ANNOTATION_ADDITION', `added annotation-like content at ${pointer}; its normative meaning and source validity require review`);
  }

  return requiresNew(`added ${pointer}; additions outside the restricted window require a new coordinate`);
}

export function classifySources(oldSource, newSource) {
  const sourceProblems = [];
  for (const [side, source] of [['old', oldSource], ['new', newSource]]) {
    if (!isPlainObject(source) || source.format !== 'kdna.public-semantic-source/1' ||
        !isPlainObject(source.versionTuple) || Object.keys(source.versionTuple).length === 0 ||
        Object.values(source.versionTuple).some(value => typeof value !== 'string' || value.length === 0) ||
        !isPlainObject(source.types) || Object.keys(source.types).length === 0 ||
        Object.values(source.types).some(value => !isPlainObject(value) || Object.keys(value).length === 0)) {
      sourceProblems.push(`${side} input must identify the public semantic-source format, a nonempty string-valued tuple, and nonempty schema types`);
    }
  }
  if (sourceProblems.length > 0) {
    return {verdict: INDETERMINATE, changes: [], source_problems: sourceProblems,
      review_required: true, compatibility: 'NOT_PROVEN',
      proof_scope: 'Input preconditions failed; this is not a source-validity or compatibility acceptance.'};
  }
  const changes = diffLeaves(oldSource, newSource);
  const ctx = {oldSource, newSource, reachable: reachableTypes(oldSource, newSource)};
  const classified = changes.map(change => {
    return {pointer: change.pointer === '' ? '/' : change.pointer, kind: change.kind, ...classifyChange(change, ctx)};
  });
  const verdict = [REQUIRES_NEW_COORDINATE, NEEDS_SEMANTIC_REVIEW, EVIDENCE_UPDATE_REVIEW_REQUIRED]
    .find(candidate => classified.some(change => change.classification === candidate)) ?? IN_WINDOW;
  return {verdict, changes: classified, source_problems: [],
    review_required: classified.some(change => change.review_required),
    compatibility: verdict === IN_WINDOW ? 'IDENTICAL_SOURCE' : 'NOT_PROVEN',
    proof_scope: verdict === IN_WINDOW
      ? 'Parsed source trees are identical; source correctness, runtime behavior, publication and acceptance are not established.'
      : 'Structural classification only. Review-required results are non-passing; this command accepts no asserted compatibility receipts or review booleans.'};
}

// -------------------------------------------------------------- json patch ---

function decodePointer(pathString) {
  if (pathString === '') return [];
  if (typeof pathString !== 'string' || !pathString.startsWith('/') || /~(?:[^01]|$)/.test(pathString)) {
    throw Object.assign(new Error(`invalid JSON pointer ${pathString}`), {code: 'CASE_PATCH'});
  }
  return pathString.slice(1).split('/').map(s => s.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function clone(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

/** Minimal RFC6902 subset: add / replace / remove, with `-` append support. */
export function applyPatch(base, ops) {
  let doc = clone(base);
  for (const op of ops) {
    const segs = decodePointer(op.path);
    if (segs.length === 0) {
      if (op.op !== 'replace') throw Object.assign(new Error('only replace is supported at document root'), {code: 'CASE_PATCH'});
      doc = clone(op.value);
      continue;
    }
    let node = doc;
    for (let i = 0; i < segs.length - 1; i++) {
      if (node === null || typeof node !== 'object' || !Object.hasOwn(node, segs[i])) {
        throw Object.assign(new Error(`patch path does not resolve: ${op.path}`), {code: 'CASE_PATCH'});
      }
      node = node[segs[i]];
    }
    const last = segs[segs.length - 1];
    if (Array.isArray(node)) {
      const append = op.op === 'add' && last === '-';
      const index = Number(last);
      if (!append && (!/^(0|[1-9]\d*)$/.test(last) || !Number.isSafeInteger(index) ||
          index > node.length || (op.op !== 'add' && index === node.length))) {
        throw Object.assign(new Error(`array patch index out of bounds: ${op.path}`), {code: 'CASE_PATCH'});
      }
      if (op.op === 'add') {
        if (append) node.push(clone(op.value));
        else node.splice(index, 0, clone(op.value));
      } else if (op.op === 'remove') {
        node.splice(index, 1);
      } else if (op.op === 'replace') {
        node[index] = clone(op.value);
      } else {
        throw Object.assign(new Error(`unsupported patch op ${op.op}`), {code: 'CASE_PATCH'});
      }
      continue;
    }
    if (!isPlainObject(node)) {
      throw Object.assign(new Error(`patch path is not a container: ${op.path}`), {code: 'CASE_PATCH'});
    }
    if (op.op === 'add' || op.op === 'replace') {
      if (op.op === 'replace' && !Object.hasOwn(node, last)) {
        throw Object.assign(new Error(`replace target missing: ${op.path}`), {code: 'CASE_PATCH'});
      }
      Object.defineProperty(node, last, {value: clone(op.value), enumerable: true, configurable: true, writable: true});
    } else if (op.op === 'remove') {
      if (!Object.hasOwn(node, last)) {
        throw Object.assign(new Error(`remove target missing: ${op.path}`), {code: 'CASE_PATCH'});
      }
      delete node[last];
    } else {
      throw Object.assign(new Error(`unsupported patch op ${op.op}`), {code: 'CASE_PATCH'});
    }
  }
  return doc;
}

function runCases(casesFile) {
  const raw = fs.readFileSync(casesFile, 'utf8');
  const parsed = JSON.parse(raw);
  const cases = Array.isArray(parsed) ? parsed : parsed.cases;
  if (!Array.isArray(cases) || cases.length === 0) {
    throw Object.assign(new Error('cases file must contain a non-empty cases array'), {code: 'CASE_PATCH'});
  }
  const results = cases.map(c => {
    const next = c.next !== undefined ? c.next : applyPatch(c.base, c.patch ?? []);
    const assessment = classifySources(c.base, next);
    const {verdict, changes} = assessment;
    const blocking = changes.filter(x => x.classification !== IN_WINDOW);
    return {
      id: c.id,
      expected: c.expected,
      observed: verdict,
      ok: verdict === c.expected,
      why: c.why ?? null,
      change_count: changes.length,
      compatibility: assessment.compatibility,
      review_required: assessment.review_required,
      source_problems: assessment.source_problems,
      blocking,
      changes,
    };
  });
  const failed = results.filter(r => !r.ok);
  process.stdout.write(`${JSON.stringify({
    status: failed.length === 0 ? 'CASES_MATCH' : 'CASE_MISMATCH',
    proof_scope: 'Case expectations matched; this status is not a compatibility verdict for a source revision.',
    cases_file: casesFile,
    total: results.length,
    matched: results.length - failed.length,
    results,
  }, null, 2)}\n`);
  return failed.length === 0 ? 0 : 1;
}

function runPair(oldFile, newFile) {
  const oldSource = JSON.parse(fs.readFileSync(oldFile, 'utf8'));
  const newSource = JSON.parse(fs.readFileSync(newFile, 'utf8'));
  const assessment = classifySources(oldSource, newSource);
  const {verdict, changes} = assessment;
  const counts = changes.reduce((acc, c) => {
    const bucket = `${c.kind}:${c.classification}`;
    acc[bucket] = (acc[bucket] ?? 0) + 1;
    return acc;
  }, {});
  process.stdout.write(`${JSON.stringify({
    status: verdict,
    old: oldFile,
    new: newFile,
    ...assessment,
    max_depth: Math.max(depthOf(oldSource), depthOf(newSource)),
    change_count: changes.length,
    counts,
  }, null, 2)}\n`);
  return verdict === IN_WINDOW ? 0 : 1;
}

// ---------------------------------------------------------------------- cli ---

function parseArgs(argv) {
  const o = {old: null, new: null, cases: null};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!['--old', '--new', '--cases'].includes(a)) {
      throw Object.assign(new Error(`unknown argument ${a}`), {code: 'ARGUMENT'});
    }
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) {
      throw Object.assign(new Error(`missing value for ${a}`), {code: 'ARGUMENT'});
    }
    if (o[a.slice(2)] !== null) throw Object.assign(new Error(`duplicate argument ${a}`), {code: 'ARGUMENT'});
    o[a.slice(2)] = path.resolve(argv[++i]);
  }
  if (o.cases && (o.old || o.new)) throw Object.assign(new Error('use either --cases or --old/--new'), {code: 'ARGUMENT'});
  if (!o.cases && !(o.old && o.new)) throw Object.assign(new Error('required --old <a.json> --new <b.json>, or --cases <file.json>'), {code: 'ARGUMENT'});
  return o;
}

function entryGuardOutcome() {
  if (!process.argv[1]) return 'import';
  let invoked = null;
  let self = null;
  try {
    invoked = fs.realpathSync(process.argv[1]);
  } catch {
    invoked = null;
  }
  try {
    self = fs.realpathSync(SELF);
  } catch {
    self = null;
  }
  if (invoked && self && invoked === self) return 'entry';
  if (path.resolve(process.argv[1]) === path.resolve(SELF)) return 'unresolved-entry';
  return 'import';
}

function main(argv) {
  const o = parseArgs(argv);
  if (o.cases) return runCases(o.cases);
  return runPair(o.old, o.new);
}

const entryGuard = entryGuardOutcome();
if (entryGuard === 'unresolved-entry') {
  console.error('KDNA_PUBLIC_CONTRACT_WINDOW_CHECK_ENTRY_GUARD_FAILED: refusing to run under an unresolved entry path');
  process.exit(2);
}
if (entryGuard === 'entry') {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(JSON.stringify({status: 'ERROR', code: e.code ?? 'WINDOW_ERROR', message: e.message}));
    process.exitCode = 2;
  }
}
