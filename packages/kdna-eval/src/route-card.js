function loadRouteCard(pathOrObject) {
  if (typeof pathOrObject === "object" && pathOrObject !== null) {
    return validateRouteCard(pathOrObject);
  }
  if (typeof pathOrObject === "string") {
    try {
      const fs = require("node:fs");
      const data = JSON.parse(fs.readFileSync(pathOrObject, "utf8"));
      return validateRouteCard(data);
    } catch (e) {
      return { valid: false, card: null, errors: [e.message] };
    }
  }
  return { valid: false, card: null, errors: ["input must be an object or file path"] };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateStringArray(value, field, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string") errors.push(`${field}[${index}] must be a string`);
  });
}

function validateRouteCard(card) {
  const errors = [];

  if (!isRecord(card)) {
    errors.push("card must be an object");
    return { valid: false, card: null, errors };
  }

  if (card.route_card !== "0.1.0") {
    errors.push("route_card must be \"0.1.0\"");
  }

  if (typeof card.domain_id !== "string" || card.domain_id.length === 0) {
    errors.push("domain_id is required and must be a non-empty string");
  }

  if (!["primary", "advisor", "control"].includes(card.role)) {
    errors.push('role must be one of: primary, advisor, control');
  }

  if (card.boundaries !== undefined) {
    if (!isRecord(card.boundaries)) {
      errors.push("boundaries must be an object");
    } else {
      if (card.boundaries.applies_when !== undefined) {
        validateStringArray(card.boundaries.applies_when, "boundaries.applies_when", errors);
      }
      if (card.boundaries.does_not_apply_when !== undefined) {
        validateStringArray(
          card.boundaries.does_not_apply_when,
          "boundaries.does_not_apply_when",
          errors,
        );
      }
    }
  }

  if (card.neighbors !== undefined && !Array.isArray(card.neighbors)) {
    errors.push("neighbors must be an array");
  } else if (Array.isArray(card.neighbors)) {
    for (const [index, n] of card.neighbors.entries()) {
      if (!isRecord(n)) {
        errors.push(`neighbors[${index}] must be an object`);
        continue;
      }
      if (typeof n.domain_id !== "string" || n.domain_id.length === 0) {
        errors.push(`neighbors[${index}].domain_id must be a non-empty string`);
      }
      if (!["complement", "alternative", "supersedes"].includes(n.relationship)) {
        errors.push(`invalid neighbors[${index}].relationship: ${String(n.relationship)}`);
      }
      if (
        n.weight_delta !== undefined &&
        (typeof n.weight_delta !== "number" || !Number.isFinite(n.weight_delta))
      ) {
        errors.push(`neighbors[${index}].weight_delta must be a finite number`);
      }
    }
  }

  if (card.advisor_edges !== undefined && !Array.isArray(card.advisor_edges)) {
    errors.push("advisor_edges must be an array");
  } else if (Array.isArray(card.advisor_edges)) {
    for (const [index, e] of card.advisor_edges.entries()) {
      if (!isRecord(e)) {
        errors.push(`advisor_edges[${index}] must be an object`);
        continue;
      }
      if (typeof e.domain_id !== "string" || e.domain_id.length === 0) {
        errors.push(`advisor_edges[${index}].domain_id must be a non-empty string`);
      }
      if (!["always", "on_uncertainty", "on_conflict"].includes(e.when)) {
        errors.push(`invalid advisor_edges[${index}].when: ${String(e.when)}`);
      }
    }
  }

  if (card.provenance !== undefined) {
    if (!isRecord(card.provenance)) {
      errors.push("provenance must be an object");
      return { valid: false, card: null, errors };
    }
    const validReviewStatuses = [
      "draft_generated",
      "lint_repaired",
      "human_reviewed",
      "eval_candidate",
      "trusted_runtime",
    ];
    if (
      card.provenance.review_status !== undefined &&
      !validReviewStatuses.includes(card.provenance.review_status)
    ) {
      errors.push(`invalid provenance.review_status: ${String(card.provenance.review_status)}`);
    }
    if (
      typeof card.provenance.generated_by !== "string" ||
      card.provenance.generated_by.length === 0
    ) {
      errors.push(
        "provenance.generated_by is required and must be a non-empty string when provenance is present",
      );
    }
  }

  return {
    valid: errors.length === 0,
    card: errors.length === 0 ? card : null,
    errors,
  };
}

function applyRouteCard(card, policies) {
  const result = validateRouteCard(card);
  if (!result.valid) {
    throw new Error(`Invalid route card: ${result.errors.join("; ")}`);
  }

  const augmented = policies ? JSON.parse(JSON.stringify(policies)) : {};

  for (const op of Object.values(augmented)) {
    if (!op.domains) continue;

    let domainEntry = op.domains.find((d) => d.id === card.domain_id);
    if (!domainEntry) {
      domainEntry = { id: card.domain_id, weight: 1 };
      op.domains.push(domainEntry);
    }

    if (card.role === "primary") {
      domainEntry.weight = Math.max(domainEntry.weight || 1, 1);
    }

    if (card.neighbors && Array.isArray(card.neighbors)) {
      for (const n of card.neighbors) {
        let neighborEntry = op.domains.find((d) => d.id === n.domain_id);
        if (!neighborEntry) {
          neighborEntry = { id: n.domain_id, weight: 0.5 };
          op.domains.push(neighborEntry);
        }
        if (n.weight_delta != null) {
          neighborEntry.weight = Math.max(0, (neighborEntry.weight || 0) + n.weight_delta);
        }
      }
    }
  }

  return augmented;
}

module.exports = { loadRouteCard, validateRouteCard, applyRouteCard };
