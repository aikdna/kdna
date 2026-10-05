'use strict';
// Forward routing proves a comment span before that span is read. No member body is prefetched.
const {LIMITS}=require('./section-container.js');
const {entryName,reject}=require('./strict-input.js');
const decoder=new TextDecoder('utf-8',{fatal:true});
const need=v=>{if(!v)reject('READ_CORE_INVALID');};
async function locateCommentFooter(length,range){
 const locals=new Map();let cursor=0;
 while(true){
  need(cursor+4<=length-22);const signature=await range(cursor,4,'zip_locator_local_signature');
  if(signature.readUInt32LE(0)===0x02014b50)break;
  need(signature.readUInt32LE(0)===0x04034b50&&locals.size<LIMITS.entries&&cursor+30<=length-22);
  const header=Buffer.concat([signature,await range(cursor+4,26,'zip_locator_local_header')]);
  const nl=header.readUInt16LE(26),xl=header.readUInt16LE(28),compressed=header.readUInt32LE(18),start=cursor+30+nl+xl;
  need(nl>0&&nl<=4096&&start+compressed<=length-22);
  locals.set(cursor,{header,start,end:start+compressed});cursor=start+compressed;
 }
 const cdStart=cursor,seen=new Set(),names=new Set();let count=0,total=0;
 while(true){
  need(cursor+4<=length);const signature=await range(cursor,4,'zip_locator_directory_signature');
  if(signature.readUInt32LE(0)===0x06054b50)break;
  need(signature.readUInt32LE(0)===0x02014b50&&count<LIMITS.entries&&cursor+46<=length-22);
  const row=Buffer.concat([signature,await range(cursor+4,42,'zip_locator_directory_header')]);
  const flags=row.readUInt16LE(8),method=row.readUInt16LE(10),crc=row.readUInt32LE(16),compressed=row.readUInt32LE(20),size=row.readUInt32LE(24),nl=row.readUInt16LE(28),xl=row.readUInt16LE(30),cl=row.readUInt16LE(32),mode=row.readUInt32LE(38)>>>16,local=row.readUInt32LE(42),type=mode&0o170000;
  need(cursor+46+nl+xl+cl<=length-22&&nl>0&&nl<=4096);
  const nb=await range(cursor+46,nl,'zip_locator_directory_name'),name=decoder.decode(nb);
  need(entryName(name)&&!names.has(name)&&!(flags&~0x800)&&!row.readUInt16LE(34)&&(!type||type===0o100000));names.add(name);
  need(['mimetype','kdna.json','payload.kdnab','checksums.json','signature.kdsig'].includes(name)||/^sections\/pack-(0|[1-9][0-9]*)\.kdnab$/.test(name)||name.startsWith('attachments/'));
  need(!name.startsWith('sections/')||method===0);need(size<=LIMITS.entry&&!(compressed===0&&size!==0)&&(!compressed||size/compressed<=LIMITS.ratio)&&(total+=size)<=LIMITS.total);
  const physical=locals.get(local);need(physical&&!seen.has(local)&&physical.end<=cdStart);seen.add(local);const header=physical.header;
  need(header.readUInt16LE(6)===flags&&header.readUInt16LE(8)===method&&header.readUInt32LE(14)===crc&&header.readUInt32LE(18)===compressed&&header.readUInt32LE(22)===size&&header.readUInt16LE(26)===nl);
  need(nb.equals(await range(local+30,nl,'zip_locator_local_name')));
  if(count===0)need(name==='mimetype'&&local===0&&method===0);
  count++;cursor+=46+nl+xl+cl;
 }
 need(count>0&&count===locals.size&&seen.size===locals.size&&names.has('mimetype')&&names.has('kdna.json')&&cursor+22<=length);
 const end=cursor,endBytes=await range(end,22,'zip_locator_eocd'),commentLength=endBytes.readUInt16LE(20);
 need(endBytes.readUInt32LE(0)===0x06054b50&&!endBytes.readUInt16LE(4)&&!endBytes.readUInt16LE(6)&&endBytes.readUInt16LE(8)===count&&endBytes.readUInt16LE(10)===count&&endBytes.readUInt32LE(12)===end-cdStart&&endBytes.readUInt32LE(16)===cdStart&&end+22+commentLength===length);
 // Only now is this a proved comment interval, disjoint from the actual member partition.
 const comment=commentLength?await range(end+22,commentLength,'zip_comment'):Buffer.alloc(0),footerObservation=Buffer.concat([endBytes,comment]);
 let selected=-1;for(let i=footerObservation.length-22;i>=0;i--){if(footerObservation.readUInt32LE(i)===0x06054b50&&i+22+footerObservation.readUInt16LE(i+20)===footerObservation.length){selected=i;break;}}
 // The original parser chooses the last candidate then requires CD termination there. No fallback.
 need(selected===0);return {end,endBytes,footerObservation};
}
module.exports={locateCommentFooter};
