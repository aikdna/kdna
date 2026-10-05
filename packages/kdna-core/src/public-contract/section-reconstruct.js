'use strict';
const C=require('./section-common.js');
function reconstructPayload(ir){
 C.validate('CanonicalIR06Candidate',ir);
 const assets=ir.nodes.filter(n=>n.target.kind==='asset');C.need(assets.length===1,'SECTION_ASSET_NODE');const asset=assets[0],value=asset.value;
 const same=(a,b)=>C.strict.canonicalJson(a)===C.strict.canonicalJson(b);
 const collection=kind=>ir.nodes.filter(n=>n.target.kind===kind&&n.owner_judgment_id===null&&same(n.owner,asset.target)).map(n=>structuredClone(n.value));
 const payload={profile:ir.tuple.payload_profile,profile_version:ir.tuple.payload_version,asset:structuredClone(ir.asset)};
 for(const [kind,key]of [['actor','actors'],['material','materials'],['reason','reasons'],['source','sources'],['source_use','source_uses'],['resource','resources'],['relationship','relationships'],['dependency','dependencies'],['contract','contracts'],['condition','conditions'],['shared_declaration','shared_declarations'],['example','examples'],['exception','exceptions'],['misuse','misuse']])payload[key]=collection(kind);
 payload.judgments=ir.nodes.filter(n=>n.target.kind==='judgment').map(n=>structuredClone(n.value));
 const forms=new Set(payload.judgments.map(j=>j.form));C.need(forms.size>0&&[...forms].every(x=>['rule','conclusion'].includes(x)),'SECTION_FORM_INVALID');payload.asset_capability=forms.size===2?'mixed':forms.has('rule')?'result_forming_rules':'asserted_answers';
 for(const k of ['scope','kernel','reading_order','cohesion','attributions','content_risk','extensions'])if(Object.hasOwn(value,k))payload[k]=structuredClone(value[k]);
 payload.declarations=structuredClone(value.declarations);if(payload.declarations.boundaries)payload.declarations.boundaries.value=payload.declarations.boundaries.state==='provided'?collection('boundary'):null;
 return payload;
}
module.exports={reconstructPayload};
