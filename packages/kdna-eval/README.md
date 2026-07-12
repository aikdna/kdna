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
| **v0.2.0:** `createReplayEngine(options)` | Replay engine with 5 modes (repair, holdout, fresh, candidate-sealed, new-sealed) |
| **v0.2.0:** `createMultiGateRunner(gates)` | Multi-gate evaluation runner (route, compose, projection, cost, quality, promotion) |
| **v0.2.0:** `createCostTracker(profile)` | Context budget tracking (tokens, chars, assets) |

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

### Route (`@aikdna/kdna-eval/route`)

| Export | Description |
|---|---|
| `resolveDomains(operation, options?)` | Resolve domains for an operation with overrides |
| `getRoutePolicy(operation, policies?)` | Get policy for a named operation |

### Replay (`@aikdna/kdna-eval/replay`) — v0.2.0

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

### Gates (`@aikdna/kdna-eval/gates`) — v0.2.0

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

### Cost (`@aikdna/kdna-eval/cost`) — v0.2.0

Context budget tracking with built-in profiles:

| Export | Description |
|---|---|
| `createCostTracker(profile)` | Create a tracker; `profile` can be `"interactive"`, `"code-review"`, `"offline-audit"`, or a `{ maxTokens, maxChars, maxAssets }` object |
| `BUDGET_PROFILES` | Object mapping profile names to `{ maxTokens, maxChars, maxAssets }` limits |

Tracker API:
- `trackAsset(tracker, asset)` — track one asset
- `trackAdvisor(tracker, advisor)` — track one advisor
- `isOverBudget(tracker)` → `boolean`
- `getCostReport(tracker)` → structured report with consumption breakdown

```js
const { createCostTracker } = require("@aikdna/kdna-eval/cost");

const tracker = createCostTracker("code-review");
tracker.trackAsset(tracker, { id: "domain-1", tokens: 3000, chars: 2500 });
tracker.trackAdvisor(tracker, { id: "system", tokens: 500, content: "..." });

const report = tracker.getCostReport();
// { profile: "code-review", consumed: { tokens: 3500, chars: 2500, assets: 2 }, over_budget: false, ... }
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
