const RULE_OF_SIX_DEFAULTS = {
  emotion: 0.51,
  story: 0.23,
  rhythm: 0.10,
  eyeTrace: 0.07,
  twoD: 0.05,
  threeD: 0.03
};

const DEFAULT_SCORE = 50;
const SCORE_MIN = 0;
const SCORE_MAX = 100;

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

function clampDelta(delta, clamp) {
  if (!clamp) return delta;
  let result = delta;
  if (clamp.min != null) result = Math.max(clamp.min, result);
  if (clamp.max != null) result = Math.min(clamp.max, result);
  return result;
}

function extractRules(domainData) {
  if (domainData.x_eval?.rules?.length) return domainData.x_eval.rules;
  if (domainData.axioms?.length) return domainData.axioms;
  return [];
}

function extractThresholds(domainData) {
  return domainData.x_eval?.thresholds ?? domainData.thresholds ?? {};
}

function validateWeight(weight, domainId) {
  if (typeof weight !== "number" || !Number.isFinite(weight)) {
    throw new Error(`Invalid domain weight for "${domainId}": ${weight}. Must be a finite number.`);
  }
  if (weight < 0) {
    throw new Error(`Negative domain weight for "${domainId}": ${weight}. Weight must be >= 0.`);
  }
}

function evaluateAxioms(candidate, axioms, context) {
  const index = context?.index ?? 0;
  const dimDefaults = context?.dimensionDefaults;
  const dimNames = context?.dimensionNames ?? Object.keys(dimDefaults ?? { emotion: 50, story: 50, rhythm: 50, eyeTrace: 50, twoD: 50, threeD: 50 });
  const clampDef = context?.scoreClamp;

  const dimensions = {};
  for (const dim of dimNames) {
    dimensions[dim] = dimDefaults?.[dim] ?? DEFAULT_SCORE;
  }
  const triggered = [];

  for (const axiom of axioms ?? []) {
    if (!evaluateCondition(candidate, axiom.condition, { index, total: context?.total })) continue;

    let delta = axiom.effect?.value ?? 0;
    if (axiom.effect?.multiplyBy) {
      let multiplier = 0;
      const mul = axiom.effect.multiplyBy;
      if (mul === "index") multiplier = index;
      else if (mul === "riskFlags.length") multiplier = candidate.riskFlags?.length ?? 0;
      else multiplier = getPath(candidate, mul) ?? 0;
      delta = delta * multiplier;
    }
    delta = clampDelta(delta, axiom.effect?.clamp);

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
    dimensions[key] = Math.max(
      clampDef?.min ?? SCORE_MIN,
      Math.min(clampDef?.max ?? SCORE_MAX, Math.round(dimensions[key]))
    );
  }

  const composite = computeComposite(dimensions, context?.dimensionWeights);
  return { score: composite, dimensions, triggered };
}

function computeComposite(dimensions, dimensionWeights) {
  const weights = dimensionWeights ?? RULE_OF_SIX_DEFAULTS;
  let total = 0;
  let weightSum = 0;
  for (const [dim, weight] of Object.entries(weights)) {
    const val = dimensions[dim] ?? DEFAULT_SCORE;
    total += val * weight;
    weightSum += weight;
  }
  if (weightSum === 0) return DEFAULT_SCORE;
  return Math.round(total / weightSum);
}

function evaluateCandidates(candidates, domains, options) {
  const { weights, dimensionWeights, dimensionDefaults, dimensionNames, scoreClamp } = options ?? {};
  const domainWeights = weights ?? new Map();

  for (const [domainId, weight] of domainWeights?.entries?.() ?? []) {
    validateWeight(weight, domainId);
  }

  const results = [];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const dimNames = dimensionNames ?? (dimensionDefaults ? Object.keys(dimensionDefaults) : ["emotion", "story", "rhythm", "eyeTrace", "twoD", "threeD"]);

    const mergedDimensions = {};
    for (const dim of dimNames) {
      mergedDimensions[dim] = 0;
    }
    let totalWeight = 0;
    const allTriggered = [];

    for (const domain of domains) {
      const domainData = domain.data ?? domain;
      const rules = extractRules(domainData);
      if (!rules.length) continue;

      const domainId = domain.id ?? domainData.id;
      let weight = 1;
      if (domainWeights.has) {
        weight = domainWeights.get(domainId) ?? weight;
      } else if (domainWeights[domainId] != null) {
        weight = domainWeights[domainId];
      }
      validateWeight(weight, domainId);
      if (weight === 0) continue;

      const result = evaluateAxioms(candidate, rules, {
        index: i,
        total: candidates.length,
        dimensionDefaults,
        dimensionNames: dimNames,
        scoreClamp,
        dimensionWeights
      });

      for (const dim of dimNames) {
        mergedDimensions[dim] += (result.dimensions[dim] ?? DEFAULT_SCORE) * weight;
      }
      totalWeight += weight;

      for (const t of result.triggered) {
        allTriggered.push({ domain: domainId, ...t });
      }
    }

    if (totalWeight === 0) {
      const defaultDims = {};
      for (const dim of dimNames) {
        defaultDims[dim] = DEFAULT_SCORE;
      }
      results.push({
        candidate,
        index: i,
        score: DEFAULT_SCORE,
        dimensions: defaultDims,
        triggered: []
      });
      continue;
    }

    for (const dim of dimNames) {
      mergedDimensions[dim] = Math.max(
        scoreClamp?.min ?? SCORE_MIN,
        Math.min(scoreClamp?.max ?? SCORE_MAX, Math.round(mergedDimensions[dim] / totalWeight))
      );
    }

    const composite = computeComposite(mergedDimensions, dimensionWeights);
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

function createEvaluator(options) {
  const {
    dimensions = ["emotion", "story", "rhythm", "eyeTrace", "twoD", "threeD"],
    defaults: dimensionDefaults,
    weights: dimensionWeights,
    scoreClamp
  } = options ?? {};

  const defaultScores = {};
  for (const dim of dimensions) {
    defaultScores[dim] = dimensionDefaults?.[dim] ?? DEFAULT_SCORE;
  }

  return {
    dimensions,
    defaults: defaultScores,
    weights: dimensionWeights,
    scoreClamp,
    score(candidates, domains, opts) {
      return evaluateCandidates(candidates, domains, {
        ...opts,
        dimensionNames: dimensions,
        dimensionDefaults: defaultScores,
        dimensionWeights: dimensionWeights ?? opts?.dimensionWeights,
        scoreClamp: scoreClamp ?? opts?.scoreClamp
      });
    }
  };
}

module.exports = {
  RULE_OF_SIX_DEFAULTS,
  DEFAULT_SCORE,
  SCORE_MIN,
  SCORE_MAX,
  getPath,
  evaluateCondition,
  evaluateAxioms,
  computeComposite,
  evaluateCandidates,
  createEvaluator,
  extractRules,
  extractThresholds,
  clampDelta,
  validateWeight
};
