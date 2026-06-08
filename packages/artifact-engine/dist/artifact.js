import { z } from 'zod';
export const ArtifactStatusSchema = z.enum(['draft', 'approved', 'rejected', 'failed']);
export const ArtifactSchema = z.object({
    artifactId: z.string(),
    runId: z.string(),
    stageId: z.string(),
    type: z.string(),
    version: z.number().default(1),
    status: ArtifactStatusSchema.default('draft'),
    data: z.record(z.unknown()),
    qualityScore: z.number().min(0).max(1).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const ArtifactEnvelopeSchema = z.object({
    artifact_id: z.string(),
    artifact_type: z.string(),
    schema_version: z.string(),
    created_at: z.string(),
    generator: z.object({
        engine: z.string(),
        version: z.string(),
        run_id: z.string().optional(),
    }),
    source_kdna: z.array(z.object({
        name: z.string(),
        version: z.string(),
        judgment_version: z.string().optional(),
        digest: z.string().optional(),
        role: z.enum(['primary', 'advisor', 'constraint', 'risk_guard', 'evaluator', 'style_and_trust']),
    })).min(1),
    source_artifacts: z.array(z.object({
        artifact_id: z.string(),
        artifact_type: z.string(),
        content_digest: z.string().optional(),
        relationship: z.enum(['input', 'template', 'reference', 'evaluation_target']).optional(),
    })).optional(),
    stage: z.object({
        stage_id: z.string(),
        stage_name: z.string().optional(),
        stage_order: z.number().int().min(1),
        stage_attempt: z.number().int().min(1).optional(),
        stage_status: z.enum(['running', 'completed', 'failed', 'skipped']).optional(),
    }).optional(),
    content: z.record(z.unknown()),
    content_digest: z.string(),
    quality: z.object({
        gate_results: z.array(z.object({
            gate_id: z.string(),
            gate_type: z.string().optional(),
            result: z.enum(['pass', 'fail', 'warn', 'skipped']),
            score: z.number().optional(),
            evidence: z.string().optional(),
        })).optional(),
        overall_result: z.enum(['pass', 'fail', 'conditional_pass']).optional(),
        fidelity: z.object({
            score: z.number().min(0).max(1),
            protocol_version: z.string(),
            report_artifact_id: z.string().optional(),
        }).optional(),
    }).optional(),
    trace_refs: z.array(z.object({
        trace_id: z.string(),
        trace_type: z.string().optional(),
    })).optional(),
    review: z.object({
        status: z.enum(['pending', 'approved', 'rejected', 'changes_requested']),
        reviewed_by: z.string().optional(),
        reviewed_at: z.string().optional(),
        review_notes: z.string().optional(),
    }).optional(),
    metadata: z.object({
        tags: z.array(z.string()).optional(),
        environment: z.enum(['dev', 'staging', 'production']).optional(),
    }).optional(),
});
//# sourceMappingURL=artifact.js.map