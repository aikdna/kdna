'use strict';
const test=require('node:test'),fs=require('node:fs');
const H=require('./protection-test-helpers.js'),{assert,path,coreDir}=H;
const codec=require(path.join(coreDir,'src/public-contract/protection-envelope-codec.js')),crypt=require(path.join(coreDir,'src/public-contract/protection-crypto.js')),legacy=require(path.join(coreDir,'src/crypto-profile.js'));
for(const file of ['envelope-aead-vector-01-scrypt-basic.json','envelope-aead-vector-03-argon2id-basic.json','envelope-aead-vector-04-scrypt-multi-slot.json','envelope-aead-vector-05-mixed-multi-slot.json'])test('historical fixed KAT '+file+' retains original byte domain',()=>{
 const v=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/envelope-aead',file))),envelope=v.expected.envelope;
 crypt.validateEnvelope(envelope,{id:'kdna.envelope.aead',version:'0.1.0'});
 envelope.key_slots.forEach((slot,index)=>{const password=Buffer.from(v.inputs.password??v.inputs.credentials[index]),kek=crypt.deriveKek(password,slot);assert.equal(kek.toString('base64'),v.expected.kek??v.expected.keks[index]);const cek=legacy.aesUnwrap(kek,Buffer.from(slot.wrapped_key,'base64'));assert.equal(cek.toString('base64'),v.inputs.cek);assert.equal(crypt.decryptGcm(envelope,cek,Buffer.from(v.inputs.aad)).toString(),v.inputs.plaintext);assert.throws(()=>crypt.decryptGcm(envelope,cek,Buffer.from(v.inputs.aad+'x')));cek.fill(0);kek.fill(0);});
 assert.deepEqual(codec.decodeEnvelope(codec.encodeEnvelope(envelope)),envelope);
});
test('canonical CBOR length-first order is independently pinned and rejects duplicate/noncanonical/JSON wire',()=>{
 const expected=Buffer.from('a361610161620262616103','hex'),value={aa:3,b:2,a:1};assert.equal(Buffer.from(codec.encodeEnvelope(value)).toString('hex'),expected.toString('hex'));assert.deepEqual(codec.decodeEnvelope(expected),{a:1,b:2,aa:3});
 for(const hex of ['a2616101616102','a262616103616101','a161611801','bf616101ff','c1a1616101','a161610100','a10101','a16161f5','a161614100','a161611b0020000000000000'])assert.throws(()=>codec.decodeEnvelope(Buffer.from(hex,'hex')),hex);
 assert.throws(()=>codec.decodeEnvelope(Buffer.from('{"profile":"kdna.envelope.aead"}')));
});
test('all slot shapes and exact KDF parameters are validated before selected KDF work',()=>{
 const v=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/envelope-aead/envelope-aead-vector-01-scrypt-basic.json'))).expected.envelope;
 for(const edit of [e=>e.key_slots[0].kdf_params.N=65536,e=>e.key_slots[0].kdf_params.extra=true,e=>e.key_slots.push({...e.key_slots[0],kdf_profile:'other'}),e=>e.kdf_profile='argon2id',e=>e.iv+='=',e=>e.tag=e.tag.slice(0,-2)+'AB']){const e=structuredClone(v);edit(e);assert.throws(()=>crypt.validateEnvelope(e,{id:'kdna.envelope.aead',version:'0.1.0'}));}
});
test('kdsig old member preimage agrees with frozen old helper on case and Unicode boundaries',()=>{
 const own=require(path.join(coreDir,'src/public-contract/protection-integrity.js')).signatureContentDigest,old=require(path.join(coreDir,'src/asset-reader.js')).contentDigestFromEntryBuffers;
 const entries={'mimetype':Buffer.from('application/vnd.kdna.asset'),'kdna.json':Buffer.from(JSON.stringify({asset_id:'a',content_digest:'ignored',authoring:{content_digest:'ignored',keep:['b','a']},nested:{content_digest:'kept'},asset_digest:'ignored',container_sha256:'ignored',_source:'ignored'})),'payload.kdnab':Buffer.from('payload'),'attachments/\ue000.JSON':Buffer.from('{"b":1,"a":2}'),'attachments/\u{10000}.JSON':Buffer.from('{"z":[2,1]}'),'checksums.json':Buffer.from('{"profile":"independent-domain"}')};
 assert.equal(own(entries),old(entries));const before=own(entries);entries['checksums.json']=Buffer.from('{"profile":"changed"}');assert.notEqual(own(entries),before);assert.equal(own(entries),old(entries));
});
test('frozen kdsig vector pins old digest and exact signing and bundle bytes independently of producer',()=>{
 const v=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/signature/vectors.json'))),entries=Object.fromEntries(Object.entries(v.asset.entries).map(([k,hex])=>[k,Buffer.from(hex,'hex')]));
 const {signatureContentPreimage,signatureContentDigest,signEntries}=require(path.join(coreDir,'src/public-contract/protection-integrity.js')),signature=require(path.join(coreDir,'src/signature.js'));
 const expectedPreimage=Buffer.from(Object.keys(entries).sort().map(name=>name+':'+H.crypto.createHash('sha256').update(name==='kdna.json'?Buffer.from(entries[name].toString().trimEnd()):entries[name]).digest('hex')).join('\n'));assert.deepEqual(signatureContentPreimage(entries),expectedPreimage);assert.equal(signatureContentDigest(entries),v.expected.content_digest);assert.equal(signature.buildSigningPayload(v.expected.content_digest).toString('hex'),v.expected.signing_payload_hex);assert.equal(signEntries(entries,Buffer.from(v.key.seed_hex,'hex')).toString('hex'),v.expected.bundle_bytes_hex);
});
test('historical vector02 AAD experiment authenticates each exact old entry only',()=>{
 const v=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/envelope-aead/envelope-aead-vector-02-scrypt-multi-entry-aad.json'))),cek=Buffer.from(v.inputs.cek,'base64');
 for(const i of [1,2]){const e=v.expected['envelope_entry_'+i];assert.equal(crypt.decryptGcm(e,cek,Buffer.from(v.inputs['aad_entry_'+i])).toString(),v.inputs.plaintext);assert.throws(()=>crypt.decryptGcm(e,cek,Buffer.from(v.inputs['aad_entry_'+(3-i)])));}
 assert.equal(v.expected.envelope_entry_1.ciphertext,v.expected.envelope_entry_2.ciphertext);assert.notEqual(v.expected.envelope_entry_1.tag,v.expected.envelope_entry_2.tag);
});
test('historical external grant fixed signing wrapping and plaintext KAT stays separate from current container admission',()=>{
 const v=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/external-grant/golden.json'))),k=v.test_keys,g=v.grant;
 const privateKey=Buffer.concat([Buffer.from('302e020100300506032b656e04220420','hex'),Buffer.from(k.device_agreement_private_key.slice(7),'base64url')]);
 const credential={expected:{issuer:g.issuer,signing_key_id:g.signing_key_id,issuer_public_key:k.issuer_signing_public_key,account_id:g.account_id,entitlement_id:g.entitlement_id,entitlement_profile:'account',device_id:g.device_id,device_agreement_public_key:k.device_agreement_public_key,device_signing_public_key:k.device_signing_public_key},deviceAgreementPrivateKeyPkcs8:privateKey};
 const grant=require(path.join(coreDir,'src/public-contract/protection-grant.js')),verified=grant.verifyGrant(Buffer.from(JSON.stringify(g)),credential,v.manifest,v.envelope,v.expected_asset_digest);
 assert.equal(grant.grantPlaintext(verified,v.manifest,v.envelope).toString('base64'),v.plaintext_cbor);assert.equal('sha256:'+H.crypto.createHash('sha256').update(Buffer.from(v.asset_kdna_base64url,'base64url')).digest('hex'),v.expected_asset_digest);
 assert.throws(()=>codec.decodeEnvelope(Buffer.from(v.envelope_cbor,'base64')),'Historical noncanonical bytes must not be relabeled current canonical wire');
});
test('frozen ciphertext base64 recognizer agrees with original pattern without multi-MiB RegExp stack exhaustion',()=>{
 const schema=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../specs/envelope-aead.schema.json'))),pattern=schema.properties.ciphertext.pattern,native=new RegExp(pattern),safe=codec.envelopeRegExp(pattern,'u');
 const alphabet=['A','B','Q','w','/','+','=','_',' ','\n'];for(let i=0;i<10000;i++){let n=i,s='';for(let j=0;j<4;j++){s+=alphabet[n%alphabet.length];n=Math.floor(n/alphabet.length);}assert.equal(safe.test(s),native.test(s),JSON.stringify(s));}
 const v=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/envelope-aead/envelope-aead-vector-01-scrypt-basic.json'))).expected.envelope;assert.doesNotThrow(()=>crypt.validateEnvelope({...v,ciphertext:'A'.repeat(6000000)},{id:'kdna.envelope.aead',version:'0.1.0'}));
});
