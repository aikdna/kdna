const DEFAULT_POLICIES = {
  select_segments: {
    operation: "select_segments",
    loadProfile: "scenario",
    domains: [
      { id: "segment_selection.kdna", weight: 0.45 },
      { id: "narrative_structure.kdna", weight: 0.25 }
    ]
  },
  arrange_timeline: {
    operation: "arrange_timeline",
    loadProfile: "scenario",
    domains: [
      { id: "narrative_structure.kdna", weight: 0.45 },
      { id: "pacing_rhythm.kdna", weight: 0.3 },
      { id: "segment_selection.kdna", weight: 0.15 }
    ]
  }
};

const OPERATIONS = Object.keys(DEFAULT_POLICIES);

function getRoutePolicy(operation, policies) {
  const source = policies ?? DEFAULT_POLICIES;
  const policy = source[operation];
  if (!policy) {
    throw new Error(`Unknown operation: ${operation}. Supported: ${OPERATIONS.join(", ")}`);
  }
  return policy;
}

function resolveDomains(operation, options) {
  const { policies, domainOverrides, skipReason } = options ?? {};
  const policy = getRoutePolicy(operation, policies);

  const resolved = policy.domains.map((domain) => {
    const override = domainOverrides?.[domain.id];
    if (override === false) {
      return { ...domain, selected: false, loadStatus: "skipped", skipReason: skipReason ?? "overridden-off" };
    }
    if (override != null && typeof override === "number") {
      return { ...domain, weight: override, selected: true, loadStatus: "pending" };
    }
    return { ...domain, selected: true, loadStatus: "pending" };
  });

  return {
    operation,
    loadProfile: policy.loadProfile,
    domains: resolved,
    selectedDomains: resolved.filter((d) => d.selected).map((d) => d.id),
    skippedDomains: resolved.filter((d) => !d.selected).map((d) => d.id)
  };
}

module.exports = { DEFAULT_POLICIES, OPERATIONS, getRoutePolicy, resolveDomains };
