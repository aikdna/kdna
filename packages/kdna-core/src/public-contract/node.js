'use strict';
const { inflateRawSync } = require('node:zlib');
const { admit, rejected } = require('./admit.js');
const { capture } = require('./node-capture.js');
async function admitNode(input) {
 try {
  if(typeof input!=='string'&&!(input instanceof Uint8Array))return rejected('READ_INPUT_INVALID');
  const bytes=typeof input==='string'?await capture(input):input;
  return admit(bytes,(data,maxOutputLength)=>inflateRawSync(data,{maxOutputLength}));
 } catch {return rejected('READ_CORE_INVALID');}
}
module.exports={admitNode};
