/**
 * Compatibility names for the stable current KDNA Runtime API.
 *
 * These names previously implemented a second legacy source-tree validator and
 * loader. They now route to the same current inspect/validate/LoadPlan/Capsule
 * implementation as the unversioned package API. No current payload is
 * reverse-projected into KDNA_Core.json or KDNA_Patterns.json.
 */

const fs = require('fs');
const { createKdnaAssetReader } = require('./asset-reader');
const v1 = require('./v1');
const runtimeApi = require('./runtime-api');
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

const ASSET_SOURCE_BYTES = Symbol.for('@aikdna/kdna-core.asset-source-bytes');

function canonicalBytes(input) {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  if (typeof input === 'string') return fs.readFileSync(input);
  if (isAsset(input) && Buffer.isBuffer(input[ASSET_SOURCE_BYTES])) {
    return input[ASSET_SOURCE_BYTES];
  }
  throw new Error('KDNA operation expects a .kdna path, Buffer, Uint8Array, or asset opened by openKDNA');
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
  const current = v1.inspect(canonicalBytes(asset), options);
  const manifest = await reader.readManifest(asset);
  const entries = await reader.listEntries(asset);
  const contentDigest = await reader.contentDigest(asset);
  const verification = options.verify === false ? null : await reader.verify(asset, options);
  return {
    ...current,
    entries,
    asset_digest: asset.asset_digest,
    content_digest: contentDigest,
    signature_valid: verification ? verification.signature_valid : null,
    ok: verification ? verification.ok : null,
    errors: verification ? verification.errors : [],
    warnings: verification ? verification.warnings : [],
    manifest,
  };
}

function inspectKDNASync(input, options = {}) {
  const reader = readerFrom(options);
  const asset = asAssetSync(input, { ...options, reader });
  const current = v1.inspect(canonicalBytes(asset), options);
  const manifest = reader.readManifestSync(asset);
  const entries = reader.listEntriesSync(asset);
  const contentDigest = reader.contentDigestSync(asset);
  const verification = options.verify === false ? null : reader.verifySync(asset, options);
  return {
    ...current,
    entries,
    asset_digest: asset.asset_digest,
    content_digest: contentDigest,
    signature_valid: verification ? verification.signature_valid : null,
    ok: verification ? verification.ok : null,
    errors: verification ? verification.errors : [],
    warnings: verification ? verification.warnings : [],
    manifest,
  };
}

async function loadKDNA(input, options = {}) {
  return runtimeApi.loadAuthorized(isAsset(input) ? canonicalBytes(input) : input, options);
}

function loadKDNASync(input, options = {}) {
  return runtimeApi.loadAuthorized(isAsset(input) ? canonicalBytes(input) : input, options);
}

async function validateKDNA(input, options = {}) {
  return v1.validate(isAsset(input) ? canonicalBytes(input) : input, options);
}

function validateKDNASync(input, options = {}) {
  return v1.validate(isAsset(input) ? canonicalBytes(input) : input, options);
}

async function renderForAgent(input, options = {}) {
  const loaded = await loadKDNA(input, { ...options, as: 'prompt' });
  return loaded && typeof loaded.text === 'string' ? loaded.text : '';
}

function renderForAgentSync(input, options = {}) {
  const loaded = loadKDNASync(input, { ...options, as: 'prompt' });
  return loaded && typeof loaded.text === 'string' ? loaded.text : '';
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
    info.asset_id,
    info.title,
    ...(info.keywords || info.manifest?.keywords || []),
    info.summary || info.manifest?.summary,
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
  return results.sort((a, b) => b.score - a.score || String(a.asset_id).localeCompare(String(b.asset_id)));
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
  return results.sort((a, b) => b.score - a.score || String(a.asset_id).localeCompare(String(b.asset_id)));
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
