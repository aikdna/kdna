'use strict';

const { inflateRawSync } = require('node:zlib');
const { isDeepStrictEqual } = require('node:util');
const { admit, rejected } = require('./admit.js');
const { parseContainer, LIMITS } = require('./container.js');
const { encodeStored } = require('./container-writer.js');
const { decodePayload } = require('./cbor.js');
const { parseJson, copyJson, reject, freeze, canonicalJson, utf8 } = require('./strict-input.js');
const { digest, contentTreePreimage } = require('./digests.js');

const proofLimits = Object.freeze([
  'Core acceptance is not formal completion, content quality, identity or editing authority.',
  'Member bytes, names and modes are preserved except explicitly edited source members and refreshed Manifest content bindings.',
  'ZIP compression, timestamps, extras, comments and container bytes are not preserved.',
  'Bytes only: no filesystem extraction, attachment execution or hooks.',
]);
const inflate = (data, maxOutputLength) => inflateRawSync(data, { maxOutputLength });

// Raw source is reachable only here, after the same admission used by consumers.
function openSourceBytes(input) {
  try {
    if (!(input instanceof Uint8Array)) return rejected('READ_INPUT_INVALID');
    if (input.byteLength > LIMITS.container) return rejected('READ_CORE_INVALID');
    const bytes = new Uint8Array(input), admission = admit(bytes, inflate);
    if (admission.status !== 'accepted') return admission;
    const metadata = [], entries = parseContainer(bytes, inflate, metadata);
    const members = metadata.map(row => ({ ...row, bytes: new Uint8Array(entries[row.name]) }));
    const inventory = members.map(({ bytes: content, ...row }) => ({ ...row, size: content.length, sha256: digest(content) }));
    return {
      status: 'accepted',
      source: {
        manifest: parseJson(entries['kdna.json']),
        payload: decodePayload(entries['payload.kdnab']),
        members, inventory, artifact_digest: digest(bytes),
      },
      proof_limits: proofLimits,
    };
  } catch (error) {
    return rejected(error?.code === 'MODULE_NOT_FOUND' ? 'READ_CORE_CAPABILITY_UNAVAILABLE' : error?.reason, error?.component_failure ?? null, error?.diagnostic ?? null);
  }
}

function packSourceBytes(predecessorBytes, edits) {
  try {
    const opened = openSourceBytes(predecessorBytes);
    if (opened.status !== 'accepted') return opened;
    const supplied = copyJson(edits);
    if (!supplied || Array.isArray(supplied) || typeof supplied !== 'object'
      || Object.keys(supplied).some(key => !['manifest', 'payload'].includes(key))) reject('READ_INPUT_INVALID');
    const source = opened.source, members = source.members;
    const entries = Object.fromEntries(members.map(row => [row.name, row.bytes]));
    let manifest = source.manifest;
    if (Object.hasOwn(supplied, 'manifest')) {
      manifest = supplied.manifest;
      checkSourceSize(manifest);
      entries['kdna.json'] = Buffer.from(JSON.stringify(manifest));
    }
    if (Object.hasOwn(supplied, 'payload')) {
      checkSourceSize(supplied.payload);
      const { Encoder } = require('cbor-x/index-no-eval');
      entries['payload.kdnab'] = new Uint8Array(new Encoder({ useRecords: false, mapsAsObjects: true, structuredClone: false, alwaysUseFloat: true }).encode(supplied.payload));
    }
    // C's public preimage excludes precisely these two self bindings. Refresh
    // existing well-formed declarations; never add/delete authored properties.
    if (Object.keys(supplied).length && manifest && typeof manifest === 'object') {
      const declared = value => typeof value === 'string' && /^sha256:[0-9a-f]{64}$/.test(value);
      const rootBinding = declared(manifest.content_digest), authoringBinding = declared(manifest.authoring?.content_digest);
      if (rootBinding || authoringBinding) {
        const C = digest(contentTreePreimage(entries));
        if (rootBinding) manifest.content_digest = C;
        if (authoringBinding) manifest.authoring.content_digest = C;
        entries['kdna.json'] = Buffer.from(JSON.stringify(manifest));
      }
    }
    const bytes = encodeStored(members.map(row => ({ ...row, bytes: entries[row.name] })));
    const result = openSourceBytes(bytes);
    if (result.status === 'accepted' && !isDeepStrictEqual(result.source.payload, Object.hasOwn(supplied, 'payload') ? supplied.payload : source.payload)) reject('READ_CORE_INVALID');
    return result.status === 'accepted' ? { ...result, bytes } : result;
  } catch (error) {
    return rejected(error?.code === 'MODULE_NOT_FOUND' ? 'READ_CORE_CAPABILITY_UNAVAILABLE' : error?.reason, error?.component_failure ?? null, error?.diagnostic ?? null);
  }
}

// Bound allocations before the production codec. This lower bound on encoded
// size rejects oversized edits; the shared container parser enforces exact size.
function checkSourceSize(value) {
  let size = 0;
  function visit(item) {
    size += typeof item === 'string' ? Buffer.byteLength(item) : 1;
    if (size > LIMITS.entry) reject('READ_CORE_INVALID');
    if (item && typeof item === 'object') for (const key of Object.keys(item)) {
      if (!Array.isArray(item)) { size += Buffer.byteLength(key); if (size > LIMITS.entry) reject('READ_CORE_INVALID'); }
      visit(item[key]);
    }
  }
  visit(value);
}

function getAuthoringWorkflowContract() {
  const definition=require('./generated-contract.json').authoring_workflow;
  return freeze({ ...copyJson(definition), definition_digest: digest(utf8(canonicalJson(definition))) });
}
module.exports = { openSourceBytes, packSourceBytes, getAuthoringWorkflowContract };
