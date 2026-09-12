'use strict';

const {uint,fixed,correlation,result}=require('./util.js');

// The caller has already admitted the request and measured complete final bodies.
// Keeping the decision separate permits exact boundary tests without treating
// symbolic test IR as an 8192-byte serialized envelope.
function decideBudget(record, successBytes, rejectionBytes, semanticCode=null) {
  if(!uint(record.budget_bytes)||!uint(rejectionBytes)||(successBytes!==null&&!uint(successBytes)))throw new TypeError('Invalid measured budget');
  if(semanticCode===null&&successBytes!==null&&successBytes<=record.budget_bytes)
    return {kind:'ready',required:fixed(successBytes),actual:fixed(successBytes),code:null};
  const code=semanticCode??'READ_BUDGET_INSUFFICIENT';
  const required=semanticCode===null?successBytes:rejectionBytes;
  if(rejectionBytes<=record.budget_bytes)return {kind:'rejected',required:fixed(required),actual:fixed(rejectionBytes),code};
  return {kind:'control',result:result('no_body_control',{code:'READ_RESPONSE_BUDGET_TOO_SMALL',semantic_cause:code,correlation:correlation(record.request_id),body_bytes:0})};
}
module.exports={decideBudget};
