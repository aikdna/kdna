import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ArtifactSchema, ArtifactStatusSchema, ArtifactEnvelopeSchema, wrapAsEnvelope, AutoApproveGate } from '../src/index.js';

test('ArtifactStatusSchema validates correctly', () => {
  assert.equal(ArtifactStatusSchema.parse('draft'), 'draft');
  assert.throws(() => ArtifactStatusSchema.parse('invalid'));
});

test('ArtifactSchema validates a minimal artifact', () => {
  const artifact = ArtifactSchema.parse({
    artifactId: 'art_001',
    runId: 'run_001',
    stageId: 'stage_001',
    type: 'pilot_lesson',
    data: { title: 'Test' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  assert.equal(artifact.artifactId, 'art_001');
  assert.equal(artifact.status, 'draft');
  assert.equal(artifact.version, 1);
});

test('ArtifactEnvelopeSchema validates against RFC-0009 spec', () => {
  const envelope = ArtifactEnvelopeSchema.parse({
    artifact_id: 'd4e5f6a7',
    artifact_type: 'pilot_lesson_package',
    schema_version: '1.0.0',
    created_at: '2026-06-08T10:30:00Z',
    generator: { engine: 'course-engine', version: '0.3.0' },
    source_kdna: [{ name: '@aikdna/writing', version: '0.7.2', role: 'primary' }],
    content: { title: 'Test Lesson' },
    content_digest: 'sha256:abc123',
  });
  assert.equal(envelope.artifact_type, 'pilot_lesson_package');
});

test('wrapAsEnvelope creates a valid envelope', () => {
  const artifact = {
    artifactId: 'art_001',
    runId: 'run_001',
    stageId: 'stage_001',
    type: 'course_outline',
    data: { modules: [] },
    createdAt: '2026-06-08T10:30:00Z',
    updatedAt: '2026-06-08T10:30:00Z',
    version: 1,
    status: 'draft' as const,
  };
  const envelope = wrapAsEnvelope(artifact, { engine: 'course-engine', version: '0.3.0' });
  assert.equal(envelope.artifact_id, 'art_001');
  assert.equal(envelope.artifact_type, 'course_outline');
});

test('AutoApproveGate always approves', async () => {
  const gate = new AutoApproveGate();
  const result = await gate.requestReview('stage_001', ['art_001']);
  assert.equal(result.decision, 'approved');
});
