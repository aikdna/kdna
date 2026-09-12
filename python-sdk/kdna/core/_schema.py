"""Independent evaluator of the exact public generated schema vocabulary.

No schema is authored here. Unsupported schema keywords fail closed when the
pinned resources are loaded; neither defaults nor coercion are applied.
"""
import hashlib
import json
import math
import re
from pathlib import Path
from ._values import identifier, entry_name, scalar, reject, jcs

_RESOURCE = Path(__file__).parent / '_schemas' / 'generated-contract.json'
_SHA = 'ec8a2616a768f5523e8852487e757f6f9560d1933ea3a9ee90ead69fe1120f4d'
_bytes = _RESOURCE.read_bytes()
if hashlib.sha256(_bytes).hexdigest() != _SHA:
    reject('READ_CORE_CAPABILITY_UNAVAILABLE')
CONTRACT = json.loads(_bytes)
TUPLE = CONTRACT['versionTuple']
TYPES = CONTRACT['types']
_KEYWORDS = {'$ref', 'type', 'enum', 'const', 'properties', 'required', 'additionalProperties',
             'items', 'minItems', 'maxItems', 'uniqueItems', 'minLength', 'maxLength', 'pattern',
             'minimum', 'maximum', 'minProperties', 'allOf', 'anyOf', 'oneOf', 'not', 'if', 'then'}


def _check_schema(s):
    if type(s) is bool:
        return
    if type(s) is not dict or set(s) - _KEYWORDS:
        reject('READ_CORE_CAPABILITY_UNAVAILABLE')
    for k in ('allOf', 'anyOf', 'oneOf'):
        for v in s.get(k, []):
            _check_schema(v)
    for k in ('items', 'not', 'if', 'then', 'additionalProperties'):
        if k in s:
            _check_schema(s[k])
    for v in s.get('properties', {}).values():
        _check_schema(v)


for _type in TYPES.values():
    _check_schema(_type)


def _type_matches(v, kind):
    return {'null': v is None, 'boolean': type(v) is bool,
            'number': type(v) in (int, float) and math.isfinite(v),
            'integer': type(v) in (int, float) and math.isfinite(v) and v == int(v),
            'string': type(v) is str, 'object': type(v) is dict, 'array': type(v) is list}.get(kind, False)


def _equal(a, b):
    return jcs(a) == jcs(b)


def matches(v, shape, depth=0):
    if depth > 256:
        return False
    if type(shape) is bool:
        return shape
    s = shape
    if '$ref' in s:
        ref = s['$ref']
        if not ref.startswith('#/$defs/') or ref[8:] not in TYPES:
            return False
        if not matches(v, TYPES[ref[8:]], depth + 1):
            return False
    if 'type' in s and not _type_matches(v, s['type']):
        return False
    if 'const' in s and not _equal(v, s['const']):
        return False
    if 'enum' in s and not any(_equal(v, x) for x in s['enum']):
        return False
    if type(v) in (int, float) and ('minimum' in s and v < s['minimum'] or 'maximum' in s and v > s['maximum']):
        return False
    if type(v) is str:
        if len(v) < s.get('minLength', 0) or len(v) > s.get('maxLength', math.inf):
            return False
        if 'pattern' in s:
            # ECMAScript whitespace differs from Python and ICU: U+0085 is
            # content, whereas U+FEFF is whitespace in the accepted validator.
            whitespace = '\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff'
            if s['pattern'] == r'\S':
                if not any(c not in whitespace for c in v):
                    return False
            # The pinned patterns use unescaped $ only as an anchor. Python's
            # $ also matches before a final LF; ECMAScript without m does not.
            elif re.search(s['pattern'].replace('$', r'\Z'), v, re.ASCII) is None:
                return False
    if type(v) is dict:
        props = s.get('properties', {})
        if any(k not in v for k in s.get('required', [])) or len(v) < s.get('minProperties', 0):
            return False
        for key, value in v.items():
            child = props.get(key, s.get('additionalProperties', True))
            if not matches(value, child, depth + 1):
                return False
    if type(v) is list:
        if len(v) < s.get('minItems', 0) or len(v) > s.get('maxItems', math.inf):
            return False
        if s.get('uniqueItems') and len({jcs(x) for x in v}) != len(v):
            return False
        if 'items' in s and not all(matches(x, s['items'], depth + 1) for x in v):
            return False
    if any(not matches(v, x, depth + 1) for x in s.get('allOf', [])):
        return False
    if 'anyOf' in s and not any(matches(v, x, depth + 1) for x in s['anyOf']):
        return False
    if 'oneOf' in s and sum(matches(v, x, depth + 1) for x in s['oneOf']) != 1:
        return False
    if 'not' in s and matches(v, s['not'], depth + 1):
        return False
    if 'if' in s and matches(v, s['if'], depth + 1) and not matches(v, s.get('then', True), depth + 1):
        return False
    return True


def _timestamp(v):
    m = re.fullmatch(r'([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.[0-9]+)?Z', v)
    if not m:
        return False
    y, month, day, h, minute, sec = map(int, m.groups())
    leap = y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)
    days = [31, 29 if leap else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    return 1 <= month <= 12 and 1 <= day <= days[month - 1] and h <= 23 and minute <= 59 and sec <= 59


def scalars(v, s, depth=0):
    if depth > 64:
        reject()
    if '$ref' in s:
        name = s['$ref'][8:]
        if name == 'Identifier' and not identifier(v):
            reject()
        if name in ('EntryName', 'RuntimeMandatoryEntryName') and not entry_name(v):
            reject()
        if name == 'Timestamp' and not _timestamp(v):
            reject()
        return scalars(v, TYPES[name], depth)
    if type(v) is str and not scalar(v):
        reject()
    if type(v) is dict:
        for k, child in s.get('properties', {}).items():
            if k in v:
                scalars(v[k], child, depth + 1)
    if type(v) is list and 'items' in s:
        for item in v:
            scalars(item, s['items'], depth + 1)
    for child in s.get('allOf', []):
        scalars(v, child, depth)
    for child in s.get('oneOf', s.get('anyOf', [])):
        resolved = TYPES[child['$ref'][8:]] if '$ref' in child else child
        if 'type' in resolved and not _type_matches(v, resolved['type']):
            continue
        if type(v) is dict and any('const' in p and k in v and not _equal(v[k], p['const']) for k, p in resolved.get('properties', {}).items()):
            continue
        scalars(v, child, depth)


def validate(name, value):
    if not matches(value, TYPES[name]):
        reject()
    scalars(value, TYPES[name])
    return value
