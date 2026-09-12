"""Strict JSON-domain values and RFC 8785 serialization for the pinned contract."""
import json
import math
import re


class Rejection(Exception):
    def __init__(self, reason='READ_CORE_INVALID'):
        self.reason = reason
        super().__init__(reason)


def reject(reason='READ_CORE_INVALID'):
    raise Rejection(reason)


def scalar(value, maximum=1048576, controls=True):
    if type(value) is not str:
        return False
    try:
        if len(value.encode('utf-8')) > maximum:
            return False
    except UnicodeEncodeError:
        return False
    return controls or all(ord(c) > 31 and not 127 <= ord(c) <= 159 for c in value)


def identifier(value):
    return type(value) is str and bool(value) and scalar(value, 256, False)


def entry_name(value):
    return (type(value) is str and bool(value) and scalar(value, 4096, False)
            and '\\' not in value and not value.startswith('/')
            and not re.match(r'^[A-Za-z]:', value)
            and all(s not in ('', '.', '..') for s in value.split('/')))


def uint(value):
    return type(value) in (int, float) and math.isfinite(value) and value == int(value) and 0 <= value <= 9007199254740991


def copy_json(value):
    seen = set()
    count = 0

    def copy(x, depth):
        nonlocal count
        count += 1
        if depth > 64 or count > 100000:
            reject('READ_INPUT_INVALID')
        if x is None or type(x) is bool:
            return x
        if type(x) in (int, float):
            try:
                n = float(x)
            except (ValueError, OverflowError):
                reject('READ_INPUT_INVALID')
            if not math.isfinite(n):
                reject('READ_INPUT_INVALID')
            return n
        if type(x) is str:
            if not scalar(x):
                reject('READ_INPUT_INVALID')
            return x
        if type(x) not in (dict, list) or id(x) in seen:
            reject('READ_INPUT_INVALID')
        seen.add(id(x))
        if type(x) is list:
            if len(x) > 10000:
                reject('READ_INPUT_INVALID')
            result = [copy(v, depth + 1) for v in x]
        else:
            if any(not scalar(k) for k in x):
                reject('READ_INPUT_INVALID')
            result = {k: copy(v, depth + 1) for k, v in x.items()}
        seen.remove(id(x))
        return result
    return copy(value, 0)


def parse_json(value):
    try:
        text = value.decode('utf-8-sig') if type(value) in (bytes, bytearray) else value
    except UnicodeDecodeError:
        reject('READ_CORE_INVALID')
    if type(text) is not str:
        reject('READ_INPUT_INVALID')
    at, count = 0, 0

    def whitespace():
        nonlocal at
        while at < len(text) and text[at] in ' \t\n\r':
            at += 1

    def string():
        nonlocal at
        start = at
        at += 1
        while True:
            if at >= len(text):
                reject('READ_INPUT_INVALID')
            char = text[at]
            at += 1
            if char == '"':
                break
            if char == '\\':
                at += 1
            elif ord(char) < 32:
                reject('READ_INPUT_INVALID')
        try:
            result = json.loads(text[start:at])
        except ValueError:
            reject('READ_CORE_INVALID')
        if not scalar(result):
            reject('READ_INPUT_INVALID')
        return result

    def parse(depth):
        nonlocal at, count
        count += 1
        if depth > 64 or count > 100000:
            reject('READ_INPUT_INVALID')
        whitespace()
        char = text[at] if at < len(text) else ''
        if char == '"':
            return string()
        if char == '{':
            at += 1
            whitespace()
            result = {}
            if at < len(text) and text[at] == '}':
                at += 1
                return result
            while True:
                whitespace()
                if at >= len(text) or text[at] != '"':
                    reject('READ_INPUT_INVALID')
                key = string()
                if key in result:
                    reject('READ_INPUT_INVALID')
                whitespace()
                if at >= len(text) or text[at] != ':':
                    reject('READ_INPUT_INVALID')
                at += 1
                result[key] = parse(depth + 1)
                whitespace()
                if at >= len(text):
                    reject('READ_INPUT_INVALID')
                end = text[at]
                at += 1
                if end == '}':
                    return result
                if end != ',':
                    reject('READ_INPUT_INVALID')
        if char == '[':
            at += 1
            whitespace()
            result = []
            if at < len(text) and text[at] == ']':
                at += 1
                return result
            while True:
                if len(result) >= 10000:
                    reject('READ_INPUT_INVALID')
                result.append(parse(depth + 1))
                whitespace()
                if at >= len(text):
                    reject('READ_INPUT_INVALID')
                end = text[at]
                at += 1
                if end == ']':
                    return result
                if end != ',':
                    reject('READ_INPUT_INVALID')
        for token, result in [('true', True), ('false', False), ('null', None)]:
            if text.startswith(token, at):
                at += len(token)
                return result
        token = re.match(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?', text[at:])
        if token is None:
            reject('READ_INPUT_INVALID')
        at += len(token[0])
        result = float(token[0])
        if not math.isfinite(result):
            reject('READ_INPUT_INVALID')
        return result

    result = parse(0)
    whitespace()
    if at != len(text):
        reject('READ_INPUT_INVALID')
    return result


def number_text(value):
    n = float(value)
    if not math.isfinite(n):
        reject('READ_INPUT_INVALID')
    if n == 0:
        return '0'
    negative = n < 0
    s = repr(abs(n)).lower()
    mantissa, _, exponent = s.partition('e')
    exponent = int(exponent or '0')
    whole, _, fraction = mantissa.partition('.')
    digits = (whole + fraction).lstrip('0')
    point = len(whole) + exponent
    if whole == '0':
        zeros = len(fraction) - len(fraction.lstrip('0'))
        point = -zeros + exponent
    digits = digits.rstrip('0') or '0'
    if 0 < point <= 21:
        s = digits[:point] + ('.' + digits[point:] if point < len(digits) else '0' * (point - len(digits)))
    elif -6 < point <= 0:
        s = '0.' + '0' * (-point) + digits
    else:
        power = point - 1
        s = digits[0] + ('.' + digits[1:] if len(digits) > 1 else '') + 'e' + ('+' if power >= 0 else '-') + str(abs(power))
    return ('-' if negative else '') + s


def jcs(value):
    value = copy_json(value)
    def encode(x):
        if x is None:
            return 'null'
        if type(x) is bool:
            return 'true' if x else 'false'
        if type(x) in (int, float):
            return number_text(x)
        if type(x) is str:
            return json.dumps(x, ensure_ascii=False, separators=(',', ':'))
        if type(x) is list:
            return '[' + ','.join(encode(v) for v in x) + ']'
        return '{' + ','.join(encode(k) + ':' + encode(x[k]) for k in sorted(x, key=lambda s: s.encode('utf-16-be'))) + '}'
    return encode(value)
