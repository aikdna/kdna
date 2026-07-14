'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');

const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const { createKdnaAssetReader } = require('./asset-reader');
const v1 = require('./v1');
const digestEvidenceSchema = require('../schema/digest-evidence.schema.json');
const capsule1Schema = require('../schema/runtime-capsule-1.schema.json');
const capsule2Schema = require('../schema/runtime-capsule-2.schema.json');

const SHA256_RE = /^sha256:[0-9a-f]{64}$/;
const DIGEST_PROFILE = 'kdna-capsule-digests-v1';
const CAPSULE_DIGEST_PROFILE = 'kdna-capsule-jcs-v1';
const COMPARISON_SOURCES = new Set([
  'caller',
  'registry',
  'install_receipt',
  'lockfile',
  'kdna.json.content_digest',
  'kdna.json.authoring.content_digest',
  'checksums.json.entry_set_digest',
  'checksums.json.asset_digest',
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
  asset: 'kdna-container-bytes-v1',
  content: 'kdna-content-tree-v1',
  runtime_entry_set: 'kdna-runtime-entry-set-v1',
});
const CAPSULE_1_EXTENSION_KEYS = Object.freeze([
  'extends_chain',
  'inheritance_applied',
  'resolved_dependencies',
  'rag_isolation_policy',
]);
const CAPSULE_1_ACCESS_ALIASES = new Set(['open', 'protected', 'runtime']);

let validators;

function schemaValidators() {
  if (validators) return validators;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(digestEvidenceSchema);
  validators = {
    capsule1: ajv.compile(capsule1Schema),
    capsule2: ajv.compile(capsule2Schema),
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
      'KDNA_CAPSULE_2_INPUT_INVALID',
      'Capsule 2 requires a packaged .kdna path, Buffer, or Uint8Array.',
    );
  }

  let stat;
  try {
    stat = fs.statSync(input);
  } catch (error) {
    fail('KDNA_CAPSULE_2_INPUT_INVALID', `Cannot read packaged KDNA asset: ${error.message}`);
  }
  if (stat.isDirectory()) {
    fail(
      'KDNA_ASSET_FILE_REQUIRED',
      'Runtime Capsule 2 requires final packaged .kdna bytes; authoring directories are not runtime assets.',
    );
  }
  if (!stat.isFile()) {
    fail('KDNA_CAPSULE_2_INPUT_INVALID', 'Capsule 2 input is not a regular file.');
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
  const canonical = checksums.entry_set_digest !== undefined
    ? normalizeDeclaredDigest(
        checksums.entry_set_digest,
        'checksums.json.entry_set_digest',
      )
    : null;
  const legacy = checksums.asset_digest !== undefined
    ? normalizeDeclaredDigest(checksums.asset_digest, 'checksums.json.asset_digest')
    : null;
  if (canonical && legacy && canonical.value !== legacy.value) {
    fail(
      'KDNA_RUNTIME_ENTRY_SET_DIGEST_DECLARATION_CONFLICT',
      'checksums.json entry_set_digest conflicts with deprecated asset_digest.',
      { entry_set_digest: canonical.value, asset_digest: legacy.value },
    );
  }
  return canonical || legacy;
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
  const entrySetDigest = v1.computeRuntimeEntrySetDigest(
    asset.readEntry('kdna.json'),
    asset.readEntry('payload.kdnab'),
  );
  const externalExpected = options.expectedDigests || {};
  const expectedAsset = normalizeExpectedDigest(
    externalExpected.asset ?? options.expectedAssetDigest,
    'caller',
  );
  const externalContent = normalizeExpectedDigest(externalExpected.content, 'caller');
  const externalEntrySet = normalizeExpectedDigest(externalExpected.runtime_entry_set, 'caller');
  const declaredContent = declaredContentDigest(manifest);
  const declaredEntrySet = declaredEntrySetDigest(checksums);

  return {
    profile: DIGEST_PROFILE,
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

function assertCapsule1Success(capsule, code = 'KDNA_CAPSULE_2_BUILD_INVALID') {
  assertJsonValue(capsule, code, 'Capsule 1');
  const validator = schemaValidators().capsule1;
  if (!validator(capsule)) {
    fail(code, 'Capsule 1 does not satisfy the frozen schema.', schemaErrorDetails(validator));
  }
  if (capsule.trace.schema_valid !== true) {
    fail(code, 'Capsule 1 schema_valid must be true before building Capsule 2.');
  }
  if (capsule.signature.state !== capsule.trace.signature_state) {
    fail(code, 'Capsule 1 signature state conflicts with its trace.');
  }
  if (capsule.profile !== capsule.trace.profile) {
    fail(code, 'Capsule 1 profile conflicts with its trace.');
  }
  if (!['public', 'licensed', 'remote'].includes(capsule2Access(capsule.access))) {
    fail(code, `Capsule 1 access is not a supported Runtime value: ${capsule.access}.`);
  }
}

function assertCapsule2Success(capsule, code = 'KDNA_CAPSULE_ADAPTER_INPUT_INVALID') {
  assertJsonValue(capsule, code, 'Capsule 2');
  const validator = schemaValidators().capsule2;
  if (!validator(capsule)) {
    fail(code, 'Capsule 2 does not satisfy the successful Runtime schema.', schemaErrorDetails(validator));
  }
  assertSuccessfulDigestEvidence(capsule.digests);
  if (capsule.signature.state !== capsule.trace.signature_state) {
    fail(code, 'Capsule 2 signature state conflicts with its trace.');
  }
  if (capsule.profile !== capsule.trace.profile) {
    fail(code, 'Capsule 2 profile conflicts with its trace.');
  }
}

function assertSuccessfulDigestEvidence(digests) {
  if (!digests || digests.profile !== DIGEST_PROFILE) {
    fail('KDNA_CAPSULE_2_DIGEST_EVIDENCE_INVALID', 'Capsule 2 digest evidence is missing.');
  }
  for (const name of ['asset', 'content', 'runtime_entry_set']) {
    const item = digests[name];
    if (!item || !SHA256_RE.test(item.value || '') || item.basis !== BASIS[name]) {
      fail(
        'KDNA_CAPSULE_2_DIGEST_EVIDENCE_INVALID',
        `Capsule 2 ${name} digest evidence is invalid.`,
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
          : 'KDNA_CAPSULE_2_DIGEST_EVIDENCE_INVALID',
        `Capsule 2 cannot be emitted with ${name} comparison ${comparisonState || 'missing'}.`,
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
        'KDNA_CAPSULE_2_DIGEST_EVIDENCE_INVALID',
        `Capsule 2 ${name} matched comparison is internally inconsistent.`,
      );
    }
    if (
      comparisonState === 'not_compared' &&
      (item.comparison.expected !== null ||
        item.comparison.against !== null ||
        item.comparison.source !== null)
    ) {
      fail(
        'KDNA_CAPSULE_2_DIGEST_EVIDENCE_INVALID',
        `Capsule 2 ${name} not_compared evidence must not claim an expectation.`,
      );
    }
  }
}

function capsule2Access(access) {
  if (!access || access === 'open') return 'public';
  if (access === 'protected') return 'licensed';
  if (access === 'runtime') return 'remote';
  return access;
}

function buildCapsuleV2({ capsule1, manifest, digests, inputKind, loadedAt } = {}) {
  if (!capsule1 || capsule1.type !== 'kdna.context.capsule' || capsule1.version !== '1.0') {
    fail(
      'KDNA_CAPSULE_2_BUILD_INVALID',
      'Capsule 2 builder requires a frozen Capsule 1 projection.',
    );
  }
  assertCapsule1Success(capsule1);
  if (!manifest || typeof manifest !== 'object') {
    fail('KDNA_CAPSULE_2_BUILD_INVALID', 'Capsule 2 builder requires the Runtime manifest.');
  }
  for (const field of ['asset_id', 'asset_uid', 'version', 'judgment_version']) {
    if (typeof manifest[field] !== 'string' || manifest[field].length === 0) {
      fail('KDNA_CAPSULE_2_BUILD_INVALID', `Runtime manifest ${field} is required.`);
    }
  }
  if (!['packaged_file', 'packaged_bytes'].includes(inputKind)) {
    fail('KDNA_CAPSULE_2_BUILD_INVALID', 'Capsule 2 input_kind must identify packaged bytes.');
  }
  assertSuccessfulDigestEvidence(digests);

  const expectedDomain = manifest.name || manifest.asset_id;
  if (capsule1.domain !== expectedDomain) {
    fail(
      'KDNA_CAPSULE_2_BUILD_INVALID',
      'Capsule 1 domain does not match the Runtime manifest identity.',
      { capsule_1: capsule1.domain, manifest: expectedDomain },
    );
  }
  if (capsule1.judgment_version !== manifest.judgment_version) {
    fail(
      'KDNA_CAPSULE_2_BUILD_INVALID',
      'Capsule 1 judgment_version does not match the Runtime manifest.',
      { capsule_1: capsule1.judgment_version, manifest: manifest.judgment_version },
    );
  }
  const expectedAccess = manifest.access || 'public';
  if (capsule1.access !== expectedAccess) {
    fail(
      'KDNA_CAPSULE_2_BUILD_INVALID',
      'Capsule 1 access does not match the Runtime manifest.',
      { capsule_1: capsule1.access, manifest: expectedAccess },
    );
  }
  if (capsule1.asset_digest !== digests.runtime_entry_set.value) {
    fail(
      'KDNA_CAPSULE_2_BUILD_INVALID',
      'Capsule 1 asset_digest does not match Runtime entry-set digest E.',
      { capsule_1: capsule1.asset_digest, runtime_entry_set: digests.runtime_entry_set.value },
    );
  }

  const timestamp = loadedAt || capsule1.trace?.loaded_at;
  if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) {
    fail('KDNA_CAPSULE_2_BUILD_INVALID', 'Capsule 2 loaded_at must be an ISO date-time string.');
  }

  const capsule = {
    type: 'kdna.context.capsule',
    version: '2.0',
    asset: {
      asset_id: manifest.asset_id,
      asset_uid: manifest.asset_uid,
      version: manifest.version,
      judgment_version: manifest.judgment_version,
    },
    digests,
    signature: capsule1.signature,
    access: capsule2Access(capsule1.access),
    risk_level: capsule1.risk_level,
    profile: capsule1.profile,
    context: capsule1.context,
    trace: {
      payload_encoding: capsule1.trace?.payload_encoding || 'cbor',
      loaded_by: 'kdna-core',
      loaded_at: timestamp,
      input_kind: inputKind,
      runtime_eligible: true,
      schema_valid: capsule1.trace?.schema_valid === true,
      signature_state: capsule1.trace?.signature_state || capsule1.signature?.state,
      profile: capsule1.profile,
    },
  };

  // Capsule 2 identity is always manifest.asset_id. A distinct legacy name is
  // carried only so the one-way v2 -> v1 adapter can reproduce the frozen v1
  // `domain` value. It has no routing or identity authority in Capsule 2.
  const compatibility = {};
  if (capsule1.domain && capsule1.domain !== manifest.asset_id) {
    compatibility.capsule_1_domain = capsule1.domain;
  }
  if (CAPSULE_1_ACCESS_ALIASES.has(capsule1.access)) {
    compatibility.capsule_1_access = capsule1.access;
  }
  const capsule1Extensions = {};
  for (const key of CAPSULE_1_EXTENSION_KEYS) {
    if (Object.prototype.hasOwnProperty.call(capsule1, key)) {
      capsule1Extensions[key] = capsule1[key];
    }
  }
  if (Object.keys(capsule1Extensions).length > 0) {
    compatibility.capsule_1_extensions = capsule1Extensions;
  }
  if (Object.keys(compatibility).length > 0) {
    capsule.compatibility = compatibility;
  }

  assertCapsule2Success(capsule, 'KDNA_CAPSULE_2_BUILD_INVALID');
  return capsule;
}

function adaptCapsuleV2ToV1(capsule) {
  if (!capsule || capsule.type !== 'kdna.context.capsule' || capsule.version !== '2.0') {
    fail('KDNA_CAPSULE_ADAPTER_INPUT_INVALID', 'The adapter requires a Runtime Capsule 2 value.');
  }
  assertCapsule2Success(capsule);
  const domain = capsule.compatibility?.capsule_1_domain || capsule.asset?.asset_id;
  if (typeof domain !== 'string' || domain.length === 0) {
    fail('KDNA_CAPSULE_ADAPTER_INPUT_INVALID', 'Capsule 2 has no Capsule 1 domain mapping.');
  }
  const capsule1 = {
    type: 'kdna.context.capsule',
    version: '1.0',
    domain,
    judgment_version: capsule.asset.judgment_version,
    asset_digest: capsule.digests.runtime_entry_set.value,
    signature: capsule.signature,
    access: capsule.compatibility?.capsule_1_access || capsule.access,
    risk_level: capsule.risk_level,
    profile: capsule.profile,
    context: capsule.context,
    trace: {
      payload_encoding: capsule.trace.payload_encoding,
      loaded_by: capsule.trace.loaded_by,
      loaded_at: capsule.trace.loaded_at,
      schema_valid: capsule.trace.schema_valid,
      signature_state: capsule.trace.signature_state,
      profile: capsule.trace.profile,
    },
  };
  const capsule1Extensions = capsule.compatibility?.capsule_1_extensions;
  if (capsule1Extensions) {
    for (const key of CAPSULE_1_EXTENSION_KEYS) {
      if (Object.prototype.hasOwnProperty.call(capsule1Extensions, key)) {
        capsule1[key] = capsule1Extensions[key];
      }
    }
  }
  assertCapsule1Success(capsule1, 'KDNA_CAPSULE_ADAPTER_OUTPUT_INVALID');
  return capsule1;
}

function loadCapsuleV2(input, options = {}) {
  const { bytes, inputKind } = snapshotPackagedBytes(input);
  let validation;
  try {
    validation = v1.validate(bytes);
  } catch (error) {
    fail('KDNA_CAPSULE_2_ASSET_INVALID', error.message);
  }
  if (validation.overall_valid !== true) {
    fail(
      'KDNA_CAPSULE_2_ASSET_INVALID',
      `Cannot emit Capsule 2 from an invalid asset: ${validation.problems.join('; ')}`,
      validation,
    );
  }

  const digests = computeDigestEvidenceFromBytes(bytes, {
    expectedDigests: options.expectedDigests,
    expectedAssetDigest: options.expectedAssetDigest,
  });
  assertSuccessfulDigestEvidence(digests);
  const reader = createKdnaAssetReader();
  const asset = reader.openSync(bytes);
  const manifest = reader.readManifestSync(asset);
  const capsule1 = v1.loadAuthorized(bytes, {
    ...options,
    as: 'json',
  });
  return buildCapsuleV2({
    capsule1,
    manifest,
    digests,
    inputKind,
    loadedAt: options.loadedAt,
  });
}

module.exports = {
  BASIS,
  CAPSULE_DIGEST_PROFILE,
  DIGEST_PROFILE,
  adaptCapsuleV2ToV1,
  buildCapsuleV2,
  canonicalizeJcs,
  computeAssetDigest,
  computeCapsuleDeliveryDigest,
  computeDigestEvidence,
  computeRuntimeEntrySetDigest: v1.computeRuntimeEntrySetDigest,
  loadCapsuleV2,
};
