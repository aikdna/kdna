'use strict';
// grammar.2 R09 — Read's catalog-only arm.
//
// Core may answer a technically valid asset whose static interpretation is blocked
// by an unknown critical semantic unit with a body-free `catalog_only` carrier: the
// descriptor list Core validated from `payload.judgments`, the asset coordinate and
// the digest evidence Core already computed. For `mode:"catalog"` Read maps exactly
// that carrier into a `ReadEnvelopeCatalogOnly`; for every other mode the same
// blockage stays the ordinary fail-closed rejection.
//
// This arm is deliberately carrier-limited and never trusts the carrier blindly:
//
//   * `inspectSnapshot` rejects the carrier (it is not a Core-issued snapshot), so
//     it grants no body, no closure, no projection and no expansion handle;
//   * Read re-derives the carrier's own identity from the carrier's fields, so a
//     descriptor list edited after Core issued it no longer verifies;
//   * Read binds the carrier to the bytes it was actually handed by re-computing
//     the container digest A, so a carrier minted for another asset is rejected;
//   * Read re-derives every descriptor `node_ref` and checks parent closure, so a
//     descriptor is a coordinate of this asset, never an arbitrary body position;
//   * Read refuses a carrier it cannot verify at all (no SHA-256 facility, a
//     foreign tuple, a malformed carrier) instead of disclosing an unverified one.
//
// What this cannot do, and does not claim: Read never parses the Payload, so it
// cannot independently confirm that a *self-consistent* carrier lists exactly
// `payload.judgments`. That obligation is Core's and is discharged by construction
// plus the Core-side acceptance of this line (`PUBLIC-CATALOG-CRITICAL-EXEMPTION`).
const {clone,freeze,jcs,tuple,diagnostic,assessment}=require('./util.js');
const schema=require('../schema/read-contract-0.6.4.schema.json');

const CARRIER_PREFIX='catalog:';
const CAPABILITIES=schema.$defs.AssetCapability.enum;
const CATALOG_KEYS=Object.keys(schema.$defs.CatalogItem.properties).sort();
const DIGEST_KEYS=['A','C','E'];
// The Core carrier's field set is the machine-source type `CoreAdmissionCatalogOnly`.
// This line's generated Read schema does not mirror the Core admission union, so the
// nine names are written out here and the D2 case set asserts them against
// `specs/public-semantic-source.json` and against what Core actually issues — the
// hand-copy is a checked invariant, not an assumption. (Recommended follow-up for
// the source owner: mirror the carrier type into the generated Read artifact.)
const CARRIER_KEYS=['asset','asset_capability','carrier_id','catalog','diagnostics','digests','states','status','tuple'];

const encoder=new TextEncoder();
function utf8(text){return encoder.encode(text);}
function exactKeys(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const own=Object.keys(value).sort();
  return own.length===keys.length&&own.every((key,index)=>key===keys[index]);
}
function text(value){return typeof value==='string'&&value.length>0&&!/[\u0000-\u001f\u007f-\u009f\ud800-\udfff]/.test(value);}
// SHA-256 is taken from the host runtime's WebCrypto when it exists. Read never
// imports a Node builtin: the whole Read surface stays usable from a browser. When
// no facility exists the arm fails closed rather than disclosing an unverified
// catalog.
async function sha256Hex(bytes){
  const subtle=globalThis.crypto?.subtle;
  if(!subtle||typeof subtle.digest!=='function')return null;
  const view=await subtle.digest('SHA-256',bytes);
  const out=new Uint8Array(view);let hex='';
  for(const byte of out)hex+=byte.toString(16).padStart(2,'0');
  return hex;
}
// A descriptor node_ref is the Canonical IR judgment node id: role plus the first
// 20 bytes of SHA-256 over the canonical `[asset, judgment_id]` pair. Read
// re-derives it from the carrier's own coordinate, so the carrier cannot name an
// arbitrary or body-bearing position.
async function nodeRefFor(asset,judgmentId){
  const hex=await sha256Hex(utf8(jcs([asset,judgmentId])));
  return hex===null?null:'judgment:'+hex.slice(0,40);
}
function carrierPreimage(carrier){const {carrier_id,...rest}=carrier;return rest;}

async function inspectCatalogCarrier(carrier,input){
  const invalid={error:'READ_PROJECTION_INVALID'};
  if(!exactKeys(carrier,CARRIER_KEYS)||carrier.status!=='catalog_only')return invalid;
  if(jcs(carrier.tuple)!==jcs(tuple)){
    return {error:Object.keys(tuple).some(key=>key!=='payload_profile'&&carrier.tuple?.[key]===tuple[key])?'READ_MIXED_VERSION_TUPLE':'READ_UNSUPPORTED_VERSION'};
  }
  if(!exactKeys(carrier.asset,['asset_id','asset_version','judgment_version']))return invalid;
  for(const key of ['asset_id','asset_version','judgment_version'])if(!text(carrier.asset[key]))return invalid;
  if(!CAPABILITIES.includes(carrier.asset_capability))return invalid;
  if(!exactKeys(carrier.states,['core','interpretation']))return invalid;
  if(carrier.states.core!=='valid'||!['degraded','blocked'].includes(carrier.states.interpretation))return invalid;
  if(!Array.isArray(carrier.diagnostics)||carrier.diagnostics.length!==1)return invalid;
  const diagnostic_=carrier.diagnostics[0];
  if(!exactKeys(diagnostic_,['code','field','severity','stage','subject']))return invalid;
  if(diagnostic_.code!=='READ_INTERPRETATION_INCOMPLETE'||diagnostic_.stage!=='core'||diagnostic_.severity!=='error')return invalid;
  if(diagnostic_.subject!==null||diagnostic_.field!==null)return invalid;
  if(!exactKeys(carrier.digests,DIGEST_KEYS))return invalid;
  for(const key of DIGEST_KEYS){
    const evidence=carrier.digests[key];
    if(!evidence||typeof evidence!=='object'||typeof evidence.observed!=='string'||!/^sha256:[0-9a-f]{64}$/.test(evidence.observed))return invalid;
  }
  if(!Array.isArray(carrier.catalog))return invalid;
  // The carrier's identity covers every other field, so an edited descriptor list
  // stops matching the identity Read was handed.
  const identity=await sha256Hex(utf8(jcs(carrierPreimage(carrier))));
  if(identity===null)return {error:'READ_CORE_CAPABILITY_UNAVAILABLE'};
  if(typeof carrier.carrier_id!=='string'||!carrier.carrier_id.startsWith(CARRIER_PREFIX)||carrier.carrier_id!==CARRIER_PREFIX+identity)return invalid;
  // The carrier must describe the bytes it is being projected with. A carrier
  // minted for another asset (or another revision of this one) is not attestable.
  if(input instanceof Uint8Array){
    const observed=await sha256Hex(input);
    if(observed===null)return {error:'READ_CORE_CAPABILITY_UNAVAILABLE'};
    if(carrier.digests.A.observed!=='sha256:'+observed)return {error:'READ_SNAPSHOT_UNATTESTED'};
  }
  const ids=new Set();
  for(const item of carrier.catalog){
    if(!exactKeys(item,CATALOG_KEYS))return invalid;
    if(!text(item.judgment_id)||ids.has(item.judgment_id))return invalid;
    ids.add(item.judgment_id);
    if(typeof item.label!=='string')return invalid;
    if(item.parent_ref!==null&&!text(item.parent_ref))return invalid;
    if(item.node_ref!==await nodeRefFor(carrier.asset,item.judgment_id))return invalid;
  }
  // A parent edge must close over the descriptors this carrier actually lists: a
  // hierarchy edge to an identity the carrier does not disclose is not a descriptor.
  for(const item of carrier.catalog)if(item.parent_ref!==null&&!ids.has(item.parent_ref))return invalid;
  return {carrier:freeze(clone(carrier))};
}

// The disclosure body. Every body-bearing family is empty by construction and the
// single error diagnostic is the blocked-interpretation fact the carrier names.
function catalogBody(carrier){
  return {
    asset:carrier.asset,
    tuple:carrier.tuple,
    digests:carrier.digests,
    // The Core carrier identity, never a `snapshot:` value: no snapshot exists on
    // this arm and `inspectSnapshot` returns null for this coordinate.
    snapshot_id:carrier.carrier_id,
    content:{
      declarations:[],selected:null,closure:[],references:[],relationships:[],missing:[],
      catalog:carrier.catalog.map(item=>({judgment_id:item.judgment_id,label:item.label,node_ref:item.node_ref,parent_ref:item.parent_ref})),
      provenance:{declarations:[],confirmation:'not_evaluated',verifier_id:null,evidence_ref:null},
      asset_capability:carrier.asset_capability,
      expansion_handles:[]
    },
    diagnostics:[diagnostic('READ_INTERPRETATION_INCOMPLETE','core')],
    omissions:carrier.catalog.map(item=>({state:'explicitly_omitted',target:item.node_ref,field:'judgment',reason:'not_in_mode',expandable:false,handle_id:null})),
    assessment:assessment()
  };
}

// R09 body limits, enforced immediately before disclosure so a future change that
// started filling one of these families would fail closed instead of leaking a
// judgment body through the catalog arm.
function catalogOnlyViolation(body){
  const content=body?.content;
  if(!content)return 'READ_PROJECTION_INVALID';
  for(const family of ['closure','declarations','references','relationships','missing','expansion_handles'])if(content[family].length)return 'READ_PROJECTION_INVALID';
  if(content.selected!==null||content.provenance.declarations.length)return 'READ_PROJECTION_INVALID';
  if(!CAPABILITIES.includes(content.asset_capability))return 'READ_PROJECTION_INVALID';
  if(!content.catalog.every(item=>exactKeys(item,CATALOG_KEYS)))return 'READ_PROJECTION_INVALID';
  return null;
}

module.exports={inspectCatalogCarrier,catalogBody,catalogOnlyViolation,CARRIER_PREFIX,CARRIER_KEYS,CATALOG_KEYS};
