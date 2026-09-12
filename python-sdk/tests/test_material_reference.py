"""Public material-reference regression on synthetic containers, not private IR calls."""
import asyncio
import json
from pathlib import Path
import re
import unittest
import subprocess
import sys

from kdna import admit_bytes, inspect_snapshot
from kdna.read import create_trusted_control_provider, create_trusted_host_provider, read_bytes

FIXTURES = Path(__file__).resolve().parent / 'fixtures/material-reference'

def normalized(value):
    if isinstance(value, dict):
        return {k: normalized(v) for k, v in value.items()}
    if isinstance(value, list):
        return [normalized(v) for v in value]
    if isinstance(value, str):
        return re.sub(r'snapshot:[0-9a-f-]{36}', 'snapshot:00000000-0000-0000-0000-000000000000', value)
    return value

async def inspect_case(data, row):
    admission = admit_bytes(data)
    actual = {'status': 'accepted', 'data': inspect_snapshot(admission['snapshot'])} if admission['status'] == 'accepted' else admission
    if normalized(actual) != normalized(row['core']):
        raise AssertionError(('full Core/IR mismatch', row['name'], actual['status']))
    control = create_trusted_control_provider(lambda: {'admission_response_limit_bytes': 4096})
    def observe(arguments):
        view = inspect_snapshot(arguments['snapshot'])
        request = arguments['request']
        return dict(host_id='host:material-reference', host_epoch='epoch:material-reference',
                    decision_id='decision:' + request['request_id'], request_id=request['request_id'],
                    snapshot_id=view['snapshot_id'], A=view['digests']['A']['observed'], C=view['digests']['C']['observed'],
                    scope=[n['id'] for n in view['ir']['nodes']], issued_at=1000, expires_at=61000,
                    current_ms=1000, decision='allow', policy_id='policy:synthetic-read-only')
    host = create_trusted_host_provider(observe)
    results = []
    for expected in row['reads']:
        result = await read_bytes(data, expected['request'], control, host)
        if normalized(result) != normalized(expected['result']):
            raise AssertionError(('full Read envelope mismatch', row['name'], expected['request']['request_id']))
        results.append(result)
    return {'core': actual, 'reads': results}

class MaterialReferenceTests(unittest.TestCase):
    def test_optional_statement_and_strict_present_reference(self):
        # The public receipt sequence is process-local and affects exact wire budget.
        # Use a fresh process like the reference producer, without rewriting either.
        subprocess.run([sys.executable, '-I', '-B', '-c',
                        "import runpy,sys;sys.path.insert(0,sys.argv[2]);sys.argv=[sys.argv[1],'--fixture-worker'];runpy.run_path(sys.argv[0],run_name='__main__')",
                        str(Path(__file__)), str(Path(__import__('kdna').__file__).parent.parent)], check=True)

    def _check_optional_statement_and_strict_present_reference(self):
        rows = json.loads((FIXTURES / 'node-oracle.json').read_text())['rows']
        for row in rows:
            with self.subTest(case=row['name']):
                actual = asyncio.run(inspect_case((FIXTURES / row['file']).read_bytes(), row))
                if row['name'] == 'synthetic-statement-only':
                    materials = [n['value'] for n in actual['core']['data']['ir']['nodes'] if n['role'] == 'material']
                    self.assertTrue(materials)
                    self.assertTrue(all('resource_ref' not in m for m in materials))
                if row['name'] == 'synthetic-resource-only':
                    roles = {n['role'] for n in actual['reads'][0]['envelope']['content']['closure']}
                    self.assertIn('material', roles)
                    self.assertIn('resource', roles)

if __name__ == '__main__':
    if sys.argv[1:] == ['--fixture-worker']:
        MaterialReferenceTests()._check_optional_statement_and_strict_present_reference()
    else:
        unittest.main()
