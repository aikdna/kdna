'use strict';
const { parseJson, canonicalJson, compareUtf8 } = require('./strict-input.js');
const { digest, runtimeEntryNames } = require('./digests.js');
const { fail } = require('./protection-declaration.js');
const { verifySignatureBundle, parseSignatureBundle, signContentDigest, serializeSignatureBundle } = require('../signature.js');
const { ChecksumsDocument1: checksumsShape } = require('./protection-validators.generated.js');
// Precisely the independent kdsig 0.1 content domain; never substitute C0.2/E0.2.
function signatureContentPreimage(entries) {
  const rows = [];
  for (const name of Object.keys(entries).sort(compareUtf8)) {
    if (['.DS_Store','build-receipt.json','signature.kdsig'].includes(name) || name.startsWith('reports/')) continue;
    let member = entries[name];
    if (/\.json$/i.test(name)) {
      const value = parseJson(member);
      if (name === 'kdna.json') {
        for (const key of ['asset_digest','container_sha256','content_digest','_source']) delete value[key];
        if (value.authoring && typeof value.authoring === 'object') delete value.authoring.content_digest;
      }
      member = Buffer.from(canonicalJson(value));
    }
    rows.push(name + ':' + digest(member).slice(7));
  }
  return Buffer.from(rows.join('\n'));
}
function signatureContentDigest(entries) { return digest(signatureContentPreimage(entries)); }
function makeChecksums(entries,manifest,E) {
  const names = runtimeEntryNames(entries,manifest);
  return {profile:'kdna.checksums.document/1',profile_version:'1.0.0',algorithm:'sha256',digest_profile:'kdna.digest-basis.runtime-entry-set',digest_profile_version:'0.2.0',covered_entries:names,entries:names.map(name=>({name,bytes:entries[name].length,digest:digest(entries[name])})),entry_set_digest:E};
}
function verifyIntegrity(entries,manifest,E,policy) {
  const integrity = {checksums:'absent',signature:'absent',signature_content_digest:null};
  if (Object.hasOwn(entries,'checksums.json')) {
    const raw = entries['checksums.json']; let value;
    try { if(raw.length>1048576)throw Error(); value=parseJson(raw); } catch { fail('CHECKSUMS_INVALID','integrity'); }
    if (value?.profile !== 'kdna.checksums.document/1' || value?.profile_version !== '1.0.0') fail('PROFILE_UNSUPPORTED','integrity');
    if (!checksumsShape(value) || canonicalJson(value) !== canonicalJson(makeChecksums(entries,manifest,E))) fail('CHECKSUMS_INVALID','integrity');
    integrity.checksums = 'verified_document_1';
  }
  if (Object.hasOwn(entries,'signature.kdsig')) {
    const raw = entries['signature.kdsig']; let bundle;
    try { if(raw.length>1048576)throw Error(); parseJson(raw); bundle=parseSignatureBundle(Buffer.from(raw)); } catch { fail('SIGNATURE_INVALID','integrity'); }
    if (policy.expectedPublicKeyHex !== null && bundle.public_key !== policy.expectedPublicKeyHex) fail('SIGNATURE_PIN_MISMATCH','integrity');
    const signatureDigest = signatureContentDigest(entries);
    try { verifySignatureBundle(Buffer.from(raw),signatureDigest); } catch { fail('SIGNATURE_INVALID','integrity'); }
    integrity.signature = policy.expectedPublicKeyHex === null ? 'verified_self_key' : 'verified_pinned_key';
    integrity.signature_content_digest = signatureDigest;
  } else if (policy.requireSignature || policy.expectedPublicKeyHex !== null) fail('SIGNATURE_INVALID','integrity');
  return integrity;
}
function signEntries(entries,seed) { return serializeSignatureBundle(signContentDigest(signatureContentDigest(entries),seed.toString('hex'))); }
module.exports = { signatureContentPreimage, signatureContentDigest, makeChecksums, verifyIntegrity, signEntries };
