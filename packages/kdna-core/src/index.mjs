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
  planLoad,
  loadAuthorized,
  buildChecksums,
  pack,
  unpack,
  load,
  loadAsset,
  buildCapsule,
  FORBIDDEN_OUTPUT_TERMS,
  parseSemver,
  compareSemver,
  satisfies,
} from './v1/index.js';

export { validateDomainSchema, validateCrossFile } from './validate-pure.js';

export { renderPreviewHTML, escHtml, renderCard } from './render.js';

export { composeContext, composeContextWithAttribution, classifySignals, classifySignalsAcrossDomains, composeChecks, loadAndCompose, loadCluster, detectDomainConflicts, generateClusterTrace } from './compose.js';

import assetReader from './asset-reader.js';
import cryptoProfile from './crypto-profile.js';
import externalKeyGrant from './external-key-grant.js';

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
