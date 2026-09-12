'use strict';
const {tuple,diagnostic,assessment,size,fixed,correlation,result}=require('./util.js');
const {decideBudget}=require('./budget-decision.js');
function states(){return {core:'not_evaluated',interpretation:'not_evaluated',writer:'not_evaluated',confirmation:'not_evaluated',read_permission:'not_evaluated',action_authorization:'not_evaluated'};}
function rejectedEnvelope(record,code,observed=states()){
 return {contract:tuple.read,request_id:record.request_id,status:'rejected',tuple:null,asset:null,snapshot_id:null,digests:null,content:null,states:observed,diagnostics:[diagnostic(code)],omissions:[],assessment:assessment(),receipt:{receipt_id:'receipt:'+record.request_id,request_id:record.request_id,snapshot_id:null,host_id:null,host_epoch:null,decision_id:null,disclosed_at:null,delivery:'not_delivered'},budget:{limit_bytes:record.budget_bytes,required_bytes:'0000000000000000',actual_bytes:'0000000000000000'}};
}
function measure(envelope,required=null){envelope.budget.actual_bytes='0000000000000000';envelope.budget.required_bytes=required===null?'0000000000000000':fixed(required);const count=size(envelope);envelope.budget.actual_bytes=fixed(count);if(required===null)envelope.budget.required_bytes=fixed(count);return count;}
function finish(envelope,record){
 const count=measure(envelope),ready=envelope.status==='ready',code=envelope.diagnostics.find(x=>x.severity==='error')?.code??null;
 const rejection=ready?rejectedEnvelope(record,'READ_BUDGET_INSUFFICIENT',{...envelope.states}):envelope;
 const rejectionBytes=ready?measure(rejection,count):count;
 const decision=decideBudget(record,ready?count:null,rejectionBytes,code);
 if(decision.kind==='control')return decision.result;
 const body=decision.kind==='ready'?envelope:rejection;
 body.budget.required_bytes=decision.required;body.budget.actual_bytes=decision.actual;
 return result('read_envelope',body);
}
module.exports={states,rejectedEnvelope,measure,finish};
