#!/usr/bin/env node
/**
 * conformance/signature/run.mjs — known-answer conformance runner for the
 * RFC-0021 M1 signature profile `kdsig.ed25519`.
 *
 * Consumes conformance/signature/vectors.json and proves that this
 * implementation:
 *   - reproduces the pinned content digest, entry-set digest, signing
 *     payload, and bundle bytes (deterministic re-signing);
 *   - preserves every pinned digest through container pack/unpack
 *     round-trips (container DEFLATE bytes are platform-dependent and are
 *     deliberately not pinned);
 *   - verifies the pinned bundle offline and reports the pinned evidence;
 *   - loads a signed container and projects verified signature evidence into
 *     the Runtime Capsule;
 *   - rejects every negative case fail-closed with its declared error code.
 *
 * Independent implementations (e.g. the Python SDK) consume the same vector
 * file. Exit code 0 = every known answer matches.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../../packages/kdna-core/src');
const cbor = require('cbor-x');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vectors = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'vectors.json'), 'utf8'));

let failures = 0;
let checks = 0;

function check(name, condition, detail = '') {
  checks += 1;
  if (condition) {
    console.log(`  PASS ${name}`);
    return;
  }
  failures += 1;
  console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
}

function entryBuffers() {
  const entries = {};
  for (const [name, hexBytes] of Object.entries(vectors.asset.entries)) {
    entries[name] = Buffer.from(hexBytes, 'hex');
  }
  return entries;
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

function mutatedBundleBytes(mutate, contentDigest) {
  if (mutate.replace_bundle_bytes_hex) {
    return Buffer.from(mutate.replace_bundle_bytes_hex, 'hex');
  }
  const bundle = { ...vectors.expected.bundle };
  if (mutate.bundle_signature_flip_nibble) {
    const last = bundle.signature.length - 1;
    const flipped = (parseInt(bundle.signature[last], 16) ^ 1).toString(16);
    bundle.signature = bundle.signature.slice(0, last) + flipped;
  }
  if (mutate.bundle_set) {
    bundle[mutate.bundle_set.path] = mutate.bundle_set.value;
  }
  return Buffer.from(`${stableStringify(bundle)}\n`, 'utf8');
}

function mutatedSignedContainer(negative) {
  const entries = entryBuffers();
  const mutate = negative.mutate;
  if (mutate.entry) {
    let data = Buffer.from(entries[mutate.entry]);
    if (typeof mutate.flip_byte_at === 'number') {
      data = Buffer.from(data);
      data[mutate.flip_byte_at] ^= 0xff;
    }
    if (mutate.json_set) {
      const parsed = JSON.parse(data.toString('utf8'));
      parsed[mutate.json_set.path] = mutate.json_set.value;
      data = Buffer.from(`${stableStringify(parsed)}\n`, 'utf8');
    }
    if (mutate.cbor_set) {
      const decoded = cbor.decode(data);
      let cursor = decoded;
      const pathSegments = mutate.cbor_set.path;
      for (let i = 0; i < pathSegments.length - 1; i += 1) {
        cursor = cursor[pathSegments[i]];
      }
      cursor[pathSegments[pathSegments.length - 1]] = mutate.cbor_set.value;
      data = Buffer.from(cbor.encode(decoded));
    }
    entries[mutate.entry] = data;
  }
  entries[vectors.entry_name] = mutatedBundleBytes(mutate, vectors.expected.content_digest);
  return core.packEntryMap(entries);
}

console.log(
  `kdsig.ed25519 known-answer conformance (${vectors.vector_format} ${vectors.vector_format_version})`,
);

// 1. Canonical content digest, entry-set digest, and signing payload.
const entries = entryBuffers();
const contentDigest = core.contentDigestFromEntryBuffers(entries);
check(
  'content digest matches the pinned known answer',
  contentDigest === vectors.expected.content_digest,
  contentDigest,
);

const entrySetDigest = core.computeRuntimeEntrySetDigest(
  entries['kdna.json'],
  entries['payload.kdnab'],
);
check(
  'entry-set digest matches the pinned known answer',
  entrySetDigest === vectors.expected.entry_set_digest,
  entrySetDigest,
);

const signingPayload = core.buildSigningPayload(contentDigest);
check(
  'signing payload matches the pinned known answer',
  signingPayload.toString('hex') === vectors.expected.signing_payload_hex,
);

// 2. Deterministic re-signing reproduces the pinned bundle byte-for-byte.
const resigned = core.signContentDigest(contentDigest, vectors.key.seed_hex);
check(
  're-signing reproduces the pinned bundle',
  JSON.stringify(resigned) === JSON.stringify(vectors.expected.bundle),
);
const resignedBytes = core.serializeSignatureBundle(resigned);
check(
  're-signing reproduces the pinned bundle bytes',
  resignedBytes.toString('hex') === vectors.expected.bundle_bytes_hex,
);
check(
  'key fingerprint matches the pinned known answer',
  core.keyFingerprint(vectors.key.public_key_hex) === vectors.expected.key_fingerprint,
);

// 3. Offline verification of the pinned bundle.
const evidence = core.verifySignatureBundle(
  Buffer.from(vectors.expected.bundle_bytes_hex, 'hex'),
  contentDigest,
);
check('pinned bundle verifies offline', evidence.state === 'verified');
check(
  'verification evidence carries the pinned key fingerprint',
  evidence.key_fingerprint === vectors.expected.key_fingerprint,
);
check(
  'verification evidence binds the pinned content digest',
  evidence.content_digest === vectors.expected.content_digest,
);

// 4. Container round-trip equivalence. Container ZIP/DEFLATE bytes are NOT
// pinned: DEFLATE output differs across compressors, zlib versions, and
// systems (specs/container.md). Conformance at the container level is
// logical equivalence — unpack → repack preserves every pinned digest and
// the signature still verifies through validate/plan/load.
const unsignedContainer = core.packEntryMap(entries);
const unsignedRoundTrip = core.packEntryMap(
  core.fullEntryBufferMap(core.readLayoutBytes(unsignedContainer)),
);
check(
  'unsigned round-trip preserves the pinned content digest',
  core.contentDigestFromEntryBuffers(
    core.fullEntryBufferMap(core.readLayoutBytes(unsignedRoundTrip)),
  ) === vectors.expected.content_digest,
);

const signed = core.signContainerBytes(unsignedContainer, vectors.key.seed_hex);
check(
  'signing round-trip binds the pinned content digest',
  signed.content_digest === vectors.expected.content_digest,
);
check(
  'signing round-trip emits the pinned bundle bytes',
  signed.bundleBytes.toString('hex') === vectors.expected.bundle_bytes_hex,
);

const signedRoundTrip = core.packEntryMap(
  core.fullEntryBufferMap(core.readLayoutBytes(signed.containerBytes)),
);
const roundTripValidation = core.validate(signedRoundTrip);
check(
  'repacked signed container still validates with a verified signature',
  roundTripValidation.overall_valid === true && roundTripValidation.signature_state === 'verified',
  JSON.stringify(roundTripValidation.problems),
);

// 5. Signed container validates, plans, and loads with verified evidence.
const validation = core.validate(signed.containerBytes);
check(
  'signed container passes validation',
  validation.overall_valid === true,
  JSON.stringify(validation.problems),
);
check('validation reports signature_state=verified', validation.signature_state === 'verified');

const plan = core.planLoad(signed.containerBytes);
check(
  'LoadPlan authorizes the signed container',
  plan.can_load_now === true,
  JSON.stringify(plan.issues),
);
check('LoadPlan reports signature_state=verified', plan.signature_state === 'verified');
check('LoadPlan checks carry signature_valid=true', plan.checks.signature_valid === true);

const capsule = core.loadAuthorized(signed.containerBytes, { profile: 'compact', as: 'json' });
check('Runtime Capsule reports signature.state=verified', capsule.signature.state === 'verified');
check('Runtime Capsule signature profile is pinned', capsule.signature.profile === vectors.profile);
check(
  'Runtime Capsule key fingerprint is pinned',
  capsule.signature.key_fingerprint === vectors.expected.key_fingerprint,
);
check(
  'Runtime Capsule trace agrees with signature state',
  capsule.trace.signature_state === 'verified',
);

// 6. Public verify API: verified for signed, fail-closed absence semantics.
const publicEvidence = core.verifyKDNASignatureSync(signed.containerBytes);
check('verifyKDNASignature returns verified evidence', publicEvidence.state === 'verified');
const absent = core.verifyKDNASignatureSync(unsignedContainer);
check('unsigned asset reports state=absent', absent.state === 'absent');
let requiredAbsentRejected = false;
try {
  core.verifyKDNASignatureSync(unsignedContainer, { required: true });
} catch (error) {
  requiredAbsentRejected = error.code === 'KDNA_SIGNATURE_ABSENT';
}
check('required signature fails closed when absent', requiredAbsentRejected);
let pinnedKeyRejected = false;
try {
  core.verifyKDNASignatureSync(signed.containerBytes, {
    expectedPublicKey: vectors.wrong_key.public_key_hex,
  });
} catch (error) {
  pinnedKeyRejected = error.code === 'KDNA_INTEGRITY_SIGNATURE_FAILED';
}
check('pinned-key mismatch fails closed', pinnedKeyRejected);

// 7. Wrong-key semantics: M1 bundles carry their own key; pinning rejects
// foreign keys fail-closed.
{
  const semantics = vectors.wrong_key_semantics;
  const foreignBundle = core.signContentDigest(contentDigest, vectors.wrong_key.seed_hex);
  const foreignEntries = entryBuffers();
  foreignEntries[vectors.entry_name] = core.serializeSignatureBundle(foreignBundle);
  const foreignContainer = core.packEntryMap(foreignEntries);

  const unpinned = core.verifyKDNASignatureSync(foreignContainer);
  check(
    'wrong-key: unpinned verification reports the foreign key (provenance, not trust)',
    unpinned.state === semantics.unpinned_state &&
      unpinned.key_fingerprint === semantics.unpinned_key_fingerprint,
  );
  let pinnedRejected = false;
  try {
    core.verifyKDNASignatureSync(foreignContainer, {
      expectedPublicKey: semantics.pinned_public_key,
    });
  } catch (error) {
    pinnedRejected = error.code === semantics.pinned_expected_code;
  }
  check(
    `wrong-key: pinned verification fails closed with ${semantics.pinned_expected_code}`,
    pinnedRejected,
  );
}

// 8. Negative cases: every mutated container must fail closed.
for (const negative of vectors.negative_cases) {
  const bytes = mutatedSignedContainer(negative);

  const negativeValidation = core.validate(bytes);
  const invalidGate =
    negativeValidation.signature_valid === false &&
    negativeValidation.overall_valid === false &&
    negativeValidation.signature_state === 'invalid';
  check(`negative ${negative.id}: validation gate fails closed`, invalidGate);

  const negativePlan = core.planLoad(bytes);
  const planBlocked =
    negativePlan.can_load_now === false &&
    negativePlan.state === 'invalid' &&
    negativePlan.issues.some((issue) => issue.code === negative.expected_code);
  check(
    `negative ${negative.id}: LoadPlan blocks with ${negative.expected_code}`,
    planBlocked,
    JSON.stringify(negativePlan.issues),
  );

  let verifyRejected = false;
  try {
    core.verifyKDNASignatureSync(bytes);
  } catch (error) {
    verifyRejected = error.code === negative.expected_code;
  }
  check(`negative ${negative.id}: verify rejects with ${negative.expected_code}`, verifyRejected);

  let loadRejected = false;
  try {
    core.loadAuthorized(bytes, { profile: 'compact', as: 'json' });
  } catch (error) {
    loadRejected = true;
  }
  check(`negative ${negative.id}: load refuses the mutated asset`, loadRejected);
}

console.log(
  failures === 0
    ? `kdsig.ed25519 signature conformance passed (${checks} checks)`
    : `kdsig.ed25519 signature conformance FAILED (${failures}/${checks} checks failed)`,
);
process.exit(failures === 0 ? 0 : 1);
