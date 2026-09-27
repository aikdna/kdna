'use strict';
const test=require('node:test'),fs=require('node:fs'),os=require('node:os');const H=require('./protection-test-helpers.js');const {assert,path,core,req,policy,asset,F,coreDir,crypto,external}=H;
const inspect=req('@aikdna/kdna-core/authoring-node').openSourceBytes;
const {parseContainer}=require(path.join(coreDir,'src/public-contract/container.js'));
const {digest,contentTreePreimage,runtimeEntryPreimage}=require(path.join(coreDir,'src/public-contract/digests.js'));
function options(a,profile='scrypt-sha256'){return {kind:'password',asset_uid:a.manifest.asset_uid,entitlement:{profile:'password'},slots:[{slot:'primary',kdf_profile:profile},{slot:'second',kdf_profile:'scrypt-sha256'}],checksums:true,signature:'ed25519'};}
const passwords=[{slot:'primary',password:Buffer.from('first-password-canary')},{slot:'second',password:Buffer.from('second-password-canary')}];
for(const profile of ['scrypt-sha256','argon2id'])test('producer '+profile+' saves actual protected bytes and independently admits chosen password slot',async()=>{
 const a=asset(),original=F.encode(a,req,{entries:{'attachments/preserve.bin':Buffer.from([1,2,3,4])}}),seed=crypto.randomBytes(32);
 const out=await core.protectSourceBytes(original,options(a,profile),{passwords,signingSeed:seed});assert.equal(out.status,'produced',JSON.stringify(out));
 const location=fs.mkdtempSync(path.join(process.env.KDNA_PROTECTION_ARTIFACT_ROOT??os.tmpdir(),'protected-producer-')),file=path.join(location,'protected.kdna');fs.writeFileSync(file,out.bytes);
 const before=parseContainer(original),after=parseContainer(out.bytes);assert.deepEqual(after['attachments/preserve.bin'],before['attachments/preserve.bin']);const manifest=JSON.parse(Buffer.from(after['kdna.json']));
 assert.equal(out.evidence.output.A,digest(fs.readFileSync(file)));assert.equal(out.evidence.output.C,digest(contentTreePreimage(after)));assert.equal(out.evidence.output.E,digest(runtimeEntryPreimage(after,manifest)));
 const signature=JSON.parse(Buffer.from(after['signature.kdsig'])),signaturePolicy={requireSignature:true,expectedPublicKeyHex:signature.public_key};
 const got=await core.admitProtectedNode(file,{credential:{kind:'password',password:passwords[0].password},signaturePolicy},{kind:'local',clock:()=>1000});assert.equal(got.status,'accepted',JSON.stringify(got));assert.equal(got.receipt.integrity.signature,'verified_pinned_key');
 assert.deepEqual(got.snapshot.ir.nodes.filter(x=>x.role==='judgment').map(x=>x.value),req('@aikdna/kdna-core').admitBytes(original).snapshot.ir.nodes.filter(x=>x.role==='judgment').map(x=>x.value));
 const second=await core.admitProtectedNode(file,{credential:{kind:'password',password:passwords[1].password,slotIndex:1},signaturePolicy},{kind:'local',clock:()=>1000});assert.equal(second.status,'accepted');
 const wrong=await core.admitProtectedNode(file,{credential:{kind:'password',password:passwords[1].password},signaturePolicy},{kind:'local',clock:()=>1000});assert.equal(wrong.diagnostic.code,'PROTECTION_AUTHENTICATION_FAILED');
 assert.equal((await core.admitProtectedNode(file,{credential:{kind:'password',password:passwords[0].password},signaturePolicy:{requireSignature:true,expectedPublicKeyHex:'00'.repeat(32)}},{kind:'local',clock:()=>1000})).diagnostic.code,'PROTECTION_SIGNATURE_PIN_MISMATCH');
 assert.equal(inspect(out.bytes).reason,'READ_CORE_CAPABILITY_UNAVAILABLE');
});
test('integrity-only none verifies checksums and signature without adding encryption declarations',async()=>{
 const a=asset(),source=F.encode(a,req),out=await core.protectSourceBytes(source,{kind:'integrity',checksums:true,signature:'none'},{});assert.equal(out.status,'produced');
 const got=await core.admitProtectedNode(out.bytes,{credential:{kind:'none'},signaturePolicy:policy},{kind:'local',clock:()=>1000});assert.equal(got.status,'accepted');assert.equal(got.receipt.encryption,null);assert.equal(got.receipt.integrity.checksums,'verified_document_1');
 const entries=parseContainer(out.bytes);for(const mutate of [d=>d.entries.reverse(),d=>d.entries[0].bytes++,d=>d.covered_entries.pop(),d=>d.entries.push(d.entries[0]),d=>d.profile='kdna.checksums/0.1']){const changed={...entries},doc=JSON.parse(Buffer.from(entries['checksums.json']));mutate(doc);changed['checksums.json']=Buffer.from(JSON.stringify(doc));assert.equal((await core.admitProtectedNode(F.zip(changed),{credential:{kind:'none'},signaturePolicy:policy},{kind:'local',clock:()=>1000})).status,'protection_failed');}
});
test('producer UID conflict, slots beyond bound, and already protected source fail without fallback',async()=>{
 const a=asset(),source=F.encode(a,req);assert.equal((await core.protectSourceBytes(source,{...options(a),asset_uid:'different'}, {passwords,signingSeed:crypto.randomBytes(32)})).status,'protection_failed');
 const tooMany=Array.from({length:17},(_,i)=>({slot:'s'+i,kdf_profile:'scrypt-sha256'}));assert.equal((await core.protectSourceBytes(source,{...options(a),slots:tooMany},{passwords:tooMany.map(x=>({slot:x.slot,password:Buffer.from('x')})),signingSeed:crypto.randomBytes(32)})).diagnostic.code,'PROTECTION_INPUT_INVALID');
 const out=await core.protectSourceBytes(source,{kind:'integrity',checksums:true,signature:'none'},{});assert.equal((await core.protectSourceBytes(out.bytes,{kind:'integrity',checksums:true,signature:'none'},{})).core.reason,'READ_CORE_CAPABILITY_UNAVAILABLE');
});
test('current authored engineering source preserves absent C fields and parent semantics through saved protection',async()=>{
 const authored=asset();authored.payload.judgments[1].parent_ref=authored.payload.judgments[0].id;const source=F.encode(authored,req),opened=inspect(source);assert.equal(opened.status,'accepted');const a={manifest:opened.source.manifest};
 const out=await core.protectSourceBytes(source,{...options(a),signature:'none'},{passwords});assert.equal(out.status,'produced');
 const manifest=JSON.parse(Buffer.from(parseContainer(out.bytes)['kdna.json']));assert.equal(manifest.content_digest,opened.source.manifest.content_digest===undefined?undefined:out.evidence.output.C);assert.equal(manifest.authoring?.content_digest,opened.source.manifest.authoring?.content_digest===undefined?undefined:out.evidence.output.C);
 const oldAuthor={...opened.source.manifest.authoring},newAuthor={...manifest.authoring};delete oldAuthor.content_digest;delete newAuthor.content_digest;assert.deepEqual(newAuthor,oldAuthor);
 const got=await core.admitProtectedNode(out.bytes,{credential:{kind:'password',password:passwords[0].password},signaturePolicy:policy},{kind:'local',clock:()=>1000});assert.equal(got.status,'accepted');assert.deepEqual(got.snapshot.ir.nodes.filter(x=>x.role==='judgment').map(x=>x.value),req('@aikdna/kdna-core').admitBytes(source).snapshot.ir.nodes.filter(x=>x.role==='judgment').map(x=>x.value));
});
test('independent issuer wraps final A to actual device after production',async()=>{const f=await external();assert.equal(f.receipt.A,f.output.evidence.output.A);assert.equal(f.receipt.authorization.kind,'external_grant');assert.equal(f.receipt.authorization.device_id,f.credential.expected.device_id);});
test('producer refreshes both explicitly present C bindings without dropping authoring fields',async()=>{
 const a=asset(),source=F.encode(a,req),ordinary=req('@aikdna/kdna-core').admitBytes(source);a.manifest.content_digest=ordinary.snapshot.digests.C.observed;a.manifest.authoring={content_digest:ordinary.snapshot.digests.C.observed};
 const manifest=inspect(source).source.manifest;manifest.content_digest=ordinary.snapshot.digests.C.observed;
 // Current ManifestAuthoring is the closed content_digest carrier.
 manifest.authoring={content_digest:ordinary.snapshot.digests.C.observed};
 const packed=req('@aikdna/kdna-core/authoring-node').packSourceBytes(source,{manifest});assert.equal(packed.status,'accepted');
 const out=await core.protectSourceBytes(packed.bytes,{kind:'integrity',checksums:true,signature:'none'},{});assert.equal(out.status,'produced');const changed=JSON.parse(Buffer.from(parseContainer(out.bytes)['kdna.json']));assert.equal(changed.content_digest,out.evidence.output.C);assert.equal(changed.authoring.content_digest,out.evidence.output.C);
});
test('producer supports exactly sixteen explicit slots and fresh CSPRNG ciphertext',async()=>{
 const a=asset(),source=F.encode(a,req),slots=Array.from({length:16},(_,i)=>({slot:'slot:'+i,kdf_profile:'scrypt-sha256'})),secrets={passwords:slots.map(x=>({slot:x.slot,password:Buffer.from('synthetic')}))};
 const out=await core.protectSourceBytes(source,{...options(a),slots,signature:'none',checksums:false},secrets);assert.equal(out.status,'produced');
 const got=await core.admitProtectedNode(out.bytes,{credential:{kind:'password',password:Buffer.from('synthetic'),slotIndex:15},signaturePolicy:policy},{kind:'local',clock:()=>1000});assert.equal(got.status,'accepted');
 const other=await core.protectSourceBytes(source,{...options(a),slots:[slots[0]],signature:'none',checksums:false},{passwords:[secrets.passwords[0]]});assert.equal(other.status,'produced');assert.notEqual(out.evidence.output.A,other.evidence.output.A);
});
test('base64 envelope expansion cannot relax the original eight MiB member bound',async()=>{
 const a=asset(7);for(const j of a.payload.judgments)j.result.value.value='x'.repeat(950000);const source=F.encode(a,req);assert.equal(inspect(source).status,'accepted');
 const out=await core.protectSourceBytes(source,{...options(a),slots:[{slot:'primary',kdf_profile:'scrypt-sha256'}],signature:'none',checksums:false},{passwords:[passwords[0]]});assert.equal(out.status,'protection_failed');assert.equal(out.diagnostic.code,'PROTECTION_ENVELOPE_INVALID');assert.equal(Object.hasOwn(out,'bytes'),false);
});
test('declared integrity rejects duplicate raw JSON, old coordinate, C substitution and missing required signature',async()=>{
 const a=asset(),source=F.encode(a,req),out=await core.protectSourceBytes(source,{kind:'integrity',checksums:true,signature:'ed25519'},{signingSeed:crypto.randomBytes(32)}),entries=parseContainer(out.bytes),admit=bytes=>core.admitProtectedNode(bytes,{credential:{kind:'none'},signaturePolicy:policy},{kind:'local',clock:()=>1000});
 for(const change of [e=>e['checksums.json']=Buffer.from('{"profile":"x",'+Buffer.from(e['checksums.json']).toString().slice(1)),e=>{const d=JSON.parse(Buffer.from(e['signature.kdsig']));d.content_digest=out.evidence.output.C;e['signature.kdsig']=Buffer.from(JSON.stringify(d));},e=>{const d=JSON.parse(Buffer.from(e['checksums.json']));d.entry_set_digest=out.evidence.output.A;e['checksums.json']=Buffer.from(JSON.stringify(d));},e=>e['checksums.json']=Buffer.from(' '.repeat(1048577))]){const e={...entries};change(e);const got=await admit(F.zip(e));assert.equal(got.status,'protection_failed');assert.equal(Object.hasOwn(got,'body'),false);}
 delete entries['signature.kdsig'];const missing=await core.admitProtectedNode(F.zip(entries),{credential:{kind:'none'},signaturePolicy:{requireSignature:true,expectedPublicKeyHex:null}},{kind:'local',clock:()=>1000});assert.equal(missing.diagnostic.code,'PROTECTION_SIGNATURE_INVALID');
});
