'use strict';
const fs = require('node:fs/promises');
const { LIMITS } = require('./container.js');
async function capture(path) {
 const handle=await fs.open(path,fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
 try {
  const stat=await handle.stat();
  if(!stat.isFile()||stat.size>LIMITS.container)throw Error('Invalid bounded file');
  const buffer=new Uint8Array(LIMITS.container+1);let length=0;
  for(;;){const {bytesRead}=await handle.read(buffer,length,buffer.length-length,null);length+=bytesRead;if(length>LIMITS.container)throw Error('Container limit');if(bytesRead===0)break;}
  return buffer.subarray(0,length);
 } finally {await handle.close();}
}
module.exports = { capture };
