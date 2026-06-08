import { z } from 'zod';
export declare const ArtifactStatusSchema: z.ZodEnum<["draft", "approved", "rejected", "failed"]>;
export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;
export declare const ArtifactSchema: z.ZodObject<{
    artifactId: z.ZodString;
    runId: z.ZodString;
    stageId: z.ZodString;
    type: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["draft", "approved", "rejected", "failed"]>>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    qualityScore: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    status: "draft" | "approved" | "rejected" | "failed";
    artifactId: string;
    runId: string;
    stageId: string;
    version: number;
    data: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    qualityScore?: number | undefined;
}, {
    type: string;
    artifactId: string;
    runId: string;
    stageId: string;
    data: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    status?: "draft" | "approved" | "rejected" | "failed" | undefined;
    version?: number | undefined;
    qualityScore?: number | undefined;
}>;
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
    }, "strip", z.ZodTypeAny, {
        version: string;
        engine: string;
        run_id?: string | undefined;
    }, {
        version: string;
        engine: string;
        run_id?: string | undefined;
    }>;
    source_kdna: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
        judgment_version: z.ZodOptional<z.ZodString>;
        digest: z.ZodOptional<z.ZodString>;
        role: z.ZodEnum<["primary", "advisor", "constraint", "risk_guard", "evaluator", "style_and_trust"]>;
    }, "strip", z.ZodTypeAny, {
        version: string;
        name: string;
        role: "primary" | "advisor" | "constraint" | "risk_guard" | "evaluator" | "style_and_trust";
        judgment_version?: string | undefined;
        digest?: string | undefined;
    }, {
        version: string;
        name: string;
        role: "primary" | "advisor" | "constraint" | "risk_guard" | "evaluator" | "style_and_trust";
        judgment_version?: string | undefined;
        digest?: string | undefined;
    }>, "many">;
    source_artifacts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        artifact_id: z.ZodString;
        artifact_type: z.ZodString;
        content_digest: z.ZodOptional<z.ZodString>;
        relationship: z.ZodOptional<z.ZodEnum<["input", "template", "reference", "evaluation_target"]>>;
    }, "strip", z.ZodTypeAny, {
        artifact_id: string;
        artifact_type: string;
        content_digest?: string | undefined;
        relationship?: "input" | "template" | "reference" | "evaluation_target" | undefined;
    }, {
        artifact_id: string;
        artifact_type: string;
        content_digest?: string | undefined;
        relationship?: "input" | "template" | "reference" | "evaluation_target" | undefined;
    }>, "many">>;
    stage: z.ZodOptional<z.ZodObject<{
        stage_id: z.ZodString;
        stage_name: z.ZodOptional<z.ZodString>;
        stage_order: z.ZodNumber;
        stage_attempt: z.ZodOptional<z.ZodNumber>;
        stage_status: z.ZodOptional<z.ZodEnum<["running", "completed", "failed", "skipped"]>>;
    }, "strip", z.ZodTypeAny, {
        stage_id: string;
        stage_order: number;
        stage_name?: string | undefined;
        stage_attempt?: number | undefined;
        stage_status?: "failed" | "running" | "completed" | "skipped" | undefined;
    }, {
        stage_id: string;
        stage_order: number;
        stage_name?: string | undefined;
        stage_attempt?: number | undefined;
        stage_status?: "failed" | "running" | "completed" | "skipped" | undefined;
    }>>;
    content: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    content_digest: z.ZodString;
    quality: z.ZodOptional<z.ZodObject<{
        gate_results: z.ZodOptional<z.ZodArray<z.ZodObject<{
            gate_id: z.ZodString;
            gate_type: z.ZodOptional<z.ZodString>;
            result: z.ZodEnum<["pass", "fail", "warn", "skipped"]>;
            score: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            gate_id: string;
            result: "skipped" | "pass" | "fail" | "warn";
            gate_type?: string | undefined;
            score?: number | undefined;
            evidence?: string | undefined;
        }, {
            gate_id: string;
            result: "skipped" | "pass" | "fail" | "warn";
            gate_type?: string | undefined;
            score?: number | undefined;
            evidence?: string | undefined;
        }>, "many">>;
        overall_result: z.ZodOptional<z.ZodEnum<["pass", "fail", "conditional_pass"]>>;
        fidelity: z.ZodOptional<z.ZodObject<{
            score: z.ZodNumber;
            protocol_version: z.ZodString;
            report_artifact_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            score: number;
            protocol_version: string;
            report_artifact_id?: string | undefined;
        }, {
            score: number;
            protocol_version: string;
            report_artifact_id?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        gate_results?: {
            gate_id: string;
            result: "skipped" | "pass" | "fail" | "warn";
            gate_type?: string | undefined;
            score?: number | undefined;
            evidence?: string | undefined;
        }[] | undefined;
        overall_result?: "pass" | "fail" | "conditional_pass" | undefined;
        fidelity?: {
            score: number;
            protocol_version: string;
            report_artifact_id?: string | undefined;
        } | undefined;
    }, {
        gate_results?: {
            gate_id: string;
            result: "skipped" | "pass" | "fail" | "warn";
            gate_type?: string | undefined;
            score?: number | undefined;
            evidence?: string | undefined;
        }[] | undefined;
        overall_result?: "pass" | "fail" | "conditional_pass" | undefined;
        fidelity?: {
            score: number;
            protocol_version: string;
            report_artifact_id?: string | undefined;
        } | undefined;
    }>>;
    trace_refs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        trace_id: z.ZodString;
        trace_type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        trace_id: string;
        trace_type?: string | undefined;
    }, {
        trace_id: string;
        trace_type?: string | undefined;
    }>, "many">>;
    review: z.ZodOptional<z.ZodObject<{
        status: z.ZodEnum<["pending", "approved", "rejected", "changes_requested"]>;
        reviewed_by: z.ZodOptional<z.ZodString>;
        reviewed_at: z.ZodOptional<z.ZodString>;
        review_notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "approved" | "rejected" | "pending" | "changes_requested";
        reviewed_by?: string | undefined;
        reviewed_at?: string | undefined;
        review_notes?: string | undefined;
    }, {
        status: "approved" | "rejected" | "pending" | "changes_requested";
        reviewed_by?: string | undefined;
        reviewed_at?: string | undefined;
        review_notes?: string | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        environment: z.ZodOptional<z.ZodEnum<["dev", "staging", "production"]>>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        environment?: "dev" | "staging" | "production" | undefined;
    }, {
        tags?: string[] | undefined;
        environment?: "dev" | "staging" | "production" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    artifact_id: string;
    artifact_type: string;
    schema_version: string;
    created_at: string;
    generator: {
        version: string;
        engine: string;
        run_id?: string | undefined;
    };
    source_kdna: {
        version: string;
        name: string;
        role: "primary" | "advisor" | "constraint" | "risk_guard" | "evaluator" | "style_and_trust";
        judgment_version?: string | undefined;
        digest?: string | undefined;
    }[];
    content_digest: string;
    content: Record<string, unknown>;
    source_artifacts?: {
        artifact_id: string;
        artifact_type: string;
        content_digest?: string | undefined;
        relationship?: "input" | "template" | "reference" | "evaluation_target" | undefined;
    }[] | undefined;
    stage?: {
        stage_id: string;
        stage_order: number;
        stage_name?: string | undefined;
        stage_attempt?: number | undefined;
        stage_status?: "failed" | "running" | "completed" | "skipped" | undefined;
    } | undefined;
    quality?: {
        gate_results?: {
            gate_id: string;
            result: "skipped" | "pass" | "fail" | "warn";
            gate_type?: string | undefined;
            score?: number | undefined;
            evidence?: string | undefined;
        }[] | undefined;
        overall_result?: "pass" | "fail" | "conditional_pass" | undefined;
        fidelity?: {
            score: number;
            protocol_version: string;
            report_artifact_id?: string | undefined;
        } | undefined;
    } | undefined;
    trace_refs?: {
        trace_id: string;
        trace_type?: string | undefined;
    }[] | undefined;
    review?: {
        status: "approved" | "rejected" | "pending" | "changes_requested";
        reviewed_by?: string | undefined;
        reviewed_at?: string | undefined;
        review_notes?: string | undefined;
    } | undefined;
    metadata?: {
        tags?: string[] | undefined;
        environment?: "dev" | "staging" | "production" | undefined;
    } | undefined;
}, {
    artifact_id: string;
    artifact_type: string;
    schema_version: string;
    created_at: string;
    generator: {
        version: string;
        engine: string;
        run_id?: string | undefined;
    };
    source_kdna: {
        version: string;
        name: string;
        role: "primary" | "advisor" | "constraint" | "risk_guard" | "evaluator" | "style_and_trust";
        judgment_version?: string | undefined;
        digest?: string | undefined;
    }[];
    content_digest: string;
    content: Record<string, unknown>;
    source_artifacts?: {
        artifact_id: string;
        artifact_type: string;
        content_digest?: string | undefined;
        relationship?: "input" | "template" | "reference" | "evaluation_target" | undefined;
    }[] | undefined;
    stage?: {
        stage_id: string;
        stage_order: number;
        stage_name?: string | undefined;
        stage_attempt?: number | undefined;
        stage_status?: "failed" | "running" | "completed" | "skipped" | undefined;
    } | undefined;
    quality?: {
        gate_results?: {
            gate_id: string;
            result: "skipped" | "pass" | "fail" | "warn";
            gate_type?: string | undefined;
            score?: number | undefined;
            evidence?: string | undefined;
        }[] | undefined;
        overall_result?: "pass" | "fail" | "conditional_pass" | undefined;
        fidelity?: {
            score: number;
            protocol_version: string;
            report_artifact_id?: string | undefined;
        } | undefined;
    } | undefined;
    trace_refs?: {
        trace_id: string;
        trace_type?: string | undefined;
    }[] | undefined;
    review?: {
        status: "approved" | "rejected" | "pending" | "changes_requested";
        reviewed_by?: string | undefined;
        reviewed_at?: string | undefined;
        review_notes?: string | undefined;
    } | undefined;
    metadata?: {
        tags?: string[] | undefined;
        environment?: "dev" | "staging" | "production" | undefined;
    } | undefined;
}>;
export type ArtifactEnvelope = z.infer<typeof ArtifactEnvelopeSchema>;
//# sourceMappingURL=artifact.d.ts.map