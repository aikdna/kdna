"use strict";
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
const utf8=value=>encoder.encode(value);
const u16=(bytes,offset)=>new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint16(offset,true);
const u32=(bytes,offset)=>new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(offset,true);
function equal(a,b){return a.length===b.length&&a.every((value,index)=>value===b[index]);}
function concat(parts){const output=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){output.set(p,at);at+=p.length;}return output;}
function word(number,width){const bytes=new Uint8Array(width),view=new DataView(bytes.buffer);if(width===4)view.setUint32(0,number,false);else view.setBigUint64(0,BigInt(number),false);return bytes;}
function fromHex(hex){return Uint8Array.from({length:hex.length/2},(_,index)=>parseInt(hex.slice(index*2,index*2+2),16));}
module.exports={utf8,decoder,u16,u32,equal,concat,word,fromHex};
