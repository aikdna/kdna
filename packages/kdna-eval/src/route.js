const DEFAULT_POLICIES = {
  select_segments: {
    operation: "select_segments",
    loadProfile: "scenario",
    domains: [
      { id: "segment_selection.kdna", weight: 0.45 },
      { id: "narrative_structure.kdna", weight: 0.25 },
      { id: "speaker_authenticity.kdna", weight: 0.2 },
      { id: "risk_and_integrity.kdna", weight: 0.1 }
    ]
  },
  arrange_timeline: {
    operation: "arrange_timeline",
    loadProfile: "scenario",
    domains: [
      { id: "narrative_structure.kdna", weight: 0.45 },
      { id: "pacing_rhythm.kdna", weight: 0.3 },
      { id: "segment_selection.kdna", weight: 0.15 },
      { id: "platform_fit.kdna", weight: 0.1 }
    ]
  },
  choose_enhancement: {
    operation: "choose_enhancement",
    loadProfile: "compact",
    domains: [
      { id: "visual_aesthetic.kdna", weight: 0.35 },
      { id: "caption_readability.kdna", weight: 0.25 },
      { id: "platform_fit.kdna", weight: 0.2 },
      { id: "pacing_rhythm.kdna", weight: 0.2 }
    ]
  },
  final_review: {
    operation: "final_review",
    loadProfile: "compact",
    domains: [
      { id: "final_review.kdna", weight: 0.3 },
      { id: "risk_and_integrity.kdna", weight: 0.25 },
      { id: "speaker_authenticity.kdna", weight: 0.2 },
      { id: "visual_aesthetic.kdna", weight: 0.15 },
      { id: "platform_fit.kdna", weight: 0.1 }
    ]
  }
};

const OPERATIONS = Object.keys(DEFAULT_POLICIES);

function getRoutePolicy(operation, policies) {
  const source = policies ?? DEFAULT_POLICIES;
  const policy = source[operation];
  if (!policy) {
    throw new Error(
      `Unknown KDNA operation: ${operation}. Supported: ${OPERATIONS.join(", ")}`
    );
  }
  return policy;
}

function resolveDomains(operation, options) {
  const { policies, domainOverrides, skipReason } = options ?? {};
  const policy = getRoutePolicy(operation, policies);

  const resolved = policy.domains.map((domain) => {
    const override = domainOverrides?.[domain.id];
    if (override === false) {
      return {
        ...domain,
        loaded: false,
        skipReason: skipReason ?? "overridden-off"
      };
    }
    if (override != null && typeof override === "number") {
      return { ...domain, weight: override, loaded: true };
    }
    return { ...domain, loaded: true };
  });

  return {
    operation,
    loadProfile: policy.loadProfile,
    domains: resolved,
    loadedDomains: resolved.filter((d) => d.loaded).map((d) => d.id),
    skippedDomains: resolved.filter((d) => !d.loaded).map((d) => d.id)
  };
}

module.exports = {
  DEFAULT_POLICIES,
  OPERATIONS,
  getRoutePolicy,
  resolveDomains
};
