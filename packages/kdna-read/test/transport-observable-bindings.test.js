'use strict';
// Real public Core/Read output, real HTTP, and caller-owned pre-response bindings.
// Fixture encoding is test-only; no private runtime validator mints the result.
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),http=require('node:http'),crypto=require('node:crypto');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const tuple=require('../../../specs/public-semantic-source.json').versionTuple;
const runtime=process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..');
const {req}=F.runtime(runtime),core=req('@aikdna/kdna-core');
const {inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {readNode}=req('@aikdna/kdna-read/node'),embed=req('@aikdna/kdna-read/embedding');
const {admitReadTransportResponse}=req('@aikdna/kdna-read/transport');
const copy=x=>JSON.parse(JSON.stringify(x)),wrongDigest='sha256:'+'0'.repeat(64);
const canonical=x=>x!==null&&typeof x==='object'?(Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}'):JSON.stringify(x);
let serial=0;
async function build(kind){
  const asset=F.blank(tuple,2);
  const bytes=F.encode(asset,req),admission=core.admitBytes(bytes);
  assert.equal(admission.status,'accepted');
  const initial=inspectSnapshot(admission.snapshot);
  const request=F.candidate(copy(tuple),asset,kind==='ready'?'exact_selection':'catalog');request.request_id='request:binding:'+crypto.randomUUID();
  const control=embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:4096}));
  let observed;
  const host=embed.createTrustedHostReadProvider({observe:({request,snapshot})=>{
    observed=inspectSnapshot(snapshot)??snapshot;
    const now=Date.now();
    return {host_id:'host:binding',host_epoch:'epoch:binding',decision_id:'decision:binding',request_id:request.request_id,
      snapshot_id:observed.snapshot_id??observed.carrier_id,A:observed.digests.A.observed,C:observed.digests.C.observed,
      scope:observed.ir.nodes.map(x=>x.id),
      issued_at:now-1000,expires_at:now+60000,current_ms:now,decision:kind==='rejected'?'deny':'allow',policy_id:'policy:binding'};
  }});
  const output=await readNode(bytes,request,control,host);
  assert.equal(output.channel,'read_envelope');assert.equal(output.envelope.status,kind==='rejected'?'rejected':'ready');
  assert.ok(observed);assert.deepEqual(observed.asset,initial.asset);assert.deepEqual(observed.digests,initial.digests);
  return {bytes,request,output,expected:{tuple:copy(initial.tuple),asset:copy(initial.asset),
    digests:Object.fromEntries(['A','C','E'].map(k=>[k,initial.digests[k].observed])),snapshot_id:observed.snapshot_id??observed.carrier_id}};
}
async function exchange(kind,changeContext=()=>{},changeBody=()=>{}){
  const fixture=await build(kind),body=copy(fixture.output.envelope);changeBody(body,fixture);
  // Fixed-width counts let wire mutations remain valid budget observations.
  body.budget.actual_bytes='0000000000000000';
  if(body.status==='ready')body.budget.required_bytes='0000000000000000';
  const count=String(Buffer.byteLength(canonical(body))).padStart(16,'0');body.budget.actual_bytes=count;
  if(body.status==='ready')body.budget.required_bytes=count;
  const wire=Buffer.from(canonical(body));assert.equal(wire.length,Number(count));
  let requests=0,sentBytes=0;
  const server=http.createServer(async(incoming,outgoing)=>{
    requests++;const chunks=[];for await(const chunk of incoming)chunks.push(chunk);
    assert.equal(Buffer.concat(chunks).toString(),JSON.stringify(fixture.request));
    outgoing.writeHead(body.status==='ready'?200:422,{'content-type':'application/json; charset=utf-8','content-length':String(wire.length),'x-kdna-channel':'read_envelope'});
    sentBytes+=wire.length;outgoing.end(wire);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/read',now=Date.now();
  const context={association_id:'association:'+crypto.randomUUID(),endpoint_id:'endpoint:binding',session_id:'session:binding',endpoint_url:url,
    issued_at_ms:now-1,expires_at_ms:now+60000,outbound_request_json:JSON.stringify(fixture.request),correlation:{state:'validated',request_id:fixture.request.request_id},
    expected_tuple:copy(fixture.expected.tuple),expected_asset:copy(fixture.expected.asset),expected_digests:copy(fixture.expected.digests),expected_snapshot_id:fixture.expected.snapshot_id,
    max_response_bytes:1000000,max_read_ms:10000,admission_response_limit_bytes:4096};
  changeContext(context);
  let result;
  try{result=await admitReadTransportResponse(await fetch(url,{method:'POST',body:JSON.stringify(fixture.request)}),context);}
  finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  assert.equal(requests,1);assert.equal(sentBytes,wire.length);assert.equal(server.listening,false);
  if(process.env.KDNA_TRANSPORT_EVIDENCE_ROOT){
    const directory=path.join(process.env.KDNA_TRANSPORT_EVIDENCE_ROOT,String(++serial).padStart(3,'0')+'-'+kind);fs.mkdirSync(directory,{recursive:true});
    fs.writeFileSync(path.join(directory,'asset.kdna'),fixture.bytes,{flag:'wx'});fs.writeFileSync(path.join(directory,'wire.json'),wire,{flag:'wx'});
    fs.writeFileSync(path.join(directory,'record.json'),JSON.stringify({request:fixture.request,expected_before_response:fixture.expected,context,result,requests,sentBytes,listening:server.listening},null,2)+'\n',{flag:'wx'});
  }
  return {result,body};
}
function accepted(result){assert.equal(result.status,'accepted',JSON.stringify(result));assert.equal(result.proof_scope.observable_bindings,true);assert.ok(Object.values(result.capabilities).every(x=>x===false));}
function rejected(result){assert.equal(result.status,'rejected',JSON.stringify(result));assert.equal(result.rejection.code,'READ_TRANSPORT_BINDING_MISMATCH');assert.equal(result.proof_scope.observable_bindings,false);assert.equal(result.response,null);}
for(const kind of ['catalog','ready']){
  test(kind+': genuine response and caller identity match',async()=>accepted((await exchange(kind)).result));
  test(kind+': absent caller snapshot expectation does not invent an identity',async()=>accepted((await exchange(kind,c=>{c.expected_snapshot_id=null;})).result));
  for(const field of ['A','C','E'])test(kind+': wrong expected '+field+' refuses',async()=>rejected((await exchange(kind,c=>{assert.notEqual(c.expected_digests[field],wrongDigest);c.expected_digests[field]=wrongDigest;})).result));
  for(const field of ['asset_id','asset_version','judgment_version'])test(kind+': wrong expected '+field+' refuses',async()=>rejected((await exchange(kind,c=>{c.expected_asset[field]=field==='asset_id'?'asset:other':'2.0.0';})).result));
  test(kind+': wrong caller snapshot refuses',async()=>rejected((await exchange(kind,c=>{c.expected_snapshot_id='snapshot:other';})).result));
  for(const field of ['body','receipt'])test(kind+': conflicting '+field+' snapshot refuses even with null caller expectation',async()=>rejected((await exchange(kind,c=>{c.expected_snapshot_id=null;},b=>{if(field==='body')b.snapshot_id='snapshot:other';else b.receipt.snapshot_id='snapshot:other';})).result));
}
test('rejected: withheld asset/digests/body snapshot remain null and require no fabricated match',async()=>{
  const {result,body}=await exchange('rejected',c=>{c.expected_asset.asset_id='asset:other';for(const k of ['A','C','E'])c.expected_digests[k]=wrongDigest;});
  assert.equal(body.asset,null);assert.equal(body.digests,null);assert.equal(body.snapshot_id,null);accepted(result);
});
// The reference denial withholds its receipt snapshot. These explicit legal
// wire mutations test the schema's observable non-null failure receipt arm.
test('rejected: non-null receipt snapshot still matches the pre-fixed expectation',async()=>{
  const {result,body}=await exchange('rejected',()=>{},(b,f)=>{b.receipt.snapshot_id=f.expected.snapshot_id;});assert.equal(body.snapshot_id,null);assert.notEqual(body.receipt.snapshot_id,null);accepted(result);
});
test('rejected: non-null receipt snapshot mismatching expectation refuses',async()=>{
  const {result,body}=await exchange('rejected',c=>{c.expected_snapshot_id='snapshot:other';},(b,f)=>{b.receipt.snapshot_id=f.expected.snapshot_id;});assert.equal(body.snapshot_id,null);assert.notEqual(body.receipt.snapshot_id,null);rejected(result);
});
test('rejected: nullable caller expectation preserves an observable receipt without extra authority',async()=>accepted((await exchange('rejected',c=>{c.expected_snapshot_id=null;},(b,f)=>{b.receipt.snapshot_id=f.expected.snapshot_id;})).result));
for(const channel of ['admission_rejection','no_body_control','transport_failure'])test('adjacent actual wire channel: '+channel,async()=>{
  const asset=F.blank(tuple),bytes=F.encode(asset,req),admitted=core.admitBytes(bytes);
  assert.equal(admitted.status,'accepted');const view=inspectSnapshot(admitted.snapshot);
  const request=F.candidate(copy(tuple),asset,'catalog');request.request_id='request:channel:'+crypto.randomUUID();
  if(channel==='admission_rejection')request.budget_bytes='invalid';
  if(channel==='no_body_control')request.budget_bytes=0;
  const control=embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:4096}));
  const host=embed.createTrustedHostReadProvider({observe:({request,snapshot})=>{
    const v=inspectSnapshot(snapshot),now=Date.now();return {host_id:'host:channel',host_epoch:'epoch:channel',decision_id:'decision:channel',request_id:request.request_id,
      snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:v.ir.nodes.map(x=>x.id),issued_at:now-1000,expires_at:now+60000,current_ms:now,decision:'allow',policy_id:'policy:channel'};
  },deliver:()=>false});
  // A trusted send refusal produces the real transport-failure arm. For the
  // admission and zero-budget channels no delivery callback is needed.
  const output=await readNode(bytes,request,control,channel==='transport_failure'?host:null);
  assert.equal(output.channel,channel,JSON.stringify(output));
  const wire=channel==='admission_rejection'?Buffer.from(canonical(output.admission_rejection)):Buffer.alloc(0);
  const headers={'x-kdna-channel':channel,'content-length':String(wire.length)};
  if(channel==='admission_rejection')headers['content-type']='application/json; charset=utf-8';
  else{const payload=channel==='no_body_control'?output.control:output.transport_failure;headers['x-kdna-code']=payload.code;if(payload.semantic_cause!==null)headers['x-kdna-semantic-cause']=payload.semantic_cause;}
  const server=http.createServer((incoming,outgoing)=>{incoming.resume();outgoing.writeHead(channel==='admission_rejection'?422:channel==='no_body_control'?413:502,headers);outgoing.end(wire);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/read',now=Date.now();
  const context={association_id:'association:'+crypto.randomUUID(),endpoint_id:'endpoint:channel',session_id:'session:channel',endpoint_url:url,
    issued_at_ms:now-1,expires_at_ms:now+60000,outbound_request_json:JSON.stringify(request),correlation:{state:'validated',request_id:request.request_id},
    expected_tuple:copy(tuple),expected_asset:copy(view.asset),expected_digests:Object.fromEntries(['A','C','E'].map(k=>[k,view.digests[k].observed])),expected_snapshot_id:null,
    max_response_bytes:1000000,max_read_ms:10000,admission_response_limit_bytes:4096};
  let result;try{result=await admitReadTransportResponse(await fetch(url),context);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  accepted(result);assert.equal(result.response.channel,channel);assert.equal(server.listening,false);
  if(process.env.KDNA_TRANSPORT_EVIDENCE_ROOT){const directory=path.join(process.env.KDNA_TRANSPORT_EVIDENCE_ROOT,'channel-'+channel);fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'wire.bin'),wire,{flag:'wx'});fs.writeFileSync(path.join(directory,'record.json'),JSON.stringify({request,output,headers,context,result,listening:server.listening},null,2)+'\n',{flag:'wx'});}
});

// r2_semantics.unknown critical policy: there is no current catalog-only carrier.
test('historical unknown-critical catalog input rejects before Host instead of minting a carrier',async()=>{
 const asset=F.blank(tuple,2);asset.payload.extensions=[{id:'ext:transport-unknown',critical:true,definition:'Unknown critical meaning.',value:{kind:'text',value:'opaque'}}];
 const bytes=F.encode(asset,req),admission=core.admitBytes(bytes);assert.equal(admission.status,'rejected');assert.equal(admission.reason,'READ_UNSUPPORTED_CRITICAL');
 let calls=0,denialDeliveries=0;const host=embed.createTrustedHostReadProvider({observe(){calls++;throw Error('No current catalog-only Host arm');},deliver(result){denialDeliveries++;assert.equal(result.envelope.content,null);return true;}});
 const output=await readNode(bytes,F.candidate(tuple,asset,'catalog'),embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:4096})),host);
 assert.equal(output.envelope.status,'rejected');assert.equal(output.envelope.diagnostics[0].code,'READ_UNSUPPORTED_CRITICAL');assert.equal(output.envelope.content,null);assert.equal(calls,0);assert.equal(denialDeliveries,1);
});
