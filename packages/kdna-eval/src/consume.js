const { getRoutePolicy, resolveDomains } = require("./route");
const { createCostTracker } = require("./cost");

function createConsumptionRunner(options) {
  const { policies, budgetProfile } = options ?? {};

  function route(asset, context) {
    if (!policies) {
      return {
        gate: "route",
        pass: null,
        score: null,
        details: { note: "no policies provided — cannot route" },
        errors: [],
      };
    }

    const operation = context?.task || context?.operation || "review";
    let policy;
    try {
      policy = getRoutePolicy(operation, policies);
    } catch (e) {
      return {
        gate: "route",
        pass: false,
        score: 0,
        details: { operation },
        errors: [e.message],
      };
    }

    const resolved = resolveDomains(operation, {
      policies,
      domainOverrides: context?.domainOverrides,
      skipReason: context?.skipReason,
    });

    const primary = resolved.selectedDomains[0] || null;
    const rejected = resolved.skippedDomains;

    return {
      gate: "route",
      pass: primary !== null,
      score: primary ? 1.0 : 0.0,
      details: {
        operation,
        loadProfile: resolved.loadProfile,
        primary,
        selectedDomains: resolved.selectedDomains,
        rejected,
        confidence: primary ? "high" : "none",
        abstainReason: primary ? null : "no matching domain for operation",
      },
      errors: [],
    };
  }

  function cost(asset, context) {
    const tracker = createCostTracker(budgetProfile || "interactive");

    if (asset) {
      tracker.trackAsset({
        id: asset.id || asset.path,
        type: "primary",
        tokens: asset.estimatedTokens,
        chars: asset.text?.length || JSON.stringify(asset).length,
      });
    }

    const advisors = context?.advisors || [];
    for (const adv of advisors) {
      tracker.trackAdvisor({
        id: adv.id,
        tokens: adv.estimatedTokens,
        chars: adv.content?.length,
      });
    }

    const report = tracker.getCostReport();

    return {
      gate: "cost",
      pass: !report.over_budget,
      score: report.over_budget ? 0.0 : 1.0,
      details: report,
      errors: report.over_budget
        ? [`Budget exceeded: ${report.over_budget_reasons.join(", ")}`]
        : [],
    };
  }

  function compose(asset, context) {
    const primaryId = context?.primary || null;
    const requestedAdvisors = context?.advisors || [];
    const hardmax = context?.sourceHardmax || 3;

    if (!primaryId) {
      return {
        gate: "compose",
        pass: false,
        score: 0.0,
        details: {
          primary: null,
          advisors: [],
          rejected_advisors: [],
          conflicts: [],
          source_hardmax: hardmax,
          sources_used: 0,
        },
        errors: ["compose requires a primary domain — no fallback to all-assets"],
      };
    }

    const maxAdvisors = Math.max(0, hardmax - 1);
    const acceptedAdvisors = requestedAdvisors.slice(0, maxAdvisors);
    const rejectedAdvisors = requestedAdvisors.slice(maxAdvisors);

    const advisorEntries = acceptedAdvisors.map((a) => ({
      domain_id: a,
      weight: 0.5,
      role: "advisor",
      attribution: `selected as advisor within hardmax ${hardmax}`,
      accepted: true,
    }));

    const rejectedEntries = rejectedAdvisors.map((a) => ({
      domain_id: a,
      reason: `exceeds source hardmax (${hardmax})`,
    }));

    const conflicts = detectConflicts(primaryId, acceptedAdvisors, policies);

    return {
      gate: "compose",
      pass: true,
      score: 1.0,
      details: {
        primary: {
          domain_id: primaryId,
          weight: 1,
          reason: context?.primaryReason || "specified or routed",
        },
        advisors: advisorEntries,
        rejected_advisors: rejectedEntries,
        conflicts,
        source_hardmax: hardmax,
        sources_used: 1 + acceptedAdvisors.length,
      },
      errors: [],
    };
  }

  function promotion(asset, context) {
    const source = context?.source || context?.evidenceSource || "unknown";
    const reviewStatus = context?.reviewStatus || "draft_generated";
    const replayResults = context?.replayResults || {};

    if (source === "sealed-derived") {
      return {
        gate: "promotion",
        pass: false,
        score: 0.0,
        details: {
          source,
          reviewStatus,
          replayResults,
          promotionBlocked: true,
          blockReason: "sealed-derived evidence cannot be auto-promoted — requires human review",
        },
        errors: ["sealed-derived auto-promotion blocked"],
      };
    }

    const reviewLevels = [
      "draft_generated",
      "lint_repaired",
      "human_reviewed",
      "eval_candidate",
      "trusted_runtime",
    ];
    const reviewIndex = reviewLevels.indexOf(reviewStatus);
    if (reviewIndex < 2) {
      return {
        gate: "promotion",
        pass: false,
        score: 0.0,
        details: {
          source,
          reviewStatus,
          replayResults,
          promotionBlocked: true,
          blockReason: `review status "${reviewStatus}" below minimum "human_reviewed"`,
        },
        errors: [`review status too low: ${reviewStatus}`],
      };
    }

    const requiredSuites = ["repair", "holdout", "fresh", "candidate-sealed", "new-sealed"];
    const suiteResults = requiredSuites.map((s) => ({
      suite: s,
      passed: replayResults[s]?.pass === true,
    }));
    const allPassed = suiteResults.every((s) => s.passed);

    return {
      gate: "promotion",
      pass: allPassed,
      score: allPassed ? 1.0 : 0.0,
      details: {
        source,
        reviewStatus,
        replayResults,
        suiteResults,
        promotionBlocked: !allPassed,
        blockReason: allPassed
          ? null
          : `required suites failed: ${suiteResults.filter((s) => !s.passed).map((s) => s.suite).join(", ")}`,
      },
      errors: allPassed
        ? []
        : [
            `5-suite replay not fully passed. Missing/failed: ${suiteResults.filter((s) => !s.passed).map((s) => s.suite).join(", ")}`,
          ],
    };
  }

  function projection(asset, context) {
    const requestedShape = context?.shape || "answer-pattern";
    const validShapes = ["answer-pattern", "compact", "scenario", "full"];

    if (!validShapes.includes(requestedShape)) {
      return {
        gate: "projection",
        pass: false,
        score: 0.0,
        details: { requestedShape, validShapes },
        errors: [`Unknown projection shape: ${requestedShape}`],
      };
    }

    const budgetToShape = {
      interactive: "answer-pattern",
      "code-review": "compact",
      "offline-audit": "full",
    };
    const recommendedShape = budgetToShape[context?.budget] || "answer-pattern";
    const shapeMismatch = requestedShape !== recommendedShape;

    return {
      gate: "projection",
      pass: true,
      score: shapeMismatch ? 0.7 : 1.0,
      details: {
        requestedShape,
        recommendedShape,
        shapeMismatch,
        validShapes,
      },
      errors: shapeMismatch
        ? [`Shape "${requestedShape}" differs from recommended "${recommendedShape}" for budget profile "${context?.budget}"`]
        : [],
    };
  }

  function quality(asset, context) {
    const primary = context?.primary;
    const advisors = context?.advisors || [];
    const rejected = context?.rejected || [];
    const conflicts = context?.conflicts || [];

    const checks = [];

    checks.push({
      check: "primary_selected",
      passed: !!primary,
      detail: primary ? "primary domain selected" : "no primary domain",
    });

    checks.push({
      check: "no_conflicts",
      passed: conflicts.length === 0,
      detail: conflicts.length === 0 ? "no conflicts" : `${conflicts.length} conflict(s)`,
    });

    checks.push({
      check: "has_accepted",
      passed: !!primary || advisors.length > 0,
      detail: !!primary || advisors.length > 0 ? "domains accepted" : "no domains accepted",
    });

    const totalConsidered = (primary ? 1 : 0) + advisors.length + rejected.length;
    const rejectionRate = totalConsidered > 0 ? rejected.length / totalConsidered : 0;
    checks.push({
      check: "acceptable_rejection_rate",
      passed: rejectionRate <= 0.5,
      detail: `rejection rate: ${(rejectionRate * 100).toFixed(0)}%`,
    });

    const passedChecks = checks.filter((c) => c.passed).length;
    const score = checks.length > 0 ? passedChecks / checks.length : 0.5;

    return {
      gate: "quality",
      pass: passedChecks === checks.length,
      score,
      details: {
        checks,
        passedChecks,
        totalChecks: checks.length,
      },
      errors: checks.filter((c) => !c.passed).map((c) => c.detail),
    };
  }

  return { route, cost, compose, promotion, projection, quality };
}

function detectConflicts(primaryId, advisorIds, policies) {
  const conflicts = [];
  if (!policies || !primaryId || !advisorIds || advisorIds.length === 0) return conflicts;

  for (const op of Object.values(policies)) {
    const domains = op.domains || [];
    const primaryDom = domains.find((d) => d.id === primaryId);
    if (!primaryDom) continue;

    for (const advId of advisorIds) {
      const advDom = domains.find((d) => d.id === advId);
      if (!advDom) continue;
      if (
        primaryDom.weight > 0 &&
        advDom.weight > 0 &&
        Math.abs(primaryDom.weight - advDom.weight) < 0.2
      ) {
        conflicts.push({
          domain_a: primaryId,
          domain_b: advId,
          description: `overlapping weight ranges (primary: ${primaryDom.weight}, advisor: ${advDom.weight})`,
        });
      }
    }
  }

  return conflicts;
}

module.exports = { createConsumptionRunner };
