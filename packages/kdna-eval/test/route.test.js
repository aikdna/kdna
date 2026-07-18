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

test("getRoutePolicy never returns inherited prototype members", () => {
  for (const operation of ["constructor", "toString", "valueOf", "__proto__"]) {
    assert.throws(() => getRoutePolicy(operation, {}), /Unknown operation/);
  }

  const inherited = Object.create({ inherited: {
    operation: "inherited",
    loadProfile: "compact",
    domains: [],
  } });
  assert.throws(() => getRoutePolicy("inherited", inherited), /Unknown operation/);
});

test("getRoutePolicy accepts only validated own data properties", () => {
  const policies = Object.create(null);
  policies.review = {
    operation: "review",
    loadProfile: "compact",
    domains: [{ id: "review.kdna", weight: 1 }],
  };
  assert.equal(getRoutePolicy("review", policies), policies.review);

  const accessorPolicies = {};
  Object.defineProperty(accessorPolicies, "review", {
    get() { throw new Error("must not execute policy getters"); },
  });
  assert.throws(() => getRoutePolicy("review", accessorPolicies), /Unknown operation/);

  const accessorPolicy = { operation: "review", loadProfile: "compact" };
  Object.defineProperty(accessorPolicy, "domains", {
    get() { throw new Error("must not execute route policy getters"); },
  });
  assert.throws(() => getRoutePolicy("review", { review: accessorPolicy }), /Invalid route policy/);

  let nestedGetterCalls = 0;
  const accessorDomain = { id: "review.kdna", weight: 1 };
  Object.defineProperty(accessorDomain, "sideEffect", {
    enumerable: true,
    get() { nestedGetterCalls++; throw new Error("must not execute nested domain getters"); },
  });
  assert.throws(
    () => getRoutePolicy("review", {
      review: { operation: "review", loadProfile: "compact", domains: [accessorDomain] },
    }),
    /Invalid route policy/,
  );
  assert.equal(nestedGetterCalls, 0);

  for (const policy of [
    null,
    { operation: "wrong", loadProfile: "compact", domains: [] },
    { operation: "review", loadProfile: "unbounded", domains: [] },
    { operation: "review", loadProfile: "compact", domains: {} },
    { operation: "review", loadProfile: "compact", domains: [{ id: "", weight: 1 }] },
    { operation: "review", loadProfile: "compact", domains: [{ id: "review.kdna", weight: NaN }] },
    Object.create({ operation: "review", loadProfile: "compact", domains: [] }),
    {
      operation: "review",
      loadProfile: "compact",
      domains: [Object.create({ id: "review.kdna", weight: 1 })],
    },
  ]) {
    assert.throws(() => getRoutePolicy("review", { review: policy }), /Invalid route policy/);
  }
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

test("resolveDomains rejects inherited, accessor, and non-finite overrides without executing getters", () => {
  const policies = {
    test: { operation: "test", loadProfile: "compact", domains: [{ id: "d.kdna", weight: 1 }] }
  };
  const inheritedOverrides = Object.create({ "d.kdna": false });
  assert.throws(
    () => resolveDomains("test", { policies, domainOverrides: inheritedOverrides }),
    /domainOverrides must contain only own data properties/,
  );

  let overrideGetterCalls = 0;
  const accessorOverrides = {};
  Object.defineProperty(accessorOverrides, "d.kdna", {
    enumerable: true,
    get() { overrideGetterCalls++; throw new Error("must not execute override getters"); },
  });
  assert.throws(
    () => resolveDomains("test", { policies, domainOverrides: accessorOverrides }),
    /domainOverrides must contain only own data properties/,
  );
  assert.equal(overrideGetterCalls, 0);

  for (const override of [NaN, Infinity, -Infinity, "2", true]) {
    assert.throws(
      () => resolveDomains("test", { policies, domainOverrides: { "d.kdna": override } }),
      /domainOverrides values must be false or finite numbers/,
    );
  }
});
