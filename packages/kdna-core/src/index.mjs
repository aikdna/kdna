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

export const STANDARD_ENTRIES = assetReader.STANDARD_ENTRIES;
export const createKdnaAssetReader = assetReader.createKdnaAssetReader;
export const LICENSED_ENTRY_PROFILE = cryptoProfile.LICENSED_ENTRY_PROFILE;
export const deriveLicensedEntryKey = cryptoProfile.deriveLicensedEntryKey;
export const encryptLicensedEntry = cryptoProfile.encryptLicensedEntry;
export const decryptLicensedEntry = cryptoProfile.decryptLicensedEntry;
export const createLicensedDecryptEntry = cryptoProfile.createLicensedDecryptEntry;
