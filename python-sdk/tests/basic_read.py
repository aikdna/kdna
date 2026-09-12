import asyncio,json,re,sys
from pathlib import Path
T=Path(__file__).resolve().parent

from kdna import inspect_snapshot
from kdna.read import create_trusted_control_provider,create_trusted_host_provider,read_file
from kdna.core._values import jcs
def normalize(x):
    return re.sub(r'snapshot:[0-9a-f-]{36}', 'snapshot:00000000-0000-0000-0000-000000000000',jcs(x))
async def main():
    results=[]
    for row in json.load(open(T/'fixtures/current-node-read.json')):
        c=row['case'];change=c.get('change')
        def observe(args):
            if change=='throw-host':raise ValueError('Expected test failure')
            v=inspect_snapshot(args['snapshot'])
            return {'host_id':'host:parity','host_epoch':'epoch:parity','decision_id':'decision:parity','request_id':args['request']['request_id'],'snapshot_id':v['snapshot_id'],'A':v['digests']['A']['observed'],'C':v['digests']['C']['observed'],'scope':[] if change=='scope' else [n['id'] for n in v['ir']['nodes']],'issued_at':900,'expires_at':1000 if change=='expired' else 2000,'decision':'deny' if change=='deny' else 'allow','policy_id':'policy:parity','current_ms':1000}
        control={} if change=='control-untrusted' else create_trusted_control_provider(lambda:{'admission_response_limit_bytes':4096})
        host={} if change=='untrusted' else create_trusted_host_provider(observe, (lambda value:False) if change=='delivered-false' else None)
        actual=await read_file(str(T/'fixtures'/c['file']),row['request'],control,host)
        match=normalize(actual)==normalize(row['result'])
        print(c['name'],match)
        results.append({'case':c,'match':match,'actual':actual,'expected':row['result']})
    
    assert all(r['match'] for r in results)
asyncio.run(main())
