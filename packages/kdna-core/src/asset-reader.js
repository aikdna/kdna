/**
 * KDNA Asset Reader — direct .kdna container access.
 */

const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');
const cbor = require('cbor-x');
const { loadDomainFromFiles, formatContext } = require('./loader');

const KDNA_MEDIA_TYPE = 'application/vnd.aikdna.kdna+zip';

// Standard KDNA domain data entries — kept in lockstep with loader.FILE_MAP.
// Asset reader pre-loads these so callers don't have to enumerate entry names.
// NOTE: kdna.json / manifest.json are read separately via readManifest(); do not
// add them here. KDNA_Cluster is intentionally omitted — its schema exists but
// is not yet wired into the loader contract.
const STANDARD_ENTRIES = Object.freeze([
  'KDNA_Core.json',
  'KDNA_Patterns.json',
  'KDNA_Scenarios.json',
  'KDNA_Cases.json',
  'KDNA_Reasoning.json',
  'KDNA_Evolution.json',
]);

// Matches any entry that holds JSON content (used to canonicalize the entry
// before hashing/signing so digests are stable across re-serialization).
const JSON_ENTRY_RE = /\.json$/i;

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function parseJson(buf, entryName) {
  try {
    return JSON.parse(Buffer.isBuffer(buf) ? buf.toString('utf8') : String(buf));
  } catch (e) {
    throw new Error(`${entryName}: invalid JSON: ${e.message}`, { cause: e });
  }
}

function encryptedEntries(manifest) {
  const entries = manifest?.encryption?.encrypted_entries;
  return Array.isArray(entries) ? entries : [];
}

function isEncryptedEntry(manifest, entryName) {
  return encryptedEntries(manifest).includes(entryName);
}

async function maybeDecryptEntry(asset, manifest, entryName, buf, options = {}) {
  if (!isEncryptedEntry(manifest, entryName)) return buf;
  if (typeof options.decryptEntry !== 'function') {
    throw new Error(`${entryName}: encrypted entry requires decryptEntry hook`);
  }
  const decrypted = await options.decryptEntry({
    asset,
    manifest,
    entryName,
    ciphertext: buf,
  });
  if (typeof decrypted === 'string') return Buffer.from(decrypted);
  if (Buffer.isBuffer(decrypted)) return decrypted;
  if (decrypted instanceof Uint8Array) return Buffer.from(decrypted);
  throw new Error(`${entryName}: decryptEntry hook must return string, Buffer, or Uint8Array`);
}

function normalizeDecryptedEntry(decrypted, entryName) {
  if (typeof decrypted === 'string') return Buffer.from(decrypted);
  if (Buffer.isBuffer(decrypted)) return decrypted;
  if (decrypted instanceof Uint8Array) return Buffer.from(decrypted);
  throw new Error(`${entryName}: decryptEntry hook must return string, Buffer, or Uint8Array`);
}

function maybeDecryptEntrySync(asset, manifest, entryName, buf, options = {}) {
  if (!isEncryptedEntry(manifest, entryName)) return buf;
  if (typeof options.decryptEntry !== 'function') {
    throw new Error(`${entryName}: encrypted entry requires decryptEntry hook`);
  }
  const decrypted = options.decryptEntry({
    asset,
    manifest,
    entryName,
    ciphertext: buf,
  });
  if (decrypted && typeof decrypted.then === 'function') {
    throw new Error(`${entryName}: decryptEntry hook must be synchronous for sync reads`);
  }
  return normalizeDecryptedEntry(decrypted, entryName);
}

function findEndOfCentralDirectory(buf) {
  const min = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error('Invalid .kdna asset: ZIP end-of-central-directory not found');
}

function parseZipEntries(buf) {
  const eocd = findEndOfCentralDirectory(buf);
  const totalEntries = buf.readUInt16LE(eocd + 10);
  const centralDirOffset = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  let offset = centralDirOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (buf.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error(`Invalid .kdna asset: ZIP central directory is corrupt at ${offset}`);
    }

    const method = buf.readUInt16LE(offset + 10);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const uncompressedSize = buf.readUInt32LE(offset + 24);
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const localHeaderOffset = buf.readUInt32LE(offset + 42);
    const name = buf.slice(offset + 46, offset + 46 + nameLen).toString('utf8');

    offset += 46 + nameLen + extraLen + commentLen;
    if (!name || name.endsWith('/')) continue;

    entries.set(name, {
      name,
      method,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
  }

  return entries;
}

function readZipEntry(buf, entry) {
  const offset = entry.localHeaderOffset;
  if (buf.readUInt32LE(offset) !== 0x04034b50) {
    throw new Error(`Invalid .kdna asset: local header missing for ${entry.name}`);
  }

  const nameLen = buf.readUInt16LE(offset + 26);
  const extraLen = buf.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + nameLen + extraLen;
  const compressed = buf.slice(dataStart, dataStart + entry.compressedSize);

  if (entry.method === 0) return compressed;
  if (entry.method === 8) return zlib.inflateRawSync(compressed);
  throw new Error(`${entry.name}: unsupported ZIP compression method ${entry.method}`);
}

function normalizeInput(input) {
  if (Buffer.isBuffer(input)) return { buffer: input, path: null };
  if (input instanceof Uint8Array) return { buffer: Buffer.from(input), path: null };
  if (typeof input !== 'string') {
    throw new Error('KdnaAssetReader.open expects a file path, Buffer, or Uint8Array');
  }
  return { buffer: fs.readFileSync(input), path: input };
}

function manifestForDigest(manifest) {
  const copy = { ...(manifest || {}) };
  delete copy.signature;
  delete copy.asset_digest;
  delete copy.container_sha256;
  delete copy.content_digest;
  delete copy._source;
  if (copy.authoring && typeof copy.authoring === 'object') {
    const auth = { ...copy.authoring };
    delete auth.content_digest;
    copy.authoring = auth;
  }
  return copy;
}

function buildContentDigest(asset) {
  const parts = [];
  const excluded = new Set(['.DS_Store', 'signature.json', 'build-receipt.json']);
  for (const entryName of [...asset.entries.keys()].sort()) {
    if (excluded.has(entryName)) continue;
    if (entryName.startsWith('reports/')) continue;
    const entryBuf = asset.readEntry(entryName);
    let digestBuf = entryBuf;
    if (JSON_ENTRY_RE.test(entryName)) {
      const parsed = parseJson(entryBuf, entryName);
      const value = entryName === 'kdna.json' ? manifestForDigest(parsed) : parsed;
      digestBuf = Buffer.from(stableStringify(value));
    }
    parts.push(`${entryName}:${sha256Hex(digestBuf)}`);
  }
  return `sha256:${sha256Hex(Buffer.from(parts.join('\n')))}`;
}

function manifestForSignature(manifest, { stripDigestFields = true } = {}) {
  // Mirrors manifestForDigest above. The two must agree on every field
  // they strip, or the signing and digest paths will hash different
  // representations of the same manifest and verifiers will report a
  // mismatch on otherwise-valid assets.
  //
  // Bug: prior version omitted the `authoring.content_digest` strip
  // that manifestForDigest performs, so the signing payload included
  // a digest field that the digest payload did not.
  const copy = { ...(manifest || {}) };
  delete copy.signature;
  delete copy._source;
  if (stripDigestFields) {
    delete copy.asset_digest;
    delete copy.container_sha256;
    delete copy.content_digest;
    if (copy.authoring && typeof copy.authoring === 'object') {
      const auth = { ...copy.authoring };
      delete auth.content_digest;
      copy.authoring = auth;
    }
  }
  return copy;
}

function canonicalJsonEntry(entryName, entryBuf, options = {}) {
  const parsed = parseJson(entryBuf, entryName);
  const value = entryName === 'kdna.json' ? manifestForSignature(parsed, options) : parsed;
  return Buffer.from(stableStringify(value));
}

function buildSigningPayload(asset, options = {}) {
  // Bug (#147): the prior version only excluded `.DS_Store` and
  // `signature.json`, while `buildContentDigest` above also excludes
  // `build-receipt.json` and any entry under `reports/`. A producer
  // that signed with this code and a verifier that digested the
  // asset with `buildContentDigest` would compute two different
  // byte strings and the signature would fail to verify. The fix
  // mirrors `buildContentDigest`'s exclusion set exactly.
  const parts = [];
  for (const entryName of [...asset.entries.keys()].sort()) {
    if (entryName === '.DS_Store' || entryName === 'signature.json') continue;
    if (entryName === 'build-receipt.json') continue;
    if (entryName.startsWith('reports/')) continue;
    const entryBuf = asset.readEntry(entryName);
    let payloadBuf = entryBuf;
    if (JSON_ENTRY_RE.test(entryName)) {
      payloadBuf = canonicalJsonEntry(entryName, entryBuf, options);
    }
    parts.push(`${entryName}:${sha256Hex(payloadBuf)}`);
  }
  return parts.join('\n');
}

function verifySignature(asset, manifest, errors, warnings) {
  if (!manifest.signature) {
    warnings.push('kdna.json.signature missing');
    return null;
  }
  if (!manifest.author?.public_key_pem) {
    errors.push('kdna.json.author.public_key_pem missing');
    return false;
  }
  if (!manifest.author?.pubkey) {
    errors.push('kdna.json.author.pubkey missing');
    return false;
  }

  const fingerprint = `ed25519:${sha256Hex(Buffer.from(manifest.author.public_key_pem))}`;
  if (fingerprint !== manifest.author.pubkey) {
    errors.push('author.public_key_pem fingerprint does not match author.pubkey');
    return false;
  }

  try {
    const signature = Buffer.from(String(manifest.signature).replace(/^ed25519:/, ''), 'hex');
    const publicKey = crypto.createPublicKey(manifest.author.public_key_pem);
    const ok = crypto.verify(null, Buffer.from(buildSigningPayload(asset)), publicKey, signature);
    if (!ok) errors.push('Ed25519 signature invalid');
    return ok;
  } catch (e) {
    errors.push(`signature verification failed: ${e.message}`);
    return false;
  }
}

function verifyMediaType(asset, errors) {
  if (!asset.entries.has('mimetype')) {
    errors.push('required entry missing: mimetype');
    return;
  }
  const value = asset.readEntry('mimetype').toString('utf8');
  if (value !== KDNA_MEDIA_TYPE) {
    errors.push(`mimetype: expected ${KDNA_MEDIA_TYPE}, got ${JSON.stringify(value)}`);
  }
}

/**
 * Verify Human Lock signatures on locked axiom cards.
 * Reconstructs signing payload (cardId|statement|fingerprint) and verifies
 * against the creator's public key from kdna.json manifest.author.
 */
function verifyHumanLockSignatures(coreData, manifest, errors, warnings) {
  const publicKeyPEM = manifest?.author?.public_key_pem;
  if (!publicKeyPEM) {
    // Skip if no public key available (unsigned assets are valid)
    return;
  }

  // All card-type arrays in KDNA_Core.json that may carry human_lock.
  // Ordered by how they appear in the compiled payload (compileCore in
  // kdna-studio-core/src/compile/index.js).
  const CORE_CARD_ARRAYS = [
    ['axioms', 'axiom'],
    ['ontology', 'ontology'],
    ['frameworks', 'framework'],
    ['boundaries', 'boundary'],
    ['risks', 'risk'],
    ['stances', 'stance'],
  ];

  let verified = 0, missing = 0, invalid = 0;
  for (const [arrayName] of CORE_CARD_ARRAYS) {
    const cards = coreData?.[arrayName];
    if (!Array.isArray(cards) || cards.length === 0) continue;

    for (const card of cards) {
      const hl = card.human_lock;
      if (!hl || !hl.signature) {
        if (card.status === 'locked' || card.status === 'tested' || card.status === 'published') {
          missing++;
        }
        continue;
      }
      try {
        const payload = [card.id, hl.statement || '', hl.judgment_fingerprint || ''].join('\n');
        const sig = Buffer.from(String(hl.signature).replace(/^ed25519:/, ''), 'hex');
        const key = crypto.createPublicKey(publicKeyPEM);
        const ok = crypto.verify(null, Buffer.from(payload), key, sig);
        if (ok) { verified++; }
        else { invalid++; }
      } catch {
        invalid++;
      }
    }
  }

  if (invalid > 0) {
    errors.push(`${invalid} Human Lock signature(s) failed verification — judgment may have been altered`);
  }
  if (missing > 0) {
    warnings.push(`${missing} locked card(s) have no Human Lock signature`);
  }
  if (verified > 0 && invalid === 0) {
    // All signed locks verified — good
  }
}

function validateManifestIdentity(manifest, errors, _warnings) {
  if (manifest.kdna_spec) {
    errors.push('kdna.json: kdna_spec is not allowed. Use spec_version.');
  }
  if (manifest.format && manifest.format !== 'kdna') {
    errors.push(`kdna.json.format: invalid value "${manifest.format}". Expected "kdna".`);
  }
  if (manifest.format_version && manifest.format_version !== '2.0') {
    errors.push(
      `kdna.json.format_version: invalid value "${manifest.format_version}". Expected "2.0".`,
    );
  }
  if (!manifest.spec_version) errors.push('kdna.json: missing required field "spec_version"');
  if (!manifest.format) errors.push('kdna.json: missing required field "format"');
  if (!manifest.format_version) errors.push('kdna.json: missing required field "format_version"');
  if (manifest.language) {
    errors.push('kdna.json: language is not allowed. Use default_language and languages.');
  }
}

function openAsset(input) {
  const { buffer, path } = normalizeInput(input);
  const entries = parseZipEntries(buffer);
  return {
    path,
    size: buffer.length,
    asset_digest: `sha256:${sha256Hex(buffer)}`,
    entries,
    readEntry(name) {
      const entry = entries.get(name);
      if (!entry) throw new Error(`Entry not found in .kdna asset: ${name}`);
      return readZipEntry(buffer, entry);
    },
  };
}

function listEntries(asset) {
  return [...asset.entries.keys()].sort();
}

function readEntry(asset, entryName, encoding) {
  const buf = asset.readEntry(entryName);
  return encoding ? buf.toString(encoding) : buf;
}

function readManifest(asset) {
  return parseJson(asset.readEntry('kdna.json'), 'kdna.json');
}

function readDataMapSync(asset, options = {}) {
  const dataMap = {};
  const manifest = readManifest(asset);

  if (asset.entries.has('payload.kdnab')) {
    const payloadBuf = asset.readEntry('payload.kdnab');
    const payload = cbor.decode(payloadBuf);
    if (payload && payload.judgment) {
      if (payload.judgment.core) dataMap['KDNA_Core.json'] = payload.judgment.core;
      if (payload.judgment.patterns) dataMap['KDNA_Patterns.json'] = payload.judgment.patterns;
      if (payload.judgment.scenarios) dataMap['KDNA_Scenarios.json'] = payload.judgment.scenarios;
      if (payload.judgment.cases) dataMap['KDNA_Cases.json'] = payload.judgment.cases;
      if (payload.judgment.reasoning) dataMap['KDNA_Reasoning.json'] = payload.judgment.reasoning;
      if (payload.judgment.evolution) dataMap['KDNA_Evolution.json'] = payload.judgment.evolution;
    }

    const encrypted = encryptedEntries(manifest);
    if (encrypted.length && typeof options.decryptEntry !== 'function') {
      throw new Error(`encrypted entries require decryptEntry hook: ${encrypted.join(', ')}`);
    }
    return dataMap;
  }

  throw new Error('Not a KDNA asset: missing payload.kdnab');
}

function verifySync(asset, options = {}) {
  const errors = [];
  const warnings = [];
  const entries = listEntries(asset);

  if (!asset.entries.has('kdna.json')) errors.push('required entry missing: kdna.json');
  verifyMediaType(asset, errors);
  if (!asset.entries.has('payload.kdnab')) errors.push('required entry missing: payload.kdnab');

  const content_digest = buildContentDigest(asset);
  const asset_digest = asset.asset_digest;
  if (options.asset_digest && options.asset_digest !== asset_digest) {
    errors.push(`asset digest mismatch: expected ${options.asset_digest}, got ${asset_digest}`);
  }
  if (options.content_digest && options.content_digest !== content_digest) {
    errors.push(`content digest mismatch: expected ${options.content_digest}, got ${content_digest}`);
  }

  let manifest = null;
  let signature_valid = null;
  if (asset.entries.has('kdna.json')) {
    try {
      manifest = readManifest(asset);
      validateManifestIdentity(manifest, errors, warnings);
      const encrypted = encryptedEntries(manifest);
      if (encrypted.length) {
        warnings.push(`encrypted entries present: ${encrypted.join(', ')}`);
        if (options.requireDecryption && typeof options.decryptEntry !== 'function') {
          errors.push('decryptEntry hook required for encrypted entries');
        }
        if (typeof options.decryptEntry === 'function') {
          for (const entryName of encrypted) {
            if (!asset.entries.has(entryName)) {
              errors.push(`encrypted entry listed but missing: ${entryName}`);
              continue;
            }
            try {
              const decrypted = maybeDecryptEntrySync(
                asset,
                manifest,
                entryName,
                asset.readEntry(entryName),
                options,
              );
              parseJson(decrypted, entryName);
            } catch (e) {
              errors.push(e.message);
            }
          }
        }
      }
      if (options.requireSignature || manifest.signature) {
        signature_valid = verifySignature(asset, manifest, errors, warnings);
      }
      // ── Human Lock signature verification ──────────────────
      if (asset.entries.has('KDNA_Core.json')) {
        try {
          const coreData = parseJson(asset.readEntry('KDNA_Core.json'), 'KDNA_Core.json');
          verifyHumanLockSignatures(coreData, manifest, errors, warnings);
        } catch (e) {
          warnings.push(`Human Lock signature check skipped: ${e.message}`);
        }
      }
    } catch (e) {
      errors.push(e.message);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    entries,
    manifest,
    asset_digest,
    content_digest,
    signature_valid,
  };
}

function loadProfileSync(asset, profile = 'compact', options = {}) {
  const manifest = readManifest(asset);
  if (profile === 'index') {
    return {
      profile,
      manifest,
      asset_digest: asset.asset_digest,
      content_digest: buildContentDigest(asset),
      entries: listEntries(asset),
      name: manifest.name || manifest.asset_id || null,
      version: manifest.version || null,
      judgment_version: manifest.judgment_version || null,
      keywords: manifest.keywords || [],
    };
  }
  const dataMap = readDataMapSync(asset, STANDARD_ENTRIES, options);
  const mode = profile === 'full' ? 'all' : profile === 'scenario' ? 'auto' : 'minimum';
  const domain = loadDomainFromFiles(dataMap, { mode, input: options.input || '' });
  return {
    profile,
    manifest,
    domain,
    context: options.context === false || !domain ? null : formatContext(domain),
  };
}

function createKdnaAssetReader() {
  return {
    openSync: openAsset,

    async open(input) {
      return openAsset(input);
    },

    listEntriesSync: listEntries,

    async listEntries(asset) {
      return listEntries(asset);
    },

    readEntrySync: readEntry,

    async readEntry(asset, entryName, encoding) {
      return readEntry(asset, entryName, encoding);
    },

    readJsonSync(asset, entryName, options = {}) {
      if (!asset.entries.has(entryName)) return null;
      const manifest =
        entryName === 'kdna.json' ? null : parseJson(asset.readEntry('kdna.json'), 'kdna.json');
      const buf = maybeDecryptEntrySync(asset, manifest, entryName, asset.readEntry(entryName), options);
      return parseJson(buf, entryName);
    },

    async readJson(asset, entryName, options = {}) {
      if (!asset.entries.has(entryName)) return null;
      const manifest =
        entryName === 'kdna.json' ? null : parseJson(asset.readEntry('kdna.json'), 'kdna.json');
      const buf = await maybeDecryptEntry(
        asset,
        manifest,
        entryName,
        asset.readEntry(entryName),
        options,
      );
      return parseJson(buf, entryName);
    },

    readManifestSync: readManifest,

    async readManifest(asset) {
      return readManifest(asset);
    },

    readDataMapSync,

    async readDataMap(asset, entries = STANDARD_ENTRIES, options = {}) {
      const dataMap = {};
      const manifest = await this.readManifest(asset);
      for (const entryName of entries) {
        if (!asset.entries.has(entryName)) continue;
        const buf = await maybeDecryptEntry(
          asset,
          manifest,
          entryName,
          asset.readEntry(entryName),
          options,
        );
        dataMap[entryName] = parseJson(buf, entryName);
      }
      return dataMap;
    },

    contentDigestSync: buildContentDigest,

    async contentDigest(asset) {
      return buildContentDigest(asset);
    },

    verifySync,

    async verify(asset, options = {}) {
      const errors = [];
      const warnings = [];
      const entries = [...asset.entries.keys()].sort();

      if (!asset.entries.has('kdna.json')) errors.push('required entry missing: kdna.json');
      verifyMediaType(asset, errors);
      if (!asset.entries.has('KDNA_Core.json')) errors.push('required entry missing: KDNA_Core.json');
      if (!asset.entries.has('KDNA_Patterns.json')) {
        errors.push('required entry missing: KDNA_Patterns.json');
      }

      const content_digest = buildContentDigest(asset);
      const asset_digest = asset.asset_digest;
      if (options.asset_digest && options.asset_digest !== asset_digest) {
        errors.push(`asset digest mismatch: expected ${options.asset_digest}, got ${asset_digest}`);
      }
      if (options.content_digest && options.content_digest !== content_digest) {
        errors.push(
          `content digest mismatch: expected ${options.content_digest}, got ${content_digest}`,
        );
      }

      let manifest = null;
      let signature_valid = null;
      if (asset.entries.has('kdna.json')) {
        try {
          manifest = parseJson(asset.readEntry('kdna.json'), 'kdna.json');
          validateManifestIdentity(manifest, errors, warnings);
          const encrypted = encryptedEntries(manifest);
          if (encrypted.length) {
            warnings.push(`encrypted entries present: ${encrypted.join(', ')}`);
            if (options.requireDecryption && typeof options.decryptEntry !== 'function') {
              errors.push('decryptEntry hook required for encrypted entries');
            }
            if (typeof options.decryptEntry === 'function') {
              for (const entryName of encrypted) {
                if (!asset.entries.has(entryName)) {
                  errors.push(`encrypted entry listed but missing: ${entryName}`);
                  continue;
                }
                try {
                  const decrypted = await maybeDecryptEntry(
                    asset,
                    manifest,
                    entryName,
                    asset.readEntry(entryName),
                    options,
                  );
                  parseJson(decrypted, entryName);
                } catch (e) {
                  errors.push(e.message);
                }
              }
            }
          }
          if (options.requireSignature || manifest.signature) {
            signature_valid = verifySignature(asset, manifest, errors, warnings);
          }
        } catch (e) {
          errors.push(e.message);
        }
      }

      return {
        ok: errors.length === 0,
        errors,
        warnings,
        entries,
        manifest,
        asset_digest,
        content_digest,
        signature_valid,
      };
    },

    loadProfileSync,

    async loadProfile(asset, profile = 'compact', options = {}) {
      const manifest = await this.readManifest(asset);
      if (profile === 'index') {
        return {
          profile,
          manifest,
          asset_digest: asset.asset_digest,
          content_digest: buildContentDigest(asset),
          entries: await this.listEntries(asset),
          name: manifest.name || manifest.asset_id || null,
          version: manifest.version || null,
          judgment_version: manifest.judgment_version || null,
          keywords: manifest.keywords || [],
        };
      }

      const dataMap = await this.readDataMap(asset, STANDARD_ENTRIES, options);
      const mode = profile === 'full' ? 'all' : profile === 'scenario' ? 'auto' : 'minimum';
      const domain = loadDomainFromFiles(dataMap, { mode, input: options.input || '' });
      return {
        profile,
        manifest,
        domain,
        context: options.context === false || !domain ? null : formatContext(domain),
      };
    },
  };
}

module.exports = {
  STANDARD_ENTRIES,
  createKdnaAssetReader,
};
