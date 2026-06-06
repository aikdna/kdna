const test = require("node:test");
const assert = require("node:assert/strict");
const { getRoutePolicy, resolveDomains, OPERATIONS } = require("../src/route.js");

test("getRoutePolicy returns correct policy", () => {
  const p = getRoutePolicy("select_segments");
  assert.equal(p.operation, "select_segments");
  assert.ok(p.domains.length > 0);
});

test("getRoutePolicy throws for unknown operation", () => {
  assert.throws(() => getRoutePolicy("unknown"), /Unknown operation/);
});

test("getRoutePolicy accepts custom policies", () => {
  const custom = { custom: { operation: "custom", loadProfile: "compact", domains: [{ id: "x.kdna", weight: 1 }] } };
  assert.equal(getRoutePolicy("custom", custom).domains[0].id, "x.kdna");
});

test("resolveDomains uses selected/loadStatus not loaded", () => {
  const res = resolveDomains("select_segments");
  for (const d of res.domains) {
    assert.ok("selected" in d);
    assert.ok("loadStatus" in d);
  }
});

test("resolveDomains handles override turning domain off", () => {
  const res = resolveDomains("select_segments", { domainOverrides: { "segment_selection.kdna": false } });
  const seg = res.domains.find((d) => d.id === "segment_selection.kdna");
  assert.equal(seg.selected, false);
  assert.equal(seg.loadStatus, "skipped");
});

test("resolveDomains handles weight override", () => {
  const res = resolveDomains("select_segments", { domainOverrides: { "segment_selection.kdna": 2.5 } });
  const seg = res.domains.find((d) => d.id === "segment_selection.kdna");
  assert.equal(seg.weight, 2.5);
  assert.equal(seg.selected, true);
  assert.equal(seg.loadStatus, "pending");
});

test("OPERATIONS includes built-in ops", () => {
  assert.ok(OPERATIONS.includes("select_segments"));
  assert.ok(OPERATIONS.includes("arrange_timeline"));
});
