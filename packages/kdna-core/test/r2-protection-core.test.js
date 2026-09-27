'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const F=require('../../../conformance/public-contract/test/r2-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const core=req('@aikdna/kdna-core/protection-node'),source=req('@aikdna/kdna-core/protected-source-node'),issuer=req('@aikdna/kdna-core/key-grant-issuer-node');
const {inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const generated=require(path.join(coreDir,'src/public-contract/generated-contract.json')),tuple=generated.versionTuple;
const {digest,digestCanonical}=require(path.join(coreDir,'src/public-contract/digests.js'));
const {parseContainer}=require(path.join(coreDir,'src/public-contract/container.js'));
const {encodeEnvelope}=require(path.join(coreDir,'src/public-contract/protection-envelope-codec.js'));
const {encryptPassword,encryptExternal}=require(path.join(coreDir,'src/public-contract/protection-crypto.js'));
const policy={requireSignature:false,expectedPublicKeyHex:null},PASSWORD=Buffer.from('R2 bounded synthetic password');
const secrets={passwords:[{slot:'test',password:PASSWORD}]},slots=[{slot:'test',kdf_profile:'scrypt-sha256'}];
const admission={credential:{kind:'password',password:PASSWORD,slotIndex:0},signaturePolicy:policy};
const provider={kind:'local',clock:()=>1000};
function definition(name){return require(path.join(coreDir,'src/public-contract/'+name+'-contract.generated.json'));}
function assertBinding(d){assert.deepEqual(d.schema_binding.version_tuple,tuple);assert.equal(d.schema_binding.package_versions['@aikdna/kdna-core'],req('@aikdna/kdna-core/package.json').version);assert.equal(d.schema_binding.package_versions['@aikdna/kdna-read'],req('@aikdna/kdna-read/package.json').version);}
function encryptedFixture(edit,kind='password',root=null){
  const a=F.asset(tuple);edit(a);a.manifest.access='licensed';a.manifest.payload.encrypted=true;
  a.manifest.entitlement={profile:kind==='password'?'password':'account',offline:true,revocable:kind!=='password'};
  a.manifest.encryption={profile:kind==='password'?'kdna.envelope.aead':'kdna.envelope.external-grant',profile_version:'0.1.0',encrypted_entries:['payload.kdnab']};
  const entries=parseContainer(F.encode(a,req)),plain=entries['payload.kdnab'];
  // Test-only construction uses the unchanged production cryptographic primitive
  // to reach post-decryption semantic admission with an intentionally invalid R2 body.
  const envelope=kind==='password'?encryptPassword(plain,a.manifest,slots,secrets.passwords):encryptExternal(plain,a.manifest,{key_ref:'key:test',issuer_key_id:'root:test'},root);
  entries['payload.kdnab']=encodeEnvelope(envelope);return {a,bytes:F.zip(entries)};
}
test('D003 and D004 descriptors bind installed packages, generated definitions and exact tuple',()=>{
  for(const name of ['protection','protected-source','issuer'])assertBinding(definition(name));
  assert.equal(core.getProtectionContract().contract.definition_digest,definition('protection').definition_digest);
  assert.equal(source.getProtectedSourceContract().contract.definition_digest,definition('protected-source').definition_digest);
  assert.equal(issuer.getExternalGrantIssuerContract().definition_digest,definition('issuer').definition_digest);
  for(const descriptor of [core.getProtectionContract(),source.getProtectedSourceContract(),issuer.getExternalGrantIssuerContract()])assert.equal(descriptor.implementation.version,req('@aikdna/kdna-core/package.json').version);
  assert.equal(definition('issuer').schema_id,'urn:kdna:schema:external-grant-issuer:1.0.0:binding:r2:7');
  assert.equal(definition('protected-source').schema_id,'urn:kdna:schema:protected-source:1.0.0:binding:r2:7');
});
test('issuer current schema accepts the installed descriptor and rejects the old package coordinate',()=>{
  const Ajv=require('ajv/dist/2020'),schema=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../specs/external-grant-issuer-r2-binding-7.schema.json')));
  const ajv=new Ajv({strict:false,validateFormats:false}),validate=ajv.compile({$defs:schema.$defs,$ref:'#/$defs/IssuerDescriptor'});
  const descriptor=issuer.getExternalGrantIssuerContract();assert.equal(validate(descriptor),true,JSON.stringify(validate.errors));
  for(const version of ['0.35.0-rc.source.1','0.36.0-rc.r2.1','0.36.0-rc.r2.2','0.36.0-rc.r2.3','0.36.0-rc.r2.4'])assert.equal(validate({...descriptor,implementation:{...descriptor.implementation,version}}),false);
  for(const binding of [1,2,3,4]){
    const previous=JSON.parse(fs.readFileSync(path.resolve(__dirname,`../../../specs/external-grant-issuer-r2-binding-${binding}.schema.json`)));
    assert.equal(new Ajv({strict:false,validateFormats:false}).compile({$defs:previous.$defs,$ref:'#/$defs/IssuerDescriptor'})(descriptor),false);
  }
  const old=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../specs/external-grant-issuer.schema.json'))),oldValidate=new Ajv({strict:false,validateFormats:false}).compile({$defs:old.$defs,$ref:'#/$defs/IssuerDescriptor'});
  assert.equal(oldValidate(descriptor),false);
});
test('public protected-source production and opening preserve all R2 judgment fields',async()=>{
  const a=F.asset(tuple,'complex'),plain=F.encode(a,req);
  const produced=await core.protectSourceBytes(plain,{kind:'password',asset_uid:a.manifest.asset_uid,entitlement:{profile:'password',offline:true,revocable:false},slots,checksums:true,signature:'none'},secrets);
  assert.equal(produced.status,'produced',JSON.stringify(produced));
  let bundle,view;
  const host=source.createTrustedProtectedSourceHost({observe:()=>({context_id:'r2-source',epoch:'one',asset_digest:produced.evidence.output.A,permission:'allowed',scope:'complete_source',current_ms:1000,expires_at_ms:2000,revoked:false}),deliver:b=>{bundle=b;view=inspectSnapshot(b.prior_snapshot);return true;}});
  const opened=await source.withProtectedSourceNode(produced.bytes,{admission,expected_A:produced.evidence.output.A,timeout_ms:10000},provider,host);
  assert.equal(opened.status,'source_delivered',JSON.stringify(opened));assert.equal(opened.body,null);
  for(const j of a.payload.judgments)assert.deepEqual(view.ir.nodes.find(n=>n.target.kind==='judgment'&&n.target.id===j.id).value,j);
  assert.deepEqual(Buffer.from(bundle.plaintext_payload.bytes),Buffer.from(parseContainer(plain)['payload.kdnab']));
});
for(const [name,edit,reason] of [
  ['missing mandatory role',a=>a.payload.judgments[0].method.components=[],'READ_CORE_INVALID'],
  ['unknown critical module',a=>a.payload.extensions.push({id:'urn:r2:unknown-critical',critical:true,definition:'Unknown critical semantic test carrier.',value:{kind:'text',value:'R2_PRIVATE_CANARY'}}),'READ_UNSUPPORTED_CRITICAL']
])test('legitimate decryption still rejects '+name+' without a source body',async()=>{
  const f=encryptedFixture(edit),admitted=await core.admitProtectedNode(f.bytes,admission,provider);
  assert.equal(admitted.status,'core_rejected',JSON.stringify(admitted));assert.equal(admitted.core.reason,reason);assert.equal(admitted.operation,undefined);
  let deliveries=0;
  const host=source.createTrustedProtectedSourceHost({observe:()=>({context_id:'r2-negative',epoch:'one',asset_digest:digest(f.bytes),permission:'allowed',scope:'complete_source',current_ms:1000,expires_at_ms:2000,revoked:false}),deliver:()=>{deliveries++;return true;}});
  const opened=await source.withProtectedSourceNode(f.bytes,{admission,expected_A:digest(f.bytes),timeout_ms:10000},provider,host);
  assert.equal(opened.status,'core_rejected',JSON.stringify(opened));assert.equal(opened.core.reason,reason);assert.equal(deliveries,0);assert.equal(opened.body,null);assert.ok(!JSON.stringify(opened).includes('R2_PRIVATE_CANARY'));
  const Ajv=require('ajv/dist/2020'),schema=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../specs/protected-source-r2-binding-7.schema.json')));
  const validate=new Ajv({strict:false,validateFormats:false}).compile(schema);assert.equal(validate(opened),true,JSON.stringify(validate.errors));
  if(reason==='READ_UNSUPPORTED_CRITICAL') { const old=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../specs/protected-source.schema.json')));assert.equal(new Ajv({strict:false,validateFormats:false}).compile(old)(opened),false); }
});
function issuerArgs(root){
  const signer=crypto.generateKeyPairSync('ed25519'),agreement=crypto.generateKeyPairSync('x25519'),signing=crypto.generateKeyPairSync('ed25519');
  return {options:{issuer:'issuer:r2',signing_key_id:'signer:r2',account_id:'account:r2',entitlement_id:'entitlement:r2',entitlement_profile:'account',device_id:'device:r2',device_agreement_public_key:'x25519:'+agreement.publicKey.export({format:'jwk'}).x,device_signing_public_key:'ed25519:'+signing.publicKey.export({format:'jwk'}).x,grant_id:'grant:r2',status:'active',status_version:1,issued_at_ms:900,refresh_after_ms:1500,offline_grace_until_ms:1800,expires_at_ms:2000,timeout_ms:10000},secrets:{issuerRootKey:root,issuerSigningPrivateKeyPkcs8:signer.privateKey.export({format:'der',type:'pkcs8'}),signaturePolicy:policy}};
}
test('issuer admits the R2 structure before issuing a grant and rejects decrypted missing roles',async()=>{
  const root=crypto.randomBytes(32),args=issuerArgs(root),a=F.asset(tuple);
  const produced=await core.protectSourceBytes(F.encode(a,req),{kind:'external-grant',asset_uid:a.manifest.asset_uid,entitlement:{profile:'account',offline:true,revocable:true},key_ref:'key:test',issuer_key_id:'root:test',checksums:true,signature:'none'},{issuerRootKey:root});
  assert.equal(produced.status,'produced',JSON.stringify(produced));
  const issued=await issuer.issueExternalKeyGrantForAsset(produced.bytes,args.options,args.secrets);assert.equal(issued.status,'issued',JSON.stringify(issued));assert.equal(issued.admission.status,'accepted');
  const bad=encryptedFixture(a=>a.payload.judgments[0].method.components=[],'external',root);
  const refused=await issuer.issueExternalKeyGrantForAsset(bad.bytes,args.options,args.secrets);assert.equal(refused.status,'core_rejected',JSON.stringify(refused));assert.equal(refused.core.reason,'READ_CORE_INVALID');assert.equal(refused.grantBytes,undefined);
});
