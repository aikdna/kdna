'use strict';
const test=require('node:test');
const H=require('./protection-test-helpers.js'),{assert,path,core,req,asset,F,coreDir,crypto}=H;
const browser=require(path.join(coreDir,'src/public-contract/protected-browser.js')),
 codec=require(path.join(coreDir,'src/public-contract/protection-envelope-codec.js')),
 crypt=require(path.join(coreDir,'src/public-contract/protection-crypto.js')),
 {parseContainer}=require(path.join(coreDir,'src/public-contract/container.js'));
const policy={requireSignature:false,expectedPublicKeyHex:null},provider={kind:'local',clock:()=>1000};
const passwords=[{slot:'primary',password:Buffer.from('first-password-canary')},{slot:'second',password:Buffer.from('second-password-canary')}];
const selection=(slotIndex,slot,kdf_profile='scrypt-sha256')=>({slotIndex,slot,kdf_profile});
const observation=sel=>({kind:'consumer_unlock_observation',proof:'observation_not_authority',checked_at_ms:1000,selection:sel});
async function fixture(){
 const a=asset(),original=F.encode(a,req,{entries:{'attachments/preserve.bin':Buffer.from([1,2,3,4])}});
 const out=await core.protectSourceBytes(original,{kind:'password',asset_uid:a.manifest.asset_uid,entitlement:{profile:'password'},slots:[{slot:'primary',kdf_profile:'scrypt-sha256'},{slot:'second',kdf_profile:'scrypt-sha256'}],checksums:true,signature:'ed25519'},{passwords,signingSeed:crypto.randomBytes(32)});
 assert.equal(out.status,'produced',JSON.stringify(out));
 const entries=parseContainer(out.bytes),manifest=JSON.parse(Buffer.from(entries['kdna.json']));
 const envelope=crypt.validateEnvelope(codec.decodeEnvelope(entries['payload.kdnab']),{id:manifest.encryption.profile,version:'0.1.0'});
 const plaintext=crypt.decryptPassword(envelope,{kind:'password',password:passwords[0].password,slotIndex:0},manifest);
 return {original,bytes:out.bytes,manifest,envelope,plaintext};
}
function assertObservationRejection(r,label){assert.equal(r.status,'protection_failed',label+': '+JSON.stringify(r));}
test('browser admission accepts the host-unlocked triple with the node content face',async()=>{
 const f=await fixture();
 const r=await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(0,'primary')),signaturePolicy:policy},provider);
 assert.equal(r.status,'accepted',JSON.stringify(r));
 assert.equal(r.disclosure.observation_not_authority,true);
 assert.equal(r.disclosure.slot_selection.slotIndex,0);
 const node=await core.admitProtectedNode(f.bytes,{credential:{kind:'password',password:passwords[0].password,slotIndex:0},signaturePolicy:policy},{kind:'local',clock:()=>1000});
 assert.equal(node.status,'accepted',JSON.stringify(node));
 assert.deepEqual(r.snapshot.ir,node.snapshot.ir);
});
test('browser admission rejects a slot index outside the envelope key slots',async()=>{
 const f=await fixture();
 assertObservationRejection(await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(9,'primary')),signaturePolicy:policy},provider),'index out of bounds');
});
test('browser admission rejects a slot name or KDF that does not match the envelope',async()=>{
 const f=await fixture();
 assertObservationRejection(await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(0,'second')),signaturePolicy:policy},provider),'slot mismatch');
 assertObservationRejection(await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:observation(selection(0,'primary','argon2id')),signaturePolicy:policy},provider),'kdf mismatch');
});
test('browser admission rejects plaintext that does not belong to the container',async()=>{
 const f1=await fixture(),f2=await fixture();
 const r=await browser.admitProtectedBrowser({bytes:f1.bytes,plaintextPayload:f2.plaintext,observation:observation(selection(0,'primary')),signaturePolicy:policy},provider);
 assert.notEqual(r.status,'accepted','cross-container plaintext: '+JSON.stringify(r));
});
test('browser admission rejects an observation that is not the consumer unlock observation',async()=>{
 const f=await fixture();
 assertObservationRejection(await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:{kind:'other',proof:'observation_not_authority',checked_at_ms:1000,selection:selection(0,'primary')},signaturePolicy:policy},provider),'wrong kind');
 assertObservationRejection(await browser.admitProtectedBrowser({bytes:f.bytes,plaintextPayload:f.plaintext,observation:{kind:'consumer_unlock_observation',proof:'authority',checked_at_ms:1000,selection:selection(0,'primary')},signaturePolicy:policy},provider),'wrong proof');
});
test('browser admission takes typed binary inputs only and never stringifies them',async()=>{
 const r=await browser.admitProtectedBrowser({bytes:Buffer.from('AAAA').toString('base64'),plaintextPayload:new Uint8Array(1),observation:observation(selection(0,'primary'))},provider);
 assert.equal(r.status,'protection_failed',JSON.stringify(r));
 assert.equal(r.diagnostic.code,'PROTECTION_INPUT_INVALID');
 const r2=await browser.admitProtectedBrowser({bytes:new Uint8Array(1),plaintextPayload:'stringified',observation:observation(selection(0,'primary'))},provider);
 assert.equal(r2.status,'protection_failed',JSON.stringify(r2));
 assert.equal(r2.diagnostic.code,'PROTECTION_INPUT_INVALID');
});
