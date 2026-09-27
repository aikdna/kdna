'use strict';
const test=require('node:test'),path=require('node:path');
const H=require('../../kdna-core/test/protection-test-helpers.js');
const {assert,req,F,tuple,asset}=H;
const readDir=path.dirname(req.resolve('@aikdna/kdna-read/package.json'));
const omission=require(path.join(readDir,'src/omissions.js'));
const Ajv=require('ajv/dist/2020'),schema=require(path.join(readDir,'schema/read-contract-'+tuple.read.split('/').at(-1)+'.schema.json'));
const ajv=new Ajv({strict:false,validateFormats:false});
const validEntry=ajv.compile({$defs:schema.$defs,$ref:'#/$defs/Omission'}),validRecord=ajv.compile({$defs:schema.$defs,$ref:'#/$defs/OmissionRecord'});

for(const [label,issued,expires,current,code] of [
 ['exactly one hour',1000,3601000,1001,null],
 ['one hour plus one millisecond',1000,3601001,1001,'READ_HOST_CONTEXT_UNTRUSTED'],
 ['zero duration',1000,1000,1000,'READ_HOST_CONTEXT_UNTRUSTED'],
 ['negative duration',1001,1000,1000,'READ_HOST_CONTEXT_UNTRUSTED'],
 ['valid one millisecond',1000,1001,1000,null],
 ['exact expiry',1000,1001,1001,'READ_HOST_CONTEXT_EXPIRED'],
 ['before issuance',1000,2000,999,'READ_HOST_TIME_INVALID']
])test('Host lifetime boundary '+label+' reaches the actual public Read gate',async()=>{
 const a=asset(),bytes=F.encode(a,req);assert.equal(req('@aikdna/kdna-core').admitBytes(bytes).status,'accepted');let observed=0,delivered=0,deliveredBodies=0;
 const host=H.embed.createTrustedHostReadProvider({observe({request,snapshot}){observed++;const v=H.boundary.inspectSnapshot(snapshot);return {host_id:'host:window',host_epoch:'epoch:one',decision_id:'decision:'+observed,request_id:request.request_id,snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:v.ir.nodes.map(n=>n.id),issued_at:issued,expires_at:expires,current_ms:current,decision:'allow',policy_id:'policy:window'};},deliver(result){delivered++;if(result.envelope?.content!==null&&result.envelope?.content!==undefined)deliveredBodies++;return true;}});
 const got=await req('@aikdna/kdna-read/node').readNode(bytes,F.candidate(tuple,a),H.control(),host);
 assert.ok(observed>0);assert.equal(got.envelope.status,code?'rejected':'ready',JSON.stringify(got));
 if(code){assert.equal(got.envelope.diagnostics[0].code,code);assert.equal(got.envelope.content,null);assert.equal(deliveredBodies,0);}
 else assert.equal(deliveredBodies,1);
 // Ordinary Read delivers body-free rejection observations through its callback.
 assert.equal(delivered,1);
});

test('folding conserves complete keys and retains entries that cannot form a legal batch',()=>{
 const groups=[
  {field:'material',reason:'not_in_mode',expandable:false,handle_id:null},
  {field:'material',reason:'outside_selection',expandable:false,handle_id:null},
  {field:'reason',reason:'not_in_mode',expandable:false,handle_id:null},
  {field:'material',reason:'not_in_mode',expandable:true,handle_id:'handle:one'},
  {field:'material',reason:'not_in_mode',expandable:true,handle_id:'handle:two'},
  {field:'material',reason:'not_in_mode',expandable:false,handle_id:'null'},
  {field:'material',reason:'not_in_mode',expandable:true,handle_id:null}
 ];
 const first=groups.map((g,i)=>({state:'explicitly_omitted',target:'first:'+i,...g}));
 const second=groups.map((g,i)=>({state:'explicitly_omitted',target:'second:'+i,...g}));
 const rows=[...first,...second],before=structuredClone(rows);
 for(const row of rows)assert.equal(validEntry(row),true,JSON.stringify(validEntry.errors));
 const folded=omission.foldOmissions(rows,true);
 assert.deepEqual(rows,before);assert.equal(folded.length,9);
 for(const row of folded)assert.equal(validRecord(row),true,JSON.stringify(validRecord.errors));
 assert.deepEqual(folded,[...groups.slice(0,5).map(g=>({state:'explicitly_omitted_batch',target_kind:g.field,...g,count:2})),first[5],first[6],second[5],second[6]]);
 assert.equal(folded.reduce((n,r)=>n+(r.count??1),0),rows.length);assert.equal(omission.foldOmissions(rows,false),rows);
});

test('each registered omission target kind conserves count and defensive non-omission values remain separate',()=>{
 const rows=omission.TARGET_KINDS.flatMap(kind=>[0,1].map(i=>({state:'explicitly_omitted',target:kind+':'+i,field:kind,reason:'not_in_mode',expandable:false,handle_id:null})));
 const folded=omission.foldOmissions(rows,true);assert.equal(folded.length,omission.TARGET_KINDS.length);
 for(const [i,kind] of omission.TARGET_KINDS.entries()){assert.deepEqual(folded[i],{state:'explicitly_omitted_batch',target_kind:kind,field:kind,reason:'not_in_mode',count:2,expandable:false,handle_id:null});assert.equal(validRecord(folded[i]),true,JSON.stringify(validRecord.errors));}
 // These defensive inputs are not claimed to form a valid Read Omission array.
 // Missing and authored-unprovided states belong to their own public carriers.
 const missing={state:'missing',target:'m',field:'material',reason:'not_in_mode',expandable:false,handle_id:null},unprovided={state:'unprovided'};
 const mixed=omission.foldOmissions([rows[0],missing,unprovided,rows[1]],true);
 assert.equal(mixed.length,3);assert.equal(mixed[0].count,2);assert.equal(mixed[1],missing);assert.equal(mixed[2],unprovided);
});
