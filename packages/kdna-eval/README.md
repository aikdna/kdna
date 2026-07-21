# @aikdna/kdna-eval

Experimental, claimant-scoped assessment utilities for applications that use
KDNA. This package is not KDNA Core authority and is not part of the default
create, validate, authorize, and load path.

## Boundary

KDNA Core decides technical format, integrity, authorization, and projection
facts. It does not decide that an asset is correct, expert, useful, safe,
recommended, or behaviorally superior.

This package can help an application record a named evaluator's own fixtures,
rubrics, replay results, cost observations, and gates. Those results belong to
that claimant, method, asset coordinate, Host, and task scope. They do not
become built-in KDNA metadata and do not decide whether an asset is valid.

The KDNA project does not use Prompt/Skill superiority or percentage-output
improvement as protocol or release gates.

## Published API families

The published `0.3.2` coordinate contains these experimental families:

- configurable candidate scoring;
- replay and regression comparison;
- pluggable gate aggregation;
- context-cost tracking;
- consumption-policy helpers;
- route-card and consumer-index sidecar readers;
- historical single-asset and Cluster assessment APIs.

Exact exports, subpaths, TypeScript declarations, and behavior belong to the
`0.3.2` package and its CHANGELOG. Their presence does not promote those APIs
into the current KDNA product contract.

## Minimal claimant-scoped example

```js
const { createEvaluator } = require("@aikdna/kdna-eval");

const evaluator = createEvaluator({
  dimensions: ["clarity"],
  defaults: { clarity: 50 }
});

const results = evaluator.score(candidates, [{
  id: "my-own-rubric",
  data: {
    schemaVersion: 1,
    x_eval: { rules: myRules }
  }
}]);
```

The caller is responsible for naming the evaluator, rubric, inputs, asset and
Host coordinates, limitations, and evidence location. A score from this API is
not an official KDNA quality score.

For the project-wide assessment boundary, see
[`docs/evaluation.md`](../../docs/evaluation.md).

## License

Apache-2.0
