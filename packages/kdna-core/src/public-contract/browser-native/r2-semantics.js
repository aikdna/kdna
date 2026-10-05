'use strict';

const { digest } = require('./digests.js');
const { createRegistry, ref, values, fail } = require('./r2-registry.js');
const { equal, unique, validateContract, validateResult, valueFor, compatible, projected } = require('./r2-values.js');
const { checkPlans } = require('./r2-plan.js');

function validateR2(manifest, payload, entries, scope = null) {
  const r = scope?.registry ?? createRegistry(manifest, payload), { r2_semantics: definition, core_terms: termsRegistry } = require('./generated-contract.json');
  if (!definition) fail('/payload/profile_version');
  const roles = definition.method_roles;
  const activeRecord = record => !scope || record.judgment === null || scope.loadedJudgments.has(record.judgment);
  const activeJudgments = scope ? payload.judgments.filter(j => scope.loadedJudgments.has(j.id)) : payload.judgments;
  const own = (record, target, mandatory = true, kinds = null, referenceRole = null) => r.link(record.target, target, mandatory, kinds, record.path, referenceRole);
  const resolve = (target, kind, field) => r.get(target, kind, field);
  const normalContract = (target, field) => {
    const record = resolve(target, 'contract', field);
    if (record?.value.kind === 'emission_list') fail(field);
    return record?.value ?? null;
  };
  const applies = (scope, field) => {
    if (scope.kind === 'asset') return new Set(payload.judgments.map(j => j.id));
    if (scope.kind !== 'judgments' || !scope.judgment_refs.length || new Set(scope.judgment_refs).size !== scope.judgment_refs.length) fail(field);
    for (const id of scope.judgment_refs) resolve(ref('judgment', id), 'judgment', field);
    return new Set(scope.judgment_refs);
  };
  const covers = (scope, id, field) => applies(scope, field).has(id);
  const subset = (a,b,field) => { const left = applies(a,field), right = applies(b,field); if ([...left].some(id => !right.has(id))) fail(field); };
  const assetRecord = resolve(r.asset, 'asset');
  if (payload.declarations.highest_question.state !== 'provided') fail('/payload/declarations/highest_question');
  for (const key of ['worldview','value_order','role']) if (Object.hasOwn(payload.declarations,key)) fail('/payload/declarations/' + key);
  if (new Set(payload.reading_order ?? []).size !== (payload.reading_order ?? []).length) fail('/payload/reading_order');
  for (const id of payload.reading_order ?? []) resolve(ref('judgment',id), 'judgment', '/payload/reading_order');
  for (const target of payload.kernel.foundation_refs) {
    const material = own(assetRecord,target,!r.local(target),'material');
    if (material && !['foundation','premise'].includes(material.value.kind)) fail('/payload/kernel/foundation_refs');
  }
  for (const record of r.ordered) if (activeRecord(record) && record.target.kind === 'contract') {
    validateContract(record.value,record.path);
    if (record.value.kind !== 'emission_list') for (const term of [record.value.form,...record.value.allowed_result_types]) if (term.vocabulary !== 'author' && !termsRegistry.answer_type.includes(term.term)) fail(record.path);
  }
  const terms = new Set();
  for (const record of r.ordered) {
    if (!activeRecord(record)) continue;
    const v = record.value, kind = record.target.kind, at = record.path;
    if (kind === 'material') {
      if (['definition','foundation','premise'].includes(v.kind)) applies(v.applies_to,at);
      if (v.kind === 'definition') { if (!v.term || terms.has(v.term)) fail(at); terms.add(v.term); }
      if (v.resource_ref) own(record,ref('resource',v.resource_ref),true,'resource');
      for (const id of v.source_refs) own(record,ref('source',id),true,'source');
    } else if (kind === 'resource') {
      if (!entries[v.entry] || digest(entries[v.entry]) !== v.digest) fail(at);
    } else if (kind === 'shared_declaration') {
      applies(v.applies_to,at);
      for (const id of v.subject.actor_ids) own(record,ref('actor',id),true,'actor');
      if (v.kind === 'role' && !Object.values(v.value).some(x => x?.state === 'provided')) fail(at);
    } else if (kind === 'condition') {
      own(record,v.owner_ref,false,['asset','judgment','policy','exception']);
      const c = v.expression.kind === 'external_evaluator' ? v.expression.declaration : v.expression;
      for (const operand of c.operands ?? []) if (operand.kind === 'dependency') own(record,ref('dependency',operand.dependency_ref),true,'dependency');
    } else if (kind === 'result') {
      own(record,ref('contract',v.contract_ref),true,'contract');
    } else if (kind === 'component') {
      if (Object.hasOwn(v,'statement') === Object.hasOwn(v,'content_ref')) fail(at);
      if (v.content_ref) {
        const target = own(record,v.content_ref,true,['result','material','shared_declaration','reason','component']);
        if (target?.target.kind === 'result' && (target.judgment !== record.judgment || target.value.value.kind !== 'text')) fail(at + '/content_ref');
      }
      for (const target of v.material_refs) own(record,target,true,'material');
    } else if (kind === 'reason') {
      own(record,ref('judgment',v.judgment_ref),true,'judgment');
      for (const id of v.component_refs) own(record,ref('component',id),true,'component');
    } else if (kind === 'source_use') {
      own(record,ref('source',v.source_ref),true,'source');
      const target = ref(v.target_kind === 'method_component' ? 'component' : v.target_kind,v.target_ref);
      const actual = own(record,target,true,['judgment','reason','material','component','example','example_result','shared_declaration']);
      if (actual) r.link(actual.target,record.target,true);
    } else if (kind === 'boundary') {
      applies(v.applies_to,at); own(record,ref('actor',v.declared_by),true,'actor');
      if (record.judgment && (v.applies_to.kind !== 'judgments' || v.applies_to.judgment_refs.length !== 1 || v.applies_to.judgment_refs[0] !== record.judgment)) fail(at);
      if (record.activation.kind === 'exception' && v.exception_refs.length) fail(at);
      for (const id of v.exception_refs) {
        const exception = own(record,ref('exception',id),true,'exception');
        if (!exception || exception.value.boundary_ref !== v.id) fail(at);
      }
    } else if (kind === 'exception') {
      if (v.boundary_ref === null) fail(at);
      const boundary = own(record,ref('boundary',v.boundary_ref),true,'boundary');
      if (!boundary || boundary.activation.kind !== 'always' || !boundary.value.exception_refs.includes(v.id)) fail(at);
      subset(v.applies_to,boundary.value.applies_to,at);
      if (record.judgment && (v.applies_to.kind !== 'judgments' || v.applies_to.judgment_refs.length !== 1 || v.applies_to.judgment_refs[0] !== record.judgment)) fail(at);
      own(record,v.when,true,'condition');
      if (v.effect.kind === 'replace_limit') {
        const replacement = own(record,ref('boundary',v.effect.replacement.id),true,'boundary');
        if (!equal(replacement.owner,record.target) || !equal(v.effect.replacement.applies_to,v.applies_to)) fail(at);
      }
    }
  }
  // Follow only component content edges; common semantic-reference cycles are
  // legal and are bounded by fixed-point closure, but content cannot be empty
  // because two components merely cite each other.
  const contentDone = new Set(), contentActive = new Set();
  function componentBody(record) {
    const id = r.identity(record.target);
    if (contentDone.has(id)) return;
    if (contentActive.has(id)) fail(record.path + '/content_ref');
    contentActive.add(id);
    if (record.value.content_ref?.kind === 'component') {
      const next = resolve(record.value.content_ref,'component',record.path);
      if (next) componentBody(next);
    }
    contentActive.delete(id); contentDone.add(id);
  }
  for (const record of r.ordered) if (activeRecord(record) && record.target.kind === 'component') componentBody(record);
  function methodRoles(method, components, field) {
    const spec = roles[method];
    if (!spec) fail(field);
    const required = spec.required, allowed = new Set([...required,...spec.optional]);
    const used = new Set();
    for (const c of components) {
      if (!allowed.has(c.role) || used.has(c.role)) fail(field);
      if (c.method.term !== method) fail(field);
      used.add(c.role);
    }
    if (required.some(role => !used.has(role))) fail(field);
  }
  for (const j of activeJudgments) {
    const record = resolve(ref('judgment',j.id),'judgment'), at = record.path;
    validateResult(j);
    for (const child of r.ordered) if (child.judgment === j.id && child !== record) own(record,child.target,true);
    for (const id of j.subject.actor_ids) own(record,ref('actor',id),true,'actor');
    for (const id of j.material_refs) own(record,ref('material',id),true,'material');
    for (const id of j.reason_refs) { const reason = own(record,ref('reason',id),true,'reason'); if (reason.value.judgment_ref !== j.id) fail(at); }
    if (!definition.answer_kinds.includes(j.answer_kind) || !definition.method_kinds.includes(j.method.method.term)) fail(at);
    if (j.core_expression.kind === 'result_text') {
      if (j.form !== 'conclusion' || j.result?.value.kind !== 'text') fail(at + '/core_expression');
    } else for (const target of j.core_expression.qualification_refs) own(record,target,true,['condition','boundary','material','shared_declaration']);
    if (j.answer_kind === 'composite') {
      const parts = j.answer_parts;
      unique(parts,'id',at); unique(parts,'output_field',at);
      if (parts.length < 2 || new Set(parts.map(p => p.kind)).size < 2 || j.result_contract.shape.kind !== 'record') fail(at);
      for (const part of parts) {
        if (part.kind === 'composite' || !definition.answer_kinds.includes(part.kind)) fail(at);
        if ((part.kind === 'other') !== Object.hasOwn(part,'other')) fail(at);
        const f = j.result_contract.shape.fields.find(x => x.name === part.output_field);
        if (!f?.required) fail(at);
      }
    } else if (Object.hasOwn(j,'answer_parts')) fail(at);
    if ((j.answer_kind === 'other') !== Object.hasOwn(j,'answer_other')) fail(at);
    const method = j.method, term = method.method.term;
    if ((term === 'other') !== Object.hasOwn(method,'other')) fail(at + '/method');
    if (method.plan && !Object.hasOwn(method,'units')) fail(at + '/method/units');
    if (!method.plan && ((method.units?.length ?? 0) || term === 'composite')) fail(at + '/method/plan');
    if (!method.plan) methodRoles(term,method.components,at + '/method/components');
    const referencedComponents = new Set();
    for (const unit of method.units ?? []) {
      if (unit.method === 'composite' || !definition.method_kinds.includes(unit.method)) fail(at);
      if ((unit.method === 'other') !== Object.hasOwn(unit,'other')) fail(at);
      const components = unit.component_refs.map(id => {
        const c = resolve(ref('component',id),'component',at);
        if (c.judgment !== j.id) fail(at);
        referencedComponents.add(id); r.link(ref('unit',unit.id),c.target,true); return c.value;
      });
      if (new Set(unit.component_refs).size !== unit.component_refs.length) fail(at);
      methodRoles(unit.method,components,at + '/method/units');
      for (const port of [...unit.inputs,...unit.outputs]) r.link(ref('unit',unit.id),port.contract_ref,true,'contract',at);
      unique(unit.inputs,'name',at); unique(unit.outputs,'name',at);
    }
    if (method.plan && method.components.some(c => !referencedComponents.has(c.id))) fail(at + '/method/components');
    const seenBindings = new Set();
    for (const binding of method.bindings) {
      const field = at + '/method/bindings';
      const component = resolve(ref('component',binding.component_ref),'component',field);
      if (component.judgment !== j.id) fail(field);
      // A native relationship is explicitly typed and local. Do not infer a kind
      // from an ID, including IDs legitimately reused in another kind.
      if (Object.hasOwn(binding,'target')) {
        if (Object.hasOwn(binding,'target_ref') || Object.hasOwn(binding.target,'asset')) fail(field);
        r.link(component.target,binding.target,true,definition.native_binding.target_kinds,field);
      } else if (binding.target_ref !== j.id) fail(field);
      const identity = JSON.stringify([binding.component_ref,binding.role,
        Object.hasOwn(binding,'target') ? [binding.target.kind,binding.target.id] : binding.target_ref]);
      if (seenBindings.has(identity)) fail(field);
      seenBindings.add(identity);
    }
    for (const condition of j.formation_rule?.condition_refs ?? []) own(record,condition,true,'condition');
    const inputs = unique(j.inputs,'name',at), ports = unique(j.ports,'name',at);
    for (const input of inputs.values()) { own(record,input.contract_ref,true,'contract'); normalContract(input.contract_ref,at); }
    for (const port of ports.values()) {
      own(record,port.contract_ref,true,'contract'); const c = normalContract(port.contract_ref,at);
      if (port.direction === 'input') {
        if (!inputs.has(port.input_role) || Object.hasOwn(port,'result_field')) fail(at);
        compatible(normalContract(inputs.get(port.input_role).contract_ref,at),c,at);
      } else {
        if (!Object.hasOwn(port,'result_field') || Object.hasOwn(port,'input_role')) fail(at);
        compatible(projected(j.result_contract,port.result_field === null ? [] : [port.result_field],at),c,at);
      }
    }
    const used = new Map();
    for (const use of j.content_uses) {
      const target = own(record,use.target,true,['material','shared_declaration']);
      const id = r.identity(use.target), previous = used.get(id) ?? new Set();
      if (previous.has(use.role) || ((use.role === 'adopt' && previous.has('oppose')) || (use.role === 'oppose' && previous.has('adopt')))) fail(at);
      previous.add(use.role); used.set(id,previous);
      if (target && use.role === 'adopt' && target.value.applies_to && !covers(target.value.applies_to,j.id,at)) fail(at);
      if (target?.target.kind === 'shared_declaration' && use.role === 'oppose' && covers(target.value.applies_to,j.id,at)) fail(at);
    }
    for (const shared of payload.shared_declarations) if (covers(shared.applies_to,j.id,at)) own(record,ref('shared_declaration',shared.id),true);
    for (const material of payload.materials) if (['foundation','premise'].includes(material.kind) && covers(material.applies_to,j.id,at)) own(record,ref('material',material.id),true);
    for (const boundary of values(payload.declarations.boundaries)) if (covers(boundary.applies_to,j.id,at)) own(record,ref('boundary',boundary.id),true);
    for (const replacement of j.lifecycle?.superseded_by ?? []) own(record,r.qualified(replacement),true,'judgment','lifecycle_replacement');
  }
  for (const relation of payload.relationships) {
    const record = resolve(ref('relationship',relation.id),'relationship'), term = x => x.term;
    const declared = definition.relationship_tuples[term(relation.kind)];
    const tuple = declared && [declared.direction,...declared.roles,declared.operator,declared.effect];
    if (!tuple || relation.direction !== tuple[0] || term(relation.operator) !== tuple[3] || term(relation.effect) !== tuple[4] || relation.participants.length !== 2) fail(record.path);
    const participants = unique(relation.participants.map(p => ({...p,role:term(p.role)})),'role',record.path);
    if (!participants.has(tuple[1]) || !participants.has(tuple[2]) || participants.get(tuple[1]).judgment_ref === participants.get(tuple[2]).judgment_ref) fail(record.path);
    for (const p of participants.values()) { resolve(ref('judgment',p.judgment_ref),'judgment',record.path); r.link(ref('judgment',p.judgment_ref),record.target,true); own(record,ref('judgment',p.judgment_ref),false,'judgment'); }
    const first = ref('judgment',participants.get(tuple[1]).judgment_ref), second = ref('judgment',participants.get(tuple[2]).judgment_ref);
    // Relation metadata is adjacent in both directions. Necessary body supply
    // follows the declared roles, rather than treating every edge as symmetric.
    if (term(relation.kind) === 'conflict') { r.link(first,second,true); r.link(second,first,true); }
    else if (['support','qualify'].includes(term(relation.kind))) r.link(second,first,true);
  }
  for (const dependency of payload.dependencies) {
    const record = resolve(ref('dependency',dependency.id),'dependency'), at = record.path;
    const consumer = resolve(ref('judgment',dependency.consumer_judgment_ref),'judgment',at);
    const cport = consumer.value.ports.find(p => p.name === dependency.consumer_port && p.direction === 'input');
    if (!cport || cport.input_role !== dependency.input_role) fail(at);
    own(record,cport.contract_ref,true,'contract');
    own(record,consumer.target,false,'judgment');
    r.link(consumer.target,record.target,dependency.required);
    if (dependency.producer.kind === 'judgment_result') {
      const producer = own(record,ref('judgment',dependency.producer.judgment_ref),true,'judgment');
      const pport = producer.value.ports.find(p => p.name === dependency.producer_port && p.direction === 'output');
      if (!pport || producer.value.result_contract.id !== dependency.producer.result_contract_ref) fail(at);
      compatible(normalContract(pport.contract_ref,at),normalContract(cport.contract_ref,at),at);
    } else {
      if (Object.hasOwn(dependency,'producer_port')) fail(at);
      own(record,ref('source',dependency.producer.source_ref),true,'source');
    }
  }
  checkPlans(scope ? {...payload,judgments:activeJudgments} : payload,r,normalContract,scope);
  for (const example of payload.examples) {
    const record = resolve(ref('example',example.id),'example'), at = record.path;
    for (const target of example.input_refs) {
      const input = own(record,target,true);
      if (input && input.target.kind !== 'asset') r.link(input.target,record.target,false,'example',at);
    }
    for (const target of example.source_refs ?? []) own(record,target,true,'source');
    for (const target of example.material_refs ?? []) own(record,target,true,'material');
    for (const target of example.adopted_judgments) {
      const adopted = own(record,r.qualified(target),false,'judgment');
      if (adopted) r.link(adopted.target,record.target,false,'example',at);
    }
    for (const result of example.results) {
      const item = resolve(ref('example_result',result.id),'example_result',at); own(record,item.target,true);
      if ((result.kind === 'observed' || result.observation_kind === 'observed') && example.kind === 'illustrative') fail(at);
      if (['expected','observed'].includes(result.kind)) {
        own(item,result.contract_ref,true,'contract'); const contract = normalContract(result.contract_ref,at);
        if (contract) valueFor(contract,result.value,at);
        if (result.comparison_ref) {
          const comparison = own(item,result.comparison_ref,true,'example_result');
          if (result.kind !== 'observed' || comparison?.owner.id !== example.id || comparison.value.kind !== 'expected' || r.identity(comparison.value.contract_ref) !== r.identity(result.contract_ref)) fail(at);
        }
      } else if (result.kind === 'partial') {
        const outcome = result.outcome, policy = own(item,outcome.policy_ref,true,'policy');
        if (outcome.kind !== 'partial' || !policy || policy.value.match !== 'all_matches' || policy.value.combine.kind !== 'collect' || policy.value.on_undetermined.kind !== 'partial' || r.identity(outcome.item_contract_ref) !== r.identity(policy.value.combine.item_contract_ref)) fail(at);
        own(item,outcome.item_contract_ref,true,'contract'); const contract = normalContract(outcome.item_contract_ref,at);
        const seen = new Set();
        for (const pending of outcome.pending) { const entry = own(item,pending,true,'branch_entry'); if (entry?.owner.id !== policy.target.id || seen.has(entry.target.id)) fail(at); seen.add(entry.target.id); }
        if (!outcome.pending.length) fail(at);
        const producerKey = value => value.kind ? r.identity(value) : JSON.stringify([r.identity(value.node_ref),value.port,value.field_path]);
        const declared = [...policy.value.entries];
        if (policy.value.combine.order === 'priority') declared.sort((a,b) => a.priority-b.priority);
        const order = new Map(declared.map((entry,index) => [entry.id,index])), emitted = new Map();
        let lastEmission = -1;
        for (const emission of outcome.confirmed) {
          if (contract) valueFor(contract,emission.value,at);
          const identity = producerKey(emission.producer), earlier = emitted.get(identity);
          if (earlier && (!equal(earlier,emission.value) || policy.value.combine.duplicates === 'producer_identity')) fail(at);
          emitted.set(identity,emission.value);
          if (policy.value.combine.duplicates === 'preserve' && emission.entry_refs.length !== 1) fail(at);
          let lastEntry = -1;
          for (const target of emission.entry_refs) {
            const entry = own(item,target,true,'branch_entry');
            if (entry?.owner.id !== policy.target.id || seen.has(entry.target.id)) fail(at); seen.add(entry.target.id);
            const producer = entry.value.then.kind === 'candidate' ? entry.value.then.candidate_ref : entry.value.then.from;
            if (producerKey(producer) !== identity) fail(at);
            if (entry.value.then.kind === 'candidate' && !equal(resolve(producer,'candidate',at).value.value,emission.value)) fail(at);
            if (order.get(entry.target.id) <= lastEntry) fail(at);
            if (lastEntry === -1) { if (order.get(entry.target.id) <= lastEmission) fail(at); lastEmission = order.get(entry.target.id); }
            lastEntry = order.get(entry.target.id);
          }
        }
      }
    }
  }
  for (const revision of manifest.history.entries) {
    const record = resolve(ref('revision',revision.id),'revision');
    for (const target of revision.affected_refs) {
      const affected = own(record,target,false);
      if (affected) r.link(affected.target,record.target,false,'revision',record.path);
    }
    for (const id of revision.actor_refs) own(record,ref('actor',id),true,'actor');
    if (revision.previous) own(record,revision.previous,false,'revision');
  }
  for (const claim of values(payload.attributions)) for (const id of claim.actor_ids) own(assetRecord,ref('actor',id),true,'actor');
  for (const boundary of values(payload.declarations.boundaries)) own(assetRecord,ref('boundary',boundary.id),false,'boundary');
  for (const misuse of payload.misuse) own(assetRecord,ref('misuse',misuse.id),true,'misuse');
  return r;
}

module.exports = { validateR2 };
