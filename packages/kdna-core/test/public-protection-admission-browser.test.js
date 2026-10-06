'use strict';
const test=require('node:test');
const H=require('./protection-test-helpers.js'),{assert,path,core,req,asset,F,coreDir,crypto,tuple}=H;
const browser=require(path.join(coreDir,'src/public-contract/protected-browser.js')),
 codec=require(path.join(coreDir,'src/public-contract/protection-envelope-codec.js')),
 crypt=require(path.join(coreDir,'src/public-contract/protection-crypto.js')),
 {parseContainer}=require(path.join(coreDir,'src/public-contract/container.js')),
 {canonicalJson}=require(path.join(coreDir,'src/public-contract/strict-input.js'));
const policy={requireSignature:false,expectedPublicKeyHex:null},provider={kind:'local',clock:()=>1000};
const passwords=[{slot:'primary',password:Buffer.from('first-password-canary')},{slot:'second',password:Buffer.from('second-password-canary')}];
const selection=(slotIndex,slot,kdf_profile='scrypt-sha256')=>({slotIndex,slot,kdf_profile});
const observation=sel=>({kind:'consumer_unlock_observation',proof:'observation_not_authority',checked_at_ms:1000,selection:sel});
// 全字节口径（1f 步骤②裁定 ④/⑤ 要求）：快照逐字段比对，唯一豁免＝随机 snapshot_id。
const strip=snapshot=>{const{snapshot_id,...rest}=snapshot;return rest;};
async function fixture(patch=null,protect={}){
 const a=asset();if(patch)patch(a);
 const original=F.encode(a,req,{entries:{'attachments/preserve.bin':Buffer.from([1,2,3,4])}});
 const options={kind:'password',asset_uid:a.manifest.asset_uid,entitlement:{profile:'password'},slots:[{slot:'primary',kdf_profile:'scrypt-sha256'},{slot:'second',kdf_profile:'scrypt-sha256'}],checksums:true,signature:'ed25519',...protect};
 const secrets={passwords,...(options.signature==='none'?{}:{signingSeed:crypto.randomBytes(32)})};
 const out=await core.protectSourceBytes(original,options,secrets);
 assert.equal(out.status,'produced',JSON.stringify(out));
 const entries=parseContainer(out.bytes),manifest=JSON.parse(Buffer.from(entries['kdna.json']));
 const envelope=crypt.validateEnvelope(codec.decodeEnvelope(entries['payload.kdnab']),{id:manifest.encryption.profile,version:'0.1.0'});
 const plaintext=crypt.decryptPassword(envelope,{kind:'password',password:passwords[0].password,slotIndex:0},manifest);
 return {original,bytes:out.bytes,manifest,envelope,plaintext};
}
function assertObservationRejection(r,code,label){assert.equal(r.status,'protection_failed',label+': '+JSON.stringify(r));assert.equal(r.diagnostic.code,code,label);}
test('browser admission accepts the host-unlocked triple with the node content face',async()=>{
 const f=await fixture();
 const r=await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(0,'primary')),signaturePolicy:policy},provider);
 assert.equal(r.status,'accepted',JSON.stringify(r));
 assert.equal(r.disclosure.observation_not_authority,true);
 assert.equal(r.disclosure.slot_selection.slotIndex,0);
 const node=await core.admitProtectedNode(f.bytes,{credential:{kind:'password',password:passwords[0].password,slotIndex:0},signaturePolicy:policy},{kind:'local',clock:()=>1000});
 assert.equal(node.status,'accepted',JSON.stringify(node));
 assert.deepEqual(r.snapshot.ir,node.snapshot.ir);
 // 全字节口径：除随机 snapshot_id 外，快照逐字节（canonicalJson）相同。
 assert.equal(canonicalJson(strip(r.snapshot)),canonicalJson(strip(node.snapshot)),'full-byte snapshot cross');
});
test('browser admission rejects a slot index outside the envelope key slots',async()=>{
 const f=await fixture();
 assertObservationRejection(await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(9,'primary')),signaturePolicy:policy},provider),'PROTECTION_OBSERVATION_BINDING_INVALID','index out of bounds');
});
test('browser admission rejects a slot name or KDF that does not match the envelope',async()=>{
 const f=await fixture();
 assertObservationRejection(await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(0,'second')),signaturePolicy:policy},provider),'PROTECTION_OBSERVATION_BINDING_INVALID','slot mismatch');
 assertObservationRejection(await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(0,'primary','argon2id')),signaturePolicy:policy},provider),'PROTECTION_OBSERVATION_BINDING_INVALID','kdf mismatch');
});
test('browser admission splits the cross-container plaintext face by what is checkable',async()=>{
 const f1=await fixture();
 // P↔B 交叉检查表②（CORE-BROWSER-PROTECTED-ADMISSION-IMPL-PLAN01，批准面）：身份字段
 // （asset_id/version/judgment_version 明文侧 vs 容器 manifest 逐项），可核者必拒。
 const f2=await fixture(a=>{a.manifest.asset_id='asset:bytes-b';a.payload.asset.asset_id='asset:bytes-b';});
 const r=await browser.admitProtectedBrowser({bytes:f1.bytes,plaintextPayload:f2.plaintext,observation:observation(selection(0,'primary')),signaturePolicy:policy},provider);
 assert.equal(r.status,'core_rejected','identity-differing cross: '+JSON.stringify(r));
 assert.equal(r.stage,'payload');
 // 不可核者入同一具名清单（同清单随实现件送核）：同身份/同修订换容器在无密钥下不可判
 // （ciphertext↔plaintext 不可验），产物以披露面限定为主机声明；以下断言即清单首项读数。
 const f3=await fixture();
 const same=await browser.admitProtectedBrowser({bytes:f1.bytes,plaintextPayload:f3.plaintext,observation:observation(selection(0,'primary')),signaturePolicy:policy},provider);
 assert.equal(same.status,'accepted','same-identity cross reading: '+JSON.stringify(same));
 assert.equal(same.disclosure.provenance,'host_supplied_triple');
 assert.equal(same.disclosure.observation_not_authority,true);
});
test('browser admission rejects an observation that is not the consumer unlock observation',async()=>{
 const f=await fixture();
 assertObservationRejection(await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:{kind:'other',proof:'observation_not_authority',checked_at_ms:1000,selection:selection(0,'primary')},signaturePolicy:policy},provider),'PROTECTION_OBSERVATION_INVALID','wrong kind');
 assertObservationRejection(await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:{kind:'consumer_unlock_observation',proof:'authority',checked_at_ms:1000,selection:selection(0,'primary')},signaturePolicy:policy},provider),'PROTECTION_OBSERVATION_INVALID','wrong proof');
});
test('browser admission takes typed binary inputs only and never stringifies them',async()=>{
 const r=await browser.admitProtectedBrowser({bytes:Buffer.from('AAAA').toString('base64'),plaintextPayload:new Uint8Array(1),observation:observation(selection(0,'primary'))},provider);
 assert.equal(r.status,'protection_failed',JSON.stringify(r));
 assert.equal(r.diagnostic.code,'PROTECTION_INPUT_INVALID');
 const r2=await browser.admitProtectedBrowser({bytes:new Uint8Array(1),plaintextPayload:'stringified',observation:observation(selection(0,'primary'))},provider);
 assert.equal(r2.status,'protection_failed',JSON.stringify(r2));
 assert.equal(r2.diagnostic.code,'PROTECTION_INPUT_INVALID');
 // 零损耗探针：调用方明文不被改写（内部走拷贝、归零只及拷贝）；数组/缺 observation 同拒。
 const f=await fixture(),before=Array.from(f.plaintext);
 const ok=await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(0,'primary')),signaturePolicy:policy},provider);
 assert.equal(ok.status,'accepted',JSON.stringify(ok));
 assert.deepEqual(Array.from(f.plaintext),before,'caller plaintext is not mutated');
 const arr=await browser.admitProtectedBrowser({bytes:[1,2,3],plaintextPayload:f.plaintext,observation:observation(selection(0,'primary'))},provider);
 assert.equal(arr.status,'protection_failed',JSON.stringify(arr));
 assert.equal(arr.diagnostic.code,'PROTECTION_INPUT_INVALID');
 const missing=await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext},provider);
 assert.equal(missing.status,'protection_failed',JSON.stringify(missing));
 assert.equal(missing.diagnostic.code,'PROTECTION_INPUT_INVALID');
});
test('browser admission pins the signature policy readings by name',async()=>{
 const f=await fixture();
 const base={bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(0,'primary'))};
 const pinned=await browser.admitProtectedBrowser({...base,signaturePolicy:{requireSignature:true,expectedPublicKeyHex:'0'.repeat(64)}},provider);
 assert.equal(pinned.status,'protection_failed',JSON.stringify(pinned));
 assert.equal(pinned.diagnostic.code,'PROTECTION_SIGNATURE_PIN_MISMATCH');
 assert.equal(pinned.diagnostic.stage,'integrity');
 const required=await browser.admitProtectedBrowser({...base,signaturePolicy:{requireSignature:true,expectedPublicKeyHex:null}},provider);
 assert.equal(required.status,'accepted',JSON.stringify(required));
 const unsigned=await fixture(null,{signature:'none'});
 const missing=await browser.admitProtectedBrowser({bytes:unsigned.bytes,plaintextPayload:unsigned.plaintext,observation:observation(selection(0,'primary')),signaturePolicy:{requireSignature:true,expectedPublicKeyHex:null}},provider);
 assert.equal(missing.status,'protection_failed',JSON.stringify(missing));
 assert.equal(missing.diagnostic.code,'PROTECTION_SIGNATURE_INVALID');
 assert.equal(missing.diagnostic.stage,'integrity');
});
test('browser admission reads the default policy and the tampered container by name',async()=>{
 const f=await fixture();
 const defaults=await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(0,'primary'))},provider);
 assert.equal(defaults.status,'accepted',JSON.stringify(defaults));
 const tampered=new Uint8Array(f.bytes);tampered[0]^=0xff;
 const r=await browser.admitProtectedBrowser({bytes:tampered,plaintextPayload:f.plaintext,observation:observation(selection(0,'primary')),signaturePolicy:policy},provider);
 assert.equal(r.status,'core_rejected','tampered: '+JSON.stringify(r));
 assert.equal(r.stage,'container');
});
test('browser admission consumes the d0 dual-slot family end to end',async()=>{
 // d0 样例族（w2-probes/probe-e2e-dual-slot.cjs 定常量）：blank 3425B→受保护 5655B·
 // 明文 2426B；双槽 password/argon2id＋recovery/scrypt-sha256；checksums true；signature none。
 // 实例 sha 因随机盐逐次而异（族＝构型同，d0 实例 A=dfbf9401…）。
 const PW='correct horse battery staple',REC='KDNA-RECOVER-0123-4567-89AB-CDEF-0123-4567-89AB-CDEF';
 const a=F.blank(tuple,2),original=F.encode(a,req);
 const out=await core.protectSourceBytes(original,{kind:'password',asset_uid:'uid:bytes',entitlement:{profile:'password',offline:true,revocable:false},slots:[{slot:'password',kdf_profile:'argon2id'},{slot:'recovery',kdf_profile:'scrypt-sha256'}],checksums:true,signature:'none'},{passwords:[{slot:'password',password:Buffer.from(PW)},{slot:'recovery',password:Buffer.from(REC)}]});
 assert.equal(out.status,'produced',JSON.stringify(out));
 assert.equal(out.bytes.length,5655,'d0 family container size');
 const entries=parseContainer(out.bytes),manifest=JSON.parse(Buffer.from(entries['kdna.json']));
 const envelope=crypt.validateEnvelope(codec.decodeEnvelope(entries['payload.kdnab']),{id:manifest.encryption.profile,version:'0.1.0'});
 const plaintext=crypt.decryptPassword(envelope,{kind:'password',password:Buffer.from(REC),slotIndex:1},manifest);
 assert.equal(plaintext.length,2426,'d0 family plaintext size');
 const r=await browser.admitProtectedBrowser({bytes:out.bytes,plaintextPayload:plaintext,observation:observation(selection(1,'recovery')),signaturePolicy:policy},provider);
 assert.equal(r.status,'accepted',JSON.stringify(r));
 assert.equal(r.disclosure.slot_selection.slot,'recovery');
 const node=await core.admitProtectedNode(out.bytes,{credential:{kind:'password',password:Buffer.from(REC),slotIndex:1},signaturePolicy:policy},{kind:'local',clock:()=>1000});
 assert.equal(node.status,'accepted',JSON.stringify(node));
 assert.equal(canonicalJson(strip(r.snapshot)),canonicalJson(strip(node.snapshot)),'d0 family full-byte cross');
 // 真样本负例：槽0（argon2id）以 scrypt 观测混入 → 装订拒（可核部分）。
 const mixed=await browser.admitProtectedBrowser({bytes:out.bytes,plaintextPayload:plaintext,observation:observation(selection(0,'password','scrypt-sha256')),signaturePolicy:policy},provider);
 assert.equal(mixed.status,'protection_failed',JSON.stringify(mixed));
 assert.equal(mixed.diagnostic.code,'PROTECTION_OBSERVATION_BINDING_INVALID');
});
