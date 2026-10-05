'use strict';
// Only constructed retained response envelopes use this meter. Caller JSON,
// captured members, Host observations and all original routes keep their guards.
const {scalar,fixed}=require('./util.js');
const utf8=new TextEncoder();
function copyInternalResponse(input){
 const seen=new Set();let bytes=0;
 const charge=cost=>{bytes+=cost;if(!Number.isSafeInteger(bytes))throw Error('INVALID_JSON');};
 function copy(x,depth){
  if(depth>64)throw Error('INVALID_JSON');
  if(x===null||typeof x==='boolean'){charge(utf8.encode(JSON.stringify(x)).length);return x;}
  if(typeof x==='number'){if(!Number.isFinite(x))throw Error('INVALID_JSON');charge(utf8.encode(JSON.stringify(x)).length);return x;}
  if(typeof x==='string'){if(!scalar(x)||utf8.encode(x).length>1048576)throw Error('INVALID_JSON');charge(utf8.encode(JSON.stringify(x)).length);return x;}
  if(!x||typeof x!=='object'||seen.has(x)||Object.getOwnPropertySymbols(x).length)throw Error('INVALID_JSON');
  seen.add(x);const array=Array.isArray(x),keys=Object.getOwnPropertyNames(x).filter(k=>!array||k!=='length');
  if(array&&(x.length>10000||keys.length!==x.length||keys.some((k,i)=>k!==String(i))))throw Error('INVALID_JSON');
  const result=array?[]:{};
  charge(2);let index=0;
  for(const key of keys){const d=Object.getOwnPropertyDescriptor(x,key);if(!d||!Object.hasOwn(d,'value')||!scalar(key))throw Error('INVALID_JSON');charge((index?1:0)+(array?0:utf8.encode(JSON.stringify(key)).length+1));Object.defineProperty(result,key,{value:copy(d.value,depth+1),enumerable:true,writable:true,configurable:true});index++;}
  seen.delete(x);return result;
 }
 return copy(input,0);
}
function canonicalInternalResponse(input){const x=copyInternalResponse(input);function encode(v){if(Array.isArray(v))return '['+v.map(encode).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+encode(v[k])).join(',')+'}';return JSON.stringify(v);}return encode(x);}

function sizeInternalResponse(value){return utf8.encode(canonicalInternalResponse(value)).length;}
function measureInternalResponse(envelope,required=null){
  envelope.budget.actual_bytes='0000000000000000';
  envelope.budget.required_bytes=required===null?'0000000000000000':fixed(required);
  const count=sizeInternalResponse(envelope);
  envelope.budget.actual_bytes=fixed(count);
  if(required===null)envelope.budget.required_bytes=fixed(count);
  return count;
}
module.exports={sizeInternalResponse,measureInternalResponse};
