/**
 * @aikdna/kdna-eval — Core axiom evaluation engine
 *
 * Zero-dependency pure functions for condition matching,
 * axiom evaluation, dimension scoring, and multi-domain
 * weighted composite judgment.
 */

const RULE_OF_SIX_DEFAULTS = {
  emotion: 0.51,
  story: 0.23,
  rhythm: 0.10,
  eyeTrace: 0.07,
  twoD: 0.05,
  threeD: 0.04
};

function getPath(obj, pathStr) {
  return pathStr.split(".").reduce((o, p) => o?.[p], obj);
}

function evaluateCondition(candidate, condition, context) {
  const { path: pathStr, op, value = null, min = 0, max = 0 } = condition;
  let actual;
  if (pathStr === "duration") actual = Math.max(0, candidate.outSec - candidate.inSec);
  else if (pathStr === "index") actual = context?.index ?? 0;
  else if (pathStr === "text.length") actual = candidate.text?.length ?? 0;
  else if (pathStr === "riskFlags.length") actual = candidate.riskFlags?.length ?? 0;
  else if (pathStr === "candidateRoles.length") actual = candidate.candidateRoles?.length ?? 0;
  else actual = getPath(candidate, pathStr);

  switch (op) {
    case "eq":
      return actual === value;
    case "gt":
      return actual > value;
    case "gte":
      return actual >= value;
    case "lt":
      return actual < value;
    case "lte":
      return actual <= value;
    case "between":
      return actual >= min && actual <= max;
    default:
      return false;
  }
}

function evaluateAxioms(candidate, axioms, context) {
  const dimensions = { emotion: 50, story: 50, rhythm: 50, eyeTrace: 50, twoD: 50, threeD: 50 };
  const triggered = [];

  for (const axiom of axioms ?? []) {
    if (!evaluateCondition(candidate, axiom.condition, context)) continue;

    let delta = axiom.effect?.value ?? 0;
    if (axiom.effect?.multiplyBy) {
      let multiplier = 0;
      const mul = axiom.effect.multiplyBy;
      if (mul === "index") multiplier = context?.index ?? 0;
      else if (mul === "riskFlags.length") multiplier = candidate.riskFlags?.length ?? 0;
      else multiplier = getPath(candidate, mul) ?? 0;
      delta = delta * multiplier;
    }
    if (axiom.effect?.cap != null) {
      delta = Math.max(axiom.effect.cap, delta);
    }

    const targetDims = axiom.dimensions ?? ["story"];
    for (const dim of targetDims) {
      if (dimensions[dim] != null) {
        dimensions[dim] += delta;
      }
    }

    triggered.push({
      id: axiom.id,
      delta: Number(delta.toFixed(2)),
      dimensions: targetDims
    });
  }

  for (const key of Object.keys(dimensions)) {
    dimensions[key] = Math.max(0, Math.min(100, Math.round(dimensions[key])));
  }

  const composite = computeComposite(dimensions);
  return { score: composite, dimensions, triggered };
}

function computeComposite(dimensions, dimensionWeights) {
  const weights = dimensionWeights ?? RULE_OF_SIX_DEFAULTS;
  return Math.round(
    (dimensions.emotion ?? 50) * (weights.emotion ?? 0.51) +
    (dimensions.story ?? 50) * (weights.story ?? 0.23) +
    (dimensions.rhythm ?? 50) * (weights.rhythm ?? 0.10) +
    (dimensions.eyeTrace ?? 50) * (weights.eyeTrace ?? 0.07) +
    (dimensions.twoD ?? 50) * (weights.twoD ?? 0.05) +
    (dimensions.threeD ?? 50) * (weights.threeD ?? 0.04)
  );
}

function evaluateCandidates(candidates, domains, options = {}) {
  const { weights, dimensionWeights } = options;
  const domainWeights = weights ?? new Map();
  const rulesOfSix = dimensionWeights ?? RULE_OF_SIX_DEFAULTS;

  const results = [];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    const mergedDimensions = {
      emotion: 0,
      story: 0,
      rhythm: 0,
      eyeTrace: 0,
      twoD: 0,
      threeD: 0
    };
    let totalWeight = 0;
    const allTriggered = [];

    for (const domain of domains) {
      const domainData = domain.data ?? domain;
      if (!domainData.axioms?.length) continue;

      const domainId = domain.id ?? domainData.id;
      const weight = domainWeights.get?.(domainId) ?? 1;

      const result = evaluateAxioms(candidate, domainData.axioms, {
        index: i,
        total: candidates.length
      });

      for (const key of Object.keys(mergedDimensions)) {
        mergedDimensions[key] += (result.dimensions[key] ?? 50) * weight;
      }
      totalWeight += weight;

      for (const t of result.triggered) {
        allTriggered.push({ domain: domainId, ...t });
      }
    }

    if (totalWeight === 0) {
      results.push({
        candidate,
        index: i,
        score: 50,
        dimensions: { emotion: 50, story: 50, rhythm: 50, eyeTrace: 50, twoD: 50, threeD: 50 },
        triggered: []
      });
      continue;
    }

    for (const key of Object.keys(mergedDimensions)) {
      mergedDimensions[key] = Math.max(
        0,
        Math.min(100, Math.round(mergedDimensions[key] / totalWeight))
      );
    }

    const composite = computeComposite(mergedDimensions, rulesOfSix);
    results.push({
      candidate,
      index: i,
      score: composite,
      dimensions: mergedDimensions,
      triggered: allTriggered
    });
  }

  return results;
}

module.exports = {
  RULE_OF_SIX_DEFAULTS,
  computeComposite,
  evaluateAxioms,
  evaluateCandidates,
  evaluateCondition,
  getPath
};
