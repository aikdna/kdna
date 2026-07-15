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
  format_version: '0.1.0';
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
    profile: 'kdna.payload.judgment' | 'kdna.payload.bundle';
    profile_version: '0.1.0';
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
  content_digest?: string;
  signature?: string;
  [key: string]: any;
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

export const LICENSED_ENTRY_PROFILE: 'kdna.encryption.licensed-entry';
export const PASSWORD_PROTECTED_PROFILE: 'kdna.encryption.password';
export const PASSWORD_PROTECTED_SCRYPT_PROFILE: 'kdna.encryption.password.scrypt';
export const ENCRYPTION_PROFILE_VERSION: '0.1.0';
export const ALG: 'AES-256-GCM';
export const RFC_KDF: 'HKDF-SHA256';
export const RFC_KEY_WRAPPING: 'AES-256-KW';
export const PASSWORD_KDF: 'Argon2id';
export const SCRYPT_KDF: 'scrypt-sha256';

export type KDNACryptoInput = string | Uint8Array;

export interface LicensedEntryEnvelope {
  profile: 'kdna.encryption.licensed-entry';
  profile_version: '0.1.0';
  alg: 'AES-256-GCM';
  kdf: 'HKDF-SHA256';
  key_wrapping: 'AES-256-KW';
  wrapped_key: string;
  iv: string;
  tag: string;
  ciphertext: string;
}

export interface KDNAPasswordKdfParams {
  salt: string;
  memory_kib?: number;
  iterations?: number;
  parallelism?: number;
}

export interface KDNAPasswordKdfDescriptor {
  name: 'Argon2id';
  salt: string;
  memory_kib: number;
  iterations: number;
  parallelism: number;
}

export interface KDNAScryptKdfParams {
  salt: string;
  N?: number;
  r?: number;
  p?: number;
}

export interface KDNAProtectedEntryEnvelope {
  profile: 'kdna.encryption.password';
  profile_version: '0.1.0';
  alg: 'AES-256-GCM';
  kdf: 'Argon2id';
  key_wrapping: 'AES-256-KW';
  password_kdf: KDNAPasswordKdfDescriptor;
  key_slots: Array<{
    slot: 'password' | 'recovery';
    wrap: 'AES-256-KW';
    wrapped_key: string;
  }>;
  iv: string;
  tag: string;
  ciphertext: string;
}

export interface KDNAScryptProtectedEntryEnvelope {
  profile: 'kdna.encryption.password.scrypt';
  profile_version: '0.1.0';
  alg: 'AES-256-GCM';
  kdf: 'scrypt-sha256';
  key_wrapping: 'AES-256-KW';
  scrypt_params: Required<KDNAScryptKdfParams>;
  key_slots: Array<{
    slot: 'password';
    wrap: 'AES-256-KW';
    wrapped_key: string;
  }>;
  iv: string;
  tag: string;
  ciphertext: string;
}

export interface KDNALicensedEntryOptions {
  entryName: string;
  manifest?: KDNAManifest;
  licenseKey: KDNACryptoInput;
}

export function hkdfSha256(
  ikm: KDNACryptoInput,
  salt?: Uint8Array | null,
  info?: KDNACryptoInput,
  length?: number,
): Uint8Array;
export function aesWrap(key: Uint8Array, plaintext: Uint8Array): Uint8Array;
export function aesUnwrap(key: Uint8Array, ciphertext: Uint8Array): Uint8Array;
export function deriveWrappingKey(licenseKey: KDNACryptoInput, info?: KDNACryptoInput): Uint8Array;
export function generateCEK(): Uint8Array;
export function wrapCEK(cek: Uint8Array, wrappingKey: Uint8Array): Uint8Array;
export function unwrapCEK(wrappedCek: Uint8Array, wrappingKey: Uint8Array): Uint8Array;

export function encryptLicensedEntry(
  plaintext: KDNACryptoInput,
  options: KDNALicensedEntryOptions,
): LicensedEntryEnvelope;
export function decryptLicensedEntry(
  envelope: KDNACryptoInput | LicensedEntryEnvelope,
  options: KDNALicensedEntryOptions,
): Uint8Array;
export function derivePasswordKey(
  password: KDNACryptoInput,
  params: KDNAPasswordKdfParams,
): Uint8Array;
export function generateRecoveryCode(): string;
export function decodeRecoveryCode(code: string): Uint8Array;
export function encryptProtectedEntry(
  plaintext: KDNACryptoInput,
  options: {
    entryName: string;
    manifest?: KDNAManifest;
    password: KDNACryptoInput;
    includeRecovery?: boolean;
    recoveryCode?: string;
  },
): KDNAProtectedEntryEnvelope;
export function decryptProtectedEntry(
  envelope: KDNACryptoInput | KDNAProtectedEntryEnvelope,
  options: {
    entryName: string;
    manifest?: KDNAManifest;
  } & (
    | { password: KDNACryptoInput; recoveryCode?: string }
    | { password?: undefined; recoveryCode: string }
  ),
): Uint8Array;
export function createPasswordDecryptEntry(options: {
  password: KDNACryptoInput;
}): NonNullable<KdnaDecryptOptions['decryptEntry']>;
export function createRecoveryDecryptEntry(options: {
  recoveryCode: string;
}): NonNullable<KdnaDecryptOptions['decryptEntry']>;
export function derivePasswordKeyScrypt(
  password: KDNACryptoInput,
  params: KDNAScryptKdfParams,
): Uint8Array;
export function encryptProtectedEntryScrypt(
  plaintext: KDNACryptoInput,
  options: {
    entryName: string;
    manifest?: KDNAManifest;
    password: KDNACryptoInput;
  },
): KDNAScryptProtectedEntryEnvelope;
export function decryptProtectedEntryScrypt(
  envelope: KDNACryptoInput | KDNAScryptProtectedEntryEnvelope,
  options: {
    entryName: string;
    manifest?: KDNAManifest;
    password: KDNACryptoInput;
  },
): Uint8Array;
export function createPasswordDecryptEntryScrypt(options: {
  password: KDNACryptoInput;
}): NonNullable<KdnaDecryptOptions['decryptEntry']>;
export function createLicensedDecryptEntry(options: {
  licenseKey: KDNACryptoInput;
}): NonNullable<KdnaDecryptOptions['decryptEntry']>;

export const EXTERNAL_ENVELOPE_PROFILE: 'kdna.envelope.external-grant';
export const EXTERNAL_GRANT_PROFILE: 'kdna.grant.external-key';
export const EXTERNAL_AAD_PROFILE: 'kdna.key-context.asset-content';
export const DEVICE_KEK_PROFILE: 'kdna.key-context.device-grant';
export const EXTERNAL_GRANT_CONTRACT_VERSION: '0.1.0';

export class KDNAExternalGrantError extends Error {
  code: string;
}

export interface KDNAExternalGrantEnvelope {
  profile: 'kdna.envelope.external-grant';
  contract_version: '0.1.0';
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
  profile: 'kdna.grant.external-key';
  contract_version: '0.1.0';
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
  readonly profile: 'kdna.grant.external-key';
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
  /** Final immutable container digest A; never checksums entry-set digest E. */
  expectedAssetDigest: string;
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
  format_version: '0.1.0' | null;
  asset_id: string | null;
  asset_uid: string | null;
  asset_type: string | null;
  title: string | null;
  version: string | null;
  judgment_version: string | null;
  payload: string | null;
  payload_encrypted: boolean | null;
  profile: string | null;
  loader_version: string;
  min_loader_version: string | null;
  loader_compatible: boolean | null;
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
  loader_version: string;
  min_loader_version: string | null;
  loader_compatible: boolean | null;
  overall_valid: boolean;
  problems: string[];
}

export type KDNADigestComparisonState = 'matched' | 'mismatched' | 'not_compared' | 'unavailable';

export type KDNADigestComparisonSource =
  | 'caller'
  | 'registry'
  | 'install_receipt'
  | 'lockfile'
  | 'kdna.json.content_digest'
  | 'kdna.json.authoring.content_digest'
  | 'checksums.json.entry_set_digest';

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
  profile: 'kdna.digest-evidence';
  profile_version: '0.1.0';
  asset: KDNADigestValue;
  content: KDNADigestValue;
  runtime_entry_set: KDNADigestValue;
}

export interface KDNARuntimeCapsule {
  type: 'kdna.runtime-capsule';
  contract_version: '0.1.0';
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
}

export const DIGEST_PROFILE: 'kdna.digest-evidence';
export const DIGEST_PROFILE_VERSION: '0.1.0';
export const CAPSULE_DIGEST_PROFILE: 'kdna.canonicalization.runtime-capsule-jcs';
export const CANONICALIZATION_PROFILE_VERSION: '0.1.0';
export const RUNTIME_CAPSULE_CONTRACT_VERSION: '0.1.0';
export const BASIS: Readonly<{
  asset: 'kdna.digest-basis.container-bytes';
  content: 'kdna.digest-basis.content-tree';
  runtime_entry_set: 'kdna.digest-basis.runtime-entry-set';
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
  },
): KDNADigestEvidence;
export function canonicalizeJcs(value: unknown): string;
export function computeCapsuleDeliveryDigest(
  capsule: KDNARuntimeCapsule | Record<string, any>,
): string;
export function buildRuntimeCapsule(input: {
  projection: Record<string, any>;
  manifest: KDNAManifest;
  digests: KDNADigestEvidence;
  signature: { state: 'verified' | 'not_checked' | 'absent'; issuer?: string };
  inputKind: 'packaged_file' | 'packaged_bytes';
  loadedAt?: string;
  schemaValid?: boolean;
}): KDNARuntimeCapsule;
export function loadRuntimeCapsule(
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
  } & KdnaDecryptOptions,
): KDNARuntimeCapsule;
export type KDNAJsonValue =
  null | boolean | number | string | KDNAJsonValue[] | { [key: string]: KDNAJsonValue };

export interface KDNAExecutionContractValidationError {
  code: string;
  message: string;
  details?: unknown;
}

export type KDNAExecutionContractValidationResult =
  | { valid: true; code: null; errors: []; value?: unknown }
  | { valid: false; code: string; errors: KDNAExecutionContractValidationError[] };

export class KDNARuntimeContractError extends Error {
  code: string;
  details?: unknown;
  constructor(code: string, message: string, details?: unknown);
}

export interface KDNAExpectedDigest {
  value: string;
  basis: string;
  source:
    | 'caller'
    | 'registry'
    | 'install_receipt'
    | 'lockfile'
    | 'kdna.json.content_digest'
    | 'checksums.json.entry_set_digest';
  comparison: 'matched' | 'not_compared';
}

export interface KDNAConsumptionPlan {
  type: 'kdna.consumption-plan';
  contract_version: '0.1.0';
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
      asset: KDNAExpectedDigest | null;
      content: KDNAExpectedDigest | null;
      runtime_entry_set: KDNAExpectedDigest | null;
    };
  };
  projection_request: {
    profile: 'index' | 'compact' | 'scenario' | 'full';
    accepted_capsule_versions: ['0.1.0'];
    required_digest_profile: 'kdna.digest-evidence';
    required_digest_profile_version: '0.1.0';
    require_packaged_asset: true;
  };
  host_request: { accepted_protocols: ['kdna.agent-host'] };
  result_request: { shape: 'structured_judgment' };
  budget: KDNAExecutionBudget;
  constraints: { enforce_before_host: true; reject_on_exceed: true };
  trace_policy: { emit: true; storage: 'ephemeral' | 'session' | 'persistent' };
  integrity: {
    profile: 'kdna.canonicalization.consumption-plan-jcs';
    profile_version: '0.1.0';
    plan_digest: string;
  };
}

export interface KDNAExecutionBudget {
  max_projection_chars: number;
  max_task_chars: number;
  deadline_ms: number;
  max_tokens: number | null;
  max_model_calls: number | null;
}

export interface KDNAAgentHostCapabilities {
  type: 'kdna.agent-host-capabilities';
  protocol_version: '0.1.0';
  capability_basis: 'registered_descriptor' | 'legacy_assumption';
  host_protocols: Array<'kdna.agent-host'>;
  capsule_versions: Array<'0.1.0'>;
  capsule_digest_profiles: Array<'kdna.canonicalization.runtime-capsule-jcs'>;
  capsule_digest_profile_versions: ['0.1.0'];
}

export interface KDNAAgentHostRequest {
  protocol: 'kdna.agent-host';
  protocol_version: '0.1.0';
  request_id: string;
  plan_ref: {
    plan_id: string;
    plan_digest_profile: 'kdna.canonicalization.consumption-plan-jcs';
    plan_digest_profile_version: '0.1.0';
    plan_digest: string;
  };
  runtime_contract: {
    capsule_version: '0.1.0';
    capsule_digest_profile: 'kdna.canonicalization.runtime-capsule-jcs';
    capsule_digest_profile_version: '0.1.0';
    capsule_delivery_digest: string;
  };
  projection_contract: KDNAConsumptionPlan['projection_request'] extends infer T
    ? Omit<Extract<T, object>, 'accepted_capsule_versions'>
    : never;
  result_contract: { shape: 'structured_judgment' };
  budget: KDNAExecutionBudget;
  constraints: KDNAConsumptionPlan['constraints'];
  phase: 'single_judgment';
  task: KDNAConsumptionPlan['task'];
  authority: { asset_id: string; role: 'primary'; final_decision: true };
  asset: KDNAConsumptionPlan['asset_ref'] & { role: 'primary' };
  capsule: KDNARuntimeCapsule;
}

export interface KDNAAgentHostReceipt {
  protocol: 'kdna.agent-host';
  protocol_version: '0.1.0';
  request_id: string;
  runtime_receipt: {
    type: 'kdna.agent-host.runtime-receipt';
    contract_version: '0.1.0';
    capsule_version: '0.1.0';
    capsule_digest_profile: 'kdna.canonicalization.runtime-capsule-jcs';
    capsule_digest_profile_version: '0.1.0';
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

export interface KDNABudgetEvidence {
  limits: KDNAExecutionBudget;
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

export interface KDNAJudgmentTraceIssue {
  code: string;
  message: string;
  phase: 'plan' | 'negotiation' | 'load' | 'budget' | 'delivery' | 'host' | 'execution';
}

export interface KDNAJudgmentTrace {
  type: 'kdna.judgment-trace';
  contract_version: '0.1.0';
  trace_id: string;
  plan_ref: {
    plan_id: string;
    plan_digest_profile: 'kdna.canonicalization.consumption-plan-jcs';
    plan_digest_profile_version: '0.1.0';
    plan_digest: string;
    comparison: 'matched';
  };
  parent_trace_id: string | null;
  timestamp: string;
  overall_status:
    'execution_completed' | 'blocked' | 'execution_failed' | 'cancelled' | 'timed_out';
  runtime_contract: {
    plan_capsule_versions: ['0.1.0'];
    core_capsule_versions: Array<'0.1.0'>;
    plan_host_protocols: ['kdna.agent-host'];
    host_capabilities: KDNAAgentHostCapabilities;
    negotiation_state: 'selected' | 'blocked' | 'not_started';
    selected_capsule_version: '0.1.0' | null;
    selected_host_protocol: 'kdna.agent-host' | null;
    issue_code:
      | 'KDNA_CAPSULE_CONTRACT_VERSION_UNSUPPORTED'
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
    basis: 'kdna.canonicalization.runtime-capsule-jcs';
    basis_version: '0.1.0';
    observed: string | null;
    sender_computed: boolean;
    host_recomputed: string | null;
    host_echoed: string | null;
    delivered_capsule_version: '0.1.0' | null;
    host_boundary_comparison:
      'matched' | 'mismatched' | 'not_delivered' | 'not_observed' | 'unavailable';
    request_id: string | null;
  };
  projection_actual: {
    profile: 'index' | 'compact' | 'scenario' | 'full' | null;
    capsule_delivery_digest: string | null;
    profile_deviated_from_plan: boolean | null;
  };
  host_receipt: KDNAAgentHostReceipt | null;
  execution: {
    delivery_status: 'correlated_response' | 'rejected_before_execution' | 'not_delivered';
    semantic_consumption: { state: 'not_observed'; basis: null };
    execution_status: 'completed' | 'not_started' | 'failed' | 'cancelled' | 'timed_out';
    conformance_status: 'not_evaluated';
    model_identity: { value: string | null; basis: 'host_reported' | 'not_observed' };
  };
  budget: KDNABudgetEvidence;
  result_ref: {
    shape: 'structured_judgment';
    result_digest: string;
    basis: 'kdna.canonicalization.result-jcs';
    stored: boolean;
  } | null;
  errors: KDNAJudgmentTraceIssue[];
  warnings: string[];
}

export interface KDNARuntimePairContext {
  trustedPlanDigest: string;
  capabilities: KDNAAgentHostCapabilities;
  coreCapsuleVersions: readonly string[];
}

export interface KDNAAgentHostValidationContext extends KDNARuntimePairContext {
  plan: KDNAConsumptionPlan;
}

export interface KDNAJudgmentTraceContext extends KDNAAgentHostValidationContext {
  request: KDNAAgentHostRequest | null;
  receipt: KDNAAgentHostReceipt | null;
  trustedDeliveryObservation: 'host_receipt' | 'not_delivered' | 'not_observed';
}

export interface KDNAPreHostBudgetBlockedTraceContext
  extends KDNAAgentHostValidationContext {
  capsule: KDNARuntimeCapsule;
}

export const PLAN_DIGEST_PROFILE: 'kdna.canonicalization.consumption-plan-jcs';
export const PLAN_DIGEST_PROFILE_VERSION: '0.1.0';
export const HOST_PROTOCOL: 'kdna.agent-host';
export const HOST_PROTOCOL_VERSION: '0.1.0';
export const DEFAULT_CORE_CAPSULE_CONTRACT_VERSIONS: readonly ['0.1.0'];
export function parseRuntimeContractJson(
  input: string | Uint8Array,
  options?: { maxBytes?: number; maxDepth?: number },
): KDNAJsonValue;
export function computeConsumptionPlanDigest(plan: KDNAConsumptionPlan): string;
export function buildConsumptionPlan(input: {
  plan_id: string;
  created_at: string;
  task: KDNAConsumptionPlan['task'];
  asset_ref: KDNAConsumptionPlan['asset_ref'];
  projection_profile: KDNAConsumptionPlan['projection_request']['profile'];
  budget: KDNAExecutionBudget;
  constraints: KDNAConsumptionPlan['constraints'];
  trace_policy: KDNAConsumptionPlan['trace_policy'];
}): KDNAConsumptionPlan;
export function validateConsumptionPlan(
  plan: unknown,
  context: { trustedPlanDigest: string },
): KDNAExecutionContractValidationResult;
export function negotiateRuntimePair(
  plan: KDNAConsumptionPlan,
  context: KDNARuntimePairContext,
): {
  state: 'selected' | 'blocked';
  capsule_version: '0.1.0' | null;
  host_protocol: 'kdna.agent-host' | null;
  issue_code: string | null;
};
export function buildAgentHostRequest(
  input: { request_id: string; capsule: KDNARuntimeCapsule },
  context: KDNAAgentHostValidationContext,
): KDNAAgentHostRequest;
export function validateAgentHostRequest(
  request: unknown,
  context: KDNAAgentHostValidationContext,
): KDNAExecutionContractValidationResult;
export function validateAgentHostReceipt(
  receipt: unknown,
  context: { request: KDNAAgentHostRequest },
): KDNAExecutionContractValidationResult;
export function deriveBudgetEvidence(
  plan: KDNAConsumptionPlan,
  context: {
    trustedPlanDigest: string;
    request: KDNAAgentHostRequest | null;
    receipt: KDNAAgentHostReceipt | null;
  },
): KDNABudgetEvidence;
export function buildPreHostBudgetBlockedTrace(
  input: {
    trace_id: string;
    timestamp: string;
    capsule: KDNARuntimeCapsule;
    parent_trace_id?: string | null;
    warnings?: string[];
  },
  context: KDNAAgentHostValidationContext,
): KDNAJudgmentTrace;
export function validatePreHostBudgetBlockedTrace(
  trace: unknown,
  context: KDNAPreHostBudgetBlockedTraceContext,
): KDNAExecutionContractValidationResult;
export function buildJudgmentTrace(
  input: {
    trace_id: string;
    timestamp: string;
    overall_status: KDNAJudgmentTrace['overall_status'];
    parent_trace_id?: string | null;
    result_stored?: boolean;
    errors?: KDNAJudgmentTraceIssue[];
    warnings?: string[];
  },
  context: KDNAJudgmentTraceContext,
): KDNAJudgmentTrace;
export function validateJudgmentTrace(
  trace: unknown,
  context: KDNAJudgmentTraceContext,
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

export interface KDNALayoutEntry {
  name: string;
  data: Uint8Array;
  method: number;
  [key: string]: unknown;
}

export interface KDNALayout {
  kind: 'dir' | 'file' | 'memory';
  map: Record<string, Uint8Array | null>;
  manifest: KDNAManifest;
  entries: KDNALayoutEntry[] | null;
  containerDigest: string | null;
}

export function readLayout(inputPath: string): KDNALayout;

export interface KDNAChecksumEntry {
  algorithm: 'sha256';
  value: string;
}

export interface KDNAChecksums {
  digest_profile?: 'kdna.digest-basis.runtime-entry-set';
  digest_profile_version?: '0.1.0';
  covered_entries?: ['kdna.json', 'payload.kdnab'];
  algorithm: 'sha256';
  manifest_digest?: string;
  payload_digest?: string;
  entry_set_digest?: string;
  entries?: Record<string, KDNAChecksumEntry>;
}

export function isKdnaSourceDir(inputPath: string): boolean;
export function detectContainerFormat(inputPath: string): 'kdna' | null;
export function inspect(
  input: string | Uint8Array,
  options?: Record<string, any>,
): Record<string, any>;
export const KDNA_LOADER_VERSION: '0.19.0';
export const STRICT_LOADER_VERSION: RegExp;
export function parseLoaderVersion(version: unknown): readonly [string, string, string] | null;
export function compareLoaderVersions(left: string, right: string): -1 | 0 | 1;
export function assessLoaderCompatibility(manifest: Partial<KDNAManifest> | null | undefined): {
  loader_version: string;
  min_loader_version: string | null;
  loader_compatible: boolean | null;
};
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
  format_version: '0.1.0' | null;
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
  input_fingerprint: {
    has_password_input: boolean;
    entitlement_input: 'active' | 'expired' | 'revoked' | 'offline_grace' | null;
    source_fingerprint: string;
  } | null;
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

export interface KDNASemver {
  major: number;
  minor: number;
  patch: number;
}

export function parseSemver(version: string): KDNASemver | null;
export function compareSemver(left: string, right: string): number;
export function satisfies(version: string, range: string): boolean;

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

export interface KDNAComposableAxiom {
  id: string;
  one_sentence: string;
  applies_when?: string[];
  does_not_apply_when?: string[];
  failure_risk?: string;
}

export interface KDNAComposableDomain {
  id: string;
  name?: string;
  role?: string;
  required?: boolean;
  core: {
    meta?: { domain?: string };
    axioms?: KDNAComposableAxiom[];
    stances?: Array<string | { stance: string }>;
    trigger_signals?: string[];
    negative_signals?: string[];
    [key: string]: unknown;
  };
  patterns?: {
    misunderstandings?: Array<{
      id: string;
      wrong: string;
      correct: string;
      failure_risk?: string;
    }>;
    terminology?: {
      banned_terms?: Array<string | { term: string; replace_with?: string }>;
    };
    self_check?: Array<string | { question: string }>;
    [key: string]: unknown;
  };
}

export interface KDNAAttribution {
  domain: string;
  type: 'axiom' | 'misunderstanding' | 'banned_term' | 'self_check';
  index: number;
  id?: string;
  term?: string;
}

export function composeContextWithAttribution(
  domains: KDNAComposableDomain[],
  options?: { separator?: string },
): { context: string; attributionMap: Record<string, KDNAAttribution> };

export interface KDNADomainSelection {
  id: string;
  name?: string;
  role?: string;
  reason: 'required' | 'signal_match' | 'blocked by does_not_apply_when' | 'no signal match';
}

export function classifySignalsAcrossDomains(
  input: string,
  domainEntries: KDNAComposableDomain[],
): { selected: KDNADomainSelection[]; excluded: KDNADomainSelection[] };

export interface KDNAClusterManifest {
  domains?: Array<{ id: string; role?: string; required?: boolean }>;
  [key: string]: unknown;
}

export interface KDNALoadedClusterDomain extends KDNAComposableDomain {
  name: string;
  role: string;
  required: boolean;
  patterns: NonNullable<KDNAComposableDomain['patterns']>;
}

export function loadCluster(
  clusterManifestPath: string,
  domainLoader: (domainId: string) => {
    core: KDNAComposableDomain['core'];
    patterns: NonNullable<KDNAComposableDomain['patterns']>;
  } | null,
): { manifest: KDNAClusterManifest; domains: KDNALoadedClusterDomain[]; errors: string[] };

export interface KDNADomainConflict {
  type: 'term_conflict' | 'stance_conflict';
  domains: string[];
  description: string;
}

export function detectDomainConflicts(domains: KDNAComposableDomain[]): KDNADomainConflict[];

export function generateClusterTrace(input: {
  input: string;
  loadedDomains: Array<{ id?: string; name?: string }>;
  activeDomains: Array<{ id?: string; name?: string }>;
  conflicts: KDNADomainConflict[];
}): {
  input: string;
  timestamp: string;
  loaded_domains: string[];
  active_domains: string[];
  active_count: number;
  domains_excluded: number;
  conflicts: KDNADomainConflict[];
};

export interface KDNAWorkPackAssetRef {
  name: string;
  version: string;
  digest?: string;
  role: 'primary' | 'constraint' | 'fallback';
}

export interface KDNAWorkPackSkill {
  name: string;
  type?: string;
  required?: boolean;
  mcp_server?: string | null;
  fallback?: string | null;
}

export interface KDNAWorkPackManifest {
  format: 'kdna-workpack';
  format_version: string;
  name: string;
  version: string;
  description: string;
  status: 'draft' | 'experimental' | 'stable' | 'deprecated';
  access?: 'public' | 'licensed' | 'remote' | 'enterprise' | 'partner';
  license?: string;
  kdna:
    | { mode: 'single'; asset: KDNAWorkPackAssetRef }
    | { mode: 'cluster'; assets: KDNAWorkPackAssetRef[] };
  skills?: KDNAWorkPackSkill[];
  templates?: { task?: string; output?: string };
  review_gates?: string[];
  risk_policy?: string;
  trace_policy?: string;
  evals?: string;
}

export interface KDNAWorkPackValidationResult {
  valid: boolean;
  errors: string[];
}

export interface KDNAWorkPackValidator {
  (manifest: KDNAWorkPackManifest): boolean;
  errors?: Array<{ instancePath?: string; message?: string }> | null;
}

export interface KDNAWorkPackAjv {
  compile(schema: unknown): KDNAWorkPackValidator;
}

export const WORK_PACK_SCHEMA: Readonly<Record<string, unknown>>;
export function validateWorkPackManifest(
  manifest: KDNAWorkPackManifest,
  options?: { ajv?: KDNAWorkPackAjv },
): KDNAWorkPackValidationResult;
export function checkWorkPackStructure(
  manifest: KDNAWorkPackManifest,
  rootDir: string,
): { complete: boolean; missing: string[] };
export function inspectWorkPack(
  manifest: KDNAWorkPackManifest,
  rootDir: string,
): {
  name: string;
  version: string;
  description: string;
  status: KDNAWorkPackManifest['status'];
  access: NonNullable<KDNAWorkPackManifest['access']>;
  license: string;
  format_version: string;
  kdna: {
    mode: 'single' | 'cluster';
    assets: Array<Pick<KDNAWorkPackAssetRef, 'name' | 'version' | 'role'>>;
  };
  skills: Array<{
    name: string;
    type: string;
    required: boolean;
    fallback: string | null;
  }>;
  templates: { task: string | null; output: string | null } | null;
  review_gates: number;
  has_risk_policy: boolean;
  has_trace_policy: boolean;
  has_evals: boolean;
  structural_complete: boolean;
  missing_files: string[];
};
export function loadWorkPack(
  dirPath: string,
): { manifest: unknown; error: null } | { manifest: null; error: string };
