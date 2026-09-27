'use strict';

const { ref, fail } = require('./r2-registry.js');
const { equal, unique, compatible, valueFor, projected, completeBindings } = require('./r2-values.js');

// This validates a finite authored description. It never evaluates a condition,
// invokes a method, creates an emission, or marks a feedback round as performed.
function checkPlans(payload, registry, normalContract) {
  const r = registry, contexts = new Map(), callGraph = new Map(payload.judgments.map(j => [j.id,new Set()]));
  const get = (target, kind, at) => r.get(target,kind,at);
  const link = (from,target,kind,at) => r.link(from,target,true,kind,at);
  const producerKey = producer => producer.kind ? r.identity(producer) : JSON.stringify([r.identity(producer.node_ref),producer.port,producer.field_path]);
  function acyclic(graph, at) {
    const done = new Set(), active = new Set();
    function visit(id) {
      if (done.has(id)) return;
      if (active.has(id)) fail(at);
      active.add(id); for (const next of graph.get(id) ?? []) visit(next); active.delete(id); done.add(id);
    }
    for (const id of graph.keys()) visit(id);
  }
  for (const judgment of payload.judgments) {
    const plan = judgment.method.plan;
    if (!plan) continue;
    const at = '/payload/judgments/' + payload.judgments.indexOf(judgment) + '/method/plan';
    const nodes = unique(plan.nodes,'id',at), units = new Map((judgment.method.units ?? []).map(u => [u.id,u]));
    const parents = new Map(), children = new Map(), graph = new Map(plan.nodes.map(n => [n.id,new Set()]));
    const inputSupplies = new Map(), resolving = new Set(), portCache = new Map(), instanceMethods = new Map();
    function localNode(target) {
      const record = get(target,'plan_node',at);
      if (!record || record.owner.kind !== 'plan' || record.owner.id !== plan.id || !nodes.has(record.target.id)) fail(at);
      return record.value;
    }
    function child(parent,target) {
      const value = localNode(target);
      if (parents.has(value.id)) fail(at);
      parents.set(value.id,parent.id);
      children.get(parent.id).push(value.id);
      link(ref('plan_node',parent.id),target,'plan_node',at);
    }
    for (const node of plan.nodes) children.set(node.id,[]);
    for (const node of plan.nodes) link(ref('plan',plan.id),ref('plan_node',node.id),'plan_node',at);
    for (const node of plan.nodes) {
      if (['sequence','parallel'].includes(node.kind)) {
        if (node.children.length < (node.kind === 'parallel' ? 2 : 1)) fail(at);
        for (const target of node.children) child(node,target);
      } else if (node.kind === 'feedback') child(node,node.body);
      else if (node.kind === 'branch') {
        const policy = get(node.policy_ref,'policy',at);
        if (!policy || policy.judgment !== judgment.id) fail(at);
        link(ref('plan_node',node.id),policy.target,'policy',at);
        if (policy.value.combine?.kind === 'authored') child(node,policy.value.combine.merge_node_ref);
      }
    }
    const root = localNode(plan.root);
    if (parents.has(root.id) || plan.nodes.some(n => n.id !== root.id && !parents.has(n.id))) fail(at);
    acyclic(new Map([...children].map(([id,list]) => [id,new Set(list)])),at);
    const reached = new Set();
    function reach(id) { if (reached.has(id)) return; reached.add(id); for (const id2 of children.get(id)) reach(id2); }
    reach(root.id); if (reached.size !== nodes.size) fail(at);
    function ancestors(id) { const out = []; while (parents.has(id)) { id = parents.get(id); out.push(id); } return out; }
    function within(id,parent) { return id === parent || ancestors(id).includes(parent); }
    function round(id) { return ancestors(id).filter(a => nodes.get(a).kind === 'feedback').join('\0'); }
    function ordered(from,to) {
      const a = [from,...ancestors(from)], b = [to,...ancestors(to)];
      const common = a.find(id => b.includes(id));
      if (!common || common === from || common === to) return;
      const type = nodes.get(common).kind, left = a[a.indexOf(common)-1], right = b[b.indexOf(common)-1];
      if (left === right) return;
      if (type === 'parallel' || (type === 'sequence' && children.get(common).indexOf(left) >= children.get(common).indexOf(right))) fail(at);
    }
    function dataEdge(from,to,checkOrder = true) {
      if (from === to) fail(at);
      if (checkOrder) ordered(from,to);
      graph.get(from).add(to);
    }
    function contract(target, allowSpecial = false) {
      const record = get(target,'contract',at);
      if (!record) return null;
      if (!allowSpecial && record.value.kind === 'emission_list') fail(at);
      return record.value;
    }
    function ports(node) {
      if (portCache.has(node.id)) return portCache.get(node.id);
      if (resolving.has(node.id)) fail(at);
      resolving.add(node.id);
      let result;
      if (node.kind === 'use') {
        const unitRecord = get(node.unit_ref,'unit',at), unit = units.get(node.unit_ref.id);
        if (!unitRecord || unitRecord.judgment !== judgment.id || !unit) fail(at);
        link(ref('plan_node',node.id),unitRecord.target,'unit',at);
        instanceMethods.set(node.id,new Set([unit.method]));
        result = { inputs:unit.inputs,outputs:unit.outputs };
      } else if (node.kind === 'judgment_use') {
        const target = r.qualified(node.judgment_ref), record = link(ref('plan_node',node.id),target,'judgment',at);
        if (!record) result = { inputs:null,outputs:null };
        else {
          callGraph.get(judgment.id).add(record.target.id);
          result = { inputs:record.value.ports.filter(p => p.direction === 'input'),outputs:record.value.ports.filter(p => p.direction === 'output') };
          instanceMethods.set(node.id,new Set([record.value.method.method.term]));
        }
      } else if (node.kind === 'branch') {
        const policy = get(node.policy_ref,'policy',at);
        result = { inputs:[],outputs:[{name:'result',contract_ref:policy.value.result_contract_ref}] };
      } else if (node.kind === 'feedback') {
        const output = endpoint(node.output,'output');
        result = { inputs:[],outputs:[{name:'result',resolved_contract:output.contract}] };
      } else result = { inputs:[],outputs:[] };
      resolving.delete(node.id); portCache.set(node.id,result); return result;
    }
    function endpoint(value,direction,allowSpecial = false) {
      const node = localNode(value.node_ref), list = ports(node)[direction === 'input' ? 'inputs' : 'outputs'];
      if (list === null) return { node,contract:null,path:value.field_path,port:value.port };
      const port = list.find(p => p.name === value.port);
      if (!port) fail(at);
      const whole = Object.hasOwn(port,'resolved_contract') ? port.resolved_contract : contract(port.contract_ref,allowSpecial);
      return {node,contract:projected(whole,value.field_path,at),whole,path:value.field_path,port:value.port};
    }
    function supply(node,port,path,source) {
      const id = JSON.stringify([node,port]), list = inputSupplies.get(id) ?? [];
      list.push({path,source}); inputSupplies.set(id,list);
    }
    for (const node of plan.nodes) {
      const ps = ports(node);
      if (!['use','judgment_use'].includes(node.kind)) continue;
      if (new Set(node.input_bindings.map(b => b.port)).size !== node.input_bindings.length) fail(at);
      for (const binding of node.input_bindings) {
        const target = endpoint({node_ref:ref('plan_node',node.id),port:binding.port,field_path:[]},'input');
        if (binding.from.kind === 'literal') { if (target.contract) valueFor(target.contract,binding.from.value,at); }
        else if (binding.from.kind === 'input') {
          const input = judgment.inputs.find(x => x.name === binding.from.name);
          if (!input) fail(at); compatible(normalContract(input.contract_ref,at),target.contract,at);
        } else {
          const feedback = localNode(binding.from.feedback_ref);
          if (feedback.kind !== 'feedback' || !within(node.id,feedback.body.id)) fail(at);
          const state = feedback.state.find(s => s.name === binding.from.slot);
          if (!state) fail(at); compatible(normalContract(state.contract_ref,at),target.contract,at);
          const update = feedback.updates.filter(u => u.state_slot === state.name && u.next_input.node_ref.id === node.id && u.next_input.port === binding.port && u.next_input.field_path.length === 0);
          if (update.length !== 1) fail(at);
        }
        supply(node.id,binding.port,[],binding.from);
      }
      if (ps.inputs) unique(ps.inputs,'name',at);
    }
    for (const flow of plan.links) {
      const from = endpoint(flow.from,'output'), to = endpoint(flow.to,'input');
      if (round(from.node.id) !== round(to.node.id)) fail(at);
      compatible(from.contract,to.contract,at); dataEdge(from.node.id,to.node.id);
      supply(to.node.id,to.port,to.path,{kind:'link',from:flow.from});
      link(ref('plan_node',to.node.id),ref('plan_node',from.node.id),'plan_node',at);
    }
    for (const node of plan.nodes) if (node.kind === 'feedback') {
      unique(node.state,'name',at); unique(node.updates,'state_slot',at);
      if (!node.state.length || node.state.length !== node.updates.length) fail(at);
      if (node.termination.kind === 'condition') link(ref('plan_node',node.id),node.termination.when,'condition',at);
      const output = endpoint(node.output,'output');
      if (!within(output.node.id,node.body.id)) fail(at);
      graph.get(output.node.id).add(node.id);
      for (const state of node.state) { const c = normalContract(state.contract_ref,at); if (c) valueFor(c,state.initial,at); link(ref('plan_node',node.id),state.contract_ref,'contract',at); }
      for (const update of node.updates) {
        const state = node.state.find(s => s.name === update.state_slot), from = endpoint(update.from,'output'), to = endpoint(update.next_input,'input');
        if (!state || !within(from.node.id,node.body.id) || !within(to.node.id,node.body.id)) fail(at);
        const c = normalContract(state.contract_ref,at); compatible(from.contract,c,at); compatible(c,to.contract,at);
        const existing = inputSupplies.get(JSON.stringify([to.node.id,to.port])) ?? [];
        const initializer = existing.filter(s => s.source.kind === 'state' && s.source.feedback_ref.id === node.id && s.source.slot === state.name && equal(s.path,to.path));
        if (initializer.length > 1 || existing.some(s => s.source.kind === 'state') && initializer.length !== 1) fail(at);
        if (!initializer.length) supply(to.node.id,to.port,to.path,{kind:'feedback',feedback_ref:ref('plan_node',node.id),slot:state.name});
        // The update is an edge between rounds, deliberately absent from graph.
      }
    }
    contexts.set(judgment.id,{judgment,plan,at,nodes,ports,endpoint,contract,supply,inputSupplies,graph,parents,children,instanceMethods,dataEdge,within,round});
  }
  for (const judgment of payload.judgments) {
    const policy = judgment.formation_rule?.policy, context = contexts.get(judgment.id);
    if (!policy) continue;
    const at = '/payload/judgments/' + payload.judgments.indexOf(judgment) + '/formation_rule/policy';
    const ptarget = ref('policy',policy.id), output = normalContract(policy.result_contract_ref,at);
    link(ptarget,policy.result_contract_ref,'contract',at);
    compatible(output,judgment.result_contract,at);
    const candidates = unique(policy.candidates,'id',at), producers = new Map();
    for (const candidate of policy.candidates) {
      link(ref('candidate',candidate.id),candidate.contract_ref,'contract',at);
      const c = normalContract(candidate.contract_ref,at); if (c) valueFor(c,candidate.value,at);
    }
    const branchNodes = context ? [...context.nodes.values()].filter(n => n.kind === 'branch' && n.policy_ref.id === policy.id) : [];
    for (const entry of policy.entries) {
      const etarget = ref('branch_entry',entry.id);
      link(ptarget,etarget,'branch_entry',at); link(etarget,entry.when,'condition',at);
      let c, producer;
      if (entry.then.kind === 'candidate') {
        const candidate = get(entry.then.candidate_ref,'candidate',at);
        if (!candidate || candidate.owner.id !== policy.id || !candidates.has(candidate.target.id)) fail(at);
        link(etarget,candidate.target,'candidate',at); c = normalContract(candidate.value.contract_ref,at); producer = candidate.target;
      } else {
        if (!context) fail(at);
        const from = context.endpoint(entry.then.from,'output');
        c = normalContract(entry.then.contract_ref,at); compatible(from.contract,c,at); producer = entry.then.from;
        if (branchNodes.some(n => n.id === from.node.id) || policy.combine?.kind === 'authored' && policy.combine.merge_node_ref.id === from.node.id) fail(at);
        for (const branch of branchNodes) { if (context.round(from.node.id) !== context.round(branch.id)) fail(at); context.dataEdge(from.node.id,branch.id); }
        link(etarget,ref('plan_node',from.node.id),'plan_node',at); link(etarget,entry.then.contract_ref,'contract',at);
      }
      producers.set(producerKey(producer),c);
    }
    if (policy.match === 'first_match') {
      if (policy.combine || policy.on_undetermined.kind !== 'defer') fail(at);
      for (const c of producers.values()) compatible(c,output,at);
    } else if (!policy.combine) fail(at);
    if (policy.match === 'first_match' || policy.combine?.order === 'priority') {
      const priorities = policy.entries.map(e => e.priority);
      if (priorities.some(p => !Number.isSafeInteger(p) || p < 0) || new Set(priorities).size !== priorities.length) fail(at);
    }
    for (const set of policy.exclusive_sets) {
      if (set.length < 2 || new Set(set.map(producerKey)).size !== set.length || set.some(p => !producers.has(producerKey(p)))) fail(at);
    }
    if (policy.on_no_match.kind === 'value') {
      const c = normalContract(policy.on_no_match.contract_ref,at);
      compatible(c,output,at); if (c) valueFor(c,policy.on_no_match.value,at);
      link(ptarget,policy.on_no_match.contract_ref,'contract',at);
    }
    if (policy.combine?.kind === 'collect') {
      const item = normalContract(policy.combine.item_contract_ref,at);
      link(ptarget,policy.combine.item_contract_ref,'contract',at);
      if (output && item && (output.shape.kind !== 'list' || !equal(output.shape.item_shape,item.shape) || output.minimum !== output.shape.minimum || output.maximum !== output.shape.maximum || output.minimum !== 0 || output.maximum !== null && output.maximum < policy.entries.length)) fail(at);
      for (const c of producers.values()) compatible(c,item,at);
      if (policy.on_undetermined.kind === 'partial' && policy.exclusive_sets.length) fail(at);
    } else if (policy.combine?.kind === 'authored') {
      if (!context || branchNodes.length !== 1 || policy.on_undetermined.kind !== 'defer') fail(at);
      const combine = policy.combine, merge = context.nodes.get(combine.merge_node_ref.id);
      if (!merge || merge.kind !== 'use' || context.parents.get(merge.id) !== branchNodes[0].id) fail(at);
      const input = context.endpoint({node_ref:combine.merge_node_ref,port:combine.input_port,field_path:[]},'input',true);
      const merged = context.endpoint({node_ref:combine.merge_node_ref,port:combine.output_port,field_path:[]},'output');
      if (input.contract?.kind !== 'emission_list' || r.identity(input.contract.policy_ref) !== r.identity(ptarget)) fail(at);
      compatible(merged.contract,output,at);
      context.supply(merge.id,combine.input_port,[],{kind:'policy',policy_ref:ptarget});
      context.graph.get(merge.id).add(branchNodes[0].id);
      for (const entry of policy.entries) if (entry.then.kind === 'output') context.graph.get(entry.then.from.node_ref.id).add(merge.id);
    }
    if (policy.on_undetermined.kind === 'partial' && !(policy.match === 'all_matches' && policy.combine?.kind === 'collect')) fail(at);
  }
  for (const context of contexts.values()) {
    const {judgment,plan,at,nodes,ports,endpoint,inputSupplies,graph,instanceMethods} = context;
    for (const node of nodes.values()) if (['use','judgment_use'].includes(node.kind)) {
      const inputPorts = ports(node).inputs;
      if (!inputPorts) continue;
      for (const port of inputPorts) {
        const c = context.contract(port.contract_ref,true), supplies = inputSupplies.get(JSON.stringify([node.id,port.name])) ?? [];
        if (c?.kind === 'emission_list') {
          if (supplies.length !== 1 || supplies[0].source.kind !== 'policy') fail(at);
          const policy = get(c.policy_ref,'policy',at);
          if (!policy || policy.value.combine?.kind !== 'authored' || policy.value.combine.merge_node_ref.id !== node.id || policy.value.combine.input_port !== port.name) fail(at);
        } else {
          if (!supplies.length) fail(at);
          if (c) completeBindings(c.shape,supplies.map(s => s.path),at);
        }
      }
      for (const port of ports(node).outputs ?? []) context.contract(port.contract_ref);
    }
    acyclic(graph,at);
    for (const binding of plan.result_bindings) {
      const source = endpoint(binding.from,'output');
      if (context.round(source.node.id)) fail(at);
      compatible(source.contract,projected(judgment.result_contract,binding.field_path,at),at);
    }
    completeBindings(judgment.result_contract.shape,plan.result_bindings.map(b => b.field_path),at);
    const contributing = new Set(plan.result_bindings.map(b => b.from.node_ref.id)), reverse = new Map([...nodes.keys()].map(id => [id,[]]));
    for (const [from,tos] of graph) for (const to of tos) reverse.get(to).push(from);
    // Cross-round state cannot participate in the per-round DAG check, but it
    // is a genuine contributor to later output. Its influence closure may cycle.
    for (const node of nodes.values()) if (node.kind === 'feedback') for (const update of node.updates) reverse.get(update.next_input.node_ref.id).push(update.from.node_ref.id);
    const queue = [...contributing];
    for (let i = 0; i < queue.length; i++) for (const next of reverse.get(queue[i])) if (!contributing.has(next)) { contributing.add(next); queue.push(next); }
    context.contributing = contributing;
    context.methods = new Set([...contributing].flatMap(id => [...(instanceMethods.get(id) ?? [])]));
  }
  acyclic(callGraph,'/payload/judgments/method/plan');
  const settled = new Map();
  function actualMethods(id) {
    if (settled.has(id)) return settled.get(id);
    const j = payload.judgments.find(j => j.id === id), context = contexts.get(id), out = new Set();
    if (!context) out.add(j.method.method.term);
    else for (const node of context.nodes.values()) if (context.contributing.has(node.id)) {
      if (node.kind === 'use') out.add(get(node.unit_ref,'unit',context.at).value.method);
      if (node.kind === 'judgment_use') { const target = get(r.qualified(node.judgment_ref),'judgment',context.at); if (target) for (const method of actualMethods(target.target.id)) out.add(method); }
    }
    settled.set(id,out); return out;
  }
  for (const judgment of payload.judgments) {
    const context = contexts.get(judgment.id);
    if (!context) continue;
    const methods = actualMethods(judgment.id), external = r.unresolved.some(e => e.mandatory && get(e.source)?.judgment === judgment.id);
    if (judgment.method.method.term === 'composite') { if (methods.size < 2 && !external) fail(context.at); }
    else if ([...methods].some(m => m !== judgment.method.method.term)) fail(context.at);
  }
  // A dedicated contract has exactly its one designated input use, even if an
  // unused unit or another otherwise well-formed port also points to it.
  for (const record of r.ordered) if (record.target.kind === 'contract' && record.value.kind === 'emission_list') {
    const policy = get(record.value.policy_ref,'policy',record.path);
    if (!policy || policy.value.combine?.kind !== 'authored') fail(record.path);
    const context = contexts.get(policy.judgment), merge = context?.nodes.get(policy.value.combine.merge_node_ref.id);
    if (!merge || merge.kind !== 'use') fail(record.path);
    const unit = get(merge.unit_ref,'unit',record.path).value;
    let count = 0;
    for (const judgment of payload.judgments) for (const candidate of judgment.method.units ?? []) for (const port of [...candidate.inputs,...candidate.outputs]) if (r.identity(port.contract_ref) === r.identity(record.target)) {
      count++; if (candidate.id !== unit.id || !candidate.inputs.includes(port) || port.name !== policy.value.combine.input_port) fail(record.path);
    }
    if (count !== 1 || [...context.nodes.values()].filter(n => n.kind === 'use' && n.unit_ref.id === unit.id).length !== 1) fail(record.path);
  }
  return contexts;
}

module.exports = { checkPlans };
