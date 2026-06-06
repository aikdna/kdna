const test = require("node:test");
const assert = require("node:assert/strict");
const { getRoutePolicy, resolveDomains, DEFAULT_POLICIES, OPERATIONS } = require("../src/route.js");

test("getRoutePolicy returns correct policy per operation", () => {
  const policy = getRoutePolicy("select_segments");
  assert.equal(policy.operation, "select_segments");
  assert.equal(policy.loadProfile, "scenario");
  assert.ok(policy.domains.length > 0);
});

test("getRoutePolicy throws for unknown operation", () => {
  assert.throws(() => getRoutePolicy("unknown_op"), /Unknown KDNA operation/);
});

test("getRoutePolicy accepts custom policies", () => {
  const custom = {
    custom_op: {
      operation: "custom_op",
      loadProfile: "compact",
      domains: [{ id: "my.kdna", weight: 1.0 }]
    }
  };
  const policy = getRoutePolicy("custom_op", custom);
  assert.equal(policy.domains[0].id, "my.kdna");
});

test("resolveDomains returns resolved domain list", () => {
  const resolved = resolveDomains("select_segments");
  assert.equal(resolved.operation, "select_segments");
  assert.ok(resolved.loadedDomains.length > 0);
  assert.equal(resolved.skippedDomains.length, 0);
});

test("resolveDomains handles overrides turning domains off", () => {
  const resolved = resolveDomains("select_segments", {
    domainOverrides: { "segment_selection.kdna": false }
  });
  const segSel = resolved.domains.find((d) => d.id === "segment_selection.kdna");
  assert.ok(segSel);
  assert.equal(segSel.loaded, false);
  assert.ok(segSel.skipReason);
});

test("resolveDomains handles weight overrides", () => {
  const resolved = resolveDomains("select_segments", {
    domainOverrides: { "segment_selection.kdna": 2.5 }
  });
  const segSel = resolved.domains.find((d) => d.id === "segment_selection.kdna");
  assert.equal(segSel.weight, 2.5);
  assert.equal(segSel.loaded, true);
});

test("resolveDomains accepts custom policies", () => {
  const custom = {
    test_op: {
      operation: "test_op",
      loadProfile: "compact",
      domains: [{ id: "test.kdna", weight: 1 }]
    }
  };
  const resolved = resolveDomains("test_op", { policies: custom });
  assert.equal(resolved.operation, "test_op");
  assert.deepEqual(resolved.loadedDomains, ["test.kdna"]);
});

test("OPERATIONS includes all default ops", () => {
  assert.ok(OPERATIONS.includes("select_segments"));
  assert.ok(OPERATIONS.includes("arrange_timeline"));
  assert.ok(OPERATIONS.includes("choose_enhancement"));
  assert.ok(OPERATIONS.includes("final_review"));
});
