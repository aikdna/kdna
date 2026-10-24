import { z } from 'zod';
export declare const ArtifactStatusSchema: z.ZodEnum<{
    draft: "draft";
    approved: "approved";
    rejected: "rejected";
    failed: "failed";
}>;
export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;
export declare const ArtifactSchema: z.ZodObject<{
    artifactId: z.ZodString;
    runId: z.ZodString;
    stageId: z.ZodString;
    type: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        approved: "approved";
        rejected: "rejected";
        failed: "failed";
    }>>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    qualityScore: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export declare const ArtifactEnvelopeSchema: z.ZodObject<{
    artifact_id: z.ZodString;
    artifact_type: z.ZodString;
    schema_version: z.ZodString;
    created_at: z.ZodString;
    generator: z.ZodObject<{
        engine: z.ZodString;
        version: z.ZodString;
        run_id: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    source_kdna: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
        judgment_version: z.ZodOptional<z.ZodString>;
        digest: z.ZodOptional<z.ZodString>;
        role: z.ZodEnum<{
            primary: "primary";
            advisor: "advisor";
            constraint: "constraint";
            risk_guard: "risk_guard";
            evaluator: "evaluator";
            style_and_trust: "style_and_trust";
        }>;
    }, z.core.$strip>>;
    source_artifacts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        artifact_id: z.ZodString;
        artifact_type: z.ZodString;
        content_digest: z.ZodOptional<z.ZodString>;
        relationship: z.ZodOptional<z.ZodEnum<{
            input: "input";
            template: "template";
            reference: "reference";
            evaluation_target: "evaluation_target";
        }>>;
    }, z.core.$strip>>>;
    stage: z.ZodOptional<z.ZodObject<{
        stage_id: z.ZodString;
        stage_name: z.ZodOptional<z.ZodString>;
        stage_order: z.ZodNumber;
        stage_attempt: z.ZodOptional<z.ZodNumber>;
        stage_status: z.ZodOptional<z.ZodEnum<{
            failed: "failed";
            running: "running";
            completed: "completed";
            skipped: "skipped";
        }>>;
    }, z.core.$strip>>;
    content: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    content_digest: z.ZodString;
    quality: z.ZodOptional<z.ZodObject<{
        gate_results: z.ZodOptional<z.ZodArray<z.ZodObject<{
            gate_id: z.ZodString;
            gate_type: z.ZodOptional<z.ZodString>;
            result: z.ZodEnum<{
                skipped: "skipped";
                pass: "pass";
                fail: "fail";
                warn: "warn";
            }>;
            score: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        overall_result: z.ZodOptional<z.ZodEnum<{
            pass: "pass";
            fail: "fail";
            conditional_pass: "conditional_pass";
        }>>;
        fidelity: z.ZodOptional<z.ZodObject<{
            score: z.ZodNumber;
            protocol_version: z.ZodString;
            report_artifact_id: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    trace_refs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        trace_id: z.ZodString;
        trace_type: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    review: z.ZodOptional<z.ZodObject<{
        status: z.ZodEnum<{
            approved: "approved";
            rejected: "rejected";
            pending: "pending";
            changes_requested: "changes_requested";
        }>;
        reviewed_by: z.ZodOptional<z.ZodString>;
        reviewed_at: z.ZodOptional<z.ZodString>;
        review_notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    metadata: z.ZodOptional<z.ZodObject<{
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        environment: z.ZodOptional<z.ZodEnum<{
            dev: "dev";
            staging: "staging";
            production: "production";
        }>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ArtifactEnvelope = z.infer<typeof ArtifactEnvelopeSchema>;
//# sourceMappingURL=artifact.d.ts.map