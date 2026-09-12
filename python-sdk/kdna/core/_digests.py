import hashlib
from ._values import jcs, parse_json, entry_name, reject


def digest(data):
    return 'sha256:' + hashlib.sha256(data).hexdigest()


def word(n, width):
    if n < 0 or n > 9007199254740991 or (width == 4 and n > 0xffffffff):
        reject('READ_INPUT_INVALID')
    return n.to_bytes(width, 'big')


def content_tree(entries):
    names = sorted((n for n in entries if n not in ('checksums.json', 'signature.kdsig')), key=lambda x: x.encode())
    parts = [b'KDNA-CONTENT-TREE\x000.2.0\x00', word(len(names), 4)]
    for name in names:
        content = entries[name]
        is_json = name.endswith('.json')
        if is_json:
            value = parse_json(content)
            if name == 'kdna.json':
                value.pop('content_digest', None)
                if 'authoring' in value:
                    if type(value['authoring']) is not dict:
                        reject('READ_INPUT_INVALID')
                    value['authoring'].pop('content_digest', None)
            content = jcs(value).encode()
        n = name.encode()
        parts.extend([word(len(n), 4), n, bytes([0 if is_json else 1]), word(len(content), 8), content])
    return b''.join(parts)


def runtime_names(entries, manifest):
    declared = manifest['runtime']['mandatory_entries']
    if len(set(declared)) != len(declared) or any(not entry_name(n) or n in ('checksums.json', 'signature.kdsig', 'mimetype') for n in declared):
        reject()
    names = sorted(set(['kdna.json', 'payload.kdnab', *declared]), key=lambda x: x.encode())
    if any(n not in entries for n in names):
        reject()
    return names


def runtime_entries(entries, manifest):
    names = runtime_names(entries, manifest)
    parts = [b'KDNA-RUNTIME-ENTRY-SET\x000.2.0\x00', word(len(names), 4)]
    for name in names:
        n, content = name.encode(), entries[name]
        parts.extend([word(len(n), 4), n, word(len(content), 8), content])
    return b''.join(parts)


def evidence(key, observed, expected=None, expected_source=None):
    basis, suffix = {'A': ('container_bytes', 'container-bytes'), 'C': ('content_tree', 'content-tree'), 'E': ('runtime_entry_set', 'runtime-entry-set')}[key]
    comparison = {'state': 'not_compared', 'expected': None, 'expected_source': None}
    if expected is not None:
        comparison = {'state': 'matched' if expected == observed else 'mismatched', 'expected': expected, 'expected_source': expected_source}
    return {'basis': basis, 'profile': 'kdna.digest-basis.' + suffix, 'profile_version': '0.2.0', 'algorithm': 'SHA-256', 'observed': observed, 'comparison': comparison}
