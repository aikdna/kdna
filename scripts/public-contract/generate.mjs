#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {registeredCaseIds} from './proof-inventory.mjs';
import {IMPLEMENTED_RULE_IDS} from './cross-entry-check.mjs';
import {selectedContext} from './selected-context.mjs';
import navigation from '../check-current-r2-navigation.cjs';
import {compareOutputs,writeOutputs,UniqueOutputMap} from './generation-writer.mjs';
const SELF=fileURLToPath(import.meta.url), SCRIPT_DIR=path.dirname(SELF);
const BASE_OUTPUTS=['schema/manifest-container-0.5.0-judgment-0.5.1.schema.json','schema/payload-profile-0.5.1.schema.json','specs/canonical-ir-0.6.1.schema.json','specs/read-contract-0.6.4.schema.json','specs/public-diagnostics.json','specs/public-vocabulary.json'];
BASE_OUTPUTS.push('schema/runtime-capsule-0.3.1.schema.json','schema/consumption-plan-0.3.1.schema.json','schema/agent-host-request-0.3.1.schema.json','schema/agent-host-receipt-0.3.1.schema.json','schema/judgment-trace-0.3.1.schema.json');
const TRANSPORT_OUTPUT='specs/read-transport-admission-0.2.1.schema.json';
const PROTECTION_OUTPUTS=['specs/protection-admission-r2-binding-8.schema.json','specs/checksums-document-1.schema.json'];
const OUTPUTS=[...BASE_OUTPUTS,TRANSPORT_OUTPUT,...PROTECTION_OUTPUTS];
const PROTECTED_SOURCE_OUTPUTS=['specs/protected-source-r2-binding-8.schema.json'];
OUTPUTS.push(...PROTECTED_SOURCE_OUTPUTS);
const ISSUER_SCHEMA='specs/external-grant-issuer-r2-binding-8.schema.json';
OUTPUTS.push(ISSUER_SCHEMA);
const MANIFEST='specs/public-generation-manifest.json';
const CORE_VALIDATOR='packages/kdna-core/src/public-contract/validators.generated.js';
const HANDOFF_VALIDATOR='packages/kdna-core/src/public-contract/handoff-validator.generated.js';
const TRANSPORT_VALIDATOR='packages/kdna-read/src/transport-validators.generated.js';
const EXECUTION_VALIDATOR='packages/kdna-core/src/public-contract/execution-validators.generated.js';
const PROTECTION_VALIDATOR='packages/kdna-core/src/public-contract/protection-validators.generated.js';
const ISSUER_VALIDATOR='packages/kdna-core/src/public-contract/issuer-validators.generated.js';
const SOURCE_VALIDATOR='packages/kdna-core/src/public-contract/source-validators.generated.js';
const VALIDATOR_OUTPUTS=[CORE_VALIDATOR,HANDOFF_VALIDATOR,TRANSPORT_VALIDATOR];const INTEGRATION_OUTPUTS=["specs/component-semantics-2.md","packages/kdna-core/src/public-contract/components.d.ts","packages/kdna-read/schema/read-transport-admission-0.2.1.schema.json", "packages/kdna-read/src/transport.d.ts", "packages/kdna-read/src/transport-contract.json", "packages/kdna-core/src/public-contract/types.d.ts", "packages/kdna-core/src/public-contract/generated-contract.json", "packages/kdna-read/src/types.d.ts", "packages/kdna-core/schema/manifest-container-0.5.0-judgment-0.5.1.schema.json", "packages/kdna-core/schema/payload-profile-0.5.1.schema.json", "packages/kdna-core/schema/canonical-ir-0.6.1.schema.json", "packages/kdna-core/schema/public-diagnostics.json", "packages/kdna-core/schema/public-vocabulary.json", "packages/kdna-read/schema/read-contract-0.6.4.schema.json", "conformance/public-contract/adapter-contract.json", "conformance/public-contract/vectors.generated.json", "packages/kdna-core/src/public-contract/node.d.ts", "packages/kdna-core/src/public-contract/browser.d.ts", "packages/kdna-core/src/public-contract/read-boundary.d.ts", "packages/kdna-read/src/index.d.ts", "packages/kdna-read/src/node.d.ts", "packages/kdna-read/src/browser.d.ts", "packages/kdna-read/src/embedding.d.ts", "conformance/public-contract/ir-retention-vectors.generated.json"];
INTEGRATION_OUTPUTS.push('packages/kdna-core/src/public-contract/selected-context.generated.js','packages/kdna-read/src/selected-context.generated.js');
INTEGRATION_OUTPUTS.push('packages/kdna-read/src/installation.generated.json');
INTEGRATION_OUTPUTS.push('specs/static-policy-2.md','packages/kdna-core/src/public-contract/static-policy.d.ts');
INTEGRATION_OUTPUTS.push('packages/kdna-core/src/public-contract/authoring-node.d.ts');
INTEGRATION_OUTPUTS.push('specs/protection-admission.d.ts','packages/kdna-core/schema/checksums-document-1.schema.json','packages/kdna-core/schema/envelope-aead.schema.json','packages/kdna-core/src/public-contract/protection-contract.generated.json');
INTEGRATION_OUTPUTS.push('packages/kdna-core/src/public-contract/protection-node.d.ts','packages/kdna-read/src/protection-node.d.ts','packages/kdna-read/src/protection-node.js');
INTEGRATION_OUTPUTS.push('specs/external-grant-issuer.d.ts','packages/kdna-core/src/public-contract/key-grant-issuer-node.d.ts','packages/kdna-core/src/public-contract/issuer-contract.generated.json');
INTEGRATION_OUTPUTS.push('specs/protected-source.d.ts','packages/kdna-core/src/public-contract/protected-source-node.d.ts','packages/kdna-core/src/public-contract/protected-source-contract.generated.json');
INTEGRATION_OUTPUTS.push('specs/protected-browser.d.ts','packages/kdna-core/src/public-contract/protected-browser.d.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const utf8sort=(a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b));
const ordered=v=>Array.isArray(v)?v.map(ordered):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,ordered(v[k])])):v;
const bytes=v=>Buffer.from(JSON.stringify(ordered(v),null,2)+'\n','utf8');
function fail(code,message){throw Object.assign(new Error(message),{code});}
VALIDATOR_OUTPUTS.push(EXECUTION_VALIDATOR);
VALIDATOR_OUTPUTS.push(PROTECTION_VALIDATOR);
VALIDATOR_OUTPUTS.push(ISSUER_VALIDATOR);
VALIDATOR_OUTPUTS.push(SOURCE_VALIDATOR);
INTEGRATION_OUTPUTS.push('packages/kdna-core/src/public-contract/execution.d.ts','packages/kdna-core/schema/runtime-capsule-0.3.1.schema.json','packages/kdna-core/schema/consumption-plan-0.3.1.schema.json','packages/kdna-core/schema/agent-host-request-0.3.1.schema.json','packages/kdna-core/schema/agent-host-receipt-0.3.1.schema.json','packages/kdna-core/schema/judgment-trace-0.3.1.schema.json');
// The PackageSet node module is the second independent module descriptor, after
// transport_admission. Its outputs are declared once here and every path is
// re-checked against the descriptor in the source, so a subpath cannot exist
// without a matching entry in the single semantic source.
const PACKAGE_SET_NODE_OUTPUTS=Object.freeze({
 schema:'specs/package-set-node-0.2.1.schema.json',
 typescript:'specs/package-set-node.d.ts',
 coreDeclarations:'packages/kdna-core/src/public-contract/package-set-node.d.ts',
 readDeclarations:'packages/kdna-read/src/package-set-node.d.ts',
 coreContract:'packages/kdna-core/src/public-contract/package-set-contract.generated.json',
 readContract:'packages/kdna-read/src/package-set-contract.generated.json',
 validator:'packages/kdna-core/src/public-contract/package-set-validators.generated.js'});
VALIDATOR_OUTPUTS.push(PACKAGE_SET_NODE_OUTPUTS.validator);
INTEGRATION_OUTPUTS.push(PACKAGE_SET_NODE_OUTPUTS.schema,PACKAGE_SET_NODE_OUTPUTS.typescript,PACKAGE_SET_NODE_OUTPUTS.coreDeclarations,PACKAGE_SET_NODE_OUTPUTS.readDeclarations,PACKAGE_SET_NODE_OUTPUTS.coreContract,PACKAGE_SET_NODE_OUTPUTS.readContract);
export const BASE_OUTPUT_PATHS=Object.freeze([...new Set([...OUTPUTS,...INTEGRATION_OUTPUTS,...VALIDATOR_OUTPUTS,MANIFEST])]);
function parse(argv){const o={check:false};for(let i=0;i<argv.length;i++){const a=argv[i];if(a==='--check'){if(o.check)fail('ARGUMENT','duplicate --check');o.check=true;continue;}if(!['--source','--root','--out-dir','--scratch-dir','--dependency-root'].includes(a))fail('ARGUMENT','unknown argument '+a);const key=a.slice(2);if(o[key]!==undefined||!argv[i+1]||argv[i+1].startsWith('--'))fail('ARGUMENT','missing or duplicate '+a);o[key]=path.resolve(argv[++i]);}for(const k of ['source','root','out-dir'])if(!o[k])fail('ARGUMENT','required --'+k);if(!o.check&&!o['scratch-dir'])fail('ARGUMENT','generation requires --scratch-dir');return o;}
function regular(p){const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink())fail('PATH','expected regular nonsymlink file');return fs.readFileSync(p);}
function pointer(v,p){if(p==='')return v;if(!p.startsWith('/'))fail('SOURCE','invalid source pointer');for(const raw of p.slice(1).split('/')){const k=raw.replaceAll('~1','/').replaceAll('~0','~');if(v===null||typeof v!=='object'||!Object.hasOwn(v,k))fail('SOURCE','missing pointer '+p);v=v[k];}return v;}
const schemaKeys=new Set(['$ref','$value','$opaque','type','properties','required','additionalProperties','items','minItems','maxItems','uniqueItems','minProperties','maxProperties','minLength','maxLength','pattern','minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf','const','enum','oneOf','anyOf','allOf','if','then','else','not','title','description','format','prefixItems']);
function validateNode(s,types,where){if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).length===0)fail('SOURCE','empty/untyped schema node '+where);for(const k of Object.keys(s))if(!schemaKeys.has(k))fail('SOURCE','unknown schema keyword '+k);if(!Object.keys(s).some(k=>!['title','description'].includes(k)))fail('SOURCE','annotation-only unconstrained node '+where);if(s.$opaque!==undefined){if(s.$opaque!==true||Object.keys(s).length!==1)fail('SOURCE','invalid opaque node');return;}if(s.$value!==undefined){if(typeof s.$value!=='string'||Object.keys(s).length!==1)fail('SOURCE','invalid binding node');return;}if(s.$ref!==undefined){if(!/^#\/\$defs\/[A-Za-z][A-Za-z0-9_]*$/.test(s.$ref)||!Object.hasOwn(types,s.$ref.slice(8)))fail('SOURCE','unresolved or nonlocal reference '+s.$ref);}
if(s.type==='object'){if(s.additionalProperties!==false||!s.properties||Object.keys(s.properties).length===0)fail('SOURCE','object must declare closed properties '+where);if(!Array.isArray(s.required)||s.required.some(k=>!Object.hasOwn(s.properties,k)))fail('SOURCE','invalid required list '+where);}
if(s.type==='array'&&!s.items&&!(s.items===false&&Array.isArray(s.prefixItems)))fail('SOURCE','array items absent '+where);
if(s.properties){for(const [k,v]of Object.entries(s.properties))validateNode(v,types,where+'.'+k);}
for(const k of ['items','if','then','else','not'])if(s[k])validateNode(s[k],types,where+'.'+k);
for(const k of ['oneOf','anyOf','allOf','prefixItems'])if(s[k]){if(!Array.isArray(s[k])||s[k].length===0)fail('SOURCE','empty union');for(const v of s[k])validateNode(v,types,where+'.'+k);}
}
function compileNode(v,source){if(Array.isArray(v))return v.map(x=>compileNode(x,source));if(v&&typeof v==='object'){if(v.$opaque===true)return false;if(v.$value!==undefined){const x=pointer(source,v.$value);if(!['string','number','boolean'].includes(typeof x)&&x!==null)fail('SOURCE','binding must resolve scalar');return {const:x,type:x===null?'null':typeof x==='number'?(Number.isInteger(x)?'integer':'number'):typeof x};}return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,compileNode(x,source)]));}return v;}
function references(v,result=new Set()){if(v&&typeof v==='object'){if(typeof v.$ref==='string')result.add(v.$ref.slice(8));for(const x of Object.values(v))references(x,result);}return result;}
function closure(names,types){const seen=new Set(),queue=[...names];while(queue.length){const n=queue.shift();if(seen.has(n))continue;if(!Object.hasOwn(types,n))fail('SOURCE','root/export missing '+n);seen.add(n);queue.push(...references(types[n]));}return Object.fromEntries([...seen].sort().map(n=>[n,types[n]]));}
export function buildOutputs(source,o,sourceBytes){navigation.validateSchemaNavigation(source);navigation.validateSourceMap(source,JSON.parse(regular(path.join(o.root,'specs/public-source-map.json'))));navigation.validateCurrentTarget(source,JSON.parse(regular(path.join(o.root,'specs/public-contract-decisions.json'))));if(source.schema_dialect!=='https://json-schema.org/draft/2020-12/schema')fail('SOURCE','JSON Schema 2020-12 required');if(source.format!=='kdna.public-semantic-source/1')fail('SOURCE','unsupported source format');if(!source.types||typeof source.types!=='object'||Array.isArray(source.types))fail('SOURCE','types required');if(!Array.isArray(source.artifacts)||source.artifacts.length!==BASE_OUTPUTS.length||JSON.stringify(source.artifacts.map(x=>x.path).sort())!==JSON.stringify([...BASE_OUTPUTS].sort()))fail('SOURCE','unexpected artifact set');
if(!source.diagnostic_registry||!source.diagnostic_scopes||source.diagnostic_registry.some(c=>typeof source.diagnostic_scopes[c]!=='string'))fail('SOURCE','diagnostic scope coverage missing');const designRows=[];for(const a of source.accepted_designs??[]){if(typeof a.path!=='string'||a.path.startsWith('/')||a.path.split('/').some(x=>x==='..'||x===''))fail('SOURCE','unsafe design path');const b=regular(path.join(o.root,a.path));if(b.length!==a.bytes||sha(b)!==a.sha256)fail('DESIGN_DRIFT',a.path);designRows.push({path:a.path,bytes:b.length,sha256:sha(b)});}if(designRows.length!==7||new Set(designRows.map(x=>x.path)).size!==7||!designRows.some(x=>x.path==='specs/execution-contract-0.3.md'))fail('SOURCE','seven distinct accepted inputs including native execution contract required');
if(!Array.isArray(source.design_bindings)||source.design_bindings.length===0)fail('SOURCE','accepted design bindings required');for(const b of source.design_bindings){if(!designRows.some(x=>x.path===b.design))fail('SOURCE','binding outside accepted inputs');const d=JSON.parse(regular(path.join(o.root,b.design)));let actual=pointer(source,b.source_pointer);if(b.source_transform==='resolved_const')actual=compileNode(actual,source).const;else if(b.source_transform==='resolved_const_record')actual=Object.fromEntries(Object.entries(compileNode(actual,source)).map(([k,v])=>[k,v.const]));else if(b.source_transform!==undefined)fail('SOURCE','unknown binding transform');if(JSON.stringify(ordered(pointer(d,b.design_pointer)))!==JSON.stringify(ordered(actual)))fail('SOURCE_CONFLICT','accepted binding differs: '+b.source_pointer);}
for(const [n,s]of Object.entries(source.types)){if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(n))fail('SOURCE','unsafe type name');validateNode(s,source.types,n);}// `enforcement` says only whether THIS generator machine-checks a rule. The per-rule
// runtime truth is DERIVED, not asserted. engineering.rule_coverage is the
// declarative table of facts: which closed-list machine checker covers a rule, which
// runtime units implement it, which clauses stay uncovered, and which gate/case
// observed it. The generator computes both verdicts from that table and rejects any
// engineering.runtime_enforcement_claims value that disagrees, so a hand-edited
// verdict cannot survive generation. Guards that make the table's facts checkable
// rather than assertion-shaped:
//   * machine_checkers must be ids of the closed machine-checked list;
//   * runtime_units must be `path[:lines]` of existing SOURCE files, and every line
//     must be inside that file's real line count;
//   * proof entries must name a known gate and case ids that exist in that gate;
//   * runtime_not_implemented must be exactly the rules with no runtime unit, so no
//     rule can be silently unenforced;
//   * generator_machine_check 'full' implies runtime_enforcement 'full'.
// What no machine here can prove is the COMPLETENESS of runtime_uncovered /
// generator_uncovered: a claim about what code does not do cannot be derived from
// code existence. That residue is named as a human judgement in PUB08 and in the
// implementation report, never presented as a machine guarantee.
const KNOWN_GATES=Object.freeze({
 'runtime-obligations':{file:'conformance/public-contract/test/runtime-obligations.cjs',kind:'js',callee:'check'},
 'decision-vectors':{file:'conformance/public-contract-decision-vectors.json',kind:'json',record_property:'vectors'},
 'catalog-only-runtime':{file:'conformance/public-contract/test/catalog-only-runtime.cjs',kind:'js',callee:'record'},
 'package-surfaces':{file:'conformance/public-contract/test/package-surfaces.cjs',kind:'js',callee:'check'},
 'grammar-1-cases':{file:'conformance/public-contract/grammar-1-core-cases.json',kind:'json'},
 'ir-retention-vectors':{file:'conformance/public-contract/ir-retention-vectors.generated.json',kind:'json'},
 'kdna-core-suite':{file:'packages/kdna-core/test',kind:'dir'},
 'kdna-read-suite':{file:'packages/kdna-read/test',kind:'dir'},
 'issuer-definition':{file:'scripts/public-contract/grant-issuer-definition.test.mjs',kind:'js',callee:'test'},
 'protection-definition':{file:'scripts/public-contract/protection-definition.test.mjs',kind:'js',callee:'test'},
});
const gateCache=new Map();
function gateCases(name,root){if(gateCache.has(name))return gateCache.get(name);const gate=KNOWN_GATES[name];
if(!gate)fail('SOURCE','unknown gate '+name);
let ids;
if(gate.kind==='json'){const parsed=JSON.parse(fs.readFileSync(path.join(root,gate.file),'utf8'));const records=gate.record_property?parsed[gate.record_property]:(Array.isArray(parsed)?parsed:parsed.cases??[]);if(!Array.isArray(records))fail('SOURCE','proof gate records must be an array: '+name);ids=records.map(c=>c.id);}
else if(gate.kind==='dir')ids=fs.readdirSync(path.join(root,gate.file)).filter(f=>f.endsWith('.test.js'));
else ids=registeredCaseIds(fs.readFileSync(path.join(root,gate.file),'utf8'),gate.callee,gate.file,o['dependency-root']);
const set=new Set(ids);gateCache.set(name,set);return set;}
const SOURCE_SITE_EXTENSIONS=Object.freeze(['.js','.mjs','.cjs','.ts','.json']);
function sourceFileLines(rel,root,rule){if(typeof rel!=='string'||!rel)fail('SOURCE','implementation site must be a string for '+rule);
if(path.isAbsolute(rel)||rel.split('/').some(x=>x===''||x==='.'||x==='..'))fail('SOURCE','unsafe implementation site path for '+rule+': '+rel);
if(!SOURCE_SITE_EXTENSIONS.some(ext=>rel.endsWith(ext)))fail('SOURCE','implementation site is not a source file for '+rule+': '+rel);
const abs=path.join(root,rel);if(!fs.existsSync(abs)||!fs.statSync(abs).isFile())fail('SOURCE','implementation site is not a file for '+rule+': '+rel);
return fs.readFileSync(abs,'utf8').split('\n').length;}
function checkSite(site,root,rule){const cut=typeof site==='string'?site.indexOf(':'):-1;if(cut<=0)fail('SOURCE','malformed implementation site for '+rule);
const rel=site.slice(0,cut),lines=sourceFileLines(rel,root,rule),spec=site.slice(cut+1);
if(!spec)fail('SOURCE','implementation site needs a line range for '+rule+': '+rel);
for(const item of spec.split(',')){const m=/^(\d+)(?:-(\d+))?$/.exec(item.trim());if(!m)fail('SOURCE','malformed line range '+item+' for '+rule+' in '+rel);
const from=Number(m[1]),to=m[2]===undefined?from:Number(m[2]);
if(from<1||to<from||to>lines)fail('SOURCE','line range outside '+rel+' for '+rule+': '+item+' (file has '+lines+' lines)');}}
// Each contract owns a complete registration table; neither is a partial base view.
const ruleScopes=[{name:'base',rules:source.non_schema_rules,engineering:source.engineering,types:source.types}];
const protection=source.protection_admission;
if(!protection||protection.id!=='kdna.protection-admission/1'||protection.version!=='1.0.0')fail('SOURCE','unexpected protection definition coordinate');
ruleScopes.push({name:protection.id,rules:protection.non_schema_rules,engineering:protection,types:{...source.types,...protection.types}});
const issuer=source.external_grant_issuer;
if(!issuer||issuer.id!=='kdna.external-grant-issuer/1'||issuer.version!=='1.0.0')fail('SOURCE','unexpected issuer definition coordinate');
ruleScopes.push({name:issuer.id,rules:issuer.non_schema_rules,engineering:issuer,types:{...source.types,...issuer.types}});
const allRuleIds=new Set();
for(const scope of ruleScopes){
 if(!Array.isArray(scope.rules)||!scope.rules.length)fail('SOURCE','non-schema obligations missing: '+scope.name);
 for(const r of scope.rules){
  if(!r||typeof r.id!=='string'||!r.id||!r.requirement||!r.future_owner||!r.future_boundary||!Array.isArray(r.applies_to)||!r.applies_to.length||r.applies_to.some(x=>!Object.hasOwn(scope.types,x)))fail('SOURCE','invalid non-schema mapping: '+scope.name);
  if(allRuleIds.has(r.id))fail('SOURCE','duplicate non-schema rule across contract scopes: '+r.id);
  allRuleIds.add(r.id);
  if(r.enforcement!=='NOT_IMPLEMENTED_NON_SCHEMA'&&r.enforcement!=='IMPLEMENTED_CROSS_ENTRY_CHECK')fail('SOURCE','invalid non-schema mapping');
  if(r.enforcement==='IMPLEMENTED_CROSS_ENTRY_CHECK'&&!IMPLEMENTED_RULE_IDS.includes(r.id))fail('SOURCE','rule claims implemented but is not in IMPLEMENTED_RULE_IDS');
 }
}
if(!protection.rules||JSON.stringify(Object.keys(protection.rules).sort())!==JSON.stringify(protection.non_schema_rules.map(r=>r.id).sort()))fail('SOURCE','protection rules must exactly reference module non-schema obligations');
for(const r of protection.non_schema_rules)if(protection.rules[r.id]!==r.requirement)fail('SOURCE','protection rule requirement/reference mismatch: '+r.id);
if(!issuer.rules||JSON.stringify(Object.keys(issuer.rules).sort())!==JSON.stringify(issuer.non_schema_rules.map(r=>r.id).sort()))fail('SOURCE','issuer rules must exactly reference module obligations');
for(const r of issuer.non_schema_rules)if(issuer.rules[r.id]!==r.requirement)fail('SOURCE','issuer rule requirement/reference mismatch');
function deriveEnforcement(scope){
const runtimeEnforcement={};
if(!scope.engineering||!scope.engineering.rule_coverage||typeof scope.engineering.rule_coverage!=='object'||Array.isArray(scope.engineering.rule_coverage))fail('SOURCE','engineering.rule_coverage table required');
{const coverage=scope.engineering.rule_coverage,ruleIds=scope.rules.map(r=>r.id);
if(JSON.stringify(Object.keys(coverage).sort())!==JSON.stringify([...ruleIds].sort()))fail('SOURCE','rule_coverage must cover exactly the non-schema rule ids');
const notImplemented=scope.engineering.runtime_not_implemented;
if(!Array.isArray(notImplemented)||new Set(notImplemented).size!==notImplemented.length||notImplemented.some(id=>!ruleIds.includes(id)))fail('SOURCE','engineering.runtime_not_implemented must be an array of non-schema rule ids');
const claims=scope.engineering.runtime_enforcement_claims;
if(!claims||typeof claims!=='object'||Array.isArray(claims))fail('SOURCE','engineering.runtime_enforcement_claims required');
if(JSON.stringify(Object.keys(claims).sort())!==JSON.stringify([...ruleIds].sort()))fail('SOURCE','runtime_enforcement_claims must cover exactly the non-schema rule ids');

for(const r of scope.rules){const e=coverage[r.id];
if(!e||typeof e!=='object'||Array.isArray(e))fail('SOURCE','rule_coverage entry missing for '+r.id);
for(const key of ['machine_checkers','generator_uncovered','runtime_units','runtime_uncovered'])if(!Array.isArray(e[key]))fail('SOURCE','rule_coverage '+key+' must be an array for '+r.id);
if(!Array.isArray(e.proof)||e.proof.length===0)fail('SOURCE','rule_coverage needs proof for '+r.id);
for(const id of e.machine_checkers)if(!IMPLEMENTED_RULE_IDS.includes(id))fail('SOURCE','machine checker is not in the closed machine-checked id list for '+r.id+': '+id);
const genLevel=e.machine_checkers.includes(r.id)?'full':(e.machine_checkers.length?'partial':'none');
const runLevel=notImplemented.includes(r.id)?'none':(e.runtime_uncovered.length?'partial':'full');
if(genLevel==='partial'&&e.generator_uncovered.length===0)fail('SOURCE','rule_coverage must name the uncovered part of '+r.id+' generator_machine_check');
if(genLevel!=='partial'&&e.generator_uncovered.length!==0)fail('SOURCE','rule_coverage generator_uncovered must be empty when '+r.id+' generator_machine_check is '+genLevel);
if(runLevel==='partial'&&e.runtime_uncovered.length===0)fail('SOURCE','rule_coverage must name the uncovered part of '+r.id+' runtime_enforcement');
if(runLevel!=='partial'&&e.runtime_uncovered.length!==0)fail('SOURCE','rule_coverage runtime_uncovered must be empty when '+r.id+' runtime_enforcement is '+runLevel);
if(notImplemented.includes(r.id)&&e.runtime_units.length!==0)fail('SOURCE','rule_coverage runtime_units must be empty for a runtime_not_implemented rule: '+r.id);
if(!notImplemented.includes(r.id)&&e.runtime_units.length===0)fail('SOURCE','rule_coverage needs a runtime unit or a runtime_not_implemented entry for '+r.id);
if(genLevel==='full'&&runLevel!=='full')fail('SOURCE','a machine-checked rule must be runtime-enforced in full: '+r.id);
for(const site of e.runtime_units)checkSite(site,o.root,r.id);
for(const entry of e.proof){if(!entry||typeof entry.gate!=='string'||!Array.isArray(entry.cases)||entry.cases.length===0)fail('SOURCE','invalid proof entry for '+r.id);
const known=gateCases(entry.gate,o.root);for(const c of entry.cases)if(!known.has(c))fail('SOURCE','proof case does not exist in gate '+entry.gate+' for '+r.id+': '+c);}
const c=claims[r.id];
if(!c||c.generator_machine_check!==genLevel||c.runtime_enforcement!==runLevel)fail('SOURCE','runtime_enforcement_claims disagree with the derived coverage for '+r.id+': claim '+JSON.stringify(c??null)+' derived '+JSON.stringify({generator_machine_check:genLevel,runtime_enforcement:runLevel}));
runtimeEnforcement[r.id]={generator_machine_check:genLevel,generator_machine_check_gap:genLevel==='partial'?e.generator_uncovered.join(' '):null,runtime_enforcement:runLevel,runtime_enforcement_gap:runLevel==='partial'?e.runtime_uncovered.join(' '):null,implementation_sites:e.runtime_units,proof:e.proof,...(e.proof_scope?{proof_scope:e.proof_scope}:{})};}}
return runtimeEnforcement;
}
const runtimeEnforcement=deriveEnforcement(ruleScopes[0]);
const protectionRuntimeEnforcement=deriveEnforcement(ruleScopes[1]);
const historicalRows=(source.historical_artifacts??[]).map(pin=>{if(typeof pin.path!=='string'||path.isAbsolute(pin.path)||pin.path.split('/').some(p=>p==='..'||p===''))fail('SOURCE','unsafe historical artifact path');if(OUTPUTS.includes(pin.path)||INTEGRATION_OUTPUTS.includes(pin.path)||VALIDATOR_OUTPUTS.includes(pin.path))fail('SOURCE','historical artifact is an active output: '+pin.path);const content=regular(path.join(o.root,pin.path));if(content.length!==pin.bytes||sha(content)!==pin.sha256)fail('HISTORICAL_DRIFT',pin.path);return pin;});
const compiled=compileNode(source.types,source),outputs=new UniqueOutputMap();for(const a of source.artifacts){if(a.root){const defs=closure([...new Set([a.root,...a.exports])],compiled);outputs.set(a.path,bytes({$schema:source.schema_dialect,$id:a.id,title:a.root,description:'Generated from the single public semantic source. Structural validity is not trusted admission or runtime authorization.',$ref:'#/$defs/'+a.root,$defs:defs}));}else if(a.kind==='diagnostics'){outputs.set(a.path,bytes({format:'kdna.public-diagnostics/1',status:source.status,entries:source.diagnostic_registry.map(code=>({code,scope:source.diagnostic_scopes[code],...(source.diagnostic_definitions?.[code]??{})})),non_schema_obligations:source.non_schema_rules.map(r=>({id:r.id,owner:r.future_owner,boundary:r.future_boundary,enforcement:r.enforcement,generator_machine_check:runtimeEnforcement[r.id].generator_machine_check,generator_machine_check_gap:runtimeEnforcement[r.id].generator_machine_check_gap,runtime_enforcement:runtimeEnforcement[r.id].runtime_enforcement,runtime_enforcement_gap:runtimeEnforcement[r.id].runtime_enforcement_gap,implementation_sites:runtimeEnforcement[r.id].implementation_sites,proof:runtimeEnforcement[r.id].proof,...(runtimeEnforcement[r.id].proof_scope?{proof_scope:runtimeEnforcement[r.id].proof_scope}:{})}))}));}else if(a.kind==='vocabulary'){const entries=[];function walk(s,loc){if(s&&typeof s==='object'){if(s.enum)entries.push({definition:loc,kind:'enum',values:s.enum});if(Object.hasOwn(s,'const'))entries.push({definition:loc,kind:'literal',values:[s.const]});for(const [k,v]of Object.entries(s))walk(v,loc+'/'+k);}}for(const [n,s]of Object.entries(compiled))walk(s,n);outputs.set(a.path,bytes({format:'kdna.public-vocabulary/1',status:source.status,version_tuple:source.versionTuple,entries}));}else fail('SOURCE','unknown derivative kind');}
const transport=source.transport_admission;
if(!transport)fail('SOURCE','Current public Read requires the transport module');
if(transport){
if(transport.schema_path!==TRANSPORT_OUTPUT||transport.contract!=='kdna.read-transport-admission/0.2.1'||transport.package_version!==eVersion(source)||transport.function!=='admitReadTransportResponse')fail('SOURCE','unexpected transport coordinate');
for(const name of Object.keys(transport.types))if(Object.hasOwn(source.types,name))fail('SOURCE','transport cannot override base semantic types');
const combined={...source.types,...transport.types};
for(const [name,node]of Object.entries(transport.types)){if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(name))fail('SOURCE','unsafe transport type');validateNode(node,combined,name);}
const defs=closure([transport.root,...transport.exports],compileNode(combined,source));
outputs.set(TRANSPORT_OUTPUT,bytes({$schema:source.schema_dialect,$id:transport.schema_id,title:transport.root,description:'Remote response admission only. No local authority or Core semantic revalidation.',$ref:'#/$defs/'+transport.root,$defs:defs}));
}
const psn=source.package_set_node;
if(!psn)fail('SOURCE','Current public PackageSet node surface requires its module descriptor');
if(psn.contract!=='kdna.package-set-node/0.2.1'||psn.module_version!=='0.2.1')fail('SOURCE','unexpected package-set-node coordinate');
if(psn.core_public_subpath!=='@aikdna/kdna-core/package-set-node'||psn.read_public_subpath!=='@aikdna/kdna-read/package-set-node')fail('SOURCE','unexpected package-set-node subpath');
if(psn.schema_path!==PACKAGE_SET_NODE_OUTPUTS.schema||psn.schema_id!=='urn:kdna:schema:package-set-node:0.2.1'||psn.root!=='PackageSetNodeSurface')fail('SOURCE','unexpected package-set-node schema coordinate');
for(const [key,value] of Object.entries({core_declarations_path:PACKAGE_SET_NODE_OUTPUTS.coreDeclarations,read_declarations_path:PACKAGE_SET_NODE_OUTPUTS.readDeclarations,core_contract_path:PACKAGE_SET_NODE_OUTPUTS.coreContract,read_contract_path:PACKAGE_SET_NODE_OUTPUTS.readContract,validator_path:PACKAGE_SET_NODE_OUTPUTS.validator,typescript_path:PACKAGE_SET_NODE_OUTPUTS.typescript,schema_path:PACKAGE_SET_NODE_OUTPUTS.schema}))if(psn[key]!==value)fail('SOURCE','package-set-node output path disagrees with the generator: '+key);
// Both callable lists are declared twice on purpose: in the module descriptor and
// in the engineering surface table the public-surface gates read. They must agree.
if(!Array.isArray(psn.core_callables)||psn.core_callables.length!==7||!Array.isArray(psn.read_callables)||psn.read_callables.length!==5)fail('SOURCE','package-set-node callable counts');
if(!Array.isArray(psn.local_failures)||psn.local_failures.length!==12||new Set(psn.local_failures).size!==12)fail('SOURCE','package-set-node local failure list');
for(const [surface,list] of [['core_surface',psn.core_callables],['read_surface',psn.read_callables]]){
 const declared=source.engineering[surface]?.['package-set-node'];
 if(!Array.isArray(declared)||JSON.stringify([...declared])!==JSON.stringify([...list]))fail('SOURCE','engineering.'+surface+' must declare the package-set-node callables verbatim');}
for(const name of Object.keys(psn.types))if(Object.hasOwn(source.types,name))fail('SOURCE','package-set-node type shadows a base type: '+name);
const psCombined={...source.types,...psn.types};
for(const [name,node] of Object.entries(psn.types)){if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(name))fail('SOURCE','unsafe package-set-node type');validateNode(node,psCombined,name);}
// Non-JSON module records (raw bytes, opaque brands, callbacks) cannot be schema
// types, so they are declared as closed key sets. The capture layers read these at
// runtime, which is why a key list cannot drift from the single source.
if(!psn.input_records||typeof psn.input_records!=='object'||Array.isArray(psn.input_records))fail('SOURCE','package-set-node input records required');
for(const [name,entry] of Object.entries(psn.input_records)){
 if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(name))fail('SOURCE','unsafe package-set-node input record name');
 if(Object.hasOwn(source.types,name)||Object.hasOwn(psn.types,name))fail('SOURCE','package-set-node input record shadows a type: '+name);
 if(!entry||typeof entry!=='object'||Array.isArray(entry))fail('SOURCE','invalid package-set-node input record '+name);
 if(!Array.isArray(entry.keys)||entry.keys.some(k=>typeof k!=='string'||k==='')||new Set(entry.keys).size!==entry.keys.length)fail('SOURCE','invalid key list for '+name);
 if(!Array.isArray(entry.required)||entry.required.some(k=>!entry.keys.includes(k)))fail('SOURCE','invalid required list for '+name);}
protectionDefinitions(source,outputs,o,protectionRuntimeEnforcement);
browserDefinitions(source,outputs);
protectedSourceDefinitions(source,outputs,o);
issuerDefinitions(source,outputs,deriveEnforcement(ruleScopes[2]));
const artifactRows=[...outputs].filter(([p])=>OUTPUTS.includes(p)).map(([p,b])=>({path:p,bytes:b.length,sha256:sha(b)})).sort((a,b)=>utf8sort(a.path,b.path));const scriptRows=['generate.mjs','verify.mjs','proof-inventory.mjs','cross-entry-check.mjs','selected-context.mjs','generation-writer.mjs'].map(n=>{const b=regular(path.join(SCRIPT_DIR,n));return {path:'scripts/public-contract/'+n,bytes:b.length,sha256:sha(b)};});
const integrationRows=integration(source,compiled,o,outputs);
for(const [file,content]of standaloneValidators(source,compiled,outputs,o)){outputs.set(file,content);integrationRows.push({path:file,bytes:content.length,sha256:sha(content)});}
integrationRows.sort((a,b)=>utf8sort(a.path,b.path));
// `tools` deliberately records only the declared validator pin. The producing
// Node version must NOT be written into a hashed artifact: it made --check
// unreproducible on any other Node, which is fatal for independent acceptance.
const manifest={integration:integrationRows,format:'kdna.public-generation-manifest/1',status:'UNPUBLISHED_GENERATED_STRUCTURE',source:{path:'specs/public-semantic-source.json',bytes:sourceBytes.length,sha256:sha(sourceBytes)},historical_artifacts:historicalRows,scripts:scriptRows,derived:artifactRows,accepted_designs:designRows,algorithm:{file_encoding:'recursive object keys sorted by JavaScript string sort; arrays preserve source order; JSON.stringify 2 spaces; UTF-8; one LF',aggregate:'derived rows sorted by unsigned UTF-8 path; row keys path,bytes,sha256; compact JSON.stringify UTF-8; no LF; SHA-256'},derived_aggregate_sha256:sha(JSON.stringify(artifactRows)),tools:{declared_validator:source.tooling},excluded:[MANIFEST,'docs/audits/2026-09-06-open-wave1-machine-source-implementation.json','docs/audits/2026-09-06-open-wave1-machine-source-independent-acceptance.md'],proof_limits:source.proof_limits};outputs.set(MANIFEST,bytes(manifest));return {outputs,manifest};}
function assertSchemaBinding(module,source){const expected={version_tuple:source.versionTuple,package_versions:{'@aikdna/kdna-core':source.engineering.package_versions.core,'@aikdna/kdna-read':source.engineering.package_versions.read}};if(JSON.stringify(ordered(module.schema_binding))!==JSON.stringify(ordered(expected)))fail('SOURCE','dependent schema binding disagrees with active tuple/packages');}
// The independent protection module owns its runtime types and exact Node surfaces.
function protectionDefinitions(source,outputs,o,runtimeEnforcement){
 const p=source.protection_admission;
 if(!p||p.id!=='kdna.protection-admission/1'||p.version!=='1.0.0'||p.status!=='B1_IMPLEMENTATION_CANDIDATE_NOT_ACCEPTED'||JSON.stringify(p.runtime_exports)!==JSON.stringify(['Core/protection-node:getProtectionContract','Core/protection-node:admitProtectedNode','Core/protection-node:bindProtectionOperation','Core/protection-node:disposeProtectionOperation','Core/protection-node:protectSourceBytes','Core/read-boundary:isProtectedSnapshot','Read/protection-node:createTrustedProtectedHostReadProvider','Read/protection-node:readProtectedNode','Read/protection-node:commitProtectedTransport'])||p.schema_path!=='specs/protection-admission-r2-binding-8.schema.json'||p.schema_id!=='urn:kdna:schema:protection-admission:1.0.0:binding:r2:8'||p.root!=='ProtectionDefinitionObservation')fail('SOURCE','unexpected protection definition coordinate or capability');
 if(p.checksums?.id!=='kdna.checksums.document/1'||p.checksums.version!=='1.0.0'||p.checksums.schema_path!=='specs/checksums-document-1.schema.json'||p.checksums.root!=='ChecksumsDocument1')fail('SOURCE','unexpected checksums definition coordinate');
 assertSchemaBinding(p,source);
 const combined={...source.types,...p.types};
 for(const [name,node]of Object.entries(p.types)){
  if(Object.hasOwn(source.types,name)||!/^(?:Protection|Protected|Checksums)[A-Za-z0-9_]*$/.test(name))fail('SOURCE','protection type collision or name');
  validateNode(node,combined,name);
 }
 const compiled=compileNode(combined,source);
 for(const [file,id,root,exports]of [
  [p.schema_path,p.schema_id,p.root,Object.keys(p.types)],
  [p.checksums.schema_path,'urn:kdna:checksums-document:1.0.0',p.checksums.root,[]]
 ]){
  if(!PROTECTION_OUTPUTS.includes(file))fail('SOURCE','unapproved protection schema');
  outputs.set(file,bytes({$schema:source.schema_dialect,$id:id,title:root,description:'Protection observation structure. Opaque authorities have no JSON representation. Observation validation never proves authentication or runtime acceptance.',$ref:'#/$defs/'+root,$defs:closure([root,...exports],compiled)}));
 }
 for(const pin of [...p.legacy_inputs,p.specification]){
  if(typeof pin.path!=='string'||path.isAbsolute(pin.path)||pin.path.split('/').some(x=>x===''||x==='.'||x==='..'))fail('SOURCE','unsafe protection input path');
  const b=regular(path.join(o.root,pin.path));if(b.length!==pin.bytes||sha(b)!==pin.sha256)fail('PROTECTION_LEGACY_DRIFT',pin.path);
 }
 outputs.set('packages/kdna-core/schema/checksums-document-1.schema.json',outputs.get(p.checksums.schema_path));
 outputs.set('packages/kdna-core/schema/envelope-aead.schema.json',regular(path.join(o.root,'specs/envelope-aead.schema.json')));
 const baseRefs=[...references(p.types)].filter(n=>Object.hasOwn(source.types,n)).sort();
 const lines=['// Generated protection definitions; schema validity is not authority.',"import type { "+baseRefs.join(', ')+" } from '../packages/kdna-core/src/public-contract/types.js';"];
 for(const [name,node]of Object.entries(p.types)){
  if(node.$opaque)lines.push('declare const '+name+'Brand: unique symbol;','export type '+name+' = { readonly ['+name+'Brand]: true }'+(p.capability_shapes?.[name]?' & '+p.capability_shapes[name]:'')+';');
  else lines.push('export type '+name+' = '+typeExpression(node,source)+';');
 }
 if(typeof p.api_typescript!=='string'||typeof p.read_api_typescript!=='string')fail('SOURCE','protection API declarations required');
 lines.push(p.api_typescript);
 outputs.set('specs/protection-admission.d.ts',Buffer.from(lines.join('\n')+'\n'));
 const coreLines=[...lines];coreLines[1]="import type { "+baseRefs.join(', ')+" } from './types.js';";
 outputs.set('packages/kdna-core/src/public-contract/protection-node.d.ts',Buffer.from(coreLines.join('\n')+'\n'));
 outputs.set('packages/kdna-read/src/protection-node.d.ts',Buffer.from('// Generated protection Read facade.\n'+p.read_api_typescript));
 const expected={contract:{id:p.id,version:p.version,definition_digest:'sha256:'+sha(JSON.stringify(ordered(p)))},implementation:{package:'@aikdna/kdna-core',version:source.engineering.package_versions.core},profiles:['kdna.envelope.aead/0.1.0','kdna.envelope.external-grant/0.1.0','kdna.checksums.document/1@1.0.0','kdsig.ed25519/0.1.0'],kdfs:['scrypt-sha256','argon2id'],capabilities:['protected_admission','protected_operation','protected_production']};
 const readFile='packages/kdna-read/src/protection-node.js',readCode=regular(path.join(o.root,readFile)).toString('utf8');
 if((readCode.match(/const EXPECTED_PROTECTION = .*; \/\/ @protection-expectation/g)??[]).length!==1)fail('SOURCE','Read independent protection expectation marker missing or duplicate');
 if((readCode.match(/const EXPECTED_READ_VERSION = .*; \/\/ @protection-read-version/g)??[]).length!==1)fail('SOURCE','Read independent package version marker missing or duplicate');
 outputs.set(readFile,Buffer.from(readCode
  .replace(/const EXPECTED_PROTECTION = .*; \/\/ @protection-expectation/,'const EXPECTED_PROTECTION = '+JSON.stringify(ordered(expected))+'; // @protection-expectation')
  .replace(/const EXPECTED_READ_VERSION = .*; \/\/ @protection-read-version/,'const EXPECTED_READ_VERSION = '+JSON.stringify(source.engineering.package_versions.read)+'; // @protection-read-version')));
 outputs.set('packages/kdna-core/src/public-contract/protection-contract.generated.json',bytes({...p,types:compileNode(p.types,source),derived_runtime_enforcement:runtimeEnforcement,definition_digest:'sha256:'+sha(JSON.stringify(ordered(p)))}));
}
// The browser protected entry (case A) is an independent admission-only surface: the host
// supplies the container bytes, the payload plaintext and the unlock observation, and the
// shell never decrypts. Its declarations are owned by the same unique source.
function browserDefinitions(source,outputs){
 const p=source.protection_admission;
 if(typeof p.browser_api_typescript!=='string'||!p.browser_api_typescript.startsWith('import type {')||!p.browser_api_typescript.includes("from './protection-node.js';"))fail('SOURCE','protected-browser declarations missing or unanchored');
 const lines=['// Generated protected-browser definitions; schema validity is not authority.',p.browser_api_typescript];
 outputs.set('packages/kdna-core/src/public-contract/protected-browser.d.ts',Buffer.from(lines.join('\n')+'\n'));
 outputs.set('specs/protected-browser.d.ts',Buffer.from(lines.join('\n').replaceAll("'./types.js'","'../packages/kdna-core/src/public-contract/types.js'").replaceAll("'./protection-node.js'","'../packages/kdna-core/src/public-contract/protection-node.js'")+'\n'));
}
// B3: the protected-source module is a third independent module descriptor, after
// protection and transport. It owns its own schema, types, descriptor and validator, and
// its type names may not collide with the base types or with the protection types, so a
// source type can never be mistaken for a protection type.
function protectedSourceDefinitions(source,outputs){
 const p=source.protected_source;
 assertSchemaBinding(p,source);
 if(!p)return;
 if(p.id!=='kdna.protected-source/1'||p.version!=='1.0.0'||p.status!=='B3_IMPLEMENTATION_CANDIDATE_NOT_ACCEPTED')fail('SOURCE','unexpected protected-source coordinate or status');
 if(JSON.stringify(p.runtime_exports)!==JSON.stringify(['Core/protected-source-node:getProtectedSourceContract','Core/protected-source-node:createTrustedProtectedSourceHost','Core/protected-source-node:withProtectedSourceNode','Core/protected-source-node:commitProtectedSourceTransport','Core/protected-source-node:previewProtectedSourceRevision','Core/protected-source-node:produceProtectedSourceRevision']))fail('SOURCE','protected-source runtime surface drift');
 if(!PROTECTED_SOURCE_OUTPUTS.includes(p.schema_path)||p.schema_id!=='urn:kdna:schema:protected-source:1.0.0:binding:r2:8'||p.root!=='ProtectedSourceObservation')fail('SOURCE','unexpected protected-source schema coordinate');
 const protection=source.protection_admission;
 const combined={...source.types,...protection.types,...p.types};
 for(const [name,node]of Object.entries(p.types)){
  if(!/^(?:ProtectedSource|Source)[A-Za-z0-9_]*$/.test(name))fail('SOURCE','protected-source type name');
  if(Object.hasOwn(source.types,name)||Object.hasOwn(protection.types,name))fail('SOURCE','protected-source type collision: '+name);
  validateNode(node,combined,name);
 }
 const compiled=compileNode(combined,source);
 const defs=closure([p.root,...Object.keys(p.types)],compiled);
 outputs.set(p.schema_path,bytes({$schema:source.schema_dialect,$id:p.schema_id,title:p.root,description:'Protected-source observations only. Opaque authorities have no JSON representation; validating an observation proves no permission, no delivery and no authority.',$ref:'#/$defs/'+p.root,$defs:defs}));
 const baseRefs=[...references(p.types)].filter(n=>Object.hasOwn(source.types,n)).sort();
 const protectionRefs=[...references(p.types)].filter(n=>Object.hasOwn(protection.types,n)).sort();
 const lines=['// Generated protected-source definitions; schema validity is not authority.','import type { '+baseRefs.join(', ')+" } from './types.js';"];
 if(protectionRefs.length)lines.push("import type { "+protectionRefs.join(', ')+" } from './protection-node.js';");
 for(const [name,node]of Object.entries(p.types))lines.push('export type '+name+' = '+typeExpression(node,source)+';');
 if(typeof p.api_typescript!=='string')fail('SOURCE','protected-source declarations missing');
 lines.push(p.api_typescript);
 outputs.set('packages/kdna-core/src/public-contract/protected-source-node.d.ts',Buffer.from(lines.join('\n')+'\n'));
 outputs.set('specs/protected-source.d.ts',Buffer.from(lines.join('\n').replaceAll("'./types.js'","'../packages/kdna-core/src/public-contract/types.js'").replaceAll("'./protection-node.js'","'../packages/kdna-core/src/public-contract/protection-node.js'")+'\n'));
 outputs.set('packages/kdna-core/src/public-contract/protected-source-contract.generated.json',bytes({...p,types:compiled,definition_digest:'sha256:'+sha(JSON.stringify(ordered(p)))}));
}
function issuerDefinitions(source,outputs,runtimeEnforcement){
 const p=source.external_grant_issuer;
 if(p.schema_path!==ISSUER_SCHEMA||p.schema_id!=='urn:kdna:schema:external-grant-issuer:1.0.0:binding:r2:8'||p.root!=='IssuerResultObservation'||JSON.stringify(p.runtime_exports)!==JSON.stringify(['getExternalGrantIssuerContract','issueExternalKeyGrantForAsset']))fail('SOURCE','issuer surface drift');
 assertSchemaBinding(p,source);
 const combined={...source.types,...p.types};
 for(const [name,node]of Object.entries(p.types)){
  if(!/^Issuer[A-Za-z0-9_]+$/.test(name)||Object.hasOwn(source.types,name)||Object.hasOwn(source.protection_admission.types,name))fail('SOURCE','issuer type collision');
  validateNode(node,combined,name);
 }
 const defs=closure(Object.keys(p.types),compileNode(combined,source));
 outputs.set(ISSUER_SCHEMA,bytes({$schema:source.schema_dialect,$id:p.schema_id,title:p.root,description:'Issuer observations only; JSON validation is not authentication or account authority. grantBytes is a separately checked Uint8Array runtime field.',$ref:'#/$defs/'+p.root,$defs:defs}));
 const baseRefs=[...references(p.types)].filter(n=>Object.hasOwn(source.types,n)).sort();
 const lines=['// Generated issuer definitions; observations do not grant authority.',"import type { "+baseRefs.join(', ')+" } from '../packages/kdna-core/src/public-contract/types.js';"];
 for(const [name,node]of Object.entries(p.types))lines.push('export type '+name+' = '+typeExpression(node,source)+';');
 if(typeof p.api_typescript!=='string')fail('SOURCE','issuer declarations missing');
 lines.push(p.api_typescript);outputs.set('specs/external-grant-issuer.d.ts',Buffer.from(lines.join('\n')+'\n'));
 lines[1]="import type { "+baseRefs.join(', ')+" } from './types.js';";
 outputs.set('packages/kdna-core/src/public-contract/key-grant-issuer-node.d.ts',Buffer.from(lines.join('\n')+'\n'));
 outputs.set('packages/kdna-core/src/public-contract/issuer-contract.generated.json',bytes({...p,types:compileNode(p.types,source),derived_runtime_enforcement:runtimeEnforcement,definition_digest:'sha256:'+sha(JSON.stringify(ordered(p)))}));
}
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
else if(node.type==='array'&&node.prefixItems)result='readonly ['+node.prefixItems.map(x=>typeExpression(x,source)).join(', ')+']';
else if(node.type==='array')result=node.maxItems===0?'readonly []':'ReadonlyArray<'+typeExpression(node.items,source)+'>';
else if(['integer','number'].includes(node.type))result='number';
else if(['string','boolean','null'].includes(node.type))result=node.type;
else if(node.required)result='{ '+node.required.map(k=>{if(!props[k])fail('TYPE_RENDER','unbound required field '+k);return 'readonly '+JSON.stringify(k)+': '+typeExpression(props[k],source)+';';}).join(' ')+' }';
else result=null; // Validation-only applicators refine runtime admission, not a JSON escape type.
if(node.allOf){const branches=node.allOf.map(x=>typeExpression(x,source,props)).filter(x=>x!==null);if(branches.length){const intersection=branches.map(x=>'('+x+')').join(' & ');result=result===null?intersection:result+' & '+intersection;}}
if(node.type&&union)result+=' & ('+union.map(x=>typeExpression(x,source,props)).join(' | ')+')';
return result;
}
function integration(source,compiled,o,outputs){
if(!source.engineering)return [];
if(source.static_policy){
 const p=source.static_policy,d=p.definition;
 if('sha256:'+sha(JSON.stringify(ordered(d)))!==p.definition_digest)fail('STATIC_POLICY_DEFINITION','definition digest differs');
 for(const [name,node]of Object.entries(d.types))if(JSON.stringify(ordered(node))!==JSON.stringify(ordered(source.types[name])))fail('STATIC_POLICY_DEFINITION','type differs '+name);
 outputs.set('specs/static-policy-2.md',Buffer.from('# Public static policy '+d.version+'\n\nDefinition digest: `'+p.definition_digest+'`. Generated from the unique public semantic source. Static rules are not execution results. Historical [/1](static-policy.md) is retained unchanged and is not accepted by this R2 binding.\n\nNative R2 binding (part of the definition digest):\n\n```json\n'+JSON.stringify(d.native_binding,null,2)+'\n```\n\n'+d.rules.map((x,i)=>(i+1)+'. '+x).join('\n\n')+'\n'));
 outputs.set('packages/kdna-core/src/public-contract/static-policy.d.ts',Buffer.from('// Generated from specs/public-semantic-source.json.\nexport declare function getStaticPolicyContract(): '+typeExpression({type:'object',properties:{contract_id:{type:'string',const:d.id},contract_version:{type:'string',const:d.version},definition_digest:{type:'string',const:p.definition_digest},carrier:{type:'object',properties:Object.fromEntries(Object.entries(d.carrier).map(([k,v])=>[k,{type:typeof v,const:v}])),required:Object.keys(d.carrier),additionalProperties:false}},required:['contract_id','contract_version','definition_digest','carrier'],additionalProperties:false},source)+';\n'));
}
const e=source.engineering;
if(source.component_semantics){const c=source.component_semantics;outputs.set('specs/component-semantics-2.md',Buffer.from('# Public component semantics '+c.definition.version+'\n\nDefinition digest: `'+c.definition_digest+'`. Generated from the unique public semantic source. The public registry is not caller configurable.\n\n'+c.definition.rules.map((x,i)=>(i+1)+'. '+x).join('\n\n')+'\n'));}
for(const [target,original]of Object.entries(e.mirrors)){if(!INTEGRATION_OUTPUTS.includes(target)||!outputs.has(original))fail('SOURCE','unknown package mirror');outputs.set(target,outputs.get(original));}
if(source.transport_admission){
const t=source.transport_admission;
outputs.set('packages/kdna-read/schema/read-transport-admission-0.2.1.schema.json',outputs.get(TRANSPORT_OUTPUT));
const baseRefs=[...references(t.types)].filter(n=>Object.hasOwn(source.types,n)).sort();
const lines=['// Generated from specs/public-semantic-source.json; do not edit.',"import type { "+baseRefs.join(', ')+" } from '@aikdna/kdna-core';"];
for(const [name,node]of Object.entries(t.types))lines.push('export type '+name+' = '+typeExpression(node,source)+';');
lines.push('export declare function '+t.function+'(response: Response, context: ReadTransportContext): Promise<ReadTransportAdmissionResult>;');
outputs.set('packages/kdna-read/src/transport.d.ts',Buffer.from(lines.join('\n')+'\n'));
outputs.set('packages/kdna-read/src/transport-contract.json',bytes({contract:t.contract,limits:t.limits,diagnostic_codes:t.diagnostic_codes,proof_limits:t.proof_limits}));
}
const psn=source.package_set_node;
if(psn){
 const psClosure=closure([psn.root,...psn.exports],compileNode({...source.types,...psn.types},source));
 const keySets=Object.fromEntries([...Object.entries(psClosure).filter(([,node])=>node&&node.type==='object'&&node.properties).map(([name,node])=>[name,{keys:Object.keys(node.properties).sort(),required:[...node.required].sort()}]),...Object.entries(psn.input_records).map(([name,entry])=>[name,{keys:[...entry.keys].sort(),required:[...entry.required].sort()}])]);
 const limits={maxMembers:psn.types.PackageSetLimits.properties.maxMembers.const,maxTotalSourceBytes:psn.types.PackageSetLimits.properties.maxTotalSourceBytes.const};
 const descriptor={contract:psn.contract,module_version:psn.module_version,core_version:source.engineering.package_versions.core,read_version:source.engineering.package_versions.read,limits,local_failures:[...psn.local_failures],core_callables:[...psn.core_callables],read_callables:[...psn.read_callables],claims:psn.claims};
 descriptor.definition_digest='sha256:'+sha(JSON.stringify(ordered(descriptor)));
 const coreContract=bytes({descriptor,types:psClosure,key_sets:keySets,schema_id:psn.schema_id,schema_path:psn.schema_path,proof_limits:psn.proof_limits});
 outputs.set(psn.core_contract_path,coreContract);
 outputs.set(psn.read_contract_path,bytes({descriptor,key_sets:keySets,core_contract_digest:'sha256:'+sha(coreContract),schema_id:psn.schema_id,schema_path:psn.schema_path,proof_limits:psn.proof_limits}));
 outputs.set(psn.schema_path,bytes({$schema:source.schema_dialect,$id:psn.schema_id,title:psn.root,description:'Generated from the single public semantic source. Structural validity is not member admission, disclosure authority, execution permission or protected PackageSet support.',$ref:'#/$defs/'+psn.root,$defs:psClosure}));
 outputs.set(psn.typescript_path,Buffer.from(['// Generated from specs/public-semantic-source.json; do not edit.',"import type { "+[...references(psn.types)].filter(n=>Object.hasOwn(source.types,n)).sort().join(', ')+" } from '../packages/kdna-core/src/public-contract/types.js';",...Object.entries(psn.types).map(([name,node])=>'export type '+name+' = '+typeExpression(node,source)+';'),''].join('\n')));
 const psBase=[...new Set([...references(psn.types),'VersionTuple','CanonicalReadSnapshot'])].filter(n=>Object.hasOwn(source.types,n)).sort();
 const coreLines=['// Generated from specs/public-semantic-source.json; do not edit.'];
 if(psBase.length)coreLines.push('import type { '+psBase.join(', ')+" } from './types.js';");
 for(const [name,node] of Object.entries(psn.types))coreLines.push('export type '+name+' = '+typeExpression(node,source)+';');
 coreLines.push(
  'export type PackageSetOperation = "isolated_read" | "semantic_merge" | "cross_asset_reference";',
  'export type PackageSetMemberSource = { readonly "member_id": string; readonly "bytes": Uint8Array };',
  'declare const TrustedPackageSetMemberProviderBrand: unique symbol;',
  'export type TrustedPackageSetMemberProvider = { readonly [TrustedPackageSetMemberProviderBrand]: true };',
  'export type PackageSetStructureResult = { readonly "status": "valid"; readonly "value": PackageSet; readonly "proof": "claims_not_authenticated" } | { readonly "status": "rejected"; readonly "diagnostic": "READ_INPUT_INVALID"; readonly "merged_ir": false; readonly "action_authorized": false };',
  'export type PackageSetDecisionAllowed = { readonly "status": "allowed"; readonly "selected_member": string; readonly "merged_ir": false; readonly "action_authorized": false };',
  'export type PackageSetDecisionRejected = { readonly "status": "rejected"; readonly "diagnostic": string; readonly "merged_ir": false; readonly "action_authorized": false };',
  'export type PackageSetDecision = PackageSetDecisionAllowed | PackageSetDecisionRejected;',
  'declare const AdmittedPackageSetBrand: unique symbol;',
  'export type AdmittedPackageSet = { readonly [AdmittedPackageSetBrand]: true };',
  'export type AdmittedPackageSetView = { readonly "set": PackageSet; readonly "tuple": VersionTuple; readonly "operation": PackageSetOperation; readonly "members": ReadonlyArray<{ readonly "member_id": string; readonly "snapshot": CanonicalReadSnapshot }>; readonly "selected_member": { readonly "member_id": string; readonly "snapshot": CanonicalReadSnapshot }; readonly "host_id": string; readonly "host_epoch": string };',
  'export type PackageSetAdmissionResult = { readonly "status": "admitted"; readonly "admission": AdmittedPackageSet; readonly "decision": PackageSetDecisionAllowed; readonly "local_failure": null } | { readonly "status": "rejected"; readonly "admission": null; readonly "decision": PackageSetDecision | null; readonly "local_failure": PackageSetLocalFailure | null };',
  'export type PackageSetRecheckResult = { readonly "status": "allowed"; readonly "decision": PackageSetDecisionAllowed; readonly "local_failure": null } | { readonly "status": "rejected"; readonly "decision": PackageSetDecisionRejected | null; readonly "local_failure": PackageSetLocalFailure | null };',
  'export type PackageSetHandoffResult = { readonly "status": "valid"; readonly "value": PackageSetHandoff; readonly "proof": "claims_not_authenticated" } | { readonly "status": "rejected"; readonly "diagnostic": "handoff_invalid" };',
  'export declare function getPackageSetContract(): PackageSetNodeDescriptor;',
  'export declare function validatePackageSetStructure(input: unknown): PackageSetStructureResult;',
  'export declare function createTrustedPackageSetMemberProvider(config: unknown): TrustedPackageSetMemberProvider;',
  'export declare function admitPackageSetNode(input: unknown, provider: unknown): Promise<PackageSetAdmissionResult>;',
  'export declare function recheckPackageSet(admission: unknown, phase: "read" | "handoff"): PackageSetRecheckResult;',
  'export declare function inspectAdmittedPackageSet(admission: unknown): AdmittedPackageSetView | null;',
  'export declare function verifyPackageSetHandoff(handoff: unknown, admission: unknown, plan: unknown, deliveredRead: unknown): PackageSetHandoffResult;');
 outputs.set(psn.core_declarations_path,Buffer.from(coreLines.join('\n')+'\n'));
 const readLines=['// Generated from specs/public-semantic-source.json; do not edit.',"import type { ReadCallResult } from '@aikdna/kdna-core';","import type { PackageSetDecision, PackageSetHandoffResult, PackageSetLocalFailure, PackageSetNodeDescriptor } from '@aikdna/kdna-core/package-set-node';",
  'export type PackageReadContract = { readonly "descriptor": PackageSetNodeDescriptor; readonly "core_contract_digest": string; readonly "schema_id": string; readonly "schema_path": string; readonly "proof_limits": string };',
  'export type PackageSetReadProviderConfig = { readonly "host_id": string; readonly "host_epoch": string; readonly "members": unknown; readonly "observeRead": (input: unknown) => unknown; readonly "sink"?: (result: ReadCallResult) => boolean };',
  'declare const TrustedPackageReadProviderBrand: unique symbol;',
  'export type TrustedPackageReadProvider = { readonly [TrustedPackageReadProviderBrand]: true };',
  'declare const DeliveredPackageReadBrand: unique symbol;',
  'export type DeliveredPackageRead = { readonly [DeliveredPackageReadBrand]: true };',
  'export type PackageSetHandleRegistration = "none" | "registered";',
  'export type PackageSetReadResult = { readonly "decision": PackageSetDecision | null; readonly "readResult": ReadCallResult | null; readonly "delivered": DeliveredPackageRead | null; readonly "local_failure": PackageSetLocalFailure | null; readonly "sink_invoked": boolean; readonly "sink_confirmed": boolean; readonly "registered_handles": number; readonly "registered_handle_ids": ReadonlyArray<string>; readonly "handle_registration": PackageSetHandleRegistration; readonly "host_closed": boolean; readonly "member_observations": number; readonly "reader_observations": number };',
  'export declare function getPackageReadContract(): PackageReadContract;',
  'export declare function createTrustedPackageReadProvider(config: PackageSetReadProviderConfig): TrustedPackageReadProvider;',
  'export declare function readPackageSetNode(request: unknown, control: unknown, provider: unknown): Promise<PackageSetReadResult>;',
  'export declare function sealPackageSetHandoff(deliveredToken: unknown, admittedPlan: unknown): PackageSetHandoffResult;',
  'export declare function admitPackageSetHandoff(wire: unknown, deliveredToken: unknown, admittedPlan: unknown): PackageSetHandoffResult;'];
 outputs.set(psn.read_declarations_path,Buffer.from(readLines.join('\n')+'\n'));
}
const declarations=['// Generated from specs/public-semantic-source.json; do not edit.'];
for(const [name,node]of Object.entries(source.types)){
if(node.$opaque){declarations.push('declare const '+name+'Brand: unique symbol;','export type '+name+' = { readonly ['+name+'Brand]: true };');}
else declarations.push('export type '+name+' = '+typeExpression(node,source)+';');
}
declarations.push('export declare function admitBytes(input: Uint8Array): CoreAdmissionResult;');
outputs.set('packages/kdna-core/src/public-contract/types.d.ts',Buffer.from(declarations.join('\n')+'\n'));
const contextRule=source.r2_semantics?.selected_context;
if(contextRule?.authority!=='S12-D009'||JSON.stringify(contextRule.asset_projection_fields)!==JSON.stringify(['reading_order','kernel.foundation_refs'])||contextRule.omission_authority?.expandable!==false||contextRule.omission_authority?.handle_id!==null)fail('SOURCE','selected context rule differs from the named R2 projection');
const contextCode=Buffer.from('// Generated from specs/public-semantic-source.json and its selected-context algorithm; do not edit.\n'+"'use strict';\n"+selectedContext.toString()+'\nmodule.exports={selectedContext};\n');
if(source.engineering.read_installation_guard?.decision!=='S12-D011 revision2 plus S12-D012, S12-D013 and S12-D016'||source.engineering.read_installation_guard?.failure!=='READ_CORE_CAPABILITY_UNAVAILABLE')fail('SOURCE','Read installation guard rule missing');
outputs.set('packages/kdna-read/src/installation.generated.json',bytes({core_version:source.engineering.package_versions.core,read_version:source.engineering.package_versions.read}));
for(const file of ['packages/kdna-core/src/public-contract/selected-context.generated.js','packages/kdna-read/src/selected-context.generated.js'])outputs.set(file,contextCode);
outputs.set('packages/kdna-core/src/public-contract/generated-contract.json',bytes({versionTuple:source.versionTuple,digest_profiles:source.digest_profiles,resource_limits:e.resource_limits,component_semantics:source.component_semantics,static_policy:source.static_policy,authoring_workflow:source.authoring_workflow,r2_semantics:source.r2_semantics,...(e.core_terms!==undefined?{core_terms:e.core_terms}:{}),types:compiled}));
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
// A separate locked dependency host can supply build tooling while --root
// continues to identify the repository's semantic and implementation inputs.
const require=createRequire(o['dependency-root']?path.join(o['dependency-root'],'package.json'):import.meta.url),Ajv=require('ajv/dist/2020.js'),standalone=require('ajv/dist/standalone/index.js');
const version=require('ajv/package.json').version,meta=JSON.parse(regular(path.join(o.root,'packages/kdna-core/package.json')));
if(version!==meta.dependencies.ajv)fail('TOOL_VERSION','Standalone generation requires the exact Core Ajv dependency');
const options={strict:true,strictTypes:false,strictRequired:false,validateFormats:false,code:{source:true,lines:true}};
const ajv=new Ajv({...options,allErrors:true}),roots={};
for(const [name,file]of [['Manifest','schema/manifest-container-0.5.0-judgment-0.5.1.schema.json'],['Payload','schema/payload-profile-0.5.1.schema.json'],['CanonicalIR','specs/canonical-ir-0.6.1.schema.json']]){const schema=JSON.parse(outputs.get(file));ajv.addSchema(schema);roots[name]=schema.$id;}
for(const name of ['ComponentSemanticsCarrier','ComponentAdoptionCarrier','MethodPresenceCarrier','TaxonomyContent','CandidateSetContent','DiscriminatorContent','StaticPolicyCarrier']){const id='https://kdna.dev/public-component/'+name;ajv.addSchema({$id:id,$schema:source.schema_dialect,$ref:'#/$defs/'+name,$defs:compiled});roots[name]=id;}
const handoffAjv=new Ajv(options),handoff=handoffAjv.compile({$schema:'https://json-schema.org/draft/2020-12/schema',$ref:'#/$defs/PackageSetHandoff',$defs:compiled});
const transportAjv=new Ajv({...options,allErrors:false,coerceTypes:false,useDefaults:false,removeAdditional:false}),transport=JSON.parse(outputs.get(TRANSPORT_OUTPUT));transportAjv.addSchema(transport);
const executionAjv=new Ajv({...options,allErrors:true}),executionRoots={};
for(const artifact of source.artifacts.filter(x=>x.root?.startsWith('Public')&&x.path.endsWith('-0.3.1.schema.json'))){const schema=JSON.parse(outputs.get(artifact.path));executionAjv.addSchema(schema);executionRoots[artifact.root]=schema.$id;}
const envelopeRegExp=require(path.join(o.root,'packages/kdna-core/src/public-contract/protection-envelope-codec.js')).envelopeRegExp;
const protectionAjv=new Ajv({...options,code:{...options.code,regExp:envelopeRegExp}}),protectionRoots={};
 const protectionDefs=JSON.parse(outputs.get('specs/protection-admission-r2-binding-8.schema.json')).$defs;
 for(const name of ['ProtectionReceipt','ProtectedAdmissionResult','ProtectedReadResult','ProtectedTransportCommitResult','ChecksumsDocument1']){const id='urn:kdna:protection-validator:'+name;protectionAjv.addSchema({$id:id,$schema:source.schema_dialect,$ref:'#/$defs/'+name,$defs:protectionDefs});protectionRoots[name]=id;}
 for(const [name,file]of [['PasswordEnvelope','specs/envelope-aead.schema.json'],['ExternalEnvelope','specs/external-grant-envelope.schema.json'],['ExternalGrant','specs/external-key-grant.schema.json']]){const schema=JSON.parse(regular(path.join(o.root,file)));protectionAjv.addSchema(schema);protectionRoots[name]=schema.$id;}
const issuerAjv=new Ajv(options),issuerRoots={},issuerDefs=JSON.parse(outputs.get(ISSUER_SCHEMA)).$defs;
for(const name of ['IssuerOptions','IssuerSignaturePolicy','IssuerResultObservation','IssuerDescriptor']){const id='urn:kdna:issuer-validator:'+name;issuerAjv.addSchema({$id:id,$schema:source.schema_dialect,$ref:'#/$defs/'+name,$defs:issuerDefs});issuerRoots[name]=id;}
const psnDescriptor=source.package_set_node,psnAjv=new Ajv({...options,allErrors:false,coerceTypes:false,useDefaults:false,removeAdditional:false}),psnSchema=JSON.parse(outputs.get(psnDescriptor.schema_path));
psnAjv.addSchema(psnSchema);
const psnRoots=Object.fromEntries([psnDescriptor.root,...psnDescriptor.exports].filter((n,i,a)=>a.indexOf(n)===i).map(n=>[n,psnSchema.$id+'#/$defs/'+n]));
const srcDescriptor=source.protected_source,srcAjv=new Ajv({...options,allErrors:true}),srcSchema=JSON.parse(outputs.get(srcDescriptor.schema_path)),srcRoots={};
for(const name of [srcDescriptor.root,'ProtectedSourceRevisionPreviewResult','SourceHostObservation']){const id='urn:kdna:protected-source-validator:'+name;srcAjv.addSchema({$id:id,$schema:source.schema_dialect,$ref:'#/$defs/'+name,$defs:srcSchema.$defs});srcRoots[name]=id;}
const header='// Generated by scripts/public-contract/generate.mjs from the single public semantic source; do not edit.\n';
// Validators are addressed by path, never by position: two independent lines each appended to
// VALIDATOR_OUTPUTS and read it back by hard-coded index, which silently dropped a validator and
// could write one validator's bytes to another validator's path. The declared set and the emitted
// set are compared literally before anything is returned.
const VALIDATOR_EMISSION=[[CORE_VALIDATOR,Buffer.from(header+standalone(ajv,roots)+'\n')],[HANDOFF_VALIDATOR,Buffer.from(header+standalone(handoffAjv,handoff)+'\n')],[TRANSPORT_VALIDATOR,Buffer.from(header+standalone(transportAjv,{contextSchema:transport.$id+'#/$defs/ReadTransportContext',remoteSchema:transport.$id+'#/$defs/ReadTransportRemoteResponse'})+'\n')],[EXECUTION_VALIDATOR,Buffer.from(header+standalone(executionAjv,executionRoots)+'\n')],[PROTECTION_VALIDATOR,Buffer.from(header+standalone(protectionAjv,protectionRoots)+'\n')],[ISSUER_VALIDATOR,Buffer.from(header+standalone(issuerAjv,issuerRoots)+'\n')],[SOURCE_VALIDATOR,Buffer.from(header+standalone(srcAjv,srcRoots)+'\n')],[PACKAGE_SET_NODE_OUTPUTS.validator,Buffer.from(header+standalone(psnAjv,psnRoots)+'\n')]];
if(new Set(VALIDATOR_OUTPUTS).size!==VALIDATOR_OUTPUTS.length)fail('PATH','duplicate validator output declaration');
if(JSON.stringify([...VALIDATOR_OUTPUTS].sort())!==JSON.stringify(VALIDATOR_EMISSION.map(([p])=>p).sort()))fail('PATH','validator declaration and emission disagree');
return new UniqueOutputMap(VALIDATOR_EMISSION);}

export function generate(args){
 const o=parse(args);let raw;
 try{raw=regular(o.source);}catch(e){fail('SOURCE_MISSING','source unreadable');}
 let source;try{source=JSON.parse(raw);}catch{fail('SOURCE_PARSE','source is not JSON');}
 if(Object.hasOwn(source,'representation_candidate'))fail('NATIVE_SOURCE','Use generate-native.mjs for the complete cumulative source; the base function requires its explicit ownership view');
 const {outputs,manifest}=buildOutputs(source,o,raw);
 const options={root:o['out-dir'],scratch:o['scratch-dir'],allowed:new Set(BASE_OUTPUT_PATHS)};
 if(o.check){
  const drift=compareOutputs(outputs,options);
  if(drift.length)fail('GENERATED_DRIFT',JSON.stringify(drift));
  return {status:'CHECK_MATCH',derived:manifest.derived,derived_aggregate_sha256:manifest.derived_aggregate_sha256,writes:0};
 }
 writeOutputs(outputs,options);
 return {status:'GENERATED',derived:manifest.derived,derived_aggregate_sha256:manifest.derived_aggregate_sha256,written:[...outputs.keys()]};
}
// Entry guard: both sides are compared through realpath so an invocation through a symlinked or
// aliased directory still RUNS the generator instead of exiting 0 having done nothing. An import
// (verify.mjs loads this module) is not the entry point and must not run it; an unresolvable entry
// path refuses to run.
function entryGuardOutcome(){if(!process.argv[1])return 'import';let invoked=null,self=null;try{invoked=fs.realpathSync(process.argv[1]);}catch{invoked=null;}try{self=fs.realpathSync(SELF);}catch{self=null;}if(invoked&&self&&invoked===self)return 'entry';if(path.resolve(process.argv[1])===path.resolve(SELF))return 'unresolved-entry';return 'import';}
const entryGuard=entryGuardOutcome();
if(entryGuard==='unresolved-entry'){console.error('KDNA_PUBLIC_CONTRACT_GENERATE_ENTRY_GUARD_FAILED: refusing to run under an unresolved entry path');process.exit(2);}
async function runEntry(args){
 const options=parse(args);let source;
 try{source=JSON.parse(regular(options.source));}catch{return generate(args);}
 // Delay the composition import until this base module has finished evaluating;
 // the native builder imports buildOutputs from this module.
 if(Object.hasOwn(source,'representation_candidate')){
  const {generateNative}=await import('./generate-native.mjs');
  return generateNative(args);
 }
 return generate(args);
}
if(entryGuard==='entry')runEntry(process.argv.slice(2)).then(result=>console.log(JSON.stringify(result))).catch(e=>{console.error(JSON.stringify({status:'ERROR',code:e.code??'GENERATION_ERROR',message:e.message}));process.exitCode=1;});
