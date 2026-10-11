'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const {admitNode}=req('@aikdna/kdna-core/node'),{admitBrowser}=req('@aikdna/kdna-core/browser');
const {inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {versionTuple:tuple,types,component_semantics,static_policy}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
const {digestCanonical:H}=require(path.join(coreDir,'src/public-contract/digests.js'));

// F2: the three public read entries must classify the same input identically.
// Fixtures are built here in code because adding tracked files would move the
// repository inventory count; the entries themselves must not need a new file.
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(buf){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function zipPart(header,name,method,crc,compressed,size,extra){const n=Buffer.from(name);const h=Buffer.alloc(extra?46:30);h.writeUInt32LE(extra?0x02014b50:0x04034b50,0);if(extra){h.writeUInt16LE(20,4);h.writeUInt16LE(20,6);}else{h.writeUInt16LE(20,4);}h.writeUInt16LE(method,extra?10:8);h.writeUInt32LE(crc,extra?16:14);h.writeUInt32LE(compressed,extra?20:18);h.writeUInt32LE(size,extra?24:22);h.writeUInt16LE(n.length,extra?28:26);return Buffer.concat([h,n]);}
function zipFixture(rows){
 const locals=[],centrals=[];let offset=0;
 for(const r of rows){const body=r.body,n=Buffer.from(r.name);locals.push(zipPart(null,r.name,r.method,r.crc,body.length,r.size,false),body);const c=zipPart(null,r.name,r.method,r.crc,body.length,r.size,true);c.writeUInt32LE(((r.mode??0o100644)<<16)>>>0,38);c.writeUInt32LE(offset,42);centrals.push(c);offset+=30+n.length+body.length;}
 const dir=Buffer.concat(centrals);const eocd=Buffer.alloc(22);eocd.writeUInt32LE(0x06054b50,0);eocd.writeUInt16LE(rows.length,8);eocd.writeUInt16LE(rows.length,10);eocd.writeUInt32LE(dir.length,12);eocd.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,dir,eocd]);
}
function f2Fixtures(){
 const mimetype=Buffer.from('application/vnd.kdna.asset'),manifest=Buffer.from('{}');
 const stored=(name,body)=>({name,method:0,body,size:body.length,crc:crc32(body)});
 const foreign=zipFixture([stored('mimetype',mimetype),stored('kdna.json',Buffer.from('{"format_version":"0.5.0"}')),stored('payload.kdnab',Buffer.from('{}'))]);
 const native=zipFixture([stored('mimetype',mimetype),stored('kdna.json',manifest),{name:'sections/pack-0.kdnab',method:8,body:Buffer.from([0,0,0,0,0xff,0xff]),size:16,crc:0}]);
 return {empty:Buffer.alloc(0),random:Buffer.from('not a ZIP container'),foreign,truncatedWhole:native.subarray(0,native.length-30),memberDamaged:native};
}
test('F2: empty, damaged and foreign-family containers classify identically on all three public read entries',async()=>{
 const {admitSectionRequest,createSectionReadAuthority,admitSectionNode}=req('@aikdna/kdna-core/sections-node');
 const bn=req('@aikdna/kdna-core/sections-bytes-node'),bb=req('@aikdna/kdna-core/sections-bytes-browser');
 const nativeTuple={container:'0.6.0',payload_profile:'kdna.payload.judgment',payload_version:'0.5.1',core:'kdna.core/0.8.2',ir:'kdna.canonical-ir/0.6.1',runtime:'kdna.runtime-capsule/0.3.1',plan:'kdna.consumption-plan/0.3.1',host:'kdna.agent-host/0.3.1',trace:'kdna.judgment-trace/0.3.1',read:'kdna.read/0.7.0-candidate'};
 const os=require('node:os'),fs=require('node:fs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kdna-f2-'));
 const shape=r=>{
  assert.equal(r.status,'rejected','invalid input must not establish admission');
  assert.ok(r.snapshot==null,'diagnostic results must not retain an accepted snapshot');
  for(const field of ['body','payload','ir','authority','accepted'])assert.equal(r[field],undefined,'diagnostics must not expose '+field);
  return {reason:r.reason??null,stage:r.stage??null,diagnostic:r.diagnostic??null};
 };
 const cases=[
  ['empty.kdna',v=>v.empty,'READ_INPUT_INVALID','input',null],
  ['random.kdna',v=>v.random,'READ_INPUT_INVALID','input',null],
  ...[1,2,3,4,10,21].map(length=>['prefix-'+length+'.kdna',v=>v.memberDamaged.subarray(0,length),length<4?'READ_INPUT_INVALID':'READ_CORE_INVALID','input',null]),
  ['foreign.kdna',v=>v.foreign,'READ_UNSUPPORTED_VERSION','metadata',{field:'/payload.kdnab',subject:null}],
  ['truncated.kdna',v=>v.truncatedWhole,'READ_CORE_INVALID','input',null],
  ['damaged.kdna',v=>v.memberDamaged,'READ_CORE_INVALID','input',null],
 ];
 try{
  for(const [name,pick,reason,stage,diagnostic] of cases){
   const bytes=pick(f2Fixtures()),file=path.join(dir,name);fs.writeFileSync(file,bytes);
   const nodeReq=admitSectionRequest({request_id:'f2:'+name,tuple:nativeTuple,budget_bytes:1000000,mode:'whole_asset',selection:null,handle:null});
   let authorizeCalls=0;const authorize=()=>{authorizeCalls++;return true;};
   const byPath=shape(await admitSectionNode(file,nodeReq,createSectionReadAuthority(authorize)));
   assert.deepEqual(byPath,{reason,stage,diagnostic},name+' sections-node');
   const nodeBytes=shape(await bn.admitSectionBytesNode(new Uint8Array(bytes),nodeReq,bn.createNativeSectionByteReadAuthority(authorize)));
   assert.deepEqual(nodeBytes,byPath,name+' sections-bytes-node agrees with sections-node');
   const browserReq=bb.admitBrowserSectionRequestJson(JSON.stringify({request_id:'f2:'+name,tuple:nativeTuple,budget_bytes:1000000,mode:'whole_asset',selection:null,handle:null}));
   const byBrowser=shape(await bb.admitSectionBytesBrowser(new Uint8Array(bytes),browserReq,bb.createNativeBrowserSectionReadAuthority(authorize)));
   assert.deepEqual(byBrowser,byPath,name+' sections-bytes-browser agrees with sections-node');
   assert.equal(authorizeCalls,0,name+' must reject before authorization');
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('F2: non-file paths reject before authorization and a FIFO without a writer cannot hang',{skip:process.platform==='win32'},async()=>{
 const fs=require('node:fs'),os=require('node:os'),{execFileSync,spawnSync}=require('node:child_process');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kdna-f2-path-'));
 try{
  const fifo=path.join(dir,'no-writer.fifo');execFileSync('mkfifo',[fifo]);
  const script=`const {createRequire}=require('node:module');const req=createRequire(${JSON.stringify(path.join(coreDir,'package.json'))});const n=req('@aikdna/kdna-core/sections-node');const tuple=req('./src/public-contract/section-common.js').contract.module.versionTuple;let calls=0;const request=n.admitSectionRequest({request_id:'f2:non-file',tuple,budget_bytes:1000000,mode:'whole_asset',selection:null,handle:null});n.admitSectionNode(process.argv[1],request,n.createSectionReadAuthority(()=>{calls++;return true;})).then(r=>console.log(JSON.stringify({status:r.status,reason:r.reason,stage:r.stage,diagnostic:r.diagnostic,authorizeCalls:calls,hasAcceptedContent:r.snapshot!=null||['body','payload','ir','authority','accepted'].some(k=>r[k]!==undefined)})));`;
  for(const file of [dir,fifo]){
   const child=spawnSync(process.execPath,['-e',script,file],{encoding:'utf8',timeout:5000,killSignal:'SIGKILL'});
   assert.equal(child.error,undefined,child.error?.message);
   assert.equal(child.signal,null);assert.equal(child.status,0,child.stderr);
   assert.deepEqual(JSON.parse(child.stdout),{status:'rejected',reason:'READ_INPUT_INVALID',stage:'input',diagnostic:null,authorizeCalls:0,hasAcceptedContent:false});
   assert.throws(()=>process.kill(child.pid,0),{code:'ESRCH'});
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
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
