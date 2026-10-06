'use strict';
const test=require('node:test'),fs=require('node:fs');
const H=require('./protection-test-helpers.js'),{assert,path,coreDir}=H;
const codec=require(path.join(coreDir,'src/public-contract/protection-envelope-codec.js')),crypt=require(path.join(coreDir,'src/public-contract/protection-crypto.js'));
const AEAD_PROFILE={id:'kdna.envelope.aead',version:'0.1.0'},EXTERNAL_PROFILE={id:'kdna.envelope.external-grant',version:'0.1.0'};
// Differential oracle: the retained Node buffer codec (lenient decode plus canonical
// round-trip check plus optional length pin). Every case must keep the same verdict,
// and accepts must carry the same bytes.
function bufferVerdict(str,url,length){const encoding=url?'base64url':'base64',decoded=Buffer.from(str,encoding);return{ok:decoded.toString(encoding)===str&&(length===null||length===undefined||decoded.length===length),bytes:decoded};}
function shapeVerdict(str,url,length){try{return{ok:true,bytes:Buffer.from(codec.decode64Bytes(str,length===undefined?null:length,url))};}catch{return{ok:false};}}
function parity(label,str,url=false,length=undefined){const expected=bufferVerdict(str,url,length),actual=shapeVerdict(str,url,length);assert.equal(actual.ok,expected.ok,label+' verdict url='+url+' len='+length+' '+JSON.stringify(str.length>64?str.slice(0,64)+'...':str));if(actual.ok)assert.deepEqual(actual.bytes,expected.bytes,label+' bytes url='+url+' len='+length);}
test('decode64Bytes keeps the buffer codec verdicts and bytes across the frozen envelope corpus',()=>{
 const files=['envelope-aead-vector-01-scrypt-basic.json','envelope-aead-vector-02-scrypt-multi-entry-aad.json','envelope-aead-vector-03-argon2id-basic.json','envelope-aead-vector-04-scrypt-multi-slot.json','envelope-aead-vector-05-mixed-multi-slot.json'];
 let strings=0;const walk=x=>{if(typeof x==='string'){strings++;for(const url of [false,true])parity('corpus',x,url);}else if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object')Object.keys(x).forEach(k=>walk(x[k]));};
 for(const file of files)walk(JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/envelope-aead',file))));
 const golden=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/external-grant/golden.json')));walk(golden);
 let pins=0;
 for(const file of ['envelope-aead-vector-01-scrypt-basic.json','envelope-aead-vector-04-scrypt-multi-slot.json','envelope-aead-vector-05-mixed-multi-slot.json']){
  const e=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/envelope-aead',file))).expected.envelope;
  for(const slot of e.key_slots){parity('pin-salt',slot.kdf_params.salt,false,16);parity('pin-wrapped',slot.wrapped_key,false,40);pins+=2;}
  parity('pin-iv',e.iv,false,12);parity('pin-tag',e.tag,false,16);pins+=2;
 }
 assert.ok(strings>=40&&pins>=10,'corpus breadth insufficient: '+strings+' strings / '+pins+' pins');
 console.log('corpus differential: strings='+strings+' (x2 encodings), pins='+pins);
});
test('decode64Bytes keeps the buffer codec verdicts on the hostile and boundary string family',()=>{
 const hostile=['','=','==','===','====','A','AB','ABC','ABCD','YQ','YQ=','YQ==','YQ===','YR==','AB==','A===','=YQ=','Y Q==','YQ==\n','\nYQ==','YQ ==','+/','-_','+/==','-_==','AAA=','AAAA','Zm9v','Zm9vYg','Zm9vYmE','Zm9vYmFy','üü==','YQ=\u0000'];
 for(const s of hostile){for(const url of [false,true])parity('hostile',s,url);parity('hostile-pin',s,false,1);parity('hostile-pin0',s,false,0);}
 for(const bad of [null,undefined,123,true,new Uint8Array(2),['YQ=='],{length:4}])assert.throws(()=>codec.decode64Bytes(bad),'non-string rejects');
 parity('long-accept','A'.repeat(6000000),false);
 parity('long-full-group','B'.repeat(999999)+'A',false);
 parity('long-url','A'.repeat(999998)+'B',true);
});
test('validateEnvelopeShape keeps the retained verdict language on frozen and mutated envelopes',()=>{
 const files=['envelope-aead-vector-01-scrypt-basic.json','envelope-aead-vector-02-scrypt-multi-entry-aad.json','envelope-aead-vector-03-argon2id-basic.json','envelope-aead-vector-04-scrypt-multi-slot.json','envelope-aead-vector-05-mixed-multi-slot.json'];
 const verdict=fn=>{try{fn();return true;}catch{return false;}};
 let checked=0;
 for(const file of files){
  const v=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/envelope-aead',file)));
  const envelopes=[v.expected.envelope,v.expected.envelope_entry_1,v.expected.envelope_entry_2].filter(Boolean);
  for(const e of envelopes){
   for(const profile of [AEAD_PROFILE,EXTERNAL_PROFILE]){const a=structuredClone(e),b=structuredClone(e);assert.equal(verdict(()=>crypt.validateEnvelope(a,profile)),verdict(()=>codec.validateEnvelopeShape(b,profile)),file+' profile '+profile.id);checked++;}
   const mutations=[x=>x.key_slots[0].kdf_params.N=65536,x=>x.key_slots[0].kdf_params.extra=true,x=>x.key_slots.push({...x.key_slots[0],kdf_profile:'other'}),x=>x.kdf_profile='argon2id',x=>x.iv+='=',x=>x.tag=x.tag.slice(0,-2)+'AB',x=>{delete x.key_slots[0].wrapped_key;},x=>x.ciphertext=x.ciphertext.slice(1)];
   for(const edit of mutations){const a=structuredClone(e),b=structuredClone(e);edit(a);edit(b);const oldOk=verdict(()=>crypt.validateEnvelope(a,AEAD_PROFILE)),newOk=verdict(()=>codec.validateEnvelopeShape(b,AEAD_PROFILE));assert.equal(oldOk,newOk,file+' mutation '+checked);if(file==='envelope-aead-vector-01-scrypt-basic.json')assert.equal(oldOk,false,file+' mutation must reject');checked++;}
  }
 }
 const golden=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../conformance/external-grant/golden.json')));
 if(golden.envelope)for(const profile of [EXTERNAL_PROFILE,AEAD_PROFILE]){const a=structuredClone(golden.envelope),b=structuredClone(golden.envelope);assert.equal(verdict(()=>crypt.validateEnvelope(a,profile)),verdict(()=>codec.validateEnvelopeShape(b,profile)),'golden external '+profile.id);checked++;}
 console.log('envelope verdicts checked: '+checked);
});
test('passwordAadBytes equals the retained Buffer construction byte for byte',()=>{
 const manifests=[{asset_uid:'kdna:asset:demo',asset_id:'asset:demo',version:'1.0.0',access:'licensed',entitlement:{profile:'account'}},{asset_uid:'kdna:asset:é',asset_id:'asset:2',version:'0.0.1',access:'public',entitlement:{profile:'team'}}];
 for(const m of manifests)assert.deepEqual(Buffer.from(codec.passwordAadBytes(m)),crypt.passwordAad(m));
});
