export interface KDNAMeta {
  version: string;
  domain: string;
  created: string;
  purpose: string;
  load_condition: string;
}

export interface KDNAAxiom {
  id: string;
  one_sentence: string;
  full_statement: string;
  why: string;
}

export interface KDNAOntologyConcept {
  id: string;
  one_sentence: string;
  essence: string;
  boundary: string;
  trigger_signal: string;
}

export interface KDNAFramework {
  id: string;
  name: string;
  when_to_use: string;
  steps: string[];
}

export interface KDNACoreStructure {
  from: string;
  to: string;
  via: string;
}

export interface KDNACore {
  meta: KDNAMeta;
  axioms: KDNAAxiom[];
  ontology: KDNAOntologyConcept[];
  frameworks: KDNAFramework[];
  core_structure: KDNACoreStructure[];
  stances: string[];
}

export interface KDNAStandardTerm {
  term: string;
  definition: string;
}

export interface KDNABannedTerm {
  term: string;
  why: string;
  replace_with: string;
}

export interface KDNATerminology {
  standard_terms: KDNAStandardTerm[];
  banned_terms: KDNABannedTerm[];
}

export interface KDNAMisunderstanding {
  id: string;
  wrong: string;
  correct: string;
  key_distinction: string;
  why: string;
}

export interface KDNAPatterns {
  meta: KDNAMeta;
  terminology: KDNATerminology;
  misunderstandings: KDNAMisunderstanding[];
  self_check: string[];
}

export interface KDNASubScenario {
  id: string;
  trap_belief: string;
  three_questions: {
    belief: string;
    state: string;
    need: string;
  };
  action_template: string[];
  replace: {
    avoid: string;
    use: string;
  }[];
  expected_result: string;
}

export interface KDNAScene {
  id: string;
  name: string;
  trigger_signal: string;
  sub_scenarios: KDNASubScenario[];
}

export interface KDNAScenarios {
  meta: KDNAMeta;
  scenes: KDNAScene[];
}

export interface KDNACase {
  id: string;
  scene_id?: string;
  title: string;
  context: string;
  what_happened: string;
  what_was_learned: string;
  structural_pattern: string;
}

export interface KDNACases {
  meta: KDNAMeta;
  cases: KDNACase[];
}

export interface KDNAReasoningChain {
  id: string;
  one_sentence: string;
  logic: string[];
  so_what: string;
}

export interface KDNAReasoning {
  meta: KDNAMeta;
  reasoning_chains: KDNAReasoningChain[];
}

export interface KDNAStage {
  id: string;
  name: string;
  description: string;
  indicators: string[];
}

export interface KDNAEvolutionLayer {
  id: string;
  name: string;
  capability: string;
  from_stage: string;
  to_stage: string;
}

export interface KDNAMeasurement {
  id: string;
  what: string;
  how: string;
  threshold: string;
}

export interface KDNAEvolution {
  meta: KDNAMeta;
  stages: KDNAStage[];
  evolution_layers: KDNAEvolutionLayer[];
  measurement: KDNAMeasurement[];
}

export type KDNADomainFile =
  | KDNACore
  | KDNAPatterns
  | KDNAScenarios
  | KDNACases
  | KDNAReasoning
  | KDNAEvolution;

export interface LoadedDomain {
  core: KDNACore;
  patterns: KDNAPatterns;
  scenarios?: KDNAScenarios;
  cases?: KDNACases;
  reasoning?: KDNAReasoning;
  evolution?: KDNAEvolution;
}

export interface LoadOptions {
  input?: string;
  mode?: 'all' | 'minimum' | 'auto';
}

/** Data map keyed by type (core, patterns, scenarios, etc.) */
export interface KDNADataMap {
  core: KDNACore;
  patterns: KDNAPatterns;
  scenarios?: KDNAScenarios;
  cases?: KDNACases;
  reasoning?: KDNAReasoning;
  evolution?: KDNAEvolution;
}

/** Data map keyed by filename */
export interface KDNAFileDataMap {
  'KDNA_Core.json': KDNACore;
  'KDNA_Patterns.json': KDNAPatterns;
  'KDNA_Scenarios.json'?: KDNAScenarios;
  'KDNA_Cases.json'?: KDNACases;
  'KDNA_Reasoning.json'?: KDNAReasoning;
  'KDNA_Evolution.json'?: KDNAEvolution;
  'kdna.json'?: KDNAManifest;
  [key: string]: any;
}

export interface KDNAManifest {
  kdna_spec: string;
  name: string;
  version: string;
  status: 'experimental' | 'basic' | 'stable' | 'pro';
  access: 'open' | 'licensed' | 'runtime';
  language: string;
  author: { name: string; id?: string };
  license: { type: string; url?: string };
  description: string;
}

export interface LintResult {
  errors: string[];
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Loader — data-first API
export function loadCorePatternsFromData(
  coreData: KDNACore,
  patternsData: KDNAPatterns,
): { core: KDNACore; patterns: KDNAPatterns } | null;

export function loadDomainFromData(dataMap: KDNADataMap, options?: LoadOptions): LoadedDomain | null;

export function loadDomainFromFiles(fileDataMap: KDNAFileDataMap, options?: LoadOptions): LoadedDomain | null;

export function classifyInput(text: string): string[];

export function formatContext(domain: LoadedDomain): string;

export const FILE_MAP: Record<string, string>;

// Lint
export function lintDomain(dataMap: KDNAFileDataMap): LintResult;

// Validate
export function validateDomainSchema(dataMap: KDNAFileDataMap, schemaMap?: Record<string, any>): ValidationResult;
export function validateCrossFile(dataMap: KDNAFileDataMap): ValidationResult;

// Render
export function renderPreviewHTML(domain: LoadedDomain, manifest?: KDNAManifest): string;
export function escHtml(s: string): string;
export function renderCard(title: string, count: number | undefined, items: string): string;

// Compose
export function composeContext(domains: LoadedDomain[], options?: { separator?: string }): string;
export function classifySignals(input: string, domains: Array<{ id: string; core: { trigger_signals?: string[] } }>): number[];
export function composeChecks(domains: Array<{ id: string; core: { meta: { domain: string } }; patterns: { self_check: string[] } }>): string[];
export function loadAndCompose(dataMaps: KDNAFileDataMap[], options?: LoadOptions & { separator?: string }): { domains: LoadedDomain[]; context: string; activeIndices: number[] };
