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

function validateRouteCard(card) {
  const errors = [];

  if (!card || typeof card !== "object") {
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

  if (card.boundaries) {
    if (card.boundaries.applies_when && !Array.isArray(card.boundaries.applies_when)) {
      errors.push("boundaries.applies_when must be an array");
    }
    if (card.boundaries.does_not_apply_when && !Array.isArray(card.boundaries.does_not_apply_when)) {
      errors.push("boundaries.does_not_apply_when must be an array");
    }
  }

  if (card.neighbors && !Array.isArray(card.neighbors)) {
    errors.push("neighbors must be an array");
  } else if (Array.isArray(card.neighbors)) {
    for (const n of card.neighbors) {
      if (!n.domain_id) errors.push("neighbor missing domain_id");
      if (!["complement", "alternative", "supersedes"].includes(n.relationship)) {
        errors.push(`invalid neighbor relationship: ${n.relationship}`);
      }
    }
  }

  if (card.advisor_edges && !Array.isArray(card.advisor_edges)) {
    errors.push("advisor_edges must be an array");
  } else if (Array.isArray(card.advisor_edges)) {
    for (const e of card.advisor_edges) {
      if (!e.domain_id) errors.push("advisor_edge missing domain_id");
      if (!["always", "on_uncertainty", "on_conflict"].includes(e.when)) {
        errors.push(`invalid advisor_edge when: ${e.when}`);
      }
    }
  }

  if (card.provenance) {
    const validReviewStatuses = [
      "draft_generated",
      "lint_repaired",
      "human_reviewed",
      "eval_candidate",
      "trusted_runtime",
    ];
    if (card.provenance.review_status && !validReviewStatuses.includes(card.provenance.review_status)) {
      errors.push(`invalid provenance.review_status: ${card.provenance.review_status}`);
    }
    if (!card.provenance.generated_by) {
      errors.push("provenance.generated_by is required when provenance is present");
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
