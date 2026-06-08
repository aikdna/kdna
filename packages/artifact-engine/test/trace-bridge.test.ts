import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStageTrace, linkArtifactToTrace, linkQualityReport, linkHumanReview, traceChain } from '../src/trace-bridge.js';
import type { EvidenceTrace } from '../src/trace-bridge.js';

const mockRun = {
  runId: 'run_001',
  engineId: 'course-engine',
  domainPath: '/test',
  status: 'running' as const,
  currentStageId: 'stage_001',
  createdAt: '2026-06-08T10:00:00Z',
  updatedAt: '2026-06-08T10:00:00Z',
};

const mockStage = {
  stageId: 'stage_001',
  runId: 'run_001',
  engineId: 'course-engine',
  name: 'Build Pilot',
  description: 'Build pilot lesson package',
  status: 'running' as const,
  inputArtifactIds: [],
  outputArtifactIds: [],
  requiresHumanReview: false,
};

const mockArtifacts = [
  {
    artifactId: 'art_001',
    runId: 'run_001',
    stageId: 'stage_001',
    type: 'pilot_lesson_package',
    version: 1,
    status: 'draft' as const,
    data: { title: 'Test' },
    createdAt: '2026-06-08T10:30:00Z',
    updatedAt: '2026-06-08T10:30:00Z',
  },
];

test('createStageTrace produces a valid evidence trace', () => {
  const trace = createStageTrace(mockRun, mockStage, mockArtifacts, {
    agentName: 'course-engine',
    agentVersion: '0.3.0',
    model: 'claude-sonnet-4-5',
  });

  assert.equal(trace.trace_version, '1.0.0');
  assert.ok(trace.trace_id.startsWith('trace_'));
  assert.equal(trace.trace_type, 'generation');
  assert.equal(trace.session_id, 'run_001');
  assert.equal(trace.agent_info.agent_name, 'course-engine');
  assert.equal(trace.agent_info.model, 'claude-sonnet-4-5');
  assert.equal(trace.metadata?.pipeline_run_id, 'run_001');
  assert.equal(trace.metadata?.stage_id, 'stage_001');
  assert.equal(trace.artifact_refs?.length, 1);
  assert.equal(trace.artifact_refs?.[0].artifact_id, 'art_001');
  assert.equal(trace.artifact_refs?.[0].relationship, 'produced');
});

test('createStageTrace includes parent trace', () => {
  const trace = createStageTrace(mockRun, mockStage, mockArtifacts, {
    agentName: 'course-engine',
    parentTraceId: 'parent_001',
  });

  assert.equal(trace.parent_trace_id, 'parent_001');
});

test('linkArtifactToTrace adds artifact ref', () => {
  const trace: EvidenceTrace = {
    trace_version: '1.0.0',
    trace_id: 'trace_001',
    timestamp: '2026-06-08T10:00:00Z',
    trace_type: 'generation',
    agent_info: { agent_name: 'test' },
    loaded_kdna: [],
  };

  const envelope = {
    artifact_id: 'env_001',
    artifact_type: 'course_package',
    schema_version: '1.0.0',
    created_at: '2026-06-08T10:00:00Z',
    generator: { engine: 'test', version: '0.1.0' },
    source_kdna: [{ name: '@aikdna/writing', version: '0.7.0', role: 'primary' as const }],
    content: {},
    content_digest: 'sha256:abc123',
  };

  const updated = linkArtifactToTrace(trace, envelope);
  assert.equal(updated.artifact_refs?.length, 1);
  assert.equal(updated.artifact_refs?.[0].artifact_id, 'env_001');
  assert.equal(updated.artifact_refs?.[0].content_digest, 'sha256:abc123');
  assert.equal(updated.output_hash, 'sha256:abc123');
});

test('linkQualityReport adds quality report ref', () => {
  const trace: EvidenceTrace = {
    trace_version: '1.0.0',
    trace_id: 'trace_001',
    timestamp: '2026-06-08T10:00:00Z',
    trace_type: 'generation',
    agent_info: { agent_name: 'test' },
    loaded_kdna: [],
  };

  const updated = linkQualityReport(trace, 'fidelity_001', 'fidelity', 'pass', 0.85);
  assert.equal(updated.quality_report_refs?.length, 1);
  assert.equal(updated.quality_report_refs?.[0].report_id, 'fidelity_001');
  assert.equal(updated.quality_report_refs?.[0].score, 0.85);
});

test('linkHumanReview adds review ref', () => {
  const trace: EvidenceTrace = {
    trace_version: '1.0.0',
    trace_id: 'trace_001',
    timestamp: '2026-06-08T10:00:00Z',
    trace_type: 'generation',
    agent_info: { agent_name: 'test' },
    loaded_kdna: [],
  };

  const review = {
    reviewId: 'rev_001',
    runId: 'run_001',
    stageId: 'stage_001',
    artifactId: 'art_001',
    reviewerId: 'expert_001',
    decision: 'approved' as const,
    comments: ['Looks good'],
    createdAt: '2026-06-08T11:00:00Z',
  };

  const updated = linkHumanReview(trace, review);
  assert.equal(updated.human_review_ref?.review_id, 'rev_001');
  assert.equal(updated.human_review_ref?.decision, 'approved');
});

test('traceChain links traces in order', () => {
  const traces: EvidenceTrace[] = [
    { trace_version: '1.0.0', trace_id: 'a', timestamp: '', trace_type: 'route', agent_info: { agent_name: 'test' }, loaded_kdna: [] },
    { trace_version: '1.0.0', trace_id: 'b', timestamp: '', trace_type: 'generation', agent_info: { agent_name: 'test' }, loaded_kdna: [] },
    { trace_version: '1.0.0', trace_id: 'c', timestamp: '', trace_type: 'postvalidate', agent_info: { agent_name: 'test' }, loaded_kdna: [] },
  ];

  const chained = traceChain(traces);
  assert.equal(chained[0].parent_trace_id, undefined);
  assert.equal(chained[1].parent_trace_id, 'a');
  assert.equal(chained[2].parent_trace_id, 'b');
});
