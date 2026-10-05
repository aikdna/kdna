'use strict';
// Owned memory only. No asset-source filesystem operation or fabricated file identity.
const {inflate}=require('./portable-inflate.js');
const inflateRawSync=(bytes,options)=>inflate(bytes,options.maxOutputLength);
const {LIMITS,crc32}=require('./section-container.js');
const {entryName,reject}=require('./strict-input.js');
const {digest}=require('./digests.js');
const B=require('./bytes.js');
const decoder=B.decoder;
const same=B.equal;
function need(value){if(!value)reject('READ_CORE_INVALID');}
async function openOwnedSectionCapture(owned,io){
 const length=owned.length;
 need(Number.isSafeInteger(length)&&length>=22&&length<=LIMITS.container);
 async function range(offset,count,purpose){
  need(Number.isSafeInteger(offset)&&Number.isSafeInteger(count)&&offset>=0&&count>=0&&offset+count<=length);
  const bytes=new Uint8Array(owned.subarray(offset,offset+count));
  io.push({offset_bytes:offset,length_bytes:count,purpose});
  return bytes;
 }
  // Fixed final22 first avoids a speculative tail read through content in normal no-comment ZIPs.
  let end=length-22,endBytes=await range(end,22,'zip_end'),footerObservation=endBytes;
  if(B.u32(endBytes,0)!==0x06054b50||B.u16(endBytes,20)!==0)({end,endBytes,footerObservation}=await require('./section-comment-locator.js').locateCommentFooter(length,range));
  const eocd=endBytes;
  need(!B.u16(eocd,4)&&!B.u16(eocd,6)&&B.u16(eocd,8)===B.u16(eocd,10));
  const count=B.u16(eocd,10),cdSize=B.u32(eocd,12),cdStart=B.u32(eocd,16);need(count>0&&count<=LIMITS.entries&&cdStart+cdSize===end);
  const rows=[],names=new Set();let at=0,total=0;
  for(let i=0;i<count;i++){
   need(at+46<=cdSize);const record=await range(cdStart+at,46,'zip_directory_header');need(B.u32(record,0)===0x02014b50);
   const flags=B.u16(record,8),method=B.u16(record,10),crc=B.u32(record,16),compressed=B.u32(record,20),size=B.u32(record,24),nl=B.u16(record,28),xl=B.u16(record,30),cl=B.u16(record,32),mode=B.u32(record,38)>>>16,local=B.u32(record,42);
   need(at+46+nl+xl+cl<=cdSize&&nl>0&&nl<=4096);const nb=await range(cdStart+at+46,nl,'zip_directory_name'),name=decoder.decode(nb),type=mode&0o170000;
   need(entryName(name)&&!names.has(name)&&!(flags&~0x800)&&!B.u16(record,34)&&(!type||type===0o100000));names.add(name);
   need(['mimetype','kdna.json','checksums.json','signature.kdsig'].includes(name)||/^sections\/pack-(0|[1-9][0-9]*)\.kdnab$/.test(name)||name.startsWith('attachments/'));
   need(!name.startsWith('sections/')||method===0);need(size<=LIMITS.entry&&!(compressed===0&&size!==0)&&(!compressed||size/compressed<=LIMITS.ratio)&&(total+=size)<=LIMITS.total);
   need(local+30<=cdStart);const header=await range(local,30,'zip_local_header');need(B.u32(header,0)===0x04034b50&&B.u16(header,6)===flags&&B.u16(header,8)===method&&B.u32(header,14)===crc&&B.u32(header,18)===compressed&&B.u32(header,22)===size&&B.u16(header,26)===nl);
   need(local+30+nl<=cdStart);const localName=await range(local+30,nl,'zip_local_name');need(same(nb,localName));const start=local+30+nl+B.u16(header,28);need(start+compressed<=cdStart);
   if(i===0)need(name==='mimetype'&&local===0&&method===0);rows.push({name,flags,method,crc,size,compressed,local,start,end:start+compressed});at+=46+nl+xl+cl;
  }
  need(at===cdSize);let position=0;for(const row of [...rows].sort((a,b)=>a.local-b.local)){need(row.local===position);position=row.end;}need(position===cdStart);
  const directory=await range(cdStart,cdSize,'zip_directory');
  const manifestRow=rows.find(r=>r.name==='kdna.json'),mimeRow=rows.find(r=>r.name==='mimetype');need(manifestRow&&mimeRow);
  async function member(row,purpose){const raw=await range(row.start,row.compressed,purpose);let b;if(row.method===0)b=raw;else if(row.method===8)b=inflateRawSync(raw,{maxOutputLength:LIMITS.entry});else reject('READ_CORE_CAPABILITY_UNAVAILABLE');need(b.length===row.size&&crc32(b)===row.crc);return b;}
  const mime=await member(mimeRow,'mimetype');need(decoder.decode(mime)==='application/vnd.kdna.asset');const manifestBytes=await member(manifestRow,'manifest');
  const identity=Object.freeze({capture_id:'capture:'+globalThis.crypto.randomUUID(),input_byte_length:length,manifest_bytes_digest:digest(manifestBytes),zip_directory_bytes_digest:digest(directory),identity_scope:'observed_metadata_and_loaded_sections_only',table_frames:[]});
  let consumed=false;const touchedMembers=new Set();
  async function wholeAfterAuthorization(){need(!consumed);consumed=true;const bytes=await range(0,length,'whole_after_authorization');need(same(bytes.subarray(cdStart,cdStart+cdSize),directory)&&same(bytes.subarray(end),footerObservation));const raw=bytes.subarray(manifestRow.start,manifestRow.end),m=manifestRow.method===0?raw:inflateRawSync(raw,{maxOutputLength:LIMITS.entry});need(same(m,manifestBytes));return bytes;}

 return {identity,manifestBytes,rows:rows.map(row=>Object.freeze({...row})),io,
  wholeAfterAuthorization,assertUnchanged:async()=>{},close:async()=>{owned=null;}};
}
module.exports={openOwnedSectionCapture};
