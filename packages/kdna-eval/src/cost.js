// Phase B will define a proper SCU (structured context unit) model.
// These values are the character-count budget per the architecture roadmap.
// Token estimates are derived as chars ÷ 4 (rough English token ratio).
const BUDGET_PROFILES = {
  interactive: {
    maxTokens: 800, // ~3,200 chars worth of English text
    maxChars: 2500, // per architecture: ≤2,500 chars
    maxAssets: 3,
    _note: "single primary + strictly bounded advisor",
  },
  "code-review": {
    maxTokens: 1200,
    maxChars: 3500, // per architecture: ≤3,500 chars
    maxAssets: 8,
    _note: "max 2 advisors, full trace",
  },
  "offline-audit": {
    maxTokens: 0, // 0 = must be explicitly set by caller
    maxChars: 0, // 0 = must be explicitly set by caller
    maxAssets: 20,
    _note: "all-assets control permitted but never default",
  },
};

function createCostTracker(budgetProfile) {
  const isCustomObject = typeof budgetProfile !== "string";
  const effectiveProfileName = isCustomObject
    ? "custom"
    : BUDGET_PROFILES[budgetProfile]
      ? budgetProfile
      : "interactive";
  const profile = isCustomObject
    ? budgetProfile
    : BUDGET_PROFILES[budgetProfile] || BUDGET_PROFILES["interactive"];

  let consumedTokens = 0;
  let consumedChars = 0;
  let consumedAssets = 0;
  const assetDetails = [];

  function trackAsset(asset) {
    const tokens = asset.tokens ?? asset.estimatedTokens ?? 0;
    const chars = asset.chars ?? asset.text?.length ?? 0;
    consumedTokens += tokens;
    consumedChars += chars;
    consumedAssets += 1;
    assetDetails.push({
      id: asset.id ?? null,
      type: asset.type ?? "unknown",
      tokens,
      chars,
    });
  }

  function trackAdvisor(advisor) {
    const tokens = advisor.tokens ?? advisor.estimatedTokens ?? 0;
    const chars = advisor.chars ?? advisor.content?.length ?? 0;
    consumedTokens += tokens;
    consumedChars += chars;
    consumedAssets += 1;
    assetDetails.push({
      id: advisor.id ?? null,
      type: "advisor",
      tokens,
      chars,
    });
  }

  function isOverBudget() {
    const overTokens = profile.maxTokens > 0 && consumedTokens > profile.maxTokens;
    const overChars = profile.maxChars > 0 && consumedChars > profile.maxChars;
    const overAssets = consumedAssets > profile.maxAssets;
    return overTokens || overChars || overAssets;
  }

  function getCostReport() {
    const overTokens = profile.maxTokens > 0 && consumedTokens > profile.maxTokens;
    const overChars = profile.maxChars > 0 && consumedChars > profile.maxChars;
    const overAssets = consumedAssets > profile.maxAssets;
    return {
      profile: effectiveProfileName,
      limits: { ...profile },
      consumed: {
        tokens: consumedTokens,
        chars: consumedChars,
        assets: consumedAssets,
      },
      over_budget: isOverBudget(),
      over_budget_reasons: [
        overTokens ? "tokens" : null,
        overChars ? "chars" : null,
        overAssets ? "assets" : null,
      ].filter(Boolean),
      asset_details: assetDetails.slice(),
    };
  }

  function _reset() {
    consumedTokens = 0;
    consumedChars = 0;
    consumedAssets = 0;
    assetDetails.length = 0;
  }

  return { trackAsset, trackAdvisor, isOverBudget, getCostReport, _reset };
}

module.exports = { createCostTracker, BUDGET_PROFILES };
