# @aikdna/kdna-eval

KDNA runtime scoring primitives — configurable condition matching, dimension
scoring, and multi-domain weighted evaluation. Complements
`@aikdna/kdna-core` (which loads and renders domains as prompt text) by
executing scoring rules at runtime.

**This is NOT an "axiom evaluation engine" for KDNA standard axioms.**
Standard KDNA axioms (`one_sentence`, `full_statement`, `why`) in
`KDNA_Core.json` are judgment principles rendered by kdna-core.
kdna-eval works with **executable scoring rules** placed under the
`x_eval` namespace in domain data.

## Quick Start

```js
const { createEvaluator } = require("@aikdna/kdna-eval");

const evaluator = createEvaluator({
  dimensions: ["clarity", "impact"],
  defaults: { clarity: 50, impact: 50 }
});

const candidates = [
  { text: "A substantive segment about technology" },
  { text: "short" }
];

const rules = [
  { id: "length-bonus", dimensions: ["clarity"], condition: { path: "text.length", op: "gt", value: 20 }, effect: { value: 10 } }
];

const results = evaluator.score(candidates, [
  { id: "my-domain", data: { id: "my-domain", schemaVersion: 1, x_eval: { rules } } }
]);
// results[0].dimensions.clarity > results[1].dimensions.clarity
```

## API

### Main entry (`@aikdna/kdna-eval`)

| Export | Description |
|---|---|
| `createEvaluator(options)` | Factory returning a configured evaluator with `score()` method |
| `evaluateCandidates(candidates, domains, options?)` | Score multiple candidates across multiple domains |
| `evaluateAxioms(candidate, rules, context?)` | Score a single candidate against one set of rules |
| `evaluateCondition(candidate, condition, context?)` | Match a single condition |
| `computeComposite(dimensions, weights?)` | Weighted dimension composite |
| `getPath(obj, pathStr)` | Dot-separated path navigation |
| `extractRules(domainData)` | Read `x_eval.rules` from domain (fallback to `axioms`) |
| `RULE_OF_SIX_DEFAULTS` | Default 6-dimension weights (for video/narrative use) |

### Loader (`@aikdna/kdna-eval/loader`)

Provides **legacy flat JSON loading** from `~/.kdna/` directories (StoryCut-compatible).

For standard `.kdna` ZIP container loading, use `@aikdna/kdna-core`'s `loadKDNA()`.

| Export | Description |
|---|---|
| `loadFlatDomainFromFile(fileName, kdnaDir?, defaults?)` | Load a flat JSON domain file |
| `loadFlatDomainFromData(data, fileName?)` | Parse domain from object or JSON string |
| `loadFlatDomains(domainNames, options?)` | Batch load with preserved input order |
| `listDomains(kdnaDir?)` | List `.kdna` / `.json` files |
| `loadPersona(personaId, options?)` | Load a director persona |
| `listPersonas(kdnaDir?, defaults?)` | List available personas |

The legacy names `loadDomainFromFile`, `loadDomainFromData`, `loadDomains` are
also available as aliases.

### Route (`@aikdna/kdna-eval/route`)

| Export | Description |
|---|---|
| `resolveDomains(operation, options?)` | Resolve domains for an operation with overrides |
| `getRoutePolicy(operation, policies?)` | Get policy for a named operation |

### StoryCut defaults (`@aikdna/kdna-eval/storycut`)

| Export | Description |
|---|---|
| `STORYCUT_DEFAULTS` | Built-in domain defaults: segment_selection, narrative_structure, emotional_arc, pacing_rhythm |
| `DEFAULT_PERSONAS` | Built-in personas: explainer-director, documentary-director, vlog-director |
| `RULE_OF_SIX_DEFAULTS` | Default emotion/story/rhythm/eyeTrace/2D/3D weights |

## Scoring Rule Format

Rules live under `x_eval.rules` in domain data:

```json
{
  "id": "my-domain",
  "schemaVersion": 1,
  "x_eval": {
    "rules": [
      {
        "id": "transcript-bonus",
        "dimensions": ["story", "emotion"],
        "condition": { "path": "signals.fromTranscript", "op": "eq", "value": true },
        "effect": { "value": 8 }
      }
    ],
    "thresholds": { "minScore": 40 }
  }
}
```

For backward compatibility, `axioms` array at domain root is also accepted
as a fallback (but `x_eval.rules` takes precedence).

**Condition operators:** `eq`, `gt`, `gte`, `lt`, `lte`, `between`

**Built-in path shortcuts:** `duration`, `index`, `text.length`, `riskFlags.length`, `candidateRoles.length`

**Effect fields:**

| Field | Description |
|---|---|
| `value` | Score delta |
| `multiplyBy` | Field path to multiply delta by |
| `clamp.min` | Minimum delta cap |
| `clamp.max` | Maximum delta cap |

## Integration with @aikdna/kdna-core

kdna-core loads/validates `.kdna` ZIP containers; kdna-eval executes scoring:

```js
const { loadKDNA } = require("@aikdna/kdna-core");
const { createEvaluator } = require("@aikdna/kdna-eval");

const profile = await loadKDNA("my_domain.kdna", { profile: "full" });
const evaluator = createEvaluator({ dimensions: ["story", "rhythm"] });
const results = evaluator.score(candidates, [
  { id: profile.manifest.name, data: profile.domain }
]);
```

## License

Apache-2.0
