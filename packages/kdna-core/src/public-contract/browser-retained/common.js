'use strict';
const strict=require('../browser-native/strict-input.js'),contract=require('../retained/contract.json'),Cbor=require('../cbor.js');
const validators=require('../retained-browser06/validators.cjs'),{digest}=require('../digests.js');
const failures=new WeakMap();
function need(ok,code='SECTION_INDEX_INCONSISTENT'){if(!ok){const error=new Error(code);failures.set(error,code);throw error;}}
function failureCode(error){return failures.get(error)??null;}
function parseJsonText(text){need(typeof text==='string','READ_INPUT_INVALID');return strict.parseJson(text);}
function scalars(value,shape,depth=0){need(depth<=64,'READ_CORE_INVALID');if(shape.$ref){const n=shape.$ref.slice(8);if(n==='Identifier')need(strict.identifier(value),'READ_CORE_INVALID');if(['EntryName','RuntimeMandatoryEntryName'].includes(n))need(strict.entryName(value),'READ_CORE_INVALID');if(n==='Timestamp')need(strict.validTimestamp(value),'READ_CORE_INVALID');return scalars(value,contract.types[n],depth);}if(typeof value==='string')need(strict.scalarString(value),'READ_CORE_INVALID');if(value&&typeof value==='object'){if(shape.properties)for(const [k,c]of Object.entries(shape.properties))if(Object.hasOwn(value,k))scalars(value[k],c,depth+1);if(Array.isArray(value)&&shape.items)for(const x of value)scalars(x,shape.items,depth+1);}for(const c of shape.allOf??[])scalars(value,c,depth);for(const c of shape.oneOf??shape.anyOf??[]){const s=c.$ref?contract.types[c.$ref.slice(8)]:c;if(s.type&&(s.type==='null'?value!==null:s.type==='array'?!Array.isArray(value):typeof value!==s.type))continue;if(s.properties&&Object.entries(s.properties).some(([k,x])=>Object.hasOwn(x,'const')&&Object.hasOwn(value??{},k)&&value[k]!==x.const))continue;scalars(value,c,depth);}}

function validate(name,value){strict.assertStrictJson(value);if(typeof validators[name]!=='function')throw new Error('INTERNAL_RETAINED_SCHEMA_ROOT');need(validators[name](value),'SECTION_TYPED_SHAPE');scalars(value,contract.types[name]);return value;}
function keys(v,ks){need(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===ks.length&&ks.every(k=>Object.hasOwn(v,k)),'UNKNOWN_OR_MISSING_FIELD');}
const utf8=strict.compareUtf8;
function sortedUnique(xs){need(xs.every((v,i)=>typeof v==='string'&&(i===0||utf8(xs[i-1],v)<0)),'KEY_ORDER_OR_DUPLICATE');}
module.exports={failureCode,isFailure:e=>failures.has(e),parseJsonText,strict,contract,validate,shape:validate,keys,need,utf8,sortedUnique,sha:digest,decode:Cbor.decodePayload,tableKeys:{sections:'section_id',topics:'judgment_id',node_sections:'node_ref'},rowNames:{sections:'Representation06DataSectionRow',topics:'Representation06TopicRow',node_sections:'Representation06NodeSectionRow'}};
