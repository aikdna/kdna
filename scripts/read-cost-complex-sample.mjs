#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fixtures from '../conformance/public-contract/test/bytes-fixtures.cjs';

export const COMPLEX_ASSET_ID = 'asset:read-cost-semantic-decisions';
export const COMPLEX_ASSET_VERSION = '1.0.0';
export const COMPLEX_JUDGMENT_IDS = Object.freeze([
  'decision:priority',
  'decision:evidence',
  'decision:reversibility',
  'decision:conflict',
  'decision:handoff',
]);

const FOCI = [
  'Decision priority',
  'Evidence standard',
  'Reversibility preference',
  'Speed and safety conflict',
  'Decision handoff',
];

const STATEMENTS = [
  'Rank user-harm evidence first, then reversibility, then schedule cost. This ordering applies only when the decision changes a live product or operations path.',
  'Require reproducible evidence. When evidence is unavailable, mark the claim provisional and name the missing observation. Do not treat a catalog or a saved file as evidence.',
  'Prefer the smallest reversible step, except when a security exposure is already active; then contain first and review after.',
  'When speed conflicts with safety, safety wins. Record the conflict, the losing option, and the unresolved tradeoff rather than hiding it in prose.',
  'A handoff includes the chosen judgment, evidence status, owner, review trigger, and dependencies. It remains incomplete if any required dependency is missing.',
];

function judgmentScope(id) {
  return { kind: 'judgments', judgment_refs: [id] };
}

export function buildComplexSample(tuple) {
  const asset = fixtures.blank(tuple, COMPLEX_JUDGMENT_IDS.length);
  const { manifest, payload } = asset;

  manifest.asset_id = COMPLEX_ASSET_ID;
  manifest.asset_uid = 'uid:read-cost-semantic-decisions';
  manifest.asset_type = 'fixture';
  manifest.title = 'Five semantic decisions for Read-cost measurement';
  manifest.summary =
    'Synthetic benchmark asset covering value ordering, conditions, exceptions, conflict and a mandatory dependency. It makes no claim about a real team or recommendation quality.';
  manifest.history.statement =
    'Initial synthetic benchmark fixture for Read-cost measurement only.';

  payload.asset.asset_id = COMPLEX_ASSET_ID;
  payload.asset.asset_version = COMPLEX_ASSET_VERSION;
  payload.asset.judgment_version = COMPLEX_ASSET_VERSION;
  payload.actors = [
    {
      id: 'actor:benchmark-author',
      kind: 'person',
      name: 'Synthetic benchmark author',
    },
  ];
  payload.scope = {
    statement:
      'Synthetic decisions about a product change review. The fixture tests disclosure completeness, not whether the decisions are correct.',
  };
  payload.declarations.highest_question.value =
    'Which decision should be handed off when product speed, safety and evidence disagree?';
  payload.declarations.boundaries = {
    state: 'provided',
    value: [
      {
        id: 'boundary:live-path',
        effect: 'limit',
        statement:
          'Applies only to live product or operations decisions; archival cleanup is outside scope.',
        declared_by: 'actor:benchmark-author',
        applies_to: {
          kind: 'judgments',
          judgment_refs: [...COMPLEX_JUDGMENT_IDS],
        },
        exception_refs: [],
      },
    ],
  };
  payload.shared_declarations = [
    {
      id: 'shared:decision-value-order',
      subject: {
        actor_ids: ['actor:benchmark-author'],
        statement: 'Synthetic product decision review',
      },
      applies_to: { kind: 'asset' },
      kind: 'value_order',
      value: ['user-harm evidence', 'reversibility', 'schedule cost'],
    },
  ];
  payload.conditions = [
    {
      id: 'condition:evidence-unavailable',
      owner_ref: {
        kind: 'exception',
        id: 'exception:evidence-unavailable',
      },
      expression: {
        kind: 'interpreted',
        statement: 'A required observation is absent or cannot be reproduced.',
      },
    },
    {
      id: 'condition:active-exposure',
      owner_ref: {
        kind: 'exception',
        id: 'exception:active-exposure',
      },
      expression: {
        kind: 'interpreted',
        statement: 'A security exposure is already active and containment can begin.',
      },
    },
  ];
  payload.relationships = [
    {
      id: 'relationship:evidence-supports-priority',
      kind: { term: 'support' },
      direction: 'directed',
      operator: { term: 'supports' },
      effect: { term: 'offers_support' },
      statement:
        'The evidence standard supports the priority ordering. It does not replace the ordering judgment.',
      participants: [
        {
          role: { term: 'supporter' },
          judgment_ref: COMPLEX_JUDGMENT_IDS[1],
        },
        {
          role: { term: 'claim' },
          judgment_ref: COMPLEX_JUDGMENT_IDS[0],
        },
      ],
    },
    {
      id: 'relationship:speed-conflicts-safety',
      kind: { term: 'conflict' },
      direction: 'undirected',
      operator: { term: 'conflicts_with' },
      effect: { term: 'preserves_disagreement' },
      statement:
        'A release-speed preference conflicts with the safety rule when both cannot be satisfied.',
      participants: [
        {
          role: { term: 'side_a' },
          judgment_ref: COMPLEX_JUDGMENT_IDS[3],
        },
        {
          role: { term: 'side_b' },
          judgment_ref: COMPLEX_JUDGMENT_IDS[2],
        },
      ],
    },
  ];
  payload.reading_order = [...COMPLEX_JUDGMENT_IDS];

  for (let index = 0; index < COMPLEX_JUDGMENT_IDS.length; index += 1) {
    const judgment = payload.judgments[index];
    const id = COMPLEX_JUDGMENT_IDS[index];
    const contractId = `result-contract:${id}`;

    judgment.id = id;
    judgment.focus = FOCI[index];
    judgment.subject = {
      actor_ids: ['actor:benchmark-author'],
      statement: 'Synthetic product decision review',
    };
    judgment.scope = {
      statement: 'Synthetic product decision review; archival cleanup is outside scope.',
    };
    judgment.core_expression.statement = STATEMENTS[index];
    judgment.method.components[0].id = `component:${id}`;
    judgment.result_contract.id = contractId;
    judgment.result.contract_ref = contractId;
    judgment.result.value.value = STATEMENTS[index];
  }

  const evidence = payload.judgments[1];
  evidence.boundaries = {
    state: 'provided',
    value: [
      {
        id: 'boundary:evidence',
        effect: 'limit',
        statement: 'A catalog or saved file is not evidence of task completion.',
        declared_by: 'actor:benchmark-author',
        applies_to: judgmentScope(COMPLEX_JUDGMENT_IDS[1]),
        exception_refs: ['exception:evidence-unavailable'],
      },
    ],
  };
  evidence.exceptions = {
    state: 'provided',
    value: [
      {
        id: 'exception:evidence-unavailable',
        statement:
          'If evidence cannot be reproduced, mark the judgment provisional instead of claiming completion.',
        boundary_ref: 'boundary:evidence',
        applies_to: judgmentScope(COMPLEX_JUDGMENT_IDS[1]),
        when: { kind: 'condition', id: 'condition:evidence-unavailable' },
        effect: { kind: 'waive' },
      },
    ],
  };

  const reversibility = payload.judgments[2];
  reversibility.boundaries = {
    state: 'provided',
    value: [
      {
        id: 'boundary:reversibility',
        effect: 'limit',
        statement: 'Prefer reversibility unless an active exposure requires immediate containment.',
        declared_by: 'actor:benchmark-author',
        applies_to: judgmentScope(COMPLEX_JUDGMENT_IDS[2]),
        exception_refs: ['exception:active-exposure'],
      },
    ],
  };
  reversibility.exceptions = {
    state: 'provided',
    value: [
      {
        id: 'exception:active-exposure',
        statement:
          'An active security exposure is the stated exception; containment precedes reversibility review.',
        boundary_ref: 'boundary:reversibility',
        applies_to: judgmentScope(COMPLEX_JUDGMENT_IDS[2]),
        when: { kind: 'condition', id: 'condition:active-exposure' },
        effect: { kind: 'waive' },
      },
    ],
  };

  const evidenceContract = evidence.result_contract.id;
  payload.dependencies = [
    {
      id: 'dependency:handoff-evidence',
      producer: {
        kind: 'judgment_result',
        judgment_ref: COMPLEX_JUDGMENT_IDS[1],
        result_contract_ref: evidenceContract,
      },
      producer_port: 'result',
      consumer_judgment_ref: COMPLEX_JUDGMENT_IDS[4],
      consumer_port: 'context',
      input_role: 'context',
      data_type: { term: 'text' },
      required: true,
      purpose: 'The handoff must carry the evidence standard and its exception.',
    },
  ];
  evidence.ports.push({
    name: 'result',
    meaning: 'The evidence standard supplied to the handoff.',
    direction: 'output',
    result_field: null,
    contract_ref: { kind: 'contract', id: evidenceContract },
  });
  payload.judgments[4].ports.push({
    name: 'context',
    meaning: 'The evidence standard supplied to the handoff.',
    direction: 'input',
    input_role: 'context',
    contract_ref: { kind: 'contract', id: evidenceContract },
  });
  payload.judgments[4].inputs.push({
    name: 'context',
    meaning: 'The evidence standard supplied to the handoff.',
    contract_ref: { kind: 'contract', id: evidenceContract },
  });

  delete manifest.format_version;
  delete manifest.payload;
  return { manifest, payload, members: [] };
}

export function writeComplexSample(bindingPath, outputPath) {
  const binding = JSON.parse(fs.readFileSync(bindingPath, 'utf8'));
  const authored = buildComplexSample(binding.tuple);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(authored, null, 2)}\n`);
  return authored;
}

function isEntryPoint() {
  if (!process.argv[1]) return false;
  return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isEntryPoint()) {
  const [bindingPath, outputPath] = process.argv.slice(2);
  if (!bindingPath || !outputPath) {
    console.error(
      'usage: node scripts/read-cost-complex-sample.mjs <binding.json> <authored.json>',
    );
    process.exitCode = 2;
  } else {
    writeComplexSample(bindingPath, outputPath);
  }
}
