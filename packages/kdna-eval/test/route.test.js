const test = require("node:test");
const assert = require("node:assert/strict");
const { getRoutePolicy, resolveDomains } = require("../src/route.js");

test("getRoutePolicy returns correct policy", () => {
  const policies = {
    my_op: { operation: "my_op", loadProfile: "compact", domains: [{ id: "my.kdna", weight: 1 }] }
  };
  const p = getRoutePolicy("my_op", policies);
  assert.equal(p.operation, "my_op");
});

test("getRoutePolicy throws for unknown operation", () => {
  assert.throws(() => getRoutePolicy("unknown", {}), /Unknown operation/);
});

test("resolveDomains uses selected/loadStatus not loaded", () => {
  const policies = {
    test: { operation: "test", loadProfile: "compact", domains: [{ id: "d.kdna", weight: 1 }] }
  };
  const res = resolveDomains("test", { policies });
  for (const d of res.domains) {
    assert.ok("selected" in d);
    assert.ok("loadStatus" in d);
  }
});

test("resolveDomains handles override turning domain off", () => {
  const policies = {
    test: { operation: "test", loadProfile: "compact", domains: [{ id: "d.kdna", weight: 1 }] }
  };
  const res = resolveDomains("test", { policies, domainOverrides: { "d.kdna": false } });
  const d = res.domains.find((x) => x.id === "d.kdna");
  assert.equal(d.selected, false);
  assert.equal(d.loadStatus, "skipped");
});

test("resolveDomains handles weight override", () => {
  const policies = {
    test: { operation: "test", loadProfile: "compact", domains: [{ id: "d.kdna", weight: 1 }] }
  };
  const res = resolveDomains("test", { policies, domainOverrides: { "d.kdna": 2.5 } });
  const d = res.domains.find((x) => x.id === "d.kdna");
  assert.equal(d.weight, 2.5);
  assert.equal(d.selected, true);
  assert.equal(d.loadStatus, "pending");
});
