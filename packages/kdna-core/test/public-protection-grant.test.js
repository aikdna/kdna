'use strict';
const test=require('node:test');const H=require('./protection-test-helpers.js');const {assert,core,external,policy}=H;
test('current final-A device grant rejects every independently expected binding mismatch',async()=>{
 const f=await external();
 for(const key of Object.keys(f.credential.expected)){const expected={...f.credential.expected,[key]:key==='entitlement_profile'?'org':'wrong:test'};const got=await core.admitProtectedNode(f.bytes,{credential:{...f.credential,expected},signaturePolicy:policy},f.provider);assert.equal(got.status,'protection_failed',key);assert.ok(['PROTECTION_GRANT_INVALID','PROTECTION_GRANT_BINDING_MISMATCH'].includes(got.diagnostic.code),key+JSON.stringify(got));}
 const tampered=JSON.parse(f.credential.grantBytes);tampered.status_version++;assert.equal((await core.admitProtectedNode(f.bytes,{credential:{...f.credential,grantBytes:Buffer.from(JSON.stringify(tampered))},signaturePolicy:policy},f.provider)).diagnostic.code,'PROTECTION_GRANT_INVALID');
});
test('grant refresh exact boundary and expiry are checked again; no online offline fallback',async()=>{
 const f=await external(),binding=core.bindProtectionOperation(f.operation).binding;f.state.now=1500;const refreshed=await binding.observe('projection');assert.equal(refreshed.status,'current');assert.equal(refreshed.receipt.authorization.status_version,2);
 f.state.now=1700;f.state.refresh=()=>{throw Error('network down');};assert.equal((await binding.observe('host_handoff')).diagnostic.code,'PROTECTION_PROVIDER_FAILED');f.state.now=2000;assert.equal((await binding.observe('projection')).diagnostic.code,'PROTECTION_AUTHORIZATION_EXPIRED');
});
for(const kind of ['wrong-scope','low-version','revoked','revision-rollback','throw'])test('high-water '+kind+' closes current authority',async()=>{
 const f=await external(),binding=core.bindProtectionOperation(f.operation).binding;
 f.state.readAdvance=async input=>{if(kind==='throw')throw Error();return {scope:kind==='wrong-scope'?{...input.scope,entitlement_id:'wrong'}:input.scope,highest_status_version:kind==='low-version'?0:kind==='revoked'?2:1,status:kind==='revoked'?'revoked':'active',last_trusted_time_ms:1000,revision:kind==='revision-rollback'?0:100};};
 const got=await binding.observe('projection');assert.equal(got.status,'protection_failed');
});
test('caller secret buffers are copied before provider awaits and cannot change accepted device key',async()=>{
 const f=await external(),credential={...f.credential,grantBytes:Buffer.from(f.credential.grantBytes),deviceAgreementPrivateKeyPkcs8:Buffer.from(f.credential.deviceAgreementPrivateKeyPkcs8)};
 const pending=core.admitProtectedNode(f.bytes,{credential,signaturePolicy:policy},f.provider);credential.grantBytes.fill(0);credential.deviceAgreementPrivateKeyPkcs8.fill(0);const got=await pending;assert.equal(got.status,'accepted');assert.equal((await core.bindProtectionOperation(got.operation).binding.observe('projection')).status,'current');
});
test('offline is explicit signed grace; an authored lack of allowance cannot be inferred',async()=>{
 const f=await external();f.state.now=1600;const got=await core.admitProtectedNode(f.bytes,{credential:{...f.credential,mode:'offline'},signaturePolicy:policy},f.provider);assert.equal(got.status,'accepted');f.state.now=1801;assert.equal((await core.bindProtectionOperation(got.operation).binding.observe('projection')).diagnostic.code,'PROTECTION_AUTHORIZATION_EXPIRED');
});
test('same original E after ZIP repack cannot replay the old final-A grant',async()=>{
 const f=await external(),{parseContainer}=require(H.path.join(H.coreDir,'src/public-contract/container.js')),entries=parseContainer(f.bytes),repacked=H.F.zip(entries,{deflate:true});
 assert.notDeepEqual(repacked,f.bytes);const got=await core.admitProtectedNode(repacked,{credential:f.credential,signaturePolicy:policy},f.provider);assert.equal(got.diagnostic.code,'PROTECTION_GRANT_BINDING_MISMATCH');
});
test('cross-device reuse of revoked shared entitlement high-water cannot restore authority',async()=>{
 const f=await external(),device=H.crypto.generateKeyPairSync('x25519'),signing=H.crypto.generateKeyPairSync('ed25519'),expected={...f.credential.expected,device_id:'device:second',device_agreement_public_key:'x25519:'+device.publicKey.export({format:'jwk'}).x,device_signing_public_key:'ed25519:'+signing.publicKey.export({format:'jwk'}).x};
 const grant=f.grant({deviceId:expected.device_id,devicePublicKey:expected.device_agreement_public_key,deviceSigningPublicKey:expected.device_signing_public_key});f.state.version=2;f.state.status='revoked';
 const got=await core.admitProtectedNode(f.bytes,{credential:{...f.credential,expected,grantBytes:Buffer.from(JSON.stringify(grant)),deviceAgreementPrivateKeyPkcs8:device.privateKey.export({format:'der',type:'pkcs8'})},signaturePolicy:policy},f.provider);assert.equal(got.diagnostic.code,'PROTECTION_AUTHORIZATION_REVOKED');
});
