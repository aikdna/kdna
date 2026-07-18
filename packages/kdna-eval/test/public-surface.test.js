const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { test } = require("node:test");
const ts = require("typescript");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const TYPES_PATH = path.join(PACKAGE_ROOT, "src", "types.d.ts");

const EXPECTED_ROOT_VALUE_EXPORTS = Object.freeze([
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
]);

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
    .filter((symbol) => (symbol.flags & ts.SymbolFlags.Value) !== 0)
    .map((symbol) => symbol.getName());
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: options.env || process.env,
    shell: false,
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  return result.stdout;
}

test("CommonJS, ESM, and TypeScript expose the exact root value surface", async () => {
  const commonJsExports = Object.keys(require("../src/index.js"));
  const esmModule = await import(pathToFileURL(path.join(PACKAGE_ROOT, "src", "index.mjs")).href);
  const esmExports = Object.keys(esmModule);
  const typeExports = declarationValueExports(TYPES_PATH);

  assert.equal(EXPECTED_ROOT_VALUE_EXPORTS.length, 59);
  assertExactSurface("CommonJS", EXPECTED_ROOT_VALUE_EXPORTS, commonJsExports);
  assertExactSurface("ESM", EXPECTED_ROOT_VALUE_EXPORTS, esmExports);
  assertExactSurface("TypeScript", EXPECTED_ROOT_VALUE_EXPORTS, typeExports);
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
});

test("the packed package compiles and executes every root value export from TypeScript", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "kdna-eval-types-"));
  try {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const packJson = run(
      npm,
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
    run(
      npm,
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

    const importList = EXPECTED_ROOT_VALUE_EXPORTS.join(",\n  ");
    const valueList = EXPECTED_ROOT_VALUE_EXPORTS.join(",\n  ");
    const consumerSource = `import {\n  ${importList}\n} from "@aikdna/kdna-eval";\n\nconst policies = {\n  review: { operation: "review", loadProfile: "compact" as const, domains: [] },\n};\nconst consumption = createConsumptionRunner({ policies, budgetProfile: "interactive" });\nconst gateRunner = createMultiGateRunner(["route"]);\nconst replay = createReplayEngine();\nconst cost = createCostTracker("interactive");\nconst routeCard = loadRouteCard({\n  route_card: "0.1.0",\n  domain_id: "example",\n  role: "primary",\n});\nif (!routeCard.valid || !routeCard.card) throw new Error("route card did not load");\nconst appliedPolicies = applyRouteCard(routeCard.card, policies);\nconst consumerIndex = loadConsumerIndex({ consumer_index: "0.1.0", entries: [] });\nif (!consumerIndex.valid || !consumerIndex.index) throw new Error("consumer index did not load");\nconst resolution = resolveConsumerIndex(consumerIndex.index, "review", "example");\nreplay.compareRuns({ results: [] }, { results: [] });\ngateRunner.runGates({});\nconsumption.cost({ id: "example", text: "bounded" }, {});\ncost.getCostReport();\nvoid appliedPolicies;\nvoid resolution;\n\nconst values = [\n  ${valueList}\n];\nif (values.some((value) => value === undefined)) {\n  throw new Error("undefined root export");\n}\n`;
    fs.writeFileSync(path.join(consumerRoot, "consumer.mts"), consumerSource);
    fs.writeFileSync(path.join(consumerRoot, "consumer.cts"), consumerSource);
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
    run(process.execPath, [path.join(typescriptRoot, "bin", "tsc"), "-p", "tsconfig.json"], {
      cwd: consumerRoot,
    });
    run(process.execPath, [path.join("dist", "consumer.mjs")], { cwd: consumerRoot });
    run(process.execPath, [path.join("dist", "consumer.cjs")], { cwd: consumerRoot });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
