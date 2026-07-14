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
  KDNACore | KDNAPatterns | KDNAScenarios | KDNACases | KDNAReasoning | KDNAEvolution;

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

export function loadDomainFromData(
  dataMap: KDNADataMap,
  options?: LoadOptions,
): LoadedDomain | null;

export function loadDomainFromFiles(
  fileDataMap: KDNAFileDataMap,
  options?: LoadOptions,
): LoadedDomain | null;

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
  readDataMapSync(asset: KdnaAsset, entries?: string[], options?: KdnaDecryptOptions): never;
  /** @deprecated Current payload.kdnab is not projected into legacy source files. */
  readDataMap(asset: KdnaAsset, entries?: string[], options?: KdnaDecryptOptions): Promise<never>;
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
export function grantSigningPayload(
  grant: Omit<KDNAExternalKeyGrant, 'signature'> | KDNAExternalKeyGrant,
): Uint8Array;
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
export function decodeExternalEnvelope(
  value: KDNAExternalGrantEnvelope | Uint8Array,
): KDNAExternalGrantEnvelope;
export function encryptExternalGrantEntry(
  plaintext: string | Uint8Array,
  options: {
    manifest: KDNAManifest;
    entryName?: string;
    issuerRootKey: string | Uint8Array;
    keyRef: string;
    issuerKeyId: string;
    iv?: Uint8Array;
  },
): KDNAExternalGrantEnvelope;
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
export function isVerifiedExternalEntitlement(
  value: unknown,
): value is KDNAVerifiedExternalEntitlement;

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
  asset_digest: string;
  signature: { state: 'verified' | 'not_checked' | 'absent'; issuer?: string };
  access: string;
  risk_level: string | null;
  profile: string;
  context: Record<string, any>;
  trace: Record<string, any>;
  extends_chain?: Array<Record<string, any>>;
  inheritance_applied?: boolean;
  resolved_dependencies?: Array<Record<string, any>>;
  rag_isolation_policy?: Record<string, any>;
  [key: string]: any;
}

export interface KDNACapsule1Extensions {
  extends_chain?: Array<Record<string, any>>;
  inheritance_applied?: boolean;
  resolved_dependencies?: Array<Record<string, any>>;
  rag_isolation_policy?: Record<string, any>;
}

export type KDNADigestComparisonState = 'matched' | 'mismatched' | 'not_compared' | 'unavailable';

export type KDNADigestComparisonSource =
  | 'caller'
  | 'registry'
  | 'install_receipt'
  | 'lockfile'
  | 'kdna.json.content_digest'
  | 'kdna.json.authoring.content_digest'
  | 'checksums.json.entry_set_digest'
  | 'checksums.json.asset_digest';

export interface KDNADigestComparison {
  state: KDNADigestComparisonState;
  against: 'external_expected' | 'manifest_declaration' | 'checksum_declaration' | null;
  expected: string | null;
  source: KDNADigestComparisonSource | null;
}

export interface KDNADigestValue {
  value: string | null;
  basis: string;
  comparison: KDNADigestComparison;
}

export interface KDNADigestEvidence {
  profile: 'kdna-capsule-digests-v1';
  asset: KDNADigestValue;
  content: KDNADigestValue;
  runtime_entry_set: KDNADigestValue;
}

export interface KDNARuntimeCapsuleV2 {
  type: 'kdna.context.capsule';
  version: '2.0';
  asset: {
    asset_id: string;
    asset_uid: string;
    version: string;
    judgment_version: string;
  };
  digests: KDNADigestEvidence;
  signature: { state: 'verified' | 'not_checked' | 'absent'; issuer?: string };
  access: 'public' | 'licensed' | 'remote';
  risk_level: string | null;
  profile: 'index' | 'compact' | 'scenario' | 'full';
  context: Record<string, any>;
  trace: {
    payload_encoding: 'cbor';
    loaded_by: 'kdna-core';
    loaded_at: string;
    input_kind: 'packaged_file' | 'packaged_bytes';
    runtime_eligible: true;
    schema_valid: true;
    signature_state: 'verified' | 'not_checked' | 'absent';
    profile: 'index' | 'compact' | 'scenario' | 'full';
  };
  compatibility?: {
    capsule_1_domain?: string;
    capsule_1_access?: 'open' | 'protected' | 'runtime';
    capsule_1_extensions?: KDNACapsule1Extensions;
  };
}

export const DIGEST_PROFILE: 'kdna-capsule-digests-v1';
export const CAPSULE_DIGEST_PROFILE: 'kdna-capsule-jcs-v1';
export const BASIS: Readonly<{
  asset: 'kdna-container-bytes-v1';
  content: 'kdna-content-tree-v1';
  runtime_entry_set: 'kdna-runtime-entry-set-v1';
}>;
export function computeAssetDigest(assetBytes: Uint8Array): string;
export function computeRuntimeEntrySetDigest(
  manifestBytes: Uint8Array,
  payloadBytes: Uint8Array,
): string;
export function computeDigestEvidence(
  input: string | Uint8Array,
  options?: {
    expectedDigests?: Partial<
      Record<
        'asset' | 'content' | 'runtime_entry_set',
        | string
        | {
            value: string;
            source: 'caller' | 'registry' | 'install_receipt' | 'lockfile';
          }
      >
    >;
    /** @deprecated Use expectedDigests.asset. */
    expectedAssetDigest?:
      string | { value: string; source: 'caller' | 'registry' | 'install_receipt' | 'lockfile' };
  },
): KDNADigestEvidence;
export function canonicalizeJcs(value: unknown): string;
export function computeCapsuleDeliveryDigest(
  capsule: KDNARuntimeCapsuleV2 | Record<string, any>,
): string;
export function buildCapsuleV2(input: {
  capsule1: KDNARuntimeCapsule;
  manifest: KDNAManifest;
  digests: KDNADigestEvidence;
  inputKind: 'packaged_file' | 'packaged_bytes';
  loadedAt?: string;
}): KDNARuntimeCapsuleV2;
export function loadCapsuleV2(
  input: string | Uint8Array,
  options?: {
    profile?: 'index' | 'compact' | 'scenario' | 'full';
    loadedAt?: string;
    expectedDigests?: Partial<
      Record<
        'asset' | 'content' | 'runtime_entry_set',
        | string
        | {
            value: string;
            source: 'caller' | 'registry' | 'install_receipt' | 'lockfile';
          }
      >
    >;
    /** @deprecated Use expectedDigests.asset. */
    expectedAssetDigest?:
      string | { value: string; source: 'caller' | 'registry' | 'install_receipt' | 'lockfile' };
  } & KdnaDecryptOptions,
): KDNARuntimeCapsuleV2;
export function adaptCapsuleV2ToV1(capsule: KDNARuntimeCapsuleV2): KDNARuntimeCapsule;

export type KDNAJsonValue =
  | null
  | boolean
  | number
  | string
  | KDNAJsonValue[]
  | { [key: string]: KDNAJsonValue };

export interface KDNAExecutionContractValidationError {
  code: string;
  message: string;
  details?: unknown;
}

export type KDNAExecutionContractValidationResult =
  | { valid: true; code: null; errors: []; value?: unknown }
  | { valid: false; code: string; errors: KDNAExecutionContractValidationError[] };

export class KDNAExecutionContractError extends Error {
  code: string;
  details?: unknown;
  constructor(code: string, message: string, details?: unknown);
}

export interface KDNAExpectedDigestV1 {
  value: string;
  basis: string;
  source:
    | 'caller'
    | 'registry'
    | 'install_receipt'
    | 'lockfile'
    | 'kdna.json.content_digest'
    | 'checksums.json.entry_set_digest'
    | 'checksums.json.asset_digest';
  comparison: 'matched' | 'not_compared';
}

export interface KDNAConsumptionPlanV1 {
  type: 'kdna.consumption.plan';
  plan_version: '1.0.0';
  plan_id: string;
  created_at: string;
  mode: 'single';
  task: { summary: string; task_family: string | null; context: KDNAJsonValue };
  asset_ref: {
    asset_id: string;
    asset_uid: string;
    version: string;
    judgment_version: string;
    access: 'public' | 'licensed' | 'remote';
    expected_digests: {
      asset: KDNAExpectedDigestV1 | null;
      content: KDNAExpectedDigestV1 | null;
      runtime_entry_set: KDNAExpectedDigestV1 | null;
    };
  };
  projection_request: {
    profile: 'index' | 'compact' | 'scenario' | 'full';
    accepted_capsule_versions: ['2.0'];
    required_digest_profile: 'kdna-capsule-digests-v1';
    require_packaged_asset: true;
  };
  host_request: { accepted_protocols: ['kdna.agent-host/2'] };
  result_request: { shape: 'structured_judgment' };
  budget: KDNAExecutionBudgetV1;
  constraints: { enforce_before_host: true; reject_on_exceed: true };
  trace_policy: { emit: true; storage: 'ephemeral' | 'session' | 'persistent' };
  integrity: { profile: 'kdna-consumption-plan-jcs-v1'; plan_digest: string };
}

export interface KDNAExecutionBudgetV1 {
  max_projection_chars: number;
  max_task_chars: number;
  deadline_ms: number;
  max_tokens: number | null;
  max_model_calls: number | null;
}

export interface KDNAAgentHostCapabilitiesV1 {
  type: 'kdna.agent-host.capabilities';
  version: '1.0';
  capability_basis: 'registered_descriptor' | 'legacy_assumption';
  host_protocols: string[];
  capsule_versions: string[];
  capsule_digest_profiles: string[];
}

export interface KDNAAgentHost2RequestV1 {
  protocol: 'kdna.agent-host/2';
  request_id: string;
  plan_ref: {
    plan_id: string;
    plan_digest_profile: 'kdna-consumption-plan-jcs-v1';
    plan_digest: string;
  };
  runtime_contract: {
    capsule_version: '2.0';
    capsule_digest_profile: 'kdna-capsule-jcs-v1';
    capsule_delivery_digest: string;
  };
  projection_contract: KDNAConsumptionPlanV1['projection_request'] extends infer T
    ? Omit<Extract<T, object>, 'accepted_capsule_versions'>
    : never;
  result_contract: { shape: 'structured_judgment' };
  budget: KDNAExecutionBudgetV1;
  constraints: KDNAConsumptionPlanV1['constraints'];
  phase: 'single_judgment';
  task: KDNAConsumptionPlanV1['task'];
  authority: { asset_id: string; role: 'primary'; final_decision: true };
  asset: KDNAConsumptionPlanV1['asset_ref'] & { role: 'primary' };
  capsule: KDNARuntimeCapsuleV2;
}

export interface KDNAAgentHost2ReceiptV1 {
  protocol: 'kdna.agent-host/2';
  request_id: string;
  runtime_receipt: {
    type: 'kdna.agent-host.runtime-receipt';
    receipt_version: '1.0.0';
    capsule_version: '2.0';
    capsule_digest_profile: 'kdna-capsule-jcs-v1';
    sender_capsule_delivery_digest: string;
    host_recomputed_capsule_delivery_digest: string;
    echoed_capsule_delivery_digest: string;
    capsule_delivery_comparison: 'matched' | 'mismatched';
    capsule_schema_validation: 'passed';
    asset_id_correlation: 'matched';
    provider_execution_status: 'completed' | 'not_started' | 'failed' | 'cancelled' | 'timed_out';
    semantic_consumption: { state: 'not_observed'; basis: null };
    model_identity: { value: string | null; basis: 'host_reported' | 'not_observed' };
    usage: {
      elapsed_ms: number;
      elapsed_basis: 'host_monotonic';
      tokens_used: number | null;
      model_calls: number | null;
      basis: 'host_reported' | 'not_observed';
    };
  };
  outcome: {
    judgment: { answer: string; reasoning: string[]; confidence: string | null };
    usage: { tokens_used: number; model_calls: number } | null;
  } | null;
}

export interface KDNABudgetEvidenceV1 {
  limits: KDNAExecutionBudgetV1;
  actual: {
    projection_chars: number | null;
    task_chars: number;
    elapsed_ms: number | null;
    elapsed_basis: 'host_monotonic' | 'not_observed';
    tokens_used: number | null;
    model_calls: number | null;
    usage_basis: 'host_reported' | 'not_observed';
  };
  comparison: {
    projection_chars: 'within_limit' | 'exceeded' | 'not_observed';
    task_chars: 'within_limit' | 'exceeded';
    elapsed_ms: 'within_limit' | 'exceeded' | 'not_observed';
    tokens_used: 'within_limit' | 'exceeded' | 'not_limited' | 'not_observed';
    model_calls: 'within_limit' | 'exceeded' | 'not_limited' | 'not_observed';
    overall: 'within_limit' | 'exceeded' | 'not_observed';
  };
}

export interface KDNAJudgmentTraceIssueV1 {
  code: string;
  message: string;
  phase: 'plan' | 'negotiation' | 'load' | 'budget' | 'delivery' | 'host' | 'execution';
}

export interface KDNAJudgmentTraceV1 {
  type: 'kdna.judgment.trace';
  trace_version: '1.0.0';
  trace_id: string;
  plan_ref: {
    plan_id: string;
    plan_digest_profile: 'kdna-consumption-plan-jcs-v1';
    plan_digest: string;
    comparison: 'matched';
  };
  parent_trace_id: string | null;
  timestamp: string;
  overall_status: 'execution_completed' | 'blocked' | 'execution_failed' | 'cancelled' | 'timed_out';
  runtime_contract: {
    plan_capsule_versions: ['2.0'];
    core_capsule_versions: Array<'2.0' | '1.0'>;
    plan_host_protocols: ['kdna.agent-host/2'];
    host_capabilities: KDNAAgentHostCapabilitiesV1;
    negotiation_state: 'selected' | 'blocked' | 'not_started';
    selected_capsule_version: '2.0' | null;
    selected_host_protocol: 'kdna.agent-host/2' | null;
    issue_code:
      | 'KDNA_CAPSULE_VERSION_UNSUPPORTED'
      | 'KDNA_HOST_PROTOCOL_UNSUPPORTED'
      | 'KDNA_HOST_CAPSULE_PAIR_UNSUPPORTED'
      | null;
  };
  asset_identity: {
    asset_id: string;
    asset_uid: string;
    version: string;
    judgment_version: string;
    access: 'public' | 'licensed' | 'remote';
  };
  digest_evidence: KDNADigestEvidence;
  capsule_delivery_evidence: {
    basis: 'kdna-capsule-jcs-v1';
    observed: string | null;
    sender_computed: boolean;
    host_recomputed: string | null;
    host_echoed: string | null;
    delivered_capsule_version: '2.0' | null;
    host_boundary_comparison:
      | 'matched'
      | 'mismatched'
      | 'not_delivered'
      | 'not_observed'
      | 'unavailable';
    request_id: string | null;
  };
  projection_actual: {
    profile: 'index' | 'compact' | 'scenario' | 'full' | null;
    capsule_delivery_digest: string | null;
    profile_deviated_from_plan: boolean | null;
  };
  host_receipt: KDNAAgentHost2ReceiptV1 | null;
  execution: {
    delivery_status: 'correlated_response' | 'rejected_before_execution' | 'not_delivered';
    semantic_consumption: { state: 'not_observed'; basis: null };
    execution_status: 'completed' | 'not_started' | 'failed' | 'cancelled' | 'timed_out';
    conformance_status: 'not_evaluated';
    model_identity: { value: string | null; basis: 'host_reported' | 'not_observed' };
  };
  budget: KDNABudgetEvidenceV1;
  result_ref: {
    shape: 'structured_judgment';
    result_digest: string;
    basis: 'kdna-result-jcs-v1';
    stored: boolean;
  } | null;
  errors: KDNAJudgmentTraceIssueV1[];
  warnings: string[];
}

export interface KDNAExecutionPairContextV1 {
  trustedPlanDigest: string;
  capabilities: KDNAAgentHostCapabilitiesV1;
  coreCapsuleVersions: readonly string[];
}

export interface KDNAHost2ValidationContextV1 extends KDNAExecutionPairContextV1 {
  plan: KDNAConsumptionPlanV1;
}

export interface KDNAJudgmentTraceContextV1 extends KDNAHost2ValidationContextV1 {
  request: KDNAAgentHost2RequestV1 | null;
  receipt: KDNAAgentHost2ReceiptV1 | null;
  trustedDeliveryObservation: 'host_receipt' | 'not_delivered' | 'not_observed';
}

export const PLAN_DIGEST_PROFILE: 'kdna-consumption-plan-jcs-v1';
export const HOST_PROTOCOL: 'kdna.agent-host/2';
export const DEFAULT_CORE_CAPSULE_VERSIONS: readonly ['2.0', '1.0'];
export function parseExecutionContractJsonV1(
  input: string | Uint8Array,
  options?: { maxBytes?: number; maxDepth?: number },
): KDNAJsonValue;
export function computeConsumptionPlanDigestV1(plan: KDNAConsumptionPlanV1): string;
export function buildConsumptionPlanV1(input: {
  plan_id: string;
  created_at: string;
  task: KDNAConsumptionPlanV1['task'];
  asset_ref: KDNAConsumptionPlanV1['asset_ref'];
  projection_profile: KDNAConsumptionPlanV1['projection_request']['profile'];
  budget: KDNAExecutionBudgetV1;
  constraints: KDNAConsumptionPlanV1['constraints'];
  trace_policy: KDNAConsumptionPlanV1['trace_policy'];
}): KDNAConsumptionPlanV1;
export function validateConsumptionPlanV1(
  plan: unknown,
  context: { trustedPlanDigest: string },
): KDNAExecutionContractValidationResult;
export function negotiateExecutionPairV1(
  plan: KDNAConsumptionPlanV1,
  context: KDNAExecutionPairContextV1,
): {
  state: 'selected' | 'blocked';
  capsule_version: '2.0' | null;
  host_protocol: 'kdna.agent-host/2' | null;
  issue_code: string | null;
};
export function buildAgentHost2RequestV1(
  input: { request_id: string; capsule: KDNARuntimeCapsuleV2 },
  context: KDNAHost2ValidationContextV1,
): KDNAAgentHost2RequestV1;
export function validateAgentHost2RequestV1(
  request: unknown,
  context: KDNAHost2ValidationContextV1,
): KDNAExecutionContractValidationResult;
export function validateAgentHost2ReceiptV1(
  receipt: unknown,
  context: { request: KDNAAgentHost2RequestV1 },
): KDNAExecutionContractValidationResult;
export function deriveBudgetEvidenceV1(
  plan: KDNAConsumptionPlanV1,
  context: {
    trustedPlanDigest: string;
    request: KDNAAgentHost2RequestV1 | null;
    receipt: KDNAAgentHost2ReceiptV1 | null;
  },
): KDNABudgetEvidenceV1;
export function buildJudgmentTraceV1(
  input: {
    trace_id: string;
    timestamp: string;
    overall_status: KDNAJudgmentTraceV1['overall_status'];
    parent_trace_id?: string | null;
    result_stored?: boolean;
    errors?: KDNAJudgmentTraceIssueV1[];
    warnings?: string[];
  },
  context: KDNAJudgmentTraceContextV1,
): KDNAJudgmentTraceV1;
export function validateJudgmentTraceV1(
  trace: unknown,
  context: KDNAJudgmentTraceContextV1,
): KDNAExecutionContractValidationResult;

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
export function inspectKDNA(
  input: KDNAAssetInput,
  options?: { verify?: boolean } & KdnaDecryptOptions,
): Promise<KDNAInspectResult>;
export function inspectKDNASync(
  input: KDNAAssetInput,
  options?: { verify?: boolean } & KdnaDecryptOptions,
): KDNAInspectResult;
export function loadKDNA(
  input: KDNAAssetInput,
  options?: {
    profile?: 'index' | 'compact' | 'scenario' | 'full' | string;
    as?: 'json' | 'prompt' | string;
  } & KdnaDecryptOptions,
): Promise<KDNARuntimeCapsule | Record<string, any>>;
export function loadKDNASync(
  input: KDNAAssetInput,
  options?: {
    profile?: 'index' | 'compact' | 'scenario' | 'full' | string;
    as?: 'json' | 'prompt' | string;
  } & KdnaDecryptOptions,
): KDNARuntimeCapsule | Record<string, any>;
export function validateKDNA(
  input: KDNAAssetInput,
  options?: Record<string, any>,
): Promise<KDNAValidationReport>;
export function validateKDNASync(
  input: KDNAAssetInput,
  options?: Record<string, any>,
): KDNAValidationReport;
export function renderForAgent(
  input: KDNAAssetInput,
  options?: {
    profile?: 'compact' | 'scenario' | 'full' | string;
    input?: string;
  } & KdnaDecryptOptions,
): Promise<string>;
export function renderForAgentSync(
  input: KDNAAssetInput,
  options?: {
    profile?: 'compact' | 'scenario' | 'full' | string;
    input?: string;
  } & KdnaDecryptOptions,
): string;
export function verifyAsset(
  input: KDNAAssetInput,
  options?: {
    asset_digest?: string;
    content_digest?: string;
    requireSignature?: boolean;
    requireDecryption?: boolean;
  } & KdnaDecryptOptions,
): Promise<KdnaAssetVerifyResult>;
export function verifyAssetSync(
  input: KDNAAssetInput,
  options?: {
    asset_digest?: string;
    content_digest?: string;
    requireSignature?: boolean;
    requireDecryption?: boolean;
  } & KdnaDecryptOptions,
): KdnaAssetVerifyResult;
export function verifyDigest(
  input: KDNAAssetInput,
  expectedDigest: string,
  options?: KdnaDecryptOptions,
): Promise<KdnaAssetVerifyResult>;
export function verifyDigestSync(
  input: KDNAAssetInput,
  expectedDigest: string,
  options?: KdnaDecryptOptions,
): KdnaAssetVerifyResult;
export function verifySignature(
  input: KDNAAssetInput,
  options?: KdnaDecryptOptions,
): Promise<KdnaAssetVerifyResult>;
export function verifySignatureSync(
  input: KDNAAssetInput,
  options?: KdnaDecryptOptions,
): KdnaAssetVerifyResult;
export function matchDomain(
  input: string,
  candidates: Array<KDNAAssetInput | KDNAInspectResult>,
  options?: KdnaDecryptOptions,
): Promise<KDNAMatchResult[]>;
export function matchDomainSync(
  input: string,
  candidates: Array<KDNAAssetInput | KDNAInspectResult>,
  options?: KdnaDecryptOptions,
): KDNAMatchResult[];
/**
 * @deprecated Current Cluster/Capsule composition semantics are not yet
 * defined. This function rejects with KDNA_COMPOSE_PROTOCOL_UNAVAILABLE.
 */
export function composeKDNA(
  inputs: KDNAAssetInput[],
  options?: {
    input?: string;
    profile?: 'compact' | 'scenario' | 'full' | string;
    separator?: string;
  } & KdnaDecryptOptions,
): Promise<never>;

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
export function inspect(
  input: string | Uint8Array,
  options?: Record<string, any>,
): Record<string, any>;
export function validate(
  input: string | Uint8Array,
  options?: Record<string, any>,
): KDNAValidationReport;
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
export function planLoad(
  input: string | Uint8Array,
  options?: {
    password?: string;
    hasPassword?: boolean;
    entitlement?: KDNAVerifiedExternalEntitlement | Record<string, any>;
  },
): KDNALoadPlan;
export function buildChecksums(sourceDir: string): KDNAChecksums;
export function pack(sourceDir: string, outputPath: string): void;
export function unpack(inputPath: string, outputDir: string): void;
export function loadAuthorized(
  input: string | Uint8Array,
  options?: {
    profile?: 'index' | 'compact' | 'scenario' | 'full' | string;
    as?: 'json' | 'prompt' | string;
  },
): KDNARuntimeCapsule | Record<string, any>;
export function load(
  input: string | Uint8Array,
  options?: {
    profile?: 'index' | 'compact' | 'scenario' | 'full' | string;
    as?: 'json' | 'prompt' | string;
  },
): KDNARuntimeCapsule | Record<string, any>;
export function loadAsset(
  input: string | Uint8Array,
  options?: {
    profile?: 'index' | 'compact' | 'scenario' | 'full' | string;
    as?: 'json' | 'prompt' | string;
  },
): KDNARuntimeCapsule | Record<string, any>;
export const FORBIDDEN_OUTPUT_TERMS: readonly string[];

// Lint
export function lintDomain(dataMap: KDNAFileDataMap): LintResult;

// Validate
export function validateDomainSchema(
  dataMap: KDNAFileDataMap,
  schemaMap?: Record<string, any>,
): ValidationResult;
export function validateCrossFile(dataMap: KDNAFileDataMap): ValidationResult;

// Render
export function renderPreviewHTML(domain: LoadedDomain, manifest?: KDNAManifest): string;
export function escHtml(s: string): string;
export function renderCard(title: string, count: number | undefined, items: string): string;

// Compose
export function composeContext(domains: LoadedDomain[], options?: { separator?: string }): string;
export function classifySignals(
  input: string,
  domains: Array<{ id: string; core: { trigger_signals?: string[] } }>,
): number[];
export function composeChecks(
  domains: Array<{
    id: string;
    core: { meta: { domain: string } };
    patterns: { self_check: string[] };
  }>,
): string[];
export function loadAndCompose(
  dataMaps: KDNAFileDataMap[],
  options?: LoadOptions & { separator?: string },
): { domains: LoadedDomain[]; context: string; activeIndices: number[] };
