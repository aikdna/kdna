'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const F = require('../../../conformance/public-contract/test/r2-fixtures.cjs');
const {req,coreDir} = F.runtime(process.env.KDNA_PUBLIC_RUNTIME ?? path.resolve(__dirname,'../../..'));
const {admitNode} = req('@aikdna/kdna-core/node'), {admitBrowser} = req('@aikdna/kdna-core/browser');
const {inspectSnapshot} = req('@aikdna/kdna-core/read-boundary');
const contract = require(path.join(coreDir,'src/public-contract/generated-contract.json')), tuple = contract.versionTuple;
function fixture(name = 'simple', edit = () => {}) { const a = F.asset(tuple,name); edit(a); return a; }
async function check(name, edit = () => {}, status = 'accepted', reason = null) {
  const a = fixture(name,edit), bytes = F.encode(a,req,{deflate:true});
  const node = await admitNode(bytes), browser = admitBrowser(bytes);
  assert.equal(node.status,status,JSON.stringify(node)); assert.equal(browser.status,status,JSON.stringify(browser));
  if (reason) { assert.equal(node.reason,reason); assert.equal(browser.reason,reason); }
  if (status === 'accepted') { assert.deepEqual(inspectSnapshot(node.snapshot).ir,inspectSnapshot(browser.snapshot).ir); return {asset:a,view:inspectSnapshot(node.snapshot)}; }
  assert.equal(node.snapshot,undefined); assert.equal(browser.snapshot,undefined); return {asset:a};
}
for (const name of ['simple','coverage-basic','complex','branches','method-output','authored-merge','feedback','observed-private-source']) test('R2 public byte admission preserves '+name,async () => {
  const {asset,view} = await check(name);
  assert.deepEqual(view.ir.catalog.map(i => i.focus),asset.payload.judgments.map(j => j.focus));
  assert.equal(new Set(view.ir.nodes.map(n => JSON.stringify(n.target))).size,view.ir.nodes.length);
  for (const j of asset.payload.judgments) {
    const closure = view.ir.mandatory_closures.find(x => x.selection.judgment_id === j.id), nodes = view.ir.nodes.filter(n => closure.node_ids.includes(n.id));
    assert.ok(nodes.some(n => n.target.kind === 'judgment' && n.target.id === j.id));
    assert.deepEqual(nodes.find(n => n.target.kind === 'judgment' && n.target.id === j.id).value,j);
  }
});
const negatives = [
  ['missing mandatory answer kind','simple',a => delete a.payload.judgments[0].answer_kind],
  ['unknown method is not defaulted','simple',a => a.payload.judgments[0].method.method.term = 'unknown'],
  ['profile term cannot be a native method','simple',a => a.payload.judgments[0].method.components[0].method.term = 'taxonomy'],
  ['missing mechanism role','simple',a => a.payload.judgments[0].method.components = []],
  ['invalid role for method','simple',a => a.payload.judgments[0].method.components[0].role = '判断标准'],
  ['wrong-kind content reference','simple',a => a.payload.judgments[0].method.components[0].content_ref = {kind:'source',id:'pref'}],
  ['unknown local reference','simple',a => a.payload.judgments[0].method.components[0].content_ref.id = 'absent'],
  ['same-kind identity collision','simple',a => a.payload.actors.push({...a.payload.actors[0]})],
  ['component material refs require typed Ref','simple',a => a.payload.judgments[0].method.components[0].material_refs = ['material-id']],
  ['new line forbids label','simple',a => a.payload.judgments[0].label = 'A short label'],
  ['rule cannot use conclusion text as its core','coverage-basic',a => a.payload.judgments.find(j => j.form === 'rule').core_expression = {kind:'result_text'}],
  ['composite output cannot omit a required part','complex',a => a.payload.judgments[0].result.value.fields.pop()],
  ['plan root cannot be its own child','complex',a => a.payload.judgments[0].method.plan.nodes[0].children[0] = {kind:'plan_node',id:'root'}],
  ['unused control node is not admitted','complex',a => a.payload.judgments[0].method.plan.nodes.push({id:'orphan',kind:'sequence',children:[]})],
  ['data input cannot have literal and link suppliers','complex',a => a.payload.judgments[0].method.plan.nodes.find(n => n.id === 'merge-use').input_bindings.push({port:'left',from:{kind:'literal',value:{kind:'record',fields:[{name:'cost',value:{kind:'number',value:100}},{name:'eligible',value:{kind:'boolean',value:true}},{name:'risk',value:{kind:'text',value:'low'}}]}}})],
  ['plan must bind its final output','complex',a => a.payload.judgments[0].method.plan.result_bindings = []],
  ['wrong output port is not guessed','method-output',a => a.payload.judgments[0].formation_rule.policy.entries[2].then.from.port = 'not-a-port'],
  ['partial is forbidden for authored merge','authored-merge',a => a.payload.judgments[0].formation_rule.policy.on_undetermined = {kind:'partial',independence:'Claimed independent.',statement:'Only part supplied.'}],
  ['authored priority must be unique','authored-merge',a => a.payload.judgments[0].formation_rule.policy.entries[0].priority = 10],
  ['dedicated emissions input forbids literal supplier','authored-merge',a => a.payload.judgments[0].method.plan.nodes.find(n => n.id === 'merge-first').input_bindings.push({port:'emissions',from:{kind:'literal',value:{kind:'text',value:'A'}}})],
  ['dedicated emissions contract cannot be a result','authored-merge',a => a.payload.judgments[0].formation_rule.policy.result_contract_ref.id = 'merge-input'],
  ['collect cannot silently flatten differently shaped item','branches',a => a.payload.contracts[0].shape = {kind:'scalar',scalar_type:'number'}],
  ['illustrative case cannot claim observed result','observed-private-source',a => a.payload.examples[0].kind = 'illustrative'],
  ['current history cannot refer to absent deleted local target','complex',a => a.manifest.history.entries[0].affected_refs = [{kind:'example',id:'deleted'}]],
];
for (const [title,name,edit] of negatives) test(title,() => check(name,edit,'rejected'));
test('different Ref kinds may use the same textual id',async () => {
  const {view} = await check('simple',a => { a.payload.actors[0].id = 'pref'; a.payload.judgments[0].subject.actor_ids = ['pref']; });
  assert.ok(view.ir.nodes.some(n => n.target.kind === 'actor' && n.target.id === 'pref'));
  assert.ok(view.ir.nodes.some(n => n.target.kind === 'judgment' && n.target.id === 'pref'));
  assert.ok(view.ir.nodes.some(n => n.target.kind === 'result' && n.target.id === 'pref'));
});
test('unknown critical semantics produce no snapshot or catalog carrier',() => check('simple',a => a.payload.extensions.push({id:'future:unknown',critical:true,definition:'An unknown critical authored module.',value:{kind:'text',value:'Must not be interpreted.'}}),'rejected','READ_UNSUPPORTED_CRITICAL'));
test('fixed external required reference stays unresolved without automatic fetching',async () => {
  const {view} = await check('simple',a => { a.payload.judgments[0].core_expression = {kind:'authored',statement:'The answer depends on an explicitly external definition.',qualification_refs:[{kind:'material',id:'outside-definition',asset:{asset_id:'outside',asset_version:'v1',judgment_version:'v1'}}]}; });
  assert.equal(view.ir.unresolved_external.length,1); assert.equal(view.ir.unresolved_external[0].mandatory,true);
});
function exceptionFixture(a) {
  const scope = {kind:'asset'};
  a.payload.declarations.boundaries = {state:'provided',value:[{id:'normal',effect:'limit',statement:'Use the ordinary limit.',declared_by:'author',applies_to:scope,exception_refs:['special']}]};
  a.payload.conditions.push({id:'exception-condition',owner_ref:{kind:'exception',id:'special'},expression:{kind:'interpreted',statement:'The author-specified special condition holds.'}});
  a.payload.exceptions.push({id:'special',boundary_ref:'normal',statement:'Replace only when the condition holds.',applies_to:scope,when:{kind:'condition',id:'exception-condition'},effect:{kind:'replace_limit',replacement:{id:'replacement',effect:'limit',statement:'A conditional replacement limit.',declared_by:'author',applies_to:scope,exception_refs:[]}}});
}
test('replacement boundary remains conditionally activated and never becomes permanent',async () => {
  const {view} = await check('simple',exceptionFixture);
  assert.deepEqual(view.ir.nodes.find(n => n.target.kind === 'boundary' && n.target.id === 'replacement').activation,{kind:'exception',exception_ref:{kind:'exception',id:'special'}});
  assert.deepEqual(view.ir.nodes.find(n => n.target.kind === 'boundary' && n.target.id === 'normal').activation,{kind:'always'});
});
test('replacement cannot also appear among permanent boundaries',() => check('simple',a => {exceptionFixture(a); a.payload.declarations.boundaries.value.push(structuredClone(a.payload.exceptions[0].effect.replacement));},'rejected'));
function semantic(value) {
  if (value === null) return {kind:'null',value:null};
  if (Array.isArray(value)) return {kind:'list',items:value.map(semantic)};
  if (typeof value === 'object') return {kind:'record',fields:Object.entries(value).map(([name,value]) => ({name,value:semantic(value)}))};
  return {kind:typeof value === 'string'?'text':typeof value,value};
}
const {digestCanonical:H} = require(path.join(coreDir,'src/public-contract/digests.js'));
function typed(a, damage = null) {
  const registry = contract.component_semantics, d = registry.definition;
  const j = a.payload.judgments.find(j => j.method.method.term === 'recognition'), c = j.method.components.find(c => c.role === '类别定义');
  const content = {items:[{key:'ordinary',title:'通常类别',meaning:'本工程样例定义的通常类别。'}],broader:[]};
  const value = {contract_id:d.id,contract_version:d.version,definition_digest:registry.definition_digest,judgment_ref:j.id,component_ref:c.id,component_type:'taxonomy',profile_id:'taxonomy-set/1',content,content_digest:H(content),component_declaration_digest:H({component:c,statement_origin:'authored'}),statement_origin:'authored',bindings_digest:H([]),adoption_proposal_digest:H({fixture:'R2 explicit component adoption'})};
  if (damage) damage(value,c);
  const aggregate = {contract_id:d.id,contract_version:d.version,definition_digest:registry.definition_digest,declaration_set_digest:H([value]),proposal_set_digest:H([value.adoption_proposal_digest]),decision_digest:H({fixture:'R2 decision'}),adoption_kind:'delegated_agent_editorial'};
  j.extensions.push({id:d.carriers.component.id,critical:true,definition:d.carriers.component.definition,value:semantic(value)});
  a.payload.extensions.push({id:d.carriers.adoption.id,critical:true,definition:d.carriers.adoption.definition,value:semantic(aggregate)});
  return {content,value,j,c};
}
test('CS2 preserves typed content separately from its native method and role',async () => {
  let expected;
  const {view} = await check('coverage-basic',a => { expected = typed(a); });
  const node = view.ir.nodes.find(n => n.target.kind === 'judgment' && n.target.id === expected.j.id);
  const interpretation = node.method_interpretation.component_interpretations.find(c => c.component_ref === expected.c.id);
  assert.equal(expected.c.method.term,'recognition'); assert.equal(interpretation.component_type,'taxonomy');
  assert.deepEqual(interpretation.authored_content,expected.content); assert.equal(interpretation.content_digest,H(expected.content));
  assert.equal(interpretation.status,'supported');
});
test('changing native role content cannot reuse the old component declaration digest',() => check('coverage-basic',a => typed(a,(v,c) => { c.statement += ' 修改了作者角色内容。'; }),'rejected','READ_COMPONENT_BINDING_INVALID'));
test('the CS1 critical carrier is not automatically migrated into R2',() => check('simple',a => a.payload.judgments[0].extensions.push({id:'kdna.component-semantics/1',critical:true,definition:'Historical CS1 is not CS2.',value:{kind:'text',value:'Old carrier'}}),'rejected','READ_UNSUPPORTED_CRITICAL'));

function closureTargets(view,id) {
  const ids = new Set(view.ir.mandatory_closures.find(c => c.selection.judgment_id === id).node_ids);
  return view.ir.nodes.filter(n => ids.has(n.id)).map(n => n.target.kind+':'+n.target.id);
}
function relation(a,kind='support') {
  const [first,second] = a.payload.judgments, definition = contract.r2_semantics.relationship_tuples[kind];
  a.payload.relationships.push({id:'relation',kind:{term:kind},direction:definition.direction,participants:[{role:{term:definition.roles[0]},judgment_ref:first.id},{role:{term:definition.roles[1]},judgment_ref:second.id}],operator:{term:definition.operator},effect:{term:definition.effect},statement:'An explicitly authored engineering relationship between these two questions.'});
  return [first.id,second.id];
}
// These are the four normative tuples, independent of the generated table under test.
const vocabularyTuples = [
  {kind:'support',direction:'directed',roles:['supporter','claim'],operator:'supports',effect:'offers_support'},
  {kind:'complement',direction:'directed',roles:['supplement','base'],operator:'complements',effect:'adds_perspective'},
  {kind:'qualify',direction:'directed',roles:['qualifier','qualified'],operator:'qualifies',effect:'limits_interpretation'},
  {kind:'conflict',direction:'undirected',roles:['side_a','side_b'],operator:'conflicts_with',effect:'preserves_disagreement'},
];
const vocabularyValidators = require(path.join(coreDir,'src/public-contract/validators.generated.js'));
const crossEntryVocabulary = require(path.join(coreDir,'src/public-contract/cross-entry.js'));
async function vocabularyAdmission(a,field=null) {
  const bytes=F.encode(a,req,{deflate:true}),node=await admitNode(bytes),browser=admitBrowser(bytes);
  for(const result of [node,browser]) {
    assert.equal(result.status,field?'rejected':'accepted',JSON.stringify(result));
    if(field) {
      assert.equal(result.reason,'READ_CORE_INVALID');
      assert.deepEqual(result.diagnostics,[{code:'READ_CORE_INVALID',stage:'core',severity:'error',subject:null,field}]);
      assert.equal(result.snapshot,undefined);
    }
  }
  if(field)assert.deepEqual(node,browser);
  else assert.deepEqual(inspectSnapshot(node.snapshot).ir,inspectSnapshot(browser.snapshot).ir);
  return node;
}
function definitionTerms() {
  const a=F.blank(tuple,2);
  a.payload.materials=['first definition','second definition'].map((term,i)=>({id:'definition:'+i,kind:'definition',term,statement:'An explicit authored definition.',source_refs:[],applies_to:{kind:'asset'}}));
  return a;
}
test('current definition terms with distinct names and explicit R2 scope are admitted',async()=>{
  const a=definitionTerms();assert.equal(vocabularyValidators.Payload(a.payload),true);
  const accepted=await vocabularyAdmission(a);
  assert.deepEqual(inspectSnapshot(accepted.snapshot).ir.nodes.filter(n=>n.target.kind==='material').map(n=>n.value),a.payload.materials);
});
for(const [name,index,term,schemaValid] of [['duplicate',1,'first definition',true],['empty',0,'',false]]) {
  test('current '+name+' definition term reaches its own term rejection after a valid scoped control',async t=>{
    const a=definitionTerms();await vocabularyAdmission(a);
    a.payload.materials[index].term=term;
    const field='/payload/materials/'+index+'/term';
    assert.equal(vocabularyValidators.Payload(a.payload),schemaValid,JSON.stringify(vocabularyValidators.Payload.errors));
    if(schemaValid) {
      const rejected=crossEntryVocabulary.checkPayload(a.payload,contract.core_terms).filter(row=>!row.ok);
      assert.deepEqual(rejected.map(row=>row.rule_id),['PUBLIC-TERM-UNIQUENESS']);
      assert.deepEqual(rejected[0].violations.map(v=>v.path),['/materials/'+index+'/term']);
    }else {
      assert.ok(vocabularyValidators.Payload.errors.some(e=>e.instancePath==='/materials/0/term'&&e.keyword==='minLength'),'Empty term must fail its current NonEmptyText constraint, not missing applies_to.');
    }
    const out=await vocabularyAdmission(a,field);
    t.diagnostic(JSON.stringify({case:name+' definition term',schema_valid:schemaValid,actual_gate:schemaValid?'PUBLIC-TERM-UNIQUENESS':'Material.term NonEmptyText',diagnostics:out.diagnostics}));
  });
}
function vocabularyRelationship(definition) {
  const a=F.blank(tuple,2),term=value=>({term:value,vocabulary:'core'});
  a.payload.relationships=[{id:'vocabulary:relation',kind:term(definition.kind),direction:definition.direction,participants:definition.roles.map((role,i)=>({role:term(role),judgment_ref:a.payload.judgments[i].id})),operator:term(definition.operator),effect:term(definition.effect),statement:'One complete authored core relationship tuple.'}];
  return a;
}
for(const [index,definition] of vocabularyTuples.entries()) {
  test('current relationship '+definition.kind+' admits its complete fixed tuple',async()=>{
    const a=vocabularyRelationship(definition);assert.equal(vocabularyValidators.Payload(a.payload),true);
    assert.ok(crossEntryVocabulary.checkPayload(a.payload,contract.core_terms).every(row=>row.ok));
    const out=await vocabularyAdmission(a);
    assert.deepEqual(inspectSnapshot(out.snapshot).ir.nodes.find(n=>n.target.kind==='relationship').value,a.payload.relationships[0]);
  });
  for(const field of ['kind','role','operator','effect']) {
    test('current relationship '+definition.kind+' rejects a separately substituted registered '+field+' at tuple semantics',async t=>{
      const a=vocabularyRelationship(definition);await vocabularyAdmission(a);
      const other=vocabularyTuples[(index+1)%vocabularyTuples.length],relationship=a.payload.relationships[0];
      if(field==='role')relationship.participants[0].role.term=other.roles[0];
      else relationship[field].term=other[field];
      assert.equal(vocabularyValidators.Payload(a.payload),true,JSON.stringify(vocabularyValidators.Payload.errors));
      assert.ok(crossEntryVocabulary.checkPayload(a.payload,contract.core_terms).every(row=>row.ok),'Every substituted term is already registered; only the complete R2 tuple is wrong.');
      const out=await vocabularyAdmission(a,'/payload/relationships/0');
      t.diagnostic(JSON.stringify({case:definition.kind+'/'+field,schema_valid:true,all_cross_entry_rules_passed:true,diagnostics:out.diagnostics}));
    });
  }
}
test('historical G1 author-declared relationship tuple cannot regain current core meaning',async t=>{
  const a=vocabularyRelationship(vocabularyTuples[0]);await vocabularyAdmission(a);
  const author=term=>({term,vocabulary:'author'});
  // Exact authored words from G1-ACCEPT-author-declared-relationship-kind;
  // add the required current statement without inventing a new core tuple.
  a.payload.relationships=[{id:'relationship:1',kind:author('adopted-upstream-result'),direction:'directed',operator:author('adopts'),effect:author('upstream-result-required'),participants:[{judgment_ref:'j:0',role:author('adopter')},{judgment_ref:'j:1',role:author('adopted-source')}],statement:'The historical author tuple remains an unsupported R2 relationship.'}];
  assert.equal(vocabularyValidators.Payload(a.payload),true,JSON.stringify(vocabularyValidators.Payload.errors));
  assert.ok(crossEntryVocabulary.checkPayload(a.payload,contract.core_terms).every(row=>row.ok),'Explicit author vocabulary passes vocabulary registration but cannot define new R2 relationship meaning.');
  const out=await vocabularyAdmission(a,'/payload/relationships/0');
  t.diagnostic(JSON.stringify({case:'historical G1 author tuple',schema_valid:true,all_cross_entry_rules_passed:true,diagnostics:out.diagnostics}));
});
test('directional necessary relationship closure reaches a fixed point without reversing support',async () => {
  let ids; const {view} = await check('coverage-basic',a => { ids=relation(a); });
  assert.ok(closureTargets(view,ids[1]).includes('judgment:'+ids[0]));
  assert.ok(!closureTargets(view,ids[0]).includes('judgment:'+ids[1]));
  assert.ok(closureTargets(view,ids[0]).includes('relationship:relation'));
});
test('mutual conflict closes over both full questions without looping',async () => {
  let ids; const {view} = await check('coverage-basic',a => { ids=relation(a,'conflict'); });
  for (const id of ids) for (const target of ids) assert.ok(closureTargets(view,id).includes('judgment:'+target));
});
test('a relation cannot change its registered role direction',() => check('coverage-basic',a => { relation(a); a.payload.relationships[0].direction='undirected'; },'rejected'));
function dependency(a,required=true) {
  a.payload.dependencies.push({id:'observed-input',producer:{kind:'judgment_result',judgment_ref:'qSignal',result_contract_ref:'qSignal-out'},producer_port:'result',consumer_judgment_ref:'qAdjust',consumer_port:'signal',input_role:'signal',data_type:{term:'number'},required,purpose:'Supply the declared observed input.'});
}
test('required dependency supplies its producer; optional dependency remains expandable',async () => {
  const required=await check('feedback',dependency), optional=await check('feedback',a => dependency(a,false));
  assert.ok(closureTargets(required.view,'qAdjust').includes('judgment:qSignal'));
  assert.ok(!closureTargets(optional.view,'qAdjust').includes('judgment:qSignal'));
  assert.ok(optional.view.ir.asset_index.some(d => d.target.kind==='dependency' && d.target.id==='observed-input'));
});
test('dependency cannot name a different input responsibility from its consumer port',() => check('feedback',a => { dependency(a); a.payload.dependencies[0].input_role='current'; },'rejected'));
test('global misuse is necessary asset content, including exact selection',async () => {
  const {view}=await check('simple',a => a.payload.misuse.push({id:'global-misuse',statement:'Do not claim an engineering view is an actual observed use.'}));
  const node=view.ir.nodes.find(n => n.target.kind==='misuse' && n.target.id==='global-misuse');
  assert.ok(view.ir.asset_closure.includes(node.id)); assert.ok(closureTargets(view,'pref').includes('misuse:global-misuse'));
});
function partial(a) {
  const outcome={kind:'partial',policy_ref:{kind:'policy',id:'policy-b'},item_contract_ref:{kind:'contract',id:'item'},confirmed:[{producer:{kind:'candidate',id:'cover'},entry_refs:[{kind:'branch_entry',id:'e1'},{kind:'branch_entry',id:'e2'}],value:{kind:'text',value:'核对完成'}}],pending:[{kind:'branch_entry',id:'e3'}],statement:'Expected local confirmations only; the pending entry remains unresolved.'};
  a.payload.examples.push({id:'partial-example',title:'Paper partial case',kind:'illustrative',context:'Engineering semantic counterexample fixture.',input_refs:[],adopted_judgments:[{kind:'local',judgment_id:'qb'}],application:'Preserve confirmed entries and leave the remaining entry pending.',results:[{id:'partial-result',kind:'partial',observation_kind:'expected',outcome}]});
  return outcome;
}
test('a paper partial result keeps grouped producers and pending identities without becoming Result',async () => {
  const {view}=await check('branches',partial), n=view.ir.nodes.find(n => n.target.kind==='example_result');
  assert.equal(n.value.kind,'partial'); assert.equal(n.value.outcome.pending.length,1);
});
for (const [name,edit] of [
  ['partial candidate cannot invent another value',o => o.confirmed[0].value.value='Invented'],
  ['partial cannot reverse grouped entry order',o => o.confirmed[0].entry_refs.reverse()],
  ['partial cannot confirm and await the same entry',o => o.pending=[{kind:'branch_entry',id:'e1'}]],
  ['producer-identity partial cannot emit the same producer twice',o => { const e=structuredClone(o.confirmed[0]); o.confirmed[0].entry_refs.pop(); e.entry_refs.shift(); o.confirmed.push(e); }]
]) test(name,() => check('branches',a => edit(partial(a)),'rejected'));
test('same-asset explicit Ref and local Ref denote the same partial producer',() => check('branches',a => { const o=partial(a); o.confirmed[0].producer.asset=structuredClone(a.payload.asset); }));
test('feedback state initializer cannot compete with a normal link',() => check('feedback',a => { const p=a.payload.judgments.find(j => j.id==='qLoop').method.plan; p.links.push({from:{node_ref:{kind:'plan_node',id:'read-signal'},port:'result',field_path:[]},to:{node_ref:{kind:'plan_node',id:'apply-adjust'},port:'current',field_path:[]}}); },'rejected'));
test('feedback next-input must belong to the feedback body',() => check('feedback',a => { const p=a.payload.judgments.find(j => j.id==='qLoop').method.plan; p.nodes[0].updates[0].next_input.node_ref.id='F'; },'rejected'));
test('a repeated basic method does not establish composite composition',() => check('feedback',a => { const j=a.payload.judgments.find(j => j.id==='qSignal'); j.method.method.term='feedback'; const model=a.payload.judgments.find(j => j.id==='qAdjust').method; j.method.components=structuredClone(model.components).map((c,i) => ({...c,id:'signal-feedback-'+i})); },'rejected'));

test('final result cannot bypass a feedback boundary through an internal endpoint',() => check('feedback',a => { const p=a.payload.judgments.find(j => j.id==='qLoop').method.plan; p.result_bindings[0].from.node_ref.id='apply-adjust'; },'rejected'));
test('auxiliary contracts obey the same public vocabulary requirement as owned contracts',() => check('branches',a => { a.payload.contracts[0].allowed_result_types=[{term:'unregistered'}]; },'rejected'));

function staticPolicy(a,edit=()=>{}) {
  const j=a.payload.judgments[0], registry=contract.static_policy, d=registry.definition;
  j.form='rule'; delete j.result; a.payload.asset_capability=a.payload.judgments.every(j => j.form==='rule')?'result_forming_rules':'mixed';
  j.core_expression={kind:'authored',statement:'按作者明确优先顺序逐项判断，前序未判时不跳过，只有全部不成立才走兜底。',qualification_refs:[]};
  for (const c of j.method.components) if (c.content_ref) { delete c.content_ref; c.statement='这是作者声明的工程情境偏好依据，不能冒充实际观察。'; }
  j.formation_rule={statement:j.core_expression.statement,condition_refs:[],output_contract_ref:j.result_contract.id};
  const rule={output_contract_ref:j.result_contract.id,candidates:[{key:'maintain',title:'维持',meaning:'继续必要行动。',result_type:{term:'text'},value:{kind:'text',value:'维持'}},{key:'reduce',title:'减力',meaning:'降低不必要干预。',result_type:{term:'text'},value:{kind:'text',value:'减力'}}],strategy:{kind:'priority',direction:'higher-first'},entries:[{key:'effective',condition:{kind:'interpreted',statement:'必要行动仍有效且未产生明显反作用。'},priority:10,candidate_key:'maintain'},{key:'counterforce',condition:{kind:'interpreted',statement:'额外干预造成明显反作用。'},priority:20,candidate_key:'reduce'}],fallback:{kind:'no_match',statement:'信息不足时不形成调整方向。'}};
  const carrier={contract_id:d.id,contract_version:d.version,definition_digest:registry.definition_digest,judgment_ref:j.id,rule_digest:H(rule),rule};
  const x={a,j,rule,carrier}; edit(x); carrier.rule_digest=H(rule);
  const extension={id:d.carrier.id,critical:true,definition:d.carrier.definition,value:semantic(carrier)};
  j.extensions.push(extension); x.extension=extension; return x;
}
test('SP2 explicitly preserves its unchanged first-match rule digest and new binding identity',async () => {
  assert.equal(contract.static_policy.definition.id,'kdna.static-policy/2');
  assert.equal(contract.static_policy.definition.version,'2.0.0');
  assert.notEqual(contract.static_policy.definition_digest,'sha256:a28980e46f5f24a9a5190fcd380b813f996db307603620d3f2ab1a14ffb679bb');
  assert.deepEqual(contract.static_policy.definition.priority_semantics,{kind:'first-matching-priority',selection:'single-candidate',true_entry_requires:'all-prior-conditions-explicitly-false',unknown_prior_condition:'blocks-later-candidates-and-fallback',fallback_requires:'all-conditions-explicitly-false',condition_evaluation:'outside-core-and-read'});
  let x; const {view}=await check('simple',a => {x=staticPolicy(a);});
  const node=view.ir.nodes.find(n => n.target.kind==='judgment'), interpreted=node.static_policy_interpretation;
  assert.deepEqual(interpreted.authored_rule,x.rule); assert.equal(interpreted.rule_digest,H(x.rule));
  assert.deepEqual(interpreted.rule.entries.map(e => e.key),['counterforce','effective']);
  assert.ok(closureTargets(view,x.j.id).includes('judgment:'+x.j.id));
  assert.equal(view.ir.nodes.some(n => n.role==='static_policy'),false);
  assert.equal(Object.hasOwn(interpreted,'selected_candidate'),false);
});
test('SP2 reverse priority changes only declared normalization order',async () => {
  const {view}=await check('simple',a => staticPolicy(a,x => {x.rule.strategy.direction='lower-first'; x.rule.fallback={kind:'candidate',candidate_key:'reduce'};}));
  const p=view.ir.nodes.find(n => n.target.kind==='judgment').static_policy_interpretation;
  assert.deepEqual(p.rule.entries.map(e => e.key),['effective','counterforce']);
  assert.deepEqual(p.authored_rule.entries.map(e => e.key),['effective','counterforce']);
});
for (const [name,edit] of [
  ['SP2 wrong owner',x => x.carrier.judgment_ref='absent'],
  ['SP2 duplicate priority',x => x.rule.entries[1].priority=10],
  ['SP2 dangling candidate',x => x.rule.entries[0].candidate_key='absent'],
  ['SP2 duplicate candidate identity',x => x.rule.candidates.push(structuredClone(x.rule.candidates[0]))],
  ['SP2 cannot use the old definition digest',x => x.carrier.definition_digest='sha256:a28980e46f5f24a9a5190fcd380b813f996db307603620d3f2ab1a14ffb679bb'],
  ['SP2 whole result contract rejects wrong candidate shape',x => x.rule.candidates[0].value={kind:'number',value:2}],
  ['SP2 does not erase preconditions',x => {x.a.payload.conditions.push({id:'precondition',owner_ref:{kind:'judgment',id:x.j.id},expression:{kind:'interpreted',statement:'This precondition must not be erased.'}}); x.j.formation_rule.condition_refs=[{kind:'condition',id:'precondition'}];}]
]) test(name,() => check('simple',a => staticPolicy(a,edit),'rejected','READ_STATIC_POLICY_INVALID'));
test('SP2 does not compete with a native policy',() => check('branches',a => {
  const j=a.payload.judgments[0], registry=contract.static_policy,d=registry.definition;
  const candidate=j.formation_rule.policy.candidates[0];
  const rule={output_contract_ref:j.result_contract.id,candidates:[{key:'c',title:'Declared candidate',meaning:'Only a possible value.',result_type:{term:'list'},value:{kind:'list',items:[candidate.value]}}],strategy:{kind:'priority',direction:'lower-first'},entries:[{key:'e',condition:{kind:'interpreted',statement:'Authored condition.'},priority:1,candidate_key:'c'}],fallback:{kind:'candidate',candidate_key:'c'}};
  const carrier={contract_id:d.id,contract_version:d.version,definition_digest:registry.definition_digest,judgment_ref:j.id,rule_digest:H(rule),rule};
  j.extensions.push({id:d.carrier.id,critical:true,definition:d.carrier.definition,value:semantic(carrier)});
},'rejected','READ_STATIC_POLICY_INVALID'));
test('old critical SP1 is unsupported in the R2 tuple',() => check('simple',a => { const x=staticPolicy(a); x.extension.id='kdna.static-policy/1'; },'rejected','READ_UNSUPPORTED_CRITICAL'));

test('feedback update influence counts an actual second method across rounds without a same-round cycle',() => check('feedback',a => {
  const p=a.payload.judgments.find(j => j.id==='qLoop').method.plan,F=p.nodes.find(n => n.id==='F'),signal=p.nodes.find(n => n.id==='read-signal'),adjust=p.nodes.find(n => n.id==='apply-adjust');
  F.output={node_ref:{kind:'plan_node',id:'read-signal'},port:'result',field_path:[]};
  F.updates[0].next_input={node_ref:{kind:'plan_node',id:'read-signal'},port:'actual_minutes',field_path:[]};
  signal.input_bindings=[{port:'actual_minutes',from:{kind:'state',feedback_ref:{kind:'plan_node',id:'F'},slot:'minutes'}}];
  adjust.input_bindings=[{port:'current',from:{kind:'literal',value:{kind:'number',value:20}}}];
}));
test('component content cycles cannot stand in for an authored mechanism body',() => check('simple',a => {const c=a.payload.judgments[0].method.components[0];c.content_ref={kind:'component',id:c.id};},'rejected'));
test('scoped global boundary is complete in whole asset but not silently applied to another question',async () => {
  let ids;const {view}=await check('coverage-basic',a => {ids=a.payload.judgments.slice(0,2).map(j => j.id);a.payload.declarations.boundaries={state:'provided',value:[{id:'second-only',effect:'limit',statement:'This declared limit applies only to the named question.',declared_by:'author',applies_to:{kind:'judgments',judgment_refs:[ids[1]]},exception_refs:[]}]};});
  const node=view.ir.nodes.find(n => n.target.kind==='boundary'&&n.target.id==='second-only');assert.ok(view.ir.asset_closure.includes(node.id));
  assert.ok(closureTargets(view,ids[1]).includes('boundary:second-only'));assert.ok(!closureTargets(view,ids[0]).includes('boundary:second-only'));
});

test('RC2 question anchor excludes unrelated asset-owned targets while asset anchor preserves discovery',async () => {
  const {view}=await check('complex');
  const anchored=view.expansion_targets.filter(t => t.anchor.kind==='judgment'&&t.anchor.selection.judgment_id==='qA').map(t=>t.target.kind+':'+t.target.id);
  const asset=view.expansion_targets.filter(t=>t.anchor.kind==='asset').map(t=>t.target.kind+':'+t.target.id);
  for(const id of ['material:d0','example:e0','revision:h0']){assert.ok(!anchored.includes(id));assert.ok(asset.includes(id));}
  assert.ok(anchored.includes('judgment:qB'),'The explicitly adjacent complement remains an optional expansion.');
  assert.ok(!anchored.includes('judgment:qC'),'An unrelated question is not made relevant by asset ownership.');
  assert.ok(anchored.includes('material:d1'));assert.ok(anchored.includes('shared_declaration:sA'));assert.ok(!anchored.includes('shared_declaration:sB'));
});
test('RC2 a related case is discoverable without becoming mandatory question content',async () => {
  const {view}=await check('complex',a=>{a.payload.examples[0].adopted_judgments=[{kind:'local',judgment_id:'qA'}];});
  const target=view.expansion_targets.find(t=>t.anchor.kind==='judgment'&&t.anchor.selection.judgment_id==='qA'&&t.target.kind==='example'&&t.target.id==='e0');
  const example=view.ir.nodes.find(n=>n.target.kind==='example'&&n.target.id==='e0');
  assert.ok(target);assert.ok(target.scope.includes(example.id));assert.ok(!closureTargets(view,'qA').includes('example:e0'));
  assert.ok(!view.expansion_targets.some(t=>t.anchor.kind==='judgment'&&t.anchor.selection.judgment_id==='qA'&&t.target.kind==='revision'&&t.target.id==='h0'),'Optional references are not recursively promoted into an initial question index.');
});
test('RC2 a revision affecting the current question is optional, not all asset history',async () => {
  const {view}=await check('complex',a=>{a.manifest.history.entries[0].affected_refs=[{kind:'judgment',id:'qA'}];});
  assert.ok(view.expansion_targets.some(t=>t.anchor.kind==='judgment'&&t.anchor.selection.judgment_id==='qA'&&t.target.kind==='revision'&&t.target.id==='h0'));
  assert.ok(!closureTargets(view,'qA').includes('revision:h0'));
});

test('RC2 an explicit example input reference is a relevant optional case edge',async () => {
  const {view}=await check('complex',a=>{a.payload.examples[0].input_refs=[{kind:'result',id:'qA'}];});
  assert.ok(view.expansion_targets.some(t=>t.anchor.kind==='judgment'&&t.anchor.selection.judgment_id==='qA'&&t.target.kind==='example'&&t.target.id==='e0'));
  assert.ok(!closureTargets(view,'qA').includes('example:e0'));
});

test('RC2 asset history is an overview and full entries exist only as revision targets',async () => {
  const {asset,view}=await check('complex'),node=view.ir.nodes.find(n=>n.role==='asset_declaration');
  assert.deepEqual(node.value.history,{coverage:asset.manifest.history.coverage,statement:asset.manifest.history.statement});
  assert.ok(!JSON.stringify(node.value).includes(asset.manifest.history.entries[0].summary));
  assert.deepEqual(view.ir.nodes.find(n=>n.target.kind==='revision'&&n.target.id==='h0').value,asset.manifest.history.entries[0]);
  const expansion=view.expansion_targets.find(t=>t.anchor.kind==='asset'&&t.target.kind==='revision'&&t.target.id==='h0');
  assert.ok(expansion.scope.includes(view.ir.nodes.find(n=>n.target.kind==='revision'&&n.target.id==='h0').id));
});
test('RC2 asset boundary overview cannot expose another question boundary body or identity',async () => {
  const {asset,view}=await check('complex',a=>{a.payload.declarations.boundaries={state:'provided',value:[{id:'qC-private-boundary',effect:'limit',statement:'BOUNDARY_BODY_ONLY_FOR_QC',declared_by:'author',applies_to:{kind:'judgments',judgment_refs:['qC']},exception_refs:[]}]};});
  const node=view.ir.nodes.find(n=>n.role==='asset_declaration'),boundary=view.ir.nodes.find(n=>n.target.id==='qC-private-boundary');
  assert.deepEqual(node.value.declarations.boundaries,{state:'provided'});
  assert.ok(!JSON.stringify(node.value).includes('qC-private-boundary'));assert.ok(!JSON.stringify(node.value).includes('BOUNDARY_BODY_ONLY_FOR_QC'));
  assert.deepEqual(boundary.value,asset.payload.declarations.boundaries.value[0]);assert.ok(view.ir.asset_closure.includes(boundary.id));
  assert.ok(!closureTargets(view,'qA').includes('boundary:qC-private-boundary'));assert.ok(closureTargets(view,'qC').includes('boundary:qC-private-boundary'));
});

test('RC2 applicable foundations and boundaries stay mandatory while other-question scopes do not',async () => {
  const {asset,view}=await check('complex',a=>{
    for(const [id,kind,applies_to] of [['fGlobal','foundation',{kind:'asset'}],['fC','premise',{kind:'judgments',judgment_refs:['qC']}]])a.payload.materials.push({id,kind,statement:'Explicit authored '+id+' semantic body.',source_refs:[],applies_to});
    a.payload.kernel.foundation_refs=[{kind:'material',id:'fGlobal'},{kind:'material',id:'fC'}];
    a.payload.declarations.boundaries={state:'provided',value:[['bGlobal',{kind:'asset'}],['bC',{kind:'judgments',judgment_refs:['qC']}]].map(([id,applies_to])=>({id,effect:'limit',statement:'Explicit authored '+id+' limit body.',declared_by:'author',applies_to,exception_refs:[]}))};
  });
  const qA=closureTargets(view,'qA'),qC=closureTargets(view,'qC');
  for(const target of ['material:fGlobal','boundary:bGlobal'])assert.ok(qA.includes(target));
  for(const target of ['material:fC','boundary:bC'])assert.ok(!qA.includes(target));
  for(const target of ['material:fGlobal','material:fC','boundary:bGlobal','boundary:bC'])assert.ok(qC.includes(target));
  for(const m of asset.payload.materials.filter(m=>['fGlobal','fC'].includes(m.id)))assert.deepEqual(view.ir.nodes.find(n=>n.target.kind==='material'&&n.target.id===m.id).value,m);
  for(const b of asset.payload.declarations.boundaries.value)assert.deepEqual(view.ir.nodes.find(n=>n.target.kind==='boundary'&&n.target.id===b.id).value,b);
});
