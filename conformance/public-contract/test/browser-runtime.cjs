'use strict';

// Test tooling only: bundles the installed public modules unchanged, then runs
// local File.arrayBuffer inputs in actual Playwright Chromium and WebKit.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),{createRequire,isBuiltin}=require('node:module'),{deflateRawSync}=require('node:zlib');
const F=require('./bytes-fixtures.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function literals(source){
  const tokens=[];let i=0;
  while(i<source.length){
    const c=source[i];
    if(/\s/.test(c)){i++;continue;}
    if(c==='/'&&source[i+1]==='/'){i=source.indexOf('\n',i+2);if(i<0)break;continue;}
    if(c==='/'&&source[i+1]==='*'){const end=source.indexOf('*/',i+2);if(end<0)throw Error('Unclosed comment');i=end+2;continue;}
    if(c==='"'||c==="'"||c==='`'){
      const quote=c;let value='';i++;
      while(i<source.length&&source[i]!==quote){if(source[i]==='\\'){value+=source.slice(i,i+2);i+=2;}else value+=source[i++];}
      i++;tokens.push({kind:quote==='`'?'template':'string',value});continue;
    }
    if(/[A-Za-z_$]/.test(c)){let value=c;i++;while(i<source.length&&/[\w$]/.test(source[i]))value+=source[i++];tokens.push({kind:'identifier',value});continue;}
    tokens.push({kind:'punctuation',value:c});i++;
  }
  const result=[];
  for(let n=0;n<tokens.length-3;n++)if(tokens[n].kind==='identifier'&&tokens[n].value==='require'&&tokens[n+1].value==='('&&tokens[n+2].kind==='string'&&tokens[n+3].value===')')result.push(tokens[n+2].value);
  return [...new Set(result)];
}
function bundle(runtime,out,extraEntries=[]){
  const base=fs.realpathSync(runtime),modules=[],ids=new Map(),edges=[];
  function file(p){for(const q of [p,p+'.js',p+'.cjs',p+'.json',path.join(p,'index.js')])if(fs.existsSync(q)&&fs.statSync(q).isFile())return fs.realpathSync(q);throw Error('Unresolved file '+p);}
  function condition(v){
    if(typeof v==='string')return v;
    if(Array.isArray(v)){for(const item of v){const r=condition(item);if(r)return r;}return null;}
    if(v&&typeof v==='object')for(const k of ['browser','require','default'])if(Object.hasOwn(v,k)){const r=condition(v[k]);if(r)return r;}
    return null;
  }
  function resolve(spec,from){
    assert.ok(!isBuiltin(spec)&&!spec.startsWith('node:'),'Node builtin in browser graph: '+spec);
    let result;
    if(spec.startsWith('.'))result=file(path.resolve(path.dirname(from),spec));
    else {
      const parts=spec.split('/'),name=parts.splice(0,spec.startsWith('@')?2:1).join('/'),sub=parts.length?'./'+parts.join('/') :'.';
      let dir=path.dirname(from),pkg;
      while(dir===base||dir.startsWith(base+path.sep)){
        const candidate=path.join(dir,'node_modules',name,'package.json');if(fs.existsSync(candidate)){pkg=candidate;break;}
        const parent=path.dirname(dir);if(parent===dir)break;dir=parent;
      }
      assert.ok(pkg,'Dependency outside isolated runtime: '+spec+' from '+from);
      const meta=JSON.parse(fs.readFileSync(pkg,'utf8'));let target;
      if(meta.exports){
        if(typeof meta.exports==='string'||Array.isArray(meta.exports)||!Object.keys(meta.exports).some(k=>k.startsWith('.')))target=sub==='.'?condition(meta.exports):null;
        else {target=condition(meta.exports[sub]);if(!target)for(const [pattern,value]of Object.entries(meta.exports))if(pattern.includes('*')){const [a,b]=pattern.split('*');if(sub.startsWith(a)&&sub.endsWith(b)){const selected=condition(value);if(selected)target=selected.replaceAll('*',sub.slice(a.length,b? -b.length:undefined));}}}
        assert.ok(target,'No browser/CommonJS export: '+spec);
      }else target=sub==='.'?(typeof meta.browser==='string'?meta.browser:meta.main??'index.js'):sub;
      result=file(path.resolve(path.dirname(pkg),target));
    }
    assert.ok(result.startsWith(base+path.sep),'Browser module escaped runtime: '+result);return result;
  }
  function add(filename){
    if(ids.has(filename))return ids.get(filename);
    const id=modules.length;ids.set(filename,id);const bytes=fs.readFileSync(filename),source=bytes.toString('utf8'),row={id,path:filename,bytes:bytes.length,sha256:sha(bytes),dependencies:{},source};modules.push(row);
    const specs=filename.endsWith('.json')?[]:literals(source);
    if(filename.endsWith('/kdna-core/src/public-contract/validate.js'))specs.push('../../schema/manifest-0.2.schema.json','../../schema/payload-profile-0.2.schema.json','../../schema/canonical-ir-0.1.schema.json');
    for(const spec of [...new Set(specs)]){const target=resolve(spec,filename);row.dependencies[spec]=add(target);edges.push({from:filename,spec,to:target});}
    return id;
  }
  const from=path.join(base,'entry.cjs'),entries={};
  for(const spec of ['@aikdna/kdna-core','@aikdna/kdna-core/browser','@aikdna/kdna-core/read-boundary','@aikdna/kdna-read','@aikdna/kdna-read/browser','@aikdna/kdna-read/embedding',...extraEntries])entries[spec]=add(resolve(spec,from));
  const code=`'use strict';\n(()=>{const factories=[${modules.map(m=>`function(require,module,exports){\n${m.path.endsWith('.json')?'module.exports='+m.source+';':m.source}\n}`).join(',\n')}];const dependencies=${JSON.stringify(modules.map(m=>m.dependencies))};const entries=${JSON.stringify(entries)};globalThis.createKDNA=()=>{const cache={};function load(id){if(cache[id])return cache[id].exports;const module={exports:{}};cache[id]=module;factories[id](spec=>{if(!Object.hasOwn(dependencies[id],spec))throw Error('Unbundled dependency');return load(dependencies[id][spec]);},module,module.exports);return module.exports;}return {transport:entries['@aikdna/kdna-read/transport']===undefined?null:load(entries['@aikdna/kdna-read/transport']).admitReadTransportResponse,core:load(entries['@aikdna/kdna-core']),boundary:load(entries['@aikdna/kdna-core/read-boundary']),readRoot:load(entries['@aikdna/kdna-read']),embed:load(entries['@aikdna/kdna-read/embedding']),admit:load(entries['@aikdna/kdna-core/browser']).admitBrowser,read:load(entries['@aikdna/kdna-read/browser']).readBrowser,readBytes:load(entries['@aikdna/kdna-read/browser']).readBrowser};};})();\n`;
  fs.writeFileSync(out,code);return {path:out,bytes:Buffer.byteLength(code),sha256:sha(code),modules:modules.map(({source,...row})=>row),edges,node_builtins:[],dynamic_require_context:'Only the three existing validate.js schema mirrors; unchanged module sources'};
}
function zipRows(rows){
  let offset=0;const locals=[],centrals=[];
  for(const row of rows){
    const name=Buffer.from(row.name),body=Buffer.from(row.body),method=row.method??0,encoded=row.encoded??(method===8?deflateRawSync(body):body),size=row.size??body.length,crc=row.crc??F.crc(body),flags=row.flags??0x800;
    const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(flags,6);local.writeUInt16LE(method,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(encoded.length,18);local.writeUInt32LE(size,22);local.writeUInt16LE(name.length,26);locals.push(local,name,encoded);
    const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(flags,8);central.writeUInt16LE(method,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(encoded.length,20);central.writeUInt32LE(size,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);centrals.push(central,name);offset+=local.length+name.length+encoded.length;
  }
  const central=Buffer.concat(centrals),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(rows.length,8);end.writeUInt16LE(rows.length,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,central,end]);
}
function numericDigestOracle(manifest,payload){
  // Independent fixture framing with Node crypto, using the authored fixture
  // entries directly. No product digest module or container parser is called.
  const canonical=v=>v&&typeof v==='object'?(Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}'):JSON.stringify(v);
  const word=(n,size)=>{const b=Buffer.alloc(size);if(size===4)b.writeUInt32BE(n);else b.writeBigUInt64BE(BigInt(n));return b;};
  const rawManifest=Buffer.from(JSON.stringify(manifest)),canonicalManifest=Buffer.from(canonical(manifest));
  const entries={'mimetype':Buffer.from('application/vnd.kdna.asset'),'kdna.json':rawManifest,'payload.kdnab':payload};
  const hash=(content,names)=>{
    const chunks=[Buffer.from(content?'KDNA-CONTENT-TREE\0'+'0.2.0\0':'KDNA-RUNTIME-ENTRY-SET\0'+'0.2.0\0'),word(names.length,4)];
    for(const name of names){const nameBytes=Buffer.from(name),body=content&&name==='kdna.json'?canonicalManifest:entries[name];chunks.push(word(nameBytes.length,4),nameBytes);if(content)chunks.push(Buffer.from([name==='kdna.json'?0:1]));chunks.push(word(body.length,8),body);}
    return 'sha256:'+sha(Buffer.concat(chunks));
  };
  return {C:hash(true,['kdna.json','mimetype','payload.kdnab']),E:hash(false,['kdna.json','payload.kdnab'])};
}
function fixtures(runtime,out){
  const {req,coreDir}=F.runtime(runtime),tuple=req(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple,asset=F.blank(tuple,3),p=asset.payload;
  p.actors=[{id:'actor:boundary',kind:'person',name:'Boundary author'}];
  p.judgments[2].boundaries={state:'provided',value:[{id:'boundary:required',effect:'limit',statement:'Required qualification',declared_by:'actor:boundary'}]};
  p.judgments[0].exceptions={state:'provided',value:[{id:'exception:selected',statement:'Authored exception',boundary_ref:'boundary:required'}]};
  p.dependencies=[{id:'dependency:optional',producer:{kind:'judgment_result',judgment_ref:'j:1',result_contract_ref:'result-contract:1'},consumer_judgment_ref:'j:0',input_role:'context',data_type:{term:'text'},required:false,purpose:'Optional supporting judgment'}];
  const rows=[],add=(id,bytes,expected='rejected')=>{const filename=path.join(out,id+'.kdna');fs.writeFileSync(filename,bytes);rows.push({id,path:filename,bytes:bytes.length,sha256:sha(bytes),expected,expected_reason:expected==='accepted'?null:id.startsWith('unsupported-')?'READ_CORE_CAPABILITY_UNAVAILABLE':'READ_CORE_INVALID'});};
  add('stored',F.encode(asset,req),'accepted');add('deflate',F.encode(asset,req,{deflate:true}),'accepted');
  const large=structuredClone(asset);let seed=0x12345678;const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  large.payload.judgments[0].result.value.value=Array.from({length:65537},()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return alphabet[(seed>>>0)%alphabet.length];}).join('');
  add('deflate-multiple-output-chunks',F.encode(large,req,{deflate:true}),'accepted');
  const {Encoder}=req('cbor-x/index-no-eval'),encoded=new Encoder({useRecords:false,mapsAsObjects:true,structuredClone:false}).encode(p);
  const basic=[{name:'mimetype',body:Buffer.from('application/vnd.kdna.asset')},{name:'kdna.json',body:Buffer.from(JSON.stringify(asset.manifest))},{name:'payload.kdnab',body:encoded}];
  add('malformed-zip',Buffer.alloc(100));add('malformed-cbor',F.encode(asset,req,{rawPayload:Buffer.from([0xa1,0x61,0x78])}));add('duplicate-cbor',F.encode(asset,req,{rawPayload:Buffer.from('a2616101616102','hex')}));
  add('path-traversal',zipRows([...basic,{name:'attachments/../escape',body:Buffer.from('x')}]));add('duplicate-entry',zipRows([...basic,basic[2]]));add('missing-payload',zipRows(basic.slice(0,2)));
  add('unsupported-method',zipRows(basic.map((r,i)=>i===2?{...r,method:99}:r)));
  add('crc-mismatch',zipRows(basic.map((r,i)=>i===2?{...r,crc:(F.crc(r.body)^1)>>>0}:r)));
  add('encrypted-entry',zipRows(basic.map((r,i)=>i===2?{...r,flags:0x801}:r)));
  add('container-limit',Buffer.alloc(25*1024*1024+1));
  add('entry-limit',zipRows([...basic,{name:'attachments/large',body:Buffer.from('x'),size:5*1024*1024+1}]));
  add('total-limit',zipRows([...basic,...Array.from({length:3},(_,i)=>({name:'attachments/total'+i,body:Buffer.alloc(4*1024*1024)}))]));
  add('entry-count',zipRows([...basic,...Array.from({length:126},(_,i)=>({name:'attachments/count'+i,body:Buffer.alloc(0)}))]));
  add('ratio-limit',zipRows([...basic,{name:'attachments/ratio',body:Buffer.alloc(400000),method:8}]));
  add('hidden-inflate-overflow',zipRows([...basic,{name:'attachments/hidden',body:Buffer.alloc(5*1024*1024+1),method:8,size:1}]));
  add('truncated-deflate',zipRows(basic.map((r,i)=>i===2?{...r,method:8,encoded:deflateRawSync(r.body).subarray(0,-2)}:r)));
  add('missing-runtime-entry',F.encode({...asset,manifest:{...asset.manifest,runtime:{mandatory_entries:['attachments/missing']}}},req));
  add('unsupported-signature',F.encode(asset,req,{entries:{'signature.kdsig':Buffer.from('signature profile unavailable')}}));
  add('unsupported-checksums',F.encode(asset,req,{entries:{'checksums.json':Buffer.from('{}')}}));
  add('invalid-encryption-declaration',F.encode({...asset,manifest:{...asset.manifest,payload:{...asset.manifest.payload,encrypted:true}}},req));
  add('unsupported-encryption',F.encode({...asset,manifest:{...asset.manifest,payload:{...asset.manifest.payload,encrypted:true},encryption:{profile:'unsupported:encryption',profile_version:'1',encrypted_entries:['payload.kdnab']}}},req));
  const encoder=new Encoder({useRecords:false,mapsAsObjects:true,structuredClone:false}),marker='CBOR_NUMERIC_TOKEN',markerBytes=Buffer.from(encoder.encode(marker));
  function numeric(id,token,expectedValue,{accepted=true,uint=false}={}){
    const a=structuredClone(asset),j=a.payload.judgments[0];
    if(uint)j.result_contract.maximum=marker;
    else {j.result_contract.shape={kind:'scalar',scalar_type:'number'};j.result.value={kind:'number',value:marker};}
    const raw=Buffer.from(encoder.encode(a.payload)),at=raw.indexOf(markerBytes);assert.ok(at>=0&&raw.indexOf(markerBytes,at+markerBytes.length)===-1);
    const payload=Buffer.concat([raw.subarray(0,at),token,raw.subarray(at+markerBytes.length)]);
    add(id,F.encode(a,req,{rawPayload:payload}),accepted?'accepted':'rejected');const row=rows[rows.length-1];row.numeric={expected_value:expectedValue,field:uint?'maximum':'result',token_hex:token.toString('hex'),digest_oracle:numericDigestOracle(a.manifest,payload)};
    if(!accepted)row.expected_reason='READ_CORE_INVALID';
  }
  const integer=n=>{const b=Buffer.alloc(9);b[0]=n<0n?0x3b:0x1b;b.writeBigUInt64BE(n<0n?-1n-n:n,1);return b;};
  const float=n=>{const b=Buffer.alloc(9);b[0]=0xfb;b.writeDoubleBE(n,1);return b;};
  for(const n of [4294967296n,-4294967296n,9007199254740991n,-9007199254740991n,9007199254740992n,-9007199254740992n,9007199254740994n,-9007199254740994n,9223372036854775808n,-9223372036854775808n,18446744073709549568n,-18446744073709551616n]){
    numeric('number-integer-'+n,integer(n),Number(n));numeric('number-float-'+n,float(Number(n)),Number(n));
  }
  numeric('number-inexact-positive',integer(9007199254740993n),null,{accepted:false});numeric('number-inexact-negative',integer(-9007199254740993n),null,{accepted:false});
  numeric('number-inexact-uint64-high',integer(18446744073709551615n),null,{accepted:false});numeric('number-inexact-negative-high',integer(-18446744073709551615n),null,{accepted:false});
  numeric('number-fraction',float(1.5),1.5);numeric('number-infinity',float(Infinity),null,{accepted:false});numeric('number-nan',float(NaN),null,{accepted:false});
  for(const n of [9007199254740991n,9007199254740992n])for(const encoding of ['integer','float'])numeric('uint-'+encoding+'-'+n,encoding==='integer'?integer(n):float(Number(n)),Number(n),{uint:true,accepted:n===9007199254740991n});
  return {tuple,asset,rows};
}

// This function executes unchanged in Node and the browser page. The Node path
// uses Node admission/readNode for byte reads; stable expansion uses the public
// already-typed snapshot input of readBrowser in both runtimes.
async function exercise(api,bytes,fixture,tuple,asset,makeOther){
  const rows=[],check=(id,condition,detail)=>{rows.push({id,matched:!!condition,detail});};
  const admitted=await api.admit(bytes);check('admission',admitted.status===fixture.expected,admitted);
  const snapshot=admitted.snapshot,view=api.boundary.inspectSnapshot(snapshot);
  const request=(mode='exact_selection',budget=1000000)=>({request_id:'request:portable',tuple,budget_bytes:budget,mode,selection:['whole_asset','catalog'].includes(mode)?null:{asset_id:asset.payload.asset.asset_id,asset_version:asset.payload.asset.asset_version,judgment_id:'j:0'},handle:null});
  const control=()=>api.embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000}));
  function host(transform,delivery){let calls=0;const provider=api.embed.createTrustedHostReadProvider({observe:({request,snapshot})=>{
    calls++;const v=api.boundary.inspectSnapshot(snapshot);const data={host_id:'host:portable',host_epoch:'epoch:1',decision_id:'decision:'+calls,request_id:request.request_id,snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:v.ir.nodes.map(n=>n.id),issued_at:900,expires_at:2000,current_ms:1000,decision:'allow',policy_id:'policy:portable'};return transform?transform(data,calls):data;
  },...(delivery?{deliver:delivery}:{})});return {provider,calls:()=>calls};}
  if(admitted.status!=='accepted'){
    check('negative-reason',admitted.reason===fixture.expected_reason,admitted);
    const denied=host(),read=await api.readBytes(bytes,request(),control(),denied.provider);
    check('negative-read-no-host-no-content',read.envelope?.diagnostics[0]?.code===fixture.expected_reason&&read.envelope.content===null&&denied.calls()===0,{read,host_calls:denied.calls()});
    return {rows,admitted};
  }
  if(fixture.numeric){
    const judgment=view.ir.nodes.find(n=>n.role==='judgment'&&n.value.id==='j:0'),value=fixture.numeric.field==='maximum'?judgment.value.result_contract.maximum:judgment.value.result.value.value;
    check('numeric-ir-retention',value===fixture.numeric.expected_value,{value,expected:fixture.numeric.expected_value});
    check('numeric-digest-domains',view.digests.A.observed==='sha256:'+fixture.sha256&&view.digests.C.observed===fixture.numeric.digest_oracle.C&&view.digests.E.observed===fixture.numeric.digest_oracle.E,view.digests);
    const numericRead=await api.read(snapshot,request(),control(),host().provider);check('numeric-read',numericRead.envelope?.status==='ready',numericRead);
    return {rows,admitted,view};
  }
  function canonical(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';}
  function measured(result){const envelope=result.envelope;if(!envelope)return null;const actual=new TextEncoder().encode(canonical(envelope)).length;return {actual,declared:Number(envelope.budget.actual_bytes),limit:envelope.budget.limit_bytes,matched:actual===Number(envelope.budget.actual_bytes)&&actual<=envelope.budget.limit_bytes};}
  const outputs={},h=host();
  const malformedHost=host(),malformed=await api.readBytes(bytes,{...request(),budget_bytes:'private'},control(),malformedHost.provider);check('admission-before-core-host',malformed.channel==='admission_rejection'&&malformed.admission_rejection.diagnostic.field==='budget_bytes'&&malformedHost.calls()===0,{result:malformed,host_calls:malformedHost.calls()});
  for(const mode of ['whole_asset','catalog','exact_selection']){
    const result=await api.read(snapshot,request(mode),control(),h.provider);outputs[mode]=result;check(mode,result.envelope?.status==='ready'&&result.envelope.receipt.delivery==='delivered',result);check(mode+'-full-envelope-budget',measured(result)?.matched,measured(result));
    const by=await api.readBytes(bytes,request(mode),control(),host().provider);outputs[mode+'_bytes']=by;check(mode+'-bytes',by.envelope?.status==='ready',by);
  }
  const selected=outputs.exact_selection.envelope?.content,handle=selected?.expansion_handles[0];check('handle-issued',!!handle,handle??null);
  check('mandatory-boundary-actor',selected?.closure.some(n=>n.role==='boundary')&&selected?.closure.some(n=>n.role==='actor'),selected?.closure??null);
  check('no-unrelated-owner',selected?.closure.filter(n=>n.role==='judgment').map(n=>n.value.id).join(',')==='j:0',selected?.closure??null);
  if(handle){const result=await api.read(snapshot,{...request('expand'),handle},control(),h.provider);outputs.expand=result;check('expand',result.envelope?.status==='ready'&&result.envelope.content.closure.some(n=>n.role==='judgment'&&n.value.id==='j:1'),result);check('expand-full-envelope-budget',measured(result)?.matched,measured(result));
    const stale=await api.readBytes(bytes,{...request('expand'),handle},control(),h.provider);check('new-admission-stales-handle',stale.envelope?.diagnostics[0]?.code==='READ_HANDLE_STALE'&&stale.envelope.content===null,stale);
  }
  const failedDelivery=host(null,()=>false),undelivered=await api.read(snapshot,request(),control(),failedDelivery.provider);check('failed-delivery',undelivered.channel==='transport_failure'&&undelivered.envelope===null,undelivered);
  for(const role of ['boundary','actor']){const excluded=new Set(view.ir.nodes.filter(n=>n.role===role).map(n=>n.id));const scoped=host(v=>({...v,scope:v.scope.filter(id=>!excluded.has(id))}));const result=await api.read(snapshot,request(),control(),scoped.provider);check('missing-'+role,result.envelope?.diagnostics[0]?.code==='READ_SCOPE_DENIED'&&result.envelope.content===null,result);}
  for(const style of ['deny','fresh-revocation']){const denied=host((v,n)=>style==='deny'?{...v,decision:'deny'}:n===2?{...v,revoked:true}:v);const result=await api.read(snapshot,request(),control(),denied.provider);check(style,result.envelope?.diagnostics[0]?.code==='READ_HOST_DENIED'&&result.envelope.content===null,{result,host_calls:denied.calls()});}
  let policy='deny';const tombstone=host(v=>({...v,decision:policy==='deny'?'deny':'allow',...(policy==='lift'?{lift_denial:true}:{})}));
  for(const step of ['deny','allow','lift']){policy=step;const result=await api.read(snapshot,request(),control(),tombstone.provider);check('tombstone-'+step,step==='lift'?result.envelope?.status==='ready':result.envelope?.diagnostics[0]?.code==='READ_HOST_DENIED',result);}
  const zero=await api.read(snapshot,request('exact_selection',0),control(),host().provider);check('zero-budget',zero.envelope?.content==null&&zero.envelope?.status!=='ready',zero);
  let budget=1000000,exactBudget;
  for(let i=0;i<6;i++){const result=await api.read(snapshot,request('exact_selection',budget),control(),host().provider);const required=Number(result.envelope?.budget.required_bytes);if(required===budget&&result.envelope?.status==='ready'){exactBudget=result;break;}if(!Number.isFinite(required))break;budget=required;}
  check('exact-budget',!!exactBudget&&measured(exactBudget)?.matched,exactBudget??null);
  const short=await api.read(snapshot,request('exact_selection',budget-1),control(),host().provider);check('budget-minus-one',short.envelope?.content==null&&short.envelope?.status!=='ready',short);
  const foreign=await makeOther().admit(bytes);
  for(const [label,input]of [['json-snapshot',JSON.parse(JSON.stringify(snapshot))],['foreign-snapshot',foreign.snapshot]]){
    const safeHost=host(),result=await api.read(input,request(),control(),safeHost.provider);check(label,result.envelope?.status!=='ready'&&result.envelope?.content==null&&safeHost.calls()===0,{result,host_calls:safeHost.calls()});
    const admittedRequest=api.readRoot.admitReadRequest(request(),control());const projected=api.readRoot.project(admittedRequest.admitted_request,input);check(label+'-projection',projected.diagnostics[0]?.code==='READ_SNAPSHOT_UNATTESTED',projected);
  }
  const invalids=[null,42,[],{}];for(let i=0;i<invalids.length;i++){const result=await api.admit(invalids[i]);check('input-type-'+i,result.status==='rejected'&&result.reason==='READ_INPUT_INVALID',result);}
  return {rows,admitted,view,outputs,host_calls:h.calls()};
}
function normalize(value){
  const ids=new Map();let sequence=0;
  function id(value){if(!ids.has(value))ids.set(value,'snapshot:00000000-0000-4000-8000-'+String(++sequence).padStart(12,'0'));return ids.get(value);}
  function visit(v,key){
    if(Array.isArray(v))return v.map(x=>visit(x,''));
    if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,visit(x,k)]));
    if(typeof v==='string'&&key==='snapshot_id')return id(v);
    if(typeof v==='string'&&(key==='handle_id'||key==='receipt_id'))return v.replace(/^(handle:|receipt:)(snapshot:[0-9a-f-]{36})(:)/,(_,a,b,c)=>a+id(b)+c);
    return v;
  }
  return visit(value,'');
}
function nodeAPI(runtime){
  const {req,coreDir,readDir}=F.runtime(runtime);
  for(const key of Object.keys(require.cache))if(key.startsWith(coreDir+path.sep)||key.startsWith(readDir+path.sep))delete require.cache[key];
  const core=req('@aikdna/kdna-core');return {core,boundary:req('@aikdna/kdna-core/read-boundary'),readRoot:req('@aikdna/kdna-read'),embed:req('@aikdna/kdna-read/embedding'),admit:req('@aikdna/kdna-core/node').admitNode,read:req('@aikdna/kdna-read/browser').readBrowser,readBytes:req('@aikdna/kdna-read/node').readNode};
}
async function main(){
  const [runtime,toolRoot,outputRoot,chrome]=process.argv.slice(2);assert.ok(runtime&&toolRoot&&outputRoot&&chrome,'runtime toolRoot outputRoot Chrome-executable required');
  fs.mkdirSync(outputRoot,{recursive:false});const fixtureRoot=path.join(outputRoot,'fixtures');fs.mkdirSync(fixtureRoot);
  const input=fixtures(runtime,fixtureRoot),bundleInfo=bundle(runtime,path.join(outputRoot,'browser-bundle.js'));
  const html=path.join(outputRoot,'harness.html');fs.writeFileSync(html,'<!doctype html><meta charset="utf-8"><title>KDNA portable runtime conformance</title><input type="file" id="input"><script src="browser-bundle.js"></script>');
  const report={format:'kdna.browser-runtime/1',started_at:new Date().toISOString(),runtime:fs.realpathSync(runtime),node:{version:process.version,executable:process.execPath,executable_sha256:sha(fs.readFileSync(process.execPath))},inputs:input.rows,bundle:bundleInfo,normalization:'Only random snapshot UUIDs and their exact handle/receipt bindings; identity relationships and UUID length preserved. All other public fields retained.',node_results:[],browsers:[],failures:[],platform_limits:['Headless Chromium and Playwright WebKit are not WKWebView/Tauri native acceptance.','Trusted test Host callbacks are explicit fixture policy, not production identity or authorization.','No browser HTTP server, network codec, Node sidecar or Swift bridge.']};
  const save=()=>fs.writeFileSync(path.join(outputRoot,'result.json'),JSON.stringify(report,null,2)+'\n');save();
  for(const row of input.rows){const api=nodeAPI(runtime),result=await exercise(api,fs.readFileSync(row.path),row,input.tuple,input.asset,()=>nodeAPI(runtime));report.node_results.push({id:row.id,result});for(const check of result.rows)if(!check.matched)report.failures.push({runtime:'node',fixture:row.id,id:check.id});save();}
  const pw=createRequire(path.join(toolRoot,'package.json'))('playwright');
  for(const name of ['chromium','webkit']){
    let browser,context;const observation={name,started_at:new Date().toISOString(),executable:name==='chromium'?chrome:pw.webkit.executablePath(),network:[],console_errors:[],results:[]};report.browsers.push(observation);save();
    try {
      browser=await pw[name].launch({headless:true,...(name==='chromium'?{executablePath:chrome}:{}),downloadsPath:path.join(outputRoot,'downloads-'+name)});observation.version=browser.version();
      context=await browser.newContext({serviceWorkers:'block'});await context.route('**/*',route=>/^https?:|^wss?:/.test(route.request().url())?route.abort():route.continue());
      const page=await context.newPage();page.on('request',request=>{if(/^https?:|^wss?:/.test(request.url()))observation.network.push(request.url());});page.on('pageerror',error=>observation.console_errors.push(String(error)));
      await page.goto('file://'+html);observation.environment=await page.evaluate(()=>{const invalid=createKDNA().admit('unsupported');return {userAgent:navigator.userAgent,File:typeof File,arrayBuffer:typeof File.prototype.arrayBuffer,crypto:typeof crypto.randomUUID,secureContext:isSecureContext,nodeProcess:typeof process,nodeRequire:typeof require,synchronous_admission:!(invalid instanceof Promise),string_input_rejected:invalid.reason==='READ_INPUT_INVALID'};});
      for(const row of input.rows){
        await page.locator('#input').setInputFiles(row.path);
        const result=await page.evaluate(async({exerciseSource,fixture,tuple,asset})=>{
          const file=document.querySelector('#input').files[0],bytes=await file.arrayBuffer(),api=createKDNA();const execute=(0,eval)('('+exerciseSource+')');return {file:{name:file.name,size:file.size},result:await execute(api,bytes,fixture,tuple,asset,()=>createKDNA())};
        },{exerciseSource:exercise.toString(),fixture:row,tuple:input.tuple,asset:input.asset});
        const node=report.node_results.find(x=>x.id===row.id).result;let parity=true;try{assert.deepEqual(normalize(result.result),normalize(node));}catch(error){parity=false;report.failures.push({runtime:name,fixture:row.id,id:'node-full-public-parity',error:String(error).slice(0,1500)});}
        observation.results.push({id:row.id,...result,node_full_public_parity:parity});for(const check of result.result.rows)if(!check.matched)report.failures.push({runtime:name,fixture:row.id,id:check.id});save();
      }
    }catch(error){observation.error=String(error.stack??error);report.failures.push({runtime:name,id:'runtime-exception',error:observation.error});}
    finally{if(context)await context.close();if(browser)await browser.close();observation.closed=true;observation.ended_at=new Date().toISOString();save();}
    if(observation.network.length)report.failures.push({runtime:name,id:'browser-network',urls:observation.network});
    if(observation.console_errors.length)report.failures.push({runtime:name,id:'browser-page-errors',errors:observation.console_errors});
  }
  report.numeric_pair_checks=[];
  for(const [platform,results]of [['node',report.node_results],...report.browsers.map(b=>[b.name,b.results])])for(const row of input.rows.filter(x=>x.id.startsWith('number-integer-'))){
    const suffix=row.id.slice('number-integer-'.length),integer=results.find(x=>x.id===row.id)?.result,float=results.find(x=>x.id==='number-float-'+suffix)?.result;let matched=true,error=null;
    try{assert.ok(integer?.view&&float?.view);assert.deepEqual(integer.view.ir,float.view.ir);assert.equal(integer.view.ir_digest,float.view.ir_digest);for(const key of ['A','C','E'])assert.notEqual(integer.view.digests[key].observed,float.view.digests[key].observed);}catch(e){matched=false;error=String(e);report.failures.push({runtime:platform,id:'numeric-representation-pair',value:suffix,error});}
    report.numeric_pair_checks.push({platform,value:suffix,matched,ir_equal:matched,raw_digest_domains_differ:matched,error});
  }
  report.ended_at=new Date().toISOString();report.status=report.failures.length?'FAIL':'MATCH';save();console.log(JSON.stringify({status:report.status,fixtures:input.rows.length,node_checks:report.node_results.reduce((n,x)=>n+x.result.rows.length,0),browsers:report.browsers.map(x=>({name:x.name,version:x.version,fixtures:x.results.length,closed:x.closed,network:x.network})),failures:report.failures,report:path.join(outputRoot,'result.json')}));process.exitCode=report.failures.length?1:0;
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={bundle,fixtures,exercise,normalize,literals,zipRows};
