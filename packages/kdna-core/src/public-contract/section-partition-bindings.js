'use strict';
// Re-run the unchanged Core registry on the structurally observed registration inputs.
// Unread value text remains unobserved; this does not run body schema or domain validation.
function checkPartitionBindings(nodes,manifest,meta,{digestCanonical,createRegistry}){
 const fail=(code,subject)=>{const e=new Error(code+':'+subject);e.code=code;e.subject=subject;throw e;},need=(v,c,s)=>{if(!v)fail(c,s);};
 const roles={asset:'asset_declaration',contract:'result_contract',component:'method_component',unit:'method_unit',plan:'method_plan',plan_node:'method_instance',policy:'conditional_policy',branch_entry:'branch'},key=t=>JSON.stringify([t.kind,t.id]);
 const assets=nodes.filter(n=>n.target?.kind==='asset');need(assets.length===1,'SCAN_ASSET_COUNT','asset');const asset=assets[0],assetTarget={kind:'asset',id:manifest.asset_uid};
 need(meta.asset.asset_id===manifest.asset_id&&meta.asset.asset_version===manifest.version&&meta.asset.judgment_version===manifest.judgment_version,'SCAN_ASSET_IDENTITY','manifest');
 need(asset.value.asset_uid===manifest.asset_uid&&key(asset.target)===key(assetTarget),'SCAN_VALUE_ASSET_ID',asset.id);
 const byTarget=new Map();for(const n of nodes){need(n.target&&!n.target.asset&&typeof n.target.kind==='string'&&typeof n.target.id==='string','SCAN_TARGET',n.id);const k=key(n.target);need(!byTarget.has(k),'SCAN_DUPLICATE_TYPED_ID',n.id);byTarget.set(k,n);}
 const order=new Set(meta.node_order);need(nodes.length===order.size&&order.size===meta.node_order.length&&nodes.every(n=>order.has(n.id))&&new Set(nodes.map(n=>n.id)).size===nodes.length,'SCAN_NODE_SET','node_order');
 need(meta.asset_index.length===meta.node_order.length&&meta.asset_index.every((row,i)=>row.node_ref===meta.node_order[i]),'SCAN_INDEX_ORDER','asset_index');
 const actualById=new Map(nodes.map(n=>[n.id,n]));nodes=meta.node_order.map(id=>actualById.get(id));
 need(JSON.stringify(nodes.filter(n=>n.target.kind==='judgment').map(n=>n.target.id))===JSON.stringify(meta.catalog.map(row=>row.judgment_id)),'SCAN_CATALOG_ORDER','catalog');
 const ownedByAsset=n=>n.owner&&!n.owner.asset&&key(n.owner)===key(assetTarget)&&n.owner_judgment_id===null;
 const payload={asset:meta.asset,judgments:nodes.filter(n=>n.target.kind==='judgment').map(n=>n.value)};
 for(const [kind,name]of [['actor','actors'],['material','materials'],['reason','reasons'],['source','sources'],['source_use','source_uses'],['resource','resources'],['relationship','relationships'],['dependency','dependencies'],['condition','conditions'],['shared_declaration','shared_declarations'],['example','examples']])payload[name]=nodes.filter(n=>n.target.kind===kind).map(n=>n.value);
 for(const [kind,name]of [['contract','contracts'],['exception','exceptions'],['misuse','misuse']])payload[name]=nodes.filter(n=>n.target.kind===kind&&ownedByAsset(n)).map(n=>n.value);
 payload.declarations=structuredClone(asset.value.declarations);
 if(payload.declarations.boundaries?.state==='provided')payload.declarations.boundaries.value=nodes.filter(n=>n.target.kind==='boundary'&&ownedByAsset(n)).map(n=>n.value);
 const registry=createRegistry(manifest,payload);need(registry.ordered.length===nodes.length,'SCAN_REGISTRY_SET','record_count');need(registry.ordered.every((record,i)=>byTarget.get(key(record.target))?.id===meta.node_order[i]),'SCAN_REGISTRY_ORDER','node_order');
 for(const expected of registry.ordered){const n=byTarget.get(key(expected.target));need(n,'SCAN_REGISTRY_MISSING',key(expected.target));need(!n.owner?.asset&&key(n.owner)===key(expected.owner)&&n.owner_judgment_id===expected.judgment,'SCAN_REGISTRY_OWNER',n.id);
 const role=expected.value?.kind==='emission_list'&&expected.target.kind==='contract'?'emission_list_contract':roles[expected.target.kind]??expected.target.kind;
 need(n.role===role&&n.id===role+':'+digestCanonical([meta.asset,expected.target]).slice(7,47),'SCAN_STABLE_NODE_ID',n.id);
 need(digestCanonical(n.activation??null)===digestCanonical(expected.activation??null),'SCAN_REGISTRY_ACTIVATION',n.id);
 if(expected.target.kind!=='asset'&&expected.target.kind!=='result')need(n.value.id===expected.value.id,'SCAN_VALUE_TYPED_ID',n.id);
 }
 return {nodes:nodes.length,judgments:payload.judgments.length,root_records:registry.ordered.filter(n=>n.judgment===null).length,registry:'Unchanged Core createRegistry on observed registration structure, actual Manifest history and actual asset boundary state. Complete typed target, owner, judgment owner, activation and stable node identity compared.',full_semantic_validation:false};
}
module.exports={checkPartitionBindings};
