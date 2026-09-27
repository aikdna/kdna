'use strict';

const { identifier, entryName, scalarString, validTimestamp, reject } = require('./strict-input.js');
const contract = require('./generated-contract.json');
const validators = require('./validators.generated.js');
function validateScalars(value, shape, depth = 0) {
  if (depth > 64) reject('READ_CORE_INVALID');
  if (shape.$ref) {
    const name = shape.$ref.slice(8);
    if (name === 'Identifier' && !identifier(value)) reject('READ_CORE_INVALID');
    if (['EntryName', 'RuntimeMandatoryEntryName'].includes(name) && !entryName(value)) reject('READ_CORE_INVALID');
    if (name === 'Timestamp' && !validTimestamp(value)) reject('READ_CORE_INVALID');
    return validateScalars(value, contract.types[name], depth);
  }
  if (typeof value === 'string' && !scalarString(value)) reject('READ_CORE_INVALID');
  if (value && typeof value === 'object') {
    if (shape.properties) for (const [key, child] of Object.entries(shape.properties)) if (Object.hasOwn(value, key)) validateScalars(value[key], child, depth + 1);
    if (Array.isArray(value) && shape.items) for (const item of value) validateScalars(item, shape.items, depth + 1);
  }
  // Candidate union scalar checks use all matching structural branches, without interpreting arbitrary data fields as identifiers.
  for (const child of shape.allOf ?? []) validateScalars(value, child, depth);
  for (const child of shape.oneOf ?? shape.anyOf ?? []) {
    const resolved = child.$ref ? contract.types[child.$ref.slice(8)] : child;
    if (resolved.type && (resolved.type === 'null' ? value !== null : resolved.type === 'array' ? !Array.isArray(value) : typeof value !== resolved.type)) continue;
    if (resolved.properties && Object.entries(resolved.properties).some(([k, s]) => Object.hasOwn(s, 'const') && Object.hasOwn(value ?? {}, k) && value[k] !== s.const)) continue;
    validateScalars(value, child, depth);
  }
}
function validate(name, value) {
  if (name === 'Manifest' && value && typeof value === 'object') {
    const c = value.compatibility;
    // The existing three fields choose the authored semantic contract; neither
    // a package version nor a caller-provided schema URI is a selector.
    if (typeof value.format_version === 'string' && c && typeof c.profile === 'string' && typeof c.profile_version === 'string') {
      const t = contract.versionTuple;
      if (value.format_version !== t.container || c.profile !== t.payload_profile || c.profile_version !== t.payload_version) reject('READ_UNSUPPORTED_VERSION');
    }
  }

  if (!validators[name](value)) {
    const error=validators[name].errors?.[0],root=name==='Payload'?'/payload':name==='Manifest'?'/manifest':'/'+name;
    const pointer=error?.instancePath??'';
    // A required property's name comes from the trusted schema; arbitrary
    // unknown keys and rejected values are deliberately not copied out.
    const missing=error?.keyword==='required'?'/'+String(error.params.missingProperty).replace(/~/g,'~0').replace(/\//g,'~1'):'';
    reject('READ_CORE_INVALID',{subject:null,field:root+pointer+missing});
  }
  validateScalars(value, contract.types[name]);
  return value;
}
module.exports = { validate };
