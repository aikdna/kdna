"""Public Core: bounded admission and immutable, process-local snapshot identity."""
import os
import stat
import uuid
import weakref
from ._values import Rejection, copy_json, parse_json, jcs
from ._container import parse_container, decode_payload, LIMITS
from ._digests import digest, content_tree, runtime_entries, runtime_names, evidence
from ._schema import TUPLE, validate
from ._ir import build_ir

__all__ = ['admit_bytes', 'admit_file', 'inspect_snapshot', 'version_tuple', 'plan_capability', 'component_semantics_contract']
_snapshots = weakref.WeakKeyDictionary()


class _Snapshot:
    __slots__ = ('__weakref__',)


def version_tuple():
    return dict(TUPLE)


def plan_capability():
    """Report local capability; this does not create a public Plan wire type."""
    return {'status': 'unavailable', 'code': 'KDNA_PLAN_ADMISSION_UNAVAILABLE',
            'action_authorized': False, 'creation_accepted': False}


def inspect_snapshot(snapshot):
    if type(snapshot) is not _Snapshot or snapshot not in _snapshots:
        return None
    return copy_json(_snapshots[snapshot])


def component_semantics_contract():
    from ._components import component_semantics_contract as descriptor
    return descriptor()


def _rejected(reason='READ_CORE_INVALID', component_failure=None):
    from ._components import CODES
    if reason not in ('READ_INPUT_INVALID', 'READ_CORE_INVALID', 'READ_CORE_CAPABILITY_UNAVAILABLE', 'READ_INTERPRETATION_INCOMPLETE', *CODES.values()):
        reason = 'READ_CORE_INVALID'
    semantic = reason == 'READ_INTERPRETATION_INCOMPLETE' or reason in CODES.values()
    states = {'core': 'valid' if semantic else 'invalid' if reason == 'READ_CORE_INVALID' else 'not_evaluated', 'interpretation': 'blocked' if semantic else 'not_evaluated'}
    return {'status': 'rejected', 'reason': reason, 'states': states, 'component_failure': component_failure if reason in CODES.values() else None, 'diagnostics': [{'code': reason, 'stage': 'input' if reason in ('READ_INPUT_INVALID', 'READ_CORE_CAPABILITY_UNAVAILABLE') else 'core', 'severity': 'error', 'subject': None, 'field': None}]}


def admit_bytes(data):
    if type(data) not in (bytes, bytearray, memoryview):
        return _rejected('READ_INPUT_INVALID')
    try:
        captured = bytes(data)
        entries = parse_container(captured)
        manifest = validate('Manifest', parse_json(entries['kdna.json']))
        if manifest['payload']['encrypted'] or 'encryption' in manifest or 'signature.kdsig' in entries or 'checksums.json' in entries:
            return _rejected('READ_CORE_CAPABILITY_UNAVAILABLE')
        payload = validate('Payload', decode_payload(entries['payload.kdnab']))
        if any(payload['asset'][a] != manifest[m] for a, m in [('asset_id', 'asset_id'), ('asset_version', 'version'), ('judgment_version', 'judgment_version')]):
            return _rejected()
        A, C, E = digest(captured), digest(content_tree(entries)), digest(runtime_entries(entries, manifest))
        if any(value and value != C for value in (manifest.get('content_digest'), manifest.get('authoring', {}).get('content_digest'))):
            return _rejected()
        ir = build_ir(manifest, payload, entries)
        expected = manifest.get('content_digest')
        view = {'snapshot_id': 'snapshot:' + str(uuid.uuid4()), 'tuple': TUPLE, 'asset': payload['asset'],
                'digests': {'A': evidence('A', A), 'C': evidence('C', C, expected, {'kind': 'manifest_declaration', 'source_id': 'kdna.json'} if expected else None), 'E': evidence('E', E)},
                'ir': ir, 'ir_digest': digest(jcs(ir).encode()),
                'runtime_entry_names': runtime_names(entries, manifest), 'expansion_targets': ir['expansion_targets']}
        snapshot = _Snapshot()
        _snapshots[snapshot] = copy_json(view)
        return {'status': 'accepted', 'snapshot': snapshot}
    except Rejection as error:
        return _rejected(error.reason, getattr(error, 'component_failure', None))
    except (ValueError, TypeError, KeyError, IndexError, OverflowError, RecursionError, OSError):
        return _rejected()


def admit_file(path):
    if type(path) is not str:
        return _rejected('READ_INPUT_INVALID')
    try:
        with open(path, 'rb', buffering=0) as stream:
            metadata = os.fstat(stream.fileno())
            if not stat.S_ISREG(metadata.st_mode) or metadata.st_size > LIMITS['container']:
                return _rejected()
            data = stream.read(LIMITS['container'] + 1)
        if len(data) > LIMITS['container']:
            return _rejected()
        return admit_bytes(data)
    except (OSError, ValueError):
        return _rejected()
