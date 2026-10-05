'use strict';

const {Inflate}=require('pako/lib/inflate.js');

// Codec adaptation only. Container admission supplies the same hard output
// bound used by Node; entry names, CRC, declared sizes and totals stay there.
function inflate(bytes,maximum) {
  if(!(bytes instanceof Uint8Array)||!Number.isSafeInteger(maximum)||maximum<0)throw new Error('Invalid inflate input');
  const chunks=[];let length=0;
  const decoder=new Inflate({raw:true,chunkSize:16384});
  decoder.onData=chunk=>{
    length+=chunk.length;
    if(length>maximum)throw new Error('Inflate output limit');
    chunks.push(chunk);
  };
  decoder.onEnd=status=>{decoder.err=status;};
  // Let the codec drain every output chunk; Z_FINISH can return Z_BUF_ERROR
  // when a bounded output buffer fills before the stream has been drained.
  // An actual end marker is still mandatory below, including for empty output.
  const completed=decoder.push(bytes,false);
  if(!completed||!decoder.ended||decoder.err)throw new Error('Invalid deflate stream');
  const result=new Uint8Array(length);let offset=0;
  for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}
  return result;
}

module.exports={inflate};
