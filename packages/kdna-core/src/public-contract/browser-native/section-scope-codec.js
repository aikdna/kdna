'use strict';
const C=require('./section-common.js');
function encodeFrame(plain){
  const dictionary=[],byKey=new Map(),records=[];
  for(const x of plain.records){
    C.validate('ExpansionTarget',x);
    const key=JSON.stringify(x.scope);let index=byKey.get(key);
    if(index===undefined){index=dictionary.length;byKey.set(key,index);dictionary.push(x.scope);}
    records.push({anchor:x.anchor,target:x.target,scope_index:index});
  }
  const stored={section_id:plain.section_id,kind:'xref',scope_dictionary:dictionary,records};
  decodeFrame(stored);return stored;
}
function decodeFrame(stored){
  try{C.shape('ExperimentalStoredXrefFrame06',stored);}catch(e){if(C.isFailure(e)||C.failureInfo(e)?.code==='READ_INPUT_INVALID')C.need(false,'XREF_DICTIONARY_SHAPE');throw e;}
  const unique=new Set();
  for(const scope of stored.scope_dictionary){const key=JSON.stringify(scope);C.need(!unique.has(key),'XREF_DICTIONARY_DUPLICATE');unique.add(key);}
  const used=new Set(),records=[];let next=0;
  for(const x of stored.records){
    const i=x.scope_index;C.need(i<stored.scope_dictionary.length,'XREF_DICTIONARY_REF');
    if(!used.has(i)){C.need(i===next,'XREF_DICTIONARY_ORDER');used.add(i);next++;}
    const restored={anchor:x.anchor,target:x.target,scope:stored.scope_dictionary[i].slice()};
    try{C.validate('ExpansionTarget',restored);}catch(e){if(C.isFailure(e)||C.failureInfo(e)?.code==='READ_INPUT_INVALID')C.need(false,'XREF_RECONSTRUCTED_INVALID');throw e;}
    records.push(restored);
  }
  C.need(used.size===stored.scope_dictionary.length,'XREF_DICTIONARY_UNUSED');
  return {section_id:stored.section_id,kind:'xref',records};
}
module.exports={encodeFrame,decodeFrame};
