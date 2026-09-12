import asyncio,copy,json,pathlib,re,sys
T=pathlib.Path(__file__).resolve().parent

from kdna.core import admit_file,inspect_snapshot
from kdna.read import create_trusted_control_provider,create_trusted_host_provider,read_snapshot
from kdna.core._values import jcs
from kdna.core._schema import TUPLE

def norm(value):return re.sub(r'snapshot:[0-9a-f-]{36}','snapshot:00000000-0000-0000-0000-000000000000',jcs(value))
def outcome(result):
    e=result.get('envelope')
    return ('ready' if e['status']=='ready' else e['diagnostics'][0]['code']) if e else result['channel']

async def main():
    results=[]
    expected=json.load(open(T/'fixtures/current-scenario-node-rc2.json'))
    for scenario in json.load(open(T/'fixtures/read-scenarios.json')):
        file=str(T/'fixtures'/scenario['file']);snapshot=admit_file(file)['snapshot']
        last_handle=None;last_budget=0;prior={};calls=0;step={}
        def observe(args):
            nonlocal calls
            calls+=1;v=inspect_snapshot(args['snapshot'])
            omit=step.get('second_drop_roles',step.get('drop_roles',[])) if calls%2==0 else step.get('drop_roles',[])
            scope=[n['id'] for n in v['ir']['nodes'] if n['role'] not in omit]
            if step.get('mandatory_only'):scope=next(c['node_ids'] for c in v['ir']['mandatory_closures'] if c['selection']['judgment_id']=='j:0')
            return dict(host_id='host:scenario',host_epoch='epoch:scenario',decision_id='decision:scenario',request_id=args['request']['request_id'],snapshot_id=v['snapshot_id'],A=v['digests']['A']['observed'],C=v['digests']['C']['observed'],scope=scope,issued_at=900,expires_at=2000,decision='allow',policy_id='policy:scenario',current_ms=1000)|step.get('host',{})|(step.get('second',{}) if calls%2==0 else {})
        def deliver(result):
            nonlocal last_handle
            handles=((result.get('envelope') or {}).get('content') or {}).get('expansion_handles',[])
            if handles:last_handle=handles[0]
            return step.get('delivery') is not False
        host=create_trusted_host_provider(observe,deliver)
        for step in scenario['steps']:
            calls=0;mode=step.get('mode','exact_selection');b=step.get('budget')
            selection=dict(asset_id='asset:bytes',asset_version='1.0.0',judgment_id='j:0')|step.get('selection_change',{})
            request=dict(request_id='request:scenario',tuple=TUPLE|step.get('tuple_change',{}),budget_bytes=b if type(b) in (int,float) else last_budget-1 if b=='minus_one' else 1000000,mode=mode,selection=None if mode in ('whole_asset','catalog') else selection,handle=(copy.deepcopy(last_handle)|step.get('handle_change',{})) if mode=='expand' else None)|step.get('request_change',{})
            control=create_trusted_control_provider(lambda:step.get('control',{'admission_response_limit_bytes':4096}))
            current=admit_file(file)['snapshot'] if step.get('new_snapshot') else snapshot
            attempts=[]
            for _ in range(8):
                actual=await read_snapshot(current,request,control,host);attempts.append(dict(request=copy.deepcopy(request),result=actual))
                if b!='fixed_point':break
                required=int(actual['envelope']['budget']['required_bytes'])
                if required==request['budget_bytes'] and outcome(actual)=='ready':last_budget=required;break
                request=request|{'budget_bytes':required}
            assert outcome(actual)==step['expect'],(scenario['name'],step['name'],actual)
            if 'calls' in step:assert calls==step['calls']
            envelope=actual.get('envelope')
            if envelope:
                assert len(jcs(envelope).encode())==int(envelope['budget']['actual_bytes'])<=envelope['budget']['limit_bytes']
                assert envelope['states']['action_authorization']=='not_evaluated'
            content=(envelope or {}).get('content')
            if outcome(actual)!='ready':assert content is None
            for role in step.get('required_roles',[]):assert any(n['role']==role for n in content['closure'])
            if 'owners' in step:assert [n['value']['id'] for n in content['closure'] if n['role']=='judgment']==step['owners']
            if 'handles' in step:assert len(content['expansion_handles'])==step['handles']
            if 'same_content_as' in step:assert content==prior[step['same_content_as']]
            prior[step['name']]=content
            result=dict(scenario=scenario['name'],step=step['name'],calls=calls,attempts=attempts,result=actual)
            result['matched']=norm(result)==norm(expected[len(results)])
            results.append(result)
    
    failures=[(r['scenario'],r['step']) for r in results if not r['matched']]
    print(json.dumps(dict(scenarios=8,steps=len(results),attempts=sum(len(r['attempts']) for r in results),matches=len(results)-len(failures),failures=failures)))
    assert not failures
asyncio.run(main())
