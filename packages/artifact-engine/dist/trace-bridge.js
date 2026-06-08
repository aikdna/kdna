let idCounter = 0;
function generateTraceId() {
    idCounter++;
    return `trace_${Date.now()}_${idCounter.toString(36)}`;
}
export function createStageTrace(run, stage, artifacts, options) {
    return {
        trace_version: '1.0.0',
        trace_id: generateTraceId(),
        timestamp: new Date().toISOString(),
        session_id: run.runId,
        trace_type: 'generation',
        parent_trace_id: options.parentTraceId,
        agent_info: {
            agent_name: options.agentName,
            agent_version: options.agentVersion,
            model: options.model,
        },
        loaded_kdna: [],
        input_hash: options.inputHash,
        output_hash: options.outputHash,
        artifact_refs: artifacts.map((a) => ({
            artifact_id: a.artifactId,
            artifact_type: a.type,
            relationship: 'produced',
        })),
        metadata: {
            pipeline_run_id: run.runId,
            stage_id: stage.stageId,
            engine: run.engineId,
        },
    };
}
export function linkArtifactToTrace(trace, envelope, relationship = 'produced') {
    return {
        ...trace,
        artifact_refs: [
            ...(trace.artifact_refs || []),
            {
                artifact_id: envelope.artifact_id,
                artifact_type: envelope.artifact_type,
                content_digest: envelope.content_digest,
                relationship,
            },
        ],
        output_hash: envelope.content_digest,
    };
}
export function linkQualityReport(trace, reportId, reportType, result, score) {
    return {
        ...trace,
        quality_report_refs: [
            ...(trace.quality_report_refs || []),
            { report_id: reportId, report_type: reportType, overall_result: result, score },
        ],
    };
}
export function linkHumanReview(trace, review) {
    return {
        ...trace,
        human_review_ref: {
            review_id: review.reviewId,
            reviewer_id: review.reviewerId,
            decision: review.decision,
            reviewed_at: review.createdAt,
        },
    };
}
export function traceChain(traces) {
    return traces.map((trace, i) => {
        if (i === 0)
            return trace;
        return { ...trace, parent_trace_id: traces[i - 1].trace_id };
    });
}
//# sourceMappingURL=trace-bridge.js.map