export interface Condition {
  path: string;
  op: "eq" | "gt" | "gte" | "lt" | "lte" | "between";
  value?: unknown;
  min?: number;
  max?: number;
}

export interface EffectClamp {
  min?: number;
  max?: number;
}

export interface AxiomEffect {
  value: number;
  multiplyBy?: string;
  clamp?: EffectClamp;
}

export interface ScoringRule {
  id: string;
  dimensions: string[];
  condition: Condition;
  effect: AxiomEffect;
}

export interface KdnaDomainData {
  id: string;
  schemaVersion: number;
  x_eval?: { rules?: ScoringRule[]; thresholds?: Record<string, unknown> };
  axioms?: ScoringRule[];
  thresholds?: Record<string, unknown>;
  _source?: { type: string; path?: string; id?: string };
  [key: string]: unknown;
}

export interface DimensionScores {
  [dimension: string]: number;
}

export interface TriggeredRule {
  id: string;
  delta: number;
  dimensions: string[];
}

export interface DomainTriggeredRule extends TriggeredRule {
  domain: string;
}

export interface CandidateResult {
  candidate: Record<string, unknown>;
  index: number;
  score: number;
  dimensions: DimensionScores;
  triggered: DomainTriggeredRule[];
}

export interface AxiomEvaluationResult {
  score: number;
  dimensions: DimensionScores;
  triggered: TriggeredRule[];
}

export interface EvaluateCandidatesOptions {
  weights?: Map<string, number> | Record<string, number>;
  dimensionWeights?: Record<string, number>;
  dimensionDefaults?: Record<string, number>;
  dimensionNames?: string[];
  scoreClamp?: { min?: number; max?: number };
}

export interface DomainReference {
  id: string;
  data?: KdnaDomainData;
}

export interface Persona {
  id: string;
  schemaVersion: number;
  name: string;
  description: string;
  ruleOfSix: Record<string, number>;
  domains: { id: string; weight: number }[];
  preferences: Record<string, unknown>;
  _source?: { type: string; path?: string; id?: string };
  [key: string]: unknown;
}

export interface CreateEvaluatorOptions {
  dimensions?: string[];
  defaults?: Record<string, number>;
  weights?: Record<string, number>;
  scoreClamp?: { min?: number; max?: number };
}

export interface Evaluator {
  dimensions: string[];
  defaults: Record<string, number>;
  weights?: Record<string, number>;
  scoreClamp?: { min?: number; max?: number };
  score(candidates: Record<string, unknown>[], domains: DomainReference[], opts?: EvaluateCandidatesOptions): CandidateResult[];
}

export interface LoaderOptions {
  kdnaDir?: string;
  defaults?: Record<string, KdnaDomainData>;
}

export interface LoadPersonaOptions {
  kdnaDir?: string;
  defaults?: Record<string, Persona>;
}

export interface LoadDomainsResult {
  loaded: { id: string; data: KdnaDomainData }[];
  skipped: { id: string; reason: string }[];
}

export interface RoutePolicy {
  operation: string;
  loadProfile: "compact" | "scenario" | "full";
  domains: { id: string; weight: number }[];
}

export interface RouteDomainOverride {
  [domainId: string]: number | false;
}

export interface ResolveDomainsOptions {
  policies?: Record<string, RoutePolicy>;
  domainOverrides?: RouteDomainOverride;
  skipReason?: string;
}

export interface ResolvedDomain {
  id: string;
  weight: number;
  selected: boolean;
  loadStatus: "pending" | "loaded" | "missing" | "skipped";
  skipReason?: string;
}

export interface DomainResolution {
  operation: string;
  loadProfile: string;
  domains: ResolvedDomain[];
  selectedDomains: string[];
  skippedDomains: string[];
}

export declare const DEFAULT_SCORE: number;
export declare const SCORE_MIN: number;
export declare const SCORE_MAX: number;

export declare function getPath(obj: Record<string, unknown>, pathStr: string): unknown;
export declare function evaluateCondition(candidate: Record<string, unknown>, condition: Condition, context?: { index: number }): boolean;
export declare function evaluateAxioms(candidate: Record<string, unknown>, axioms: ScoringRule[], context?: Record<string, unknown>): AxiomEvaluationResult;
export declare function computeComposite(dimensions: DimensionScores, dimensionWeights?: Record<string, number>, dimensionNames?: string[]): number;
export declare function evaluateCandidates(candidates: Record<string, unknown>[], domains: DomainReference[], options?: EvaluateCandidatesOptions): CandidateResult[];
export declare function createEvaluator(options?: CreateEvaluatorOptions): Evaluator;
export declare function extractRules(domainData: KdnaDomainData): ScoringRule[];
export declare function extractThresholds(domainData: KdnaDomainData): Record<string, unknown>;
export declare function clampDelta(delta: number, clamp?: EffectClamp | null): number;
export declare function validateWeight(weight: number, domainId: string): void;

export type ReplayMode = "repair" | "holdout" | "fresh" | "candidate-sealed" | "new-sealed";

export interface ReplayFixture {
  id?: string;
  input?: unknown;
  score?: number;
  pass?: boolean;
  dimensions?: Record<string, number>;
  expected?: { score?: number; pass?: boolean; [key: string]: unknown };
  [key: string]: unknown;
}

export interface ReplayResult {
  id: string;
  score?: number;
  pass?: boolean;
  dimensions?: Record<string, unknown>;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ReplayRegressionFlag {
  id: string;
  kind: "pass-regression" | "score-regression";
  current: boolean | number;
  previous: boolean | number | undefined;
  delta?: number;
}

export interface ReplayComparableRun {
  results: ReplayResult[];
}

export interface ReplayRun extends ReplayComparableRun {
  mode: ReplayMode;
  timestamp: string;
  inputHash: string;
  regressionFlags: ReplayRegressionFlag[];
  summary: { total: number; passed: number; failed: number; incomplete: number; regressions: number };
}

export interface ReplayRunOptions {
  policy?: Record<string, unknown>;
  fixtures?: ReplayFixture[];
  previousRun?: ReplayComparableRun | null;
  evaluate?: (
    fixture: ReplayFixture,
    policy: Record<string, unknown> | undefined,
    mode: ReplayMode,
    previousRun: ReplayComparableRun | null | undefined,
  ) => ReplayResult;
}

export interface ReplayDifference {
  index: number;
  kind: "added" | "removed" | "score-change" | "pass-change";
  a: ReplayResult | null;
  b: ReplayResult | null;
  delta?: number;
}

export interface ReplayComparison {
  diff: ReplayDifference[];
  scoreDelta: number;
}

export interface ReplayEngineOptions {
  store?: { save(run: ReplayRun): void };
  logger?: { info(message: string, details: Record<string, unknown>): void };
}

export interface ReplayEngine {
  replayRun(mode: ReplayMode, options?: ReplayRunOptions): ReplayRun;
  compareRuns(runA?: ReplayComparableRun | null, runB?: ReplayComparableRun | null): ReplayComparison;
  isRegression(
    current?: ReplayResult | null,
    baseline?: ReplayResult | null,
    tolerance?: number,
  ): boolean;
  _getRuns(): ReplayRun[];
}

export declare const REPLAY_MODES: readonly ReplayMode[];
export declare function hashInput(input: unknown): string;
export declare function detectRegressions(
  results: ReplayResult[],
  previousRun?: ReplayComparableRun | null,
  tolerance?: number,
): ReplayRegressionFlag[];
export declare function createReplayEngine(options?: ReplayEngineOptions): ReplayEngine;

export interface GateResult {
  gate: string;
  pass: boolean | null;
  score: number | null;
  details: Record<string, unknown>;
  errors: string[];
  [key: string]: unknown;
}

export type GateDefinition = string | ((context: Record<string, unknown>) => GateResult);

export interface AggregateGateResult {
  overall: "pass" | "fail" | "no-results";
  blocked_gates: string[];
  passed_gates: string[];
  failed_gates: string[];
  result_count: number;
  results: GateResult[];
}

export interface MultiGateRunner {
  runGates(context: Record<string, unknown>): GateResult[];
  runAll(context: Record<string, unknown>): AggregateGateResult;
  hasGate(name: string): boolean;
}

export declare const GATE_NAMES: readonly string[];
export declare function createMultiGateRunner(gates?: readonly GateDefinition[]): MultiGateRunner;
export declare function aggregateGates(results: GateResult[]): AggregateGateResult;
export declare function gateFromArray(results: GateResult[]): boolean;

export type BudgetProfileName = "interactive" | "code-review" | "offline-audit";

export interface BudgetProfile {
  maxTokens: number;
  maxChars: number;
  maxAssets: number;
  _note?: string;
}

export interface CostInput {
  id?: unknown;
  type?: string;
  tokens?: number;
  estimatedTokens?: number;
  chars?: number;
  text?: string;
  content?: string;
}

export interface CostReport {
  profile: BudgetProfileName | "custom";
  limits: BudgetProfile;
  consumed: { tokens: number; chars: number; assets: number };
  over_budget: boolean;
  over_budget_reasons: string[];
  asset_details: Array<{
    id: unknown;
    type: string;
    tokens: number;
    chars: number;
  }>;
}

export interface CostTracker {
  trackAsset(asset: CostInput): void;
  trackAdvisor(advisor: CostInput): void;
  isOverBudget(): boolean;
  getCostReport(): CostReport;
  _reset(): void;
}

export declare const BUDGET_PROFILES: Readonly<Record<BudgetProfileName, Readonly<BudgetProfile>>>;
export declare function createCostTracker(
  budgetProfile: BudgetProfileName | BudgetProfile,
): CostTracker;

export interface ConsumptionAsset {
  id?: string;
  path?: string;
  text?: string | null;
  estimatedTokens?: number;
  [key: string]: unknown;
}

export interface ConsumptionRunnerOptions {
  policies?: Record<string, RoutePolicy>;
  budgetProfile?: BudgetProfileName | BudgetProfile;
}

export interface ConsumptionRunner {
  route(asset?: ConsumptionAsset | null, context?: Record<string, unknown>): GateResult;
  cost(asset?: ConsumptionAsset | null, context?: Record<string, unknown>): GateResult;
  compose(asset?: ConsumptionAsset | null, context?: Record<string, unknown>): GateResult;
  promotion(asset?: ConsumptionAsset | null, context?: Record<string, unknown>): GateResult;
  projection(asset?: ConsumptionAsset | null, context?: Record<string, unknown>): GateResult;
  quality(asset?: ConsumptionAsset | null, context?: Record<string, unknown>): GateResult;
}

export declare function createConsumptionRunner(options?: ConsumptionRunnerOptions): ConsumptionRunner;

export interface RouteCard {
  route_card: string;
  domain_id: string;
  role: "primary" | "advisor" | "control";
  boundaries?: {
    applies_when?: string[];
    does_not_apply_when?: string[];
  };
  neighbors?: Array<{
    domain_id: string;
    relationship: "complement" | "alternative" | "supersedes";
    weight_delta?: number;
  }>;
  advisor_edges?: Array<{
    domain_id: string;
    when: "always" | "on_uncertainty" | "on_conflict";
  }>;
  provenance?: {
    review_status?: string;
    generated_by?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface RouteCardResult {
  valid: boolean;
  card: RouteCard | null;
  errors: string[];
}

export declare function loadRouteCard(pathOrObject: string | RouteCard): RouteCardResult;
export declare function validateRouteCard(card: unknown): RouteCardResult;
export declare function applyRouteCard(
  card: RouteCard,
  policies?: Record<string, RoutePolicy> | null,
): Record<string, RoutePolicy>;

export type ConsumerStatus =
  | "draft_generated"
  | "lint_repaired"
  | "human_reviewed"
  | "eval_candidate"
  | "trusted_runtime";

export interface ConsumerIndexEntry {
  domain_id: string;
  status: ConsumerStatus;
  enabled?: boolean;
  route_preference?: {
    primary_for?: string[];
    advisor_for?: string[];
    never_for?: string[];
  };
  [key: string]: unknown;
}

export interface ConsumerIndex {
  consumer_index: string;
  entries: ConsumerIndexEntry[];
  [key: string]: unknown;
}

export interface ConsumerIndexResult {
  valid: boolean;
  index: ConsumerIndex | null;
  errors: string[];
}

export interface ConsumerIndexResolution {
  status: ConsumerStatus;
  routePreference:
    | "primary"
    | "advisor"
    | { primaryFor: string[]; advisorFor: string[]; neverFor: string[] }
    | null;
  isTrusted: boolean;
  isEnabled: boolean;
}

export declare const VALID_STATUSES: readonly ConsumerStatus[];
export declare function loadConsumerIndex(
  pathOrObject: string | ConsumerIndex,
): ConsumerIndexResult;
export declare function validateConsumerIndex(index: unknown): ConsumerIndexResult;
export declare function resolveConsumerIndex(
  index: ConsumerIndex | null | undefined,
  task: string | null | undefined,
  domainId: string,
): ConsumerIndexResolution;
export declare function isTrusted(
  index: ConsumerIndex | null | undefined,
  domainId: string,
): boolean;

export type AssayFixtureCategory =
  | "positive_target"
  | "non_applicable"
  | "adjacent_ambiguous"
  | "high_risk_failure"
  | "regression"
  | "holdout";

export type AssayBaselineArm =
  | "no_kdna"
  | "best_ordinary_prompt"
  | "correct_single_kdna"
  | "wrong_or_adjacent_kdna";

export interface AssayFixture {
  fixture_id: string;
  category: AssayFixtureCategory;
  task: string;
  expected: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AssayThresholds {
  positive_target_min_count: number;
  non_applicable_min_count: number;
  adjacent_ambiguous_min_count: number;
  high_risk_failure_min_count: number;
  regression_min_count: number;
  holdout_required: boolean;
  blind_mean_improvement_min: number;
  critical_error_reduction_pct: number;
  non_applicable_accuracy_min: number;
  harmful_contamination_max: number;
  high_risk_harm_zero: boolean;
  regression_pass_required: boolean;
  min_model_runtime_combinations: number;
  human_review_required: boolean;
  structural_gate: boolean;
  behavioral_gate: boolean;
  boundary_gate: boolean;
  contamination_gate: boolean;
  trust_gate: boolean;
  economics_gate: boolean;
  interoperability_gate: boolean;
  product_gate: boolean;
}

export type AssayThresholdOverrides = Partial<AssayThresholds>;

export interface CreateAssayProfileOptions {
  assetId?: string;
  assetVersion?: string;
  assetDigest?: string | null;
  thresholds?: AssayThresholdOverrides;
}

export interface CreateAssayFixtureOptions {
  category: AssayFixtureCategory;
  task: string;
  expected: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AssayArmDefinition {
  arm: AssayBaselineArm;
  description?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AssayProfile {
  asset_id: string;
  asset_version: string;
  asset_digest: string | null;
  thresholds: AssayThresholds;
  [key: string]: unknown;
}

export interface AssayReport {
  assay_version: string;
  profile: AssayProfile;
  fixture_validation: {
    valid: boolean;
    errors: string[];
    summary: {
      total: number;
      by_category: Record<AssayFixtureCategory, number>;
      required_met: boolean;
    };
  };
  results_by_arm: Record<string, { count: number; mean_score: number; errors: number }>;
  results: unknown[];
  result_count: number;
  threshold_results: Record<string, { pass: boolean; detail: unknown }>;
  overall_verdict: "pass" | "fail";
  failed_thresholds: string[];
  duration_ms: number;
  dataset_fingerprint: string;
}

export interface ClusterAssayGate {
  pass: boolean | null;
  score: number | null;
  issues: string[];
  details?: Record<string, unknown>;
}

export interface ClusterAssayReport {
  assay_version: string;
  cluster_id: string;
  cluster_version: string;
  fixture_count: number;
  fixture_validation: { valid: boolean; total: number; errors: string[] };
  gates: Record<string, ClusterAssayGate>;
  verdict: {
    overall: "pass" | "fail";
    passed: number;
    blocked: number;
    not_run: number;
    all_passed: boolean;
    failed_gates: string[];
    incomplete_gates: string[];
    failed_evidence: string[];
  };
  comparison_arms: ClusterComparisonArmReport[];
  evidence_validation: {
    plan: ClusterEvidenceValidation;
    fixture_expectations: ClusterEvidenceValidation;
    comparison_arms: ClusterEvidenceValidation;
    loaded_assets: ClusterEvidenceValidation & { status?: "not_run" | "invalid" | "completed" };
    economics: ClusterEvidenceValidation;
  };
  marginal_value: Record<string, unknown>;
  dataset_fingerprint: string;
}

export interface ClusterComparisonArmReport {
  arm: ClusterComparisonArm;
  description: string;
  score: number | null;
  critical_errors: number | null;
  result_count: number | null;
  fixture_ids: string[];
  status: "completed" | "invalid" | "not_run";
}

export type AdvisorDecisionValue =
  | "approved"
  | "approved_with_changes"
  | "rejected"
  | "needs_revision";

export interface AdvisorDecision {
  asset_id: string;
  decision: AdvisorDecisionValue;
  notes?: string | null;
  reviewed_at?: string;
  reviewed_by?: string;
  changes_requested?: unknown[];
  contribution_accepted?: boolean;
  [key: string]: unknown;
}

export interface AdvisorRelationLedger {
  ledger_version: string;
  cluster_id: string;
  created_at: string;
  entries: Array<Record<string, unknown>>;
  summary: {
    total_entries: number;
    primary_count: number;
    advisor_count: number;
    rejected_count: number;
    human_reviewed_count: number;
    pending_review_count: number;
  };
}

export interface ClusterReplayFixture {
  fixture_id: string;
  task: string;
  expected_primary: string;
  expected_advisors: string[];
  expected_rejected: string[];
  expected_conflicts: number;
  [key: string]: unknown;
}

export interface CreateClusterFixtureOptions {
  task: string;
  expectedPrimary: string;
  taskFamily?: string;
  expectedAdvisors?: string[];
  expectedRejected?: string[];
  expectedConflicts?: number;
  category?: string;
}

export interface ClusterAssayOptions {
  manifest?: ClusterAssayManifest | null;
  plan?: ClusterAssayPlan | null;
  executionCost?: ClusterExecutionCost;
  comparisonArms?: ClusterComparisonEvidence[];
  fixtures: ClusterReplayFixture[];
  assetsLoaded?: ClusterLoadedAsset[];
}

export interface ClusterEvidenceValidation {
  valid: boolean;
  errors: string[];
}

export interface ClusterPlanAsset {
  asset_id: string;
  [key: string]: unknown;
}

export interface ClusterPlanAdvisor extends ClusterPlanAsset {
  contribution_hypothesis: string;
}

export type ClusterPlanRejected = ClusterPlanAsset & (
  | { rejection_reason: string }
  | { reason: string }
  | { rejection_policy: string }
);

export interface ClusterAssayPlan {
  applicability: { decision: "applies"; [key: string]: unknown };
  selection: {
    primary: ClusterPlanAsset;
    advisors: ClusterPlanAdvisor[];
    rejected: ClusterPlanRejected[];
    [key: string]: unknown;
  };
  conflicts: unknown[];
  assets_loaded?: ClusterLoadedAsset[];
  budget: ClusterPlanBudget;
  cluster_ref?: { cluster_id?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface ClusterPlanBudget {
  max_tokens: number;
  max_assets: number;
  assets_consumed: number;
  profile?: string;
  [key: string]: unknown;
}

export interface ClusterExecutionCost {
  tokens_used: number;
  model_calls: number;
  [key: string]: unknown;
}

export interface ClusterLoadedAsset {
  asset_id: string;
  role: "primary" | "advisor" | "control";
  digest_verified: true;
  authorization: string;
  [key: string]: unknown;
}

export interface ClusterComparisonEvidence {
  arm: ClusterComparisonArm;
  fixture_ids: string[];
  mean_score: number;
  result_count: number;
  critical_errors: number;
  [key: string]: unknown;
}

export interface ClusterAssayManifest {
  cluster_id?: string;
  version?: string;
  description?: string;
  domains?: ClusterAssayManifestDomain[];
  composition?: ClusterAssayManifestComposition;
  [key: string]: unknown;
}

export interface ClusterAssayManifestDomain {
  load_condition?: string;
  [key: string]: unknown;
}

export interface ClusterAssayManifestComposition {
  strategy?: string;
  [key: string]: unknown;
}

export interface AdvisorRelationAsset {
  asset_id: string;
  [key: string]: unknown;
}

export interface AdvisorRelationPlan {
  cluster_ref?: { cluster_id: string; [key: string]: unknown };
  selection?: {
    primary?: AdvisorRelationAsset | null;
    advisors?: AdvisorRelationAsset[];
    rejected?: AdvisorRelationAsset[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ClusterReplaySuiteResult {
  status: "completed" | "failed" | "error";
  total?: number;
  passed?: number;
  failed?: number;
  pass_rate?: number;
  error?: string;
}

export declare const FIXTURE_CATEGORIES: readonly AssayFixtureCategory[];
export declare const BASELINE_ARMS: readonly AssayBaselineArm[];
export declare const CLASSIFICATION_LEVELS: readonly string[];
export declare function createAssayProfile(options?: CreateAssayProfileOptions): AssayProfile;
export declare function validateFixtureSet(fixtures: AssayFixture[], profile: AssayProfile): {
  valid: boolean;
  errors: string[];
  summary: {
    total: number;
    by_category: Record<AssayFixtureCategory, number>;
    required_met: boolean;
  };
};
export declare function createFixture(options: CreateAssayFixtureOptions): AssayFixture;
export declare function createAllBaselineArms(): AssayArmDefinition[];
export declare function createBaselineArm(arm: AssayBaselineArm, config?: Record<string, unknown>): AssayArmDefinition;
export declare function scoreJudgment(result: Record<string, unknown>, expected?: Record<string, unknown>, criteria?: Record<string, unknown>): Record<string, unknown> & { score: number };
export declare function detectContamination(result: Record<string, unknown>, asset?: Record<string, unknown>): Record<string, unknown> & { contaminated: boolean };
export declare function evaluateNonApplicable(result: Record<string, unknown>, expected?: Record<string, unknown>): Record<string, unknown> & { correct: boolean };
export declare function runAssay(options: {
  profile: AssayProfile;
  fixtures: AssayFixture[];
  runner: (fixture: AssayFixture, arm: AssayArmDefinition, context: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
  asset?: Record<string, unknown>;
  context?: Record<string, unknown>;
  baselineArms?: AssayArmDefinition[];
}): Promise<AssayReport>;
export declare function classifyAsset(evidence?: Record<string, unknown>): Record<string, unknown> & { levels: string[]; highest_level: string };
export declare function generateEvidenceClaim(report: AssayReport, options?: Record<string, unknown>): Record<string, unknown>;

export type ClusterComparisonArm =
  | "primary_only"
  | "bounded_compose"
  | "wrong_advisor"
  | "irrelevant_advisor"
  | "budget_waste"
  | "adversarial"
  | "no_kdna";
export declare const CLUSTER_COMPARISON_ARMS: readonly ClusterComparisonArm[];
export declare const CLUSTER_GATES: readonly string[];
export declare const COMPARISON_ARM_DESCRIPTIONS: Readonly<Record<string, string>>;
export declare function createClusterFixture(options: CreateClusterFixtureOptions): ClusterReplayFixture;
export declare function structuralGate(plan: Record<string, unknown> | null): ClusterAssayGate;
export declare function behavioralGate(clusterResults?: Record<string, unknown> | null, primaryOnlyResults?: Record<string, unknown> | null): ClusterAssayGate;
export declare function economicsGate(plan?: Record<string, unknown> | null, executionCost?: Record<string, unknown>): ClusterAssayGate;
export declare function trustGate(assetsLoaded?: ClusterLoadedAsset[] | null): ClusterAssayGate;
export declare function productGate(plan?: Record<string, unknown> | null, manifest?: Record<string, unknown>): ClusterAssayGate;
export declare function runClusterAssay(options: ClusterAssayOptions): ClusterAssayReport;
export declare function createAdvisorRelationLedger(
  plan?: AdvisorRelationPlan | null,
  decisions?: readonly AdvisorDecision[],
): AdvisorRelationLedger;
export declare function recordAdvisorDecision(
  assetId: string,
  decision: AdvisorDecisionValue,
  options?: {
    notes?: string;
    reviewedBy?: string;
    changesRequested?: unknown[];
    [key: string]: unknown;
  },
): AdvisorDecision;
export declare function runClusterReplay(
  engine: Pick<ReplayEngine, "replayRun">,
  fixtures: readonly ClusterReplayFixture[],
  options?: { clusterId?: string; [key: string]: unknown },
): Record<ReplayMode, ClusterReplaySuiteResult>;
