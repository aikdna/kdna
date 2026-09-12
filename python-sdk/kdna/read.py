"""Public Read projection and trusted Host disclosure boundary.

Trusted providers are live callbacks owned by the embedding application. JSON
objects cannot stand in for a Core snapshot, request admission or Host provider.
Read permission never grants action authorization or authoring acceptance.
"""
import inspect as _inspect
import re
import weakref
from .core import admit_bytes, admit_file, inspect_snapshot
from .core._schema import TUPLE
from .core._values import copy_json, identifier, scalar, uint, jcs

__all__ = ['create_trusted_control_provider', 'create_trusted_host_provider',
           'admit_read_request', 'project', 'read_bytes', 'read_file', 'read_snapshot']
_requests, _controls, _hosts = weakref.WeakKeyDictionary(), weakref.WeakKeyDictionary(), weakref.WeakKeyDictionary()
_sequence = 0


class _Identity:
    __slots__ = ('__weakref__',)


def create_trusted_control_provider(observe):
    if not callable(observe):
        raise TypeError('Control callback required')
    identity = _Identity()
    _controls[identity] = observe
    return identity


def create_trusted_host_provider(observe, deliver=None):
    if not callable(observe) or deliver is not None and not callable(deliver):
        raise TypeError('Host callbacks required')
    identity = _Identity()
    _hosts[identity] = {'observe': observe, 'deliver': deliver, 'handles': {}, 'revocations': set()}
    return identity


def _record(registry, identity):
    return registry.get(identity) if type(identity) is _Identity else None


def _correlation(ident):
    return {'state': 'validated', 'request_id': ident} if identifier(ident) else {'state': 'unavailable', 'request_id': None}


def _result(channel, payload, admission=False):
    r = {'channel': channel, 'admitted_request' if admission else 'envelope': None, 'admission_rejection': None, 'control': None, 'transport_failure': None}
    r[{'read_envelope': 'envelope', 'no_body_control': 'control'}.get(channel, channel)] = payload
    return r


def _transport(cause, cor, admission=False):
    return _result('transport_failure', {'code': 'READ_TRANSPORT_FAILURE', 'semantic_cause': cause, 'correlation': cor, 'delivery': 'not_confirmed'}, admission)


def _size(value):
    return len(jcs(value).encode())


def _fixed(n):
    if not uint(n):
        raise ValueError('Invalid byte count')
    return f'{int(n):016d}'


def _states():
    return {k: 'not_evaluated' for k in ('core', 'interpretation', 'writer', 'confirmation', 'read_permission', 'action_authorization')}


def _assessment():
    return {'state': 'not_evaluated', 'kind': None, 'assessor_id': None, 'evidence_ref': None}


def _diagnostic(code):
    if code in ('READ_INPUT_INVALID', 'READ_SNAPSHOT_UNATTESTED', 'READ_CORE_CAPABILITY_UNAVAILABLE'):
        stage = 'input'
    elif re.search('UNSUPPORTED_VERSION|MIXED_VERSION', code):
        stage = 'version'
    elif re.search('CORE_INVALID|INTERPRETATION|^READ_COMPONENT_|^READ_METHOD_PRESENCE_INVALID$', code):
        stage = 'core'
    elif re.search(r'ASSET_(?:VERSION_)?MISMATCH|SELECTION_', code) and not code.startswith('READ_HANDLE'):
        stage = 'selection'
    elif re.search('HANDLE_(?:UNTRUSTED|VERSION_MISMATCH|STALE|ASSET_MISMATCH|SCOPE_MISMATCH)', code):
        stage = 'handle'
    elif code == 'READ_PROJECTION_INVALID':
        stage = 'projection'
    elif code == 'READ_BUDGET_INSUFFICIENT':
        stage = 'budget'
    else:
        stage = 'host'
    return {'code': code, 'stage': stage, 'severity': 'error', 'subject': None, 'field': None}


class _AdmissionError(Exception):
    def __init__(self, reason, field):
        self.reason, self.field = reason, field


def _candidate(candidate):
    def fail(reason, field):
        raise _AdmissionError(reason, field)
    def keys(o, allowed, prefix, required=None):
        if type(o) is not dict:
            fail('wrong_type', prefix)
        if set(o) - set(allowed):
            fail('unknown_field', '$unknown')
        for k in allowed if required is None else required:
            if k not in o:
                fail('missing_required', prefix if prefix == 'handle.selection' else prefix + '.' + k if prefix else k)
    def ident(v, field):
        if type(v) is not str:
            fail('wrong_type', field)
        if not identifier(v):
            fail('invalid_identifier', field)
    def integer(v, field):
        if type(v) not in (int, float):
            fail('wrong_type', field)
        if not uint(abs(v)):
            fail('unsafe_integer', field)
        if v < 0:
            fail('out_of_range', field)
    if type(candidate) is not dict:
        fail('representation_not_object', '$candidate')
    keys(candidate, ['request_id', 'tuple', 'budget_bytes', 'mode', 'selection', 'handle'], '')
    ident(candidate['request_id'], 'request_id')
    integer(candidate['budget_bytes'], 'budget_bytes')
    t = candidate['tuple']
    keys(t, list(TUPLE), 'tuple', [])
    for k in TUPLE:
        if k in t:
            if type(t[k]) is not str:
                fail('wrong_type', 'tuple.' + k)
            if not scalar(t[k]):
                fail('invalid_identifier', 'tuple.' + k)
    record = {'request_id': candidate['request_id'], 'budget_bytes': candidate['budget_bytes'], 'request': None, 'version_rejection': None}
    if t != TUPLE:
        record['version_rejection'] = 'READ_MIXED_VERSION_TUPLE' if any(k != 'payload_profile' and t.get(k) == v for k, v in TUPLE.items()) else 'READ_UNSUPPORTED_VERSION'
        return record
    mode, selection, handle = candidate['mode'], candidate['selection'], candidate['handle']
    if mode not in ('whole_asset', 'catalog', 'exact_selection', 'expand'):
        fail('mode_shape_invalid', 'mode')
    sk = ['asset_id', 'asset_version', 'judgment_id']
    if mode in ('whole_asset', 'catalog'):
        if selection is not None:
            fail('mode_shape_invalid', 'selection')
    else:
        keys(selection, sk, 'selection')
        for k in sk:
            ident(selection[k], 'selection.' + k)
    if mode != 'expand':
        if handle is not None:
            fail('mode_shape_invalid', 'handle')
    else:
        hk = ['handle_id', 'asset_id', 'asset_version', 'A', 'C', 'snapshot_id', 'core_version', 'ir_version', 'read_version', 'selection', 'target', 'scope', 'issued_at', 'expires_at', 'host_id', 'host_epoch']
        keys(handle, hk, 'handle')
        for k in hk:
            v = handle[k]
            if k == 'selection':
                keys(v, sk, 'handle.selection')
                for field in sk:
                    ident(v[field], 'handle.selection')
            elif k == 'scope':
                if type(v) is not list:
                    fail('wrong_type', 'handle.scope')
                for item in v:
                    ident(item, 'handle.scope')
                if not v or len(set(v)) != len(v):
                    fail('mode_shape_invalid', 'handle')
            elif k in ('issued_at', 'expires_at'):
                integer(v, 'handle.' + k)
            elif k in ('A', 'C'):
                if type(v) is not str:
                    fail('wrong_type', 'handle.' + k)
                if re.fullmatch(r'sha256:[0-9a-f]{64}', v) is None:
                    fail('invalid_identifier', 'handle.' + k)
            else:
                ident(v, 'handle.' + k)
        if handle['issued_at'] >= handle['expires_at']:
            fail('mode_shape_invalid', 'handle')
    record['request'] = copy_json(candidate)
    return record


def admit_read_request(candidate, control_provider):
    cor = _correlation(candidate.get('request_id')) if type(candidate) is dict else _correlation(None)
    error, cause, record, inspection_failure = None, None, None, False
    try:
        record = _candidate(candidate)
    except _AdmissionError as failure:
        error = {'stage': 'admission', 'severity': 'error', 'reason': failure.reason, 'field': failure.field}
        cause = 'READ_INPUT_INVALID'
    except Exception:
        inspection_failure = True
    try:
        observe = _record(_controls, control_provider)
        if observe is None:
            raise ValueError('Untrusted control')
        value = observe()
        if type(value) is not dict or set(value) - {'admission_response_limit_bytes'} or not uint(value.get('admission_response_limit_bytes')):
            raise ValueError('Invalid control')
        limit = value['admission_response_limit_bytes']
    except Exception:
        return _transport(cause, cor, True)
    if inspection_failure:
        return _transport(cause, cor, True)
    if error:
        body = {'contract': 'kdna.read-admission/0.1.0', 'code': 'READ_INPUT_INVALID', 'diagnostic': error, 'correlation': cor, 'control_budget': {'limit_bytes': limit, 'actual_bytes': '0000000000000000'}}
        count = _size(body)
        body['control_budget']['actual_bytes'] = _fixed(count)
        if count <= limit:
            return _result('admission_rejection', body, True)
        return _result('no_body_control', {'code': 'READ_ADMISSION_RESPONSE_TOO_SMALL', 'semantic_cause': 'READ_INPUT_INVALID', 'correlation': cor, 'body_bytes': 0}, True)
    identity = _Identity()
    _requests[identity] = record
    return _result('admitted_request', identity, True)


def _projection_input(admitted, snapshot):
    record = _record(_requests, admitted)
    if record is None:
        return {'error': 'READ_INPUT_INVALID'}
    if record['version_rejection']:
        return {'error': record['version_rejection']}
    if snapshot is None or type(snapshot) in (bytes, bytearray, memoryview, str, bool, int, float):
        return {'error': 'READ_INPUT_INVALID'}
    view = inspect_snapshot(snapshot)
    if view is None:
        return {'error': 'READ_SNAPSHOT_UNATTESTED'}
    if view['tuple'] != TUPLE:
        return {'error': 'READ_MIXED_VERSION_TUPLE'}
    request = record['request']
    if request['selection']:
        s = request['selection']
        if s['asset_id'] != view['asset']['asset_id']:
            return {'error': 'READ_ASSET_MISMATCH'}
        if s['asset_version'] != view['asset']['asset_version']:
            return {'error': 'READ_ASSET_VERSION_MISMATCH'}
        count = sum(c['judgment_id'] == s['judgment_id'] for c in view['ir']['catalog'])
        if count != 1:
            return {'error': 'READ_SELECTION_NOT_FOUND' if count == 0 else 'READ_SELECTION_AMBIGUOUS'}
    return {'view': view, 'request': request, 'record': record}


def _handle_fields(request, view):
    h = request['handle']
    if h is None:
        return None
    if any(h[k + '_version'] != TUPLE[k] for k in ('core', 'ir', 'read')):
        return 'READ_HANDLE_VERSION_MISMATCH'
    if h['snapshot_id'] != view['snapshot_id'] or h['A'] != view['digests']['A']['observed'] or h['C'] != view['digests']['C']['observed']:
        return 'READ_HANDLE_STALE'
    if h['asset_id'] != view['asset']['asset_id'] or h['asset_version'] != view['asset']['asset_version'] or h['selection'] != request['selection']:
        return 'READ_HANDLE_ASSET_MISMATCH'
    target = next((t for t in view['expansion_targets'] if t['target'] == h['target'] and t['selection'] == request['selection']), None)
    if target is None or set(target['scope']) != set(h['scope']):
        return 'READ_HANDLE_SCOPE_MISMATCH'
    return None


def _body(request, view):
    ir = view['ir']
    nodes = {n['id']: n for n in ir['nodes']}
    declarations = [n for n in ir['nodes'] if n['owner_judgment_id'] is None and n['role'] in ('asset_declaration', 'declaration', 'scope', 'cohesion', 'attribution')]
    selected, closure, catalog = None, [], ir['catalog']
    if request['mode'] in ('exact_selection', 'expand'):
        selected = request['selection']
        catalog = [c for c in ir['catalog'] if c['judgment_id'] == selected['judgment_id']]
        mandatory = next((c for c in ir['mandatory_closures'] if c['selection'] == selected), None)
        if mandatory is None:
            return None
        ids = mandatory['node_ids']
        if request['mode'] == 'expand':
            target = next((t for t in view['expansion_targets'] if t['target'] == request['handle']['target'] and t['selection'] == selected), None)
            if target is None:
                return None
            ids = target['scope']
        if any(n not in nodes for n in ids):
            return None
        closure = [nodes[n] for n in ids]
    omissions = [{'state': 'explicitly_omitted', 'target': c['node_ref'], 'field': 'judgment', 'reason': 'outside_selection' if selected else 'not_in_mode', 'expandable': False, 'handle_id': None} for c in ir['catalog'] if selected is None or c['judgment_id'] != selected['judgment_id']]
    if request['mode'] == 'catalog':
        omissions.extend({'state': 'explicitly_omitted', 'target': d['id'], 'field': 'declaration', 'reason': 'not_in_mode', 'expandable': False, 'handle_id': None} for d in declarations)
    authored = next((n['value'] for n in ir['nodes'] if n['role'] == 'declaration' and n['owner_judgment_id'] is None), {})
    missing = [{'state': 'observed_missing', 'field': k} for k in ('highest_question', 'worldview', 'value_order', 'role', 'boundaries') if k not in authored]
    claims = [n for n in ir['nodes'] if n['role'] in ('provenance', 'attribution')]
    has_claim = any(n['role'] == 'provenance' or n['value']['state'] == 'provided' for n in claims)
    closure_ids = {n['id'] for n in closure}
    content = {'declarations': [] if request['mode'] == 'catalog' else declarations,
               'catalog': catalog, 'selected': selected, 'closure': closure,
               'references': [r for r in ir['references'] if r['source_node'] in closure_ids and r['target_node'] in closure_ids],
               'relationships': [r for r in ir['relationships'] if all(any(n['role'] == 'judgment' and n['value']['id'] == p['judgment_ref'] for n in closure) for p in r['participants'])],
               'missing': missing, 'provenance': {'declarations': claims, 'confirmation': 'claimed_unverified' if has_claim else 'not_evaluated', 'verifier_id': None, 'evidence_ref': None}, 'expansion_handles': []}
    return copy_json({'asset': view['asset'], 'tuple': view['tuple'], 'digests': view['digests'], 'snapshot_id': view['snapshot_id'], 'content': content, 'diagnostics': [], 'omissions': omissions, 'assessment': _assessment()})


def project(admitted, snapshot):
    def failure(code):
        return {'status': 'rejected', 'body': None, 'diagnostics': [_diagnostic(code)]}
    try:
        data = _projection_input(admitted, snapshot)
        if 'error' in data:
            return failure(data['error'])
        error = _handle_fields(data['request'], data['view'])
        if error:
            return failure(error)
        body = _body(data['request'], data['view'])
        return {'status': 'projected', 'body': body, 'diagnostics': []} if body else failure('READ_PROJECTION_INVALID')
    except Exception:
        return failure('READ_PROJECTION_INVALID')


async def _observe(host, request, snapshot, view):
    state = _record(_hosts, host)
    if state is None:
        return {'error': 'READ_HOST_CONTEXT_UNTRUSTED'}
    raw = state['observe']({'request': copy_json(request), 'snapshot': snapshot})
    if _inspect.isawaitable(raw):
        raw = await raw
    try:
        value = copy_json(raw)
    except Exception:
        return {'error': 'READ_HOST_CONTEXT_UNTRUSTED'}
    keys = ['host_id', 'host_epoch', 'decision_id', 'request_id', 'snapshot_id', 'A', 'C', 'scope', 'issued_at', 'expires_at', 'decision', 'policy_id', 'current_ms', 'revoked', 'lift_denial']
    untrusted = {'error': 'READ_HOST_CONTEXT_UNTRUSTED'}
    if type(value) is not dict or set(value) - set(keys) or any(k in value and type(value[k]) is not bool for k in ('revoked', 'lift_denial')):
        return untrusted
    if any(not identifier(value.get(k)) for k in ('host_id', 'host_epoch', 'decision_id', 'request_id', 'snapshot_id', 'policy_id')):
        return untrusted
    if value['request_id'] != request['request_id'] or value['snapshot_id'] != view['snapshot_id'] or value.get('A') != view['digests']['A']['observed'] or value.get('C') != view['digests']['C']['observed'] or value.get('decision') not in ('allow', 'deny') or type(value.get('scope')) is not list or any(not identifier(n) for n in value['scope']) or len(set(value['scope'])) != len(value['scope']):
        return untrusted
    issued, expires = value.get('issued_at'), value.get('expires_at')
    if not uint(issued) or not uint(expires) or issued >= expires or expires - issued > 3600000:
        return untrusted
    h = request['handle']
    if h and (h['host_id'] != value['host_id'] or h['host_epoch'] != value['host_epoch']):
        return {'error': 'READ_HOST_EPOCH_MISMATCH'}
    now = value.get('current_ms')
    if not uint(now) or now < issued or h and now < h['issued_at']:
        return {'error': 'READ_HOST_TIME_INVALID'}
    if h and now >= h['expires_at']:
        return {'error': 'READ_HANDLE_EXPIRED'}
    if now >= expires:
        return {'error': 'READ_HOST_CONTEXT_EXPIRED'}
    denial = jcs([value['host_id'], value['host_epoch'], view['asset']['asset_id']])
    if value.get('lift_denial') is True:
        state['revocations'].discard(denial)
    if value.get('revoked') is True or value['decision'] == 'deny':
        state['revocations'].add(denial)
    if denial in state['revocations']:
        return {'error': 'READ_HOST_DENIED'}
    return {'value': value, 'state': state}


def _scope(body, context):
    allowed, content = set(context['scope']), body['content']
    if any(n['id'] not in allowed for n in content['closure']):
        return False
    content['declarations'] = [n for n in content['declarations'] if n['id'] in allowed]
    content['catalog'] = [n for n in content['catalog'] if n['node_ref'] in allowed]
    p = content['provenance']
    p['declarations'] = [n for n in p['declarations'] if n['id'] in allowed]
    if not any(n['role'] == 'provenance' or n['value']['state'] == 'provided' for n in p['declarations']):
        p.update(confirmation='not_evaluated', verifier_id=None, evidence_ref=None)
    content['relationships'] = [r for r in content['relationships'] if any(n['role'] == 'relationship' and n['value']['id'] == r['id'] and n['id'] in allowed for n in content['closure'])]
    content['references'] = [r for r in content['references'] if r['source_node'] in allowed and r['target_node'] in allowed]
    body['omissions'] = [o for o in body['omissions'] if o['target'] in allowed]
    return True


def _rejected(record, code, observed):
    return {'contract': TUPLE['read'], 'request_id': record['request_id'], 'status': 'rejected', 'tuple': None, 'asset': None, 'snapshot_id': None, 'digests': None, 'content': None, 'states': dict(observed), 'diagnostics': [_diagnostic(code)], 'omissions': [], 'assessment': _assessment(), 'receipt': {'receipt_id': 'receipt:' + record['request_id'], 'request_id': record['request_id'], 'snapshot_id': None, 'host_id': None, 'host_epoch': None, 'decision_id': None, 'disclosed_at': None, 'delivery': 'not_delivered'}, 'budget': {'limit_bytes': record['budget_bytes'], 'required_bytes': '0000000000000000', 'actual_bytes': '0000000000000000'}}


def _measure(envelope, required=None):
    b = envelope['budget']
    b['actual_bytes'] = '0000000000000000'
    b['required_bytes'] = '0000000000000000' if required is None else _fixed(required)
    count = _size(envelope)
    b['actual_bytes'] = _fixed(count)
    if required is None:
        b['required_bytes'] = _fixed(count)
    return count


def _finish(envelope, record):
    count = _measure(envelope)
    ready = envelope['status'] == 'ready'
    code = next((d['code'] for d in envelope['diagnostics'] if d['severity'] == 'error'), None)
    rejection = _rejected(record, 'READ_BUDGET_INSUFFICIENT', envelope['states']) if ready else envelope
    rejection_bytes = _measure(rejection, count) if ready else count
    if ready and code is None and count <= record['budget_bytes']:
        return _result('read_envelope', envelope)
    code = code or 'READ_BUDGET_INSUFFICIENT'
    if rejection_bytes <= record['budget_bytes']:
        return _result('read_envelope', rejection)
    return _result('no_body_control', {'code': 'READ_RESPONSE_BUDGET_TOO_SMALL', 'semantic_cause': code, 'correlation': _correlation(record['request_id']), 'body_bytes': 0})


async def _run(admit, input_value, candidate, control_provider, host):
    global _sequence
    prepared = admit_read_request(candidate, control_provider)
    if prepared['channel'] != 'admitted_request':
        prepared.pop('admitted_request', None)
        prepared['envelope'] = None
        return await _deliver(prepared, host)
    admitted = prepared['admitted_request']
    record, state = _requests[admitted], _states()
    cause, handles, host_state = None, [], None
    def failure(code):
        return _finish(_rejected(record, code, state), record)
    async def prepare():
        nonlocal cause, handles, host_state
        global _sequence
        if record['version_rejection']:
            return failure(record['version_rejection'])
        core = admit(input_value)
        if core['status'] != 'accepted':
            if 'states' in core:
                state.update(core['states'])
            return failure(core['reason'])
        snapshot = core['snapshot']
        if inspect_snapshot(snapshot) is not None:
            state.update(core='valid', interpretation='complete')
        p = _projection_input(admitted, snapshot)
        if 'error' in p:
            return failure(p['error'])
        view, request = p['view'], p['request']
        if request['handle']:
            h = request['handle']
            hs = _record(_hosts, host)
            if hs is None or h['handle_id'] not in hs['handles'] or jcs(hs['handles'][h['handle_id']]) != jcs(h):
                return failure('READ_HANDLE_UNTRUSTED')
            error = _handle_fields(request, view)
            if error:
                return failure(error)
        first = await _observe(host, request, snapshot, view)
        if 'error' in first:
            if first['error'] == 'READ_HOST_DENIED':
                state['read_permission'] = 'denied'
            return failure(first['error'])
        body = _body(request, view)
        if body is None:
            return failure('READ_PROJECTION_INVALID')
        if not _scope(body, first['value']):
            return failure('READ_SCOPE_DENIED')
        fresh = await _observe(host, request, snapshot, view)
        if 'error' in fresh:
            if fresh['error'] == 'READ_HOST_DENIED':
                state['read_permission'] = 'denied'
            return failure(fresh['error'])
        if not _scope(body, fresh['value']):
            return failure('READ_SCOPE_DENIED')
        context, host_state = fresh['value'], fresh['state']
        state.update(read_permission='allowed', confirmation=body['content']['provenance']['confirmation'])
        if request['selection'] and request['mode'] != 'expand':
            for target in view['expansion_targets']:
                if target['selection']['judgment_id'] != request['selection']['judgment_id'] or any(n not in context['scope'] for n in target['scope']):
                    continue
                _sequence += 1
                handles.append({'handle_id': f"handle:{view['snapshot_id']}:{_sequence}", 'asset_id': view['asset']['asset_id'], 'asset_version': view['asset']['asset_version'], 'A': view['digests']['A']['observed'], 'C': view['digests']['C']['observed'], 'snapshot_id': view['snapshot_id'], 'core_version': TUPLE['core'], 'ir_version': TUPLE['ir'], 'read_version': TUPLE['read'], 'selection': request['selection'], 'target': target['target'], 'scope': target['scope'], 'issued_at': context['current_ms'], 'expires_at': min(context['expires_at'], context['current_ms'] + 3600000), 'host_id': context['host_id'], 'host_epoch': context['host_epoch']})
        body['content']['expansion_handles'] = handles
        _sequence += 1
        envelope = {'contract': TUPLE['read'], 'request_id': record['request_id'], 'status': 'ready', **body, 'states': state, 'receipt': {'receipt_id': f"receipt:{view['snapshot_id']}:{_sequence}", 'request_id': record['request_id'], 'snapshot_id': view['snapshot_id'], 'host_id': context['host_id'], 'host_epoch': context['host_epoch'], 'decision_id': context['decision_id'], 'disclosed_at': context['current_ms'], 'delivery': 'delivered'}, 'budget': {'limit_bytes': record['budget_bytes'], 'required_bytes': '0000000000000000', 'actual_bytes': '0000000000000000'}}
        return _finish(envelope, record)
    try:
        prepared = await prepare()
        delivered = await _deliver(prepared, host)
        if delivered is prepared and prepared['channel'] == 'read_envelope' and prepared['envelope']['status'] == 'ready':
            for h in handles:
                host_state['handles'][h['handle_id']] = copy_json(h)
        return delivered
    except Exception:
        return _transport(cause, _correlation(record['request_id']))


async def _deliver(prepared, host):
    state = _record(_hosts, host)
    deliver = state['deliver'] if state else None
    if deliver is None or prepared['channel'] == 'transport_failure':
        return prepared
    body = prepared.get('envelope') or {}
    admission, control = prepared.get('admission_rejection') or {}, prepared.get('control') or {}
    ident = body.get('request_id') or admission.get('correlation', {}).get('request_id') or control.get('correlation', {}).get('request_id')
    cause = admission.get('code') or next((d['code'] for d in body.get('diagnostics', []) if d['severity'] == 'error'), None) or control.get('semantic_cause')
    try:
        result = deliver(copy_json(prepared))
        if _inspect.isawaitable(result):
            result = await result
        if result is True:
            return prepared
    except Exception:
        return _transport(cause, _correlation(ident))
    return _transport(cause, _correlation(ident))


async def read_bytes(data, request, control_provider, host):
    return await _run(admit_bytes, data, request, control_provider, host)


async def read_file(path, request, control_provider, host):
    return await _run(admit_file, path, request, control_provider, host)


async def read_snapshot(snapshot, request, control_provider, host):
    def admitted(value):
        if inspect_snapshot(value) is None:
            return {'status': 'rejected', 'reason': 'READ_INPUT_INVALID'}
        return {'status': 'accepted', 'snapshot': value}
    return await _run(admitted, snapshot, request, control_provider, host)
