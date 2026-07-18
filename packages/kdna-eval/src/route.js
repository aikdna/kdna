function ownDataProperty(object, key) {
  if (object === null || typeof object !== "object") return { found: false };
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (!descriptor || !("value" in descriptor)) return { found: false };
  return { found: true, value: descriptor.value };
}

function isPlainDataObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every(
    (descriptor) => "value" in descriptor && descriptor.enumerable,
  );
}

function isDenseDataArray(value) {
  if (!Array.isArray(value) || Object.getOwnPropertySymbols(value).length > 0) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (key === "length") continue;
    if (!/^\d+$/.test(key) || Number(key) >= value.length ||
        !("value" in descriptor) || !descriptor.enumerable) return false;
  }
  return Array.from({ length: value.length }, (_, index) =>
    Object.prototype.hasOwnProperty.call(descriptors, index) && "value" in descriptors[index]
  ).every(Boolean);
}

function getRoutePolicy(operation, policies) {
  if (typeof operation !== "string" || operation.trim().length === 0) {
    throw new TypeError("operation must be a non-empty string");
  }
  if (policies === null || typeof policies !== "object" || Array.isArray(policies)) {
    throw new Error(`Unknown operation: ${operation}`);
  }

  const policyProperty = ownDataProperty(policies, operation);
  if (!policyProperty.found) {
    throw new Error(`Unknown operation: ${operation}`);
  }
  const p = policyProperty.value;
  if (!isPlainDataObject(p)) {
    throw new TypeError(`Invalid route policy for operation: ${operation}`);
  }
  const policyOperation = ownDataProperty(p, "operation");
  const loadProfile = ownDataProperty(p, "loadProfile");
  const domains = ownDataProperty(p, "domains");
  if (!policyOperation.found || policyOperation.value !== operation) {
    throw new TypeError(`Invalid route policy for operation: ${operation}`);
  }
  if (!loadProfile.found || !["compact", "scenario", "full"].includes(loadProfile.value)) {
    throw new TypeError(`Invalid route policy loadProfile for operation: ${operation}`);
  }
  if (!domains.found || !isDenseDataArray(domains.value)) {
    throw new TypeError(`Invalid route policy domains for operation: ${operation}`);
  }
  for (const [index, domain] of domains.value.entries()) {
    const id = ownDataProperty(domain, "id");
    const weight = ownDataProperty(domain, "weight");
    if (!isPlainDataObject(domain) || !id.found || typeof id.value !== "string" ||
        id.value.trim().length === 0 || !weight.found || typeof weight.value !== "number" ||
        !Number.isFinite(weight.value)) {
      throw new TypeError(`Invalid route policy domain at index ${index} for operation: ${operation}`);
    }
  }
  return p;
}

function resolveDomains(operation, options) {
  const { policies, domainOverrides, skipReason } = options ?? {};
  const policy = getRoutePolicy(operation, policies);
  if (domainOverrides !== undefined && domainOverrides !== null) {
    if (!isPlainDataObject(domainOverrides)) {
      throw new TypeError("domainOverrides must contain only own data properties");
    }
    for (const override of Object.values(domainOverrides)) {
      if (override !== false && (typeof override !== "number" || !Number.isFinite(override))) {
        throw new TypeError("domainOverrides values must be false or finite numbers");
      }
    }
  }

  const resolved = policy.domains.map((domain) => {
    const overrideProperty = ownDataProperty(domainOverrides, domain.id);
    const override = overrideProperty.found ? overrideProperty.value : undefined;
    if (override === false) {
      return { ...domain, selected: false, loadStatus: "skipped", skipReason: skipReason ?? "overridden-off" };
    }
    if (typeof override === "number") {
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
