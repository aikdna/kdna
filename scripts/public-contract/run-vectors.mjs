#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const runtime=process.argv[2],out=process.argv[3];
if(!runtime||!out||!path.isAbsolute(runtime)||!path.isAbsolute(out))throw Error('Usage: node run-vectors.mjs ABSOLUTE_ISOLATED_RUNTIME ABSOLUTE_REPORT');
const seed=JSON.parse(fs.readFileSync(path.join(root,'conformance/public-contract-decision-vectors.json')));
const generated=JSON.parse(fs.readFileSync(path.join(root,'conformance/public-contract/vectors.generated.json')));
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
if(JSON.stringify(canonical(seed))!==JSON.stringify(canonical(generated)))throw Error('Frozen seed or generated vector drift');
function compare(actual,expected,at='$',errors=[]){
 if(Array.isArray(expected)){if(!Array.isArray(actual)||actual.length!==expected.length)errors.push({at,expected,actual});else expected.forEach((x,i)=>compare(actual[i],x,at+'['+i+']',errors));}
 else if(expected&&typeof expected==='object'){if(!actual||typeof actual!=='object')errors.push({at,expected,actual});else for(const [k,v]of Object.entries(expected))compare(actual[k],v,at+'.'+k,errors);}
 else if(actual!==expected)errors.push({at,expected,actual});
 return errors;
}
const start=new Date().toISOString(),rows=[];
for(const vector of seed.vectors){
 const argv=[path.join(root,'conformance/public-contract/test/vector-worker.cjs'),vector.id,runtime];
 const began=new Date().toISOString(),r=spawnSync(process.execPath,argv,{cwd:runtime,encoding:'utf8',timeout:20000,env:{...process.env,NODE_PATH:''}});
 let observed,errors=[];try{if(r.status!==0)throw Error('Worker failed');observed=JSON.parse(r.stdout);errors=compare(observed.observation,vector.expected);}catch(e){errors=[{error:e.message}];}
 rows.push({id:vector.id,status:errors.length?'FAIL':'MATCH',evidence_route:observed?.evidence_route??'worker_failure',started_at:began,ended_at:new Date().toISOString(),command:{executable:process.execPath,argv,cwd:runtime,exit_code:r.status,signal:r.signal},stdout:r.stdout,stderr:r.stderr,expected:vector.expected,observed,errors});
}
const report={format:'kdna.public-runtime-vectors/1',started_at:start,ended_at:new Date().toISOString(),count:rows.length,matched:rows.filter(r=>r.status==='MATCH').length,failed:rows.filter(r=>r.status==='FAIL').length,evidence_routes:Object.fromEntries([...new Set(rows.map(r=>r.evidence_route))].map(route=>[route,rows.filter(r=>r.evidence_route===route).length])),rows};
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({matched:report.matched,failed:report.failed,evidence_routes:report.evidence_routes,failures:rows.filter(r=>r.status==='FAIL').map(r=>({id:r.id,errors:r.errors,stderr:r.stderr}))}));
process.exitCode=report.failed?1:0;
