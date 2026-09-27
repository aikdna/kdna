'use strict';
const test=require('node:test');
const H=require('../../kdna-core/test/protection-test-helpers.js');const {assert,core,read,F,tuple,local,observer,control,boundary}=H;
test('protected Read uses real snapshot and registers handles only after current successful Host delivery',async()=>{
 const f=await local(),observe=observer(f);let disclosed=0;
 const host=read.createTrustedProtectedHostReadProvider({observe,deliver(result){disclosed++;assert.equal(result.envelope.status,'ready');return true;}});
 const request=F.candidate(tuple,f.asset),selected=await read.readProtectedNode(f.operation,request,control(),host);
 assert.equal(selected.status,'read_result',JSON.stringify(selected));assert.equal(disclosed,1);assert.equal(selected.disclosure.kind,'trusted_host');assert.equal(selected.disclosure.external_commit.state,'not_invoked');
 const handle=selected.result.envelope.content.expansion_handles[0];assert.ok(handle);
 const expanded=await read.readProtectedNode(f.operation,{...request,mode:'expand',handle},control(),host);assert.equal(expanded.result.envelope.status,'ready');
 core.disposeProtectionOperation(f.operation);assert.equal(boundary.inspectSnapshot(f.snapshot),null);
 const disposed=await read.readProtectedNode(f.operation,request,control(),host);assert.equal(disposed.status,'admission_failed');assert.equal(disclosed,2);
});
test('ordinary browser rejects genuine protected snapshots before Host; copied operations cannot bind',async()=>{
 const f=await local();let calls=0;const host=H.embed.createTrustedHostReadProvider({observe(){calls++;throw Error();}});
 const result=await H.req('@aikdna/kdna-read/browser').readBrowser(f.snapshot,F.candidate(tuple,f.asset),control(),host);
 assert.equal(result.envelope.content,null);assert.equal(calls,0);assert.equal(core.bindProtectionOperation(JSON.parse(JSON.stringify(f.operation))).status,'protection_failed');
});
test('request and version rejection precede Core operation binding and Host action',async()=>{
 const f=await local(),request=F.candidate(tuple,f.asset);let n=0;const host=read.createTrustedProtectedHostReadProvider({observe(){n++;throw Error();},deliver(){n++;return true;}});
 assert.equal((await read.readProtectedNode({}, {...request,budget_bytes:'bad'},control(),host)).status,'request_failed');
 assert.equal((await read.readProtectedNode({}, {...request,tuple:{...tuple,core:'999'}},control(),host)).status,'request_failed');assert.equal(n,0);
});
test('version-result union preserves exact original mixed and unsupported envelopes and tiny-budget control before bind or Host',async()=>{
 const f=await local(),legacy=H.req('@aikdna/kdna-read/node');let bound=0,hostCalls=0;const original=core.bindProtectionOperation;core.bindProtectionOperation=(...args)=>{bound++;return original(...args);};
 try{
  const host=read.createTrustedProtectedHostReadProvider({observe(){hostCalls++;throw Error('unreachable');},deliver(){hostCalls++;return true;}});
  for(const changedTuple of [{...tuple,core:'999'},Object.fromEntries(Object.keys(tuple).map(k=>[k,'999']))])for(const budget of [1000000,0]){
   const request={...F.candidate(tuple,f.asset),tuple:changedTuple,budget_bytes:budget};const got=await read.readProtectedNode({},request,control(),host),old=await legacy.readNode(f.bytes,request,control(),{});assert.equal(got.status,'request_failed');assert.deepEqual(got.result,old);if(budget)assert.equal(got.result.envelope.content,null);else assert.equal(got.result.channel,'no_body_control');
  }
  assert.equal(bound,0);assert.equal(hostCalls,0);
 }finally{core.bindProtectionOperation=original;}
});
for(const observation of [1,2])for(const fault of ['expiry','revocation','dispose'])test('fresh protected state after Host observation '+observation+' '+fault+' prevents handoff',async()=>{
 const f=await H.external(),base=observer(f);let observed=0,handed=0;
 const host=read.createTrustedProtectedHostReadProvider({observe(input){const answer=base(input);if(++observed===observation){if(fault==='expiry')f.state.now=2000;else if(fault==='revocation'){f.state.version=2;f.state.status='revoked';}else core.disposeProtectionOperation(f.operation);}return answer;},deliver(){handed++;return true;}});
 const got=await read.readProtectedNode(f.operation,F.candidate(tuple,f.asset),control(),host);assert.equal(got.status,'protection_failed');assert.equal(got.body_bytes,0);assert.equal(handed,0);assert.equal(got.disclosure.kind,'none');assert.equal(Object.hasOwn(got,'checked_at_ms'),false);
});
test('active grant cannot authorize denied Host closure',async()=>{
 const f=await H.external(),base=observer(f);let handed=0;const host=read.createTrustedProtectedHostReadProvider({observe(input){return {...base(input),scope:[]};},deliver(){handed++;return true;}});
 const got=await read.readProtectedNode(f.operation,F.candidate(tuple,f.asset),control(),host);assert.equal(got.result.envelope.status,'rejected');assert.equal(handed,0);
});
test('current protected catalog uses a genuine snapshot and remains operation-bound',async()=>{
 const f=await local(),base=observer(f);let observations=0,delivered=0;
 const host=read.createTrustedProtectedHostReadProvider({observe(input){assert.ok(boundary.inspectSnapshot(input.snapshot));observations++;return base(input);},deliver(result){delivered++;assert.equal(result.envelope.status,'ready');return true;}});
 const got=await read.readProtectedNode(f.operation,F.candidate(tuple,f.asset,'catalog'),control(),host);assert.equal(got.status,'read_result');assert.equal(got.result.envelope.status,'ready');assert.equal(observations,2);assert.equal(delivered,1);
 core.disposeProtectionOperation(f.operation);assert.equal((await read.readProtectedNode(f.operation,F.candidate(tuple,f.asset,'catalog'),control(),host)).status,'admission_failed');assert.equal(delivered,1);
});
test('historical unknown-critical protected catalog input refuses without an operation',async()=>{
 const a=H.asset();a.payload.extensions=[{id:'urn:test:unknown',critical:true,definition:'Unknown future semantics.',value:{kind:'text',value:'opaque'}}];
 const admitted=await core.admitProtectedNode(F.encode(a,H.req),{credential:{kind:'none'},signaturePolicy:H.policy},{kind:'local',clock:()=>1000});
 assert.equal(admitted.status,'core_rejected');assert.equal(admitted.core.reason,'READ_UNSUPPORTED_CRITICAL');assert.equal(Object.hasOwn(admitted,'operation'),false);assert.equal(Object.hasOwn(admitted,'catalog'),false);
});
for(const [label,hostTime,coreTime,expected] of [
 ['both-before-expiry',1999,1999,true],['host-at-expiry',2000,1000,false],['host-after-expiry',2001,1000,false],
 ['final-core-at-expiry',1000,2000,false],['final-core-after-expiry',1000,2001,false],['both-at-expiry',2000,2000,false]
])test('r2 outgoing handle lifetime '+label+' preserves body and publishes only a successful new preparation',async()=>{
 const fs=require('node:fs'),path=require('node:path'),os=require('node:os');let now=1000,phase='original';
 const f=await local({clock:()=>now}),base=observer(f),dir=fs.mkdtempSync(path.join(process.env.KDNA_PROTECTION_ARTIFACT_ROOT??os.tmpdir(),'r2-handles-')),file=path.join(dir,'sink.bin');fs.writeFileSync(file,Buffer.alloc(0));
 let calls=0,prepared,committed;
 const observe=input=>({...base(input),current_ms:phase==='original'?1000:2001,expires_at:phase==='original'?2000:3000});
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){
  if(phase==='original')prepared=result;
  const original=JSON.stringify(result);
  committed=await read.commitProtectedTransport(f.operation,token,{observeScope(input){const value=observe(input);if(phase==='original'){now=coreTime;return {...value,current_ms:hostTime,expires_at:3000};}return value;},commit(value){assert.equal(JSON.stringify(value),original);fs.appendFileSync(file,Buffer.from(JSON.stringify(value)));calls++;return true;}});
  assert.equal(JSON.stringify(result),original);return true;
 }});
 const candidate=F.candidate(tuple,f.asset),got=await read.readProtectedNode(f.operation,candidate,control(),host),oldHandle=prepared.envelope.content.expansion_handles[0];
 assert.ok(oldHandle);assert.equal(oldHandle.issued_at,1000);assert.equal(oldHandle.expires_at,2000);
 assert.equal(committed.status,expected?'committed':'delivery_failed');assert.equal(got.status,expected?'read_result':'delivery_failed');assert.equal(calls,expected?1:0);
 if(!expected){assert.equal(fs.statSync(file).size,0);assert.equal(got.body_bytes,0);assert.equal(got.disclosure.external_commit.state,'not_invoked');}
 phase='expand-old';now=Math.max(now,2001);
 const expanded=await read.readProtectedNode(f.operation,{...candidate,mode:'expand',handle:oldHandle},control(),host);
 if(expected){assert.equal(expanded.result.envelope.status,'rejected');assert.equal(expanded.result.envelope.diagnostics[0].code,'READ_HANDLE_EXPIRED');}
 else{assert.equal(expanded.status,'protection_failed');assert.equal(expanded.diagnostic.code,'PROTECTION_OPERATION_UNTRUSTED');assert.equal(expanded.body_bytes,0);}
 phase='new-read';const next=await read.readProtectedNode(f.operation,candidate,control(),host);
 assert.equal(next.status,'read_result');assert.equal(committed.status,'committed');const newHandle=next.result.envelope.content.expansion_handles[0];assert.ok(newHandle);assert.equal(newHandle.issued_at,2001);assert.equal(newHandle.expires_at,3000);assert.notEqual(newHandle.handle_id,oldHandle.handle_id);assert.equal(oldHandle.expires_at,2000);assert.equal(calls,expected?2:1);
 core.disposeProtectionOperation(f.operation);
});
