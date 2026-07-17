import assert from 'node:assert/strict';
import test from 'node:test';

import {
  auditRepository,
  findMissingGuardrails,
  findNarrativeViolations,
} from './check-public-narrative-boundaries.mjs';

test('rejects carrier false dichotomies', () => {
  const samples = [
    'Skill is execution. KDNA is judgment.',
    'Skills execute. KDNA judges.',
    'Prompts are not testable.',
    'RAG provides facts. KDNA provides the rules for evaluating those facts.',
    '工具选择、代码执行、文件 I/O——这些是机械操作。',
  ];
  for (const sample of samples) {
    assert.ok(findNarrativeViolations('docs/example.md', sample).length > 0, sample);
  }
});

test('allows overlapping-carrier boundaries', () => {
  const content = `
Prompts and Skills can carry judgment and can be versioned and tested.
KDNA adds a portable asset identity and loading contract when that is needed.
RAG can retrieve facts, Policies, examples, and judgment.
`;
  assert.deepEqual(findNarrativeViolations('docs/example.md', content), []);
});

test('does not treat historical snapshot inventory as active narrative', () => {
  assert.deepEqual(
    findNarrativeViolations(
      'docs/archive/pre-cutover-snapshots.md',
      'Skills execute. KDNA judges.',
    ),
    [],
  );
});

test('fails when a required guardrail disappears', () => {
  const missing = findMissingGuardrails(() => 'not the required language');
  assert.ok(missing.length > 0);
});

test('current repository passes the narrative boundary audit', () => {
  assert.deepEqual(auditRepository(), { violations: [], missingGuardrails: [] });
});
