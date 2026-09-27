'use strict';
// The retained Host profile declares two per-call byte ceilings in the machine
// source (engineering.host_retained_session_profile.limits):
//   response_bytes_per_call_maximum          = 1048576  (one Host Read response)
//   control_response_bytes_per_call_maximum  = 4096     (one Host control response)
// Transport admission is the seam that observes a Host response, so these tests
// hold the two ceilings to their exact byte boundary there. The bodies are the
// byte-exact JSON the shipped `readNode` produced and served over loopback HTTP;
// the exact N / N+1 sizes come from padding the one disclosed author field that
// scope.statement appears exactly once in an exact_selection envelope, so one added character is
// exactly one added envelope byte.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const runtime=process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'),{req,coreDir}=F.runtime(runtime);
const core=req('@aikdna/kdna-core'),boundary=req('@aikdna/kdna-core/read-boundary'),S=require(path.join(coreDir,'src/public-contract/strict-input.js'));
const {readNode}=req('@aikdna/kdna-read/node'),{admitReadTransportResponse}=req('@aikdna/kdna-read/transport'),embed=req('@aikdna/kdna-read/embedding');
const tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple;
const RESPONSE_BYTES_PER_CALL_MAXIMUM=1048576,CONTROL_RESPONSE_BYTES_PER_CALL_MAXIMUM=4096,SESSION='session:host-call-limits';

function filler(seed,bytes){let x=seed>>>0||1;const out=Buffer.alloc(bytes);for(let i=0;i<bytes;i++){x=(Math.imul(x,1664525)+1013904223)>>>0;out[i]=97+(x%26);}return out.toString('latin1');}
function assetOfPadding(pad){
 return F.blank(tuple,1,{patch:(manifest,payload)=>{manifest.title='host call cap probe';payload.judgments[0].scope.statement=filler(11,1+pad);}});
}
function candidate(budget=4194304){
 return {request_id:'request:host-call-limits',tuple:JSON.parse(JSON.stringify(tuple)),budget_bytes:budget,mode:'exact_selection',selection:{asset_id:'asset:bytes',asset_version:'1.0.0',judgment_id:'j:0'},handle:null};
}
function hostProvider(scopeIds){
 return embed.createTrustedHostReadProvider({observe:({request,snapshot})=>{const view=boundary.inspectSnapshot(snapshot),now=Date.now();
  return {host_id:'host:host-call-limits',host_epoch:'epoch:1',decision_id:'decision:'+request.request_id,request_id:request.request_id,snapshot_id:view.snapshot_id,A:view.digests.A.observed,C:view.digests.C.observed,scope:scopeIds,issued_at:now-1000,expires_at:now+600000,current_ms:now,decision:'allow',policy_id:'policy:host-call-limits'};}});
}
function controlProvider(limit=CONTROL_RESPONSE_BYTES_PER_CALL_MAXIMUM){return embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:limit}));}
async function buildAt(pad){
 const bytes=F.encode(assetOfPadding(pad),req),admitted=core.admitBytes(bytes);
 assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
 const view=boundary.inspectSnapshot(admitted.snapshot),request=candidate();
 const result=await readNode(bytes,request,controlProvider(),hostProvider(view.ir.nodes.map(n=>n.id)));
 assert.equal(result.envelope?.status,'ready');
 return {view,request,wire:Buffer.from(S.canonicalJson(result.envelope),'utf8')};
}
async function envelopeOfExactSize(target){
 let pad=0,built=await buildAt(0);
 for(let i=0;i<6&&built.wire.length!==target;i++){pad+=target-built.wire.length;assert.ok(pad>=0);built=await buildAt(pad);}
 assert.equal(built.wire.length,target);
 return built;
}
function serveOnce(handler){
 return new Promise((resolve)=>{const server=http.createServer(handler);server.listen(0,'127.0.0.1',()=>{resolve({url:'http://127.0.0.1:'+server.address().port+'/read',close:()=>new Promise((done)=>{server.closeAllConnections();server.close(done);})});});});
}
async function exchange({wire,headers,status=200,chunked=false,request,view,max,admissionLimit=CONTROL_RESPONSE_BYTES_PER_CALL_MAXIMUM}){
 const server=await serveOnce((incoming,outgoing)=>{void incoming;outgoing.writeHead(status,chunked?{...headers,'transfer-encoding':'chunked'}:{...headers,'content-length':String(wire.length)});outgoing.end(wire);});
 try{
  const response=await fetch(server.url,{method:'GET'});
  return await admitReadTransportResponse(response,{
   association_id:'association:'+crypto.randomUUID(),endpoint_id:'endpoint:host-call-limits',session_id:SESSION,endpoint_url:server.url,
   issued_at_ms:Date.now()-5,expires_at_ms:Date.now()+60000,outbound_request_json:JSON.stringify(request),
   correlation:{state:'validated',request_id:request.request_id},expected_tuple:JSON.parse(JSON.stringify(view.tuple)),expected_asset:JSON.parse(JSON.stringify(view.asset)),
   expected_digests:{A:view.digests.A.observed,C:view.digests.C.observed,E:view.digests.E.observed},expected_snapshot_id:null,
   max_response_bytes:max,max_read_ms:30000,admission_response_limit_bytes:admissionLimit,
  });
 }finally{await server.close();}
}
const envelopeHeaders=(request)=>({'content-type':'application/json; charset=utf-8','x-kdna-channel':'read_envelope','x-kdna-request-id':request.request_id,'x-kdna-session-id':SESSION});
const exact=Promise.all([envelopeOfExactSize(RESPONSE_BYTES_PER_CALL_MAXIMUM),envelopeOfExactSize(RESPONSE_BYTES_PER_CALL_MAXIMUM+1)]);

test('one Host Read response is capped at 1 MiB per call: N is accepted, N+1 rejects',async()=>{
 const [atCap,overCap]=await exact;
 assert.equal(atCap.wire.length,RESPONSE_BYTES_PER_CALL_MAXIMUM);
 assert.equal(overCap.wire.length,RESPONSE_BYTES_PER_CALL_MAXIMUM+1);
 const accepted=await exchange({wire:atCap.wire,headers:envelopeHeaders(atCap.request),request:atCap.request,view:atCap.view,max:RESPONSE_BYTES_PER_CALL_MAXIMUM});
 assert.equal(accepted.status,'accepted');
 assert.equal(accepted.response.channel,'read_envelope');
 const rejected=await exchange({wire:overCap.wire,headers:envelopeHeaders(overCap.request),request:overCap.request,view:overCap.view,max:RESPONSE_BYTES_PER_CALL_MAXIMUM});
 assert.equal(rejected.rejection?.code,'READ_TRANSPORT_LIMIT_EXCEEDED');
 // The same over-cap envelope is still a legal Read result locally: the ceiling
 // belongs to the Host call, not to Read.
 assert.equal(overCap.request.mode,'exact_selection');
 const chunked=await exchange({wire:overCap.wire,headers:envelopeHeaders(overCap.request),request:overCap.request,view:overCap.view,max:RESPONSE_BYTES_PER_CALL_MAXIMUM,chunked:true});
 assert.equal(chunked.rejection?.code,'READ_TRANSPORT_LIMIT_EXCEEDED');
});

test('the 1 MiB per-call cap binds the served bytes, not the caller declaration',async()=>{
 const [atCap,overCap]=await exact;
 // 8388608 is the contract-wide transport ceiling and stays a legal declaration.
 const declaredCeiling=await exchange({wire:atCap.wire,headers:envelopeHeaders(atCap.request),request:atCap.request,view:atCap.view,max:8388608});
 assert.equal(declaredCeiling.status,'accepted');
 const overCapUnderCeilingDeclaration=await exchange({wire:overCap.wire,headers:envelopeHeaders(overCap.request),request:overCap.request,view:overCap.view,max:8388608});
 assert.equal(overCapUnderCeilingDeclaration.rejection?.code,'READ_TRANSPORT_LIMIT_EXCEEDED');
});

test('one Host control response is capped at 4 KiB per call',async()=>{
 const [{view}]=await exact;
 const invalid={...candidate(),budget_bytes:'invalid'};
 const local=await readNode(F.encode(assetOfPadding(0),req),invalid,controlProvider(),hostProvider([]));
 assert.equal(local.channel,'admission_rejection');
 const controlBody=(limitBytes)=>{
  const body=JSON.parse(S.canonicalJson(local.admission_rejection));
  body.control_budget.limit_bytes=limitBytes;body.control_budget.actual_bytes='0000000000000000';
  const once=Buffer.from(S.canonicalJson(body),'utf8');
  body.control_budget.actual_bytes=String(once.length).padStart(16,'0');
  return Buffer.from(S.canonicalJson(body),'utf8');
 };
 const headers={'content-type':'application/json; charset=utf-8','x-kdna-channel':'admission_rejection','x-kdna-request-id':invalid.request_id,'x-kdna-session-id':SESSION};
 const real=await exchange({wire:controlBody(CONTROL_RESPONSE_BYTES_PER_CALL_MAXIMUM),headers,status:422,request:invalid,view,max:RESPONSE_BYTES_PER_CALL_MAXIMUM});
 assert.equal(real.status,'accepted');
 assert.equal(real.response.channel,'admission_rejection');
 const raw=(bytes)=>Buffer.from('{"pad":"'+'a'.repeat(bytes-10)+'"}','utf8');
 const atCap=await exchange({wire:raw(CONTROL_RESPONSE_BYTES_PER_CALL_MAXIMUM),headers,status:422,request:invalid,view,max:RESPONSE_BYTES_PER_CALL_MAXIMUM});
 // 4096 bytes are read to the end: the Schema rejects the shape, not the ceiling.
 assert.equal(atCap.rejection?.code,'READ_TRANSPORT_SCHEMA_INVALID');
 for(const admissionLimit of [CONTROL_RESPONSE_BYTES_PER_CALL_MAXIMUM,8388608]){
  const over=await exchange({wire:raw(CONTROL_RESPONSE_BYTES_PER_CALL_MAXIMUM+1),headers,status:422,request:invalid,view,max:8388608,admissionLimit});
  assert.equal(over.rejection?.code,'READ_TRANSPORT_LIMIT_EXCEEDED');
 }
});
