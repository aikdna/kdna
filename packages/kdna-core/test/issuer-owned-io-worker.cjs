'use strict';
// Each child loads the unchanged issuer with a controlled monotonic clock.
// Pending I/O is released by explicit barriers, never by a wall-clock sleep.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),fsp=require('node:fs/promises');
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const bytes=Buffer.from(input.bytes,'base64');
const secrets={...input.secrets,issuerRootKey:Buffer.from(input.secrets.issuerRootKey,'base64'),issuerSigningPrivateKeyPkcs8:Buffer.from(input.secrets.issuerSigningPrivateKeyPkcs8,'base64')};
const original={monotonic:process.hrtime.bigint,open:fsp.open,sign:crypto.sign,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout};
let now=1000000000n;
process.hrtime.bigint=()=>now;
let issuer;
try{issuer=require(process.argv[2]);}finally{process.hrtime.bigint=original.monotonic;}
function deferred(){let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};}
const drain=()=>new Promise(resolve=>setImmediate(resolve));
const failure=(code)=>({status:'issuer_failed',code,stage:'input'});

async function run(phase,expire){
 const count=expire?4:1,timeoutMs=10,deadline=now+BigInt(timeoutMs)*1000000n;
 const timers=new Set(),pending=[],handles=[],jobs=[],allReached=deferred();
 let reached=0,opened=0,closed=0,signed=0,verified=0,timersFired=0;
 const events=[];
 const block=()=>{
  const gate=deferred();pending.push(gate);reached++;events.push('blocked:'+phase);
  if(reached===count)allReached.resolve();
  return gate.promise;
 };
 const release=()=>{for(const gate of pending)gate.resolve();};
 // Real timer callbacks are invoked only after all target operations are owned.
 // Their requested delays and clearing behavior are retained and checked.
 global.setTimeout=(callback,delay)=>{assert.equal(delay,timeoutMs);const timer={callback,due:now+BigInt(delay)*1000000n};timers.add(timer);return timer;};
 global.clearTimeout=timer=>{timers.delete(timer);};
 crypto.sign=function(...args){signed++;const signature=original.sign.apply(this,args);assert.equal(crypto.verify(args[0],args[1],crypto.createPublicKey(args[2]),signature),true);verified++;return signature;};
 fsp.open=async()=>{
  opened++;events.push('open');let reads=0;const closedDone=deferred();handles.push(closedDone);
  const handle={
   async stat(){events.push('stat');if(phase==='stat')await block();return {isFile:()=>true,size:bytes.length};},
   async read(buffer){
    events.push('read');if(phase==='read'&&reads===0)await block();
    if(reads++)return {bytesRead:0};
    assert.ok(buffer.length>=bytes.length);buffer.set(bytes);return {bytesRead:bytes.length};
   },
   async close(){events.push('close:start');if(phase==='close')await block();closed++;events.push('close:settled');closedDone.resolve();}
  };
  if(phase==='open')await block();
  return handle;
 };
 try{
  for(let i=0;i<count;i++)jobs.push(issuer.issueExternalKeyGrantForAsset('/synthetic/'+phase,{...input.options,timeout_ms:timeoutMs},secrets));
  // An early result is a fixture failure; it cannot masquerade as target timeout.
  await Promise.race([allReached.promise,...jobs.map(job=>job.then(()=>{throw Error('Issuer settled before all '+phase+' barriers');}))]);
  assert.equal(reached,count);assert.equal(opened,count);assert.equal(timers.size,count);assert.equal(closed,0,'No blocked handle has settled.');assert.equal(signed,0,'Signing cannot precede the owned I/O barrier release.');
  if(!expire){
   release();const [output]=await Promise.all(jobs);await Promise.all(handles.map(x=>x.promise));await drain();
   assert.equal(output.status,'issued',JSON.stringify(output));assert.equal(signed,1);assert.equal(closed,1);assert.equal(timers.size,0);
   return {reached,opened,closed,signed,verified,output:{status:output.status,grant_bytes:output.grantBytes.length},events};
  }
  now=deadline+1n;events.push('deadline:advanced-after-all-targets');
  for(const timer of [...timers]){assert.ok(now>=timer.due);timers.delete(timer);timersFired++;timer.callback();}
  const outputs=await Promise.all(jobs);
  for(const out of outputs)assert.deepEqual(out,failure('ISSUER_OUTPUT_INVALID'));
  const busy=await issuer.issueExternalKeyGrantForAsset(bytes,{...input.options,timeout_ms:timeoutMs},secrets);
  assert.deepEqual(busy,failure('ISSUER_INPUT_INVALID'),'All four timed-out owners must still reserve their slots.');
  const closedBeforeRelease=closed;assert.equal(closedBeforeRelease,0);assert.equal(signed,0);
  release();await Promise.all(handles.map(x=>x.promise));await drain();
  assert.equal(closed,count);assert.equal(signed,0);assert.equal(timers.size,0);
  if(phase==='open')assert.equal(events.filter(x=>x==='stat').length,0);
  if(phase==='stat')assert.equal(events.filter(x=>x==='read').length,0);
  const signedBeforeRecovery=signed;
  const recovery=await issuer.issueExternalKeyGrantForAsset(bytes,{...input.options,timeout_ms:timeoutMs},secrets);
  assert.equal(recovery.status,'issued',JSON.stringify(recovery));assert.equal(signed,1);assert.equal(timers.size,0);
  return {reached,opened,closed,closed_before_release:closedBeforeRelease,signed_before_recovery:signedBeforeRecovery,timers_fired:timersFired,outputs,busy,recovery:{status:recovery.status,signed:signed-signedBeforeRecovery,verified},events};
 }finally{
  // Also runs after an assertion failure: settle every owned I/O before restoring
  // hooks. A child watchdog bounds a broken product that never closes its handle.
  release();await Promise.allSettled(jobs);await Promise.all(handles.map(x=>x.promise));await drain();
  timers.clear();fsp.open=original.open;crypto.sign=original.sign;global.setTimeout=original.setTimeout;global.clearTimeout=original.clearTimeout;
 }
}
(async()=>{
 try{
  const rows=[];
  for(const phase of process.argv.slice(3)){
   assert.ok(['open','stat','read','close'].includes(phase));
   rows.push({phase,control:await run(phase,false),timed_out:await run(phase,true)});
  }
  process.stdout.write(JSON.stringify({entry:process.argv[2],clock:'Controlled monotonic and deadline timer callbacks; no elapsed-time preconditions. Each target barrier precedes expiry.',rows})+'\n');
 }finally{
  process.hrtime.bigint=original.monotonic;fsp.open=original.open;crypto.sign=original.sign;global.setTimeout=original.setTimeout;global.clearTimeout=original.clearTimeout;
  bytes.fill(0);secrets.issuerRootKey.fill(0);secrets.issuerSigningPrivateKeyPkcs8.fill(0);
 }
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
