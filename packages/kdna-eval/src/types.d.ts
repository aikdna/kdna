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
  expected?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AssayArmDefinition {
  arm: AssayBaselineArm;
  [key: string]: unknown;
}

export interface AssayProfile {
  asset_id: string;
  asset_version: string;
  asset_digest: string | null;
  thresholds: Record<string, number | boolean>;
  [key: string]: unknown;
}

export interface AssayReport {
  assay_version: string;
  profile: AssayProfile;
  fixture_validation: { valid: boolean; errors?: string[]; summary?: Record<string, number> };
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
  gates: Record<string, ClusterAssayGate>;
  verdict: {
    overall: "pass" | "fail";
    passed: number;
    blocked: number;
    not_run: number;
    all_passed: boolean;
    failed_gates: string[];
    incomplete_gates: string[];
  };
  comparison_arms: unknown[];
  marginal_value: Record<string, unknown>;
  dataset_fingerprint: string;
}

export declare const FIXTURE_CATEGORIES: readonly AssayFixtureCategory[];
export declare const BASELINE_ARMS: readonly AssayBaselineArm[];
export declare const CLASSIFICATION_LEVELS: readonly string[];
export declare function createAssayProfile(options?: Record<string, unknown>): AssayProfile;
export declare function validateFixtureSet(fixtures: AssayFixture[], profile: AssayProfile): { valid: boolean; errors: string[]; summary: Record<string, number> };
export declare function createFixture(options?: Record<string, unknown>): AssayFixture;
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

export declare const CLUSTER_COMPARISON_ARMS: readonly string[];
export declare const CLUSTER_GATES: readonly string[];
export declare const COMPARISON_ARM_DESCRIPTIONS: Readonly<Record<string, string>>;
export declare function createClusterFixture(options?: Record<string, unknown>): Record<string, unknown>;
export declare function structuralGate(plan: Record<string, unknown> | null): ClusterAssayGate;
export declare function behavioralGate(clusterResults?: Record<string, unknown> | null, primaryOnlyResults?: Record<string, unknown> | null): ClusterAssayGate;
export declare function economicsGate(plan?: Record<string, unknown> | null, executionCost?: Record<string, unknown>): ClusterAssayGate;
export declare function trustGate(assetsLoaded?: Array<Record<string, unknown>> | null): ClusterAssayGate;
export declare function productGate(plan?: Record<string, unknown> | null, manifest?: Record<string, unknown>): ClusterAssayGate;
export declare function runClusterAssay(options?: Record<string, unknown>): ClusterAssayReport;
export declare function createAdvisorRelationLedger(plan?: Record<string, unknown>, manifest?: Record<string, unknown>): Record<string, unknown>;
export declare function recordAdvisorDecision(assetId: string, decision: "approved" | "approved_with_changes" | "rejected" | "needs_revision", options?: Record<string, unknown>): Record<string, unknown>;
export declare function runClusterReplay(engine: Record<string, unknown>, fixtures: Array<Record<string, unknown>>, options?: Record<string, unknown>): Record<string, unknown>;
