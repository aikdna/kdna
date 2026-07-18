const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  loadConsumerIndex,
  validateConsumerIndex,
  resolveConsumerIndex,
  isTrusted,
  VALID_STATUSES,
} = require("../src/consumer-index");

const validIndex = {
  consumer_index: "0.1.0",
  entries: [
    {
      domain_id: "content-review",
      status: "trusted_runtime",
      enabled: true,
      route_preference: {
        primary_for: ["review"],
        advisor_for: ["decide"],
        never_for: ["compose"],
      },
      evidence: {
        last_evaluated: "2026-07-10T00:00:00Z",
        replay_passed: true,
      },
    },
    {
      domain_id: "style-advisor",
      status: "draft_generated",
      enabled: false,
    },
  ],
};

test("loadConsumerIndex validates a valid index object", () => {
  const result = loadConsumerIndex(validIndex);
  assert.equal(result.valid, true);
  assert.ok(result.index);
  assert.equal(result.index.entries.length, 2);
});

test("loadConsumerIndex rejects missing consumer_index version", () => {
  const result = loadConsumerIndex({ entries: [] });
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /consumer_index/);
});

test("loadConsumerIndex rejects invalid status value", () => {
  const result = loadConsumerIndex({
    consumer_index: "0.1.0",
    entries: [{ domain_id: "test", status: "published" }],
  });
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /status/);
});

test("loadConsumerIndex rejects entry missing domain_id", () => {
  const result = loadConsumerIndex({
    consumer_index: "0.1.0",
    entries: [{ status: "draft_generated" }],
  });
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /domain_id/);
});

test("enabled defaults to false", () => {
  const idx = {
    consumer_index: "0.1.0",
    entries: [{ domain_id: "test", status: "trusted_runtime" }],
  };
  const result = resolveConsumerIndex(idx, "review", "test");
  assert.equal(result.isEnabled, false);
  assert.equal(result.isTrusted, false);
});

test("isTrusted returns false when enabled is false even if status is trusted_runtime", () => {
  const idx = {
    consumer_index: "0.1.0",
    entries: [{ domain_id: "test", status: "trusted_runtime", enabled: false }],
  };
  assert.equal(isTrusted(idx, "test"), false);
});

test("isTrusted returns true when status=trusted_runtime AND enabled=true", () => {
  const idx = {
    consumer_index: "0.1.0",
    entries: [{ domain_id: "test", status: "trusted_runtime", enabled: true }],
  };
  assert.equal(isTrusted(idx, "test"), true);
});

test("resolveConsumerIndex returns correct route_preference for primary task", () => {
  const result = resolveConsumerIndex(validIndex, "review", "content-review");
  assert.equal(result.status, "trusted_runtime");
  assert.equal(result.routePreference, "primary");
  assert.equal(result.isTrusted, true);
  assert.equal(result.isEnabled, true);
});

test("resolveConsumerIndex returns advisor for advisor task", () => {
  const result = resolveConsumerIndex(validIndex, "decide", "content-review");
  assert.equal(result.routePreference, "advisor");
  assert.equal(result.isTrusted, true);
});

test("resolveConsumerIndex blocks domain on never_for task", () => {
  const result = resolveConsumerIndex(validIndex, "compose", "content-review");
  assert.equal(result.isTrusted, false);
  assert.equal(result.isEnabled, false);
  assert.equal(result.routePreference, null);
});

test("resolveConsumerIndex returns default for unknown domain", () => {
  const result = resolveConsumerIndex(validIndex, "review", "nonexistent");
  assert.equal(result.status, "draft_generated");
  assert.equal(result.isTrusted, false);
});

test("VALID_STATUSES includes all five expected statuses", () => {
  assert.deepEqual(VALID_STATUSES, [
    "draft_generated",
    "lint_repaired",
    "human_reviewed",
    "eval_candidate",
    "trusted_runtime",
  ]);
});

test("validateConsumerIndex rejects hostile entry shapes without throwing", () => {
  const baseEntry = { domain_id: "test", status: "trusted_runtime" };
  const hostileIndexes = [
    { consumer_index: "0.1.0", entries: [null] },
    { consumer_index: "0.1.0", entries: [42] },
    { consumer_index: "0.1.0", entries: [{ ...baseEntry, enabled: "yes" }] },
    { consumer_index: "0.1.0", entries: [{ ...baseEntry, route_preference: [] }] },
    {
      consumer_index: "0.1.0",
      entries: [{ ...baseEntry, route_preference: { primary_for: {} } }],
    },
    {
      consumer_index: "0.1.0",
      entries: [{ ...baseEntry, route_preference: { advisor_for: ["review", 1] } }],
    },
    {
      consumer_index: "0.1.0",
      entries: [{ ...baseEntry, route_preference: { never_for: null } }],
    },
  ];

  for (const index of hostileIndexes) {
    let validation;
    assert.doesNotThrow(() => {
      validation = validateConsumerIndex(index);
    });
    assert.equal(validation.valid, false, JSON.stringify(index));
    assert.equal(validation.index, null);
    assert.doesNotThrow(() => resolveConsumerIndex(index, "review", "test"));
    assert.deepEqual(resolveConsumerIndex(index, "review", "test"), {
      status: "draft_generated",
      routePreference: null,
      isTrusted: false,
      isEnabled: false,
    });
    assert.equal(isTrusted(index, "test"), false);
  }
});
