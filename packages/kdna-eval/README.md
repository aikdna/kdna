# @aikdna/kdna-eval

KDNA consumption evaluation framework — configurable scoring, multi-gate
gating, replay regression detection, and cost/budget tracking.

Complements `@aikdna/kdna-core` (loads and renders domains as prompt text)
by executing evaluation pipelines at runtime.

This package is **generic infrastructure** — it contains no built-in domains,
personas, or product-specific defaults. Those belong in the consuming
application.

## Consumption evaluation

`@aikdna/kdna-eval` also provides primitives for evaluating how an application
uses KDNA assets. These APIs help a runtime keep task selection, composition,
projection, cost, quality, and promotion decisions visible and testable.

| Module | Purpose |
| --- | --- |
| `./replay` | Run and compare named replay modes. |
| `./gates` | Combine independent runtime gates into one report. |
| `./cost` | Track context budgets and asset counts. |
| `./consume` | Reference route, compose, projection, quality, and promotion gates. |
| `./route-card` | Load and apply route-card sidecars. |
| `./consumer-index` | Load consumer-index sidecars with explicit enablement checks. |

These modules do not rank assets or certify their content. They provide
building blocks for a consuming application to apply its own policy and to
record the evidence behind that policy.

### Example

```js
const { createConsumptionRunner } = require("@aikdna/kdna-eval/consume");

const runtime = createConsumptionRunner({
  policies: myPolicies,
  budgetProfile: "interactive",
});

const route = runtime.route(asset, { task: "review" });
const cost = runtime.cost(asset, { advisors: [] });
```

For the command-line workflow, see the
[KDNA CLI Consumption Runtime guide](https://github.com/aikdna/kdna-cli/blob/main/docs/consumption-runtime.md).

## Quick Start

```js
const { createEvaluator } = require("@aikdna/kdna-eval");

const evaluator = createEvaluator({
  dimensions: ["clarity", "impact"],
  defaults: { clarity: 50, impact: 50 }
});

const rules = [
  { id: "length-bonus", dimensions: ["clarity"], condition: { path: "text.length", op: "gt", value: 20 }, effect: { value: 10 } }
];
const domain = { id: "my-domain", schemaVersion: 1, x_eval: { rules } };

const results = evaluator.score(
  [{ text: "A substantive segment about technology" }, { text: "short" }],
  [{ id: "my-domain", data: domain }]
);
```

## API

### Main entry (`@aikdna/kdna-eval`)

| Export | Description |
|---|---|
| `createEvaluator(options)` | Factory returning a configured evaluator with `score()` method |
| `evaluateCandidates(candidates, domains, options?)` | Score multiple candidates across multiple domains |
| `evaluateAxioms(candidate, rules, context?)` | Score a single candidate against one set of rules |
| `evaluateCondition(candidate, condition, context?)` | Match a single condition |
| `computeComposite(dimensions, weights?, dimNames?)` | Weighted dimension composite |
| `getPath(obj, pathStr)` | Dot-separated path navigation |
| `extractRules(domainData)` | Read `x_eval.rules` from domain (fallback to `axioms`) |
| **0.2.0:** `createReplayEngine(options)` | Replay engine with 5 modes (repair, holdout, fresh, candidate-sealed, new-sealed) |
| **0.2.0:** `createMultiGateRunner(gates)` | Multi-gate evaluation runner (route, compose, projection, cost, quality, promotion) |
| **0.2.0:** `createCostTracker(profile)` | Context budget tracking (tokens, chars, assets) |

### Loader (`@aikdna/kdna-eval/loader`)

Flat JSON file loading from `~/.kdna/` directories. For standard `.kdna`
ZIP container loading, use `@aikdna/kdna-core`'s `loadKDNA()`.

| Export | Description |
|---|---|
| `loadFlatDomainFromFile(fileName, kdnaDir?, defaults?)` | Load a flat JSON domain file |
| `loadFlatDomainFromData(data, fileName?)` | Parse domain from object or JSON string |
| `loadFlatDomains(names, options?)` | Batch load, preserves input order |
| `listDomains(kdnaDir?)` | List `.kdna` / `.json` files |
| `loadPersona(personaId, options?)` | Load a director persona |
| `listPersonas(kdnaDir?, defaults?)` | List available personas |
| `validateDomain(data, fileName?)` | Validate one flat domain object |
| `validatePersona(data)` | Validate one persona object |

`loadDomainFromFile`, `loadDomainFromData`, and `loadDomains` are aliases for
their `loadFlat*` counterparts. `KDNA_DIR` exposes the default flat-file
directory.

### Route (`@aikdna/kdna-eval/route`)

| Export | Description |
|---|---|
| `resolveDomains(operation, options?)` | Resolve domains for an operation with overrides |
| `getRoutePolicy(operation, policies?)` | Get policy for a named operation |

### Replay (`@aikdna/kdna-eval/replay`) — 0.2.0

Replay engine for regression detection across five modes:

| Export | Description |
|---|---|
| `createReplayEngine(options?)` | Create a replay engine with optional `store` and `logger` |
| `REPLAY_MODES` | Array: `["repair", "holdout", "fresh", "candidate-sealed", "new-sealed"]` |

Engine API:
- `replayRun(mode, { policy, fixtures, previousRun?, evaluate? })` → `{ mode, timestamp, inputHash, results, regressionFlags, summary }`
- `compareRuns(runA, runB)` → `{ diff, scoreDelta }`
- `isRegression(current, baseline, tolerance)` → `boolean`

```js
const { createReplayEngine } = require("@aikdna/kdna-eval/replay");

const engine = createReplayEngine();
const run = engine.replayRun("fresh", {
  fixtures: [{ id: "f1", text: "hello", score: 75, pass: true }],
  policy: { id: "p1" }
});
// Check for regressions against previous run
engine.compareRuns(run, previousRun);
```

### Gates (`@aikdna/kdna-eval/gates`) — 0.2.0

Multi-gate evaluation with pluggable gate functions:

| Export | Description |
|---|---|
| `createMultiGateRunner(gates?)` | Create runner; defaults to all 6 gates if omitted |
| `aggregateGates(results)` | Aggregate gate results into `{ overall, passed_gates, failed_gates, blocked_gates }` |
| `gateFromArray(results)` | Returns `true` only if all gates pass |
| `GATE_NAMES` | Array: `["route", "compose", "projection", "cost", "quality", "promotion"]` |

```js
const { createMultiGateRunner } = require("@aikdna/kdna-eval/gates");

const runner = createMultiGateRunner([
  (ctx) => ({ gate: "route", pass: true, score: 0.95, details: {}, errors: [] }),
  (ctx) => ({ gate: "cost", pass: true, score: 1.0, details: {}, errors: [] }),
]);
const report = runner.runAll({ policy: myPolicy, fixtures: myFixtures });
```

### Cost (`@aikdna/kdna-eval/cost`) — 0.2.0

Context budget tracking with built-in profiles:

| Export | Description |
|---|---|
| `createCostTracker(profile)` | Create a tracker; `profile` can be `"interactive"`, `"code-review"`, `"offline-audit"`, or a `{ maxTokens, maxChars, maxAssets }` object |
| `BUDGET_PROFILES` | Object mapping profile names to `{ maxTokens, maxChars, maxAssets }` limits |

Tracker API:
- `trackAsset(asset)` — track one asset
- `trackAdvisor(advisor)` — track one advisor
- `isOverBudget()` → `boolean`
- `getCostReport()` → structured report with consumption breakdown

```js
const { createCostTracker } = require("@aikdna/kdna-eval/cost");

const tracker = createCostTracker("code-review");
tracker.trackAsset({ id: "domain-1", tokens: 700, chars: 1000 });
tracker.trackAdvisor({ id: "system", tokens: 200, content: "..." });

const report = tracker.getCostReport();
// { profile: "code-review", consumed: { tokens: 900, chars: 1003, assets: 2 }, over_budget: false, ... }
```

## Scoring Rule Format

Rules live under `x_eval.rules` in domain data. `axioms` array at root is
accepted as a backward-compatible fallback.

```json
{
  "id": "my-domain",
  "schemaVersion": 1,
  "x_eval": {
    "rules": [{
      "id": "my-rule",
      "dimensions": ["clarity"],
      "condition": { "path": "text.length", "op": "gt", "value": 20 },
      "effect": { "value": 10 }
    }]
  }
}
```

**Condition operators:** `eq`, `gt`, `gte`, `lt`, `lte`, `between`

**Effect fields:** `value`, `multiplyBy`, `clamp.min`, `clamp.max`

## Integration with @aikdna/kdna-core

kdna-core loads/validates `.kdna` containers; kdna-eval scores:

```js
const { loadKDNA } = require("@aikdna/kdna-core");
const { createEvaluator } = require("@aikdna/kdna-eval");

const profile = await loadKDNA("my_domain.kdna", { profile: "full" });
const evaluator = createEvaluator({ dimensions: ["story", "rhythm"] });
const results = evaluator.score(candidates, [
  { id: profile.manifest.name, data: profile.domain }
]);
```

## Version 0.3.2 TypeScript and ESM parity

Version 0.3.2 keeps the CommonJS, ESM, and TypeScript value exports in lockstep
at the package root and at every documented subpath. TypeScript consumers can
import the replay, gate, cost, consumption, route-card, and consumer-index APIs
from the package root or their matching subpaths, and ESM consumers receive the
same score constants and loader validators as CommonJS consumers.

Version 0.3.2 also closes implicit-evidence paths in Assay and Replay APIs:

- Asset fixtures require a non-empty task and non-empty expected result;
  malformed, duplicate, empty, or below-threshold fixture sets fail before the
  runner is called.
- Cluster fixtures require a non-empty expected primary asset. Empty,
  malformed, or duplicate Cluster fixture sets cannot produce a passing Assay
  verdict and are rejected before Replay invokes its engine.
- Replay counts a result as passed only when it contains the explicit boolean
  value `pass: true`. Missing or non-boolean pass evidence is counted as failed
  and reported in `summary.incomplete`.
- Cluster and advisor-ledger identifiers are non-empty strings at runtime and
  in the strict TypeScript declarations.
- Domain, Persona, RouteCard, and ConsumerIndex validators enforce their full
  declared nested shapes, including fallback-loaded defaults. Consumer-index
  resolution and trust checks return safe disabled results for malformed
  indexes rather than trusting partial data.
- Asset Assay requires exactly the four documented baseline arms, once each,
  before invoking a runner. Empty, partial, duplicate, unknown, or malformed
  arm sets fail closed regardless of relaxed thresholds.
- Asset and Cluster dataset fingerprints hash canonical evaluation content,
  including fixture IDs, tasks, categories, and expected evidence. Object key
  order does not change the hash, while task or expectation changes do.
  `created_at` and the derived `task_hash` are excluded from the fingerprint.
- Fixture evidence must be deterministic JSON data: cycles, `BigInt`,
  `undefined`, functions, symbols, sparse arrays, accessors, and non-plain
  nested objects are rejected before an Assay runner or Replay engine executes.
- Cluster manifest identifiers, descriptions, domain load conditions, and
  composition strategies are validated before a strongly typed report is
  created. Missing optional identifiers retain the documented `unknown` and
  `0.1.0` defaults.
- A passing Cluster Assay requires a valid plan with exactly one selected
  primary, unique selected/rejected IDs, explicit advisor contribution
  hypotheses and rejection reasons, and fixture expectations that exactly
  match the selected primary, advisor set, rejected set, and conflict count.
- Loaded evidence requires exactly one verified and authorized primary matching
  the plan, every selected advisor loaded as `advisor`, no rejected asset
  loaded, unique IDs, and only `primary`, `advisor`, or `control` roles.
- All seven `CLUSTER_COMPARISON_ARMS` are required exactly once. Each record
  binds the exact fixture ID set, a finite 1–5 mean score, a result count equal
  to the fixture count, and a valid critical-error count.
- Passing economics evidence requires explicit positive plan limits, an asset
  count matching the selected primary and advisors, plus observed nonnegative
  token and model-call counts. An observed `tokens_used: 0` is preserved rather
  than replaced by an estimate.

## Version 0.3.1 Assay Contracts

Version 0.3.1 adds fail-closed Asset and Cluster Assay behavior exported from both the package
root and `@aikdna/kdna-eval/cluster-assay`:

- structural gate — qualified primary and bounded advisor selection;
- behavioral gate — at least `+0.30` over primary-only;
- economics gate — asset count and execution budget;
- trust gate — observed authorization and digest verification only;
- product gate — operable, non-placeholder Cluster definition.

All five gates are fail-closed. A gate with missing evidence is `not_run` and
cannot produce a passing promotion verdict. Plan selection is not accepted as
proof that an asset was loaded.

## Version 0.2.0 Capabilities

- **Replay Engine** (`replay.js`): Five-mode replay for regression detection
- **Multi-Gate Runner** (`gates.js`): Pluggable gate composition with pass/fail aggregation
- **Cost Tracker** (`cost.js`): Budget profiles for interactive, code-review, and offline-audit contexts

All new modules use synthetic/constructed data only — no private fixtures.

## License

Apache-2.0
