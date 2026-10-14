'use strict';
// Candidate explicit 0.5->0.6 source migration route. It reads exactly the
// current 0.5 generation, writes an adhered 0.6 container with a confirmed
// representation_origin, and proves refusal-only paths for everything outside
// that scope. No admission path elsewhere converts, dual-reads or falls back.
const crypto = require('node:crypto');
const Ajv = require('ajv/dist/2020.js');
const S = require('./source-route-common.js');
const C = require('./section-common.js');
const D = require('./digests.js');
const strict = require('./strict-input.js');
const { rejected } = require('./admit.js');
const { validate: validateClassic } = require('./validate.js');
const { parseContainer } = require('./container.js');
const { decodeValidatedPayload, assertContentBindings } = require('./semantic-admission.js');
const { openSourceRouteCapture } = require('./source-route-capture.js');
const { admitPublicBytes } = require('./source-public-admission.js');
const { buildIR } = require('./canonical-ir.js');
const { buildFrames } = require('./source-route-frame-writer.js');
const M = require('./section-metadata-codec.js');
const { encodeStored } = require('./container-writer.js');
const { isDeepStrictEqual } = require('node:util');
const { inflateRawSync } = require('node:zlib');

const M6 = require('./migration06/contract.json');
const tuple = C.contract.module.versionTuple;
const routeContract = C.strict.freeze({
  id: 'kdna.source-migration/0.1.0-candidate',
  version: '0.1.0-candidate',
  definition_digest: D.digestCanonical(M6.module),
});
const SIGNATURE_POLICY = Object.freeze({ requireSignature: false, expectedPublicKeyHex: null });
const SOURCE_GENERATION = Object.freeze({
  format_version: '0.5.0',
  profile: 'kdna.payload.judgment',
  profile_version: '0.5.1',
});
const HISTORICAL_CONTAINER_VERSIONS = new Set(['0.1.0', '0.2.0', '0.3.0', '0.4.0']);
const BASE_MEMBERS = Object.freeze(['mimetype', 'kdna.json', 'payload.kdnab']);

const requests = new WeakMap(), authorities = new WeakMap(), migrationFailures = new WeakSet();
const frozen = v => C.strict.freeze(v);
const none = () => ({ kind: 'none', external_commit: { state: 'not_invoked' } });
const isDigest = v => typeof v === 'string' && /^sha256:[0-9a-f]{64}$/u.test(v);
const ajv = new Ajv({ strict: false, allErrors: false, validateFormats: false });
const typed = new Map();
function compiled(name) {
  if (!typed.has(name)) typed.set(name, ajv.compile({ $schema: 'https://json-schema.org/draft/2020-12/schema', $defs: M6.types, $ref: '#/$defs/' + name }));
  return typed.get(name);
}
function validateTyped(name, value) {
  if (!compiled(name)(value)) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'output');
  return value;
}
function failure(code, stage) {
  const out = { status: 'source_failed', diagnostic: { code, stage }, disclosure: none(), body: null, body_bytes: 0 };
  validateTyped('SourceMigrationFailure06', out);
  return frozen(out);
}
function coreFailure(code, stage, error = null) {
  const out = { status: 'core_rejected', stage, core: rejected(code, error?.component_failure ?? null, error?.diagnostic ?? null), disclosure: none(), body: null, body_bytes: 0 };
  validateTyped('SourceRouteCoreRejected06', out);
  return frozen(out);
}
function fail(code, stage) { const e = new Error(code); e.migrationCode = code; e.migrationStage = stage; migrationFailures.add(e); throw e; }

function admitSourceMigrationRequest(candidate) {
  try {
    const data = C.strict.copyJson(candidate);
    S.keys(data, ['request_id', 'tuple', 'operation', 'source_expected_A', 'timeout_ms', 'signature_policy']);
    C.need(C.strict.identifier(data.request_id), 'READ_INPUT_INVALID');
    const t = data.tuple;
    C.need(t && typeof t === 'object' && !Array.isArray(t) && Object.keys(t).every(k => Object.hasOwn(tuple, k) && typeof t[k] === 'string'), 'READ_INPUT_INVALID');
    if (Object.keys(t).length !== Object.keys(tuple).length || Object.entries(tuple).some(([k, v]) => t[k] !== v)) {
      const baseline = require('./generated-contract.json');
      const historical = [baseline.versionTuple, ...baseline.types.UnsupportedVersionTuple.anyOf.map(x => Object.fromEntries(Object.entries(x.properties).map(([k, v]) => [k, v.const])))];
      const known = historical.some(v => Object.keys(v).length === Object.keys(t).length && Object.entries(v).every(([k, x]) => t[k] === x));
      return coreFailure(known ? 'READ_UNSUPPORTED_VERSION' : Object.keys(tuple).some(k => k !== 'payload_profile' && t[k] === tuple[k]) ? 'READ_MIXED_VERSION_TUPLE' : 'READ_UNSUPPORTED_VERSION', 'input');
    }
    C.need(data.operation === 'migrate_public_source', 'READ_INPUT_INVALID');
    C.need(isDigest(data.source_expected_A), 'READ_INPUT_INVALID');
    C.need(Number.isSafeInteger(data.timeout_ms) && data.timeout_ms >= 1 && data.timeout_ms <= 60000, 'READ_INPUT_INVALID');
    const policy = data.signature_policy;
    C.need(policy && typeof policy === 'object' && !Array.isArray(policy) && policy.requireSignature === false && policy.expectedPublicKeyHex === null, 'READ_INPUT_INVALID');
    C.need(compiled('SourceMigrationRequest06')(data), 'READ_INPUT_INVALID');
    const token = Object.freeze({});
    requests.set(token, { data: frozen(data), digest: D.digestCanonical(data) });
    return Object.freeze({ status: 'admitted_request', request: token });
  } catch (e) {
    if (e.migrationCode === 'SOURCE_CAPABILITY_UNAVAILABLE') return failure(e.migrationCode, e.migrationStage);
    if (C.isFailure(e) || S.isFailure(e) || e.reason === 'READ_INPUT_INVALID') return failure('SOURCE_INPUT_INVALID', 'input');
    return failure('SOURCE_CAPABILITY_UNAVAILABLE', 'input');
  }
}
function inspectSourceMigrationRequest(token) { return requests.get(token)?.data ?? null; }
function createNativeSourceMigrationAuthority(callback) {
  if (typeof callback !== 'function') throw new TypeError('Native migration authority callback required');
  const token = Object.freeze({});
  authorities.set(token, callback);
  return token;
}

function classifySource(manifest, entries) {
  const version = manifest.format_version;
  const compatibility = manifest.compatibility ?? {};
  if (version === SOURCE_GENERATION.format_version) {
    if (compatibility.profile !== SOURCE_GENERATION.profile || compatibility.profile_version !== SOURCE_GENERATION.profile_version) fail('MIGRATION_SOURCE_UNSUPPORTED_VERSION', 'input');
  } else if (HISTORICAL_CONTAINER_VERSIONS.has(version)) {
    fail('MIGRATION_SOURCE_UNSUPPORTED_VERSION', 'input');
  } else {
    fail('SOURCE_INPUT_INVALID', 'input');
  }
  if (manifest.payload?.encrypted === true || manifest.encryption || Object.hasOwn(manifest, 'entitlement')) fail('MIGRATION_SOURCE_PROTECTED_UNSUPPORTED', 'input');
  if (Object.hasOwn(entries, 'checksums.json') || Object.hasOwn(entries, 'signature.kdsig')) fail('MIGRATION_SOURCE_EXTENSION_UNSUPPORTED', 'input');
  const allowed = new Set(BASE_MEMBERS);
  for (const resource of manifest.payload?.resources ?? []) if (typeof resource?.entry === 'string') allowed.add(resource.entry);
  for (const name of Object.keys(entries)) if (!allowed.has(name) && !name.startsWith('attachments/')) fail('MIGRATION_SOURCE_EXTENSION_UNSUPPORTED', 'input');
}

function buildOutput(manifest5, payload5, entries5, sourceA, sourceC, requestDigest, captureId) {
  const manifest = { ...manifest5, format_version: '0.6.0' };
  const ir = { ...buildIR(manifest, payload5, entries5), tuple: structuredClone(tuple) };
  const built = buildFrames(ir);
  const packNames = Object.keys(built.packs);
  manifest.payload = { layout: 'sections', encoding: 'strict-cbor-frames', encrypted: false, tables: built.tables, xref_codec: 'frame-local-ordered-scope-dictionary/1' };
  const origin = {
    source_format_version: '0.5.0',
    source_container_digest: sourceA,
    source_content_digest: sourceC,
    payload: strict.freeze(structuredClone(manifest5.payload)),
    runtime: structuredClone(manifest5.runtime),
  };
  if (isDigest(manifest5.content_digest)) origin.declared_content_digest = manifest5.content_digest;
  if (isDigest(manifest5.authoring?.content_digest)) origin.declared_authoring_content_digest = manifest5.authoring.content_digest;
  manifest.representation_origin = origin;
  const mapped = [];
  for (const name of manifest5.runtime?.mandatory_entries ?? []) {
    if (name === 'payload.kdnab') { for (const pack of packNames) if (!mapped.includes(pack)) mapped.push(pack); }
    else if (!mapped.includes(name)) mapped.push(name);
  }
  manifest.runtime = { ...manifest5.runtime, mandatory_entries: mapped };
  const { nodes, expansion_targets, ...meta } = ir;
  meta.node_order = nodes.map(n => n.id);
  meta.ir_digest_claim = D.digestCanonical(ir);
  meta.runtime_entry_names = [...new Set(['kdna.json', ...packNames, ...mapped])].sort(C.utf8);
  manifest.representation_metadata = M.encode(meta);
  const entries = { mimetype: Buffer.from('application/vnd.kdna.asset'), ...built.packs };
  if (isDigest(manifest5.content_digest)) {
    const pre = { ...entries, 'kdna.json': Buffer.from(JSON.stringify(manifest)) };
    const refreshed = D.digest(D.contentTreePreimage(pre));
    manifest.content_digest = refreshed;
    if (isDigest(manifest5.authoring?.content_digest)) manifest.authoring = { ...manifest5.authoring, content_digest: refreshed };
  }
  entries['kdna.json'] = Buffer.from(JSON.stringify(manifest));
  const members = Object.entries(entries).map(([name, bytes]) => ({ name, type: 'file', mode: 0o100644, bytes }));
  C.need(members.length <= 128, 'READ_CORE_INVALID');
  const bytes = encodeStored(members);
  const output = admitPublicBytes(bytes, SIGNATURE_POLICY, captureId, requestDigest);
  if (!isDeepStrictEqual(output.payload, payload5)) fail('MIGRATION_PAYLOAD_MISMATCH', 'semantic');
  const retained = ['asset_id', 'asset_uid', 'asset_type', 'title', 'version', 'judgment_version', 'created_at', 'updated_at', 'summary', 'languages', 'history'];
  for (const key of retained) if (!isDeepStrictEqual(manifest[key], manifest5[key])) fail('MIGRATION_MANIFEST_MISMATCH', 'semantic');
  if (!origin.source_container_digest || !origin.source_content_digest) fail('MIGRATION_ORIGIN_MISSING', 'semantic');
  const actions = [];
  const sourceNames = new Set(Object.keys(entries5));
  const outputNames = new Set(Object.keys(output.entries));
  for (const name of outputNames) actions.push({ name, action: sourceNames.has(name) ? 'replaced' : 'added' });
  for (const name of sourceNames) if (!outputNames.has(name)) actions.push({ name, action: 'removed' });
  return { bytes, manifest, origin, output, actions };
}

async function migratePublicSourceNode(input, token, authority) {
  let capture, stage = 'input';
  try {
    const record = requests.get(token), callback = authorities.get(authority);
    if (!record || !callback) fail('SOURCE_INPUT_INVALID', 'input');
    const started = Date.now(), deadline = started + record.data.timeout_ms;
    const current = where => { if (Date.now() > deadline) fail('SOURCE_DEADLINE_EXCEEDED', where); };
    current('admission'); stage = 'capture'; capture = await openSourceRouteCapture(input); current('admission');
    const manifestMeta = C.strict.parseJson(capture.manifestBytes);
    if (manifestMeta.format_version === SOURCE_GENERATION.format_version) {
      const compatibility = manifestMeta.compatibility ?? {};
      if (compatibility.profile !== SOURCE_GENERATION.profile || compatibility.profile_version !== SOURCE_GENERATION.profile_version) fail('MIGRATION_SOURCE_UNSUPPORTED_VERSION', 'input');
    } else if (HISTORICAL_CONTAINER_VERSIONS.has(manifestMeta.format_version)) {
      fail('MIGRATION_SOURCE_UNSUPPORTED_VERSION', 'input');
    } else {
      fail('SOURCE_INPUT_INVALID', 'input');
    }
    if (manifestMeta.payload?.encrypted === true || manifestMeta.encryption || Object.hasOwn(manifestMeta, 'entitlement')) fail('MIGRATION_SOURCE_PROTECTED_UNSUPPORTED', 'input');
    if (capture.rows.some(r => r.name === 'checksums.json' || r.name === 'signature.kdsig')) fail('MIGRATION_SOURCE_EXTENSION_UNSUPPORTED', 'input');
    C.need(capture.rows.every(r => r.method === 0 || r.method === 8), 'READ_CORE_CAPABILITY_UNAVAILABLE');
    const inventory = capture.rows.map(r => ({ name: r.name, type: 'file', mode: r.mode, size: r.size })).sort((a, b) => C.utf8(a.name, b.name));
    const context = {
      contract: routeContract,
      request: record.data,
      request_digest: record.digest,
      capture: capture.identity,
      source_inventory: inventory.map(({ name, type, mode, size }) => ({ name, type, mode, size })),
      output_intent: { container: '0.6.0', read: 'kdna.read/0.7.0-candidate', adoption: 'not_observed' },
    };
    validateTyped('SourceMigrationAuthorityContext06', context);
    stage = 'authorization'; current('authorization');
    let grant;
    try { grant = await callback(frozen(structuredClone(context))); } catch { fail('SOURCE_CAPABILITY_UNAVAILABLE', 'authorization'); }
    current('authorization'); if (grant !== true) fail('SOURCE_PERMISSION_REJECTED', 'authorization');
    stage = 'admission'; current('admission');
    const bytes = await capture.wholeAfterAuthorization(); current('admission');
    const sourceA = D.digest(bytes);
    if (sourceA !== record.data.source_expected_A) fail('SOURCE_EXPECTED_ASSET_MISMATCH', 'admission');
    const entries = parseContainer(bytes, (data, maxOutputLength) => inflateRawSync(data, { maxOutputLength }));
    const rawManifest = C.strict.parseJson(entries['kdna.json']);
    classifySource(rawManifest, entries);
    const manifest5 = validateClassic('Manifest', rawManifest);
    const payload5 = decodeValidatedPayload(manifest5, entries['payload.kdnab']);
    const sourceC = D.digest(D.contentTreePreimage(entries));
    assertContentBindings(manifest5, sourceC);
    const inventoryFull = inventory.map(r => ({ ...r, sha256: D.digest(entries[r.name]) }));
    await capture.assertUnchanged(); current('semantic');
    stage = 'output';
    const produced = buildOutput(manifest5, payload5, entries, sourceA, sourceC, record.digest, capture.identity.capture_id);
    current('semantic');
    const observation = validateTyped('SourceMigrationObservation06', {
      contract: routeContract,
      request_digest: record.digest,
      capture_id: capture.identity.capture_id,
      tuple: structuredClone(tuple),
      source_A: sourceA,
      source_content_digest: sourceC,
      source_inventory: inventoryFull,
      output: { A: produced.output.observed.A, C: produced.output.observed.C, E: produced.output.observed.E.digest },
      E_profile: produced.output.observed.E.profile,
      output_ir_digest: D.digestCanonical(produced.output.ir),
      member_actions: produced.actions,
      origin: strict.freeze(produced.origin),
      body_bytes: produced.bytes.length,
      proof: 'produced_bytes_with_confirmed_source_observation_not_consumer_read_or_adoption',
    });
    await capture.assertUnchanged(); current('return');
    return Object.freeze({ status: 'migrated', bytes: new Uint8Array(produced.bytes), observation: frozen(observation) });
  } catch (e) {
    if (migrationFailures.has(e)) return failure(e.migrationCode, e.migrationStage);
    if (stage === 'input' && (C.isFailure(e) || S.isFailure(e) || e.reason === 'READ_INPUT_INVALID')) return failure('SOURCE_INPUT_INVALID', 'input');
    const reason = e?.code === 'MODULE_NOT_FOUND' ? 'READ_CORE_CAPABILITY_UNAVAILABLE' : e?.reason;
    if (reason) return coreFailure(reason, ['input', 'capture', 'admission', 'output'].includes(stage) ? stage : 'admission', e);
    return failure('SOURCE_CAPABILITY_UNAVAILABLE', ['input', 'capture', 'admission', 'authorization', 'semantic', 'output', 'return'].includes(stage) ? stage : 'output');
  } finally { if (capture) await capture.close(); }
}

module.exports = {
  admitSourceMigrationRequest,
  inspectSourceMigrationRequest,
  createNativeSourceMigrationAuthority,
  migratePublicSourceNode,
};
