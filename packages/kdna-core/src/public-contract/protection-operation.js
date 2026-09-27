'use strict';
const { randomUUID } = require('node:crypto');
const { freeze, uint } = require('./strict-input.js');
const { fail, failure, contract } = require('./protection-declaration.js');
const { verifyGrant, grantPlaintext, validity, advance, authorization } = require('./protection-grant.js');
const { markProtectedSnapshot } = require('./brand.js');
const operations=new WeakMap(),checkpoints=new WeakMap();
const phases=new Set(['projection','host_observation','host_handoff','read_return','transport_commit','execution']);
function stageFor(phase) { return ['projection','host_handoff','transport_commit'].includes(phase)?phase:'authorization'; }
function alive(record,stage) { if(record.disposed)fail('OPERATION_DISPOSED',stage); }
function clock(record,stage,observation) {
  if(observation)observation.checked_at_ms=null;
  alive(record,stage);const generation=record.generation;let now;
  try { now=record.provider.clock(); } catch { alive(record,stage);fail('PROVIDER_FAILED',stage); }
  if(!uint(now))fail('PROVIDER_FAILED',stage);
  if(now<record.lastTime)fail('STATE_ROLLBACK',stage);
  if(observation)observation.checked_at_ms=now;
  alive(record,stage);
  if(generation!==record.generation)fail('STATE_ROLLBACK',stage);
  record.lastTime=now;return now;
}
function receipt(record,now) { return freeze({contract:contract(),operation_id:record.id,...record.digests,entry:'payload.kdnab',encryption:record.profile,plaintext_digest:record.plaintextDigest,integrity:record.integrity,authorization:authorization(record),checked_at_ms:now,proof:'observation_not_authority'}); }
async function current(record,stage,observation) {
  const generation=record.generation,check=()=>{alive(record,stage);if(generation!==record.generation)fail('STATE_ROLLBACK',stage);};
  let now=clock(record,stage,observation);
  if(record.credential.kind==='external-grant') {
    if(record.credential.mode==='online' && now>=record.verified.times.refresh && record.verified.grant.status==='active' && now<record.verified.times.expires) {
      if(!record.provider.capabilities.status_refresh || !record.provider.refresh)fail('REFRESH_REQUIRED',stage);
      const g=record.verified.grant;let raw;
      try { raw=await record.provider.refresh(freeze({issuer:g.issuer,account_id:g.account_id,entitlement_id:g.entitlement_id,device_id:g.device_id,A:record.digests.A,grant_id:g.grant_id,status_version:g.status_version,purpose:stage})); } catch {check();fail('PROVIDER_FAILED',stage);}
      check();
      const verified=verifyGrant(raw,record.credential,record.manifest,record.envelope,record.digests.A);
      if(verified.grant.status_version<g.status_version)fail('STATE_ROLLBACK',stage);
      // A refreshed wrapping must still authenticate this exact admitted payload.
      if(verified.grant.status==='active') { const plain=grantPlaintext(verified,record.manifest,record.envelope);plain.fill(0); }
      record.verified=verified;now=clock(record,stage,observation);
    }
    await advance(record,now,stage,check);check();now=clock(record,stage,observation);validity(record,now,stage);
  }
  check();return now;
}
async function issueOperation(data) {
  const record={...data,id:'protection:'+randomUUID(),generation:0,disposed:false,lastTime:0,highWater:null,queue:Promise.resolve()};
  const now=await current(record,'authorization');
  const operation=Object.freeze({});operations.set(operation,record);
  if(record.source.kind==='snapshot')markProtectedSnapshot(record.source.snapshot,()=>!record.disposed);
  return {operation,receipt:receipt(record,now)};
}
function bindProtectionOperation(operation) {
  const record=operations.get(operation);
  if(!record)return failure(null,'OPERATION_UNTRUSTED','input');
  if(record.disposed)return failure(null,'OPERATION_DISPOSED','input');
  const binding=Object.freeze({
    source() { try {alive(record,'input');return Object.freeze({...record.source});}catch(e){return failure(e);} },
    observe(phase) {
      if(!phases.has(phase))return Promise.resolve(freeze({...failure(null,'INPUT_INVALID','input'),checked_at_ms:null}));
      const stage=stageFor(phase);
      const task=record.queue.then(async()=>{
        const observation={checked_at_ms:null};
        try {const now=await current(record,stage,observation);alive(record,stage);record.generation++;const checkpoint=Object.freeze({});checkpoints.set(checkpoint,{record,generation:record.generation,stage});return Object.freeze({status:'current',checkpoint,receipt:receipt(record,now)});}catch(e){return freeze({...failure(e,'PROVIDER_FAILED',stage),checked_at_ms:observation.checked_at_ms});}
      });
      record.queue=task.then(()=>undefined,()=>undefined);return task;
    },
    assertCurrent(checkpoint) {
      const cp=checkpoints.get(checkpoint);
      if(!cp||cp.record!==record)return freeze({...failure(null,'OPERATION_UNTRUSTED','input'),checked_at_ms:null});
      const observation={checked_at_ms:null};
      try {alive(record,cp.stage);if(cp.generation!==record.generation)fail('STATE_ROLLBACK',cp.stage);const now=clock(record,cp.stage,observation);alive(record,cp.stage);if(cp.generation!==record.generation)fail('STATE_ROLLBACK',cp.stage);if(record.credential.kind==='external-grant')validity(record,now,cp.stage);return Object.freeze({status:'current',receipt:receipt(record,now)});}catch(e){return freeze({...failure(e,'PROVIDER_FAILED',cp.stage),checked_at_ms:observation.checked_at_ms});}
    }
  });
  return Object.freeze({status:'bound',binding});
}
function disposeProtectionOperation(operation) {
  const record=operations.get(operation);if(!record||record.disposed)return;
  record.disposed=true;record.generation++;
  for(const name of ['password','grantBytes','deviceAgreementPrivateKeyPkcs8'])record.credential[name]?.fill(0);
  record.verified=null;
}
module.exports={issueOperation,bindProtectionOperation,disposeProtectionOperation};
