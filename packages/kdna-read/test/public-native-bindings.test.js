'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const N=require('../../kdna-core/test/native-binding-test-model.js'),H=require('../../kdna-core/test/protection-test-helpers.js'),{F}=N;
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const C=req('@aikdna/kdna-core'),B=req('@aikdna/kdna-core/read-boundary'),R=req('@aikdna/kdna-read/node'),Browser=req('@aikdna/kdna-read/browser'),Embed=req('@aikdna/kdna-read/embedding'),E=req('@aikdna/kdna-core/execution'),P=req('@aikdna/kdna-core/package-set-node'),PS=req('@aikdna/kdna-read/package-set-node');
const {versionTuple:tuple}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
const control=()=>Embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000}));
const request=(a,mode='exact_selection')=>F.candidate(tuple,a,mode,'j:0',1000000);
function observe(filter=ids=>ids){return({snapshot,request})=>{const v=B.inspectSnapshot(snapshot);return {host_id:'native-host',host_epoch:'native-epoch',decision_id:'native-decision',request_id:request.request_id,snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:filter(v.ir.nodes.map(n=>n.id),v),issued_at:900,expires_at:2000,current_ms:1000,decision:'allow',policy_id:'native-policy'};};}
function host(filter){return Embed.createTrustedHostReadProvider({observe:observe(filter)});}
function ready(x){assert.equal(x.envelope?.status,'ready',JSON.stringify(x));return x.envelope.content;}
function complete(content){for(const kind of ['exception','boundary','condition','actor'])assert.ok(content.closure.some(n=>n.target.kind===kind),kind);assert.equal(new Set(content.closure.map(n=>n.id)).size,content.closure.length);}
test('native four Read modes preserve authorized roles, component expansion closure and Node/browser equivalence',async()=>{
 const a=N.recursion(tuple),bytes=F.encode(a,req),admit=C.admitBytes(bytes);assert.equal(admit.status,'accepted');let denySupport=false;const h=host((ids,v)=>denySupport?ids.filter(id=>!v.ir.nodes.some(n=>n.id===id&&n.target.kind==='actor')):ids);
 for(const mode of ['catalog','whole_asset','exact_selection']){
  const x=await R.readNode(bytes,request(a,mode),control(),h),y=await Browser.readBrowser(admit.snapshot,request(a,mode),control(),host());const c=ready(x);ready(y);
  assert.deepEqual(c.closure,y.envelope.content.closure);
  if(mode==='exact_selection'){complete(c);assert.deepEqual(c.closure.find(n=>n.target.kind==='judgment').value.method.bindings,a.payload.judgments[0].method.bindings);}
  if(mode==='catalog'){assert.equal(c.closure.length,0);assert.equal(c.catalog.length,3);}
 }
 const whole=ready(await Browser.readBrowser(admit.snapshot,request(a,'whole_asset'),control(),h));
 const item=whole.asset_index.find(x=>x.target.kind==='component'&&x.target.id==='component:0');assert.ok(item);const handle=whole.expansion_handles.find(x=>x.handle_id===item.handle_id);assert.deepEqual(handle.anchor,{kind:'asset'});
 const expanded=ready(await Browser.readBrowser(admit.snapshot,{...request(a,'whole_asset'),mode:'expand',handle},control(),h));complete(expanded);assert.equal(expanded.selected,null);
 assert.ok(expanded.closure.some(n=>n.target.kind==='component'&&n.target.id==='component:0'));
 denySupport=true;const denied=await Browser.readBrowser(admit.snapshot,{...request(a,'whole_asset'),mode:'expand',handle},control(),h);assert.equal(denied.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');assert.equal(denied.envelope.content,null);denySupport=false;
 const selected=ready(await R.readNode(bytes,request(a),control(),h));const view=B.inspectSnapshot(admit.snapshot),p=E.createConsumptionPlan(admit.snapshot,{plan_id:'native',intent:{task:'Static delivery.',use:'reasoning_support'},selection:view.ir.mandatory_closures[0].selection,budget:{capsule_bytes:1000000,output_bytes:1000,response_bytes:1000000,trace_events:10}});assert.equal(p.status,'admitted');const cap=E.createRuntimeCapsule(admit.snapshot,p.plan);assert.equal(cap.status,'admitted');assert.deepEqual(E.inspectRuntimeCapsule(cap.capsule).closure,selected.closure);assert.equal(E.executionDigest(selected.closure).digest,E.inspectAdmittedPlan(p.plan).closure_digest);
});
test('native required support denial and insufficient complete budget reject rather than truncate or disclose',async()=>{
 const a=N.recursion(tuple),bytes=F.encode(a,req);const positive=ready(await R.readNode(bytes,request(a),control(),host()));complete(positive);
 for(const kind of ['exception','boundary','condition','actor']){
  const x=await R.readNode(bytes,request(a),control(),host((ids,v)=>ids.filter(id=>!v.ir.nodes.some(n=>n.id===id&&n.target.kind===kind))));assert.equal(x.envelope.status,'rejected');assert.equal(x.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');assert.equal(x.envelope.content,null);assert.equal(x.envelope.asset,null);
 }
 const limited={...request(a),budget_bytes:1500},x=await R.readNode(bytes,limited,control(),host());assert.equal(x.envelope.status,'rejected');assert.equal(x.envelope.diagnostics[0].code,'READ_BUDGET_INSUFFICIENT');assert.equal(x.envelope.content,null);
});
for(const kind of ['local','external'])test('native '+kind+' protected Read commits the full recursively supported body',async()=>{
 const a=N.recursion(tuple),f=await H[kind]({asset:a}),observer=H.observer(f);let wire,calls=0,committed;
 const h=H.read.createTrustedProtectedHostReadProvider({observe:observer,async deliver(result,token){committed=await H.read.commitProtectedTransport(f.operation,token,{observeScope:observer,commit(value){calls++;wire=value;return true;}});return true;}});
 try{const x=await H.read.readProtectedNode(f.operation,request(a),H.control(),h);assert.equal(x.status,'read_result',JSON.stringify(x));complete(ready(x.result));assert.equal(committed.status,'committed');assert.equal(calls,1);assert.deepEqual(wire,x.result);}finally{H.core.disposeProtectionOperation(f.operation);}
});
test('native PackageSet delivers full support and seals that same closure against the real Plan',async()=>{
 const a=N.recursion(tuple),bytes=F.encode(a,req),admit=C.admitBytes(bytes),v=B.inspectSnapshot(admit.snapshot),member={member_id:'member:native',asset_id:v.asset.asset_id,asset_version:v.asset.asset_version,A:v.digests.A.observed},selection=v.ir.mandatory_closures[0].selection;
 const set={set_id:'set:native',members:[member],selection},host_id='native-host',host_epoch='native-epoch';let calls=0;
 const provider=P.createTrustedPackageSetMemberProvider({host_id,host_epoch,observe(){return {decisions:[{...member,decision:'allow',decision_id:'native-decision',host_id,host_epoch,issued_at:900,expires_at:2000,current_ms:1000}]};}});
 const rp=PS.createTrustedPackageReadProvider({host_id,host_epoch,members:provider,observeRead:observe(),sink(){calls++;return true;}});
 const x=await PS.readPackageSetNode({set,tuple,members:[{member_id:member.member_id,bytes}],operation:'isolated_read',limits:{maxMembers:10,maxTotalSourceBytes:10485760},request:request(a)},control(),rp);assert.equal(x.local_failure,null,JSON.stringify(x));complete(ready(x.readResult));assert.equal(calls,1);
 const plan=E.createConsumptionPlan(admit.snapshot,{plan_id:'native',intent:{task:'Static delivery.',use:'reasoning_support'},selection,budget:{capsule_bytes:1000000,output_bytes:1000,response_bytes:1000000,trace_events:10}});assert.equal(plan.status,'admitted');const sealed=PS.sealPackageSetHandoff(x.delivered,plan.plan);assert.equal(sealed.status,'valid',JSON.stringify(sealed));assert.equal(sealed.value.closure_digest,E.executionDigest(x.readResult.envelope.content.closure).digest);
});

test('RC7 complete RC6 tuple is unsupported, partial mixed tuple rejects before Core and Host',async()=>{
 const a=N.recursion(tuple),bytes=F.encode(a,req),previous={container:'0.5.0',payload_profile:'kdna.payload.judgment',payload_version:'0.5.0',core:'kdna.core/0.8.1',ir:'kdna.canonical-ir/0.6.0',runtime:'kdna.runtime-capsule/0.3.0',plan:'kdna.consumption-plan/0.3.0',host:'kdna.agent-host/0.3.0',trace:'kdna.judgment-trace/0.3.0',read:'kdna.read/0.6.3'};let calls=0;
 const forbidden=Embed.createTrustedHostReadProvider({observe(){calls++;throw Error('must not observe Host');}});
 for(const [value,code]of [[previous,'READ_UNSUPPORTED_VERSION'],[{...tuple,read:previous.read},'READ_MIXED_VERSION_TUPLE']]){
  const x=await R.readNode(bytes,{...request(a),tuple:value},control(),forbidden);assert.equal(x.envelope.status,'rejected');assert.equal(x.envelope.diagnostics[0].code,code);assert.equal(x.envelope.content,null);
 }assert.equal(calls,0);
});
