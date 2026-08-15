#!/usr/bin/env node
/**
 * generate-signature-vectors.mjs — deterministic known-answer vectors for the
 * RFC-0021 M1 signature profile `kdsig.ed25519`.
 *
 * The vectors pin, byte for byte:
 *   - the canonical content digest of a minimal asset;
 *   - the Ed25519 signing payload derived from it;
 *   - the signature bundle and its canonical wire bytes;
 *   - the signer key fingerprint;
 *   - a set of negative cases every conforming verifier must reject.
 *
 * Ed25519 and SHA-256 are deterministic, so this script reproduces identical
 * output on every run and every platform. The private key seed is public
 * vector material, not a secret; it must never be reused for real signing.
 *
 * Usage: node scripts/generate-signature-vectors.mjs [--check]
 *   --check  re-derive the vectors and fail if the committed file differs.
 */

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cbor = require('cbor-x');
const core = require('../packages/kdna-core/src');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.resolve(REPO_ROOT, 'conformance', 'signature', 'vectors.json');
const PRETTIER_BIN = path.join(REPO_ROOT, 'node_modules', 'prettier', 'bin', 'prettier.cjs');

const VECTOR_FORMAT = 'kdsig.conformance-vectors';
const VECTOR_FORMAT_VERSION = '0.1.0';

// Public, deterministic vector seed. Never reuse for real signing.
const SEED = crypto
  .createHash('sha256')
  .update('kdsig.ed25519 conformance vector seed (public, deterministic)')
  .digest();
const WRONG_SEED = crypto
  .createHash('sha256')
  .update('kdsig.ed25519 conformance vector wrong-key seed (public, deterministic)')
  .digest();

const MANIFEST = {
  format_version: '0.1.0',
  asset_id: 'kdna:conformance:signature:kdsig-ed25519',
  asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000511',
  asset_type: 'fixture',
  title: 'Signature Conformance Fixture',
  version: '1.0.0',
  judgment_version: '1.0.0',
  created_at: '2026-08-16T00:00:00Z',
  updated_at: '2026-08-16T00:00:00Z',
  compatibility: {
    min_loader_version: '0.20.0',
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
  },
  payload: {
    path: 'payload.kdnab',
    encoding: 'cbor',
    encrypted: false,
  },
  access: 'public',
};

const PAYLOAD = {
  profile: 'kdna.payload.judgment',
  profile_version: '0.1.0',
  core: {
    axioms: [
      {
        statement: 'Verify integrity before trusting a loaded judgment.',
        applies_when: ['loading a signed KDNA asset'],
      },
    ],
  },
};

function hex(buf) {
  return Buffer.from(buf).toString('hex');
}

function buildVectors() {
  const entries = {
    mimetype: Buffer.from(core.MIMETYPE, 'utf8'),
    'kdna.json': Buffer.from(`${stableJson(MANIFEST)}\n`, 'utf8'),
    'payload.kdnab': Buffer.from(cbor.encode(PAYLOAD)),
  };

  const contentDigest = core.contentDigestFromEntryBuffers(entries);
  const signingPayload = core.buildSigningPayload(contentDigest);
  const seedHex = SEED.toString('hex');
  const bundle = core.signContentDigest(contentDigest, seedHex);
  const bundleBytes = core.serializeSignatureBundle(bundle);
  const wrongBundle = core.signContentDigest(contentDigest, WRONG_SEED.toString('hex'));

  const unsignedContainer = core.packEntryMap(entries);
  const signed = core.signContainerBytes(unsignedContainer, seedHex);

  return {
    vector_format: VECTOR_FORMAT,
    vector_format_version: VECTOR_FORMAT_VERSION,
    profile: core.KDSIG_PROFILE,
    profile_version: core.KDSIG_PROFILE_VERSION,
    algorithm: core.KDSIG_ALGORITHM,
    entry_name: core.SIGNATURE_ENTRY_NAME,
    note: 'Deterministic known-answer vectors for kdsig.ed25519 (RFC-0021 M1). The seed is public vector material, never a real signing key.',
    key: {
      seed_hex: seedHex,
      public_key_hex: bundle.public_key,
      key_fingerprint: core.keyFingerprint(bundle.public_key),
    },
    wrong_key: {
      seed_hex: WRONG_SEED.toString('hex'),
      public_key_hex: wrongBundle.public_key,
    },
    asset: {
      entries: {
        mimetype: hex(entries.mimetype),
        'kdna.json': hex(entries['kdna.json']),
        'payload.kdnab': hex(entries['payload.kdnab']),
      },
      unsigned_container_sha256: crypto
        .createHash('sha256')
        .update(unsignedContainer)
        .digest('hex'),
    },
    expected: {
      content_digest: contentDigest,
      signing_payload_hex: hex(signingPayload),
      signing_payload: signingPayload.toString('utf8'),
      bundle,
      bundle_bytes_hex: hex(bundleBytes),
      key_fingerprint: core.keyFingerprint(bundle.public_key),
      signed_container_sha256: crypto
        .createHash('sha256')
        .update(signed.containerBytes)
        .digest('hex'),
    },
    negative_cases: [
      {
        id: 'tampered-payload',
        description:
          'One payload statement changed after signing while keeping the CBOR valid; the bundle content_digest no longer matches.',
        mutate: {
          entry: 'payload.kdnab',
          cbor_set: { path: ['core', 'axioms', '0', 'statement'], value: 'Tampered statement.' },
        },
        expected_code: 'KDNA_INTEGRITY_SIGNATURE_FAILED',
      },
      {
        id: 'tampered-manifest',
        description:
          'Manifest title changed after signing; the bundle content_digest no longer matches.',
        mutate: { entry: 'kdna.json', json_set: { path: 'title', value: 'Tampered Title' } },
        expected_code: 'KDNA_INTEGRITY_SIGNATURE_FAILED',
      },
      {
        id: 'tampered-signature',
        description: 'One nibble of the bundle signature flipped.',
        mutate: { bundle_signature_flip_nibble: true },
        expected_code: 'KDNA_INTEGRITY_SIGNATURE_FAILED',
      },
      {
        id: 'unsupported-profile',
        description: 'Bundle declares an unknown signature profile.',
        mutate: { bundle_set: { path: 'profile', value: 'kdsig.example' } },
        expected_code: 'KDNA_SIGNATURE_PROFILE_UNSUPPORTED',
      },
      {
        id: 'unsupported-version',
        description: 'Bundle declares an unsupported profile_version.',
        mutate: { bundle_set: { path: 'profile_version', value: '0.2.0' } },
        expected_code: 'KDNA_SIGNATURE_VERSION_UNSUPPORTED',
      },
      {
        id: 'extra-field',
        description: 'Bundle carries an undeclared extra field.',
        mutate: { bundle_set: { path: 'issuer', value: 'conformance' } },
        expected_code: 'KDNA_INTEGRITY_SIGNATURE_FAILED',
      },
      {
        id: 'malformed-json',
        description: 'signature.kdsig entry is not valid JSON.',
        mutate: { replace_bundle_bytes_hex: hex(Buffer.from('{not-json\n', 'utf8')) },
        expected_code: 'KDNA_INTEGRITY_SIGNATURE_FAILED',
      },
    ],
    wrong_key_semantics: {
      description:
        "M1 bundles carry their own public key. A bundle signed by a different key verifies under that key, so unpinned verification reports the foreign key fingerprint; key trust is the consumer's pinning decision and identity binding is future milestone work. Pinning the vector key must reject the foreign bundle fail-closed.",
      bundle_signer: 'wrong_key',
      unpinned_state: 'verified',
      unpinned_key_fingerprint: core.keyFingerprint(wrongBundle.public_key),
      pinned_public_key: bundle.public_key,
      pinned_expected_code: 'KDNA_INTEGRITY_SIGNATURE_FAILED',
    },
  };
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

const vectors = buildVectors();

function formattedVectors() {
  const temporary = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'kdsig-vectors-')),
    'vectors.json',
  );
  fs.writeFileSync(temporary, `${JSON.stringify(vectors, null, 2)}\n`);
  if (fs.existsSync(PRETTIER_BIN)) {
    execFileSync(process.execPath, [PRETTIER_BIN, '--write', temporary], { stdio: 'ignore' });
  }
  const formatted = fs.readFileSync(temporary, 'utf8');
  fs.rmSync(path.dirname(temporary), { recursive: true, force: true });
  return formatted;
}

const serialized = formattedVectors();

if (process.argv.includes('--check')) {
  const committed = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
  if (committed !== serialized) {
    console.error(
      'signature vectors are stale: re-run node scripts/generate-signature-vectors.mjs',
    );
    process.exit(1);
  }
  console.log('signature vectors match the committed known-answer file');
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, serialized);
console.log(`wrote ${path.relative(process.cwd(), OUTPUT)}`);
console.log(`  content_digest: ${vectors.expected.content_digest}`);
console.log(`  public_key:     ${vectors.key.public_key_hex}`);
console.log(`  signature:      ${vectors.expected.bundle.signature.slice(0, 32)}...`);
