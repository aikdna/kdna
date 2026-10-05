'use strict';
const {hosts}=require('./brands.js');const{clone,freeze,jcs}=require('./util.js');const V=require('./sections/validators.cjs');const crypto=require('node:crypto');
function canonicalDigest(value){return 'sha256:'+crypto.createHash('sha256').update(jcs(value)).digest('hex');}
async function observeSectionHost(provider,request,snapshot,view){
 const state=hosts.get(provider);if(!state)return {error:'READ_HOST_CONTEXT_UNTRUSTED'};let value;try{value=clone(await state.observe(freeze({request,snapshot})));}catch{return {error:'READ_CORE_CAPABILITY_UNAVAILABLE'};}
 if(!V.SectionHostObservation06(value))return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
 if(value.request_id!==request.request_id||value.snapshot_id!==view.snapshot_id||value.capture_id!==view.verification.capture.capture_id||value.request_digest!==view.request_digest||value.checked_sections_digest!==canonicalDigest(view.verification.checked_sections)||jcs(value.asset)!==jcs(view.asset)||jcs(value.tuple)!==jcs(view.tuple))return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
 if(value.issued_at>=value.expires_at||value.expires_at-value.issued_at>3600000)return {error:'READ_HOST_CONTEXT_UNTRUSTED'};if(value.current_ms<value.issued_at)return {error:'READ_HOST_TIME_INVALID'};if(value.current_ms>=value.expires_at)return {error:'READ_HOST_CONTEXT_EXPIRED'};
 const handle=request.handle;if(handle){if(handle.host_id!==value.host_id||handle.host_epoch!==value.host_epoch)return {error:'READ_HANDLE_UNTRUSTED'};if(value.current_ms<handle.issued_at)return {error:'READ_HOST_TIME_INVALID'};if(value.current_ms>=handle.expires_at)return {error:'READ_HANDLE_EXPIRED'};}
 const denial=jcs([value.host_id,value.host_epoch,view.asset.asset_id]);if(value.lift_denial===true)state.revocations.delete(denial);if(value.revoked===true||value.decision==='deny')state.revocations.add(denial);if(state.revocations.has(denial))return {error:'READ_HOST_DENIED'};return {value,state};
}
module.exports={observeSectionHost,canonicalDigest};
