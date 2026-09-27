'use strict';
// Isolate the captured monotonic clock from the test runner and every other case.
// The production issuer and cryptographic primitive are loaded unchanged.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const bytes=Buffer.from(input.bytes,'base64');
const secrets={...input.secrets,issuerRootKey:Buffer.from(input.secrets.issuerRootKey,'base64'),issuerSigningPrivateKeyPkcs8:Buffer.from(input.secrets.issuerSigningPrivateKeyPkcs8,'base64')};
const actualMonotonic=process.hrtime.bigint,actualSign=crypto.sign;
let now=1000000000n,samples=[],invoked=0;
process.hrtime.bigint=()=>{samples.push({now,invoked});return now;};
let issuer;
try { issuer=require(process.argv[2]); }
finally { process.hrtime.bigint=actualMonotonic; }

async function run(crossDeadline){
 const timeoutMs=25,start=now,deadline=start+BigInt(timeoutMs)*1000000n;
 samples=[];invoked=0;let signatureVerified=false;
 crypto.sign=function(...args){
  invoked++;
  assert.ok(now<deadline,'The real signing primitive must begin before the deadline.');
  const signature=actualSign.apply(this,args);
  signatureVerified=crypto.verify(args[0],args[1],crypto.createPublicKey(args[2]),signature);
  assert.equal(signatureVerified,true,'The wrapper must forward a real, valid signature.');
  // Advance only after the unchanged synchronous signing primitive completed.
  if(crossDeadline)now=deadline+1n;
  return signature;
 };
 let out;
 try { out=await issuer.issueExternalKeyGrantForAsset(bytes,{...input.options,timeout_ms:timeoutMs},secrets); }
 finally { crypto.sign=actualSign; }
 assert.equal(invoked,1);
 assert.ok(samples.some(x=>x.invoked===0&&x.now<deadline));
 if(crossDeadline){
  assert.ok(samples.some(x=>x.invoked===1&&x.now>deadline),'A production checkpoint must observe expiry after sign.');
  assert.deepEqual(out,{status:'issuer_failed',code:'ISSUER_OUTPUT_INVALID',stage:'grant'});
  assert.equal(out.grantBytes,undefined);
 }else{
  assert.equal(out.status,'issued',JSON.stringify(out));
  assert.ok(out.grantBytes.length>0,'The exact same input must publish a real grant before expiry.');
 }
 return {mode:crossDeadline?'cross_deadline':'within_deadline',invoked,signature_verified:signatureVerified,before_sign_samples:samples.filter(x=>x.invoked===0&&x.now<deadline).length,after_sign_expired_samples:samples.filter(x=>x.invoked===1&&x.now>deadline).length,output:crossDeadline?out:{status:out.status,grant_bytes:out.grantBytes.length},timeout_ms:timeoutMs};
}
(async()=>{
 try {
  const control=await run(false),crossed=await run(true);
  process.stdout.write(JSON.stringify({entry:process.argv[2],clock:'isolated monotonic captured before module load; restored globally before execution',control,crossed})+'\n');
 }finally{crypto.sign=actualSign;process.hrtime.bigint=actualMonotonic;bytes.fill(0);secrets.issuerRootKey.fill(0);secrets.issuerSigningPrivateKeyPkcs8.fill(0);}
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
