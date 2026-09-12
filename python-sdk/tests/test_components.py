import asyncio,json,re,unittest
from pathlib import Path
from kdna import admit_file, inspect_snapshot, component_semantics_contract
from kdna.read import create_trusted_control_provider, create_trusted_host_provider, read_file
from kdna.core._values import jcs, Rejection
from kdna.core._schema import validate

FIXTURES=Path(__file__).resolve().parent/'fixtures'
def normalize(value):
    return re.sub(r'snapshot:[0-9a-f-]{36}', 'snapshot:00000000-0000-0000-0000-000000000000', jcs(value))

class ComponentTests(unittest.TestCase):
    def test_ascii_keys_exclude_line_terminators(self):
        for value in ['shared','a9-','a'*64]:validate('ComponentItemKey',value)
        for value in ['', 'Upper', 'under_score', 'é', 'a'*65, 'shared\n', 'shared\r', 'shared\r\n', 'shared\u2028', 'shared\u2029']:
            with self.subTest(value=repr(value)), self.assertRaises(Rejection):validate('ComponentItemKey',value)

    def test_real_node_containers_and_complete_read_content(self):
        async def run():
            oracle=json.loads((FIXTURES/'component-node-oracles.json').read_text())
            self.assertEqual(normalize(component_semantics_contract()),normalize(oracle['descriptor']))
            for row in oracle['rows']:
                with self.subTest(case=row['name']):
                    p=str(FIXTURES/row['file']); admission=admit_file(p)
                    actual={'status':'accepted','data':inspect_snapshot(admission['snapshot'])} if admission['status']=='accepted' else admission
                    self.assertEqual(normalize(actual),normalize(row['result']))
                    def observe(args):
                        v=inspect_snapshot(args['snapshot']);request=args['request']
                        return dict(host_id='synthetic',host_epoch='test',decision_id='decision:'+request['request_id'],request_id=request['request_id'],snapshot_id=v['snapshot_id'],A=v['digests']['A']['observed'],C=v['digests']['C']['observed'],scope=[n['id'] for n in v['ir']['nodes']],issued_at=1000,expires_at=61000,current_ms=1000,decision='allow',policy_id='synthetic-only')
                    control=create_trusted_control_provider(lambda:dict(admission_response_limit_bytes=4096))
                    host=create_trusted_host_provider(observe)
                    read=await read_file(p,row['request'],control,host);e=read['envelope']
                    actual={'channel':read['channel'],**{k:e[k] for k in ('status','content','states','diagnostics')}}
                    self.assertEqual(normalize(actual),normalize(row['read']))
        asyncio.run(run())
