'use strict';
// Cross-entry obligations of the grammar.1 line, implemented once for the whole
// protocol. These rules cannot be expressed as JSON Schema over a single node:
// they relate entries to each other (a judgment to its asset, a material to
// another material, a parent reference to the whole judgment set, a term to the
// public registry, an id to every other id in its class).
//
// This module is the single implementation. `scripts/public-contract/
// cross-entry-check.mjs` is a thin CLI over it; Core admission calls it directly;
// `generate.mjs` reads RULE_IDS to refuse any source rule that claims to be
// implemented without appearing here.
//
// Nothing here reads files at import time and nothing here trusts a registry
// embedded in the document under test: the registry is passed in by the caller,
// and Core passes its own generated contract.

const IMPLEMENTED_RULE_IDS = Object.freeze([
  'PUBLIC-FORM-CONSISTENCY',
  'PUBLIC-ASSET-CAPABILITY',
  'PUBLIC-UNIQUE-IDENTITY',
  'PUBLIC-TERM-UNIQUENESS',
  'PUBLIC-PARENT-CLOSURE',
  'PUBLIC-TERM-VOCABULARY',
  'PUBLIC-NAVIGATION-LABEL',
  'PUBLIC-LIFECYCLE',
]);

const FORM_CONCLUSION = 'conclusion';
const FORM_RULE = 'rule';
const FORM_TO_CAPABILITY = {[FORM_CONCLUSION]: 'asserted_answers', [FORM_RULE]: 'result_forming_rules'};
const REGISTRY_KEY = {
  relationship_kind: 'relationship_kind',
  relationship_operator: 'relationship_operator',
  relationship_effect: 'relationship_effect',
  relation_role: 'relation_role',
  answer_type: 'answer_type',
  method: 'method',
};
// Top-level Payload collections whose members carry a required `id`. The set is
// deliberately enumerated; nested positions are covered by dedicated checks
// below and everything else stays owned by PUBLIC-GRAPH.
const IDENTITY_COLLECTIONS = Object.freeze([
  'judgments', 'materials', 'reasons', 'sources', 'source_uses', 'resources',
  'relationships', 'dependencies', 'actors', 'extensions',
]);

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const describe = (v) => (v === undefined ? 'absent' : v === null ? 'null' : Array.isArray(v) ? `array(${v.length})` : typeof v);
const list = (v) => (Array.isArray(v) ? v : []);
const judgmentsOf = (payload) => list(payload?.judgments);
const termOf = (ref) => (isObject(ref) && typeof ref.term === 'string' ? ref.term : null);
const vocabularyOf = (ref) => (isObject(ref) ? ref.vocabulary : undefined);
const asTermRef = (v) => (isObject(v) ? v : null);

function declared(value) {
  return (v) => (v === undefined ? 'absent' : v === null ? 'null' : JSON.stringify(v));
}

function ruleFormConsistency(payload) {
  const out = [];
  judgmentsOf(payload).forEach((j, i) => {
    if (!isObject(j)) return;
    const at = `/judgments/${i}`;
    const hasResult = Object.hasOwn(j, 'result');
    const hasRule = Object.hasOwn(j, 'formation_rule');
    // The form domain is owned here as well as by the schema: an out-of-enum form
    // must fail closed even for a consumer that only runs this rule set.
    if (Object.hasOwn(j, 'form') && j.form !== FORM_CONCLUSION && j.form !== FORM_RULE) {
      out.push({path: `${at}/form`, message: `form must be one of ${JSON.stringify([FORM_CONCLUSION, FORM_RULE])}; found the declared value in an unregistered form`});
    }
    if (!hasResult && !hasRule) out.push({path: `${at}/form`, message: 'exactly one of result or formation_rule is required; neither is present'});
    if (hasResult && hasRule) out.push({path: `${at}/form`, message: 'exactly one of result or formation_rule is allowed; both are present'});
    if (j.form === FORM_CONCLUSION) {
      if (!hasResult) out.push({path: `${at}/result`, message: 'form "conclusion" requires an actual result'});
      if (!Object.hasOwn(j, 'result_contract')) out.push({path: `${at}/result_contract`, message: 'form "conclusion" requires a result_contract'});
      if (hasRule) out.push({path: `${at}/formation_rule`, message: 'form "conclusion" forbids a formation_rule'});
    } else if (j.form === FORM_RULE) {
      if (!hasRule) out.push({path: `${at}/formation_rule`, message: 'form "rule" requires a formation_rule'});
      if (hasResult) out.push({path: `${at}/result`, message: 'form "rule" forbids a result'});
    }
  });
  return out;
}

function capabilityFor(payload) {
  const forms = judgmentsOf(payload).map((j) => (isObject(j) ? j.form : undefined));
  if (forms.length === 0) return null;
  if (forms.some((f) => f !== FORM_CONCLUSION && f !== FORM_RULE)) return null;
  const distinct = [...new Set(forms)];
  return distinct.length === 1 ? FORM_TO_CAPABILITY[distinct[0]] : 'mixed';
}

function ruleAssetCapability(payload) {
  const expected = capabilityFor(payload);
  if (expected === null) return [{path: '/asset_capability', message: 'asset capability cannot be derived because at least one judgment declares no closed form'}];
  if (payload?.asset_capability !== expected) {
    return [{
      path: '/asset_capability',
      message: `asset_capability ${describe(payload?.asset_capability)} contradicts the declared judgment forms; the closed mapping of this asset is ${JSON.stringify(expected)}. The asset-level value is a summary; the issue-level form stays authoritative.`,
    }];
  }
  return [];
}

function pushDuplicates(out, kind, entries, pathFor) {
  const first = new Map();
  entries.forEach((entry, i) => {
    if (!isObject(entry)) return;
    const id = entry.id;
    if (typeof id !== 'string' || id.length === 0) return;
    if (first.has(id)) {
      out.push({
        path: pathFor(i),
        message: `duplicate ${kind} id ${JSON.stringify(id)}; first declared at ${pathFor(first.get(id))}. One id must name one object inside its class.`,
      });
      return;
    }
    first.set(id, i);
  });
}

function declarationValues(declaration) {
  return isObject(declaration) && Array.isArray(declaration.value) ? declaration.value : [];
}

function extensionsIn(payload) {
  // Only the top-level `payload.extensions` collection is collected here, on
  // purpose. An Extension id is a CARRIER-KIND id, not a per-instance id: Core
  // resolves it with `kinds.get(extension.id)` against the component-semantics
  // carrier registry and then requires `extension.definition` to equal that
  // carrier's registered definition (`component-semantics.js`). Several instances
  // of one carrier kind therefore repeat the same id by design — the
  // component-semantics fixtures declare N component carriers inside one judgment
  // whose extensions all carry `carriers.component.id`. Instance-level uniqueness
  // cannot apply to those nested positions: requiring it makes "a method with two
  // or more component declarations" unrepresentable.
  //
  // The rule's own scope agrees: PUBLIC-UNIQUE-IDENTITY covers each declared
  // top-level payload collection (including `extensions`) plus one nested
  // resolution target (Judgment.result_contract.id), and leaves repeated nested
  // extension slots to PUBLIC-GRAPH. Do not re-add a walk over
  // `Judgment.extensions[]` or over `TermRef.extension` positions here; that is a
  // normative expansion of this rule, not a local fix.
  const found = [];
  list(payload?.extensions).forEach((e, i) => found.push({entry: e, path: `/extensions/${i}/id`}));
  return found;
}

function nestedIdentityViolations(payload) {
  const out = [];
  // A result contract id is a resolution target (result.contract_ref,
  // formation_rule.output_contract_ref), so it must be unambiguous even though it
  // is nested.
  const contracts = new Map();
  judgmentsOf(payload).forEach((j, i) => {
    if (!isObject(j) || !isObject(j.result_contract)) return;
    const id = j.result_contract.id;
    if (typeof id !== 'string' || id.length === 0) return;
    if (contracts.has(id)) {
      out.push({
        path: `/judgments/${i}/result_contract/id`,
        message: `duplicate result_contract id ${JSON.stringify(id)}; first declared by /judgments/${contracts.get(id)}. A result contract id is a resolution target, so one id must name one contract.`,
      });
      return;
    }
    contracts.set(id, i);
  });
  // Extension ids are one class wherever they appear: payload level, judgment
  // level and the single TermRef slot.
  const seenExtensions = new Map();
  for (const {entry, path} of extensionsIn(payload)) {
    const id = isObject(entry) ? entry.id : undefined;
    if (typeof id !== 'string' || id.length === 0) continue;
    if (seenExtensions.has(id)) {
      out.push({path, message: `duplicate Extension id ${JSON.stringify(id)}; first declared at ${seenExtensions.get(id)}`});
      continue;
    }
    seenExtensions.set(id, path);
  }
  // Boundary / exception / misuse ids are each one class across asset level and
  // every judgment level.
  const assetDeclarations = isObject(payload?.declarations) ? payload.declarations : {};
  const boundaryEntries = [];
  const exceptionEntries = [];
  const misuseEntries = [];
  declarationValues(assetDeclarations.boundaries).forEach((e, i) => boundaryEntries.push({entry: e, path: `/declarations/boundaries/value/${i}/id`}));
  judgmentsOf(payload).forEach((j, i) => {
    if (!isObject(j)) return;
    declarationValues(j.boundaries).forEach((e, k) => boundaryEntries.push({entry: e, path: `/judgments/${i}/boundaries/value/${k}/id`}));
    declarationValues(j.exceptions).forEach((e, k) => exceptionEntries.push({entry: e, path: `/judgments/${i}/exceptions/value/${k}/id`}));
    declarationValues(j.misuse).forEach((e, k) => misuseEntries.push({entry: e, path: `/judgments/${i}/misuse/value/${k}/id`}));
  });
  const dedupe = (entries, kind) => {
    const seen = new Map();
    for (const {entry, path} of entries) {
      const id = isObject(entry) ? entry.id : undefined;
      if (typeof id !== 'string' || id.length === 0) continue;
      if (seen.has(id)) {
        out.push({path, message: `duplicate ${kind} id ${JSON.stringify(id)}; first declared at ${seen.get(id)}`});
        continue;
      }
      seen.set(id, path);
    }
  };
  dedupe(boundaryEntries, 'Boundary');
  dedupe(exceptionEntries, 'Exception');
  dedupe(misuseEntries, 'Misuse');
  // Method component ids are one class across the whole payload, like every
  // other id a whole-asset reference can resolve on its own. Three carriers name
  // a component by id with no judgment qualifier in the reference itself:
  // `Payload.source_uses[].target_ref` when `target_kind` is "method_component",
  // `Reason.component_refs`, and the component semantics carriers. Canonical IR
  // registers the components of every judgment into one flat id space as well
  // (`canonical-ir.js` `register('method_component', ...)`), so a second
  // judgment reusing an id would make one reference name two objects.
  const seenComponents = new Map();
  judgmentsOf(payload).forEach((j, i) => {
    if (!isObject(j) || !isObject(j.method)) return;
    list(j.method.components).forEach((c, k) => {
      const id = isObject(c) ? c.id : undefined;
      if (typeof id !== 'string' || id.length === 0) return;
      const path = `/judgments/${i}/method/components/${k}/id`;
      if (seenComponents.has(id)) {
        out.push({path, message: `duplicate MethodComponent id ${JSON.stringify(id)}; first declared at ${seenComponents.get(id)}. A method component id is a resolution target of the whole asset, so one id must name one component even across different judgments.`});
        return;
      }
      seenComponents.set(id, path);
    });
  });
  return out;
}

function ruleUniqueIdentity(payload) {
  const out = [];
  for (const key of IDENTITY_COLLECTIONS) {
    pushDuplicates(out, key === 'extensions' ? 'Extension' : key.replace(/s$/, ''), list(payload?.[key]), (i) => `/${key}/${i}/id`);
  }
  return out.concat(nestedIdentityViolations(payload));
}

function ruleTermUniqueness(payload) {
  const out = [];
  const seen = new Map();
  list(payload?.materials).forEach((m, i) => {
    if (!isObject(m) || m.kind !== 'definition') return;
    const term = m.term;
    if (Object.hasOwn(m, 'term') && (typeof term !== 'string' || term.length === 0)) {
      out.push({path: `/materials/${i}/term`, message: `a definition term must be a non-empty string; found ${describe(term)}`});
      return;
    }
    if (typeof term !== 'string' || term.length === 0) return;
    if (seen.has(term)) {
      out.push({
        path: `/materials/${i}/term`,
        message: `duplicate definition term ${JSON.stringify(term)}; first declared at /materials/${seen.get(term)}/term. Duplicates are rejected, never merged by the reader.`,
      });
      return;
    }
    seen.set(term, i);
  });
  return out;
}

function ruleParentClosure(payload) {
  const out = [];
  const judgments = judgmentsOf(payload);
  const ids = new Map();
  const idCounts = new Map();
  judgments.forEach((j, i) => {
    if (!isObject(j) || typeof j.id !== 'string') return;
    idCounts.set(j.id, (idCounts.get(j.id) ?? 0) + 1);
    if (!ids.has(j.id)) ids.set(j.id, i);
  });
  const parentOf = new Map();
  judgments.forEach((j, i) => {
    if (!isObject(j) || !Object.hasOwn(j, 'parent_ref')) return;
    const path = `/judgments/${i}/parent_ref`;
    const raw = j.parent_ref;
    if (raw === null) return;
    if (typeof raw !== 'string' || raw.length === 0) {
      out.push({path, message: `parent_ref must be a non-empty identifier; found ${describe(raw)}`});
      return;
    }
    if (typeof j.id === 'string') {
      if ((idCounts.get(j.id) ?? 0) > 1) {
        out.push({path, message: `parent_ref cannot be evaluated because judgment id ${JSON.stringify(j.id)} is declared ${idCounts.get(j.id)} times in this asset`});
        return;
      }
      parentOf.set(j.id, raw);
    }
    if (raw === j.id) {
      out.push({path, message: `parent_ref points at its own judgment (${JSON.stringify(raw)})`});
      return;
    }
    if (!ids.has(raw)) out.push({path, message: `parent_ref ${JSON.stringify(raw)} does not resolve to any judgment id in this asset`});
  });
  const settled = new Set();
  for (const start of parentOf.keys()) {
    if (settled.has(start)) continue;
    const chain = new Set();
    let node = start;
    while (typeof node === 'string' && parentOf.has(node)) {
      if (chain.has(node)) {
        const idx = judgments.findIndex((j) => isObject(j) && j.id === start);
        out.push({
          path: idx >= 0 ? `/judgments/${idx}/parent_ref` : '/judgments',
          message: `parent_ref cycle detected: ${[...chain].map((v) => JSON.stringify(v)).join(' -> ')} -> ${JSON.stringify(node)}`,
        });
        break;
      }
      chain.add(node);
      node = parentOf.get(node);
    }
    for (const visited of chain) settled.add(visited);
  }
  return out;
}

function ruleTermVocabulary(payload, registry) {
  const out = [];
  const entries = registry && typeof registry === 'object' ? registry : {};
  const check = (ref, key, path) => {
    const term = termOf(ref);
    if (term === null) return;
    const declaredVocabulary = vocabularyOf(ref);
    const known = Array.isArray(entries[key]) ? entries[key].includes(term) : false;
    if (known || declaredVocabulary === 'author') return;
    out.push({
      path: `${path}/term`,
      message: `term ${JSON.stringify(term)} is not in core_terms.${key} and vocabulary is ${describe(declaredVocabulary)}; either register the term or declare vocabulary:"author"`,
    });
  };
  list(payload?.relationships).forEach((r, i) => {
    if (!isObject(r)) return;
    check(r.kind, REGISTRY_KEY.relationship_kind, `/relationships/${i}/kind`);
    check(r.operator, REGISTRY_KEY.relationship_operator, `/relationships/${i}/operator`);
    check(r.effect, REGISTRY_KEY.relationship_effect, `/relationships/${i}/effect`);
    list(r.participants).forEach((p, k) => {
      if (isObject(p)) check(p.role, REGISTRY_KEY.relation_role, `/relationships/${i}/participants/${k}/role`);
    });
  });
  judgmentsOf(payload).forEach((j, i) => {
    if (!isObject(j)) return;
    if (isObject(j.result_contract)) {
      check(j.result_contract.form, REGISTRY_KEY.answer_type, `/judgments/${i}/result_contract/form`);
      list(j.result_contract.allowed_result_types).forEach((t, k) => check(t, REGISTRY_KEY.answer_type, `/judgments/${i}/result_contract/allowed_result_types/${k}`));
    }
    if (isObject(j.result)) check(j.result.result_type, REGISTRY_KEY.answer_type, `/judgments/${i}/result/result_type`);
    if (isObject(j.method)) {
      check(j.method.method, REGISTRY_KEY.method, `/judgments/${i}/method/method`);
      list(j.method.components).forEach((c, k) => {
        if (isObject(c)) check(c.method, REGISTRY_KEY.method, `/judgments/${i}/method/components/${k}/method`);
      });
    }
  });
  return out;
}

function ruleNavigationLabel(payload) {
  const out = [];
  judgmentsOf(payload).forEach((j, i) => {
    if (isObject(j) && Object.hasOwn(j, 'label')) out.push({path: `/judgments/${i}/label`, message: 'R2 uses the unique authored focus; a separate navigation label is forbidden'});
  });
  return out;
}

// Replacement identity is local only when all three asset coordinates agree.
function sameAsset(a, b) {
  return isObject(a) && isObject(b) && ['asset_id', 'asset_version', 'judgment_version'].every(k => typeof a[k] === 'string' && a[k] === b[k]);
}
function ruleLifecycle(payload) {
  const out = [], judgments = judgmentsOf(payload), byId = new Map(judgments.map(j => [j?.id, j])), edges = new Map();
  judgments.forEach((j, i) => {
    if (!isObject(j) || !Object.hasOwn(j, 'lifecycle')) return;
    const lifecycle = j.lifecycle, at = `/judgments/${i}/lifecycle`;
    if (!isObject(lifecycle) || !['active','deprecated','superseded','withdrawn'].includes(lifecycle.status) || !Array.isArray(lifecycle.superseded_by)) {
      out.push({path: at, message: 'lifecycle must use the closed status and replacement target contract'}); return;
    }
    const targets = lifecycle.superseded_by;
    if (lifecycle.status === 'superseded' && targets.length === 0) out.push({path: `${at}/superseded_by`, message: 'superseded requires an explicit replacement'});
    if (['active','withdrawn'].includes(lifecycle.status) && targets.length !== 0) out.push({path: `${at}/superseded_by`, message: 'active and withdrawn forbid replacement assertions; use deprecated or superseded'});
    const local = [], seen = new Set();
    targets.forEach((t, k) => {
      const path = `${at}/superseded_by/${k}`;
      if (!isObject(t) || !isObject(t.asset) || ['asset_id','asset_version','judgment_version'].some(key => typeof t.asset[key] !== 'string' || !t.asset[key]) || typeof t.judgment_id !== 'string' || !t.judgment_id) {
        out.push({path, message: 'replacement requires complete AssetIdentity and judgment_id'}); return;
      }
      const key = JSON.stringify([t.asset.asset_id,t.asset.asset_version,t.asset.judgment_version,t.judgment_id]);
      if (seen.has(key)) out.push({path, message: 'replacement identity must be unique'});
      seen.add(key);
      if (!sameAsset(t.asset, payload.asset)) return; // external declaration; no lookup or validity claim
      if (t.judgment_id === j.id) out.push({path, message: 'a judgment cannot replace itself'});
      if (!byId.has(t.judgment_id)) out.push({path, message: 'a current-asset replacement must resolve to a judgment'});
      else local.push(t.judgment_id);
    });
    edges.set(j.id, local);
  });
  // Iterative three-colour DFS keeps large valid histories off the call stack.
  const colors = new Map();
  for (const id of edges.keys()) {
    if (colors.get(id) === 2) continue;
    const stack = [{id, index: 0}]; colors.set(id, 1);
    while (stack.length) {
      const frame = stack[stack.length - 1], targets = edges.get(frame.id) ?? [];
      if (frame.index === targets.length) {colors.set(frame.id, 2); stack.pop(); continue;}
      const next = targets[frame.index++];
      if (colors.get(next) === 1) {out.push({path: '/judgments', message: 'current-asset replacement graph must be acyclic'}); return out;}
      if (colors.get(next) !== 2) {colors.set(next, 1); stack.push({id: next, index: 0});}
    }
  }
  return out;
}

const RULES = [
  {rule_id: 'PUBLIC-FORM-CONSISTENCY', run: (payload) => ruleFormConsistency(payload)},
  {rule_id: 'PUBLIC-ASSET-CAPABILITY', run: (payload) => ruleAssetCapability(payload)},
  {rule_id: 'PUBLIC-UNIQUE-IDENTITY', run: (payload) => ruleUniqueIdentity(payload)},
  {rule_id: 'PUBLIC-TERM-UNIQUENESS', run: (payload) => ruleTermUniqueness(payload)},
  {rule_id: 'PUBLIC-PARENT-CLOSURE', run: (payload) => ruleParentClosure(payload)},
  {rule_id: 'PUBLIC-TERM-VOCABULARY', run: (payload, registry) => ruleTermVocabulary(payload, registry)},
  {rule_id: 'PUBLIC-NAVIGATION-LABEL', run: (payload) => ruleNavigationLabel(payload)},
  {rule_id: 'PUBLIC-LIFECYCLE', run: (payload) => ruleLifecycle(payload)},
];

function checkPayload(payload, registry) {
  return RULES.map((rule) => {
    const violations = rule.run(payload, registry).map((v) => ({rule_id: rule.rule_id, path: v.path, message: v.message}));
    return {rule_id: rule.rule_id, ok: violations.length === 0, violations};
  });
}

// Core admission idiom: the first violation becomes one sanitised diagnostic.
// The offending value is never echoed; only the rule's fixed pointer is.
function assertPayload(payload, registry) {
  for (const rule of RULES) {
    const violations = rule.run(payload, registry);
    if (violations.length === 0) continue;
    const first = violations[0];
    const error = new Error(`${rule.rule_id}: ${first.message}`);
    error.reason = 'READ_CORE_INVALID';
    error.crossEntryRule = rule.rule_id;
    error.diagnostic = {subject: null, field: '/payload' + first.path};
    throw error;
  }
  return true;
}

module.exports = {IMPLEMENTED_RULE_IDS, RULE_IDS: IMPLEMENTED_RULE_IDS, checkPayload, assertPayload, sameAsset};
