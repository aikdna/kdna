'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/r2-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const {admitBrowser}=req('@aikdna/kdna-core/browser'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {readBrowser}=req('@aikdna/kdna-read/browser'),embedding=req('@aikdna/kdna-read/embedding');
const tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple;
const control=embedding.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000}));
function prepared(name='simple',edit=()=>{}){
  const asset=F.asset(tuple,name);edit(asset);
  const bytes=F.encode(asset,req,{deflate:true});return {asset,bytes,admitted:admitBrowser(bytes)};
}
function allowedHost(filter=scope=>scope,clock=()=>1000){
  return embedding.createTrustedHostReadProvider({observe:({request,snapshot})=>{
    const view=inspectSnapshot(snapshot),now=clock();
    return {host_id:'host:r2',host_epoch:'epoch:r2',decision_id:'decision:r2',request_id:request.request_id,snapshot_id:view.snapshot_id,A:view.digests.A.observed,C:view.digests.C.observed,scope:filter(view.ir.nodes.map(n=>n.id),view),issued_at:now-100,expires_at:now+1000,current_ms:now,decision:'allow',policy_id:'policy:r2'};
  }});
}
function request(asset,mode='whole_asset',id=asset.payload.judgments[0].id){return F.candidate(tuple,asset,mode,id,8000000);}
function ready(result){assert.equal(result.channel,'read_envelope',JSON.stringify(result));assert.equal(result.envelope.status,'ready',JSON.stringify(result));return result.envelope.content;}
for(const name of ['simple','coverage-basic','complex','branches','method-output','authored-merge','feedback','observed-private-source']){
  test('R2 '+name+' preserves authored questions and complete selected semantics',async()=>{
    const {asset,admitted}=prepared(name);assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
    const host=allowedHost();
    const catalog=ready(await readBrowser(admitted.snapshot,request(asset,'catalog'),control,host));
    assert.deepEqual(catalog.catalog.map(x=>x.focus),asset.payload.judgments.map(x=>x.focus));
    assert.ok(catalog.catalog.every(x=>!Object.hasOwn(x,'label')));assert.deepEqual(catalog.asset_index,[]);assert.deepEqual(catalog.closure,[]);
    for(const authored of asset.payload.judgments){
      const content=ready(await readBrowser(admitted.snapshot,request(asset,'exact_selection',authored.id),control,host));
      const node=content.closure.find(x=>x.target.kind==='judgment'&&x.target.id===authored.id);
      assert.ok(node);assert.equal(node.value.focus,authored.focus);assert.deepEqual(node.value.core_expression,authored.core_expression);
      assert.equal(node.value.answer_kind,authored.answer_kind);assert.deepEqual(node.value.method.method,authored.method.method);
      assert.deepEqual(node.value.result??null,authored.result??null);assert.deepEqual(node.value.formation_rule??null,authored.formation_rule??null);
      for(const component of authored.method.components)assert.ok(content.closure.some(x=>x.target.kind==='component'&&x.target.id===component.id),'missing component '+component.id);
    }
  });
}
test('whole_asset discovers and expands unreferenced definition, external-version example and history without a judgment anchor',async()=>{
  const {asset,admitted}=prepared('complex');assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const host=allowedHost(),content=ready(await readBrowser(admitted.snapshot,request(asset),control,host));
  for(const [kind,id] of [['material','d0'],['example','e0'],['revision','h0']]){
    const item=content.asset_index.find(x=>x.target.kind===kind&&x.target.id===id);assert.ok(item,kind+':'+id);
    assert.equal(item.body_delivery,'deferred');const handle=content.expansion_handles.find(h=>h.handle_id===item.handle_id);assert.ok(handle);assert.deepEqual(handle.anchor,{kind:'asset'});
    const expanded=ready(await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle},control,host));
    assert.equal(expanded.selected,null);assert.ok(expanded.closure.some(x=>x.target.kind===kind&&x.target.id===id));
    if(kind==='example')assert.deepEqual(expanded.closure.find(x=>x.target.kind===kind&&x.target.id===id).value.adopted_judgments,asset.payload.examples.find(x=>x.id===id).adopted_judgments);
  }
});
test('denied catalog or index entry rejects the complete mode without leaking its question, id or hidden count',async()=>{
  const {asset,admitted}=prepared('complex');assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  for(const [mode,kind,id] of [['catalog','judgment','qB'],['whole_asset','material','d0'],['exact_selection','material','d1']]){
    const host=allowedHost((ids,view)=>ids.filter(n=>!view.ir.nodes.some(x=>x.id===n&&x.target.kind===kind&&x.target.id===id)));
    const response=await readBrowser(admitted.snapshot,request(asset,mode,'qA'),control,host);
    assert.equal(response.envelope.status,'rejected');assert.equal(response.envelope.content,null);assert.equal(response.envelope.asset,null);
    assert.equal(response.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');
  }
});
test('asset handles are registered to the issuing Host and cannot change target or anchor',async()=>{
  const {asset,admitted}=prepared('complex');assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const host=allowedHost(),content=ready(await readBrowser(admitted.snapshot,request(asset),control,host));
  const handle=content.expansion_handles[0];assert.ok(handle);
  const forged={...handle,target:{kind:'material',id:'not-issued'}};
  for(const [candidate,provider] of [[forged,host],[handle,allowedHost()]]){
    const response=await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle:candidate},control,provider);
    assert.equal(response.envelope.content,null);assert.equal(response.envelope.diagnostics[0].code,'READ_HANDLE_UNTRUSTED');
  }
});
test('budget shortage fails rather than truncating required semantic closure',async()=>{
  const {asset,admitted}=prepared('complex');assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const response=await readBrowser(admitted.snapshot,{...request(asset,'exact_selection','qA'),budget_bytes:1500},control,allowedHost());
  assert.notEqual(response.envelope?.status,'ready');assert.equal(response.envelope?.content??null,null);
  assert.equal(response.envelope?.diagnostics[0]?.code??response.control?.semantic_cause,'READ_BUDGET_INSUFFICIENT');
});
test('fixed external qualification remains visible in IR but blocks complete selected Read until its required body resolves',async()=>{
  const {asset,admitted}=prepared('simple',a=>{a.payload.judgments[0].core_expression={kind:'authored',statement:'An expressly qualified preference.',qualification_refs:[{kind:'material',id:'external-condition',asset:{asset_id:'asset:external',asset_version:'1',judgment_version:'1'}}]};});
  assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const view=inspectSnapshot(admitted.snapshot);assert.ok(view.ir.unresolved_external.some(r=>r.target.id==='external-condition'));
  const host=allowedHost();ready(await readBrowser(admitted.snapshot,request(asset,'catalog'),control,host));
  const response=await readBrowser(admitted.snapshot,request(asset,'exact_selection'),control,host);
  assert.equal(response.envelope.status,'rejected');assert.equal(response.envelope.content,null);assert.equal(response.envelope.diagnostics[0].code,'READ_UNRESOLVED_EXTERNAL');
});
test('unknown critical semantics reject all four Read modes before any Host observation',async()=>{
  const healthy=prepared('complex'),host=allowedHost();const body=ready(await readBrowser(healthy.admitted.snapshot,request(healthy.asset),control,host));
  const handle=body.expansion_handles[0];assert.ok(handle);
  const {asset,bytes}=prepared('complex',a=>{a.payload.extensions=[{id:'urn:r2:unknown',critical:true,definition:'Unknown future meaning',value:{kind:'text',value:'opaque'}}];});
  let observations=0;const forbidden=embedding.createTrustedHostReadProvider({observe(){observations++;throw Error('Must not reach Host');}});
  for(const mode of ['catalog','whole_asset','exact_selection','expand']){
    const candidate=mode==='expand'?{...request(asset),mode,handle}:request(asset,mode);
    const response=await readBrowser(bytes,candidate,control,forbidden);
    assert.equal(response.envelope.status,'rejected',JSON.stringify(response));assert.equal(response.envelope.content,null);assert.equal(response.envelope.diagnostics[0].code,'READ_UNSUPPORTED_CRITICAL');
  }
  assert.equal(observations,0);
});

function scopedDeclarations(a){
  for(const [id,kind,applies_to] of [['fGlobal','foundation',{kind:'asset'}],['fC','premise',{kind:'judgments',judgment_refs:['qC']}]])a.payload.materials.push({id,kind,statement:'RC2_BODY_'+id,source_refs:[],applies_to});
  a.payload.kernel.foundation_refs=[{kind:'material',id:'fGlobal'},{kind:'material',id:'fC'}];
  a.payload.declarations.boundaries={state:'provided',value:[['bGlobal',{kind:'asset'}],['bC',{kind:'judgments',judgment_refs:['qC']}]].map(([id,applies_to])=>({id,effect:'limit',statement:'RC2_BODY_'+id,declared_by:'author',applies_to,exception_refs:[]}))};
  a.manifest.history.entries[0].summary='RC2_DEFERRED_HISTORY_BODY';
}
function requiredQuestionScope(view,id){
  const ids=new Set(view.ir.mandatory_closures.find(c=>c.selection.judgment_id===id).node_ids);
  const judgments=new Set([id]);
  for(const node of view.ir.nodes)if(ids.has(node.id)&&node.role==='relationship')for(const p of node.value.participants)judgments.add(p.judgment_ref);
  for(const item of view.ir.catalog)if(judgments.has(item.judgment_id))ids.add(item.node_ref);
  for(const node of view.ir.nodes)if(node.role==='asset_declaration')ids.add(node.id);
  return ids;
}
test('RC2 selected mandatory and adjacent catalog permission is sufficient without unrelated asset permissions',async()=>{
  const {asset,admitted}=prepared('complex',scopedDeclarations);assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const host=allowedHost((ids,view)=>ids.filter(id=>requiredQuestionScope(view,'qA').has(id)));
  const response=await readBrowser(admitted.snapshot,request(asset,'exact_selection','qA'),control,host),content=ready(response);
  assert.deepEqual(content.catalog.map(x=>x.judgment_id),['qA','qB']);
  for(const [kind,id] of [['material','d0'],['example','e0'],['revision','h0'],['material','fC'],['boundary','bC'],['judgment','qC']])assert.ok(!content.asset_index.some(x=>x.target.kind===kind&&x.target.id===id));
  for(const id of ['fGlobal','bGlobal'])assert.ok(content.closure.some(x=>x.target.id===id&&x.value.statement==='RC2_BODY_'+id));
  const serialized=JSON.stringify(response);
  for(const sentinel of ['RC2_BODY_fC','RC2_BODY_bC','RC2_DEFERRED_HISTORY_BODY','"id":"fC"','"id":"bC"','"qC"'])assert.ok(!serialized.includes(sentinel),sentinel);
  for(const node of [...content.declarations,...content.closure,...content.provenance.declarations].filter(n=>n.role==='asset_declaration')){
    assert.ok(!Object.hasOwn(node.value,'reading_order'));
    assert.deepEqual(node.value.kernel.foundation_refs,[{kind:'material',id:'fGlobal'}]);
    assert.deepEqual(node.value.declarations.boundaries,{state:'provided'});
    assert.deepEqual(node.value.history,{coverage:asset.manifest.history.coverage,statement:asset.manifest.history.statement});
  }
  assert.ok(response.envelope.omissions.some(x=>x.field==='reading_order'&&x.reason==='not_in_mode'));
  assert.ok(response.envelope.omissions.some(x=>x.field==='kernel.foundation_refs'&&x.reason==='not_in_mode'));
});
test('RC2 applicable global foundation, global boundary and required adjacent catalog remain all-or-reject',async()=>{
  const {asset,admitted}=prepared('complex',scopedDeclarations);assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  for(const target of ['fGlobal','bGlobal','qB']){
    const host=allowedHost((ids,view)=>ids.filter(id=>!view.ir.nodes.some(n=>n.id===id&&n.target.id===target)));
    const response=await readBrowser(admitted.snapshot,request(asset,'exact_selection','qA'),control,host);
    assert.equal(response.envelope.status,'rejected',target);assert.equal(response.envelope.content,null);assert.equal(response.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');
  }
});
test('RC2 changing the selected question supplies its scoped foundation and boundary in full',async()=>{
  const {asset,admitted}=prepared('complex',scopedDeclarations);assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const content=ready(await readBrowser(admitted.snapshot,request(asset,'exact_selection','qC'),control,allowedHost((ids,view)=>ids.filter(id=>requiredQuestionScope(view,'qC').has(id)))));
  for(const id of ['fGlobal','fC','bGlobal','bC'])assert.ok(content.closure.some(n=>n.target.id===id&&n.value.statement==='RC2_BODY_'+id));
  assert.deepEqual(content.declarations[0].value.kernel.foundation_refs,asset.payload.kernel.foundation_refs);
});
test('RC2 whole asset preserves complete discovery but defers history body consistently in every copy',async()=>{
  const {asset,admitted}=prepared('complex',scopedDeclarations);assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const content=ready(await readBrowser(admitted.snapshot,request(asset),control,allowedHost()));
  const history=content.asset_index.find(x=>x.target.kind==='revision'&&x.target.id==='h0');assert.equal(history.body_delivery,'deferred');
  assert.ok(!JSON.stringify(content).includes('RC2_DEFERRED_HISTORY_BODY'));
  assert.deepEqual(content.declarations[0].value.reading_order,asset.payload.reading_order);
  assert.deepEqual(content.declarations[0].value.kernel.foundation_refs,asset.payload.kernel.foundation_refs);
  for(const id of ['bGlobal','bC'])assert.ok(content.closure.some(n=>n.target.id===id&&n.value.statement==='RC2_BODY_'+id));
  for(const denied of ['d0','h0','fC']){
    const rejected=await readBrowser(admitted.snapshot,request(asset),control,allowedHost((ids,v)=>ids.filter(id=>!v.ir.nodes.some(n=>n.id===id&&n.target.id===denied))));
    assert.equal(rejected.envelope.status,'rejected');assert.equal(rejected.envelope.content,null);assert.equal(rejected.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');
  }
});
test('RC2 asset-anchored history expansion needs its closure without redisclosing unrelated index entries',async()=>{
  const {asset,admitted}=prepared('complex',scopedDeclarations);assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  let scope=null;const host=allowedHost(ids=>scope?ids.filter(id=>scope.has(id)):ids);
  const whole=ready(await readBrowser(admitted.snapshot,request(asset),control,host));
  const handle=whole.expansion_handles.find(h=>h.target.kind==='revision'&&h.target.id==='h0');assert.ok(handle);
  scope=new Set(handle.scope);
  const response=await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle},control,host),content=ready(response);
  assert.deepEqual(content.closure.find(n=>n.target.kind==='revision'&&n.target.id==='h0').value,asset.manifest.history.entries[0]);
  assert.ok(!content.asset_index.some(x=>x.target.kind==='material'&&x.target.id==='d0'));
  assert.ok(!JSON.stringify(content).includes('RC2_BODY_fC'));
  scope.delete(inspectSnapshot(admitted.snapshot).ir.nodes.find(n=>n.target.kind==='revision'&&n.target.id==='h0').id);
  const rejected=await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle},control,host);
  assert.equal(rejected.envelope.status,'rejected');assert.equal(rejected.envelope.content,null);assert.equal(rejected.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');
});

test('RC2 complete immediate historical tuple is unsupported before shared-axis mixed detection',async()=>{
  const {asset,admitted}=prepared('complex');assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const historical={container:'0.5.0',payload_profile:'kdna.payload.judgment',payload_version:'0.4.0',core:'kdna.core/0.7.0',ir:'kdna.canonical-ir/0.5.0',runtime:'kdna.runtime-capsule/0.2.0',plan:'kdna.consumption-plan/0.2.0',host:'kdna.agent-host/0.2.0',trace:'kdna.judgment-trace/0.2.0',read:'kdna.read/0.5.0'};
  let calls=0;const forbidden=embedding.createTrustedHostReadProvider({observe(){calls++;throw Error('Version rejection must precede Host');}});
  for(const mode of ['whole_asset','catalog','exact_selection','expand']){
    const response=await readBrowser(admitted.snapshot,{...request(asset,mode),tuple:historical},control,forbidden);
    assert.equal(response.envelope.status,'rejected');assert.equal(response.envelope.content,null);assert.equal(response.envelope.diagnostics[0].code,'READ_UNSUPPORTED_VERSION');
  }
  for(const key of Object.keys(tuple).filter(key=>tuple[key]!==historical[key])){
    const response=await readBrowser(admitted.snapshot,{...request(asset),tuple:{...tuple,[key]:historical[key]}},control,forbidden);
    assert.equal(response.envelope.diagnostics[0].code,'READ_MIXED_VERSION_TUPLE',key);
  }
  assert.equal(calls,0);
});

function setRelation(a,kind){
  const definition=require(path.join(coreDir,'src/public-contract/generated-contract.json')).r2_semantics.relationship_tuples[kind];
  a.payload.relationships=[{id:'rel1',kind:{term:kind},direction:definition.direction,participants:[{judgment_ref:'qB',role:{term:definition.roles[0]}},{judgment_ref:'qA',role:{term:definition.roles[1]}}],operator:{term:definition.operator},effect:{term:definition.effect},statement:'Explicit direction and semantic role, without runtime inference.'}];
}
test('D007 a catalog-only counterpart never becomes an automatic body handle under a broad Host',async()=>{
  const {asset,admitted}=prepared('complex');assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  for(const host of [allowedHost(),allowedHost((ids,v)=>ids.filter(id=>requiredQuestionScope(v,'qA').has(id)))]){
    const response=await readBrowser(admitted.snapshot,request(asset,'exact_selection','qA'),control,host),content=ready(response);
    const peer=content.catalog.find(x=>x.judgment_id==='qB');assert.ok(peer);
    assert.ok(!content.asset_index.some(x=>x.target.kind==='judgment'&&x.target.id==='qB'));
    assert.ok(!content.expansion_handles.some(x=>x.target.kind==='judgment'&&x.target.id==='qB'));
    assert.ok(response.envelope.omissions.some(x=>x.target===peer.node_ref&&x.field==='judgment'&&x.reason==='outside_selection'&&!x.expandable&&x.handle_id===null));
  }
});
test('D007 forward support, qualify and conflict cannot demote required counterpart bodies to catalog roles',async()=>{
  for(const kind of ['support','qualify','conflict']){
    const {asset,admitted}=prepared('complex',a=>setRelation(a,kind));assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
    const view=inspectSnapshot(admitted.snapshot),deny=view.ir.nodes.find(n=>n.target.kind==='component'&&n.owner_judgment_id==='qB').id;
    const rejected=await readBrowser(admitted.snapshot,request(asset,'exact_selection','qA'),control,allowedHost(ids=>ids.filter(id=>id!==deny)));
    assert.equal(rejected.envelope.status,'rejected',kind);assert.equal(rejected.envelope.content,null);assert.equal(rejected.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');
    const full=ready(await readBrowser(admitted.snapshot,request(asset,'exact_selection','qA'),control,allowedHost()));
    assert.ok(full.closure.some(n=>n.target.kind==='judgment'&&n.target.id==='qB'));
    if(kind!=='conflict'){
      const reverse=ready(await readBrowser(admitted.snapshot,request(asset,'exact_selection','qB'),control,allowedHost((ids,v)=>ids.filter(id=>requiredQuestionScope(v,'qB').has(id)))));
      assert.ok(reverse.catalog.some(n=>n.judgment_id==='qA'));assert.ok(!reverse.closure.some(n=>n.target.kind==='judgment'&&n.target.id==='qA'));
    }
  }
});
test('D007 a required dependency still supplies the producer body and rejects its missing permission',async()=>{
  const {asset,admitted}=prepared('feedback',a=>a.payload.dependencies.push({id:'observed-input',producer:{kind:'judgment_result',judgment_ref:'qSignal',result_contract_ref:'qSignal-out'},producer_port:'result',consumer_judgment_ref:'qAdjust',consumer_port:'signal',input_role:'signal',data_type:{term:'number'},required:true,purpose:'Supply the authored required observation.'}));
  assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const view=inspectSnapshot(admitted.snapshot),deny=view.ir.nodes.find(n=>n.target.kind==='component'&&n.owner_judgment_id==='qSignal').id;
  const rejected=await readBrowser(admitted.snapshot,request(asset,'exact_selection','qAdjust'),control,allowedHost(ids=>ids.filter(id=>id!==deny)));
  assert.equal(rejected.envelope.status,'rejected');assert.equal(rejected.envelope.content,null);assert.equal(rejected.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');
  const full=ready(await readBrowser(admitted.snapshot,request(asset,'exact_selection','qAdjust'),control,allowedHost()));
  assert.ok(full.closure.some(n=>n.target.kind==='judgment'&&n.target.id==='qSignal'));
});
test('D007 an explicit expansion remains a body request and both Host observations retain required catalog permission',async()=>{
  const {asset,admitted}=prepared('complex');assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  let narrow=false;const host=allowedHost((ids,v)=>narrow?ids.filter(id=>requiredQuestionScope(v,'qA').has(id)):ids);
  const whole=ready(await readBrowser(admitted.snapshot,request(asset),control,host));
  const handle=whole.expansion_handles.find(h=>h.target.kind==='judgment'&&h.target.id==='qB');assert.ok(handle);narrow=true;
  const expanded=await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle},control,host);
  assert.equal(expanded.envelope.status,'rejected');assert.equal(expanded.envelope.content,null);assert.equal(expanded.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');
  let observations=0;const revoked=allowedHost((ids,v)=>{observations++;return observations===1?ids:ids.filter(id=>!v.ir.catalog.some(c=>c.judgment_id==='qB'&&c.node_ref===id));});
  const selected=await readBrowser(admitted.snapshot,request(asset,'exact_selection','qA'),control,revoked);
  assert.equal(observations,2);assert.equal(selected.envelope.status,'rejected');assert.equal(selected.envelope.content,null);assert.equal(selected.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');
});
test('D007 mode roles survive changed question identifiers and additional unrelated definitions',async()=>{
  const {asset,admitted}=prepared('complex',a=>{
    for(let i=0;i<4;i++)a.payload.materials.push({...structuredClone(a.payload.materials.find(x=>x.id==='d0')),id:'extra-definition-'+i,term:'Distinct additional term '+i});
    const text=JSON.stringify(a.payload).replaceAll('"qA"','"question:first"').replaceAll('"qB"','"question:second"').replaceAll('"qC"','"question:third"');a.payload=JSON.parse(text);
  });
  assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const content=ready(await readBrowser(admitted.snapshot,request(asset,'exact_selection','question:first'),control,allowedHost((ids,v)=>ids.filter(id=>requiredQuestionScope(v,'question:first').has(id)))));
  assert.deepEqual(content.catalog.map(x=>x.judgment_id),['question:first','question:second']);
  assert.ok(!JSON.stringify(content).includes('extra-definition-'));assert.ok(!JSON.stringify(content).includes('question:third'));
});

test('D008 explicit history and example expansions have fixed required scope independent of Host breadth',async()=>{
  const {asset,admitted}=prepared('complex');assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const view=inspectSnapshot(admitted.snapshot);let scope=null;
  const host=allowedHost(ids=>scope?ids.filter(id=>scope.has(id)):ids),whole=ready(await readBrowser(admitted.snapshot,request(asset),control,host));
  const history=whole.expansion_handles.find(h=>h.target.kind==='revision'&&h.target.id==='h0');
  const example=whole.expansion_handles.find(h=>h.target.kind==='example'&&h.target.id==='e0');assert.ok(history&&example);
  const broad=ready(await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle:history},control,host));
  scope=new Set(history.scope);const narrow=ready(await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle:history},control,host));
  assert.deepEqual(broad.asset_index,narrow.asset_index);assert.deepEqual(broad.expansion_handles,[]);assert.deepEqual(narrow.expansion_handles,[]);
  assert.deepEqual(narrow.closure.find(n=>n.target.kind==='revision').value.affected_refs,asset.manifest.history.entries[0].affected_refs);
  assert.ok(!JSON.stringify(narrow).includes(asset.payload.examples[0].application));
  const author=view.ir.nodes.find(n=>n.target.kind==='actor'&&n.target.id==='author');assert.ok(scope.has(author.id));scope.delete(author.id);
  const deniedAuthor=await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle:history},control,host);
  assert.equal(deniedAuthor.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');assert.equal(deniedAuthor.envelope.content,null);
  scope=new Set(example.scope);const full=ready(await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle:example},control,host));
  for(const [kind,id] of [['example','e0'],['example_result','er0'],['contract','example-out']])assert.ok(full.closure.some(n=>n.target.kind===kind&&n.target.id===id));
  const contract=view.ir.nodes.find(n=>n.target.kind==='contract'&&n.target.id==='example-out');scope.delete(contract.id);
  const deniedContract=await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle:example},control,host);
  assert.equal(deniedContract.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');assert.equal(deniedContract.envelope.content,null);
});
test('D008 a necessary component content_ref cannot be dropped as an optional expansion neighbor',async()=>{
  const {asset,admitted}=prepared('complex',a=>{const c=a.payload.judgments[0].method.components[0];delete c.statement;c.content_ref={kind:'material',id:'d0'};});assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const view=inspectSnapshot(admitted.snapshot);let scope=null;
  const host=allowedHost(ids=>scope?ids.filter(id=>scope.has(id)):ids),whole=ready(await readBrowser(admitted.snapshot,request(asset),control,host));
  const handle=whole.expansion_handles.find(h=>h.target.kind==='component'&&h.target.id==='check-c1');assert.ok(handle);
  scope=new Set(handle.scope);const material=view.ir.nodes.find(n=>n.target.kind==='material'&&n.target.id==='d0');assert.ok(scope.has(material.id));
  const full=ready(await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle},control,host));assert.deepEqual(full.closure.find(n=>n.id===material.id).value,asset.payload.materials.find(m=>m.id==='d0'));
  scope.delete(material.id);const rejected=await readBrowser(admitted.snapshot,{...request(asset),mode:'expand',handle},control,host);
  assert.equal(rejected.envelope.status,'rejected');assert.equal(rejected.envelope.content,null);assert.equal(rejected.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');
});
