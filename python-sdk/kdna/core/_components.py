"""Finite read-only interpretation of the pinned public component definition."""
from ._values import Rejection, reject, scalar, jcs, copy_json
from ._schema import CONTRACT, TYPES, validate
from ._digests import digest

REGISTRY = CONTRACT['component_semantics']
DEFINITION = REGISTRY['definition']
D = REGISTRY['definition_digest']
LIMITS = DEFINITION['limits']
CODES = dict(zip(('declaration', 'content', 'reference', 'cycle', 'limit', 'binding', 'adoption', 'presence'),
    ('READ_COMPONENT_DECLARATION_INVALID', 'READ_COMPONENT_CONTENT_INVALID', 'READ_COMPONENT_REFERENCE_INVALID',
     'READ_COMPONENT_GRAPH_CYCLE', 'READ_COMPONENT_LIMIT_EXCEEDED', 'READ_COMPONENT_BINDING_INVALID',
     'READ_COMPONENT_ADOPTION_INVALID', 'READ_METHOD_PRESENCE_INVALID')))


def H(value):
    return digest(jcs(value).encode('utf-8'))


if H(DEFINITION) != D:
    reject('READ_CORE_CAPABILITY_UNAVAILABLE')


def component_semantics_contract():
    return copy_json({'contract_id': DEFINITION['id'], 'contract_version': DEFINITION['version'],
        'definition_digest': D, **{k: DEFINITION[k] for k in ('profiles', 'carriers', 'limits')}})


def failure(kind, judgment=None, component=None):
    code = CODES[kind]
    error = Rejection(code)
    error.component_failure = {'judgment_ref': judgment, 'component_ref': component,
        'status': 'invalid', 'body': None, 'code': code}
    raise error


def decoded(value, kind, judgment=None, component=None):
    tag = value['kind']
    if tag in ('text', 'number', 'boolean'):
        return value['value']
    if tag == 'null':
        return None
    if tag == 'list':
        return [decoded(v, kind, judgment, component) for v in value['items']]
    result = {}
    for field in value['fields']:
        if field['name'] in result:
            failure(kind, judgment, component)
        result[field['name']] = decoded(field['value'], kind, judgment, component)
    return result


def visit_extensions(payload, callback):
    seen = set()
    def walk(value, shape, path):
        if type(value) not in (dict, list) or type(shape) is not dict:
            return
        if '$ref' in shape:
            name = shape['$ref'][8:]
            if name == 'Extension':
                if path not in seen:
                    seen.add(path)
                    callback(value, path)
                return
            walk(value, TYPES[name], path)
            return
        if type(value) is dict:
            for key, child in shape.get('properties', {}).items():
                if key in value:
                    walk(value[key], child, path + (key,))
        if type(value) is list and 'items' in shape:
            for i, item in enumerate(value):
                walk(item, shape['items'], path + (i,))
        for branch in shape.get('oneOf', shape.get('anyOf', [])) + shape.get('allOf', []):
            walk(value, branch, path)
    walk(payload, TYPES['Payload'], ())


def check_native_methods(payload):
    required = {r['term']: r for r in DEFINITION['native_method_requirements']}
    for judgment in payload['judgments']:
        method = judgment.get('method')
        if method is None or 'extension' in method['method']:
            continue
        requirement = required.get(method['method']['term'])
        if requirement is None:
            continue
        if (any(not any(c['method']['term'] == t and 'extension' not in c['method'] for c in method['components']) for t in requirement['component_types'])
                or any(not any(b['role'] == role for b in method['bindings']) for role in requirement['binding_roles'])):
            reject()


TRIM = '\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff'


def text(value, maximum, judgment, component):
    if type(value) is not str or not value or value.strip(TRIM) != value or not scalar(value, maximum):
        failure('content', judgment, component)


def grammar(name, value, kind, judgment=None, component=None):
    try:
        validate(name, value)
    except Rejection:
        failure(kind, judgment, component)


def plain_profile(kind, content, judgment, component):
    j, c = judgment, component
    if type(content) is not dict:
        failure('content', j, c)
    items = content.get('items')
    if type(items) is list and len(items) > LIMITS['items_per_component']:
        failure('limit', j, c)
    if kind == 'taxonomy' and type(content.get('broader')) is list and len(content['broader']) > LIMITS['edges_per_component']:
        failure('limit', j, c)
    if kind == 'discriminator-set' and type(items) is list:
        count = sum(len(i['contrasts']) for i in items if type(i) is dict and type(i.get('contrasts')) is list)
        if count > LIMITS['edges_per_component']:
            failure('limit', j, c)
    grammar({'taxonomy': 'TaxonomyContent', 'candidate-set': 'CandidateSetContent', 'discriminator-set': 'DiscriminatorContent'}[kind], content, 'content', j, c)
    keys = set()
    for item in items:
        if item['key'] in keys:
            failure('content', j, c)
        keys.add(item['key'])
        text(item['title'], LIMITS['title_utf8_bytes'], j, c)
        text(item['prompt' if kind == 'discriminator-set' else 'meaning'], LIMITS['meaning_prompt_criterion_utf8_bytes'], j, c)
    ordered = sorted(copy_json(items), key=lambda x: x['key'].encode())
    if kind == 'taxonomy':
        graph = {item['key']: [] for item in items}
        seen = set()
        for edge in content['broader']:
            a, b = edge['narrowerKey'], edge['broaderKey']
            if a not in keys or b not in keys:
                failure('reference', j, c)
            if a == b:
                failure('cycle', j, c)
            if (a, b) in seen:
                failure('content', j, c)
            seen.add((a, b))
            graph[a].append(b)
        visiting, longest = set(), {}
        def depth(key, ancestors):
            if ancestors > LIMITS['taxonomy_path_edges']:
                failure('limit', j, c)
            if key in visiting:
                failure('cycle', j, c)
            if key in longest:
                return longest[key]
            visiting.add(key)
            value = max((1 + depth(n, ancestors + 1) for n in graph[key]), default=0)
            visiting.remove(key)
            if value > LIMITS['taxonomy_path_edges']:
                failure('limit', j, c)
            longest[key] = value
            return value
        for item in items:
            depth(item['key'], 0)
        return {'kind': kind, 'items': ordered, 'broader': sorted(copy_json(content['broader']), key=lambda x: (x['narrowerKey'].encode(), x['broaderKey'].encode()))}
    if kind == 'candidate-set':
        return {'kind': kind, 'items': ordered}
    for item in items:
        seen = set()
        for contrast in item['contrasts']:
            if contrast['candidateKey'] in seen:
                failure('content', j, c)
            seen.add(contrast['candidateKey'])
            text(contrast['criterion'], LIMITS['meaning_prompt_criterion_utf8_bytes'], j, c)
    return None


def resolve_components(payload):
    check_native_methods(payload)
    selected, presences, all_values = {}, {}, []
    aggregate, total_bytes = None, 0
    seen_presence = set()
    kinds = {carrier['id']: (kind, carrier) for kind, carrier in DEFINITION['carriers'].items()}
    profiles = {p['component_type']: p['profile_id'] for p in DEFINITION['profiles']}
    judgments = payload['judgments']
    if sum(len(j.get('method', {}).get('components', [])) for j in judgments) > LIMITS['components_per_payload']:
        failure('limit')
    for judgment in judgments:
        if 'method' in judgment:
            presences[judgment['id']] = {'components_state': 'declared', 'bindings_state': 'declared'}
    def visit(extension, path):
        nonlocal aggregate, total_bytes
        registered = kinds.get(extension['id'])
        if registered is None:
            if extension['critical']:
                reject('READ_INTERPRETATION_INCOMPLETE')
            return
        kind, carrier = registered
        j_position = len(path) == 4 and path[0] == 'judgments' and path[2] == 'extensions'
        p_position = len(path) == 2 and path[0] == 'extensions'
        judgment = judgments[path[1]] if j_position else None
        j = judgment['id'] if judgment is not None else None
        error_kind = 'declaration' if kind == 'component' else kind
        if not extension['critical'] or extension['definition'] != carrier['definition'] or not (p_position if kind == 'adoption' else j_position):
            failure(error_kind, j)
        value = decoded(extension['value'], error_kind, j)
        if type(value) is not dict:
            failure(error_kind, j)
        if kind == 'presence':
            grammar('MethodPresenceCarrier', value, 'presence', j)
            if ('method' not in judgment or value['judgment_ref'] != j or j in seen_presence
                    or value['components_state'] == value['bindings_state'] == 'declared'):
                failure('presence', j)
            if any(value[k + '_state'] == 'undeclared' and judgment['method'][k] for k in ('components', 'bindings')):
                failure('presence', j)
            seen_presence.add(j)
            presences[j] = {k: value[k] for k in ('components_state', 'bindings_state')}
            return
        if kind == 'adoption':
            grammar('ComponentAdoptionCarrier', value, 'adoption')
            if aggregate is not None:
                failure('adoption')
            aggregate = value
            return
        if 'method' not in judgment or value.get('judgment_ref') != j:
            failure('reference', j)
        component = next((c for c in judgment['method']['components'] if c['id'] == value.get('component_ref')), None)
        if component is None:
            failure('reference', j)
        c = component['id']
        profile = profiles.get(component['method']['term'])
        if (c in selected or 'extension' in component['method'] or profile is None or value.get('component_type') != component['method']['term']
                or value.get('profile_id') != profile or value.get('contract_id') != DEFINITION['id']
                or value.get('contract_version') != DEFINITION['version'] or value.get('definition_digest') != D):
            failure('declaration', j, c)
        try:
            content_bytes = jcs(value['content']).encode('utf-8')
        except (Rejection, KeyError, UnicodeError, ValueError, TypeError, RecursionError):
            failure('content', j, c)
        total_bytes += len(content_bytes)
        if len(content_bytes) > LIMITS['content_canonical_bytes'] or total_bytes > LIMITS['opted_in_total_canonical_bytes']:
            failure('limit', j, c)
        body = plain_profile(component['method']['term'], value['content'], j, c)
        grammar('ComponentSemanticsCarrier', value, 'declaration', j, c)
        if value['content_digest'] != digest(content_bytes):
            failure('binding', j, c)
        if value['statement_origin'] == 'mechanical_content_representation' and component['statement'] != content_bytes.decode('utf-8'):
            failure('declaration', j, c)
        if value['component_declaration_digest'] != H({'component': component, 'statement_origin': value['statement_origin']}):
            failure('binding', j, c)
        bindings = sorted((b for b in judgment['method']['bindings'] if b['component_ref'] == c), key=lambda b: (b['role'].encode(), b['target_ref'].encode()))
        seen = set()
        for binding in bindings:
            key = jcs(binding)
            if binding['target_ref'] != j or key in seen:
                failure('binding', j, c)
            seen.add(key)
        if value['bindings_digest'] != H(bindings):
            failure('binding', j, c)
        selected[c] = {'value': value, 'body': body, 'owner': j}
        all_values.append(value)
    visit_extensions(payload, visit)
    for c, entry in selected.items():
        value, j = entry['value'], entry['owner']
        if value['component_type'] != 'discriminator-set':
            continue
        target = selected.get(value['content']['candidateSetRef'])
        if target is None or target['owner'] != j or target['value']['component_type'] != 'candidate-set':
            failure('reference', j, c)
        keys = {x['key'] for x in target['value']['content']['items']}
        if any(x['candidateKey'] not in keys for item in value['content']['items'] for x in item['contrasts']):
            failure('reference', j, c)
        items = sorted(copy_json(value['content']['items']), key=lambda x: x['key'].encode())
        for item in items:
            item['contrasts'].sort(key=lambda x: x['candidateKey'].encode())
        entry['body'] = {'kind': 'discriminator-set', 'candidateSetRef': value['content']['candidateSetRef'],
            'candidateIndex': [{k: item[k] for k in ('key', 'title')} for item in target['body']['items']], 'items': items}
    if (aggregate is not None) != bool(selected):
        failure('adoption')
    if aggregate is not None:
        all_values.sort(key=lambda x: (x['judgment_ref'].encode(), x['component_ref'].encode()))
        proposals = sorted({x['adoption_proposal_digest'] for x in all_values}, key=lambda x: x.encode())
        if (aggregate['contract_id'] != DEFINITION['id'] or aggregate['contract_version'] != DEFINITION['version']
                or aggregate['definition_digest'] != D or aggregate['declaration_set_digest'] != H(all_values)
                or aggregate['proposal_set_digest'] != H(proposals)):
            failure('adoption')
    methods = {}
    for judgment in judgments:
        if 'method' not in judgment:
            continue
        interpretations = []
        for component in judgment['method']['components']:
            common = {'judgment_ref': judgment['id'], 'component_ref': component['id'],
                'component_type': component['method']['term'], 'definition_digest': D}
            entry = selected.get(component['id'])
            if entry is None:
                interpretations.append({**common, 'status': 'undeclared', **dict.fromkeys(('declaration_digest', 'content_digest', 'profile_id',
                    'component_declaration_digest', 'statement_origin', 'bindings_digest', 'adoption_proposal_digest', 'authored_content', 'body'))})
            else:
                value = entry['value']
                interpretations.append({**common, 'status': 'supported', 'declaration_digest': H(value),
                    **{k: value[k] for k in ('content_digest', 'profile_id', 'component_declaration_digest', 'statement_origin', 'bindings_digest', 'adoption_proposal_digest')},
                    'authored_content': copy_json(value['content']), 'body': entry['body']})
        methods[judgment['id']] = {'declaration': judgment['method'], 'declaration_presence': presences[judgment['id']], 'component_interpretations': interpretations}
    return methods
