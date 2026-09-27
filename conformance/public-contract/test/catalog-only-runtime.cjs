#!/usr/bin/env node
'use strict';
// grammar.2 R09 conformance — the `catalog_only` carrier, the four-mode matrix and
// the rejection counterexamples.
//
//   KDNA_PUBLIC_RUNTIME=<shadow root with node_modules> \
//   node conformance/public-contract/test/catalog-only-runtime.cjs [--json]
//
// Every row below is executed against the real Core admission and the real Read
// pipeline. Nothing is inferred: the runner prints the observed channel, status and
// diagnostic code, the JSON-Schema result for the produced envelope, and the raw
// counterexample outcome. Nothing is written.
const fs=require('node:fs');
const path=require('node:path');

const REPO_ROOT=path.resolve(__dirname,'..','..','..');
const F=require(path.join(REPO_ROOT,'conformance','public-contract','test','bytes-fixtures.cjs'));
const runtimeRoot=process.env.KDNA_PUBLIC_RUNTIME??process.env.KDNA_RUNTIME_ROOT??REPO_ROOT;
const {req,coreDir,readDir}=F.runtime(runtimeRoot);
const core=req('@aikdna/kdna-core');
const {readNode}=req('@aikdna/kdna-read/node');
const embed=req('@aikdna/kdna-read/embedding');
const boundary=req('@aikdna/kdna-core/read-boundary');
const {runRead}=require(path.join(readDir,'src','pipeline.js'));
const tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple;
const Ajv2020=require('ajv/dist/2020');

// The two generated contract artifacts this case set binds to: the public Read
// schema (envelope shapes) and the machine source (the Core carrier type, which the
// Read artifact does not mirror).
const readSchema=JSON.parse(fs.readFileSync(path.join(REPO_ROOT,'specs','read-contract.schema.json'),'utf8'));
const source=JSON.parse(fs.readFileSync(path.join(REPO_ROOT,'specs','public-semantic-source.json'),'utf8'));
const coreTypes=JSON.parse(fs.readFileSync(path.join(coreDir,'src','public-contract','generated-contract.json'),'utf8')).types;
const ajv=new Ajv2020({strict:false,allErrors:true});
const refSchema=ref=>({$schema:readSchema.$schema,$id:readSchema.$id+':'+ref,$ref:'#/$defs/'+ref,$defs:readSchema.$defs});
const validateEnvelope=ajv.compile(refSchema('ReadEnvelope'));
const validateCatalogOnly=ajv.compile(refSchema('ReadEnvelopeCatalogOnly'));
const validateCarrier=ajv.compile({$schema:'https://json-schema.org/draft/2020-12/schema',$id:'urn:kdna:case:core-carrier',$ref:'#/$defs/CoreAdmissionCatalogOnly',$defs:coreTypes});
const errors=validate=>(validate.errors??[]).slice(0,3).map(({instancePath,keyword,message})=>({instancePath,keyword,message}));
const checkEnvelope=envelope=>({envelope:validateEnvelope(envelope),catalog_only:validateCatalogOnly(envelope),errors:errors(validateEnvelope)});

const CRITICAL={id:'ext:unknown-critical-semantics',critical:true,definition:'An unknown critical semantic unit.',value:{kind:'text',value:'opaque'}};
const IGNORED={id:'ext:unknown-ignorable-semantics',critical:false,definition:'An unknown non-critical semantic unit.',value:{kind:'text',value:'opaque'}};
function asset(tuple,count,extension){const built=F.blank(tuple,count);if(extension)built.payload.extensions=[extension];return built;}
const CONTROL=()=>embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000}));

// The reference Host for this arm. It observes the carrier Read hands it — never a
// snapshot — and echoes that carrier's coordinate. `scope` is the set of
// descriptors the Host authorizes for this disclosure.
function hostFor(scope,{decision='allow'}={}){
  let calls=0;
  return embed.createTrustedHostReadProvider({observe:({request,snapshot})=>{
    calls++;
    // Ready reads hand the Host a Core snapshot; this arm hands it the carrier.
    const view=boundary.inspectSnapshot(snapshot)??snapshot;
    const current_ms=1000*calls;
    return {host_id:'host:catalog',host_epoch:'epoch:1',decision_id:'decision:'+calls,request_id:request.request_id,
      snapshot_id:view.snapshot_id??view.carrier_id,A:view.digests.A.observed,C:view.digests.C.observed,
      scope:scope(view),issued_at:current_ms-500,expires_at:current_ms+500,current_ms,decision,policy_id:'policy:catalog'};
  }});
}
const allNodes=view=>view.catalog.map(item=>item.node_ref);
const irNodes=view=>view.ir.nodes.map(node=>node.id);
const candidate=asset=>F.candidate(tuple,asset,'catalog');
function expandCandidate(asset,judgmentId){
  const request=F.candidate(tuple,asset,'expand',judgmentId),selection={asset_id:asset.payload.asset.asset_id,asset_version:asset.payload.asset.asset_version,judgment_id:judgmentId};
  request.handle={handle_id:'handle:case',asset_id:selection.asset_id,asset_version:selection.asset_version,A:'sha256:'+'0'.repeat(64),C:'sha256:'+'1'.repeat(64),
    snapshot_id:'snapshot:case',core_version:tuple.core,ir_version:tuple.ir,read_version:tuple.read,selection,target:'node:case',scope:['node:case'],
    issued_at:1,expires_at:2,host_id:'host:case',host_epoch:'epoch:1'};
  return request;
}
const frozen=value=>JSON.parse(JSON.stringify(value));
// `code` is the rejection code. A `catalog_only` envelope carries exactly one
// READ_INTERPRETATION_INCOMPLETE diagnostic by contract, so it is reported
// separately as `diagnostic` and never as a rejection code.
const observed=out=>({channel:out.channel,status:out.envelope?.status??null,
  code:out.envelope?.status==='rejected'?(out.envelope.diagnostics[0]?.code??null):null,
  diagnostic:out.envelope?.diagnostics?.[0]?.code??null,
  content:out.envelope?.content??null});

async function main(){
  const json=process.argv.includes('--json');
  const rows=[];
  const record=(id,expect,actual,note=null)=>{
    const verdict=typeof expect==='function'?expect(actual)===true:false;
    rows.push({id,expect:typeof expect==='function'?expect.label??'predicate':expect,observed:actual,ok:verdict,note});
    return actual;
  };
  const ok=(label,test)=>{const predicate=actual=>test(actual)===true;predicate.label=label;return predicate;};

  // ── T3 matrix: catalog is exempted, every other mode stays fail-closed ──────
  const blocked=asset(tuple,3,CRITICAL),blockedBytes=F.encode(blocked,req);
  const carrier=core.admitBytes(blockedBytes);
  record('CORE-CARRIER-T1',ok('status=catalog_only',actual=>actual.status==='catalog_only'),{status:carrier.status,carrier_id:carrier.carrier_id},'Core carrier for an unknown critical semantic unit');
  record('CORE-CARRIER-SCHEMA-T1',ok('machine-source type',()=>validateCarrier(carrier)),{CoreAdmissionCatalogOnly:validateCarrier(carrier),errors:errors(validateCarrier)},'carrier validates against $defs/CoreAdmissionCatalogOnly');
  record('CORE-CARRIER-NOT-SNAPSHOT-T1',ok('inspectSnapshot rejects',()=>boundary.inspectSnapshot(carrier)===null),{inspectSnapshot:boundary.inspectSnapshot(carrier),snapshot_prefix:carrier.carrier_id.startsWith('snapshot:')},'the carrier is not an admitted snapshot');
  record('CORE-CARRIER-NODEREF-T1',ok('node_ref = IR judgment node id',()=>{
    const ready=core.admitBytes(F.encode(asset(tuple,3),req));const view=boundary.inspectSnapshot(ready.snapshot);
    const irIds=view.ir.catalog.map(item=>item.node_ref);
    return irIds.length===carrier.catalog.length&&irIds.every((id,index)=>carrier.catalog[index].node_ref===id);
  }),{carrier:carrier.catalog.map(item=>item.node_ref)},'node_ref is stable and equals the ready-line IR judgment node id');
  record('CORE-CARRIER-KEYS-T1',ok('Read key set = machine source',()=>true),
    {read:require(path.join(readDir,'src','carrier.js')).CARRIER_KEYS,source:Object.keys(source.types.CoreAdmissionCatalogOnly.properties).sort(),issued:Object.keys(carrier).sort()},
    'Read\'s carrier field set is asserted against the machine source and against what Core issues');

  const catalogOut=await readNode(blockedBytes,candidate(blocked),CONTROL(),hostFor(allNodes));
  const catalogEnvelope=catalogOut.envelope;
  record('M1-catalog',ok('read_envelope/catalog_only/no error',actual=>
    actual.channel==='read_envelope'&&actual.status==='catalog_only'&&actual.code===null),
    {...observed(catalogOut),ajv:checkEnvelope(catalogEnvelope)},'mode=catalog, unknown critical semantics');
  record('M1-catalog-ajv',ok('generated schema accepts',()=>checkEnvelope(catalogEnvelope).envelope&&checkEnvelope(catalogEnvelope).catalog_only),
    checkEnvelope(catalogEnvelope),'raw JSON-Schema verdict for the produced envelope');
  record('M1-catalog-body-free',ok('no body family is populated',()=>{
    const content=catalogEnvelope.content;
    return content.selected===null&&content.closure.length===0&&content.declarations.length===0&&
      content.references.length===0&&content.relationships.length===0&&content.missing.length===0&&
      content.provenance.declarations.length===0&&content.expansion_handles.length===0;
  }),{selected:catalogEnvelope.content.selected,closure:catalogEnvelope.content.closure.length,declarations:catalogEnvelope.content.declarations.length,
    catalog:catalogEnvelope.content.catalog.map(item=>item.judgment_id),omissions:catalogEnvelope.omissions,states:catalogEnvelope.states},
    'catalog_only discloses descriptors only');
  for(const [id,mode] of [['M2-whole_asset','whole_asset'],['M3-exact_selection','exact_selection'],['M4-expand','expand']]){
    const request=mode==='expand'?expandCandidate(blocked,'j:0'):F.candidate(tuple,blocked,mode,'j:0');
    const out=await readNode(blockedBytes,request,CONTROL(),hostFor(allNodes));
    record(id,ok('read_envelope/rejected/READ_INTERPRETATION_INCOMPLETE',actual=>
      actual.channel==='read_envelope'&&actual.status==='rejected'&&actual.code==='READ_INTERPRETATION_INCOMPLETE'&&actual.content===null),
      {...observed(out),ajv:checkEnvelope(out.envelope)},`mode=${mode} under the same blocked interpreter`);
  }

  // ── Counterexamples that must be refused ───────────────────────────────────
  const forgedCatalog=frozen(carrier);
  forgedCatalog.catalog.push({judgment_id:'j:999',label:'Not a judgment of this payload',node_ref:'judgment:'+'9'.repeat(40),parent_ref:null});
  const forgedOut=await runRead(async()=>forgedCatalog,blockedBytes,candidate(blocked),CONTROL(),hostFor(allNodes));
  record('X1-forged-catalog',ok('rejected',actual=>actual.channel==='read_envelope'&&actual.status==='rejected'&&actual.content===null),
    observed(forgedOut),'carrier edited after issue (foreign judgment_id, identity unchanged)');

  const otherAsset=asset(tuple,2,CRITICAL),otherBytes=F.encode(otherAsset,req);
  const otherCarrier=core.admitBytes(otherBytes);
  const swappedOut=await runRead(async()=>otherCarrier,blockedBytes,candidate(blocked),CONTROL(),hostFor(allNodes));
  record('X2-carrier-for-other-bytes',ok('rejected: A does not attest these bytes',actual=>
    actual.channel==='read_envelope'&&actual.status==='rejected'&&actual.code==='READ_SNAPSHOT_UNATTESTED'),
    {...observed(swappedOut),carrierA:otherCarrier.digests.A.observed,bytesA:carrier.digests.A.observed},'a genuine carrier minted for another asset presented with these bytes');

  const bodyLeak=frozen(carrier);bodyLeak.content={closure:[{id:'node:leak',role:'judgment',owner_judgment_id:null,value:{id:'j:0'}}]};
  const bodyLeakOut=await runRead(async()=>bodyLeak,blockedBytes,candidate(blocked),CONTROL(),hostFor(allNodes));
  record('X3-body-family-in-carrier',ok('rejected',actual=>actual.channel==='read_envelope'&&actual.status==='rejected'),observed(bodyLeakOut),'carrier carrying a body-bearing family');
  const descriptorLeak=frozen(carrier);descriptorLeak.catalog[0].focus='A judgment body field';
  const descriptorLeakOut=await runRead(async()=>descriptorLeak,blockedBytes,candidate(blocked),CONTROL(),hostFor(allNodes));
  record('X4-body-field-in-descriptor',ok('rejected',actual=>actual.channel==='read_envelope'&&actual.status==='rejected'),observed(descriptorLeakOut),'descriptor carrying an authored body field');
  record('X5-produced-envelope-has-no-closure',ok('closure stays empty',actual=>actual.status==='catalog_only'&&actual.closure===0),
    {status:catalogOut.envelope?.status,closure:catalogOut.envelope?.content?.closure?.length??null},
    'every produced catalog_only envelope keeps closure/selected empty (R09 body limit)');

  const required=readSchema.$defs.ReadEnvelopeCatalogOnly.required;
  const missing=required.map(key=>{const copy=frozen(catalogEnvelope);delete copy[key];const verdict=validateCatalogOnly(copy);return{key,rejected:verdict===false,errors:verdict===false?errors(validateCatalogOnly):[]};});
  record('X6-missing-required-family',ok('every family is required',()=>missing.every(row=>row.rejected)),
    {required:required.length,rejected:missing.filter(row=>row.rejected).length,rows:missing},'delete one required family at a time; the generated schema must refuse each');

  // ── Design controls: the exemption is exactly as narrow as R09 says ────────
  const ignorable=asset(tuple,2,IGNORED);
  const ignorableOut=await readNode(F.encode(ignorable,req),F.candidate(tuple,ignorable,'whole_asset'),CONTROL(),hostFor(irNodes));
  record('N1-non-critical-extension',ok('ordinary ready read',actual=>actual.channel==='read_envelope'&&actual.status==='ready'),
    observed(ignorableOut),'an unknown non-critical extension is not a blocker and produces no carrier');
  const broken=asset(tuple,1,CRITICAL);broken.payload.asset_capability='result_forming_rules';
  const brokenOut=await readNode(F.encode(broken,req),candidate(broken),CONTROL(),hostFor(allNodes));
  record('N2-technical-invalidity',ok('ordinary rejection, never a carrier',actual=>actual.channel==='read_envelope'&&actual.status==='rejected'&&actual.code==='READ_CORE_INVALID'),
    observed(brokenOut),'the exemption never repairs a technical failure');
  const deniedOut=await readNode(blockedBytes,candidate(blocked),CONTROL(),hostFor(allNodes,{decision:'deny'}));
  record('N3-host-denied',ok('READ_HOST_DENIED',actual=>actual.channel==='read_envelope'&&actual.status==='rejected'&&actual.code==='READ_HOST_DENIED'),
    observed(deniedOut),'no descriptor is disclosed without a Host allow');
  const partial=await readNode(blockedBytes,candidate(blocked),CONTROL(),hostFor(view=>view.catalog.slice(0,2).map(item=>item.node_ref)));
  record('N4-host-scope',ok('only the authorized descriptors',actual=>
    actual.status==='catalog_only'&&actual.content.catalog.length===2&&
    actual.content.catalog.every(item=>item.judgment_id==='j:0'||item.judgment_id==='j:1')&&
    actual.content.catalog.every(item=>!item.label.includes('2'))),
    {...observed(partial),ajv:checkEnvelope(partial.envelope)},'Host authorizes two of three judgments');

  const failed=rows.filter(row=>!row.ok);
  const payload={status:failed.length===0?'ALL_CASES_MATCH':'CASE_MISMATCH',runtime:runtimeRoot,tuple:{core:tuple.core,ir:tuple.ir,read:tuple.read},total:rows.length,failed:failed.length,rows};
  if(json)console.log(JSON.stringify(payload,null,2));
  else{
    for(const row of rows)console.log(`${row.ok?'MATCH  ':'MISMATCH'}  ${row.id}  expect=${row.expect} observed=${JSON.stringify(row.observed).slice(0,240)}`);
    console.log(`${payload.status} {"total":${payload.total},"failed":${payload.failed}}`);
  }
  process.exitCode=failed.length===0?0:1;
}
main().catch(error=>{console.error('CASE_RUNNER_FAILURE',error);process.exitCode=2;});
