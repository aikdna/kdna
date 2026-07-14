'use strict';

const crypto = require('node:crypto');

const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const { canonicalizeJcs, computeCapsuleDeliveryDigest } = require('./capsule-v2');
const digestEvidenceSchema = require('../schema/digest-evidence.schema.json');
const capsule2Schema = require('../schema/runtime-capsule-2.schema.json');
const planSchema = require('../schema/consumption-plan-1.schema.json');
const capabilitiesSchema = require('../schema/agent-host-capabilities-1.schema.json');
const requestSchema = require('../schema/agent-host-2-request.schema.json');
const receiptSchema = require('../schema/agent-host-2-receipt.schema.json');
const traceSchema = require('../schema/judgment-trace-1.schema.json');

const PLAN_DIGEST_PROFILE = 'kdna-consumption-plan-jcs-v1';
const CAPSULE_DELIVERY_PROFILE = 'kdna-capsule-jcs-v1';
const CAPSULE_DIGEST_PROFILE = 'kdna-capsule-digests-v1';
const HOST_PROTOCOL = 'kdna.agent-host/2';
const CAPSULE_VERSION = '2.0';
const DEFAULT_CORE_CAPSULE_VERSIONS = Object.freeze(['2.0', '1.0']);
const JSON_MAX_BYTES = 2 * 1024 * 1024;
const JSON_MAX_DEPTH = 64;

let validators;

class KDNAExecutionContractError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'KDNAExecutionContractError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

function schemaValidators() {
  if (validators) return validators;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const schema of [
    digestEvidenceSchema,
    capsule2Schema,
    planSchema,
    capabilitiesSchema,
    requestSchema,
    receiptSchema,
    traceSchema,
  ]) {
    ajv.addSchema(schema);
  }
  validators = {
    plan: ajv.getSchema(planSchema.$id),
    capabilities: ajv.getSchema(capabilitiesSchema.$id),
    request: ajv.getSchema(requestSchema.$id),
    receipt: ajv.getSchema(receiptSchema.$id),
    trace: ajv.getSchema(traceSchema.$id),
  };
  return validators;
}

function ok(value) {
  return { valid: true, code: null, errors: [], ...(value === undefined ? {} : { value }) };
}

function invalid(code, message, details) {
  return {
    valid: false,
    code,
    errors: [{ code, message, ...(details === undefined ? {} : { details }) }],
  };
}

function throwInvalid(result) {
  if (result.valid) return;
  const first = result.errors[0] || {};
  throw new KDNAExecutionContractError(
    result.code || 'KDNA_EXECUTION_CONTRACT_INVALID',
    first.message || 'KDNA execution contract is invalid.',
    first.details,
  );
}

function clone(value) {
  return globalThis.structuredClone(value);
}

function equalJson(left, right) {
  try {
    return canonicalizeJcs(left) === canonicalizeJcs(right);
  } catch {
    return false;
  }
}

function digestJcs(value) {
  return `sha256:${crypto
    .createHash('sha256')
    .update(Buffer.from(canonicalizeJcs(value), 'utf8'))
    .digest('hex')}`;
}

function jcsCharacterCount(value) {
  return [...canonicalizeJcs(value)].length;
}

function validateSchema(kind, value) {
  const validator = schemaValidators()[kind];
  try {
    canonicalizeJcs(value);
    if (validator(value)) return ok();
    const details = clone(validator.errors || []);
    if (
      kind === 'plan' &&
      details.some(
        (error) =>
          error.keyword === 'const' &&
          error.instancePath === '/projection_request/require_packaged_asset',
      )
    ) {
      return invalid(
        'KDNA_ASSET_FILE_REQUIRED',
        'ConsumptionPlan 1 requires a packaged .kdna Runtime asset.',
        details,
      );
    }
    if (
      kind === 'trace' &&
      value &&
      value.overall_status === 'execution_completed' &&
      value.budget?.comparison?.overall === 'exceeded'
    ) {
      return invalid(
        'KDNA_TRACE_BUDGET_LIMIT_VIOLATION',
        'A completed JudgmentTrace cannot cross an enforced budget limit.',
        details,
      );
    }
    return invalid('SCHEMA_INVALID', `${kind} does not match its packaged JSON Schema.`, details);
  } catch (error) {
    return invalid('KDNA_INPUT_INVALID', `${kind} is not a safe JSON value.`, {
      cause: error && typeof error.message === 'string' ? error.message : String(error),
    });
  }
}

function requireContext(context, keys) {
  if (context === null || typeof context !== 'object' || Array.isArray(context)) {
    return invalid('KDNA_VALIDATION_CONTEXT_INVALID', 'Validation context must be an object.');
  }
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(context, key)) {
      return invalid(
        'KDNA_VALIDATION_CONTEXT_INVALID',
        `Validation context must explicitly provide ${key}.`,
      );
    }
  }
  return ok();
}

/**
 * Parse an execution-contract JSON value without JSON.parse semantics.
 * Duplicate member names are rejected after JSON escape decoding, so
 * {"a": 1, "\\u0061": 2} is also rejected.
 */
function parseExecutionContractJsonV1(input, options = {}) {
  if (
    options === null ||
    typeof options !== 'object' ||
    Array.isArray(options) ||
    Object.getPrototypeOf(options) !== Object.prototype
  ) {
    throw new KDNAExecutionContractError(
      'KDNA_JSON_OPTIONS_INVALID',
      'Execution-contract JSON parser options must be a plain object.',
    );
  }
  const descriptors = Object.getOwnPropertyDescriptors(options);
  const optionKeys = Reflect.ownKeys(descriptors);
  if (
    optionKeys.some(
      (key) =>
        typeof key !== 'string' ||
        !['maxBytes', 'maxDepth'].includes(key) ||
        !Object.prototype.hasOwnProperty.call(descriptors[key], 'value'),
    )
  ) {
    throw new KDNAExecutionContractError(
      'KDNA_JSON_OPTIONS_INVALID',
      'Execution-contract JSON parser options contain an unknown or accessor property.',
    );
  }
  const maxBytes = options.maxBytes ?? JSON_MAX_BYTES;
  const maxDepth = options.maxDepth ?? JSON_MAX_DEPTH;
  if (
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 1 ||
    maxBytes > JSON_MAX_BYTES ||
    !Number.isSafeInteger(maxDepth) ||
    maxDepth < 1 ||
    maxDepth > JSON_MAX_DEPTH
  ) {
    throw new KDNAExecutionContractError(
      'KDNA_JSON_OPTIONS_INVALID',
      `maxBytes and maxDepth must be positive safe integers no greater than ${JSON_MAX_BYTES} and ${JSON_MAX_DEPTH}.`,
    );
  }
  let text;
  if (typeof input === 'string') {
    text = input;
  } else if (Buffer.isBuffer(input) || input instanceof Uint8Array) {
    if (input.byteLength > maxBytes) {
      throw new KDNAExecutionContractError(
        'KDNA_JSON_LIMIT_EXCEEDED',
        'Execution-contract JSON exceeds the configured byte limit.',
      );
    }
    if (input.byteLength >= 3 && input[0] === 0xef && input[1] === 0xbb && input[2] === 0xbf) {
      throw new KDNAExecutionContractError(
        'KDNA_JSON_BOM_FORBIDDEN',
        'Execution-contract JSON must not begin with a UTF-8 BOM.',
      );
    }
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(input);
    } catch {
      throw new KDNAExecutionContractError(
        'KDNA_JSON_INVALID_UNICODE',
        'Execution-contract JSON is not valid UTF-8.',
      );
    }
  } else {
    throw new KDNAExecutionContractError(
      'KDNA_JSON_INPUT_INVALID',
      'Execution-contract JSON input must be a string, Buffer, or Uint8Array.',
    );
  }

  if (text.charCodeAt(0) === 0xfeff) {
    throw new KDNAExecutionContractError(
      'KDNA_JSON_BOM_FORBIDDEN',
      'Execution-contract JSON must not begin with a BOM.',
    );
  }

  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    throw new KDNAExecutionContractError(
      'KDNA_JSON_LIMIT_EXCEEDED',
      'Execution-contract JSON exceeds the configured byte limit.',
    );
  }

  const parser = new StrictJsonParser(text, maxDepth);
  return parser.parse();
}

class StrictJsonParser {
  constructor(text, maxDepth) {
    this.text = text;
    this.maxDepth = maxDepth;
    this.index = 0;
  }

  parse() {
    this.skipWhitespace();
    const value = this.parseValue(0);
    this.skipWhitespace();
    if (this.index !== this.text.length) this.syntax('Unexpected trailing JSON content.');
    return value;
  }

  syntax(message) {
    throw new KDNAExecutionContractError('KDNA_JSON_SYNTAX_INVALID', message, {
      code_unit_offset: this.index,
    });
  }

  skipWhitespace() {
    while (
      this.index < this.text.length &&
      (this.text[this.index] === ' ' ||
        this.text[this.index] === '\n' ||
        this.text[this.index] === '\r' ||
        this.text[this.index] === '\t')
    ) {
      this.index += 1;
    }
  }

  parseValue(depth) {
    this.skipWhitespace();
    const char = this.text[this.index];
    if (char === '{' || char === '[') {
      if (depth >= this.maxDepth) {
        throw new KDNAExecutionContractError(
          'KDNA_JSON_LIMIT_EXCEEDED',
          'Execution-contract JSON exceeds the configured nesting limit.',
        );
      }
      return char === '{' ? this.parseObject(depth + 1) : this.parseArray(depth + 1);
    }
    if (char === '"') return this.parseString();
    if (char === '-' || (char >= '0' && char <= '9')) return this.parseNumber();
    if (this.text.startsWith('true', this.index)) {
      this.index += 4;
      return true;
    }
    if (this.text.startsWith('false', this.index)) {
      this.index += 5;
      return false;
    }
    if (this.text.startsWith('null', this.index)) {
      this.index += 4;
      return null;
    }
    this.syntax('Expected a JSON value.');
  }

  parseObject(depth) {
    const output = {};
    const keys = new Set();
    this.index += 1;
    this.skipWhitespace();
    if (this.text[this.index] === '}') {
      this.index += 1;
      return output;
    }
    while (this.index < this.text.length) {
      if (this.text[this.index] !== '"') this.syntax('Expected a quoted JSON member name.');
      const key = this.parseString();
      if (keys.has(key)) {
        throw new KDNAExecutionContractError(
          'KDNA_JSON_DUPLICATE_KEY',
          `Execution-contract JSON contains duplicate member name ${JSON.stringify(key)}.`,
          { key, code_unit_offset: this.index },
        );
      }
      keys.add(key);
      this.skipWhitespace();
      if (this.text[this.index] !== ':') this.syntax('Expected a colon after a JSON member name.');
      this.index += 1;
      Object.defineProperty(output, key, {
        value: this.parseValue(depth),
        enumerable: true,
        writable: true,
        configurable: true,
      });
      this.skipWhitespace();
      const next = this.text[this.index];
      if (next === '}') {
        this.index += 1;
        return output;
      }
      if (next !== ',') this.syntax('Expected a comma or closing brace.');
      this.index += 1;
      this.skipWhitespace();
    }
    this.syntax('Unterminated JSON object.');
  }

  parseArray(depth) {
    const output = [];
    this.index += 1;
    this.skipWhitespace();
    if (this.text[this.index] === ']') {
      this.index += 1;
      return output;
    }
    while (this.index < this.text.length) {
      output.push(this.parseValue(depth));
      this.skipWhitespace();
      const next = this.text[this.index];
      if (next === ']') {
        this.index += 1;
        return output;
      }
      if (next !== ',') this.syntax('Expected a comma or closing bracket.');
      this.index += 1;
      this.skipWhitespace();
    }
    this.syntax('Unterminated JSON array.');
  }

  parseString() {
    this.index += 1;
    let output = '';
    while (this.index < this.text.length) {
      const char = this.text[this.index];
      if (char === '"') {
        this.index += 1;
        return output;
      }
      if (char === '\\') {
        this.index += 1;
        output += this.parseEscape();
        continue;
      }
      const code = this.text.charCodeAt(this.index);
      if (code <= 0x1f) this.syntax('Unescaped control character in JSON string.');
      if (code >= 0xd800 && code <= 0xdbff) {
        const low = this.text.charCodeAt(this.index + 1);
        if (low < 0xdc00 || low > 0xdfff) this.invalidUnicode();
        output += this.text.slice(this.index, this.index + 2);
        this.index += 2;
        continue;
      }
      if (code >= 0xdc00 && code <= 0xdfff) this.invalidUnicode();
      output += char;
      this.index += 1;
    }
    this.syntax('Unterminated JSON string.');
  }

  parseEscape() {
    const char = this.text[this.index];
    const simple = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
    if (Object.prototype.hasOwnProperty.call(simple, char)) {
      this.index += 1;
      return simple[char];
    }
    if (char !== 'u') this.syntax('Invalid JSON string escape.');
    this.index += 1;
    const first = this.parseHexCodeUnit();
    if (first >= 0xd800 && first <= 0xdbff) {
      if (this.text.slice(this.index, this.index + 2) !== '\\u') this.invalidUnicode();
      this.index += 2;
      const second = this.parseHexCodeUnit();
      if (second < 0xdc00 || second > 0xdfff) this.invalidUnicode();
      return String.fromCodePoint(0x10000 + ((first - 0xd800) << 10) + (second - 0xdc00));
    }
    if (first >= 0xdc00 && first <= 0xdfff) this.invalidUnicode();
    return String.fromCharCode(first);
  }

  parseHexCodeUnit() {
    const hex = this.text.slice(this.index, this.index + 4);
    if (!/^[0-9a-fA-F]{4}$/.test(hex)) this.syntax('Invalid Unicode escape in JSON string.');
    this.index += 4;
    return Number.parseInt(hex, 16);
  }

  invalidUnicode() {
    throw new KDNAExecutionContractError(
      'KDNA_JSON_INVALID_UNICODE',
      'Execution-contract JSON contains an unpaired UTF-16 surrogate.',
      { code_unit_offset: this.index },
    );
  }

  parseNumber() {
    const source = this.text.slice(this.index);
    const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(source);
    if (!match) this.syntax('Invalid JSON number.');
    const token = match[0];
    this.index += token.length;
    const number = Number(token);
    if (!Number.isFinite(number)) {
      throw new KDNAExecutionContractError(
        'KDNA_JSON_NUMBER_INVALID',
        'Execution-contract JSON number is outside the finite IEEE-754 range.',
      );
    }
    return number;
  }
}

function computeConsumptionPlanDigestV1(plan) {
  try {
    if (plan === null || typeof plan !== 'object' || Array.isArray(plan)) {
      throw new TypeError('plan must be an object');
    }
    const projection = clone(plan);
    delete projection.integrity;
    return digestJcs(projection);
  } catch (error) {
    if (error instanceof KDNAExecutionContractError) throw error;
    throw new KDNAExecutionContractError(
      'KDNA_PLAN_INPUT_INVALID',
      'ConsumptionPlan digest input must be a finite, acyclic JSON object.',
      { cause: error && typeof error.message === 'string' ? error.message : String(error) },
    );
  }
}

function validatePlanSemantics(plan, trustedPlanDigest) {
  let computed;
  try {
    computed = computeConsumptionPlanDigestV1(plan);
  } catch {
    return 'KDNA_PLAN_INPUT_INVALID';
  }
  if (computed !== plan.integrity.plan_digest) return 'KDNA_PLAN_DIGEST_MISMATCH';
  if (trustedPlanDigest !== null && computed !== trustedPlanDigest) {
    return 'KDNA_TRUSTED_PLAN_DIGEST_MISMATCH';
  }
  return null;
}

function validateConsumptionPlanV1(plan, context) {
  const contextResult = requireContext(context, ['trustedPlanDigest']);
  if (!contextResult.valid) return contextResult;
  const schemaResult = validateSchema('plan', plan);
  if (!schemaResult.valid) return schemaResult;
  if (
    context.trustedPlanDigest !== null &&
    (typeof context.trustedPlanDigest !== 'string' ||
      !/^sha256:[0-9a-f]{64}$/.test(context.trustedPlanDigest))
  ) {
    return invalid(
      'KDNA_VALIDATION_CONTEXT_INVALID',
      'trustedPlanDigest must be null or a lowercase sha256 digest.',
    );
  }
  const code = validatePlanSemantics(plan, context.trustedPlanDigest);
  return code ? invalid(code, 'ConsumptionPlan integrity correlation failed.') : ok();
}

function buildConsumptionPlanV1(input) {
  let plan;
  try {
    plan = {
      type: 'kdna.consumption.plan',
      plan_version: '1.0.0',
      plan_id: input.plan_id,
      created_at: input.created_at,
      mode: 'single',
      task: clone(input.task),
      asset_ref: clone(input.asset_ref),
      projection_request: {
        profile: input.projection_profile,
        accepted_capsule_versions: [CAPSULE_VERSION],
        required_digest_profile: CAPSULE_DIGEST_PROFILE,
        require_packaged_asset: true,
      },
      host_request: { accepted_protocols: [HOST_PROTOCOL] },
      result_request: { shape: 'structured_judgment' },
      budget: clone(input.budget),
      trace_policy: clone(input.trace_policy),
      integrity: { profile: PLAN_DIGEST_PROFILE, plan_digest: '' },
      constraints: clone(input.constraints),
    };
    plan.integrity.plan_digest = computeConsumptionPlanDigestV1(plan);
  } catch (error) {
    if (error instanceof KDNAExecutionContractError) throw error;
    throw new KDNAExecutionContractError(
      'KDNA_PLAN_INPUT_INVALID',
      'Cannot build ConsumptionPlan 1 from the supplied input.',
    );
  }
  const result = validateConsumptionPlanV1(plan, {
    trustedPlanDigest: plan.integrity.plan_digest,
  });
  throwInvalid(result);
  return plan;
}

function blocked(issueCode) {
  return {
    state: 'blocked',
    capsule_version: null,
    host_protocol: null,
    issue_code: issueCode,
  };
}

function negotiateExecutionPairV1(plan, context) {
  const contextResult = requireContext(context, [
    'trustedPlanDigest',
    'capabilities',
    'coreCapsuleVersions',
  ]);
  if (!contextResult.valid) return blocked(contextResult.code);
  const planResult = validateConsumptionPlanV1(plan, {
    trustedPlanDigest: context.trustedPlanDigest,
  });
  if (!planResult.valid) return blocked(planResult.code);
  const capabilitiesResult = validateSchema('capabilities', context.capabilities);
  if (!capabilitiesResult.valid) return blocked(capabilitiesResult.code);
  if (
    !Array.isArray(context.coreCapsuleVersions) ||
    context.coreCapsuleVersions.some((value) => typeof value !== 'string')
  ) {
    return blocked('KDNA_VALIDATION_CONTEXT_INVALID');
  }

  const hasCapsule =
    plan.projection_request.accepted_capsule_versions.includes(CAPSULE_VERSION) &&
    context.coreCapsuleVersions.includes(CAPSULE_VERSION) &&
    context.capabilities.capsule_versions.includes(CAPSULE_VERSION);
  if (!hasCapsule) return blocked('KDNA_CAPSULE_VERSION_UNSUPPORTED');

  const hasProtocol =
    plan.host_request.accepted_protocols.includes(HOST_PROTOCOL) &&
    context.capabilities.host_protocols.includes(HOST_PROTOCOL);
  if (!hasProtocol) return blocked('KDNA_HOST_PROTOCOL_UNSUPPORTED');

  const hasVerifiablePair =
    context.capabilities.capability_basis === 'registered_descriptor' &&
    context.capabilities.capsule_digest_profiles.includes(CAPSULE_DELIVERY_PROFILE);
  if (!hasVerifiablePair) return blocked('KDNA_HOST_CAPSULE_PAIR_UNSUPPORTED');

  return {
    state: 'selected',
    capsule_version: CAPSULE_VERSION,
    host_protocol: HOST_PROTOCOL,
    issue_code: null,
  };
}

function expectedAgainst(source) {
  if (source === 'kdna.json.content_digest') return 'manifest_declaration';
  if (source === 'checksums.json.entry_set_digest' || source === 'checksums.json.asset_digest') {
    return 'checksum_declaration';
  }
  return 'external_expected';
}

function validateExpectedDigests(expectedDigests, capsuleDigests) {
  for (const name of ['asset', 'content', 'runtime_entry_set']) {
    const expected = expectedDigests[name];
    if (expected === null) continue;
    const observed = capsuleDigests[name];
    if (observed.value !== expected.value || observed.basis !== expected.basis) {
      return 'KDNA_HOST_DIGEST_EXPECTATION_MISMATCH';
    }
    if (observed.comparison.state !== expected.comparison) {
      return 'KDNA_HOST_DIGEST_EXPECTATION_MISMATCH';
    }
    if (expected.comparison === 'matched') {
      if (
        observed.comparison.expected !== expected.value ||
        observed.comparison.source !== expected.source ||
        observed.comparison.against !== expectedAgainst(expected.source)
      ) {
        return 'KDNA_HOST_DIGEST_EXPECTATION_MISMATCH';
      }
    } else if (
      observed.comparison.expected !== null ||
      observed.comparison.source !== null ||
      observed.comparison.against !== null
    ) {
      return 'KDNA_HOST_DIGEST_EXPECTATION_MISMATCH';
    }
  }
  return null;
}

function validateRequestSemantics(request, plan, enforceBudget = true) {
  if (
    request.plan_ref.plan_id !== plan.plan_id ||
    request.plan_ref.plan_digest_profile !== plan.integrity.profile ||
    request.plan_ref.plan_digest !== plan.integrity.plan_digest ||
    computeConsumptionPlanDigestV1(plan) !== plan.integrity.plan_digest
  ) {
    return 'KDNA_HOST_PLAN_REF_MISMATCH';
  }
  if (!equalJson(request.task, plan.task)) return 'KDNA_HOST_TASK_MISMATCH';
  if (request.authority.asset_id !== plan.asset_ref.asset_id) {
    return 'KDNA_HOST_ASSET_ID_MISMATCH';
  }

  const expectedRequestAsset = { ...plan.asset_ref, role: 'primary' };
  if (!equalJson(request.asset, expectedRequestAsset)) return 'KDNA_HOST_ASSET_REF_MISMATCH';

  const capsuleAsset = request.capsule.asset;
  for (const field of ['asset_id', 'asset_uid', 'version', 'judgment_version']) {
    if (capsuleAsset[field] !== plan.asset_ref[field]) return 'KDNA_HOST_ASSET_REF_MISMATCH';
  }
  if (request.capsule.access !== plan.asset_ref.access) return 'KDNA_HOST_ASSET_REF_MISMATCH';

  if (
    request.runtime_contract.capsule_version !== request.capsule.version ||
    request.capsule.version !== CAPSULE_VERSION
  ) {
    return 'KDNA_HOST_CAPSULE_VERSION_MISMATCH';
  }
  if (
    request.runtime_contract.capsule_digest_profile !== CAPSULE_DELIVERY_PROFILE ||
    request.capsule.digests.profile !== plan.projection_request.required_digest_profile
  ) {
    return 'KDNA_HOST_PROJECTION_CONTRACT_MISMATCH';
  }

  const expectedProjectionContract = {
    profile: plan.projection_request.profile,
    required_digest_profile: plan.projection_request.required_digest_profile,
    require_packaged_asset: plan.projection_request.require_packaged_asset,
  };
  if (
    !equalJson(request.projection_contract, expectedProjectionContract) ||
    request.capsule.profile !== request.projection_contract.profile
  ) {
    return 'KDNA_HOST_PROJECTION_CONTRACT_MISMATCH';
  }
  if (!equalJson(request.result_contract, plan.result_request)) {
    return 'KDNA_HOST_RESULT_CONTRACT_MISMATCH';
  }
  if (!equalJson(request.budget, plan.budget)) return 'KDNA_HOST_BUDGET_MISMATCH';
  if (!equalJson(request.constraints, plan.constraints)) return 'KDNA_HOST_CONSTRAINTS_MISMATCH';
  if (
    enforceBudget &&
    (jcsCharacterCount(request.capsule) > request.budget.max_projection_chars ||
      jcsCharacterCount(request.task) > request.budget.max_task_chars)
  ) {
    return 'KDNA_HOST_BUDGET_LIMIT_EXCEEDED';
  }

  const digestError = validateExpectedDigests(
    plan.asset_ref.expected_digests,
    request.capsule.digests,
  );
  if (digestError) return digestError;

  if (
    computeCapsuleDeliveryDigest(request.capsule) !==
    request.runtime_contract.capsule_delivery_digest
  ) {
    return 'KDNA_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }
  return null;
}

function validateAgentHost2RequestV1(request, context, options = {}) {
  const contextResult = requireContext(context, [
    'plan',
    'trustedPlanDigest',
    'capabilities',
    'coreCapsuleVersions',
  ]);
  if (!contextResult.valid) return contextResult;
  const schemaResult = validateSchema('request', request);
  if (!schemaResult.valid) return schemaResult;
  const planResult = validateConsumptionPlanV1(context.plan, {
    trustedPlanDigest: context.trustedPlanDigest,
  });
  if (!planResult.valid) return planResult;
  const negotiation = negotiateExecutionPairV1(context.plan, context);
  if (negotiation.state !== 'selected') {
    return invalid(negotiation.issue_code, 'No strict ConsumptionPlan 1 / Host 2 pair was selected.');
  }
  try {
    const code = validateRequestSemantics(request, context.plan, options.enforceBudget !== false);
    return code ? invalid(code, 'Agent Host 2 request correlation failed.') : ok();
  } catch (error) {
    return invalid('KDNA_INPUT_INVALID', 'Agent Host 2 request is not a safe JSON value.', {
      cause: error && typeof error.message === 'string' ? error.message : String(error),
    });
  }
}

function buildAgentHost2RequestV1(input, context) {
  const contextResult = requireContext(context, [
    'plan',
    'trustedPlanDigest',
    'capabilities',
    'coreCapsuleVersions',
  ]);
  throwInvalid(contextResult);
  const negotiation = negotiateExecutionPairV1(context.plan, context);
  if (negotiation.state !== 'selected') {
    throw new KDNAExecutionContractError(
      negotiation.issue_code,
      'Cannot build Host 2 request without a selected strict execution pair.',
    );
  }
  let request;
  try {
    const plan = context.plan;
    request = {
      protocol: HOST_PROTOCOL,
      request_id: input.request_id,
      plan_ref: {
        plan_id: plan.plan_id,
        plan_digest_profile: plan.integrity.profile,
        plan_digest: plan.integrity.plan_digest,
      },
      runtime_contract: {
        capsule_version: CAPSULE_VERSION,
        capsule_digest_profile: CAPSULE_DELIVERY_PROFILE,
        capsule_delivery_digest: computeCapsuleDeliveryDigest(input.capsule),
      },
      projection_contract: {
        profile: plan.projection_request.profile,
        required_digest_profile: plan.projection_request.required_digest_profile,
        require_packaged_asset: plan.projection_request.require_packaged_asset,
      },
      result_contract: clone(plan.result_request),
      budget: clone(plan.budget),
      constraints: clone(plan.constraints),
      phase: 'single_judgment',
      task: clone(plan.task),
      authority: { asset_id: plan.asset_ref.asset_id, role: 'primary', final_decision: true },
      asset: { ...clone(plan.asset_ref), role: 'primary' },
      capsule: clone(input.capsule),
    };
  } catch {
    throw new KDNAExecutionContractError(
      'KDNA_HOST_REQUEST_INPUT_INVALID',
      'Cannot build Agent Host 2 request from the supplied input.',
    );
  }
  const result = validateAgentHost2RequestV1(request, context);
  throwInvalid(result);
  return request;
}

function validateReceiptSemantics(receipt, request) {
  if (receipt.protocol !== request.protocol || receipt.request_id !== request.request_id) {
    return 'KDNA_HOST_REQUEST_ID_MISMATCH';
  }
  const runtimeReceipt = receipt.runtime_receipt;
  const senderP = request.runtime_contract.capsule_delivery_digest;
  const recomputedP = computeCapsuleDeliveryDigest(request.capsule);
  if (
    runtimeReceipt.sender_capsule_delivery_digest !== senderP ||
    runtimeReceipt.echoed_capsule_delivery_digest !==
      runtimeReceipt.host_recomputed_capsule_delivery_digest
  ) {
    return 'KDNA_HOST_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }

  if (runtimeReceipt.capsule_delivery_comparison === 'mismatched') {
    if (
      runtimeReceipt.host_recomputed_capsule_delivery_digest === senderP ||
      runtimeReceipt.provider_execution_status !== 'not_started' ||
      receipt.outcome !== null
    ) {
      return 'KDNA_HOST_CAPSULE_DELIVERY_DIGEST_MISMATCH';
    }
  } else if (
    runtimeReceipt.capsule_delivery_comparison !== 'matched' ||
    runtimeReceipt.provider_execution_status === 'not_started' ||
    runtimeReceipt.host_recomputed_capsule_delivery_digest !== recomputedP
  ) {
    return 'KDNA_HOST_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }
  if (
    runtimeReceipt.capsule_version !== request.runtime_contract.capsule_version ||
    runtimeReceipt.capsule_digest_profile !== request.runtime_contract.capsule_digest_profile
  ) {
    return 'KDNA_HOST_CAPSULE_VERSION_MISMATCH';
  }

  const outcomeUsage = receipt.outcome?.usage ?? null;
  const observed = runtimeReceipt.usage;
  if (receipt.outcome === null) return null;
  if (outcomeUsage === null) {
    if (
      observed.basis !== 'not_observed' ||
      observed.tokens_used !== null ||
      observed.model_calls !== null
    ) {
      return 'KDNA_HOST_USAGE_MISMATCH';
    }
  } else if (
    observed.basis !== 'host_reported' ||
    observed.tokens_used !== outcomeUsage.tokens_used ||
    observed.model_calls !== outcomeUsage.model_calls
  ) {
    return 'KDNA_HOST_USAGE_MISMATCH';
  }
  return null;
}

function validateAgentHost2ReceiptV1(receipt, context) {
  const contextResult = requireContext(context, ['request']);
  if (!contextResult.valid) return contextResult;
  const schemaResult = validateSchema('receipt', receipt);
  if (!schemaResult.valid) return schemaResult;
  const requestSchemaResult = validateSchema('request', context.request);
  if (!requestSchemaResult.valid) {
    return invalid(
      'KDNA_VALIDATION_CONTEXT_INVALID',
      'Receipt validation requires a schema-valid independent Host 2 request.',
      requestSchemaResult.errors,
    );
  }
  try {
    const code = validateReceiptSemantics(receipt, context.request);
    return code ? invalid(code, 'Agent Host 2 receipt correlation failed.') : ok();
  } catch (error) {
    return invalid('KDNA_INPUT_INVALID', 'Agent Host 2 receipt is not a safe JSON value.', {
      cause: error && typeof error.message === 'string' ? error.message : String(error),
    });
  }
}

function compareObserved(value, limit, unobserved = 'not_observed') {
  if (limit === null) return 'not_limited';
  if (value === null) return unobserved;
  return value <= limit ? 'within_limit' : 'exceeded';
}

function expectedBudgetEvidence(plan, request, receipt) {
  const projectionChars = request === null ? null : jcsCharacterCount(request.capsule);
  const taskChars = jcsCharacterCount(plan.task);
  const usage = receipt?.runtime_receipt.usage ?? {
    elapsed_ms: null,
    elapsed_basis: 'not_observed',
    tokens_used: null,
    model_calls: null,
    basis: 'not_observed',
  };
  const actual = {
    projection_chars: projectionChars,
    task_chars: taskChars,
    elapsed_ms: usage.elapsed_ms,
    elapsed_basis: usage.elapsed_basis,
    tokens_used: usage.tokens_used,
    model_calls: usage.model_calls,
    usage_basis: usage.basis,
  };
  const comparison = {
    projection_chars: compareObserved(projectionChars, plan.budget.max_projection_chars),
    task_chars: compareObserved(taskChars, plan.budget.max_task_chars),
    elapsed_ms: compareObserved(actual.elapsed_ms, plan.budget.deadline_ms),
    tokens_used: compareObserved(usage.tokens_used, plan.budget.max_tokens),
    model_calls: compareObserved(usage.model_calls, plan.budget.max_model_calls),
  };
  const dimensionStates = Object.values(comparison);
  comparison.overall = dimensionStates.includes('exceeded')
    ? 'exceeded'
    : dimensionStates.includes('not_observed')
      ? 'not_observed'
      : 'within_limit';
  return { limits: clone(plan.budget), actual, comparison };
}

function deriveBudgetEvidenceV1(plan, context) {
  const contextResult = requireContext(context, ['trustedPlanDigest', 'request', 'receipt']);
  throwInvalid(contextResult);
  const planResult = validateConsumptionPlanV1(plan, {
    trustedPlanDigest: context.trustedPlanDigest,
  });
  throwInvalid(planResult);
  if (context.request !== null) {
    const requestResult = validateSchema('request', context.request);
    if (!requestResult.valid) {
      throw new KDNAExecutionContractError(
        'KDNA_VALIDATION_CONTEXT_INVALID',
        'Budget derivation requires a schema-valid independent Host 2 request.',
        requestResult.errors,
      );
    }
    const requestCode = validateRequestSemantics(context.request, plan, false);
    if (requestCode !== null) {
      throw new KDNAExecutionContractError(
        requestCode,
        'Budget derivation requires an independently correlated Host 2 request.',
      );
    }
  }
  if (context.receipt !== null) {
    if (context.request === null) {
      throw new KDNAExecutionContractError(
        'KDNA_VALIDATION_CONTEXT_INVALID',
        'Budget derivation cannot use a receipt without its independent request.',
      );
    }
    const receiptResult = validateAgentHost2ReceiptV1(context.receipt, {
      request: context.request,
    });
    throwInvalid(receiptResult);
  }
  return expectedBudgetEvidence(plan, context.request, context.receipt);
}

function withoutExpectedDigests(asset) {
  const value = clone(asset);
  delete value.expected_digests;
  delete value.role;
  return value;
}

function unavailableDigestEvidence() {
  const item = (basis) => ({
    value: null,
    basis,
    comparison: { state: 'unavailable', against: null, expected: null, source: null },
  });
  return {
    profile: CAPSULE_DIGEST_PROFILE,
    asset: item('kdna-container-bytes-v1'),
    content: item('kdna-content-tree-v1'),
    runtime_entry_set: item('kdna-runtime-entry-set-v1'),
  };
}

function validateTerminalState(trace, receipt) {
  const table = {
    execution_completed: ['completed', 'completed', true, 0],
    execution_failed: ['failed', 'failed', false, 1],
    cancelled: ['cancelled', 'cancelled', false, 1],
    timed_out: ['timed_out', 'timed_out', false, 1],
  };

  if (trace.overall_status === 'blocked') {
    if (
      trace.result_ref !== null ||
      trace.execution.execution_status !== 'not_started' ||
      trace.errors.length < 1
    ) {
      return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';
    }
    return null;
  }

  const expected = table[trace.overall_status];
  if (!expected || receipt === null) return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';
  const [providerStatus, executionStatus, hasResult, minimumErrors] = expected;
  if (
    receipt.runtime_receipt.provider_execution_status !== providerStatus ||
    trace.execution.execution_status !== executionStatus ||
    trace.execution.delivery_status !== 'correlated_response' ||
    (trace.result_ref !== null) !== hasResult ||
    trace.errors.length < minimumErrors
  ) {
    return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';
  }
  if (trace.overall_status === 'execution_completed' && trace.errors.length !== 0) {
    return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';
  }
  return null;
}

function validateTraceSemantics(trace, plan, request, receipt, capabilities, coreCapsuleVersions) {
  if (
    trace.plan_ref.plan_id !== plan.plan_id ||
    trace.plan_ref.plan_digest_profile !== plan.integrity.profile ||
    trace.plan_ref.plan_digest !== plan.integrity.plan_digest ||
    trace.plan_ref.plan_digest !== computeConsumptionPlanDigestV1(plan)
  ) {
    return 'KDNA_TRACE_PLAN_REF_MISMATCH';
  }
  const runtime = trace.runtime_contract;
  if (
    !equalJson(runtime.plan_capsule_versions, plan.projection_request.accepted_capsule_versions) ||
    !equalJson(runtime.plan_host_protocols, plan.host_request.accepted_protocols) ||
    !equalJson(runtime.core_capsule_versions, coreCapsuleVersions) ||
    !equalJson(runtime.host_capabilities, capabilities)
  ) {
    return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
  }

  if (!equalJson(trace.asset_identity, withoutExpectedDigests(plan.asset_ref))) {
    return 'KDNA_TRACE_ASSET_IDENTITY_MISMATCH';
  }
  if (!equalJson(trace.budget.limits, plan.budget)) return 'KDNA_TRACE_BUDGET_MISMATCH';

  if (trace.overall_status === 'blocked') {
    if (!equalJson(trace.host_receipt, receipt)) return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';
    if (request !== null) {
      if (validateRequestSemantics(request, plan, false) !== null) {
        return 'KDNA_TRACE_REQUEST_MISMATCH';
      }
      const negotiation = negotiateExecutionPairV1(plan, {
        trustedPlanDigest: plan.integrity.plan_digest,
        capabilities,
        coreCapsuleVersions,
      });
      if (
        negotiation.state !== 'selected' ||
        runtime.negotiation_state !== 'selected' ||
        runtime.selected_capsule_version !== negotiation.capsule_version ||
        runtime.selected_host_protocol !== negotiation.host_protocol ||
        runtime.issue_code !== null
      ) {
        return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
      }
      if (
        !equalJson(trace.asset_identity, withoutExpectedDigests(request.asset)) ||
        !equalJson(trace.digest_evidence, request.capsule.digests)
      ) {
        return 'KDNA_TRACE_DIGEST_EVIDENCE_MISMATCH';
      }
      const p = request.runtime_contract.capsule_delivery_digest;
      const delivery = trace.capsule_delivery_evidence;
      const projectionMismatch =
        trace.projection_actual.profile !== request.projection_contract.profile ||
        trace.projection_actual.capsule_delivery_digest !== p ||
        trace.projection_actual.profile_deviated_from_plan !== false;
      if (delivery.observed !== p || delivery.sender_computed !== true || projectionMismatch) {
        return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
      }

      if (delivery.host_boundary_comparison === 'mismatched') {
        if (
          receipt === null ||
          validateReceiptSemantics(receipt, request) !== null ||
          receipt.runtime_receipt.capsule_delivery_comparison !== 'mismatched' ||
          delivery.host_recomputed !==
            receipt.runtime_receipt.host_recomputed_capsule_delivery_digest ||
          delivery.host_echoed !== receipt.runtime_receipt.echoed_capsule_delivery_digest ||
          delivery.host_recomputed === p ||
          delivery.delivered_capsule_version !== CAPSULE_VERSION ||
          delivery.request_id !== request.request_id ||
          trace.execution.delivery_status !== 'rejected_before_execution'
        ) {
          return 'KDNA_TRACE_CAPSULE_DELIVERY_DIGEST_MISMATCH';
        }
      } else if (delivery.host_boundary_comparison === 'not_observed') {
        if (
          receipt !== null ||
          delivery.host_recomputed !== null ||
          delivery.host_echoed !== null ||
          delivery.delivered_capsule_version !== CAPSULE_VERSION ||
          delivery.request_id !== request.request_id ||
          trace.execution.delivery_status !== 'rejected_before_execution'
        ) {
          return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
        }
      } else if (
        receipt !== null ||
        delivery.host_recomputed !== null ||
        delivery.host_echoed !== null ||
        delivery.delivered_capsule_version !== null ||
        delivery.host_boundary_comparison !== 'not_delivered' ||
        delivery.request_id !== null ||
        trace.execution.delivery_status !== 'not_delivered'
      ) {
        return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
      }

      const expectedBudget = expectedBudgetEvidence(plan, request, receipt);
      if (!equalJson(trace.budget, expectedBudget)) return 'KDNA_TRACE_BUDGET_MISMATCH';
      return validateTerminalState(trace, null);
    }

    if (
      runtime.selected_capsule_version !== null ||
      runtime.selected_host_protocol !== null ||
      !['not_started', 'blocked'].includes(runtime.negotiation_state) ||
      trace.capsule_delivery_evidence.host_recomputed !== null ||
      trace.capsule_delivery_evidence.host_echoed !== null ||
      trace.capsule_delivery_evidence.host_boundary_comparison !== 'unavailable' ||
      trace.projection_actual.profile !== null ||
      trace.projection_actual.capsule_delivery_digest !== null ||
      trace.projection_actual.profile_deviated_from_plan !== null
    ) {
      return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
    }
    for (const name of ['asset', 'content', 'runtime_entry_set']) {
      if (
        trace.digest_evidence[name].value !== null ||
        trace.digest_evidence[name].comparison.state !== 'unavailable'
      ) {
        return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
      }
    }
    if (runtime.negotiation_state === 'not_started' && runtime.issue_code !== null) {
      return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
    }
    if (runtime.negotiation_state === 'blocked') {
      const negotiation = negotiateExecutionPairV1(plan, {
        trustedPlanDigest: plan.integrity.plan_digest,
        capabilities,
        coreCapsuleVersions,
      });
      if (negotiation.state !== 'blocked' || runtime.issue_code !== negotiation.issue_code) {
        return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
      }
    }
    if (receipt !== null || trace.execution.delivery_status !== 'not_delivered') {
      return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
    }
    const expectedBudget = expectedBudgetEvidence(plan, null, null);
    if (!equalJson(trace.budget, expectedBudget)) return 'KDNA_TRACE_BUDGET_MISMATCH';
    return validateTerminalState(trace, null);
  }

  if (request === null || receipt === null) return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';

  const requestError = validateRequestSemantics(request, plan);
  if (requestError === 'KDNA_HOST_BUDGET_LIMIT_EXCEEDED') {
    return 'KDNA_TRACE_BUDGET_LIMIT_VIOLATION';
  }
  if (requestError !== null) return 'KDNA_TRACE_REQUEST_MISMATCH';
  if (validateReceiptSemantics(receipt, request) !== null) {
    return 'KDNA_TRACE_HOST_RECEIPT_MISMATCH';
  }

  const negotiation = negotiateExecutionPairV1(plan, {
    trustedPlanDigest: plan.integrity.plan_digest,
    capabilities,
    coreCapsuleVersions,
  });
  if (
    negotiation.state !== 'selected' ||
    runtime.negotiation_state !== negotiation.state ||
    runtime.selected_capsule_version !== negotiation.capsule_version ||
    runtime.selected_host_protocol !== negotiation.host_protocol ||
    runtime.issue_code !== null
  ) {
    return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
  }
  if (!runtime.core_capsule_versions.includes(runtime.selected_capsule_version)) {
    return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
  }
  if (!equalJson(trace.asset_identity, withoutExpectedDigests(request.asset))) {
    return 'KDNA_TRACE_ASSET_IDENTITY_MISMATCH';
  }
  if (!equalJson(trace.digest_evidence, request.capsule.digests)) {
    return 'KDNA_TRACE_DIGEST_EVIDENCE_MISMATCH';
  }

  const p = request.runtime_contract.capsule_delivery_digest;
  const delivery = trace.capsule_delivery_evidence;
  const runtimeReceipt = receipt.runtime_receipt;
  if (
    delivery.observed !== p ||
    delivery.host_boundary_comparison !== 'matched' ||
    delivery.host_recomputed !== runtimeReceipt.host_recomputed_capsule_delivery_digest ||
    delivery.host_recomputed !== p ||
    delivery.host_echoed !== runtimeReceipt.echoed_capsule_delivery_digest ||
    delivery.host_echoed !== p ||
    delivery.delivered_capsule_version !== request.runtime_contract.capsule_version ||
    delivery.request_id !== request.request_id ||
    trace.projection_actual.profile !== request.projection_contract.profile ||
    trace.projection_actual.capsule_delivery_digest !== p ||
    trace.projection_actual.profile_deviated_from_plan !== false
  ) {
    return 'KDNA_TRACE_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }
  if (!equalJson(trace.host_receipt, receipt)) return 'KDNA_TRACE_HOST_RECEIPT_MISMATCH';
  if (
    !equalJson(trace.execution.semantic_consumption, runtimeReceipt.semantic_consumption) ||
    !equalJson(trace.execution.model_identity, runtimeReceipt.model_identity)
  ) {
    return 'KDNA_TRACE_EXECUTION_EVIDENCE_MISMATCH';
  }

  const expectedBudget = expectedBudgetEvidence(plan, request, receipt);
  if (!equalJson(trace.budget, expectedBudget)) return 'KDNA_TRACE_BUDGET_MISMATCH';
  if (trace.overall_status !== 'timed_out' && expectedBudget.comparison.overall === 'exceeded') {
    return 'KDNA_TRACE_BUDGET_LIMIT_VIOLATION';
  }
  if (trace.overall_status === 'timed_out' && expectedBudget.comparison.elapsed_ms !== 'exceeded') {
    return 'KDNA_TRACE_BUDGET_MISMATCH';
  }

  if (trace.result_ref !== null) {
    if (
      trace.result_ref.shape !== request.result_contract.shape ||
      receipt.outcome === null ||
      trace.result_ref.result_digest !== digestJcs(receipt.outcome)
    ) {
      return 'KDNA_TRACE_RESULT_DIGEST_MISMATCH';
    }
  } else if (receipt.outcome !== null) {
    return 'KDNA_TRACE_RESULT_DIGEST_MISMATCH';
  }
  return validateTerminalState(trace, receipt);
}

function validateJudgmentTraceV1(trace, context) {
  const contextResult = requireContext(context, [
    'plan',
    'trustedPlanDigest',
    'capabilities',
    'coreCapsuleVersions',
    'request',
    'receipt',
  ]);
  if (!contextResult.valid) return contextResult;
  const schemaResult = validateSchema('trace', trace);
  if (!schemaResult.valid) return schemaResult;
  const planResult = validateConsumptionPlanV1(context.plan, {
    trustedPlanDigest: context.trustedPlanDigest,
  });
  if (!planResult.valid) return planResult;
  const capabilitiesResult = validateSchema('capabilities', context.capabilities);
  if (!capabilitiesResult.valid) {
    return invalid(
      'KDNA_VALIDATION_CONTEXT_INVALID',
      'Trace validation requires schema-valid independent Host capabilities.',
      capabilitiesResult.errors,
    );
  }
  if (context.request !== null) {
    const requestSchemaResult = validateSchema('request', context.request);
    if (!requestSchemaResult.valid) {
      return invalid(
        'KDNA_VALIDATION_CONTEXT_INVALID',
        'Trace validation requires a schema-valid independent Host request.',
        requestSchemaResult.errors,
      );
    }
  }
  if (context.receipt !== null) {
    if (context.request === null) {
      return invalid(
        'KDNA_VALIDATION_CONTEXT_INVALID',
        'Trace validation cannot correlate a receipt without its independent request.',
      );
    }
    const receiptResult = validateAgentHost2ReceiptV1(context.receipt, {
      request: context.request,
    });
    if (!receiptResult.valid) {
      if (receiptResult.code === 'KDNA_HOST_CAPSULE_DELIVERY_DIGEST_MISMATCH') {
        return invalid(
          'KDNA_TRACE_CAPSULE_DELIVERY_DIGEST_MISMATCH',
          'JudgmentTrace receipt context contains inconsistent Capsule delivery evidence.',
          receiptResult.errors,
        );
      }
      return invalid(
        'KDNA_VALIDATION_CONTEXT_INVALID',
        'Trace validation requires a valid independently correlated Host receipt.',
        receiptResult.errors,
      );
    }
  }
  try {
    const code = validateTraceSemantics(
      trace,
      context.plan,
      context.request,
      context.receipt,
      context.capabilities,
      context.coreCapsuleVersions,
    );
    return code ? invalid(code, 'JudgmentTrace correlation failed.') : ok();
  } catch (error) {
    return invalid('KDNA_INPUT_INVALID', 'JudgmentTrace is not a safe JSON value.', {
      cause: error && typeof error.message === 'string' ? error.message : String(error),
    });
  }
}

function buildJudgmentTraceV1(input, context) {
  const contextResult = requireContext(context, [
    'plan',
    'trustedPlanDigest',
    'capabilities',
    'coreCapsuleVersions',
    'request',
    'receipt',
  ]);
  throwInvalid(contextResult);
  const planResult = validateConsumptionPlanV1(context.plan, {
    trustedPlanDigest: context.trustedPlanDigest,
  });
  throwInvalid(planResult);

  const capabilitiesResult = validateSchema('capabilities', context.capabilities);
  if (!capabilitiesResult.valid) {
    throw new KDNAExecutionContractError(
      'KDNA_VALIDATION_CONTEXT_INVALID',
      'Trace construction requires schema-valid independent Host capabilities.',
      capabilitiesResult.errors,
    );
  }
  if (context.request !== null) {
    const requestResult = validateAgentHost2RequestV1(context.request, context, {
      enforceBudget: false,
    });
    throwInvalid(requestResult);
  }
  if (context.receipt !== null) {
    if (context.request === null) {
      throw new KDNAExecutionContractError(
        'KDNA_VALIDATION_CONTEXT_INVALID',
        'Trace construction cannot use a receipt without its independent request.',
      );
    }
    const receiptResult = validateAgentHost2ReceiptV1(context.receipt, {
      request: context.request,
    });
    throwInvalid(receiptResult);
  }

  const plan = context.plan;
  const request = context.request;
  const receipt = context.receipt;
  const negotiation = negotiateExecutionPairV1(plan, context);
  const hasRequest = request !== null;
  const hasReceipt = receipt !== null;
  const comparison = hasReceipt
    ? receipt.runtime_receipt.capsule_delivery_comparison
    : hasRequest
      ? 'not_observed'
      : 'unavailable';
  const p = hasRequest ? request.runtime_contract.capsule_delivery_digest : null;
  const matched = comparison === 'matched';

  let trace;
  try {
    trace = {
      type: 'kdna.judgment.trace',
      trace_version: '1.0.0',
      trace_id: input.trace_id,
      plan_ref: {
        plan_id: plan.plan_id,
        plan_digest_profile: plan.integrity.profile,
        plan_digest: plan.integrity.plan_digest,
        comparison: 'matched',
      },
      parent_trace_id: input.parent_trace_id ?? null,
      timestamp: input.timestamp,
      overall_status: input.overall_status,
      runtime_contract: {
        plan_capsule_versions: clone(plan.projection_request.accepted_capsule_versions),
        core_capsule_versions: clone(context.coreCapsuleVersions),
        plan_host_protocols: clone(plan.host_request.accepted_protocols),
        host_capabilities: clone(context.capabilities),
        negotiation_state: hasRequest
          ? 'selected'
          : negotiation.state === 'selected'
            ? 'not_started'
            : 'blocked',
        selected_capsule_version: hasRequest ? negotiation.capsule_version : null,
        selected_host_protocol: hasRequest ? negotiation.host_protocol : null,
        issue_code: hasRequest || negotiation.state === 'selected' ? null : negotiation.issue_code,
      },
      asset_identity: withoutExpectedDigests(plan.asset_ref),
      digest_evidence: hasRequest ? clone(request.capsule.digests) : unavailableDigestEvidence(),
      capsule_delivery_evidence: {
        basis: CAPSULE_DELIVERY_PROFILE,
        observed: p,
        sender_computed: hasRequest,
        host_recomputed: hasReceipt
          ? receipt.runtime_receipt.host_recomputed_capsule_delivery_digest
          : null,
        host_echoed: hasReceipt
          ? receipt.runtime_receipt.echoed_capsule_delivery_digest
          : null,
        delivered_capsule_version: hasRequest ? CAPSULE_VERSION : null,
        host_boundary_comparison: comparison,
        request_id: hasRequest ? request.request_id : null,
      },
      projection_actual: {
        profile: hasRequest ? request.projection_contract.profile : null,
        capsule_delivery_digest: p,
        profile_deviated_from_plan: hasRequest ? false : null,
      },
      host_receipt: hasReceipt ? clone(receipt) : null,
      execution: {
        delivery_status: matched
          ? 'correlated_response'
          : hasRequest
            ? 'rejected_before_execution'
            : 'not_delivered',
        semantic_consumption: matched
          ? clone(receipt.runtime_receipt.semantic_consumption)
          : { state: 'not_observed', basis: null },
        execution_status: matched
          ? receipt.runtime_receipt.provider_execution_status
          : 'not_started',
        conformance_status: 'not_evaluated',
        model_identity: matched
          ? clone(receipt.runtime_receipt.model_identity)
          : { value: null, basis: 'not_observed' },
      },
      budget: expectedBudgetEvidence(plan, request, receipt),
      result_ref:
        matched && receipt.outcome !== null
          ? {
              shape: request.result_contract.shape,
              result_digest: digestJcs(receipt.outcome),
              basis: 'kdna-result-jcs-v1',
              stored: input.result_stored ?? true,
            }
          : null,
      errors: clone(input.errors || []),
      warnings: clone(input.warnings || []),
    };
  } catch {
    throw new KDNAExecutionContractError(
      'KDNA_TRACE_INPUT_INVALID',
      'Cannot build JudgmentTrace 1 from the supplied input and independent context.',
    );
  }

  const result = validateJudgmentTraceV1(trace, context);
  throwInvalid(result);
  return trace;
}

module.exports = {
  KDNAExecutionContractError,
  PLAN_DIGEST_PROFILE,
  HOST_PROTOCOL,
  DEFAULT_CORE_CAPSULE_VERSIONS,
  parseExecutionContractJsonV1,
  computeConsumptionPlanDigestV1,
  buildConsumptionPlanV1,
  validateConsumptionPlanV1,
  negotiateExecutionPairV1,
  buildAgentHost2RequestV1,
  validateAgentHost2RequestV1,
  validateAgentHost2ReceiptV1,
  deriveBudgetEvidenceV1,
  buildJudgmentTraceV1,
  validateJudgmentTraceV1,
};
