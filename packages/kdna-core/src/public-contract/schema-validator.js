'use strict';

// Pure-JS JSON Schema Draft 2020-12 validator engine.
// Zero eval / zero new Function / zero Node built-ins (strict-CSP & browser safe).

function ucs2length(str) {
  const len = str.length;
  let length = 0;
  let pos = 0;
  while (pos < len) {
    length++;
    const value = str.charCodeAt(pos++);
    if (value >= 0xd800 && value <= 0xdbff && pos < len) {
      const extra = str.charCodeAt(pos);
      if ((extra & 0xfc00) === 0xdc00) pos++;
    }
  }
  return length;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const arrA = Array.isArray(a);
    const arrB = Array.isArray(b);
    if (arrA !== arrB) return false;
    if (arrA) {
      const len = a.length;
      if (len !== b.length) return false;
      for (let i = 0; i < len; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const keys = Object.keys(a);
    const len = keys.length;
    if (len !== Object.keys(b).length) return false;
    for (let i = 0; i < len; i++) {
      const k = keys[i];
      if (!Object.hasOwn(b, k) || !deepEqual(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
}

function escapePointer(segment) {
  return String(segment).replace(/~/g, '~0').replace(/\//g, '~1');
}

function matchesSingleType(data, type) {
  if (type === 'object') return typeof data === 'object' && data !== null && !Array.isArray(data);
  if (type === 'array') return Array.isArray(data);
  if (type === 'string') return typeof data === 'string';
  if (type === 'boolean') return typeof data === 'boolean';
  if (type === 'null') return data === null;
  if (type === 'number') return typeof data === 'number' && Number.isFinite(data);
  if (type === 'integer') return typeof data === 'number' && Number.isFinite(data) && Math.floor(data) === data;
  return false;
}

function matchesType(data, type) {
  if (typeof type === 'string') return matchesSingleType(data, type);
  if (Array.isArray(type)) {
    for (let i = 0; i < type.length; i++) {
      if (matchesSingleType(data, type[i])) return true;
    }
    return false;
  }
  return true;
}

function createValidator(rootSchema, defs, options = {}) {
  const allErrors = options.allErrors !== false;
  const regExpFactory = options.regExp || ((p, f) => new RegExp(p, f));
  const regexCache = new Map();

  function getRegex(pattern) {
    let re = regexCache.get(pattern);
    if (!re) {
      re = regExpFactory(pattern, 'u');
      regexCache.set(pattern, re);
    }
    return re;
  }

  function resolveRef(ref) {
    if (typeof ref !== 'string') return undefined;
    if (ref.startsWith('#/$defs/')) return defs[ref.slice(8)];
    if (ref.startsWith('#/definitions/')) return defs[ref.slice(14)];
    return undefined;
  }

  function checkNode(schema, data, instancePath, schemaPath, errors, collect) {
    if (schema === true) return true;
    if (schema === false) {
      if (errors) {
        errors.push({
          instancePath,
          schemaPath,
          keyword: 'false schema',
          params: {},
          message: 'boolean schema is false',
        });
      }
      return false;
    }
    if (!schema || typeof schema !== 'object') return true;

    let valid = true;
    const fail = (keyword, params, message, sp = schemaPath + '/' + keyword) => {
      valid = false;
      if (errors) errors.push({ instancePath, schemaPath: sp, keyword, params, message });
      return collect;
    };

    if (schema.$ref !== undefined) {
      const target = resolveRef(schema.$ref);
      const nextSp = schemaPath === '#' && schema.$ref === rootSchema?.$ref ? '#' : schema.$ref;
      if (!checkNode(target, data, instancePath, nextSp, errors, collect)) {
        valid = false;
        if (!collect) return false;
      }
    }

    if (schema.type !== undefined) {
      if (!matchesType(data, schema.type)) {
        const typeStr = Array.isArray(schema.type) ? schema.type.join(',') : schema.type;
        if (!fail('type', { type: schema.type }, 'must be ' + typeStr)) return false;
      }
    }

    if (Object.hasOwn(schema, 'const')) {
      if (!deepEqual(data, schema.const)) {
        if (!fail('const', { allowedValue: schema.const }, 'must be equal to constant')) return false;
      }
    }

    if (schema.enum !== undefined) {
      let found = false;
      const list = schema.enum;
      for (let i = 0; i < list.length; i++) {
        if (deepEqual(data, list[i])) {
          found = true;
          break;
        }
      }
      if (!found) {
        if (!fail('enum', { allowedValues: list }, 'must be equal to one of the allowed values')) return false;
      }
    }

    if (typeof data === 'number' && Number.isFinite(data)) {
      if (schema.minimum !== undefined && data < schema.minimum) {
        if (!fail('minimum', { comparison: '>=', limit: schema.minimum }, 'must be >= ' + schema.minimum)) return false;
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        if (!fail('maximum', { comparison: '<=', limit: schema.maximum }, 'must be <= ' + schema.maximum)) return false;
      }
      if (schema.exclusiveMinimum !== undefined && data <= schema.exclusiveMinimum) {
        if (!fail('exclusiveMinimum', { comparison: '>', limit: schema.exclusiveMinimum }, 'must be > ' + schema.exclusiveMinimum)) return false;
      }
      if (schema.exclusiveMaximum !== undefined && data >= schema.exclusiveMaximum) {
        if (!fail('exclusiveMaximum', { comparison: '<', limit: schema.exclusiveMaximum }, 'must be < ' + schema.exclusiveMaximum)) return false;
      }
      if (schema.multipleOf !== undefined) {
        const res = data / schema.multipleOf;
        if (!Number.isFinite(res) || Math.abs(res - Math.round(res)) > 1e-12) {
          if (!fail('multipleOf', { multipleOf: schema.multipleOf }, 'must be multiple of ' + schema.multipleOf)) return false;
        }
      }
    } else if (typeof data === 'string') {
      if (schema.minLength !== undefined || schema.maxLength !== undefined) {
        const len = ucs2length(data);
        if (schema.maxLength !== undefined && len > schema.maxLength) {
          if (!fail('maxLength', { limit: schema.maxLength }, 'must NOT have more than ' + schema.maxLength + ' characters')) return false;
        }
        if (schema.minLength !== undefined && len < schema.minLength) {
          if (!fail('minLength', { limit: schema.minLength }, 'must NOT have fewer than ' + schema.minLength + ' characters')) return false;
        }
      }
      if (schema.pattern !== undefined) {
        if (!getRegex(schema.pattern).test(data)) {
          if (!fail('pattern', { pattern: schema.pattern }, 'must match pattern "' + schema.pattern + '"')) return false;
        }
      }
    } else if (Array.isArray(data)) {
      const len = data.length;
      if (schema.maxItems !== undefined && len > schema.maxItems) {
        if (!fail('maxItems', { limit: schema.maxItems }, 'must NOT have more than ' + schema.maxItems + ' items')) return false;
      }
      if (schema.minItems !== undefined && len < schema.minItems) {
        if (!fail('minItems', { limit: schema.minItems }, 'must NOT have fewer than ' + schema.minItems + ' items')) return false;
      }
      if (schema.prefixItems !== undefined) {
        const pItems = schema.prefixItems;
        const limit = Math.min(len, pItems.length);
        for (let i = 0; i < limit; i++) {
          if (!checkNode(pItems[i], data[i], instancePath + '/' + i, schemaPath + '/prefixItems/' + i, errors, collect)) {
            valid = false;
            if (!collect) return false;
          }
        }
      }
      if (schema.items !== undefined) {
        const start = Array.isArray(schema.prefixItems) ? schema.prefixItems.length : 0;
        if (schema.items === false) {
          if (len > start) {
            if (!fail('items', { limit: start }, 'must NOT have more than ' + start + ' items')) return false;
          }
        } else if (schema.items !== true) {
          for (let i = start; i < len; i++) {
            if (!checkNode(schema.items, data[i], instancePath + '/' + i, schemaPath + '/items', errors, collect)) {
              valid = false;
              if (!collect) return false;
            }
          }
        }
      }
      if (schema.uniqueItems === true && len > 1) {
        let dupI = -1;
        let dupJ = -1;
        let allPrim = true;
        for (let i = 0; i < len; i++) {
          const t = typeof data[i];
          if (data[i] !== null && t !== 'string' && t !== 'number' && t !== 'boolean') {
            allPrim = false;
            break;
          }
        }
        if (allPrim) {
          const seen = new Map();
          for (let i = 0; i < len; i++) {
            const val = data[i];
            const prev = seen.get(val);
            if (prev !== undefined) {
              dupJ = prev;
              dupI = i;
              break;
            }
            seen.set(val, i);
          }
        } else {
          outer: for (let i = len - 1; i > 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
              if (deepEqual(data[i], data[j])) {
                dupI = i;
                dupJ = j;
                break outer;
              }
            }
          }
        }
        if (dupI !== -1) {
          if (
            !fail(
              'uniqueItems',
              { i: dupI, j: dupJ },
              'must NOT have duplicate items (items ## ' + dupJ + ' and ' + dupI + ' are identical)',
            )
          ) {
            return false;
          }
        }
      }
    } else if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      const keyCount = keys.length;
      if (schema.maxProperties !== undefined && keyCount > schema.maxProperties) {
        if (!fail('maxProperties', { limit: schema.maxProperties }, 'must NOT have more than ' + schema.maxProperties + ' properties')) return false;
      }
      if (schema.minProperties !== undefined && keyCount < schema.minProperties) {
        if (!fail('minProperties', { limit: schema.minProperties }, 'must NOT have fewer than ' + schema.minProperties + ' properties')) return false;
      }
      if (schema.required !== undefined) {
        const req = schema.required;
        for (let i = 0; i < req.length; i++) {
          const key = req[i];
          if (!Object.hasOwn(data, key) || data[key] === undefined) {
            if (!fail('required', { missingProperty: key }, "must have required property '" + key + "'")) return false;
          }
        }
      }
      if (schema.additionalProperties !== undefined && schema.additionalProperties !== true) {
        const props = schema.properties;
        for (let i = 0; i < keyCount; i++) {
          const key = keys[i];
          if (props && Object.hasOwn(props, key)) continue;
          if (schema.additionalProperties === false) {
            if (!fail('additionalProperties', { additionalProperty: key }, 'must NOT have additional properties')) return false;
          } else {
            if (
              !checkNode(
                schema.additionalProperties,
                data[key],
                instancePath + '/' + escapePointer(key),
                schemaPath + '/additionalProperties',
                errors,
                collect,
              )
            ) {
              valid = false;
              if (!collect) return false;
            }
          }
        }
      }
      if (schema.properties !== undefined) {
        const props = schema.properties;
        const propKeys = Object.keys(props);
        for (let i = 0; i < propKeys.length; i++) {
          const key = propKeys[i];
          if (Object.hasOwn(data, key) && data[key] !== undefined) {
            if (
              !checkNode(
                props[key],
                data[key],
                instancePath + '/' + escapePointer(key),
                schemaPath + '/properties/' + escapePointer(key),
                errors,
                collect,
              )
            ) {
              valid = false;
              if (!collect) return false;
            }
          }
        }
      }
    }

    if (schema.not !== undefined) {
      if (checkNode(schema.not, data, instancePath, schemaPath + '/not', null, false)) {
        if (!fail('not', {}, 'must NOT be valid')) return false;
      }
    }

    if (schema.anyOf !== undefined) {
      const list = schema.anyOf;
      let matched = false;
      const subErrors = errors ? [] : null;
      for (let i = 0; i < list.length; i++) {
        if (checkNode(list[i], data, instancePath, schemaPath + '/anyOf/' + i, subErrors, false)) {
          matched = true;
          break;
        }
      }
      if (!matched) {
        if (errors && subErrors) {
          for (let i = 0; i < subErrors.length; i++) errors.push(subErrors[i]);
        }
        if (!fail('anyOf', {}, 'must match a schema in anyOf')) return false;
      }
    }

    if (schema.oneOf !== undefined) {
      const list = schema.oneOf;
      let matchCount = 0;
      let passing = null;
      const subErrors = errors ? [] : null;
      for (let i = 0; i < list.length; i++) {
        if (checkNode(list[i], data, instancePath, schemaPath + '/oneOf/' + i, subErrors, false)) {
          matchCount++;
          passing = passing === null ? i : Array.isArray(passing) ? [...passing, i] : [passing, i];
          if (matchCount > 1 && !collect) break;
        }
      }
      if (matchCount !== 1) {
        if (matchCount === 0 && errors && subErrors) {
          for (let i = 0; i < subErrors.length; i++) errors.push(subErrors[i]);
        }
        if (!fail('oneOf', { passingSchemas: matchCount > 1 ? passing : null }, 'must match exactly one schema in oneOf')) return false;
      }
    }

    if (schema.allOf !== undefined) {
      const list = schema.allOf;
      for (let i = 0; i < list.length; i++) {
        if (!checkNode(list[i], data, instancePath, schemaPath + '/allOf/' + i, errors, collect)) {
          valid = false;
          if (!collect) return false;
        }
      }
    }

    if (schema.if !== undefined) {
      const condValid = checkNode(schema.if, data, instancePath, schemaPath + '/if', null, false);
      if (condValid) {
        if (schema.then !== undefined) {
          if (!checkNode(schema.then, data, instancePath, schemaPath + '/then', errors, collect)) {
            if (!fail('if', { failingKeyword: 'then' }, 'must match "then" schema')) return false;
          }
        }
      } else if (schema.else !== undefined) {
        if (!checkNode(schema.else, data, instancePath, schemaPath + '/else', errors, collect)) {
          if (!fail('if', { failingKeyword: 'else' }, 'must match "else" schema')) return false;
        }
      }
    }

    return valid;
  }

  function validate(data) {
    const errors = [];
    const ok = checkNode(rootSchema, data, '', '#', errors, allErrors);
    validate.errors = ok ? null : errors;
    return ok;
  }
  validate.errors = null;
  return validate;
}

function createValidators(defs, names, options = {}) {
  const out = {};
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    out[name] = createValidator({ $ref: '#/$defs/' + name }, defs, options);
  }
  return out;
}

module.exports = { createValidator, createValidators };
