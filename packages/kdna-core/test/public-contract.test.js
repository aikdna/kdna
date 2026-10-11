'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
// C: the public-contract view must be bound to the installed generated contract
// - the module embeds no key data, so every readout has to match a type that the
// contract itself declares, and both negative controls below must bite.
test('public-contract view reads the installed contract and follows it',()=>{
 const contract=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
 const view=req('@aikdna/kdna-core/public-contract');
 assert.ok(view.kinds.length>0,'view declares kinds');
 for(const kind of view.kinds){
  const required=view.requiredKeys(kind),optional=view.optionalKeys(kind);
  assert.ok(Array.isArray(required)&&required.length>0,kind+' has required keys');
  const match=Object.values(contract.types).find(t=>Array.isArray(t.required)&&t.required.length===required.length&&required.every(k=>t.required.includes(k)));
  assert.ok(match,'every readout must come from a type the contract declares: '+kind);
  assert.deepEqual(optional,Object.keys(match.properties??{}).filter(k=>!match.required.includes(k)),kind+' optional keys come from the same type');
 }
 assert.deepEqual(view.contractCoordinate(),contract.versionTuple);
 // Negative control 1: a kind whose type is absent must fail loudly, not return an empty set.
 const missing=structuredClone(contract);
 for(const [name,type] of Object.entries(missing.types)) if(Array.isArray(type.required)&&type.required.length===view.requiredKeys('manifest').length) delete missing.types[name];
 assert.throws(()=>view.buildContractView(missing).requiredKeys('manifest'),/KDNA_CONTRACT_VIEW_TYPE_MISSING/);
 // Negative control 2: a modified contract copy must change the readouts (no hardcoding).
 const drifted=structuredClone(contract);
 const anchor=Object.values(drifted.types).find(t=>Array.isArray(t.required)&&t.required.length===view.requiredKeys('payload').length);
 assert.ok(anchor,'drift anchor found');
 anchor.required=[...anchor.required,'zz_probe_key'];
 const driftedView=view.buildContractView(drifted);
 assert.ok(driftedView.requiredKeys('payload').includes('zz_probe_key'),'readout follows the contract');
 assert.ok(!view.requiredKeys('payload').includes('zz_probe_key'),'installed readout unchanged');
});
const runtime=process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'),{req,coreDir}=F.runtime(runtime);
const core=req('@aikdna/kdna-core'),boundary=req('@aikdna/kdna-core/read-boundary'),tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple;
test('public byte admission binds an immutable private snapshot',()=>{const asset=F.blank(tuple),bytes=F.encode(asset,req),result=core.admitBytes(bytes);assert.equal(result.status,'accepted');const view=boundary.inspectSnapshot(result.snapshot),A=view.digests.A.observed;bytes.fill(0);assert.equal(view.digests.A.observed,A);assert.equal(boundary.inspectSnapshot(JSON.parse(JSON.stringify(result.snapshot))),null);assert.equal(core.admitBytes(bytes).status,'rejected');});
test('browser admission is synchronous and shares Node IR for stored and deflated bytes',async()=>{
 const {admitBrowser}=req('@aikdna/kdna-core/browser'),{admitNode}=req('@aikdna/kdna-core/node'),asset=F.blank(tuple);
 for(const deflate of [false,true]){
  const bytes=F.encode(asset,req,{deflate}),buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),browser=admitBrowser(buffer),node=await admitNode(bytes);
  assert.equal(browser instanceof Promise,false);assert.equal(browser.status,'accepted');assert.equal(node.status,'accepted');
  const a=boundary.inspectSnapshot(browser.snapshot),b=boundary.inspectSnapshot(node.snapshot);assert.deepEqual(a.ir,b.ir);assert.deepEqual(a.digests,b.digests);
  new Uint8Array(buffer).fill(0);assert.deepEqual(boundary.inspectSnapshot(browser.snapshot).digests,b.digests);
 }
});
test('portable inflater rejects truncated streams and actual output overflow',()=>{
 const {inflate}=require(path.join(coreDir,'src/public-contract/portable-inflate.js')),{deflateRawSync}=require('node:zlib'),plain=Buffer.alloc(65537,7),encoded=deflateRawSync(plain);
 assert.deepEqual(inflate(encoded,plain.length),new Uint8Array(plain));assert.throws(()=>inflate(encoded,plain.length-1));assert.throws(()=>inflate(encoded.subarray(0,-1),plain.length));
 assert.deepEqual(inflate(deflateRawSync(Buffer.alloc(0)),0),new Uint8Array(0));
});
test('CBOR integer precision is checked on the final signed value',()=>{
 const {decodePayload}=require(path.join(coreDir,'src/public-contract/cbor.js'));
 const token=n=>{const bytes=Buffer.alloc(9);bytes[0]=n<0n?0x3b:0x1b;bytes.writeBigUInt64BE(n<0n?-1n-n:n,1);return bytes;};
 for(const n of [4294967296n,-4294967296n,9007199254740991n,-9007199254740991n,9007199254740992n,-9007199254740992n,9007199254740994n,-9007199254740994n,9223372036854775808n,-9223372036854775808n,18446744073709549568n,-18446744073709551616n])assert.equal(decodePayload(token(n)),Number(n),String(n));
 for(const n of [9007199254740993n,-9007199254740993n,18446744073709551615n,-18446744073709551615n])assert.throws(()=>decodePayload(token(n)),{reason:'READ_CORE_INVALID'},String(n));
 const {copyJson}=require(path.join(coreDir,'src/public-contract/strict-input.js'));assert.throws(()=>copyJson(1n));
});
