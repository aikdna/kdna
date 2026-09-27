'use strict';
const test=require('node:test'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const H=require('../../kdna-core/test/protection-test-helpers.js');const {assert,core,read,F,tuple,local,external,observer,control}=H;
const request=f=>F.candidate(tuple,f.asset);
function sink(){const dir=fs.mkdtempSync(path.join(process.env.KDNA_PROTECTION_ARTIFACT_ROOT??os.tmpdir(),'protected-sink-')),file=path.join(dir,'sink.bin');fs.writeFileSync(file,Buffer.alloc(0));let count=0;return {write(result){fs.appendFileSync(file,Buffer.from(JSON.stringify(result)));count++;return true;},get bytes(){return fs.statSync(file).size;},get calls(){return count;}};}
test('C21 confirmed physical sink remains recorded when outer Host throws',async()=>{
 const f=await local(),observe=observer(f),out=sink();let commit;
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){commit=await read.commitProtectedTransport(f.operation,token,{observeScope:observe,commit:out.write});throw Error('synthetic after send');}});
 const got=await read.readProtectedNode(f.operation,request(f),control(),host);
 assert.equal(commit.status,'committed');assert.ok(out.bytes>0);assert.equal(out.calls,1);assert.equal(got.status,'delivery_failed');assert.equal(got.body,null);assert.equal(got.body_bytes,0);assert.deepEqual(got.disclosure,commit.disclosure);
 assert.equal(commit.committed_at_ms,commit.disclosure.external_commit.confirmed_at_ms);
});
for(const outcome of ['false','throw','promise','rejected-promise','thenable'])test('C22/C23 send followed by '+outcome+' retains unknown and never retries',async()=>{
 const f=await local(),observe=observer(f),out=sink();let retained,first;
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){retained=token;first=await read.commitProtectedTransport(f.operation,token,{observeScope:observe,commit(value){out.write(value);if(outcome==='throw')throw Error();return outcome==='promise'?Promise.resolve(true):outcome==='rejected-promise'?Promise.reject(Error('later rejection')):outcome==='thenable'?{then(){throw Error('must not run');}}:false;}});return true;}});
 const got=await read.readProtectedNode(f.operation,request(f),control(),host);
 assert.equal(got.status,'delivery_failed');assert.equal(got.disclosure.external_commit.state,'outcome_unknown');assert.ok(out.bytes>0);
 const repeated=await read.commitProtectedTransport(f.operation,retained,{observeScope:observe,commit:out.write});assert.equal(out.calls,1);assert.deepEqual(repeated.disclosure,first.disclosure);assert.equal(got.body_bytes,0);
});
test('A07 saved unused token closes on outer true; later commit sends zero bytes',async()=>{
 const f=await local(),observe=observer(f),out=sink();let retained;
 const host=read.createTrustedProtectedHostReadProvider({observe,deliver(result,token){retained=token;return true;}});
 const got=await read.readProtectedNode(f.operation,request(f),control(),host);assert.equal(got.status,'read_result');
 const late=await read.commitProtectedTransport(f.operation,retained,{observeScope:observe,commit:out.write});assert.equal(late.status,'delivery_failed');assert.equal(out.bytes,0);assert.equal(late.disclosure.external_commit.state,'not_invoked');
});
for(const ending of ['resolve','reject','dispose','revoke'])test('A08 unawaited reserved commit and late '+ending+' return failure, no usable handle and zero sink bytes',async()=>{
 const f=await external(),observe=observer(f),out=sink();let pending,release,handle;
 const host=read.createTrustedProtectedHostReadProvider({observe,deliver(result,token){handle=result.envelope.content.expansion_handles[0];f.state.readAdvance=input=>new Promise((resolve,reject)=>{release=()=>ending==='reject'?reject(Error('late')):resolve({scope:input.scope,highest_status_version:ending==='revoke'?2:1,status:ending==='revoke'?'revoked':'active',last_trusted_time_ms:input.verified.observed_at_ms,revision:999});});pending=read.commitProtectedTransport(f.operation,token,{observeScope:observe,commit:out.write});return true;}});
 const got=await read.readProtectedNode(f.operation,request(f),control(),host);assert.equal(got.status,'delivery_failed');assert.equal(got.body_bytes,0);assert.equal(out.bytes,0);
 if(ending==='dispose')core.disposeProtectionOperation(f.operation);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof release,'function');release();await pending;assert.equal(out.bytes,0);
 if(ending!=='dispose'&&ending!=='revoke') {f.state.readAdvance=null;const next=await read.readProtectedNode(f.operation,{...request(f),mode:'expand',handle},control(),host);assert.notEqual(next.result?.envelope?.status,'ready');}
});
test('clock reentry disposal after synchronous callback rechecks generation',async()=>{
 let operation,armed=false;const f=await local({clock(){if(armed)core.disposeProtectionOperation(operation);return 1000;}});operation=f.operation;
 const binding=core.bindProtectionOperation(operation).binding,observed=await binding.observe('projection');armed=true;
 const result=binding.assertCurrent(observed.checkpoint);assert.equal(result.status,'protection_failed');assert.equal(result.diagnostic.code,'PROTECTION_OPERATION_DISPOSED');
});
test('scope filtering that returns true still refuses original prepared bytes; a new catalog Read fails closed until scope is restored',async()=>{
 const f=await local(),observe=observer(f),out=sink();let omit=null;
 const restricted=observer(f,(ids)=>ids.filter(id=>id!==omit));
 const host=read.createTrustedProtectedHostReadProvider({observe:restricted,async deliver(result,token){omit=result.envelope.content.catalog.find(x=>x.judgment_id==='j:1')?.node_ref??null;assert.ok(omit);await read.commitProtectedTransport(f.operation,token,{observeScope:restricted,commit:out.write});return true;}});
 const got=await read.readProtectedNode(f.operation,F.candidate(tuple,f.asset,'catalog'),control(),host);assert.equal(got.status,'delivery_failed');assert.equal(out.bytes,0);assert.equal(got.disclosure.external_commit.state,'not_invoked');
 const nextHost=read.createTrustedProtectedHostReadProvider({observe:restricted,deliver(){return true;}}),next=await read.readProtectedNode(f.operation,F.candidate(tuple,f.asset,'catalog'),control(),nextHost);assert.equal(next.status,'read_result');assert.equal(next.result.envelope.status,'rejected');assert.equal(next.result.envelope.content,null);assert.equal(next.result.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');assert.equal(out.bytes,0);
 omit=null;const restored=await read.readProtectedNode(f.operation,F.candidate(tuple,f.asset,'catalog'),control(),nextHost);assert.equal(restored.result.envelope.status,'ready');
});
test('reentrant and concurrent commits preserve the one actual send attempt',async()=>{
 const f=await local(),observe=observer(f),out=sink();let nested,first,repeated;
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){const transport={observeScope:observe,commit(value){out.write(value);nested=read.commitProtectedTransport(f.operation,token,transport);return true;}};const promise=read.commitProtectedTransport(f.operation,token,transport);repeated=await read.commitProtectedTransport(f.operation,token,transport);first=await promise;await nested;return true;}});
 const got=await read.readProtectedNode(f.operation,request(f),control(),host);assert.equal(got.status,'read_result');assert.equal(first.status,'committed');assert.equal(repeated.status,'delivery_failed');assert.equal(out.calls,1);
});
test('acknowledgement plus post-send clock failure retains confirmed with null time',async()=>{
 let broken=false;const f=await local({clock(){if(broken)throw Error();return 1000;}}),observe=observer(f),out=sink();
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){await read.commitProtectedTransport(f.operation,token,{observeScope:observe,commit(value){out.write(value);broken=true;return true;}});return true;}});
 const got=await read.readProtectedNode(f.operation,request(f),control(),host);assert.equal(got.status,'delivery_failed');assert.equal(got.disclosure.external_commit.state,'confirmed');assert.equal(got.disclosure.external_commit.confirmed_at_ms,null);assert.ok(out.bytes>0);
});
test('acknowledged actual send crossing expiry retains known 2000 observation with body-free failure',async()=>{
 const f=await external(),out=sink();let committed,retained;
 f.state.now=1999;f.credential.mode='offline';f.credential.grantBytes=Buffer.from(JSON.stringify(f.grant({refreshAfter:new Date(2000),offlineGraceUntil:new Date(2000),expiresAt:new Date(2000)})));
 const admitted=await core.admitProtectedNode(f.bytes,{credential:f.credential,signaturePolicy:H.policy},f.provider);assert.equal(admitted.status,'accepted');f.operation=admitted.operation;f.snapshot=admitted.snapshot;
 const base=observer(f),observe=input=>({...base(input),issued_at:1900,expires_at:2900,current_ms:f.state.now});
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){retained=token;committed=await read.commitProtectedTransport(f.operation,token,{observeScope:observe,commit(value){out.write(value);f.state.now=2000;return true;}});return true;}});
 const got=await read.readProtectedNode(f.operation,request(f),control(),host);assert.equal(committed.status,'protection_failed');assert.equal(committed.diagnostic.code,'PROTECTION_AUTHORIZATION_EXPIRED');assert.equal(committed.disclosure.external_commit.attempted_at_ms,1999);assert.equal(committed.disclosure.external_commit.confirmed_at_ms,2000);assert.equal(Object.hasOwn(committed,'checked_at_ms'),false);assert.ok(out.bytes>0);assert.equal(got.body,null);assert.equal(got.body_bytes,0);assert.deepEqual(got.disclosure,committed.disclosure);
 const repeat=await read.commitProtectedTransport(f.operation,retained,{observeScope:observe,commit:out.write});assert.deepEqual(repeat.disclosure,got.disclosure);assert.equal(out.calls,1);
});
for(const ending of ['resolve','reject'])test('unawaited pending scope '+ending+' cannot send after outer settle',async()=>{
 const f=await local(),observe=observer(f),out=sink();let pending,release;
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){pending=read.commitProtectedTransport(f.operation,token,{observeScope:input=>new Promise((resolve,reject)=>{release=()=>ending==='reject'?reject(Error('late scope')):resolve(observe(input));}),commit:out.write});while(!release)await new Promise(resolve=>setImmediate(resolve));return true;}});
 const got=await read.readProtectedNode(f.operation,request(f),control(),host);assert.equal(got.status,'delivery_failed');assert.equal(got.body_bytes,0);release();await pending;assert.equal(out.bytes,0);assert.equal(got.disclosure.external_commit.state,'not_invoked');
});
for(const fault of ['invalid','rollback','dispose'])test('post-ack '+fault+' preserves confirmed history with only this invocation clock sample',async()=>{
 let armed=false,operation;const f=await local({clock(){if(!armed)return 1000;if(fault==='dispose'){core.disposeProtectionOperation(operation);return 1001;}return fault==='invalid'?NaN:999;}});operation=f.operation;const observe=observer(f),out=sink();let committed;
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){committed=await read.commitProtectedTransport(operation,token,{observeScope:observe,commit(value){out.write(value);armed=true;return true;}});return true;}});
 const got=await read.readProtectedNode(operation,request(f),control(),host);assert.equal(got.status,'delivery_failed');assert.equal(committed.status,'protection_failed');assert.equal(got.disclosure.external_commit.state,'confirmed');assert.equal(got.disclosure.external_commit.confirmed_at_ms,fault==='dispose'?1001:null);assert.ok(out.bytes>0);assert.equal(Object.hasOwn(committed,'checked_at_ms'),false);assert.equal(got.body_bytes,0);
});
// Current R2 requires complete catalog/index scope. Exact selection must not
// enumerate unrelated judgments; catalog/whole_asset keep their omission batches.
for(const mode of ['exact_selection','catalog','whole_asset'])for(const withdraw of [false,true])test('r2 prepared scope '+mode+' '+(withdraw?'refuses withdrawal, fails closed, then permits restored scope':'commits unchanged full scope and original bytes'),async()=>{
 const a=F.blank(tuple,mode==='exact_selection'?3:2),f=await local({asset:a}),base=observer(f),out=sink();let omit=null,prepared,committed;
 const view=H.boundary.inspectSnapshot(f.snapshot),target=view.ir.catalog.find(x=>x.judgment_id===(mode==='exact_selection'?'j:0':'j:1')).node_ref;
 const observe=input=>{const value=base(input);return {...value,scope:value.scope.filter(id=>id!==omit)};};
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){
  prepared=result;
  if(mode==='exact_selection'){assert.deepEqual(result.envelope.content.catalog.map(x=>x.judgment_id),['j:0']);assert.equal(result.envelope.omissions.some(o=>o.field==='judgment'),false);}
  else { const rows=result.envelope.omissions.filter(o=>o.field==='judgment');assert.equal(rows.reduce((n,o)=>n+(o.count??1),0),2);if(mode==='catalog')assert.ok(rows.some(o=>o.state==='explicitly_omitted_batch'&&o.count===2));else assert.ok(rows.every(o=>o.expandable&&o.handle_id)); }
  if(withdraw)omit=target;const before=JSON.stringify(result);
  committed=await read.commitProtectedTransport(f.operation,token,{observeScope:observe,commit(value){assert.equal(JSON.stringify(value),before);return out.write(value);}});
  assert.equal(JSON.stringify(result),before);return true;
 }});
 const candidate=F.candidate(tuple,a,mode),got=await read.readProtectedNode(f.operation,candidate,control(),host);
 assert.ok(prepared);assert.equal(committed.status,withdraw?'delivery_failed':'committed');assert.equal(got.status,withdraw?'delivery_failed':'read_result');assert.equal(out.calls,withdraw?0:1);assert.equal(got.disclosure.external_commit.state,withdraw?'not_invoked':'confirmed');
 if(withdraw){
  assert.equal(got.body_bytes,0);assert.equal(out.bytes,0);let nextDeliveries=0;
  const nextHost=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){nextDeliveries++;const next=await read.commitProtectedTransport(f.operation,token,{observeScope:observe,commit:out.write});assert.equal(next.status,'committed');return true;}});
  const denied=await read.readProtectedNode(f.operation,candidate,control(),nextHost);assert.equal(denied.result.envelope.status,'rejected');assert.equal(denied.result.envelope.content,null);assert.equal(denied.result.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');assert.equal(nextDeliveries,0);assert.equal(out.calls,0);
  omit=null;const next=await read.readProtectedNode(f.operation,candidate,control(),nextHost);assert.equal(next.status,'read_result');assert.equal(next.result.envelope.status,'ready');assert.equal(out.calls,1);
 }else{assert.ok(out.bytes>0);assert.equal(got.result,prepared);}
 core.disposeProtectionOperation(f.operation);
});
for(const mode of ['catalog','exact_selection'])test('historical catalog-only input cannot prepare protected '+mode+' disclosure',async()=>{
 const a=F.blank(tuple,2);a.payload.extensions=[{id:'urn:r2:unknown',critical:true,definition:'Unknown critical fixture.',value:{kind:'text',value:'opaque'}}];
 const admitted=await core.admitProtectedNode(F.encode(a,H.req),{credential:{kind:'none'},signaturePolicy:H.policy},{kind:'local',clock:()=>1000});
 assert.equal(admitted.status,'core_rejected');assert.equal(admitted.core.reason,'READ_UNSUPPORTED_CRITICAL');assert.equal(Object.hasOwn(admitted,'operation'),false);
 let calls=0;const out=sink(),host=read.createTrustedProtectedHostReadProvider({observe(){calls++;throw Error('No admitted operation');},deliver(value){calls++;return out.write(value);}});
 const got=await read.readProtectedNode(admitted.operation,F.candidate(tuple,a,mode),control(),host);assert.equal(got.status,'admission_failed');assert.equal(calls,0);assert.equal(out.bytes,0);
});
for(const family of ['declarations','provenance','references','relationships'])test('r2 retains complete prepared '+family+' scope refusal with physical zero sink',async()=>{
 const a=F.blank(tuple,2);a.manifest.creator={kind:'agent',name:'Synthetic scope author'};a.payload.actors=[{id:'actor:r2',kind:'agent',name:'Synthetic scope actor'}];a.payload.attributions={state:'provided',value:[{role:'creator',actor_ids:['actor:r2'],statement:'Synthetic attribution claim.'}]};a.payload.shared_declarations=[{id:'worldview:scope',kind:'worldview',value:['Explicit scoped declaration.'],subject:{actor_ids:['actor:r2'],statement:'Synthetic declaration subject'},applies_to:{kind:'asset'}}];
 a.payload.relationships=[{id:'r:scope',statement:'Explicit contrast relation.',kind:{term:'conflict',vocabulary:'core'},operator:{term:'conflicts_with',vocabulary:'core'},effect:{term:'preserves_disagreement',vocabulary:'core'},direction:'undirected',participants:[{judgment_ref:'j:0',role:{term:'side_a',vocabulary:'core'}},{judgment_ref:'j:1',role:{term:'side_b',vocabulary:'core'}}]}];
 const f=await local({asset:a}),observe=observer(f),out=sink();let target,prepared,committed;
 const host=read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){prepared=result;const content=result.envelope.content;
  if(family==='declarations')target=content.declarations[0]?.id;
  if(family==='provenance')target=content.provenance.declarations[0]?.id;
  if(family==='references')target=content.references[0]?.target_node;
  if(family==='relationships')target=content.closure.find(x=>x.role==='relationship'&&x.value.id===content.relationships[0]?.id)?.id;
  if(!target)return false;
  committed=await read.commitProtectedTransport(f.operation,token,{observeScope(input){const value=observe(input);return {...value,scope:value.scope.filter(x=>x!==target)};},commit:out.write});return true;
 }});
 const candidate=F.candidate(tuple,a,['declarations','provenance'].includes(family)?'whole_asset':'exact_selection'),got=await read.readProtectedNode(f.operation,candidate,control(),host);
 assert.ok(prepared);assert.ok(target,'fixture must actually contain the withdrawn family');assert.equal(committed.status,'delivery_failed');assert.equal(got.status,'delivery_failed');assert.equal(out.bytes,0);assert.equal(got.disclosure.external_commit.state,'not_invoked');core.disposeProtectionOperation(f.operation);
});
