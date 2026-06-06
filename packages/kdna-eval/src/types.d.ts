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
  x_eval?: {
    rules?: ScoringRule[];
    thresholds?: Record<string, unknown>;
  };
  axioms?: ScoringRule[];
  thresholds?: Record<string, unknown>;
  _source?: { type: string; path?: string; package?: string; version?: string; id?: string };
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
  _source?: { type: string; path?: string; package?: string; version?: string; id?: string };
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

export declare const RULE_OF_SIX_DEFAULTS: Record<string, number>;
export declare const DEFAULT_SCORE: number;
export declare const SCORE_MIN: number;
export declare const SCORE_MAX: number;

export declare function getPath(obj: Record<string, unknown>, pathStr: string): unknown;
export declare function evaluateCondition(candidate: Record<string, unknown>, condition: Condition, context?: { index: number }): boolean;
export declare function evaluateAxioms(candidate: Record<string, unknown>, axioms: ScoringRule[], context?: Record<string, unknown>): AxiomEvaluationResult;
export declare function computeComposite(dimensions: DimensionScores, dimensionWeights?: Record<string, number>): number;
export declare function evaluateCandidates(candidates: Record<string, unknown>[], domains: DomainReference[], options?: EvaluateCandidatesOptions): CandidateResult[];
export declare function createEvaluator(options?: CreateEvaluatorOptions): Evaluator;
export declare function extractRules(domainData: KdnaDomainData): ScoringRule[];
export declare function extractThresholds(domainData: KdnaDomainData): Record<string, unknown>;
