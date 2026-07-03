/**
 * Stable public API for third-party KDNA integrations.
 *
 * Lower-level modules remain exported for advanced runtimes, but external
 * adapters should prefer these names. They encode the asset-first contract:
 * callers pass .kdna files or bytes, and no persistent directory extraction is
 * required.
 */

const { createKdnaAssetReader } = require('./asset-reader');
const { lintDomain } = require('./lint-pure');
const { validateCrossFile, validateDomainSchema } = require('./validate-pure');
const { formatContext } = require('./loader');
const {
  composeContextWithAttribution,
  detectDomainConflicts,
  classifySignalsAcrossDomains,
  generateClusterTrace,
} = require('./compose');

function readerFrom(options = {}) {
  return options.reader || createKdnaAssetReader();
}

function isAsset(value) {
  return value && typeof value === 'object' && value.entries instanceof Map && typeof value.readEntry === 'function';
}

async function asAsset(input, options = {}) {
  if (isAsset(input)) return input;
  return readerFrom(options).open(input);
}

function asAssetSync(input, options = {}) {
  if (isAsset(input)) return input;
  return readerFrom(options).openSync(input);
}

async function openKDNA(input, options = {}) {
  return asAsset(input, options);
}

function openKDNASync(input, options = {}) {
  return asAssetSync(input, options);
}

async function inspectKDNA(input, options = {}) {
  const reader = readerFrom(options);
  const asset = await asAsset(input, { ...options, reader });
  const profile = await reader.loadProfile(asset, 'index', options);
  const verification = options.verify === false ? null : await reader.verify(asset, options);
  return {
    name: profile.name,
    version: profile.version,
    judgment_version: profile.judgment_version,
    access: profile.manifest.access || 'open',
    status: profile.manifest.status || null,
    quality_badge: profile.manifest.quality_badge || null,
    risk_level: profile.manifest.risk_level || null,
    keywords: profile.keywords,
    entries: profile.entries,
    asset_digest: profile.asset_digest,
    content_digest: profile.content_digest,
    signature_valid: verification ? verification.signature_valid : null,
    ok: verification ? verification.ok : null,
    errors: verification ? verification.errors : [],
    warnings: verification ? verification.warnings : [],
    manifest: profile.manifest,
  };
}

function inspectKDNASync(input, options = {}) {
  const reader = readerFrom(options);
  const asset = asAssetSync(input, { ...options, reader });
  const profile = reader.loadProfileSync(asset, 'index', options);
  const verification = options.verify === false ? null : reader.verifySync(asset, options);
  return {
    name: profile.name,
    version: profile.version,
    judgment_version: profile.judgment_version,
    access: profile.manifest.access || 'open',
    status: profile.manifest.status || null,
    quality_badge: profile.manifest.quality_badge || null,
    risk_level: profile.manifest.risk_level || null,
    keywords: profile.keywords,
    entries: profile.entries,
    asset_digest: profile.asset_digest,
    content_digest: profile.content_digest,
    signature_valid: verification ? verification.signature_valid : null,
    ok: verification ? verification.ok : null,
    errors: verification ? verification.errors : [],
    warnings: verification ? verification.warnings : [],
    manifest: profile.manifest,
  };
}

async function loadKDNA(input, options = {}) {
  const reader = readerFrom(options);
  const asset = await asAsset(input, { ...options, reader });
  return reader.loadProfile(asset, options.profile || 'compact', options);
}

function loadKDNASync(input, options = {}) {
  const reader = readerFrom(options);
  const asset = asAssetSync(input, { ...options, reader });
  return reader.loadProfileSync(asset, options.profile || 'compact', options);
}

async function validateKDNA(input, options = {}) {
  const reader = readerFrom(options);
  const asset = await asAsset(input, { ...options, reader });
  const assetResult = await reader.verify(asset, options);
  let dataMap;
  let lintResult = { errors: [], warnings: [] };
  let schemaResult = { errors: [], warnings: [] };
  let crossFileResult = { errors: [], warnings: [] };

  try {
    dataMap = await reader.readDataMap(asset, undefined, options);
    lintResult = lintDomain(dataMap);
    schemaResult = validateDomainSchema(dataMap, options.schemas || {});
    crossFileResult = validateCrossFile(dataMap);
  } catch (e) {
    lintResult.errors.push(e.message);
  }

  const errors = [
    ...assetResult.errors,
    ...lintResult.errors,
    ...schemaResult.errors,
    ...crossFileResult.errors,
  ];
  const warnings = [
    ...assetResult.warnings,
    ...lintResult.warnings,
    ...schemaResult.warnings,
    ...crossFileResult.warnings,
  ];
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    asset: assetResult,
    lint: lintResult,
    schema: schemaResult,
    cross_file: crossFileResult,
  };
}

function validateKDNASync(input, options = {}) {
  const reader = readerFrom(options);
  const asset = asAssetSync(input, { ...options, reader });
  const assetResult = reader.verifySync(asset, options);
  let lintResult = { errors: [], warnings: [] };
  let schemaResult = { errors: [], warnings: [] };
  let crossFileResult = { errors: [], warnings: [] };

  try {
    const dataMap = reader.readDataMapSync(asset, undefined, options);
    lintResult = lintDomain(dataMap);
    schemaResult = validateDomainSchema(dataMap, options.schemas || {});
    crossFileResult = validateCrossFile(dataMap);
  } catch (e) {
    lintResult.errors.push(e.message);
  }

  const errors = [
    ...assetResult.errors,
    ...lintResult.errors,
    ...schemaResult.errors,
    ...crossFileResult.errors,
  ];
  const warnings = [
    ...assetResult.warnings,
    ...lintResult.warnings,
    ...schemaResult.warnings,
    ...crossFileResult.warnings,
  ];
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    asset: assetResult,
    lint: lintResult,
    schema: schemaResult,
    cross_file: crossFileResult,
  };
}

async function renderForAgent(input, options = {}) {
  const loaded = await loadKDNA(input, options);
  if (loaded.context != null) return loaded.context;
  return loaded.domain ? formatContext(loaded.domain) : '';
}

function renderForAgentSync(input, options = {}) {
  const loaded = loadKDNASync(input, options);
  if (loaded.context != null) return loaded.context;
  return loaded.domain ? formatContext(loaded.domain) : '';
}

async function verifyAsset(input, options = {}) {
  const reader = readerFrom(options);
  const asset = await asAsset(input, { ...options, reader });
  return reader.verify(asset, options);
}

function verifyAssetSync(input, options = {}) {
  const reader = readerFrom(options);
  const asset = asAssetSync(input, { ...options, reader });
  return reader.verifySync(asset, options);
}

async function verifyDigest(input, expectedDigest, options = {}) {
  return verifyAsset(input, { ...options, asset_digest: expectedDigest });
}

function verifyDigestSync(input, expectedDigest, options = {}) {
  return verifyAssetSync(input, { ...options, asset_digest: expectedDigest });
}

async function verifySignature(input, options = {}) {
  return verifyAsset(input, { ...options, requireSignature: true });
}

function verifySignatureSync(input, options = {}) {
  return verifyAssetSync(input, { ...options, requireSignature: true });
}

function scoreMatch(input, info) {
  const haystack = String(input || '').toLowerCase();
  const terms = [
    info.name,
    ...(info.keywords || []),
    info.manifest?.description,
    info.manifest?.core_insight,
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());
  const matched = terms.filter((term) => term && haystack.includes(term.replace(/^@[^/]+\//, '')));
  return { score: matched.length, matched };
}

async function matchDomain(input, candidates, options = {}) {
  const results = [];
  for (const candidate of candidates || []) {
    const info = typeof candidate === 'string' || candidate instanceof Uint8Array || isAsset(candidate)
      ? await inspectKDNA(candidate, { ...options, verify: false })
      : candidate;
    const match = scoreMatch(input, info);
    if (match.score > 0) results.push({ ...info, score: match.score, matched: match.matched });
  }
  return results.sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)));
}

function matchDomainSync(input, candidates, options = {}) {
  const results = [];
  for (const candidate of candidates || []) {
    const info = typeof candidate === 'string' || candidate instanceof Uint8Array || isAsset(candidate)
      ? inspectKDNASync(candidate, { ...options, verify: false })
      : candidate;
    const match = scoreMatch(input, info);
    if (match.score > 0) results.push({ ...info, score: match.score, matched: match.matched });
  }
  return results.sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)));
}

async function composeKDNA(inputs, options = {}) {
  const loaded = [];
  for (const input of inputs || []) {
    const profile = await loadKDNA(input, { ...options, profile: options.profile || 'compact', context: false });
    if (profile.domain) {
      loaded.push({
        id: profile.manifest.name || profile.domain.core?.meta?.domain,
        name: profile.manifest.name || profile.domain.core?.meta?.domain,
        manifest: profile.manifest,
        ...profile.domain,
      });
    }
  }
  const { selected, excluded } = classifySignalsAcrossDomains(options.input || '', loaded);
  const selectedIds = new Set(selected.map((d) => d.id));
  const activeDomains = options.input ? loaded.filter((d) => selectedIds.has(d.id)) : loaded;
  const conflicts = detectDomainConflicts(activeDomains);
  const { context, attributionMap } = composeContextWithAttribution(activeDomains, options);
  return {
    domains: loaded,
    activeDomains,
    selected,
    excluded,
    conflicts,
    context,
    attributionMap,
    trace: generateClusterTrace({
      input: options.input || '',
      loadedDomains: loaded,
      activeDomains,
      conflicts,
    }),
  };
}

module.exports = {
  openKDNA,
  openKDNASync,
  inspectKDNA,
  inspectKDNASync,
  loadKDNA,
  loadKDNASync,
  validateKDNA,
  validateKDNASync,
  renderForAgent,
  renderForAgentSync,
  verifyAsset,
  verifyAssetSync,
  verifyDigest,
  verifyDigestSync,
  verifySignature,
  verifySignatureSync,
  matchDomain,
  matchDomainSync,
  composeKDNA,
};
