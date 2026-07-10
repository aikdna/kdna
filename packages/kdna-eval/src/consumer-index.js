const VALID_STATUSES = [
  "draft_generated",
  "lint_repaired",
  "human_reviewed",
  "eval_candidate",
  "trusted_runtime",
];

function loadConsumerIndex(pathOrObject) {
  if (typeof pathOrObject === "object" && pathOrObject !== null) {
    return validateConsumerIndex(pathOrObject);
  }
  if (typeof pathOrObject === "string") {
    try {
      const fs = require("node:fs");
      const data = JSON.parse(fs.readFileSync(pathOrObject, "utf8"));
      return validateConsumerIndex(data);
    } catch (e) {
      return { valid: false, index: null, errors: [e.message] };
    }
  }
  return { valid: false, index: null, errors: ["input must be an object or file path"] };
}

function validateConsumerIndex(index) {
  const errors = [];

  if (!index || typeof index !== "object") {
    errors.push("index must be an object");
    return { valid: false, index: null, errors };
  }

  if (index.consumer_index !== "0.1.0") {
    errors.push('consumer_index must be "0.1.0"');
  }

  if (!Array.isArray(index.entries)) {
    errors.push("entries must be an array");
    return { valid: false, index: null, errors };
  }

  for (const entry of index.entries) {
    if (!entry.domain_id || typeof entry.domain_id !== "string") {
      errors.push(`entry missing domain_id`);
    }
    if (!VALID_STATUSES.includes(entry.status)) {
      errors.push(`invalid status "${entry.status}" for ${entry.domain_id || "unknown"}. Valid: ${VALID_STATUSES.join(", ")}`);
    }
  }

  return {
    valid: errors.length === 0,
    index: errors.length === 0 ? index : null,
    errors,
  };
}

function resolveConsumerIndex(index, task, domainId) {
  if (!index || !index.entries) {
    return { status: "draft_generated", routePreference: null, isTrusted: false, isEnabled: false };
  }

  const entry = index.entries.find((e) => e.domain_id === domainId);
  if (!entry) {
    return { status: "draft_generated", routePreference: null, isTrusted: false, isEnabled: false };
  }

  const enabled = entry.enabled === true;
  const trusted = entry.status === "trusted_runtime" && enabled;

  let routePref = null;
  if (entry.route_preference) {
    routePref = {
      primaryFor: entry.route_preference.primary_for || [],
      advisorFor: entry.route_preference.advisor_for || [],
      neverFor: entry.route_preference.never_for || [],
    };

    if (task) {
      if (routePref.neverFor.includes(task)) {
        return { status: entry.status, routePreference: null, isTrusted: false, isEnabled: false };
      }
      if (routePref.primaryFor.includes(task)) {
        return { status: entry.status, routePreference: "primary", isTrusted: trusted, isEnabled: enabled };
      }
      if (routePref.advisorFor.includes(task)) {
        return { status: entry.status, routePreference: "advisor", isTrusted: trusted, isEnabled: enabled };
      }
    }
  }

  return { status: entry.status, routePreference: routePref, isTrusted: trusted, isEnabled: enabled };
}

function isTrusted(index, domainId) {
  if (!index || !index.entries) return false;
  const entry = index.entries.find((e) => e.domain_id === domainId);
  if (!entry) return false;
  return entry.status === "trusted_runtime" && entry.enabled === true;
}

module.exports = {
  loadConsumerIndex,
  validateConsumerIndex,
  resolveConsumerIndex,
  isTrusted,
  VALID_STATUSES,
};
