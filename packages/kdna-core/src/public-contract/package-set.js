'use strict';
const {canonicalJson,copyJson,freeze}=require('./strict-input.js');
const {versionTuple}=require('./generated-contract.json');

// Internal reference operation over independent admission and grant observations.
// Callers of the production bytes API cannot supply these observations.
function decidePackageSet(set,admitted,grants,operation,crossAssetReference){
 const reject=diagnostic=>freeze({status:'rejected',diagnostic,merged_ir:false,action_authorized:false});
 const members=copyJson(set.members),ids=members.map(x=>x.member_id);
 if(members.some(m=>!grants.some(g=>g.member_id===m.member_id&&g.A===m.A&&g.asset_id===m.asset_id&&g.asset_version===m.asset_version)))return reject('SET_MEMBER_UNAUTHORIZED');
 if(ids.some(id=>!admitted.some(a=>a.member_id===id)))return reject('SET_MEMBER_MISSING');
 if(admitted.some(a=>!ids.includes(a.member_id)))return reject('SET_MEMBER_EXTRA');
 if(new Set(ids).size!==ids.length||new Set(admitted.map(a=>a.member_id)).size!==admitted.length)return reject('SET_MEMBER_DUPLICATE');
 if(canonicalJson(set.tuple)!==canonicalJson(versionTuple))return reject(Object.keys(versionTuple).some(k=>k!=='payload_profile'&&set.tuple[k]===versionTuple[k])?'READ_MIXED_VERSION_TUPLE':'READ_UNSUPPORTED_VERSION');
 if(members.some(m=>{const a=admitted.find(a=>a.member_id===m.member_id);return a.core!=='valid'||a.A!==m.A||a.asset_id!==m.asset_id||a.asset_version!==m.asset_version;}))return reject('READ_CORE_INVALID');
 if(operation!=='isolated_read'||crossAssetReference)return reject('UNSUPPORTED_CROSS_ASSET_SEMANTIC_MERGE');
 const matches=admitted.filter(a=>a.asset_id===set.selection.asset_id&&a.asset_version===set.selection.asset_version).flatMap(a=>a.judgment_ids.filter(id=>id===set.selection.judgment_id).map(()=>a.member_id));
 if(matches.length!==1)return reject(matches.length?'READ_SELECTION_AMBIGUOUS':'READ_SELECTION_NOT_FOUND');
 return freeze({status:'allowed',selected_member:matches[0],merged_ir:false,action_authorized:false});
}
module.exports={decidePackageSet};

let handoffValidator;
// Internal correlation checker. The Host independently supplies an admitted
// complete Plan and the confirmed Read result; this operation does not admit a
// Plan, authorize a run, or execute anything. JSON handoff fields cannot replace
// any of those stage observations or the private Core snapshots.
function verifyHandoffBindings(handoff,{snapshots,deliveredRead,observeAdmittedPlan}){
 try{
  if(typeof observeAdmittedPlan!=='function'||!Array.isArray(snapshots))return false;
  if(!handoffValidator){
   handoffValidator=require('./handoff-validator.generated.js');
  }
  const value=copyJson(handoff);if(!handoffValidator(value))return false;
  const {inspectSnapshot}=require('./brand.js'),{capsuleDigest}=require('./digests.js'),{compareUtf8,identifier}=require('./strict-input.js');
  if(!identifier(value.set_id)||!identifier(value.host_id)||!identifier(value.host_epoch)||!identifier(value.read_receipt_id))return false;
  if(value.members.length!==snapshots.length||new Set(value.members.map(x=>x.member_id)).size!==value.members.length)return false;
  for(let i=0;i<value.members.length;i++){
   const member=value.members[i];if(!identifier(member.member_id)||(i&&compareUtf8(value.members[i-1].member_id,member.member_id)>=0))return false;
   const matches=snapshots.filter(x=>x.member_id===member.member_id);if(matches.length!==1)return false;
   const snapshot=inspectSnapshot(matches[0].snapshot);if(!snapshot)return false;
   if(member.asset_id!==snapshot.asset.asset_id||member.asset_version!==snapshot.asset.asset_version||member.A!==snapshot.digests.A.observed||member.C!==snapshot.digests.C.observed||member.snapshot_id!==snapshot.snapshot_id)return false;
  }
  const read=deliveredRead?.channel==='read_envelope'?deliveredRead.envelope:null;
  if(!read||read.status!=='ready'||read.receipt.delivery!=='delivered'||read.receipt.receipt_id!==value.read_receipt_id||read.receipt.host_id!==value.host_id||read.receipt.host_epoch!==value.host_epoch||canonicalJson(read.content.selected)!==canonicalJson(value.selection))return false;
  if(!value.members.some(m=>m.snapshot_id===read.snapshot_id&&m.A===read.digests.A.observed&&m.C===read.digests.C.observed))return false;
  if(capsuleDigest(read.content.closure)!==value.closure_digest)return false;
  const plan=observeAdmittedPlan();if(plan===null||plan===undefined||typeof plan.then==='function')return false;
  return capsuleDigest(plan)===value.plan_digest;
 }catch{return false;}
}
module.exports.verifyHandoffBindings=verifyHandoffBindings;
