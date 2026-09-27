'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const {versionTuple:tuple,types}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
const {readBrowser}=req('@aikdna/kdna-read/browser'),embed=req('@aikdna/kdna-read/embedding');
const oldTuples=types.UnsupportedVersionTuple.anyOf.map(s=>Object.fromEntries(Object.entries(s.properties).map(([k,v])=>[k,v.const])));
const versionCode=require('../src/admission.js').versionCode;
for(const old of oldTuples)test('complete historical tuple is unsupported despite shared 0.2 axes '+old.core,async()=>{
 assert.equal(versionCode(old),'READ_UNSUPPORTED_VERSION');
 const a=F.blank(tuple),request={...F.candidate(tuple,a),tuple:old};let calls=0;
 const host=embed.createTrustedHostReadProvider({observe(){calls++;throw Error('Version rejection must precede Host');}}),control=embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000}));
 const result=await readBrowser(F.encode(a,req),request,control,host);
 assert.equal(result.envelope.status,'rejected');assert.equal(result.envelope.diagnostics[0].code,'READ_UNSUPPORTED_VERSION');assert.equal(calls,0);assert.equal(result.envelope.content,null);
 const {decidePackageSet}=require(path.join(coreDir,'src/public-contract/package-set.js'));
 assert.equal(decidePackageSet({members:[],tuple:old,selection:request.selection},[],[],'isolated_read',false).diagnostic,'READ_UNSUPPORTED_VERSION');
});
test('current and mixed families retain their distinct meanings',()=>{
 assert.equal(versionCode(tuple),null);
 // R2 historical tuples share current axes. Substituting an unchanged axis is
 // still current; replacing the only old axis can form the exact current tuple.
 const same=(a,b)=>Object.keys(tuple).every(k=>a[k]===b[k]);
 for(const old of oldTuples) for(const candidate of [{...old,read:tuple.read},{...tuple,core:old.core}]) {
  const expected=same(candidate,tuple)?null:oldTuples.some(h=>same(h,candidate))?'READ_UNSUPPORTED_VERSION':'READ_MIXED_VERSION_TUPLE';
  assert.equal(versionCode(candidate),expected,JSON.stringify(candidate));
 }
 assert.equal(versionCode({...tuple,core:'kdna.core/0.8.0',read:'kdna.read/0.6.2'}),'READ_MIXED_VERSION_TUPLE');
 assert.equal(versionCode({...tuple,host:'kdna.agent-host/9.0.0'}),'READ_MIXED_VERSION_TUPLE');
});
