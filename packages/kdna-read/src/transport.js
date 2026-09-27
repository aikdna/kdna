'use strict';
const {contextSchema,remoteSchema}=require('./transport-validators.generated.js');
const config=require('./transport-contract.json');
const {clone,freeze,jcs,correlation,identifier,anchorFor}=require('./util.js');
const {inspectCandidate}=require('./admission.js');
const {parseTransportJSON}=require('./transport-json.js');
const responseGet=typeof Response==='function'?Object.fromEntries(['url','status','headers','body','bodyUsed','redirected','type'].map(k=>[k,Object.getOwnPropertyDescriptor(Response.prototype,k).get])):null;
const headerGet=typeof Headers==='function'?Headers.prototype.get:null;
const streamGetReader=typeof ReadableStream==='function'?ReadableStream.prototype.getReader:null;
const readerRead=typeof ReadableStreamDefaultReader==='function'?ReadableStreamDefaultReader.prototype.read:null;
const readerCancel=typeof ReadableStreamDefaultReader==='function'?ReadableStreamDefaultReader.prototype.cancel:null;
const readerRelease=typeof ReadableStreamDefaultReader==='function'?ReadableStreamDefaultReader.prototype.releaseLock:null;
const encoder=new TextEncoder(),associations=new Map();
// Host-profile per-call ceilings (specs/public-semantic-source.json ->
// engineering.host_retained_session_profile.limits): response_bytes_per_call_maximum
// and control_response_bytes_per_call_maximum. They bound the bytes a Host serves
// for one read call, not what a caller may declare: the generated context schema
// still admits the contract-wide 8 MiB ceiling
// (transport_admission.limits.response_bytes), and the tighter per-call cap then
// binds the served bytes.
const responseBytesPerCallMaximum=1048576,controlResponseBytesPerCallMaximum=4096;
const fail=code=>{throw Error(code);};
const eq=(a,b)=>jcs(a)===jcs(b);
const ensure=(ok,code='READ_TRANSPORT_BINDING_MISMATCH')=>{if(!ok)fail(code);};
const byteCount=(s,n)=>Number.isSafeInteger(Number(s))&&Number(s)===n;
function compareEnvelope(body,c,record,n){
  ensure(record&&body.request_id===record.request_id&&body.receipt.request_id===record.request_id);
  ensure(body.budget.limit_bytes===record.budget_bytes&&byteCount(body.budget.actual_bytes,n)&&n<=body.budget.limit_bytes);
  // Failure envelopes can withhold identity fields. Compare what the wire
  // actually exposes before branching, including catalog-only carriers.
  ensure(body.tuple===null||eq(body.tuple,c.expected_tuple));
  ensure(body.asset===null||eq(body.asset,c.expected_asset));
  if(body.digests!==null)for(const k of ['A','C','E'])ensure(body.digests[k].observed===c.expected_digests[k]);
  if(body.snapshot_id!==null&&body.receipt.snapshot_id!==null)ensure(body.snapshot_id===body.receipt.snapshot_id);
  if(c.expected_snapshot_id!==null){
    if(body.snapshot_id!==null)ensure(body.snapshot_id===c.expected_snapshot_id);
    if(body.receipt.snapshot_id!==null)ensure(body.receipt.snapshot_id===c.expected_snapshot_id);
  }
  if(body.status!=='ready')return;
  const request=record.request;ensure(request&&!record.version_rejection);
  ensure(body.receipt.snapshot_id===body.snapshot_id&&byteCount(body.budget.required_bytes,n));
  const content=body.content;ensure(eq(content.selected,request.selection));
  if(request.selection){
    ensure(request.selection.asset_id===body.asset.asset_id&&request.selection.asset_version===body.asset.asset_version);
    const selectedCatalog=content.catalog.filter(item=>item.judgment_id===request.selection.judgment_id);
    ensure(selectedCatalog.length===1);
    const selectedId=request.selection.judgment_id,selectedRef=selectedCatalog[0].node_ref;
    // exact_selection discloses its judgment. An expand target may omit it;
    // check that identity only when received fields actually disclose it.
    const selectedNodes=content.closure.filter(node=>node.id===selectedRef);
    const disclosesSelected=request.mode==='exact_selection'||selectedNodes.length>0||
      content.closure.some(node=>node.role==='judgment'&&
        (node.owner_judgment_id===selectedId||node.value.id===selectedId));
    if(disclosesSelected){
      ensure(selectedNodes.length===1);
      const selectedNode=selectedNodes[0];
      ensure(selectedNode.id===selectedRef&&selectedNode.role==='judgment'&&
        selectedNode.owner_judgment_id===selectedId&&selectedNode.value.id===selectedId);
    }
  }
  if(request.mode==='catalog')ensure(content.declarations.length===0&&content.closure.length===0&&content.expansion_handles.length===0&&content.asset_index.length===0);
  const catalogIds=new Set();
  for(const item of content.catalog){ensure(!catalogIds.has(item.judgment_id));catalogIds.add(item.judgment_id);
    const node=content.closure.find(n=>n.id===item.node_ref);if(node)ensure(node.role==='judgment'&&node.value.id===item.judgment_id&&node.value.focus===item.focus);
  }
  const handleIds=new Set();
  for(const h of content.expansion_handles){
    ensure(!handleIds.has(h.handle_id));handleIds.add(h.handle_id);
    ensure(h.asset_id===body.asset.asset_id&&h.asset_version===body.asset.asset_version&&h.A===c.expected_digests.A&&h.C===c.expected_digests.C&&h.snapshot_id===body.snapshot_id);
    ensure(h.core_version===body.tuple.core&&h.ir_version===body.tuple.ir&&h.read_version===body.tuple.read&&eq(h.anchor,anchorFor(request)));
    ensure(h.issued_at<h.expires_at&&h.host_id===body.receipt.host_id&&h.host_epoch===body.receipt.host_epoch);
  }
  const supplied=[...content.declarations,...content.closure];
  const indexTargets=new Set();
  for(const descriptor of content.asset_index){
    const key=jcs(descriptor.target);ensure(!indexTargets.has(key));indexTargets.add(key);
    if(descriptor.body_delivery==='inline')ensure(supplied.some(node=>eq(node.target,descriptor.target)));
    else{const handle=content.expansion_handles.find(h=>h.handle_id===descriptor.handle_id);ensure(handle&&eq(handle.target,descriptor.target));}
  }
  if(request.handle){
    const h=request.handle;
    ensure(h.snapshot_id===body.snapshot_id&&h.A===c.expected_digests.A&&h.C===c.expected_digests.C&&h.asset_id===body.asset.asset_id&&h.asset_version===body.asset.asset_version&&eq(h.anchor,anchorFor(request)));
    ensure(h.core_version===body.tuple.core&&h.ir_version===body.tuple.ir&&h.read_version===body.tuple.read);
    ensure(eq([...h.scope].sort(),content.closure.map(x=>x.id).sort()));
    ensure(content.closure.some(node=>eq(node.target,h.target)));
    ensure(h.host_id===body.receipt.host_id&&h.host_epoch===body.receipt.host_epoch);
  }

}
async function boundedBody(body,maxBytes,declared,ms){
  if(body===null){ensure(declared===null||declared===0,'READ_TRANSPORT_HTTP_MISMATCH');return new Uint8Array();}
  let reader,timer,total=0;const parts=[];
  try{
    reader=streamGetReader.call(body);
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('READ_TRANSPORT_TIMEOUT')),ms);});
    for(;;){const item=await Promise.race([readerRead.call(reader),timeout]);if(item.done)break;ensure(item.value instanceof Uint8Array,'READ_TRANSPORT_RESPONSE_INVALID');total+=item.value.byteLength;if(total>maxBytes)fail('READ_TRANSPORT_LIMIT_EXCEEDED');if(declared!==null&&total>declared)fail('READ_TRANSPORT_HTTP_MISMATCH');parts.push(item.value.slice());}
    ensure(declared===null||total===declared,'READ_TRANSPORT_HTTP_MISMATCH');
    const out=new Uint8Array(total);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length;}return out;
  }catch(e){if(reader)try{Promise.resolve(readerCancel.call(reader)).catch(()=>{});}catch{}throw e;}
  finally{clearTimeout(timer);if(reader)try{readerRelease.call(reader);}catch{}}
}
async function admitReadTransportResponse(response,context){
  const scope={response_url_matched:false,bounded_bytes:false,fetch_visible_http:false,strict_json:false,schema:false,observable_bindings:false,process_association_once:false};
  const common={contract:config.contract,origin:'remote',proof_scope:scope,proof_limits:config.proof_limits,capabilities:{core_snapshot:false,admitted_request:false,host_witness:false,authorization:false,action:false}};
  let association=null;
  try{
    let c;try{c=clone(context);}catch{fail('READ_TRANSPORT_CONTEXT_INVALID');}ensure(contextSchema(c)&&[c.association_id,c.endpoint_id,c.session_id].every(identifier),'READ_TRANSPORT_CONTEXT_INVALID');
    let endpoint;try{endpoint=new URL(c.endpoint_url);}catch{fail('READ_TRANSPORT_CONTEXT_INVALID');}
    ensure(['https:','http:'].includes(endpoint.protocol)&&!endpoint.username&&!endpoint.password&&!endpoint.hash&&endpoint.href===c.endpoint_url,'READ_TRANSPORT_CONTEXT_INVALID');
    ensure(encoder.encode(c.outbound_request_json).length<=config.limits.request_json_bytes,'READ_TRANSPORT_CONTEXT_INVALID');
    let candidate;try{candidate=parseTransportJSON(c.outbound_request_json);}catch{fail('READ_TRANSPORT_CONTEXT_INVALID');}
    ensure(eq(c.correlation,correlation(candidate?.request_id)),'READ_TRANSPORT_CONTEXT_INVALID');
    let record=null,admissionError=null;try{record=inspectCandidate(candidate);}catch(e){if(!e?.admission)fail('READ_TRANSPORT_CONTEXT_INVALID');admissionError={stage:'admission',severity:'error',reason:e.reason,field:e.field};}
    const now=Date.now();ensure(c.issued_at_ms<=now&&now<c.expires_at_ms&&c.expires_at_ms-c.issued_at_ms<=config.limits.association_ttl_ms,'READ_TRANSPORT_ASSOCIATION_STALE');
    association={association_id:c.association_id,endpoint_id:c.endpoint_id,session_id:c.session_id,correlation:c.correlation};
    for(const [id,expires]of associations)if(expires<=now)associations.delete(id);
    ensure(!associations.has(c.association_id),'READ_TRANSPORT_ASSOCIATION_REPLAYED');ensure(associations.size<config.limits.association_capacity,'READ_TRANSPORT_ASSOCIATION_CAPACITY');associations.set(c.association_id,c.expires_at_ms);scope.process_association_once=true;
    let state;try{ensure(responseGet&&headerGet&&streamGetReader&&readerRead&&readerCancel&&readerRelease,'READ_TRANSPORT_RESPONSE_INVALID');state=Object.fromEntries(Object.entries(responseGet).map(([k,get])=>[k,get.call(response)]));}catch{fail('READ_TRANSPORT_RESPONSE_INVALID');}
    ensure(!state.bodyUsed&&!state.redirected&&!['opaque','opaqueredirect','error'].includes(state.type),'READ_TRANSPORT_RESPONSE_INVALID');
    ensure(state.url===c.endpoint_url,'READ_TRANSPORT_BINDING_MISMATCH');scope.response_url_matched=true;
    const header=k=>headerGet.call(state.headers,k),channel=header('x-kdna-channel'),code=header('x-kdna-code'),cause=header('x-kdna-semantic-cause');
    for(const [name,value]of [['x-kdna-request-id',c.correlation.request_id],['x-kdna-session-id',c.session_id]])if(header(name)!==null)ensure(header(name)===value);
    const length=header('content-length'),transfer=header('transfer-encoding'),encoding=header('content-encoding');
    ensure(encoding===null||encoding.toLowerCase()==='identity','READ_TRANSPORT_HTTP_MISMATCH');// WebKit exposes decoded chunked responses as Transfer-Encoding: Identity.
    ensure(!(length!==null&&transfer!==null),'READ_TRANSPORT_HTTP_MISMATCH');ensure(transfer===null||['chunked','identity'].includes(transfer.toLowerCase()),'READ_TRANSPORT_HTTP_MISMATCH');
    const hasJSON=channel==='read_envelope'||channel==='admission_rejection',perCallBytes=channel==='read_envelope'?Math.min(c.max_response_bytes,responseBytesPerCallMaximum):channel==='admission_rejection'?Math.min(c.max_response_bytes,c.admission_response_limit_bytes,controlResponseBytesPerCallMaximum):c.max_response_bytes;
    let declared=null;if(length!==null){ensure(/^(0|[1-9][0-9]*)$/.test(length)&&Number.isSafeInteger(Number(length)),'READ_TRANSPORT_HTTP_MISMATCH');declared=Number(length);ensure(declared<=perCallBytes,'READ_TRANSPORT_LIMIT_EXCEEDED');}
    const contentType=header('content-type');
    if(hasJSON){ensure(contentType!==null&&/^application\/json\s*;\s*charset=utf-8$/i.test(contentType)&&code===null&&cause===null,'READ_TRANSPORT_HTTP_MISMATCH');ensure(channel==='read_envelope'?[200,422].includes(state.status):state.status===422,'READ_TRANSPORT_HTTP_MISMATCH');}
    else{ensure((channel==='no_body_control'&&state.status===413)||(channel==='transport_failure'&&state.status===502),'READ_TRANSPORT_HTTP_MISMATCH');ensure(contentType===null&&(declared===null||declared===0),'READ_TRANSPORT_HTTP_MISMATCH');}
    const bytes=await boundedBody(state.body,hasJSON?perCallBytes:0,declared,Math.min(c.max_read_ms,Math.max(1,c.expires_at_ms-Date.now())));scope.bounded_bytes=true;ensure(Date.now()<c.expires_at_ms,'READ_TRANSPORT_ASSOCIATION_STALE');
    let data=null;if(hasJSON){let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{fail('READ_TRANSPORT_JSON_INVALID');}data=parseTransportJSON(text,true);scope.strict_json=true;}
    const remote={channel,http_status:state.status,byte_length:bytes.length,body:data,headers:hasJSON?null:{code,semantic_cause:cause}};
    ensure(remoteSchema(remote),'READ_TRANSPORT_SCHEMA_INVALID');scope.schema=true;
    if(channel==='read_envelope'){ensure(state.status===(data.status==='ready'?200:422),'READ_TRANSPORT_HTTP_MISMATCH');compareEnvelope(data,c,record,bytes.length);}
    else if(channel==='admission_rejection'){ensure(admissionError&&eq(data.diagnostic,admissionError)&&eq(data.correlation,c.correlation));ensure(data.control_budget.limit_bytes===c.admission_response_limit_bytes&&byteCount(data.control_budget.actual_bytes,bytes.length)&&bytes.length<=perCallBytes);}
    else if(channel==='no_body_control'){if(code==='READ_ADMISSION_RESPONSE_TOO_SMALL')ensure(admissionError&&cause==='READ_INPUT_INVALID');else ensure(record!==null);}
    ensure(Date.now()<c.expires_at_ms,'READ_TRANSPORT_ASSOCIATION_STALE');scope.fetch_visible_http=true;scope.observable_bindings=true;
    return freeze({...common,status:'accepted',association,response:remote,rejection:null});
  }catch(e){const code=config.diagnostic_codes.includes(e?.message)?e.message:'READ_TRANSPORT_RESPONSE_INVALID';return freeze({...common,status:'rejected',association,response:null,rejection:{code}});}
}
module.exports={admitReadTransportResponse};
