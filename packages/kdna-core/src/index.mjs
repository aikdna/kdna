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

export {
  MIMETYPE,
  KDNA_LOADER_VERSION,
  REQUIRED_DIR_ENTRIES,
  isKdnaSourceDir,
  detectContainerFormat,
  readLayout,
  inspect,
  validate,
  buildChecksums,
  pack,
  unpack,
  FORBIDDEN_OUTPUT_TERMS,
  parseSemver,
  compareSemver,
  satisfies,
} from './container/index.js';

import loaderCompatibility from './loader-compatibility.js';
export const STRICT_LOADER_VERSION = loaderCompatibility.STRICT_LOADER_VERSION;
export const parseLoaderVersion = loaderCompatibility.parseLoaderVersion;
export const compareLoaderVersions = loaderCompatibility.compareLoaderVersions;
export const assessLoaderCompatibility = loaderCompatibility.assessLoaderCompatibility;

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
import runtimeCapsule from './runtime-capsule.js';
import runtimeContract from './runtime-contract.js';

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
export const matchDomain = publicApi.matchDomain;
export const matchDomainSync = publicApi.matchDomainSync;
export const composeKDNA = publicApi.composeKDNA;

export const DIGEST_PROFILE = runtimeCapsule.DIGEST_PROFILE;
export const DIGEST_PROFILE_VERSION = runtimeCapsule.DIGEST_PROFILE_VERSION;
export const CAPSULE_DIGEST_PROFILE = runtimeCapsule.CAPSULE_DIGEST_PROFILE;
export const CANONICALIZATION_PROFILE_VERSION = runtimeCapsule.CANONICALIZATION_PROFILE_VERSION;
export const RUNTIME_CAPSULE_CONTRACT_VERSION = runtimeCapsule.RUNTIME_CAPSULE_CONTRACT_VERSION;
export const BASIS = runtimeCapsule.BASIS;
export const computeAssetDigest = runtimeCapsule.computeAssetDigest;
export const computeRuntimeEntrySetDigest = runtimeCapsule.computeRuntimeEntrySetDigest;
export const computeDigestEvidence = runtimeCapsule.computeDigestEvidence;
export const canonicalizeJcs = runtimeCapsule.canonicalizeJcs;
export const computeCapsuleDeliveryDigest = runtimeCapsule.computeCapsuleDeliveryDigest;
export const buildRuntimeCapsule = runtimeCapsule.buildRuntimeCapsule;
export const loadRuntimeCapsule = runtimeCapsule.loadRuntimeCapsule;

export const KDNARuntimeContractError = runtimeContract.KDNARuntimeContractError;
export const PLAN_DIGEST_PROFILE = runtimeContract.PLAN_DIGEST_PROFILE;
export const PLAN_DIGEST_PROFILE_VERSION = runtimeContract.PLAN_DIGEST_PROFILE_VERSION;
export const HOST_PROTOCOL = runtimeContract.HOST_PROTOCOL;
export const HOST_PROTOCOL_VERSION = runtimeContract.HOST_PROTOCOL_VERSION;
export const DEFAULT_CORE_CAPSULE_CONTRACT_VERSIONS =
  runtimeContract.DEFAULT_CORE_CAPSULE_CONTRACT_VERSIONS;
export const parseRuntimeContractJson = runtimeContract.parseRuntimeContractJson;
export const computeConsumptionPlanDigest = runtimeContract.computeConsumptionPlanDigest;
export const buildConsumptionPlan = runtimeContract.buildConsumptionPlan;
export const validateConsumptionPlan = runtimeContract.validateConsumptionPlan;
export const negotiateRuntimePair = runtimeContract.negotiateRuntimePair;
export const buildAgentHostRequest = runtimeContract.buildAgentHostRequest;
export const validateAgentHostRequest = runtimeContract.validateAgentHostRequest;
export const validateAgentHostReceipt = runtimeContract.validateAgentHostReceipt;
export const deriveBudgetEvidence = runtimeContract.deriveBudgetEvidence;
export const buildPreHostBudgetBlockedTrace =
  runtimeContract.buildPreHostBudgetBlockedTrace;
export const validatePreHostBudgetBlockedTrace =
  runtimeContract.validatePreHostBudgetBlockedTrace;
export const buildJudgmentTrace = runtimeContract.buildJudgmentTrace;
export const validateJudgmentTrace = runtimeContract.validateJudgmentTrace;

export const STANDARD_ENTRIES = assetReader.STANDARD_ENTRIES;
export const createKdnaAssetReader = assetReader.createKdnaAssetReader;

export const {
  LICENSED_ENTRY_PROFILE,
  PASSWORD_PROTECTED_PROFILE,
  PASSWORD_PROTECTED_SCRYPT_PROFILE,
  ENCRYPTION_PROFILE_VERSION,
  ALG,
  RFC_KDF,
  RFC_KEY_WRAPPING,
  PASSWORD_KDF,
  SCRYPT_KDF,
  deriveWrappingKey,
  generateCEK,
  wrapCEK,
  unwrapCEK,
  encryptLicensedEntry,
  decryptLicensedEntry,
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
  EXTERNAL_GRANT_CONTRACT_VERSION,
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
