'use strict';
const C=require('./section-common.js');
function plainClone(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v)){const a=new Array(v.length);for(let i=0;i<v.length;i++)a[i]=plainClone(v[i]);return a;}const o={},ks=Object.keys(v);for(let i=0;i<ks.length;i++){const k=ks[i],x=plainClone(v[k]);if(k==='__proto__')Object.defineProperty(o,k,{value:x,enumerable:true,writable:true,configurable:true});else o[k]=x;}return o;}
function reconstructPayload(ir){
 C.validate('CanonicalIR06Candidate',ir);
 const assets=ir.nodes.filter(n=>n.target.kind==='asset');C.need(assets.length===1,'SECTION_ASSET_NODE');const asset=assets[0],value=asset.value,assetKey=C.strict.canonicalJson(asset.target);
 const sameOwner=a=>a&&a.kind===asset.target.kind&&a.id===asset.target.id&&Object.keys(a).length===Object.keys(asset.target).length&&(!Object.hasOwn(asset.target,'asset')||C.strict.canonicalJson(a)===assetKey);
 const collection=kind=>ir.nodes.filter(n=>n.target.kind===kind&&n.owner_judgment_id===null&&sameOwner(n.owner)).map(n=>plainClone(n.value));
 const payload={profile:ir.tuple.payload_profile,profile_version:ir.tuple.payload_version,asset:plainClone(ir.asset)};
 for(const [kind,key]of [['actor','actors'],['material','materials'],['reason','reasons'],['source','sources'],['source_use','source_uses'],['resource','resources'],['relationship','relationships'],['dependency','dependencies'],['contract','contracts'],['condition','conditions'],['shared_declaration','shared_declarations'],['example','examples'],['exception','exceptions'],['misuse','misuse']])payload[key]=collection(kind);
 payload.judgments=ir.nodes.filter(n=>n.target.kind==='judgment').map(n=>plainClone(n.value));
 const forms=new Set(payload.judgments.map(j=>j.form));C.need(forms.size>0&&[...forms].every(x=>['rule','conclusion'].includes(x)),'SECTION_FORM_INVALID');payload.asset_capability=forms.size===2?'mixed':forms.has('rule')?'result_forming_rules':'asserted_answers';
 for(const k of ['scope','kernel','reading_order','cohesion','attributions','content_risk','extensions'])if(Object.hasOwn(value,k))payload[k]=plainClone(value[k]);
 payload.declarations=plainClone(value.declarations);if(payload.declarations.boundaries)payload.declarations.boundaries.value=payload.declarations.boundaries.state==='provided'?collection('boundary'):null;
 return payload;
}
module.exports={reconstructPayload};
