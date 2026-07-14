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
  kdna_version: '1.0';
  asset_id: string;
  asset_uid: string;
  asset_type: 'domain' | 'cluster' | 'tool' | 'sample' | 'fixture' | 'bundle';
  title: string;
  version: string;
  judgment_version: string;
  created_at: string;
  updated_at: string;
  compatibility: {
    min_loader_version: string;
    profile: 'judgment-profile-v1' | 'bundle-profile-v1';
    [key: string]: any;
  };
  payload: {
    path: 'payload.kdnab';
    encoding: 'cbor';
    encrypted: boolean;
    [key: string]: any;
  };
  creator?: {
    name: string;
    id?: string;
    creator_type?: 'human' | 'agent' | 'tool' | 'organization';
    pubkey?: string;
    [key: string]: any;
  };
  access?: 'public' | 'licensed' | 'remote';
  language?: string;
  languages?: string[];
  license?: string | { type: string; url?: string };
  summary?: string;
  description?: string;
  keywords?: string[];
  load_contract?: Record<string, any>;
  encryption?: {
    profile?: string;
    encrypted_entries?: string[];
    [key: string]: any;
  };
  /** @deprecated Legacy source/signature compatibility only. */
  name?: string;
  /** @deprecated Legacy source/signature compatibility only. */
  author?: { name: string; id?: string; pubkey?: string; public_key_pem?: string };
  content_digest?: string;
  signature?: string;
  [key: string]: any;
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
/** @deprecated Legacy source-tree entry names. Current Runtime assets use payload.kdnab. */
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
  /** @deprecated Current payload.kdnab is not projected into legacy source files. */
  readDataMapSync(
    asset: KdnaAsset,
    entries?: string[],
    options?: KdnaDecryptOptions,
  ): never;
  /** @deprecated Current payload.kdnab is not projected into legacy source files. */
  readDataMap(
    asset: KdnaAsset,
    entries?: string[],
    options?: KdnaDecryptOptions,
  ): Promise<never>;
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
    profile?: 'index' | 'compact' | 'scenario' | 'full' | string,
    options?: { as?: 'json' | 'prompt' | string } & KdnaDecryptOptions,
  ): KDNARuntimeCapsule | Record<string, any>;
  loadProfile(
    asset: KdnaAsset,
    profile?: 'index' | 'compact' | 'scenario' | 'full' | string,
    options?: { as?: 'json' | 'prompt' | string } & KdnaDecryptOptions,
  ): Promise<KDNARuntimeCapsule | Record<string, any>>;
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

export const EXTERNAL_ENVELOPE_PROFILE: 'kdna-envelope-external-grant-v1';
export const EXTERNAL_GRANT_PROFILE: 'kdna-key-grant-v1';

export class KDNAExternalGrantError extends Error {
  code: string;
}

export interface KDNAExternalGrantEnvelope {
  profile: 'kdna-envelope-external-grant-v1';
  alg: 'A256GCM';
  cek_derivation: 'HKDF-SHA256';
  key_ref: string;
  issuer_key_id: string;
  entry_path: string;
  plaintext_digest: string;
  iv: string;
  tag: string;
  ciphertext: string;
}

export interface KDNAExternalKeyGrant {
  profile: 'kdna-key-grant-v1';
  grant_id: string;
  issuer: string;
  signing_key_id: string;
  entitlement_id: string;
  account_id: string;
  device_id: string;
  device_public_key: string;
  device_signing_public_key: string;
  asset: {
    asset_id: string;
    asset_uid: string;
    version: string;
    digest: string;
    entry_path: string;
    ciphertext_digest: string;
    key_ref: string;
    issuer_key_id: string;
  };
  issued_at: string;
  refresh_after: string;
  offline_grace_until: string;
  expires_at: string;
  status: 'active' | 'revoked' | 'expired';
  status_version: number;
  wrap: {
    alg: 'X25519-HKDF-SHA256+A256KW';
    ephemeral_public_key: string;
    salt: string;
    wrapped_cek: string;
  };
  signature: string;
}

export interface KDNADeviceKeyPairs {
  agreement: { public_key: string; private_key: string };
  signing: { public_key: string; private_key: string };
}

/** Runtime-branded by authorizeExternalKeyGrant; a structurally similar object is not accepted. */
export interface KDNAVerifiedExternalEntitlement {
  readonly status: 'active' | 'offline_grace';
  readonly profile: 'kdna-key-grant-v1';
  readonly grant_id: string;
  readonly entitlement_id: string;
  readonly account_id: string;
  readonly device_id: string;
  readonly refresh_after: string;
  readonly offline_grace_until: string;
  readonly expires_at: string;
  readonly asset: {
    readonly asset_id: string;
    readonly asset_uid: string;
    readonly version: string;
    readonly digest: string;
    readonly entry_path: string;
    readonly ciphertext_digest: string;
    readonly key_ref: string;
    readonly issuer_key_id: string;
  };
}

export interface KDNAExternalAuthorization {
  entitlement: KDNAVerifiedExternalEntitlement;
  decryptEntry: NonNullable<KdnaDecryptOptions['decryptEntry']>;
  dispose(): void;
}

export function canonicalJson(value: unknown): string;
export function grantSigningPayload(grant: Omit<KDNAExternalKeyGrant, 'signature'> | KDNAExternalKeyGrant): Uint8Array;
export function validateExternalEnvelope(value: unknown): KDNAExternalGrantEnvelope;
export function validateExternalKeyGrant(value: unknown): KDNAExternalKeyGrant;
export function externalEnvelopeAad(options: {
  manifest: KDNAManifest;
  entryName: string;
  plaintextDigest: string;
  keyRef: string;
  issuerKeyId: string;
}): Uint8Array;
export function deriveExternalAssetCek(options: {
  issuerRootKey: string | Uint8Array;
  manifest: KDNAManifest;
  entryName: string;
  plaintextDigest: string;
  keyRef: string;
  issuerKeyId: string;
}): Uint8Array;
export function encodeExternalEnvelope(value: KDNAExternalGrantEnvelope): Uint8Array;
export function decodeExternalEnvelope(value: KDNAExternalGrantEnvelope | Uint8Array): KDNAExternalGrantEnvelope;
export function encryptExternalGrantEntry(plaintext: string | Uint8Array, options: {
  manifest: KDNAManifest;
  entryName?: string;
  issuerRootKey: string | Uint8Array;
  keyRef: string;
  issuerKeyId: string;
  iv?: Uint8Array;
}): KDNAExternalGrantEnvelope;
export function generateDeviceKeyPairs(): KDNADeviceKeyPairs;
export function createExternalKeyGrant(options: {
  issuerRootKey: string | Uint8Array;
  issuerSigningPrivateKey: unknown;
  signingKeyId: string;
  issuer: string;
  entitlementId: string;
  accountId: string;
  deviceId: string;
  devicePublicKey: string;
  deviceSigningPublicKey: string;
  manifest: KDNAManifest;
  envelope: KDNAExternalGrantEnvelope | Uint8Array;
  assetDigest: string;
  status?: 'active' | 'revoked' | 'expired';
  statusVersion?: number;
  issuedAt?: Date | string;
  refreshAfter?: Date | string;
  offlineGraceUntil?: Date | string;
  expiresAt?: Date | string;
  grantId?: string;
  ephemeralKeyPair?: unknown;
  wrapSalt?: Uint8Array;
}): KDNAExternalKeyGrant;
export function authorizeExternalKeyGrant(options: {
  grant: KDNAExternalKeyGrant;
  issuerPublicKeys: Map<string, unknown> | Record<string, unknown>;
  manifest: KDNAManifest;
  checksums: KDNAChecksums;
  envelope: KDNAExternalGrantEnvelope | Uint8Array;
  deviceAgreementKey: KDNADeviceKeyPairs['agreement'] | unknown;
  expectedAccountId: string;
  expectedDeviceId: string;
  expectedDeviceSigningPublicKey: string;
  minimumStatusVersion?: number;
  now?: Date | string;
  networkAvailable?: boolean;
  allowOffline?: boolean;
}): KDNAExternalAuthorization;
export function isVerifiedExternalEntitlement(value: unknown): value is KDNAVerifiedExternalEntitlement;

// Stable public API — preferred entry points for third-party integrations.
export type KDNAAssetInput = string | Uint8Array | KdnaAsset;

export interface KDNAInspectResult {
  kdna_version: string | null;
  asset_id: string | null;
  asset_uid: string | null;
  asset_type: string | null;
  title: string | null;
  version: string | null;
  judgment_version: string | null;
  payload: string | null;
  payload_encrypted: boolean | null;
  profile: string | null;
  load_contract_default_profile: string | null;
  checksums_present?: boolean;
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
  format_valid: boolean;
  schema_valid: boolean;
  payload_valid: boolean;
  checksums_valid: boolean;
  load_contract_valid: boolean;
  overall_valid: boolean;
  problems: string[];
}

export interface KDNARuntimeCapsule {
  type: 'kdna.context.capsule';
  version: '1.0';
  domain: string | null;
  judgment_version: string | null;
  asset_digest: string | null;
  signature: { state: 'verified' | 'not_checked' | 'absent'; issuer?: string };
  access: string;
  risk_level: string | null;
  profile: string;
  context: Record<string, any>;
  trace: Record<string, any>;
  [key: string]: any;
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
export function loadKDNA(input: KDNAAssetInput, options?: { profile?: 'index' | 'compact' | 'scenario' | 'full' | string; as?: 'json' | 'prompt' | string } & KdnaDecryptOptions): Promise<KDNARuntimeCapsule | Record<string, any>>;
export function loadKDNASync(input: KDNAAssetInput, options?: { profile?: 'index' | 'compact' | 'scenario' | 'full' | string; as?: 'json' | 'prompt' | string } & KdnaDecryptOptions): KDNARuntimeCapsule | Record<string, any>;
export function validateKDNA(input: KDNAAssetInput, options?: Record<string, any>): Promise<KDNAValidationReport>;
export function validateKDNASync(input: KDNAAssetInput, options?: Record<string, any>): KDNAValidationReport;
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
/**
 * @deprecated Current Cluster/Capsule composition semantics are not yet
 * defined. This function rejects with KDNA_COMPOSE_PROTOCOL_UNAVAILABLE.
 */
export function composeKDNA(inputs: KDNAAssetInput[], options?: { input?: string; profile?: 'compact' | 'scenario' | 'full' | string; separator?: string } & KdnaDecryptOptions): Promise<never>;

// KDNA Core — authoring source and packaged runtime API
export const MIMETYPE: string;
export const REQUIRED_DIR_ENTRIES: string[];

export interface KDNAChecksumEntry {
  algorithm: 'sha256';
  value: string;
}

export interface KDNAChecksums {
  digest_profile?: 'kdna-runtime-entry-set-v1';
  covered_entries?: ['kdna.json', 'payload.kdnab'];
  algorithm: 'sha256';
  manifest_digest?: string;
  payload_digest?: string;
  entry_set_digest?: string;
  /** @deprecated Use entry_set_digest. This is not the final .kdna file digest. */
  asset_digest?: string;
  entries?: Record<string, KDNAChecksumEntry>;
}

export function isKdnaSourceDir(inputPath: string): boolean;
export function detectContainerFormat(inputPath: string): 'kdna' | null;
export function inspect(input: string | Uint8Array, options?: Record<string, any>): Record<string, any>;
export function validate(input: string | Uint8Array, options?: Record<string, any>): KDNAValidationReport;
export interface KDNALoadPlanIssue {
  code: string;
  severity: 'info' | 'warning' | 'blocking' | string;
  message: string;
}
export interface KDNALoadPlan {
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
  issues: KDNALoadPlanIssue[];
  source: {
    kind: 'dir' | 'file' | 'memory' | string | null;
    path: string | null;
  };
}
export function planLoad(input: string | Uint8Array, options?: { password?: string; hasPassword?: boolean; entitlement?: KDNAVerifiedExternalEntitlement | Record<string, any> }): KDNALoadPlan;
export function buildChecksums(sourceDir: string): KDNAChecksums;
export function pack(sourceDir: string, outputPath: string): void;
export function unpack(inputPath: string, outputDir: string): void;
export function loadAuthorized(input: string | Uint8Array, options?: { profile?: 'index' | 'compact' | 'scenario' | 'full' | string; as?: 'json' | 'prompt' | string }): KDNARuntimeCapsule | Record<string, any>;
export function load(input: string | Uint8Array, options?: { profile?: 'index' | 'compact' | 'scenario' | 'full' | string; as?: 'json' | 'prompt' | string }): KDNARuntimeCapsule | Record<string, any>;
export function loadAsset(input: string | Uint8Array, options?: { profile?: 'index' | 'compact' | 'scenario' | 'full' | string; as?: 'json' | 'prompt' | string }): KDNARuntimeCapsule | Record<string, any>;
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
