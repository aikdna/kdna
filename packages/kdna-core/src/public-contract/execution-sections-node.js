'use strict';

const { copyJson, parseJson, canonicalJson, freeze, identifier, uint, entryName, validTimestamp } = require('./strict-input.js');
const { digest, digestCanonical } = require('./digests.js');
const {inspectNative: inspectSnapshot, sourceSelection} = require('./execution-native-source.js');
const {contract, validators, definitionDigest, fail, knownCode, inputCopy, inputJson} = require('./execution-native-common.js');

// These are admission identities, never wire credentials. Re-admission is open
// to any consumer that possesses the actual independently admitted source bytes.
const plans = new WeakMap(), capsules = new WeakMap(), requests = new WeakMap();
const kinds = Object.freeze(['NativeRuntimeCapsule06', 'NativeConsumptionPlan06', 'NativeAgentHostRequest06', 'NativeAgentHostReceipt06', 'NativeJudgmentTrace06']);
const encoder = new TextEncoder();
const CLAIMS = 'claims_not_authenticated';
const rejected = code => freeze({ status: 'rejected', code, body: null, body_bytes: 0 });
function attempt(operation) {
  try { return operation(); }
  catch (error) { return rejected(knownCode(error) ?? 'EXECUTION_CAPABILITY_UNAVAILABLE'); }
}
function json(input) { return inputJson(input); }
function same(left, right) { return canonicalJson(left) === canonicalJson(right); }
function byteLength(value) { return encoder.encode(canonicalJson(value)).byteLength; }
function scalarRefs(value, shape) {
  if (shape.$ref) {
    const name = shape.$ref.slice(8);
    if ((name === 'Identifier' && !identifier(value)) || (['EntryName', 'RuntimeMandatoryEntryName'].includes(name) && !entryName(value)) || (name === 'Timestamp' && !validTimestamp(value))) fail('EXECUTION_SCHEMA_INVALID');
    return scalarRefs(value, contract.types[name]);
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(shape.properties ?? {})) if (Object.hasOwn(value, key)) scalarRefs(value[key], child);
    if (Array.isArray(value) && shape.items) for (const child of value) scalarRefs(child, shape.items);
  }
  for (const child of shape.allOf ?? []) scalarRefs(value, child);
  for (const child of shape.oneOf ?? shape.anyOf ?? []) {
    const resolved = child.$ref ? contract.types[child.$ref.slice(8)] : child;
    if (resolved.type && (resolved.type === 'null' ? value !== null : resolved.type === 'array' ? !Array.isArray(value) : typeof value !== resolved.type)) continue;
    if (resolved.properties && Object.entries(resolved.properties).some(([key, rule]) => Object.hasOwn(rule, 'const') && Object.hasOwn(value ?? {}, key) && value[key] !== rule.const)) continue;
    scalarRefs(value, child);
  }
}
function schema(type, input) {
  const value = json(input);
  if (!kinds.includes(type)) fail('EXECUTION_INPUT_INVALID');
  if (value?.tuple && !same(value.tuple, contract.versionTuple)) fail('EXECUTION_VERSION_UNSUPPORTED');
  if (typeof value?.definition_digest === 'string' && value.definition_digest !== definitionDigest) fail('EXECUTION_VERSION_UNSUPPORTED');
  if (!validators[type](value)) fail('EXECUTION_SCHEMA_INVALID');
  scalarRefs(value, contract.types[type]);
  return freeze(value);
}
function store(map, value, context) {
  const token = Object.freeze({});
  map.set(token, { value: freeze(copyJson(value)), ...context });
  return token;
}
function lookup(map, token) {
  const value = token && typeof token === 'object' ? map.get(token) : null;
  if (!value || (value.snapshot && !inspectSnapshot(value.snapshot))) fail('EXECUTION_SOURCE_UNATTESTED');
  return value;
}
function inspect(map, token) { const record = token && typeof token === 'object' ? map.get(token) : null; return record && (!record.snapshot || inspectSnapshot(record.snapshot)) ? record.value : null; }
function inspectAdmittedPlan(plan) { return inspect(plans, plan); }
function inspectRuntimeCapsule(capsule) { return inspect(capsules, capsule); }
function inspectAgentHostRequest(request) { return inspect(requests, request); }
function parseExecutionJson(input) {
  return attempt(() => freeze({ status: 'valid', value: json(input), proof: CLAIMS }));
}
function validateExecutionStructure(type, input) {
  return attempt(() => freeze({ status: 'valid', value: schema(type, input), proof: CLAIMS }));
}
function executionDigest(input) {
  return attempt(() => freeze({ status: 'valid', digest: digestCanonical(json(input)), proof: CLAIMS }));
}

function capsuleValue(parts) {
  return { contract: contract.versionTuple.runtime, tuple: contract.versionTuple, definition_digest: definitionDigest, kind: 'static_judgment_supply', ...parts };
}
function admitConsumptionPlan(input, snapshot) {
  return attempt(() => {
    const value = schema('NativeConsumptionPlan06', input), selected = sourceSelection(snapshot, value.selection);
    if (!same(value.selection, selected.selection)) fail('EXECUTION_SELECTION_INVALID');
    if (!same(value.source, selected.source) || value.closure_digest !== digestCanonical(selected.closure)) fail('EXECUTION_BINDING_INVALID');
    const plan = store(plans, value, { selected, snapshot });
    return freeze({ status: 'admitted', plan });
  });
}
function createConsumptionPlan(snapshot, options) {
  return attempt(() => {
    const supplied = inputCopy(options), allowed = ['plan_id', 'intent', 'selection', 'budget'];
    if (!supplied || Object.keys(supplied).length !== allowed.length || Object.keys(supplied).some(key => !allowed.includes(key))) fail('EXECUTION_INPUT_INVALID');
    const selected = sourceSelection(snapshot, supplied.selection);
    return admitConsumptionPlan({ contract: contract.versionTuple.plan, tuple: contract.versionTuple, definition_digest: definitionDigest, ...supplied, selection: selected.selection, source: selected.source, closure_digest: digestCanonical(selected.closure) }, snapshot);
  });
}
function admitRuntimeCapsule(input, snapshot, plan) {
  return attempt(() => {
    const p = lookup(plans, plan), value = schema('NativeRuntimeCapsule06', input);
    const selected = sourceSelection(snapshot, p.value.selection);
    if (!same(p.selected, selected) || !same(value, capsuleValue(selected))) fail('EXECUTION_BINDING_INVALID');
    if (byteLength(value) > p.value.budget.capsule_bytes) fail('EXECUTION_BUDGET_EXCEEDED');
    return freeze({ status: 'admitted', capsule: store(capsules, value, { plan, snapshot }) });
  });
}
function createRuntimeCapsule(snapshot, plan) {
  return attempt(() => {
    const p = lookup(plans, plan);
    return admitRuntimeCapsule(capsuleValue(sourceSelection(snapshot, p.value.selection)), snapshot, plan);
  });
}
function admitAgentHostRequest(input, plan, capsule) {
  return attempt(() => {
    const p = lookup(plans, plan), c = lookup(capsules, capsule), value = schema('NativeAgentHostRequest06', input);
    if (c.plan !== plan || value.plan_digest !== digestCanonical(p.value) || value.capsule_digest !== digestCanonical(c.value)) fail('EXECUTION_BINDING_INVALID');
    return freeze({ status: 'admitted', request: store(requests, value, { plan, capsule, snapshot: p.snapshot }) });
  });
}
function createAgentHostRequest(plan, capsule, options) {
  return attempt(() => {
    const p = lookup(plans, plan), c = lookup(capsules, capsule), supplied = inputCopy(options);
    const allowed = ['request_id', 'run_id', 'host_id', 'host_epoch'];
    if (!supplied || Object.keys(supplied).length !== allowed.length || Object.keys(supplied).some(key => !allowed.includes(key))) fail('EXECUTION_INPUT_INVALID');
    return admitAgentHostRequest({ contract: contract.versionTuple.host, tuple: contract.versionTuple, definition_digest: definitionDigest, ...supplied, operation: 'consume_judgment', plan_digest: digestCanonical(p.value), capsule_digest: digestCanonical(c.value) }, plan, capsule);
  });
}

function checkedReceipt(input, request) {
  const value = schema('NativeAgentHostReceipt06', input), r = lookup(requests, request), wire = r.value;
  for (const key of ['request_id', 'run_id', 'host_id', 'host_epoch', 'plan_digest', 'capsule_digest']) if (value[key] !== wire[key]) fail('EXECUTION_BINDING_INVALID');
  if (value.request_digest !== digestCanonical(wire)) fail('EXECUTION_BINDING_INVALID');
  const p = lookup(plans, r.plan).value;
  if (value.status === 'completed') {
    if (value.failure !== null || !value.authorization || !value.delivery || value.output.digest === null) fail('EXECUTION_BINDING_INVALID');
    if (value.authorization.verified_at > value.issued_at || value.issued_at >= value.authorization.expires_at) fail('EXECUTION_HOST_EXPIRED');
    if (['producer_digest', 'delivery_digest', 'observed_digest'].some(key => value.delivery[key] !== wire.capsule_digest)) fail('EXECUTION_DELIVERY_INVALID');
    if (value.output.bytes > p.budget.output_bytes) fail('EXECUTION_BUDGET_EXCEEDED');
  } else {
    if (value.failure === null || value.output.bytes !== 0 || value.output.digest !== null || value.authorization !== null || value.delivery !== null) fail('EXECUTION_BINDING_INVALID');
    if ((value.status === 'denied') !== ['EXECUTION_HOST_DENIED', 'EXECUTION_HOST_EXPIRED'].includes(value.failure)) fail('EXECUTION_BINDING_INVALID');
  }
  return value;
}
function validateAgentHostReceipt(input, request) {
  return attempt(() => freeze({ status: 'valid', value: checkedReceipt(input, request), proof: CLAIMS }));
}

const eventSources = Object.freeze({ request_admitted: 'reference_host', delivery_verified: 'delivery_provider', execution_authorized: 'authorization_provider', outcome_observed: 'outcome_provider', output_authorized: 'authorization_provider', completed: 'reference_host', denied: 'reference_host', failed: 'reference_host' });
const successEvents = Object.freeze(['request_admitted', 'delivery_verified', 'execution_authorized', 'outcome_observed', 'output_authorized', 'completed']);
function checkedTrace(input, request, receipt) {
  const value = schema('NativeJudgmentTrace06', input), rec = checkedReceipt(receipt, request), r = lookup(requests, request), p = lookup(plans, r.plan).value;
  for (const key of ['run_id', 'host_id', 'host_epoch', 'request_digest', 'plan_digest', 'capsule_digest', 'status']) if (value[key] !== rec[key]) fail('EXECUTION_BINDING_INVALID');
  if (value.receipt_digest !== digestCanonical(rec) || !same(value.source, p.source) || !same(value.selection, p.selection)) fail('EXECUTION_BINDING_INVALID');
  if (value.events.length > p.budget.trace_events) fail('EXECUTION_BUDGET_EXCEEDED');
  const eventKinds = value.events.map(event => event.kind);
  if (rec.status === 'completed') {
    if (!same(eventKinds, successEvents)) fail('EXECUTION_BINDING_INVALID');
  } else if (eventKinds.at(-1) !== rec.status || !same(eventKinds.slice(0, -1), successEvents.slice(0, -1).slice(0, -1 + eventKinds.length))) fail('EXECUTION_BINDING_INVALID');
  for (let index = 0; index < value.events.length; index++) {
    const event = value.events[index];
    if (event.sequence !== index || event.source !== eventSources[event.kind] || event.at > rec.issued_at || (index && event.at < value.events[index - 1].at)) fail('EXECUTION_BINDING_INVALID');
    if (event.source === 'reference_host' && event.evidence_id !== null) fail('EXECUTION_BINDING_INVALID');
    if (event.source !== 'reference_host' && event.evidence_id === null) fail('EXECUTION_BINDING_INVALID');
    if (rec.status === 'completed' && event.kind === 'delivery_verified' && event.evidence_id !== rec.delivery.delivery_id) fail('EXECUTION_BINDING_INVALID');
    if (rec.status === 'completed' && event.kind === 'output_authorized' && (event.evidence_id !== rec.authorization.authorization_id || event.at !== rec.authorization.verified_at)) fail('EXECUTION_BINDING_INVALID');
  }
  if (value.events.at(-1).at !== rec.issued_at) fail('EXECUTION_BINDING_INVALID');
  return value;
}
function validateJudgmentTrace(input, request, receipt) {
  return attempt(() => freeze({ status: 'valid', value: checkedTrace(input, request, receipt), proof: CLAIMS }));
}
function validateExecutionResponse(input, request) {
  return attempt(() => {
    const body = exactRecord(json(input), ['receipt', 'trace', 'output']);
    const receipt = checkedReceipt(body.receipt, request);
    checkedTrace(body.trace, request, receipt);
    const p = lookup(plans, lookup(requests, request).plan).value;
    if (receipt.status === 'completed') {
      if (typeof body.output !== 'string') fail('EXECUTION_BINDING_INVALID');
      const bytes = encoder.encode(body.output);
      if (bytes.length !== receipt.output.bytes || digest(bytes) !== receipt.output.digest) fail('EXECUTION_BINDING_INVALID');
    } else if (body.output !== null) fail('EXECUTION_BINDING_INVALID');
    const body_bytes = byteLength(body);
    if (body_bytes > p.budget.response_bytes) fail('EXECUTION_BUDGET_EXCEEDED');
    return freeze({ status: 'valid', value: body, body_bytes, proof: CLAIMS });
  });
}

function exactRecord(value, fields) {
  const record = copyJson(value);
  if (!record || Array.isArray(record) || Object.keys(record).length !== fields.length || Object.keys(record).some(key => !fields.includes(key))) fail('EXECUTION_PROVIDER_FAILED');
  return record;
}
function provider(fn, observation) {
  try { return fn(freeze(copyJson(observation))); }
  catch { fail('EXECUTION_PROVIDER_FAILED'); }
}
function createExecutionHost(configuration) {
  return attempt(() => {
    if (!configuration || Object.getPrototypeOf(configuration) !== Object.prototype) fail('EXECUTION_HOST_INVALID');
    const fields = ['host_id', 'host_epoch', 'clock', 'authorize', 'observeDelivery', 'observeOutcome'];
    const descriptors = Object.getOwnPropertyDescriptors(configuration);
    if (Reflect.ownKeys(descriptors).length !== fields.length || fields.some(key => !descriptors[key] || !Object.hasOwn(descriptors[key], 'value'))) fail('EXECUTION_HOST_INVALID');
    const config = Object.fromEntries(fields.map(key => [key, descriptors[key].value]));
    if (!identifier(config.host_id) || !identifier(config.host_epoch) || fields.slice(2).some(key => typeof config[key] !== 'function')) fail('EXECUTION_HOST_INVALID');
    const seenRequests = new Set(), seenRuns = new Set();
    let lastTime = 0;
    function now() {
      let value;
      try { value = config.clock(); } catch { fail('EXECUTION_PROVIDER_FAILED'); }
      if (!uint(value) || value < lastTime) fail('EXECUTION_HOST_INVALID');
      lastTime = value; return value;
    }
    function consume(request) {
      return attempt(() => {
        const r = lookup(requests, request), wire = r.value, p = lookup(plans, r.plan).value, c = lookup(capsules, r.capsule).value;
        if (wire.host_id !== config.host_id || wire.host_epoch !== config.host_epoch) fail('EXECUTION_HOST_INVALID');
        if (seenRequests.has(wire.request_id) || seenRuns.has(wire.run_id) || seenRequests.size >= 65536) fail('EXECUTION_REPLAY');
        // Reserve before external callbacks, including reentrant callbacks. Failed
        // attempts are consumed too; a new attempt requires a new run/request ID.
        seenRequests.add(wire.request_id); seenRuns.add(wire.run_id);
        if (p.budget.trace_events < successEvents.length) fail('EXECUTION_BUDGET_EXCEEDED');
        const requestDigest = digestCanonical(wire), summary = { request: wire, request_digest: requestDigest };
        const events = [];
        function event(kind, evidence_id = null, time = now()) { events.push({ sequence: events.length, at: time, kind, source: eventSources[kind], evidence_id }); }
        event('request_admitted');
        let authorization, delivery, output, failure = null, status = 'completed';
        function authorize(phase) {
          const response = exactRecord(provider(config.authorize, { ...summary, phase }), ['decision', 'authorization_id', 'request_digest', 'host_id', 'host_epoch', 'issued_at', 'expires_at']);
          if (!['allow', 'deny'].includes(response.decision) || !identifier(response.authorization_id) || response.request_digest !== requestDigest || response.host_id !== config.host_id || response.host_epoch !== config.host_epoch || !uint(response.issued_at) || !uint(response.expires_at)) fail('EXECUTION_HOST_INVALID');
          if (response.decision !== 'allow') fail('EXECUTION_HOST_DENIED');
          const time = now();
          if (response.issued_at > time || response.expires_at <= time) fail('EXECUTION_HOST_EXPIRED');
          event(phase === 'execution' ? 'execution_authorized' : 'output_authorized', response.authorization_id, time);
          return { authorization_id: response.authorization_id, expires_at: response.expires_at, verified_at: time };
        }
        try {
          const observed = exactRecord(provider(config.observeDelivery, summary), ['delivery_id', 'request_digest', 'producer_digest', 'delivery_digest']);
          const P = digestCanonical(c);
          if (!identifier(observed.delivery_id) || observed.request_digest !== requestDigest || observed.producer_digest !== P || observed.delivery_digest !== P || wire.capsule_digest !== P) fail('EXECUTION_DELIVERY_INVALID');
          delivery = { delivery_id: observed.delivery_id, producer_digest: observed.producer_digest, delivery_digest: observed.delivery_digest, observed_digest: P };
          event('delivery_verified', observed.delivery_id);
          authorize('execution');
          const outcome = provider(config.observeOutcome, { request: wire, plan: p, capsule: c });
          // The provider gives actual text, never a caller-supplied byte count.
          // Parsing/copying rejects getters, promises, malformed Unicode and data.
          const observedOutcome = exactRecord(outcome, ['observation_id', 'status', 'output']);
          if (!identifier(observedOutcome.observation_id) || !['completed', 'failed'].includes(observedOutcome.status)) fail('EXECUTION_PROVIDER_FAILED');
          if (observedOutcome.status === 'failed') {
            if (observedOutcome.output !== null) fail('EXECUTION_PROVIDER_FAILED');
            fail('EXECUTION_OUTCOME_FAILED');
          }
          if (typeof observedOutcome.output !== 'string') fail('EXECUTION_PROVIDER_FAILED');
          const actualBytes = encoder.encode(observedOutcome.output).byteLength;
          if (actualBytes > p.budget.output_bytes) fail('EXECUTION_BUDGET_EXCEEDED');
          output = observedOutcome.output;
          event('outcome_observed', observedOutcome.observation_id);
          authorization = authorize('output');
        } catch (error) {
          failure = knownCode(error) ?? 'EXECUTION_PROVIDER_FAILED';
          status = ['EXECUTION_HOST_DENIED', 'EXECUTION_HOST_EXPIRED'].includes(failure) ? 'denied' : 'failed';
          authorization = null; delivery = null; output = null;
        }
        // An already decided refusal keeps its first cause: the added boundary
        // observation may only decide an outcome that is still undecided. With a
        // first cause present the terminal record is emitted from the last clock
        // value this Host actually accepted. EXECUTION_HOST_INVALID (a violation of
        // the Host's own observation stream, e.g. a non-monotonic clock) is the one
        // frozen literal: no legal timeline remains, so the call still ends
        // body-free carrying that cause.
        let time;
        try { time = now(); }
        catch (error) {
          if (failure === null) throw error;
          if (failure === 'EXECUTION_HOST_INVALID') fail(failure);
          time = lastTime;
        }
        if (status === 'completed' && time >= authorization.expires_at) { status = 'denied'; failure = 'EXECUTION_HOST_EXPIRED'; authorization = null; delivery = null; output = null; }
        event(status, null, time);
        const receipt = { contract: contract.versionTuple.host, tuple: contract.versionTuple, definition_digest: definitionDigest, receipt_id: 'receipt:' + requestDigest.slice(7), request_id: wire.request_id, run_id: wire.run_id, host_id: wire.host_id, host_epoch: wire.host_epoch, request_digest: requestDigest, plan_digest: wire.plan_digest, capsule_digest: wire.capsule_digest, authorization, delivery, status, failure, output: { bytes: output === null ? 0 : encoder.encode(output).byteLength, digest: output === null ? null : digest(encoder.encode(output)) }, issued_at: time, output_delivery: 'not_confirmed' };
        const receiptDigest = digestCanonical(receipt);
        const trace = { contract: contract.versionTuple.trace, tuple: contract.versionTuple, definition_digest: definitionDigest, trace_id: 'trace:' + receiptDigest.slice(7), request_digest: requestDigest, plan_digest: wire.plan_digest, capsule_digest: wire.capsule_digest, receipt_digest: receiptDigest, run_id: wire.run_id, host_id: wire.host_id, host_epoch: wire.host_epoch, source: p.source, selection: p.selection, events, status };
        checkedTrace(trace, request, receipt);
        const body = freeze({ receipt, trace, output }), body_bytes = byteLength(body);
        // A smaller response budget cannot erase an already observed denial or
        // provider failure. The control remains body-free with the first cause.
        if (body_bytes > p.budget.response_bytes) fail(failure ?? 'EXECUTION_BUDGET_EXCEEDED');
        return freeze({ status, body, body_bytes, output_delivery: 'not_confirmed' });
      });
    }
    return Object.freeze({ status: 'ready', host: Object.freeze({ consume }) });
  });
}

module.exports = { parseExecutionJson, validateExecutionStructure, executionDigest, createConsumptionPlan, admitConsumptionPlan, inspectAdmittedPlan, createRuntimeCapsule, admitRuntimeCapsule, inspectRuntimeCapsule, createAgentHostRequest, admitAgentHostRequest, inspectAgentHostRequest, validateAgentHostReceipt, validateJudgmentTrace, validateExecutionResponse, createExecutionHost };
