function getRoutePolicy(operation, policies) {
  const p = (policies ?? {})[operation];
  if (!p) throw new Error(`Unknown operation: ${operation}`);
  return p;
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

module.exports = { getRoutePolicy, resolveDomains };
