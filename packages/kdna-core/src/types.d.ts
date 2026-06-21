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
  format: 'kdna';
  format_version: '2.0';
  spec_version: string;
  name: string;
  version: string;
  judgment_version: string;
  status: 'draft' | 'experimental' | 'stable' | 'deprecated' | 'staging';
  quality_badge: 'untested' | 'tested' | 'validated' | 'expert_reviewed' | 'production_ready';
  access: 'public' | 'licensed' | 'remote';
  language?: string;
  default_language: string;
  languages: string[];
  author: { name: string; id?: string; pubkey?: string; public_key_pem?: string };
  license: { type: string; url?: string };
  description: string;
  keywords?: string[];
  encryption?: {
    profile?: string;
    encrypted_entries?: string[];
    [key: string]: any;
  };
  content_digest?: string;
  signature?: string;
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

// Asset reader — direct .kdna API
export const STANDARD_ENTRIES: string[];

export interface KdnaAsset {
  path: string | null;
  size: number;
  asset_digest: string;
  entries: Map<string, unknown>;
  readEntry(name: string): Uint8Array;
}

export interface KdnaAssetVerifyResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  entries: string[];
  manifest: KDNAManifest | null;
  asset_digest: string;
  content_digest: string;
  signature_valid: boolean | null;
}

export interface KdnaAssetIndexProfile {
  profile: 'index';
  manifest: KDNAManifest;
  asset_digest: string;
  content_digest: string;
  entries: string[];
  name: string | null;
  version: string | null;
  judgment_version: string | null;
  keywords: string[];
}

export interface KdnaAssetLoadProfile {
  profile: string;
  manifest: KDNAManifest;
  domain: LoadedDomain | null;
  context: string | null;
}

export interface KdnaAssetReader {
  openSync(input: string | Uint8Array): KdnaAsset;
  open(input: string | Uint8Array): Promise<KdnaAsset>;
  listEntriesSync(asset: KdnaAsset): string[];
  listEntries(asset: KdnaAsset): Promise<string[]>;
  readEntrySync(asset: KdnaAsset, entryName: string): Uint8Array;
  readEntrySync(asset: KdnaAsset, entryName: string, encoding: string): string;
  readEntry(asset: KdnaAsset, entryName: string): Promise<Uint8Array>;
  readEntry(asset: KdnaAsset, entryName: string, encoding: string): Promise<string>;
  readJsonSync(asset: KdnaAsset, entryName: string, options?: KdnaDecryptOptions): any;
  readJson(asset: KdnaAsset, entryName: string, options?: KdnaDecryptOptions): Promise<any>;
  readManifestSync(asset: KdnaAsset): KDNAManifest;
  readManifest(asset: KdnaAsset): Promise<KDNAManifest>;
  readDataMapSync(
    asset: KdnaAsset,
    entries?: string[],
    options?: KdnaDecryptOptions,
  ): KDNAFileDataMap;
  readDataMap(
    asset: KdnaAsset,
    entries?: string[],
    options?: KdnaDecryptOptions,
  ): Promise<KDNAFileDataMap>;
  contentDigestSync(asset: KdnaAsset): string;
  contentDigest(asset: KdnaAsset): Promise<string>;
  verifySync(
    asset: KdnaAsset,
    options?: {
      asset_digest?: string;
      content_digest?: string;
      requireSignature?: boolean;
      requireDecryption?: boolean;
    } & KdnaDecryptOptions,
  ): KdnaAssetVerifyResult;
  verify(
    asset: KdnaAsset,
    options?: {
      asset_digest?: string;
      content_digest?: string;
      requireSignature?: boolean;
      requireDecryption?: boolean;
    } & KdnaDecryptOptions,
  ): Promise<KdnaAssetVerifyResult>;
  loadProfileSync(
    asset: KdnaAsset,
    profile: 'index',
    options?: { input?: string; context?: boolean } & KdnaDecryptOptions,
  ): KdnaAssetIndexProfile;
  loadProfileSync(
    asset: KdnaAsset,
    profile?: 'compact' | 'scenario' | 'full' | string,
    options?: { input?: string; context?: boolean } & KdnaDecryptOptions,
  ): KdnaAssetLoadProfile;
  loadProfile(
    asset: KdnaAsset,
    profile: 'index',
    options?: { input?: string; context?: boolean } & KdnaDecryptOptions,
  ): Promise<KdnaAssetIndexProfile>;
  loadProfile(
    asset: KdnaAsset,
    profile?: 'compact' | 'scenario' | 'full' | string,
    options?: { input?: string; context?: boolean } & KdnaDecryptOptions,
  ): Promise<KdnaAssetLoadProfile>;
}

export interface KdnaDecryptOptions {
  decryptEntry?: (args: {
    asset: KdnaAsset;
    manifest: KDNAManifest;
    entryName: string;
    ciphertext: Uint8Array;
  }) => string | Uint8Array | Promise<string | Uint8Array>;
}

export function createKdnaAssetReader(): KdnaAssetReader;

export const LICENSED_ENTRY_PROFILE: string;

export interface LicensedEntryEnvelope {
  profile: string;
  alg: 'AES-256-GCM';
  kdf: 'scrypt-sha256';
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
}

export function deriveLicensedEntryKey(options: {
  licenseKey: string;
  machineFingerprint: string;
  salt: string | Uint8Array;
  keyLength?: number;
}): Uint8Array;

export function encryptLicensedEntry(
  plaintext: string | Uint8Array,
  options: {
    entryName: string;
    manifest?: KDNAManifest;
    licenseKey: string;
    machineFingerprint: string;
  },
): LicensedEntryEnvelope;

export function decryptLicensedEntry(
  envelope: string | Uint8Array | LicensedEntryEnvelope,
  options: {
    entryName: string;
    manifest?: KDNAManifest;
    licenseKey: string;
    machineFingerprint: string;
  },
): Uint8Array;

export function createLicensedDecryptEntry(options: {
  licenseKey: string;
  machineFingerprint: string;
}): NonNullable<KdnaDecryptOptions['decryptEntry']>;

// Stable public API — preferred entry points for third-party integrations.
export type KDNAAssetInput = string | Uint8Array | KdnaAsset;

export interface KDNAInspectResult {
  name: string | null;
  version: string | null;
  judgment_version: string | null;
  access: string;
  status: string | null;
  quality_badge: string | null;
  risk_level: string | null;
  keywords: string[];
  entries: string[];
  asset_digest: string;
  content_digest: string;
  signature_valid: boolean | null;
  ok: boolean | null;
  errors: string[];
  warnings: string[];
  manifest: KDNAManifest;
}

export interface KDNAValidationReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  asset: KdnaAssetVerifyResult;
  lint: LintResult;
  schema: ValidationResult;
  cross_file: ValidationResult;
}

export interface KDNAMatchResult extends KDNAInspectResult {
  score: number;
  matched: string[];
}

export interface KDNAComposeResult {
  domains: Array<LoadedDomain & { id?: string; name?: string; manifest?: KDNAManifest }>;
  activeDomains: Array<LoadedDomain & { id?: string; name?: string; manifest?: KDNAManifest }>;
  selected: Array<{ id: string; name?: string; role?: string; reason: string }>;
  excluded: Array<{ id: string; name?: string; role?: string; reason: string }>;
  conflicts: Array<{ type: string; domains: string[]; description: string }>;
  context: string;
  attributionMap: Record<string, any>;
  trace: Record<string, any>;
}

export function openKDNA(input: KDNAAssetInput): Promise<KdnaAsset>;
export function openKDNASync(input: KDNAAssetInput): KdnaAsset;
export function inspectKDNA(input: KDNAAssetInput, options?: { verify?: boolean } & KdnaDecryptOptions): Promise<KDNAInspectResult>;
export function inspectKDNASync(input: KDNAAssetInput, options?: { verify?: boolean } & KdnaDecryptOptions): KDNAInspectResult;
export function loadKDNA(input: KDNAAssetInput, options?: { profile?: 'index' | 'compact' | 'scenario' | 'full' | string; input?: string; context?: boolean } & KdnaDecryptOptions): Promise<KdnaAssetIndexProfile | KdnaAssetLoadProfile>;
export function loadKDNASync(input: KDNAAssetInput, options?: { profile?: 'index' | 'compact' | 'scenario' | 'full' | string; input?: string; context?: boolean } & KdnaDecryptOptions): KdnaAssetIndexProfile | KdnaAssetLoadProfile;
export function validateKDNA(input: KDNAAssetInput, options?: { schemas?: Record<string, any>; requireSignature?: boolean; requireDecryption?: boolean } & KdnaDecryptOptions): Promise<KDNAValidationReport>;
export function validateKDNASync(input: KDNAAssetInput, options?: { schemas?: Record<string, any>; requireSignature?: boolean; requireDecryption?: boolean } & KdnaDecryptOptions): KDNAValidationReport;
export function renderForAgent(input: KDNAAssetInput, options?: { profile?: 'compact' | 'scenario' | 'full' | string; input?: string } & KdnaDecryptOptions): Promise<string>;
export function renderForAgentSync(input: KDNAAssetInput, options?: { profile?: 'compact' | 'scenario' | 'full' | string; input?: string } & KdnaDecryptOptions): string;
export function verifyAsset(input: KDNAAssetInput, options?: { asset_digest?: string; content_digest?: string; requireSignature?: boolean; requireDecryption?: boolean } & KdnaDecryptOptions): Promise<KdnaAssetVerifyResult>;
export function verifyAssetSync(input: KDNAAssetInput, options?: { asset_digest?: string; content_digest?: string; requireSignature?: boolean; requireDecryption?: boolean } & KdnaDecryptOptions): KdnaAssetVerifyResult;
export function verifyDigest(input: KDNAAssetInput, expectedDigest: string, options?: KdnaDecryptOptions): Promise<KdnaAssetVerifyResult>;
export function verifyDigestSync(input: KDNAAssetInput, expectedDigest: string, options?: KdnaDecryptOptions): KdnaAssetVerifyResult;
export function verifySignature(input: KDNAAssetInput, options?: KdnaDecryptOptions): Promise<KdnaAssetVerifyResult>;
export function verifySignatureSync(input: KDNAAssetInput, options?: KdnaDecryptOptions): KdnaAssetVerifyResult;
export function matchDomain(input: string, candidates: Array<KDNAAssetInput | KDNAInspectResult>, options?: KdnaDecryptOptions): Promise<KDNAMatchResult[]>;
export function matchDomainSync(input: string, candidates: Array<KDNAAssetInput | KDNAInspectResult>, options?: KdnaDecryptOptions): KDNAMatchResult[];
export function composeKDNA(inputs: KDNAAssetInput[], options?: { input?: string; profile?: 'compact' | 'scenario' | 'full' | string; separator?: string } & KdnaDecryptOptions): Promise<KDNAComposeResult>;

// KDNA Core v1 — source directory / container API
export const MIMETYPE: string;
export const MIMETYPE_V1: string;
export const MIMETYPE_V2: string;
export const V1_REQUIRED_DIR_ENTRIES: string[];

export interface KDNAV1ChecksumEntry {
  algorithm: 'sha256';
  value: string;
}

export interface KDNAV1Checksums {
  algorithm: 'sha256';
  manifest_digest: string;
  payload_digest: string;
  asset_digest: string;
  entries: Record<string, KDNAV1ChecksumEntry>;
}

export function isV1SourceDir(inputPath: string): boolean;
export function detectContainerFormat(inputPath: string): 'v1' | 'v2' | null;
export function inspect(inputPath: string, options?: Record<string, any>): Record<string, any>;
export function validate(inputPath: string, options?: Record<string, any>): Record<string, any>;
export interface KDNAV1LoadPlanIssue {
  code: string;
  severity: 'info' | 'warning' | 'blocking' | string;
  message: string;
}
export interface KDNAV1LoadPlan {
  kdna_version: string | null;
  asset: {
    asset_id: string | null;
    asset_uid: string | null;
    title: string | null;
    version: string | null;
    judgment_version: string | null;
  };
  access: 'public' | 'licensed' | 'remote' | string | null;
  access_alias: string | null;
  entitlement_profile: string | null;
  state:
    | 'ready'
    | 'needs_password'
    | 'needs_license'
    | 'needs_account'
    | 'needs_org_auth'
    | 'needs_runtime'
    | 'offline_grace'
    | 'expired'
    | 'revoked'
    | 'invalid'
    | string;
  required_action:
    | 'none'
    | 'load'
    | 'enter_password'
    | 'install_receipt'
    | 'sign_in_or_activate'
    | 'sync'
    | 'connect_runtime'
    | 'migrate_legacy'
    | 'block'
    | string;
  can_load_now: boolean;
  projection_policy: 'minimal' | 'remote' | 'none' | string;
  input_fingerprint: string | null;
  checks: Record<string, boolean>;
  issues: KDNAV1LoadPlanIssue[];
  source: {
    kind: 'dir' | 'file' | string | null;
    path: string;
  };
}
export function planLoad(inputPath: string, options?: { password?: string; hasPassword?: boolean; entitlement?: Record<string, any> }): KDNAV1LoadPlan;
export function buildChecksumsV1(sourceDir: string): KDNAV1Checksums;
export function pack(sourceDir: string, outputPath: string): void;
export function unpack(inputPath: string, outputDir: string): void;
export function loadAuthorized(inputPath: string, options?: { profile?: 'index' | 'compact' | 'scenario' | 'full' | string; as?: 'json' | 'prompt' | string }): Record<string, any>;
export function loadV1(inputPath: string, options?: { profile?: 'index' | 'compact' | 'scenario' | 'full' | string; as?: 'json' | 'prompt' | string }): Record<string, any>;
export const FORBIDDEN_OUTPUT_TERMS: readonly string[];

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
