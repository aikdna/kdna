'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const {admitNode}=req('@aikdna/kdna-core/node'),{admitBrowser}=req('@aikdna/kdna-core/browser');
const {inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {versionTuple:tuple,types,component_semantics,static_policy}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
const {digestCanonical:H}=require(path.join(coreDir,'src/public-contract/digests.js'));
const term=name=>({term:name,vocabulary:'author'});
function semantic(value){
 if(value===null)return {kind:'null',value:null};
 if(Array.isArray(value))return {kind:'list',items:value.map(semantic)};
 if(typeof value==='object')return {kind:'record',fields:Object.entries(value).map(([name,value])=>({name,value:semantic(value)}))};
 return {kind:typeof value==='string'?'text':typeof value,value};
}
function unknown(critical=true){return {id:'example:future-meaning',critical,definition:'An opaque meaning unknown to this implementation.',value:semantic({id:'kdna.component-semantics/1',critical:true,definition:'This is data, not a nested Extension.',program:'globalThis.kdnaAdmissionExecuted = true'})};}
function fixture(){
 const asset=F.blank(tuple,3),[j,rule]=asset.payload.judgments;
 for(const declaration of asset.payload.judgments.slice(1)){
  declaration.form='rule';delete declaration.result;
  declaration.formation_rule={statement:'An independent authored rule.',condition_refs:[],output_contract_ref:declaration.result_contract.id};
 }
 asset.payload.conditions=[{id:'declared-condition',owner_ref:{kind:'judgment',id:rule.id},expression:{kind:'external_evaluator',evaluator:term('declared-evaluator'),declaration:{kind:'structured',operator:'equals',operands:[{kind:'literal',value:{kind:'text',value:'example'}}]}}}];
 rule.formation_rule.condition_refs=[{kind:'condition',id:'declared-condition'}];
 asset.payload.contracts=[{...structuredClone(j.result_contract),id:'auxiliary-contract'}];
 asset.payload.asset_capability='mixed';
 asset.manifest.lineage=[{relationship:term('derived-from'),source_asset_id:'asset:prior',source_version:'0.9.0'}];
 asset.payload.dependencies=[{id:'dependency:0',producer:{kind:'judgment_result',judgment_ref:j.id,result_contract_ref:j.result_contract.id},consumer_judgment_ref:rule.id,input_role:'input',data_type:{term:'text'},required:true,purpose:'An explicit dependency.'}];
 asset.payload.relationships=[{id:'relationship:0',kind:{term:'support'},direction:'directed',participants:[{judgment_ref:j.id,role:{term:'supporter'}},{judgment_ref:rule.id,role:{term:'claim'}}],operator:{term:'supports'},effect:{term:'offers_support'},statement:'Explicit support, not execution.'}];
 return require('./r2-test-model.js').bindDependencyPorts(asset);
}
// This authored table is checked against the complete generated input type graph.
// An added typed position must gain a real encoded-container case here.
const positions=[
 ['Payload.conditions[].expression.evaluator.extension',(a,e)=>a.payload.conditions[0].expression.evaluator.extension=e],
 ['Payload.contracts[].allowed_result_types[].extension',(a,e)=>a.payload.contracts[0].allowed_result_types.push({...term('future-result'),extension:e})],
 ['Payload.contracts[].form.extension',(a,e)=>a.payload.contracts[0].form.extension=e],
 ['Manifest.lineage[].relationship.extension',(a,e)=>a.manifest.lineage[0].relationship.extension=e],
 ['Payload.dependencies[].data_type.extension',(a,e)=>a.payload.dependencies[0].data_type.extension=e],
 ['Payload.extensions[]',(a,e)=>a.payload.extensions=[e]],
 ['Payload.judgments[].extensions[]',(a,e)=>a.payload.judgments[0].extensions=[e]],
 ['Payload.judgments[].result.result_type.extension',(a,e)=>{const j=a.payload.judgments[0];j.result.result_type.extension=e;j.result_contract.allowed_result_types.push(structuredClone(j.result.result_type));}],
 ['Payload.judgments[].result_contract.allowed_result_types[].extension',(a,e)=>a.payload.judgments[0].result_contract.allowed_result_types.push({...term('future-result'),extension:e})],
 ['Payload.judgments[].result_contract.form.extension',(a,e)=>a.payload.judgments[0].result_contract.form.extension=e],
 ['Payload.relationships[].effect.extension',(a,e)=>a.payload.relationships[0].effect.extension=e],
 ['Payload.relationships[].kind.extension',(a,e)=>a.payload.relationships[0].kind.extension=e],
 ['Payload.relationships[].operator.extension',(a,e)=>a.payload.relationships[0].operator.extension=e],
 ['Payload.relationships[].participants[].role.extension',(a,e)=>a.payload.relationships[0].participants[0].role.extension=e],
];
function extensionPaths(root){
 const paths=new Set();
 function walk(schema,at,ancestors){
  if(schema.$ref){const type=schema.$ref.slice(8);if(type==='Extension'){paths.add(at);return;}if(ancestors.includes(type))return;walk(types[type],at,[...ancestors,type]);}
  for(const [key,child]of Object.entries(schema.properties??{}))walk(child,at+'.'+key,ancestors);
  if(schema.items)walk(schema.items,at+'[]',ancestors);
  for(const branch of [...(schema.oneOf??[]),...(schema.anyOf??[]),...(schema.allOf??[]),...[schema.if,schema.then,schema.else].filter(Boolean)])walk(branch,at,ancestors);
 }
 walk(types[root],root,[root]);return [...paths];
}
async function admit(asset,status,reason=null){
 const bytes=F.encode(asset,req,{deflate:true}),node=await admitNode(bytes),browser=admitBrowser(bytes);
 for(const result of [node,browser]){assert.equal(result.status,status,JSON.stringify(result));assert.equal(result.reason??null,reason);if(status==='catalog_only'){assert.equal(result.states.interpretation,'blocked');assert.equal(result.snapshot,undefined);assert.equal(result.ir,undefined);}}
 if(status==='accepted')assert.deepEqual(inspectSnapshot(node.snapshot).ir,inspectSnapshot(browser.snapshot).ir);
 else assert.deepEqual(node,browser);
 return node;
}
function badComponent(asset){
 const j=asset.payload.judgments[2],carrier=component_semantics.definition.carriers.component;
 j.extensions=[{id:carrier.id,critical:true,definition:'Invalid registered component definition.',value:{kind:'text',value:'invalid'}}];
 return j;
}
function policy(asset,invalid=false){
 const j=asset.payload.judgments[2],d=static_policy.definition;
 j.formation_rule.condition_refs=[];
 const rule={output_contract_ref:j.result_contract.id,candidates:[{key:'one',title:'One',meaning:'An authored candidate.',result_type:{term:'text',vocabulary:'core'},value:{kind:'text',value:'One'}}],strategy:{kind:'priority',direction:'higher-first'},entries:[{key:'entry',condition:{kind:'interpreted',statement:'A condition.'},priority:1,candidate_key:invalid?'missing':'one'}],fallback:{kind:'no_match',statement:'No qualifying condition.'}};
 const carrier={contract_id:d.id,contract_version:d.version,definition_digest:static_policy.definition_digest,judgment_ref:j.id,rule_digest:H(rule),rule};
 j.extensions=[{id:d.carrier.id,critical:true,definition:d.carrier.definition,value:semantic(carrier)}];return j;
}
test('encoded admission fixtures cover every Manifest and Payload Extension type position',()=>{
 assert.deepEqual(positions.map(([name])=>name).sort(),[...extensionPaths('Manifest'),...extensionPaths('Payload')].sort());
});
// These five CS1 input positions no longer belong to the R2 type graph.
// Keep an explicit rejection proof for each, alongside all current positions.
for(const [name,put] of [
 ['formation_rule.conditions evaluator',(a,e)=>a.payload.judgments[1].formation_rule.conditions=[{kind:'external_evaluator',evaluator:{term:'old-evaluator',extension:e},declaration:{kind:'interpreted',statement:'Retired inline condition.'}}]],
 ['method.component.method.extension',(a,e)=>a.payload.judgments[0].method.components[0].method.extension=e],
 ['method.method.extension',(a,e)=>a.payload.judgments[0].method.method.extension=e],
 ['judgment.mode',(a,e)=>a.payload.judgments[0].mode={term:'old-mode',extension:e}],
 ['judgment.nature',(a,e)=>a.payload.judgments[0].nature={term:'old-nature',extension:e}],
])test('retired input position '+name+' cannot silently regain current extension authority',async()=>{
 await admit(fixture(),'accepted');
 for(const critical of [false,true]){const a=fixture();put(a,unknown(critical));await admit(a,'rejected','READ_CORE_INVALID');}
});
test('rich fixture is valid before any unknown extension is inserted',()=>admit(fixture(),'accepted'));
for(const [name,put]of positions){
 test('unknown critical at '+name+' blocks interpretation without evaluating its value',async()=>{
  const a=fixture();put(a,unknown());globalThis.kdnaAdmissionExecuted=false;
  await admit(a,'rejected','READ_UNSUPPORTED_CRITICAL');assert.equal(globalThis.kdnaAdmissionExecuted,false);delete globalThis.kdnaAdmissionExecuted;
 });
 test('unknown noncritical at '+name+' stays opaque and permits complete interpretation',async()=>{
  const a=fixture();put(a,unknown(false));await admit(a,'accepted');
 });
 for(const [kind,damage,reason]of [['component',badComponent,'READ_COMPONENT_DECLARATION_INVALID'],['policy',a=>policy(a,true),'READ_STATIC_POLICY_INVALID']]){
  test('invalid '+kind+' remains rejected with unknown critical at '+name,async()=>{
   const a=fixture();put(a,unknown());damage(a);await admit(a,'rejected',reason);
  });
 }
}
for(const [kind,damage,reason]of [['component',badComponent,'READ_COMPONENT_DECLARATION_INVALID'],['policy',a=>policy(a,true),'READ_STATIC_POLICY_INVALID']]){
 test('invalid '+kind+' alone retains its specific failure',async()=>{const a=fixture();damage(a);await admit(a,'rejected',reason);});
 for(const order of ['before','after'])test('invalid '+kind+' is not masked by unknown critical '+order+' its carrier',async()=>{
  const a=fixture(),j=damage(a);j.extensions[order==='before'?'unshift':'push'](unknown());await admit(a,'rejected',reason);
 });
}
test('a supported static policy plus unknown semantics rejects without a catalog carrier',async()=>{
 const a=fixture();policy(a);a.payload.extensions=[unknown()];await admit(a,'rejected','READ_UNSUPPORTED_CRITICAL');
});
for(const [kind,carrier,reason]of [
 ['component',component_semantics.definition.carriers.component,'READ_COMPONENT_DECLARATION_INVALID'],
 ['legacy presence',{id:'kdna.method-declaration-presence/1',definition:'Authored method field presence for KDNA public component semantics 1.0.0.'},'READ_UNSUPPORTED_CRITICAL'],
 ['adoption',component_semantics.definition.carriers.adoption,'READ_COMPONENT_ADOPTION_INVALID'],
 ['static policy',static_policy.definition.carrier,'READ_STATIC_POLICY_INVALID'],
])test('registered '+kind+' carrier cannot hide in Manifest lineage',async()=>{
 const a=fixture();a.manifest.lineage[0].relationship.extension={id:carrier.id,critical:true,definition:carrier.definition,value:{kind:'text',value:'Opaque misplaced declaration.'}};
 await admit(a,'rejected',reason);
});
test('every decidable graph and source obligation wins over unknown critical semantics',async()=>{
 const cases=[
  a=>a.payload.judgments[0].subject.actor_ids=['missing'],
  a=>a.payload.judgments[0].result_contract.maximum=0,
  a=>a.payload.judgments[0].result.value={kind:'number',value:1},
  a=>a.payload.dependencies[0].producer.result_contract_ref='missing',
  a=>a.payload.relationships[0].participants[1].judgment_ref='missing',
  a=>{a.payload.judgments[0].parent_ref='j:1';a.payload.judgments[1].parent_ref='j:0';},
  a=>a.manifest.content_digest='sha256:'+'0'.repeat(64),
 ];
 for(const damage of cases){const a=fixture();a.manifest.lineage[0].relationship.extension=unknown();damage(a);await admit(a,'rejected','READ_CORE_INVALID');}
});
async function read(asset,mode='exact_selection'){
 const {readNode}=req('@aikdna/kdna-read/node');
 const {createTrustedReadControlProvider,createTrustedHostReadProvider}=req('@aikdna/kdna-read/embedding');
 const control=createTrustedReadControlProvider(()=>({admission_response_limit_bytes:4096}));
 const host=createTrustedHostReadProvider({observe({request,snapshot}){
  const view=snapshot.status==='catalog_only'?snapshot:inspectSnapshot(snapshot),now=Date.now();
  return {host_id:'synthetic-admission-test',host_epoch:'test',decision_id:'test:'+request.request_id,request_id:request.request_id,snapshot_id:view.snapshot_id??view.carrier_id,A:view.digests.A.observed,C:view.digests.C.observed,scope:view.ir?view.ir.nodes.map(n=>n.id):view.catalog.map(n=>n.node_ref),issued_at:now-1,expires_at:now+60000,current_ms:now,decision:'allow',policy_id:'synthetic-only'};
 }});
 return readNode(F.encode(asset,req),F.candidate(tuple,asset,mode),control,host);
}
test('Manifest unknown critical reaches the current Read rejection boundary',async()=>{
 const a=fixture();a.manifest.lineage[0].relationship.extension=unknown();const result=await read(a,'catalog');
 assert.equal(result.envelope.status,'rejected');assert.equal(result.envelope.diagnostics[0].code,'READ_UNSUPPORTED_CRITICAL');assert.equal(result.envelope.content,null);
});
test('languages retain their original array and values through Core and Read',async()=>{
 const a=fixture();a.manifest.languages=['zh-Hant','en','und'];const result=await admit(a,'accepted');
 assert.deepEqual(inspectSnapshot(result.snapshot).ir.nodes.find(n=>n.role==='asset_declaration').value.languages,a.manifest.languages);
 const output=await read(a);assert.equal(output.envelope.status,'ready');
 assert.deepEqual(output.envelope.content.closure.find(n=>n.role==='asset_declaration').value.languages,a.manifest.languages);
 const absent=fixture();delete absent.manifest.languages;await admit(absent,'rejected','READ_CORE_INVALID');
});
test('current catalog preserves complete focus and rejects retired navigation labels and unknown critical content',async()=>{
 const a=fixture(),j=a.payload.judgments[0];j.focus='COMPLETE_AUTHORED_QUESTION_FOR_CATALOG';
 const admitted=await admit(a,'accepted'),ordinary=inspectSnapshot(admitted.snapshot).ir.catalog;
 assert.equal(ordinary[0].focus,j.focus);assert.ok(ordinary.every(x=>!Object.hasOwn(x,'label')));
 const ready=await read(a,'catalog');assert.equal(ready.envelope.status,'ready');assert.equal(ready.envelope.content.catalog[0].focus,j.focus);
 const labeled=structuredClone(a);labeled.payload.judgments[0].label='retired label';await admit(labeled,'rejected','READ_CORE_INVALID');
 a.payload.extensions=[unknown()];const blocked=await admit(a,'rejected','READ_UNSUPPORTED_CRITICAL');assert.equal(blocked.catalog,undefined);
 const output=await read(a,'catalog');assert.equal(output.envelope.status,'rejected');assert.equal(output.envelope.content,null);assert.equal(JSON.stringify(output).includes(j.focus),false);
});
