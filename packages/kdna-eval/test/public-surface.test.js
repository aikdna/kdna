const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { test } = require("node:test");
const ts = require("typescript");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const PACKAGE_MANIFEST = require("../package.json");
const PACKAGE_NAME = PACKAGE_MANIFEST.name;

const EXPECTED_VALUE_EXPORTS = Object.freeze({
  ".": Object.freeze([
    "BASELINE_ARMS",
    "BUDGET_PROFILES",
    "CLASSIFICATION_LEVELS",
    "CLUSTER_COMPARISON_ARMS",
    "CLUSTER_GATES",
    "COMPARISON_ARM_DESCRIPTIONS",
    "DEFAULT_SCORE",
    "FIXTURE_CATEGORIES",
    "GATE_NAMES",
    "REPLAY_MODES",
    "SCORE_MAX",
    "SCORE_MIN",
    "VALID_STATUSES",
    "aggregateGates",
    "applyRouteCard",
    "behavioralGate",
    "clampDelta",
    "classifyAsset",
    "computeComposite",
    "createAdvisorRelationLedger",
    "createAllBaselineArms",
    "createAssayProfile",
    "createBaselineArm",
    "createClusterFixture",
    "createConsumptionRunner",
    "createCostTracker",
    "createEvaluator",
    "createFixture",
    "createMultiGateRunner",
    "createReplayEngine",
    "detectContamination",
    "detectRegressions",
    "economicsGate",
    "evaluateAxioms",
    "evaluateCandidates",
    "evaluateCondition",
    "evaluateNonApplicable",
    "extractRules",
    "extractThresholds",
    "gateFromArray",
    "generateEvidenceClaim",
    "getPath",
    "hashInput",
    "isTrusted",
    "loadConsumerIndex",
    "loadRouteCard",
    "productGate",
    "recordAdvisorDecision",
    "resolveConsumerIndex",
    "runAssay",
    "runClusterAssay",
    "runClusterReplay",
    "scoreJudgment",
    "structuralGate",
    "trustGate",
    "validateConsumerIndex",
    "validateFixtureSet",
    "validateRouteCard",
    "validateWeight",
  ]),
  "./loader": Object.freeze([
    "KDNA_DIR",
    "listDomains",
    "listPersonas",
    "loadDomainFromData",
    "loadDomainFromFile",
    "loadDomains",
    "loadFlatDomainFromData",
    "loadFlatDomainFromFile",
    "loadFlatDomains",
    "loadPersona",
    "validateDomain",
    "validatePersona",
  ]),
  "./route": Object.freeze(["getRoutePolicy", "resolveDomains"]),
  "./replay": Object.freeze([
    "REPLAY_MODES",
    "createReplayEngine",
    "detectRegressions",
    "hashInput",
  ]),
  "./gates": Object.freeze([
    "GATE_NAMES",
    "aggregateGates",
    "createMultiGateRunner",
    "gateFromArray",
  ]),
  "./cost": Object.freeze(["BUDGET_PROFILES", "createCostTracker"]),
  "./consume": Object.freeze(["createConsumptionRunner"]),
  "./route-card": Object.freeze(["applyRouteCard", "loadRouteCard", "validateRouteCard"]),
  "./consumer-index": Object.freeze([
    "VALID_STATUSES",
    "isTrusted",
    "loadConsumerIndex",
    "resolveConsumerIndex",
    "validateConsumerIndex",
  ]),
  "./assay": Object.freeze([
    "BASELINE_ARMS",
    "CLASSIFICATION_LEVELS",
    "FIXTURE_CATEGORIES",
    "classifyAsset",
    "createAllBaselineArms",
    "createAssayProfile",
    "createBaselineArm",
    "createFixture",
    "detectContamination",
    "evaluateNonApplicable",
    "generateEvidenceClaim",
    "runAssay",
    "scoreJudgment",
    "validateFixtureSet",
  ]),
  "./cluster-assay": Object.freeze([
    "CLUSTER_COMPARISON_ARMS",
    "CLUSTER_GATES",
    "COMPARISON_ARM_DESCRIPTIONS",
    "behavioralGate",
    "createAdvisorRelationLedger",
    "createClusterFixture",
    "economicsGate",
    "productGate",
    "recordAdvisorDecision",
    "runClusterAssay",
    "runClusterReplay",
    "structuralGate",
    "trustGate",
  ]),
});

const PUBLIC_EXPORT_PATHS = Object.freeze(Object.keys(EXPECTED_VALUE_EXPORTS));

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function assertExactSurface(label, expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = sortedUnique(expected.filter((name) => !actualSet.has(name)));
  const unexpected = sortedUnique(actual.filter((name) => !expectedSet.has(name)));
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(
      `${label} public surface mismatch; missing=[${missing.join(",")}]; unexpected=[${unexpected.join(",")}]`,
    );
  }
}

function assertSameFile(actualPath, expectedPath) {
  const actual = fs.statSync(actualPath, { bigint: true });
  const expected = fs.statSync(expectedPath, { bigint: true });
  assert.ok(actual.isFile(), "resolved declaration must be a file");
  assert.ok(expected.isFile(), "export declaration target must be a file");
  assert.equal(actual.dev, expected.dev, "resolved declaration is on a different device");
  assert.equal(actual.ino, expected.ino, "resolved declaration is a different file");
}

function formatDiagnostics(diagnostics) {
  return diagnostics
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (!diagnostic.file || diagnostic.start == null) return `TS${diagnostic.code}: ${message}`;
      const location = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return `${diagnostic.file.fileName}:${location.line + 1}:${location.character + 1} TS${diagnostic.code}: ${message}`;
    })
    .join("\n");
}

function declarationValueExports(typesPath) {
  const program = ts.createProgram([typesPath], {
    lib: ["lib.es2022.d.ts"],
    noEmit: true,
    skipLibCheck: false,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    types: [],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, formatDiagnostics(diagnostics));

  const sourceFile = program.getSourceFile(typesPath);
  assert.ok(sourceFile, `TypeScript did not load ${typesPath}`);
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  assert.ok(moduleSymbol, `TypeScript did not create a module symbol for ${typesPath}`);

  return checker
    .getExportsOfModule(moduleSymbol)
    .filter((symbol) => {
      const target =
        (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol;
      return (target.flags & ts.SymbolFlags.Value) !== 0;
    })
    .map((symbol) => symbol.getName());
}

function packageSpecifier(exportPath) {
  return exportPath === "." ? PACKAGE_NAME : `${PACKAGE_NAME}/${exportPath.slice(2)}`;
}

function installedDeclarationPath(consumerRoot, exportPath) {
  const containingFile = path.join(consumerRoot, "consumer.mts");
  const resolved = ts.resolveModuleName(
    packageSpecifier(exportPath),
    containingFile,
    {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      target: ts.ScriptTarget.ES2022,
    },
    ts.sys,
  ).resolvedModule;
  assert.ok(resolved, `TypeScript could not resolve ${packageSpecifier(exportPath)}`);
  return resolved.resolvedFileName;
}

function runtimeSurfaceSource(moduleStyle) {
  const entries = PUBLIC_EXPORT_PATHS.map((exportPath) => [
    packageSpecifier(exportPath),
    EXPECTED_VALUE_EXPORTS[exportPath],
  ]);
  const load =
    moduleStyle === "esm"
      ? "const loaded = await import(specifier);"
      : "const loaded = require(specifier);";
  return `const entries = ${JSON.stringify(entries)};
for (const [specifier, expected] of entries) {
  ${load}
  const actual = Object.keys(loaded).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(\`${moduleStyle} packed surface mismatch for \${specifier}; expected=\${wanted}; actual=\${actual}\`);
  }
  if (${JSON.stringify([PACKAGE_NAME, `${PACKAGE_NAME}/cluster-assay`])}.includes(specifier)) {
    if (loaded.economicsGate().pass !== false || loaded.economicsGate({}, {}).pass !== false) {
      throw new Error(\`${moduleStyle} packed \${specifier} economicsGate did not fail closed\`);
    }
    if (loaded.behavioralGate({ mean_score: "4" }, { mean_score: "3" }).pass !== false ||
        loaded.productGate({}, {
          description: "Complete description",
          domains: [{ load_condition: "one" }, { load_condition: "two" }],
          composition: { strategy: 42 },
        }).pass !== false) {
      throw new Error(\`${moduleStyle} packed \${specifier} standalone gates accepted malformed evidence\`);
    }
    const blocked = loaded.runClusterAssay({
      plan: {
        plan_version: "0.9.0",
        plan_id: "plan_0000000000000001",
        mode: "cluster",
        cluster_ref: { cluster_id: "@aikdna/launch-decision" },
        task: { summary: "No qualified primary" },
        load_plan_ref: { status: "blocked" },
        applicability: { decision: "blocked", confidence: "none" },
        projection_ref: { shape: "compact" },
        budget: { profile: "interactive", max_assets: 3, assets_consumed: 0 },
        trace_policy: { emit: ["decision"], storage: "ephemeral" },
        composition_policy_ref: { strategy: "signal_based" },
      },
      fixtures: [{
        fixture_id: "packed-blocked",
        task: "No qualified primary",
        expected_primary: "none",
        expected_advisors: [],
        expected_rejected: [],
        expected_conflicts: 0,
      }],
    });
    if (blocked.plan_status !== "blocked" || blocked.verdict.overall !== "fail" ||
        blocked.verdict.failed_evidence.includes("cluster_plan") ||
        Object.values(blocked.gates).some((gate) => gate.pass === true)) {
      throw new Error(\`${moduleStyle} packed \${specifier} blocked plan diagnostic drifted\`);
    }
  }
  if (${JSON.stringify([PACKAGE_NAME, `${PACKAGE_NAME}/replay`])}.includes(specifier)) {
    const engine = loaded.createReplayEngine();
    const fixtures = [{ input: { id: 42 }, pass: true }, { id: "", pass: true }];
    const first = engine.replayRun("fresh", { fixtures });
    const second = engine.replayRun("fresh", { fixtures });
    if (first.results.some((result) => typeof result.id !== "string" || result.id.length === 0) ||
        JSON.stringify(first.results.map((result) => result.id)) !==
          JSON.stringify(second.results.map((result) => result.id))) {
      throw new Error(\`${moduleStyle} packed \${specifier} replay IDs are not stable strings\`);
    }
  }
  if (${JSON.stringify([PACKAGE_NAME, `${PACKAGE_NAME}/gates`])}.includes(specifier)) {
    const errors = loaded.createMultiGateRunner([() => { throw { code: "boom" }; }])
      .runGates({})[0].errors;
    if (errors.length !== 1 || typeof errors[0] !== "string") {
      throw new Error(\`${moduleStyle} packed \${specifier} gate errors violated string[]\`);
    }
    const invalidRunner = loaded.createMultiGateRunner([() => ({ pass: true }), () => undefined]);
    if (invalidRunner.runAll({}).overall !== "fail" ||
        invalidRunner.runGates({}).some((result) => result.pass === true)) {
      throw new Error(\`${moduleStyle} packed \${specifier} accepted malformed custom results\`);
    }
    let accessorReads = 0;
    const hostileResult = { gate: "hostile", score: 1, details: {}, errors: [] };
    Object.defineProperty(hostileResult, "pass", {
      enumerable: true,
      get() { accessorReads++; return true; },
    });
    const hostileAggregate = loaded.createMultiGateRunner([() => hostileResult]).runAll({});
    const directHostileAggregate = loaded.aggregateGates([hostileResult]);
    if (accessorReads !== 0 || hostileAggregate.overall !== "fail" ||
        directHostileAggregate.overall !== "fail" || loaded.gateFromArray([hostileResult]) !== false ||
        hostileAggregate.results[0].pass !== false ||
        hostileAggregate.results[0].errors.some((error) => typeof error !== "string")) {
      throw new Error(\`${moduleStyle} packed \${specifier} read an accessor GateResult\`);
    }
    let proxyTraps = 0;
    const proxyResult = new Proxy(
      { gate: "proxy", pass: true, score: 1, details: {}, errors: [] },
      {
        get() { proxyTraps++; return true; },
        getOwnPropertyDescriptor() { proxyTraps++; return undefined; },
        getPrototypeOf() { proxyTraps++; return Object.prototype; },
        ownKeys() { proxyTraps++; return []; },
      },
    );
    if (loaded.createMultiGateRunner([() => proxyResult]).runAll({}).overall !== "fail" ||
        loaded.aggregateGates([proxyResult]).overall !== "fail" ||
        loaded.gateFromArray([proxyResult]) !== false || proxyTraps !== 0) {
      throw new Error(\`${moduleStyle} packed \${specifier} inspected a Proxy GateResult\`);
    }
  }
}
`;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: options.env || process.env,
    shell: options.shell || false,
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  return result.stdout;
}

function runNpm(args, options = {}) {
  if (process.env.npm_execpath) {
    return run(process.execPath, [process.env.npm_execpath, ...args], options);
  }
  return run(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    ...options,
    shell: process.platform === "win32",
  });
}

test("CommonJS, ESM, and TypeScript expose each exact public value surface", async () => {
  assert.equal(EXPECTED_VALUE_EXPORTS["."].length, 59);
  assert.equal(PUBLIC_EXPORT_PATHS.length, 11);

  for (const exportPath of PUBLIC_EXPORT_PATHS) {
    const metadata = PACKAGE_MANIFEST.exports[exportPath];
    assert.ok(metadata && typeof metadata === "object", `missing metadata for ${exportPath}`);
    const commonJsExports = Object.keys(require(path.join(PACKAGE_ROOT, metadata.require)));
    const esmModule = await import(pathToFileURL(path.join(PACKAGE_ROOT, metadata.import)).href);
    const typeExports = declarationValueExports(path.join(PACKAGE_ROOT, metadata.types));
    const expected = EXPECTED_VALUE_EXPORTS[exportPath];

    assertExactSurface(`${exportPath} CommonJS`, expected, commonJsExports);
    assertExactSurface(`${exportPath} ESM`, expected, Object.keys(esmModule));
    assertExactSurface(`${exportPath} TypeScript`, expected, typeExports);
  }
});

test("local root and subpaths preserve fail-closed strong returns in CommonJS and ESM", async () => {
  async function loadBoth(exportPath) {
    const metadata = PACKAGE_MANIFEST.exports[exportPath];
    return [
      require(path.join(PACKAGE_ROOT, metadata.require)),
      await import(pathToFileURL(path.join(PACKAGE_ROOT, metadata.import)).href),
    ];
  }

  for (const loaded of [
    ...(await loadBoth(".")),
    ...(await loadBoth("./cluster-assay")),
  ]) {
    assert.equal(loaded.economicsGate().pass, false);
    assert.equal(loaded.economicsGate({}, {}).pass, false);
    assert.equal(loaded.behavioralGate({ mean_score: "4" }, { mean_score: "3" }).pass, false);
    assert.equal(loaded.productGate({}, {
      description: "Complete description",
      domains: [{ load_condition: "one" }, { load_condition: "two" }],
      composition: { strategy: 42 },
    }).pass, false);
    assert.equal(loaded.runClusterAssay().verdict.overall, "fail");
    assert.equal(loaded.runClusterAssay({}).verdict.overall, "fail");
    const blocked = loaded.runClusterAssay({
      plan: require("../../../conformance/ecosystem-profile-0.9/golden/cluster-blocked-plan.json"),
      fixtures: [{
        fixture_id: "local-blocked",
        task: "No qualified primary",
        expected_primary: "none",
        expected_advisors: [],
        expected_rejected: [],
        expected_conflicts: 0,
      }],
    });
    assert.equal(blocked.plan_status, "blocked");
    assert.equal(blocked.verdict.overall, "fail");
    assert.ok(!blocked.verdict.failed_evidence.includes("cluster_plan"));
    assert.ok(Object.values(blocked.gates).every((gate) => gate.pass !== true));
  }

  for (const loaded of [
    ...(await loadBoth(".")),
    ...(await loadBoth("./replay")),
  ]) {
    const fixtures = [{ input: { id: 42 }, pass: true }, { id: "", pass: true }];
    const engine = loaded.createReplayEngine();
    const first = engine.replayRun("fresh", { fixtures });
    const second = engine.replayRun("fresh", { fixtures });
    assert.deepEqual(first.results.map((result) => result.id), second.results.map((result) => result.id));
    assert.ok(first.results.every((result) => typeof result.id === "string" && result.id.length > 0));
  }

  for (const loaded of [
    ...(await loadBoth(".")),
    ...(await loadBoth("./gates")),
  ]) {
    const results = loaded.createMultiGateRunner([
      () => { throw "boom"; },
      () => { throw { code: "OBJECT_THROW" }; },
      () => { throw undefined; },
    ]).runGates({});
    assert.ok(results.every((result) => result.pass === false));
    assert.ok(results.every((result) => result.errors.every((error) => typeof error === "string")));
    const invalidRunner = loaded.createMultiGateRunner([() => ({ pass: true }), () => undefined]);
    assert.equal(invalidRunner.runAll({}).overall, "fail");
    assert.ok(invalidRunner.runGates({}).every((result) => result.pass === false));
    let reads = 0;
    const hostileResult = { gate: "hostile", score: 1, details: {}, errors: [] };
    Object.defineProperty(hostileResult, "pass", {
      enumerable: true,
      get() { reads++; return true; },
    });
    const hostileAggregate = loaded.createMultiGateRunner([() => hostileResult]).runAll({});
    const directHostileAggregate = loaded.aggregateGates([hostileResult]);
    assert.equal(reads, 0);
    assert.equal(hostileAggregate.overall, "fail");
    assert.equal(directHostileAggregate.overall, "fail");
    assert.equal(loaded.gateFromArray([hostileResult]), false);
    assert.equal(hostileAggregate.results[0].pass, false);
    assert.ok(hostileAggregate.results[0].errors.every((error) => typeof error === "string"));
    let traps = 0;
    const proxyResult = new Proxy(
      { gate: "proxy", pass: true, score: 1, details: {}, errors: [] },
      {
        get() { traps++; return true; },
        getOwnPropertyDescriptor() { traps++; return undefined; },
        getPrototypeOf() { traps++; return Object.prototype; },
        ownKeys() { traps++; return []; },
      },
    );
    assert.equal(loaded.createMultiGateRunner([() => proxyResult]).runAll({}).overall, "fail");
    assert.equal(loaded.aggregateGates([proxyResult]).overall, "fail");
    assert.equal(loaded.gateFromArray([proxyResult]), false);
    assert.equal(traps, 0);
  }
});

test("public-surface guard rejects hostile names and accepts reordered sets", () => {
  assert.throws(
    () => assertExactSurface("hostile-missing", ["alpha", "beta"], ["alpha"]),
    /missing=\[beta\]; unexpected=\[\]/,
  );
  assert.throws(
    () => assertExactSurface("hostile-extra", ["alpha"], ["alpha", "gamma"]),
    /missing=\[\]; unexpected=\[gamma\]/,
  );
  assert.doesNotThrow(() => assertExactSurface("same-set", ["beta", "alpha"], ["alpha", "beta"]));
  assert.doesNotThrow(() => assertSameFile(__filename, fs.realpathSync(__filename)));
  assert.throws(
    () => assertSameFile(__filename, path.join(PACKAGE_ROOT, "package.json")),
    /different file/,
  );
});

test("the packed package preserves every CJS, ESM, and TypeScript public surface", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "kdna-eval-types-"));
  try {
    const packJson = runNpm(
      ["pack", "--json", "--ignore-scripts", "--pack-destination", tempRoot],
      { cwd: PACKAGE_ROOT },
    );
    const packResult = JSON.parse(packJson);
    assert.equal(packResult.length, 1);
    assert.equal(packResult[0].name, "@aikdna/kdna-eval");
    assert.equal(packResult[0].version, "0.3.2");
    const tarball = path.join(tempRoot, packResult[0].filename);
    assert.ok(fs.existsSync(tarball), `missing packed artifact ${tarball}`);

    const consumerRoot = path.join(tempRoot, "consumer");
    fs.mkdirSync(consumerRoot);
    runNpm(
      [
        "install",
        "--offline",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--package-lock=false",
        "--prefix",
        consumerRoot,
        tarball,
      ],
      { cwd: tempRoot },
    );

    const installedPackage = JSON.parse(
      fs.readFileSync(
        path.join(consumerRoot, "node_modules", "@aikdna", "kdna-eval", "package.json"),
        "utf8",
      ),
    );
    assert.equal(installedPackage.name, "@aikdna/kdna-eval");
    assert.equal(installedPackage.version, "0.3.2");

    const aliases = Object.fromEntries(
      PUBLIC_EXPORT_PATHS.map((exportPath, index) => [exportPath, `surface${index}`]),
    );
    const namespaceImports = PUBLIC_EXPORT_PATHS.map(
      (exportPath) =>
        `import * as ${aliases[exportPath]} from "${packageSpecifier(exportPath)}";`,
    ).join("\n");
    const valueList = PUBLIC_EXPORT_PATHS.flatMap((exportPath) =>
      EXPECTED_VALUE_EXPORTS[exportPath].map((name) => `${aliases[exportPath]}.${name}`),
    ).join(",\n  ");
const root = aliases["."];
const loaderModule = aliases["./loader"];
const costModule = aliases["./cost"];
const replayModule = aliases["./replay"];
const gatesModule = aliases["./gates"];
const clusterModule = aliases["./cluster-assay"];
const routeCardModule = aliases["./route-card"];
const consumerIndexModule = aliases["./consumer-index"];
const consumerSource = `${namespaceImports}

function expectThrows(fn: () => unknown, label: string): void {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error(\`\${label} did not fail closed\`);
}

const validatedDomain = ${loaderModule}.validateDomain({
  id: "typed-domain",
  schemaVersion: 1,
  x_eval: {
    rules: [{
      id: "rule",
      dimensions: ["quality"],
      condition: { path: "score", op: "gte", value: 1 },
      effect: { value: 1 },
    }],
  },
});
validatedDomain.id.toUpperCase();
validatedDomain.schemaVersion.toFixed(0);
const validatedPersona = ${loaderModule}.validatePersona({
  id: "typed-persona",
  schemaVersion: 1,
  name: "Typed Persona",
  description: "Strict package consumer persona.",
  ruleOfSix: { quality: 1 },
  domains: [{ id: "typed-domain", weight: 1 }],
  preferences: {},
});
validatedPersona.name.toUpperCase();
expectThrows(
  () => ${loaderModule}.validateDomain({ id: 42, schemaVersion: "one" }),
  "loader subpath domain validator",
);
expectThrows(
  () => ${loaderModule}.validatePersona({ id: "bad", schemaVersion: 1 }),
  "loader subpath persona validator",
);

const policies = {
  review: { operation: "review", loadProfile: "compact" as const, domains: [] },
};
const consumption = ${root}.createConsumptionRunner({ policies, budgetProfile: "interactive" });
const gateRunner = ${root}.createMultiGateRunner(["route"]);
const thrownGateErrors = ${root}.createMultiGateRunner([() => { throw "boom"; }]).runGates({})[0].errors;
const thrownSubpathGateErrors = ${gatesModule}.createMultiGateRunner([() => { throw { code: "boom" }; }]).runGates({})[0].errors;
if (typeof thrownGateErrors[0] !== "string" || typeof thrownSubpathGateErrors[0] !== "string") {
  throw new Error("packed gate runner violated its string[] return type");
}
const partialGate = (() => ({ pass: true })) as unknown as ${root}.GateDefinition;
const undefinedGate = (() => undefined) as unknown as ${root}.GateDefinition;
for (const invalidRunner of [
  ${root}.createMultiGateRunner([partialGate, undefinedGate]),
  ${gatesModule}.createMultiGateRunner([partialGate, undefinedGate]),
]) {
  if (invalidRunner.runAll({}).overall !== "fail" ||
      invalidRunner.runGates({}).some((result) => result.pass === true)) {
    throw new Error("packed gate runner accepted malformed custom results");
  }
}
let packedGateAccessorReads = 0;
const hostileGateResult = { gate: "hostile", score: 1, details: {}, errors: [] };
Object.defineProperty(hostileGateResult, "pass", {
  enumerable: true,
  get() { packedGateAccessorReads++; return true; },
});
const hostileGate = (() => hostileGateResult) as unknown as ${root}.GateDefinition;
for (const hostileRunner of [
  ${root}.createMultiGateRunner([hostileGate]),
  ${gatesModule}.createMultiGateRunner([hostileGate]),
]) {
  const hostileAggregate = hostileRunner.runAll({});
  if (hostileAggregate.overall !== "fail" || hostileAggregate.results[0].pass !== false ||
      hostileAggregate.results[0].errors.some((error) => typeof error !== "string")) {
    throw new Error("packed gate runner accepted an accessor GateResult");
  }
}
if (packedGateAccessorReads !== 0) {
  throw new Error("packed gate runner executed an accessor GateResult");
}
let packedProxyTraps = 0;
const packedProxyResult = new Proxy(
  { gate: "proxy", pass: true, score: 1, details: {}, errors: [] },
  {
    get() { packedProxyTraps++; return true; },
    getOwnPropertyDescriptor() { packedProxyTraps++; return undefined; },
    getPrototypeOf() { packedProxyTraps++; return Object.prototype; },
    ownKeys() { packedProxyTraps++; return []; },
  },
) as ${root}.GateResult;
for (const gateApi of [${root}, ${gatesModule}]) {
  const directAccessorAggregate = gateApi.aggregateGates([
    hostileGateResult as unknown as ${root}.GateResult,
  ]);
  if (directAccessorAggregate.overall !== "fail" ||
      gateApi.gateFromArray([hostileGateResult as unknown as ${root}.GateResult]) !== false ||
      gateApi.createMultiGateRunner([(() => packedProxyResult) as ${root}.GateDefinition])
        .runAll({}).overall !== "fail" ||
      gateApi.aggregateGates([packedProxyResult]).overall !== "fail" ||
      gateApi.gateFromArray([packedProxyResult]) !== false) {
    throw new Error("packed gate API accepted hostile direct results");
  }
}
if (packedGateAccessorReads !== 0 || packedProxyTraps !== 0) {
  throw new Error("packed gate API inspected accessor or Proxy results");
}
const replay = ${root}.createReplayEngine();
const replayRun = replay.replayRun("fresh", { fixtures: [{ input: "test" }] });
if (replayRun.summary.total !== 1) throw new Error("string replay input was not evaluated");
if (replayRun.summary.passed !== 0 || replayRun.summary.incomplete !== 1) {
  throw new Error("replay input without explicit pass evidence did not fail closed");
}
const numericReplayFixtures: ${root}.ReplayFixture[] = [
  { input: { id: 42 }, pass: true },
  { id: "", pass: true },
];
for (const replayEngine of [${root}.createReplayEngine(), ${replayModule}.createReplayEngine()]) {
  const first = replayEngine.replayRun("fresh", { fixtures: numericReplayFixtures });
  const second = replayEngine.replayRun("fresh", { fixtures: numericReplayFixtures });
  if (first.results.some((result) => typeof result.id !== "string" || result.id.length === 0) ||
      JSON.stringify(first.results.map((result) => result.id)) !==
        JSON.stringify(second.results.map((result) => result.id))) {
    throw new Error("packed replay result IDs are not stable strings");
  }
}
const assayFixtureOptions: ${aliases["./assay"]}.CreateAssayFixtureOptions = {
  category: "positive_target",
  task: "Review the packed release evidence",
  expected: { answer: "hold" },
};
const assayProfile = ${root}.createAssayProfile();
const assayFixture = ${root}.createFixture(assayFixtureOptions);
let assayRunnerCalls = 0;
void ${root}.runAssay({
  profile: assayProfile,
  fixtures: [assayFixture],
  runner: () => { assayRunnerCalls++; return { answer: "must not run" }; },
}).then((report) => {
  if (assayRunnerCalls !== 0 || report.overall_verdict !== "fail" || report.result_count !== 0) {
    throw new Error("invalid packed assay dataset did not fail before runner invocation");
  }
  const rootClaim = ${root}.generateEvidenceClaim(report, {
    traceId: "trace_packed_root_assay",
  });
  const subpathClaim = ${aliases["./assay"]}.generateEvidenceClaim(report, {
    traceId: "trace_packed_subpath_assay",
  });
  if (rootClaim.trace_id !== "trace_packed_root_assay" ||
      subpathClaim.trace_id !== "trace_packed_subpath_assay") {
    throw new Error("packed EvidenceClaim did not preserve its required trace identity");
  }
});
const relaxedAssayProfile = ${root}.createAssayProfile({
  thresholds: {
    positive_target_min_count: 0,
    non_applicable_min_count: 0,
    adjacent_ambiguous_min_count: 0,
    high_risk_failure_min_count: 0,
    regression_min_count: 0,
    holdout_required: false,
  },
});
let baselineRunnerCalls = 0;
void ${root}.runAssay({
  profile: relaxedAssayProfile,
  fixtures: [assayFixture],
  baselineArms: [],
  runner: () => { baselineRunnerCalls++; return { answer: "must not run" }; },
}).then((report) => {
  if (baselineRunnerCalls !== 0 || report.overall_verdict !== "fail" ||
      !report.failed_thresholds.includes("baseline_arms")) {
    throw new Error("empty packed baseline arms did not fail before runner invocation");
  }
});
const decision = ${root}.recordAdvisorDecision("advisor", "approved");
const ledger = ${root}.createAdvisorRelationLedger(
  {
    cluster_ref: { cluster_id: "cluster" },
    selection: { advisors: [{ asset_id: "advisor" }] },
  },
  [decision],
);
if (ledger.summary.human_reviewed_count !== 1) throw new Error("advisor decision was not applied");
const clusterFixtureOptions: ${aliases["./cluster-assay"]}.CreateClusterFixtureOptions = {
  task: "Review the packed cluster evidence",
  expectedPrimary: "primary",
};
const clusterFixture = ${root}.createClusterFixture(clusterFixtureOptions);
const explicitReplayEngine: Pick<${root}.ReplayEngine, "replayRun"> = {
  replayRun(mode, options) {
    const results = (options?.fixtures || []).map((fixture) => ({
      id: String(fixture.id),
      score: 100,
      pass: true,
    }));
    return {
      mode,
      timestamp: new Date().toISOString(),
      inputHash: "packed-consumer",
      results,
      regressionFlags: [],
      summary: {
        total: results.length,
        passed: results.length,
        failed: 0,
        incomplete: 0,
        regressions: 0,
      },
    };
  },
};
const clusterReplay = ${root}.runClusterReplay(explicitReplayEngine, [clusterFixture]);
if (Object.keys(clusterReplay).length !== 5 ||
    Object.values(clusterReplay).some(result => result.status !== "completed" || result.passed !== 1)) {
  throw new Error("cluster replay did not preserve explicit packed pass evidence");
}
const clusterPlan: ${root}.ClusterAssayPlan = {
  applicability: { decision: "applies" },
  selection: { primary: { asset_id: "primary" }, advisors: [], rejected: [] },
  conflicts: [],
  budget: { max_tokens: 800, max_assets: 1, assets_consumed: 1 },
};
const clusterComparisons: ${root}.ClusterComparisonEvidence[] =
  ${root}.CLUSTER_COMPARISON_ARMS.map((arm) => ({
    arm,
    fixture_ids: [clusterFixture.fixture_id],
    mean_score: arm === "bounded_compose" ? 4 : (arm === "primary_only" ? 3 : 3.2),
    result_count: 1,
    critical_errors: 0,
  }));
const packedClusterAssay = ${root}.runClusterAssay({
  manifest: {
    cluster_id: "cluster",
    version: "0.1.0",
    description: "A complete packed Cluster Assay consumer.",
    domains: [{ load_condition: "Primary task matches." }, { load_condition: "Control task matches." }],
    composition: { strategy: "signal_based" },
  },
  plan: clusterPlan,
  executionCost: { tokens_used: 0, model_calls: 1 },
  comparisonArms: clusterComparisons,
  fixtures: [clusterFixture],
  assetsLoaded: [{
    asset_id: "primary",
    role: "primary",
    digest_verified: true,
    authorization: "public",
  }],
});
if (packedClusterAssay.verdict.overall !== "pass" ||
    packedClusterAssay.verdict.failed_evidence.length !== 0 ||
    packedClusterAssay.gates.economics.details?.tokens_used !== 0) {
  throw new Error("fully bound packed Cluster Assay did not pass with explicit zero-token evidence");
}
const defensiveRootEconomics = ${root}.economicsGate as unknown as (
  plan?: unknown,
  executionCost?: unknown,
) => ${root}.ClusterAssayGate;
const defensiveSubpathEconomics = ${clusterModule}.economicsGate as unknown as (
  plan?: unknown,
  executionCost?: unknown,
) => ${root}.ClusterAssayGate;
for (const gate of [defensiveRootEconomics, defensiveSubpathEconomics]) {
  if (gate().pass !== false || gate({}, {}).pass !== false) {
    throw new Error("packed standalone economics gate did not fail closed");
  }
}
for (const clusterApi of [${root}, ${clusterModule}]) {
  if (clusterApi.behavioralGate({ mean_score: "4" }, { mean_score: "3" }).pass !== false ||
      clusterApi.productGate({}, {
        description: "Complete description",
        domains: [{ load_condition: "one" }, { load_condition: "two" }],
        composition: { strategy: 42 },
      }).pass !== false) {
    throw new Error("packed standalone Cluster gates accepted malformed evidence");
  }
}
const blockedClusterPlan: ${root}.ClusterAssayPlan = {
  plan_version: "0.9.0",
  plan_id: "plan_0000000000000001",
  mode: "cluster",
  cluster_ref: { cluster_id: "@aikdna/launch-decision" },
  task: { summary: "No qualified primary" },
  load_plan_ref: { status: "blocked" },
  applicability: { decision: "blocked", confidence: "none" },
  projection_ref: { shape: "compact" },
  budget: { profile: "interactive", max_assets: 3, assets_consumed: 0 },
  trace_policy: { emit: ["decision"], storage: "ephemeral" },
  composition_policy_ref: { strategy: "signal_based" },
};
for (const run of [${root}.runClusterAssay, ${clusterModule}.runClusterAssay]) {
  const emptyReport = run();
  const emptyOptionsReport = run({});
  const blockedReport = run({ plan: blockedClusterPlan, fixtures: [clusterFixture] });
  if (emptyReport.verdict.overall !== "fail" || emptyOptionsReport.verdict.overall !== "fail" ||
      blockedReport.plan_status !== "blocked" || blockedReport.verdict.overall !== "fail" ||
      blockedReport.verdict.failed_evidence.includes("cluster_plan") ||
      Object.values(blockedReport.gates).some((gate) => gate.pass === true)) {
    throw new Error("packed Cluster Assay fail diagnostics drifted");
  }
}
expectThrows(
  () => ${root}.runClusterAssay({
    manifest: { cluster_id: 42 as unknown as string },
    fixtures: [clusterFixture],
  }),
  "cluster assay numeric manifest identifier",
);
expectThrows(
  () => ${root}.runClusterAssay({
    manifest: { domains: [{ load_condition: 42 as unknown as string }] },
    fixtures: [clusterFixture],
  }),
  "cluster assay numeric load condition",
);
if (false) {
  // @ts-expect-error assetId cannot be numeric
  ${root}.createAssayProfile({ assetId: 42 });
  // @ts-expect-error expected evidence is required
  ${root}.createFixture({ category: "positive_target", task: "missing expected" });
  // @ts-expect-error expectedPrimary is required
  ${root}.createClusterFixture({ task: "missing primary" });
  // @ts-expect-error cluster_id cannot be numeric
  ${root}.createAdvisorRelationLedger({ cluster_ref: { cluster_id: 42 } });
  // @ts-expect-error asset_id cannot be numeric
  ${root}.createAdvisorRelationLedger({ selection: { advisors: [{ asset_id: 42 }] } });
  // @ts-expect-error manifest cluster_id cannot be numeric
  ${root}.runClusterAssay({ manifest: { cluster_id: 42 }, fixtures: [clusterFixture] });
  // @ts-expect-error manifest load_condition cannot be numeric
  ${root}.runClusterAssay({ manifest: { domains: [{ load_condition: 42 }] }, fixtures: [clusterFixture] });
  ${root}.runClusterAssay({ fixtures: [clusterFixture], comparisonArms: [{
    // @ts-expect-error unknown comparison arms are not part of the seven-arm contract
    arm: "unknown", fixture_ids: [clusterFixture.fixture_id], mean_score: 3,
    result_count: 1, critical_errors: 0,
  }] });
  // @ts-expect-error a Cluster Assay plan requires explicit budget evidence
  ${root}.runClusterAssay({ fixtures: [clusterFixture], plan: {
    applicability: { decision: "applies" },
    selection: { primary: { asset_id: "primary" }, advisors: [], rejected: [] },
    conflicts: [],
  } });
  // @ts-expect-error standalone economics evidence arguments are required
  ${root}.economicsGate();
  // @ts-expect-error standalone economics evidence arguments are required
  ${clusterModule}.economicsGate();
  // @ts-expect-error blocked plans cannot contain an executable selection
  const invalidBlockedPlan: ${root}.ClusterAssayPlan = {
    applicability: { decision: "blocked" },
    selection: { primary: { asset_id: "primary" }, advisors: [], rejected: [] },
    budget: { profile: "interactive", max_assets: 3, assets_consumed: 0 },
  };
  void invalidBlockedPlan;
}
const regressions = ${root}.detectRegressions(
  [{ id: "f1", score: 50, pass: true }],
  { results: [{ id: "f1", score: 100, pass: true }] },
);
if (regressions.length !== 1) throw new Error("default score tolerance missed a regression");
const cost = ${costModule}.createCostTracker("code-review");
cost.trackAsset({ id: "domain-1", tokens: 700, chars: 1000 });
cost.trackAdvisor({ id: "system", tokens: 200, content: "..." });
const costReport = cost.getCostReport();
if (costReport.consumed.tokens !== 900 || costReport.consumed.chars !== 1003 || costReport.over_budget) {
  throw new Error("README cost example drifted");
}
const routeCard = ${routeCardModule}.loadRouteCard({
  route_card: "0.1.0",
  domain_id: "example",
  role: "primary",
});
if (!routeCard.valid || !routeCard.card) throw new Error("route card did not load");
const invalidRouteCard = ${routeCardModule}.validateRouteCard({
  route_card: "0.1.0",
  domain_id: "example",
  role: "primary",
  boundaries: { applies_when: [1] },
});
if (invalidRouteCard.valid || invalidRouteCard.card) {
  throw new Error("route-card subpath accepted a numeric boundary");
}
const appliedPolicies = ${routeCardModule}.applyRouteCard(routeCard.card, policies);
const consumerIndex = ${consumerIndexModule}.loadConsumerIndex({ consumer_index: "0.1.0", entries: [] });
if (!consumerIndex.valid || !consumerIndex.index) throw new Error("consumer index did not load");
const invalidConsumerIndex = ${consumerIndexModule}.validateConsumerIndex({
  consumer_index: "0.1.0",
  entries: [{
    domain_id: "example",
    status: "trusted_runtime",
    route_preference: { primary_for: {} },
  }],
});
if (invalidConsumerIndex.valid || invalidConsumerIndex.index) {
  throw new Error("consumer-index subpath accepted an object preference list");
}
const resolution = ${consumerIndexModule}.resolveConsumerIndex(consumerIndex.index, "review", "example");
replay.compareRuns({ results: [] }, { results: [] });
gateRunner.runGates({});
consumption.cost({ id: "example", text: "bounded" }, {});
void appliedPolicies;
void resolution;

const values = [
  ${valueList}
];
if (values.some((value) => value === undefined)) {
  throw new Error("undefined public export");
}
`;
    fs.writeFileSync(path.join(consumerRoot, "consumer.mts"), consumerSource);
    fs.writeFileSync(path.join(consumerRoot, "consumer.cts"), consumerSource);
    fs.writeFileSync(
      path.join(consumerRoot, "surface.mjs"),
      runtimeSurfaceSource("esm"),
    );
    fs.writeFileSync(
      path.join(consumerRoot, "surface.cjs"),
      runtimeSurfaceSource("cjs"),
    );
    fs.writeFileSync(
      path.join(consumerRoot, "tsconfig.json"),
      `${JSON.stringify(
        {
          compilerOptions: {
            module: "NodeNext",
            moduleResolution: "NodeNext",
            target: "ES2022",
            strict: true,
            skipLibCheck: false,
            outDir: "dist",
          },
          files: ["consumer.mts", "consumer.cts"],
        },
        null,
        2,
      )}\n`,
    );

    const typescriptRoot = path.dirname(require.resolve("typescript/package.json"));
    const installedPackageRoot = path.join(
      consumerRoot,
      "node_modules",
      "@aikdna",
      "kdna-eval",
    );
    for (const exportPath of PUBLIC_EXPORT_PATHS) {
      const declarationPath = installedDeclarationPath(consumerRoot, exportPath);
      const expectedDeclaration = path.resolve(
        installedPackageRoot,
        PACKAGE_MANIFEST.exports[exportPath].types,
      );
      assertSameFile(declarationPath, expectedDeclaration);
      assertExactSurface(
        `${exportPath} packed TypeScript`,
        EXPECTED_VALUE_EXPORTS[exportPath],
        declarationValueExports(declarationPath),
      );
    }
    run(process.execPath, [path.join(typescriptRoot, "bin", "tsc"), "-p", "tsconfig.json"], {
      cwd: consumerRoot,
    });
    run(process.execPath, ["surface.mjs"], { cwd: consumerRoot });
    run(process.execPath, ["surface.cjs"], { cwd: consumerRoot });
    run(process.execPath, [path.join("dist", "consumer.mjs")], { cwd: consumerRoot });
    run(process.execPath, [path.join("dist", "consumer.cjs")], { cwd: consumerRoot });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
