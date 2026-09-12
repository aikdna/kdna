"""Canonical graph and mandatory closure, derived from the public contract."""
from ._values import reject, jcs, copy_json
from ._digests import digest
from ._schema import TUPLE, TYPES, validate


def unique(items, key='id'):
    result = {}
    for item in items:
        if item[key] in result:
            reject()
        result[item[key]] = item
    return result


def provided(value):
    return value['value'] if value and value.get('state') == 'provided' else []


def bounds(value):
    if value['maximum'] is not None and value['maximum'] < value['minimum']:
        reject()


def result_shape(shape, value):
    kind = shape['kind']
    if kind == 'scalar':
        if value['kind'] != shape['scalar_type']:
            reject()
    elif kind == 'list':
        bounds(shape)
        if value['kind'] != 'list' or len(value['items']) < shape['minimum'] or (shape['maximum'] is not None and len(value['items']) > shape['maximum']):
            reject()
        for item in value['items']:
            result_shape(shape['item_shape'], item)
    else:
        if value['kind'] != 'record':
            reject()
        fields, actual = unique(shape['fields'], 'name'), unique(value['fields'], 'name')
        if any(f['required'] and n not in actual for n, f in fields.items()):
            reject()
        for name, field in actual.items():
            if name not in fields:
                reject()
            result_shape(fields[name]['shape'], field['value'])


def validate_shape(shape):
    if shape['kind'] == 'list':
        bounds(shape)
        validate_shape(shape['item_shape'])
    elif shape['kind'] == 'record':
        unique(shape['fields'], 'name')
        for field in shape['fields']:
            validate_shape(field['shape'])


def build_ir(manifest, payload, entries):
    definitions, nodes, references, catalog, own_nodes, source_nodes = {}, [], [], [], {}, {}
    kinds = [('actor', 'actors'), ('judgment', 'judgments'), ('reason', 'reasons'), ('source', 'sources'), ('source_use', 'source_uses'), ('resource', 'resources'), ('material', 'materials'), ('relationship', 'relationships'), ('dependency', 'dependencies')]
    judgments = payload['judgments']
    declarations = payload.get('declarations', {})
    def register(kind, records):
        for ident, record in unique(records).items():
            if ident in definitions:
                reject()
            definitions[ident] = (kind, record)
    for kind, key in kinds:
        register(kind, payload.get(key, []))
    register('result_contract', [j['result_contract'] for j in judgments])
    register('method_component', [c for j in judgments for c in j.get('method', {}).get('components', [])])
    register('boundary', [*provided(declarations.get('boundaries')), *(b for j in judgments for b in provided(j.get('boundaries')))])
    for kind, key in [('exception', 'exceptions'), ('misuse', 'misuse')]:
        register(kind, [x for j in judgments for x in provided(j.get(key))])
    def require(ident, kind=None):
        d = definitions.get(ident)
        if d is None or kind is not None and d[0] != kind:
            reject()
        return d[1]
    for j in judgments:
        contract = j['result_contract']
        bounds(contract)
        validate_shape(contract['shape'])
        if 'result' in j:
            r = j['result']
            if r['contract_ref'] != contract['id'] or not any(jcs(t) == jcs(r['result_type']) for t in contract['allowed_result_types']):
                reject()
            result_shape(contract['shape'], r['value'])
            n = len(r['value']['items']) if r['value']['kind'] == 'list' else 1
            if n < contract['minimum'] or contract['maximum'] is not None and n > contract['maximum']:
                reject()
        if 'formation_rule' in j and j['formation_rule']['output_contract_ref'] != contract['id']:
            reject()
        for ident in j['subject']['actor_ids']:
            require(ident, 'actor')
        for ident in j.get('reason_refs', []):
            if require(ident, 'reason')['judgment_ref'] != j['id']:
                reject()
        for ident in j.get('material_refs', []):
            require(ident, 'material')
        if 'method' in j:
            components = unique(j['method']['components'])
            for binding in j['method']['bindings']:
                if binding['component_ref'] not in components:
                    reject()
                require(binding['target_ref'])
        for condition in j.get('formation_rule', {}).get('conditions', []):
            c = condition['declaration'] if condition['kind'] == 'external_evaluator' else condition
            if c['kind'] == 'structured':
                for operand in c['operands']:
                    if operand['kind'] == 'dependency' and require(operand['dependency_ref'], 'dependency')['consumer_judgment_ref'] != j['id']:
                        reject()
        for x in provided(j.get('exceptions')):
            if x['boundary_ref'] is not None:
                require(x['boundary_ref'], 'boundary')
    for reason in payload.get('reasons', []):
        require(reason['judgment_ref'], 'judgment')
        for ident in reason['component_refs']:
            require(ident, 'method_component')
    for b in [declarations.get('boundaries'), *(j.get('boundaries') for j in judgments)]:
        for x in provided(b):
            require(x['declared_by'], 'actor')
    for claim in provided(payload.get('attributions')):
        for ident in claim['actor_ids']:
            require(ident, 'actor')
    for material in payload.get('materials', []):
        if material.get('resource_ref'):
            require(material['resource_ref'], 'resource')
        for ident in material['source_refs']:
            require(ident, 'source')
    for resource in payload.get('resources', []):
        if resource['entry'] not in entries or digest(entries[resource['entry']]) != resource['digest']:
            reject()
    for use in payload.get('source_uses', []):
        require(use['source_ref'], 'source')
        require(use['target_ref'], use['target_kind'])
    for relation in payload.get('relationships', []):
        for participant in relation['participants']:
            require(participant['judgment_ref'], 'judgment')
    for dependency in payload.get('dependencies', []):
        require(dependency['consumer_judgment_ref'], 'judgment')
        producer = dependency['producer']
        if producer['kind'] == 'judgment_result':
            if require(producer['judgment_ref'], 'judgment')['result_contract']['id'] != producer['result_contract_ref']:
                reject()
        else:
            require(producer['source_ref'], 'source')
    from ._components import resolve_components
    methods = resolve_components(payload)
    def node_id(role, identity):
        return role + ':' + digest(jcs([payload['asset'], identity]).encode())[7:47]
    def node(role, identity, value, owner=None):
        item = {'id': node_id(role, identity), 'role': role, 'owner_judgment_id': owner, 'value': copy_json(value)}
        nodes.append(item)
        if owner is not None:
            own_nodes.setdefault(owner, []).append(item['id'])
        return item
    asset_declaration = {k: manifest[k] for k in ['title', 'creator', 'license', 'summary', 'description', 'language', 'access'] if k in manifest}
    for k in ('content_risk', 'extensions'):
        if k in payload:
            asset_declaration[k] = payload[k]
    node('asset_declaration', 'asset', asset_declaration)
    node('scope', 'asset-scope', payload['scope'])
    for key, role, identity in [('declarations', 'declaration', 'authored-declarations'), ('cohesion', 'cohesion', 'cohesion'), ('attributions', 'attribution', 'attributions')]:
        if key in payload:
            node(role, identity, payload[key])
    for kind, key in kinds:
        if kind != 'judgment':
            for value in payload.get(key, []):
                source_nodes[value['id']] = node(kind, value['id'], value)
    for j in judgments:
        ident = j['id']
        main = node('judgment', ident, j, ident)
        source_nodes[ident] = main
        catalog.append({'judgment_id': ident, 'label': j.get('label', j['focus']), 'node_ref': main['id']})
        node('subject', ident, j['subject'], ident)
        node('scope', ident, j['scope'], ident)
        c = j['result_contract']
        source_nodes[c['id']] = node('result_contract', c['id'], c, ident)
        for key in ('result', 'formation_rule'):
            if key in j:
                node(key, ident, j[key], ident)
        if 'method' in j:
            m = node('method', ident, methods[ident], ident)
            for c in j['method']['components']:
                source_nodes[c['id']] = m
        for key, role in [('boundaries', 'boundary'), ('exceptions', 'exception'), ('misuse', 'misuse')]:
            for i, x in enumerate(provided(j.get(key))):
                source_nodes[x['id']] = node(role, ident + ':' + str(i), x, ident)
    asset_ids = [n['id'] for n in nodes if n['owner_judgment_id'] is None and n['role'] in ('asset_declaration', 'declaration', 'scope', 'cohesion', 'attribution')]
    declaration_node = next((n for n in nodes if n['role'] == 'declaration' and n['owner_judgment_id'] is None), None)
    for boundary in provided(declarations.get('boundaries')):
        source_nodes[boundary['id']] = declaration_node
    def closed_ids(judgment_id, extra_dependency=None):
        selected, visited = set(asset_ids), set()
        def add(ident):
            if ident in visited:
                return
            visited.add(ident)
            if ident not in definitions or ident not in source_nodes:
                reject()
            kind, r = definitions[ident]
            n = source_nodes[ident]
            selected.add(n['id'])
            if kind == 'judgment':
                selected.update(own_nodes[ident])
                for ref in [*r['subject']['actor_ids'], *r.get('reason_refs', []), *r.get('material_refs', [])]:
                    add(ref)
                add(r['result_contract']['id'])
                for component in r.get('method', {}).get('components', []):
                    add(component['id'])
                for key in ('boundaries', 'exceptions', 'misuse'):
                    for declaration in provided(r.get(key)):
                        add(declaration['id'])
                for binding in r.get('method', {}).get('bindings', []):
                    add(binding['target_ref'])
                for condition in r.get('formation_rule', {}).get('conditions', []):
                    c = condition['declaration'] if condition['kind'] == 'external_evaluator' else condition
                    for operand in c.get('operands', []):
                        if operand['kind'] == 'dependency':
                            add(operand['dependency_ref'])
                for d in payload.get('dependencies', []):
                    if d['consumer_judgment_ref'] == ident and d['required']:
                        add(d['id'])
                for relation in payload.get('relationships', []):
                    if any(p['judgment_ref'] == ident for p in relation['participants']):
                        add(relation['id'])
            elif kind == 'reason':
                add(r['judgment_ref'])
                for ref in r['component_refs']:
                    add(ref)
            elif kind == 'material':
                if r.get('resource_ref'):
                    add(r['resource_ref'])
                for ref in r['source_refs']:
                    add(ref)
            elif kind in ('method_component', 'result_contract'):
                if n['owner_judgment_id'] is not None:
                    add(n['owner_judgment_id'])
            elif kind == 'source_use':
                add(r['source_ref']); add(r['target_ref'])
            elif kind == 'dependency':
                add(r['consumer_judgment_ref'])
                add(r['producer']['judgment_ref'] if r['producer']['kind'] == 'judgment_result' else r['producer']['source_ref'])
            elif kind == 'relationship':
                for p in r['participants']:
                    add(p['judgment_ref'])
            elif kind == 'boundary':
                add(r['declared_by'])
            elif kind == 'exception' and r['boundary_ref'] is not None:
                add(r['boundary_ref'])
            for use in payload.get('source_uses', []):
                if use['target_ref'] == ident:
                    add(use['id'])
        for b in provided(declarations.get('boundaries')):
            add(b['declared_by'])
        for claim in provided(payload.get('attributions')):
            for actor in claim['actor_ids']:
                add(actor)
        add(judgment_id)
        if extra_dependency is not None:
            add(extra_dependency)
        return [n['id'] for n in nodes if n['id'] in selected]
    def selection(ident):
        return {'asset_id': payload['asset']['asset_id'], 'asset_version': payload['asset']['asset_version'], 'judgment_id': ident}
    def reference(source, target, mandatory, role='mandatory_support'):
        if role not in TYPES['ReferenceRole']['enum']:
            reject()
        references.append({'id': node_id('reference', source + '\0' + target + '\0' + role), 'source_node': source, 'target_node': target, 'role': role, 'mandatory': mandatory})
    closures = [{'selection': selection(j['id']), 'node_ids': closed_ids(j['id'])} for j in judgments]
    for closure in closures:
        source = source_nodes[closure['selection']['judgment_id']]['id']
        for ident in closure['node_ids']:
            if source != ident:
                reference(source, ident, True)
    targets = [{'selection': selection(d['consumer_judgment_ref']), 'target': source_nodes[d['id']]['id'], 'scope': closed_ids(d['consumer_judgment_ref'], d['id'])} for d in payload.get('dependencies', []) if not d['required']]
    for target in targets:
        reference(source_nodes[target['selection']['judgment_id']]['id'], target['target'], False, 'optional_expansion')
    return validate('CanonicalIR', {'contract': TUPLE['ir'], 'tuple': TUPLE, 'asset': payload['asset'], 'nodes': nodes, 'catalog': catalog, 'references': references, 'relationships': payload.get('relationships', []), 'mandatory_closures': closures, 'expansion_targets': targets})
