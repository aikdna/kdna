'use strict';
const {schema,tuple,identifier,uint,scalar,freeze,clone,size,fixed,correlation,result,transport}=require('./util.js');
const {requests,controls}=require('./brands.js');
const historicalTuples=require('../schema/read-contract-0.6.4.schema.json').$defs.UnsupportedVersionTuple.anyOf.map(s=>Object.fromEntries(Object.entries(s.properties).map(([k,v])=>[k,v.const])));
const KEYS=['request_id','tuple','budget_bytes','mode','selection','handle'];
const SELECTION=['asset_id','asset_version','judgment_id'];
const HANDLE=['handle_id','asset_id','asset_version','A','C','snapshot_id','core_version','ir_version','read_version','anchor','target','scope','issued_at','expires_at','host_id','host_epoch'];
function object(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function own(o,k){const d=Object.getOwnPropertyDescriptor(o,k);if(!d)return undefined;if(!Object.hasOwn(d,'value'))throw Error('UNSAFE_INSPECTION');return d.value;}
function versionCode(value){if(Object.keys(tuple).every(k=>value[k]===tuple[k])&&Object.keys(value).length===Object.keys(tuple).length)return null;if(historicalTuples.some(old=>Object.keys(value).length===Object.keys(old).length&&Object.keys(old).every(k=>value[k]===old[k])))return 'READ_UNSUPPORTED_VERSION';return Object.keys(tuple).some(k=>k!=='payload_profile'&&value[k]===tuple[k])?'READ_MIXED_VERSION_TUPLE':'READ_UNSUPPORTED_VERSION';}
function inspectCandidate(candidate){
  const fail=(reason,field)=>{const fields=schema.$defs.AdmissionField.enum;while(!fields.includes(field)&&field.includes('.'))field=field.slice(0,field.lastIndexOf('.'));if(!fields.includes(field))field='$candidate';throw {admission:true,reason,field};};
  function keys(o,allowed,prefix,required=allowed){if(!object(o))fail('wrong_type',prefix);const unknown=Object.getOwnPropertyNames(o).filter(k=>!allowed.includes(k)).sort((a,b)=>{const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);for(let i=0;i<Math.min(x.length,y.length);i++)if(x[i]!==y[i])return x[i]-y[i];return x.length-y.length;});if(unknown.length||Object.getOwnPropertySymbols(o).length)throw {admission:true,reason:'unknown_field',field:'$unknown',unknownKey:unknown[0]};for(const k of required)if(!Object.hasOwn(o,k))fail('missing_required',prefix==='handle.selection'?prefix:prefix?prefix+'.'+k:k);}
  function id(value,field){if(typeof value!=='string')fail('wrong_type',field);if(!identifier(value))fail('invalid_identifier',field);}
  function integer(value,field){if(typeof value!=='number')fail('wrong_type',field);if(!Number.isSafeInteger(value))fail('unsafe_integer',field);if(value<0)fail('out_of_range',field);}
  if(!object(candidate))fail('representation_not_object','$candidate');
  keys(candidate,KEYS,'');id(own(candidate,'request_id'),'request_id');integer(own(candidate,'budget_bytes'),'budget_bytes');
  const t=own(candidate,'tuple');keys(t,Object.keys(tuple),'tuple',[]);for(const k of Object.keys(tuple))if(Object.hasOwn(t,k)){const x=own(t,k);if(typeof x!=='string')fail('wrong_type','tuple.'+k);if(!scalar(x))fail('invalid_identifier','tuple.'+k);}
  const safeTuple=Object.fromEntries(Object.keys(t).map(k=>[k,own(t,k)])),version=versionCode(safeTuple);
  if(version)return {request_id:own(candidate,'request_id'),budget_bytes:own(candidate,'budget_bytes'),request:null,version_rejection:version};
  const mode=own(candidate,'mode'),selection=own(candidate,'selection'),handle=own(candidate,'handle');
  if(!['whole_asset','catalog','exact_selection','expand'].includes(mode))fail('mode_shape_invalid','mode');
  if(['whole_asset','catalog'].includes(mode)){if(selection!==null)fail('mode_shape_invalid','selection');}
  else if(mode==='exact_selection'||selection!==null){keys(selection,SELECTION,'selection');for(const k of SELECTION)id(own(selection,k),'selection.'+k);}
  if(mode!=='expand'){if(handle!==null)fail('mode_shape_invalid','handle');}
  else {
    keys(handle,HANDLE,'handle');
    for(const k of HANDLE){const x=own(handle,k);
      if(k==='anchor'){
        if(!object(x))fail('wrong_type','handle.anchor');
        const kind=own(x,'kind');
        if(kind==='asset'){keys(x,['kind'],'handle.anchor');if(selection!==null)fail('mode_shape_invalid','selection');}
        else if(kind==='judgment'){
          keys(x,['kind','selection'],'handle.anchor');const chosen=own(x,'selection');
          keys(chosen,SELECTION,'handle.anchor.selection');for(const f of SELECTION)id(own(chosen,f),'handle.anchor.selection');
          if(selection===null||SELECTION.some(f=>own(chosen,f)!==own(selection,f)))fail('mode_shape_invalid','selection');
        }else fail('mode_shape_invalid','handle.anchor');
      }else if(k==='target'){
        keys(x,['kind','id','asset'],'handle.target',['kind','id']);
        id(own(x,'id'),'handle.target');
        const kinds=schema.$defs.Ref.properties.kind.enum;
        if(!kinds.includes(own(x,'kind')))fail('mode_shape_invalid','handle.target');
        if(Object.hasOwn(x,'asset')){
          const asset=own(x,'asset'),fields=['asset_id','asset_version','judgment_version'];keys(asset,fields,'handle.target.asset');
          for(const f of fields)id(own(asset,f),'handle.target.asset');
        }
      }else if(k==='scope'){if(!Array.isArray(x))fail('wrong_type','handle.scope');for(const value of x)id(value,'handle.scope');if(!x.length||new Set(x).size!==x.length)fail('mode_shape_invalid','handle');}
      else if(k==='issued_at'||k==='expires_at')integer(x,'handle.'+k);
      else if(k==='A'||k==='C'){if(typeof x!=='string')fail('wrong_type','handle.'+k);if(!/^sha256:[0-9a-f]{64}$/.test(x))fail('invalid_identifier','handle.'+k);}
      else id(x,'handle.'+k);
    }
    if(handle.issued_at>=handle.expires_at)fail('mode_shape_invalid','handle');
  }
  const request=Object.fromEntries(KEYS.map(k=>[k,own(candidate,k)]));
  return {request_id:request.request_id,budget_bytes:request.budget_bytes,request:clone(request),version_rejection:null};
}
function admitReadRequest(candidate,controlProvider){
  let cor={state:'unavailable',request_id:null},record,error,cause=null,inspectionFailure=false;
  try {if(object(candidate))cor=correlation(own(candidate,'request_id'));}catch{inspectionFailure=true;}
  try{record=inspectCandidate(candidate);}catch(e){if(e?.admission){error={stage:'admission',severity:'error',reason:e.reason,field:e.field};cause='READ_INPUT_INVALID';}else inspectionFailure=true;}
  let limit;
  try{const observe=controls.get(controlProvider);if(!observe)throw Error('UNTRUSTED_CONTROL');const value=observe();if(!object(value)||Object.keys(value).some(k=>k!=='admission_response_limit_bytes')||!uint(value.admission_response_limit_bytes))throw Error('INVALID_CONTROL');limit=value.admission_response_limit_bytes;}catch{return freeze(transport(cause,cor,true));}
  if(inspectionFailure)return freeze(transport(cause,cor,true));
  if(error){
    const body={contract:'kdna.read-admission/0.1.0',code:'READ_INPUT_INVALID',diagnostic:error,correlation:cor,control_budget:{limit_bytes:limit,actual_bytes:'0000000000000000'}};
    try{const count=size(body);body.control_budget.actual_bytes=fixed(count);if(count<=limit)return freeze(result('admission_rejection',body,true));return freeze(result('no_body_control',{code:'READ_ADMISSION_RESPONSE_TOO_SMALL',semantic_cause:'READ_INPUT_INVALID',correlation:cor,body_bytes:0},true));}catch{return freeze(transport(cause,cor,true));}
  }
  const admitted=Object.freeze({});requests.set(admitted,freeze(record));return freeze(result('admitted_request',admitted,true));
}
module.exports={admitReadRequest,inspectCandidate,versionCode};
