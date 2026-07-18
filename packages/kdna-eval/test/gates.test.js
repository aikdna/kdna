const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createMultiGateRunner,
  aggregateGates,
  gateFromArray,
  GATE_NAMES,
} = require("../src/gates");

test("GATE_NAMES includes all six gates", () => {
  assert.deepEqual(GATE_NAMES, ["route", "compose", "projection", "cost", "quality", "promotion"]);
});

test("createMultiGateRunner creates runner with defaults", () => {
  const runner = createMultiGateRunner(["route", "compose"]);
  assert.equal(typeof runner.runGates, "function");
  assert.equal(typeof runner.runAll, "function");
  assert.equal(typeof runner.hasGate, "function");
});

test("runGates with function gates executes each", () => {
  const routeGate = (ctx) => ({
    gate: "route",
    pass: true,
    score: 0.95,
    details: { selected: "domain_a" },
    errors: [],
  });
  const composeGate = (ctx) => ({
    gate: "compose",
    pass: true,
    score: 0.88,
    details: {},
    errors: [],
  });
  const runner = createMultiGateRunner([routeGate, composeGate]);
  const results = runner.runGates({ asset: "test" });
  assert.equal(results.length, 2);
  assert.equal(results[0].pass, true);
  assert.equal(results[1].pass, true);
});

test("runGates with string gates returns null-pass for unimplemented", () => {
  const runner = createMultiGateRunner(["route", "compose"]);
  const results = runner.runGates({ asset: "test" });
  assert.equal(results.length, 2);
  assert.equal(results[0].pass, null);
  assert.equal(results[1].pass, null);
  assert.ok(results[0].details.note.includes("route"));
});

test("function gate that throws returns pass=false with error", () => {
  const badGate = () => {
    throw new Error("gate crashed");
  };
  const runner = createMultiGateRunner([badGate]);
  const results = runner.runGates({});
  assert.equal(results[0].pass, false);
  assert.deepEqual(results[0].errors, ["gate crashed"]);
});

test("function gates normalize non-Error throws to deterministic strings", () => {
  const thrown = ["boom", { code: "OBJECT_THROW" }, undefined, Object.create(null)];
  const runner = createMultiGateRunner(thrown.map((value) => () => { throw value; }));
  const results = runner.runGates({});
  assert.deepEqual(results.map((result) => result.errors), [
    ["boom"],
    ["[object Object]"],
    ["undefined"],
    ["unprintable thrown value"],
  ]);
  assert.ok(results.every((result) => result.pass === false));
  assert.ok(results.every((result) => result.errors.every((error) => typeof error === "string")));
});

test("custom gate results require the complete strong return contract", () => {
  const gates = [
    () => ({ pass: true }),
    () => undefined,
    () => ({ gate: "bad-score", pass: true, score: "1", details: {}, errors: [] }),
    () => ({ gate: "bad-errors", pass: true, score: 1, details: {}, errors: [undefined] }),
  ];
  const runner = createMultiGateRunner(gates);
  const results = runner.runGates({});
  assert.ok(results.every((result) => result.pass === false));
  assert.ok(results.every((result) => typeof result.gate === "string"));
  assert.ok(results.every((result) => result.errors.every((error) => typeof error === "string")));
  assert.equal(runner.runAll({}).overall, "fail");
});

test("custom gate normalization never reads accessors or inherited result fields", () => {
  let reads = 0;
  const accessorPass = {
    gate: "accessor-pass",
    score: 1,
    details: {},
    errors: [],
  };
  Object.defineProperty(accessorPass, "pass", {
    enumerable: true,
    get() {
      reads++;
      return true;
    },
  });

  const unknownAccessor = {
    gate: "unknown-accessor",
    pass: true,
    score: 1,
    details: {},
    errors: [],
  };
  Object.defineProperty(unknownAccessor, "unknown", {
    enumerable: true,
    get() {
      reads++;
      return "must-not-run";
    },
  });

  const nestedDetails = {};
  Object.defineProperty(nestedDetails, "secret", {
    enumerable: true,
    get() {
      reads++;
      return "must-not-run";
    },
  });
  const nestedAccessor = {
    gate: "nested-accessor",
    pass: true,
    score: 1,
    details: nestedDetails,
    errors: [],
  };

  const inherited = {};
  Object.defineProperty(inherited, "pass", {
    enumerable: true,
    get() {
      reads++;
      return true;
    },
  });
  const inheritedPass = Object.assign(Object.create(inherited), {
    gate: "inherited-pass",
    score: 1,
    details: {},
    errors: [],
  });

  for (const hostileResult of [accessorPass, unknownAccessor, nestedAccessor, inheritedPass]) {
    const runner = createMultiGateRunner([() => hostileResult]);
    const aggregate = runner.runAll({});
    assert.equal(aggregate.overall, "fail");
    assert.equal(aggregate.results[0].pass, false);
    assert.ok(aggregate.results[0].errors.every((error) => typeof error === "string"));
  }
  assert.equal(reads, 0);
});

test("valid custom gate results are copied into detached safe data", () => {
  const source = {
    gate: "safe",
    pass: true,
    score: 1,
    details: { selected: "domain", evidence: [1, { verified: true }] },
    errors: [],
  };
  const result = createMultiGateRunner([() => source]).runGates({})[0];
  assert.equal(result.pass, true);
  assert.notEqual(result, source);
  assert.notEqual(result.details, source.details);
  assert.notEqual(result.details.evidence, source.details.evidence);

  source.pass = false;
  source.details.selected = "mutated";
  source.details.evidence[1].verified = false;
  assert.equal(result.pass, true);
  assert.equal(result.details.selected, "domain");
  assert.equal(result.details.evidence[1].verified, true);
});

test("direct aggregate helpers reject accessor GateResults without reading them", () => {
  let reads = 0;
  const hostile = {
    gate: "direct-accessor",
    score: 1,
    details: {},
    errors: [],
  };
  Object.defineProperty(hostile, "pass", {
    enumerable: true,
    get() {
      reads++;
      return true;
    },
  });

  assert.equal(gateFromArray([hostile]), false);
  const aggregate = aggregateGates([hostile]);
  assert.equal(aggregate.overall, "fail");
  assert.equal(aggregate.results[0].pass, false);
  assert.ok(aggregate.results[0].errors.every((error) => typeof error === "string"));
  assert.equal(reads, 0);
});

test("Proxy GateResults are rejected before any Proxy trap runs", () => {
  let traps = 0;
  const proxy = new Proxy(
    { gate: "proxy", pass: true, score: 1, details: {}, errors: [] },
    {
      get() {
        traps++;
        return true;
      },
      getOwnPropertyDescriptor() {
        traps++;
        return undefined;
      },
      getPrototypeOf() {
        traps++;
        return Object.prototype;
      },
      ownKeys() {
        traps++;
        return [];
      },
    },
  );

  const runnerResult = createMultiGateRunner([() => proxy]).runAll({});
  const directAggregate = aggregateGates([proxy]);
  assert.equal(gateFromArray([proxy]), false);
  assert.equal(runnerResult.overall, "fail");
  assert.equal(directAggregate.overall, "fail");
  assert.ok(runnerResult.results[0].errors.every((error) => typeof error === "string"));
  assert.ok(directAggregate.results[0].errors.every((error) => typeof error === "string"));
  assert.equal(traps, 0);
});

test("hasGate detects gate by name", () => {
  const runner = createMultiGateRunner(["route", "cost"]);
  assert.equal(runner.hasGate("route"), true);
  assert.equal(runner.hasGate("cost"), true);
  assert.equal(runner.hasGate("quality"), false);
});

test("aggregateGates returns pass when all gates pass", () => {
  const results = [
    { gate: "route", pass: true, score: 0.95, details: {}, errors: [] },
    { gate: "compose", pass: true, score: 0.88, details: {}, errors: [] },
  ];
  const agg = aggregateGates(results);
  assert.equal(agg.overall, "pass");
  assert.equal(agg.failed_gates.length, 0);
  assert.equal(agg.passed_gates.length, 2);
});

test("aggregateGates returns fail when any gate fails", () => {
  const results = [
    { gate: "route", pass: true, score: 0.95, details: {}, errors: [] },
    { gate: "compose", pass: false, score: 0.3, details: {}, errors: ["bad"] },
  ];
  const agg = aggregateGates(results);
  assert.equal(agg.overall, "fail");
  assert.deepEqual(agg.failed_gates, ["compose"]);
  assert.deepEqual(agg.passed_gates, ["route"]);
});

test("aggregateGates with null-pass puts gate in blocked_gates", () => {
  const results = [
    { gate: "route", pass: true, score: 0.95, details: {}, errors: [] },
    { gate: "quality", pass: null, score: null, details: {}, errors: [] },
  ];
  const agg = aggregateGates(results);
  assert.equal(agg.overall, "fail");
  assert.deepEqual(agg.blocked_gates, ["quality"]);
  assert.deepEqual(agg.passed_gates, ["route"]);
});

test("gateFromArray returns false for empty array", () => {
  assert.equal(gateFromArray([]), false);
});

test("gateFromArray returns true when all pass", () => {
  assert.equal(
    gateFromArray([
      { gate: "a", pass: true, score: 1, details: {}, errors: [] },
      { gate: "b", pass: true, score: 1, details: {}, errors: [] },
    ]),
    true
  );
});

test("gateFromArray returns false when any fails", () => {
  assert.equal(
    gateFromArray([
      { gate: "a", pass: true },
      { gate: "b", pass: false },
    ]),
    false
  );
});

test("createMultiGateRunner with default gates (no args)", () => {
  const runner = createMultiGateRunner();
  const results = runner.runGates({});
  assert.equal(results.length, 6);
  assert.deepEqual(
    results.map((r) => r.gate),
    GATE_NAMES
  );
});

test("passing context to gates", () => {
  let receivedContext = null;
  const routeGate = (ctx) => {
    receivedContext = ctx;
    return { gate: "route", pass: true, score: 1, details: {}, errors: [] };
  };
  const runner = createMultiGateRunner([routeGate]);
  runner.runGates({ asset_id: "test-123", policy: { id: "p1" } });
  assert.equal(receivedContext.asset_id, "test-123");
  assert.equal(receivedContext.policy.id, "p1");
});

test("runAll aggregates results", () => {
  const passGate = () => ({ gate: "g1", pass: true, score: 1, details: {}, errors: [] });
  const failGate = () => ({ gate: "g2", pass: false, score: 0, details: {}, errors: ["e"] });
  const runner = createMultiGateRunner([passGate, failGate]);
  const report = runner.runAll({});
  assert.equal(report.overall, "fail");
  assert.equal(report.result_count, 2);
  assert.deepEqual(report.failed_gates, ["g2"]);
});
