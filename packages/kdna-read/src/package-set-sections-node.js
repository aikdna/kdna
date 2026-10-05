'use strict';
const {createRequire}=require('node:module');
const {types:utilTypes}=require('node:util');
const coreRequire=createRequire(require.resolve('@aikdna/kdna-core/package.json'));
const A=coreRequire('./src/public-contract/native-package-set-admission.js');
const H=coreRequire('./src/public-contract/native-package-set-handoff.js');
const D=coreRequire('./src/public-contract/native-package-set-delivery-state.js');
const RS=coreRequire('./src/public-contract/retained-state.js');
const RC=coreRequire('./src/public-contract/retained-common.js');
const retained=coreRequire('./src/public-contract/retained-sections-node.js');
const strict=coreRequire('./src/public-contract/strict-input.js');
const {readRetainedSection,createTrustedHostReadProvider}=require('./retained-sections-node.js');
const {hosts}=require('./brands.js');
const post=require('./native-package-retained-observation.js');
const readProviders=new WeakMap();
const abortedGetter=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
const same=(a,b)=>strict.canonicalJson(a)===strict.canonicalJson(b);
function configRecord(value){
  if(!value||typeof value!=='object'||utilTypes.isProxy(value)||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Object.getOwnPropertySymbols(value).length)throw TypeError('Native PackageSet Read provider config');
  const result={};
  for(const key of Object.getOwnPropertyNames(value)){
    const d=Object.getOwnPropertyDescriptor(value,key);
    if(!['host_id','host_epoch','observeRead','sink'].includes(key)||!d||!Object.hasOwn(d,'value')||!d.enumerable)throw TypeError('Native PackageSet Read provider config');
    result[key]=d.value;
  }
  if(!strict.identifier(result.host_id)||!strict.identifier(result.host_epoch)||typeof result.observeRead!=='function'||Object.hasOwn(result,'sink')&&typeof result.sink!=='function')throw TypeError('Native PackageSet Read provider config');
  return Object.freeze(result);
}
function createTrustedNativePackageReadProvider(config){const state=configRecord(config),token=Object.freeze({});readProviders.set(token,state);return token;}
function empty(){return{decision:null,read_result:null,delivered:null,local_failure:null,preparation_failure:null,sink_invoked:false,sink_confirmed:false,registered_handles:0,registered_handle_ids:[],handle_registration:'none',host_closed:true,member_observations:0,reader_observations:0};}
async function readNativePackageSet(admission,request,authority,provider,signal){
  const facts=empty(),state=A.admissionState(admission),q=RS.requests.get(request),grant=RS.authorities.get(authority),p=readProviders.get(provider);
  const finish=()=>strict.freeze(facts);
  if(!state||!q||!grant){facts.local_failure='invalid_read_request';return finish();}
  const selected=state.set.selection;
  if(q.mode!=='exact_selection'||q.handle!==null||!same(q.tuple,state.tuple)||!q.selection||q.selection.asset_id!==selected.asset_id||q.selection.asset_version!==selected.asset_version||new Set(q.selection.judgment_ids).size!==1||q.selection.judgment_ids.some(id=>id!==selected.judgment_id)){
    facts.local_failure='invalid_read_request';return finish();
  }
  if(!p||p.host_id!==state.host_id||p.host_epoch!==state.host_epoch){facts.local_failure='provider_invalid';return finish();}
  let abortable=null;
  if(signal!==undefined){
    try{if(utilTypes.isProxy(signal))throw Error();abortedGetter.call(signal);abortable=signal;}catch{facts.local_failure='invalid_read_request';return finish();}
  }
  const cancelled=()=>abortable!==null&&abortedGetter.call(abortable);
  if(cancelled()){facts.local_failure='cancelled';return finish();}
  facts.decision=state.decision;
  let r07=null,prepared=null,host=null,record=null,postResult=null;
  const latch=code=>{if(facts.local_failure===null)facts.local_failure=code;};
  function current(){
    if(cancelled())latch('cancelled');
    const result=A.recheck(admission,'read',()=>{facts.member_observations++;});
    if(result.status!=='allowed'){
      if(result.decision?.status==='rejected'&&r07===null)r07=result.decision;
      else if(result.local_failure)latch(result.local_failure);
    }
    if(r07)facts.decision=r07;
    return r07===null&&facts.local_failure===null;
  }
  const boundaryFailure=()=>new Error('NATIVE_PACKAGESET_BOUNDARY');
  async function observe(context){
    if(!current())throw boundaryFailure();
    let raw,threw=false;
    facts.reader_observations++;
    try{raw=await p.observeRead(context);}catch{threw=true;}
    const allowed=current();
    if(threw){latch('provider_failed');throw boundaryFailure();}
    if(!allowed)throw boundaryFailure();
    let value;
    try{value=strict.copyJson(raw);RC.validate('RetainedSectionHostObservation06',value);if(value.host_id!==p.host_id||value.host_epoch!==p.host_epoch)throw Error();}
    catch{latch('provider_observation_invalid');throw boundaryFailure();}
    return strict.freeze(value);
  }
  async function deliver(result){
    facts.read_result=result;
    if(result.channel!=='read_envelope'||result.envelope?.status!=='ready')return false;
    if(!current())return false;
    if(!p.sink){latch('delivery_unconfirmed');return false;}
    facts.sink_invoked=true;
    try{facts.sink_confirmed=p.sink(result)===true;}catch{facts.sink_confirmed=false;}
    // No thenable is awaited and no sink retry is possible.
    if(!facts.sink_confirmed)latch('delivery_unconfirmed');
    if(!current())return false;
    const observed=await post.observe(host,record);
    if(observed.error){postResult=post.fail(record,observed.error);return false;}
    const body={content:result.envelope.content,omissions:[...result.envelope.omissions]};
    if(!post.scope(body,record,observed.value)){postResult=post.fail(record,'READ_SCOPE_DENIED');return false;}
    return current()&&facts.sink_confirmed;
  }
  try{
    if(!current())return finish();
    let prep;
    try{prep=await retained.prepareRetainedSectionRead(state.selected_member.snapshot,request,authority);}
    catch{latch('core_unavailable');}
    const after=current();
    if(prep?.status==='prepared')prepared=prep.prepared;
    if(!after)return finish();
    if(prep?.status!=='prepared'){
      if(prep){facts.preparation_failure=prep;latch('read_preparation_failed');}
      return finish();
    }
    record=RS.preparations.get(prepared);
    if(!record){latch('core_unavailable');return finish();}
    host=createTrustedHostReadProvider({observe,deliver});
    const actual=await readRetainedSection(prepared,host);
    if(postResult)facts.read_result=postResult;
    else if(!facts.read_result)facts.read_result=actual;
    // Retained Read owns actual registration. Read the registry before any failure cleanup.
    const ids=[...(hosts.get(host)?.handles.keys()??[])].sort();
    facts.registered_handle_ids=ids;facts.registered_handles=ids.length;facts.handle_registration=ids.length?'registered':'none';
    const allowed=current();
    const succeeded=allowed&&!postResult&&actual.channel==='read_envelope'&&actual.envelope.status==='ready'&&facts.sink_confirmed;
    if(succeeded){facts.read_result=actual;facts.delivered=D.register(admission,actual);facts.host_closed=false;}
    return finish();
  }catch{latch('core_unavailable');return finish();}
  finally{
    if(prepared)RS.close(prepared);
    if(host&&facts.delivered===null){hosts.get(host)?.handles.clear();hosts.delete(host);}
    record=null;prepared=null;host=null;
  }
}
module.exports={getNativePackageReadContract:()=>A.descriptor,createTrustedNativePackageReadProvider,readNativePackageSet,sealNativePackageSetHandoff:H.seal,admitNativePackageSetHandoff:H.admit};
