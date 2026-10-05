'use strict';
const C=require('./section-common.js'),{digest,contentTreePreimage}=require('./digests.js');
const B=require('./bytes.js');
function word(n,w){C.need(Number.isSafeInteger(n)&&n>=0&&(w!==4||n<=0xffffffff),'SECTION_DIGEST_LENGTH');return B.word(n,w);}
function observeE(entries,manifest,packNames){
 const actualPacks=Object.keys(entries).filter(n=>n.startsWith('sections/')).sort(C.utf8);C.need(JSON.stringify(actualPacks)===JSON.stringify([...packNames].sort(C.utf8)),'SECTION_E_PACK_COVERAGE');
 const declared=manifest.runtime.mandatory_entries;C.need(Array.isArray(declared)&&new Set(declared).size===declared.length,'SECTION_RUNTIME_DECLARATION');
 for(const n of declared)C.need(C.strict.entryName(n)&&Object.hasOwn(entries,n)&&!['checksums.json','signature.kdsig','mimetype','build-receipt.json'].includes(n)&&!n.startsWith('reports/')&&!n.startsWith('authoring/'),'SECTION_RUNTIME_MEMBER_MISSING');
 const names=[...new Set(['kdna.json',...actualPacks,...declared])].sort(C.utf8),parts=[B.utf8('KDNA-RUNTIME-ENTRY-SET\0'+'0.3.0-candidate\0'),word(names.length,4)];
 for(const n of names){const nb=B.utf8(n),b=entries[n];C.need(b instanceof Uint8Array,'SECTION_RUNTIME_MEMBER_MISSING');parts.push(word(nb.length,4),nb,word(b.length,8),b);}
 return {status:'verified',profile:'kdna.digest-basis.runtime-entry-set/0.3.0-candidate',digest:digest(B.concat(parts)),member_names:names};
}
function observeWhole(bytes,entries,manifest,packs){return {A:digest(bytes),C:digest(contentTreePreimage(entries)),E:observeE(entries,manifest,packs)};}
module.exports={observeWhole,observeE};
