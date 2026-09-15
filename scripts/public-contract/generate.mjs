#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const SELF=fileURLToPath(import.meta.url), SCRIPT_DIR=path.dirname(SELF);
const BASE_OUTPUTS=['schema/manifest-0.2.schema.json','schema/payload-profile-0.2.schema.json','specs/canonical-ir.schema.json','specs/read-contract.schema.json','specs/public-diagnostics.json','specs/public-vocabulary.json'];
const TRANSPORT_OUTPUT='specs/read-transport-admission.schema.json';
const OUTPUTS=[...BASE_OUTPUTS,TRANSPORT_OUTPUT];
const MANIFEST='specs/public-generation-manifest.json';
const VALIDATOR_OUTPUTS=['packages/kdna-core/src/public-contract/validators.generated.js','packages/kdna-core/src/public-contract/handoff-validator.generated.js','packages/kdna-read/src/transport-validators.generated.js'];
const INTEGRATION_OUTPUTS=["specs/component-semantics.md","packages/kdna-core/src/public-contract/components.d.ts","packages/kdna-read/schema/read-transport-admission-0.1.schema.json", "packages/kdna-read/src/transport.d.ts", "packages/kdna-read/src/transport-contract.json", "packages/kdna-core/src/public-contract/types.d.ts", "packages/kdna-core/src/public-contract/generated-contract.json", "packages/kdna-read/src/types.d.ts", "packages/kdna-core/schema/manifest-0.2.schema.json", "packages/kdna-core/schema/payload-profile-0.2.schema.json", "packages/kdna-core/schema/canonical-ir-0.2.schema.json", "packages/kdna-core/schema/public-diagnostics.json", "packages/kdna-core/schema/public-vocabulary.json", "packages/kdna-read/schema/read-contract-0.2.schema.json", "conformance/public-contract/adapter-contract.json", "conformance/public-contract/vectors.generated.json", "packages/kdna-core/src/public-contract/node.d.ts", "packages/kdna-core/src/public-contract/browser.d.ts", "packages/kdna-core/src/public-contract/read-boundary.d.ts", "packages/kdna-read/src/index.d.ts", "packages/kdna-read/src/node.d.ts", "packages/kdna-read/src/browser.d.ts", "packages/kdna-read/src/embedding.d.ts", "conformance/public-contract/ir-retention-vectors.generated.json"];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const utf8sort=(a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b));
const ordered=v=>Array.isArray(v)?v.map(ordered):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,ordered(v[k])])):v;
const bytes=v=>Buffer.from(JSON.stringify(ordered(v),null,2)+'\n','utf8');
function fail(code,message){throw Object.assign(new Error(message),{code});}
function parse(argv){const o={check:false};for(let i=0;i<argv.length;i++){const a=argv[i];if(a==='--check'){if(o.check)fail('ARGUMENT','duplicate --check');o.check=true;continue;}if(!['--source','--root','--out-dir','--scratch-dir'].includes(a))fail('ARGUMENT','unknown argument '+a);const key=a.slice(2);if(o[key]!==undefined||!argv[i+1]||argv[i+1].startsWith('--'))fail('ARGUMENT','missing or duplicate '+a);o[key]=path.resolve(argv[++i]);}for(const k of ['source','root','out-dir'])if(!o[k])fail('ARGUMENT','required --'+k);if(!o.check&&!o['scratch-dir'])fail('ARGUMENT','generation requires --scratch-dir');return o;}
function regular(p){const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink())fail('PATH','expected regular nonsymlink file');return fs.readFileSync(p);}
function pointer(v,p){if(p==='')return v;if(!p.startsWith('/'))fail('SOURCE','invalid source pointer');for(const raw of p.slice(1).split('/')){const k=raw.replaceAll('~1','/').replaceAll('~0','~');if(v===null||typeof v!=='object'||!Object.hasOwn(v,k))fail('SOURCE','missing pointer '+p);v=v[k];}return v;}
const schemaKeys=new Set(['$ref','$value','$opaque','type','properties','required','additionalProperties','items','minItems','maxItems','uniqueItems','minProperties','maxProperties','minLength','maxLength','pattern','minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf','const','enum','oneOf','anyOf','allOf','if','then','else','not','title','description']);
function validateNode(s,types,where){if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).length===0)fail('SOURCE','empty/untyped schema node '+where);for(const k of Object.keys(s))if(!schemaKeys.has(k))fail('SOURCE','unknown schema keyword '+k);if(!Object.keys(s).some(k=>!['title','description'].includes(k)))fail('SOURCE','annotation-only unconstrained node '+where);if(s.$opaque!==undefined){if(s.$opaque!==true||Object.keys(s).length!==1)fail('SOURCE','invalid opaque node');return;}if(s.$value!==undefined){if(typeof s.$value!=='string'||Object.keys(s).length!==1)fail('SOURCE','invalid binding node');return;}if(s.$ref!==undefined){if(!/^#\/\$defs\/[A-Za-z][A-Za-z0-9_]*$/.test(s.$ref)||!Object.hasOwn(types,s.$ref.slice(8)))fail('SOURCE','unresolved or nonlocal reference '+s.$ref);}
if(s.type==='object'){if(s.additionalProperties!==false||!s.properties||Object.keys(s.properties).length===0)fail('SOURCE','object must declare closed properties '+where);if(!Array.isArray(s.required)||s.required.some(k=>!Object.hasOwn(s.properties,k)))fail('SOURCE','invalid required list '+where);}
if(s.type==='array'&&!s.items)fail('SOURCE','array items absent '+where);
if(s.properties){for(const [k,v]of Object.entries(s.properties))validateNode(v,types,where+'.'+k);}
for(const k of ['items','if','then','else','not'])if(s[k])validateNode(s[k],types,where+'.'+k);
for(const k of ['oneOf','anyOf','allOf'])if(s[k]){if(!Array.isArray(s[k])||s[k].length===0)fail('SOURCE','empty union');for(const v of s[k])validateNode(v,types,where+'.'+k);}
}
function compileNode(v,source){if(Array.isArray(v))return v.map(x=>compileNode(x,source));if(v&&typeof v==='object'){if(v.$opaque===true)return false;if(v.$value!==undefined){const x=pointer(source,v.$value);if(!['string','number','boolean'].includes(typeof x)&&x!==null)fail('SOURCE','binding must resolve scalar');return {const:x,type:x===null?'null':typeof x==='number'?(Number.isInteger(x)?'integer':'number'):typeof x};}return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,compileNode(x,source)]));}return v;}
function references(v,result=new Set()){if(v&&typeof v==='object'){if(typeof v.$ref==='string')result.add(v.$ref.slice(8));for(const x of Object.values(v))references(x,result);}return result;}
function closure(names,types){const seen=new Set(),queue=[...names];while(queue.length){const n=queue.shift();if(seen.has(n))continue;if(!Object.hasOwn(types,n))fail('SOURCE','root/export missing '+n);seen.add(n);queue.push(...references(types[n]));}return Object.fromEntries([...seen].sort().map(n=>[n,types[n]]));}
function build(source,o,sourceBytes){if(source.schema_dialect!=='https://json-schema.org/draft/2020-12/schema')fail('SOURCE','JSON Schema 2020-12 required');if(source.format!=='kdna.public-semantic-source/1')fail('SOURCE','unsupported source format');if(!source.types||typeof source.types!=='object'||Array.isArray(source.types))fail('SOURCE','types required');if(!Array.isArray(source.artifacts)||source.artifacts.length!==6||JSON.stringify(source.artifacts.map(x=>x.path).sort())!==JSON.stringify([...BASE_OUTPUTS].sort()))fail('SOURCE','unexpected artifact set');
if(!source.diagnostic_registry||!source.diagnostic_scopes||source.diagnostic_registry.some(c=>typeof source.diagnostic_scopes[c]!=='string'))fail('SOURCE','diagnostic scope coverage missing');const designRows=[];for(const a of source.accepted_designs??[]){if(typeof a.path!=='string'||a.path.startsWith('/')||a.path.split('/').some(x=>x==='..'||x===''))fail('SOURCE','unsafe design path');const b=regular(path.join(o.root,a.path));if(b.length!==a.bytes||sha(b)!==a.sha256)fail('DESIGN_DRIFT',a.path);designRows.push({path:a.path,bytes:b.length,sha256:sha(b)});}if(designRows.length!==6)fail('SOURCE','six accepted inputs required');
if(!Array.isArray(source.design_bindings)||source.design_bindings.length===0)fail('SOURCE','accepted design bindings required');for(const b of source.design_bindings){if(!designRows.some(x=>x.path===b.design))fail('SOURCE','binding outside accepted inputs');const d=JSON.parse(regular(path.join(o.root,b.design)));let actual=pointer(source,b.source_pointer);if(b.source_transform==='resolved_const')actual=compileNode(actual,source).const;else if(b.source_transform==='resolved_const_record')actual=Object.fromEntries(Object.entries(compileNode(actual,source)).map(([k,v])=>[k,v.const]));else if(b.source_transform!==undefined)fail('SOURCE','unknown binding transform');if(JSON.stringify(ordered(pointer(d,b.design_pointer)))!==JSON.stringify(ordered(actual)))fail('SOURCE_CONFLICT','accepted binding differs: '+b.source_pointer);}
for(const [n,s]of Object.entries(source.types)){if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(n))fail('SOURCE','unsafe type name');validateNode(s,source.types,n);}if(!Array.isArray(source.non_schema_rules)||!source.non_schema_rules.length)fail('SOURCE','non-schema obligations missing');for(const r of source.non_schema_rules){if(!r.id||!r.requirement||!r.future_owner||!r.future_boundary||r.enforcement!=='NOT_IMPLEMENTED_NON_SCHEMA'||r.applies_to.some(x=>!Object.hasOwn(source.types,x)))fail('SOURCE','invalid non-schema mapping');}
const compiled=compileNode(source.types,source),outputs=new Map();for(const a of source.artifacts){if(a.root){const defs=closure([...new Set([a.root,...a.exports])],compiled);outputs.set(a.path,bytes({$schema:source.schema_dialect,$id:a.id,title:a.root,description:'Generated from the single public semantic source. Structural validity is not trusted admission or runtime authorization.',$ref:'#/$defs/'+a.root,$defs:defs}));}else if(a.kind==='diagnostics'){outputs.set(a.path,bytes({format:'kdna.public-diagnostics/1',status:source.status,entries:source.diagnostic_registry.map(code=>({code,scope:source.diagnostic_scopes[code],...(source.diagnostic_definitions?.[code]??{})})),non_schema_obligations:source.non_schema_rules.map(r=>({id:r.id,owner:r.future_owner,boundary:r.future_boundary,enforcement:r.enforcement}))}));}else if(a.kind==='vocabulary'){const entries=[];function walk(s,loc){if(s&&typeof s==='object'){if(s.enum)entries.push({definition:loc,kind:'enum',values:s.enum});if(Object.hasOwn(s,'const'))entries.push({definition:loc,kind:'literal',values:[s.const]});for(const [k,v]of Object.entries(s))walk(v,loc+'/'+k);}}for(const [n,s]of Object.entries(compiled))walk(s,n);outputs.set(a.path,bytes({format:'kdna.public-vocabulary/1',status:source.status,version_tuple:source.versionTuple,entries}));}else fail('SOURCE','unknown derivative kind');}
const transport=source.transport_admission;
if(!transport)fail('SOURCE','Current public Read requires the transport module');
if(transport){
if(transport.schema_path!==TRANSPORT_OUTPUT||transport.contract!=='kdna.read-transport-admission/0.1.0'||transport.package_version!==eVersion(source)||transport.function!=='admitReadTransportResponse')fail('SOURCE','unexpected transport coordinate');
for(const name of Object.keys(transport.types))if(Object.hasOwn(source.types,name))fail('SOURCE','transport cannot override base semantic types');
const combined={...source.types,...transport.types};
for(const [name,node]of Object.entries(transport.types)){if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(name))fail('SOURCE','unsafe transport type');validateNode(node,combined,name);}
const defs=closure([transport.root,...transport.exports],compileNode(combined,source));
outputs.set(TRANSPORT_OUTPUT,bytes({$schema:source.schema_dialect,$id:transport.schema_id,title:transport.root,description:'Remote response admission only. No local authority or Core semantic revalidation.',$ref:'#/$defs/'+transport.root,$defs:defs}));
}
const artifactRows=[...outputs].map(([p,b])=>({path:p,bytes:b.length,sha256:sha(b)})).sort((a,b)=>utf8sort(a.path,b.path));const scriptRows=['generate.mjs','verify.mjs'].map(n=>{const b=regular(path.join(SCRIPT_DIR,n));return {path:'scripts/public-contract/'+n,bytes:b.length,sha256:sha(b)};});
const integrationRows=integration(source,compiled,o,outputs);
for(const [file,content]of standaloneValidators(source,compiled,outputs,o)){outputs.set(file,content);integrationRows.push({path:file,bytes:content.length,sha256:sha(content)});}
integrationRows.sort((a,b)=>utf8sort(a.path,b.path));
const manifest={integration:integrationRows,format:'kdna.public-generation-manifest/1',status:'UNPUBLISHED_GENERATED_STRUCTURE',source:{path:'specs/public-semantic-source.json',bytes:sourceBytes.length,sha256:sha(sourceBytes)},scripts:scriptRows,derived:artifactRows,accepted_designs:designRows,algorithm:{file_encoding:'recursive object keys sorted by JavaScript string sort; arrays preserve source order; JSON.stringify 2 spaces; UTF-8; one LF',aggregate:'derived rows sorted by unsigned UTF-8 path; row keys path,bytes,sha256; compact JSON.stringify UTF-8; no LF; SHA-256'},derived_aggregate_sha256:sha(JSON.stringify(artifactRows)),tools:{generator_node:process.versions.node,declared_validator:source.tooling},excluded:[MANIFEST,'docs/audits/2026-09-06-open-wave1-machine-source-implementation.json','docs/audits/2026-09-06-open-wave1-machine-source-independent-acceptance.md'],proof_limits:source.proof_limits};outputs.set(MANIFEST,bytes(manifest));return {outputs,manifest};}
function eVersion(source){return source.engineering.package_versions.read;}
function typeExpression(node,source,parentProperties={}){
if(node===false||node.$opaque)return 'never';
if(node.$value)return JSON.stringify(pointer(source,node.$value));
if(node.$ref)return node.$ref.slice(8);
if(Object.hasOwn(node,'const'))return JSON.stringify(node.const);
if(node.enum)return node.enum.map(x=>JSON.stringify(x)).join(' | ');
const props=node.properties??parentProperties;
const union=node.oneOf??node.anyOf;
if(union&&!node.type)return '('+union.map(x=>typeExpression(x,source,props)).join(' | ')+')';
let result;
if(node.type==='object'||node.properties)result='{ '+Object.entries(node.properties??{}).map(([k,v])=>'readonly '+JSON.stringify(k)+(node.required?.includes(k)?'':'?')+': '+typeExpression(v,source)+';').join(' ')+' }';
else if(node.type==='array')result=node.maxItems===0?'readonly []':'ReadonlyArray<'+typeExpression(node.items,source)+'>';
else if(['integer','number'].includes(node.type))result='number';
else if(['string','boolean','null'].includes(node.type))result=node.type;
else if(node.required)result='{ '+node.required.map(k=>{if(!props[k])fail('TYPE_RENDER','unbound required field '+k);return 'readonly '+JSON.stringify(k)+': '+typeExpression(props[k],source)+';';}).join(' ')+' }';
else return null; // Validation-only applicators refine runtime admission, not a JSON escape type.
if(node.allOf){const branches=node.allOf.map(x=>typeExpression(x,source,props)).filter(x=>x!==null);if(branches.length)result+=' & '+branches.map(x=>'('+x+')').join(' & ');}
if(node.type&&union)result+=' & ('+union.map(x=>typeExpression(x,source,props)).join(' | ')+')';
return result;
}
function integration(source,compiled,o,outputs){
if(!source.engineering)return [];
const e=source.engineering;
if(source.component_semantics){const c=source.component_semantics;outputs.set('specs/component-semantics.md',Buffer.from('# Public component semantics '+c.definition.version+'\n\nDefinition digest: `'+c.definition_digest+'`. Generated from the unique public semantic source. The public registry is not caller configurable.\n\n'+c.definition.rules.map((x,i)=>(i+1)+'. '+x).join('\n\n')+'\n'));}
for(const [target,original]of Object.entries(e.mirrors)){if(!INTEGRATION_OUTPUTS.includes(target)||!outputs.has(original))fail('SOURCE','unknown package mirror');outputs.set(target,outputs.get(original));}
if(source.transport_admission){
const t=source.transport_admission;
outputs.set('packages/kdna-read/schema/read-transport-admission-0.1.schema.json',outputs.get(TRANSPORT_OUTPUT));
const baseRefs=[...references(t.types)].filter(n=>Object.hasOwn(source.types,n)).sort();
const lines=['// Generated from specs/public-semantic-source.json; do not edit.',"import type { "+baseRefs.join(', ')+" } from '@aikdna/kdna-core';"];
for(const [name,node]of Object.entries(t.types))lines.push('export type '+name+' = '+typeExpression(node,source)+';');
lines.push('export declare function '+t.function+'(response: Response, context: ReadTransportContext): Promise<ReadTransportAdmissionResult>;');
outputs.set('packages/kdna-read/src/transport.d.ts',Buffer.from(lines.join('\n')+'\n'));
outputs.set('packages/kdna-read/src/transport-contract.json',bytes({contract:t.contract,limits:t.limits,diagnostic_codes:t.diagnostic_codes,proof_limits:t.proof_limits}));
}
const declarations=['// Generated from specs/public-semantic-source.json; do not edit.'];
for(const [name,node]of Object.entries(source.types)){
if(node.$opaque){declarations.push('declare const '+name+'Brand: unique symbol;','export type '+name+' = { readonly ['+name+'Brand]: true };');}
else declarations.push('export type '+name+' = '+typeExpression(node,source)+';');
}
declarations.push('export declare function admitBytes(input: Uint8Array): CoreAdmissionResult;');
outputs.set('packages/kdna-core/src/public-contract/types.d.ts',Buffer.from(declarations.join('\n')+'\n'));
outputs.set('packages/kdna-core/src/public-contract/generated-contract.json',bytes({versionTuple:source.versionTuple,digest_profiles:source.digest_profiles,resource_limits:e.resource_limits,component_semantics:source.component_semantics,types:compiled}));
for(const [file,text]of Object.entries(e.typescript_surfaces))outputs.set(file,Buffer.from('// Generated from specs/public-semantic-source.json; do not edit.\n'+text));
outputs.set('conformance/public-contract/ir-retention-vectors.generated.json',bytes({format:'kdna.ir-retention-vectors/1',authority:e.ir_retention.authority,cases:e.ir_retention_cases}));
const seed='conformance/public-contract-decision-vectors.json';if(!source.accepted_designs.some(x=>x.path===seed))fail('SOURCE','seed input not accepted');const seeds=JSON.parse(regular(path.join(o.root,seed)));
outputs.set('conformance/public-contract/vectors.generated.json',bytes(seeds));
outputs.set('conformance/public-contract/adapter-contract.json',bytes({format:'kdna.public-conformance-adapter/1',source:'specs/public-semantic-source.json',bindings:e.adapter_bindings,observations:'Only declared expected fields; frozen seed expectations are never runtime implementation inputs.',seed:{path:seed,sha256:sha(regular(path.join(o.root,seed)))}}));
return [...outputs].filter(([p])=>INTEGRATION_OUTPUTS.includes(p)).map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>utf8sort(a.path,b.path));
}

// Standalone functions are generated from the existing exact Schema derivatives.
// Ajv compilation is a build step; public runtimes only load these functions.
function standaloneValidators(source,compiled,outputs,o){
const require=createRequire(import.meta.url),Ajv=require('ajv/dist/2020.js'),standalone=require('ajv/dist/standalone/index.js');
const version=require('ajv/package.json').version,meta=JSON.parse(regular(path.join(o.root,'packages/kdna-core/package.json')));
if(version!==meta.dependencies.ajv)fail('TOOL_VERSION','Standalone generation requires the exact Core Ajv dependency');
const options={strict:true,strictTypes:false,strictRequired:false,validateFormats:false,code:{source:true,lines:true}};
const ajv=new Ajv({...options,allErrors:true}),roots={};
for(const [name,file]of [['Manifest','schema/manifest-0.2.schema.json'],['Payload','schema/payload-profile-0.2.schema.json'],['CanonicalIR','specs/canonical-ir.schema.json']]){const schema=JSON.parse(outputs.get(file));ajv.addSchema(schema);roots[name]=schema.$id;}
for(const name of ['ComponentSemanticsCarrier','ComponentAdoptionCarrier','MethodPresenceCarrier','TaxonomyContent','CandidateSetContent','DiscriminatorContent']){const id='https://kdna.dev/public-component/'+name;ajv.addSchema({$id:id,$schema:source.schema_dialect,$ref:'#/$defs/'+name,$defs:compiled});roots[name]=id;}
const handoffAjv=new Ajv(options),handoff=handoffAjv.compile({$schema:'https://json-schema.org/draft/2020-12/schema',$ref:'#/$defs/PackageSetHandoff',$defs:compiled});
const transportAjv=new Ajv({...options,allErrors:false,coerceTypes:false,useDefaults:false,removeAdditional:false}),transport=JSON.parse(outputs.get(TRANSPORT_OUTPUT));transportAjv.addSchema(transport);
const header='// Generated by scripts/public-contract/generate.mjs from the single public semantic source; do not edit.\n';
return new Map([[VALIDATOR_OUTPUTS[0],Buffer.from(header+standalone(ajv,roots)+'\n')],[VALIDATOR_OUTPUTS[1],Buffer.from(header+standalone(handoffAjv,handoff)+'\n')],[VALIDATOR_OUTPUTS[2],Buffer.from(header+standalone(transportAjv,{contextSchema:transport.$id+'#/$defs/ReadTransportContext',remoteSchema:transport.$id+'#/$defs/ReadTransportRemoteResponse'})+'\n')]]);
}

function safeDestination(root,relative){if(!OUTPUTS.includes(relative)&&!INTEGRATION_OUTPUTS.includes(relative)&&!VALIDATOR_OUTPUTS.includes(relative)&&relative!==MANIFEST)fail('PATH','unapproved output');const target=path.join(root,relative);let p=target;while(p!==path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('PATH','symlink output path');if(p===root)break;p=path.dirname(p);}return target;}
function writeAtomic(o,outputs){const root=o['out-dir'],scratch=o['scratch-dir'];if(scratch===root||scratch.startsWith(root+path.sep))fail('PATH','scratch must be outside output tree');const pairs=[...outputs].map(([r,b])=>[safeDestination(root,r),b]);for(const [p]of pairs)if(fs.existsSync(p)&&!fs.lstatSync(p).isFile())fail('PATH','output is not regular file');fs.mkdirSync(scratch,{recursive:true});const stage=fs.mkdtempSync(path.join(scratch,'generation-')),backups=[];let applied=0;try{for(let i=0;i<pairs.length;i++){const [p,b]=pairs[i];const st=path.join(stage,'new-'+i);fs.writeFileSync(st,b,{flag:'wx',mode:0o644});const old=fs.existsSync(p)?fs.readFileSync(p):null;backups.push(old);if(old!==null)fs.writeFileSync(path.join(stage,'old-'+i),old,{flag:'wx'});}for(let i=0;i<pairs.length;i++){const[p]=pairs[i];fs.mkdirSync(path.dirname(p),{recursive:true});if(fs.statSync(path.dirname(p)).dev!==fs.statSync(stage).dev)fail('PATH','atomic rename requires same filesystem');fs.renameSync(path.join(stage,'new-'+i),p);applied++;}}catch(e){for(let i=applied-1;i>=0;i--){const[p]=pairs[i];if(backups[i]===null)fs.unlinkSync(p);else fs.renameSync(path.join(stage,'old-'+i),p);}throw e;}finally{fs.rmSync(stage,{recursive:true,force:true});}}
export function generate(args){const o=parse(args);let raw;try{raw=regular(o.source);}catch(e){fail('SOURCE_MISSING','source unreadable');}let source;try{source=JSON.parse(raw);}catch{fail('SOURCE_PARSE','source is not JSON');}const {outputs,manifest}=build(source,o,raw);if(o.check){const drift=[];for(const[p,b]of outputs){const f=safeDestination(o['out-dir'],p);if(!fs.existsSync(f)){drift.push({path:p,reason:'missing'});continue;}if(!regular(f).equals(b))drift.push({path:p,reason:'bytes_differ'});}if(drift.length)fail('GENERATED_DRIFT',JSON.stringify(drift));return {status:'CHECK_MATCH',derived:manifest.derived,derived_aggregate_sha256:manifest.derived_aggregate_sha256,writes:0};}writeAtomic(o,outputs);return {status:'GENERATED',derived:manifest.derived,derived_aggregate_sha256:manifest.derived_aggregate_sha256,written:[...outputs.keys()]};}
// Entry guard: both sides are compared through realpath so an invocation through a symlinked or
// aliased directory still RUNS the generator instead of exiting 0 having done nothing. An import
// (verify.mjs loads this module) is not the entry point and must not run it; an unresolvable entry
// path refuses to run.
function entryGuardOutcome(){if(!process.argv[1])return 'import';let invoked=null,self=null;try{invoked=fs.realpathSync(process.argv[1]);}catch{invoked=null;}try{self=fs.realpathSync(SELF);}catch{self=null;}if(invoked&&self&&invoked===self)return 'entry';if(path.resolve(process.argv[1])===path.resolve(SELF))return 'unresolved-entry';return 'import';}
const entryGuard=entryGuardOutcome();
if(entryGuard==='unresolved-entry'){console.error('KDNA_PUBLIC_CONTRACT_GENERATE_ENTRY_GUARD_FAILED: refusing to run under an unresolved entry path');process.exit(2);}
if(entryGuard==='entry'){try{console.log(JSON.stringify(generate(process.argv.slice(2))));}catch(e){console.error(JSON.stringify({status:'ERROR',code:e.code??'GENERATION_ERROR',message:e.message}));process.exitCode=1;}}
