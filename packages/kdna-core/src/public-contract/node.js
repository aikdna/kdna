'use strict';
const fs = require('node:fs/promises');
const { inflateRawSync } = require('node:zlib');
const { admit, rejected } = require('./admit.js');
const { LIMITS } = require('./container.js');
async function capture(path) {
 const handle=await fs.open(path,'r');
 try {
  const stat=await handle.stat();
  if(!stat.isFile()||stat.size>LIMITS.container)throw Error('Invalid bounded file');
  const buffer=new Uint8Array(LIMITS.container+1);let length=0;
  for(;;){const {bytesRead}=await handle.read(buffer,length,buffer.length-length,null);length+=bytesRead;if(length>LIMITS.container)throw Error('Container limit');if(bytesRead===0)break;}
  return buffer.subarray(0,length);
 } finally {await handle.close();}
}
async function admitNode(input) {
 try {
  if(typeof input!=='string'&&!(input instanceof Uint8Array))return rejected('READ_INPUT_INVALID');
  const bytes=typeof input==='string'?await capture(input):input;
  return admit(bytes,(data,maxOutputLength)=>inflateRawSync(data,{maxOutputLength}));
 } catch {return rejected('READ_CORE_INVALID');}
}
module.exports={admitNode};
