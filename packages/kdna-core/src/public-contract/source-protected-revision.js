'use strict';
const C = require('./section-common.js');
const S = require('./source-route-common.js');
const D = require('./digests.js');
const P = require('./protection-declaration.js');
const producer = require('./source-protection-producer.js');
const { validateDecodedPayload } = require('./semantic-admission.js');
const { buildIR } = require('./canonical-ir.js');
const encoder = new (require('cbor-x/index-no-eval').Encoder)({
  useRecords: false, mapsAsObjects: true, structuredClone: false, alwaysUseFloat: true
});
const frozen = value => C.strict.freeze(value);
const definitionDigest = D.digestCanonical(S.contract.module);
const routeContract = frozen({
  id: S.contract.module.versions.source_route, version: '0.1.0-candidate',
  definition_digest: definitionDigest
});
const protectedContract = frozen({
  id: S.contract.module.versions.protected_source_route, version: '0.1.0-candidate',
  definition_digest: definitionDigest
});

// Only the source-opening module supplies these functions over its private owner
// and context registry. JSON bundles and old/foreign Core contexts cannot enter.
function createRevision(runtime) {
  const { reserve, hostCurrent, operationCurrent, fail, isFailure } = runtime;

  function rejected(kind, code, stage) {
    const diagnostic = { code, stage };
    S.validate('SourceRouteDiagnostic06', diagnostic);
    const result = { status: kind + '_rejected', diagnostic, body: null, body_bytes: 0 };
    if (kind === 'preview') S.validate('ProtectedSectionSourcePreview06', result);
    return frozen(result);
  }

  function failure(kind, error, stage) {
    if (isFailure(error)) return rejected(kind, error.sourceDiagnostic.code, error.sourceDiagnostic.stage);
    if (P.isFailure(error)) {
      const code = error.code === 'PROTECTION_KDF_UNAVAILABLE'
        ? 'SOURCE_CAPABILITY_UNAVAILABLE'
        : ['PROTECTION_DECLARATION_INVALID', 'PROTECTION_DECLARATION_CONFLICT'].includes(error.code)
          ? 'SOURCE_POLICY_INVALID' : 'SOURCE_OUTPUT_INVALID';
      return rejected(kind, code, stage);
    }
    const known = new Set([
      'READ_INPUT_INVALID', 'READ_CORE_INVALID', 'READ_UNSUPPORTED_CRITICAL',
      'READ_STATIC_POLICY_INVALID',
      ...require('./generated-contract.json').types.CoreComponentFailure.properties.code.enum
    ]);
    if (C.isFailure(error) || known.has(error?.reason)) {
      const code = stage === 'input' ? 'SOURCE_INPUT_INVALID'
        : stage === 'semantic' ? 'SOURCE_DRAFT_INVALID' : 'SOURCE_OUTPUT_INVALID';
      return rejected(kind, code, stage);
    }
    if (error?.reason === 'READ_INTERPRETATION_INCOMPLETE') {
      return rejected(kind, 'SOURCE_INTERPRETATION_INCOMPLETE', 'semantic');
    }
    return rejected(kind, 'SOURCE_CAPABILITY_UNAVAILABLE', stage);
  }

  function inputs(editsInput, policyInput) {
    const edits = C.strict.copyJson(editsInput);
    if (!edits || typeof edits !== 'object' || Array.isArray(edits)
        || Object.keys(edits).some(key => !['manifest', 'payload'].includes(key))) {
      fail('SOURCE_INPUT_INVALID', 'input');
    }
    const policy = producer.validateOptions(policyInput, fail);
    if (!['password', 'external-grant'].includes(policy.kind)) fail('SOURCE_INPUT_INVALID', 'input');
    return { edits: frozen(edits), policy };
  }

  async function current(owner, purpose, stage, phase, active) {
    active(stage);
    await hostCurrent(owner, purpose, stage);
    active(stage);
    await operationCurrent(owner, phase, stage);
    active(stage);
  }

  function validateDraft(owner, edits) {
    // This is the original semantic path with the real06 Manifest validator and
    // controlled06 IR tuple. It never fabricates an admitted ciphertext snapshot.
    const manifest = Object.hasOwn(edits, 'manifest') ? edits.manifest : owner.source.manifest;
    const payload = Object.hasOwn(edits, 'payload') ? edits.payload : owner.source.payload;
    C.validate('ProtectedManifest06Candidate', manifest);
    const validated = validateDecodedPayload(manifest, payload);
    const ir = { ...buildIR(manifest, validated, owner.source.entries), tuple: structuredClone(C.contract.module.versionTuple) };
    C.validate('CanonicalIR06Candidate', ir);
    return { manifest, payload: validated };
  }

  async function previewProtectedSectionSourceRevision(context, editsInput, policyInput) {
    let stage = 'input';
    try {
      const lease = reserve(context, 'preview');
      const owner = lease.owner, active = lease.current;
      const { edits, policy } = inputs(editsInput, policyInput);
      stage = 'semantic';
      await current(owner, 'preview', stage, 'host_observation', active);
      validateDraft(owner, edits);
      active('return');
      await current(owner, 'preview', 'return', 'read_return', active);
      const result = {
        status: 'preview_valid', contract: protectedContract,
        source_A: owner.source.digests.A,
        original_payload_digest: owner.source.plaintextDigest,
        edits_digest: D.digestCanonical(edits), policy_digest: D.digestCanonical(policy),
        semantic_status: 'valid', proof: 'semantic_validation_not_ciphertext_admission',
        body: null, body_bytes: 0
      };
      S.validate('ProtectedSectionSourcePreview06', result);
      active('return');
      return frozen(result);
    } catch (error) {
      return failure('preview', error, stage);
    }
  }

  async function produceProtectedSectionSourceRevision(context, editsInput, policyInput, outputSecretProvider) {
    let stage = 'input', logical, produced;
    try {
      const lease = reserve(context, 'produce');
      const owner = lease.owner, active = lease.current;
      const { edits, policy } = inputs(editsInput, policyInput);
      if (typeof outputSecretProvider !== 'function') fail('SOURCE_INPUT_INVALID', 'input');
      stage = 'semantic';
      await current(owner, 'produce', stage, 'host_observation', active);
      const request = frozen({
        source_A: owner.source.digests.A, edits_digest: D.digestCanonical(edits),
        policy_digest: D.digestCanonical(policy), kind: policy.kind, signature: policy.signature
      });
      active(stage);
      let supplied;
      try { supplied = await outputSecretProvider(request); }
      catch { fail('SOURCE_PROVIDER_FAILED', stage); }
      // A result arriving after the owner/deadline ended is never inspected.
      active(stage);
      // Refresh both original authorities after the secret-provider await and
      // before inspecting its result or starting semantic/output work.
      await current(owner, 'produce', stage, 'host_observation', active);
      const draft = validateDraft(owner, edits);
      active(stage);
      logical = Object.hasOwn(edits, 'payload')
        ? Buffer.from(encoder.encode(draft.payload)) : Buffer.from(owner.source.plaintext);
      const source = {
        manifest: draft.manifest, payload: draft.payload,
        entries: owner.source.entries, metadata: owner.source.members
      };
      const plan = producer.prepare(source, policy, fail);
      active(stage);
      stage = 'output';
      produced = producer.produce(source, policy, plan, logical, supplied,
        owner.capture.identity.capture_id, owner.requestDigest, fail);
      active('return');
      stage = 'return';
      await current(owner, 'publish', stage, 'read_return', active);
      const evidence = {
        contract: routeContract, source_A: owner.source.digests.A,
        source_profile: 'protected_logical_payload06', output_profile: produced.outputProfile,
        output: produced.observed, E_profile: produced.Eprofile,
        payload_source: Object.hasOwn(edits, 'payload') ? 'explicit_edit' : 'original_decrypted_cbor',
        payload_digest: D.digest(logical), member_actions: produced.actions,
        proof: 'producer_observation_not_consumer_admission', output_delivery: 'not_published'
      };
      S.validate('SourceRouteProductionEvidence06', evidence);
      active(stage);
      return Object.freeze({ status: 'revision_produced', bytes: new Uint8Array(produced.bytes),
        evidence: frozen(evidence), body_bytes: produced.bytes.length });
    } catch (error) {
      return failure('revision', error, stage);
    } finally {
      logical?.fill(0);
      produced?.bytes.fill(0);
    }
  }

  return { previewProtectedSectionSourceRevision, produceProtectedSectionSourceRevision };
}

module.exports = { createRevision };
