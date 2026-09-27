'use strict';

const { canonicalJson } = require('./strict-input.js');
const { fail } = require('./r2-registry.js');
const equal = (a, b) => canonicalJson(a) === canonicalJson(b);
function unique(items, name = 'id', field = '/payload') {
  const result = new Map();
  for (const item of items) {
    if (result.has(item[name])) fail(field, item[name]);
    result.set(item[name], item);
  }
  return result;
}
function bounds(value, field = '/payload') {
  if (!Number.isSafeInteger(value.minimum) || value.minimum < 0 || (value.maximum !== null && (!Number.isSafeInteger(value.maximum) || value.maximum < value.minimum))) fail(field);
}
function validateShape(shape, field = '/payload', depth = 0) {
  if (depth > 64) fail(field);
  if (shape.kind === 'list') { bounds(shape, field); validateShape(shape.item_shape, field, depth + 1); }
  else if (shape.kind === 'record') { unique(shape.fields, 'name', field); for (const f of shape.fields) validateShape(f.shape, field, depth + 1); }
  else if (shape.kind !== 'scalar') fail(field);
}
function resultShape(shape, value, field = '/payload', depth = 0) {
  if (depth > 64) fail(field);
  if (shape.kind === 'scalar') { if (value.kind !== shape.scalar_type) fail(field); return; }
  if (shape.kind === 'list') {
    if (value.kind !== 'list' || value.items.length < shape.minimum || (shape.maximum !== null && value.items.length > shape.maximum)) fail(field);
    for (const item of value.items) resultShape(shape.item_shape, item, field, depth + 1);
    return;
  }
  if (value.kind !== 'record') fail(field);
  const fields = unique(shape.fields, 'name', field), actual = unique(value.fields, 'name', field);
  for (const f of fields.values()) if (f.required && !actual.has(f.name)) fail(field);
  for (const f of actual.values()) { if (!fields.has(f.name)) fail(field); resultShape(fields.get(f.name).shape, f.value, field, depth + 1); }
}
function validateContract(contract, field = '/payload') {
  if (contract.kind === 'emission_list') return;
  bounds(contract, field); validateShape(contract.shape, field);
  if (!contract.allowed_result_types.length || new Set(contract.allowed_result_types.map(canonicalJson)).size !== contract.allowed_result_types.length) fail(field);
}
function valueFor(contract, value, field = '/payload') {
  if (contract.kind === 'emission_list') fail(field);
  resultShape(contract.shape, value, field);
  const count = value.kind === 'list' ? value.items.length : 1;
  if (count < contract.minimum || (contract.maximum !== null && count > contract.maximum)) fail(field);
}
function validateResult(judgment) {
  const contract = judgment.result_contract;
  validateContract(contract);
  if (judgment.result) {
    if (judgment.result.contract_ref !== contract.id || !contract.allowed_result_types.some(t => equal(t, judgment.result.result_type))) fail();
    valueFor(contract, judgment.result.value);
  }
  if (judgment.formation_rule && judgment.formation_rule.output_contract_ref !== contract.id) fail();
}
function shapeAt(shape, path, field = '/payload') {
  for (const name of path) {
    if (shape.kind !== 'record') fail(field);
    const f = shape.fields.find(x => x.name === name);
    if (!f) fail(field);
    shape = f.shape;
  }
  return shape;
}
function compatible(from, to, field = '/payload') {
  if (from === null || to === null) return; // A fixed external target is unresolved, never assumed admitted.
  if (from.kind === 'emission_list' || to.kind === 'emission_list') { if (!equal(from, to)) fail(field); return; }
  if (!equal(from.shape, to.shape) || from.minimum < to.minimum || (to.maximum !== null && (from.maximum === null || from.maximum > to.maximum))) fail(field);
  if (from.allowed_result_types && to.allowed_result_types && from.allowed_result_types.some(t => !to.allowed_result_types.some(u => equal(t,u)))) fail(field);
}
function projected(contract, path, field = '/payload') {
  if (!path.length) return contract;
  if (contract === null) return null;
  if (contract.kind === 'emission_list') fail(field);
  const shape = shapeAt(contract.shape, path, field);
  return { shape, minimum:shape.kind === 'list' ? shape.minimum : 1, maximum:shape.kind === 'list' ? shape.maximum : 1 };
}
function completeBindings(shape, paths, field = '/payload') {
  const prefix = (a,b) => a.length <= b.length && a.every((x,i) => b[i] === x);
  for (let i = 0; i < paths.length; i++) for (let j = i + 1; j < paths.length; j++) if (prefix(paths[i],paths[j]) || prefix(paths[j],paths[i])) fail(field);
  if (paths.some(p => !p.length)) { if (paths.length !== 1) fail(field); return; }
  function required(value, at) {
    if (paths.some(path => prefix(path, at))) return;
    if (value.kind !== 'record') fail(field);
    for (const f of value.fields) if (f.required) required(f.shape, [...at, f.name]);
  }
  required(shape, []);
}

module.exports = { equal, unique, bounds, resultShape, validateShape, validateContract, valueFor, validateResult, shapeAt, compatible, projected, completeBindings };
