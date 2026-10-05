'use strict';
const C = require('./section-common.js');
const contract = require('./creation06/contract.json');
const validators = require('./creation06/validators.cjs');
const failures = new WeakSet();
function need(ok, code = 'CREATION_TYPED_SHAPE') {
  if (!ok) {
    const error = new Error(code);
    error.code = code;
    failures.add(error);
    throw error;
  }
}
function scalars(value, shape, depth = 0) {
  need(depth <= 64);
  if (shape === false) return;
  if (shape.$ref) {
    const name = shape.$ref.slice(8);
    if (name === 'Identifier') need(C.strict.identifier(value));
    if (['EntryName', 'RuntimeMandatoryEntryName'].includes(name)) need(C.strict.entryName(value));
    if (name === 'Timestamp') need(C.strict.validTimestamp(value));
    return scalars(value, contract.types[name], depth);
  }
  if (typeof value === 'string') need(C.strict.scalarString(value));
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(shape.properties ?? {})) {
      if (Object.hasOwn(value, key)) scalars(value[key], item, depth + 1);
    }
    if (Array.isArray(value) && shape.items) for (const item of value) scalars(item, shape.items, depth + 1);
  }
  for (const item of shape.allOf ?? []) scalars(value, item, depth);
  for (const item of shape.oneOf ?? shape.anyOf ?? []) {
    const resolved = item.$ref ? contract.types[item.$ref.slice(8)] : item;
    if (resolved === false) continue;
    if (resolved.type && (resolved.type === 'null' ? value !== null : resolved.type === 'array' ? !Array.isArray(value) : typeof value !== resolved.type)) continue;
    if (resolved.properties && Object.entries(resolved.properties).some(([key, spec]) => Object.hasOwn(spec, 'const') && Object.hasOwn(value ?? {}, key) && value[key] !== spec.const)) continue;
    scalars(value, item, depth);
  }
}
function validate(name, value) {
  C.strict.assertStrictJson(value);
  need(typeof validators[name] === 'function' && validators[name](value));
  scalars(value, contract.types[name]);
  return value;
}
module.exports = {contract, validate, isFailure: error => failures.has(error)};
