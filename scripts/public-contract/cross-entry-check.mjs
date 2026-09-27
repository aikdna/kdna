#!/usr/bin/env node
// CLI over the single cross-entry implementation that ships inside Core.
//
// There is exactly one implementation of these rules:
//   packages/kdna-core/src/public-contract/cross-entry.js
// Core admission calls it directly; this file only adapts arguments, resolves a
// registry and prints a report. It deliberately contains no rule logic of its
// own, so the two surfaces can never drift.
//
// Contract with scripts/public-contract/generate.mjs:
//   * IMPLEMENTED_RULE_IDS is re-exported from Core and is closed. generate.mjs
//     rejects any source rule whose `enforcement` is IMPLEMENTED_CROSS_ENTRY_CHECK
//     but whose id is not listed there.
//   * The other enforcement value is a ledger statement, not this file's claim:
//     NOT_IMPLEMENTED_NON_SCHEMA means the generator performs no machine check
//     for that rule, and says nothing about whether runtime code enforces it. The
//     per-rule truth is DERIVED from engineering.rule_coverage in the machine
//     source (with engineering.runtime_enforcement_claims cross-checked against
//     the derivation) and emitted into specs/public-diagnostics.json. It may never
//     be used to claim the cross-entry check.
//   * PUBLIC-OMISSION-FOLD-LEGALITY is a Read-side static check with no Core
//     counterpart; it is exposed here only and never lets the source's
//     still-NOT_IMPLEMENTED_NON_SCHEMA PUBLIC-OMISSION-FOLD rule claim a
//     generator machine check.
//
//   node scripts/public-contract/cross-entry-check.mjs --case <file.json>
//        [--registry <file.json>] [--accept-document-registry]
//
// A case file is either a bare payload, or {payload, core_terms, asset_capability}.
// Nothing is written; only the repository and the given files are read.

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SELF);
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const CORE_PATH = path.join(REPO_ROOT, 'packages', 'kdna-core', 'src', 'public-contract', 'cross-entry.js');
const DEFAULT_REGISTRY_PATH = path.join(REPO_ROOT, 'packages', 'kdna-core', 'src', 'public-contract', 'generated-contract.json');
const require = createRequire(import.meta.url);
const coreCrossEntry = require(CORE_PATH);

export const IMPLEMENTED_RULE_IDS = Object.freeze([
  ...coreCrossEntry.IMPLEMENTED_RULE_IDS,
  // Static legality half of the source's NOT_IMPLEMENTED_NON_SCHEMA
  // PUBLIC-OMISSION-FOLD. Distinct from the source rule id, which the generator
  // does not machine check.
  'PUBLIC-OMISSION-FOLD-LEGALITY',
]);

const FOLD_LEGAL_REASONS = Object.freeze(['outside_selection', 'not_in_mode']);

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function readRegistryFile(file, sourceLabel) {
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  const terms = isPlainObject(parsed) && isPlainObject(parsed.core_terms) ? parsed.core_terms : parsed;
  if (!isPlainObject(terms)) throw Object.assign(new Error(`registry carries no core_terms object: ${file}`), {code: 'CROSS_ENTRY_REGISTRY'});
  return {registry: terms, registry_source: sourceLabel, registry_path: file};
}

// Precedence: explicit option, then explicit --registry file, then the generated
// contract. A registry embedded in the document under test is untrusted input and
// is ignored unless the caller opts in.
export function resolveRegistry(documentTerms, options = {}) {
  if (isPlainObject(options.core_terms)) return {registry: options.core_terms, registry_source: 'options', registry_path: null};
  if (typeof options.registryPath === 'string' && options.registryPath.length > 0) return readRegistryFile(path.resolve(options.registryPath), 'registry_argument');
  if (isPlainObject(documentTerms) && options.acceptDocumentRegistry === true) return {registry: documentTerms, registry_source: 'document', registry_path: null};
  if (fs.existsSync(DEFAULT_REGISTRY_PATH)) {
    let parsed = null;
    try {
      parsed = JSON.parse(fs.readFileSync(DEFAULT_REGISTRY_PATH, 'utf8'));
    } catch {
      parsed = null;
    }
    if (isPlainObject(parsed) && isPlainObject(parsed.core_terms)) return {registry: parsed.core_terms, registry_source: 'default_generated_contract', registry_path: DEFAULT_REGISTRY_PATH};
  }
  return {
    registry: {},
    registry_source: 'absent',
    registry_path: null,
    registry_note: isPlainObject(documentTerms)
      ? 'a document-embedded core_terms registry was present but is not trusted by default; pass acceptDocumentRegistry to use it'
      : 'no core_terms registry was available; every governed term must declare vocabulary:"author"',
  };
}

export function isFoldedOmissionRecord(v) {
  if (!isPlainObject(v)) return false;
  if (v.state === 'explicitly_omitted_batch') return true;
  return Number.isInteger(v.count) && typeof v.target_kind === 'string' && typeof v.reason === 'string' && !Object.hasOwn(v, 'target');
}

function walk(node, pointer, visit) {
  visit(node, pointer);
  if (Array.isArray(node)) node.forEach((child, i) => walk(child, `${pointer}/${i}`, visit));
  else if (isPlainObject(node)) for (const [key, child] of Object.entries(node)) walk(child, `${pointer}/${key}`, visit);
}

function ruleOmissionFoldLegality(document) {
  const out = [];
  walk(document, '', (node, pointer) => {
    if (!isFoldedOmissionRecord(node)) return;
    const at = (suffix) => (pointer === '' ? `/${suffix}` : `${pointer}/${suffix}`);
    const reason = node.reason;
    if (typeof reason !== 'string' || !FOLD_LEGAL_REASONS.includes(reason)) {
      out.push({path: at('reason'), message: `folded omission record reason must be one of ${FOLD_LEGAL_REASONS.join('|')}; found ${JSON.stringify(reason)}. A per-entry reason such as "not_requested" is not a legal fold reason.`});
    }
    if (!Number.isInteger(node.count) || node.count < 2 || node.count > Number.MAX_SAFE_INTEGER) {
      out.push({path: at('count'), message: `folded omission record count must be a safe integer >= 2; found ${node.count === undefined ? 'absent' : typeof node.count}`});
    }
    if (node.expandable === true && (typeof node.handle_id !== 'string' || node.handle_id.length === 0)) {
      out.push({path: at('handle_id'), message: 'folded omission record with expandable:true must carry a non-empty handle_id'});
    }
    if (node.expandable === false && node.handle_id !== null && node.handle_id !== undefined) {
      out.push({path: at('handle_id'), message: 'folded omission record with expandable:false must carry handle_id null'});
    }
  });
  return out;
}

function splitDocument(doc) {
  if (isPlainObject(doc) && isPlainObject(doc.payload)) return {payload: doc.payload, declaredCapability: doc.asset_capability, documentTerms: doc.core_terms};
  return {payload: doc, declaredCapability: undefined, documentTerms: isPlainObject(doc) ? doc.core_terms : undefined};
}

export function checkDocument(doc, options = {}) {
  const {payload, declaredCapability, documentTerms} = splitDocument(doc);
  const {registry, registry_source, registry_path, registry_note} = resolveRegistry(documentTerms, options);
  const rules = coreCrossEntry.checkPayload(payload, registry);
  const foldViolations = ruleOmissionFoldLegality(doc).map((v) => ({rule_id: 'PUBLIC-OMISSION-FOLD-LEGALITY', path: v.path, message: v.message}));
  const report = rules.map((r) => ({
    rule_id: r.rule_id,
    ok: r.violations.length === 0,
    violations: r.violations.map((v) => ({rule_id: r.rule_id, path: v.path, message: v.message})),
  }));
  report.push({rule_id: 'PUBLIC-OMISSION-FOLD-LEGALITY', ok: foldViolations.length === 0, violations: foldViolations});
  if (declaredCapability !== undefined && payload?.asset_capability !== declaredCapability) {
    const entry = report.find((r) => r.rule_id === 'PUBLIC-ASSET-CAPABILITY');
    entry.ok = false;
    entry.violations.push({rule_id: entry.rule_id, path: '/asset_capability', message: 'document-declared asset_capability differs from payload.asset_capability'});
  }
  return {ok: report.every((r) => r.ok), rules: report, registry_source, registry_path, ...(registry_note ? {registry_note} : {})};
}

export function checkAsset(payload, options = {}) {
  return checkDocument(payload, options);
}

function parse(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--accept-document-registry') { out.acceptDocumentRegistry = true; continue; }
    if (!['--case', '--registry'].includes(a)) throw Object.assign(new Error('unknown argument ' + a), {code: 'ARGUMENT'});
    if (!argv[i + 1]) throw Object.assign(new Error('missing value for ' + a), {code: 'ARGUMENT'});
    out[a === '--case' ? 'case' : 'registryPath'] = argv[++i];
  }
  if (!out.case) throw Object.assign(new Error('required --case <file.json>'), {code: 'ARGUMENT'});
  return out;
}

function entryGuardOutcome() {
  if (!process.argv[1]) return 'import';
  let invoked = null;
  let self = null;
  try { invoked = fs.realpathSync(process.argv[1]); } catch { invoked = null; }
  try { self = fs.realpathSync(SELF); } catch { self = null; }
  if (invoked && self && invoked === self) return 'entry';
  if (path.resolve(process.argv[1]) === path.resolve(SELF)) return 'unresolved-entry';
  return 'import';
}

const entryGuard = entryGuardOutcome();
if (entryGuard === 'unresolved-entry') {
  console.error('KDNA_CROSS_ENTRY_ENTRY_GUARD_FAILED: refusing to run under an unresolved entry path');
  process.exit(2);
}
if (entryGuard === 'entry') {
  try {
    const options = parse(process.argv.slice(2));
    const doc = JSON.parse(fs.readFileSync(path.resolve(options.case), 'utf8'));
    const report = checkDocument(doc, {registryPath: options.registryPath, acceptDocumentRegistry: options.acceptDocumentRegistry});
    const violations = report.rules.flatMap((r) => r.violations);
    const payload = {
      status: report.ok ? 'OK' : 'VIOLATIONS',
      case: path.resolve(options.case),
      registry_source: report.registry_source,
      registry_path: report.registry_path,
      implemented_rule_ids: IMPLEMENTED_RULE_IDS,
      ok: report.ok,
      // Flat list for consumers that only want "which rules fired"; the
      // per-rule grouping below carries the same violations.
      violations,
      rules: report.rules,
    };
    if (report.registry_note) payload.registry_note = report.registry_note;
    console.log(JSON.stringify(payload, null, 2));
    if (!report.ok) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({status: 'ERROR', code: error.code ?? 'CROSS_ENTRY_ERROR', message: error.message}));
    process.exitCode = 2;
  }
}
