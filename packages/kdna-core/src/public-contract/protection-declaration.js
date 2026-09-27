'use strict';
const { copyJson, freeze, identifier, uint } = require('./strict-input.js');
const definition = require('./protection-contract.generated.json');
const FAILURE = Symbol('protection failure');
function fail(code, stage) { throw Object.assign(new Error('Protection rejected'), { [FAILURE]: true, code: 'PROTECTION_' + code, stage }); }
function failure(error, code = 'INPUT_INVALID', stage = 'input') {
  return freeze({ status: 'protection_failed', diagnostic: { code: error?.[FAILURE] ? error.code : 'PROTECTION_' + code, stage: error?.[FAILURE] ? error.stage : stage } });
}
function closed(value, required, optional = [], code = 'INPUT_INVALID', stage = 'input') {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(code, stage);
  const keys = Reflect.ownKeys(value);
  if (keys.some(k => typeof k !== 'string' || ![...required, ...optional].includes(k) || !Object.hasOwn(Object.getOwnPropertyDescriptor(value, k), 'value')) || required.some(k => !Object.hasOwn(value, k))) fail(code, stage);
  return value;
}
function bytes(value, max, exact = null) {
  if (!(value instanceof Uint8Array) || value.length > max || (exact !== null && value.length !== exact)) fail('INPUT_INVALID', 'input');
  return Buffer.from(value);
}
function options(value) {
  closed(value, ['credential', 'signaturePolicy']);
  const policy = closed(value.signaturePolicy, ['requireSignature', 'expectedPublicKeyHex']);
  if (typeof policy.requireSignature !== 'boolean' || (policy.expectedPublicKeyHex !== null && (typeof policy.expectedPublicKeyHex !== 'string' || !/^[0-9a-f]{64}$/.test(policy.expectedPublicKeyHex)))) fail('INPUT_INVALID', 'input');
  const c = value.credential; closed(c, ['kind'], c?.kind === 'password' ? ['password', 'slotIndex'] : c?.kind === 'external-grant' ? ['grantBytes', 'deviceAgreementPrivateKeyPkcs8', 'mode', 'expected'] : []);
  let credential;
  if (c.kind === 'none') credential = { kind: 'none' };
  else if (c.kind === 'password') {
    if (Object.hasOwn(c, 'slotIndex') && !uint(c.slotIndex)) fail('INPUT_INVALID', 'input');
    credential = { kind: c.kind, password: bytes(c.password, 1048576), slotIndex: c.slotIndex ?? 0 };
    try { new TextDecoder('utf-8', { fatal: true }).decode(credential.password); } catch { credential.password.fill(0); fail('INPUT_INVALID', 'input'); }
  } else if (c.kind === 'external-grant') {
    const expected = copyJson(c.expected);
    closed(expected, ['issuer', 'signing_key_id', 'issuer_public_key', 'account_id', 'entitlement_id', 'entitlement_profile', 'device_id', 'device_agreement_public_key', 'device_signing_public_key']);
    if (!['online','offline'].includes(c.mode) || !['account','org'].includes(expected.entitlement_profile) || Object.values(expected).some(v => !identifier(v))) fail('INPUT_INVALID', 'input');
    const grantBytes = bytes(c.grantBytes, 1048576);
    try { credential = { kind: c.kind, grantBytes, deviceAgreementPrivateKeyPkcs8: bytes(c.deviceAgreementPrivateKeyPkcs8, 4096), mode: c.mode, expected }; }
    catch (error) { grantBytes.fill(0); throw error; }
  } else fail('INPUT_INVALID', 'input');
  return { credential, signaturePolicy: { ...policy } };
}
function provider(value, kind) {
  const external = kind === 'external-grant';
  closed(value, external ? ['kind','clock','capabilities','readAdvance'] : ['kind','clock'], external ? ['refresh'] : []);
  if (value.kind !== (external ? 'external' : 'local') || typeof value.clock !== 'function') fail('INPUT_INVALID', 'input');
  if (!external) return Object.freeze({ kind: 'local', clock: value.clock });
  const capabilities = closed(value.capabilities, ['offline','status_refresh','revocation']);
  if (Object.values(capabilities).some(v => typeof v !== 'boolean') || typeof value.readAdvance !== 'function' || (Object.hasOwn(value,'refresh') && typeof value.refresh !== 'function') || (capabilities.status_refresh && typeof value.refresh !== 'function')) fail('INPUT_INVALID', 'input');
  return Object.freeze({ kind: 'external', clock: value.clock, capabilities: Object.freeze({ ...capabilities }), readAdvance: value.readAdvance, ...(value.refresh ? { refresh: value.refresh } : {}) });
}
function assetProtectionDeclaration(manifest) {
  const encrypted=manifest.payload.encrypted===true,has=Object.hasOwn(manifest,'entitlement');
  if(!encrypted){if(has||Object.hasOwn(manifest,'encryption'))fail('DECLARATION_INVALID','declaration');return null;}
  if(!has||manifest.access!=='licensed'||!identifier(manifest.asset_uid)||!manifest.encryption)fail('DECLARATION_INVALID','declaration');
  const d=manifest.encryption;
  if(d.profile_version!=='0.1.0'||!['kdna.envelope.aead','kdna.envelope.external-grant'].includes(d.profile))fail('PROFILE_UNSUPPORTED','declaration');
  if(JSON.stringify(d.encrypted_entries)!=='["payload.kdnab"]')fail('DECLARATION_INVALID','declaration');
  if(d.profile==='kdna.envelope.aead' ? manifest.entitlement.profile!=='password' : !['account','org'].includes(manifest.entitlement.profile))fail('DECLARATION_INVALID','declaration');
  return {id:d.profile,version:d.profile_version};
}
function declaration(manifest, credential, trustedProvider) {
  const profile=assetProtectionDeclaration(manifest);
  if(!profile){if(credential.kind!=='none')fail('DECLARATION_INVALID','declaration');return null;}
  const d=manifest.encryption;
  if (d.profile === 'kdna.envelope.aead') {
    if (manifest.entitlement.offline === false || manifest.entitlement.revocable === true) fail('DECLARATION_CONFLICT','authorization');
    if (credential.kind !== 'password') fail('CREDENTIAL_REQUIRED','credential');
  } else {
    if (credential.kind !== 'external-grant') fail('CREDENTIAL_REQUIRED','credential');
    if (manifest.entitlement.revocable === true && (!trustedProvider.capabilities.revocation || !trustedProvider.capabilities.status_refresh || !trustedProvider.refresh)) fail('DECLARATION_CONFLICT','authorization');
    if (credential.mode === 'offline' && (manifest.entitlement.offline !== true || !trustedProvider.capabilities.offline)) fail('DECLARATION_CONFLICT','authorization');
  }
  return profile;
}
function contract() { return { id: definition.id, version: definition.version, definition_digest: definition.definition_digest }; }
function getProtectionContract() { return freeze({ contract: contract(), implementation: { package: '@aikdna/kdna-core', version: require('../../package.json').version }, profiles: ['kdna.envelope.aead/0.1.0','kdna.envelope.external-grant/0.1.0','kdna.checksums.document/1@1.0.0','kdsig.ed25519/0.1.0'], kdfs: ['scrypt-sha256','argon2id'], capabilities: ['protected_admission','protected_operation','protected_production'] }); }
module.exports = { isFailure: error => !!error?.[FAILURE], fail, failure, closed, bytes, options, provider, declaration, assetProtectionDeclaration, contract, getProtectionContract };
