const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadRouteCard, validateRouteCard, applyRouteCard } = require("../src/route-card");

test("loadRouteCard validates a valid card object", () => {
  const card = {
    route_card: "0.1.0",
    domain_id: "content-review",
    role: "primary",
    provenance: {
      generated_by: "test",
      generated_at: "2026-07-10T00:00:00Z",
      review_status: "draft_generated",
    },
  };
  const result = loadRouteCard(card);
  assert.equal(result.valid, true);
  assert.ok(result.card);
  assert.equal(result.card.domain_id, "content-review");
});

test("loadRouteCard rejects card with missing domain_id", () => {
  const card = {
    route_card: "0.1.0",
    role: "primary",
  };
  const result = loadRouteCard(card);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /domain_id/);
});

test("loadRouteCard rejects card with wrong route_card version", () => {
  const card = {
    route_card: "0.9.0",
    domain_id: "test",
    role: "primary",
  };
  const result = loadRouteCard(card);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /route_card/);
});

test("loadRouteCard rejects card with invalid role", () => {
  const card = {
    route_card: "0.1.0",
    domain_id: "test",
    role: "observer",
  };
  const result = loadRouteCard(card);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /role/);
});

test("loadRouteCard validates all review_status values", () => {
  const statuses = [
    "draft_generated",
    "lint_repaired",
    "human_reviewed",
    "eval_candidate",
    "trusted_runtime",
  ];
  for (const status of statuses) {
    const card = {
      route_card: "0.1.0",
      domain_id: "test",
      role: "primary",
      provenance: {
        generated_by: "test",
        generated_at: "2026-07-10T00:00:00Z",
        review_status: status,
      },
    };
    const result = loadRouteCard(card);
    assert.equal(result.valid, true, `status ${status} should be valid`);
  }
});

test("loadRouteCard rejects unknown review_status", () => {
  const card = {
    route_card: "0.1.0",
    domain_id: "test",
    role: "primary",
    provenance: {
      generated_by: "test",
      generated_at: "2026-07-10T00:00:00Z",
      review_status: "unknown",
    },
  };
  const result = loadRouteCard(card);
  assert.equal(result.valid, false);
});

test("applyRouteCard merges card preferences into policies", () => {
  const card = {
    route_card: "0.1.0",
    domain_id: "new-domain",
    role: "primary",
  };
  const policies = {
    review: {
      operation: "review",
      loadProfile: "compact",
      domains: [{ id: "existing", weight: 1 }],
    },
  };
  const augmented = applyRouteCard(card, policies);
  assert.deepEqual(augmented.review.domains, [
    { id: "existing", weight: 1 },
    { id: "new-domain", weight: 1 },
  ]);
});

test("applyRouteCard with neighbors applies weight_delta", () => {
  const card = {
    route_card: "0.1.0",
    domain_id: "primary-domain",
    role: "primary",
    neighbors: [
      { domain_id: "neighbor-domain", relationship: "complement", weight_delta: 0.2 },
    ],
  };
  const policies = {
    review: {
      operation: "review",
      loadProfile: "compact",
      domains: [{ id: "neighbor-domain", weight: 0.5 }],
    },
  };
  const augmented = applyRouteCard(card, policies);
  const neighbor = augmented.review.domains.find((d) => d.id === "neighbor-domain");
  assert.equal(neighbor.weight, 0.7);
});

test("applyRouteCard throws on invalid card", () => {
  assert.throws(() => {
    applyRouteCard({ route_card: "0.1.0", role: "primary" }, {});
  }, /domain_id/);
});

test("applyRouteCard handles null policies", () => {
  const card = {
    route_card: "0.1.0",
    domain_id: "sole-domain",
    role: "primary",
  };
  const augmented = applyRouteCard(card, null);
  assert.deepEqual(augmented, {});
});

test("validateRouteCard rejects hostile nested shapes without throwing", () => {
  const base = { route_card: "0.1.0", domain_id: "test", role: "primary" };
  const hostileCards = [
    { ...base, boundaries: [] },
    { ...base, boundaries: { applies_when: [1] } },
    { ...base, boundaries: { does_not_apply_when: ["valid", null] } },
    { ...base, neighbors: [null] },
    { ...base, neighbors: [{ domain_id: 42, relationship: "complement" }] },
    {
      ...base,
      neighbors: [{ domain_id: "neighbor", relationship: "complement", weight_delta: "0.2" }],
    },
    { ...base, advisor_edges: [null] },
    { ...base, advisor_edges: [{ domain_id: 42, when: "always" }] },
    { ...base, provenance: [] },
    { ...base, provenance: { generated_by: 42 } },
    { ...base, provenance: { generated_by: "test", review_status: 42 } },
  ];

  for (const card of hostileCards) {
    let result;
    assert.doesNotThrow(() => {
      result = validateRouteCard(card);
    });
    assert.equal(result.valid, false, JSON.stringify(card));
    assert.equal(result.card, null);
    assert.ok(result.errors.length > 0);
  }
});
