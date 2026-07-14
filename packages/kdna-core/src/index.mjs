/**
 * @aikdna/kdna-core — ESM entry point
 */
export {
  FILE_MAP,
  loadCorePatternsFromData,
  loadDomainFromData,
  loadDomainFromFiles,
  classifyInput,
  formatContext,
} from './loader.js';

export { lintDomain, validateManifest } from './lint-pure.js';

export {
  MIMETYPE,
  REQUIRED_DIR_ENTRIES,
  isKdnaSourceDir,
  detectContainerFormat,
  readLayout,
  inspect,
  validate,
  buildChecksums,
  pack,
  unpack,
  buildCapsule,
  FORBIDDEN_OUTPUT_TERMS,
  parseSemver,
  compareSemver,
  satisfies,
} from './v1/index.js';

import runtimeApi from './runtime-api.js';
export const planLoad = runtimeApi.planLoad;
export const loadAuthorized = runtimeApi.loadAuthorized;
export const load = runtimeApi.load;
export const loadAsset = runtimeApi.loadAsset;

export { validateDomainSchema, validateCrossFile } from './validate-pure.js';

export { renderPreviewHTML, escHtml, renderCard } from './render.js';

export {
  composeContext,
  composeContextWithAttribution,
  classifySignals,
  classifySignalsAcrossDomains,
  composeChecks,
  loadAndCompose,
  loadCluster,
  detectDomainConflicts,
  generateClusterTrace,
} from './compose.js';

import assetReader from './asset-reader.js';
import cryptoProfile from './crypto-profile.js';
import externalKeyGrant from './external-key-grant.js';
import publicApi from './public-api.js';
import workpackPure from './workpack-pure.js';
import capsuleV2 from './capsule-v2.js';
import executionContractV1 from './execution-contract-v1.js';

export const openKDNA = publicApi.openKDNA;
export const openKDNASync = publicApi.openKDNASync;
export const inspectKDNA = publicApi.inspectKDNA;
export const inspectKDNASync = publicApi.inspectKDNASync;
export const loadKDNA = publicApi.loadKDNA;
export const loadKDNASync = publicApi.loadKDNASync;
export const validateKDNA = publicApi.validateKDNA;
export const validateKDNASync = publicApi.validateKDNASync;
export const renderForAgent = publicApi.renderForAgent;
export const renderForAgentSync = publicApi.renderForAgentSync;
export const verifyAsset = publicApi.verifyAsset;
export const verifyAssetSync = publicApi.verifyAssetSync;
export const verifyDigest = publicApi.verifyDigest;
export const verifyDigestSync = publicApi.verifyDigestSync;
export const verifySignature = publicApi.verifySignature;
export const verifySignatureSync = publicApi.verifySignatureSync;
export const matchDomain = publicApi.matchDomain;
export const matchDomainSync = publicApi.matchDomainSync;
export const composeKDNA = publicApi.composeKDNA;

export const DIGEST_PROFILE = capsuleV2.DIGEST_PROFILE;
export const CAPSULE_DIGEST_PROFILE = capsuleV2.CAPSULE_DIGEST_PROFILE;
export const BASIS = capsuleV2.BASIS;
export const computeAssetDigest = capsuleV2.computeAssetDigest;
export const computeRuntimeEntrySetDigest = capsuleV2.computeRuntimeEntrySetDigest;
export const computeDigestEvidence = capsuleV2.computeDigestEvidence;
export const canonicalizeJcs = capsuleV2.canonicalizeJcs;
export const computeCapsuleDeliveryDigest = capsuleV2.computeCapsuleDeliveryDigest;
export const buildCapsuleV2 = capsuleV2.buildCapsuleV2;
export const loadCapsuleV2 = capsuleV2.loadCapsuleV2;
export const adaptCapsuleV2ToV1 = capsuleV2.adaptCapsuleV2ToV1;

export const KDNAExecutionContractError = executionContractV1.KDNAExecutionContractError;
export const PLAN_DIGEST_PROFILE = executionContractV1.PLAN_DIGEST_PROFILE;
export const HOST_PROTOCOL = executionContractV1.HOST_PROTOCOL;
export const DEFAULT_CORE_CAPSULE_VERSIONS = executionContractV1.DEFAULT_CORE_CAPSULE_VERSIONS;
export const parseExecutionContractJsonV1 = executionContractV1.parseExecutionContractJsonV1;
export const computeConsumptionPlanDigestV1 = executionContractV1.computeConsumptionPlanDigestV1;
export const buildConsumptionPlanV1 = executionContractV1.buildConsumptionPlanV1;
export const validateConsumptionPlanV1 = executionContractV1.validateConsumptionPlanV1;
export const negotiateExecutionPairV1 = executionContractV1.negotiateExecutionPairV1;
export const buildAgentHost2RequestV1 = executionContractV1.buildAgentHost2RequestV1;
export const validateAgentHost2RequestV1 = executionContractV1.validateAgentHost2RequestV1;
export const validateAgentHost2ReceiptV1 = executionContractV1.validateAgentHost2ReceiptV1;
export const deriveBudgetEvidenceV1 = executionContractV1.deriveBudgetEvidenceV1;
export const buildPreHostBudgetBlockedTraceV1 =
  executionContractV1.buildPreHostBudgetBlockedTraceV1;
export const validatePreHostBudgetBlockedTraceV1 =
  executionContractV1.validatePreHostBudgetBlockedTraceV1;
export const buildJudgmentTraceV1 = executionContractV1.buildJudgmentTraceV1;
export const validateJudgmentTraceV1 = executionContractV1.validateJudgmentTraceV1;

export const STANDARD_ENTRIES = assetReader.STANDARD_ENTRIES;
export const createKdnaAssetReader = assetReader.createKdnaAssetReader;

export const {
  LICENSED_ENTRY_PROFILE,
  LICENSED_EXPERIMENTAL_PROFILE,
  PASSWORD_PROTECTED_PROFILE,
  PASSWORD_PROTECTED_SCRYPT_PROFILE,
  ALG,
  RFC_KDF,
  RFC_KEY_WRAPPING,
  LEGACY_KDF,
  PASSWORD_KDF,
  SCRYPT_KDF,
  deriveWrappingKey,
  generateCEK,
  wrapCEK,
  unwrapCEK,
  encryptLicensedEntryV1,
  decryptLicensedEntryV1,
  derivePasswordKey,
  generateRecoveryCode,
  decodeRecoveryCode,
  encryptProtectedEntry,
  decryptProtectedEntry,
  createPasswordDecryptEntry,
  createRecoveryDecryptEntry,
  derivePasswordKeyScrypt,
  encryptProtectedEntryScrypt,
  decryptProtectedEntryScrypt,
  createPasswordDecryptEntryScrypt,
  deriveLicensedEntryKey,
  encryptLicensedEntryLegacy,
  decryptLicensedEntryLegacy,
  encryptLicensedEntry,
  decryptLicensedEntry,
  createLicensedDecryptEntry,
  hkdfSha256,
  aesWrap,
  aesUnwrap,
} = cryptoProfile;

export const {
  EXTERNAL_ENVELOPE_PROFILE,
  EXTERNAL_GRANT_PROFILE,
  EXTERNAL_AAD_PROFILE,
  DEVICE_KEK_PROFILE,
  KDNAExternalGrantError,
  canonicalJson,
  grantSigningPayload,
  validateExternalEnvelope,
  validateExternalKeyGrant,
  externalEnvelopeAad,
  deriveExternalAssetCek,
  encodeExternalEnvelope,
  decodeExternalEnvelope,
  encryptExternalGrantEntry,
  generateDeviceKeyPairs,
  createExternalKeyGrant,
  authorizeExternalKeyGrant,
  isVerifiedExternalEntitlement,
} = externalKeyGrant;

export const {
  WORK_PACK_SCHEMA,
  validateWorkPackManifest,
  checkWorkPackStructure,
  inspectWorkPack,
  loadWorkPack,
} = workpackPure;
