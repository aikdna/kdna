export class AutoApproveGate {
    async requestReview(_stageId, _artifactIds) {
        return {
            reviewId: `auto_${Date.now()}`,
            decision: 'approved',
            comments: [],
        };
    }
}
export function wrapAsEnvelope(artifact, generator) {
    return {
        artifact_id: artifact.artifactId,
        artifact_type: artifact.type,
        schema_version: '1.0.0',
        created_at: artifact.createdAt,
        generator,
        source_kdna: [],
        content: artifact.data,
        content_digest: '',
    };
}
//# sourceMappingURL=runner.js.map