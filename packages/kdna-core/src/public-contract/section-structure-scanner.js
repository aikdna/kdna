'use strict';
// Diagnostic structural scanner: supports the same definite JSON-domain CBOR majors as Core.
// Skipped text bytes are neither UTF8/schema validated nor hashed. This is not full-frame validation.
const {TextDecoder}=require('node:util');const decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true});
const SKIPPED=Object.freeze({scan_observation:'text_bytes_not_read'});
async function scanFrame(length,read,{interpretationInputs=false}={}){
 let offset=0;const reads=[],skips=[];
 function need(v,reason){if(!v){const e=new Error(reason);e.code=reason;throw e;}}
 async function take(n,purpose){need(Number.isSafeInteger(n)&&n>=0&&offset+n<=length,'SCAN_RANGE');const start=offset;offset+=n;if(n===0)return Buffer.alloc(0);const b=await read(start,n,purpose);need(b.length===n,'SCAN_SHORT');reads.push({offset_bytes:start,length_bytes:n,purpose});return Buffer.from(b);}
 function skip(n,path){need(Number.isSafeInteger(n)&&n>=0&&offset+n<=length,'SCAN_RANGE');skips.push({offset_bytes:offset,length_bytes:n,path});offset+=n;}
 async function argument(info){if(info<24)return info;need(info>=24&&info<=27,'SCAN_INDEFINITE_OR_RESERVED');const b=await take(2**(info-24),'cbor_argument');const n=info===24?b.readUInt8():info===25?b.readUInt16BE():info===26?b.readUInt32BE():Number(b.readBigUInt64BE());need(Number.isSafeInteger(n),'SCAN_LENGTH_OR_INTEGER_RANGE');return n;}
 function isEnvelope(path){return path.length===3&&path[0]==='records'&&typeof path[1]==='number'&&!['value','method_interpretation','static_policy_interpretation'].includes(path[2]);}
 function retained(path,force){if(interpretationInputs&&path[0]==='records'&&path[2]==='value'&&(path.length===4&&['method','extensions','result_contract','formation_rule','parent_ref','lifecycle'].includes(path[3])||['extension','extensions'].includes(path.at(-1))))return true;if(force||isEnvelope(path))return true;if(path.length===1&&['kind','section_id'].includes(path[0]))return true;if(path[0]==='records'&&path[2]==='value')return ['id','kind','asset_uid','owner_ref','state'].includes(path.at(-1));return false;}
 async function value(depth,path,force=false,key=false){
  need(depth<=64,'SCAN_DEPTH');const begin=offset,b=await take(1,'cbor_initial'),major=b[0]>>5,info=b[0]&31;force=retained(path,force);
  if(major===0||major===1){if(info===27){const b=await take(8,'cbor_integer');const x=b.readBigUInt64BE(),integer=major===0?x:-1n-x,n=Number(integer);need(Number.isFinite(n)&&BigInt(n)===integer,'SCAN_INTEGER_REPRESENTATION');return n;}const n=await argument(info),result=major===0?n:-1-n;need(major===0||BigInt(result)===-1n-BigInt(n),'SCAN_INTEGER_REPRESENTATION');return result;}
  if(major===2||major===3){need(major===3,'SCAN_BYTE_STRING');const n=await argument(info);need(n<=1048576,'SCAN_STRING_LIMIT');if(!force&&!key){skip(n,path);return SKIPPED;}const text=decoder.decode(await take(n,key?'map_key':'binding_string'));need(text.charCodeAt(0)!==0xfeff,'SCAN_LEADING_BOM');return text;}
  if(major===4||major===5){const n=await argument(info);need(n<=10000,'SCAN_COLLECTION_LIMIT');if(major===4){const a=[];for(let i=0;i<n;i++)a.push(await value(depth+1,[...path,i],force));return a;}
   const o={},keys=new Set();for(let i=0;i<n;i++){const k=await value(depth+1,[...path,'<key>'],false,true);need(typeof k==='string'&&!keys.has(k),'SCAN_MAP_KEY');keys.add(k);Object.defineProperty(o,k,{value:await value(depth+1,[...path,k],force),enumerable:true});}return o;
  }
  if(major===7){if(info===20)return false;if(info===21)return true;if(info===22)return null;need(info>=25&&info<=27,'SCAN_SIMPLE');const data=await take(2**(info-24),'cbor_float');let n;if(info===25){const x=data.readUInt16BE(),sign=x&0x8000?-1:1,exp=(x>>10)&31,f=x&1023;n=sign*(exp===0?2**-14*f/1024:exp===31?Infinity:2**(exp-15)*(1+f/1024));}else n=info===26?data.readFloatBE():data.readDoubleBE();need(Number.isFinite(n),'SCAN_NONFINITE');return n;}
  need(false,'SCAN_TAG_OR_MAJOR');
 }
 const partial=await value(0,[]);need(offset===length,'SCAN_TRAILING_BYTES');return {partial,reads,skips,read_bytes:reads.reduce((n,r)=>n+r.length_bytes,0),skipped_text_bytes:skips.reduce((n,r)=>n+r.length_bytes,0),full_frame_digest_observed:false,unread_text_utf8_or_schema_checked:false};
}
module.exports={scanFrame};
