'use strict';
const {types}=require('node:util');
const C=require('./section-common.js');
const {LIMITS}=require('./section-container.js');
const typed=Object.getPrototypeOf(Uint8Array.prototype);
const getters=Object.fromEntries(['length','byteLength','byteOffset','buffer'].map(key=>[key,Object.getOwnPropertyDescriptor(typed,key).get]));
const resizable=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'resizable')?.get;
function ownBytes(value){
 C.need(!types.isProxy(value)&&types.isUint8Array(value),'READ_INPUT_INVALID');
 const prototype=Object.getPrototypeOf(value);
 C.need(prototype===Uint8Array.prototype||prototype===Buffer.prototype,'READ_INPUT_INVALID');
 const length=getters.length.call(value),byteLength=getters.byteLength.call(value);
 const offset=getters.byteOffset.call(value),buffer=getters.buffer.call(value);
 C.need(Number.isSafeInteger(length)&&length===byteLength&&length<=LIMITS.container,'READ_INPUT_INVALID');
 C.need(!types.isSharedArrayBuffer(buffer)&&(!resizable||!resizable.call(buffer)),'READ_INPUT_INVALID');
 // Intrinsic construction confirms non-detached backing store without reading caller hooks.
 try{new Uint8Array(buffer,offset,0);}catch{C.need(false,'READ_INPUT_INVALID');}
 C.need(Object.getOwnPropertySymbols(value).length===0,'READ_INPUT_INVALID');
 // Integer-indexed exotic Uint8Array elements are intrinsically dense enumerable data.
 // Source03 excludes non-enumerable own string decorations from byte meaning.
 // Enumerable extra names remain invalid; no caller property value/getter is read.
 const names=Object.keys(value);
 C.need(names.length===length,'READ_INPUT_INVALID');
 for(let i=0;i<names.length;i++)C.need(names[i]===String(i),'READ_INPUT_INVALID');
 const owned=Buffer.alloc(length);
 Uint8Array.prototype.set.call(owned,value);
 return owned;
}
module.exports={ownBytes};
