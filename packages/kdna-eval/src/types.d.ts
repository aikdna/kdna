/**
 * @aikdna/kdna-eval — TypeScript type definitions
 */

export interface Condition {
  path: string;
  op: "eq" | "gt" | "gte" | "lt" | "lte" | "between";
  value?: unknown;
  min?: number;
  max?: number;
}

export interface AxiomEffect {
  action: string;
  value: number;
  multiplyBy?: string;
  cap?: number;
}

export interface Axiom {
  id: string;
  dimensions: string[];
  condition: Condition;
  effect: AxiomEffect;
}

export interface Thresholds {
  minScore?: number;
  minDuration?: number;
  idealDurationMin?: number;
  idealDurationMax?: number;
  minBreathingSpaceSec?: number;
  maxHighDensityCluster?: number;
  highDensity?: number;
  lowDensity?: number;
}

export interface KdnaDomain {
  id: string;
  schemaVersion: number;
  axioms?: Axiom[];
  thresholds?: Thresholds;
  roles?: string[];
  roleTargetDurations?: Record<string, number>;
  maxPerRole?: number;
  dangerPatterns?: Record<string, unknown>[];
  validPatterns?: Record<string, unknown>[];
  patterns?: Record<string, unknown>[];
  _fallback?: boolean;
}

export interface DimensionScores {
  emotion: number;
  story: number;
  rhythm: number;
  eyeTrace: number;
  twoD: number;
  threeD: number;
}

export interface TriggeredAxiom {
  id: string;
  delta: number;
  dimensions: string[];
}

export interface CandidateResult {
  candidate: Record<string, unknown>;
  index: number;
  score: number;
  dimensions: DimensionScores;
  triggered: TriggeredAxiom[];
}

export interface DomainTriggeredAxiom extends TriggeredAxiom {
  domain: string;
}

export interface CandidateResultMultiDomain {
  candidate: Record<string, unknown>;
  index: number;
  score: number;
  dimensions: DimensionScores;
  triggered: DomainTriggeredAxiom[];
}

export interface AxiomEvaluationResult {
  score: number;
  dimensions: DimensionScores;
  triggered: TriggeredAxiom[];
}

export interface EvaluateCandidatesOptions {
  weights?: Map<string, number>;
  dimensionWeights?: Record<string, number>;
}

export interface DomainReference {
  id: string;
  data?: KdnaDomain;
}

export interface Persona {
  id: string;
  schemaVersion: number;
  name: string;
  description: string;
  ruleOfSix: Record<string, number>;
  domains: { id: string; weight: number }[];
  preferences: Record<string, unknown>;
  _fallback?: boolean;
}

export interface LoaderOptions {
  kdnaDir?: string;
  defaults?: Record<string, KdnaDomain>;
}

export interface LoadPersonaOptions {
  kdnaDir?: string;
  defaults?: Record<string, Persona>;
}

export interface LoadDomainsResult {
  loaded: { id: string; data: KdnaDomain }[];
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
  loaded: boolean;
  skipReason?: string;
}

export interface DomainResolution {
  operation: string;
  loadProfile: string;
  domains: ResolvedDomain[];
  loadedDomains: string[];
  skippedDomains: string[];
}

export declare const RULE_OF_SIX_DEFAULTS: Record<string, number>;

export declare function getPath(obj: Record<string, unknown>, pathStr: string): unknown;

export declare function evaluateCondition(
  candidate: Record<string, unknown>,
  condition: Condition,
  context?: { index: number }
): boolean;

export declare function evaluateAxioms(
  candidate: Record<string, unknown>,
  axioms: Axiom[],
  context?: { index: number; total?: number }
): AxiomEvaluationResult;

export declare function computeComposite(
  dimensions: DimensionScores,
  dimensionWeights?: Record<string, number>
): number;

export declare function evaluateCandidates(
  candidates: Record<string, unknown>[],
  domains: DomainReference[],
  options?: EvaluateCandidatesOptions
): CandidateResultMultiDomain[];
