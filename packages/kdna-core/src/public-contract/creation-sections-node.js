'use strict';
const {types: native, isDeepStrictEqual} = require('node:util');
const C = require('./section-common.js');
const Q = require('./creation-common.js');
const S = require('./source-route-common.js');
const D = require('./digests.js');
const {rejected} = require('./admit.js');
const {validateDecodedPayload} = require('./semantic-admission.js');
const {buildIR} = require('./canonical-ir.js');
const {buildFrames} = require('./source-route-frame-writer.js');
const metadataCodec = require('./section-metadata-codec.js');
const {encodeStored} = require('./container-writer.js');
const {inflateRawSync} = require('node:zlib');
const {parseSectionContainer} = require('./section-container.js');
const {restoreWholeFrames} = require('./section-frame-graph.js');
const {reconstructPayload} = require('./section-reconstruct.js');
const {observeWhole} = require('./section-digests.js');
const {assertContentBindings} = require('./semantic-admission.js');
const tuple = C.contract.module.versionTuple;
const contract = C.strict.freeze({
  id: 'kdna.creation-sections/0.1.0-candidate',
  version: '0.1.0-candidate',
  definition_digest: D.digestCanonical(Q.contract.module)
});
const requests = new WeakMap(), authorities = new WeakMap(), failures = new WeakSet();
const typedPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const typedLength = Object.getOwnPropertyDescriptor(typedPrototype, 'length').get;
const typedBuffer = Object.getOwnPropertyDescriptor(typedPrototype, 'buffer').get;
const mimetype = Buffer.from('application/vnd.kdna.asset');
const none = () => ({kind: 'none', external_commit: {state: 'not_invoked'}});
function fail(code, stage) {
  const error = new Error(code);
  error.sourceCode = code;
  error.sourceStage = stage;
  failures.add(error);
  throw error;
}
function failure(code, stage) {
  const value = {status: 'source_failed', diagnostic: {code, stage}, disclosure: none(), body: null, body_bytes: 0};
  S.validate('SourceRouteFailure06', value);
  return C.strict.freeze(value);
}
function coreFailure(code, stage, error = null) {
  const value = {status: 'core_rejected', stage, core: rejected(code, error?.component_failure ?? null, error?.diagnostic ?? null), disclosure: none(), body: null, body_bytes: 0};
  S.validate('SourceRouteCoreRejected06', value);
  return C.strict.freeze(value);
}
function closedData(value, fields) {
  if (!value || typeof value !== 'object' || native.isProxy(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail('SOURCE_INPUT_INVALID', 'input');
  const keys = Reflect.ownKeys(value);
  if (keys.length !== fields.length || keys.some(key => typeof key !== 'string' || !fields.includes(key))) fail('SOURCE_INPUT_INVALID', 'input');
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) fail('SOURCE_INPUT_INVALID', 'input');
  }
  return value;
}
// Inspect descriptors without invoking application getters before the original
// strict copier. Proxy traps and hidden properties must not erase authored data.
function ownJson(value, active = new Set(), depth = 0) {
  if (depth > 64) fail('SOURCE_INPUT_INVALID', 'input');
  if (!value || typeof value !== 'object') return;
  if (native.isProxy(value) || active.has(value)) fail('SOURCE_INPUT_INVALID', 'input');
  const array = Array.isArray(value);
  if (!array && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail('SOURCE_INPUT_INVALID', 'input');
  active.add(value);
  for (const key of Reflect.ownKeys(value)) {
    if (array && key === 'length') continue;
    if (typeof key !== 'string') fail('SOURCE_INPUT_INVALID', 'input');
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) fail('SOURCE_INPUT_INVALID', 'input');
    ownJson(descriptor.value, active, depth + 1);
  }
  active.delete(value);
}
function ownedJson(value) {
  ownJson(value);
  return C.strict.copyJson(value);
}
function copyBytes(value) {
  if (native.isProxy(value) || !native.isUint8Array(value) || ![Uint8Array.prototype, Buffer.prototype].includes(Object.getPrototypeOf(value))) fail('SOURCE_INPUT_INVALID', 'input');
  const length = typedLength.call(value), buffer = typedBuffer.call(value);
  if (native.isSharedArrayBuffer(buffer)) fail('SOURCE_INPUT_INVALID', 'input');
  // An actual detached buffer must fail even when its reported length is zero.
  try { new Uint8Array(buffer, 0, 0); } catch { fail('SOURCE_INPUT_INVALID', 'input'); }
  if (length > 8388608) C.need(false, 'READ_CORE_INVALID');
  const keys = Reflect.ownKeys(value);
  if (keys.length !== length || keys.some((key, i) => key !== String(i))) fail('SOURCE_INPUT_INVALID', 'input');
  const bytes = Buffer.alloc(length);
  Uint8Array.prototype.set.call(bytes, value);
  return bytes;
}
function ownInput(value) {
  closedData(value, ['manifest', 'payload', 'members']);
  const manifest = ownedJson(value.manifest), payload = ownedJson(value.payload);
  Q.validate('NativeCreationManifest06', manifest);
  if (Object.hasOwn(manifest, 'access') && manifest.access !== 'public') fail('SOURCE_CAPABILITY_UNAVAILABLE', 'input');
  const rows = value.members;
  if (!Array.isArray(rows) || native.isProxy(rows) || Object.getPrototypeOf(rows) !== Array.prototype) fail('SOURCE_INPUT_INVALID', 'input');
  const descriptors = Object.getOwnPropertyDescriptors(rows), keys = Reflect.ownKeys(rows);
  if (rows.length > 10000 || keys.length !== rows.length + 1) fail('SOURCE_INPUT_INVALID', 'input');
  // Each supplied file necessarily exists in the result: this early rejection is
  // an unchanged output count bound, not a lower authored-knowledge ceiling.
  if (rows.length > 128) C.need(false, 'READ_CORE_INVALID');
  const members = [], names = new Set();
  let total = 0;
  for (let i = 0; i < rows.length; i++) {
    const descriptor = descriptors[String(i)];
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) fail('SOURCE_INPUT_INVALID', 'input');
    const row = closedData(descriptor.value, ['name', 'type', 'mode', 'bytes']);
    if (!C.strict.entryName(row.name) || row.type !== 'file' || !Number.isInteger(row.mode) || row.mode < 0 || row.mode > 65535) fail('SOURCE_INPUT_INVALID', 'input');
    const kind = row.mode & 0o170000;
    if (kind !== 0 && kind !== 0o100000) fail('SOURCE_INPUT_INVALID', 'input');
    if (names.has(row.name)) fail('SOURCE_INPUT_INVALID', 'input');
    names.add(row.name);
    if (!row.name.startsWith('attachments/')) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'input');
    const bytes = copyBytes(row.bytes);
    total += bytes.length;
    if (!Number.isSafeInteger(total) || total > 12582912) C.need(false, 'READ_CORE_INVALID');
    members.push({name: row.name, type: 'file', mode: row.mode, bytes});
  }
  const input = {
    manifest_digest: D.digestCanonical(manifest),
    payload_digest: D.digestCanonical(payload),
    members: members.map(row => ({name: row.name, type: row.type, mode: row.mode, size: row.bytes.length, sha256: D.digest(row.bytes)})),
    member_bytes: total
  };
  Q.validate('NativeCreationInputObservation06', input);
  return {manifest, payload, members, input};
}
function admitNativeCreationRequest(candidate) {
  try {
    const data = ownedJson(candidate);
    C.keys(data, ['request_id', 'tuple', 'operation', 'timeout_ms']);
    C.need(C.strict.identifier(data.request_id), 'READ_INPUT_INVALID');
    const t = data.tuple;
    C.need(t && typeof t === 'object' && !Array.isArray(t) && Object.keys(t).every(key => Object.hasOwn(tuple, key) && typeof t[key] === 'string'), 'READ_INPUT_INVALID');
    if (Object.keys(t).length !== Object.keys(tuple).length || Object.entries(tuple).some(([key, value]) => t[key] !== value)) {
      const base = require('./generated-contract.json');
      const historical = [base.versionTuple, ...base.types.UnsupportedVersionTuple.anyOf.map(row => Object.fromEntries(Object.entries(row.properties).map(([key, value]) => [key, value.const])))];
      const known = historical.some(row => Object.keys(row).length === Object.keys(t).length && Object.entries(row).every(([key, value]) => t[key] === value));
      return coreFailure(known ? 'READ_UNSUPPORTED_VERSION' : Object.keys(tuple).some(key => key !== 'payload_profile' && t[key] === tuple[key]) ? 'READ_MIXED_VERSION_TUPLE' : 'READ_UNSUPPORTED_VERSION', 'input');
    }
    Q.validate('NativeCreationRequest06', data);
    const token = Object.freeze({});
    requests.set(token, {data: C.strict.freeze(data), digest: D.digestCanonical(data)});
    return Object.freeze({status: 'admitted_request', request: token});
  } catch (error) {
    if (failures.has(error)) return failure(error.sourceCode, error.sourceStage);
    if (C.isFailure(error) || Q.isFailure(error) || error?.reason === 'READ_INPUT_INVALID') return failure('SOURCE_INPUT_INVALID', 'input');
    return failure('SOURCE_CAPABILITY_UNAVAILABLE', 'input');
  }
}
function inspectNativeCreationRequest(token) { return requests.get(token)?.data ?? null; }
function createNativeCreationAuthority(callback) {
  if (typeof callback !== 'function') throw new TypeError('Native creation authority callback required');
  const token = Object.freeze({});
  authorities.set(token, callback);
  return token;
}
function originalReason(error) {
  if (C.isFailure(error)) return error.code === 'SECTION_TYPED_SHAPE' ? 'READ_CORE_INVALID' : error.code;
  const known = new Set(['READ_INPUT_INVALID', 'READ_CORE_INVALID', 'READ_CORE_CAPABILITY_UNAVAILABLE', 'READ_UNSUPPORTED_CRITICAL', 'READ_INTERPRETATION_INCOMPLETE', 'READ_STATIC_POLICY_INVALID', ...require('./generated-contract.json').types.CoreComponentFailure.properties.code.enum]);
  return known.has(error?.reason) ? error.reason : null;
}
function construct(owned, current, outputStage) {
  const manifest = C.strict.copyJson(owned.manifest), payload = owned.payload;
  // This partial internal view is not an admitted Manifest or old05 snapshot.
  // Original semantic functions consume the authored fields and exact resources;
  // the complete actual Manifest06 is validated after its derived fields exist.
  manifest.format_version = tuple.container;
  const entries = Object.create(null);
  entries.mimetype = mimetype;
  for (const row of owned.members) entries[row.name] = row.bytes;
  for (const name of manifest.runtime.mandatory_entries) {
    if (name !== 'kdna.json' && !name.startsWith('attachments/')) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'semantic');
    if (name.startsWith('attachments/') && !Object.hasOwn(entries, name)) C.need(false, 'READ_CORE_INVALID');
  }
  current('semantic');
  validateDecodedPayload(manifest, payload);
  for (const row of payload.resources) {
    if (row.entry !== 'mimetype' && !row.entry.startsWith('attachments/')) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'semantic');
  }
  const ir = {...buildIR(manifest, payload, entries), tuple: C.strict.copyJson(tuple)};
  current('semantic');
  outputStage();
  current('output');
  const built = buildFrames(ir), packNames = Object.keys(built.packs);
  current('output');
  manifest.payload = {layout: 'sections', encoding: 'strict-cbor-frames', encrypted: false, tables: built.tables, xref_codec: 'frame-local-ordered-scope-dictionary/1'};
  const {nodes, expansion_targets, ...metadata} = ir;
  metadata.node_order = nodes.map(node => node.id);
  metadata.ir_digest_claim = D.digestCanonical(ir);
  metadata.runtime_entry_names = [...new Set(['kdna.json', ...packNames, ...manifest.runtime.mandatory_entries])].sort(C.utf8);
  manifest.representation_metadata = metadataCodec.encode(metadata);
  C.validate('Manifest06Candidate', manifest);
  Object.assign(entries, built.packs);
  entries['kdna.json'] = Buffer.from(JSON.stringify(manifest));
  const actions = ['/format_version', '/payload', '/representation_metadata'].map(path => ({path, action: 'added'}));
  const hasRootC = Object.hasOwn(manifest, 'content_digest'), hasAuthorC = Object.hasOwn(manifest.authoring ?? {}, 'content_digest');
  if (hasRootC || hasAuthorC) {
    const actualC = D.digest(D.contentTreePreimage(entries));
    if (hasRootC) { manifest.content_digest = actualC; actions.push({path: '/content_digest', action: 'refreshed'}); }
    if (hasAuthorC) { manifest.authoring.content_digest = actualC; actions.push({path: '/authoring/content_digest', action: 'refreshed'}); }
    entries['kdna.json'] = Buffer.from(JSON.stringify(manifest));
  }
  current('output');
  const generated = ['mimetype', 'kdna.json', ...packNames].map(name => ({name, type: 'file', mode: 0o100644, bytes: entries[name]}));
  const members = [...generated, ...owned.members];
  C.need(members.length <= 128, 'READ_CORE_INVALID');
  // The original writer checks each actual member, decoded total and physical ZIP.
  const bytes = encodeStored(members);
  current('output');
  return {bytes, manifest, payload, members, actions, ir, metadata};
}
// Full native representation/domain gates over actual output bytes. This route
// has no input capture: it deliberately creates no capture or absent-signature
// receipt with an invented capture_id. Its declared initial output is unsigned.
function admitCreatedBytes(bytes) {
  const metadata = [];
  const entries = parseSectionContainer(bytes, (raw, maxOutputLength) => inflateRawSync(raw, {maxOutputLength}), metadata);
  if (Object.hasOwn(entries, 'checksums.json') || Object.hasOwn(entries, 'signature.kdsig')) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'output');
  const manifest = C.strict.parseJson(entries['kdna.json']);
  C.validate('Manifest06Candidate', manifest);
  if (manifest.payload.encrypted || manifest.encryption || manifest.entitlement) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'output');
  const restored = restoreWholeFrames(entries, manifest);
  const payload = reconstructPayload(restored.ir);
  validateDecodedPayload(manifest, payload);
  const ir = {...buildIR(manifest, payload, entries), tuple: C.strict.copyJson(tuple)};
  if (D.digestCanonical(ir) !== D.digestCanonical(restored.ir)) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'output');
  const observed = observeWhole(bytes, entries, manifest, restored.pack_names);
  assertContentBindings(manifest, observed.C);
  return {manifest, payload, ir, entries, metadata, observed};
}
async function createSectionAssetNode(input, token, authority) {
  let stage = 'input', construction = false;
  try {
    const record = requests.get(token), callback = authorities.get(authority);
    if (!record || !callback) fail('SOURCE_INPUT_INVALID', 'input');
    const started = Date.now(), deadline = started + record.data.timeout_ms;
    if (!Number.isSafeInteger(started) || !Number.isSafeInteger(deadline)) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'input');
    const current = where => { if (Date.now() > deadline) fail('SOURCE_DEADLINE_EXCEEDED', where); };
    const owned = ownInput(input);
    current('input');
    const inputDigest = D.digestCanonical(owned.input);
    stage = 'authorization';
    const context = {contract, request: record.data, request_digest: record.digest, input_digest: inputDigest, input: owned.input, manifest: C.strict.copyJson(owned.manifest), intent: 'encode_exact_owned_authored_input_as_public_sections06', adoption: 'not_observed', output_delivery: 'return_bytes_only'};
    Q.validate('NativeCreationAuthorityContext06', context);
    current('authorization');
    let grant;
    try { grant = await callback(C.strict.freeze(context)); }
    catch { fail('SOURCE_CAPABILITY_UNAVAILABLE', 'authorization'); }
    current('authorization');
    if (grant !== true) fail('SOURCE_PERMISSION_REJECTED', 'authorization');
    stage = 'admission';
    const built = construct(owned, current, () => { stage = 'output'; });
    stage = 'output';
    const output = admitCreatedBytes(built.bytes);
    current('output');
    construction = true;
    // Compare complete values and actual bytes, not only counts or claimed hashes.
    if (!isDeepStrictEqual(output.payload, owned.payload) || !isDeepStrictEqual(output.ir, built.ir)) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'output');
    const retainedManifest = C.strict.copyJson(output.manifest);
    for (const key of ['format_version', 'payload', 'representation_metadata']) delete retainedManifest[key];
    if (Object.hasOwn(owned.manifest, 'content_digest')) retainedManifest.content_digest = owned.manifest.content_digest;
    if (Object.hasOwn(owned.manifest, 'authoring')) retainedManifest.authoring = C.strict.copyJson(owned.manifest.authoring);
    if (!isDeepStrictEqual(retainedManifest, owned.manifest) || !isDeepStrictEqual(metadataCodec.decode(output.manifest.representation_metadata), built.metadata)) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'output');
    if (output.metadata.length !== built.members.length) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'output');
    for (let i = 0; i < built.members.length; i++) {
      const expected = built.members[i], actual = output.metadata[i];
      if (actual.name !== expected.name || actual.type !== expected.type || actual.mode !== expected.mode || !Buffer.from(output.entries[actual.name]).equals(expected.bytes)) fail('SOURCE_CAPABILITY_UNAVAILABLE', 'output');
    }
    const evidence = {
      contract, request_digest: record.digest, input_digest: inputDigest, input: owned.input,
      output: {A: output.observed.A, C: output.observed.C, E: output.observed.E.digest},
      E_profile: output.observed.E.profile, output_ir_digest: D.digestCanonical(output.ir),
      manifest_actions: built.actions,
      members: output.metadata.map(row => ({name: row.name, type: row.type, mode: row.mode, size: output.entries[row.name].length, sha256: D.digest(output.entries[row.name])})),
      payload_preservation: 'complete_value_absence_array_order', proof: 'producer_observation_not_consumer_admission', output_delivery: 'not_published', adoption: 'not_observed'
    };
    Q.validate('NativeCreationEvidence06', evidence);
    const result = Object.freeze({status: 'produced', bytes: new Uint8Array(built.bytes), evidence: C.strict.freeze(evidence)});
    current('return');
    return result;
  } catch (error) {
    if (failures.has(error)) return failure(error.sourceCode, error.sourceStage);
    if (construction || Q.isFailure(error) && stage !== 'input') return failure('SOURCE_CAPABILITY_UNAVAILABLE', stage === 'admission' ? 'semantic' : stage);
    if (stage === 'input' && (Q.isFailure(error) || error?.reason === 'READ_INPUT_INVALID')) return failure('SOURCE_INPUT_INVALID', 'input');
    const reason = originalReason(error);
    if (reason === null || reason === 'READ_CORE_CAPABILITY_UNAVAILABLE') return failure('SOURCE_CAPABILITY_UNAVAILABLE', stage === 'admission' ? 'semantic' : stage);
    return coreFailure(reason, stage === 'input' ? 'input' : stage === 'output' ? 'output' : 'admission', error);
  }
}
module.exports = {admitNativeCreationRequest, inspectNativeCreationRequest, createNativeCreationAuthority, createSectionAssetNode};
