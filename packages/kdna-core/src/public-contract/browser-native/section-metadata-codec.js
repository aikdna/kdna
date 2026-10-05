'use strict';
// Candidate-only lossless stored metadata codec. This does not validate semantic closure or mint admission.
const C=require('./section-common.js');
function fail(code){C.need(false,code);}
function shape(name,value){try{C.validate(name,value);}catch(e){if(C.isFailure(e)||C.failureInfo(e)?.code==='READ_INPUT_INVALID')fail('METADATA_'+name+'_SHAPE');throw e;}}
function encode(decoded){
 shape('RepresentationMetadata06',decoded);
 const out=structuredClone(decoded),index=new Map(decoded.node_order.map((id,i)=>[id,i]));
 const idx=id=>{if(!index.has(id))fail('METADATA_NODE_ID_MISSING');return index.get(id);};
 out.references=decoded.references.map(({source_node,target_node,...rest})=>({...structuredClone(rest),source_node_index:idx(source_node),target_node_index:idx(target_node)}));
 out.asset_index=decoded.asset_index.map(({node_ref,...rest})=>({...structuredClone(rest),node_index:idx(node_ref)}));
 out.mandatory_closures=decoded.mandatory_closures.map(({node_ids,...rest})=>({...structuredClone(rest),node_indices:node_ids.map(idx)}));
 out.asset_closure=decoded.asset_closure.map(idx);out.codec='node-order-index/1';shape('StoredRepresentationMetadata06',out);return out;
}
function decode(stored){
 shape('StoredRepresentationMetadata06',stored);
 const out=structuredClone(stored),node=i=>{if(!Number.isSafeInteger(i)||i<0||i>=stored.node_order.length)fail('METADATA_NODE_INDEX_RANGE');return stored.node_order[i];};
 out.references=stored.references.map(({source_node_index,target_node_index,...rest})=>({...structuredClone(rest),source_node:node(source_node_index),target_node:node(target_node_index)}));
 out.asset_index=stored.asset_index.map(({node_index,...rest})=>({...structuredClone(rest),node_ref:node(node_index)}));
 out.mandatory_closures=stored.mandatory_closures.map(({node_indices,...rest})=>({...structuredClone(rest),node_ids:node_indices.map(node)}));
 out.asset_closure=stored.asset_closure.map(node);delete out.codec;shape('RepresentationMetadata06',out);return out;
}
module.exports={encode,decode};
