/**
 * @aikdna/kdna-core — Work Pack validation (pure logic)
 *
 * Zero-dependency pure functions for validating KDNA Work Pack
 * manifests against the Work Pack schema. Does not depend on ajv
 * at source level — the validator is injected.
 */

const fs = require('fs');
const path = require('path');

// ── Embedded Work Pack Schema v0.1 ──────────────────────────────────
// Self-contained schema with resolved $refs for zero-dependency validation.

const WORK_PACK_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://aikdna.com/schemas/work-pack.schema.json',
  title: 'KDNA Work Pack Manifest',
  type: 'object',
  required: ['format', 'format_version', 'name', 'version', 'description', 'status', 'kdna'],
  properties: {
    format: { type: 'string', const: 'kdna-workpack' },
    format_version: { type: 'string', pattern: '^\\d+\\.\\d+$' },
    name: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', maxLength: 64 },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.]+)?(\\+[a-zA-Z0-9.]+)?$' },
    description: { type: 'string', maxLength: 280 },
    status: { type: 'string', enum: ['draft', 'experimental', 'stable', 'deprecated'] },
    access: { type: 'string', enum: ['public', 'licensed', 'remote', 'enterprise', 'partner'], default: 'public' },
    license: { type: 'string', default: 'Apache-2.0' },
    kdna: {
      type: 'object',
      oneOf: [
        {
          required: ['mode', 'asset'],
          properties: {
            mode: { const: 'single' },
            asset: {
              type: 'object',
              required: ['name', 'version', 'role'],
              properties: {
                name: { type: 'string', pattern: '^[a-z0-9_]+$' },
                version: { type: 'string' },
                digest: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' },
                role: { type: 'string', enum: ['primary', 'constraint', 'fallback'] },
              },
              additionalProperties: false,
            },
          },
        },
        {
          required: ['mode', 'assets'],
          properties: {
            mode: { const: 'cluster' },
            assets: {
              type: 'array',
              minItems: 2,
              items: {
                type: 'object',
                required: ['name', 'version', 'role'],
                properties: {
                  name: { type: 'string', pattern: '^[a-z0-9_]+$' },
                  version: { type: 'string' },
                  digest: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' },
                  role: { type: 'string', enum: ['primary', 'constraint', 'fallback'] },
                },
                additionalProperties: false,
              },
            },
          },
        },
      ],
    },
    skills: {
      type: 'array',
      default: [],
      items: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', pattern: '^[a-z0-9]+([_-][a-z0-9]+)*$', maxLength: 64 },
          type: { type: 'string' },
          required: { type: 'boolean', default: true },
          mcp_server: { type: ['string', 'null'], default: null },
          fallback: { type: ['string', 'null'], default: null },
        },
        additionalProperties: false,
      },
    },
    templates: {
      type: 'object',
      default: {},
      properties: {
        task: { type: 'string' },
        output: { type: 'string' },
      },
    },
    review_gates: {
      type: 'array',
      default: [],
      items: { type: 'string' },
    },
    risk_policy: { type: 'string' },
    trace_policy: { type: 'string' },
    evals: { type: 'string' },
  },
  additionalProperties: false,
};

// ── Public API ─────────────────────────────────────────────────────

/**
 * Validate a Work Pack manifest against the schema.
 *
 * @param {object} manifest — parsed workpack.json content
 * @param {object} [opts]
 * @param {object} [opts.ajv] — optional pre-configured Ajv instance
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateWorkPackManifest(manifest, opts = {}) {
  const Ajv = opts.ajv || _lazyAjv();
  let validate;
  try {
    validate = Ajv.compile(WORK_PACK_SCHEMA);
  } catch (e) {
    return { valid: false, errors: [`Schema compilation error: ${e.message}`] };
  }
  const ok = validate(manifest);
  if (ok) return { valid: true, errors: [] };
  const errors = (validate.errors || []).map(
    (e) => `${e.instancePath || '/'}: ${e.message}`
  );
  return { valid: false, errors };
}

/**
 * Check structural completeness — verify all referenced files exist.
 *
 * @param {object} manifest — parsed workpack.json
 * @param {string} rootDir — directory containing workpack.json
 * @returns {{ complete: boolean, missing: string[] }}
 */
function checkWorkPackStructure(manifest, rootDir) {
  const missing = [];
  const refs = [];

  if (manifest.templates) {
    if (manifest.templates.task) refs.push(manifest.templates.task);
    if (manifest.templates.output) refs.push(manifest.templates.output);
  }
  if (manifest.review_gates) refs.push(...manifest.review_gates);
  if (manifest.risk_policy) refs.push(manifest.risk_policy);
  if (manifest.trace_policy) refs.push(manifest.trace_policy);
  if (manifest.evals) refs.push(manifest.evals);

  for (const ref of refs) {
    const fullPath = path.resolve(rootDir, ref);
    if (!fs.existsSync(fullPath)) missing.push(ref);
  }

  return { complete: missing.length === 0, missing };
}

/**
 * Inspect a Work Pack — return a structured summary.
 *
 * @param {object} manifest — parsed workpack.json
 * @param {string} rootDir — directory containing workpack.json
 * @returns {object}
 */
function inspectWorkPack(manifest, rootDir) {
  const kdnaMode = manifest.kdna?.mode || 'unknown';
  const structure = checkWorkPackStructure(manifest, rootDir);

  return {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    status: manifest.status,
    access: manifest.access || 'public',
    license: manifest.license || 'Apache-2.0',
    format_version: manifest.format_version,
    kdna: {
      mode: kdnaMode,
      assets: kdnaMode === 'single'
        ? [{ name: manifest.kdna.asset.name, version: manifest.kdna.asset.version, role: manifest.kdna.asset.role }]
        : (manifest.kdna?.assets || []).map(a => ({ name: a.name, version: a.version, role: a.role })),
    },
    skills: (manifest.skills || []).map(s => ({
      name: s.name,
      type: s.type || 'unspecified',
      required: s.required !== false,
      fallback: s.fallback || null,
    })),
    templates: manifest.templates
      ? { task: manifest.templates.task || null, output: manifest.templates.output || null }
      : null,
    review_gates: (manifest.review_gates || []).length,
    has_risk_policy: !!manifest.risk_policy,
    has_trace_policy: !!manifest.trace_policy,
    has_evals: !!manifest.evals,
    structural_complete: structure.complete,
    missing_files: structure.missing,
  };
}

/**
 * Load a Work Pack from a directory.
 *
 * @param {string} dirPath — path to Work Pack directory
 * @returns {{ manifest: object|null, error: string|null }}
 */
function loadWorkPack(dirPath) {
  const wpPath = path.join(dirPath, 'workpack.json');
  if (!fs.existsSync(wpPath)) {
    return { manifest: null, error: `workpack.json not found in ${dirPath}` };
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(wpPath, 'utf8'));
  } catch (e) {
    return { manifest: null, error: `Invalid JSON in workpack.json: ${e.message}` };
  }
  return { manifest, error: null };
}

// ── Internal ────────────────────────────────────────────────────────

let _ajvInstance = null;

function _lazyAjv() {
  if (_ajvInstance) return _ajvInstance;
  try {
    const Ajv = require('ajv');
    const addFormats = require('ajv-formats');
    _ajvInstance = new Ajv({ allErrors: true, strict: false });
    addFormats(_ajvInstance);
    return _ajvInstance;
  } catch (e) {
    throw new Error(
      'ajv is required for Work Pack validation. Install: npm install ajv ajv-formats',
      { cause: e },
    );
  }
}

module.exports = {
  WORK_PACK_SCHEMA,
  validateWorkPackManifest,
  checkWorkPackStructure,
  inspectWorkPack,
  loadWorkPack,
};
