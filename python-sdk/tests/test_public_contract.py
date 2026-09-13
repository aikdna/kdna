import asyncio
import json
from pathlib import Path
import re
import struct
import subprocess
import sys
import unittest

from kdna import admit_bytes, admit_file, inspect_snapshot, plan_capability, version_tuple
from kdna.core._values import jcs, number_text
from kdna.read import admit_read_request, create_trusted_control_provider, project, read_snapshot

ROOT = Path(__file__).resolve().parent
FIXTURES = ROOT / 'fixtures'

def normalize(value):
    return re.sub(r'snapshot:[0-9a-f-]{36}', 'snapshot:00000000-0000-0000-0000-000000000000', jcs(value))

class PublicContractTests(unittest.TestCase):
    def test_binary64_canonical_spelling(self):
        rows = json.loads((FIXTURES / 'number-oracle.json').read_text())
        self.assertEqual(len(rows), 2066)
        for row in rows:
            with self.subTest(bits=row['bits']):
                value = struct.unpack('>d', bytes.fromhex(row['bits']))[0]
                self.assertEqual(number_text(value), row['expected'])

    def test_real_container_parity(self):
        total = 0
        for expected_file in ['current-fresh-node-core.json', 'current-json-node-frozen.json']:
            for row in json.loads((FIXTURES / expected_file).read_text()):
                with self.subTest(case=row['name']):
                    result = admit_file(str(FIXTURES / row['file']))
                    actual = {'status': 'accepted', 'data': inspect_snapshot(result['snapshot'])} if result['status'] == 'accepted' else result
                    self.assertEqual(normalize(actual), normalize(row['result']))
                    total += 1
        self.assertEqual(total, 193)

    def test_snapshot_is_process_local_and_defensively_copied(self):
        raw = bytearray((FIXTURES / 'scale-1.kdna').read_bytes())
        first = admit_bytes(raw)['snapshot']
        before = inspect_snapshot(first)
        raw[:] = b'not a container'
        view = inspect_snapshot(first)
        view['asset']['asset_id'] = 'forged'
        view['ir']['nodes'].clear()
        self.assertEqual(before, inspect_snapshot(first))
        self.assertIsNone(inspect_snapshot(before))
        self.assertIsNone(inspect_snapshot(object()))
        second = admit_file(str(FIXTURES / 'scale-1.kdna'))['snapshot']
        self.assertNotEqual(before['snapshot_id'], inspect_snapshot(second)['snapshot_id'])
        self.assertEqual(before['digests'], inspect_snapshot(second)['digests'])
        self.assertEqual(admit_bytes({})['reason'], 'READ_INPUT_INVALID')
        self.assertEqual(admit_file(None)['reason'], 'READ_INPUT_INVALID')

    def test_projection_and_adapter_keep_authority_boundaries(self):
        request = dict(request_id='request:boundary', tuple=version_tuple(), budget_bytes=1000000,
                       mode='catalog', selection=None, handle=None)
        control = create_trusted_control_provider(lambda: {'admission_response_limit_bytes':4096})
        admitted = admit_read_request(request, control)['admitted_request']
        self.assertEqual(project(admitted, {})['diagnostics'][0]['code'], 'READ_SNAPSHOT_UNATTESTED')
        result = asyncio.run(read_snapshot({}, request, control, {}))
        self.assertEqual(result['envelope']['diagnostics'][0]['code'], 'READ_INPUT_INVALID')
        self.assertIsNone(result['envelope']['content'])
        self.assertEqual(result['envelope']['states']['action_authorization'], 'not_evaluated')
        self.assertEqual(project({}, {})['diagnostics'][0]['code'], 'READ_INPUT_INVALID')
        self.assertEqual(plan_capability(), dict(status='unavailable',code='KDNA_PLAN_ADMISSION_UNAVAILABLE',
                                                action_authorized=False,creation_accepted=False))
        import kdna
        for legacy in ['load','pack','KDNA','parse','execute','load_plan']:
            self.assertFalse(hasattr(kdna, legacy), legacy)

    def test_basic_read_parity_in_fresh_process(self):
        subprocess.run([sys.executable, '-I', '-B', '-c', "import runpy,sys;sys.path.insert(0,sys.argv[2]);runpy.run_path(sys.argv[1],run_name='__main__')", str(ROOT / 'basic_read.py'), str(Path(__import__('kdna').__file__).parent.parent)], check=True)

    def test_read_scenarios_in_fresh_process(self):
        subprocess.run([sys.executable, '-I', '-B', '-c', "import runpy,sys;sys.path.insert(0,sys.argv[2]);runpy.run_path(sys.argv[1],run_name='__main__')", str(ROOT / 'scenarios.py'), str(Path(__import__('kdna').__file__).parent.parent)], check=True)

if __name__ == '__main__':
    unittest.main()
