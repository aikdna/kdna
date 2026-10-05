'use strict';
// Forward routing proves a comment span before that span is read. No member body is prefetched.
const {LIMITS}=require('./section-container.js');
const {entryName,reject}=require('./strict-input.js');
const B=require('./bytes.js');
const decoder=B.decoder;
const need=v=>{if(!v)reject('READ_CORE_INVALID');};
async function locateCommentFooter(length,range){
 const locals=new Map();let cursor=0;
 while(true){
  need(cursor+4<=length-22);const signature=await range(cursor,4,'zip_locator_local_signature');
  if(B.u32(signature,0)===0x02014b50)break;
  need(B.u32(signature,0)===0x04034b50&&locals.size<LIMITS.entries&&cursor+30<=length-22);
  const header=B.concat([signature,await range(cursor+4,26,'zip_locator_local_header')]);
  const nl=B.u16(header,26),xl=B.u16(header,28),compressed=B.u32(header,18),start=cursor+30+nl+xl;
  need(nl>0&&nl<=4096&&start+compressed<=length-22);
  locals.set(cursor,{header,start,end:start+compressed});cursor=start+compressed;
 }
 const cdStart=cursor,seen=new Set(),names=new Set();let count=0,total=0;
 while(true){
  need(cursor+4<=length);const signature=await range(cursor,4,'zip_locator_directory_signature');
  if(B.u32(signature,0)===0x06054b50)break;
  need(B.u32(signature,0)===0x02014b50&&count<LIMITS.entries&&cursor+46<=length-22);
  const row=B.concat([signature,await range(cursor+4,42,'zip_locator_directory_header')]);
  const flags=B.u16(row,8),method=B.u16(row,10),crc=B.u32(row,16),compressed=B.u32(row,20),size=B.u32(row,24),nl=B.u16(row,28),xl=B.u16(row,30),cl=B.u16(row,32),mode=B.u32(row,38)>>>16,local=B.u32(row,42),type=mode&0o170000;
  need(cursor+46+nl+xl+cl<=length-22&&nl>0&&nl<=4096);
  const nb=await range(cursor+46,nl,'zip_locator_directory_name'),name=decoder.decode(nb);
  need(entryName(name)&&!names.has(name)&&!(flags&~0x800)&&!B.u16(row,34)&&(!type||type===0o100000));names.add(name);
  need(['mimetype','kdna.json','checksums.json','signature.kdsig'].includes(name)||/^sections\/pack-(0|[1-9][0-9]*)\.kdnab$/.test(name)||name.startsWith('attachments/'));
  need(!name.startsWith('sections/')||method===0);need(size<=LIMITS.entry&&!(compressed===0&&size!==0)&&(!compressed||size/compressed<=LIMITS.ratio)&&(total+=size)<=LIMITS.total);
  const physical=locals.get(local);need(physical&&!seen.has(local)&&physical.end<=cdStart);seen.add(local);const header=physical.header;
  need(B.u16(header,6)===flags&&B.u16(header,8)===method&&B.u32(header,14)===crc&&B.u32(header,18)===compressed&&B.u32(header,22)===size&&B.u16(header,26)===nl);
  need(B.equal(nb,await range(local+30,nl,'zip_locator_local_name')));
  if(count===0)need(name==='mimetype'&&local===0&&method===0);
  count++;cursor+=46+nl+xl+cl;
 }
 need(count>0&&count===locals.size&&seen.size===locals.size&&names.has('mimetype')&&names.has('kdna.json')&&cursor+22<=length);
 const end=cursor,endBytes=await range(end,22,'zip_locator_eocd'),commentLength=B.u16(endBytes,20);
 need(B.u32(endBytes,0)===0x06054b50&&!B.u16(endBytes,4)&&!B.u16(endBytes,6)&&B.u16(endBytes,8)===count&&B.u16(endBytes,10)===count&&B.u32(endBytes,12)===end-cdStart&&B.u32(endBytes,16)===cdStart&&end+22+commentLength===length);
 // Only now is this a proved comment interval, disjoint from the actual member partition.
 const comment=commentLength?await range(end+22,commentLength,'zip_comment'):new Uint8Array(0),footerObservation=B.concat([endBytes,comment]);
 let selected=-1;for(let i=footerObservation.length-22;i>=0;i--){if(B.u32(footerObservation,i)===0x06054b50&&i+22+B.u16(footerObservation,i+20)===footerObservation.length){selected=i;break;}}
 // The original parser chooses the last candidate then requires CD termination there. No fallback.
 need(selected===0);return {end,endBytes,footerObservation};
}
module.exports={locateCommentFooter};
