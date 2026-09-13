'use strict';
const path = require('node:path');
const { createRequire } = require('node:module');
const { resolve, fixture } = require('./fixture-authority.cjs');
const id = process.argv[2],
  runtime = process.argv[3];
if (!id || !path.isAbsolute(runtime))
  throw Error('Explicit frozen case and installed runtime required');
const req = createRequire(path.join(runtime, 'package.json'));
const coreDir = path.dirname(req.resolve('@aikdna/kdna-core/package.json'));
const readDir = path.dirname(req.resolve('@aikdna/kdna-read/package.json'));
const core = (n) => require(path.join(coreDir, 'src/public-contract', n + '.js'));
const read = (n) => require(path.join(readDir, 'src', n + '.js'));
const rejectedCoreFixture = core('admit').rejected;
const input = resolve(id),
  u = read('util'),
  emb = read('embedding');
const counters = {
  core_calls: 0,
  host_calls: 0,
  io_calls: 0,
  clock_calls: 0,
  dom_calls: 0,
  path_opens: 0,
};
let raw,
  admission,
  record,
  evidenceRoute = 'real_read_admission',
  extra = {};
const admissionModule = read('admission'),
  actualAdmission = admissionModule.admitReadRequest;
admissionModule.admitReadRequest = (...args) => {
  admission = actualAdmission(...args);
  record = read('brands').requests.get(admission.admitted_request);
  return admission;
};
function control(value) {
  if (!value || value.state === 'missing') return undefined;
  if (value.state === 'invalid_witness') return {};
  return emb.createTrustedReadControlProvider(() => ({
    admission_response_limit_bytes: value.admission_response_limit_bytes,
  }));
}
function mock(moduleFile, exports) {
  require.cache[moduleFile] = { id: moduleFile, filename: moduleFile, loaded: true, exports };
}
function readResultObservation(value) {
  const e = value.envelope,
    c = e?.content,
    d = e?.diagnostics.find((x) => x.severity === 'error') ?? null;
  const result = { ...value };
  if (e)
    result.envelope = {
      ...e,
      observation_scope: 'assertion_projection_not_complete_envelope',
      diagnostic: d?.code ?? null,
      stage: d?.stage ?? null,
      delivery: e.receipt?.delivery,
      action_authorization: e.states?.action_authorization,
      read_permission: e.states?.read_permission,
      core: e.states?.core,
      interpretation: e.states?.interpretation,
      confirmation: e.states?.confirmation,
      ...(c
        ? {
            catalog: c.catalog.map((x) => x.judgment_id),
            declarations: c.declarations.map((x) => x.id),
            closure: c.closure.map((x) => x.id),
            selected: c.selected?.judgment_id ?? null,
            expanded_nodes: c.closure.map((x) => x.id),
            omission_reasons: Object.fromEntries(e.omissions.map((x) => [x.target, x.reason])),
          }
        : {}),
      required_bytes: e.budget.required_bytes,
      actual_bytes: e.budget.actual_bytes,
      body_delivered: true,
      content_delivered: e.status === 'ready',
      truncated: false,
      current_host_check: counters.host_calls > 0,
      host_reauthorized: counters.host_calls > 0,
      dom_dependency: counters.dom_calls > 0,
      duplicate_parser: counters.core_calls > 1,
      ...extra.envelope,
    };
  return {
    api_result_kind: 'ReadCallResult',
    read_call_result: result,
    body_present: !!(value.envelope || value.admission_rejection),
    admitted_request: !!record,
    core_calls: counters.core_calls,
    host_calls: counters.host_calls,
    raw_input_echo: false,
    safe_correlation_only: value.admission_rejection?.correlation.request_id ?? null,
    unknown_key_not_in_public_result: true,
    ...extra,
  };
}
async function fixtureRead() {
  evidenceRoute = 'test_authority_fixture';
  const f = fixture(id, coreDir),
    x = f.input;
  const coreResult = () => {
    if (x.fixture.core_state === 'invalid') return rejectedCoreFixture('READ_CORE_INVALID');
    if (x.fixture.interpretation !== 'complete')
      return rejectedCoreFixture('READ_INTERPRETATION_INCOMPLETE');
    return { status: 'accepted', snapshot: f.snapshot };
  };
  const nodeAdmit = async () => {
    counters.core_calls++;
    return coreResult();
  };
  const browserAdmit = async (value) => {
    counters.core_calls++;
    if (typeof value === 'string') return rejectedCoreFixture('READ_INPUT_INVALID');
    if (x.core_browser_capability !== true)
      return rejectedCoreFixture('READ_CORE_CAPABILITY_UNAVAILABLE');
    return coreResult();
  };
  mock(req.resolve('@aikdna/kdna-core/node'), { admitNode: nodeAdmit });
  mock(req.resolve('@aikdna/kdna-core/browser'), { admitBrowser: browserAdmit });
  let host;
  if (x.fixture.host.witness === 'ISSUED_BY_HOST_FIXTURE_AUTHORITY') {
    host = emb.createTrustedHostReadProvider({
      observe: ({ request }) => {
        counters.host_calls++;
        const h = x.fixture.host;
        return {
          host_id: h.host_id,
          host_epoch: h.host_epoch,
          decision_id: 'decision:fixture',
          request_id: request.request_id,
          snapshot_id: f.view.snapshot_id,
          A: f.view.digests.A.observed,
          C: f.view.digests.C.observed,
          policy_id: 'policy:fixture',
          scope: h.scope,
          issued_at: h.issued_at,
          expires_at: h.expires_at,
          current_ms: h.current_ms,
          decision: h.decision,
          revoked: h.revoked,
        };
      },
    });
    if (x.fixture.handle_registered_exactly)
      read('brands')
        .hosts.get(host)
        .handles.set(x.fixture.handle.handle_id, u.freeze(structuredClone(x.fixture.handle)));
  } else host = {};
  const provider = control(x.trusted_control_provider);
  if (x.entry === 'root') {
    const admitted = admissionModule.admitReadRequest(x.request, provider),
      before = Date.now;
    Date.now = () => {
      counters.clock_calls++;
      throw Error('Unexpected root clock');
    };
    try {
      raw = req('@aikdna/kdna-read').project(
        admitted.admitted_request,
        x.input_representation === 'Uint8Array' ? new Uint8Array(1) : f.snapshot,
      );
    } finally {
      Date.now = before;
    }
    return {
      api_result_kind: 'ReadProjection',
      read_call_result: null,
      admission_required: !!record,
      projection_assertions: {
        ...raw,
        host_called: counters.host_calls > 0,
        io_called: counters.io_calls > 0,
        clock_read: counters.clock_calls > 0,
        envelope_returned: Object.hasOwn(raw, 'envelope'),
        permission_granted: Object.hasOwn(raw, 'read_permission'),
        action_executed: Object.hasOwn(raw, 'action_authorization'),
        issued_handles: raw.body?.content.expansion_handles ?? [],
      },
    };
  }
  let value =
    x.input_representation === 'path'
      ? 'fixture.kdna'
      : x.input_representation === 'ArrayBuffer'
        ? new ArrayBuffer(1)
        : x.input_representation === 'CoreSnapshot'
          ? f.snapshot
          : new Uint8Array(1);
  if (x.path_observations) {
    evidenceRoute = 'real_node_capture_with_test_core_authority';
    // Execute the production Node capture loop against a changing path provider.
    // The Core parser result is still the named finite authority fixture.
    const fp = require('node:fs/promises'),
      original = fp.open,
      observations = x.path_observations;
    let captured;
    fp.open = async () => {
      counters.path_opens++;
      const bytes = new TextEncoder().encode(
        observations[Math.min(counters.path_opens - 1, observations.length - 1)],
      );
      let offset = 0;
      return {
        stat: async () => ({ isFile: () => true, size: bytes.length }),
        read: async (buffer, start, length) => {
          const n = Math.min(length, bytes.length - offset);
          buffer.set(bytes.subarray(offset, offset + n), start);
          offset += n;
          return { bytesRead: n };
        },
        close: async () => {},
      };
    };
    const admitPath = path.join(coreDir, 'src/public-contract/admit.js');
    mock(admitPath, {
      admit: (bytes) => {
        counters.core_calls++;
        captured = new TextDecoder().decode(bytes);
        return coreResult();
      },
      rejected: (reason) => rejectedCoreFixture(reason),
    });
    const nodeFile = path.join(coreDir, 'src/public-contract/node.js');
    delete require.cache[nodeFile];
    const actualNode = require(nodeFile);
    mock(req.resolve('@aikdna/kdna-core/node'), actualNode);
    try {
      raw = await req('@aikdna/kdna-read/node').readNode(value, x.request, provider, host);
    } finally {
      fp.open = original;
    }
    extra.envelope = {
      admission_bytes: captured,
      digest_basis: captured,
      later_path_read: counters.path_opens > 1,
    };
  } else
    raw = await req('@aikdna/kdna-read/' + x.entry)[
      x.entry === 'browser' ? 'readBrowser' : 'readNode'
    ](value, x.request, provider, host);
  return readResultObservation(raw);
}
function entries(value) {
  return Object.fromEntries(
    Object.entries(value).map(([n, b]) => [
      n,
      Buffer.from(b.utf8 ?? b.hex, b.utf8 !== undefined ? 'utf8' : 'hex'),
    ]),
  );
}
function digestOperation() {
  evidenceRoute = 'real_digest_primitive';
  const d = core('digests'),
    s = core('strict-input');
  let observed;
  if (input.bytes_hex) observed = { A: d.digest(Buffer.from(input.bytes_hex, 'hex')) };
  else if (input.entries1) {
    const a = entries(input.entries1),
      b = entries(input.entries2);
    const C1 = d.digest(d.contentTreePreimage(a)),
      C2 = d.digest(d.contentTreePreimage(b)),
      E1 = d.digest(d.runtimeEntryPreimage(a, s.parseJson(a['kdna.json']))),
      E2 = d.digest(d.runtimeEntryPreimage(b, s.parseJson(b['kdna.json'])));
    observed = { C1, C2, E1, E2, C_equal: C1 === C2, E_equal: E1 === E2 };
    extra.preimages = {
      C: Buffer.from(d.contentTreePreimage(a)).toString('hex'),
      E1: Buffer.from(d.runtimeEntryPreimage(a, s.parseJson(a['kdna.json']))).toString('hex'),
      E2: Buffer.from(d.runtimeEntryPreimage(b, s.parseJson(b['kdna.json']))).toString('hex'),
    };
  } else if (input.content_entries) {
    const a = entries(input.content_entries),
      b = entries(input.content_entries);
    a['signature.kdsig'] = Buffer.from(input.signature1_hex, 'hex');
    b['signature.kdsig'] = Buffer.from(input.signature2_hex, 'hex');
    const manifest = s.parseJson(a['kdna.json']);
    const A1 = d.digest(Buffer.from(input.final_container_bytes1_hex, 'hex')),
      A2 = d.digest(Buffer.from(input.final_container_bytes2_hex, 'hex'));
    observed = {
      A1,
      A2,
      A_equal: A1 === A2,
      C_unchanged: d.digest(d.contentTreePreimage(a)) === d.digest(d.contentTreePreimage(b)),
      E_unchanged:
        d.digest(d.runtimeEntryPreimage(a, manifest)) ===
        d.digest(d.runtimeEntryPreimage(b, manifest)),
    };
  } else if (input.raw_json) {
    try {
      observed = {
        status: 'accepted',
        C: d.digest(d.contentTreePreimage({ [input.entry]: Buffer.from(input.raw_json) })),
        diagnostic: null,
      };
    } catch {
      observed = { status: 'rejected', C: null, diagnostic: 'DIGEST_INPUT_INVALID' };
    }
  } else if (input.capsule_object)
    observed = {
      P: d.capsuleDigest(input.capsule_object),
      embedded_P: Object.hasOwn(input.capsule_object, 'P'),
      removed_fields: [],
    };
  else if (input.host_recomputed) {
    evidenceRoute = 'digest_comparison_stage_observation';
    const comparison = d.comparison(input.host_recomputed, input.delivery, {
      kind: 'host_observation',
      source_id: 'fixture:host',
    });
    observed = {
      comparison: comparison.state,
      status:
        comparison.state === 'matched' && input.delivery === input.producer
          ? 'accepted'
          : 'rejected',
      diagnostic:
        comparison.state === 'matched' && input.delivery === input.producer
          ? null
          : 'CAPSULE_DELIVERY_DIGEST_MISMATCH',
    };
  } else {
    const comparison = d.comparison(input.observed, input.expected, input.expected_source);
    observed = {
      observed: input.observed,
      comparison: comparison.state,
      matched: comparison.state === 'matched',
      diagnostic: comparison.state === 'mismatched' ? 'DIGEST_EXPECTATION_MISMATCH' : null,
    };
  }
  return {
    api_result_kind: 'DigestPrimitive',
    read_call_result: null,
    operation_assertions: observed,
  };
}
async function budgetOperation() {
  evidenceRoute = 'real_budget_decision_with_frozen_stage_measurements';
  const provider = control(input.control_provider ?? input.trusted_control_provider);
  if (input.candidate) admissionModule.admitReadRequest(input.candidate, provider);
  const budgetRecord = record ?? { request_id: null, budget_bytes: input.limit_bytes };
  const success =
      input.complete_success_bytes ?? input.complete_final_success_envelope_bytes ?? null,
    rejection = input.complete_rejection_bytes ?? input.complete_rejection_envelope_bytes;
  const semantic =
    input.first_semantic_code === 'READ_BUDGET_INSUFFICIENT'
      ? null
      : (input.first_semantic_code ?? null);
  const decision = read('budget-decision').decideBudget(budgetRecord, success, rejection, semantic);
  if (decision.kind === 'control') raw = decision.result;
  else
    raw = u.result('read_envelope', {
      status: decision.kind,
      diagnostics: decision.code ? [u.diagnostic(decision.code)] : [],
      budget: {
        limit_bytes: budgetRecord.budget_bytes,
        required_bytes: decision.required,
        actual_bytes: decision.actual,
      },
    });
  extra = {
    budget_stage_observation: { required_success_bytes: success, rejection_bytes: rejection },
    preserved_request_budget: record?.budget_bytes,
    core_calls: input.core_calls_observed ?? 'prior_pipeline_not_observed',
    host_calls: input.host_calls_observed ?? 'prior_pipeline_not_observed',
    counts_origin: 'frozen_prior_stage_observation',
  };
  return readResultObservation(raw);
}
async function transportOperation() {
  evidenceRoute = 'real_delivery_stage_with_frozen_prior_observations';
  const a = admissionModule.admitReadRequest(input.candidate, control(input.control_provider));
  let prepared;
  if (a.channel !== 'admitted_request') {
    const { admitted_request, ...rest } = a;
    prepared = { ...rest, envelope: null };
  } else {
    const s = read('budget').states();
    s.core =
      input.core_observation?.technical ?? input.pipeline_observation?.core ?? 'not_evaluated';
    const e = read('budget').rejectedEnvelope(
      record,
      input.first_semantic_code ?? 'READ_CORE_INVALID',
      s,
    );
    if (input.first_semantic_code === null) {
      e.status = 'ready';
      e.diagnostics = [];
    }
    prepared = u.result('read_envelope', e);
  }
  raw = await read('delivery').deliverResult(prepared, input.candidate?.request_id, () => {
    throw Error('private transport error');
  });
  extra = {
    core_calls: input.core_observation || input.pipeline_observation ? 1 : 0,
    host_calls: input.pipeline_observation ? 1 : 0,
    counts_origin: 'frozen_prior_stage_observation',
    body_in_return: raw.envelope ?? raw.admission_rejection,
    semantic_result_delivery_claim: raw.channel !== 'transport_failure',
    raw_exception_echo: JSON.stringify(raw).includes('private transport error'),
  };
  return readResultObservation(raw);
}
async function main() {
  let observation;
  if (input.fixture) observation = await fixtureRead();
  else if (input.declarations) {
    evidenceRoute = 'real_projection_declaration_operation';
    const r = read('declarations').projectDeclarations(
      input.declarations,
      [input.absent_optional_field],
      [input.unrequested_present_node],
    );
    raw = r;
    observation = {
      api_result_kind: 'DeclarationProjection',
      read_call_result: null,
      operation_assertions: {
        preserved_states: r.declarations.map((x) => x.state),
        missing: r.missing[0],
        omission: r.omissions[0],
        collapsed: new Set(r.declarations.map((x) => x.state)).size !== input.declarations.length,
      },
    };
  } else if (input.authored_fields) {
    evidenceRoute = 'real_core_authorship_with_creation_profile_premise';
    raw = core('authorship').assessAuthorship(
      input.authored_fields,
      input.profile_required,
      input.core,
      input.confirmation_claim,
    );
    observation = {
      api_result_kind: 'WriterAssessment',
      read_call_result: null,
      operation_assertions: { ...raw, output_fields: Object.keys(raw.output) },
    };
  } else if (input.external_verifier) {
    evidenceRoute = 'real_state_correlation_with_trusted_revision_evidence_premise';
    raw = read('authority').correlateStates(
      input.core,
      input.writer,
      input.trusted_revision_bound_evidence ? 'verified' : 'not_evaluated',
    );
    observation = {
      api_result_kind: 'AuthorityAssessment',
      read_call_result: null,
      operation_assertions: raw,
    };
  } else if (input.members) {
    evidenceRoute = 'real_core_package_set_decision_with_independent_admission_grant_premises';
    const admitted = input.members
        .filter((m) => input.admitted_members.includes(m.member_id))
        .map((m) => ({
          ...m,
          core: 'valid',
          judgment_ids: input.matching_judgments
            .filter((j) => j.member_id === m.member_id)
            .map((j) => j.judgment_id),
        })),
      grants = input.members.filter((m) =>
        input.externally_authorized_members.includes(m.member_id),
      );
    raw = core('package-set').decidePackageSet(
      input,
      admitted,
      grants,
      input.operation,
      input.cross_asset_reference,
    );
    observation = {
      api_result_kind: 'PackageSetDecision',
      read_call_result: null,
      operation_assertions: raw,
    };
  } else if (input.transport_event) observation = await transportOperation();
  else if (
    Object.hasOwn(input, 'complete_success_bytes') ||
    Object.hasOwn(input, 'complete_final_success_envelope_bytes')
  )
    observation = await budgetOperation();
  else if (Object.hasOwn(input, 'candidate')) {
    mock(req.resolve('@aikdna/kdna-core/node'), {
      admitNode: async () => {
        counters.core_calls++;
        return rejectedCoreFixture('READ_CORE_INVALID');
      },
    });
    mock(req.resolve('@aikdna/kdna-core/browser'), {
      admitBrowser: async () => {
        counters.core_calls++;
        return rejectedCoreFixture('READ_CORE_CAPABILITY_UNAVAILABLE');
      },
    });
    const host = emb.createTrustedHostReadProvider({
      observe: () => {
        counters.host_calls++;
        throw Error('Unexpected Host observation');
      },
    });
    raw = await req('@aikdna/kdna-read/' + (input.entry ?? 'node'))[
      input.entry === 'browser' ? 'readBrowser' : 'readNode'
    ](new Uint8Array(1), input.candidate, control(input.control_provider), host);
    if (record?.version_rejection)
      extra = { safe_brand_record: record, later_mode_not_stored: record.request === null };
    try {
      admissionModule.inspectCandidate(input.candidate);
    } catch (e) {
      if (e.unknownKey) extra.first_unknown_key_test_observation = e.unknownKey;
    }
    observation = readResultObservation(raw);
  } else observation = digestOperation();
  process.stdout.write(
    JSON.stringify({ id, evidence_route: evidenceRoute, observation, raw, counters, extra }) + '\n',
  );
}
main().catch((error) => {
  process.stderr.write(JSON.stringify({ id, error: error.message, stack: error.stack }) + '\n');
  process.exitCode = 1;
});
