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
  if (!validators[name](value)) reject('READ_CORE_INVALID');
  validateScalars(value, contract.types[name]);
  return value;
}
module.exports = { validate };
