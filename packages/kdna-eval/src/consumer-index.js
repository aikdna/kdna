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

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validatePreferenceList(value, field, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string") errors.push(`${field}[${index}] must be a string`);
  });
}

function validateConsumerIndex(index) {
  const errors = [];

  if (!isRecord(index)) {
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

  for (const [entryIndex, entry] of index.entries.entries()) {
    if (!isRecord(entry)) {
      errors.push(`entries[${entryIndex}] must be an object`);
      continue;
    }
    if (typeof entry.domain_id !== "string" || entry.domain_id.length === 0) {
      errors.push(`entries[${entryIndex}].domain_id must be a non-empty string`);
    }
    if (!VALID_STATUSES.includes(entry.status)) {
      errors.push(
        `invalid status "${String(entry.status)}" for ${entry.domain_id || "unknown"}. Valid: ${VALID_STATUSES.join(", ")}`,
      );
    }
    if (entry.enabled !== undefined && typeof entry.enabled !== "boolean") {
      errors.push(`entries[${entryIndex}].enabled must be a boolean`);
    }
    if (entry.route_preference !== undefined) {
      if (!isRecord(entry.route_preference)) {
        errors.push(`entries[${entryIndex}].route_preference must be an object`);
        continue;
      }
      for (const field of ["primary_for", "advisor_for", "never_for"]) {
        if (entry.route_preference[field] !== undefined) {
          validatePreferenceList(
            entry.route_preference[field],
            `entries[${entryIndex}].route_preference.${field}`,
            errors,
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    index: errors.length === 0 ? index : null,
    errors,
  };
}

function resolveConsumerIndex(index, task, domainId) {
  const validation = validateConsumerIndex(index);
  if (!validation.valid || !validation.index) {
    return { status: "draft_generated", routePreference: null, isTrusted: false, isEnabled: false };
  }

  const entry = validation.index.entries.find((e) => e.domain_id === domainId);
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
  const validation = validateConsumerIndex(index);
  if (!validation.valid || !validation.index) return false;
  const entry = validation.index.entries.find((e) => e.domain_id === domainId);
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
