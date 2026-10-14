"use strict";
exports.AdmittedSourceMigrationRequest06 = validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:migration06:AdmittedSourceMigrationRequest06","title":"AdmittedSourceMigrationRequest06","description":"Candidate source-migration API structural data; opaque authorities are native-only.","$ref":"#/$defs/AdmittedSourceMigrationRequest06","$defs":{"AdmittedSourceMigrationRequest06":false}};
const schema32 = false;

function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:migration06:AdmittedSourceMigrationRequest06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate20.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const err0 = {instancePath,schemaPath:"#/$defs/AdmittedSourceMigrationRequest06/false schema",keyword:"false schema",params:{},message:"boolean schema is false"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
validate20.errors = vErrors;
return errors === 0;
}
validate20.evaluated = {"dynamicProps":false,"dynamicItems":false};

exports.NativeSourceMigrationAuthority06 = validate21;
const schema33 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:migration06:NativeSourceMigrationAuthority06","title":"NativeSourceMigrationAuthority06","description":"Candidate source-migration API structural data; opaque authorities are native-only.","$ref":"#/$defs/NativeSourceMigrationAuthority06","$defs":{"NativeSourceMigrationAuthority06":false}};

function validate21(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:migration06:NativeSourceMigrationAuthority06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate21.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const err0 = {instancePath,schemaPath:"#/$defs/NativeSourceMigrationAuthority06/false schema",keyword:"false schema",params:{},message:"boolean schema is false"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"dynamicProps":false,"dynamicItems":false};

exports.SourceMigrationAuthorityContext06 = validate22;
const schema35 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:migration06:SourceMigrationAuthorityContext06","title":"SourceMigrationAuthorityContext06","description":"Candidate source-migration API structural data; opaque authorities are native-only.","$ref":"#/$defs/SourceMigrationAuthorityContext06","$defs":{"CandidateVersionTuple06":{"type":"object","properties":{"container":{"const":"0.6.0","type":"string"},"payload_profile":{"const":"kdna.payload.judgment","type":"string"},"payload_version":{"const":"0.5.1","type":"string"},"core":{"const":"kdna.core/0.8.2","type":"string"},"ir":{"const":"kdna.canonical-ir/0.6.1","type":"string"},"runtime":{"const":"kdna.runtime-capsule/0.3.1","type":"string"},"plan":{"const":"kdna.consumption-plan/0.3.1","type":"string"},"host":{"const":"kdna.agent-host/0.3.1","type":"string"},"trace":{"const":"kdna.judgment-trace/0.3.1","type":"string"},"read":{"const":"kdna.read/0.7.0-candidate","type":"string"}},"required":["container","payload_profile","payload_version","core","ir","runtime","plan","host","trace","read"],"additionalProperties":false},"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"SourceInputProfile06":{"type":"string","enum":["public_sections06","protected_logical_payload06"]},"SourceMigrationAuthorityContext06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/SourceMigrationRouteContract06"},"request":{"$ref":"#/$defs/SourceMigrationRequest06"},"request_digest":{"$ref":"#/$defs/Digest"},"capture":{"$ref":"#/$defs/SourceOuterCapture06"},"source_inventory":{"type":"array","items":{"$ref":"#/$defs/SourceMigrationCaptureRow06"},"minItems":3,"maxItems":128},"output_intent":{"type":"object","properties":{"container":{"type":"string","const":"0.6.0"},"read":{"type":"string","const":"kdna.read/0.7.0-candidate"},"adoption":{"type":"string","const":"not_observed"}},"required":["container","read","adoption"],"additionalProperties":false}},"required":["contract","request","request_digest","capture","source_inventory","output_intent"],"additionalProperties":false},"SourceMigrationCaptureRow06":{"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"type":{"type":"string","const":"file"},"mode":{"$ref":"#/$defs/UInt"},"size":{"$ref":"#/$defs/UInt"}},"required":["name","type","mode","size"],"additionalProperties":false},"SourceMigrationRequest06":{"type":"object","properties":{"request_id":{"$ref":"#/$defs/Identifier"},"tuple":{"$ref":"#/$defs/CandidateVersionTuple06"},"operation":{"type":"string","const":"migrate_public_source"},"source_expected_A":{"$ref":"#/$defs/Digest"},"timeout_ms":{"$ref":"#/$defs/UInt"},"signature_policy":{"type":"object","properties":{"requireSignature":{"type":"boolean","const":false},"expectedPublicKeyHex":{"type":"null"}},"required":["requireSignature","expectedPublicKeyHex"],"additionalProperties":false}},"required":["request_id","tuple","operation","source_expected_A","timeout_ms","signature_policy"],"additionalProperties":false},"SourceMigrationRouteContract06":{"type":"object","properties":{"id":{"type":"string","const":"kdna.source-migration/0.1.0-candidate"},"version":{"type":"string","const":"0.1.0-candidate"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false},"SourceOuterCapture06":{"type":"object","properties":{"capture_id":{"$ref":"#/$defs/Identifier"},"input_byte_length":{"$ref":"#/$defs/UInt"},"manifest_bytes_digest":{"$ref":"#/$defs/Digest"},"zip_directory_bytes_digest":{"$ref":"#/$defs/Digest"},"input_profile":{"$ref":"#/$defs/SourceInputProfile06"},"identity_scope":{"type":"string","const":"observed_outer_metadata_before_source_materialization"}},"required":["capture_id","input_byte_length","manifest_bytes_digest","zip_directory_bytes_digest","input_profile","identity_scope"],"additionalProperties":false},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};
const schema36 = {"type":"object","properties":{"contract":{"$ref":"#/$defs/SourceMigrationRouteContract06"},"request":{"$ref":"#/$defs/SourceMigrationRequest06"},"request_digest":{"$ref":"#/$defs/Digest"},"capture":{"$ref":"#/$defs/SourceOuterCapture06"},"source_inventory":{"type":"array","items":{"$ref":"#/$defs/SourceMigrationCaptureRow06"},"minItems":3,"maxItems":128},"output_intent":{"type":"object","properties":{"container":{"type":"string","const":"0.6.0"},"read":{"type":"string","const":"kdna.read/0.7.0-candidate"},"adoption":{"type":"string","const":"not_observed"}},"required":["container","read","adoption"],"additionalProperties":false}},"required":["contract","request","request_digest","capture","source_inventory","output_intent"],"additionalProperties":false};
const schema38 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$"};
const schema37 = {"type":"object","properties":{"id":{"type":"string","const":"kdna.source-migration/0.1.0-candidate"},"version":{"type":"string","const":"0.1.0-candidate"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false};
const pattern4 = new RegExp("^sha256:[0-9a-f]{64}$", "u");

function validate24(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate24.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.definition_digest === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "definition_digest"},message:"must have required property '"+"definition_digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "id") || (key0 === "version")) || (key0 === "definition_digest"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("kdna.source-migration/0.1.0-candidate" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.source-migration/0.1.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.version !== undefined){
let data1 = data.version;
if(typeof data1 !== "string"){
const err6 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if("0.1.0-candidate" !== data1){
const err7 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/const",keyword:"const",params:{allowedValue: "0.1.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.definition_digest !== undefined){
let data2 = data.definition_digest;
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
const err8 = {instancePath:instancePath+"/definition_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/definition_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema39 = {"type":"object","properties":{"request_id":{"$ref":"#/$defs/Identifier"},"tuple":{"$ref":"#/$defs/CandidateVersionTuple06"},"operation":{"type":"string","const":"migrate_public_source"},"source_expected_A":{"$ref":"#/$defs/Digest"},"timeout_ms":{"$ref":"#/$defs/UInt"},"signature_policy":{"type":"object","properties":{"requireSignature":{"type":"boolean","const":false},"expectedPublicKeyHex":{"type":"null"}},"required":["requireSignature","expectedPublicKeyHex"],"additionalProperties":false}},"required":["request_id","tuple","operation","source_expected_A","timeout_ms","signature_policy"],"additionalProperties":false};
const schema40 = {"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"};
const schema41 = {"type":"object","properties":{"container":{"const":"0.6.0","type":"string"},"payload_profile":{"const":"kdna.payload.judgment","type":"string"},"payload_version":{"const":"0.5.1","type":"string"},"core":{"const":"kdna.core/0.8.2","type":"string"},"ir":{"const":"kdna.canonical-ir/0.6.1","type":"string"},"runtime":{"const":"kdna.runtime-capsule/0.3.1","type":"string"},"plan":{"const":"kdna.consumption-plan/0.3.1","type":"string"},"host":{"const":"kdna.agent-host/0.3.1","type":"string"},"trace":{"const":"kdna.judgment-trace/0.3.1","type":"string"},"read":{"const":"kdna.read/0.7.0-candidate","type":"string"}},"required":["container","payload_profile","payload_version","core","ir","runtime","plan","host","trace","read"],"additionalProperties":false};
const schema43 = {"type":"integer","minimum":0,"maximum":9007199254740991};
const func1 = require("ajv/dist/runtime/ucs2length").default;
const func3 = Object.prototype.hasOwnProperty;
const pattern5 = new RegExp("^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$", "u");

function validate26(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate26.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.request_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_id"},message:"must have required property '"+"request_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.tuple === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tuple"},message:"must have required property '"+"tuple"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.operation === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation"},message:"must have required property '"+"operation"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.source_expected_A === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_expected_A"},message:"must have required property '"+"source_expected_A"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.timeout_ms === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "timeout_ms"},message:"must have required property '"+"timeout_ms"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.signature_policy === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "signature_policy"},message:"must have required property '"+"signature_policy"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "request_id") || (key0 === "tuple")) || (key0 === "operation")) || (key0 === "source_expected_A")) || (key0 === "timeout_ms")) || (key0 === "signature_policy"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.request_id !== undefined){
let data0 = data.request_id;
if(typeof data0 === "string"){
if(func1(data0) > 256){
const err7 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func1(data0) < 1){
const err8 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern5.test(data0)){
const err9 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.tuple !== undefined){
let data1 = data.tuple;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.container === undefined){
const err11 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "container"},message:"must have required property '"+"container"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data1.payload_profile === undefined){
const err12 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "payload_profile"},message:"must have required property '"+"payload_profile"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data1.payload_version === undefined){
const err13 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "payload_version"},message:"must have required property '"+"payload_version"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data1.core === undefined){
const err14 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "core"},message:"must have required property '"+"core"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data1.ir === undefined){
const err15 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "ir"},message:"must have required property '"+"ir"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data1.runtime === undefined){
const err16 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "runtime"},message:"must have required property '"+"runtime"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data1.plan === undefined){
const err17 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "plan"},message:"must have required property '"+"plan"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data1.host === undefined){
const err18 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "host"},message:"must have required property '"+"host"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data1.trace === undefined){
const err19 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "trace"},message:"must have required property '"+"trace"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data1.read === undefined){
const err20 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "read"},message:"must have required property '"+"read"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
for(const key1 in data1){
if(!(func3.call(schema41.properties, key1))){
const err21 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data1.container !== undefined){
let data2 = data1.container;
if(typeof data2 !== "string"){
const err22 = {instancePath:instancePath+"/tuple/container",schemaPath:"#/$defs/CandidateVersionTuple06/properties/container/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if("0.6.0" !== data2){
const err23 = {instancePath:instancePath+"/tuple/container",schemaPath:"#/$defs/CandidateVersionTuple06/properties/container/const",keyword:"const",params:{allowedValue: "0.6.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data1.payload_profile !== undefined){
let data3 = data1.payload_profile;
if(typeof data3 !== "string"){
const err24 = {instancePath:instancePath+"/tuple/payload_profile",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_profile/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if("kdna.payload.judgment" !== data3){
const err25 = {instancePath:instancePath+"/tuple/payload_profile",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_profile/const",keyword:"const",params:{allowedValue: "kdna.payload.judgment"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data1.payload_version !== undefined){
let data4 = data1.payload_version;
if(typeof data4 !== "string"){
const err26 = {instancePath:instancePath+"/tuple/payload_version",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if("0.5.1" !== data4){
const err27 = {instancePath:instancePath+"/tuple/payload_version",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_version/const",keyword:"const",params:{allowedValue: "0.5.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data1.core !== undefined){
let data5 = data1.core;
if(typeof data5 !== "string"){
const err28 = {instancePath:instancePath+"/tuple/core",schemaPath:"#/$defs/CandidateVersionTuple06/properties/core/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if("kdna.core/0.8.2" !== data5){
const err29 = {instancePath:instancePath+"/tuple/core",schemaPath:"#/$defs/CandidateVersionTuple06/properties/core/const",keyword:"const",params:{allowedValue: "kdna.core/0.8.2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data1.ir !== undefined){
let data6 = data1.ir;
if(typeof data6 !== "string"){
const err30 = {instancePath:instancePath+"/tuple/ir",schemaPath:"#/$defs/CandidateVersionTuple06/properties/ir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if("kdna.canonical-ir/0.6.1" !== data6){
const err31 = {instancePath:instancePath+"/tuple/ir",schemaPath:"#/$defs/CandidateVersionTuple06/properties/ir/const",keyword:"const",params:{allowedValue: "kdna.canonical-ir/0.6.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data1.runtime !== undefined){
let data7 = data1.runtime;
if(typeof data7 !== "string"){
const err32 = {instancePath:instancePath+"/tuple/runtime",schemaPath:"#/$defs/CandidateVersionTuple06/properties/runtime/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if("kdna.runtime-capsule/0.3.1" !== data7){
const err33 = {instancePath:instancePath+"/tuple/runtime",schemaPath:"#/$defs/CandidateVersionTuple06/properties/runtime/const",keyword:"const",params:{allowedValue: "kdna.runtime-capsule/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data1.plan !== undefined){
let data8 = data1.plan;
if(typeof data8 !== "string"){
const err34 = {instancePath:instancePath+"/tuple/plan",schemaPath:"#/$defs/CandidateVersionTuple06/properties/plan/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if("kdna.consumption-plan/0.3.1" !== data8){
const err35 = {instancePath:instancePath+"/tuple/plan",schemaPath:"#/$defs/CandidateVersionTuple06/properties/plan/const",keyword:"const",params:{allowedValue: "kdna.consumption-plan/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data1.host !== undefined){
let data9 = data1.host;
if(typeof data9 !== "string"){
const err36 = {instancePath:instancePath+"/tuple/host",schemaPath:"#/$defs/CandidateVersionTuple06/properties/host/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if("kdna.agent-host/0.3.1" !== data9){
const err37 = {instancePath:instancePath+"/tuple/host",schemaPath:"#/$defs/CandidateVersionTuple06/properties/host/const",keyword:"const",params:{allowedValue: "kdna.agent-host/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data1.trace !== undefined){
let data10 = data1.trace;
if(typeof data10 !== "string"){
const err38 = {instancePath:instancePath+"/tuple/trace",schemaPath:"#/$defs/CandidateVersionTuple06/properties/trace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if("kdna.judgment-trace/0.3.1" !== data10){
const err39 = {instancePath:instancePath+"/tuple/trace",schemaPath:"#/$defs/CandidateVersionTuple06/properties/trace/const",keyword:"const",params:{allowedValue: "kdna.judgment-trace/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data1.read !== undefined){
let data11 = data1.read;
if(typeof data11 !== "string"){
const err40 = {instancePath:instancePath+"/tuple/read",schemaPath:"#/$defs/CandidateVersionTuple06/properties/read/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if("kdna.read/0.7.0-candidate" !== data11){
const err41 = {instancePath:instancePath+"/tuple/read",schemaPath:"#/$defs/CandidateVersionTuple06/properties/read/const",keyword:"const",params:{allowedValue: "kdna.read/0.7.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
}
else {
const err42 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.operation !== undefined){
let data12 = data.operation;
if(typeof data12 !== "string"){
const err43 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if("migrate_public_source" !== data12){
const err44 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/const",keyword:"const",params:{allowedValue: "migrate_public_source"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data.source_expected_A !== undefined){
let data13 = data.source_expected_A;
if(typeof data13 === "string"){
if(!pattern4.test(data13)){
const err45 = {instancePath:instancePath+"/source_expected_A",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
else {
const err46 = {instancePath:instancePath+"/source_expected_A",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.timeout_ms !== undefined){
let data14 = data.timeout_ms;
if(!(((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14))) && (isFinite(data14)))){
const err47 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if((typeof data14 == "number") && (isFinite(data14))){
if(data14 > 9007199254740991 || isNaN(data14)){
const err48 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data14 < 0 || isNaN(data14)){
const err49 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
}
if(data.signature_policy !== undefined){
let data15 = data.signature_policy;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.requireSignature === undefined){
const err50 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/properties/signature_policy/required",keyword:"required",params:{missingProperty: "requireSignature"},message:"must have required property '"+"requireSignature"+"'"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data15.expectedPublicKeyHex === undefined){
const err51 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/properties/signature_policy/required",keyword:"required",params:{missingProperty: "expectedPublicKeyHex"},message:"must have required property '"+"expectedPublicKeyHex"+"'"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
for(const key2 in data15){
if(!((key2 === "requireSignature") || (key2 === "expectedPublicKeyHex"))){
const err52 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/properties/signature_policy/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data15.requireSignature !== undefined){
let data16 = data15.requireSignature;
if(typeof data16 !== "boolean"){
const err53 = {instancePath:instancePath+"/signature_policy/requireSignature",schemaPath:"#/properties/signature_policy/properties/requireSignature/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(false !== data16){
const err54 = {instancePath:instancePath+"/signature_policy/requireSignature",schemaPath:"#/properties/signature_policy/properties/requireSignature/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data15.expectedPublicKeyHex !== undefined){
if(data15.expectedPublicKeyHex !== null){
const err55 = {instancePath:instancePath+"/signature_policy/expectedPublicKeyHex",schemaPath:"#/properties/signature_policy/properties/expectedPublicKeyHex/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
}
else {
const err56 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/properties/signature_policy/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
}
else {
const err57 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema45 = {"type":"object","properties":{"capture_id":{"$ref":"#/$defs/Identifier"},"input_byte_length":{"$ref":"#/$defs/UInt"},"manifest_bytes_digest":{"$ref":"#/$defs/Digest"},"zip_directory_bytes_digest":{"$ref":"#/$defs/Digest"},"input_profile":{"$ref":"#/$defs/SourceInputProfile06"},"identity_scope":{"type":"string","const":"observed_outer_metadata_before_source_materialization"}},"required":["capture_id","input_byte_length","manifest_bytes_digest","zip_directory_bytes_digest","input_profile","identity_scope"],"additionalProperties":false};
const schema50 = {"type":"string","enum":["public_sections06","protected_logical_payload06"]};

function validate28(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate28.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.capture_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture_id"},message:"must have required property '"+"capture_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.input_byte_length === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_byte_length"},message:"must have required property '"+"input_byte_length"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.manifest_bytes_digest === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_bytes_digest"},message:"must have required property '"+"manifest_bytes_digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.zip_directory_bytes_digest === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "zip_directory_bytes_digest"},message:"must have required property '"+"zip_directory_bytes_digest"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.input_profile === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_profile"},message:"must have required property '"+"input_profile"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.identity_scope === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "identity_scope"},message:"must have required property '"+"identity_scope"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "capture_id") || (key0 === "input_byte_length")) || (key0 === "manifest_bytes_digest")) || (key0 === "zip_directory_bytes_digest")) || (key0 === "input_profile")) || (key0 === "identity_scope"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.capture_id !== undefined){
let data0 = data.capture_id;
if(typeof data0 === "string"){
if(func1(data0) > 256){
const err7 = {instancePath:instancePath+"/capture_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func1(data0) < 1){
const err8 = {instancePath:instancePath+"/capture_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern5.test(data0)){
const err9 = {instancePath:instancePath+"/capture_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/capture_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.input_byte_length !== undefined){
let data1 = data.input_byte_length;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err11 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 9007199254740991 || isNaN(data1)){
const err12 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data1 < 0 || isNaN(data1)){
const err13 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
if(data.manifest_bytes_digest !== undefined){
let data2 = data.manifest_bytes_digest;
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
const err14 = {instancePath:instancePath+"/manifest_bytes_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/manifest_bytes_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.zip_directory_bytes_digest !== undefined){
let data3 = data.zip_directory_bytes_digest;
if(typeof data3 === "string"){
if(!pattern4.test(data3)){
const err16 = {instancePath:instancePath+"/zip_directory_bytes_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
else {
const err17 = {instancePath:instancePath+"/zip_directory_bytes_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.input_profile !== undefined){
let data4 = data.input_profile;
if(typeof data4 !== "string"){
const err18 = {instancePath:instancePath+"/input_profile",schemaPath:"#/$defs/SourceInputProfile06/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!((data4 === "public_sections06") || (data4 === "protected_logical_payload06"))){
const err19 = {instancePath:instancePath+"/input_profile",schemaPath:"#/$defs/SourceInputProfile06/enum",keyword:"enum",params:{allowedValues: schema50.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.identity_scope !== undefined){
let data5 = data.identity_scope;
if(typeof data5 !== "string"){
const err20 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if("observed_outer_metadata_before_source_materialization" !== data5){
const err21 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/const",keyword:"const",params:{allowedValue: "observed_outer_metadata_before_source_materialization"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
else {
const err22 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema51 = {"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"type":{"type":"string","const":"file"},"mode":{"$ref":"#/$defs/UInt"},"size":{"$ref":"#/$defs/UInt"}},"required":["name","type","mode","size"],"additionalProperties":false};
const schema52 = {"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"};
const pattern11 = new RegExp("^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$", "u");

function validate30(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate30.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.name === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.mode === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.size === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "size"},message:"must have required property '"+"size"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "name") || (key0 === "type")) || (key0 === "mode")) || (key0 === "size"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.name !== undefined){
let data0 = data.name;
if(typeof data0 === "string"){
if(func1(data0) > 4096){
const err5 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func1(data0) < 1){
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern11.test(data0)){
const err7 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
else {
const err8 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.type !== undefined){
let data1 = data.type;
if(typeof data1 !== "string"){
const err9 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if("file" !== data1){
const err10 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "file"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.mode !== undefined){
let data2 = data.mode;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err11 = {instancePath:instancePath+"/mode",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/mode",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err13 = {instancePath:instancePath+"/mode",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
if(data.size !== undefined){
let data3 = data.size;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err14 = {instancePath:instancePath+"/size",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
const err15 = {instancePath:instancePath+"/size",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err16 = {instancePath:instancePath+"/size",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
}
else {
const err17 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate23.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.contract === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract"},message:"must have required property '"+"contract"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.request === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request"},message:"must have required property '"+"request"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.request_digest === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_digest"},message:"must have required property '"+"request_digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.capture === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture"},message:"must have required property '"+"capture"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.source_inventory === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_inventory"},message:"must have required property '"+"source_inventory"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.output_intent === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "output_intent"},message:"must have required property '"+"output_intent"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "contract") || (key0 === "request")) || (key0 === "request_digest")) || (key0 === "capture")) || (key0 === "source_inventory")) || (key0 === "output_intent"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.contract !== undefined){
if(!(validate24(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
errors = vErrors.length;
}
}
if(data.request !== undefined){
if(!(validate26(data.request, {instancePath:instancePath+"/request",parentData:data,parentDataProperty:"request",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
}
if(data.request_digest !== undefined){
let data2 = data.request_digest;
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
const err7 = {instancePath:instancePath+"/request_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
else {
const err8 = {instancePath:instancePath+"/request_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.capture !== undefined){
if(!(validate28(data.capture, {instancePath:instancePath+"/capture",parentData:data,parentDataProperty:"capture",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
}
if(data.source_inventory !== undefined){
let data4 = data.source_inventory;
if(Array.isArray(data4)){
if(data4.length > 128){
const err9 = {instancePath:instancePath+"/source_inventory",schemaPath:"#/properties/source_inventory/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data4.length < 3){
const err10 = {instancePath:instancePath+"/source_inventory",schemaPath:"#/properties/source_inventory/minItems",keyword:"minItems",params:{limit: 3},message:"must NOT have fewer than 3 items"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate30(data4[i0], {instancePath:instancePath+"/source_inventory/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath:instancePath+"/source_inventory",schemaPath:"#/properties/source_inventory/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.output_intent !== undefined){
let data6 = data.output_intent;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.container === undefined){
const err12 = {instancePath:instancePath+"/output_intent",schemaPath:"#/properties/output_intent/required",keyword:"required",params:{missingProperty: "container"},message:"must have required property '"+"container"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data6.read === undefined){
const err13 = {instancePath:instancePath+"/output_intent",schemaPath:"#/properties/output_intent/required",keyword:"required",params:{missingProperty: "read"},message:"must have required property '"+"read"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data6.adoption === undefined){
const err14 = {instancePath:instancePath+"/output_intent",schemaPath:"#/properties/output_intent/required",keyword:"required",params:{missingProperty: "adoption"},message:"must have required property '"+"adoption"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 in data6){
if(!(((key1 === "container") || (key1 === "read")) || (key1 === "adoption"))){
const err15 = {instancePath:instancePath+"/output_intent",schemaPath:"#/properties/output_intent/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data6.container !== undefined){
let data7 = data6.container;
if(typeof data7 !== "string"){
const err16 = {instancePath:instancePath+"/output_intent/container",schemaPath:"#/properties/output_intent/properties/container/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if("0.6.0" !== data7){
const err17 = {instancePath:instancePath+"/output_intent/container",schemaPath:"#/properties/output_intent/properties/container/const",keyword:"const",params:{allowedValue: "0.6.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data6.read !== undefined){
let data8 = data6.read;
if(typeof data8 !== "string"){
const err18 = {instancePath:instancePath+"/output_intent/read",schemaPath:"#/properties/output_intent/properties/read/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if("kdna.read/0.7.0-candidate" !== data8){
const err19 = {instancePath:instancePath+"/output_intent/read",schemaPath:"#/properties/output_intent/properties/read/const",keyword:"const",params:{allowedValue: "kdna.read/0.7.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data6.adoption !== undefined){
let data9 = data6.adoption;
if(typeof data9 !== "string"){
const err20 = {instancePath:instancePath+"/output_intent/adoption",schemaPath:"#/properties/output_intent/properties/adoption/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if("not_observed" !== data9){
const err21 = {instancePath:instancePath+"/output_intent/adoption",schemaPath:"#/properties/output_intent/properties/adoption/const",keyword:"const",params:{allowedValue: "not_observed"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
else {
const err22 = {instancePath:instancePath+"/output_intent",schemaPath:"#/properties/output_intent/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
}
else {
const err23 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate22(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:migration06:SourceMigrationAuthorityContext06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate22.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate23(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.SourceMigrationCaptureRow06 = validate33;
const schema55 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:migration06:SourceMigrationCaptureRow06","title":"SourceMigrationCaptureRow06","description":"Candidate source-migration API structural data; opaque authorities are native-only.","$ref":"#/$defs/SourceMigrationCaptureRow06","$defs":{"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"SourceMigrationCaptureRow06":{"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"type":{"type":"string","const":"file"},"mode":{"$ref":"#/$defs/UInt"},"size":{"$ref":"#/$defs/UInt"}},"required":["name","type","mode","size"],"additionalProperties":false},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};

function validate34(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate34.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.name === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.mode === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.size === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "size"},message:"must have required property '"+"size"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "name") || (key0 === "type")) || (key0 === "mode")) || (key0 === "size"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.name !== undefined){
let data0 = data.name;
if(typeof data0 === "string"){
if(func1(data0) > 4096){
const err5 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func1(data0) < 1){
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern11.test(data0)){
const err7 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
else {
const err8 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.type !== undefined){
let data1 = data.type;
if(typeof data1 !== "string"){
const err9 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if("file" !== data1){
const err10 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "file"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.mode !== undefined){
let data2 = data.mode;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err11 = {instancePath:instancePath+"/mode",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/mode",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err13 = {instancePath:instancePath+"/mode",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
if(data.size !== undefined){
let data3 = data.size;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err14 = {instancePath:instancePath+"/size",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
const err15 = {instancePath:instancePath+"/size",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err16 = {instancePath:instancePath+"/size",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
}
else {
const err17 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate33(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:migration06:SourceMigrationCaptureRow06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate33.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate34(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate34.errors : vErrors.concat(validate34.errors);
errors = vErrors.length;
}
validate33.errors = vErrors;
return errors === 0;
}
validate33.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.SourceMigrationDiagnostic06 = validate36;
const schema60 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:migration06:SourceMigrationDiagnostic06","title":"SourceMigrationDiagnostic06","description":"Candidate source-migration API structural data; opaque authorities are native-only.","$ref":"#/$defs/SourceMigrationDiagnostic06","$defs":{"SourceMigrationDiagnostic06":{"type":"object","properties":{"code":{"type":"string","enum":["SOURCE_INPUT_INVALID","SOURCE_EXPECTED_ASSET_MISMATCH","SOURCE_PERMISSION_REJECTED","SOURCE_DEADLINE_EXCEEDED","SOURCE_CAPABILITY_UNAVAILABLE","MIGRATION_SOURCE_UNSUPPORTED_VERSION","MIGRATION_SOURCE_PROTECTED_UNSUPPORTED","MIGRATION_SOURCE_EXTENSION_UNSUPPORTED","MIGRATION_PAYLOAD_MISMATCH","MIGRATION_MANIFEST_MISMATCH","MIGRATION_ORIGIN_MISSING"]},"stage":{"type":"string","enum":["input","capture","admission","authorization","semantic","output","return"]}},"required":["code","stage"],"additionalProperties":false}}};
const schema61 = {"type":"object","properties":{"code":{"type":"string","enum":["SOURCE_INPUT_INVALID","SOURCE_EXPECTED_ASSET_MISMATCH","SOURCE_PERMISSION_REJECTED","SOURCE_DEADLINE_EXCEEDED","SOURCE_CAPABILITY_UNAVAILABLE","MIGRATION_SOURCE_UNSUPPORTED_VERSION","MIGRATION_SOURCE_PROTECTED_UNSUPPORTED","MIGRATION_SOURCE_EXTENSION_UNSUPPORTED","MIGRATION_PAYLOAD_MISMATCH","MIGRATION_MANIFEST_MISMATCH","MIGRATION_ORIGIN_MISSING"]},"stage":{"type":"string","enum":["input","capture","admission","authorization","semantic","output","return"]}},"required":["code","stage"],"additionalProperties":false};

function validate36(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:migration06:SourceMigrationDiagnostic06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate36.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.code === undefined){
const err0 = {instancePath,schemaPath:"#/$defs/SourceMigrationDiagnostic06/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.stage === undefined){
const err1 = {instancePath,schemaPath:"#/$defs/SourceMigrationDiagnostic06/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "code") || (key0 === "stage"))){
const err2 = {instancePath,schemaPath:"#/$defs/SourceMigrationDiagnostic06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.code !== undefined){
let data0 = data.code;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/code",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!(((((((((((data0 === "SOURCE_INPUT_INVALID") || (data0 === "SOURCE_EXPECTED_ASSET_MISMATCH")) || (data0 === "SOURCE_PERMISSION_REJECTED")) || (data0 === "SOURCE_DEADLINE_EXCEEDED")) || (data0 === "SOURCE_CAPABILITY_UNAVAILABLE")) || (data0 === "MIGRATION_SOURCE_UNSUPPORTED_VERSION")) || (data0 === "MIGRATION_SOURCE_PROTECTED_UNSUPPORTED")) || (data0 === "MIGRATION_SOURCE_EXTENSION_UNSUPPORTED")) || (data0 === "MIGRATION_PAYLOAD_MISMATCH")) || (data0 === "MIGRATION_MANIFEST_MISMATCH")) || (data0 === "MIGRATION_ORIGIN_MISSING"))){
const err4 = {instancePath:instancePath+"/code",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/code/enum",keyword:"enum",params:{allowedValues: schema61.properties.code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.stage !== undefined){
let data1 = data.stage;
if(typeof data1 !== "string"){
const err5 = {instancePath:instancePath+"/stage",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!(((((((data1 === "input") || (data1 === "capture")) || (data1 === "admission")) || (data1 === "authorization")) || (data1 === "semantic")) || (data1 === "output")) || (data1 === "return"))){
const err6 = {instancePath:instancePath+"/stage",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/stage/enum",keyword:"enum",params:{allowedValues: schema61.properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
else {
const err7 = {instancePath,schemaPath:"#/$defs/SourceMigrationDiagnostic06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate36.errors = vErrors;
return errors === 0;
}
validate36.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.SourceMigrationFailure06 = validate37;
const schema62 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:migration06:SourceMigrationFailure06","title":"SourceMigrationFailure06","description":"Candidate source-migration API structural data; opaque authorities are native-only.","$ref":"#/$defs/SourceMigrationFailure06","$defs":{"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"OriginalProtectionDisclosureFor06":{"oneOf":[{"type":"object","properties":{"kind":{"type":"string","const":"none"},"external_commit":{"$ref":"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06"}},"required":["kind","external_commit"],"additionalProperties":false},{"type":"object","properties":{"kind":{"type":"string","const":"trusted_host"},"at_ms":{"$ref":"#/$defs/UInt"},"external_commit":{"$ref":"#/$defs/OriginalProtectionExternalCommitFor06"}},"required":["kind","at_ms","external_commit"],"additionalProperties":false}]},"OriginalProtectionExternalCommitConfirmedFor06":{"type":"object","properties":{"state":{"type":"string","const":"confirmed"},"attempt_id":{"$ref":"#/$defs/Identifier"},"attempted_at_ms":{"$ref":"#/$defs/UInt"},"confirmed_at_ms":{"oneOf":[{"$ref":"#/$defs/UInt"},{"type":"null"}]}},"required":["state","attempt_id","attempted_at_ms","confirmed_at_ms"],"additionalProperties":false},"OriginalProtectionExternalCommitFor06":{"oneOf":[{"$ref":"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06"},{"$ref":"#/$defs/OriginalProtectionExternalCommitUnknownFor06"},{"$ref":"#/$defs/OriginalProtectionExternalCommitConfirmedFor06"}]},"OriginalProtectionExternalCommitNotInvokedFor06":{"type":"object","properties":{"state":{"type":"string","const":"not_invoked"}},"required":["state"],"additionalProperties":false},"OriginalProtectionExternalCommitUnknownFor06":{"type":"object","properties":{"state":{"type":"string","const":"outcome_unknown"},"attempt_id":{"$ref":"#/$defs/Identifier"},"attempted_at_ms":{"$ref":"#/$defs/UInt"}},"required":["state","attempt_id","attempted_at_ms"],"additionalProperties":false},"SourceMigrationDiagnostic06":{"type":"object","properties":{"code":{"type":"string","enum":["SOURCE_INPUT_INVALID","SOURCE_EXPECTED_ASSET_MISMATCH","SOURCE_PERMISSION_REJECTED","SOURCE_DEADLINE_EXCEEDED","SOURCE_CAPABILITY_UNAVAILABLE","MIGRATION_SOURCE_UNSUPPORTED_VERSION","MIGRATION_SOURCE_PROTECTED_UNSUPPORTED","MIGRATION_SOURCE_EXTENSION_UNSUPPORTED","MIGRATION_PAYLOAD_MISMATCH","MIGRATION_MANIFEST_MISMATCH","MIGRATION_ORIGIN_MISSING"]},"stage":{"type":"string","enum":["input","capture","admission","authorization","semantic","output","return"]}},"required":["code","stage"],"additionalProperties":false},"SourceMigrationFailure06":{"type":"object","properties":{"status":{"type":"string","const":"source_failed"},"diagnostic":{"$ref":"#/$defs/SourceMigrationDiagnostic06"},"disclosure":{"$ref":"#/$defs/OriginalProtectionDisclosureFor06"},"body":{"type":"null"},"body_bytes":{"type":"integer","const":0}},"required":["status","diagnostic","disclosure","body","body_bytes"],"additionalProperties":false},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};
const schema63 = {"type":"object","properties":{"status":{"type":"string","const":"source_failed"},"diagnostic":{"$ref":"#/$defs/SourceMigrationDiagnostic06"},"disclosure":{"$ref":"#/$defs/OriginalProtectionDisclosureFor06"},"body":{"type":"null"},"body_bytes":{"type":"integer","const":0}},"required":["status","diagnostic","disclosure","body","body_bytes"],"additionalProperties":false};
const schema65 = {"oneOf":[{"type":"object","properties":{"kind":{"type":"string","const":"none"},"external_commit":{"$ref":"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06"}},"required":["kind","external_commit"],"additionalProperties":false},{"type":"object","properties":{"kind":{"type":"string","const":"trusted_host"},"at_ms":{"$ref":"#/$defs/UInt"},"external_commit":{"$ref":"#/$defs/OriginalProtectionExternalCommitFor06"}},"required":["kind","at_ms","external_commit"],"additionalProperties":false}]};
const schema66 = {"type":"object","properties":{"state":{"type":"string","const":"not_invoked"}},"required":["state"],"additionalProperties":false};
const schema68 = {"oneOf":[{"$ref":"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06"},{"$ref":"#/$defs/OriginalProtectionExternalCommitUnknownFor06"},{"$ref":"#/$defs/OriginalProtectionExternalCommitConfirmedFor06"}]};
const schema70 = {"type":"object","properties":{"state":{"type":"string","const":"outcome_unknown"},"attempt_id":{"$ref":"#/$defs/Identifier"},"attempted_at_ms":{"$ref":"#/$defs/UInt"}},"required":["state","attempt_id","attempted_at_ms"],"additionalProperties":false};

function validate41(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate41.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.state === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.attempt_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "attempt_id"},message:"must have required property '"+"attempt_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.attempted_at_ms === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "attempted_at_ms"},message:"must have required property '"+"attempted_at_ms"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "state") || (key0 === "attempt_id")) || (key0 === "attempted_at_ms"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.state !== undefined){
let data0 = data.state;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("outcome_unknown" !== data0){
const err5 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/const",keyword:"const",params:{allowedValue: "outcome_unknown"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.attempt_id !== undefined){
let data1 = data.attempt_id;
if(typeof data1 === "string"){
if(func1(data1) > 256){
const err6 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data1) < 1){
const err7 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern5.test(data1)){
const err8 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.attempted_at_ms !== undefined){
let data2 = data.attempted_at_ms;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err10 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err11 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
}
else {
const err13 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
validate41.errors = vErrors;
return errors === 0;
}
validate41.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema73 = {"type":"object","properties":{"state":{"type":"string","const":"confirmed"},"attempt_id":{"$ref":"#/$defs/Identifier"},"attempted_at_ms":{"$ref":"#/$defs/UInt"},"confirmed_at_ms":{"oneOf":[{"$ref":"#/$defs/UInt"},{"type":"null"}]}},"required":["state","attempt_id","attempted_at_ms","confirmed_at_ms"],"additionalProperties":false};

function validate43(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate43.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.state === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.attempt_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "attempt_id"},message:"must have required property '"+"attempt_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.attempted_at_ms === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "attempted_at_ms"},message:"must have required property '"+"attempted_at_ms"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.confirmed_at_ms === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "confirmed_at_ms"},message:"must have required property '"+"confirmed_at_ms"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "state") || (key0 === "attempt_id")) || (key0 === "attempted_at_ms")) || (key0 === "confirmed_at_ms"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.state !== undefined){
let data0 = data.state;
if(typeof data0 !== "string"){
const err5 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("confirmed" !== data0){
const err6 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/const",keyword:"const",params:{allowedValue: "confirmed"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.attempt_id !== undefined){
let data1 = data.attempt_id;
if(typeof data1 === "string"){
if(func1(data1) > 256){
const err7 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func1(data1) < 1){
const err8 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern5.test(data1)){
const err9 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.attempted_at_ms !== undefined){
let data2 = data.attempted_at_ms;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err11 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err13 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
if(data.confirmed_at_ms !== undefined){
let data3 = data.confirmed_at_ms;
const _errs11 = errors;
let valid3 = false;
let passing0 = null;
const _errs12 = errors;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err14 = {instancePath:instancePath+"/confirmed_at_ms",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
const err15 = {instancePath:instancePath+"/confirmed_at_ms",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err16 = {instancePath:instancePath+"/confirmed_at_ms",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
var _valid0 = _errs12 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs15 = errors;
if(data3 !== null){
const err17 = {instancePath:instancePath+"/confirmed_at_ms",schemaPath:"#/properties/confirmed_at_ms/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
var _valid0 = _errs15 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
}
}
if(!valid3){
const err18 = {instancePath:instancePath+"/confirmed_at_ms",schemaPath:"#/properties/confirmed_at_ms/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
else {
errors = _errs11;
if(vErrors !== null){
if(_errs11){
vErrors.length = _errs11;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err19 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
validate43.errors = vErrors;
return errors === 0;
}
validate43.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate40(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate40.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.state === undefined){
const err0 = {instancePath,schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "state")){
const err1 = {instancePath,schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.state !== undefined){
let data0 = data.state;
if(typeof data0 !== "string"){
const err2 = {instancePath:instancePath+"/state",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/properties/state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if("not_invoked" !== data0){
const err3 = {instancePath:instancePath+"/state",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/properties/state/const",keyword:"const",params:{allowedValue: "not_invoked"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
}
else {
const err4 = {instancePath,schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs7 = errors;
if(!(validate41(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate41.errors : vErrors.concat(validate41.errors);
errors = vErrors.length;
}
var _valid0 = _errs7 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs8 = errors;
if(!(validate43(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate43.errors : vErrors.concat(validate43.errors);
errors = vErrors.length;
}
var _valid0 = _errs8 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
}
}
if(!valid0){
const err5 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate40.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate40.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate39(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate39.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.external_commit === undefined){
const err1 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "external_commit"},message:"must have required property '"+"external_commit"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "external_commit"))){
const err2 = {instancePath,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/0/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("none" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/0/properties/kind/const",keyword:"const",params:{allowedValue: "none"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.external_commit !== undefined){
let data1 = data.external_commit;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.state === undefined){
const err5 = {instancePath:instancePath+"/external_commit",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key1 in data1){
if(!(key1 === "state")){
const err6 = {instancePath:instancePath+"/external_commit",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data1.state !== undefined){
let data2 = data1.state;
if(typeof data2 !== "string"){
const err7 = {instancePath:instancePath+"/external_commit/state",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/properties/state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("not_invoked" !== data2){
const err8 = {instancePath:instancePath+"/external_commit/state",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/properties/state/const",keyword:"const",params:{allowedValue: "not_invoked"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
else {
const err9 = {instancePath:instancePath+"/external_commit",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs12 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err11 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.at_ms === undefined){
const err12 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "at_ms"},message:"must have required property '"+"at_ms"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.external_commit === undefined){
const err13 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "external_commit"},message:"must have required property '"+"external_commit"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key2 in data){
if(!(((key2 === "kind") || (key2 === "at_ms")) || (key2 === "external_commit"))){
const err14 = {instancePath,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.kind !== undefined){
let data3 = data.kind;
if(typeof data3 !== "string"){
const err15 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/1/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if("trusted_host" !== data3){
const err16 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/1/properties/kind/const",keyword:"const",params:{allowedValue: "trusted_host"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.at_ms !== undefined){
let data4 = data.at_ms;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err17 = {instancePath:instancePath+"/at_ms",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
const err18 = {instancePath:instancePath+"/at_ms",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err19 = {instancePath:instancePath+"/at_ms",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
if(data.external_commit !== undefined){
if(!(validate40(data.external_commit, {instancePath:instancePath+"/external_commit",parentData:data,parentDataProperty:"external_commit",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate40.errors : vErrors.concat(validate40.errors);
errors = vErrors.length;
}
}
}
else {
const err20 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid0 = _errs12 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
}
if(!valid0){
const err21 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate39.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate39.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate38(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate38.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.diagnostic === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "diagnostic"},message:"must have required property '"+"diagnostic"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.disclosure === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "disclosure"},message:"must have required property '"+"disclosure"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.body === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "body"},message:"must have required property '"+"body"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.body_bytes === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "body_bytes"},message:"must have required property '"+"body_bytes"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "status") || (key0 === "diagnostic")) || (key0 === "disclosure")) || (key0 === "body")) || (key0 === "body_bytes"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.status !== undefined){
let data0 = data.status;
if(typeof data0 !== "string"){
const err6 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if("source_failed" !== data0){
const err7 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "source_failed"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.diagnostic !== undefined){
let data1 = data.diagnostic;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err8 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceMigrationDiagnostic06/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1.stage === undefined){
const err9 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceMigrationDiagnostic06/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key1 in data1){
if(!((key1 === "code") || (key1 === "stage"))){
const err10 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceMigrationDiagnostic06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data1.code !== undefined){
let data2 = data1.code;
if(typeof data2 !== "string"){
const err11 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!(((((((((((data2 === "SOURCE_INPUT_INVALID") || (data2 === "SOURCE_EXPECTED_ASSET_MISMATCH")) || (data2 === "SOURCE_PERMISSION_REJECTED")) || (data2 === "SOURCE_DEADLINE_EXCEEDED")) || (data2 === "SOURCE_CAPABILITY_UNAVAILABLE")) || (data2 === "MIGRATION_SOURCE_UNSUPPORTED_VERSION")) || (data2 === "MIGRATION_SOURCE_PROTECTED_UNSUPPORTED")) || (data2 === "MIGRATION_SOURCE_EXTENSION_UNSUPPORTED")) || (data2 === "MIGRATION_PAYLOAD_MISMATCH")) || (data2 === "MIGRATION_MANIFEST_MISMATCH")) || (data2 === "MIGRATION_ORIGIN_MISSING"))){
const err12 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/code/enum",keyword:"enum",params:{allowedValues: schema61.properties.code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data1.stage !== undefined){
let data3 = data1.stage;
if(typeof data3 !== "string"){
const err13 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!(((((((data3 === "input") || (data3 === "capture")) || (data3 === "admission")) || (data3 === "authorization")) || (data3 === "semantic")) || (data3 === "output")) || (data3 === "return"))){
const err14 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/stage/enum",keyword:"enum",params:{allowedValues: schema61.properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
else {
const err15 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceMigrationDiagnostic06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.disclosure !== undefined){
if(!(validate39(data.disclosure, {instancePath:instancePath+"/disclosure",parentData:data,parentDataProperty:"disclosure",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
errors = vErrors.length;
}
}
if(data.body !== undefined){
if(data.body !== null){
const err16 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.body_bytes !== undefined){
let data6 = data.body_bytes;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err17 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/properties/body_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(0 !== data6){
const err18 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/properties/body_bytes/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
}
else {
const err19 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
validate38.errors = vErrors;
return errors === 0;
}
validate38.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate37(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:migration06:SourceMigrationFailure06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate37.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate38(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate38.errors : vErrors.concat(validate38.errors);
errors = vErrors.length;
}
validate37.errors = vErrors;
return errors === 0;
}
validate37.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.SourceMigrationObservation06 = validate48;
const schema77 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:migration06:SourceMigrationObservation06","title":"SourceMigrationObservation06","description":"Candidate source-migration API structural data; opaque authorities are native-only.","$ref":"#/$defs/SourceMigrationObservation06","$defs":{"Boolean":{"type":"boolean"},"CandidateVersionTuple06":{"type":"object","properties":{"container":{"const":"0.6.0","type":"string"},"payload_profile":{"const":"kdna.payload.judgment","type":"string"},"payload_version":{"const":"0.5.1","type":"string"},"core":{"const":"kdna.core/0.8.2","type":"string"},"ir":{"const":"kdna.canonical-ir/0.6.1","type":"string"},"runtime":{"const":"kdna.runtime-capsule/0.3.1","type":"string"},"plan":{"const":"kdna.consumption-plan/0.3.1","type":"string"},"host":{"const":"kdna.agent-host/0.3.1","type":"string"},"trace":{"const":"kdna.judgment-trace/0.3.1","type":"string"},"read":{"const":"kdna.read/0.7.0-candidate","type":"string"}},"required":["container","payload_profile","payload_version","core","ir","runtime","plan","host","trace","read"],"additionalProperties":false},"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"ManifestRuntime":{"type":"object","properties":{"mandatory_entries":{"type":"array","items":{"$ref":"#/$defs/RuntimeMandatoryEntryName"},"minItems":0,"uniqueItems":true}},"required":["mandatory_entries"],"additionalProperties":false},"PayloadDescriptor":{"type":"object","properties":{"path":{"const":"payload.kdnab","type":"string"},"encoding":{"const":"cbor","type":"string"},"encrypted":{"$ref":"#/$defs/Boolean"}},"required":["path","encoding","encrypted"],"additionalProperties":false},"RepresentationOrigin06":{"type":"object","properties":{"source_format_version":{"type":"string","const":"0.5.0"},"source_container_digest":{"$ref":"#/$defs/Digest"},"source_content_digest":{"$ref":"#/$defs/Digest"},"payload":{"$ref":"#/$defs/PayloadDescriptor"},"runtime":{"$ref":"#/$defs/ManifestRuntime"},"declared_content_digest":{"$ref":"#/$defs/Digest"},"declared_authoring_content_digest":{"$ref":"#/$defs/Digest"}},"required":["source_format_version","source_container_digest","source_content_digest","payload","runtime"],"additionalProperties":false},"RuntimeMandatoryEntryName":{"allOf":[{"$ref":"#/$defs/EntryName"},{"not":{"enum":["checksums.json","signature.kdsig","mimetype"]}},{"pattern":"^(?!build-receipt\\.json$)(?!reports/)(?!authoring/)"}]},"SourceMigrationObservation06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/SourceMigrationRouteContract06"},"request_digest":{"$ref":"#/$defs/Digest"},"capture_id":{"$ref":"#/$defs/Identifier"},"tuple":{"$ref":"#/$defs/CandidateVersionTuple06"},"source_A":{"$ref":"#/$defs/Digest"},"source_content_digest":{"$ref":"#/$defs/Digest"},"source_inventory":{"type":"array","items":{"$ref":"#/$defs/SourceRouteMemberInventory06"},"minItems":3,"maxItems":128},"output":{"type":"object","properties":{"A":{"$ref":"#/$defs/Digest"},"C":{"$ref":"#/$defs/Digest"},"E":{"$ref":"#/$defs/Digest"}},"required":["A","C","E"],"additionalProperties":false},"E_profile":{"type":"string","enum":["kdna.digest-basis.runtime-entry-set/0.3.0-candidate"]},"output_ir_digest":{"$ref":"#/$defs/Digest"},"member_actions":{"type":"array","items":{"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"action":{"type":"string","enum":["added","removed","replaced","preserved"]}},"required":["name","action"],"additionalProperties":false},"minItems":3,"maxItems":128},"origin":{"$ref":"#/$defs/RepresentationOrigin06"},"body_bytes":{"$ref":"#/$defs/UInt"},"proof":{"type":"string","const":"produced_bytes_with_confirmed_source_observation_not_consumer_read_or_adoption"}},"required":["contract","request_digest","capture_id","tuple","source_A","source_content_digest","source_inventory","output","E_profile","output_ir_digest","member_actions","origin","body_bytes","proof"],"additionalProperties":false},"SourceMigrationRouteContract06":{"type":"object","properties":{"id":{"type":"string","const":"kdna.source-migration/0.1.0-candidate"},"version":{"type":"string","const":"0.1.0-candidate"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false},"SourceRouteMemberInventory06":{"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"type":{"type":"string","const":"file"},"mode":{"$ref":"#/$defs/UInt"},"size":{"$ref":"#/$defs/UInt"},"sha256":{"$ref":"#/$defs/Digest"}},"required":["name","type","mode","size","sha256"],"additionalProperties":false},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};
const schema78 = {"type":"object","properties":{"contract":{"$ref":"#/$defs/SourceMigrationRouteContract06"},"request_digest":{"$ref":"#/$defs/Digest"},"capture_id":{"$ref":"#/$defs/Identifier"},"tuple":{"$ref":"#/$defs/CandidateVersionTuple06"},"source_A":{"$ref":"#/$defs/Digest"},"source_content_digest":{"$ref":"#/$defs/Digest"},"source_inventory":{"type":"array","items":{"$ref":"#/$defs/SourceRouteMemberInventory06"},"minItems":3,"maxItems":128},"output":{"type":"object","properties":{"A":{"$ref":"#/$defs/Digest"},"C":{"$ref":"#/$defs/Digest"},"E":{"$ref":"#/$defs/Digest"}},"required":["A","C","E"],"additionalProperties":false},"E_profile":{"type":"string","enum":["kdna.digest-basis.runtime-entry-set/0.3.0-candidate"]},"output_ir_digest":{"$ref":"#/$defs/Digest"},"member_actions":{"type":"array","items":{"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"action":{"type":"string","enum":["added","removed","replaced","preserved"]}},"required":["name","action"],"additionalProperties":false},"minItems":3,"maxItems":128},"origin":{"$ref":"#/$defs/RepresentationOrigin06"},"body_bytes":{"$ref":"#/$defs/UInt"},"proof":{"type":"string","const":"produced_bytes_with_confirmed_source_observation_not_consumer_read_or_adoption"}},"required":["contract","request_digest","capture_id","tuple","source_A","source_content_digest","source_inventory","output","E_profile","output_ir_digest","member_actions","origin","body_bytes","proof"],"additionalProperties":false};

function validate50(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate50.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.definition_digest === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "definition_digest"},message:"must have required property '"+"definition_digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "id") || (key0 === "version")) || (key0 === "definition_digest"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("kdna.source-migration/0.1.0-candidate" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.source-migration/0.1.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.version !== undefined){
let data1 = data.version;
if(typeof data1 !== "string"){
const err6 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if("0.1.0-candidate" !== data1){
const err7 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/const",keyword:"const",params:{allowedValue: "0.1.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.definition_digest !== undefined){
let data2 = data.definition_digest;
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
const err8 = {instancePath:instancePath+"/definition_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/definition_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
validate50.errors = vErrors;
return errors === 0;
}
validate50.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema86 = {"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"type":{"type":"string","const":"file"},"mode":{"$ref":"#/$defs/UInt"},"size":{"$ref":"#/$defs/UInt"},"sha256":{"$ref":"#/$defs/Digest"}},"required":["name","type","mode","size","sha256"],"additionalProperties":false};

function validate52(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate52.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.name === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.mode === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.size === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "size"},message:"must have required property '"+"size"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.sha256 === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "name") || (key0 === "type")) || (key0 === "mode")) || (key0 === "size")) || (key0 === "sha256"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.name !== undefined){
let data0 = data.name;
if(typeof data0 === "string"){
if(func1(data0) > 4096){
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data0) < 1){
const err7 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern11.test(data0)){
const err8 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.type !== undefined){
let data1 = data.type;
if(typeof data1 !== "string"){
const err10 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if("file" !== data1){
const err11 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "file"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.mode !== undefined){
let data2 = data.mode;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err12 = {instancePath:instancePath+"/mode",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err13 = {instancePath:instancePath+"/mode",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err14 = {instancePath:instancePath+"/mode",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
if(data.size !== undefined){
let data3 = data.size;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err15 = {instancePath:instancePath+"/size",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
const err16 = {instancePath:instancePath+"/size",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err17 = {instancePath:instancePath+"/size",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
if(data.sha256 !== undefined){
let data4 = data.sha256;
if(typeof data4 === "string"){
if(!pattern4.test(data4)){
const err18 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
else {
const err20 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
validate52.errors = vErrors;
return errors === 0;
}
validate52.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema96 = {"type":"object","properties":{"source_format_version":{"type":"string","const":"0.5.0"},"source_container_digest":{"$ref":"#/$defs/Digest"},"source_content_digest":{"$ref":"#/$defs/Digest"},"payload":{"$ref":"#/$defs/PayloadDescriptor"},"runtime":{"$ref":"#/$defs/ManifestRuntime"},"declared_content_digest":{"$ref":"#/$defs/Digest"},"declared_authoring_content_digest":{"$ref":"#/$defs/Digest"}},"required":["source_format_version","source_container_digest","source_content_digest","payload","runtime"],"additionalProperties":false};
const schema99 = {"type":"object","properties":{"path":{"const":"payload.kdnab","type":"string"},"encoding":{"const":"cbor","type":"string"},"encrypted":{"$ref":"#/$defs/Boolean"}},"required":["path","encoding","encrypted"],"additionalProperties":false};
const schema100 = {"type":"boolean"};

function validate55(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate55.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.path === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.encoding === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "encoding"},message:"must have required property '"+"encoding"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.encrypted === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "encrypted"},message:"must have required property '"+"encrypted"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "path") || (key0 === "encoding")) || (key0 === "encrypted"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.path !== undefined){
let data0 = data.path;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/path",schemaPath:"#/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("payload.kdnab" !== data0){
const err5 = {instancePath:instancePath+"/path",schemaPath:"#/properties/path/const",keyword:"const",params:{allowedValue: "payload.kdnab"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.encoding !== undefined){
let data1 = data.encoding;
if(typeof data1 !== "string"){
const err6 = {instancePath:instancePath+"/encoding",schemaPath:"#/properties/encoding/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if("cbor" !== data1){
const err7 = {instancePath:instancePath+"/encoding",schemaPath:"#/properties/encoding/const",keyword:"const",params:{allowedValue: "cbor"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.encrypted !== undefined){
if(typeof data.encrypted !== "boolean"){
const err8 = {instancePath:instancePath+"/encrypted",schemaPath:"#/$defs/Boolean/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
else {
const err9 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
validate55.errors = vErrors;
return errors === 0;
}
validate55.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema101 = {"type":"object","properties":{"mandatory_entries":{"type":"array","items":{"$ref":"#/$defs/RuntimeMandatoryEntryName"},"minItems":0,"uniqueItems":true}},"required":["mandatory_entries"],"additionalProperties":false};
const schema102 = {"allOf":[{"$ref":"#/$defs/EntryName"},{"not":{"enum":["checksums.json","signature.kdsig","mimetype"]}},{"pattern":"^(?!build-receipt\\.json$)(?!reports/)(?!authoring/)"}]};
const pattern30 = new RegExp("^(?!build-receipt\\.json$)(?!reports/)(?!authoring/)", "u");

function validate58(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate58.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func1(data) > 4096){
const err0 = {instancePath,schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func1(data) < 1){
const err1 = {instancePath,schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern11.test(data)){
const err2 = {instancePath,schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
else {
const err3 = {instancePath,schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
const _errs4 = errors;
const _errs5 = errors;
if(!(((data === "checksums.json") || (data === "signature.kdsig")) || (data === "mimetype"))){
const err4 = {};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var valid2 = _errs5 === errors;
if(valid2){
const err5 = {instancePath,schemaPath:"#/allOf/1/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
else {
errors = _errs4;
if(vErrors !== null){
if(_errs4){
vErrors.length = _errs4;
}
else {
vErrors = null;
}
}
}
if(typeof data === "string"){
if(!pattern30.test(data)){
const err6 = {instancePath,schemaPath:"#/allOf/2/pattern",keyword:"pattern",params:{pattern: "^(?!build-receipt\\.json$)(?!reports/)(?!authoring/)"},message:"must match pattern \""+"^(?!build-receipt\\.json$)(?!reports/)(?!authoring/)"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
validate58.errors = vErrors;
return errors === 0;
}
validate58.evaluated = {"dynamicProps":false,"dynamicItems":false};

const func0 = require("ajv/dist/runtime/equal").default;

function validate57(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate57.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.mandatory_entries === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mandatory_entries"},message:"must have required property '"+"mandatory_entries"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "mandatory_entries")){
const err1 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.mandatory_entries !== undefined){
let data0 = data.mandatory_entries;
if(Array.isArray(data0)){
if(data0.length < 0){
const err2 = {instancePath:instancePath+"/mandatory_entries",schemaPath:"#/properties/mandatory_entries/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
if(!(validate58(data0[i0], {instancePath:instancePath+"/mandatory_entries/" + i0,parentData:data0,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
errors = vErrors.length;
}
}
let i1 = data0.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data0[i1], data0[j0])){
const err3 = {instancePath:instancePath+"/mandatory_entries",schemaPath:"#/properties/mandatory_entries/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err4 = {instancePath:instancePath+"/mandatory_entries",schemaPath:"#/properties/mandatory_entries/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
}
else {
const err5 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
validate57.errors = vErrors;
return errors === 0;
}
validate57.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate54(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate54.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.source_format_version === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_format_version"},message:"must have required property '"+"source_format_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.source_container_digest === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_container_digest"},message:"must have required property '"+"source_container_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.source_content_digest === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_content_digest"},message:"must have required property '"+"source_content_digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.payload === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload"},message:"must have required property '"+"payload"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.runtime === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "runtime"},message:"must have required property '"+"runtime"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "source_format_version") || (key0 === "source_container_digest")) || (key0 === "source_content_digest")) || (key0 === "payload")) || (key0 === "runtime")) || (key0 === "declared_content_digest")) || (key0 === "declared_authoring_content_digest"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.source_format_version !== undefined){
let data0 = data.source_format_version;
if(typeof data0 !== "string"){
const err6 = {instancePath:instancePath+"/source_format_version",schemaPath:"#/properties/source_format_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if("0.5.0" !== data0){
const err7 = {instancePath:instancePath+"/source_format_version",schemaPath:"#/properties/source_format_version/const",keyword:"const",params:{allowedValue: "0.5.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.source_container_digest !== undefined){
let data1 = data.source_container_digest;
if(typeof data1 === "string"){
if(!pattern4.test(data1)){
const err8 = {instancePath:instancePath+"/source_container_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/source_container_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.source_content_digest !== undefined){
let data2 = data.source_content_digest;
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
const err10 = {instancePath:instancePath+"/source_content_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
else {
const err11 = {instancePath:instancePath+"/source_content_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.payload !== undefined){
if(!(validate55(data.payload, {instancePath:instancePath+"/payload",parentData:data,parentDataProperty:"payload",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
errors = vErrors.length;
}
}
if(data.runtime !== undefined){
if(!(validate57(data.runtime, {instancePath:instancePath+"/runtime",parentData:data,parentDataProperty:"runtime",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
errors = vErrors.length;
}
}
if(data.declared_content_digest !== undefined){
let data5 = data.declared_content_digest;
if(typeof data5 === "string"){
if(!pattern4.test(data5)){
const err12 = {instancePath:instancePath+"/declared_content_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
else {
const err13 = {instancePath:instancePath+"/declared_content_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.declared_authoring_content_digest !== undefined){
let data6 = data.declared_authoring_content_digest;
if(typeof data6 === "string"){
if(!pattern4.test(data6)){
const err14 = {instancePath:instancePath+"/declared_authoring_content_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/declared_authoring_content_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
}
else {
const err16 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
validate54.errors = vErrors;
return errors === 0;
}
validate54.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate49(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate49.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.contract === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract"},message:"must have required property '"+"contract"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.request_digest === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_digest"},message:"must have required property '"+"request_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.capture_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture_id"},message:"must have required property '"+"capture_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.tuple === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tuple"},message:"must have required property '"+"tuple"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.source_A === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_A"},message:"must have required property '"+"source_A"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.source_content_digest === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_content_digest"},message:"must have required property '"+"source_content_digest"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.source_inventory === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_inventory"},message:"must have required property '"+"source_inventory"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.output === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "output"},message:"must have required property '"+"output"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.E_profile === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "E_profile"},message:"must have required property '"+"E_profile"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.output_ir_digest === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "output_ir_digest"},message:"must have required property '"+"output_ir_digest"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.member_actions === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_actions"},message:"must have required property '"+"member_actions"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.origin === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "origin"},message:"must have required property '"+"origin"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.body_bytes === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "body_bytes"},message:"must have required property '"+"body_bytes"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.proof === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "proof"},message:"must have required property '"+"proof"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key0 in data){
if(!(func3.call(schema78.properties, key0))){
const err14 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.contract !== undefined){
if(!(validate50(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate50.errors : vErrors.concat(validate50.errors);
errors = vErrors.length;
}
}
if(data.request_digest !== undefined){
let data1 = data.request_digest;
if(typeof data1 === "string"){
if(!pattern4.test(data1)){
const err15 = {instancePath:instancePath+"/request_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
else {
const err16 = {instancePath:instancePath+"/request_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.capture_id !== undefined){
let data2 = data.capture_id;
if(typeof data2 === "string"){
if(func1(data2) > 256){
const err17 = {instancePath:instancePath+"/capture_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(func1(data2) < 1){
const err18 = {instancePath:instancePath+"/capture_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!pattern5.test(data2)){
const err19 = {instancePath:instancePath+"/capture_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
else {
const err20 = {instancePath:instancePath+"/capture_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.tuple !== undefined){
let data3 = data.tuple;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.container === undefined){
const err21 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "container"},message:"must have required property '"+"container"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data3.payload_profile === undefined){
const err22 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "payload_profile"},message:"must have required property '"+"payload_profile"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data3.payload_version === undefined){
const err23 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "payload_version"},message:"must have required property '"+"payload_version"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data3.core === undefined){
const err24 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "core"},message:"must have required property '"+"core"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data3.ir === undefined){
const err25 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "ir"},message:"must have required property '"+"ir"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data3.runtime === undefined){
const err26 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "runtime"},message:"must have required property '"+"runtime"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data3.plan === undefined){
const err27 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "plan"},message:"must have required property '"+"plan"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data3.host === undefined){
const err28 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "host"},message:"must have required property '"+"host"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data3.trace === undefined){
const err29 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "trace"},message:"must have required property '"+"trace"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data3.read === undefined){
const err30 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "read"},message:"must have required property '"+"read"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
for(const key1 in data3){
if(!(func3.call(schema41.properties, key1))){
const err31 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data3.container !== undefined){
let data4 = data3.container;
if(typeof data4 !== "string"){
const err32 = {instancePath:instancePath+"/tuple/container",schemaPath:"#/$defs/CandidateVersionTuple06/properties/container/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if("0.6.0" !== data4){
const err33 = {instancePath:instancePath+"/tuple/container",schemaPath:"#/$defs/CandidateVersionTuple06/properties/container/const",keyword:"const",params:{allowedValue: "0.6.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data3.payload_profile !== undefined){
let data5 = data3.payload_profile;
if(typeof data5 !== "string"){
const err34 = {instancePath:instancePath+"/tuple/payload_profile",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_profile/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if("kdna.payload.judgment" !== data5){
const err35 = {instancePath:instancePath+"/tuple/payload_profile",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_profile/const",keyword:"const",params:{allowedValue: "kdna.payload.judgment"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data3.payload_version !== undefined){
let data6 = data3.payload_version;
if(typeof data6 !== "string"){
const err36 = {instancePath:instancePath+"/tuple/payload_version",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if("0.5.1" !== data6){
const err37 = {instancePath:instancePath+"/tuple/payload_version",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_version/const",keyword:"const",params:{allowedValue: "0.5.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data3.core !== undefined){
let data7 = data3.core;
if(typeof data7 !== "string"){
const err38 = {instancePath:instancePath+"/tuple/core",schemaPath:"#/$defs/CandidateVersionTuple06/properties/core/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if("kdna.core/0.8.2" !== data7){
const err39 = {instancePath:instancePath+"/tuple/core",schemaPath:"#/$defs/CandidateVersionTuple06/properties/core/const",keyword:"const",params:{allowedValue: "kdna.core/0.8.2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data3.ir !== undefined){
let data8 = data3.ir;
if(typeof data8 !== "string"){
const err40 = {instancePath:instancePath+"/tuple/ir",schemaPath:"#/$defs/CandidateVersionTuple06/properties/ir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if("kdna.canonical-ir/0.6.1" !== data8){
const err41 = {instancePath:instancePath+"/tuple/ir",schemaPath:"#/$defs/CandidateVersionTuple06/properties/ir/const",keyword:"const",params:{allowedValue: "kdna.canonical-ir/0.6.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data3.runtime !== undefined){
let data9 = data3.runtime;
if(typeof data9 !== "string"){
const err42 = {instancePath:instancePath+"/tuple/runtime",schemaPath:"#/$defs/CandidateVersionTuple06/properties/runtime/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if("kdna.runtime-capsule/0.3.1" !== data9){
const err43 = {instancePath:instancePath+"/tuple/runtime",schemaPath:"#/$defs/CandidateVersionTuple06/properties/runtime/const",keyword:"const",params:{allowedValue: "kdna.runtime-capsule/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data3.plan !== undefined){
let data10 = data3.plan;
if(typeof data10 !== "string"){
const err44 = {instancePath:instancePath+"/tuple/plan",schemaPath:"#/$defs/CandidateVersionTuple06/properties/plan/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if("kdna.consumption-plan/0.3.1" !== data10){
const err45 = {instancePath:instancePath+"/tuple/plan",schemaPath:"#/$defs/CandidateVersionTuple06/properties/plan/const",keyword:"const",params:{allowedValue: "kdna.consumption-plan/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data3.host !== undefined){
let data11 = data3.host;
if(typeof data11 !== "string"){
const err46 = {instancePath:instancePath+"/tuple/host",schemaPath:"#/$defs/CandidateVersionTuple06/properties/host/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if("kdna.agent-host/0.3.1" !== data11){
const err47 = {instancePath:instancePath+"/tuple/host",schemaPath:"#/$defs/CandidateVersionTuple06/properties/host/const",keyword:"const",params:{allowedValue: "kdna.agent-host/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data3.trace !== undefined){
let data12 = data3.trace;
if(typeof data12 !== "string"){
const err48 = {instancePath:instancePath+"/tuple/trace",schemaPath:"#/$defs/CandidateVersionTuple06/properties/trace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if("kdna.judgment-trace/0.3.1" !== data12){
const err49 = {instancePath:instancePath+"/tuple/trace",schemaPath:"#/$defs/CandidateVersionTuple06/properties/trace/const",keyword:"const",params:{allowedValue: "kdna.judgment-trace/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data3.read !== undefined){
let data13 = data3.read;
if(typeof data13 !== "string"){
const err50 = {instancePath:instancePath+"/tuple/read",schemaPath:"#/$defs/CandidateVersionTuple06/properties/read/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if("kdna.read/0.7.0-candidate" !== data13){
const err51 = {instancePath:instancePath+"/tuple/read",schemaPath:"#/$defs/CandidateVersionTuple06/properties/read/const",keyword:"const",params:{allowedValue: "kdna.read/0.7.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
}
else {
const err52 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data.source_A !== undefined){
let data14 = data.source_A;
if(typeof data14 === "string"){
if(!pattern4.test(data14)){
const err53 = {instancePath:instancePath+"/source_A",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
else {
const err54 = {instancePath:instancePath+"/source_A",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data.source_content_digest !== undefined){
let data15 = data.source_content_digest;
if(typeof data15 === "string"){
if(!pattern4.test(data15)){
const err55 = {instancePath:instancePath+"/source_content_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
else {
const err56 = {instancePath:instancePath+"/source_content_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data.source_inventory !== undefined){
let data16 = data.source_inventory;
if(Array.isArray(data16)){
if(data16.length > 128){
const err57 = {instancePath:instancePath+"/source_inventory",schemaPath:"#/properties/source_inventory/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data16.length < 3){
const err58 = {instancePath:instancePath+"/source_inventory",schemaPath:"#/properties/source_inventory/minItems",keyword:"minItems",params:{limit: 3},message:"must NOT have fewer than 3 items"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
const len0 = data16.length;
for(let i0=0; i0<len0; i0++){
if(!(validate52(data16[i0], {instancePath:instancePath+"/source_inventory/" + i0,parentData:data16,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
errors = vErrors.length;
}
}
}
else {
const err59 = {instancePath:instancePath+"/source_inventory",schemaPath:"#/properties/source_inventory/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data.output !== undefined){
let data18 = data.output;
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
if(data18.A === undefined){
const err60 = {instancePath:instancePath+"/output",schemaPath:"#/properties/output/required",keyword:"required",params:{missingProperty: "A"},message:"must have required property '"+"A"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data18.C === undefined){
const err61 = {instancePath:instancePath+"/output",schemaPath:"#/properties/output/required",keyword:"required",params:{missingProperty: "C"},message:"must have required property '"+"C"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data18.E === undefined){
const err62 = {instancePath:instancePath+"/output",schemaPath:"#/properties/output/required",keyword:"required",params:{missingProperty: "E"},message:"must have required property '"+"E"+"'"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
for(const key2 in data18){
if(!(((key2 === "A") || (key2 === "C")) || (key2 === "E"))){
const err63 = {instancePath:instancePath+"/output",schemaPath:"#/properties/output/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data18.A !== undefined){
let data19 = data18.A;
if(typeof data19 === "string"){
if(!pattern4.test(data19)){
const err64 = {instancePath:instancePath+"/output/A",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
else {
const err65 = {instancePath:instancePath+"/output/A",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(data18.C !== undefined){
let data20 = data18.C;
if(typeof data20 === "string"){
if(!pattern4.test(data20)){
const err66 = {instancePath:instancePath+"/output/C",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
else {
const err67 = {instancePath:instancePath+"/output/C",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data18.E !== undefined){
let data21 = data18.E;
if(typeof data21 === "string"){
if(!pattern4.test(data21)){
const err68 = {instancePath:instancePath+"/output/E",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
else {
const err69 = {instancePath:instancePath+"/output/E",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
}
else {
const err70 = {instancePath:instancePath+"/output",schemaPath:"#/properties/output/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data.E_profile !== undefined){
let data22 = data.E_profile;
if(typeof data22 !== "string"){
const err71 = {instancePath:instancePath+"/E_profile",schemaPath:"#/properties/E_profile/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(!(data22 === "kdna.digest-basis.runtime-entry-set/0.3.0-candidate")){
const err72 = {instancePath:instancePath+"/E_profile",schemaPath:"#/properties/E_profile/enum",keyword:"enum",params:{allowedValues: schema78.properties.E_profile.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data.output_ir_digest !== undefined){
let data23 = data.output_ir_digest;
if(typeof data23 === "string"){
if(!pattern4.test(data23)){
const err73 = {instancePath:instancePath+"/output_ir_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
else {
const err74 = {instancePath:instancePath+"/output_ir_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data.member_actions !== undefined){
let data24 = data.member_actions;
if(Array.isArray(data24)){
if(data24.length > 128){
const err75 = {instancePath:instancePath+"/member_actions",schemaPath:"#/properties/member_actions/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(data24.length < 3){
const err76 = {instancePath:instancePath+"/member_actions",schemaPath:"#/properties/member_actions/minItems",keyword:"minItems",params:{limit: 3},message:"must NOT have fewer than 3 items"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
const len1 = data24.length;
for(let i1=0; i1<len1; i1++){
let data25 = data24[i1];
if(data25 && typeof data25 == "object" && !Array.isArray(data25)){
if(data25.name === undefined){
const err77 = {instancePath:instancePath+"/member_actions/" + i1,schemaPath:"#/properties/member_actions/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(data25.action === undefined){
const err78 = {instancePath:instancePath+"/member_actions/" + i1,schemaPath:"#/properties/member_actions/items/required",keyword:"required",params:{missingProperty: "action"},message:"must have required property '"+"action"+"'"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
for(const key3 in data25){
if(!((key3 === "name") || (key3 === "action"))){
const err79 = {instancePath:instancePath+"/member_actions/" + i1,schemaPath:"#/properties/member_actions/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
if(data25.name !== undefined){
let data26 = data25.name;
if(typeof data26 === "string"){
if(func1(data26) > 4096){
const err80 = {instancePath:instancePath+"/member_actions/" + i1+"/name",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(func1(data26) < 1){
const err81 = {instancePath:instancePath+"/member_actions/" + i1+"/name",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(!pattern11.test(data26)){
const err82 = {instancePath:instancePath+"/member_actions/" + i1+"/name",schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
else {
const err83 = {instancePath:instancePath+"/member_actions/" + i1+"/name",schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
if(data25.action !== undefined){
let data27 = data25.action;
if(typeof data27 !== "string"){
const err84 = {instancePath:instancePath+"/member_actions/" + i1+"/action",schemaPath:"#/properties/member_actions/items/properties/action/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(!((((data27 === "added") || (data27 === "removed")) || (data27 === "replaced")) || (data27 === "preserved"))){
const err85 = {instancePath:instancePath+"/member_actions/" + i1+"/action",schemaPath:"#/properties/member_actions/items/properties/action/enum",keyword:"enum",params:{allowedValues: schema78.properties.member_actions.items.properties.action.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
}
else {
const err86 = {instancePath:instancePath+"/member_actions/" + i1,schemaPath:"#/properties/member_actions/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
}
else {
const err87 = {instancePath:instancePath+"/member_actions",schemaPath:"#/properties/member_actions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(data.origin !== undefined){
if(!(validate54(data.origin, {instancePath:instancePath+"/origin",parentData:data,parentDataProperty:"origin",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate54.errors : vErrors.concat(validate54.errors);
errors = vErrors.length;
}
}
if(data.body_bytes !== undefined){
let data29 = data.body_bytes;
if(!(((typeof data29 == "number") && (!(data29 % 1) && !isNaN(data29))) && (isFinite(data29)))){
const err88 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if((typeof data29 == "number") && (isFinite(data29))){
if(data29 > 9007199254740991 || isNaN(data29)){
const err89 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(data29 < 0 || isNaN(data29)){
const err90 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
}
if(data.proof !== undefined){
let data30 = data.proof;
if(typeof data30 !== "string"){
const err91 = {instancePath:instancePath+"/proof",schemaPath:"#/properties/proof/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if("produced_bytes_with_confirmed_source_observation_not_consumer_read_or_adoption" !== data30){
const err92 = {instancePath:instancePath+"/proof",schemaPath:"#/properties/proof/const",keyword:"const",params:{allowedValue: "produced_bytes_with_confirmed_source_observation_not_consumer_read_or_adoption"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
}
else {
const err93 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
validate49.errors = vErrors;
return errors === 0;
}
validate49.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate48(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:migration06:SourceMigrationObservation06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate48.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate49(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate49.errors : vErrors.concat(validate49.errors);
errors = vErrors.length;
}
validate48.errors = vErrors;
return errors === 0;
}
validate48.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.SourceMigrationRequest06 = validate63;
const schema107 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:migration06:SourceMigrationRequest06","title":"SourceMigrationRequest06","description":"Candidate source-migration API structural data; opaque authorities are native-only.","$ref":"#/$defs/SourceMigrationRequest06","$defs":{"CandidateVersionTuple06":{"type":"object","properties":{"container":{"const":"0.6.0","type":"string"},"payload_profile":{"const":"kdna.payload.judgment","type":"string"},"payload_version":{"const":"0.5.1","type":"string"},"core":{"const":"kdna.core/0.8.2","type":"string"},"ir":{"const":"kdna.canonical-ir/0.6.1","type":"string"},"runtime":{"const":"kdna.runtime-capsule/0.3.1","type":"string"},"plan":{"const":"kdna.consumption-plan/0.3.1","type":"string"},"host":{"const":"kdna.agent-host/0.3.1","type":"string"},"trace":{"const":"kdna.judgment-trace/0.3.1","type":"string"},"read":{"const":"kdna.read/0.7.0-candidate","type":"string"}},"required":["container","payload_profile","payload_version","core","ir","runtime","plan","host","trace","read"],"additionalProperties":false},"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"SourceMigrationRequest06":{"type":"object","properties":{"request_id":{"$ref":"#/$defs/Identifier"},"tuple":{"$ref":"#/$defs/CandidateVersionTuple06"},"operation":{"type":"string","const":"migrate_public_source"},"source_expected_A":{"$ref":"#/$defs/Digest"},"timeout_ms":{"$ref":"#/$defs/UInt"},"signature_policy":{"type":"object","properties":{"requireSignature":{"type":"boolean","const":false},"expectedPublicKeyHex":{"type":"null"}},"required":["requireSignature","expectedPublicKeyHex"],"additionalProperties":false}},"required":["request_id","tuple","operation","source_expected_A","timeout_ms","signature_policy"],"additionalProperties":false},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};

function validate64(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate64.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.request_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_id"},message:"must have required property '"+"request_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.tuple === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tuple"},message:"must have required property '"+"tuple"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.operation === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation"},message:"must have required property '"+"operation"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.source_expected_A === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_expected_A"},message:"must have required property '"+"source_expected_A"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.timeout_ms === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "timeout_ms"},message:"must have required property '"+"timeout_ms"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.signature_policy === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "signature_policy"},message:"must have required property '"+"signature_policy"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "request_id") || (key0 === "tuple")) || (key0 === "operation")) || (key0 === "source_expected_A")) || (key0 === "timeout_ms")) || (key0 === "signature_policy"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.request_id !== undefined){
let data0 = data.request_id;
if(typeof data0 === "string"){
if(func1(data0) > 256){
const err7 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func1(data0) < 1){
const err8 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern5.test(data0)){
const err9 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.tuple !== undefined){
let data1 = data.tuple;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.container === undefined){
const err11 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "container"},message:"must have required property '"+"container"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data1.payload_profile === undefined){
const err12 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "payload_profile"},message:"must have required property '"+"payload_profile"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data1.payload_version === undefined){
const err13 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "payload_version"},message:"must have required property '"+"payload_version"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data1.core === undefined){
const err14 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "core"},message:"must have required property '"+"core"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data1.ir === undefined){
const err15 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "ir"},message:"must have required property '"+"ir"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data1.runtime === undefined){
const err16 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "runtime"},message:"must have required property '"+"runtime"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data1.plan === undefined){
const err17 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "plan"},message:"must have required property '"+"plan"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data1.host === undefined){
const err18 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "host"},message:"must have required property '"+"host"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data1.trace === undefined){
const err19 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "trace"},message:"must have required property '"+"trace"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data1.read === undefined){
const err20 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "read"},message:"must have required property '"+"read"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
for(const key1 in data1){
if(!(func3.call(schema41.properties, key1))){
const err21 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data1.container !== undefined){
let data2 = data1.container;
if(typeof data2 !== "string"){
const err22 = {instancePath:instancePath+"/tuple/container",schemaPath:"#/$defs/CandidateVersionTuple06/properties/container/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if("0.6.0" !== data2){
const err23 = {instancePath:instancePath+"/tuple/container",schemaPath:"#/$defs/CandidateVersionTuple06/properties/container/const",keyword:"const",params:{allowedValue: "0.6.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data1.payload_profile !== undefined){
let data3 = data1.payload_profile;
if(typeof data3 !== "string"){
const err24 = {instancePath:instancePath+"/tuple/payload_profile",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_profile/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if("kdna.payload.judgment" !== data3){
const err25 = {instancePath:instancePath+"/tuple/payload_profile",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_profile/const",keyword:"const",params:{allowedValue: "kdna.payload.judgment"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data1.payload_version !== undefined){
let data4 = data1.payload_version;
if(typeof data4 !== "string"){
const err26 = {instancePath:instancePath+"/tuple/payload_version",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if("0.5.1" !== data4){
const err27 = {instancePath:instancePath+"/tuple/payload_version",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_version/const",keyword:"const",params:{allowedValue: "0.5.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data1.core !== undefined){
let data5 = data1.core;
if(typeof data5 !== "string"){
const err28 = {instancePath:instancePath+"/tuple/core",schemaPath:"#/$defs/CandidateVersionTuple06/properties/core/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if("kdna.core/0.8.2" !== data5){
const err29 = {instancePath:instancePath+"/tuple/core",schemaPath:"#/$defs/CandidateVersionTuple06/properties/core/const",keyword:"const",params:{allowedValue: "kdna.core/0.8.2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data1.ir !== undefined){
let data6 = data1.ir;
if(typeof data6 !== "string"){
const err30 = {instancePath:instancePath+"/tuple/ir",schemaPath:"#/$defs/CandidateVersionTuple06/properties/ir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if("kdna.canonical-ir/0.6.1" !== data6){
const err31 = {instancePath:instancePath+"/tuple/ir",schemaPath:"#/$defs/CandidateVersionTuple06/properties/ir/const",keyword:"const",params:{allowedValue: "kdna.canonical-ir/0.6.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data1.runtime !== undefined){
let data7 = data1.runtime;
if(typeof data7 !== "string"){
const err32 = {instancePath:instancePath+"/tuple/runtime",schemaPath:"#/$defs/CandidateVersionTuple06/properties/runtime/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if("kdna.runtime-capsule/0.3.1" !== data7){
const err33 = {instancePath:instancePath+"/tuple/runtime",schemaPath:"#/$defs/CandidateVersionTuple06/properties/runtime/const",keyword:"const",params:{allowedValue: "kdna.runtime-capsule/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data1.plan !== undefined){
let data8 = data1.plan;
if(typeof data8 !== "string"){
const err34 = {instancePath:instancePath+"/tuple/plan",schemaPath:"#/$defs/CandidateVersionTuple06/properties/plan/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if("kdna.consumption-plan/0.3.1" !== data8){
const err35 = {instancePath:instancePath+"/tuple/plan",schemaPath:"#/$defs/CandidateVersionTuple06/properties/plan/const",keyword:"const",params:{allowedValue: "kdna.consumption-plan/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data1.host !== undefined){
let data9 = data1.host;
if(typeof data9 !== "string"){
const err36 = {instancePath:instancePath+"/tuple/host",schemaPath:"#/$defs/CandidateVersionTuple06/properties/host/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if("kdna.agent-host/0.3.1" !== data9){
const err37 = {instancePath:instancePath+"/tuple/host",schemaPath:"#/$defs/CandidateVersionTuple06/properties/host/const",keyword:"const",params:{allowedValue: "kdna.agent-host/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data1.trace !== undefined){
let data10 = data1.trace;
if(typeof data10 !== "string"){
const err38 = {instancePath:instancePath+"/tuple/trace",schemaPath:"#/$defs/CandidateVersionTuple06/properties/trace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if("kdna.judgment-trace/0.3.1" !== data10){
const err39 = {instancePath:instancePath+"/tuple/trace",schemaPath:"#/$defs/CandidateVersionTuple06/properties/trace/const",keyword:"const",params:{allowedValue: "kdna.judgment-trace/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data1.read !== undefined){
let data11 = data1.read;
if(typeof data11 !== "string"){
const err40 = {instancePath:instancePath+"/tuple/read",schemaPath:"#/$defs/CandidateVersionTuple06/properties/read/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if("kdna.read/0.7.0-candidate" !== data11){
const err41 = {instancePath:instancePath+"/tuple/read",schemaPath:"#/$defs/CandidateVersionTuple06/properties/read/const",keyword:"const",params:{allowedValue: "kdna.read/0.7.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
}
else {
const err42 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.operation !== undefined){
let data12 = data.operation;
if(typeof data12 !== "string"){
const err43 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if("migrate_public_source" !== data12){
const err44 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/const",keyword:"const",params:{allowedValue: "migrate_public_source"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data.source_expected_A !== undefined){
let data13 = data.source_expected_A;
if(typeof data13 === "string"){
if(!pattern4.test(data13)){
const err45 = {instancePath:instancePath+"/source_expected_A",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
else {
const err46 = {instancePath:instancePath+"/source_expected_A",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.timeout_ms !== undefined){
let data14 = data.timeout_ms;
if(!(((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14))) && (isFinite(data14)))){
const err47 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if((typeof data14 == "number") && (isFinite(data14))){
if(data14 > 9007199254740991 || isNaN(data14)){
const err48 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data14 < 0 || isNaN(data14)){
const err49 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
}
if(data.signature_policy !== undefined){
let data15 = data.signature_policy;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.requireSignature === undefined){
const err50 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/properties/signature_policy/required",keyword:"required",params:{missingProperty: "requireSignature"},message:"must have required property '"+"requireSignature"+"'"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data15.expectedPublicKeyHex === undefined){
const err51 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/properties/signature_policy/required",keyword:"required",params:{missingProperty: "expectedPublicKeyHex"},message:"must have required property '"+"expectedPublicKeyHex"+"'"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
for(const key2 in data15){
if(!((key2 === "requireSignature") || (key2 === "expectedPublicKeyHex"))){
const err52 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/properties/signature_policy/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data15.requireSignature !== undefined){
let data16 = data15.requireSignature;
if(typeof data16 !== "boolean"){
const err53 = {instancePath:instancePath+"/signature_policy/requireSignature",schemaPath:"#/properties/signature_policy/properties/requireSignature/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(false !== data16){
const err54 = {instancePath:instancePath+"/signature_policy/requireSignature",schemaPath:"#/properties/signature_policy/properties/requireSignature/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data15.expectedPublicKeyHex !== undefined){
if(data15.expectedPublicKeyHex !== null){
const err55 = {instancePath:instancePath+"/signature_policy/expectedPublicKeyHex",schemaPath:"#/properties/signature_policy/properties/expectedPublicKeyHex/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
}
else {
const err56 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/properties/signature_policy/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
}
else {
const err57 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
validate64.errors = vErrors;
return errors === 0;
}
validate64.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate63(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:migration06:SourceMigrationRequest06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate63.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate64(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate64.errors : vErrors.concat(validate64.errors);
errors = vErrors.length;
}
validate63.errors = vErrors;
return errors === 0;
}
validate63.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.SourceMigrationRequestAdmission06 = validate66;
const schema113 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:migration06:SourceMigrationRequestAdmission06","title":"SourceMigrationRequestAdmission06","description":"Candidate source-migration API structural data; opaque authorities are native-only.","$ref":"#/$defs/SourceMigrationRequestAdmission06","$defs":{"AdmittedSourceMigrationRequest06":false,"CoreAdmissionRejected":{"type":"object","properties":{"status":{"type":"string","const":"rejected"},"reason":{"$ref":"#/$defs/ReadDiagnosticCode"},"diagnostics":{"type":"array","items":{"$ref":"#/$defs/ReadDiagnostic"},"minItems":1,"maxItems":1},"states":{"$ref":"#/$defs/CoreStaticStates"},"component_failure":{"anyOf":[{"$ref":"#/$defs/CoreComponentFailure"},{"type":"null","const":null}]}},"required":["status","reason","diagnostics","states","component_failure"],"additionalProperties":false},"CoreComponentFailure":{"type":"object","properties":{"judgment_ref":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null","const":null}]},"component_ref":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null","const":null}]},"status":{"type":"string","const":"invalid"},"body":{"type":"null","const":null},"code":{"type":"string","enum":["READ_COMPONENT_DECLARATION_INVALID","READ_COMPONENT_CONTENT_INVALID","READ_COMPONENT_REFERENCE_INVALID","READ_COMPONENT_GRAPH_CYCLE","READ_COMPONENT_LIMIT_EXCEEDED","READ_COMPONENT_BINDING_INVALID","READ_COMPONENT_ADOPTION_INVALID","READ_METHOD_PRESENCE_INVALID"]}},"required":["judgment_ref","component_ref","status","body","code"],"additionalProperties":false},"CoreStaticStates":{"type":"object","properties":{"core":{"$ref":"#/$defs/TechnicalState"},"interpretation":{"$ref":"#/$defs/InterpretationState"}},"required":["core","interpretation"],"additionalProperties":false},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"InterpretationState":{"type":"string","enum":["not_evaluated","complete","degraded","blocked"]},"OriginalProtectionDisclosureFor06":{"oneOf":[{"type":"object","properties":{"kind":{"type":"string","const":"none"},"external_commit":{"$ref":"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06"}},"required":["kind","external_commit"],"additionalProperties":false},{"type":"object","properties":{"kind":{"type":"string","const":"trusted_host"},"at_ms":{"$ref":"#/$defs/UInt"},"external_commit":{"$ref":"#/$defs/OriginalProtectionExternalCommitFor06"}},"required":["kind","at_ms","external_commit"],"additionalProperties":false}]},"OriginalProtectionExternalCommitConfirmedFor06":{"type":"object","properties":{"state":{"type":"string","const":"confirmed"},"attempt_id":{"$ref":"#/$defs/Identifier"},"attempted_at_ms":{"$ref":"#/$defs/UInt"},"confirmed_at_ms":{"oneOf":[{"$ref":"#/$defs/UInt"},{"type":"null"}]}},"required":["state","attempt_id","attempted_at_ms","confirmed_at_ms"],"additionalProperties":false},"OriginalProtectionExternalCommitFor06":{"oneOf":[{"$ref":"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06"},{"$ref":"#/$defs/OriginalProtectionExternalCommitUnknownFor06"},{"$ref":"#/$defs/OriginalProtectionExternalCommitConfirmedFor06"}]},"OriginalProtectionExternalCommitNotInvokedFor06":{"type":"object","properties":{"state":{"type":"string","const":"not_invoked"}},"required":["state"],"additionalProperties":false},"OriginalProtectionExternalCommitUnknownFor06":{"type":"object","properties":{"state":{"type":"string","const":"outcome_unknown"},"attempt_id":{"$ref":"#/$defs/Identifier"},"attempted_at_ms":{"$ref":"#/$defs/UInt"}},"required":["state","attempt_id","attempted_at_ms"],"additionalProperties":false},"ReadDiagnostic":{"type":"object","properties":{"code":{"$ref":"#/$defs/ReadDiagnosticCode"},"stage":{"$ref":"#/$defs/ReadStage"},"severity":{"type":"string","enum":["error","warning"]},"subject":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null"}]},"field":{"anyOf":[{"$ref":"#/$defs/Text"},{"type":"null"}]}},"required":["code","stage","severity","subject","field"],"additionalProperties":false},"ReadDiagnosticCode":{"type":"string","enum":["READ_INPUT_INVALID","READ_SNAPSHOT_UNATTESTED","READ_CORE_CAPABILITY_UNAVAILABLE","READ_UNSUPPORTED_VERSION","READ_MIXED_VERSION_TUPLE","READ_CORE_INVALID","READ_INTERPRETATION_INCOMPLETE","READ_STATIC_POLICY_INVALID","READ_ASSET_MISMATCH","READ_ASSET_VERSION_MISMATCH","READ_SELECTION_NOT_FOUND","READ_SELECTION_AMBIGUOUS","READ_HANDLE_UNTRUSTED","READ_HANDLE_VERSION_MISMATCH","READ_HANDLE_STALE","READ_HANDLE_ASSET_MISMATCH","READ_HANDLE_SCOPE_MISMATCH","READ_HOST_CONTEXT_UNTRUSTED","READ_HOST_EPOCH_MISMATCH","READ_HOST_TIME_INVALID","READ_HANDLE_EXPIRED","READ_HOST_CONTEXT_EXPIRED","READ_HOST_DENIED","READ_SCOPE_DENIED","READ_PROJECTION_INVALID","READ_BUDGET_INSUFFICIENT","READ_COMPONENT_DECLARATION_INVALID","READ_COMPONENT_CONTENT_INVALID","READ_COMPONENT_REFERENCE_INVALID","READ_COMPONENT_GRAPH_CYCLE","READ_COMPONENT_LIMIT_EXCEEDED","READ_COMPONENT_BINDING_INVALID","READ_COMPONENT_ADOPTION_INVALID","READ_METHOD_PRESENCE_INVALID","READ_R2_STRUCTURE_INVALID","READ_R2_REFERENCE_INVALID","READ_R2_METHOD_INVALID","READ_R2_PLAN_INVALID","READ_R2_POLICY_INVALID","READ_R2_SCOPE_INVALID","READ_R2_EXAMPLE_INVALID","READ_R2_HISTORY_INVALID","READ_UNSUPPORTED_CRITICAL","READ_UNRESOLVED_EXTERNAL"]},"ReadStage":{"type":"string","enum":["input","version","core","selection","handle","host","projection","budget"]},"SourceMigrationDiagnostic06":{"type":"object","properties":{"code":{"type":"string","enum":["SOURCE_INPUT_INVALID","SOURCE_EXPECTED_ASSET_MISMATCH","SOURCE_PERMISSION_REJECTED","SOURCE_DEADLINE_EXCEEDED","SOURCE_CAPABILITY_UNAVAILABLE","MIGRATION_SOURCE_UNSUPPORTED_VERSION","MIGRATION_SOURCE_PROTECTED_UNSUPPORTED","MIGRATION_SOURCE_EXTENSION_UNSUPPORTED","MIGRATION_PAYLOAD_MISMATCH","MIGRATION_MANIFEST_MISMATCH","MIGRATION_ORIGIN_MISSING"]},"stage":{"type":"string","enum":["input","capture","admission","authorization","semantic","output","return"]}},"required":["code","stage"],"additionalProperties":false},"SourceMigrationFailure06":{"type":"object","properties":{"status":{"type":"string","const":"source_failed"},"diagnostic":{"$ref":"#/$defs/SourceMigrationDiagnostic06"},"disclosure":{"$ref":"#/$defs/OriginalProtectionDisclosureFor06"},"body":{"type":"null"},"body_bytes":{"type":"integer","const":0}},"required":["status","diagnostic","disclosure","body","body_bytes"],"additionalProperties":false},"SourceMigrationRequestAdmission06":{"oneOf":[{"type":"object","properties":{"status":{"type":"string","const":"admitted_request"},"request":{"$ref":"#/$defs/AdmittedSourceMigrationRequest06"}},"required":["status","request"],"additionalProperties":false},{"$ref":"#/$defs/SourceMigrationFailure06"},{"$ref":"#/$defs/SourceRouteCoreRejected06"}]},"SourceRouteCoreRejected06":{"type":"object","properties":{"status":{"type":"string","const":"core_rejected"},"stage":{"type":"string","enum":["input","capture","admission","output"]},"core":{"$ref":"#/$defs/CoreAdmissionRejected"},"disclosure":{"$ref":"#/$defs/OriginalProtectionDisclosureFor06"},"body":{"type":"null"},"body_bytes":{"type":"integer","const":0}},"required":["status","stage","core","disclosure","body","body_bytes"],"additionalProperties":false},"TechnicalState":{"type":"string","enum":["not_evaluated","valid","invalid"]},"Text":{"type":"string"},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};
const schema114 = {"oneOf":[{"type":"object","properties":{"status":{"type":"string","const":"admitted_request"},"request":{"$ref":"#/$defs/AdmittedSourceMigrationRequest06"}},"required":["status","request"],"additionalProperties":false},{"$ref":"#/$defs/SourceMigrationFailure06"},{"$ref":"#/$defs/SourceRouteCoreRejected06"}]};

function validate71(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate71.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.state === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.attempt_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "attempt_id"},message:"must have required property '"+"attempt_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.attempted_at_ms === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "attempted_at_ms"},message:"must have required property '"+"attempted_at_ms"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "state") || (key0 === "attempt_id")) || (key0 === "attempted_at_ms"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.state !== undefined){
let data0 = data.state;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("outcome_unknown" !== data0){
const err5 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/const",keyword:"const",params:{allowedValue: "outcome_unknown"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.attempt_id !== undefined){
let data1 = data.attempt_id;
if(typeof data1 === "string"){
if(func1(data1) > 256){
const err6 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data1) < 1){
const err7 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern5.test(data1)){
const err8 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.attempted_at_ms !== undefined){
let data2 = data.attempted_at_ms;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err10 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err11 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
}
else {
const err13 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
validate71.errors = vErrors;
return errors === 0;
}
validate71.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate73(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate73.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.state === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.attempt_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "attempt_id"},message:"must have required property '"+"attempt_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.attempted_at_ms === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "attempted_at_ms"},message:"must have required property '"+"attempted_at_ms"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.confirmed_at_ms === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "confirmed_at_ms"},message:"must have required property '"+"confirmed_at_ms"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "state") || (key0 === "attempt_id")) || (key0 === "attempted_at_ms")) || (key0 === "confirmed_at_ms"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.state !== undefined){
let data0 = data.state;
if(typeof data0 !== "string"){
const err5 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("confirmed" !== data0){
const err6 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/const",keyword:"const",params:{allowedValue: "confirmed"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.attempt_id !== undefined){
let data1 = data.attempt_id;
if(typeof data1 === "string"){
if(func1(data1) > 256){
const err7 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func1(data1) < 1){
const err8 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern5.test(data1)){
const err9 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.attempted_at_ms !== undefined){
let data2 = data.attempted_at_ms;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err11 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err13 = {instancePath:instancePath+"/attempted_at_ms",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
if(data.confirmed_at_ms !== undefined){
let data3 = data.confirmed_at_ms;
const _errs11 = errors;
let valid3 = false;
let passing0 = null;
const _errs12 = errors;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err14 = {instancePath:instancePath+"/confirmed_at_ms",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
const err15 = {instancePath:instancePath+"/confirmed_at_ms",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err16 = {instancePath:instancePath+"/confirmed_at_ms",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
var _valid0 = _errs12 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs15 = errors;
if(data3 !== null){
const err17 = {instancePath:instancePath+"/confirmed_at_ms",schemaPath:"#/properties/confirmed_at_ms/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
var _valid0 = _errs15 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
}
}
if(!valid3){
const err18 = {instancePath:instancePath+"/confirmed_at_ms",schemaPath:"#/properties/confirmed_at_ms/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
else {
errors = _errs11;
if(vErrors !== null){
if(_errs11){
vErrors.length = _errs11;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err19 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
validate73.errors = vErrors;
return errors === 0;
}
validate73.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate70(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate70.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.state === undefined){
const err0 = {instancePath,schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "state")){
const err1 = {instancePath,schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.state !== undefined){
let data0 = data.state;
if(typeof data0 !== "string"){
const err2 = {instancePath:instancePath+"/state",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/properties/state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if("not_invoked" !== data0){
const err3 = {instancePath:instancePath+"/state",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/properties/state/const",keyword:"const",params:{allowedValue: "not_invoked"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
}
else {
const err4 = {instancePath,schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs7 = errors;
if(!(validate71(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
errors = vErrors.length;
}
var _valid0 = _errs7 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs8 = errors;
if(!(validate73(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate73.errors : vErrors.concat(validate73.errors);
errors = vErrors.length;
}
var _valid0 = _errs8 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
}
}
if(!valid0){
const err5 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate70.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate70.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate69(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate69.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.external_commit === undefined){
const err1 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "external_commit"},message:"must have required property '"+"external_commit"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "external_commit"))){
const err2 = {instancePath,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/0/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("none" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/0/properties/kind/const",keyword:"const",params:{allowedValue: "none"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.external_commit !== undefined){
let data1 = data.external_commit;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.state === undefined){
const err5 = {instancePath:instancePath+"/external_commit",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key1 in data1){
if(!(key1 === "state")){
const err6 = {instancePath:instancePath+"/external_commit",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data1.state !== undefined){
let data2 = data1.state;
if(typeof data2 !== "string"){
const err7 = {instancePath:instancePath+"/external_commit/state",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/properties/state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("not_invoked" !== data2){
const err8 = {instancePath:instancePath+"/external_commit/state",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/properties/state/const",keyword:"const",params:{allowedValue: "not_invoked"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
else {
const err9 = {instancePath:instancePath+"/external_commit",schemaPath:"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs12 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err11 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.at_ms === undefined){
const err12 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "at_ms"},message:"must have required property '"+"at_ms"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.external_commit === undefined){
const err13 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "external_commit"},message:"must have required property '"+"external_commit"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key2 in data){
if(!(((key2 === "kind") || (key2 === "at_ms")) || (key2 === "external_commit"))){
const err14 = {instancePath,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.kind !== undefined){
let data3 = data.kind;
if(typeof data3 !== "string"){
const err15 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/1/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if("trusted_host" !== data3){
const err16 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/1/properties/kind/const",keyword:"const",params:{allowedValue: "trusted_host"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.at_ms !== undefined){
let data4 = data.at_ms;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err17 = {instancePath:instancePath+"/at_ms",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
const err18 = {instancePath:instancePath+"/at_ms",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err19 = {instancePath:instancePath+"/at_ms",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
if(data.external_commit !== undefined){
if(!(validate70(data.external_commit, {instancePath:instancePath+"/external_commit",parentData:data,parentDataProperty:"external_commit",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate70.errors : vErrors.concat(validate70.errors);
errors = vErrors.length;
}
}
}
else {
const err20 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid0 = _errs12 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
}
if(!valid0){
const err21 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate69.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate69.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate68(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate68.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.diagnostic === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "diagnostic"},message:"must have required property '"+"diagnostic"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.disclosure === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "disclosure"},message:"must have required property '"+"disclosure"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.body === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "body"},message:"must have required property '"+"body"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.body_bytes === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "body_bytes"},message:"must have required property '"+"body_bytes"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "status") || (key0 === "diagnostic")) || (key0 === "disclosure")) || (key0 === "body")) || (key0 === "body_bytes"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.status !== undefined){
let data0 = data.status;
if(typeof data0 !== "string"){
const err6 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if("source_failed" !== data0){
const err7 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "source_failed"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.diagnostic !== undefined){
let data1 = data.diagnostic;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err8 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceMigrationDiagnostic06/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1.stage === undefined){
const err9 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceMigrationDiagnostic06/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key1 in data1){
if(!((key1 === "code") || (key1 === "stage"))){
const err10 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceMigrationDiagnostic06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data1.code !== undefined){
let data2 = data1.code;
if(typeof data2 !== "string"){
const err11 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!(((((((((((data2 === "SOURCE_INPUT_INVALID") || (data2 === "SOURCE_EXPECTED_ASSET_MISMATCH")) || (data2 === "SOURCE_PERMISSION_REJECTED")) || (data2 === "SOURCE_DEADLINE_EXCEEDED")) || (data2 === "SOURCE_CAPABILITY_UNAVAILABLE")) || (data2 === "MIGRATION_SOURCE_UNSUPPORTED_VERSION")) || (data2 === "MIGRATION_SOURCE_PROTECTED_UNSUPPORTED")) || (data2 === "MIGRATION_SOURCE_EXTENSION_UNSUPPORTED")) || (data2 === "MIGRATION_PAYLOAD_MISMATCH")) || (data2 === "MIGRATION_MANIFEST_MISMATCH")) || (data2 === "MIGRATION_ORIGIN_MISSING"))){
const err12 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/code/enum",keyword:"enum",params:{allowedValues: schema61.properties.code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data1.stage !== undefined){
let data3 = data1.stage;
if(typeof data3 !== "string"){
const err13 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!(((((((data3 === "input") || (data3 === "capture")) || (data3 === "admission")) || (data3 === "authorization")) || (data3 === "semantic")) || (data3 === "output")) || (data3 === "return"))){
const err14 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/SourceMigrationDiagnostic06/properties/stage/enum",keyword:"enum",params:{allowedValues: schema61.properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
else {
const err15 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceMigrationDiagnostic06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.disclosure !== undefined){
if(!(validate69(data.disclosure, {instancePath:instancePath+"/disclosure",parentData:data,parentDataProperty:"disclosure",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate69.errors : vErrors.concat(validate69.errors);
errors = vErrors.length;
}
}
if(data.body !== undefined){
if(data.body !== null){
const err16 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.body_bytes !== undefined){
let data6 = data.body_bytes;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err17 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/properties/body_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(0 !== data6){
const err18 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/properties/body_bytes/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
}
else {
const err19 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
validate68.errors = vErrors;
return errors === 0;
}
validate68.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema130 = {"type":"object","properties":{"status":{"type":"string","const":"core_rejected"},"stage":{"type":"string","enum":["input","capture","admission","output"]},"core":{"$ref":"#/$defs/CoreAdmissionRejected"},"disclosure":{"$ref":"#/$defs/OriginalProtectionDisclosureFor06"},"body":{"type":"null"},"body_bytes":{"type":"integer","const":0}},"required":["status","stage","core","disclosure","body","body_bytes"],"additionalProperties":false};
const schema131 = {"type":"object","properties":{"status":{"type":"string","const":"rejected"},"reason":{"$ref":"#/$defs/ReadDiagnosticCode"},"diagnostics":{"type":"array","items":{"$ref":"#/$defs/ReadDiagnostic"},"minItems":1,"maxItems":1},"states":{"$ref":"#/$defs/CoreStaticStates"},"component_failure":{"anyOf":[{"$ref":"#/$defs/CoreComponentFailure"},{"type":"null","const":null}]}},"required":["status","reason","diagnostics","states","component_failure"],"additionalProperties":false};
const schema132 = {"type":"string","enum":["READ_INPUT_INVALID","READ_SNAPSHOT_UNATTESTED","READ_CORE_CAPABILITY_UNAVAILABLE","READ_UNSUPPORTED_VERSION","READ_MIXED_VERSION_TUPLE","READ_CORE_INVALID","READ_INTERPRETATION_INCOMPLETE","READ_STATIC_POLICY_INVALID","READ_ASSET_MISMATCH","READ_ASSET_VERSION_MISMATCH","READ_SELECTION_NOT_FOUND","READ_SELECTION_AMBIGUOUS","READ_HANDLE_UNTRUSTED","READ_HANDLE_VERSION_MISMATCH","READ_HANDLE_STALE","READ_HANDLE_ASSET_MISMATCH","READ_HANDLE_SCOPE_MISMATCH","READ_HOST_CONTEXT_UNTRUSTED","READ_HOST_EPOCH_MISMATCH","READ_HOST_TIME_INVALID","READ_HANDLE_EXPIRED","READ_HOST_CONTEXT_EXPIRED","READ_HOST_DENIED","READ_SCOPE_DENIED","READ_PROJECTION_INVALID","READ_BUDGET_INSUFFICIENT","READ_COMPONENT_DECLARATION_INVALID","READ_COMPONENT_CONTENT_INVALID","READ_COMPONENT_REFERENCE_INVALID","READ_COMPONENT_GRAPH_CYCLE","READ_COMPONENT_LIMIT_EXCEEDED","READ_COMPONENT_BINDING_INVALID","READ_COMPONENT_ADOPTION_INVALID","READ_METHOD_PRESENCE_INVALID","READ_R2_STRUCTURE_INVALID","READ_R2_REFERENCE_INVALID","READ_R2_METHOD_INVALID","READ_R2_PLAN_INVALID","READ_R2_POLICY_INVALID","READ_R2_SCOPE_INVALID","READ_R2_EXAMPLE_INVALID","READ_R2_HISTORY_INVALID","READ_UNSUPPORTED_CRITICAL","READ_UNRESOLVED_EXTERNAL"]};
const schema133 = {"type":"object","properties":{"code":{"$ref":"#/$defs/ReadDiagnosticCode"},"stage":{"$ref":"#/$defs/ReadStage"},"severity":{"type":"string","enum":["error","warning"]},"subject":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null"}]},"field":{"anyOf":[{"$ref":"#/$defs/Text"},{"type":"null"}]}},"required":["code","stage","severity","subject","field"],"additionalProperties":false};
const schema135 = {"type":"string","enum":["input","version","core","selection","handle","host","projection","budget"]};
const schema137 = {"type":"string"};

function validate80(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate80.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.code === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.stage === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.severity === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "severity"},message:"must have required property '"+"severity"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.subject === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "subject"},message:"must have required property '"+"subject"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.field === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "field"},message:"must have required property '"+"field"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "code") || (key0 === "stage")) || (key0 === "severity")) || (key0 === "subject")) || (key0 === "field"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.code !== undefined){
let data0 = data.code;
if(typeof data0 !== "string"){
const err6 = {instancePath:instancePath+"/code",schemaPath:"#/$defs/ReadDiagnosticCode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!((((((((((((((((((((((((((((((((((((((((((((data0 === "READ_INPUT_INVALID") || (data0 === "READ_SNAPSHOT_UNATTESTED")) || (data0 === "READ_CORE_CAPABILITY_UNAVAILABLE")) || (data0 === "READ_UNSUPPORTED_VERSION")) || (data0 === "READ_MIXED_VERSION_TUPLE")) || (data0 === "READ_CORE_INVALID")) || (data0 === "READ_INTERPRETATION_INCOMPLETE")) || (data0 === "READ_STATIC_POLICY_INVALID")) || (data0 === "READ_ASSET_MISMATCH")) || (data0 === "READ_ASSET_VERSION_MISMATCH")) || (data0 === "READ_SELECTION_NOT_FOUND")) || (data0 === "READ_SELECTION_AMBIGUOUS")) || (data0 === "READ_HANDLE_UNTRUSTED")) || (data0 === "READ_HANDLE_VERSION_MISMATCH")) || (data0 === "READ_HANDLE_STALE")) || (data0 === "READ_HANDLE_ASSET_MISMATCH")) || (data0 === "READ_HANDLE_SCOPE_MISMATCH")) || (data0 === "READ_HOST_CONTEXT_UNTRUSTED")) || (data0 === "READ_HOST_EPOCH_MISMATCH")) || (data0 === "READ_HOST_TIME_INVALID")) || (data0 === "READ_HANDLE_EXPIRED")) || (data0 === "READ_HOST_CONTEXT_EXPIRED")) || (data0 === "READ_HOST_DENIED")) || (data0 === "READ_SCOPE_DENIED")) || (data0 === "READ_PROJECTION_INVALID")) || (data0 === "READ_BUDGET_INSUFFICIENT")) || (data0 === "READ_COMPONENT_DECLARATION_INVALID")) || (data0 === "READ_COMPONENT_CONTENT_INVALID")) || (data0 === "READ_COMPONENT_REFERENCE_INVALID")) || (data0 === "READ_COMPONENT_GRAPH_CYCLE")) || (data0 === "READ_COMPONENT_LIMIT_EXCEEDED")) || (data0 === "READ_COMPONENT_BINDING_INVALID")) || (data0 === "READ_COMPONENT_ADOPTION_INVALID")) || (data0 === "READ_METHOD_PRESENCE_INVALID")) || (data0 === "READ_R2_STRUCTURE_INVALID")) || (data0 === "READ_R2_REFERENCE_INVALID")) || (data0 === "READ_R2_METHOD_INVALID")) || (data0 === "READ_R2_PLAN_INVALID")) || (data0 === "READ_R2_POLICY_INVALID")) || (data0 === "READ_R2_SCOPE_INVALID")) || (data0 === "READ_R2_EXAMPLE_INVALID")) || (data0 === "READ_R2_HISTORY_INVALID")) || (data0 === "READ_UNSUPPORTED_CRITICAL")) || (data0 === "READ_UNRESOLVED_EXTERNAL"))){
const err7 = {instancePath:instancePath+"/code",schemaPath:"#/$defs/ReadDiagnosticCode/enum",keyword:"enum",params:{allowedValues: schema132.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.stage !== undefined){
let data1 = data.stage;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/stage",schemaPath:"#/$defs/ReadStage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!((((((((data1 === "input") || (data1 === "version")) || (data1 === "core")) || (data1 === "selection")) || (data1 === "handle")) || (data1 === "host")) || (data1 === "projection")) || (data1 === "budget"))){
const err9 = {instancePath:instancePath+"/stage",schemaPath:"#/$defs/ReadStage/enum",keyword:"enum",params:{allowedValues: schema135.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.severity !== undefined){
let data2 = data.severity;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/severity",schemaPath:"#/properties/severity/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!((data2 === "error") || (data2 === "warning"))){
const err11 = {instancePath:instancePath+"/severity",schemaPath:"#/properties/severity/enum",keyword:"enum",params:{allowedValues: schema133.properties.severity.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.subject !== undefined){
let data3 = data.subject;
const _errs11 = errors;
let valid3 = false;
const _errs12 = errors;
if(typeof data3 === "string"){
if(func1(data3) > 256){
const err12 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func1(data3) < 1){
const err13 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern5.test(data3)){
const err14 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs12 === errors;
valid3 = valid3 || _valid0;
const _errs15 = errors;
if(data3 !== null){
const err16 = {instancePath:instancePath+"/subject",schemaPath:"#/properties/subject/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
var _valid0 = _errs15 === errors;
valid3 = valid3 || _valid0;
if(!valid3){
const err17 = {instancePath:instancePath+"/subject",schemaPath:"#/properties/subject/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
else {
errors = _errs11;
if(vErrors !== null){
if(_errs11){
vErrors.length = _errs11;
}
else {
vErrors = null;
}
}
}
}
if(data.field !== undefined){
let data4 = data.field;
const _errs18 = errors;
let valid5 = false;
const _errs19 = errors;
if(typeof data4 !== "string"){
const err18 = {instancePath:instancePath+"/field",schemaPath:"#/$defs/Text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid1 = _errs19 === errors;
valid5 = valid5 || _valid1;
const _errs22 = errors;
if(data4 !== null){
const err19 = {instancePath:instancePath+"/field",schemaPath:"#/properties/field/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid1 = _errs22 === errors;
valid5 = valid5 || _valid1;
if(!valid5){
const err20 = {instancePath:instancePath+"/field",schemaPath:"#/properties/field/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
else {
errors = _errs18;
if(vErrors !== null){
if(_errs18){
vErrors.length = _errs18;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err21 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
validate80.errors = vErrors;
return errors === 0;
}
validate80.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema138 = {"type":"object","properties":{"core":{"$ref":"#/$defs/TechnicalState"},"interpretation":{"$ref":"#/$defs/InterpretationState"}},"required":["core","interpretation"],"additionalProperties":false};
const schema139 = {"type":"string","enum":["not_evaluated","valid","invalid"]};
const schema140 = {"type":"string","enum":["not_evaluated","complete","degraded","blocked"]};

function validate82(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate82.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.core === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "core"},message:"must have required property '"+"core"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.interpretation === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "interpretation"},message:"must have required property '"+"interpretation"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "core") || (key0 === "interpretation"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.core !== undefined){
let data0 = data.core;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/core",schemaPath:"#/$defs/TechnicalState/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!(((data0 === "not_evaluated") || (data0 === "valid")) || (data0 === "invalid"))){
const err4 = {instancePath:instancePath+"/core",schemaPath:"#/$defs/TechnicalState/enum",keyword:"enum",params:{allowedValues: schema139.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.interpretation !== undefined){
let data1 = data.interpretation;
if(typeof data1 !== "string"){
const err5 = {instancePath:instancePath+"/interpretation",schemaPath:"#/$defs/InterpretationState/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!((((data1 === "not_evaluated") || (data1 === "complete")) || (data1 === "degraded")) || (data1 === "blocked"))){
const err6 = {instancePath:instancePath+"/interpretation",schemaPath:"#/$defs/InterpretationState/enum",keyword:"enum",params:{allowedValues: schema140.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
else {
const err7 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate82.errors = vErrors;
return errors === 0;
}
validate82.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema141 = {"type":"object","properties":{"judgment_ref":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null","const":null}]},"component_ref":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null","const":null}]},"status":{"type":"string","const":"invalid"},"body":{"type":"null","const":null},"code":{"type":"string","enum":["READ_COMPONENT_DECLARATION_INVALID","READ_COMPONENT_CONTENT_INVALID","READ_COMPONENT_REFERENCE_INVALID","READ_COMPONENT_GRAPH_CYCLE","READ_COMPONENT_LIMIT_EXCEEDED","READ_COMPONENT_BINDING_INVALID","READ_COMPONENT_ADOPTION_INVALID","READ_METHOD_PRESENCE_INVALID"]}},"required":["judgment_ref","component_ref","status","body","code"],"additionalProperties":false};

function validate84(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate84.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.judgment_ref === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "judgment_ref"},message:"must have required property '"+"judgment_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.component_ref === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "component_ref"},message:"must have required property '"+"component_ref"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.status === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.body === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "body"},message:"must have required property '"+"body"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.code === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "judgment_ref") || (key0 === "component_ref")) || (key0 === "status")) || (key0 === "body")) || (key0 === "code"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.judgment_ref !== undefined){
let data0 = data.judgment_ref;
const _errs3 = errors;
let valid1 = false;
const _errs4 = errors;
if(typeof data0 === "string"){
if(func1(data0) > 256){
const err6 = {instancePath:instancePath+"/judgment_ref",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data0) < 1){
const err7 = {instancePath:instancePath+"/judgment_ref",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern5.test(data0)){
const err8 = {instancePath:instancePath+"/judgment_ref",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/judgment_ref",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid0 = _errs4 === errors;
valid1 = valid1 || _valid0;
const _errs7 = errors;
if(data0 !== null){
const err10 = {instancePath:instancePath+"/judgment_ref",schemaPath:"#/properties/judgment_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(null !== data0){
const err11 = {instancePath:instancePath+"/judgment_ref",schemaPath:"#/properties/judgment_ref/anyOf/1/const",keyword:"const",params:{allowedValue: schema141.properties.judgment_ref.anyOf[1].const},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err12 = {instancePath:instancePath+"/judgment_ref",schemaPath:"#/properties/judgment_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
else {
errors = _errs3;
if(vErrors !== null){
if(_errs3){
vErrors.length = _errs3;
}
else {
vErrors = null;
}
}
}
}
if(data.component_ref !== undefined){
let data1 = data.component_ref;
const _errs10 = errors;
let valid3 = false;
const _errs11 = errors;
if(typeof data1 === "string"){
if(func1(data1) > 256){
const err13 = {instancePath:instancePath+"/component_ref",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func1(data1) < 1){
const err14 = {instancePath:instancePath+"/component_ref",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!pattern5.test(data1)){
const err15 = {instancePath:instancePath+"/component_ref",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
else {
const err16 = {instancePath:instancePath+"/component_ref",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
var _valid1 = _errs11 === errors;
valid3 = valid3 || _valid1;
const _errs14 = errors;
if(data1 !== null){
const err17 = {instancePath:instancePath+"/component_ref",schemaPath:"#/properties/component_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(null !== data1){
const err18 = {instancePath:instancePath+"/component_ref",schemaPath:"#/properties/component_ref/anyOf/1/const",keyword:"const",params:{allowedValue: schema141.properties.component_ref.anyOf[1].const},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid1 = _errs14 === errors;
valid3 = valid3 || _valid1;
if(!valid3){
const err19 = {instancePath:instancePath+"/component_ref",schemaPath:"#/properties/component_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
else {
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
}
}
if(data.status !== undefined){
let data2 = data.status;
if(typeof data2 !== "string"){
const err20 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if("invalid" !== data2){
const err21 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "invalid"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.body !== undefined){
let data3 = data.body;
if(data3 !== null){
const err22 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(null !== data3){
const err23 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/const",keyword:"const",params:{allowedValue: schema141.properties.body.const},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.code !== undefined){
let data4 = data.code;
if(typeof data4 !== "string"){
const err24 = {instancePath:instancePath+"/code",schemaPath:"#/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!((((((((data4 === "READ_COMPONENT_DECLARATION_INVALID") || (data4 === "READ_COMPONENT_CONTENT_INVALID")) || (data4 === "READ_COMPONENT_REFERENCE_INVALID")) || (data4 === "READ_COMPONENT_GRAPH_CYCLE")) || (data4 === "READ_COMPONENT_LIMIT_EXCEEDED")) || (data4 === "READ_COMPONENT_BINDING_INVALID")) || (data4 === "READ_COMPONENT_ADOPTION_INVALID")) || (data4 === "READ_METHOD_PRESENCE_INVALID"))){
const err25 = {instancePath:instancePath+"/code",schemaPath:"#/properties/code/enum",keyword:"enum",params:{allowedValues: schema141.properties.code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
else {
const err26 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
validate84.errors = vErrors;
return errors === 0;
}
validate84.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate79(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate79.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.reason === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.diagnostics === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "diagnostics"},message:"must have required property '"+"diagnostics"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.states === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "states"},message:"must have required property '"+"states"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.component_failure === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "component_failure"},message:"must have required property '"+"component_failure"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "status") || (key0 === "reason")) || (key0 === "diagnostics")) || (key0 === "states")) || (key0 === "component_failure"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.status !== undefined){
let data0 = data.status;
if(typeof data0 !== "string"){
const err6 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if("rejected" !== data0){
const err7 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "rejected"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.reason !== undefined){
let data1 = data.reason;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/ReadDiagnosticCode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!((((((((((((((((((((((((((((((((((((((((((((data1 === "READ_INPUT_INVALID") || (data1 === "READ_SNAPSHOT_UNATTESTED")) || (data1 === "READ_CORE_CAPABILITY_UNAVAILABLE")) || (data1 === "READ_UNSUPPORTED_VERSION")) || (data1 === "READ_MIXED_VERSION_TUPLE")) || (data1 === "READ_CORE_INVALID")) || (data1 === "READ_INTERPRETATION_INCOMPLETE")) || (data1 === "READ_STATIC_POLICY_INVALID")) || (data1 === "READ_ASSET_MISMATCH")) || (data1 === "READ_ASSET_VERSION_MISMATCH")) || (data1 === "READ_SELECTION_NOT_FOUND")) || (data1 === "READ_SELECTION_AMBIGUOUS")) || (data1 === "READ_HANDLE_UNTRUSTED")) || (data1 === "READ_HANDLE_VERSION_MISMATCH")) || (data1 === "READ_HANDLE_STALE")) || (data1 === "READ_HANDLE_ASSET_MISMATCH")) || (data1 === "READ_HANDLE_SCOPE_MISMATCH")) || (data1 === "READ_HOST_CONTEXT_UNTRUSTED")) || (data1 === "READ_HOST_EPOCH_MISMATCH")) || (data1 === "READ_HOST_TIME_INVALID")) || (data1 === "READ_HANDLE_EXPIRED")) || (data1 === "READ_HOST_CONTEXT_EXPIRED")) || (data1 === "READ_HOST_DENIED")) || (data1 === "READ_SCOPE_DENIED")) || (data1 === "READ_PROJECTION_INVALID")) || (data1 === "READ_BUDGET_INSUFFICIENT")) || (data1 === "READ_COMPONENT_DECLARATION_INVALID")) || (data1 === "READ_COMPONENT_CONTENT_INVALID")) || (data1 === "READ_COMPONENT_REFERENCE_INVALID")) || (data1 === "READ_COMPONENT_GRAPH_CYCLE")) || (data1 === "READ_COMPONENT_LIMIT_EXCEEDED")) || (data1 === "READ_COMPONENT_BINDING_INVALID")) || (data1 === "READ_COMPONENT_ADOPTION_INVALID")) || (data1 === "READ_METHOD_PRESENCE_INVALID")) || (data1 === "READ_R2_STRUCTURE_INVALID")) || (data1 === "READ_R2_REFERENCE_INVALID")) || (data1 === "READ_R2_METHOD_INVALID")) || (data1 === "READ_R2_PLAN_INVALID")) || (data1 === "READ_R2_POLICY_INVALID")) || (data1 === "READ_R2_SCOPE_INVALID")) || (data1 === "READ_R2_EXAMPLE_INVALID")) || (data1 === "READ_R2_HISTORY_INVALID")) || (data1 === "READ_UNSUPPORTED_CRITICAL")) || (data1 === "READ_UNRESOLVED_EXTERNAL"))){
const err9 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/ReadDiagnosticCode/enum",keyword:"enum",params:{allowedValues: schema132.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.diagnostics !== undefined){
let data2 = data.diagnostics;
if(Array.isArray(data2)){
if(data2.length > 1){
const err10 = {instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/maxItems",keyword:"maxItems",params:{limit: 1},message:"must NOT have more than 1 items"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data2.length < 1){
const err11 = {instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
if(!(validate80(data2[i0], {instancePath:instancePath+"/diagnostics/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
}
}
else {
const err12 = {instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.states !== undefined){
if(!(validate82(data.states, {instancePath:instancePath+"/states",parentData:data,parentDataProperty:"states",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate82.errors : vErrors.concat(validate82.errors);
errors = vErrors.length;
}
}
if(data.component_failure !== undefined){
let data5 = data.component_failure;
const _errs12 = errors;
let valid4 = false;
const _errs13 = errors;
if(!(validate84(data5, {instancePath:instancePath+"/component_failure",parentData:data,parentDataProperty:"component_failure",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate84.errors : vErrors.concat(validate84.errors);
errors = vErrors.length;
}
var _valid0 = _errs13 === errors;
valid4 = valid4 || _valid0;
const _errs14 = errors;
if(data5 !== null){
const err13 = {instancePath:instancePath+"/component_failure",schemaPath:"#/properties/component_failure/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(null !== data5){
const err14 = {instancePath:instancePath+"/component_failure",schemaPath:"#/properties/component_failure/anyOf/1/const",keyword:"const",params:{allowedValue: schema131.properties.component_failure.anyOf[1].const},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid0 = _errs14 === errors;
valid4 = valid4 || _valid0;
if(!valid4){
const err15 = {instancePath:instancePath+"/component_failure",schemaPath:"#/properties/component_failure/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
else {
errors = _errs12;
if(vErrors !== null){
if(_errs12){
vErrors.length = _errs12;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err16 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
validate79.errors = vErrors;
return errors === 0;
}
validate79.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate78(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate78.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.stage === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.core === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "core"},message:"must have required property '"+"core"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.disclosure === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "disclosure"},message:"must have required property '"+"disclosure"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.body === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "body"},message:"must have required property '"+"body"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.body_bytes === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "body_bytes"},message:"must have required property '"+"body_bytes"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "status") || (key0 === "stage")) || (key0 === "core")) || (key0 === "disclosure")) || (key0 === "body")) || (key0 === "body_bytes"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.status !== undefined){
let data0 = data.status;
if(typeof data0 !== "string"){
const err7 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("core_rejected" !== data0){
const err8 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "core_rejected"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.stage !== undefined){
let data1 = data.stage;
if(typeof data1 !== "string"){
const err9 = {instancePath:instancePath+"/stage",schemaPath:"#/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!((((data1 === "input") || (data1 === "capture")) || (data1 === "admission")) || (data1 === "output"))){
const err10 = {instancePath:instancePath+"/stage",schemaPath:"#/properties/stage/enum",keyword:"enum",params:{allowedValues: schema130.properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.core !== undefined){
if(!(validate79(data.core, {instancePath:instancePath+"/core",parentData:data,parentDataProperty:"core",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate79.errors : vErrors.concat(validate79.errors);
errors = vErrors.length;
}
}
if(data.disclosure !== undefined){
if(!(validate69(data.disclosure, {instancePath:instancePath+"/disclosure",parentData:data,parentDataProperty:"disclosure",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate69.errors : vErrors.concat(validate69.errors);
errors = vErrors.length;
}
}
if(data.body !== undefined){
if(data.body !== null){
const err11 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.body_bytes !== undefined){
let data5 = data.body_bytes;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err12 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/properties/body_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(0 !== data5){
const err13 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/properties/body_bytes/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
validate78.errors = vErrors;
return errors === 0;
}
validate78.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate67(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate67.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err0 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.request === undefined){
const err1 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "request"},message:"must have required property '"+"request"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "status") || (key0 === "request"))){
const err2 = {instancePath,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.status !== undefined){
let data0 = data.status;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/status",schemaPath:"#/oneOf/0/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("admitted_request" !== data0){
const err4 = {instancePath:instancePath+"/status",schemaPath:"#/oneOf/0/properties/status/const",keyword:"const",params:{allowedValue: "admitted_request"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.request !== undefined){
const err5 = {instancePath:instancePath+"/request",schemaPath:"#/$defs/AdmittedSourceMigrationRequest06/false schema",keyword:"false schema",params:{},message:"boolean schema is false"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs7 = errors;
if(!(validate68(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate68.errors : vErrors.concat(validate68.errors);
errors = vErrors.length;
}
var _valid0 = _errs7 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs8 = errors;
if(!(validate78(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
errors = vErrors.length;
}
var _valid0 = _errs8 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
}
}
if(!valid0){
const err7 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate67.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate67.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate66(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:migration06:SourceMigrationRequestAdmission06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate66.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate67(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate67.errors : vErrors.concat(validate67.errors);
errors = vErrors.length;
}
else {
var props0 = validate67.evaluated.props;
}
validate66.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate66.evaluated = {"dynamicProps":true,"dynamicItems":false};

exports.SourceMigrationRouteContract06 = validate90;
const schema144 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:migration06:SourceMigrationRouteContract06","title":"SourceMigrationRouteContract06","description":"Candidate source-migration API structural data; opaque authorities are native-only.","$ref":"#/$defs/SourceMigrationRouteContract06","$defs":{"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"SourceMigrationRouteContract06":{"type":"object","properties":{"id":{"type":"string","const":"kdna.source-migration/0.1.0-candidate"},"version":{"type":"string","const":"0.1.0-candidate"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false}}};

function validate91(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate91.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.definition_digest === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "definition_digest"},message:"must have required property '"+"definition_digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "id") || (key0 === "version")) || (key0 === "definition_digest"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("kdna.source-migration/0.1.0-candidate" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.source-migration/0.1.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.version !== undefined){
let data1 = data.version;
if(typeof data1 !== "string"){
const err6 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if("0.1.0-candidate" !== data1){
const err7 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/const",keyword:"const",params:{allowedValue: "0.1.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.definition_digest !== undefined){
let data2 = data.definition_digest;
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
const err8 = {instancePath:instancePath+"/definition_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/definition_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
validate91.errors = vErrors;
return errors === 0;
}
validate91.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate90(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:migration06:SourceMigrationRouteContract06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate90.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate91(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate91.errors : vErrors.concat(validate91.errors);
errors = vErrors.length;
}
validate90.errors = vErrors;
return errors === 0;
}
validate90.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

