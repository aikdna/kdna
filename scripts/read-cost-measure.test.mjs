import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOperations,
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
    evaluateSemantics([{ content: { catalog: [] } }], ['decision:priority'], requirements, true)
      .status,
    'deferred',
  );
  const incomplete = [{ content: { catalog: [] } }];
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

test('latency summary keeps every raw sample and reports a median', () => {
  assert.deepEqual(latencySummary([9, 1, 5]), {
    samples: [9, 1, 5],
    min: 1,
    median: 5,
    max: 9,
  });
});
