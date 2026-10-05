"use strict";
exports.NativeCreationManifest06 = validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:creation06:NativeCreationManifest06","title":"NativeCreationManifest06","description":"Native creation structural data only; opaque requests and creation permission require actual native brands.","$ref":"#/$defs/NativeCreationManifest06","$defs":{"AccessMode":{"type":"string","enum":["public","licensed","remote"]},"ActorKind":{"type":"string","enum":["person","organization","collective","anonymous","asset_native","agent"]},"AssetIdentity":{"type":"object","properties":{"asset_id":{"$ref":"#/$defs/Identifier"},"asset_version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"}},"required":["asset_id","asset_version","judgment_version"],"additionalProperties":false},"AssetType":{"type":"string","enum":["domain","cluster","tool","sample","fixture","bundle"]},"Boolean":{"type":"boolean"},"Compatibility":{"type":"object","properties":{"min_loader_version":{"$ref":"#/$defs/VersionLabel"},"profile":{"const":"kdna.payload.judgment","type":"string"},"profile_version":{"const":"0.5.1","type":"string"}},"required":["min_loader_version","profile","profile_version"],"additionalProperties":false},"Creator":{"type":"object","properties":{"id":{"$ref":"#/$defs/Identifier"},"name":{"$ref":"#/$defs/NonEmptyText"},"kind":{"$ref":"#/$defs/ActorKind"}},"required":["name","kind"],"additionalProperties":false},"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"Extension":{"type":"object","properties":{"id":{"$ref":"#/$defs/Identifier"},"critical":{"$ref":"#/$defs/Boolean"},"definition":{"$ref":"#/$defs/NonEmptyText"},"value":{"$ref":"#/$defs/SemanticValue"}},"required":["id","critical","definition","value"],"additionalProperties":false},"FiniteNumber":{"type":"number"},"HistoryDeclaration":{"type":"object","properties":{"coverage":{"type":"string","enum":["complete","partial"]},"statement":{"$ref":"#/$defs/NonEmptyText"},"entries":{"type":"array","items":{"$ref":"#/$defs/RevisionEntry"},"minItems":0}},"required":["coverage","statement","entries"],"additionalProperties":false},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"License":{"type":"object","properties":{"identifier":{"$ref":"#/$defs/NonEmptyText"},"uri":{"$ref":"#/$defs/NonEmptyText"}},"required":["identifier"],"additionalProperties":false},"ManifestAuthoring":{"type":"object","properties":{"content_digest":{"$ref":"#/$defs/Digest"}},"required":["content_digest"],"additionalProperties":false},"ManifestLineage":{"type":"object","properties":{"source_asset_id":{"$ref":"#/$defs/Identifier"},"source_version":{"$ref":"#/$defs/VersionLabel"},"relationship":{"$ref":"#/$defs/TermRef"}},"required":["source_asset_id","source_version","relationship"],"additionalProperties":false},"ManifestRuntime":{"type":"object","properties":{"mandatory_entries":{"type":"array","items":{"$ref":"#/$defs/RuntimeMandatoryEntryName"},"minItems":0,"uniqueItems":true}},"required":["mandatory_entries"],"additionalProperties":false},"NativeCreationManifest06":{"type":"object","properties":{"asset_id":{"$ref":"#/$defs/Identifier"},"asset_uid":{"$ref":"#/$defs/Identifier"},"asset_type":{"$ref":"#/$defs/AssetType"},"title":{"$ref":"#/$defs/NonEmptyText"},"version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"},"created_at":{"$ref":"#/$defs/Timestamp"},"updated_at":{"$ref":"#/$defs/Timestamp"},"compatibility":{"$ref":"#/$defs/Compatibility"},"runtime":{"$ref":"#/$defs/ManifestRuntime"},"creator":{"$ref":"#/$defs/Creator"},"content_digest":{"$ref":"#/$defs/Digest"},"authoring":{"$ref":"#/$defs/ManifestAuthoring"},"access":{"$ref":"#/$defs/AccessMode"},"license":{"$ref":"#/$defs/License"},"summary":{"$ref":"#/$defs/NonEmptyText"},"description":{"$ref":"#/$defs/Text"},"keywords":{"type":"array","items":{"$ref":"#/$defs/Text"},"minItems":0},"lineage":{"type":"array","items":{"$ref":"#/$defs/ManifestLineage"},"minItems":0},"languages":{"type":"array","items":{"$ref":"#/$defs/Identifier"},"minItems":1,"uniqueItems":true},"history":{"$ref":"#/$defs/HistoryDeclaration"}},"required":["asset_id","asset_uid","asset_type","title","version","judgment_version","created_at","updated_at","compatibility","runtime","summary","languages","history"],"additionalProperties":false},"NonEmptyText":{"type":"string","minLength":1,"pattern":"\\S"},"Ref":{"type":"object","properties":{"kind":{"type":"string","enum":["asset","judgment","result","contract","condition","component","unit","plan","plan_node","policy","branch_entry","candidate","material","shared_declaration","boundary","exception","misuse","reason","source","source_use","resource","relationship","dependency","example","example_result","revision","actor"]},"id":{"$ref":"#/$defs/Identifier"},"asset":{"$ref":"#/$defs/AssetIdentity"}},"required":["kind","id"],"additionalProperties":false},"RevisionEntry":{"type":"object","properties":{"id":{"$ref":"#/$defs/Identifier"},"version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"},"at":{"$ref":"#/$defs/Timestamp"},"summary":{"$ref":"#/$defs/NonEmptyText"},"affected_refs":{"type":"array","items":{"$ref":"#/$defs/Ref"},"minItems":1,"uniqueItems":true},"previous":{"$ref":"#/$defs/RevisionRef"},"actor_refs":{"type":"array","items":{"$ref":"#/$defs/Identifier"},"minItems":0,"uniqueItems":true}},"required":["id","version","judgment_version","at","summary","affected_refs","actor_refs"],"additionalProperties":false},"RevisionRef":{"type":"object","properties":{"kind":{"type":"string","enum":["revision"]},"id":{"$ref":"#/$defs/Identifier"},"asset":{"$ref":"#/$defs/AssetIdentity"}},"required":["kind","id"],"additionalProperties":false},"RuntimeMandatoryEntryName":{"allOf":[{"$ref":"#/$defs/EntryName"},{"not":{"enum":["checksums.json","signature.kdsig","mimetype"]}},{"pattern":"^(?!build-receipt\\.json$)(?!reports/)(?!authoring/)"}]},"SemanticValue":{"oneOf":[{"$ref":"#/$defs/ValueText"},{"$ref":"#/$defs/ValueNumber"},{"$ref":"#/$defs/ValueBoolean"},{"$ref":"#/$defs/ValueNull"},{"$ref":"#/$defs/ValueList"},{"$ref":"#/$defs/ValueRecord"}]},"TermRef":{"type":"object","properties":{"term":{"$ref":"#/$defs/Identifier"},"extension":{"$ref":"#/$defs/Extension"},"vocabulary":{"$ref":"#/$defs/TermVocabulary"}},"required":["term"],"additionalProperties":false},"TermVocabulary":{"type":"string","enum":["core","author"]},"Text":{"type":"string"},"Timestamp":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"},"ValueBoolean":{"type":"object","properties":{"kind":{"const":"boolean","type":"string"},"value":{"$ref":"#/$defs/Boolean"}},"required":["kind","value"],"additionalProperties":false},"ValueField":{"type":"object","properties":{"name":{"$ref":"#/$defs/Identifier"},"value":{"$ref":"#/$defs/SemanticValue"}},"required":["name","value"],"additionalProperties":false},"ValueList":{"type":"object","properties":{"kind":{"const":"list","type":"string"},"items":{"type":"array","items":{"$ref":"#/$defs/SemanticValue"},"minItems":0}},"required":["kind","items"],"additionalProperties":false},"ValueNull":{"type":"object","properties":{"kind":{"const":"null","type":"string"},"value":{"const":null,"type":"null"}},"required":["kind","value"],"additionalProperties":false},"ValueNumber":{"type":"object","properties":{"kind":{"const":"number","type":"string"},"value":{"$ref":"#/$defs/FiniteNumber"}},"required":["kind","value"],"additionalProperties":false},"ValueRecord":{"type":"object","properties":{"kind":{"const":"record","type":"string"},"fields":{"type":"array","items":{"$ref":"#/$defs/ValueField"},"minItems":0}},"required":["kind","fields"],"additionalProperties":false},"ValueText":{"type":"object","properties":{"kind":{"const":"text","type":"string"},"value":{"$ref":"#/$defs/Text"}},"required":["kind","value"],"additionalProperties":false},"VersionLabel":{"$ref":"#/$defs/Identifier"}}};
const schema32 = {"type":"object","properties":{"asset_id":{"$ref":"#/$defs/Identifier"},"asset_uid":{"$ref":"#/$defs/Identifier"},"asset_type":{"$ref":"#/$defs/AssetType"},"title":{"$ref":"#/$defs/NonEmptyText"},"version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"},"created_at":{"$ref":"#/$defs/Timestamp"},"updated_at":{"$ref":"#/$defs/Timestamp"},"compatibility":{"$ref":"#/$defs/Compatibility"},"runtime":{"$ref":"#/$defs/ManifestRuntime"},"creator":{"$ref":"#/$defs/Creator"},"content_digest":{"$ref":"#/$defs/Digest"},"authoring":{"$ref":"#/$defs/ManifestAuthoring"},"access":{"$ref":"#/$defs/AccessMode"},"license":{"$ref":"#/$defs/License"},"summary":{"$ref":"#/$defs/NonEmptyText"},"description":{"$ref":"#/$defs/Text"},"keywords":{"type":"array","items":{"$ref":"#/$defs/Text"},"minItems":0},"lineage":{"type":"array","items":{"$ref":"#/$defs/ManifestLineage"},"minItems":0},"languages":{"type":"array","items":{"$ref":"#/$defs/Identifier"},"minItems":1,"uniqueItems":true},"history":{"$ref":"#/$defs/HistoryDeclaration"}},"required":["asset_id","asset_uid","asset_type","title","version","judgment_version","created_at","updated_at","compatibility","runtime","summary","languages","history"],"additionalProperties":false};
const schema33 = {"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"};
const schema35 = {"type":"string","enum":["domain","cluster","tool","sample","fixture","bundle"]};
const schema36 = {"type":"string","minLength":1,"pattern":"\\S"};
const schema39 = {"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"};
const schema50 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$"};
const schema53 = {"type":"string","enum":["public","licensed","remote"]};
const schema58 = {"type":"string"};
const func1 = Object.prototype.hasOwnProperty;
const func2 = require("ajv/dist/runtime/ucs2length").default;
const func0 = require("ajv/dist/runtime/equal").default;
const pattern4 = new RegExp("^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$", "u");
const pattern6 = new RegExp("\\S", "u");
const pattern9 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$", "u");
const pattern16 = new RegExp("^sha256:[0-9a-f]{64}$", "u");
const schema41 = {"type":"object","properties":{"min_loader_version":{"$ref":"#/$defs/VersionLabel"},"profile":{"const":"kdna.payload.judgment","type":"string"},"profile_version":{"const":"0.5.1","type":"string"}},"required":["min_loader_version","profile","profile_version"],"additionalProperties":false};

function validate22(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate22.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.min_loader_version === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "min_loader_version"},message:"must have required property '"+"min_loader_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.profile === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "profile"},message:"must have required property '"+"profile"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.profile_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "profile_version"},message:"must have required property '"+"profile_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "min_loader_version") || (key0 === "profile")) || (key0 === "profile_version"))){
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
if(data.min_loader_version !== undefined){
let data0 = data.min_loader_version;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err4 = {instancePath:instancePath+"/min_loader_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func2(data0) < 1){
const err5 = {instancePath:instancePath+"/min_loader_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern4.test(data0)){
const err6 = {instancePath:instancePath+"/min_loader_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/min_loader_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.profile !== undefined){
let data1 = data.profile;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/profile",schemaPath:"#/properties/profile/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if("kdna.payload.judgment" !== data1){
const err9 = {instancePath:instancePath+"/profile",schemaPath:"#/properties/profile/const",keyword:"const",params:{allowedValue: "kdna.payload.judgment"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.profile_version !== undefined){
let data2 = data.profile_version;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/profile_version",schemaPath:"#/properties/profile_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if("0.5.1" !== data2){
const err11 = {instancePath:instancePath+"/profile_version",schemaPath:"#/properties/profile_version/const",keyword:"const",params:{allowedValue: "0.5.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema43 = {"type":"object","properties":{"mandatory_entries":{"type":"array","items":{"$ref":"#/$defs/RuntimeMandatoryEntryName"},"minItems":0,"uniqueItems":true}},"required":["mandatory_entries"],"additionalProperties":false};
const schema44 = {"allOf":[{"$ref":"#/$defs/EntryName"},{"not":{"enum":["checksums.json","signature.kdsig","mimetype"]}},{"pattern":"^(?!build-receipt\\.json$)(?!reports/)(?!authoring/)"}]};
const schema45 = {"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"};
const pattern12 = new RegExp("^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$", "u");
const pattern13 = new RegExp("^(?!build-receipt\\.json$)(?!reports/)(?!authoring/)", "u");

function validate25(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate25.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func2(data) > 4096){
const err0 = {instancePath,schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func2(data) < 1){
const err1 = {instancePath,schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern12.test(data)){
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
if(!pattern13.test(data)){
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
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"dynamicProps":false,"dynamicItems":false};


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
if(!(validate25(data0[i0], {instancePath:instancePath+"/mandatory_entries/" + i0,parentData:data0,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
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
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema46 = {"type":"object","properties":{"id":{"$ref":"#/$defs/Identifier"},"name":{"$ref":"#/$defs/NonEmptyText"},"kind":{"$ref":"#/$defs/ActorKind"}},"required":["name","kind"],"additionalProperties":false};
const schema49 = {"type":"string","enum":["person","organization","collective","anonymous","asset_native","agent"]};

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
if(data.kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "id") || (key0 === "name")) || (key0 === "kind"))){
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
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err3 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(func2(data0) < 1){
const err4 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern4.test(data0)){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.name !== undefined){
let data1 = data.name;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err7 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern6.test(data1)){
const err8 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.kind !== undefined){
let data2 = data.kind;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/kind",schemaPath:"#/$defs/ActorKind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!((((((data2 === "person") || (data2 === "organization")) || (data2 === "collective")) || (data2 === "anonymous")) || (data2 === "asset_native")) || (data2 === "agent"))){
const err11 = {instancePath:instancePath+"/kind",schemaPath:"#/$defs/ActorKind/enum",keyword:"enum",params:{allowedValues: schema49.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema51 = {"type":"object","properties":{"content_digest":{"$ref":"#/$defs/Digest"}},"required":["content_digest"],"additionalProperties":false};

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
if(data.content_digest === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "content_digest"},message:"must have required property '"+"content_digest"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "content_digest")){
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
if(data.content_digest !== undefined){
let data0 = data.content_digest;
if(typeof data0 === "string"){
if(!pattern16.test(data0)){
const err2 = {instancePath:instancePath+"/content_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err3 = {instancePath:instancePath+"/content_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err4 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema54 = {"type":"object","properties":{"identifier":{"$ref":"#/$defs/NonEmptyText"},"uri":{"$ref":"#/$defs/NonEmptyText"}},"required":["identifier"],"additionalProperties":false};

function validate32(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate32.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.identifier === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "identifier"},message:"must have required property '"+"identifier"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "identifier") || (key0 === "uri"))){
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
if(data.identifier !== undefined){
let data0 = data.identifier;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err2 = {instancePath:instancePath+"/identifier",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(!pattern6.test(data0)){
const err3 = {instancePath:instancePath+"/identifier",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
else {
const err4 = {instancePath:instancePath+"/identifier",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.uri !== undefined){
let data1 = data.uri;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err5 = {instancePath:instancePath+"/uri",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern6.test(data1)){
const err6 = {instancePath:instancePath+"/uri",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/uri",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema60 = {"type":"object","properties":{"source_asset_id":{"$ref":"#/$defs/Identifier"},"source_version":{"$ref":"#/$defs/VersionLabel"},"relationship":{"$ref":"#/$defs/TermRef"}},"required":["source_asset_id","source_version","relationship"],"additionalProperties":false};
const schema63 = {"type":"object","properties":{"term":{"$ref":"#/$defs/Identifier"},"extension":{"$ref":"#/$defs/Extension"},"vocabulary":{"$ref":"#/$defs/TermVocabulary"}},"required":["term"],"additionalProperties":false};
const schema81 = {"type":"string","enum":["core","author"]};
const schema65 = {"type":"object","properties":{"id":{"$ref":"#/$defs/Identifier"},"critical":{"$ref":"#/$defs/Boolean"},"definition":{"$ref":"#/$defs/NonEmptyText"},"value":{"$ref":"#/$defs/SemanticValue"}},"required":["id","critical","definition","value"],"additionalProperties":false};
const schema67 = {"type":"boolean"};
const schema69 = {"oneOf":[{"$ref":"#/$defs/ValueText"},{"$ref":"#/$defs/ValueNumber"},{"$ref":"#/$defs/ValueBoolean"},{"$ref":"#/$defs/ValueNull"},{"$ref":"#/$defs/ValueList"},{"$ref":"#/$defs/ValueRecord"}]};
const schema76 = {"type":"object","properties":{"kind":{"const":"null","type":"string"},"value":{"const":null,"type":"null"}},"required":["kind","value"],"additionalProperties":false};
const schema70 = {"type":"object","properties":{"kind":{"const":"text","type":"string"},"value":{"$ref":"#/$defs/Text"}},"required":["kind","value"],"additionalProperties":false};

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
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "value"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("text" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "text"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.value !== undefined){
if(typeof data.value !== "string"){
const err5 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/Text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate38.errors = vErrors;
return errors === 0;
}
validate38.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema72 = {"type":"object","properties":{"kind":{"const":"number","type":"string"},"value":{"$ref":"#/$defs/FiniteNumber"}},"required":["kind","value"],"additionalProperties":false};
const schema73 = {"type":"number"};

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
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "value"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("number" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "number"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.value !== undefined){
let data1 = data.value;
if(!((typeof data1 == "number") && (isFinite(data1)))){
const err5 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/FiniteNumber/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate40.errors = vErrors;
return errors === 0;
}
validate40.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema74 = {"type":"object","properties":{"kind":{"const":"boolean","type":"string"},"value":{"$ref":"#/$defs/Boolean"}},"required":["kind","value"],"additionalProperties":false};

function validate42(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate42.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "value"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("boolean" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "boolean"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.value !== undefined){
if(typeof data.value !== "boolean"){
const err5 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/Boolean/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate42.errors = vErrors;
return errors === 0;
}
validate42.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema77 = {"type":"object","properties":{"kind":{"const":"list","type":"string"},"items":{"type":"array","items":{"$ref":"#/$defs/SemanticValue"},"minItems":0}},"required":["kind","items"],"additionalProperties":false};
const wrapper0 = {validate: validate37};

function validate44(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate44.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.items === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "items"},message:"must have required property '"+"items"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "items"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("list" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "list"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.items !== undefined){
let data1 = data.items;
if(Array.isArray(data1)){
if(data1.length < 0){
const err5 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
if(!(wrapper0.validate(data1[i0], {instancePath:instancePath+"/items/" + i0,parentData:data1,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? wrapper0.validate.errors : vErrors.concat(wrapper0.validate.errors);
errors = vErrors.length;
}
}
}
else {
const err6 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
validate44.errors = vErrors;
return errors === 0;
}
validate44.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema78 = {"type":"object","properties":{"kind":{"const":"record","type":"string"},"fields":{"type":"array","items":{"$ref":"#/$defs/ValueField"},"minItems":0}},"required":["kind","fields"],"additionalProperties":false};
const schema79 = {"type":"object","properties":{"name":{"$ref":"#/$defs/Identifier"},"value":{"$ref":"#/$defs/SemanticValue"}},"required":["name","value"],"additionalProperties":false};

function validate47(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate47.evaluated;
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
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "name") || (key0 === "value"))){
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
if(data.name !== undefined){
let data0 = data.name;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err3 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(func2(data0) < 1){
const err4 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern4.test(data0)){
const err5 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.value !== undefined){
if(!(wrapper0.validate(data.value, {instancePath:instancePath+"/value",parentData:data,parentDataProperty:"value",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? wrapper0.validate.errors : vErrors.concat(wrapper0.validate.errors);
errors = vErrors.length;
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
validate47.errors = vErrors;
return errors === 0;
}
validate47.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate46(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate46.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.fields === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fields"},message:"must have required property '"+"fields"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "fields"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("record" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "record"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.fields !== undefined){
let data1 = data.fields;
if(Array.isArray(data1)){
if(data1.length < 0){
const err5 = {instancePath:instancePath+"/fields",schemaPath:"#/properties/fields/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
if(!(validate47(data1[i0], {instancePath:instancePath+"/fields/" + i0,parentData:data1,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate47.errors : vErrors.concat(validate47.errors);
errors = vErrors.length;
}
}
}
else {
const err6 = {instancePath:instancePath+"/fields",schemaPath:"#/properties/fields/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
validate46.errors = vErrors;
return errors === 0;
}
validate46.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate37(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate37.evaluated;
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
if(!(validate38(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate38.errors : vErrors.concat(validate38.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate40(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate40.errors : vErrors.concat(validate40.errors);
errors = vErrors.length;
}
var _valid0 = _errs2 === errors;
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
const _errs3 = errors;
if(!(validate42(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate42.errors : vErrors.concat(validate42.errors);
errors = vErrors.length;
}
var _valid0 = _errs3 === errors;
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
const _errs4 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/$defs/ValueNull/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/$defs/ValueNull/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "value"))){
const err2 = {instancePath,schemaPath:"#/$defs/ValueNull/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
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
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/$defs/ValueNull/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("null" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/$defs/ValueNull/properties/kind/const",keyword:"const",params:{allowedValue: "null"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.value !== undefined){
let data1 = data.value;
if(data1 !== null){
const err5 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/ValueNull/properties/value/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(null !== data1){
const err6 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/ValueNull/properties/value/const",keyword:"const",params:{allowedValue: schema76.properties.value.const},message:"must be equal to constant"};
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
const err7 = {instancePath,schemaPath:"#/$defs/ValueNull/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var _valid0 = _errs4 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid0 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
const _errs12 = errors;
if(!(validate44(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate44.errors : vErrors.concat(validate44.errors);
errors = vErrors.length;
}
var _valid0 = _errs12 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid0 = true;
passing0 = 4;
if(props0 !== true){
props0 = true;
}
}
const _errs13 = errors;
if(!(validate46(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate46.errors : vErrors.concat(validate46.errors);
errors = vErrors.length;
}
var _valid0 = _errs13 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid0 = true;
passing0 = 5;
if(props0 !== true){
props0 = true;
}
}
}
}
}
}
}
if(!valid0){
const err8 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
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
validate37.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate37.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate36(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
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
if(data.critical === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "critical"},message:"must have required property '"+"critical"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.definition === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "definition"},message:"must have required property '"+"definition"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.value === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "id") || (key0 === "critical")) || (key0 === "definition")) || (key0 === "value"))){
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
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data0) < 1){
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern4.test(data0)){
const err7 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.critical !== undefined){
if(typeof data.critical !== "boolean"){
const err9 = {instancePath:instancePath+"/critical",schemaPath:"#/$defs/Boolean/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.definition !== undefined){
let data2 = data.definition;
if(typeof data2 === "string"){
if(func2(data2) < 1){
const err10 = {instancePath:instancePath+"/definition",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern6.test(data2)){
const err11 = {instancePath:instancePath+"/definition",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/definition",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.value !== undefined){
if(!(validate37(data.value, {instancePath:instancePath+"/value",parentData:data,parentDataProperty:"value",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate37.errors : vErrors.concat(validate37.errors);
errors = vErrors.length;
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
validate36.errors = vErrors;
return errors === 0;
}
validate36.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate35(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate35.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.term === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "term"},message:"must have required property '"+"term"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "term") || (key0 === "extension")) || (key0 === "vocabulary"))){
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
if(data.term !== undefined){
let data0 = data.term;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err2 = {instancePath:instancePath+"/term",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(func2(data0) < 1){
const err3 = {instancePath:instancePath+"/term",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!pattern4.test(data0)){
const err4 = {instancePath:instancePath+"/term",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/term",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.extension !== undefined){
if(!(validate36(data.extension, {instancePath:instancePath+"/extension",parentData:data,parentDataProperty:"extension",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate36.errors : vErrors.concat(validate36.errors);
errors = vErrors.length;
}
}
if(data.vocabulary !== undefined){
let data2 = data.vocabulary;
if(typeof data2 !== "string"){
const err6 = {instancePath:instancePath+"/vocabulary",schemaPath:"#/$defs/TermVocabulary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!((data2 === "core") || (data2 === "author"))){
const err7 = {instancePath:instancePath+"/vocabulary",schemaPath:"#/$defs/TermVocabulary/enum",keyword:"enum",params:{allowedValues: schema81.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate35.errors = vErrors;
return errors === 0;
}
validate35.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.source_asset_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_asset_id"},message:"must have required property '"+"source_asset_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.source_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_version"},message:"must have required property '"+"source_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.relationship === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "relationship"},message:"must have required property '"+"relationship"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "source_asset_id") || (key0 === "source_version")) || (key0 === "relationship"))){
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
if(data.source_asset_id !== undefined){
let data0 = data.source_asset_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err4 = {instancePath:instancePath+"/source_asset_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func2(data0) < 1){
const err5 = {instancePath:instancePath+"/source_asset_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern4.test(data0)){
const err6 = {instancePath:instancePath+"/source_asset_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/source_asset_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.source_version !== undefined){
let data1 = data.source_version;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err8 = {instancePath:instancePath+"/source_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func2(data1) < 1){
const err9 = {instancePath:instancePath+"/source_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern4.test(data1)){
const err10 = {instancePath:instancePath+"/source_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err11 = {instancePath:instancePath+"/source_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.relationship !== undefined){
if(!(validate35(data.relationship, {instancePath:instancePath+"/relationship",parentData:data,parentDataProperty:"relationship",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate35.errors : vErrors.concat(validate35.errors);
errors = vErrors.length;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema83 = {"type":"object","properties":{"coverage":{"type":"string","enum":["complete","partial"]},"statement":{"$ref":"#/$defs/NonEmptyText"},"entries":{"type":"array","items":{"$ref":"#/$defs/RevisionEntry"},"minItems":0}},"required":["coverage","statement","entries"],"additionalProperties":false};
const schema85 = {"type":"object","properties":{"id":{"$ref":"#/$defs/Identifier"},"version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"},"at":{"$ref":"#/$defs/Timestamp"},"summary":{"$ref":"#/$defs/NonEmptyText"},"affected_refs":{"type":"array","items":{"$ref":"#/$defs/Ref"},"minItems":1,"uniqueItems":true},"previous":{"$ref":"#/$defs/RevisionRef"},"actor_refs":{"type":"array","items":{"$ref":"#/$defs/Identifier"},"minItems":0,"uniqueItems":true}},"required":["id","version","judgment_version","at","summary","affected_refs","actor_refs"],"additionalProperties":false};
const schema91 = {"type":"object","properties":{"kind":{"type":"string","enum":["asset","judgment","result","contract","condition","component","unit","plan","plan_node","policy","branch_entry","candidate","material","shared_declaration","boundary","exception","misuse","reason","source","source_use","resource","relationship","dependency","example","example_result","revision","actor"]},"id":{"$ref":"#/$defs/Identifier"},"asset":{"$ref":"#/$defs/AssetIdentity"}},"required":["kind","id"],"additionalProperties":false};
const schema93 = {"type":"object","properties":{"asset_id":{"$ref":"#/$defs/Identifier"},"asset_version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"}},"required":["asset_id","asset_version","judgment_version"],"additionalProperties":false};

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
if(data.asset_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "asset_id"},message:"must have required property '"+"asset_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.asset_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "asset_version"},message:"must have required property '"+"asset_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.judgment_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "judgment_version"},message:"must have required property '"+"judgment_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "asset_id") || (key0 === "asset_version")) || (key0 === "judgment_version"))){
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
if(data.asset_id !== undefined){
let data0 = data.asset_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err4 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func2(data0) < 1){
const err5 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern4.test(data0)){
const err6 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.asset_version !== undefined){
let data1 = data.asset_version;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err8 = {instancePath:instancePath+"/asset_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func2(data1) < 1){
const err9 = {instancePath:instancePath+"/asset_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern4.test(data1)){
const err10 = {instancePath:instancePath+"/asset_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err11 = {instancePath:instancePath+"/asset_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.judgment_version !== undefined){
let data2 = data.judgment_version;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err12 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func2(data2) < 1){
const err13 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern4.test(data2)){
const err14 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err15 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate57.errors = vErrors;
return errors === 0;
}
validate57.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate56(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate56.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "kind") || (key0 === "id")) || (key0 === "asset"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!(((((((((((((((((((((((((((data0 === "asset") || (data0 === "judgment")) || (data0 === "result")) || (data0 === "contract")) || (data0 === "condition")) || (data0 === "component")) || (data0 === "unit")) || (data0 === "plan")) || (data0 === "plan_node")) || (data0 === "policy")) || (data0 === "branch_entry")) || (data0 === "candidate")) || (data0 === "material")) || (data0 === "shared_declaration")) || (data0 === "boundary")) || (data0 === "exception")) || (data0 === "misuse")) || (data0 === "reason")) || (data0 === "source")) || (data0 === "source_use")) || (data0 === "resource")) || (data0 === "relationship")) || (data0 === "dependency")) || (data0 === "example")) || (data0 === "example_result")) || (data0 === "revision")) || (data0 === "actor"))){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema91.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data1) < 1){
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern4.test(data1)){
const err7 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.asset !== undefined){
if(!(validate57(data.asset, {instancePath:instancePath+"/asset",parentData:data,parentDataProperty:"asset",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
errors = vErrors.length;
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
validate56.errors = vErrors;
return errors === 0;
}
validate56.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema97 = {"type":"object","properties":{"kind":{"type":"string","enum":["revision"]},"id":{"$ref":"#/$defs/Identifier"},"asset":{"$ref":"#/$defs/AssetIdentity"}},"required":["kind","id"],"additionalProperties":false};

function validate60(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate60.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "kind") || (key0 === "id")) || (key0 === "asset"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!(data0 === "revision")){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema97.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data1) < 1){
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern4.test(data1)){
const err7 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.asset !== undefined){
if(!(validate57(data.asset, {instancePath:instancePath+"/asset",parentData:data,parentDataProperty:"asset",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
errors = vErrors.length;
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
validate60.errors = vErrors;
return errors === 0;
}
validate60.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.judgment_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "judgment_version"},message:"must have required property '"+"judgment_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.at === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "at"},message:"must have required property '"+"at"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.summary === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "summary"},message:"must have required property '"+"summary"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.affected_refs === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "affected_refs"},message:"must have required property '"+"affected_refs"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.actor_refs === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "actor_refs"},message:"must have required property '"+"actor_refs"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "id") || (key0 === "version")) || (key0 === "judgment_version")) || (key0 === "at")) || (key0 === "summary")) || (key0 === "affected_refs")) || (key0 === "previous")) || (key0 === "actor_refs"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err8 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func2(data0) < 1){
const err9 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern4.test(data0)){
const err10 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err11 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.version !== undefined){
let data1 = data.version;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err12 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func2(data1) < 1){
const err13 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern4.test(data1)){
const err14 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err15 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.judgment_version !== undefined){
let data2 = data.judgment_version;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err16 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(func2(data2) < 1){
const err17 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!pattern4.test(data2)){
const err18 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err19 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.at !== undefined){
let data3 = data.at;
if(typeof data3 === "string"){
if(!pattern9.test(data3)){
const err20 = {instancePath:instancePath+"/at",schemaPath:"#/$defs/Timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
else {
const err21 = {instancePath:instancePath+"/at",schemaPath:"#/$defs/Timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.summary !== undefined){
let data4 = data.summary;
if(typeof data4 === "string"){
if(func2(data4) < 1){
const err22 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!pattern6.test(data4)){
const err23 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
else {
const err24 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.affected_refs !== undefined){
let data5 = data.affected_refs;
if(Array.isArray(data5)){
if(data5.length < 1){
const err25 = {instancePath:instancePath+"/affected_refs",schemaPath:"#/properties/affected_refs/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
if(!(validate56(data5[i0], {instancePath:instancePath+"/affected_refs/" + i0,parentData:data5,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
let i1 = data5.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data5[i1], data5[j0])){
const err26 = {instancePath:instancePath+"/affected_refs",schemaPath:"#/properties/affected_refs/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err27 = {instancePath:instancePath+"/affected_refs",schemaPath:"#/properties/affected_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.previous !== undefined){
if(!(validate60(data.previous, {instancePath:instancePath+"/previous",parentData:data,parentDataProperty:"previous",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate60.errors : vErrors.concat(validate60.errors);
errors = vErrors.length;
}
}
if(data.actor_refs !== undefined){
let data8 = data.actor_refs;
if(Array.isArray(data8)){
if(data8.length < 0){
const err28 = {instancePath:instancePath+"/actor_refs",schemaPath:"#/properties/actor_refs/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
const len1 = data8.length;
for(let i2=0; i2<len1; i2++){
let data9 = data8[i2];
if(typeof data9 === "string"){
if(func2(data9) > 256){
const err29 = {instancePath:instancePath+"/actor_refs/" + i2,schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(func2(data9) < 1){
const err30 = {instancePath:instancePath+"/actor_refs/" + i2,schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(!pattern4.test(data9)){
const err31 = {instancePath:instancePath+"/actor_refs/" + i2,schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
else {
const err32 = {instancePath:instancePath+"/actor_refs/" + i2,schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
let i3 = data8.length;
let j1;
if(i3 > 1){
outer1:
for(;i3--;){
for(j1 = i3; j1--;){
if(func0(data8[i3], data8[j1])){
const err33 = {instancePath:instancePath+"/actor_refs",schemaPath:"#/properties/actor_refs/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err34 = {instancePath:instancePath+"/actor_refs",schemaPath:"#/properties/actor_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
}
else {
const err35 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
validate55.errors = vErrors;
return errors === 0;
}
validate55.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.coverage === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "coverage"},message:"must have required property '"+"coverage"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.statement === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "statement"},message:"must have required property '"+"statement"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.entries === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entries"},message:"must have required property '"+"entries"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "coverage") || (key0 === "statement")) || (key0 === "entries"))){
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
if(data.coverage !== undefined){
let data0 = data.coverage;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!((data0 === "complete") || (data0 === "partial"))){
const err5 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/enum",keyword:"enum",params:{allowedValues: schema83.properties.coverage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.statement !== undefined){
let data1 = data.statement;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err6 = {instancePath:instancePath+"/statement",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern6.test(data1)){
const err7 = {instancePath:instancePath+"/statement",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
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
const err8 = {instancePath:instancePath+"/statement",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.entries !== undefined){
let data2 = data.entries;
if(Array.isArray(data2)){
if(data2.length < 0){
const err9 = {instancePath:instancePath+"/entries",schemaPath:"#/properties/entries/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
if(!(validate55(data2[i0], {instancePath:instancePath+"/entries/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
errors = vErrors.length;
}
}
}
else {
const err10 = {instancePath:instancePath+"/entries",schemaPath:"#/properties/entries/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate54.errors = vErrors;
return errors === 0;
}
validate54.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate21(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate21.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.asset_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "asset_id"},message:"must have required property '"+"asset_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.asset_uid === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "asset_uid"},message:"must have required property '"+"asset_uid"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.asset_type === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "asset_type"},message:"must have required property '"+"asset_type"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.title === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.version === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.judgment_version === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "judgment_version"},message:"must have required property '"+"judgment_version"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.created_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "created_at"},message:"must have required property '"+"created_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.updated_at === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "updated_at"},message:"must have required property '"+"updated_at"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.compatibility === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "compatibility"},message:"must have required property '"+"compatibility"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.runtime === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "runtime"},message:"must have required property '"+"runtime"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.summary === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "summary"},message:"must have required property '"+"summary"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.languages === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "languages"},message:"must have required property '"+"languages"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.history === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "history"},message:"must have required property '"+"history"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema32.properties, key0))){
const err13 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.asset_id !== undefined){
let data0 = data.asset_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err14 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(func2(data0) < 1){
const err15 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!pattern4.test(data0)){
const err16 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err17 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.asset_uid !== undefined){
let data1 = data.asset_uid;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err18 = {instancePath:instancePath+"/asset_uid",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(func2(data1) < 1){
const err19 = {instancePath:instancePath+"/asset_uid",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!pattern4.test(data1)){
const err20 = {instancePath:instancePath+"/asset_uid",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
else {
const err21 = {instancePath:instancePath+"/asset_uid",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.asset_type !== undefined){
let data2 = data.asset_type;
if(typeof data2 !== "string"){
const err22 = {instancePath:instancePath+"/asset_type",schemaPath:"#/$defs/AssetType/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!((((((data2 === "domain") || (data2 === "cluster")) || (data2 === "tool")) || (data2 === "sample")) || (data2 === "fixture")) || (data2 === "bundle"))){
const err23 = {instancePath:instancePath+"/asset_type",schemaPath:"#/$defs/AssetType/enum",keyword:"enum",params:{allowedValues: schema35.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.title !== undefined){
let data3 = data.title;
if(typeof data3 === "string"){
if(func2(data3) < 1){
const err24 = {instancePath:instancePath+"/title",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!pattern6.test(data3)){
const err25 = {instancePath:instancePath+"/title",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
else {
const err26 = {instancePath:instancePath+"/title",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.version !== undefined){
let data4 = data.version;
if(typeof data4 === "string"){
if(func2(data4) > 256){
const err27 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(func2(data4) < 1){
const err28 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(!pattern4.test(data4)){
const err29 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
else {
const err30 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.judgment_version !== undefined){
let data5 = data.judgment_version;
if(typeof data5 === "string"){
if(func2(data5) > 256){
const err31 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(func2(data5) < 1){
const err32 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(!pattern4.test(data5)){
const err33 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
else {
const err34 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.created_at !== undefined){
let data6 = data.created_at;
if(typeof data6 === "string"){
if(!pattern9.test(data6)){
const err35 = {instancePath:instancePath+"/created_at",schemaPath:"#/$defs/Timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"+"\""};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
else {
const err36 = {instancePath:instancePath+"/created_at",schemaPath:"#/$defs/Timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.updated_at !== undefined){
let data7 = data.updated_at;
if(typeof data7 === "string"){
if(!pattern9.test(data7)){
const err37 = {instancePath:instancePath+"/updated_at",schemaPath:"#/$defs/Timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"+"\""};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
else {
const err38 = {instancePath:instancePath+"/updated_at",schemaPath:"#/$defs/Timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.compatibility !== undefined){
if(!(validate22(data.compatibility, {instancePath:instancePath+"/compatibility",parentData:data,parentDataProperty:"compatibility",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
}
if(data.runtime !== undefined){
if(!(validate24(data.runtime, {instancePath:instancePath+"/runtime",parentData:data,parentDataProperty:"runtime",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
errors = vErrors.length;
}
}
if(data.creator !== undefined){
if(!(validate28(data.creator, {instancePath:instancePath+"/creator",parentData:data,parentDataProperty:"creator",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
}
if(data.content_digest !== undefined){
let data11 = data.content_digest;
if(typeof data11 === "string"){
if(!pattern16.test(data11)){
const err39 = {instancePath:instancePath+"/content_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
else {
const err40 = {instancePath:instancePath+"/content_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.authoring !== undefined){
if(!(validate30(data.authoring, {instancePath:instancePath+"/authoring",parentData:data,parentDataProperty:"authoring",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
errors = vErrors.length;
}
}
if(data.access !== undefined){
let data13 = data.access;
if(typeof data13 !== "string"){
const err41 = {instancePath:instancePath+"/access",schemaPath:"#/$defs/AccessMode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(!(((data13 === "public") || (data13 === "licensed")) || (data13 === "remote"))){
const err42 = {instancePath:instancePath+"/access",schemaPath:"#/$defs/AccessMode/enum",keyword:"enum",params:{allowedValues: schema53.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.license !== undefined){
if(!(validate32(data.license, {instancePath:instancePath+"/license",parentData:data,parentDataProperty:"license",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate32.errors : vErrors.concat(validate32.errors);
errors = vErrors.length;
}
}
if(data.summary !== undefined){
let data15 = data.summary;
if(typeof data15 === "string"){
if(func2(data15) < 1){
const err43 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(!pattern6.test(data15)){
const err44 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
else {
const err45 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.description !== undefined){
if(typeof data.description !== "string"){
const err46 = {instancePath:instancePath+"/description",schemaPath:"#/$defs/Text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.keywords !== undefined){
let data17 = data.keywords;
if(Array.isArray(data17)){
if(data17.length < 0){
const err47 = {instancePath:instancePath+"/keywords",schemaPath:"#/properties/keywords/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
const len0 = data17.length;
for(let i0=0; i0<len0; i0++){
if(typeof data17[i0] !== "string"){
const err48 = {instancePath:instancePath+"/keywords/" + i0,schemaPath:"#/$defs/Text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
}
else {
const err49 = {instancePath:instancePath+"/keywords",schemaPath:"#/properties/keywords/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data.lineage !== undefined){
let data19 = data.lineage;
if(Array.isArray(data19)){
if(data19.length < 0){
const err50 = {instancePath:instancePath+"/lineage",schemaPath:"#/properties/lineage/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
const len1 = data19.length;
for(let i1=0; i1<len1; i1++){
if(!(validate34(data19[i1], {instancePath:instancePath+"/lineage/" + i1,parentData:data19,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate34.errors : vErrors.concat(validate34.errors);
errors = vErrors.length;
}
}
}
else {
const err51 = {instancePath:instancePath+"/lineage",schemaPath:"#/properties/lineage/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data.languages !== undefined){
let data21 = data.languages;
if(Array.isArray(data21)){
if(data21.length < 1){
const err52 = {instancePath:instancePath+"/languages",schemaPath:"#/properties/languages/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
const len2 = data21.length;
for(let i2=0; i2<len2; i2++){
let data22 = data21[i2];
if(typeof data22 === "string"){
if(func2(data22) > 256){
const err53 = {instancePath:instancePath+"/languages/" + i2,schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(func2(data22) < 1){
const err54 = {instancePath:instancePath+"/languages/" + i2,schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(!pattern4.test(data22)){
const err55 = {instancePath:instancePath+"/languages/" + i2,schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err56 = {instancePath:instancePath+"/languages/" + i2,schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
let i3 = data21.length;
let j0;
if(i3 > 1){
outer0:
for(;i3--;){
for(j0 = i3; j0--;){
if(func0(data21[i3], data21[j0])){
const err57 = {instancePath:instancePath+"/languages",schemaPath:"#/properties/languages/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err58 = {instancePath:instancePath+"/languages",schemaPath:"#/properties/languages/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data.history !== undefined){
if(!(validate54(data.history, {instancePath:instancePath+"/history",parentData:data,parentDataProperty:"history",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate54.errors : vErrors.concat(validate54.errors);
errors = vErrors.length;
}
}
}
else {
const err59 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:creation06:NativeCreationManifest06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate20.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate21(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
validate20.errors = vErrors;
return errors === 0;
}
validate20.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.NativeCreationRequest06 = validate66;
const schema100 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:creation06:NativeCreationRequest06","title":"NativeCreationRequest06","description":"Native creation structural data only; opaque requests and creation permission require actual native brands.","$ref":"#/$defs/NativeCreationRequest06","$defs":{"CandidateVersionTuple06":{"type":"object","properties":{"container":{"const":"0.6.0","type":"string"},"payload_profile":{"const":"kdna.payload.judgment","type":"string"},"payload_version":{"const":"0.5.1","type":"string"},"core":{"const":"kdna.core/0.8.2","type":"string"},"ir":{"const":"kdna.canonical-ir/0.6.1","type":"string"},"runtime":{"const":"kdna.runtime-capsule/0.3.1","type":"string"},"plan":{"const":"kdna.consumption-plan/0.3.1","type":"string"},"host":{"const":"kdna.agent-host/0.3.1","type":"string"},"trace":{"const":"kdna.judgment-trace/0.3.1","type":"string"},"read":{"const":"kdna.read/0.7.0-candidate","type":"string"}},"required":["container","payload_profile","payload_version","core","ir","runtime","plan","host","trace","read"],"additionalProperties":false},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"NativeCreationRequest06":{"type":"object","properties":{"request_id":{"$ref":"#/$defs/Identifier"},"tuple":{"$ref":"#/$defs/CandidateVersionTuple06"},"operation":{"type":"string","const":"create_public_asset"},"timeout_ms":{"type":"integer","minimum":1,"maximum":60000}},"required":["request_id","tuple","operation","timeout_ms"],"additionalProperties":false}}};
const schema101 = {"type":"object","properties":{"request_id":{"$ref":"#/$defs/Identifier"},"tuple":{"$ref":"#/$defs/CandidateVersionTuple06"},"operation":{"type":"string","const":"create_public_asset"},"timeout_ms":{"type":"integer","minimum":1,"maximum":60000}},"required":["request_id","tuple","operation","timeout_ms"],"additionalProperties":false};
const schema103 = {"type":"object","properties":{"container":{"const":"0.6.0","type":"string"},"payload_profile":{"const":"kdna.payload.judgment","type":"string"},"payload_version":{"const":"0.5.1","type":"string"},"core":{"const":"kdna.core/0.8.2","type":"string"},"ir":{"const":"kdna.canonical-ir/0.6.1","type":"string"},"runtime":{"const":"kdna.runtime-capsule/0.3.1","type":"string"},"plan":{"const":"kdna.consumption-plan/0.3.1","type":"string"},"host":{"const":"kdna.agent-host/0.3.1","type":"string"},"trace":{"const":"kdna.judgment-trace/0.3.1","type":"string"},"read":{"const":"kdna.read/0.7.0-candidate","type":"string"}},"required":["container","payload_profile","payload_version","core","ir","runtime","plan","host","trace","read"],"additionalProperties":false};

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
if(data.timeout_ms === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "timeout_ms"},message:"must have required property '"+"timeout_ms"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "request_id") || (key0 === "tuple")) || (key0 === "operation")) || (key0 === "timeout_ms"))){
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
if(data.request_id !== undefined){
let data0 = data.request_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err5 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data0) < 1){
const err6 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern4.test(data0)){
const err7 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err8 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.tuple !== undefined){
let data1 = data.tuple;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.container === undefined){
const err9 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "container"},message:"must have required property '"+"container"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data1.payload_profile === undefined){
const err10 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "payload_profile"},message:"must have required property '"+"payload_profile"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data1.payload_version === undefined){
const err11 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "payload_version"},message:"must have required property '"+"payload_version"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data1.core === undefined){
const err12 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "core"},message:"must have required property '"+"core"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data1.ir === undefined){
const err13 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "ir"},message:"must have required property '"+"ir"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data1.runtime === undefined){
const err14 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "runtime"},message:"must have required property '"+"runtime"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data1.plan === undefined){
const err15 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "plan"},message:"must have required property '"+"plan"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data1.host === undefined){
const err16 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "host"},message:"must have required property '"+"host"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data1.trace === undefined){
const err17 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "trace"},message:"must have required property '"+"trace"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data1.read === undefined){
const err18 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "read"},message:"must have required property '"+"read"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key1 in data1){
if(!(func1.call(schema103.properties, key1))){
const err19 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data1.container !== undefined){
let data2 = data1.container;
if(typeof data2 !== "string"){
const err20 = {instancePath:instancePath+"/tuple/container",schemaPath:"#/$defs/CandidateVersionTuple06/properties/container/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if("0.6.0" !== data2){
const err21 = {instancePath:instancePath+"/tuple/container",schemaPath:"#/$defs/CandidateVersionTuple06/properties/container/const",keyword:"const",params:{allowedValue: "0.6.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data1.payload_profile !== undefined){
let data3 = data1.payload_profile;
if(typeof data3 !== "string"){
const err22 = {instancePath:instancePath+"/tuple/payload_profile",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_profile/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if("kdna.payload.judgment" !== data3){
const err23 = {instancePath:instancePath+"/tuple/payload_profile",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_profile/const",keyword:"const",params:{allowedValue: "kdna.payload.judgment"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data1.payload_version !== undefined){
let data4 = data1.payload_version;
if(typeof data4 !== "string"){
const err24 = {instancePath:instancePath+"/tuple/payload_version",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if("0.5.1" !== data4){
const err25 = {instancePath:instancePath+"/tuple/payload_version",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_version/const",keyword:"const",params:{allowedValue: "0.5.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data1.core !== undefined){
let data5 = data1.core;
if(typeof data5 !== "string"){
const err26 = {instancePath:instancePath+"/tuple/core",schemaPath:"#/$defs/CandidateVersionTuple06/properties/core/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if("kdna.core/0.8.2" !== data5){
const err27 = {instancePath:instancePath+"/tuple/core",schemaPath:"#/$defs/CandidateVersionTuple06/properties/core/const",keyword:"const",params:{allowedValue: "kdna.core/0.8.2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data1.ir !== undefined){
let data6 = data1.ir;
if(typeof data6 !== "string"){
const err28 = {instancePath:instancePath+"/tuple/ir",schemaPath:"#/$defs/CandidateVersionTuple06/properties/ir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if("kdna.canonical-ir/0.6.1" !== data6){
const err29 = {instancePath:instancePath+"/tuple/ir",schemaPath:"#/$defs/CandidateVersionTuple06/properties/ir/const",keyword:"const",params:{allowedValue: "kdna.canonical-ir/0.6.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data1.runtime !== undefined){
let data7 = data1.runtime;
if(typeof data7 !== "string"){
const err30 = {instancePath:instancePath+"/tuple/runtime",schemaPath:"#/$defs/CandidateVersionTuple06/properties/runtime/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if("kdna.runtime-capsule/0.3.1" !== data7){
const err31 = {instancePath:instancePath+"/tuple/runtime",schemaPath:"#/$defs/CandidateVersionTuple06/properties/runtime/const",keyword:"const",params:{allowedValue: "kdna.runtime-capsule/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data1.plan !== undefined){
let data8 = data1.plan;
if(typeof data8 !== "string"){
const err32 = {instancePath:instancePath+"/tuple/plan",schemaPath:"#/$defs/CandidateVersionTuple06/properties/plan/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if("kdna.consumption-plan/0.3.1" !== data8){
const err33 = {instancePath:instancePath+"/tuple/plan",schemaPath:"#/$defs/CandidateVersionTuple06/properties/plan/const",keyword:"const",params:{allowedValue: "kdna.consumption-plan/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data1.host !== undefined){
let data9 = data1.host;
if(typeof data9 !== "string"){
const err34 = {instancePath:instancePath+"/tuple/host",schemaPath:"#/$defs/CandidateVersionTuple06/properties/host/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if("kdna.agent-host/0.3.1" !== data9){
const err35 = {instancePath:instancePath+"/tuple/host",schemaPath:"#/$defs/CandidateVersionTuple06/properties/host/const",keyword:"const",params:{allowedValue: "kdna.agent-host/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data1.trace !== undefined){
let data10 = data1.trace;
if(typeof data10 !== "string"){
const err36 = {instancePath:instancePath+"/tuple/trace",schemaPath:"#/$defs/CandidateVersionTuple06/properties/trace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if("kdna.judgment-trace/0.3.1" !== data10){
const err37 = {instancePath:instancePath+"/tuple/trace",schemaPath:"#/$defs/CandidateVersionTuple06/properties/trace/const",keyword:"const",params:{allowedValue: "kdna.judgment-trace/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data1.read !== undefined){
let data11 = data1.read;
if(typeof data11 !== "string"){
const err38 = {instancePath:instancePath+"/tuple/read",schemaPath:"#/$defs/CandidateVersionTuple06/properties/read/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if("kdna.read/0.7.0-candidate" !== data11){
const err39 = {instancePath:instancePath+"/tuple/read",schemaPath:"#/$defs/CandidateVersionTuple06/properties/read/const",keyword:"const",params:{allowedValue: "kdna.read/0.7.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
}
else {
const err40 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.operation !== undefined){
let data12 = data.operation;
if(typeof data12 !== "string"){
const err41 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if("create_public_asset" !== data12){
const err42 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/const",keyword:"const",params:{allowedValue: "create_public_asset"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.timeout_ms !== undefined){
let data13 = data.timeout_ms;
if(!(((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))) && (isFinite(data13)))){
const err43 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/properties/timeout_ms/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 > 60000 || isNaN(data13)){
const err44 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/properties/timeout_ms/maximum",keyword:"maximum",params:{comparison: "<=", limit: 60000},message:"must be <= 60000"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data13 < 1 || isNaN(data13)){
const err45 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/properties/timeout_ms/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
}
}
else {
const err46 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
validate67.errors = vErrors;
return errors === 0;
}
validate67.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate66(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:creation06:NativeCreationRequest06" */;
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
validate66.errors = vErrors;
return errors === 0;
}
validate66.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.AdmittedNativeCreationRequest06 = validate69;
const schema104 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:creation06:AdmittedNativeCreationRequest06","title":"AdmittedNativeCreationRequest06","description":"Native creation structural data only; opaque requests and creation permission require actual native brands.","$ref":"#/$defs/AdmittedNativeCreationRequest06","$defs":{"AdmittedNativeCreationRequest06":false}};
const schema105 = false;

function validate69(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:creation06:AdmittedNativeCreationRequest06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate69.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const err0 = {instancePath,schemaPath:"#/$defs/AdmittedNativeCreationRequest06/false schema",keyword:"false schema",params:{},message:"boolean schema is false"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
validate69.errors = vErrors;
return errors === 0;
}
validate69.evaluated = {"dynamicProps":false,"dynamicItems":false};

exports.NativeCreationAuthority06 = validate70;
const schema106 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:creation06:NativeCreationAuthority06","title":"NativeCreationAuthority06","description":"Native creation structural data only; opaque requests and creation permission require actual native brands.","$ref":"#/$defs/NativeCreationAuthority06","$defs":{"NativeCreationAuthority06":false}};

function validate70(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:creation06:NativeCreationAuthority06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate70.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const err0 = {instancePath,schemaPath:"#/$defs/NativeCreationAuthority06/false schema",keyword:"false schema",params:{},message:"boolean schema is false"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
validate70.errors = vErrors;
return errors === 0;
}
validate70.evaluated = {"dynamicProps":false,"dynamicItems":false};

exports.NativeCreationContract06 = validate71;
const schema108 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:creation06:NativeCreationContract06","title":"NativeCreationContract06","description":"Native creation structural data only; opaque requests and creation permission require actual native brands.","$ref":"#/$defs/NativeCreationContract06","$defs":{"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"NativeCreationContract06":{"type":"object","properties":{"id":{"type":"string","const":"kdna.creation-sections/0.1.0-candidate"},"version":{"type":"string","const":"0.1.0-candidate"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false}}};
const schema109 = {"type":"object","properties":{"id":{"type":"string","const":"kdna.creation-sections/0.1.0-candidate"},"version":{"type":"string","const":"0.1.0-candidate"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false};

function validate72(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate72.evaluated;
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
if("kdna.creation-sections/0.1.0-candidate" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.creation-sections/0.1.0-candidate"},message:"must be equal to constant"};
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
if(!pattern16.test(data2)){
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
validate72.errors = vErrors;
return errors === 0;
}
validate72.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate71(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:creation06:NativeCreationContract06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate71.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate72(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate72.errors : vErrors.concat(validate72.errors);
errors = vErrors.length;
}
validate71.errors = vErrors;
return errors === 0;
}
validate71.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.NativeCreationInputObservation06 = validate74;
const schema111 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:creation06:NativeCreationInputObservation06","title":"NativeCreationInputObservation06","description":"Native creation structural data only; opaque requests and creation permission require actual native brands.","$ref":"#/$defs/NativeCreationInputObservation06","$defs":{"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"NativeCreationInputObservation06":{"type":"object","properties":{"manifest_digest":{"$ref":"#/$defs/Digest"},"payload_digest":{"$ref":"#/$defs/Digest"},"members":{"type":"array","items":{"$ref":"#/$defs/SourceRouteMemberInventory06"},"minItems":0,"maxItems":128},"member_bytes":{"$ref":"#/$defs/UInt"}},"required":["manifest_digest","payload_digest","members","member_bytes"],"additionalProperties":false},"SourceRouteMemberInventory06":{"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"type":{"type":"string","const":"file"},"mode":{"$ref":"#/$defs/UInt"},"size":{"$ref":"#/$defs/UInt"},"sha256":{"$ref":"#/$defs/Digest"}},"required":["name","type","mode","size","sha256"],"additionalProperties":false},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};
const schema112 = {"type":"object","properties":{"manifest_digest":{"$ref":"#/$defs/Digest"},"payload_digest":{"$ref":"#/$defs/Digest"},"members":{"type":"array","items":{"$ref":"#/$defs/SourceRouteMemberInventory06"},"minItems":0,"maxItems":128},"member_bytes":{"$ref":"#/$defs/UInt"}},"required":["manifest_digest","payload_digest","members","member_bytes"],"additionalProperties":false};
const schema117 = {"type":"integer","minimum":0,"maximum":9007199254740991};
const schema115 = {"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"type":{"type":"string","const":"file"},"mode":{"$ref":"#/$defs/UInt"},"size":{"$ref":"#/$defs/UInt"},"sha256":{"$ref":"#/$defs/Digest"}},"required":["name","type","mode","size","sha256"],"additionalProperties":false};

function validate76(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate76.evaluated;
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
if(func2(data0) > 4096){
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func2(data0) < 1){
const err7 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern12.test(data0)){
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
if(!pattern16.test(data4)){
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
validate76.errors = vErrors;
return errors === 0;
}
validate76.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate75(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate75.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.manifest_digest === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_digest"},message:"must have required property '"+"manifest_digest"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.payload_digest === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload_digest"},message:"must have required property '"+"payload_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.members === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.member_bytes === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_bytes"},message:"must have required property '"+"member_bytes"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "manifest_digest") || (key0 === "payload_digest")) || (key0 === "members")) || (key0 === "member_bytes"))){
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
if(data.manifest_digest !== undefined){
let data0 = data.manifest_digest;
if(typeof data0 === "string"){
if(!pattern16.test(data0)){
const err5 = {instancePath:instancePath+"/manifest_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err6 = {instancePath:instancePath+"/manifest_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.payload_digest !== undefined){
let data1 = data.payload_digest;
if(typeof data1 === "string"){
if(!pattern16.test(data1)){
const err7 = {instancePath:instancePath+"/payload_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err8 = {instancePath:instancePath+"/payload_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.members !== undefined){
let data2 = data.members;
if(Array.isArray(data2)){
if(data2.length > 128){
const err9 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data2.length < 0){
const err10 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
if(!(validate76(data2[i0], {instancePath:instancePath+"/members/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate76.errors : vErrors.concat(validate76.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.member_bytes !== undefined){
let data4 = data.member_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err12 = {instancePath:instancePath+"/member_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
const err13 = {instancePath:instancePath+"/member_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err14 = {instancePath:instancePath+"/member_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
}
else {
const err15 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
validate75.errors = vErrors;
return errors === 0;
}
validate75.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate74(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:creation06:NativeCreationInputObservation06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate74.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate75(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate75.errors : vErrors.concat(validate75.errors);
errors = vErrors.length;
}
validate74.errors = vErrors;
return errors === 0;
}
validate74.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.NativeCreationAuthorityContext06 = validate79;
const schema121 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:creation06:NativeCreationAuthorityContext06","title":"NativeCreationAuthorityContext06","description":"Native creation structural data only; opaque requests and creation permission require actual native brands.","$ref":"#/$defs/NativeCreationAuthorityContext06","$defs":{"AccessMode":{"type":"string","enum":["public","licensed","remote"]},"ActorKind":{"type":"string","enum":["person","organization","collective","anonymous","asset_native","agent"]},"AssetIdentity":{"type":"object","properties":{"asset_id":{"$ref":"#/$defs/Identifier"},"asset_version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"}},"required":["asset_id","asset_version","judgment_version"],"additionalProperties":false},"AssetType":{"type":"string","enum":["domain","cluster","tool","sample","fixture","bundle"]},"Boolean":{"type":"boolean"},"CandidateVersionTuple06":{"type":"object","properties":{"container":{"const":"0.6.0","type":"string"},"payload_profile":{"const":"kdna.payload.judgment","type":"string"},"payload_version":{"const":"0.5.1","type":"string"},"core":{"const":"kdna.core/0.8.2","type":"string"},"ir":{"const":"kdna.canonical-ir/0.6.1","type":"string"},"runtime":{"const":"kdna.runtime-capsule/0.3.1","type":"string"},"plan":{"const":"kdna.consumption-plan/0.3.1","type":"string"},"host":{"const":"kdna.agent-host/0.3.1","type":"string"},"trace":{"const":"kdna.judgment-trace/0.3.1","type":"string"},"read":{"const":"kdna.read/0.7.0-candidate","type":"string"}},"required":["container","payload_profile","payload_version","core","ir","runtime","plan","host","trace","read"],"additionalProperties":false},"Compatibility":{"type":"object","properties":{"min_loader_version":{"$ref":"#/$defs/VersionLabel"},"profile":{"const":"kdna.payload.judgment","type":"string"},"profile_version":{"const":"0.5.1","type":"string"}},"required":["min_loader_version","profile","profile_version"],"additionalProperties":false},"Creator":{"type":"object","properties":{"id":{"$ref":"#/$defs/Identifier"},"name":{"$ref":"#/$defs/NonEmptyText"},"kind":{"$ref":"#/$defs/ActorKind"}},"required":["name","kind"],"additionalProperties":false},"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"Extension":{"type":"object","properties":{"id":{"$ref":"#/$defs/Identifier"},"critical":{"$ref":"#/$defs/Boolean"},"definition":{"$ref":"#/$defs/NonEmptyText"},"value":{"$ref":"#/$defs/SemanticValue"}},"required":["id","critical","definition","value"],"additionalProperties":false},"FiniteNumber":{"type":"number"},"HistoryDeclaration":{"type":"object","properties":{"coverage":{"type":"string","enum":["complete","partial"]},"statement":{"$ref":"#/$defs/NonEmptyText"},"entries":{"type":"array","items":{"$ref":"#/$defs/RevisionEntry"},"minItems":0}},"required":["coverage","statement","entries"],"additionalProperties":false},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"License":{"type":"object","properties":{"identifier":{"$ref":"#/$defs/NonEmptyText"},"uri":{"$ref":"#/$defs/NonEmptyText"}},"required":["identifier"],"additionalProperties":false},"ManifestAuthoring":{"type":"object","properties":{"content_digest":{"$ref":"#/$defs/Digest"}},"required":["content_digest"],"additionalProperties":false},"ManifestLineage":{"type":"object","properties":{"source_asset_id":{"$ref":"#/$defs/Identifier"},"source_version":{"$ref":"#/$defs/VersionLabel"},"relationship":{"$ref":"#/$defs/TermRef"}},"required":["source_asset_id","source_version","relationship"],"additionalProperties":false},"ManifestRuntime":{"type":"object","properties":{"mandatory_entries":{"type":"array","items":{"$ref":"#/$defs/RuntimeMandatoryEntryName"},"minItems":0,"uniqueItems":true}},"required":["mandatory_entries"],"additionalProperties":false},"NativeCreationAuthorityContext06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeCreationContract06"},"request":{"$ref":"#/$defs/NativeCreationRequest06"},"request_digest":{"$ref":"#/$defs/Digest"},"input_digest":{"$ref":"#/$defs/Digest"},"input":{"$ref":"#/$defs/NativeCreationInputObservation06"},"manifest":{"$ref":"#/$defs/NativeCreationManifest06"},"intent":{"type":"string","const":"encode_exact_owned_authored_input_as_public_sections06"},"adoption":{"type":"string","const":"not_observed"},"output_delivery":{"type":"string","const":"return_bytes_only"}},"required":["contract","request","request_digest","input_digest","input","manifest","intent","adoption","output_delivery"],"additionalProperties":false},"NativeCreationContract06":{"type":"object","properties":{"id":{"type":"string","const":"kdna.creation-sections/0.1.0-candidate"},"version":{"type":"string","const":"0.1.0-candidate"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false},"NativeCreationInputObservation06":{"type":"object","properties":{"manifest_digest":{"$ref":"#/$defs/Digest"},"payload_digest":{"$ref":"#/$defs/Digest"},"members":{"type":"array","items":{"$ref":"#/$defs/SourceRouteMemberInventory06"},"minItems":0,"maxItems":128},"member_bytes":{"$ref":"#/$defs/UInt"}},"required":["manifest_digest","payload_digest","members","member_bytes"],"additionalProperties":false},"NativeCreationManifest06":{"type":"object","properties":{"asset_id":{"$ref":"#/$defs/Identifier"},"asset_uid":{"$ref":"#/$defs/Identifier"},"asset_type":{"$ref":"#/$defs/AssetType"},"title":{"$ref":"#/$defs/NonEmptyText"},"version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"},"created_at":{"$ref":"#/$defs/Timestamp"},"updated_at":{"$ref":"#/$defs/Timestamp"},"compatibility":{"$ref":"#/$defs/Compatibility"},"runtime":{"$ref":"#/$defs/ManifestRuntime"},"creator":{"$ref":"#/$defs/Creator"},"content_digest":{"$ref":"#/$defs/Digest"},"authoring":{"$ref":"#/$defs/ManifestAuthoring"},"access":{"$ref":"#/$defs/AccessMode"},"license":{"$ref":"#/$defs/License"},"summary":{"$ref":"#/$defs/NonEmptyText"},"description":{"$ref":"#/$defs/Text"},"keywords":{"type":"array","items":{"$ref":"#/$defs/Text"},"minItems":0},"lineage":{"type":"array","items":{"$ref":"#/$defs/ManifestLineage"},"minItems":0},"languages":{"type":"array","items":{"$ref":"#/$defs/Identifier"},"minItems":1,"uniqueItems":true},"history":{"$ref":"#/$defs/HistoryDeclaration"}},"required":["asset_id","asset_uid","asset_type","title","version","judgment_version","created_at","updated_at","compatibility","runtime","summary","languages","history"],"additionalProperties":false},"NativeCreationRequest06":{"type":"object","properties":{"request_id":{"$ref":"#/$defs/Identifier"},"tuple":{"$ref":"#/$defs/CandidateVersionTuple06"},"operation":{"type":"string","const":"create_public_asset"},"timeout_ms":{"type":"integer","minimum":1,"maximum":60000}},"required":["request_id","tuple","operation","timeout_ms"],"additionalProperties":false},"NonEmptyText":{"type":"string","minLength":1,"pattern":"\\S"},"Ref":{"type":"object","properties":{"kind":{"type":"string","enum":["asset","judgment","result","contract","condition","component","unit","plan","plan_node","policy","branch_entry","candidate","material","shared_declaration","boundary","exception","misuse","reason","source","source_use","resource","relationship","dependency","example","example_result","revision","actor"]},"id":{"$ref":"#/$defs/Identifier"},"asset":{"$ref":"#/$defs/AssetIdentity"}},"required":["kind","id"],"additionalProperties":false},"RevisionEntry":{"type":"object","properties":{"id":{"$ref":"#/$defs/Identifier"},"version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"},"at":{"$ref":"#/$defs/Timestamp"},"summary":{"$ref":"#/$defs/NonEmptyText"},"affected_refs":{"type":"array","items":{"$ref":"#/$defs/Ref"},"minItems":1,"uniqueItems":true},"previous":{"$ref":"#/$defs/RevisionRef"},"actor_refs":{"type":"array","items":{"$ref":"#/$defs/Identifier"},"minItems":0,"uniqueItems":true}},"required":["id","version","judgment_version","at","summary","affected_refs","actor_refs"],"additionalProperties":false},"RevisionRef":{"type":"object","properties":{"kind":{"type":"string","enum":["revision"]},"id":{"$ref":"#/$defs/Identifier"},"asset":{"$ref":"#/$defs/AssetIdentity"}},"required":["kind","id"],"additionalProperties":false},"RuntimeMandatoryEntryName":{"allOf":[{"$ref":"#/$defs/EntryName"},{"not":{"enum":["checksums.json","signature.kdsig","mimetype"]}},{"pattern":"^(?!build-receipt\\.json$)(?!reports/)(?!authoring/)"}]},"SemanticValue":{"oneOf":[{"$ref":"#/$defs/ValueText"},{"$ref":"#/$defs/ValueNumber"},{"$ref":"#/$defs/ValueBoolean"},{"$ref":"#/$defs/ValueNull"},{"$ref":"#/$defs/ValueList"},{"$ref":"#/$defs/ValueRecord"}]},"SourceRouteMemberInventory06":{"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"type":{"type":"string","const":"file"},"mode":{"$ref":"#/$defs/UInt"},"size":{"$ref":"#/$defs/UInt"},"sha256":{"$ref":"#/$defs/Digest"}},"required":["name","type","mode","size","sha256"],"additionalProperties":false},"TermRef":{"type":"object","properties":{"term":{"$ref":"#/$defs/Identifier"},"extension":{"$ref":"#/$defs/Extension"},"vocabulary":{"$ref":"#/$defs/TermVocabulary"}},"required":["term"],"additionalProperties":false},"TermVocabulary":{"type":"string","enum":["core","author"]},"Text":{"type":"string"},"Timestamp":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991},"ValueBoolean":{"type":"object","properties":{"kind":{"const":"boolean","type":"string"},"value":{"$ref":"#/$defs/Boolean"}},"required":["kind","value"],"additionalProperties":false},"ValueField":{"type":"object","properties":{"name":{"$ref":"#/$defs/Identifier"},"value":{"$ref":"#/$defs/SemanticValue"}},"required":["name","value"],"additionalProperties":false},"ValueList":{"type":"object","properties":{"kind":{"const":"list","type":"string"},"items":{"type":"array","items":{"$ref":"#/$defs/SemanticValue"},"minItems":0}},"required":["kind","items"],"additionalProperties":false},"ValueNull":{"type":"object","properties":{"kind":{"const":"null","type":"string"},"value":{"const":null,"type":"null"}},"required":["kind","value"],"additionalProperties":false},"ValueNumber":{"type":"object","properties":{"kind":{"const":"number","type":"string"},"value":{"$ref":"#/$defs/FiniteNumber"}},"required":["kind","value"],"additionalProperties":false},"ValueRecord":{"type":"object","properties":{"kind":{"const":"record","type":"string"},"fields":{"type":"array","items":{"$ref":"#/$defs/ValueField"},"minItems":0}},"required":["kind","fields"],"additionalProperties":false},"ValueText":{"type":"object","properties":{"kind":{"const":"text","type":"string"},"value":{"$ref":"#/$defs/Text"}},"required":["kind","value"],"additionalProperties":false},"VersionLabel":{"$ref":"#/$defs/Identifier"}}};
const schema122 = {"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeCreationContract06"},"request":{"$ref":"#/$defs/NativeCreationRequest06"},"request_digest":{"$ref":"#/$defs/Digest"},"input_digest":{"$ref":"#/$defs/Digest"},"input":{"$ref":"#/$defs/NativeCreationInputObservation06"},"manifest":{"$ref":"#/$defs/NativeCreationManifest06"},"intent":{"type":"string","const":"encode_exact_owned_authored_input_as_public_sections06"},"adoption":{"type":"string","const":"not_observed"},"output_delivery":{"type":"string","const":"return_bytes_only"}},"required":["contract","request","request_digest","input_digest","input","manifest","intent","adoption","output_delivery"],"additionalProperties":false};

function validate81(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate81.evaluated;
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
if("kdna.creation-sections/0.1.0-candidate" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.creation-sections/0.1.0-candidate"},message:"must be equal to constant"};
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
if(!pattern16.test(data2)){
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
validate81.errors = vErrors;
return errors === 0;
}
validate81.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate83(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate83.evaluated;
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
if(data.timeout_ms === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "timeout_ms"},message:"must have required property '"+"timeout_ms"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "request_id") || (key0 === "tuple")) || (key0 === "operation")) || (key0 === "timeout_ms"))){
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
if(data.request_id !== undefined){
let data0 = data.request_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err5 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data0) < 1){
const err6 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern4.test(data0)){
const err7 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err8 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.tuple !== undefined){
let data1 = data.tuple;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.container === undefined){
const err9 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "container"},message:"must have required property '"+"container"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data1.payload_profile === undefined){
const err10 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "payload_profile"},message:"must have required property '"+"payload_profile"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data1.payload_version === undefined){
const err11 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "payload_version"},message:"must have required property '"+"payload_version"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data1.core === undefined){
const err12 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "core"},message:"must have required property '"+"core"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data1.ir === undefined){
const err13 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "ir"},message:"must have required property '"+"ir"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data1.runtime === undefined){
const err14 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "runtime"},message:"must have required property '"+"runtime"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data1.plan === undefined){
const err15 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "plan"},message:"must have required property '"+"plan"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data1.host === undefined){
const err16 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "host"},message:"must have required property '"+"host"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data1.trace === undefined){
const err17 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "trace"},message:"must have required property '"+"trace"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data1.read === undefined){
const err18 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/required",keyword:"required",params:{missingProperty: "read"},message:"must have required property '"+"read"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key1 in data1){
if(!(func1.call(schema103.properties, key1))){
const err19 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data1.container !== undefined){
let data2 = data1.container;
if(typeof data2 !== "string"){
const err20 = {instancePath:instancePath+"/tuple/container",schemaPath:"#/$defs/CandidateVersionTuple06/properties/container/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if("0.6.0" !== data2){
const err21 = {instancePath:instancePath+"/tuple/container",schemaPath:"#/$defs/CandidateVersionTuple06/properties/container/const",keyword:"const",params:{allowedValue: "0.6.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data1.payload_profile !== undefined){
let data3 = data1.payload_profile;
if(typeof data3 !== "string"){
const err22 = {instancePath:instancePath+"/tuple/payload_profile",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_profile/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if("kdna.payload.judgment" !== data3){
const err23 = {instancePath:instancePath+"/tuple/payload_profile",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_profile/const",keyword:"const",params:{allowedValue: "kdna.payload.judgment"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data1.payload_version !== undefined){
let data4 = data1.payload_version;
if(typeof data4 !== "string"){
const err24 = {instancePath:instancePath+"/tuple/payload_version",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if("0.5.1" !== data4){
const err25 = {instancePath:instancePath+"/tuple/payload_version",schemaPath:"#/$defs/CandidateVersionTuple06/properties/payload_version/const",keyword:"const",params:{allowedValue: "0.5.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data1.core !== undefined){
let data5 = data1.core;
if(typeof data5 !== "string"){
const err26 = {instancePath:instancePath+"/tuple/core",schemaPath:"#/$defs/CandidateVersionTuple06/properties/core/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if("kdna.core/0.8.2" !== data5){
const err27 = {instancePath:instancePath+"/tuple/core",schemaPath:"#/$defs/CandidateVersionTuple06/properties/core/const",keyword:"const",params:{allowedValue: "kdna.core/0.8.2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data1.ir !== undefined){
let data6 = data1.ir;
if(typeof data6 !== "string"){
const err28 = {instancePath:instancePath+"/tuple/ir",schemaPath:"#/$defs/CandidateVersionTuple06/properties/ir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if("kdna.canonical-ir/0.6.1" !== data6){
const err29 = {instancePath:instancePath+"/tuple/ir",schemaPath:"#/$defs/CandidateVersionTuple06/properties/ir/const",keyword:"const",params:{allowedValue: "kdna.canonical-ir/0.6.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data1.runtime !== undefined){
let data7 = data1.runtime;
if(typeof data7 !== "string"){
const err30 = {instancePath:instancePath+"/tuple/runtime",schemaPath:"#/$defs/CandidateVersionTuple06/properties/runtime/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if("kdna.runtime-capsule/0.3.1" !== data7){
const err31 = {instancePath:instancePath+"/tuple/runtime",schemaPath:"#/$defs/CandidateVersionTuple06/properties/runtime/const",keyword:"const",params:{allowedValue: "kdna.runtime-capsule/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data1.plan !== undefined){
let data8 = data1.plan;
if(typeof data8 !== "string"){
const err32 = {instancePath:instancePath+"/tuple/plan",schemaPath:"#/$defs/CandidateVersionTuple06/properties/plan/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if("kdna.consumption-plan/0.3.1" !== data8){
const err33 = {instancePath:instancePath+"/tuple/plan",schemaPath:"#/$defs/CandidateVersionTuple06/properties/plan/const",keyword:"const",params:{allowedValue: "kdna.consumption-plan/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data1.host !== undefined){
let data9 = data1.host;
if(typeof data9 !== "string"){
const err34 = {instancePath:instancePath+"/tuple/host",schemaPath:"#/$defs/CandidateVersionTuple06/properties/host/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if("kdna.agent-host/0.3.1" !== data9){
const err35 = {instancePath:instancePath+"/tuple/host",schemaPath:"#/$defs/CandidateVersionTuple06/properties/host/const",keyword:"const",params:{allowedValue: "kdna.agent-host/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data1.trace !== undefined){
let data10 = data1.trace;
if(typeof data10 !== "string"){
const err36 = {instancePath:instancePath+"/tuple/trace",schemaPath:"#/$defs/CandidateVersionTuple06/properties/trace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if("kdna.judgment-trace/0.3.1" !== data10){
const err37 = {instancePath:instancePath+"/tuple/trace",schemaPath:"#/$defs/CandidateVersionTuple06/properties/trace/const",keyword:"const",params:{allowedValue: "kdna.judgment-trace/0.3.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data1.read !== undefined){
let data11 = data1.read;
if(typeof data11 !== "string"){
const err38 = {instancePath:instancePath+"/tuple/read",schemaPath:"#/$defs/CandidateVersionTuple06/properties/read/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if("kdna.read/0.7.0-candidate" !== data11){
const err39 = {instancePath:instancePath+"/tuple/read",schemaPath:"#/$defs/CandidateVersionTuple06/properties/read/const",keyword:"const",params:{allowedValue: "kdna.read/0.7.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
}
else {
const err40 = {instancePath:instancePath+"/tuple",schemaPath:"#/$defs/CandidateVersionTuple06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.operation !== undefined){
let data12 = data.operation;
if(typeof data12 !== "string"){
const err41 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if("create_public_asset" !== data12){
const err42 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/const",keyword:"const",params:{allowedValue: "create_public_asset"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.timeout_ms !== undefined){
let data13 = data.timeout_ms;
if(!(((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))) && (isFinite(data13)))){
const err43 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/properties/timeout_ms/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 > 60000 || isNaN(data13)){
const err44 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/properties/timeout_ms/maximum",keyword:"maximum",params:{comparison: "<=", limit: 60000},message:"must be <= 60000"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data13 < 1 || isNaN(data13)){
const err45 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/properties/timeout_ms/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
}
}
else {
const err46 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
validate83.errors = vErrors;
return errors === 0;
}
validate83.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate86(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate86.evaluated;
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
if(func2(data0) > 4096){
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func2(data0) < 1){
const err7 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern12.test(data0)){
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
if(!pattern16.test(data4)){
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
validate86.errors = vErrors;
return errors === 0;
}
validate86.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate85(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate85.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.manifest_digest === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_digest"},message:"must have required property '"+"manifest_digest"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.payload_digest === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload_digest"},message:"must have required property '"+"payload_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.members === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.member_bytes === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_bytes"},message:"must have required property '"+"member_bytes"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "manifest_digest") || (key0 === "payload_digest")) || (key0 === "members")) || (key0 === "member_bytes"))){
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
if(data.manifest_digest !== undefined){
let data0 = data.manifest_digest;
if(typeof data0 === "string"){
if(!pattern16.test(data0)){
const err5 = {instancePath:instancePath+"/manifest_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err6 = {instancePath:instancePath+"/manifest_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.payload_digest !== undefined){
let data1 = data.payload_digest;
if(typeof data1 === "string"){
if(!pattern16.test(data1)){
const err7 = {instancePath:instancePath+"/payload_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err8 = {instancePath:instancePath+"/payload_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.members !== undefined){
let data2 = data.members;
if(Array.isArray(data2)){
if(data2.length > 128){
const err9 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data2.length < 0){
const err10 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
if(!(validate86(data2[i0], {instancePath:instancePath+"/members/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate86.errors : vErrors.concat(validate86.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.member_bytes !== undefined){
let data4 = data.member_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err12 = {instancePath:instancePath+"/member_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
const err13 = {instancePath:instancePath+"/member_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err14 = {instancePath:instancePath+"/member_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
}
else {
const err15 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
validate85.errors = vErrors;
return errors === 0;
}
validate85.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate90(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate90.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.min_loader_version === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "min_loader_version"},message:"must have required property '"+"min_loader_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.profile === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "profile"},message:"must have required property '"+"profile"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.profile_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "profile_version"},message:"must have required property '"+"profile_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "min_loader_version") || (key0 === "profile")) || (key0 === "profile_version"))){
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
if(data.min_loader_version !== undefined){
let data0 = data.min_loader_version;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err4 = {instancePath:instancePath+"/min_loader_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func2(data0) < 1){
const err5 = {instancePath:instancePath+"/min_loader_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern4.test(data0)){
const err6 = {instancePath:instancePath+"/min_loader_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/min_loader_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.profile !== undefined){
let data1 = data.profile;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/profile",schemaPath:"#/properties/profile/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if("kdna.payload.judgment" !== data1){
const err9 = {instancePath:instancePath+"/profile",schemaPath:"#/properties/profile/const",keyword:"const",params:{allowedValue: "kdna.payload.judgment"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.profile_version !== undefined){
let data2 = data.profile_version;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/profile_version",schemaPath:"#/properties/profile_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if("0.5.1" !== data2){
const err11 = {instancePath:instancePath+"/profile_version",schemaPath:"#/properties/profile_version/const",keyword:"const",params:{allowedValue: "0.5.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate90.errors = vErrors;
return errors === 0;
}
validate90.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate93(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate93.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func2(data) > 4096){
const err0 = {instancePath,schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func2(data) < 1){
const err1 = {instancePath,schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern12.test(data)){
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
if(!pattern13.test(data)){
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
validate93.errors = vErrors;
return errors === 0;
}
validate93.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate92(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate92.evaluated;
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
if(!(validate93(data0[i0], {instancePath:instancePath+"/mandatory_entries/" + i0,parentData:data0,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
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
validate92.errors = vErrors;
return errors === 0;
}
validate92.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate96(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate96.evaluated;
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
if(data.kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "id") || (key0 === "name")) || (key0 === "kind"))){
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
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err3 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(func2(data0) < 1){
const err4 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern4.test(data0)){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.name !== undefined){
let data1 = data.name;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err7 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern6.test(data1)){
const err8 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.kind !== undefined){
let data2 = data.kind;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/kind",schemaPath:"#/$defs/ActorKind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!((((((data2 === "person") || (data2 === "organization")) || (data2 === "collective")) || (data2 === "anonymous")) || (data2 === "asset_native")) || (data2 === "agent"))){
const err11 = {instancePath:instancePath+"/kind",schemaPath:"#/$defs/ActorKind/enum",keyword:"enum",params:{allowedValues: schema49.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate96.errors = vErrors;
return errors === 0;
}
validate96.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate98(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate98.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.content_digest === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "content_digest"},message:"must have required property '"+"content_digest"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "content_digest")){
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
if(data.content_digest !== undefined){
let data0 = data.content_digest;
if(typeof data0 === "string"){
if(!pattern16.test(data0)){
const err2 = {instancePath:instancePath+"/content_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err3 = {instancePath:instancePath+"/content_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err4 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
validate98.errors = vErrors;
return errors === 0;
}
validate98.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate100(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate100.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.identifier === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "identifier"},message:"must have required property '"+"identifier"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "identifier") || (key0 === "uri"))){
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
if(data.identifier !== undefined){
let data0 = data.identifier;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err2 = {instancePath:instancePath+"/identifier",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(!pattern6.test(data0)){
const err3 = {instancePath:instancePath+"/identifier",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
else {
const err4 = {instancePath:instancePath+"/identifier",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.uri !== undefined){
let data1 = data.uri;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err5 = {instancePath:instancePath+"/uri",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern6.test(data1)){
const err6 = {instancePath:instancePath+"/uri",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/uri",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate100.errors = vErrors;
return errors === 0;
}
validate100.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate106(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate106.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "value"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("text" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "text"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.value !== undefined){
if(typeof data.value !== "string"){
const err5 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/Text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate106.errors = vErrors;
return errors === 0;
}
validate106.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate108(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate108.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "value"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("number" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "number"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.value !== undefined){
let data1 = data.value;
if(!((typeof data1 == "number") && (isFinite(data1)))){
const err5 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/FiniteNumber/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate108.errors = vErrors;
return errors === 0;
}
validate108.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate110(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate110.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "value"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("boolean" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "boolean"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.value !== undefined){
if(typeof data.value !== "boolean"){
const err5 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/Boolean/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate110.errors = vErrors;
return errors === 0;
}
validate110.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const wrapper2 = {validate: validate105};

function validate112(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate112.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.items === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "items"},message:"must have required property '"+"items"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "items"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("list" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "list"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.items !== undefined){
let data1 = data.items;
if(Array.isArray(data1)){
if(data1.length < 0){
const err5 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
if(!(wrapper2.validate(data1[i0], {instancePath:instancePath+"/items/" + i0,parentData:data1,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? wrapper2.validate.errors : vErrors.concat(wrapper2.validate.errors);
errors = vErrors.length;
}
}
}
else {
const err6 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
validate112.errors = vErrors;
return errors === 0;
}
validate112.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate115(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate115.evaluated;
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
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "name") || (key0 === "value"))){
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
if(data.name !== undefined){
let data0 = data.name;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err3 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(func2(data0) < 1){
const err4 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern4.test(data0)){
const err5 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.value !== undefined){
if(!(wrapper2.validate(data.value, {instancePath:instancePath+"/value",parentData:data,parentDataProperty:"value",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? wrapper2.validate.errors : vErrors.concat(wrapper2.validate.errors);
errors = vErrors.length;
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
validate115.errors = vErrors;
return errors === 0;
}
validate115.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate114(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate114.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.fields === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fields"},message:"must have required property '"+"fields"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "fields"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("record" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "record"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.fields !== undefined){
let data1 = data.fields;
if(Array.isArray(data1)){
if(data1.length < 0){
const err5 = {instancePath:instancePath+"/fields",schemaPath:"#/properties/fields/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
if(!(validate115(data1[i0], {instancePath:instancePath+"/fields/" + i0,parentData:data1,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
errors = vErrors.length;
}
}
}
else {
const err6 = {instancePath:instancePath+"/fields",schemaPath:"#/properties/fields/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
validate114.errors = vErrors;
return errors === 0;
}
validate114.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate105(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate105.evaluated;
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
if(!(validate106(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate106.errors : vErrors.concat(validate106.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate108(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate108.errors : vErrors.concat(validate108.errors);
errors = vErrors.length;
}
var _valid0 = _errs2 === errors;
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
const _errs3 = errors;
if(!(validate110(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate110.errors : vErrors.concat(validate110.errors);
errors = vErrors.length;
}
var _valid0 = _errs3 === errors;
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
const _errs4 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/$defs/ValueNull/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/$defs/ValueNull/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "value"))){
const err2 = {instancePath,schemaPath:"#/$defs/ValueNull/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
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
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/$defs/ValueNull/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if("null" !== data0){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/$defs/ValueNull/properties/kind/const",keyword:"const",params:{allowedValue: "null"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.value !== undefined){
let data1 = data.value;
if(data1 !== null){
const err5 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/ValueNull/properties/value/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(null !== data1){
const err6 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/ValueNull/properties/value/const",keyword:"const",params:{allowedValue: schema76.properties.value.const},message:"must be equal to constant"};
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
const err7 = {instancePath,schemaPath:"#/$defs/ValueNull/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var _valid0 = _errs4 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid0 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
const _errs12 = errors;
if(!(validate112(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate112.errors : vErrors.concat(validate112.errors);
errors = vErrors.length;
}
var _valid0 = _errs12 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid0 = true;
passing0 = 4;
if(props0 !== true){
props0 = true;
}
}
const _errs13 = errors;
if(!(validate114(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate114.errors : vErrors.concat(validate114.errors);
errors = vErrors.length;
}
var _valid0 = _errs13 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid0 = true;
passing0 = 5;
if(props0 !== true){
props0 = true;
}
}
}
}
}
}
}
if(!valid0){
const err8 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
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
validate105.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate105.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate104(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate104.evaluated;
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
if(data.critical === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "critical"},message:"must have required property '"+"critical"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.definition === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "definition"},message:"must have required property '"+"definition"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.value === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "id") || (key0 === "critical")) || (key0 === "definition")) || (key0 === "value"))){
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
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data0) < 1){
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern4.test(data0)){
const err7 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.critical !== undefined){
if(typeof data.critical !== "boolean"){
const err9 = {instancePath:instancePath+"/critical",schemaPath:"#/$defs/Boolean/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.definition !== undefined){
let data2 = data.definition;
if(typeof data2 === "string"){
if(func2(data2) < 1){
const err10 = {instancePath:instancePath+"/definition",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern6.test(data2)){
const err11 = {instancePath:instancePath+"/definition",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/definition",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.value !== undefined){
if(!(validate105(data.value, {instancePath:instancePath+"/value",parentData:data,parentDataProperty:"value",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate105.errors : vErrors.concat(validate105.errors);
errors = vErrors.length;
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
validate104.errors = vErrors;
return errors === 0;
}
validate104.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate103(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate103.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.term === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "term"},message:"must have required property '"+"term"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "term") || (key0 === "extension")) || (key0 === "vocabulary"))){
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
if(data.term !== undefined){
let data0 = data.term;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err2 = {instancePath:instancePath+"/term",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(func2(data0) < 1){
const err3 = {instancePath:instancePath+"/term",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!pattern4.test(data0)){
const err4 = {instancePath:instancePath+"/term",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/term",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.extension !== undefined){
if(!(validate104(data.extension, {instancePath:instancePath+"/extension",parentData:data,parentDataProperty:"extension",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate104.errors : vErrors.concat(validate104.errors);
errors = vErrors.length;
}
}
if(data.vocabulary !== undefined){
let data2 = data.vocabulary;
if(typeof data2 !== "string"){
const err6 = {instancePath:instancePath+"/vocabulary",schemaPath:"#/$defs/TermVocabulary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!((data2 === "core") || (data2 === "author"))){
const err7 = {instancePath:instancePath+"/vocabulary",schemaPath:"#/$defs/TermVocabulary/enum",keyword:"enum",params:{allowedValues: schema81.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate103.errors = vErrors;
return errors === 0;
}
validate103.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate102(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate102.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.source_asset_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_asset_id"},message:"must have required property '"+"source_asset_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.source_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_version"},message:"must have required property '"+"source_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.relationship === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "relationship"},message:"must have required property '"+"relationship"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "source_asset_id") || (key0 === "source_version")) || (key0 === "relationship"))){
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
if(data.source_asset_id !== undefined){
let data0 = data.source_asset_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err4 = {instancePath:instancePath+"/source_asset_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func2(data0) < 1){
const err5 = {instancePath:instancePath+"/source_asset_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern4.test(data0)){
const err6 = {instancePath:instancePath+"/source_asset_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/source_asset_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.source_version !== undefined){
let data1 = data.source_version;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err8 = {instancePath:instancePath+"/source_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func2(data1) < 1){
const err9 = {instancePath:instancePath+"/source_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern4.test(data1)){
const err10 = {instancePath:instancePath+"/source_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err11 = {instancePath:instancePath+"/source_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.relationship !== undefined){
if(!(validate103(data.relationship, {instancePath:instancePath+"/relationship",parentData:data,parentDataProperty:"relationship",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate103.errors : vErrors.concat(validate103.errors);
errors = vErrors.length;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate102.errors = vErrors;
return errors === 0;
}
validate102.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate125(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate125.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.asset_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "asset_id"},message:"must have required property '"+"asset_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.asset_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "asset_version"},message:"must have required property '"+"asset_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.judgment_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "judgment_version"},message:"must have required property '"+"judgment_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "asset_id") || (key0 === "asset_version")) || (key0 === "judgment_version"))){
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
if(data.asset_id !== undefined){
let data0 = data.asset_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err4 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func2(data0) < 1){
const err5 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern4.test(data0)){
const err6 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.asset_version !== undefined){
let data1 = data.asset_version;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err8 = {instancePath:instancePath+"/asset_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func2(data1) < 1){
const err9 = {instancePath:instancePath+"/asset_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern4.test(data1)){
const err10 = {instancePath:instancePath+"/asset_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err11 = {instancePath:instancePath+"/asset_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.judgment_version !== undefined){
let data2 = data.judgment_version;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err12 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func2(data2) < 1){
const err13 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern4.test(data2)){
const err14 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err15 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate125.errors = vErrors;
return errors === 0;
}
validate125.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate124(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate124.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "kind") || (key0 === "id")) || (key0 === "asset"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!(((((((((((((((((((((((((((data0 === "asset") || (data0 === "judgment")) || (data0 === "result")) || (data0 === "contract")) || (data0 === "condition")) || (data0 === "component")) || (data0 === "unit")) || (data0 === "plan")) || (data0 === "plan_node")) || (data0 === "policy")) || (data0 === "branch_entry")) || (data0 === "candidate")) || (data0 === "material")) || (data0 === "shared_declaration")) || (data0 === "boundary")) || (data0 === "exception")) || (data0 === "misuse")) || (data0 === "reason")) || (data0 === "source")) || (data0 === "source_use")) || (data0 === "resource")) || (data0 === "relationship")) || (data0 === "dependency")) || (data0 === "example")) || (data0 === "example_result")) || (data0 === "revision")) || (data0 === "actor"))){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema91.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data1) < 1){
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern4.test(data1)){
const err7 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.asset !== undefined){
if(!(validate125(data.asset, {instancePath:instancePath+"/asset",parentData:data,parentDataProperty:"asset",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate125.errors : vErrors.concat(validate125.errors);
errors = vErrors.length;
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
validate124.errors = vErrors;
return errors === 0;
}
validate124.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate128(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate128.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "kind") || (key0 === "id")) || (key0 === "asset"))){
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
if(data.kind !== undefined){
let data0 = data.kind;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!(data0 === "revision")){
const err4 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema97.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data1) < 1){
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern4.test(data1)){
const err7 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.asset !== undefined){
if(!(validate125(data.asset, {instancePath:instancePath+"/asset",parentData:data,parentDataProperty:"asset",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate125.errors : vErrors.concat(validate125.errors);
errors = vErrors.length;
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
validate128.errors = vErrors;
return errors === 0;
}
validate128.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate123(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate123.evaluated;
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
if(data.judgment_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "judgment_version"},message:"must have required property '"+"judgment_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.at === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "at"},message:"must have required property '"+"at"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.summary === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "summary"},message:"must have required property '"+"summary"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.affected_refs === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "affected_refs"},message:"must have required property '"+"affected_refs"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.actor_refs === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "actor_refs"},message:"must have required property '"+"actor_refs"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "id") || (key0 === "version")) || (key0 === "judgment_version")) || (key0 === "at")) || (key0 === "summary")) || (key0 === "affected_refs")) || (key0 === "previous")) || (key0 === "actor_refs"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err8 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func2(data0) < 1){
const err9 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern4.test(data0)){
const err10 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err11 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.version !== undefined){
let data1 = data.version;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err12 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func2(data1) < 1){
const err13 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern4.test(data1)){
const err14 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err15 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.judgment_version !== undefined){
let data2 = data.judgment_version;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err16 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(func2(data2) < 1){
const err17 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!pattern4.test(data2)){
const err18 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err19 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.at !== undefined){
let data3 = data.at;
if(typeof data3 === "string"){
if(!pattern9.test(data3)){
const err20 = {instancePath:instancePath+"/at",schemaPath:"#/$defs/Timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
else {
const err21 = {instancePath:instancePath+"/at",schemaPath:"#/$defs/Timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.summary !== undefined){
let data4 = data.summary;
if(typeof data4 === "string"){
if(func2(data4) < 1){
const err22 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!pattern6.test(data4)){
const err23 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
else {
const err24 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.affected_refs !== undefined){
let data5 = data.affected_refs;
if(Array.isArray(data5)){
if(data5.length < 1){
const err25 = {instancePath:instancePath+"/affected_refs",schemaPath:"#/properties/affected_refs/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
if(!(validate124(data5[i0], {instancePath:instancePath+"/affected_refs/" + i0,parentData:data5,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate124.errors : vErrors.concat(validate124.errors);
errors = vErrors.length;
}
}
let i1 = data5.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data5[i1], data5[j0])){
const err26 = {instancePath:instancePath+"/affected_refs",schemaPath:"#/properties/affected_refs/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err27 = {instancePath:instancePath+"/affected_refs",schemaPath:"#/properties/affected_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.previous !== undefined){
if(!(validate128(data.previous, {instancePath:instancePath+"/previous",parentData:data,parentDataProperty:"previous",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate128.errors : vErrors.concat(validate128.errors);
errors = vErrors.length;
}
}
if(data.actor_refs !== undefined){
let data8 = data.actor_refs;
if(Array.isArray(data8)){
if(data8.length < 0){
const err28 = {instancePath:instancePath+"/actor_refs",schemaPath:"#/properties/actor_refs/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
const len1 = data8.length;
for(let i2=0; i2<len1; i2++){
let data9 = data8[i2];
if(typeof data9 === "string"){
if(func2(data9) > 256){
const err29 = {instancePath:instancePath+"/actor_refs/" + i2,schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(func2(data9) < 1){
const err30 = {instancePath:instancePath+"/actor_refs/" + i2,schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(!pattern4.test(data9)){
const err31 = {instancePath:instancePath+"/actor_refs/" + i2,schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
else {
const err32 = {instancePath:instancePath+"/actor_refs/" + i2,schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
let i3 = data8.length;
let j1;
if(i3 > 1){
outer1:
for(;i3--;){
for(j1 = i3; j1--;){
if(func0(data8[i3], data8[j1])){
const err33 = {instancePath:instancePath+"/actor_refs",schemaPath:"#/properties/actor_refs/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err34 = {instancePath:instancePath+"/actor_refs",schemaPath:"#/properties/actor_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
}
else {
const err35 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
validate123.errors = vErrors;
return errors === 0;
}
validate123.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate122(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate122.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.coverage === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "coverage"},message:"must have required property '"+"coverage"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.statement === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "statement"},message:"must have required property '"+"statement"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.entries === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entries"},message:"must have required property '"+"entries"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "coverage") || (key0 === "statement")) || (key0 === "entries"))){
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
if(data.coverage !== undefined){
let data0 = data.coverage;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!((data0 === "complete") || (data0 === "partial"))){
const err5 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/enum",keyword:"enum",params:{allowedValues: schema83.properties.coverage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.statement !== undefined){
let data1 = data.statement;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err6 = {instancePath:instancePath+"/statement",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern6.test(data1)){
const err7 = {instancePath:instancePath+"/statement",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
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
const err8 = {instancePath:instancePath+"/statement",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.entries !== undefined){
let data2 = data.entries;
if(Array.isArray(data2)){
if(data2.length < 0){
const err9 = {instancePath:instancePath+"/entries",schemaPath:"#/properties/entries/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
if(!(validate123(data2[i0], {instancePath:instancePath+"/entries/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate123.errors : vErrors.concat(validate123.errors);
errors = vErrors.length;
}
}
}
else {
const err10 = {instancePath:instancePath+"/entries",schemaPath:"#/properties/entries/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate122.errors = vErrors;
return errors === 0;
}
validate122.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate89(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate89.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.asset_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "asset_id"},message:"must have required property '"+"asset_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.asset_uid === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "asset_uid"},message:"must have required property '"+"asset_uid"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.asset_type === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "asset_type"},message:"must have required property '"+"asset_type"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.title === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.version === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.judgment_version === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "judgment_version"},message:"must have required property '"+"judgment_version"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.created_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "created_at"},message:"must have required property '"+"created_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.updated_at === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "updated_at"},message:"must have required property '"+"updated_at"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.compatibility === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "compatibility"},message:"must have required property '"+"compatibility"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.runtime === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "runtime"},message:"must have required property '"+"runtime"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.summary === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "summary"},message:"must have required property '"+"summary"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.languages === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "languages"},message:"must have required property '"+"languages"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.history === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "history"},message:"must have required property '"+"history"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema32.properties, key0))){
const err13 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.asset_id !== undefined){
let data0 = data.asset_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err14 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(func2(data0) < 1){
const err15 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!pattern4.test(data0)){
const err16 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err17 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.asset_uid !== undefined){
let data1 = data.asset_uid;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err18 = {instancePath:instancePath+"/asset_uid",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(func2(data1) < 1){
const err19 = {instancePath:instancePath+"/asset_uid",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!pattern4.test(data1)){
const err20 = {instancePath:instancePath+"/asset_uid",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
else {
const err21 = {instancePath:instancePath+"/asset_uid",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.asset_type !== undefined){
let data2 = data.asset_type;
if(typeof data2 !== "string"){
const err22 = {instancePath:instancePath+"/asset_type",schemaPath:"#/$defs/AssetType/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!((((((data2 === "domain") || (data2 === "cluster")) || (data2 === "tool")) || (data2 === "sample")) || (data2 === "fixture")) || (data2 === "bundle"))){
const err23 = {instancePath:instancePath+"/asset_type",schemaPath:"#/$defs/AssetType/enum",keyword:"enum",params:{allowedValues: schema35.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.title !== undefined){
let data3 = data.title;
if(typeof data3 === "string"){
if(func2(data3) < 1){
const err24 = {instancePath:instancePath+"/title",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!pattern6.test(data3)){
const err25 = {instancePath:instancePath+"/title",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
else {
const err26 = {instancePath:instancePath+"/title",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.version !== undefined){
let data4 = data.version;
if(typeof data4 === "string"){
if(func2(data4) > 256){
const err27 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(func2(data4) < 1){
const err28 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(!pattern4.test(data4)){
const err29 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
else {
const err30 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.judgment_version !== undefined){
let data5 = data.judgment_version;
if(typeof data5 === "string"){
if(func2(data5) > 256){
const err31 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(func2(data5) < 1){
const err32 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(!pattern4.test(data5)){
const err33 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
else {
const err34 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.created_at !== undefined){
let data6 = data.created_at;
if(typeof data6 === "string"){
if(!pattern9.test(data6)){
const err35 = {instancePath:instancePath+"/created_at",schemaPath:"#/$defs/Timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"+"\""};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
else {
const err36 = {instancePath:instancePath+"/created_at",schemaPath:"#/$defs/Timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.updated_at !== undefined){
let data7 = data.updated_at;
if(typeof data7 === "string"){
if(!pattern9.test(data7)){
const err37 = {instancePath:instancePath+"/updated_at",schemaPath:"#/$defs/Timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$"+"\""};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
else {
const err38 = {instancePath:instancePath+"/updated_at",schemaPath:"#/$defs/Timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.compatibility !== undefined){
if(!(validate90(data.compatibility, {instancePath:instancePath+"/compatibility",parentData:data,parentDataProperty:"compatibility",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate90.errors : vErrors.concat(validate90.errors);
errors = vErrors.length;
}
}
if(data.runtime !== undefined){
if(!(validate92(data.runtime, {instancePath:instancePath+"/runtime",parentData:data,parentDataProperty:"runtime",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate92.errors : vErrors.concat(validate92.errors);
errors = vErrors.length;
}
}
if(data.creator !== undefined){
if(!(validate96(data.creator, {instancePath:instancePath+"/creator",parentData:data,parentDataProperty:"creator",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate96.errors : vErrors.concat(validate96.errors);
errors = vErrors.length;
}
}
if(data.content_digest !== undefined){
let data11 = data.content_digest;
if(typeof data11 === "string"){
if(!pattern16.test(data11)){
const err39 = {instancePath:instancePath+"/content_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
else {
const err40 = {instancePath:instancePath+"/content_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.authoring !== undefined){
if(!(validate98(data.authoring, {instancePath:instancePath+"/authoring",parentData:data,parentDataProperty:"authoring",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate98.errors : vErrors.concat(validate98.errors);
errors = vErrors.length;
}
}
if(data.access !== undefined){
let data13 = data.access;
if(typeof data13 !== "string"){
const err41 = {instancePath:instancePath+"/access",schemaPath:"#/$defs/AccessMode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(!(((data13 === "public") || (data13 === "licensed")) || (data13 === "remote"))){
const err42 = {instancePath:instancePath+"/access",schemaPath:"#/$defs/AccessMode/enum",keyword:"enum",params:{allowedValues: schema53.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.license !== undefined){
if(!(validate100(data.license, {instancePath:instancePath+"/license",parentData:data,parentDataProperty:"license",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate100.errors : vErrors.concat(validate100.errors);
errors = vErrors.length;
}
}
if(data.summary !== undefined){
let data15 = data.summary;
if(typeof data15 === "string"){
if(func2(data15) < 1){
const err43 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(!pattern6.test(data15)){
const err44 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
else {
const err45 = {instancePath:instancePath+"/summary",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.description !== undefined){
if(typeof data.description !== "string"){
const err46 = {instancePath:instancePath+"/description",schemaPath:"#/$defs/Text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.keywords !== undefined){
let data17 = data.keywords;
if(Array.isArray(data17)){
if(data17.length < 0){
const err47 = {instancePath:instancePath+"/keywords",schemaPath:"#/properties/keywords/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
const len0 = data17.length;
for(let i0=0; i0<len0; i0++){
if(typeof data17[i0] !== "string"){
const err48 = {instancePath:instancePath+"/keywords/" + i0,schemaPath:"#/$defs/Text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
}
else {
const err49 = {instancePath:instancePath+"/keywords",schemaPath:"#/properties/keywords/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data.lineage !== undefined){
let data19 = data.lineage;
if(Array.isArray(data19)){
if(data19.length < 0){
const err50 = {instancePath:instancePath+"/lineage",schemaPath:"#/properties/lineage/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
const len1 = data19.length;
for(let i1=0; i1<len1; i1++){
if(!(validate102(data19[i1], {instancePath:instancePath+"/lineage/" + i1,parentData:data19,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate102.errors : vErrors.concat(validate102.errors);
errors = vErrors.length;
}
}
}
else {
const err51 = {instancePath:instancePath+"/lineage",schemaPath:"#/properties/lineage/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data.languages !== undefined){
let data21 = data.languages;
if(Array.isArray(data21)){
if(data21.length < 1){
const err52 = {instancePath:instancePath+"/languages",schemaPath:"#/properties/languages/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
const len2 = data21.length;
for(let i2=0; i2<len2; i2++){
let data22 = data21[i2];
if(typeof data22 === "string"){
if(func2(data22) > 256){
const err53 = {instancePath:instancePath+"/languages/" + i2,schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(func2(data22) < 1){
const err54 = {instancePath:instancePath+"/languages/" + i2,schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(!pattern4.test(data22)){
const err55 = {instancePath:instancePath+"/languages/" + i2,schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err56 = {instancePath:instancePath+"/languages/" + i2,schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
let i3 = data21.length;
let j0;
if(i3 > 1){
outer0:
for(;i3--;){
for(j0 = i3; j0--;){
if(func0(data21[i3], data21[j0])){
const err57 = {instancePath:instancePath+"/languages",schemaPath:"#/properties/languages/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err58 = {instancePath:instancePath+"/languages",schemaPath:"#/properties/languages/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data.history !== undefined){
if(!(validate122(data.history, {instancePath:instancePath+"/history",parentData:data,parentDataProperty:"history",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate122.errors : vErrors.concat(validate122.errors);
errors = vErrors.length;
}
}
}
else {
const err59 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
validate89.errors = vErrors;
return errors === 0;
}
validate89.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.input_digest === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_digest"},message:"must have required property '"+"input_digest"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.input === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input"},message:"must have required property '"+"input"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.manifest === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest"},message:"must have required property '"+"manifest"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.intent === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "intent"},message:"must have required property '"+"intent"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.adoption === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "adoption"},message:"must have required property '"+"adoption"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.output_delivery === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "output_delivery"},message:"must have required property '"+"output_delivery"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema122.properties, key0))){
const err9 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.contract !== undefined){
if(!(validate81(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate81.errors : vErrors.concat(validate81.errors);
errors = vErrors.length;
}
}
if(data.request !== undefined){
if(!(validate83(data.request, {instancePath:instancePath+"/request",parentData:data,parentDataProperty:"request",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate83.errors : vErrors.concat(validate83.errors);
errors = vErrors.length;
}
}
if(data.request_digest !== undefined){
let data2 = data.request_digest;
if(typeof data2 === "string"){
if(!pattern16.test(data2)){
const err10 = {instancePath:instancePath+"/request_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err11 = {instancePath:instancePath+"/request_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.input_digest !== undefined){
let data3 = data.input_digest;
if(typeof data3 === "string"){
if(!pattern16.test(data3)){
const err12 = {instancePath:instancePath+"/input_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err13 = {instancePath:instancePath+"/input_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.input !== undefined){
if(!(validate85(data.input, {instancePath:instancePath+"/input",parentData:data,parentDataProperty:"input",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate85.errors : vErrors.concat(validate85.errors);
errors = vErrors.length;
}
}
if(data.manifest !== undefined){
if(!(validate89(data.manifest, {instancePath:instancePath+"/manifest",parentData:data,parentDataProperty:"manifest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate89.errors : vErrors.concat(validate89.errors);
errors = vErrors.length;
}
}
if(data.intent !== undefined){
let data6 = data.intent;
if(typeof data6 !== "string"){
const err14 = {instancePath:instancePath+"/intent",schemaPath:"#/properties/intent/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if("encode_exact_owned_authored_input_as_public_sections06" !== data6){
const err15 = {instancePath:instancePath+"/intent",schemaPath:"#/properties/intent/const",keyword:"const",params:{allowedValue: "encode_exact_owned_authored_input_as_public_sections06"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.adoption !== undefined){
let data7 = data.adoption;
if(typeof data7 !== "string"){
const err16 = {instancePath:instancePath+"/adoption",schemaPath:"#/properties/adoption/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if("not_observed" !== data7){
const err17 = {instancePath:instancePath+"/adoption",schemaPath:"#/properties/adoption/const",keyword:"const",params:{allowedValue: "not_observed"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.output_delivery !== undefined){
let data8 = data.output_delivery;
if(typeof data8 !== "string"){
const err18 = {instancePath:instancePath+"/output_delivery",schemaPath:"#/properties/output_delivery/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if("return_bytes_only" !== data8){
const err19 = {instancePath:instancePath+"/output_delivery",schemaPath:"#/properties/output_delivery/const",keyword:"const",params:{allowedValue: "return_bytes_only"},message:"must be equal to constant"};
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
validate80.errors = vErrors;
return errors === 0;
}
validate80.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate79(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:creation06:NativeCreationAuthorityContext06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate79.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate80(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
validate79.errors = vErrors;
return errors === 0;
}
validate79.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.NativeCreationManifestAction06 = validate135;
const schema207 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:creation06:NativeCreationManifestAction06","title":"NativeCreationManifestAction06","description":"Native creation structural data only; opaque requests and creation permission require actual native brands.","$ref":"#/$defs/NativeCreationManifestAction06","$defs":{"NativeCreationManifestAction06":{"type":"object","properties":{"path":{"type":"string","enum":["/format_version","/payload","/representation_metadata","/content_digest","/authoring/content_digest"]},"action":{"type":"string","enum":["added","refreshed"]}},"required":["path","action"],"additionalProperties":false}}};
const schema208 = {"type":"object","properties":{"path":{"type":"string","enum":["/format_version","/payload","/representation_metadata","/content_digest","/authoring/content_digest"]},"action":{"type":"string","enum":["added","refreshed"]}},"required":["path","action"],"additionalProperties":false};

function validate135(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:creation06:NativeCreationManifestAction06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate135.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.path === undefined){
const err0 = {instancePath,schemaPath:"#/$defs/NativeCreationManifestAction06/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.action === undefined){
const err1 = {instancePath,schemaPath:"#/$defs/NativeCreationManifestAction06/required",keyword:"required",params:{missingProperty: "action"},message:"must have required property '"+"action"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "path") || (key0 === "action"))){
const err2 = {instancePath,schemaPath:"#/$defs/NativeCreationManifestAction06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.path !== undefined){
let data0 = data.path;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/NativeCreationManifestAction06/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!(((((data0 === "/format_version") || (data0 === "/payload")) || (data0 === "/representation_metadata")) || (data0 === "/content_digest")) || (data0 === "/authoring/content_digest"))){
const err4 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/NativeCreationManifestAction06/properties/path/enum",keyword:"enum",params:{allowedValues: schema208.properties.path.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.action !== undefined){
let data1 = data.action;
if(typeof data1 !== "string"){
const err5 = {instancePath:instancePath+"/action",schemaPath:"#/$defs/NativeCreationManifestAction06/properties/action/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!((data1 === "added") || (data1 === "refreshed"))){
const err6 = {instancePath:instancePath+"/action",schemaPath:"#/$defs/NativeCreationManifestAction06/properties/action/enum",keyword:"enum",params:{allowedValues: schema208.properties.action.enum},message:"must be equal to one of the allowed values"};
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
const err7 = {instancePath,schemaPath:"#/$defs/NativeCreationManifestAction06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate135.errors = vErrors;
return errors === 0;
}
validate135.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.NativeCreationEvidence06 = validate136;
const schema209 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:creation06:NativeCreationEvidence06","title":"NativeCreationEvidence06","description":"Native creation structural data only; opaque requests and creation permission require actual native brands.","$ref":"#/$defs/NativeCreationEvidence06","$defs":{"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"NativeCreationContract06":{"type":"object","properties":{"id":{"type":"string","const":"kdna.creation-sections/0.1.0-candidate"},"version":{"type":"string","const":"0.1.0-candidate"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false},"NativeCreationEvidence06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeCreationContract06"},"request_digest":{"$ref":"#/$defs/Digest"},"input_digest":{"$ref":"#/$defs/Digest"},"input":{"$ref":"#/$defs/NativeCreationInputObservation06"},"output":{"$ref":"#/$defs/SourceRouteDigests06"},"E_profile":{"type":"string","const":"kdna.digest-basis.runtime-entry-set/0.3.0-candidate"},"output_ir_digest":{"$ref":"#/$defs/Digest"},"manifest_actions":{"type":"array","items":{"$ref":"#/$defs/NativeCreationManifestAction06"},"minItems":3,"maxItems":5},"members":{"type":"array","items":{"$ref":"#/$defs/SourceRouteMemberInventory06"},"minItems":3,"maxItems":128},"payload_preservation":{"type":"string","const":"complete_value_absence_array_order"},"proof":{"type":"string","const":"producer_observation_not_consumer_admission"},"output_delivery":{"type":"string","const":"not_published"},"adoption":{"type":"string","const":"not_observed"}},"required":["contract","request_digest","input_digest","input","output","E_profile","output_ir_digest","manifest_actions","members","payload_preservation","proof","output_delivery","adoption"],"additionalProperties":false},"NativeCreationInputObservation06":{"type":"object","properties":{"manifest_digest":{"$ref":"#/$defs/Digest"},"payload_digest":{"$ref":"#/$defs/Digest"},"members":{"type":"array","items":{"$ref":"#/$defs/SourceRouteMemberInventory06"},"minItems":0,"maxItems":128},"member_bytes":{"$ref":"#/$defs/UInt"}},"required":["manifest_digest","payload_digest","members","member_bytes"],"additionalProperties":false},"NativeCreationManifestAction06":{"type":"object","properties":{"path":{"type":"string","enum":["/format_version","/payload","/representation_metadata","/content_digest","/authoring/content_digest"]},"action":{"type":"string","enum":["added","refreshed"]}},"required":["path","action"],"additionalProperties":false},"SourceRouteDigests06":{"type":"object","properties":{"A":{"$ref":"#/$defs/Digest"},"C":{"$ref":"#/$defs/Digest"},"E":{"$ref":"#/$defs/Digest"}},"required":["A","C","E"],"additionalProperties":false},"SourceRouteMemberInventory06":{"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"type":{"type":"string","const":"file"},"mode":{"$ref":"#/$defs/UInt"},"size":{"$ref":"#/$defs/UInt"},"sha256":{"$ref":"#/$defs/Digest"}},"required":["name","type","mode","size","sha256"],"additionalProperties":false},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};
const schema210 = {"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeCreationContract06"},"request_digest":{"$ref":"#/$defs/Digest"},"input_digest":{"$ref":"#/$defs/Digest"},"input":{"$ref":"#/$defs/NativeCreationInputObservation06"},"output":{"$ref":"#/$defs/SourceRouteDigests06"},"E_profile":{"type":"string","const":"kdna.digest-basis.runtime-entry-set/0.3.0-candidate"},"output_ir_digest":{"$ref":"#/$defs/Digest"},"manifest_actions":{"type":"array","items":{"$ref":"#/$defs/NativeCreationManifestAction06"},"minItems":3,"maxItems":5},"members":{"type":"array","items":{"$ref":"#/$defs/SourceRouteMemberInventory06"},"minItems":3,"maxItems":128},"payload_preservation":{"type":"string","const":"complete_value_absence_array_order"},"proof":{"type":"string","const":"producer_observation_not_consumer_admission"},"output_delivery":{"type":"string","const":"not_published"},"adoption":{"type":"string","const":"not_observed"}},"required":["contract","request_digest","input_digest","input","output","E_profile","output_ir_digest","manifest_actions","members","payload_preservation","proof","output_delivery","adoption"],"additionalProperties":false};

function validate138(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate138.evaluated;
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
if("kdna.creation-sections/0.1.0-candidate" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.creation-sections/0.1.0-candidate"},message:"must be equal to constant"};
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
if(!pattern16.test(data2)){
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
validate138.errors = vErrors;
return errors === 0;
}
validate138.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate141(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate141.evaluated;
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
if(func2(data0) > 4096){
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func2(data0) < 1){
const err7 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern12.test(data0)){
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
if(!pattern16.test(data4)){
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
validate141.errors = vErrors;
return errors === 0;
}
validate141.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate140(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate140.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.manifest_digest === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_digest"},message:"must have required property '"+"manifest_digest"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.payload_digest === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload_digest"},message:"must have required property '"+"payload_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.members === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.member_bytes === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_bytes"},message:"must have required property '"+"member_bytes"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "manifest_digest") || (key0 === "payload_digest")) || (key0 === "members")) || (key0 === "member_bytes"))){
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
if(data.manifest_digest !== undefined){
let data0 = data.manifest_digest;
if(typeof data0 === "string"){
if(!pattern16.test(data0)){
const err5 = {instancePath:instancePath+"/manifest_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err6 = {instancePath:instancePath+"/manifest_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.payload_digest !== undefined){
let data1 = data.payload_digest;
if(typeof data1 === "string"){
if(!pattern16.test(data1)){
const err7 = {instancePath:instancePath+"/payload_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err8 = {instancePath:instancePath+"/payload_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.members !== undefined){
let data2 = data.members;
if(Array.isArray(data2)){
if(data2.length > 128){
const err9 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data2.length < 0){
const err10 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
if(!(validate141(data2[i0], {instancePath:instancePath+"/members/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate141.errors : vErrors.concat(validate141.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.member_bytes !== undefined){
let data4 = data.member_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err12 = {instancePath:instancePath+"/member_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
const err13 = {instancePath:instancePath+"/member_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err14 = {instancePath:instancePath+"/member_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
}
else {
const err15 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
validate140.errors = vErrors;
return errors === 0;
}
validate140.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema224 = {"type":"object","properties":{"A":{"$ref":"#/$defs/Digest"},"C":{"$ref":"#/$defs/Digest"},"E":{"$ref":"#/$defs/Digest"}},"required":["A","C","E"],"additionalProperties":false};

function validate144(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate144.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.A === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "A"},message:"must have required property '"+"A"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.C === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "C"},message:"must have required property '"+"C"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.E === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "E"},message:"must have required property '"+"E"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "A") || (key0 === "C")) || (key0 === "E"))){
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
if(data.A !== undefined){
let data0 = data.A;
if(typeof data0 === "string"){
if(!pattern16.test(data0)){
const err4 = {instancePath:instancePath+"/A",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/A",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.C !== undefined){
let data1 = data.C;
if(typeof data1 === "string"){
if(!pattern16.test(data1)){
const err6 = {instancePath:instancePath+"/C",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/C",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.E !== undefined){
let data2 = data.E;
if(typeof data2 === "string"){
if(!pattern16.test(data2)){
const err8 = {instancePath:instancePath+"/E",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err9 = {instancePath:instancePath+"/E",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate144.errors = vErrors;
return errors === 0;
}
validate144.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate137(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate137.evaluated;
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
if(data.input_digest === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_digest"},message:"must have required property '"+"input_digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.input === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input"},message:"must have required property '"+"input"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.output === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "output"},message:"must have required property '"+"output"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.E_profile === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "E_profile"},message:"must have required property '"+"E_profile"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.output_ir_digest === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "output_ir_digest"},message:"must have required property '"+"output_ir_digest"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.manifest_actions === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_actions"},message:"must have required property '"+"manifest_actions"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.members === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.payload_preservation === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload_preservation"},message:"must have required property '"+"payload_preservation"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.proof === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "proof"},message:"must have required property '"+"proof"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.output_delivery === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "output_delivery"},message:"must have required property '"+"output_delivery"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.adoption === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "adoption"},message:"must have required property '"+"adoption"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema210.properties, key0))){
const err13 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.contract !== undefined){
if(!(validate138(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate138.errors : vErrors.concat(validate138.errors);
errors = vErrors.length;
}
}
if(data.request_digest !== undefined){
let data1 = data.request_digest;
if(typeof data1 === "string"){
if(!pattern16.test(data1)){
const err14 = {instancePath:instancePath+"/request_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err15 = {instancePath:instancePath+"/request_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.input_digest !== undefined){
let data2 = data.input_digest;
if(typeof data2 === "string"){
if(!pattern16.test(data2)){
const err16 = {instancePath:instancePath+"/input_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err17 = {instancePath:instancePath+"/input_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.input !== undefined){
if(!(validate140(data.input, {instancePath:instancePath+"/input",parentData:data,parentDataProperty:"input",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate140.errors : vErrors.concat(validate140.errors);
errors = vErrors.length;
}
}
if(data.output !== undefined){
if(!(validate144(data.output, {instancePath:instancePath+"/output",parentData:data,parentDataProperty:"output",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate144.errors : vErrors.concat(validate144.errors);
errors = vErrors.length;
}
}
if(data.E_profile !== undefined){
let data5 = data.E_profile;
if(typeof data5 !== "string"){
const err18 = {instancePath:instancePath+"/E_profile",schemaPath:"#/properties/E_profile/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if("kdna.digest-basis.runtime-entry-set/0.3.0-candidate" !== data5){
const err19 = {instancePath:instancePath+"/E_profile",schemaPath:"#/properties/E_profile/const",keyword:"const",params:{allowedValue: "kdna.digest-basis.runtime-entry-set/0.3.0-candidate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.output_ir_digest !== undefined){
let data6 = data.output_ir_digest;
if(typeof data6 === "string"){
if(!pattern16.test(data6)){
const err20 = {instancePath:instancePath+"/output_ir_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
else {
const err21 = {instancePath:instancePath+"/output_ir_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.manifest_actions !== undefined){
let data7 = data.manifest_actions;
if(Array.isArray(data7)){
if(data7.length > 5){
const err22 = {instancePath:instancePath+"/manifest_actions",schemaPath:"#/properties/manifest_actions/maxItems",keyword:"maxItems",params:{limit: 5},message:"must NOT have more than 5 items"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data7.length < 3){
const err23 = {instancePath:instancePath+"/manifest_actions",schemaPath:"#/properties/manifest_actions/minItems",keyword:"minItems",params:{limit: 3},message:"must NOT have fewer than 3 items"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.path === undefined){
const err24 = {instancePath:instancePath+"/manifest_actions/" + i0,schemaPath:"#/$defs/NativeCreationManifestAction06/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data8.action === undefined){
const err25 = {instancePath:instancePath+"/manifest_actions/" + i0,schemaPath:"#/$defs/NativeCreationManifestAction06/required",keyword:"required",params:{missingProperty: "action"},message:"must have required property '"+"action"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
for(const key1 in data8){
if(!((key1 === "path") || (key1 === "action"))){
const err26 = {instancePath:instancePath+"/manifest_actions/" + i0,schemaPath:"#/$defs/NativeCreationManifestAction06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data8.path !== undefined){
let data9 = data8.path;
if(typeof data9 !== "string"){
const err27 = {instancePath:instancePath+"/manifest_actions/" + i0+"/path",schemaPath:"#/$defs/NativeCreationManifestAction06/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(!(((((data9 === "/format_version") || (data9 === "/payload")) || (data9 === "/representation_metadata")) || (data9 === "/content_digest")) || (data9 === "/authoring/content_digest"))){
const err28 = {instancePath:instancePath+"/manifest_actions/" + i0+"/path",schemaPath:"#/$defs/NativeCreationManifestAction06/properties/path/enum",keyword:"enum",params:{allowedValues: schema208.properties.path.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data8.action !== undefined){
let data10 = data8.action;
if(typeof data10 !== "string"){
const err29 = {instancePath:instancePath+"/manifest_actions/" + i0+"/action",schemaPath:"#/$defs/NativeCreationManifestAction06/properties/action/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(!((data10 === "added") || (data10 === "refreshed"))){
const err30 = {instancePath:instancePath+"/manifest_actions/" + i0+"/action",schemaPath:"#/$defs/NativeCreationManifestAction06/properties/action/enum",keyword:"enum",params:{allowedValues: schema208.properties.action.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
else {
const err31 = {instancePath:instancePath+"/manifest_actions/" + i0,schemaPath:"#/$defs/NativeCreationManifestAction06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
else {
const err32 = {instancePath:instancePath+"/manifest_actions",schemaPath:"#/properties/manifest_actions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.members !== undefined){
let data11 = data.members;
if(Array.isArray(data11)){
if(data11.length > 128){
const err33 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data11.length < 3){
const err34 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/minItems",keyword:"minItems",params:{limit: 3},message:"must NOT have fewer than 3 items"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
const len1 = data11.length;
for(let i1=0; i1<len1; i1++){
if(!(validate141(data11[i1], {instancePath:instancePath+"/members/" + i1,parentData:data11,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate141.errors : vErrors.concat(validate141.errors);
errors = vErrors.length;
}
}
}
else {
const err35 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.payload_preservation !== undefined){
let data13 = data.payload_preservation;
if(typeof data13 !== "string"){
const err36 = {instancePath:instancePath+"/payload_preservation",schemaPath:"#/properties/payload_preservation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if("complete_value_absence_array_order" !== data13){
const err37 = {instancePath:instancePath+"/payload_preservation",schemaPath:"#/properties/payload_preservation/const",keyword:"const",params:{allowedValue: "complete_value_absence_array_order"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data.proof !== undefined){
let data14 = data.proof;
if(typeof data14 !== "string"){
const err38 = {instancePath:instancePath+"/proof",schemaPath:"#/properties/proof/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if("producer_observation_not_consumer_admission" !== data14){
const err39 = {instancePath:instancePath+"/proof",schemaPath:"#/properties/proof/const",keyword:"const",params:{allowedValue: "producer_observation_not_consumer_admission"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data.output_delivery !== undefined){
let data15 = data.output_delivery;
if(typeof data15 !== "string"){
const err40 = {instancePath:instancePath+"/output_delivery",schemaPath:"#/properties/output_delivery/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if("not_published" !== data15){
const err41 = {instancePath:instancePath+"/output_delivery",schemaPath:"#/properties/output_delivery/const",keyword:"const",params:{allowedValue: "not_published"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data.adoption !== undefined){
let data16 = data.adoption;
if(typeof data16 !== "string"){
const err42 = {instancePath:instancePath+"/adoption",schemaPath:"#/properties/adoption/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if("not_observed" !== data16){
const err43 = {instancePath:instancePath+"/adoption",schemaPath:"#/properties/adoption/const",keyword:"const",params:{allowedValue: "not_observed"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
}
else {
const err44 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
validate137.errors = vErrors;
return errors === 0;
}
validate137.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate136(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:creation06:NativeCreationEvidence06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate136.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate137(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate137.errors : vErrors.concat(validate137.errors);
errors = vErrors.length;
}
validate136.errors = vErrors;
return errors === 0;
}
validate136.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.NativeCreationRequestAdmission06 = validate148;
const schema230 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:creation06:NativeCreationRequestAdmission06","title":"NativeCreationRequestAdmission06","description":"Native creation structural data only; opaque requests and creation permission require actual native brands.","$ref":"#/$defs/NativeCreationRequestAdmission06","$defs":{"AdmittedNativeCreationRequest06":false,"CoreAdmissionRejected":{"type":"object","properties":{"status":{"type":"string","const":"rejected"},"reason":{"$ref":"#/$defs/ReadDiagnosticCode"},"diagnostics":{"type":"array","items":{"$ref":"#/$defs/ReadDiagnostic"},"minItems":1,"maxItems":1},"states":{"$ref":"#/$defs/CoreStaticStates"},"component_failure":{"anyOf":[{"$ref":"#/$defs/CoreComponentFailure"},{"type":"null","const":null}]}},"required":["status","reason","diagnostics","states","component_failure"],"additionalProperties":false},"CoreComponentFailure":{"type":"object","properties":{"judgment_ref":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null","const":null}]},"component_ref":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null","const":null}]},"status":{"type":"string","const":"invalid"},"body":{"type":"null","const":null},"code":{"type":"string","enum":["READ_COMPONENT_DECLARATION_INVALID","READ_COMPONENT_CONTENT_INVALID","READ_COMPONENT_REFERENCE_INVALID","READ_COMPONENT_GRAPH_CYCLE","READ_COMPONENT_LIMIT_EXCEEDED","READ_COMPONENT_BINDING_INVALID","READ_COMPONENT_ADOPTION_INVALID","READ_METHOD_PRESENCE_INVALID"]}},"required":["judgment_ref","component_ref","status","body","code"],"additionalProperties":false},"CoreStaticStates":{"type":"object","properties":{"core":{"$ref":"#/$defs/TechnicalState"},"interpretation":{"$ref":"#/$defs/InterpretationState"}},"required":["core","interpretation"],"additionalProperties":false},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"InterpretationState":{"type":"string","enum":["not_evaluated","complete","degraded","blocked"]},"NativeCreationRequestAdmission06":{"oneOf":[{"type":"object","properties":{"status":{"type":"string","const":"admitted_request"},"request":{"$ref":"#/$defs/AdmittedNativeCreationRequest06"}},"required":["status","request"],"additionalProperties":false},{"$ref":"#/$defs/SourceRouteFailure06"},{"$ref":"#/$defs/SourceRouteCoreRejected06"}]},"OriginalProtectionDiagnosticFor06":{"oneOf":[{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_INPUT_INVALID"},"stage":{"type":"string","enum":["input"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_DECLARATION_INVALID"},"stage":{"type":"string","enum":["declaration"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_PROFILE_UNSUPPORTED"},"stage":{"type":"string","enum":["declaration","envelope","integrity"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_ENVELOPE_INVALID"},"stage":{"type":"string","enum":["envelope"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_KDF_UNAVAILABLE"},"stage":{"type":"string","enum":["kdf"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_CREDENTIAL_REQUIRED"},"stage":{"type":"string","enum":["credential"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_AUTHENTICATION_FAILED"},"stage":{"type":"string","enum":["authentication"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_CHECKSUMS_INVALID"},"stage":{"type":"string","enum":["integrity"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_SIGNATURE_INVALID"},"stage":{"type":"string","enum":["integrity"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_SIGNATURE_PIN_MISMATCH"},"stage":{"type":"string","enum":["integrity"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_GRANT_INVALID"},"stage":{"type":"string","enum":["grant"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_GRANT_BINDING_MISMATCH"},"stage":{"type":"string","enum":["grant"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_AUTHORIZATION_EXPIRED"},"stage":{"type":"string","enum":["authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_AUTHORIZATION_REVOKED"},"stage":{"type":"string","enum":["authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_REFRESH_REQUIRED"},"stage":{"type":"string","enum":["authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_STATE_ROLLBACK"},"stage":{"type":"string","enum":["authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_PROVIDER_FAILED"},"stage":{"type":"string","enum":["authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_DECLARATION_CONFLICT"},"stage":{"type":"string","enum":["authorization"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_OPERATION_UNTRUSTED"},"stage":{"type":"string","enum":["input"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_OPERATION_DISPOSED"},"stage":{"type":"string","enum":["input","authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false}]},"OriginalProtectionDisclosureFor06":{"oneOf":[{"type":"object","properties":{"kind":{"type":"string","const":"none"},"external_commit":{"$ref":"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06"}},"required":["kind","external_commit"],"additionalProperties":false},{"type":"object","properties":{"kind":{"type":"string","const":"trusted_host"},"at_ms":{"$ref":"#/$defs/UInt"},"external_commit":{"$ref":"#/$defs/OriginalProtectionExternalCommitFor06"}},"required":["kind","at_ms","external_commit"],"additionalProperties":false}]},"OriginalProtectionExternalCommitConfirmedFor06":{"type":"object","properties":{"state":{"type":"string","const":"confirmed"},"attempt_id":{"$ref":"#/$defs/Identifier"},"attempted_at_ms":{"$ref":"#/$defs/UInt"},"confirmed_at_ms":{"oneOf":[{"$ref":"#/$defs/UInt"},{"type":"null"}]}},"required":["state","attempt_id","attempted_at_ms","confirmed_at_ms"],"additionalProperties":false},"OriginalProtectionExternalCommitFor06":{"oneOf":[{"$ref":"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06"},{"$ref":"#/$defs/OriginalProtectionExternalCommitUnknownFor06"},{"$ref":"#/$defs/OriginalProtectionExternalCommitConfirmedFor06"}]},"OriginalProtectionExternalCommitNotInvokedFor06":{"type":"object","properties":{"state":{"type":"string","const":"not_invoked"}},"required":["state"],"additionalProperties":false},"OriginalProtectionExternalCommitUnknownFor06":{"type":"object","properties":{"state":{"type":"string","const":"outcome_unknown"},"attempt_id":{"$ref":"#/$defs/Identifier"},"attempted_at_ms":{"$ref":"#/$defs/UInt"}},"required":["state","attempt_id","attempted_at_ms"],"additionalProperties":false},"ReadDiagnostic":{"type":"object","properties":{"code":{"$ref":"#/$defs/ReadDiagnosticCode"},"stage":{"$ref":"#/$defs/ReadStage"},"severity":{"type":"string","enum":["error","warning"]},"subject":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null"}]},"field":{"anyOf":[{"$ref":"#/$defs/Text"},{"type":"null"}]}},"required":["code","stage","severity","subject","field"],"additionalProperties":false},"ReadDiagnosticCode":{"type":"string","enum":["READ_INPUT_INVALID","READ_SNAPSHOT_UNATTESTED","READ_CORE_CAPABILITY_UNAVAILABLE","READ_UNSUPPORTED_VERSION","READ_MIXED_VERSION_TUPLE","READ_CORE_INVALID","READ_INTERPRETATION_INCOMPLETE","READ_STATIC_POLICY_INVALID","READ_ASSET_MISMATCH","READ_ASSET_VERSION_MISMATCH","READ_SELECTION_NOT_FOUND","READ_SELECTION_AMBIGUOUS","READ_HANDLE_UNTRUSTED","READ_HANDLE_VERSION_MISMATCH","READ_HANDLE_STALE","READ_HANDLE_ASSET_MISMATCH","READ_HANDLE_SCOPE_MISMATCH","READ_HOST_CONTEXT_UNTRUSTED","READ_HOST_EPOCH_MISMATCH","READ_HOST_TIME_INVALID","READ_HANDLE_EXPIRED","READ_HOST_CONTEXT_EXPIRED","READ_HOST_DENIED","READ_SCOPE_DENIED","READ_PROJECTION_INVALID","READ_BUDGET_INSUFFICIENT","READ_COMPONENT_DECLARATION_INVALID","READ_COMPONENT_CONTENT_INVALID","READ_COMPONENT_REFERENCE_INVALID","READ_COMPONENT_GRAPH_CYCLE","READ_COMPONENT_LIMIT_EXCEEDED","READ_COMPONENT_BINDING_INVALID","READ_COMPONENT_ADOPTION_INVALID","READ_METHOD_PRESENCE_INVALID","READ_R2_STRUCTURE_INVALID","READ_R2_REFERENCE_INVALID","READ_R2_METHOD_INVALID","READ_R2_PLAN_INVALID","READ_R2_POLICY_INVALID","READ_R2_SCOPE_INVALID","READ_R2_EXAMPLE_INVALID","READ_R2_HISTORY_INVALID","READ_UNSUPPORTED_CRITICAL","READ_UNRESOLVED_EXTERNAL"]},"ReadStage":{"type":"string","enum":["input","version","core","selection","handle","host","projection","budget"]},"SourceRouteCoreRejected06":{"type":"object","properties":{"status":{"type":"string","const":"core_rejected"},"stage":{"type":"string","enum":["input","capture","admission","output"]},"core":{"$ref":"#/$defs/CoreAdmissionRejected"},"disclosure":{"$ref":"#/$defs/OriginalProtectionDisclosureFor06"},"body":{"type":"null"},"body_bytes":{"type":"integer","const":0}},"required":["status","stage","core","disclosure","body","body_bytes"],"additionalProperties":false},"SourceRouteDiagnostic06":{"type":"object","properties":{"code":{"type":"string","enum":["SOURCE_INPUT_INVALID","SOURCE_HOST_UNTRUSTED","SOURCE_EXPECTED_ASSET_MISMATCH","SOURCE_HOST_DENIED","SOURCE_PERMISSION_REJECTED","SOURCE_CONTEXT_UNTRUSTED","SOURCE_CONTEXT_CLOSED","SOURCE_DEADLINE_EXCEEDED","SOURCE_PROVIDER_FAILED","SOURCE_HANDOFF_UNKNOWN","SOURCE_CAPABILITY_UNAVAILABLE","SOURCE_DRAFT_INVALID","SOURCE_INTERPRETATION_INCOMPLETE","SOURCE_POLICY_INVALID","SOURCE_OUTPUT_INVALID"]},"stage":{"type":"string","enum":["input","admission","authorization","semantic","return","output"]}},"required":["code","stage"],"additionalProperties":false},"SourceRouteFailure06":{"type":"object","properties":{"status":{"type":"string","const":"source_failed"},"diagnostic":{"oneOf":[{"$ref":"#/$defs/SourceRouteDiagnostic06"},{"$ref":"#/$defs/OriginalProtectionDiagnosticFor06"}]},"disclosure":{"$ref":"#/$defs/OriginalProtectionDisclosureFor06"},"body":{"type":"null"},"body_bytes":{"type":"integer","const":0}},"required":["status","diagnostic","disclosure","body","body_bytes"],"additionalProperties":false},"TechnicalState":{"type":"string","enum":["not_evaluated","valid","invalid"]},"Text":{"type":"string"},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};
const schema231 = {"oneOf":[{"type":"object","properties":{"status":{"type":"string","const":"admitted_request"},"request":{"$ref":"#/$defs/AdmittedNativeCreationRequest06"}},"required":["status","request"],"additionalProperties":false},{"$ref":"#/$defs/SourceRouteFailure06"},{"$ref":"#/$defs/SourceRouteCoreRejected06"}]};
const schema233 = {"type":"object","properties":{"status":{"type":"string","const":"source_failed"},"diagnostic":{"oneOf":[{"$ref":"#/$defs/SourceRouteDiagnostic06"},{"$ref":"#/$defs/OriginalProtectionDiagnosticFor06"}]},"disclosure":{"$ref":"#/$defs/OriginalProtectionDisclosureFor06"},"body":{"type":"null"},"body_bytes":{"type":"integer","const":0}},"required":["status","diagnostic","disclosure","body","body_bytes"],"additionalProperties":false};
const schema234 = {"type":"object","properties":{"code":{"type":"string","enum":["SOURCE_INPUT_INVALID","SOURCE_HOST_UNTRUSTED","SOURCE_EXPECTED_ASSET_MISMATCH","SOURCE_HOST_DENIED","SOURCE_PERMISSION_REJECTED","SOURCE_CONTEXT_UNTRUSTED","SOURCE_CONTEXT_CLOSED","SOURCE_DEADLINE_EXCEEDED","SOURCE_PROVIDER_FAILED","SOURCE_HANDOFF_UNKNOWN","SOURCE_CAPABILITY_UNAVAILABLE","SOURCE_DRAFT_INVALID","SOURCE_INTERPRETATION_INCOMPLETE","SOURCE_POLICY_INVALID","SOURCE_OUTPUT_INVALID"]},"stage":{"type":"string","enum":["input","admission","authorization","semantic","return","output"]}},"required":["code","stage"],"additionalProperties":false};
const schema235 = {"oneOf":[{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_INPUT_INVALID"},"stage":{"type":"string","enum":["input"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_DECLARATION_INVALID"},"stage":{"type":"string","enum":["declaration"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_PROFILE_UNSUPPORTED"},"stage":{"type":"string","enum":["declaration","envelope","integrity"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_ENVELOPE_INVALID"},"stage":{"type":"string","enum":["envelope"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_KDF_UNAVAILABLE"},"stage":{"type":"string","enum":["kdf"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_CREDENTIAL_REQUIRED"},"stage":{"type":"string","enum":["credential"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_AUTHENTICATION_FAILED"},"stage":{"type":"string","enum":["authentication"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_CHECKSUMS_INVALID"},"stage":{"type":"string","enum":["integrity"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_SIGNATURE_INVALID"},"stage":{"type":"string","enum":["integrity"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_SIGNATURE_PIN_MISMATCH"},"stage":{"type":"string","enum":["integrity"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_GRANT_INVALID"},"stage":{"type":"string","enum":["grant"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_GRANT_BINDING_MISMATCH"},"stage":{"type":"string","enum":["grant"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_AUTHORIZATION_EXPIRED"},"stage":{"type":"string","enum":["authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_AUTHORIZATION_REVOKED"},"stage":{"type":"string","enum":["authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_REFRESH_REQUIRED"},"stage":{"type":"string","enum":["authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_STATE_ROLLBACK"},"stage":{"type":"string","enum":["authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_PROVIDER_FAILED"},"stage":{"type":"string","enum":["authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_DECLARATION_CONFLICT"},"stage":{"type":"string","enum":["authorization"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_OPERATION_UNTRUSTED"},"stage":{"type":"string","enum":["input"]}},"required":["code","stage"],"additionalProperties":false},{"type":"object","properties":{"code":{"type":"string","const":"PROTECTION_OPERATION_DISPOSED"},"stage":{"type":"string","enum":["input","authorization","projection","host_handoff","transport_commit"]}},"required":["code","stage"],"additionalProperties":false}]};
const schema236 = {"oneOf":[{"type":"object","properties":{"kind":{"type":"string","const":"none"},"external_commit":{"$ref":"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06"}},"required":["kind","external_commit"],"additionalProperties":false},{"type":"object","properties":{"kind":{"type":"string","const":"trusted_host"},"at_ms":{"$ref":"#/$defs/UInt"},"external_commit":{"$ref":"#/$defs/OriginalProtectionExternalCommitFor06"}},"required":["kind","at_ms","external_commit"],"additionalProperties":false}]};
const schema237 = {"type":"object","properties":{"state":{"type":"string","const":"not_invoked"}},"required":["state"],"additionalProperties":false};
const schema239 = {"oneOf":[{"$ref":"#/$defs/OriginalProtectionExternalCommitNotInvokedFor06"},{"$ref":"#/$defs/OriginalProtectionExternalCommitUnknownFor06"},{"$ref":"#/$defs/OriginalProtectionExternalCommitConfirmedFor06"}]};
const schema241 = {"type":"object","properties":{"state":{"type":"string","const":"outcome_unknown"},"attempt_id":{"$ref":"#/$defs/Identifier"},"attempted_at_ms":{"$ref":"#/$defs/UInt"}},"required":["state","attempt_id","attempted_at_ms"],"additionalProperties":false};

function validate153(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate153.evaluated;
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
if(func2(data1) > 256){
const err6 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func2(data1) < 1){
const err7 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern4.test(data1)){
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
validate153.errors = vErrors;
return errors === 0;
}
validate153.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema244 = {"type":"object","properties":{"state":{"type":"string","const":"confirmed"},"attempt_id":{"$ref":"#/$defs/Identifier"},"attempted_at_ms":{"$ref":"#/$defs/UInt"},"confirmed_at_ms":{"oneOf":[{"$ref":"#/$defs/UInt"},{"type":"null"}]}},"required":["state","attempt_id","attempted_at_ms","confirmed_at_ms"],"additionalProperties":false};

function validate155(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate155.evaluated;
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
if(func2(data1) > 256){
const err7 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func2(data1) < 1){
const err8 = {instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern4.test(data1)){
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
validate155.errors = vErrors;
return errors === 0;
}
validate155.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate152(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate152.evaluated;
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
if(!(validate153(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate153.errors : vErrors.concat(validate153.errors);
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
if(!(validate155(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate155.errors : vErrors.concat(validate155.errors);
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
validate152.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate152.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate151(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate151.evaluated;
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
if(!(validate152(data.external_commit, {instancePath:instancePath+"/external_commit",parentData:data,parentDataProperty:"external_commit",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate152.errors : vErrors.concat(validate152.errors);
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
validate151.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate151.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate150(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate150.evaluated;
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
const _errs5 = errors;
let valid1 = false;
let passing0 = null;
const _errs6 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err8 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceRouteDiagnostic06/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1.stage === undefined){
const err9 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceRouteDiagnostic06/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
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
const err10 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceRouteDiagnostic06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
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
const err11 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/SourceRouteDiagnostic06/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!(((((((((((((((data2 === "SOURCE_INPUT_INVALID") || (data2 === "SOURCE_HOST_UNTRUSTED")) || (data2 === "SOURCE_EXPECTED_ASSET_MISMATCH")) || (data2 === "SOURCE_HOST_DENIED")) || (data2 === "SOURCE_PERMISSION_REJECTED")) || (data2 === "SOURCE_CONTEXT_UNTRUSTED")) || (data2 === "SOURCE_CONTEXT_CLOSED")) || (data2 === "SOURCE_DEADLINE_EXCEEDED")) || (data2 === "SOURCE_PROVIDER_FAILED")) || (data2 === "SOURCE_HANDOFF_UNKNOWN")) || (data2 === "SOURCE_CAPABILITY_UNAVAILABLE")) || (data2 === "SOURCE_DRAFT_INVALID")) || (data2 === "SOURCE_INTERPRETATION_INCOMPLETE")) || (data2 === "SOURCE_POLICY_INVALID")) || (data2 === "SOURCE_OUTPUT_INVALID"))){
const err12 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/SourceRouteDiagnostic06/properties/code/enum",keyword:"enum",params:{allowedValues: schema234.properties.code.enum},message:"must be equal to one of the allowed values"};
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
const err13 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/SourceRouteDiagnostic06/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!((((((data3 === "input") || (data3 === "admission")) || (data3 === "authorization")) || (data3 === "semantic")) || (data3 === "return")) || (data3 === "output"))){
const err14 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/SourceRouteDiagnostic06/properties/stage/enum",keyword:"enum",params:{allowedValues: schema234.properties.stage.enum},message:"must be equal to one of the allowed values"};
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
const err15 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/SourceRouteDiagnostic06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs6 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
var props0 = true;
}
const _errs14 = errors;
const _errs16 = errors;
let valid5 = false;
let passing1 = null;
const _errs17 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err16 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/0/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data1.stage === undefined){
const err17 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/0/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key2 in data1){
if(!((key2 === "code") || (key2 === "stage"))){
const err18 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data1.code !== undefined){
let data4 = data1.code;
if(typeof data4 !== "string"){
const err19 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/0/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if("PROTECTION_INPUT_INVALID" !== data4){
const err20 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/0/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_INPUT_INVALID"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data1.stage !== undefined){
let data5 = data1.stage;
if(typeof data5 !== "string"){
const err21 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/0/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(!(data5 === "input")){
const err22 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/0/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[0].properties.stage.enum},message:"must be equal to one of the allowed values"};
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
const err23 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
var _valid1 = _errs17 === errors;
if(_valid1){
valid5 = true;
passing1 = 0;
var props1 = true;
}
const _errs24 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err24 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/1/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data1.stage === undefined){
const err25 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/1/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
for(const key3 in data1){
if(!((key3 === "code") || (key3 === "stage"))){
const err26 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data1.code !== undefined){
let data6 = data1.code;
if(typeof data6 !== "string"){
const err27 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/1/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if("PROTECTION_DECLARATION_INVALID" !== data6){
const err28 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/1/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_DECLARATION_INVALID"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data1.stage !== undefined){
let data7 = data1.stage;
if(typeof data7 !== "string"){
const err29 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/1/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(!(data7 === "declaration")){
const err30 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/1/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[1].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
else {
const err31 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
var _valid1 = _errs24 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid5 = true;
passing1 = 1;
if(props1 !== true){
props1 = true;
}
}
const _errs31 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err32 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/2/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data1.stage === undefined){
const err33 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/2/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
for(const key4 in data1){
if(!((key4 === "code") || (key4 === "stage"))){
const err34 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data1.code !== undefined){
let data8 = data1.code;
if(typeof data8 !== "string"){
const err35 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/2/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if("PROTECTION_PROFILE_UNSUPPORTED" !== data8){
const err36 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/2/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_PROFILE_UNSUPPORTED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data1.stage !== undefined){
let data9 = data1.stage;
if(typeof data9 !== "string"){
const err37 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/2/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(!(((data9 === "declaration") || (data9 === "envelope")) || (data9 === "integrity"))){
const err38 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/2/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[2].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
}
else {
const err39 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
var _valid1 = _errs31 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid5 = true;
passing1 = 2;
if(props1 !== true){
props1 = true;
}
}
const _errs38 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err40 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/3/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data1.stage === undefined){
const err41 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/3/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
for(const key5 in data1){
if(!((key5 === "code") || (key5 === "stage"))){
const err42 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data1.code !== undefined){
let data10 = data1.code;
if(typeof data10 !== "string"){
const err43 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/3/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if("PROTECTION_ENVELOPE_INVALID" !== data10){
const err44 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/3/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_ENVELOPE_INVALID"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data1.stage !== undefined){
let data11 = data1.stage;
if(typeof data11 !== "string"){
const err45 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/3/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(!(data11 === "envelope")){
const err46 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/3/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[3].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
else {
const err47 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
var _valid1 = _errs38 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid5 = true;
passing1 = 3;
if(props1 !== true){
props1 = true;
}
}
const _errs45 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err48 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/4/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data1.stage === undefined){
const err49 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/4/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
for(const key6 in data1){
if(!((key6 === "code") || (key6 === "stage"))){
const err50 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/4/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data1.code !== undefined){
let data12 = data1.code;
if(typeof data12 !== "string"){
const err51 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/4/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if("PROTECTION_KDF_UNAVAILABLE" !== data12){
const err52 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/4/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_KDF_UNAVAILABLE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data1.stage !== undefined){
let data13 = data1.stage;
if(typeof data13 !== "string"){
const err53 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/4/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(!(data13 === "kdf")){
const err54 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/4/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[4].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
}
else {
const err55 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
var _valid1 = _errs45 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 4];
}
else {
if(_valid1){
valid5 = true;
passing1 = 4;
if(props1 !== true){
props1 = true;
}
}
const _errs52 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err56 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/5/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data1.stage === undefined){
const err57 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/5/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
for(const key7 in data1){
if(!((key7 === "code") || (key7 === "stage"))){
const err58 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/5/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data1.code !== undefined){
let data14 = data1.code;
if(typeof data14 !== "string"){
const err59 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/5/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if("PROTECTION_CREDENTIAL_REQUIRED" !== data14){
const err60 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/5/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_CREDENTIAL_REQUIRED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data1.stage !== undefined){
let data15 = data1.stage;
if(typeof data15 !== "string"){
const err61 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/5/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(!(data15 === "credential")){
const err62 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/5/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[5].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
}
else {
const err63 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
var _valid1 = _errs52 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 5];
}
else {
if(_valid1){
valid5 = true;
passing1 = 5;
if(props1 !== true){
props1 = true;
}
}
const _errs59 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err64 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/6/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data1.stage === undefined){
const err65 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/6/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
for(const key8 in data1){
if(!((key8 === "code") || (key8 === "stage"))){
const err66 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/6/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data1.code !== undefined){
let data16 = data1.code;
if(typeof data16 !== "string"){
const err67 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/6/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if("PROTECTION_AUTHENTICATION_FAILED" !== data16){
const err68 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/6/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_AUTHENTICATION_FAILED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data1.stage !== undefined){
let data17 = data1.stage;
if(typeof data17 !== "string"){
const err69 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/6/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(!(data17 === "authentication")){
const err70 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/6/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[6].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
}
else {
const err71 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
var _valid1 = _errs59 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 6];
}
else {
if(_valid1){
valid5 = true;
passing1 = 6;
if(props1 !== true){
props1 = true;
}
}
const _errs66 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err72 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/7/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(data1.stage === undefined){
const err73 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/7/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
for(const key9 in data1){
if(!((key9 === "code") || (key9 === "stage"))){
const err74 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/7/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data1.code !== undefined){
let data18 = data1.code;
if(typeof data18 !== "string"){
const err75 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/7/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if("PROTECTION_CHECKSUMS_INVALID" !== data18){
const err76 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/7/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_CHECKSUMS_INVALID"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data1.stage !== undefined){
let data19 = data1.stage;
if(typeof data19 !== "string"){
const err77 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/7/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(!(data19 === "integrity")){
const err78 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/7/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[7].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
}
else {
const err79 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
var _valid1 = _errs66 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 7];
}
else {
if(_valid1){
valid5 = true;
passing1 = 7;
if(props1 !== true){
props1 = true;
}
}
const _errs73 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err80 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/8/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(data1.stage === undefined){
const err81 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/8/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
for(const key10 in data1){
if(!((key10 === "code") || (key10 === "stage"))){
const err82 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/8/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
if(data1.code !== undefined){
let data20 = data1.code;
if(typeof data20 !== "string"){
const err83 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/8/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if("PROTECTION_SIGNATURE_INVALID" !== data20){
const err84 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/8/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_SIGNATURE_INVALID"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
if(data1.stage !== undefined){
let data21 = data1.stage;
if(typeof data21 !== "string"){
const err85 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/8/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(!(data21 === "integrity")){
const err86 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/8/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[8].properties.stage.enum},message:"must be equal to one of the allowed values"};
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
const err87 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
var _valid1 = _errs73 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 8];
}
else {
if(_valid1){
valid5 = true;
passing1 = 8;
if(props1 !== true){
props1 = true;
}
}
const _errs80 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err88 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/9/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(data1.stage === undefined){
const err89 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/9/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
for(const key11 in data1){
if(!((key11 === "code") || (key11 === "stage"))){
const err90 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/9/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key11},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(data1.code !== undefined){
let data22 = data1.code;
if(typeof data22 !== "string"){
const err91 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/9/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if("PROTECTION_SIGNATURE_PIN_MISMATCH" !== data22){
const err92 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/9/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_SIGNATURE_PIN_MISMATCH"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
if(data1.stage !== undefined){
let data23 = data1.stage;
if(typeof data23 !== "string"){
const err93 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/9/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(!(data23 === "integrity")){
const err94 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/9/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[9].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
}
else {
const err95 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/9/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
var _valid1 = _errs80 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 9];
}
else {
if(_valid1){
valid5 = true;
passing1 = 9;
if(props1 !== true){
props1 = true;
}
}
const _errs87 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err96 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/10/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(data1.stage === undefined){
const err97 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/10/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
for(const key12 in data1){
if(!((key12 === "code") || (key12 === "stage"))){
const err98 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/10/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key12},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
if(data1.code !== undefined){
let data24 = data1.code;
if(typeof data24 !== "string"){
const err99 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/10/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
if("PROTECTION_GRANT_INVALID" !== data24){
const err100 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/10/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_GRANT_INVALID"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
if(data1.stage !== undefined){
let data25 = data1.stage;
if(typeof data25 !== "string"){
const err101 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/10/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(!(data25 === "grant")){
const err102 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/10/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[10].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
}
else {
const err103 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/10/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
var _valid1 = _errs87 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 10];
}
else {
if(_valid1){
valid5 = true;
passing1 = 10;
if(props1 !== true){
props1 = true;
}
}
const _errs94 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err104 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/11/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
if(data1.stage === undefined){
const err105 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/11/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
for(const key13 in data1){
if(!((key13 === "code") || (key13 === "stage"))){
const err106 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/11/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key13},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
if(data1.code !== undefined){
let data26 = data1.code;
if(typeof data26 !== "string"){
const err107 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/11/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if("PROTECTION_GRANT_BINDING_MISMATCH" !== data26){
const err108 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/11/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_GRANT_BINDING_MISMATCH"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
if(data1.stage !== undefined){
let data27 = data1.stage;
if(typeof data27 !== "string"){
const err109 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/11/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(!(data27 === "grant")){
const err110 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/11/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[11].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
}
else {
const err111 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/11/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
var _valid1 = _errs94 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 11];
}
else {
if(_valid1){
valid5 = true;
passing1 = 11;
if(props1 !== true){
props1 = true;
}
}
const _errs101 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err112 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/12/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
if(data1.stage === undefined){
const err113 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/12/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
for(const key14 in data1){
if(!((key14 === "code") || (key14 === "stage"))){
const err114 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/12/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key14},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
if(data1.code !== undefined){
let data28 = data1.code;
if(typeof data28 !== "string"){
const err115 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/12/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
if("PROTECTION_AUTHORIZATION_EXPIRED" !== data28){
const err116 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/12/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_AUTHORIZATION_EXPIRED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
}
if(data1.stage !== undefined){
let data29 = data1.stage;
if(typeof data29 !== "string"){
const err117 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/12/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
if(!((((data29 === "authorization") || (data29 === "projection")) || (data29 === "host_handoff")) || (data29 === "transport_commit"))){
const err118 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/12/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[12].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
}
}
else {
const err119 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/12/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
var _valid1 = _errs101 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 12];
}
else {
if(_valid1){
valid5 = true;
passing1 = 12;
if(props1 !== true){
props1 = true;
}
}
const _errs108 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err120 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/13/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(data1.stage === undefined){
const err121 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/13/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
for(const key15 in data1){
if(!((key15 === "code") || (key15 === "stage"))){
const err122 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/13/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key15},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
if(data1.code !== undefined){
let data30 = data1.code;
if(typeof data30 !== "string"){
const err123 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/13/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if("PROTECTION_AUTHORIZATION_REVOKED" !== data30){
const err124 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/13/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_AUTHORIZATION_REVOKED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
}
if(data1.stage !== undefined){
let data31 = data1.stage;
if(typeof data31 !== "string"){
const err125 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/13/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(!((((data31 === "authorization") || (data31 === "projection")) || (data31 === "host_handoff")) || (data31 === "transport_commit"))){
const err126 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/13/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[13].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
}
else {
const err127 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/13/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
var _valid1 = _errs108 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 13];
}
else {
if(_valid1){
valid5 = true;
passing1 = 13;
if(props1 !== true){
props1 = true;
}
}
const _errs115 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err128 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/14/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
if(data1.stage === undefined){
const err129 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/14/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
for(const key16 in data1){
if(!((key16 === "code") || (key16 === "stage"))){
const err130 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/14/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key16},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
}
if(data1.code !== undefined){
let data32 = data1.code;
if(typeof data32 !== "string"){
const err131 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/14/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
if("PROTECTION_REFRESH_REQUIRED" !== data32){
const err132 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/14/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_REFRESH_REQUIRED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
if(data1.stage !== undefined){
let data33 = data1.stage;
if(typeof data33 !== "string"){
const err133 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/14/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
if(!((((data33 === "authorization") || (data33 === "projection")) || (data33 === "host_handoff")) || (data33 === "transport_commit"))){
const err134 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/14/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[14].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
}
else {
const err135 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/14/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
var _valid1 = _errs115 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 14];
}
else {
if(_valid1){
valid5 = true;
passing1 = 14;
if(props1 !== true){
props1 = true;
}
}
const _errs122 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err136 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/15/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
if(data1.stage === undefined){
const err137 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/15/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
for(const key17 in data1){
if(!((key17 === "code") || (key17 === "stage"))){
const err138 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/15/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key17},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
if(data1.code !== undefined){
let data34 = data1.code;
if(typeof data34 !== "string"){
const err139 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/15/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if("PROTECTION_STATE_ROLLBACK" !== data34){
const err140 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/15/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_STATE_ROLLBACK"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
}
if(data1.stage !== undefined){
let data35 = data1.stage;
if(typeof data35 !== "string"){
const err141 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/15/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
if(!((((data35 === "authorization") || (data35 === "projection")) || (data35 === "host_handoff")) || (data35 === "transport_commit"))){
const err142 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/15/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[15].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
}
}
else {
const err143 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/15/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
var _valid1 = _errs122 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 15];
}
else {
if(_valid1){
valid5 = true;
passing1 = 15;
if(props1 !== true){
props1 = true;
}
}
const _errs129 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err144 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/16/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if(data1.stage === undefined){
const err145 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/16/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
for(const key18 in data1){
if(!((key18 === "code") || (key18 === "stage"))){
const err146 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/16/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key18},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
}
if(data1.code !== undefined){
let data36 = data1.code;
if(typeof data36 !== "string"){
const err147 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/16/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if("PROTECTION_PROVIDER_FAILED" !== data36){
const err148 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/16/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_PROVIDER_FAILED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
}
if(data1.stage !== undefined){
let data37 = data1.stage;
if(typeof data37 !== "string"){
const err149 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/16/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
if(!((((data37 === "authorization") || (data37 === "projection")) || (data37 === "host_handoff")) || (data37 === "transport_commit"))){
const err150 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/16/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[16].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
}
}
else {
const err151 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/16/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
var _valid1 = _errs129 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 16];
}
else {
if(_valid1){
valid5 = true;
passing1 = 16;
if(props1 !== true){
props1 = true;
}
}
const _errs136 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err152 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/17/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
if(data1.stage === undefined){
const err153 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/17/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
for(const key19 in data1){
if(!((key19 === "code") || (key19 === "stage"))){
const err154 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/17/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key19},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
}
if(data1.code !== undefined){
let data38 = data1.code;
if(typeof data38 !== "string"){
const err155 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/17/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
if("PROTECTION_DECLARATION_CONFLICT" !== data38){
const err156 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/17/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_DECLARATION_CONFLICT"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
}
if(data1.stage !== undefined){
let data39 = data1.stage;
if(typeof data39 !== "string"){
const err157 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/17/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
if(!(data39 === "authorization")){
const err158 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/17/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[17].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
}
}
else {
const err159 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/17/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
var _valid1 = _errs136 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 17];
}
else {
if(_valid1){
valid5 = true;
passing1 = 17;
if(props1 !== true){
props1 = true;
}
}
const _errs143 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err160 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/18/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
if(data1.stage === undefined){
const err161 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/18/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
for(const key20 in data1){
if(!((key20 === "code") || (key20 === "stage"))){
const err162 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/18/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key20},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
}
if(data1.code !== undefined){
let data40 = data1.code;
if(typeof data40 !== "string"){
const err163 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/18/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
if("PROTECTION_OPERATION_UNTRUSTED" !== data40){
const err164 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/18/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_OPERATION_UNTRUSTED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
}
if(data1.stage !== undefined){
let data41 = data1.stage;
if(typeof data41 !== "string"){
const err165 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/18/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
if(!(data41 === "input")){
const err166 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/18/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[18].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
}
}
else {
const err167 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/18/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
var _valid1 = _errs143 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 18];
}
else {
if(_valid1){
valid5 = true;
passing1 = 18;
if(props1 !== true){
props1 = true;
}
}
const _errs150 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.code === undefined){
const err168 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/19/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if(data1.stage === undefined){
const err169 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/19/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
for(const key21 in data1){
if(!((key21 === "code") || (key21 === "stage"))){
const err170 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/19/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key21},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
}
if(data1.code !== undefined){
let data42 = data1.code;
if(typeof data42 !== "string"){
const err171 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/19/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
if("PROTECTION_OPERATION_DISPOSED" !== data42){
const err172 = {instancePath:instancePath+"/diagnostic/code",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/19/properties/code/const",keyword:"const",params:{allowedValue: "PROTECTION_OPERATION_DISPOSED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
}
if(data1.stage !== undefined){
let data43 = data1.stage;
if(typeof data43 !== "string"){
const err173 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/19/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
if(!(((((data43 === "input") || (data43 === "authorization")) || (data43 === "projection")) || (data43 === "host_handoff")) || (data43 === "transport_commit"))){
const err174 = {instancePath:instancePath+"/diagnostic/stage",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/19/properties/stage/enum",keyword:"enum",params:{allowedValues: schema235.oneOf[19].properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err174];
}
else {
vErrors.push(err174);
}
errors++;
}
}
}
else {
const err175 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf/19/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
var _valid1 = _errs150 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 19];
}
else {
if(_valid1){
valid5 = true;
passing1 = 19;
if(props1 !== true){
props1 = true;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
if(!valid5){
const err176 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/$defs/OriginalProtectionDiagnosticFor06/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
else {
errors = _errs16;
if(vErrors !== null){
if(_errs16){
vErrors.length = _errs16;
}
else {
vErrors = null;
}
}
}
var _valid0 = _errs14 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
if(props0 !== true && props1 !== undefined){
if(props1 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props1);
}
}
}
}
if(!valid1){
const err177 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/properties/diagnostic/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
else {
errors = _errs5;
if(vErrors !== null){
if(_errs5){
vErrors.length = _errs5;
}
else {
vErrors = null;
}
}
}
}
if(data.disclosure !== undefined){
if(!(validate151(data.disclosure, {instancePath:instancePath+"/disclosure",parentData:data,parentDataProperty:"disclosure",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate151.errors : vErrors.concat(validate151.errors);
errors = vErrors.length;
}
}
if(data.body !== undefined){
if(data.body !== null){
const err178 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
}
if(data.body_bytes !== undefined){
let data46 = data.body_bytes;
if(!(((typeof data46 == "number") && (!(data46 % 1) && !isNaN(data46))) && (isFinite(data46)))){
const err179 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/properties/body_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
if(0 !== data46){
const err180 = {instancePath:instancePath+"/body_bytes",schemaPath:"#/properties/body_bytes/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
}
}
else {
const err181 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
validate150.errors = vErrors;
return errors === 0;
}
validate150.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema248 = {"type":"object","properties":{"status":{"type":"string","const":"core_rejected"},"stage":{"type":"string","enum":["input","capture","admission","output"]},"core":{"$ref":"#/$defs/CoreAdmissionRejected"},"disclosure":{"$ref":"#/$defs/OriginalProtectionDisclosureFor06"},"body":{"type":"null"},"body_bytes":{"type":"integer","const":0}},"required":["status","stage","core","disclosure","body","body_bytes"],"additionalProperties":false};
const schema249 = {"type":"object","properties":{"status":{"type":"string","const":"rejected"},"reason":{"$ref":"#/$defs/ReadDiagnosticCode"},"diagnostics":{"type":"array","items":{"$ref":"#/$defs/ReadDiagnostic"},"minItems":1,"maxItems":1},"states":{"$ref":"#/$defs/CoreStaticStates"},"component_failure":{"anyOf":[{"$ref":"#/$defs/CoreComponentFailure"},{"type":"null","const":null}]}},"required":["status","reason","diagnostics","states","component_failure"],"additionalProperties":false};
const schema250 = {"type":"string","enum":["READ_INPUT_INVALID","READ_SNAPSHOT_UNATTESTED","READ_CORE_CAPABILITY_UNAVAILABLE","READ_UNSUPPORTED_VERSION","READ_MIXED_VERSION_TUPLE","READ_CORE_INVALID","READ_INTERPRETATION_INCOMPLETE","READ_STATIC_POLICY_INVALID","READ_ASSET_MISMATCH","READ_ASSET_VERSION_MISMATCH","READ_SELECTION_NOT_FOUND","READ_SELECTION_AMBIGUOUS","READ_HANDLE_UNTRUSTED","READ_HANDLE_VERSION_MISMATCH","READ_HANDLE_STALE","READ_HANDLE_ASSET_MISMATCH","READ_HANDLE_SCOPE_MISMATCH","READ_HOST_CONTEXT_UNTRUSTED","READ_HOST_EPOCH_MISMATCH","READ_HOST_TIME_INVALID","READ_HANDLE_EXPIRED","READ_HOST_CONTEXT_EXPIRED","READ_HOST_DENIED","READ_SCOPE_DENIED","READ_PROJECTION_INVALID","READ_BUDGET_INSUFFICIENT","READ_COMPONENT_DECLARATION_INVALID","READ_COMPONENT_CONTENT_INVALID","READ_COMPONENT_REFERENCE_INVALID","READ_COMPONENT_GRAPH_CYCLE","READ_COMPONENT_LIMIT_EXCEEDED","READ_COMPONENT_BINDING_INVALID","READ_COMPONENT_ADOPTION_INVALID","READ_METHOD_PRESENCE_INVALID","READ_R2_STRUCTURE_INVALID","READ_R2_REFERENCE_INVALID","READ_R2_METHOD_INVALID","READ_R2_PLAN_INVALID","READ_R2_POLICY_INVALID","READ_R2_SCOPE_INVALID","READ_R2_EXAMPLE_INVALID","READ_R2_HISTORY_INVALID","READ_UNSUPPORTED_CRITICAL","READ_UNRESOLVED_EXTERNAL"]};
const schema251 = {"type":"object","properties":{"code":{"$ref":"#/$defs/ReadDiagnosticCode"},"stage":{"$ref":"#/$defs/ReadStage"},"severity":{"type":"string","enum":["error","warning"]},"subject":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null"}]},"field":{"anyOf":[{"$ref":"#/$defs/Text"},{"type":"null"}]}},"required":["code","stage","severity","subject","field"],"additionalProperties":false};
const schema253 = {"type":"string","enum":["input","version","core","selection","handle","host","projection","budget"]};

function validate162(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate162.evaluated;
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
const err7 = {instancePath:instancePath+"/code",schemaPath:"#/$defs/ReadDiagnosticCode/enum",keyword:"enum",params:{allowedValues: schema250.enum},message:"must be equal to one of the allowed values"};
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
const err9 = {instancePath:instancePath+"/stage",schemaPath:"#/$defs/ReadStage/enum",keyword:"enum",params:{allowedValues: schema253.enum},message:"must be equal to one of the allowed values"};
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
const err11 = {instancePath:instancePath+"/severity",schemaPath:"#/properties/severity/enum",keyword:"enum",params:{allowedValues: schema251.properties.severity.enum},message:"must be equal to one of the allowed values"};
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
if(func2(data3) > 256){
const err12 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func2(data3) < 1){
const err13 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern4.test(data3)){
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
validate162.errors = vErrors;
return errors === 0;
}
validate162.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema256 = {"type":"object","properties":{"core":{"$ref":"#/$defs/TechnicalState"},"interpretation":{"$ref":"#/$defs/InterpretationState"}},"required":["core","interpretation"],"additionalProperties":false};
const schema257 = {"type":"string","enum":["not_evaluated","valid","invalid"]};
const schema258 = {"type":"string","enum":["not_evaluated","complete","degraded","blocked"]};

function validate164(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate164.evaluated;
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
const err4 = {instancePath:instancePath+"/core",schemaPath:"#/$defs/TechnicalState/enum",keyword:"enum",params:{allowedValues: schema257.enum},message:"must be equal to one of the allowed values"};
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
const err6 = {instancePath:instancePath+"/interpretation",schemaPath:"#/$defs/InterpretationState/enum",keyword:"enum",params:{allowedValues: schema258.enum},message:"must be equal to one of the allowed values"};
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
validate164.errors = vErrors;
return errors === 0;
}
validate164.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema259 = {"type":"object","properties":{"judgment_ref":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null","const":null}]},"component_ref":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null","const":null}]},"status":{"type":"string","const":"invalid"},"body":{"type":"null","const":null},"code":{"type":"string","enum":["READ_COMPONENT_DECLARATION_INVALID","READ_COMPONENT_CONTENT_INVALID","READ_COMPONENT_REFERENCE_INVALID","READ_COMPONENT_GRAPH_CYCLE","READ_COMPONENT_LIMIT_EXCEEDED","READ_COMPONENT_BINDING_INVALID","READ_COMPONENT_ADOPTION_INVALID","READ_METHOD_PRESENCE_INVALID"]}},"required":["judgment_ref","component_ref","status","body","code"],"additionalProperties":false};

function validate166(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate166.evaluated;
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
if(func2(data0) > 256){
const err6 = {instancePath:instancePath+"/judgment_ref",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func2(data0) < 1){
const err7 = {instancePath:instancePath+"/judgment_ref",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern4.test(data0)){
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
const err11 = {instancePath:instancePath+"/judgment_ref",schemaPath:"#/properties/judgment_ref/anyOf/1/const",keyword:"const",params:{allowedValue: schema259.properties.judgment_ref.anyOf[1].const},message:"must be equal to constant"};
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
if(func2(data1) > 256){
const err13 = {instancePath:instancePath+"/component_ref",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data1) < 1){
const err14 = {instancePath:instancePath+"/component_ref",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!pattern4.test(data1)){
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
const err18 = {instancePath:instancePath+"/component_ref",schemaPath:"#/properties/component_ref/anyOf/1/const",keyword:"const",params:{allowedValue: schema259.properties.component_ref.anyOf[1].const},message:"must be equal to constant"};
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
const err23 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/const",keyword:"const",params:{allowedValue: schema259.properties.body.const},message:"must be equal to constant"};
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
const err25 = {instancePath:instancePath+"/code",schemaPath:"#/properties/code/enum",keyword:"enum",params:{allowedValues: schema259.properties.code.enum},message:"must be equal to one of the allowed values"};
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
validate166.errors = vErrors;
return errors === 0;
}
validate166.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate161(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate161.evaluated;
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
const err9 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/ReadDiagnosticCode/enum",keyword:"enum",params:{allowedValues: schema250.enum},message:"must be equal to one of the allowed values"};
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
if(!(validate162(data2[i0], {instancePath:instancePath+"/diagnostics/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate162.errors : vErrors.concat(validate162.errors);
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
if(!(validate164(data.states, {instancePath:instancePath+"/states",parentData:data,parentDataProperty:"states",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate164.errors : vErrors.concat(validate164.errors);
errors = vErrors.length;
}
}
if(data.component_failure !== undefined){
let data5 = data.component_failure;
const _errs12 = errors;
let valid4 = false;
const _errs13 = errors;
if(!(validate166(data5, {instancePath:instancePath+"/component_failure",parentData:data,parentDataProperty:"component_failure",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate166.errors : vErrors.concat(validate166.errors);
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
const err14 = {instancePath:instancePath+"/component_failure",schemaPath:"#/properties/component_failure/anyOf/1/const",keyword:"const",params:{allowedValue: schema249.properties.component_failure.anyOf[1].const},message:"must be equal to constant"};
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
validate161.errors = vErrors;
return errors === 0;
}
validate161.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate160(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate160.evaluated;
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
const err10 = {instancePath:instancePath+"/stage",schemaPath:"#/properties/stage/enum",keyword:"enum",params:{allowedValues: schema248.properties.stage.enum},message:"must be equal to one of the allowed values"};
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
if(!(validate161(data.core, {instancePath:instancePath+"/core",parentData:data,parentDataProperty:"core",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate161.errors : vErrors.concat(validate161.errors);
errors = vErrors.length;
}
}
if(data.disclosure !== undefined){
if(!(validate151(data.disclosure, {instancePath:instancePath+"/disclosure",parentData:data,parentDataProperty:"disclosure",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate151.errors : vErrors.concat(validate151.errors);
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
validate160.errors = vErrors;
return errors === 0;
}
validate160.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate149(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate149.evaluated;
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
const err5 = {instancePath:instancePath+"/request",schemaPath:"#/$defs/AdmittedNativeCreationRequest06/false schema",keyword:"false schema",params:{},message:"boolean schema is false"};
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
if(!(validate150(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate150.errors : vErrors.concat(validate150.errors);
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
if(!(validate160(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate160.errors : vErrors.concat(validate160.errors);
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
validate149.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate149.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate148(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:creation06:NativeCreationRequestAdmission06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate148.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate149(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate149.errors : vErrors.concat(validate149.errors);
errors = vErrors.length;
}
else {
var props0 = validate149.evaluated.props;
}
validate148.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate148.evaluated = {"dynamicProps":true,"dynamicItems":false};

