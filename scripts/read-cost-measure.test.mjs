import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  buildOperations,
  combineRecords,
  compareOperations,
  evaluateSemantics,
  extractBudgets,
  latencySummary,
  projectionMetadata,
} from './read-cost-measure.mjs';
import {
  buildComplexSample,
  COMPLEX_ASSET_ID,
  COMPLEX_JUDGMENT_IDS,
} from './read-cost-complex-sample.mjs';

const TUPLE = {
  container: '0.6.0',
  payload_profile: 'kdna.payload.judgment',
  payload_version: '0.5.1',
  core: 'kdna.core/0.8.2',
  ir: 'kdna.canonical-ir/0.6.1',
  runtime: 'kdna.runtime-capsule/0.3.1',
  plan: 'kdna.consumption-plan/0.3.1',
  host: 'kdna.agent-host/0.3.1',
  trace: 'kdna.judgment-trace/0.3.1',
  read: 'kdna.read/0.7.0-candidate',
};
const MANIFEST = JSON.parse(fs.readFileSync(new URL('./read-cost-samples.json', import.meta.url)));
const COMPLEX_REQUIREMENTS = MANIFEST.samples.find(
  (sample) => sample.id === 'semantic-decisions-5',
);

function complexClosure() {
  const payload = buildComplexSample(TUPLE).payload;
  const assetOwner = {
    owner: { kind: 'asset', id: 'uid:read-cost-semantic-decisions' },
    owner_judgment_id: null,
  };
  const closure = [
    {
      role: 'actor',
      target: { kind: 'actor', id: 'actor:benchmark-author' },
      value: payload.actors[0],
      ...assetOwner,
    },
    {
      role: 'dependency',
      target: { kind: 'dependency', id: payload.dependencies[0].id },
      value: payload.dependencies[0],
      ...assetOwner,
    },
    ...payload.conditions.map((condition) => ({
      role: 'condition',
      target: { kind: 'condition', id: condition.id },
      value: condition,
      ...assetOwner,
    })),
    ...payload.shared_declarations.map((declaration) => ({
      role: 'shared_declaration',
      target: { kind: 'shared_declaration', id: declaration.id },
      value: declaration,
      ...assetOwner,
    })),
    ...payload.declarations.boundaries.value.map((boundary) => ({
      role: 'boundary',
      target: { kind: 'boundary', id: boundary.id },
      value: boundary,
      ...assetOwner,
    })),
  ];
  for (const judgment of payload.judgments) {
    closure.push({
      role: 'judgment',
      target: { kind: 'judgment', id: judgment.id },
      value: structuredClone(judgment),
      owner: { kind: 'asset', id: 'uid:read-cost-semantic-decisions' },
      owner_judgment_id: judgment.id,
    });
    for (const boundary of judgment.boundaries.value ?? []) {
      closure.push({
        role: 'boundary',
        target: { kind: 'boundary', id: boundary.id },
        value: boundary,
        owner: { kind: 'judgment', id: judgment.id },
        owner_judgment_id: judgment.id,
      });
    }
    for (const exception of judgment.exceptions.value ?? []) {
      closure.push({
        role: 'exception',
        target: { kind: 'exception', id: exception.id },
        value: exception,
        owner: { kind: 'judgment', id: judgment.id },
        owner_judgment_id: judgment.id,
      });
    }
  }
  return {
    content: {
      selected: {
        asset_id: COMPLEX_ASSET_ID,
        asset_version: '1.0.0',
        judgment_ids: [...COMPLEX_JUDGMENT_IDS],
      },
      catalog: [],
      closure,
      relationships: structuredClone(payload.relationships),
      missing: [],
    },
  };
}

function complexOutput() {
  return complexClosure();
}

function deferredHandoffOutput() {
  const output = structuredClone(complexOutput());
  output.content.selected.judgment_ids = ['decision:handoff'];
  output.content.closure = output.content.closure.filter(
    (entry) => entry.role !== 'judgment' || entry.target.id === 'decision:handoff',
  );
  const evidence = structuredClone(buildComplexSample(TUPLE).payload.judgments[1]);
  output.content.closure.push({
    role: 'judgment',
    target: { kind: 'judgment', id: 'decision:evidence' },
    value: {
      id: evidence.id,
      focus: evidence.focus,
      core_expression: evidence.core_expression,
      markers: {
        boundaries: 'provided',
        exceptions: 'provided',
      },
    },
    owner: { kind: 'asset', id: 'uid:read-cost-semantic-decisions' },
    owner_judgment_id: 'decision:evidence',
    state: 'reduced',
    body_delivery: 'deferred',
    handle_id: 'retained-handle:test-evidence',
  });
  return output;
}

function expandedEvidenceOutput() {
  const evidence = structuredClone(buildComplexSample(TUPLE).payload.judgments[1]);
  return {
    content: {
      selected: null,
      catalog: [],
      relationships: [],
      missing: [],
      closure: [
        {
          role: 'judgment',
          target: { kind: 'judgment', id: 'decision:evidence' },
          value: evidence,
          owner: { kind: 'asset', id: 'uid:read-cost-semantic-decisions' },
          owner_judgment_id: 'decision:evidence',
        },
      ],
    },
  };
}

test('complex sample carries five judgments and every required semantic shape', () => {
  const sample = buildComplexSample(TUPLE);
  assert.equal(sample.manifest.asset_id, COMPLEX_ASSET_ID);
  assert.equal(sample.payload.judgments.length, 5);
  assert.deepEqual(
    sample.payload.judgments.map((judgment) => judgment.id),
    [...COMPLEX_JUDGMENT_IDS],
  );
  assert.equal(sample.payload.shared_declarations[0].kind, 'value_order');
  assert.equal(sample.payload.conditions.length, 2);
  assert.equal(sample.payload.relationships[1].kind.term, 'conflict');
  assert.equal(sample.payload.dependencies[0].required, true);
  assert.equal(sample.payload.judgments[1].exceptions.state, 'provided');
  assert.equal(sample.payload.judgments[2].exceptions.state, 'provided');
  assert.equal(Object.hasOwn(sample.manifest, 'format_version'), false);
  assert.equal(Object.hasOwn(sample.manifest, 'payload'), false);
});

test('semantic evaluation distinguishes complete, deferred and incomplete output', () => {
  const requirements = [
    {
      judgment_id: 'decision:priority',
      required_terms: ['schedule cost'],
      mandatory_dependency_ids: [],
    },
  ];
  const complete = [
    {
      content: {
        selected: { judgment_ids: ['decision:priority'] },
        closure: [
          {
            role: 'judgment',
            target: { id: 'decision:priority' },
            value: { id: 'decision:priority', core_expression: { statement: 'schedule cost' } },
          },
        ],
      },
    },
  ];
  assert.equal(
    evaluateSemantics(complete, ['decision:priority'], requirements, false).status,
    'complete',
  );
  assert.equal(
    evaluateSemantics(
      [
        {
          content: {
            catalog: [{ judgment_id: 'decision:priority', focus: 'Decision priority' }],
          },
        },
      ],
      ['decision:priority'],
      requirements,
      true,
    ).status,
    'deferred',
  );
  const incomplete = [{ content: { catalog: [], closure: [] } }];
  assert.equal(
    evaluateSemantics(incomplete, ['decision:priority'], requirements, false).status,
    'incomplete',
  );
});

test('mandatory dependencies must be delivered for a complete answer', () => {
  const requirements = [
    {
      judgment_id: 'decision:handoff',
      required_terms: ['evidence status'],
      mandatory_dependency_ids: ['decision:evidence'],
    },
  ];
  const output = [
    {
      content: {
        selected: { judgment_ids: ['decision:handoff'] },
        closure: [
          {
            role: 'judgment',
            target: { id: 'decision:handoff' },
            value: { id: 'decision:handoff', core_expression: { statement: 'evidence status' } },
          },
        ],
      },
    },
  ];
  const result = evaluateSemantics(output, ['decision:handoff'], requirements, false);
  assert.equal(result.status, 'incomplete');
  assert.deepEqual(result.details[0].missing_dependencies, ['decision:evidence']);
});

test('the fixed five-judgment oracle passes only with its declared structures intact', () => {
  const complete = evaluateSemantics(
    [complexOutput()],
    COMPLEX_JUDGMENT_IDS,
    COMPLEX_REQUIREMENTS.semantic_requirements,
    false,
    COMPLEX_REQUIREMENTS.structured_requirements,
  );
  assert.equal(complete.status, 'complete');
  assert.equal(complete.structures.length, COMPLEX_REQUIREMENTS.structured_requirements.length);

  const missingStructures = complexOutput();
  missingStructures.content.closure = missingStructures.content.closure.filter(
    (entry) =>
      !['shared_declaration', 'condition', 'exception', 'boundary', 'dependency'].includes(
        entry.role,
      ),
  );
  missingStructures.content.relationships = [];
  const incomplete = evaluateSemantics(
    [missingStructures],
    COMPLEX_JUDGMENT_IDS,
    COMPLEX_REQUIREMENTS.semantic_requirements,
    false,
    COMPLEX_REQUIREMENTS.structured_requirements,
  );
  assert.equal(incomplete.status, 'incomplete');
  assert.ok(incomplete.missing_structures.length > 0);
});

test('value order, exception ownership and conflict participants are checked mechanically', () => {
  const reversed = complexOutput();
  reversed.content.closure.find(
    (entry) => entry.target.id === 'shared:decision-value-order',
  ).value.value = ['schedule cost', 'reversibility', 'user-harm evidence'];
  assert.equal(
    evaluateSemantics(
      [reversed],
      COMPLEX_JUDGMENT_IDS,
      COMPLEX_REQUIREMENTS.semantic_requirements,
      false,
      COMPLEX_REQUIREMENTS.structured_requirements,
    ).status,
    'incomplete',
  );

  const detachedCondition = complexOutput();
  detachedCondition.content.closure.find(
    (entry) => entry.target.id === 'condition:evidence-unavailable',
  ).value.owner_ref.id = 'exception:active-exposure';
  assert.equal(
    evaluateSemantics(
      [detachedCondition],
      COMPLEX_JUDGMENT_IDS,
      COMPLEX_REQUIREMENTS.semantic_requirements,
      false,
      COMPLEX_REQUIREMENTS.structured_requirements,
    ).status,
    'incomplete',
  );

  const brokenConflict = complexOutput();
  brokenConflict.content.relationships.find(
    (relationship) => relationship.id === 'relationship:speed-conflicts-safety',
  ).participants[1].judgment_ref = 'decision:handoff';
  assert.equal(
    evaluateSemantics(
      [brokenConflict],
      COMPLEX_JUDGMENT_IDS,
      COMPLEX_REQUIREMENTS.semantic_requirements,
      false,
      COMPLEX_REQUIREMENTS.structured_requirements,
    ).status,
    'incomplete',
  );
});

test('handoff dependency is deferred before expansion and complete afterwards', () => {
  const first = evaluateSemantics(
    [deferredHandoffOutput()],
    ['decision:handoff'],
    COMPLEX_REQUIREMENTS.semantic_requirements,
    true,
    COMPLEX_REQUIREMENTS.structured_requirements,
  );
  assert.equal(first.status, 'deferred');
  assert.deepEqual(first.details[0].deferred_dependencies, ['decision:evidence']);

  const expanded = evaluateSemantics(
    [deferredHandoffOutput(), expandedEvidenceOutput()],
    ['decision:handoff'],
    COMPLEX_REQUIREMENTS.semantic_requirements,
    false,
    COMPLEX_REQUIREMENTS.structured_requirements,
  );
  assert.equal(expanded.status, 'complete');
});

test('a reduced dependency passes only when the task does not require its full body', () => {
  const requirements = [
    {
      judgment_id: 'decision:handoff',
      required_terms: ['chosen judgment', 'evidence status'],
      mandatory_dependencies: [
        {
          id: 'dependency:handoff-evidence',
          judgment_id: 'decision:evidence',
          require_full_body: false,
          required_terms: ['Require reproducible evidence.'],
        },
      ],
    },
  ];
  const result = evaluateSemantics(
    [deferredHandoffOutput()],
    ['decision:handoff'],
    requirements,
    false,
    COMPLEX_REQUIREMENTS.structured_requirements,
  );
  assert.equal(result.status, 'complete');
});

test('a reduced marker alone does not fail when every required detail is present', () => {
  const reducedButSufficient = deferredHandoffOutput();
  const evidence = reducedButSufficient.content.closure.find(
    (entry) => entry.role === 'judgment' && entry.target.id === 'decision:evidence',
  );
  delete evidence.body_delivery;
  const result = evaluateSemantics(
    [reducedButSufficient],
    ['decision:handoff'],
    COMPLEX_REQUIREMENTS.semantic_requirements,
    false,
    COMPLEX_REQUIREMENTS.structured_requirements,
  );
  assert.equal(result.status, 'complete');
});

test('removing the mandatory dependency text or relation fails the handoff task', () => {
  const missingText = structuredClone(deferredHandoffOutput());
  const reduced = missingText.content.closure.find(
    (entry) => entry.role === 'judgment' && entry.target.id === 'decision:evidence',
  );
  reduced.value.core_expression.statement = 'Necessary evidence detail is deferred.';
  missingText.content.closure = missingText.content.closure.filter(
    (entry) =>
      entry.role !== 'boundary' && entry.role !== 'exception' && entry.role !== 'condition',
  );
  assert.equal(
    evaluateSemantics(
      [missingText],
      ['decision:handoff'],
      COMPLEX_REQUIREMENTS.semantic_requirements,
      false,
      COMPLEX_REQUIREMENTS.structured_requirements,
    ).status,
    'incomplete',
  );

  const brokenDependency = structuredClone(deferredHandoffOutput());
  brokenDependency.content.closure.find(
    (entry) => entry.role === 'dependency',
  ).value.consumer_port = 'unrelated';
  assert.equal(
    evaluateSemantics(
      [brokenDependency],
      ['decision:handoff'],
      COMPLEX_REQUIREMENTS.semantic_requirements,
      true,
      COMPLEX_REQUIREMENTS.structured_requirements,
    ).status,
    'incomplete',
  );
});

test('repeat aggregation retains every semantic result and exposes failed repeats', () => {
  const base = {
    response_count: 1,
    projection_scope: 'single_response',
    host_model_input: 'NOT_MEASURED',
    stdout_bytes: 10,
    projected_stdout_bytes: 9,
    stderr_bytes: 0,
    exit_code: 0,
    status: ['ready'],
    selected_judgment_ids: ['decision:priority'],
    delivered_judgment_ids: ['decision:priority'],
    budgets: [],
    budget_required_bytes: 0,
    budget_actual_bytes: 0,
    stdout_lines: ['{}'],
    breakdown: null,
    tokens: null,
    task_elapsed_ms: 10,
    first_response_ms: 10,
    subsequent_request_latencies_ms: [],
  };
  const records = [
    {
      ...base,
      semantic: { status: 'complete', details: [], structures: [] },
    },
    {
      ...base,
      task_elapsed_ms: 20,
      semantic: {
        status: 'incomplete',
        details: [{ judgment_id: 'decision:priority', state: 'incomplete' }],
        structures: [],
      },
    },
  ];
  const combined = combineRecords(records);
  assert.equal(combined.semantic.status, 'incomplete');
  assert.deepEqual(combined.semantic.failed_repeats, [1]);
  assert.deepEqual(
    combined.semantic_runs.map((run) => run.status),
    ['complete', 'incomplete'],
  );
});

test('required terms cannot be satisfied by a different judgment', () => {
  const requirements = [
    {
      judgment_id: 'decision:priority',
      required_terms: ['schedule cost'],
      mandatory_dependency_ids: [],
    },
  ];
  const output = [
    {
      content: {
        selected: { judgment_ids: ['decision:priority'] },
        closure: [
          {
            role: 'judgment',
            target: { id: 'decision:priority' },
            value: { id: 'decision:priority', core_expression: { statement: 'other text' } },
          },
          {
            role: 'judgment',
            target: { id: 'decision:evidence' },
            value: { id: 'decision:evidence', core_expression: { statement: 'schedule cost' } },
          },
        ],
      },
    },
  ];
  const result = evaluateSemantics(output, ['decision:priority'], requirements, false);
  assert.equal(result.status, 'incomplete');
  assert.deepEqual(result.details[0].missing_terms, ['schedule cost']);
});

test('fixed-width budget strings become numeric values', () => {
  const budgets = extractBudgets([
    {
      envelope: {
        budget: {
          limit_bytes: 1000000,
          required_bytes: '0000000000022552',
          actual_bytes: '0000000000022552',
        },
      },
    },
  ]);
  assert.deepEqual(budgets, [{ limit_bytes: 1000000, required_bytes: 22552, actual_bytes: 22552 }]);
});

test('multi-select comparison reports byte savings without claiming tokens', () => {
  const results = [
    {
      sample_id: 'sample',
      operation_id: 'exact-2-separate',
      views: { body: { stdout_bytes: 1001, projected_stdout_bytes: 1000 } },
    },
    {
      sample_id: 'sample',
      operation_id: 'exact-2-combined',
      views: { body: { stdout_bytes: 751, projected_stdout_bytes: 750 } },
    },
  ];
  assert.deepEqual(compareOperations(results, 'sample')[0], {
    comparison: 'separate-vs-combined',
    view: 'body',
    separate: 'exact-2-separate',
    combined: 'exact-2-combined',
    separate_bytes: 1000,
    combined_bytes: 750,
    saved_bytes: 250,
    saved_percent: 25,
  });
});

test('projection metadata marks multi-response totals and keeps Host input unmeasured', () => {
  assert.deepEqual(projectionMetadata(1), {
    response_count: 1,
    projection_scope: 'single_response',
    host_model_input: 'NOT_MEASURED',
  });
  assert.deepEqual(projectionMetadata(6), {
    response_count: 6,
    projection_scope: 'sum_of_responses',
    host_model_input: 'NOT_MEASURED',
  });
  assert.throws(() => projectionMetadata(0), /positive integer/);
});

test('operation plan covers two, five and all-judgment multi-select', () => {
  const operations = buildOperations({
    judgment_ids: ['a', 'b', 'c', 'd', 'e'],
  });
  const byId = new Map(operations.map((operation) => [operation.id, operation]));
  assert.deepEqual(byId.get('exact-2-combined').groups, [['a', 'b']]);
  assert.deepEqual(byId.get('exact-all-combined').groups, [['a', 'b', 'c', 'd', 'e']]);
  assert.equal(byId.get('exact-all-separate').groups.length, 5);
  assert.deepEqual(byId.get('whole-expand-all').views, ['full']);
});

test('operation plan includes a same-session handoff expansion task', () => {
  const operations = buildOperations({
    judgment_ids: ['a', 'b'],
    tasks: [
      {
        id: 'handoff-exact-then-expand',
        kind: 'handoff-exact-then-expand',
        selection_judgment_ids: ['b'],
        expected_judgment_ids: ['b'],
        expand_judgment_id: 'a',
      },
    ],
  });
  assert.deepEqual(
    operations.find((operation) => operation.id === 'handoff-exact-then-expand'),
    {
      id: 'handoff-exact-then-expand',
      kind: 'handoff-exact-then-expand',
      expected_ids: ['b'],
      selection: ['b'],
      expand_target_id: 'a',
      allow_deferred: false,
      initial_allow_deferred: true,
      views: ['body'],
      model_input_view: 'body',
    },
  );
});

test('latency summary keeps every raw sample and reports a median', () => {
  assert.deepEqual(latencySummary([9, 1, 5]), {
    samples: [9, 1, 5],
    min: 1,
    median: 5,
    max: 9,
  });
});
