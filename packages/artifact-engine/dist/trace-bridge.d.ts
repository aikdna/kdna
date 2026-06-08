import type { Run, Stage, Artifact, Review } from './types.js';
import type { ArtifactEnvelope } from './artifact.js';
export interface EvidenceTrace {
    trace_version: '1.0.0';
    trace_id: string;
    timestamp: string;
    session_id?: string;
    trace_type: 'route' | 'load' | 'generation' | 'postvalidate' | 'fidelity' | 'human_review';
    parent_trace_id?: string;
    agent_info: {
        agent_name: string;
        agent_version?: string;
        model?: string;
        model_config?: {
            temperature?: number;
            top_p?: number;
            max_tokens?: number;
        };
    };
    loaded_kdna: Array<{
        name: string;
        version: string;
        judgment_version?: string;
        digest?: string;
        role?: string;
        load_profile?: string;
        source?: string;
    }>;
    route_result?: {
        status: string;
        action: string;
        confidence: number;
        reason: string;
        trust_passed: boolean;
        trust_failures?: string[];
    };
    input_hash?: string;
    input_summary?: string;
    output_hash?: string;
    triggered_axioms?: Array<{
        id: string;
        domain: string;
        statement?: string;
        transfer_level?: string;
        evidence?: string;
    }>;
    triggered_frameworks?: Array<{
        id: string;
        domain: string;
        name?: string;
        steps_applied?: string[];
    }>;
    triggered_misunderstandings?: Array<{
        id: string;
        domain: string;
        wrong_belief?: string;
        correction_applied?: string;
    }>;
    self_checks?: Array<{
        check_id: string;
        domain: string;
        question?: string;
        passed: boolean;
        reason?: string;
    }>;
    banned_terms_avoided?: Array<{
        term: string;
        domain: string;
        replaced_with?: string;
    }>;
    violations?: Array<{
        type: string;
        severity: string;
        description: string;
        domain?: string;
    }>;
    generated_judgment?: {
        classification?: string;
        confidence?: number;
        recommended_action?: string;
        reasoning_summary?: string;
        missing_elements?: string[];
    };
    artifact_refs?: Array<{
        artifact_id: string;
        artifact_type: string;
        content_digest?: string;
        relationship?: string;
    }>;
    quality_report_refs?: Array<{
        report_id: string;
        report_type?: string;
        overall_result?: string;
        score?: number;
    }>;
    human_review_ref?: {
        review_id: string;
        reviewer_id?: string;
        decision: string;
        reviewed_at?: string;
    };
    conflicts?: Array<{
        type: string;
        description: string;
        involved_domains?: string[];
        resolution?: string;
    }>;
    metadata?: {
        tags?: string[];
        environment?: string;
        engine?: string;
        engine_version?: string;
        pipeline_run_id?: string;
        stage_id?: string;
    };
}
export declare function createStageTrace(run: Run, stage: Stage, artifacts: Artifact[], options: {
    agentName: string;
    agentVersion?: string;
    model?: string;
    parentTraceId?: string;
    inputHash?: string;
    outputHash?: string;
}): EvidenceTrace;
export declare function linkArtifactToTrace(trace: EvidenceTrace, envelope: ArtifactEnvelope, relationship?: string): EvidenceTrace;
export declare function linkQualityReport(trace: EvidenceTrace, reportId: string, reportType: string, result: string, score?: number): EvidenceTrace;
export declare function linkHumanReview(trace: EvidenceTrace, review: Review): EvidenceTrace;
export declare function traceChain(traces: EvidenceTrace[]): EvidenceTrace[];
//# sourceMappingURL=trace-bridge.d.ts.map