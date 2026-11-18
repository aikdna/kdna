'use strict';

const { identifier, entryName, scalarString, validTimestamp, reject } = require('./strict-input.js');
const contract = require('./generated-contract.json');
let _validators = null;
const getValidators = () => _validators ?? (_validators = require('./validators.generated.js'));
const shapeCache = new WeakMap(), specialShapeCache = new WeakMap();
const SPECIAL_TYPES = new Set(['Identifier', 'EntryName', 'RuntimeMandatoryEntryName', 'Timestamp']);
let specialReady = false;
function directHasSpecial(s) {
  if (!s || typeof s !== 'object') return false;
  if (s.$ref) return SPECIAL_TYPES.has(s.$ref.slice(8));
  if (s.properties && Object.values(s.properties).some(directHasSpecial)) return true;
  if (s.items && directHasSpecial(s.items)) return true;
  if ((s.allOf ?? []).some(directHasSpecial)) return true;
  if ((s.oneOf ?? s.anyOf ?? []).some(directHasSpecial)) return true;
  return false;
}
function canReachSpecial(shape) {
  if (!specialReady) {
    specialReady = true;
    let changed = true;
    const entries = Object.entries(contract.types);
    while (changed) {
      changed = false;
      for (let i = 0; i < entries.length; i++) {
        const [n, t] = entries[i];
        if (!SPECIAL_TYPES.has(n) && directHasSpecial(t)) { SPECIAL_TYPES.add(n); changed = true; }
      }
    }
  }
  return directHasSpecial(shape);
}
const EMPTY_INFO = Object.freeze({ ref: null, props: null, items: null, all: null, branches: null });
function shapeInfo(shape, onlySpecial = false) {
  if (!shape || typeof shape !== 'object') return EMPTY_INFO;
  const cache = onlySpecial ? specialShapeCache : shapeCache;
  let info = cache.get(shape);
  if (info) return info;
  const rawProps = shape.properties ? Object.entries(shape.properties) : null;
  const props = rawProps ? (onlySpecial ? rawProps.filter(([, c]) => canReachSpecial(c)) : rawProps) : null;
  const rawAll = shape.allOf ?? null;
  const all = rawAll ? (onlySpecial ? rawAll.filter(c => canReachSpecial(c)) : rawAll) : null;
  const rawBranches = shape.oneOf ?? shape.anyOf ?? null;
  const filteredBranches = rawBranches ? (onlySpecial ? rawBranches.filter(c => canReachSpecial(c)) : rawBranches) : null;
  const branches = filteredBranches ? filteredBranches.map(c => {
    const s = (c && typeof c === 'object' && c.$ref ? contract.types[c.$ref.slice(8)] : c) || {};
    const consts = s.properties ? Object.entries(s.properties).filter(([, x]) => x && typeof x === 'object' && Object.hasOwn(x, 'const')).map(([k, x]) => [k, x.const]) : null;
    return { c, type: s.type ?? null, consts: consts && consts.length ? consts : null };
  }) : null;
  const items = shape.items && (!onlySpecial || canReachSpecial(shape.items)) ? shape.items : null;
  info = { ref: shape.$ref ? shape.$ref.slice(8) : null, props: props && props.length ? props : null, items, all: all && all.length ? all : null, branches: branches && branches.length ? branches : null };
  cache.set(shape, info);
  return info;
}
function validateScalars(value, shape, depth = 0, onlySpecial = false) {
  if (depth > 64) reject('READ_CORE_INVALID');
  const info = shapeInfo(shape, onlySpecial);
  if (info.ref) {
    const name = info.ref;
    if (name === 'Identifier' && !identifier(value)) reject('READ_CORE_INVALID');
    else if ((name === 'EntryName' || name === 'RuntimeMandatoryEntryName') && !entryName(value)) reject('READ_CORE_INVALID');
    else if (name === 'Timestamp' && !validTimestamp(value)) reject('READ_CORE_INVALID');
    if (onlySpecial && !canReachSpecial(contract.types[name])) return;
    return validateScalars(value, contract.types[name], depth, onlySpecial);
  }
  if (!onlySpecial && typeof value === 'string' && !scalarString(value)) reject('READ_CORE_INVALID');
  if (value && typeof value === 'object') {
    if (info.props) for (let i = 0; i < info.props.length; i++) { const [key, child] = info.props[i]; if (Object.hasOwn(value, key)) validateScalars(value[key], child, depth + 1, onlySpecial); }
    if (info.items && Array.isArray(value)) for (let i = 0; i < value.length; i++) validateScalars(value[i], info.items, depth + 1, onlySpecial);
  }
  // Candidate union scalar checks use all matching structural branches, without interpreting arbitrary data fields as identifiers.
  if (info.all) for (let i = 0; i < info.all.length; i++) validateScalars(value, info.all[i], depth, onlySpecial);
  if (info.branches) for (let i = 0; i < info.branches.length; i++) {
    const b = info.branches[i];
    if (b.type && (b.type === 'null' ? value !== null : b.type === 'array' ? !Array.isArray(value) : typeof value !== b.type)) continue;
    if (b.consts && value && typeof value === 'object') {
      let skip = false;
      for (let j = 0; j < b.consts.length; j++) { const [k, cv] = b.consts[j]; if (Object.hasOwn(value, k) && value[k] !== cv) { skip = true; break; } }
      if (skip) continue;
    }
    validateScalars(value, b.c, depth, onlySpecial);
  }
}
function validate(name, value, onlySpecial = false) {
  if (name === 'Manifest' && value && typeof value === 'object') {
    const c = value.compatibility;
    // The existing three fields choose the authored semantic contract; neither
    // a package version nor a caller-provided schema URI is a selector.
    if (typeof value.format_version === 'string' && c && typeof c.profile === 'string' && typeof c.profile_version === 'string') {
      const t = contract.versionTuple;
      if (value.format_version !== t.container || c.profile !== t.payload_profile || c.profile_version !== t.payload_version) reject('READ_UNSUPPORTED_VERSION');
    }
  }

  const validators = getValidators();

  if (!validators[name](value)) {
    const error=validators[name].errors?.[0],root=name==='Payload'?'/payload':name==='Manifest'?'/manifest':'/'+name;
    const pointer=error?.instancePath??'';
    // A required property's name comes from the trusted schema; arbitrary
    // unknown keys and rejected values are deliberately not copied out.
    const missing=error?.keyword==='required'?'/'+String(error.params.missingProperty).replace(/~/g,'~0').replace(/\//g,'~1'):'';
    reject('READ_CORE_INVALID',{subject:null,field:root+pointer+missing});
  }
  validateScalars(value, contract.types[name], 0, onlySpecial);
  return value;
}
module.exports = { validate, validateScalars };
