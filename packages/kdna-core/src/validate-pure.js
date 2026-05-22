/**
 * KDNA Validate — Pure schema and cross-file validation.
 *
 * Operates on in-memory data maps. No fs, no path, no Node.js dependencies.
 * ajv is an optional peer dependency — if not available, schema validation
 * returns a warning instead of failing.
 */

/**
 * Validate KDNA domain files against their JSON Schema definitions.
 *
 * @param {Object} dataMap — keyed by filename, e.g. { 'KDNA_Core.json': {...}, ... }
 * @param {Object} [schemaMap] — keyed by filename, e.g. { 'KDNA_Core.json': schemaObj, ... }
 *   If not provided, schema validation is skipped.
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateDomainSchema(dataMap, schemaMap) {
  const errors = [];
  const warnings = [];

  if (!schemaMap || Object.keys(schemaMap).length === 0) {
    warnings.push('Schema validation skipped: no schemas provided');
    return { valid: errors.length === 0, errors, warnings };
  }

  const FILE_TO_SCHEMA = {
    'KDNA_Core.json': 'KDNA_Core.schema.json',
    'KDNA_Patterns.json': 'KDNA_Patterns.schema.json',
    'KDNA_Scenarios.json': 'KDNA_Scenarios.schema.json',
    'KDNA_Cases.json': 'KDNA_Cases.schema.json',
    'KDNA_Reasoning.json': 'KDNA_Reasoning.schema.json',
    'KDNA_Evolution.json': 'KDNA_Evolution.schema.json',
  };

  let ajv, addFormats;
  try {
    ajv = require('ajv');
    try {
      addFormats = require('ajv-formats');
    } catch {
      addFormats = null;
    }
  } catch {
    warnings.push('Schema validation skipped: ajv not installed. Install with: npm install ajv ajv-formats');
    return { valid: true, errors: [], warnings };
  }

  let validCount = 0;
  let failCount = 0;

  for (const [file, schemaFile] of Object.entries(FILE_TO_SCHEMA)) {
    if (!dataMap[file]) continue;
    if (!schemaMap[schemaFile]) {
      warnings.push(`${file}: no schema found at ${schemaFile}`);
      continue;
    }

    const schema = { ...schemaMap[schemaFile] };
    // Remove $schema ref so AJV doesn't try to fetch the meta-schema
    delete schema.$schema;

    const ajvInstance = new ajv({ allErrors: true, strict: false });
    if (addFormats) addFormats(ajvInstance);
    try {
      ajvInstance.addMetaSchema(require('ajv/dist/refs/json-schema-2020-12.json'));
    } catch {
      /* meta-schema already available or not needed */
    }
    const validate = ajvInstance.compile(schema);
    const valid = validate(dataMap[file]);

    if (valid) {
      validCount++;
    } else {
      failCount++;
      for (const err of validate.errors || []) {
        const instancePath = err.instancePath || '/';
        errors.push(`${file}${instancePath}: ${err.message} (${err.keyword})`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate cross-file consistency in a KDNA domain.
 *
 * Checks:
 * - Domain name consistency across all files' meta.domain
 * - Version consistency across all files' meta.version
 *
 * @param {Object} dataMap — keyed by filename
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateCrossFile(dataMap) {
  const errors = [];
  const warnings = [];

  // Domain name consistency
  let domainName = null;
  for (const [file, data] of Object.entries(dataMap)) {
    if (data && data.meta && data.meta.domain) {
      if (domainName === null) {
        domainName = data.meta.domain;
      } else if (data.meta.domain !== domainName) {
        errors.push(
          `${file}: domain name "${data.meta.domain}" does not match "${domainName}" from other files`,
        );
      }
    }
  }

  // Version consistency
  let version = null;
  for (const [file, data] of Object.entries(dataMap)) {
    if (data && data.meta && data.meta.version) {
      if (version === null) {
        version = data.meta.version;
      } else if (data.meta.version !== version) {
        errors.push(
          `${file}: version "${data.meta.version}" differs from "${version}" in other files`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

module.exports = { validateDomainSchema, validateCrossFile };
