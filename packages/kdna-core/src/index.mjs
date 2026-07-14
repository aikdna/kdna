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

export { lintDomain } from './lint-pure.js';

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
import capsuleV2 from './capsule-v2.js';

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

export const STANDARD_ENTRIES = assetReader.STANDARD_ENTRIES;
export const createKdnaAssetReader = assetReader.createKdnaAssetReader;
export const LICENSED_ENTRY_PROFILE = cryptoProfile.LICENSED_ENTRY_PROFILE;
export const deriveLicensedEntryKey = cryptoProfile.deriveLicensedEntryKey;
export const encryptLicensedEntry = cryptoProfile.encryptLicensedEntry;
export const decryptLicensedEntry = cryptoProfile.decryptLicensedEntry;
export const createLicensedDecryptEntry = cryptoProfile.createLicensedDecryptEntry;
export const EXTERNAL_ENVELOPE_PROFILE = externalKeyGrant.EXTERNAL_ENVELOPE_PROFILE;
export const EXTERNAL_GRANT_PROFILE = externalKeyGrant.EXTERNAL_GRANT_PROFILE;
export const KDNAExternalGrantError = externalKeyGrant.KDNAExternalGrantError;
export const canonicalJson = externalKeyGrant.canonicalJson;
export const grantSigningPayload = externalKeyGrant.grantSigningPayload;
export const validateExternalEnvelope = externalKeyGrant.validateExternalEnvelope;
export const validateExternalKeyGrant = externalKeyGrant.validateExternalKeyGrant;
export const deriveExternalAssetCek = externalKeyGrant.deriveExternalAssetCek;
export const encodeExternalEnvelope = externalKeyGrant.encodeExternalEnvelope;
export const decodeExternalEnvelope = externalKeyGrant.decodeExternalEnvelope;
export const encryptExternalGrantEntry = externalKeyGrant.encryptExternalGrantEntry;
export const generateDeviceKeyPairs = externalKeyGrant.generateDeviceKeyPairs;
export const createExternalKeyGrant = externalKeyGrant.createExternalKeyGrant;
export const authorizeExternalKeyGrant = externalKeyGrant.authorizeExternalKeyGrant;
