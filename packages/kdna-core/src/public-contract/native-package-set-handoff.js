'use strict';
const {parseJson,copyJson,canonicalJson,freeze} = require('./strict-input.js');
const {digestCanonical} = require('./digests.js');
const admission = require('./native-package-set-admission.js');
const delivery = require('./native-package-set-delivery-state.js');
const {snapshots} = require('./section-native-state.js');
const {inspectAdmittedPlan} = require('./execution-sections-node.js');
const V = require('./packageset06/validators.cjs');
const same = (a,b) => canonicalJson(a)===canonicalJson(b);
const invalid = () => freeze({status:'rejected',diagnostic:'handoff_invalid'});
function expected(token, plan, exactAdmission) {
  const d=delivery.inspect(token), p=inspectAdmittedPlan(plan);
  if (!d || !p || exactAdmission && d.admission!==exactAdmission) throw Error('NATIVE_HANDOFF_BRAND');
  const s=admission.admissionState(d.admission), v=snapshots.get(s?.selected_member.snapshot), env=d.result.envelope;
  if (!s || !v || v.verification.semantic_status!=='verified_whole_graph' || v.verification.ir_digest.status!=='verified') throw Error('NATIVE_HANDOFF_SOURCE');
  const selection={asset_id:s.set.selection.asset_id,asset_version:s.set.selection.asset_version,judgment_ids:[s.set.selection.judgment_id]};
  const source={asset:v.asset,origin_tuple:v.tuple,digests:v.digests,ir_digest:v.verification.ir_digest.digest};
  if (!same(p.selection,selection) || !same(p.source,source) || !same(env.digests,v.digests) || env.snapshot_id!==v.snapshot_id || env.receipt.snapshot_id!==v.snapshot_id || env.receipt.host_id!==s.host_id || env.receipt.host_epoch!==s.host_epoch) throw Error('NATIVE_HANDOFF_BINDING');
  const closure=digestCanonical(env.content.closure);
  if (closure!==p.closure_digest) throw Error('NATIVE_HANDOFF_CLOSURE');
  const members=s.members.map(m=>{const x=snapshots.get(m.snapshot);if(!x||x.verification.semantic_status!=='verified_whole_graph')throw Error('NATIVE_HANDOFF_MEMBER');return {member_id:m.member_id,asset_id:x.asset.asset_id,asset_version:x.asset.asset_version,A:x.digests.A.observed,C:x.digests.C.observed,snapshot_id:x.snapshot_id};}).sort((a,b)=>Buffer.compare(Buffer.from(a.member_id),Buffer.from(b.member_id)));
  if(new Set(members.map(m=>m.member_id)).size!==members.length)throw Error('NATIVE_HANDOFF_DUPLICATE');
  return {contract:'kdna.package-set-handoff/0.3.0-candidate',origin_tuple:v.tuple,execution_tuple:p.tuple,set_id:s.set.set_id,members,selection:s.set.selection,closure_digest:closure,read_receipt_id:env.receipt.receipt_id,plan_digest:digestCanonical(p),host_id:env.receipt.host_id,host_epoch:env.receipt.host_epoch,definition_digest:admission.descriptor.contract.definition_digest};
}
function seal(token,plan) {
  try { const value=expected(token,plan);if(!V.NativePackageSetHandoff06(value))return invalid();return freeze({status:'valid',value,proof:'claims_not_authenticated'}); }catch{return invalid();}
}
function verify(wire,origin,plan,token) {
  try {if(!admission.admissionState(origin))return invalid();const value=typeof wire==='string'?parseJson(wire):copyJson(wire);if(!V.NativePackageSetHandoff06(value)||!same(value,expected(token,plan,origin)))return invalid();return freeze({status:'valid',value,proof:'claims_not_authenticated'});}catch{return invalid();}
}
function admit(wire,token,plan) {const d=delivery.inspect(token);return d?verify(wire,d.admission,plan,token):invalid();}
module.exports={seal,verify,admit};
