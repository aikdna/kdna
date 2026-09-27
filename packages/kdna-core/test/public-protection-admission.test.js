'use strict';
const test=require('node:test');const H=require('./protection-test-helpers.js');const {assert,core,req,policy,F,tuple,asset}=H;
const options={credential:{kind:'none'},signaturePolicy:policy},provider={kind:'local',clock:()=>1000};
test('ordinary presence rejects at every source and consumer boundary and preserves protection-marker precedence',async()=>{
 const a=asset();a.manifest.entitlement={profile:'password'};const bytes=F.encode(a,req);
 for(const result of [req('@aikdna/kdna-core').admitBytes(bytes),await req('@aikdna/kdna-core/node').admitNode(bytes),req('@aikdna/kdna-core/browser').admitBrowser(bytes),req('@aikdna/kdna-core/authoring-node').openSourceBytes(bytes),req('@aikdna/kdna-core/authoring-node').packSourceBytes(bytes,{})])assert.equal(result.reason,'READ_CORE_INVALID');
 assert.equal((await core.admitProtectedNode(bytes,options,provider)).diagnostic.code,'PROTECTION_DECLARATION_INVALID');
 a.manifest.payload.encrypted=true;a.manifest.encryption={profile:'kdna.envelope.aead',profile_version:'0.1.0',encrypted_entries:['payload.kdnab']};assert.equal(req('@aikdna/kdna-core').admitBytes(F.encode(a,req)).reason,'READ_CORE_CAPABILITY_UNAVAILABLE');
 a.manifest.entitlement=null;assert.equal(req('@aikdna/kdna-core').admitBytes(F.encode(a,req)).reason,'READ_CORE_INVALID');
});
test('plain explicit protected admission retains exact A C E and no entitlement defaults',async()=>{
 const a=asset(),bytes=F.encode(a,req),ordinary=req('@aikdna/kdna-core').admitBytes(bytes),got=await core.admitProtectedNode(bytes,options,provider);
 assert.equal(got.status,'accepted');for(const n of ['A','C','E'])assert.equal(got.receipt[n],ordinary.snapshot.digests[n].observed);assert.deepEqual(got.snapshot.ir,ordinary.snapshot.ir);assert.deepEqual(got.receipt.authorization,{kind:'none'});assert.equal(got.receipt.encryption,null);
});
test('options are closed; caller verified, plaintext and fake binding never issue an operation',async()=>{
 const bytes=F.encode(asset(),req);
 for(const extra of ['plaintext','verified','binding']){const got=await core.admitProtectedNode(bytes,{...options,[extra]:true},provider);assert.equal(got.status,'protection_failed');assert.equal(got.diagnostic.code,'PROTECTION_INPUT_INVALID');}
 for(const bad of [null,{}, {kind:'local',clock:()=>1000,readAdvance:()=>true}])assert.equal((await core.admitProtectedNode(bytes,options,bad)).status,'protection_failed');
});
test('R2 unknown critical refuses protected authority after technical obligations',async()=>{
 const a=asset();a.payload.extensions=[{id:'urn:test:unknown',critical:true,definition:'Unknown future semantics.',value:{kind:'text',value:'opaque'}}];
 const got=await core.admitProtectedNode(F.encode(a,req),options,provider);assert.equal(got.status,'core_rejected',JSON.stringify(got));assert.equal(got.core.reason,'READ_UNSUPPORTED_CRITICAL');assert.equal(got.operation,undefined);assert.equal(got.snapshot,undefined);
 a.payload.judgments[0].subject.statement=123;const bad=await core.admitProtectedNode(F.encode(a,req),options,provider);assert.equal(bad.status,'core_rejected');
});
test('encrypted unknown critical requires correct password before its R2 semantic rejection',async()=>{
 const a=asset();a.payload.extensions=[{id:'urn:test:unknown',critical:true,definition:'Unknown future semantics.',value:{kind:'text',value:'opaque'}}];a.manifest.access='licensed';a.manifest.entitlement={profile:'password'};a.manifest.payload.encrypted=true;a.manifest.encryption={profile:'kdna.envelope.aead',profile_version:'0.1.0',encrypted_entries:['payload.kdnab']};
 const codec=require(H.path.join(H.coreDir,'src/public-contract/protection-envelope-codec.js')),crypt=require(H.path.join(H.coreDir,'src/public-contract/protection-crypto.js')),parse=require(H.path.join(H.coreDir,'src/public-contract/container.js')).parseContainer,password=Buffer.from('synthetic-catalog');
 const entries=parse(F.encode(a,req)),envelope=crypt.encryptPassword(entries['payload.kdnab'],a.manifest,[{slot:'one',kdf_profile:'scrypt-sha256'}],[{password}]);entries['payload.kdnab']=codec.encodeEnvelope(envelope);const bytes=F.zip(entries);
 const good=await core.admitProtectedNode(bytes,{credential:{kind:'password',password},signaturePolicy:policy},provider);assert.equal(good.status,'core_rejected');assert.equal(good.core.reason,'READ_UNSUPPORTED_CRITICAL');assert.equal(good.operation,undefined);
 const bad=await core.admitProtectedNode(bytes,{credential:{kind:'password',password:Buffer.from('wrong')},signaturePolicy:policy},provider);assert.equal(bad.status,'protection_failed');assert.equal(bad.diagnostic.code,'PROTECTION_AUTHENTICATION_FAILED');
});
test('preserved protection declaration vectors rebased onto current formal assets exercise ordinary and protected paths',async()=>{
 const vectors=require('../../../conformance/public-contract/protection-definition-cases.json');
 const historical=asset(1);historical.manifest=structuredClone(vectors.cases[0].manifest);historical.payload.asset.asset_id=historical.manifest.asset_id;assert.equal(req('@aikdna/kdna-core').admitBytes(F.encode(historical,req)).reason,'READ_UNSUPPORTED_VERSION','the original vector is historical, not current coverage');
 for(const v of vectors.cases){const a=asset(1);for(const key of ['access','encryption','entitlement']){if(Object.hasOwn(v.manifest,key))a.manifest[key]=structuredClone(v.manifest[key]);else delete a.manifest[key];}a.manifest.payload.encrypted=v.manifest.payload.encrypted;const bytes=F.encode(a,req),plain=v.definition_disposition==='prior_plaintext_absence';
  const ordinary=req('@aikdna/kdna-core').admitBytes(bytes),got=await core.admitProtectedNode(bytes,options,provider);
  assert.equal(ordinary.status==='accepted',plain,v.id+JSON.stringify(ordinary));assert.equal(got.status==='accepted',plain,v.id+JSON.stringify(got));
 }
});
test('actual encrypted semantic failures traverse the shared decode boundary exactly once',async()=>{
 const semanticPath=H.path.join(H.coreDir,'src/public-contract/semantic-admission.js'),admissionPath=H.path.join(H.coreDir,'src/public-contract/protection-admission.js'),shared=require(semanticPath),original=shared.decodeValidatedPayload;let decoded=0;shared.decodeValidatedPayload=(...args)=>{decoded++;return original(...args);};delete require.cache[admissionPath];const admitted=require(admissionPath).admitProtectedNode;
 try{for(const mutate of [a=>a.payload.asset.asset_id='wrong',a=>a.payload.judgments[0].result.contract_ref='absent',a=>a.payload.dependencies=[{id:'bad',producer:{kind:'judgment_result',judgment_ref:'absent',result_contract_ref:'absent'},consumer_judgment_ref:'j:0',input_role:'x',data_type:{term:'text'},required:true,purpose:'x'}]]){
  const a=asset();mutate(a);a.manifest.access='licensed';a.manifest.entitlement={profile:'password'};a.manifest.payload.encrypted=true;a.manifest.encryption={profile:'kdna.envelope.aead',profile_version:'0.1.0',encrypted_entries:['payload.kdnab']};
  const parse=require(H.path.join(H.coreDir,'src/public-contract/container.js')).parseContainer,codec=require(H.path.join(H.coreDir,'src/public-contract/protection-envelope-codec.js')),crypt=require(H.path.join(H.coreDir,'src/public-contract/protection-crypto.js')),entries=parse(F.encode(a,req)),password=Buffer.from('semantic-canary');entries['payload.kdnab']=codec.encodeEnvelope(crypt.encryptPassword(entries['payload.kdnab'],a.manifest,[{slot:'one',kdf_profile:'scrypt-sha256'}],[{password}]));
  const before=decoded,got=await admitted(F.zip(entries),{credential:{kind:'password',password},signaturePolicy:policy},provider);assert.equal(got.status,'core_rejected');assert.equal(decoded-before,1);assert.equal(JSON.stringify(got).includes('semantic-canary'),false);
 }}finally{shared.decodeValidatedPayload=original;delete require.cache[admissionPath];}
});
