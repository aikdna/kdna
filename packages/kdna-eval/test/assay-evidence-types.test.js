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
  createReplayEngine,
  runClusterAssay,
  runClusterReplay,
} from "@aikdna/kdna-eval";
import type { CreateAssayFixtureOptions } from "@aikdna/kdna-eval/assay";
import type { CreateClusterFixtureOptions } from "@aikdna/kdna-eval/cluster-assay";

const assayOptions: CreateAssayFixtureOptions = {
  category: "positive_target",
  task: "Review the release evidence",
  expected: { answer: "hold" },
};
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
const replay = runClusterReplay(createReplayEngine(), [clusterFixture]);
void profile; void fixture; void ledger; void assay; void replay;

if (false) {
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
