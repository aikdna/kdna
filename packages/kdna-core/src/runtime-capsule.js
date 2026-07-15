'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');

const JsonSchema2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const { createKdnaAssetReader } = require('./asset-reader');
const container = require('./container');
const digestEvidenceSchema = require('../schema/digest-evidence.schema.json');
const runtimeCapsuleSchema = require('../schema/runtime-capsule.schema.json');

const SHA256_RE = /^sha256:[0-9a-f]{64}$/;
const DIGEST_PROFILE = 'kdna.digest-evidence';
const DIGEST_PROFILE_VERSION = '0.1.0';
const CAPSULE_DIGEST_PROFILE = 'kdna.canonicalization.runtime-capsule-jcs';
const CANONICALIZATION_PROFILE_VERSION = '0.1.0';
const RUNTIME_CAPSULE_CONTRACT_VERSION = '0.1.0';
const COMPARISON_SOURCES = new Set([
  'caller',
  'registry',
  'install_receipt',
  'lockfile',
  'kdna.json.content_digest',
  'kdna.json.authoring.content_digest',
  'checksums.json.entry_set_digest',
]);
const EXTERNAL_COMPARISON_SOURCES = new Set([
  'caller',
  'registry',
  'install_receipt',
  'lockfile',
]);
const COMPARISON_TARGETS = new Set([
  'external_expected',
  'manifest_declaration',
  'checksum_declaration',
]);
const BASIS = Object.freeze({
  asset: 'kdna.digest-basis.container-bytes',
  content: 'kdna.digest-basis.content-tree',
  runtime_entry_set: 'kdna.digest-basis.runtime-entry-set',
});
let validators;

function schemaValidators() {
  if (validators) return validators;
  const ajv = new JsonSchema2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(digestEvidenceSchema);
  validators = {
    runtimeCapsule: ajv.compile(runtimeCapsuleSchema),
  };
  return validators;
}

function fail(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  throw error;
}

function sha256Digest(bytes) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return `sha256:${crypto.createHash('sha256').update(buffer).digest('hex')}`;
}

function snapshotPackagedBytes(input) {
  if (Buffer.isBuffer(input) || input instanceof Uint8Array) {
    return { bytes: Buffer.from(input), inputKind: 'packaged_bytes' };
  }
  if (typeof input !== 'string') {
    fail(
      'KDNA_RUNTIME_CAPSULE_INPUT_INVALID',
      'Runtime Capsule requires a packaged .kdna path, Buffer, or Uint8Array.',
    );
  }

  let stat;
  try {
    stat = fs.statSync(input);
  } catch (error) {
    fail('KDNA_RUNTIME_CAPSULE_INPUT_INVALID', `Cannot read packaged KDNA asset: ${error.message}`);
  }
  if (stat.isDirectory()) {
    fail(
      'KDNA_ASSET_FILE_REQUIRED',
      'Runtime Capsule requires final packaged .kdna bytes; authoring directories are not runtime assets.',
    );
  }
  if (!stat.isFile()) {
    fail('KDNA_RUNTIME_CAPSULE_INPUT_INVALID', 'Runtime Capsule input is not a regular file.');
  }
  return { bytes: fs.readFileSync(input), inputKind: 'packaged_file' };
}

function computeAssetDigest(assetBytes) {
  if (!Buffer.isBuffer(assetBytes) && !(assetBytes instanceof Uint8Array)) {
    fail('KDNA_DIGEST_INPUT_INVALID', 'A requires final packaged asset bytes.');
  }
  return sha256Digest(assetBytes);
}

function readJsonEntry(asset, entryName) {
  if (!asset.entries.has(entryName)) return null;
  try {
    return JSON.parse(asset.readEntry(entryName).toString('utf8'));
  } catch (error) {
    fail('KDNA_DIGEST_DECLARATION_INVALID', `${entryName}: invalid JSON: ${error.message}`);
  }
}

function normalizeExpectedDigest(
  expected,
  defaultSource,
  allowedSources = EXTERNAL_COMPARISON_SOURCES,
) {
  if (expected == null) return null;
  const normalized =
    typeof expected === 'string' ? { value: expected, source: defaultSource } : expected;
  if (
    !normalized ||
    typeof normalized !== 'object' ||
    !SHA256_RE.test(normalized.value || '') ||
    typeof normalized.source !== 'string' ||
    !allowedSources.has(normalized.source)
  ) {
    fail(
      'KDNA_DIGEST_EXPECTATION_INVALID',
      'Expected digest must provide a lowercase sha256 value and a factual source.',
    );
  }
  return { value: normalized.value, source: normalized.source };
}

function normalizeDeclaredDigest(value, source) {
  return normalizeExpectedDigest(
    { value, source },
    source,
    new Set([source]),
  );
}

function comparison(observed, expected, against) {
  if (!expected) {
    return { state: 'not_compared', against: null, expected: null, source: null };
  }
  return {
    state: observed === expected.value ? 'matched' : 'mismatched',
    against,
    expected: expected.value,
    source: expected.source,
  };
}

function declaredContentDigest(manifest) {
  const topLevel = manifest && manifest.content_digest !== undefined
    ? normalizeDeclaredDigest(manifest.content_digest, 'kdna.json.content_digest')
    : null;
  const authoring = manifest?.authoring?.content_digest !== undefined
    ? normalizeDeclaredDigest(
        manifest.authoring.content_digest,
        'kdna.json.authoring.content_digest',
      )
    : null;
  if (topLevel && authoring && topLevel.value !== authoring.value) {
    fail(
      'KDNA_CONTENT_DIGEST_DECLARATION_CONFLICT',
      'kdna.json content_digest conflicts with authoring.content_digest.',
      { top_level: topLevel.value, authoring: authoring.value },
    );
  }
  return topLevel || authoring;
}

function declaredEntrySetDigest(checksums) {
  if (!checksums) return null;
  return checksums.entry_set_digest !== undefined
    ? normalizeDeclaredDigest(
        checksums.entry_set_digest,
        'checksums.json.entry_set_digest',
      )
    : null;
}

function comparisonWithDeclarationPriority(observed, declared, external, declarationTarget) {
  const declarationComparison = comparison(observed, declared, declarationTarget);
  if (declarationComparison.state === 'mismatched') return declarationComparison;
  if (external) return comparison(observed, external, 'external_expected');
  return declarationComparison;
}

function computeDigestEvidenceFromBytes(assetBytes, options = {}) {
  const bytes = Buffer.isBuffer(assetBytes)
    ? Buffer.from(assetBytes)
    : Buffer.from(assetBytes || []);
  const reader = createKdnaAssetReader();
  const asset = reader.openSync(bytes);
  if (!asset.entries.has('kdna.json') || !asset.entries.has('payload.kdnab')) {
    fail(
      'KDNA_DIGEST_INPUT_INVALID',
      'Digest evidence requires kdna.json and payload.kdnab entries.',
    );
  }

  const manifest = readJsonEntry(asset, 'kdna.json');
  const checksums = readJsonEntry(asset, 'checksums.json');
  const assetDigest = computeAssetDigest(bytes);
  const contentDigest = reader.contentDigestSync(asset);
  const entrySetDigest = container.computeRuntimeEntrySetDigest(
    asset.readEntry('kdna.json'),
    asset.readEntry('payload.kdnab'),
  );
  const externalExpected = options.expectedDigests || {};
  const expectedAsset = normalizeExpectedDigest(
    externalExpected.asset,
    'caller',
  );
  const externalContent = normalizeExpectedDigest(externalExpected.content, 'caller');
  const externalEntrySet = normalizeExpectedDigest(externalExpected.runtime_entry_set, 'caller');
  const declaredContent = declaredContentDigest(manifest);
  const declaredEntrySet = declaredEntrySetDigest(checksums);

  return {
    profile: DIGEST_PROFILE,
    profile_version: DIGEST_PROFILE_VERSION,
    asset: {
      value: assetDigest,
      basis: BASIS.asset,
      comparison: comparison(assetDigest, expectedAsset, 'external_expected'),
    },
    content: {
      value: contentDigest,
      basis: BASIS.content,
      comparison: comparisonWithDeclarationPriority(
        contentDigest,
        declaredContent,
        externalContent,
        'manifest_declaration',
      ),
    },
    runtime_entry_set: {
      value: entrySetDigest,
      basis: BASIS.runtime_entry_set,
      comparison: comparisonWithDeclarationPriority(
        entrySetDigest,
        declaredEntrySet,
        externalEntrySet,
        'checksum_declaration',
      ),
    },
  };
}

function computeDigestEvidence(input, options = {}) {
  const { bytes } = snapshotPackagedBytes(input);
  return computeDigestEvidenceFromBytes(bytes, options);
}

function assertUnicodeScalarString(value, label) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        fail('KDNA_JCS_INVALID_UNICODE', `${label} contains an unpaired high surrogate.`);
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      fail('KDNA_JCS_INVALID_UNICODE', `${label} contains an unpaired low surrogate.`);
    }
  }
}

function canonicalizeJcs(value) {
  const active = new Set();

  function serialize(current, label) {
    if (current === null) return 'null';
    if (typeof current === 'boolean') return current ? 'true' : 'false';
    if (typeof current === 'string') {
      assertUnicodeScalarString(current, label);
      return JSON.stringify(current);
    }
    if (typeof current === 'number') {
      if (!Number.isFinite(current)) {
        fail('KDNA_JCS_NON_FINITE_NUMBER', `${label} contains a non-finite number.`);
      }
      return JSON.stringify(current);
    }
    if (typeof current !== 'object') {
      fail('KDNA_JCS_UNSUPPORTED_VALUE', `${label} is not an RFC 8785 JSON value.`);
    }
    if (active.has(current)) {
      fail('KDNA_JCS_CYCLIC_VALUE', `${label} contains a cyclic reference.`);
    }

    active.add(current);
    try {
      if (Array.isArray(current)) {
        const items = [];
        for (let index = 0; index < current.length; index += 1) {
          if (!Object.prototype.hasOwnProperty.call(current, index)) {
            fail('KDNA_JCS_UNSUPPORTED_VALUE', `${label} contains a sparse array.`);
          }
          items.push(serialize(current[index], `${label}[${index}]`));
        }
        return `[${items.join(',')}]`;
      }

      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        fail('KDNA_JCS_UNSUPPORTED_VALUE', `${label} must be a plain JSON object.`);
      }
      const names = Object.getOwnPropertyNames(current);
      const keys = Object.keys(current);
      if (names.length !== keys.length || Object.getOwnPropertySymbols(current).length !== 0) {
        fail('KDNA_JCS_UNSUPPORTED_VALUE', `${label} contains non-JSON object members.`);
      }
      keys.sort();
      const members = keys.map((key) => {
        assertUnicodeScalarString(key, `${label} key`);
        const descriptor = Object.getOwnPropertyDescriptor(current, key);
        if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
          fail('KDNA_JCS_UNSUPPORTED_VALUE', `${label}.${key} must be a data property.`);
        }
        return `${JSON.stringify(key)}:${serialize(descriptor.value, `${label}.${key}`)}`;
      });
      return `{${members.join(',')}}`;
    } finally {
      active.delete(current);
    }
  }

  return serialize(value, '$');
}

function computeCapsuleDeliveryDigest(capsule) {
  return sha256Digest(Buffer.from(canonicalizeJcs(capsule), 'utf8'));
}

function schemaErrorDetails(validator) {
  return JSON.parse(JSON.stringify(validator.errors || []));
}

function assertJsonValue(value, code, label) {
  try {
    canonicalizeJcs(value);
  } catch (error) {
    fail(code, `${label} is not an RFC 8785 JSON value: ${error.message}`, {
      cause_code: error.code || null,
    });
  }
}

function assertRuntimeCapsuleSuccess(capsule, code = 'KDNA_RUNTIME_CAPSULE_INVALID') {
  assertJsonValue(capsule, code, 'Runtime Capsule');
  const validator = schemaValidators().runtimeCapsule;
  if (!validator(capsule)) {
    fail(
      code,
      'Runtime Capsule does not satisfy the current contract.',
      schemaErrorDetails(validator),
    );
  }
  assertSuccessfulDigestEvidence(capsule.digests);
  if (capsule.signature.state !== capsule.trace.signature_state) {
    fail(code, 'Runtime Capsule signature state conflicts with its trace.');
  }
  if (capsule.profile !== capsule.trace.profile) {
    fail(code, 'Runtime Capsule profile conflicts with its trace.');
  }
}

function assertSuccessfulDigestEvidence(digests) {
  if (
    !digests ||
    digests.profile !== DIGEST_PROFILE ||
    digests.profile_version !== DIGEST_PROFILE_VERSION
  ) {
    fail(
      'KDNA_RUNTIME_CAPSULE_DIGEST_EVIDENCE_INVALID',
      'Runtime Capsule digest evidence is missing or uses the wrong profile coordinate.',
    );
  }
  for (const name of ['asset', 'content', 'runtime_entry_set']) {
    const item = digests[name];
    if (!item || !SHA256_RE.test(item.value || '') || item.basis !== BASIS[name]) {
      fail(
        'KDNA_RUNTIME_CAPSULE_DIGEST_EVIDENCE_INVALID',
        `Runtime Capsule ${name} digest evidence is invalid.`,
      );
    }
    const comparisonState = item.comparison && item.comparison.state;
    if (!['matched', 'not_compared'].includes(comparisonState)) {
      const mismatchCodes = {
        asset: 'KDNA_ASSET_DIGEST_MISMATCH',
        content: 'KDNA_CONTENT_DIGEST_MISMATCH',
        runtime_entry_set: 'KDNA_RUNTIME_ENTRY_SET_DIGEST_MISMATCH',
      };
      fail(
        comparisonState === 'mismatched'
          ? mismatchCodes[name]
          : 'KDNA_RUNTIME_CAPSULE_DIGEST_EVIDENCE_INVALID',
        `Runtime Capsule cannot be emitted with ${name} comparison ${comparisonState || 'missing'}.`,
        { digest: name, evidence: item },
      );
    }
    if (
      comparisonState === 'matched' &&
      (item.comparison.expected !== item.value ||
        !COMPARISON_TARGETS.has(item.comparison.against) ||
        !COMPARISON_SOURCES.has(item.comparison.source))
    ) {
      fail(
        'KDNA_RUNTIME_CAPSULE_DIGEST_EVIDENCE_INVALID',
        `Runtime Capsule ${name} matched comparison is internally inconsistent.`,
      );
    }
    if (
      comparisonState === 'not_compared' &&
      (item.comparison.expected !== null ||
        item.comparison.against !== null ||
        item.comparison.source !== null)
    ) {
      fail(
        'KDNA_RUNTIME_CAPSULE_DIGEST_EVIDENCE_INVALID',
        `Runtime Capsule ${name} not_compared evidence must not claim an expectation.`,
      );
    }
  }
}

function normalizeRuntimeAccess(access) {
  return access === undefined ? 'public' : access;
}

function buildRuntimeCapsule({
  projection,
  manifest,
  digests,
  signature,
  inputKind,
  loadedAt,
  schemaValid,
} = {}) {
  if (!projection || typeof projection !== 'object' || Array.isArray(projection)) {
    fail('KDNA_RUNTIME_CAPSULE_BUILD_INVALID', 'Runtime Capsule builder requires a projection.');
  }
  if (!manifest || typeof manifest !== 'object') {
    fail('KDNA_RUNTIME_CAPSULE_BUILD_INVALID', 'Runtime Capsule builder requires the manifest.');
  }
  for (const field of ['asset_id', 'asset_uid', 'version', 'judgment_version']) {
    if (typeof manifest[field] !== 'string' || manifest[field].length === 0) {
      fail('KDNA_RUNTIME_CAPSULE_BUILD_INVALID', `Runtime manifest ${field} is required.`);
    }
  }
  if (!['packaged_file', 'packaged_bytes'].includes(inputKind)) {
    fail(
      'KDNA_RUNTIME_CAPSULE_BUILD_INVALID',
      'Runtime Capsule input_kind must identify packaged bytes.',
    );
  }
  assertSuccessfulDigestEvidence(digests);
  const timestamp = loadedAt || new Date().toISOString();
  if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) {
    fail(
      'KDNA_RUNTIME_CAPSULE_BUILD_INVALID',
      'Runtime Capsule loaded_at must be an ISO date-time string.',
    );
  }
  const runtimeAccess = normalizeRuntimeAccess(manifest.access);
  if (!['public', 'licensed', 'remote'].includes(runtimeAccess)) {
    fail('KDNA_RUNTIME_CAPSULE_BUILD_INVALID', `Unsupported Runtime access: ${runtimeAccess}.`);
  }
  const signatureEvidence = signature || { state: 'absent' };

  const capsule = {
    type: 'kdna.runtime-capsule',
    contract_version: RUNTIME_CAPSULE_CONTRACT_VERSION,
    asset: {
      asset_id: manifest.asset_id,
      asset_uid: manifest.asset_uid,
      version: manifest.version,
      judgment_version: manifest.judgment_version,
    },
    digests,
    signature: signatureEvidence,
    access: runtimeAccess,
    risk_level: manifest.risk_level || null,
    profile: projection.profile,
    context: projection.content || {},
    trace: {
      payload_encoding: manifest.payload?.encoding || 'cbor',
      loaded_by: 'kdna-core',
      loaded_at: timestamp,
      input_kind: inputKind,
      runtime_eligible: true,
      schema_valid: schemaValid === true,
      signature_state: signatureEvidence.state,
      profile: projection.profile,
    },
  };
  assertRuntimeCapsuleSuccess(capsule, 'KDNA_RUNTIME_CAPSULE_BUILD_INVALID');
  return capsule;
}

function loadRuntimeCapsule(input, options = {}) {
  snapshotPackagedBytes(input);
  return container.loadAuthorized(input, { ...options, as: 'json' });
}

module.exports = {
  BASIS,
  CAPSULE_DIGEST_PROFILE,
  CANONICALIZATION_PROFILE_VERSION,
  DIGEST_PROFILE,
  DIGEST_PROFILE_VERSION,
  RUNTIME_CAPSULE_CONTRACT_VERSION,
  buildRuntimeCapsule,
  canonicalizeJcs,
  computeAssetDigest,
  computeCapsuleDeliveryDigest,
  computeDigestEvidence,
  computeRuntimeEntrySetDigest: container.computeRuntimeEntrySetDigest,
  loadRuntimeCapsule,
};
