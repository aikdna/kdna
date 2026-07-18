const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const PACKAGE_ROOT = path.resolve(__dirname, "..");

test("strict consumers cannot construct invalid assay evidence identifiers or fixtures", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "kdna-eval-assay-types-"));
  try {
    const consumerPath = path.join(tempRoot, "consumer.ts");
    fs.writeFileSync(
      consumerPath,
      `import {
  createAdvisorRelationLedger,
  createAssayProfile,
  createClusterFixture,
  createFixture,
  createMultiGateRunner,
  createReplayEngine,
  economicsGate,
  generateEvidenceClaim,
  runClusterAssay,
  runClusterReplay,
} from "@aikdna/kdna-eval";
import type { CreateAssayFixtureOptions } from "@aikdna/kdna-eval/assay";
import {
  generateEvidenceClaim as generateSubpathEvidenceClaim,
} from "@aikdna/kdna-eval/assay";
import type {
  AssayReport,
  GenerateEvidenceClaimOptions,
} from "@aikdna/kdna-eval/assay";
import {
  economicsGate as subpathEconomicsGate,
} from "@aikdna/kdna-eval/cluster-assay";
import type {
  ClusterAssayPlan,
  CreateClusterFixtureOptions,
} from "@aikdna/kdna-eval/cluster-assay";
import { createMultiGateRunner as createSubpathGateRunner } from "@aikdna/kdna-eval/gates";
import { createReplayEngine as createSubpathReplayEngine } from "@aikdna/kdna-eval/replay";

const assayOptions: CreateAssayFixtureOptions = {
  category: "positive_target",
  task: "Review the release evidence",
  expected: { answer: "hold" },
};
declare const assayReport: AssayReport;
const evidenceClaimOptions: GenerateEvidenceClaimOptions = {
  traceId: "trace_0000000000000001",
  planId: "plan_0000000000000001",
};
const rootEvidenceClaim = generateEvidenceClaim(assayReport, evidenceClaimOptions);
const subpathEvidenceClaim = generateSubpathEvidenceClaim(assayReport, evidenceClaimOptions);
const clusterOptions: CreateClusterFixtureOptions = {
  task: "Review the cluster evidence",
  expectedPrimary: "@aikdna/primary",
};
const profile = createAssayProfile();
const fixture = createFixture(assayOptions);
const clusterFixture = createClusterFixture(clusterOptions);
const ledger = createAdvisorRelationLedger({
  cluster_ref: { cluster_id: "@aikdna/cluster" },
  selection: { primary: { asset_id: "@aikdna/primary" } },
});
const assay = runClusterAssay({ fixtures: [clusterFixture] });
const emptyAssay = runClusterAssay();
const emptyOptionsAssay = runClusterAssay({});
const blockedPlan: ClusterAssayPlan = {
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
const blockedAssay = runClusterAssay({ plan: blockedPlan, fixtures: [clusterFixture] });
if (blockedAssay.evidence_validation.loaded_assets.status === "blocked") {
  blockedAssay.plan_status.toUpperCase();
}
if (blockedPlan.applicability.decision === "blocked") {
  const consumed: 0 = blockedPlan.budget.assets_consumed;
  void consumed;
}
const numericReplay = createReplayEngine().replayRun("fresh", {
  fixtures: [{ input: { id: 42 }, pass: true }],
});
const numericSubpathReplay = createSubpathReplayEngine().replayRun("fresh", {
  fixtures: [{ input: { id: 42 }, pass: true }],
});
numericReplay.results[0].id.toUpperCase();
numericSubpathReplay.results[0].id.toUpperCase();
const gateErrors = createMultiGateRunner([() => { throw "boom"; }]).runGates({})[0].errors;
const subpathGateErrors = createSubpathGateRunner([() => { throw { code: "boom" }; }]).runGates({})[0].errors;
gateErrors[0].toUpperCase();
subpathGateErrors[0].toUpperCase();
const replay = runClusterReplay(createReplayEngine(), [clusterFixture]);
void profile; void fixture; void ledger; void assay; void emptyAssay; void emptyOptionsAssay;
void blockedAssay; void replay;
void rootEvidenceClaim; void subpathEvidenceClaim;

if (false) {
  // @ts-expect-error a real traceId is required
  generateEvidenceClaim(assayReport);
  // @ts-expect-error a real traceId is required
  generateSubpathEvidenceClaim(assayReport, {});
  // @ts-expect-error assetId cannot be numeric
  createAssayProfile({ assetId: 42 });
  // @ts-expect-error expected evidence is required
  createFixture({ category: "positive_target", task: "missing expected" });
  // @ts-expect-error expectedPrimary is required
  createClusterFixture({ task: "missing primary" });
  // @ts-expect-error cluster_id cannot be numeric
  createAdvisorRelationLedger({ cluster_ref: { cluster_id: 42 } });
  // @ts-expect-error asset_id cannot be numeric
  createAdvisorRelationLedger({ selection: { advisors: [{ asset_id: 42 }] } });
  // @ts-expect-error manifest cluster_id cannot be numeric
  runClusterAssay({ manifest: { cluster_id: 42 }, fixtures: [clusterFixture] });
  // @ts-expect-error manifest load_condition cannot be numeric
  runClusterAssay({ manifest: { domains: [{ load_condition: 42 }] }, fixtures: [clusterFixture] });
  runClusterAssay({ fixtures: [clusterFixture], comparisonArms: [{
    // @ts-expect-error unknown arm is outside the seven-arm comparison contract
    arm: "unknown", fixture_ids: [clusterFixture.fixture_id], mean_score: 3,
    result_count: 1, critical_errors: 0,
  }] });
  // @ts-expect-error budget evidence is required on a typed Cluster plan
  runClusterAssay({ fixtures: [clusterFixture], plan: {
    applicability: { decision: "applies" },
    selection: { primary: { asset_id: "primary" }, advisors: [], rejected: [] },
    conflicts: [],
  } });
  // @ts-expect-error blocked plans cannot contain an executable selection
  const invalidBlockedPlan: ClusterAssayPlan = {
    applicability: { decision: "blocked" },
    selection: { primary: { asset_id: "primary" }, advisors: [], rejected: [] },
    budget: { profile: "interactive", max_assets: 3, assets_consumed: 0 },
  };
  void invalidBlockedPlan;
  // @ts-expect-error standalone economics evidence arguments are required
  economicsGate();
  // @ts-expect-error standalone economics evidence arguments are required
  subpathEconomicsGate();
}
`,
    );

    const options = {
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      baseUrl: tempRoot,
      paths: {
        "@aikdna/kdna-eval": [path.join(PACKAGE_ROOT, "src/types.d.ts")],
        "@aikdna/kdna-eval/assay": [path.join(PACKAGE_ROOT, "src/assay.d.ts")],
        "@aikdna/kdna-eval/cluster-assay": [path.join(PACKAGE_ROOT, "src/cluster-assay.d.ts")],
        "@aikdna/kdna-eval/gates": [path.join(PACKAGE_ROOT, "src/gates.d.ts")],
        "@aikdna/kdna-eval/replay": [path.join(PACKAGE_ROOT, "src/replay.d.ts")],
      },
    };
    const program = ts.createProgram([consumerPath], options);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.deepEqual(
      diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")),
      [],
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
