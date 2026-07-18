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
const replay = ${root}.createReplayEngine();
const replayRun = replay.replayRun("fresh", { fixtures: [{ input: "test" }] });
if (replayRun.summary.total !== 1) throw new Error("string replay input was not evaluated");
if (replayRun.summary.passed !== 0 || replayRun.summary.incomplete !== 1) {
  throw new Error("replay input without explicit pass evidence did not fail closed");
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
