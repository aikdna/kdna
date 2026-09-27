'use strict';
const test=require('node:test');
const fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
const H=require('./protection-test-helpers.js');
const {assert,core,req,policy,F,tuple,asset,local,read,observer,control}=H;
const {parseContainer}=require(path.join(H.coreDir,'src/public-contract/container.js'));
const password=Buffer.from('current-declaration-proof-synthetic');

for(const profile of ['account','org'])test('current '+profile+' external declaration produces issues and admits a real bound grant',async()=>{
 const a=asset(),crypto=H.crypto,root=crypto.randomBytes(32),signer=crypto.generateKeyPairSync('ed25519'),agreement=crypto.generateKeyPairSync('x25519'),signing=crypto.generateKeyPairSync('ed25519');
 const output=await core.protectSourceBytes(F.encode(a,req),{kind:'external-grant',asset_uid:a.manifest.asset_uid,entitlement:{profile,offline:true,revocable:false},key_ref:'key:profile',issuer_key_id:'root:profile',checksums:true,signature:'none'},{issuerRootKey:root});
 assert.equal(output.status,'produced',JSON.stringify(output));
 const expected={issuer:'issuer:profile',signing_key_id:'signer:profile',issuer_public_key:'ed25519:'+signer.publicKey.export({format:'jwk'}).x,account_id:'account:profile',entitlement_id:'entitlement:profile',entitlement_profile:profile,device_id:'device:profile',device_agreement_public_key:'x25519:'+agreement.publicKey.export({format:'jwk'}).x,device_signing_public_key:'ed25519:'+signing.publicKey.export({format:'jwk'}).x};
 const {issuer_public_key,...coordinates}=expected;
 const issued=await req('@aikdna/kdna-core/key-grant-issuer-node').issueExternalKeyGrantForAsset(output.bytes,{...coordinates,grant_id:'grant:profile',status:'active',status_version:1,issued_at_ms:900,refresh_after_ms:1500,offline_grace_until_ms:1800,expires_at_ms:2000,timeout_ms:10000},{issuerRootKey:root,issuerSigningPrivateKeyPkcs8:signer.privateKey.export({format:'der',type:'pkcs8'}),signaturePolicy:policy});
 assert.equal(issued.status,'issued',JSON.stringify(issued));assert.equal(issued.admission.status,'accepted');
 let advances=0;
 const provider={kind:'external',clock:()=>1000,capabilities:{offline:true,status_refresh:false,revocation:false},async readAdvance(input){advances++;return {scope:input.scope,highest_status_version:input.verified.status_version,status:input.verified.status,last_trusted_time_ms:input.verified.observed_at_ms,revision:advances};}};
 const accepted=await core.admitProtectedNode(output.bytes,{credential:{kind:'external-grant',grantBytes:issued.grantBytes,deviceAgreementPrivateKeyPkcs8:agreement.privateKey.export({format:'der',type:'pkcs8'}),mode:'offline',expected},signaturePolicy:policy},provider);
 assert.equal(accepted.status,'accepted',JSON.stringify(accepted));assert.equal(accepted.receipt.A,output.evidence.output.A);assert.equal(accepted.receipt.authorization.kind,'external_grant');assert.ok(advances>0);
 const manifest=JSON.parse(Buffer.from(parseContainer(output.bytes)['kdna.json']));assert.equal(manifest.entitlement.profile,profile);assert.equal(manifest.encryption.profile,'kdna.envelope.external-grant');core.disposeProtectionOperation(accepted.operation);
});

test('current valid encrypted declaration and individual cross-field refusals precede credential or plaintext work',async()=>{
 const a=asset(),produced=await core.protectSourceBytes(F.encode(a,req),{kind:'password',asset_uid:a.manifest.asset_uid,entitlement:{profile:'password'},slots:[{slot:'one',kdf_profile:'scrypt-sha256'}],checksums:false,signature:'none'},{passwords:[{slot:'one',password}]});
 assert.equal(produced.status,'produced',JSON.stringify(produced));
 const options={credential:{kind:'password',password},signaturePolicy:policy};
 const good=await core.admitProtectedNode(produced.bytes,options,{kind:'local',clock:()=>1000});
 assert.equal(good.status,'accepted');core.disposeProtectionOperation(good.operation);
 const entries=parseContainer(produced.bytes),original=JSON.parse(Buffer.from(entries['kdna.json']));
 for(const [name,edit,code] of [
  ['absent entitlement',m=>delete m.entitlement,'PROTECTION_DECLARATION_INVALID'],
  ['unlicensed access',m=>m.access='public','PROTECTION_DECLARATION_INVALID'],
  ['plaintext marker',m=>m.payload.encrypted=false,'PROTECTION_DECLARATION_INVALID'],
  ['account with password envelope',m=>m.entitlement.profile='account','PROTECTION_DECLARATION_INVALID'],
  ['org with password envelope',m=>m.entitlement.profile='org','PROTECTION_DECLARATION_INVALID'],
  ['password with external envelope',m=>m.encryption.profile='kdna.envelope.external-grant','PROTECTION_DECLARATION_INVALID'],
  ['unsupported profile',m=>m.encryption.profile='kdna.envelope.unsupported','PROTECTION_PROFILE_UNSUPPORTED'],
  ['unsupported profile version',m=>m.encryption.profile_version='0.2.0','PROTECTION_PROFILE_UNSUPPORTED']
 ]){
  const changed=structuredClone(original);edit(changed);let clocks=0;
  const bytes=F.zip({...entries,'kdna.json':Buffer.from(JSON.stringify(changed))});
  const got=await core.admitProtectedNode(bytes,options,{kind:'local',clock(){clocks++;return 1000;}});
  assert.equal(got.status,'protection_failed',name+JSON.stringify(got));assert.equal(got.diagnostic.code,code,name);assert.equal(got.diagnostic.stage,'declaration',name);
  assert.deepEqual(Object.keys(got).sort(),['diagnostic','status'],name);assert.equal(clocks,0,name);
  assert.equal(req('@aikdna/kdna-core').admitBytes(bytes).reason,'READ_CORE_CAPABILITY_UNAVAILABLE',name);
 }
 // The absent encryption member is an earlier Manifest schema requirement.
 // Preserve that exact precedence instead of attributing it to declaration code.
 for(const [edit,field] of [[m=>delete m.encryption,'/manifest/encryption'],[m=>m.encryption.encrypted_entries=['other.bin'],'/manifest/encryption/encrypted_entries/0']]){
  const changed=structuredClone(original);edit(changed);
  const absent=await core.admitProtectedNode(F.zip({...entries,'kdna.json':Buffer.from(JSON.stringify(changed))}),options,{kind:'local',clock:()=>{throw Error('unreachable');}});
  assert.equal(absent.status,'core_rejected');assert.equal(absent.stage,'manifest');assert.equal(absent.core.reason,'READ_CORE_INVALID');assert.equal(absent.core.diagnostics[0].field,field);
 }
});

test('opaque protection operations cannot cross an independently loaded package instance',async()=>{
 let clocks=0;const f=await local({clock(){clocks++;return 1000;}}),original=core.bindProtectionOperation(f.operation);
 assert.equal(original.status,'bound');const checkpoint=await original.binding.observe('projection');assert.equal(checkpoint.status,'current');
 // Place the copy beneath the current runtime so its real transitive dependencies
 // resolve exactly as the original does; only the Core module instance differs.
 const runtime=process.env.KDNA_PUBLIC_RUNTIME??path.resolve(H.coreDir,'../..');
 const temp=fs.mkdtempSync(path.join(runtime,'protection-instance-'));
 try{
  const copied=path.join(temp,'node_modules/@aikdna/kdna-core');fs.mkdirSync(path.dirname(copied),{recursive:true});fs.cpSync(H.coreDir,copied,{recursive:true});
  const foreign=createRequire(path.join(temp,'entry.cjs'))('@aikdna/kdna-core/protection-node');assert.notEqual(foreign,core);
  const before=clocks,refused=foreign.bindProtectionOperation(f.operation);
  assert.equal(refused.status,'protection_failed');assert.equal(refused.diagnostic.code,'PROTECTION_OPERATION_UNTRUSTED');assert.deepEqual(Object.keys(refused).sort(),['diagnostic','status']);assert.equal(clocks,before);
  foreign.disposeProtectionOperation(f.operation);assert.equal(clocks,before);
  assert.equal(original.binding.assertCurrent(checkpoint.checkpoint).status,'current');
  const copiedOperation=JSON.parse(JSON.stringify(f.operation));assert.equal(core.bindProtectionOperation(copiedOperation).diagnostic.code,'PROTECTION_OPERATION_UNTRUSTED');
  core.disposeProtectionOperation(f.operation);assert.equal(core.bindProtectionOperation(f.operation).diagnostic.code,'PROTECTION_OPERATION_DISPOSED');
 }finally{fs.rmSync(temp,{recursive:true,force:true});core.disposeProtectionOperation(f.operation);}
});

test('current-tuple later Host rejection stays a read result and cannot masquerade as request-version rejection',async()=>{
 const f=await local(),base=observer(f);let observed=0,delivered=0;
 const host=read.createTrustedProtectedHostReadProvider({observe(input){observed++;return {...base(input),scope:[]};},deliver(){delivered++;return true;}});
 const later=await read.readProtectedNode(f.operation,F.candidate(tuple,f.asset),control(),host);
 assert.equal(later.status,'read_result');assert.equal(later.result.envelope.status,'rejected');assert.equal(later.result.envelope.content,null);assert.ok(observed>0);assert.equal(delivered,0);assert.ok(later.receipt);
 assert.notEqual(later.result.envelope.diagnostics[0].stage,'version');
 const before=observed,version=await read.readProtectedNode({}, {...F.candidate(tuple,f.asset),tuple:{...tuple,core:'999'}},control(),host);
 assert.equal(version.status,'request_failed');assert.equal(version.result.envelope.diagnostics[0].stage,'version');assert.equal(observed,before);assert.equal(Object.hasOwn(version,'receipt'),false);
 core.disposeProtectionOperation(f.operation);
});

test('pure inspection projection and execution objects perform no provider I/O and cannot renew expired authority',async()=>{
 const f=await H.external();core.disposeProtectionOperation(f.operation);
 const calls={clock:0,store:0,refresh:0},provider={...f.provider,
  clock(){calls.clock++;return f.provider.clock();},
  async readAdvance(input){calls.store++;return f.provider.readAdvance(input);},
  async refresh(input){calls.refresh++;return f.provider.refresh(input);}
 };
 const admitted=await core.admitProtectedNode(f.bytes,{credential:f.credential,signaturePolicy:policy},provider);assert.equal(admitted.status,'accepted');
 const prior={...calls},copied=structuredClone(admitted.snapshot.ir);f.state.now=2000;
 assert.ok(H.boundary.inspectSnapshot(admitted.snapshot));
 const ordinary=req('@aikdna/kdna-read'),request=ordinary.admitReadRequest(F.candidate(tuple,f.asset,'catalog'),control());assert.equal(request.channel,'admitted_request');
 assert.equal(ordinary.project(request.admitted_request,admitted.snapshot).status,'projected');
 const E=req('@aikdna/kdna-core/execution'),selection=admitted.snapshot.ir.mandatory_closures[0].selection;
 const planned=E.createConsumptionPlan(admitted.snapshot,{plan_id:'plan:pure',intent:{task:'Use the explicit selection.',use:'reasoning_support'},selection,budget:{capsule_bytes:1000000,output_bytes:1000,response_bytes:100000,trace_events:6}});assert.equal(planned.status,'admitted');
 const capsule=E.createRuntimeCapsule(admitted.snapshot,planned.plan);assert.equal(capsule.status,'admitted');
 assert.equal(E.createAgentHostRequest(planned.plan,capsule.capsule,{request_id:'request:pure',run_id:'run:pure',host_id:'host:pure',host_epoch:'epoch:pure'}).status,'admitted');
 assert.deepEqual(calls,prior);
 const checked=await core.bindProtectionOperation(admitted.operation).binding.observe('projection');assert.equal(checked.diagnostic.code,'PROTECTION_AUTHORIZATION_EXPIRED');assert.equal(checked.checked_at_ms,2000);assert.ok(calls.clock>prior.clock);assert.ok(calls.store>prior.store);
 core.disposeProtectionOperation(admitted.operation);assert.equal(H.boundary.inspectSnapshot(admitted.snapshot),null);assert.ok(copied.nodes.length>0);assert.equal(E.inspectAdmittedPlan(planned.plan),null);
});

test('revocation after an acknowledged commit preserves confirmed history and never invokes the transport twice',async()=>{
 const f=await H.external(),observe=observer(f);let retained,committed,sends=0,serializedBytes=0;
 const transport={observeScope:observe,commit(value){sends++;serializedBytes+=Buffer.byteLength(JSON.stringify(value));f.state.version=2;f.state.status='revoked';return true;}};
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){retained=token;committed=await read.commitProtectedTransport(f.operation,token,transport);return true;}});
 const got=await read.readProtectedNode(f.operation,F.candidate(tuple,f.asset),control(),host);
 assert.equal(got.status,'protection_failed');assert.equal(got.diagnostic.code,'PROTECTION_AUTHORIZATION_REVOKED');assert.equal(got.body,null);assert.equal(got.body_bytes,0);assert.equal(got.disclosure.external_commit.state,'confirmed');assert.ok(serializedBytes>0);assert.equal(sends,1);
 assert.deepEqual(got.disclosure,committed.disclosure);
 const repeated=await read.commitProtectedTransport(f.operation,retained,transport);assert.equal(repeated.status,'delivery_failed');assert.deepEqual(repeated.disclosure,got.disclosure);assert.equal(sends,1);core.disposeProtectionOperation(f.operation);
});

test('actual encryption changes C and refreshes both existing content digest fields to independently recomputed C',async()=>{
 const author=req('@aikdna/kdna-core/authoring-node'),a=asset(),bytes=F.encode(a,req),ordinary=req('@aikdna/kdna-core').admitBytes(bytes);assert.equal(ordinary.status,'accepted');
 const opened=author.openSourceBytes(bytes);assert.equal(opened.status,'accepted');
 const manifest=structuredClone(opened.source.manifest);manifest.content_digest=ordinary.snapshot.digests.C.observed;manifest.authoring={content_digest:ordinary.snapshot.digests.C.observed};
 const packed=author.packSourceBytes(bytes,{manifest});assert.equal(packed.status,'accepted');
 const before=req('@aikdna/kdna-core').admitBytes(packed.bytes);assert.equal(before.status,'accepted');
 const oldC=before.snapshot.digests.C.observed,inputManifest=JSON.parse(Buffer.from(parseContainer(packed.bytes)['kdna.json']));assert.equal(inputManifest.content_digest,oldC);assert.equal(inputManifest.authoring.content_digest,oldC);
 const output=await core.protectSourceBytes(packed.bytes,{kind:'password',asset_uid:a.manifest.asset_uid,entitlement:{profile:'password'},slots:[{slot:'one',kdf_profile:'scrypt-sha256'}],checksums:true,signature:'none'},{passwords:[{slot:'one',password}]});assert.equal(output.status,'produced',JSON.stringify(output));
 const entries=parseContainer(output.bytes),{digest,contentTreePreimage}=require(path.join(H.coreDir,'src/public-contract/digests.js')),independentC=digest(contentTreePreimage(entries)),encryptedManifest=JSON.parse(Buffer.from(entries['kdna.json']));
 assert.notEqual(independentC,oldC,'fixture must change the content domain, not merely add excluded checksums');
 assert.equal(encryptedManifest.content_digest,independentC);assert.equal(encryptedManifest.authoring.content_digest,independentC);assert.equal(output.evidence.output.C,independentC);
 const admitted=await core.admitProtectedNode(output.bytes,{credential:{kind:'password',password},signaturePolicy:policy},{kind:'local',clock:()=>1000});assert.equal(admitted.status,'accepted',JSON.stringify(admitted));assert.equal(admitted.receipt.C,independentC);core.disposeProtectionOperation(admitted.operation);
});

for(const fault of ['none','expired','revoked','action-denied','expired-during-delivery'])test('trusted protected action adapter '+fault+' checks current operation and independent Host policy before outcome',async()=>{
 const f=await H.external(),E=req('@aikdna/kdna-core/execution'),binding=core.bindProtectionOperation(f.operation).binding;
 const plan=E.createConsumptionPlan(f.snapshot,{plan_id:'plan:action',intent:{task:'Apply the explicit selection to a synthetic local task.',use:'reasoning_support'},selection:f.snapshot.ir.mandatory_closures[0].selection,budget:{capsule_bytes:1000000,output_bytes:1000,response_bytes:100000,trace_events:6}});assert.equal(plan.status,'admitted');
 const capsule=E.createRuntimeCapsule(f.snapshot,plan.plan);assert.equal(capsule.status,'admitted');
 const request=E.createAgentHostRequest(plan.plan,capsule.capsule,{request_id:'request:action',run_id:'run:action',host_id:'host:action',host_epoch:'epoch:action'});assert.equal(request.status,'admitted');
 if(fault==='expired')f.state.now=2000;
 if(fault==='revoked'){f.state.version=2;f.state.status='revoked';}
 let outcomes=0,policyCalls=0,deliveryCalls=0,lastProtection=null;
 // This trusted adapter supplies the documented Host obligation. The generic
 // synchronous ExecutionHost does not infer a grant policy from a JSON receipt.
 const observation=await binding.observe('execution');let result;
 if(observation.status!=='current')result=observation;
 else {
  const ready=E.createExecutionHost({host_id:'host:action',host_epoch:'epoch:action',clock:()=>f.state.now,
   authorize(input){policyCalls++;lastProtection=binding.assertCurrent(observation.checkpoint);return {decision:lastProtection.status==='current'&&fault!=='action-denied'?'allow':'deny',authorization_id:'authorization:action',request_digest:input.request_digest,host_id:'host:action',host_epoch:'epoch:action',issued_at:900,expires_at:3000};},
   observeDelivery(input){deliveryCalls++;if(fault==='expired-during-delivery')f.state.now=2000;return {delivery_id:'delivery:action',request_digest:input.request_digest,producer_digest:input.request.capsule_digest,delivery_digest:input.request.capsule_digest};},
   observeOutcome(){outcomes++;return {observation_id:'outcome:action',status:'completed',output:'Applied the selected judgment in this bounded synthetic task.'};}
  });assert.equal(ready.status,'ready');result=ready.host.consume(request.request);
 }
 if(fault==='none'){assert.equal(result.status,'completed',JSON.stringify(result));assert.equal(outcomes,1);assert.equal(policyCalls,2);assert.equal(deliveryCalls,1);assert.equal(result.body.receipt.status,'completed');}
 else {
  assert.equal(outcomes,0);assert.equal(result.body?.output??null,null);
  if(['expired','revoked'].includes(fault)){assert.equal(result.status,'protection_failed');assert.equal(result.diagnostic.code,fault==='expired'?'PROTECTION_AUTHORIZATION_EXPIRED':'PROTECTION_AUTHORIZATION_REVOKED');assert.equal(policyCalls,0);assert.equal(deliveryCalls,0);}
  else {assert.equal(result.status,'denied',JSON.stringify(result));assert.equal(result.body.receipt.failure,'EXECUTION_HOST_DENIED');assert.equal(policyCalls,1);assert.equal(deliveryCalls,1);if(fault==='expired-during-delivery')assert.equal(lastProtection.diagnostic.code,'PROTECTION_AUTHORIZATION_EXPIRED');else assert.equal(lastProtection.status,'current');}
 }
 core.disposeProtectionOperation(f.operation);
});
