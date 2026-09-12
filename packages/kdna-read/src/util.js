'use strict';
const schema = require('../schema/read-contract-0.2.schema.json');
const tuple = Object.freeze(Object.fromEntries(schema.$defs.VersionTuple.required.map(k=>[k,schema.$defs.VersionTuple.properties[k].const])));
const utf8 = new TextEncoder();
function scalar(s) { if(typeof s!=='string')return false;for(let i=0;i<s.length;i++){const n=s.charCodeAt(i);if(n>=0xd800&&n<=0xdbff){const m=s.charCodeAt(++i);if(!(m>=0xdc00&&m<=0xdfff))return false;}else if(n>=0xdc00&&n<=0xdfff)return false;}return true; }
function identifier(s){return scalar(s)&&s.length>0&&utf8.encode(s).length<=256&&!/[\u0000-\u001f\u007f-\u009f]/.test(s);}
function uint(x){return Number.isSafeInteger(x)&&x>=0;}
function freeze(x){if(x&&typeof x==='object'&&!Object.isFrozen(x)){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;}
function clone(input){
 const seen=new Set();let count=0;
 function copy(x,depth){
  if(depth>64||++count>100000)throw Error('INVALID_JSON');
  if(x===null||typeof x==='boolean')return x;
  if(typeof x==='number'){if(!Number.isFinite(x))throw Error('INVALID_JSON');return x;}
  if(typeof x==='string'){if(!scalar(x)||utf8.encode(x).length>1048576)throw Error('INVALID_JSON');return x;}
  if(!x||typeof x!=='object'||seen.has(x)||Object.getOwnPropertySymbols(x).length)throw Error('INVALID_JSON');
  seen.add(x);const array=Array.isArray(x),keys=Object.getOwnPropertyNames(x).filter(k=>!array||k!=='length');
  if(array&&(x.length>10000||keys.length!==x.length||keys.some((k,i)=>k!==String(i))))throw Error('INVALID_JSON');
  const result=array?[]:{};
  for(const key of keys){const d=Object.getOwnPropertyDescriptor(x,key);if(!d||!Object.hasOwn(d,'value')||!scalar(key))throw Error('INVALID_JSON');Object.defineProperty(result,key,{value:copy(d.value,depth+1),enumerable:true,writable:true,configurable:true});}
  seen.delete(x);return result;
 }
 return copy(input,0);
}
function jcs(input){const x=clone(input);function encode(v){if(Array.isArray(v))return '['+v.map(encode).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+encode(v[k])).join(',')+'}';return JSON.stringify(v);}return encode(x);}
function size(x){return utf8.encode(jcs(x)).length;}
function fixed(n){if(!uint(n)||n>9999999999999999)throw Error('INVALID_COUNT');return String(n).padStart(16,'0');}
function correlation(id){return identifier(id)?{state:'validated',request_id:id}:{state:'unavailable',request_id:null};}
function result(channel,payload,admission=false){const r={channel,[admission?'admitted_request':'envelope']:null,admission_rejection:null,control:null,transport_failure:null};r[channel==='read_envelope'?'envelope':channel==='no_body_control'?'control':channel]=payload;return r;}
function transport(cause,cor,admission=false){return result('transport_failure',{code:'READ_TRANSPORT_FAILURE',semantic_cause:cause,correlation:cor,delivery:'not_confirmed'},admission);}
function diagnostic(code,stage){if(!stage){if(['READ_INPUT_INVALID','READ_SNAPSHOT_UNATTESTED','READ_CORE_CAPABILITY_UNAVAILABLE'].includes(code))stage='input';else if(/UNSUPPORTED_VERSION|MIXED_VERSION/.test(code))stage='version';else if(/CORE_INVALID|INTERPRETATION|COMPONENT_|METHOD_PRESENCE/.test(code))stage='core';else if(/ASSET_(?:VERSION_)?MISMATCH|SELECTION_/.test(code)&&!code.startsWith('READ_HANDLE'))stage='selection';else if(/HANDLE_(?:UNTRUSTED|VERSION_MISMATCH|STALE|ASSET_MISMATCH|SCOPE_MISMATCH)/.test(code))stage='handle';else if(code==='READ_PROJECTION_INVALID')stage='projection';else if(code==='READ_BUDGET_INSUFFICIENT')stage='budget';else stage='host';}return {code,stage,severity:'error',subject:null,field:null};}
const assessment=()=>({state:'not_evaluated',kind:null,assessor_id:null,evidence_ref:null});
module.exports={schema,tuple,scalar,identifier,uint,freeze,clone,jcs,size,fixed,correlation,result,transport,diagnostic,assessment};
