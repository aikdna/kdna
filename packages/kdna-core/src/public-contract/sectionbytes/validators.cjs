"use strict";
exports.NativeSectionByteContract06 = validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:sectionbytes06:NativeSectionByteContract06","title":"NativeSectionByteContract06","description":"Native owned-byte admission structural data only; opaque requests and byte-read authority require actual native brands.","$ref":"#/$defs/NativeSectionByteContract06","$defs":{"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"NativeSectionByteContract06":{"type":"object","properties":{"id":{"const":"kdna.section-bytes-node","type":"string"},"version":{"const":"0.1.1-candidate","type":"string"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false}}};
const schema32 = {"type":"object","properties":{"id":{"const":"kdna.section-bytes-node","type":"string"},"version":{"const":"0.1.1-candidate","type":"string"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false};
const schema33 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$"};
const pattern4 = new RegExp("^sha256:[0-9a-f]{64}$", "u");

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
if("kdna.section-bytes-node" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.section-bytes-node"},message:"must be equal to constant"};
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
if("0.1.1-candidate" !== data1){
const err7 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/const",keyword:"const",params:{allowedValue: "0.1.1-candidate"},message:"must be equal to constant"};
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
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:sectionbytes06:NativeSectionByteContract06" */;
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

exports.NativeSectionByteObservation06 = validate23;
const schema34 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:sectionbytes06:NativeSectionByteObservation06","title":"NativeSectionByteObservation06","description":"Native owned-byte admission structural data only; opaque requests and byte-read authority require actual native brands.","$ref":"#/$defs/NativeSectionByteObservation06","$defs":{"CapturedInput06":{"type":"object","properties":{"capture_id":{"$ref":"#/$defs/Identifier"},"input_byte_length":{"$ref":"#/$defs/UInt"},"manifest_bytes_digest":{"$ref":"#/$defs/Digest"},"zip_directory_bytes_digest":{"$ref":"#/$defs/Digest"},"table_frames":{"type":"array","items":{"$ref":"#/$defs/CheckedSection06"},"minItems":0},"identity_scope":{"type":"string","const":"observed_metadata_and_loaded_sections_only"}},"required":["capture_id","input_byte_length","manifest_bytes_digest","zip_directory_bytes_digest","table_frames","identity_scope"],"additionalProperties":false},"CheckedSection06":{"type":"object","properties":{"section_id":{"$ref":"#/$defs/Identifier"},"member":{"$ref":"#/$defs/EntryName"},"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"type":"integer","minimum":1},"digest":{"$ref":"#/$defs/Digest"}},"required":["section_id","member","offset_bytes","length_bytes","digest"],"additionalProperties":false},"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"NativeSectionByteContract06":{"type":"object","properties":{"id":{"const":"kdna.section-bytes-node","type":"string"},"version":{"const":"0.1.1-candidate","type":"string"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false},"NativeSectionByteObservation06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"input_kind":{"type":"string","const":"owned_uint8array"},"input_byte_length":{"$ref":"#/$defs/UInt"},"ownership_copy":{"type":"object","properties":{"offset_bytes":{"type":"integer","const":0},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false},"capture":{"anyOf":[{"$ref":"#/$defs/CapturedInput06"},{"type":"null"}]},"access_ranges":{"type":"array","items":{"$ref":"#/$defs/SectionIORange06"}},"filesystem_reads":{"type":"integer","const":0}},"required":["contract","input_kind","input_byte_length","ownership_copy","capture","access_ranges","filesystem_reads"],"additionalProperties":false},"SectionIORange06":{"oneOf":[{"$ref":"#/$defs/SectionIOSingleRange06"},{"$ref":"#/$defs/SectionIOStructureBatch06"}]},"SectionIOSingleRange06":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"},"purpose":{"type":"string","enum":["zip_end","zip_directory","zip_local_header","zip_local_name","mimetype","manifest","whole_after_authorization","zip_directory_header","zip_directory_name","section_table_after_authorization","section_content_after_authorization","resource_after_authorization","section_structure_after_authorization","zip_locator_local_signature","zip_locator_local_header","zip_locator_directory_signature","zip_locator_directory_header","zip_locator_directory_name","zip_locator_local_name","zip_locator_eocd","zip_comment","checksum_document_after_authorization","checksum_member_after_authorization","signature_document_after_authorization","signature_member_after_authorization"]}},"required":["offset_bytes","length_bytes","purpose"],"additionalProperties":false},"SectionIOStructureBatch06":{"type":"object","properties":{"purpose":{"type":"string","enum":["section_structure_after_authorization","section_interpretation_after_authorization"]},"ranges":{"type":"array","minItems":1,"maxItems":4096,"items":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false}}},"required":["purpose","ranges"],"additionalProperties":false},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};
const schema35 = {"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"input_kind":{"type":"string","const":"owned_uint8array"},"input_byte_length":{"$ref":"#/$defs/UInt"},"ownership_copy":{"type":"object","properties":{"offset_bytes":{"type":"integer","const":0},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false},"capture":{"anyOf":[{"$ref":"#/$defs/CapturedInput06"},{"type":"null"}]},"access_ranges":{"type":"array","items":{"$ref":"#/$defs/SectionIORange06"}},"filesystem_reads":{"type":"integer","const":0}},"required":["contract","input_kind","input_byte_length","ownership_copy","capture","access_ranges","filesystem_reads"],"additionalProperties":false};
const schema38 = {"type":"integer","minimum":0,"maximum":9007199254740991};

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
if("kdna.section-bytes-node" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.section-bytes-node"},message:"must be equal to constant"};
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
if("0.1.1-candidate" !== data1){
const err7 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/const",keyword:"const",params:{allowedValue: "0.1.1-candidate"},message:"must be equal to constant"};
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
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema40 = {"type":"object","properties":{"capture_id":{"$ref":"#/$defs/Identifier"},"input_byte_length":{"$ref":"#/$defs/UInt"},"manifest_bytes_digest":{"$ref":"#/$defs/Digest"},"zip_directory_bytes_digest":{"$ref":"#/$defs/Digest"},"table_frames":{"type":"array","items":{"$ref":"#/$defs/CheckedSection06"},"minItems":0},"identity_scope":{"type":"string","const":"observed_metadata_and_loaded_sections_only"}},"required":["capture_id","input_byte_length","manifest_bytes_digest","zip_directory_bytes_digest","table_frames","identity_scope"],"additionalProperties":false};
const schema41 = {"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"};
const func1 = require("ajv/dist/runtime/ucs2length").default;
const pattern6 = new RegExp("^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$", "u");
const schema45 = {"type":"object","properties":{"section_id":{"$ref":"#/$defs/Identifier"},"member":{"$ref":"#/$defs/EntryName"},"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"type":"integer","minimum":1},"digest":{"$ref":"#/$defs/Digest"}},"required":["section_id","member","offset_bytes","length_bytes","digest"],"additionalProperties":false};
const schema47 = {"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"};
const pattern10 = new RegExp("^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$", "u");

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
if(data.section_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "section_id"},message:"must have required property '"+"section_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.member === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member"},message:"must have required property '"+"member"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.offset_bytes === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.length_bytes === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.digest === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "digest"},message:"must have required property '"+"digest"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "section_id") || (key0 === "member")) || (key0 === "offset_bytes")) || (key0 === "length_bytes")) || (key0 === "digest"))){
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
if(data.section_id !== undefined){
let data0 = data.section_id;
if(typeof data0 === "string"){
if(func1(data0) > 256){
const err6 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data0) < 1){
const err7 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern6.test(data0)){
const err8 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err9 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.member !== undefined){
let data1 = data.member;
if(typeof data1 === "string"){
if(func1(data1) > 4096){
const err10 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func1(data1) < 1){
const err11 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!pattern10.test(data1)){
const err12 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
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
const err13 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.offset_bytes !== undefined){
let data2 = data.offset_bytes;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err14 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err15 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err16 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.length_bytes !== undefined){
let data3 = data.length_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err17 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/properties/length_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 < 1 || isNaN(data3)){
const err18 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/properties/length_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.digest !== undefined){
let data4 = data.digest;
if(typeof data4 === "string"){
if(!pattern4.test(data4)){
const err19 = {instancePath:instancePath+"/digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err20 = {instancePath:instancePath+"/digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
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
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate27(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate27.evaluated;
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
if(data.table_frames === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "table_frames"},message:"must have required property '"+"table_frames"+"'"};
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
if(!((((((key0 === "capture_id") || (key0 === "input_byte_length")) || (key0 === "manifest_bytes_digest")) || (key0 === "zip_directory_bytes_digest")) || (key0 === "table_frames")) || (key0 === "identity_scope"))){
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
if(!pattern6.test(data0)){
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
if(data.table_frames !== undefined){
let data4 = data.table_frames;
if(Array.isArray(data4)){
if(data4.length < 0){
const err18 = {instancePath:instancePath+"/table_frames",schemaPath:"#/properties/table_frames/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate28(data4[i0], {instancePath:instancePath+"/table_frames/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/table_frames",schemaPath:"#/properties/table_frames/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
let data6 = data.identity_scope;
if(typeof data6 !== "string"){
const err20 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if("observed_metadata_and_loaded_sections_only" !== data6){
const err21 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/const",keyword:"const",params:{allowedValue: "observed_metadata_and_loaded_sections_only"},message:"must be equal to constant"};
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
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema50 = {"oneOf":[{"$ref":"#/$defs/SectionIOSingleRange06"},{"$ref":"#/$defs/SectionIOStructureBatch06"}]};
const schema51 = {"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"},"purpose":{"type":"string","enum":["zip_end","zip_directory","zip_local_header","zip_local_name","mimetype","manifest","whole_after_authorization","zip_directory_header","zip_directory_name","section_table_after_authorization","section_content_after_authorization","resource_after_authorization","section_structure_after_authorization","zip_locator_local_signature","zip_locator_local_header","zip_locator_directory_signature","zip_locator_directory_header","zip_locator_directory_name","zip_locator_local_name","zip_locator_eocd","zip_comment","checksum_document_after_authorization","checksum_member_after_authorization","signature_document_after_authorization","signature_member_after_authorization"]}},"required":["offset_bytes","length_bytes","purpose"],"additionalProperties":false};

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
if(data.offset_bytes === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.length_bytes === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.purpose === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "offset_bytes") || (key0 === "length_bytes")) || (key0 === "purpose"))){
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
if(data.offset_bytes !== undefined){
let data0 = data.offset_bytes;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err4 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 > 9007199254740991 || isNaN(data0)){
const err5 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0 < 0 || isNaN(data0)){
const err6 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.length_bytes !== undefined){
let data1 = data.length_bytes;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err7 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 9007199254740991 || isNaN(data1)){
const err8 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1 < 0 || isNaN(data1)){
const err9 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.purpose !== undefined){
let data2 = data.purpose;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!(((((((((((((((((((((((((data2 === "zip_end") || (data2 === "zip_directory")) || (data2 === "zip_local_header")) || (data2 === "zip_local_name")) || (data2 === "mimetype")) || (data2 === "manifest")) || (data2 === "whole_after_authorization")) || (data2 === "zip_directory_header")) || (data2 === "zip_directory_name")) || (data2 === "section_table_after_authorization")) || (data2 === "section_content_after_authorization")) || (data2 === "resource_after_authorization")) || (data2 === "section_structure_after_authorization")) || (data2 === "zip_locator_local_signature")) || (data2 === "zip_locator_local_header")) || (data2 === "zip_locator_directory_signature")) || (data2 === "zip_locator_directory_header")) || (data2 === "zip_locator_directory_name")) || (data2 === "zip_locator_local_name")) || (data2 === "zip_locator_eocd")) || (data2 === "zip_comment")) || (data2 === "checksum_document_after_authorization")) || (data2 === "checksum_member_after_authorization")) || (data2 === "signature_document_after_authorization")) || (data2 === "signature_member_after_authorization"))){
const err11 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/enum",keyword:"enum",params:{allowedValues: schema51.properties.purpose.enum},message:"must be equal to one of the allowed values"};
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
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema54 = {"type":"object","properties":{"purpose":{"type":"string","enum":["section_structure_after_authorization","section_interpretation_after_authorization"]},"ranges":{"type":"array","minItems":1,"maxItems":4096,"items":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false}}},"required":["purpose","ranges"],"additionalProperties":false};

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
if(data.purpose === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.ranges === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ranges"},message:"must have required property '"+"ranges"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "purpose") || (key0 === "ranges"))){
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
if(data.purpose !== undefined){
let data0 = data.purpose;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!((data0 === "section_structure_after_authorization") || (data0 === "section_interpretation_after_authorization"))){
const err4 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/enum",keyword:"enum",params:{allowedValues: schema54.properties.purpose.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.ranges !== undefined){
let data1 = data.ranges;
if(Array.isArray(data1)){
if(data1.length > 4096){
const err5 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/maxItems",keyword:"maxItems",params:{limit: 4096},message:"must NOT have more than 4096 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data1.length < 1){
const err6 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.offset_bytes === undefined){
const err7 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data2.length_bytes === undefined){
const err8 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key1 in data2){
if(!((key1 === "offset_bytes") || (key1 === "length_bytes"))){
const err9 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data2.offset_bytes !== undefined){
let data3 = data2.offset_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err10 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
const err11 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err12 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data2.length_bytes !== undefined){
let data4 = data2.length_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err13 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
const err14 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err15 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
}
else {
const err16 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err17 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate31(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate31.evaluated;
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
if(!(validate32(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate32.errors : vErrors.concat(validate32.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate34(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate34.errors : vErrors.concat(validate34.errors);
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
}
if(!valid0){
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
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
validate31.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate31.evaluated = {"dynamicProps":true,"dynamicItems":false};


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
if(data.input_kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_kind"},message:"must have required property '"+"input_kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.input_byte_length === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_byte_length"},message:"must have required property '"+"input_byte_length"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.ownership_copy === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ownership_copy"},message:"must have required property '"+"ownership_copy"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.capture === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture"},message:"must have required property '"+"capture"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.access_ranges === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "access_ranges"},message:"must have required property '"+"access_ranges"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.filesystem_reads === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "filesystem_reads"},message:"must have required property '"+"filesystem_reads"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "contract") || (key0 === "input_kind")) || (key0 === "input_byte_length")) || (key0 === "ownership_copy")) || (key0 === "capture")) || (key0 === "access_ranges")) || (key0 === "filesystem_reads"))){
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
if(data.contract !== undefined){
if(!(validate25(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
errors = vErrors.length;
}
}
if(data.input_kind !== undefined){
let data1 = data.input_kind;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/input_kind",schemaPath:"#/properties/input_kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if("owned_uint8array" !== data1){
const err9 = {instancePath:instancePath+"/input_kind",schemaPath:"#/properties/input_kind/const",keyword:"const",params:{allowedValue: "owned_uint8array"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.input_byte_length !== undefined){
let data2 = data.input_byte_length;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err10 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
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
const err11 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.ownership_copy !== undefined){
let data3 = data.ownership_copy;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.offset_bytes === undefined){
const err13 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data3.length_bytes === undefined){
const err14 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 in data3){
if(!((key1 === "offset_bytes") || (key1 === "length_bytes"))){
const err15 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data3.offset_bytes !== undefined){
let data4 = data3.offset_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err16 = {instancePath:instancePath+"/ownership_copy/offset_bytes",schemaPath:"#/properties/ownership_copy/properties/offset_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(0 !== data4){
const err17 = {instancePath:instancePath+"/ownership_copy/offset_bytes",schemaPath:"#/properties/ownership_copy/properties/offset_bytes/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data3.length_bytes !== undefined){
let data5 = data3.length_bytes;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err18 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 9007199254740991 || isNaN(data5)){
const err19 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err20 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
}
else {
const err21 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.capture !== undefined){
let data6 = data.capture;
const _errs17 = errors;
let valid4 = false;
const _errs18 = errors;
if(!(validate27(data6, {instancePath:instancePath+"/capture",parentData:data,parentDataProperty:"capture",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
var _valid0 = _errs18 === errors;
valid4 = valid4 || _valid0;
const _errs19 = errors;
if(data6 !== null){
const err22 = {instancePath:instancePath+"/capture",schemaPath:"#/properties/capture/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid0 = _errs19 === errors;
valid4 = valid4 || _valid0;
if(!valid4){
const err23 = {instancePath:instancePath+"/capture",schemaPath:"#/properties/capture/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
else {
errors = _errs17;
if(vErrors !== null){
if(_errs17){
vErrors.length = _errs17;
}
else {
vErrors = null;
}
}
}
}
if(data.access_ranges !== undefined){
let data7 = data.access_ranges;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
if(!(validate31(data7[i0], {instancePath:instancePath+"/access_ranges/" + i0,parentData:data7,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
errors = vErrors.length;
}
}
}
else {
const err24 = {instancePath:instancePath+"/access_ranges",schemaPath:"#/properties/access_ranges/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.filesystem_reads !== undefined){
let data9 = data.filesystem_reads;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err25 = {instancePath:instancePath+"/filesystem_reads",schemaPath:"#/properties/filesystem_reads/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(0 !== data9){
const err26 = {instancePath:instancePath+"/filesystem_reads",schemaPath:"#/properties/filesystem_reads/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:sectionbytes06:NativeSectionByteObservation06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate23.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate24(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
errors = vErrors.length;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.NativeSectionByteAuthorityContext06 = validate38;
const schema57 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:sectionbytes06:NativeSectionByteAuthorityContext06","title":"NativeSectionByteAuthorityContext06","description":"Native owned-byte admission structural data only; opaque requests and byte-read authority require actual native brands.","$ref":"#/$defs/NativeSectionByteAuthorityContext06","$defs":{"AssetIdentity":{"type":"object","properties":{"asset_id":{"$ref":"#/$defs/Identifier"},"asset_version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"}},"required":["asset_id","asset_version","judgment_version"],"additionalProperties":false},"CandidateVersionTuple06":{"type":"object","properties":{"container":{"const":"0.6.0","type":"string"},"payload_profile":{"const":"kdna.payload.judgment","type":"string"},"payload_version":{"const":"0.5.1","type":"string"},"core":{"const":"kdna.core/0.8.2","type":"string"},"ir":{"const":"kdna.canonical-ir/0.6.1","type":"string"},"runtime":{"const":"kdna.runtime-capsule/0.3.1","type":"string"},"plan":{"const":"kdna.consumption-plan/0.3.1","type":"string"},"host":{"const":"kdna.agent-host/0.3.1","type":"string"},"trace":{"const":"kdna.judgment-trace/0.3.1","type":"string"},"read":{"const":"kdna.read/0.7.0-candidate","type":"string"}},"required":["container","payload_profile","payload_version","core","ir","runtime","plan","host","trace","read"],"additionalProperties":false},"CapturedInput06":{"type":"object","properties":{"capture_id":{"$ref":"#/$defs/Identifier"},"input_byte_length":{"$ref":"#/$defs/UInt"},"manifest_bytes_digest":{"$ref":"#/$defs/Digest"},"zip_directory_bytes_digest":{"$ref":"#/$defs/Digest"},"table_frames":{"type":"array","items":{"$ref":"#/$defs/CheckedSection06"},"minItems":0},"identity_scope":{"type":"string","const":"observed_metadata_and_loaded_sections_only"}},"required":["capture_id","input_byte_length","manifest_bytes_digest","zip_directory_bytes_digest","table_frames","identity_scope"],"additionalProperties":false},"CheckedSection06":{"type":"object","properties":{"section_id":{"$ref":"#/$defs/Identifier"},"member":{"$ref":"#/$defs/EntryName"},"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"type":"integer","minimum":1},"digest":{"$ref":"#/$defs/Digest"}},"required":["section_id","member","offset_bytes","length_bytes","digest"],"additionalProperties":false},"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"NativeSectionByteAuthorityContext06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"operation":{"type":"string","const":"admit_owned_whole"},"request":{"$ref":"#/$defs/Request06_whole_asset"},"request_digest":{"$ref":"#/$defs/Digest"},"input_observation":{"$ref":"#/$defs/NativeSectionByteObservation06"},"manifest_identity":{"$ref":"#/$defs/AssetIdentity"},"signature_policy":{"$ref":"#/$defs/SectionSignaturePolicy06"},"signature_policy_digest":{"$ref":"#/$defs/Digest"},"signature_read_intent":{"$ref":"#/$defs/SectionSignatureReadIntent06"},"signature_read_intent_digest":{"$ref":"#/$defs/Digest"}},"required":["contract","operation","request","request_digest","input_observation","manifest_identity","signature_policy","signature_policy_digest","signature_read_intent","signature_read_intent_digest"],"additionalProperties":false},"NativeSectionByteContract06":{"type":"object","properties":{"id":{"const":"kdna.section-bytes-node","type":"string"},"version":{"const":"0.1.1-candidate","type":"string"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false},"NativeSectionByteObservation06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"input_kind":{"type":"string","const":"owned_uint8array"},"input_byte_length":{"$ref":"#/$defs/UInt"},"ownership_copy":{"type":"object","properties":{"offset_bytes":{"type":"integer","const":0},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false},"capture":{"anyOf":[{"$ref":"#/$defs/CapturedInput06"},{"type":"null"}]},"access_ranges":{"type":"array","items":{"$ref":"#/$defs/SectionIORange06"}},"filesystem_reads":{"type":"integer","const":0}},"required":["contract","input_kind","input_byte_length","ownership_copy","capture","access_ranges","filesystem_reads"],"additionalProperties":false},"Request06_whole_asset":{"type":"object","properties":{"request_id":{"$ref":"#/$defs/Identifier"},"tuple":{"$ref":"#/$defs/CandidateVersionTuple06"},"budget_bytes":{"$ref":"#/$defs/UInt"},"mode":{"const":"whole_asset","type":"string"},"selection":{"const":null,"type":"null"},"handle":{"const":null,"type":"null"}},"required":["request_id","tuple","budget_bytes","mode","selection","handle"],"additionalProperties":false},"SectionIORange06":{"oneOf":[{"$ref":"#/$defs/SectionIOSingleRange06"},{"$ref":"#/$defs/SectionIOStructureBatch06"}]},"SectionIOSingleRange06":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"},"purpose":{"type":"string","enum":["zip_end","zip_directory","zip_local_header","zip_local_name","mimetype","manifest","whole_after_authorization","zip_directory_header","zip_directory_name","section_table_after_authorization","section_content_after_authorization","resource_after_authorization","section_structure_after_authorization","zip_locator_local_signature","zip_locator_local_header","zip_locator_directory_signature","zip_locator_directory_header","zip_locator_directory_name","zip_locator_local_name","zip_locator_eocd","zip_comment","checksum_document_after_authorization","checksum_member_after_authorization","signature_document_after_authorization","signature_member_after_authorization"]}},"required":["offset_bytes","length_bytes","purpose"],"additionalProperties":false},"SectionIOStructureBatch06":{"type":"object","properties":{"purpose":{"type":"string","enum":["section_structure_after_authorization","section_interpretation_after_authorization"]},"ranges":{"type":"array","minItems":1,"maxItems":4096,"items":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false}}},"required":["purpose","ranges"],"additionalProperties":false},"SectionSignaturePolicy06":{"type":"object","properties":{"requireSignature":{"type":"boolean"},"expectedPublicKeyHex":{"anyOf":[{"type":"string","pattern":"^[0-9a-f]{64}$","minLength":64,"maxLength":64},{"type":"null"}]}},"required":["requireSignature","expectedPublicKeyHex"],"additionalProperties":false},"SectionSignatureReadIntent06":{"oneOf":[{"type":"object","properties":{"operation":{"type":"string","const":"none"}},"required":["operation"],"additionalProperties":false},{"type":"object","properties":{"operation":{"type":"string","const":"verify_complete_original_kdsig_domain"},"signature_member":{"$ref":"#/$defs/SectionSignatureReadMember06"},"covered_members":{"type":"array","items":{"$ref":"#/$defs/SectionSignatureReadMember06"},"minItems":2,"maxItems":128},"excluded_members":{"type":"array","items":{"$ref":"#/$defs/EntryName"},"minItems":0,"maxItems":128},"profile":{"type":"string","const":"kdsig.ed25519"},"profile_version":{"type":"string","const":"0.1.0"}},"required":["operation","signature_member","covered_members","excluded_members","profile","profile_version"],"additionalProperties":false}]},"SectionSignatureReadMember06":{"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"bytes":{"type":"integer","minimum":0,"maximum":8388608}},"required":["name","bytes"],"additionalProperties":false},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991},"VersionLabel":{"$ref":"#/$defs/Identifier"}}};
const schema58 = {"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"operation":{"type":"string","const":"admit_owned_whole"},"request":{"$ref":"#/$defs/Request06_whole_asset"},"request_digest":{"$ref":"#/$defs/Digest"},"input_observation":{"$ref":"#/$defs/NativeSectionByteObservation06"},"manifest_identity":{"$ref":"#/$defs/AssetIdentity"},"signature_policy":{"$ref":"#/$defs/SectionSignaturePolicy06"},"signature_policy_digest":{"$ref":"#/$defs/Digest"},"signature_read_intent":{"$ref":"#/$defs/SectionSignatureReadIntent06"},"signature_read_intent_digest":{"$ref":"#/$defs/Digest"}},"required":["contract","operation","request","request_digest","input_observation","manifest_identity","signature_policy","signature_policy_digest","signature_read_intent","signature_read_intent_digest"],"additionalProperties":false};
const schema90 = {"type":"object","properties":{"requireSignature":{"type":"boolean"},"expectedPublicKeyHex":{"anyOf":[{"type":"string","pattern":"^[0-9a-f]{64}$","minLength":64,"maxLength":64},{"type":"null"}]}},"required":["requireSignature","expectedPublicKeyHex"],"additionalProperties":false};
const func7 = Object.prototype.hasOwnProperty;

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
if("kdna.section-bytes-node" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.section-bytes-node"},message:"must be equal to constant"};
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
if("0.1.1-candidate" !== data1){
const err7 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/const",keyword:"const",params:{allowedValue: "0.1.1-candidate"},message:"must be equal to constant"};
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
validate40.errors = vErrors;
return errors === 0;
}
validate40.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema61 = {"type":"object","properties":{"request_id":{"$ref":"#/$defs/Identifier"},"tuple":{"$ref":"#/$defs/CandidateVersionTuple06"},"budget_bytes":{"$ref":"#/$defs/UInt"},"mode":{"const":"whole_asset","type":"string"},"selection":{"const":null,"type":"null"},"handle":{"const":null,"type":"null"}},"required":["request_id","tuple","budget_bytes","mode","selection","handle"],"additionalProperties":false};
const schema63 = {"type":"object","properties":{"container":{"const":"0.6.0","type":"string"},"payload_profile":{"const":"kdna.payload.judgment","type":"string"},"payload_version":{"const":"0.5.1","type":"string"},"core":{"const":"kdna.core/0.8.2","type":"string"},"ir":{"const":"kdna.canonical-ir/0.6.1","type":"string"},"runtime":{"const":"kdna.runtime-capsule/0.3.1","type":"string"},"plan":{"const":"kdna.consumption-plan/0.3.1","type":"string"},"host":{"const":"kdna.agent-host/0.3.1","type":"string"},"trace":{"const":"kdna.judgment-trace/0.3.1","type":"string"},"read":{"const":"kdna.read/0.7.0-candidate","type":"string"}},"required":["container","payload_profile","payload_version","core","ir","runtime","plan","host","trace","read"],"additionalProperties":false};

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
if(data.budget_bytes === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "budget_bytes"},message:"must have required property '"+"budget_bytes"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.mode === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.selection === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "selection"},message:"must have required property '"+"selection"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.handle === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "handle"},message:"must have required property '"+"handle"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "request_id") || (key0 === "tuple")) || (key0 === "budget_bytes")) || (key0 === "mode")) || (key0 === "selection")) || (key0 === "handle"))){
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
if(!pattern6.test(data0)){
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
if(!(func7.call(schema63.properties, key1))){
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
if(data.budget_bytes !== undefined){
let data12 = data.budget_bytes;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err43 = {instancePath:instancePath+"/budget_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 > 9007199254740991 || isNaN(data12)){
const err44 = {instancePath:instancePath+"/budget_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data12 < 0 || isNaN(data12)){
const err45 = {instancePath:instancePath+"/budget_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.mode !== undefined){
let data13 = data.mode;
if(typeof data13 !== "string"){
const err46 = {instancePath:instancePath+"/mode",schemaPath:"#/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if("whole_asset" !== data13){
const err47 = {instancePath:instancePath+"/mode",schemaPath:"#/properties/mode/const",keyword:"const",params:{allowedValue: "whole_asset"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data.selection !== undefined){
let data14 = data.selection;
if(data14 !== null){
const err48 = {instancePath:instancePath+"/selection",schemaPath:"#/properties/selection/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(null !== data14){
const err49 = {instancePath:instancePath+"/selection",schemaPath:"#/properties/selection/const",keyword:"const",params:{allowedValue: schema61.properties.selection.const},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data.handle !== undefined){
let data15 = data.handle;
if(data15 !== null){
const err50 = {instancePath:instancePath+"/handle",schemaPath:"#/properties/handle/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(null !== data15){
const err51 = {instancePath:instancePath+"/handle",schemaPath:"#/properties/handle/const",keyword:"const",params:{allowedValue: schema61.properties.handle.const},message:"must be equal to constant"};
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
const err52 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
validate42.errors = vErrors;
return errors === 0;
}
validate42.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.section_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "section_id"},message:"must have required property '"+"section_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.member === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member"},message:"must have required property '"+"member"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.offset_bytes === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.length_bytes === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.digest === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "digest"},message:"must have required property '"+"digest"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "section_id") || (key0 === "member")) || (key0 === "offset_bytes")) || (key0 === "length_bytes")) || (key0 === "digest"))){
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
if(data.section_id !== undefined){
let data0 = data.section_id;
if(typeof data0 === "string"){
if(func1(data0) > 256){
const err6 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data0) < 1){
const err7 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern6.test(data0)){
const err8 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err9 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.member !== undefined){
let data1 = data.member;
if(typeof data1 === "string"){
if(func1(data1) > 4096){
const err10 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func1(data1) < 1){
const err11 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!pattern10.test(data1)){
const err12 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
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
const err13 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.offset_bytes !== undefined){
let data2 = data.offset_bytes;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err14 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err15 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err16 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.length_bytes !== undefined){
let data3 = data.length_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err17 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/properties/length_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 < 1 || isNaN(data3)){
const err18 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/properties/length_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.digest !== undefined){
let data4 = data.digest;
if(typeof data4 === "string"){
if(!pattern4.test(data4)){
const err19 = {instancePath:instancePath+"/digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err20 = {instancePath:instancePath+"/digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
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
if(data.table_frames === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "table_frames"},message:"must have required property '"+"table_frames"+"'"};
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
if(!((((((key0 === "capture_id") || (key0 === "input_byte_length")) || (key0 === "manifest_bytes_digest")) || (key0 === "zip_directory_bytes_digest")) || (key0 === "table_frames")) || (key0 === "identity_scope"))){
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
if(!pattern6.test(data0)){
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
if(data.table_frames !== undefined){
let data4 = data.table_frames;
if(Array.isArray(data4)){
if(data4.length < 0){
const err18 = {instancePath:instancePath+"/table_frames",schemaPath:"#/properties/table_frames/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate47(data4[i0], {instancePath:instancePath+"/table_frames/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate47.errors : vErrors.concat(validate47.errors);
errors = vErrors.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/table_frames",schemaPath:"#/properties/table_frames/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
let data6 = data.identity_scope;
if(typeof data6 !== "string"){
const err20 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if("observed_metadata_and_loaded_sections_only" !== data6){
const err21 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/const",keyword:"const",params:{allowedValue: "observed_metadata_and_loaded_sections_only"},message:"must be equal to constant"};
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
validate46.errors = vErrors;
return errors === 0;
}
validate46.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate51(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate51.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.offset_bytes === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.length_bytes === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.purpose === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "offset_bytes") || (key0 === "length_bytes")) || (key0 === "purpose"))){
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
if(data.offset_bytes !== undefined){
let data0 = data.offset_bytes;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err4 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 > 9007199254740991 || isNaN(data0)){
const err5 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0 < 0 || isNaN(data0)){
const err6 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.length_bytes !== undefined){
let data1 = data.length_bytes;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err7 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 9007199254740991 || isNaN(data1)){
const err8 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1 < 0 || isNaN(data1)){
const err9 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.purpose !== undefined){
let data2 = data.purpose;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!(((((((((((((((((((((((((data2 === "zip_end") || (data2 === "zip_directory")) || (data2 === "zip_local_header")) || (data2 === "zip_local_name")) || (data2 === "mimetype")) || (data2 === "manifest")) || (data2 === "whole_after_authorization")) || (data2 === "zip_directory_header")) || (data2 === "zip_directory_name")) || (data2 === "section_table_after_authorization")) || (data2 === "section_content_after_authorization")) || (data2 === "resource_after_authorization")) || (data2 === "section_structure_after_authorization")) || (data2 === "zip_locator_local_signature")) || (data2 === "zip_locator_local_header")) || (data2 === "zip_locator_directory_signature")) || (data2 === "zip_locator_directory_header")) || (data2 === "zip_locator_directory_name")) || (data2 === "zip_locator_local_name")) || (data2 === "zip_locator_eocd")) || (data2 === "zip_comment")) || (data2 === "checksum_document_after_authorization")) || (data2 === "checksum_member_after_authorization")) || (data2 === "signature_document_after_authorization")) || (data2 === "signature_member_after_authorization"))){
const err11 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/enum",keyword:"enum",params:{allowedValues: schema51.properties.purpose.enum},message:"must be equal to one of the allowed values"};
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
validate51.errors = vErrors;
return errors === 0;
}
validate51.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate53(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate53.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.purpose === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.ranges === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ranges"},message:"must have required property '"+"ranges"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "purpose") || (key0 === "ranges"))){
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
if(data.purpose !== undefined){
let data0 = data.purpose;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!((data0 === "section_structure_after_authorization") || (data0 === "section_interpretation_after_authorization"))){
const err4 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/enum",keyword:"enum",params:{allowedValues: schema54.properties.purpose.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.ranges !== undefined){
let data1 = data.ranges;
if(Array.isArray(data1)){
if(data1.length > 4096){
const err5 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/maxItems",keyword:"maxItems",params:{limit: 4096},message:"must NOT have more than 4096 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data1.length < 1){
const err6 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.offset_bytes === undefined){
const err7 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data2.length_bytes === undefined){
const err8 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key1 in data2){
if(!((key1 === "offset_bytes") || (key1 === "length_bytes"))){
const err9 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data2.offset_bytes !== undefined){
let data3 = data2.offset_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err10 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
const err11 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err12 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data2.length_bytes !== undefined){
let data4 = data2.length_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err13 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
const err14 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err15 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
}
else {
const err16 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err17 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate53.errors = vErrors;
return errors === 0;
}
validate53.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(!(validate51(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate51.errors : vErrors.concat(validate51.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate53(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
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
}
if(!valid0){
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
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
validate50.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate50.evaluated = {"dynamicProps":true,"dynamicItems":false};


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
if(data.input_kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_kind"},message:"must have required property '"+"input_kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.input_byte_length === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_byte_length"},message:"must have required property '"+"input_byte_length"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.ownership_copy === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ownership_copy"},message:"must have required property '"+"ownership_copy"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.capture === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture"},message:"must have required property '"+"capture"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.access_ranges === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "access_ranges"},message:"must have required property '"+"access_ranges"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.filesystem_reads === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "filesystem_reads"},message:"must have required property '"+"filesystem_reads"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "contract") || (key0 === "input_kind")) || (key0 === "input_byte_length")) || (key0 === "ownership_copy")) || (key0 === "capture")) || (key0 === "access_ranges")) || (key0 === "filesystem_reads"))){
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
if(data.contract !== undefined){
if(!(validate40(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate40.errors : vErrors.concat(validate40.errors);
errors = vErrors.length;
}
}
if(data.input_kind !== undefined){
let data1 = data.input_kind;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/input_kind",schemaPath:"#/properties/input_kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if("owned_uint8array" !== data1){
const err9 = {instancePath:instancePath+"/input_kind",schemaPath:"#/properties/input_kind/const",keyword:"const",params:{allowedValue: "owned_uint8array"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.input_byte_length !== undefined){
let data2 = data.input_byte_length;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err10 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
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
const err11 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.ownership_copy !== undefined){
let data3 = data.ownership_copy;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.offset_bytes === undefined){
const err13 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data3.length_bytes === undefined){
const err14 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 in data3){
if(!((key1 === "offset_bytes") || (key1 === "length_bytes"))){
const err15 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data3.offset_bytes !== undefined){
let data4 = data3.offset_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err16 = {instancePath:instancePath+"/ownership_copy/offset_bytes",schemaPath:"#/properties/ownership_copy/properties/offset_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(0 !== data4){
const err17 = {instancePath:instancePath+"/ownership_copy/offset_bytes",schemaPath:"#/properties/ownership_copy/properties/offset_bytes/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data3.length_bytes !== undefined){
let data5 = data3.length_bytes;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err18 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 9007199254740991 || isNaN(data5)){
const err19 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err20 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
}
else {
const err21 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.capture !== undefined){
let data6 = data.capture;
const _errs17 = errors;
let valid4 = false;
const _errs18 = errors;
if(!(validate46(data6, {instancePath:instancePath+"/capture",parentData:data,parentDataProperty:"capture",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate46.errors : vErrors.concat(validate46.errors);
errors = vErrors.length;
}
var _valid0 = _errs18 === errors;
valid4 = valid4 || _valid0;
const _errs19 = errors;
if(data6 !== null){
const err22 = {instancePath:instancePath+"/capture",schemaPath:"#/properties/capture/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid0 = _errs19 === errors;
valid4 = valid4 || _valid0;
if(!valid4){
const err23 = {instancePath:instancePath+"/capture",schemaPath:"#/properties/capture/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
else {
errors = _errs17;
if(vErrors !== null){
if(_errs17){
vErrors.length = _errs17;
}
else {
vErrors = null;
}
}
}
}
if(data.access_ranges !== undefined){
let data7 = data.access_ranges;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
if(!(validate50(data7[i0], {instancePath:instancePath+"/access_ranges/" + i0,parentData:data7,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate50.errors : vErrors.concat(validate50.errors);
errors = vErrors.length;
}
}
}
else {
const err24 = {instancePath:instancePath+"/access_ranges",schemaPath:"#/properties/access_ranges/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.filesystem_reads !== undefined){
let data9 = data.filesystem_reads;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err25 = {instancePath:instancePath+"/filesystem_reads",schemaPath:"#/properties/filesystem_reads/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(0 !== data9){
const err26 = {instancePath:instancePath+"/filesystem_reads",schemaPath:"#/properties/filesystem_reads/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
validate44.errors = vErrors;
return errors === 0;
}
validate44.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema86 = {"type":"object","properties":{"asset_id":{"$ref":"#/$defs/Identifier"},"asset_version":{"$ref":"#/$defs/VersionLabel"},"judgment_version":{"$ref":"#/$defs/VersionLabel"}},"required":["asset_id","asset_version","judgment_version"],"additionalProperties":false};

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
if(func1(data0) > 256){
const err4 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func1(data0) < 1){
const err5 = {instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern6.test(data0)){
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
if(func1(data1) > 256){
const err8 = {instancePath:instancePath+"/asset_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func1(data1) < 1){
const err9 = {instancePath:instancePath+"/asset_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern6.test(data1)){
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
if(func1(data2) > 256){
const err12 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func1(data2) < 1){
const err13 = {instancePath:instancePath+"/judgment_version",schemaPath:"#/$defs/VersionLabel/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern6.test(data2)){
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

const schema92 = {"oneOf":[{"type":"object","properties":{"operation":{"type":"string","const":"none"}},"required":["operation"],"additionalProperties":false},{"type":"object","properties":{"operation":{"type":"string","const":"verify_complete_original_kdsig_domain"},"signature_member":{"$ref":"#/$defs/SectionSignatureReadMember06"},"covered_members":{"type":"array","items":{"$ref":"#/$defs/SectionSignatureReadMember06"},"minItems":2,"maxItems":128},"excluded_members":{"type":"array","items":{"$ref":"#/$defs/EntryName"},"minItems":0,"maxItems":128},"profile":{"type":"string","const":"kdsig.ed25519"},"profile_version":{"type":"string","const":"0.1.0"}},"required":["operation","signature_member","covered_members","excluded_members","profile","profile_version"],"additionalProperties":false}]};
const schema93 = {"type":"object","properties":{"name":{"$ref":"#/$defs/EntryName"},"bytes":{"type":"integer","minimum":0,"maximum":8388608}},"required":["name","bytes"],"additionalProperties":false};

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
if(data.bytes === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "bytes"},message:"must have required property '"+"bytes"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "name") || (key0 === "bytes"))){
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
if(func1(data0) > 4096){
const err3 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(func1(data0) < 1){
const err4 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern10.test(data0)){
const err5 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
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
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.bytes !== undefined){
let data1 = data.bytes;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err7 = {instancePath:instancePath+"/bytes",schemaPath:"#/properties/bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 8388608 || isNaN(data1)){
const err8 = {instancePath:instancePath+"/bytes",schemaPath:"#/properties/bytes/maximum",keyword:"maximum",params:{comparison: "<=", limit: 8388608},message:"must be <= 8388608"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1 < 0 || isNaN(data1)){
const err9 = {instancePath:instancePath+"/bytes",schemaPath:"#/properties/bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
validate60.errors = vErrors;
return errors === 0;
}
validate60.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate59(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate59.evaluated;
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
if(data.operation === undefined){
const err0 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "operation"},message:"must have required property '"+"operation"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "operation")){
const err1 = {instancePath,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.operation !== undefined){
let data0 = data.operation;
if(typeof data0 !== "string"){
const err2 = {instancePath:instancePath+"/operation",schemaPath:"#/oneOf/0/properties/operation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if("none" !== data0){
const err3 = {instancePath:instancePath+"/operation",schemaPath:"#/oneOf/0/properties/operation/const",keyword:"const",params:{allowedValue: "none"},message:"must be equal to constant"};
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
const err4 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const _errs6 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.operation === undefined){
const err5 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "operation"},message:"must have required property '"+"operation"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.signature_member === undefined){
const err6 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "signature_member"},message:"must have required property '"+"signature_member"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.covered_members === undefined){
const err7 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "covered_members"},message:"must have required property '"+"covered_members"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.excluded_members === undefined){
const err8 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "excluded_members"},message:"must have required property '"+"excluded_members"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.profile === undefined){
const err9 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "profile"},message:"must have required property '"+"profile"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.profile_version === undefined){
const err10 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "profile_version"},message:"must have required property '"+"profile_version"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key1 in data){
if(!((((((key1 === "operation") || (key1 === "signature_member")) || (key1 === "covered_members")) || (key1 === "excluded_members")) || (key1 === "profile")) || (key1 === "profile_version"))){
const err11 = {instancePath,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.operation !== undefined){
let data1 = data.operation;
if(typeof data1 !== "string"){
const err12 = {instancePath:instancePath+"/operation",schemaPath:"#/oneOf/1/properties/operation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if("verify_complete_original_kdsig_domain" !== data1){
const err13 = {instancePath:instancePath+"/operation",schemaPath:"#/oneOf/1/properties/operation/const",keyword:"const",params:{allowedValue: "verify_complete_original_kdsig_domain"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.signature_member !== undefined){
if(!(validate60(data.signature_member, {instancePath:instancePath+"/signature_member",parentData:data,parentDataProperty:"signature_member",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate60.errors : vErrors.concat(validate60.errors);
errors = vErrors.length;
}
}
if(data.covered_members !== undefined){
let data3 = data.covered_members;
if(Array.isArray(data3)){
if(data3.length > 128){
const err14 = {instancePath:instancePath+"/covered_members",schemaPath:"#/oneOf/1/properties/covered_members/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data3.length < 2){
const err15 = {instancePath:instancePath+"/covered_members",schemaPath:"#/oneOf/1/properties/covered_members/minItems",keyword:"minItems",params:{limit: 2},message:"must NOT have fewer than 2 items"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
if(!(validate60(data3[i0], {instancePath:instancePath+"/covered_members/" + i0,parentData:data3,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate60.errors : vErrors.concat(validate60.errors);
errors = vErrors.length;
}
}
}
else {
const err16 = {instancePath:instancePath+"/covered_members",schemaPath:"#/oneOf/1/properties/covered_members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.excluded_members !== undefined){
let data5 = data.excluded_members;
if(Array.isArray(data5)){
if(data5.length > 128){
const err17 = {instancePath:instancePath+"/excluded_members",schemaPath:"#/oneOf/1/properties/excluded_members/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data5.length < 0){
const err18 = {instancePath:instancePath+"/excluded_members",schemaPath:"#/oneOf/1/properties/excluded_members/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
const len1 = data5.length;
for(let i1=0; i1<len1; i1++){
let data6 = data5[i1];
if(typeof data6 === "string"){
if(func1(data6) > 4096){
const err19 = {instancePath:instancePath+"/excluded_members/" + i1,schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(func1(data6) < 1){
const err20 = {instancePath:instancePath+"/excluded_members/" + i1,schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!pattern10.test(data6)){
const err21 = {instancePath:instancePath+"/excluded_members/" + i1,schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
else {
const err22 = {instancePath:instancePath+"/excluded_members/" + i1,schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err23 = {instancePath:instancePath+"/excluded_members",schemaPath:"#/oneOf/1/properties/excluded_members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.profile !== undefined){
let data7 = data.profile;
if(typeof data7 !== "string"){
const err24 = {instancePath:instancePath+"/profile",schemaPath:"#/oneOf/1/properties/profile/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if("kdsig.ed25519" !== data7){
const err25 = {instancePath:instancePath+"/profile",schemaPath:"#/oneOf/1/properties/profile/const",keyword:"const",params:{allowedValue: "kdsig.ed25519"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.profile_version !== undefined){
let data8 = data.profile_version;
if(typeof data8 !== "string"){
const err26 = {instancePath:instancePath+"/profile_version",schemaPath:"#/oneOf/1/properties/profile_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if("0.1.0" !== data8){
const err27 = {instancePath:instancePath+"/profile_version",schemaPath:"#/oneOf/1/properties/profile_version/const",keyword:"const",params:{allowedValue: "0.1.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
else {
const err28 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
var _valid0 = _errs6 === errors;
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
const err29 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
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
validate59.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate59.evaluated = {"dynamicProps":true,"dynamicItems":false};

const pattern24 = new RegExp("^[0-9a-f]{64}$", "u");

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
if(data.operation === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation"},message:"must have required property '"+"operation"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.request === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request"},message:"must have required property '"+"request"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.request_digest === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_digest"},message:"must have required property '"+"request_digest"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.input_observation === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_observation"},message:"must have required property '"+"input_observation"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.manifest_identity === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_identity"},message:"must have required property '"+"manifest_identity"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.signature_policy === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "signature_policy"},message:"must have required property '"+"signature_policy"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.signature_policy_digest === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "signature_policy_digest"},message:"must have required property '"+"signature_policy_digest"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.signature_read_intent === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "signature_read_intent"},message:"must have required property '"+"signature_read_intent"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.signature_read_intent_digest === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "signature_read_intent_digest"},message:"must have required property '"+"signature_read_intent_digest"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func7.call(schema58.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.contract !== undefined){
if(!(validate40(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate40.errors : vErrors.concat(validate40.errors);
errors = vErrors.length;
}
}
if(data.operation !== undefined){
let data1 = data.operation;
if(typeof data1 !== "string"){
const err11 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if("admit_owned_whole" !== data1){
const err12 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/const",keyword:"const",params:{allowedValue: "admit_owned_whole"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.request !== undefined){
if(!(validate42(data.request, {instancePath:instancePath+"/request",parentData:data,parentDataProperty:"request",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate42.errors : vErrors.concat(validate42.errors);
errors = vErrors.length;
}
}
if(data.request_digest !== undefined){
let data3 = data.request_digest;
if(typeof data3 === "string"){
if(!pattern4.test(data3)){
const err13 = {instancePath:instancePath+"/request_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/request_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.input_observation !== undefined){
if(!(validate44(data.input_observation, {instancePath:instancePath+"/input_observation",parentData:data,parentDataProperty:"input_observation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate44.errors : vErrors.concat(validate44.errors);
errors = vErrors.length;
}
}
if(data.manifest_identity !== undefined){
if(!(validate57(data.manifest_identity, {instancePath:instancePath+"/manifest_identity",parentData:data,parentDataProperty:"manifest_identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
errors = vErrors.length;
}
}
if(data.signature_policy !== undefined){
let data6 = data.signature_policy;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.requireSignature === undefined){
const err15 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/$defs/SectionSignaturePolicy06/required",keyword:"required",params:{missingProperty: "requireSignature"},message:"must have required property '"+"requireSignature"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data6.expectedPublicKeyHex === undefined){
const err16 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/$defs/SectionSignaturePolicy06/required",keyword:"required",params:{missingProperty: "expectedPublicKeyHex"},message:"must have required property '"+"expectedPublicKeyHex"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
for(const key1 in data6){
if(!((key1 === "requireSignature") || (key1 === "expectedPublicKeyHex"))){
const err17 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/$defs/SectionSignaturePolicy06/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data6.requireSignature !== undefined){
if(typeof data6.requireSignature !== "boolean"){
const err18 = {instancePath:instancePath+"/signature_policy/requireSignature",schemaPath:"#/$defs/SectionSignaturePolicy06/properties/requireSignature/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data6.expectedPublicKeyHex !== undefined){
let data8 = data6.expectedPublicKeyHex;
const _errs18 = errors;
let valid4 = false;
const _errs19 = errors;
if(typeof data8 === "string"){
if(func1(data8) > 64){
const err19 = {instancePath:instancePath+"/signature_policy/expectedPublicKeyHex",schemaPath:"#/$defs/SectionSignaturePolicy06/properties/expectedPublicKeyHex/anyOf/0/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(func1(data8) < 64){
const err20 = {instancePath:instancePath+"/signature_policy/expectedPublicKeyHex",schemaPath:"#/$defs/SectionSignaturePolicy06/properties/expectedPublicKeyHex/anyOf/0/minLength",keyword:"minLength",params:{limit: 64},message:"must NOT have fewer than 64 characters"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!pattern24.test(data8)){
const err21 = {instancePath:instancePath+"/signature_policy/expectedPublicKeyHex",schemaPath:"#/$defs/SectionSignaturePolicy06/properties/expectedPublicKeyHex/anyOf/0/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
else {
const err22 = {instancePath:instancePath+"/signature_policy/expectedPublicKeyHex",schemaPath:"#/$defs/SectionSignaturePolicy06/properties/expectedPublicKeyHex/anyOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid0 = _errs19 === errors;
valid4 = valid4 || _valid0;
const _errs21 = errors;
if(data8 !== null){
const err23 = {instancePath:instancePath+"/signature_policy/expectedPublicKeyHex",schemaPath:"#/$defs/SectionSignaturePolicy06/properties/expectedPublicKeyHex/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
var _valid0 = _errs21 === errors;
valid4 = valid4 || _valid0;
if(!valid4){
const err24 = {instancePath:instancePath+"/signature_policy/expectedPublicKeyHex",schemaPath:"#/$defs/SectionSignaturePolicy06/properties/expectedPublicKeyHex/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
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
const err25 = {instancePath:instancePath+"/signature_policy",schemaPath:"#/$defs/SectionSignaturePolicy06/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.signature_policy_digest !== undefined){
let data9 = data.signature_policy_digest;
if(typeof data9 === "string"){
if(!pattern4.test(data9)){
const err26 = {instancePath:instancePath+"/signature_policy_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
else {
const err27 = {instancePath:instancePath+"/signature_policy_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.signature_read_intent !== undefined){
if(!(validate59(data.signature_read_intent, {instancePath:instancePath+"/signature_read_intent",parentData:data,parentDataProperty:"signature_read_intent",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
errors = vErrors.length;
}
}
if(data.signature_read_intent_digest !== undefined){
let data11 = data.signature_read_intent_digest;
if(typeof data11 === "string"){
if(!pattern4.test(data11)){
const err28 = {instancePath:instancePath+"/signature_read_intent_digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
else {
const err29 = {instancePath:instancePath+"/signature_read_intent_digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
}
else {
const err30 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
validate39.errors = vErrors;
return errors === 0;
}
validate39.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate38(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:sectionbytes06:NativeSectionByteAuthorityContext06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate38.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate39(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
errors = vErrors.length;
}
validate38.errors = vErrors;
return errors === 0;
}
validate38.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.NativeSectionByteReadAuthority06 = validate65;
const schema97 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:sectionbytes06:NativeSectionByteReadAuthority06","title":"NativeSectionByteReadAuthority06","description":"Native owned-byte admission structural data only; opaque requests and byte-read authority require actual native brands.","$ref":"#/$defs/NativeSectionByteReadAuthority06","$defs":{"NativeSectionByteReadAuthority06":false}};
const schema98 = false;

function validate65(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:sectionbytes06:NativeSectionByteReadAuthority06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate65.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const err0 = {instancePath,schemaPath:"#/$defs/NativeSectionByteReadAuthority06/false schema",keyword:"false schema",params:{},message:"boolean schema is false"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
validate65.errors = vErrors;
return errors === 0;
}
validate65.evaluated = {"dynamicProps":false,"dynamicItems":false};

exports.NativeSectionByteAccepted06 = validate66;
const schema99 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:sectionbytes06:NativeSectionByteAccepted06","title":"NativeSectionByteAccepted06","description":"Native owned-byte admission structural data only; opaque requests and byte-read authority require actual native brands.","$ref":"#/$defs/NativeSectionByteAccepted06","$defs":{"CapturedInput06":{"type":"object","properties":{"capture_id":{"$ref":"#/$defs/Identifier"},"input_byte_length":{"$ref":"#/$defs/UInt"},"manifest_bytes_digest":{"$ref":"#/$defs/Digest"},"zip_directory_bytes_digest":{"$ref":"#/$defs/Digest"},"table_frames":{"type":"array","items":{"$ref":"#/$defs/CheckedSection06"},"minItems":0},"identity_scope":{"type":"string","const":"observed_metadata_and_loaded_sections_only"}},"required":["capture_id","input_byte_length","manifest_bytes_digest","zip_directory_bytes_digest","table_frames","identity_scope"],"additionalProperties":false},"CheckedSection06":{"type":"object","properties":{"section_id":{"$ref":"#/$defs/Identifier"},"member":{"$ref":"#/$defs/EntryName"},"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"type":"integer","minimum":1},"digest":{"$ref":"#/$defs/Digest"}},"required":["section_id","member","offset_bytes","length_bytes","digest"],"additionalProperties":false},"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"NativeSectionByteAccepted06":{"type":"object","properties":{"status":{"type":"string","const":"accepted"},"snapshot":{"$ref":"#/$defs/WholeSectionSnapshot06"},"input_observation":{"$ref":"#/$defs/NativeSectionByteObservation06"}},"required":["status","snapshot","input_observation"],"additionalProperties":false},"NativeSectionByteContract06":{"type":"object","properties":{"id":{"const":"kdna.section-bytes-node","type":"string"},"version":{"const":"0.1.1-candidate","type":"string"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false},"NativeSectionByteObservation06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"input_kind":{"type":"string","const":"owned_uint8array"},"input_byte_length":{"$ref":"#/$defs/UInt"},"ownership_copy":{"type":"object","properties":{"offset_bytes":{"type":"integer","const":0},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false},"capture":{"anyOf":[{"$ref":"#/$defs/CapturedInput06"},{"type":"null"}]},"access_ranges":{"type":"array","items":{"$ref":"#/$defs/SectionIORange06"}},"filesystem_reads":{"type":"integer","const":0}},"required":["contract","input_kind","input_byte_length","ownership_copy","capture","access_ranges","filesystem_reads"],"additionalProperties":false},"SectionIORange06":{"oneOf":[{"$ref":"#/$defs/SectionIOSingleRange06"},{"$ref":"#/$defs/SectionIOStructureBatch06"}]},"SectionIOSingleRange06":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"},"purpose":{"type":"string","enum":["zip_end","zip_directory","zip_local_header","zip_local_name","mimetype","manifest","whole_after_authorization","zip_directory_header","zip_directory_name","section_table_after_authorization","section_content_after_authorization","resource_after_authorization","section_structure_after_authorization","zip_locator_local_signature","zip_locator_local_header","zip_locator_directory_signature","zip_locator_directory_header","zip_locator_directory_name","zip_locator_local_name","zip_locator_eocd","zip_comment","checksum_document_after_authorization","checksum_member_after_authorization","signature_document_after_authorization","signature_member_after_authorization"]}},"required":["offset_bytes","length_bytes","purpose"],"additionalProperties":false},"SectionIOStructureBatch06":{"type":"object","properties":{"purpose":{"type":"string","enum":["section_structure_after_authorization","section_interpretation_after_authorization"]},"ranges":{"type":"array","minItems":1,"maxItems":4096,"items":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false}}},"required":["purpose","ranges"],"additionalProperties":false},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991},"WholeSectionSnapshot06":false}};
const schema100 = {"type":"object","properties":{"status":{"type":"string","const":"accepted"},"snapshot":{"$ref":"#/$defs/WholeSectionSnapshot06"},"input_observation":{"$ref":"#/$defs/NativeSectionByteObservation06"}},"required":["status","snapshot","input_observation"],"additionalProperties":false};

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
if("kdna.section-bytes-node" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.section-bytes-node"},message:"must be equal to constant"};
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
if("0.1.1-candidate" !== data1){
const err7 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/const",keyword:"const",params:{allowedValue: "0.1.1-candidate"},message:"must be equal to constant"};
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
validate69.errors = vErrors;
return errors === 0;
}
validate69.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.section_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "section_id"},message:"must have required property '"+"section_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.member === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member"},message:"must have required property '"+"member"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.offset_bytes === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.length_bytes === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.digest === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "digest"},message:"must have required property '"+"digest"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "section_id") || (key0 === "member")) || (key0 === "offset_bytes")) || (key0 === "length_bytes")) || (key0 === "digest"))){
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
if(data.section_id !== undefined){
let data0 = data.section_id;
if(typeof data0 === "string"){
if(func1(data0) > 256){
const err6 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data0) < 1){
const err7 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern6.test(data0)){
const err8 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err9 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.member !== undefined){
let data1 = data.member;
if(typeof data1 === "string"){
if(func1(data1) > 4096){
const err10 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func1(data1) < 1){
const err11 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!pattern10.test(data1)){
const err12 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
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
const err13 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.offset_bytes !== undefined){
let data2 = data.offset_bytes;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err14 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err15 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err16 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.length_bytes !== undefined){
let data3 = data.length_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err17 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/properties/length_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 < 1 || isNaN(data3)){
const err18 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/properties/length_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.digest !== undefined){
let data4 = data.digest;
if(typeof data4 === "string"){
if(!pattern4.test(data4)){
const err19 = {instancePath:instancePath+"/digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err20 = {instancePath:instancePath+"/digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
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
validate72.errors = vErrors;
return errors === 0;
}
validate72.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.table_frames === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "table_frames"},message:"must have required property '"+"table_frames"+"'"};
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
if(!((((((key0 === "capture_id") || (key0 === "input_byte_length")) || (key0 === "manifest_bytes_digest")) || (key0 === "zip_directory_bytes_digest")) || (key0 === "table_frames")) || (key0 === "identity_scope"))){
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
if(!pattern6.test(data0)){
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
if(data.table_frames !== undefined){
let data4 = data.table_frames;
if(Array.isArray(data4)){
if(data4.length < 0){
const err18 = {instancePath:instancePath+"/table_frames",schemaPath:"#/properties/table_frames/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate72(data4[i0], {instancePath:instancePath+"/table_frames/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate72.errors : vErrors.concat(validate72.errors);
errors = vErrors.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/table_frames",schemaPath:"#/properties/table_frames/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
let data6 = data.identity_scope;
if(typeof data6 !== "string"){
const err20 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if("observed_metadata_and_loaded_sections_only" !== data6){
const err21 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/const",keyword:"const",params:{allowedValue: "observed_metadata_and_loaded_sections_only"},message:"must be equal to constant"};
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
validate71.errors = vErrors;
return errors === 0;
}
validate71.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.offset_bytes === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.length_bytes === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.purpose === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "offset_bytes") || (key0 === "length_bytes")) || (key0 === "purpose"))){
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
if(data.offset_bytes !== undefined){
let data0 = data.offset_bytes;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err4 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 > 9007199254740991 || isNaN(data0)){
const err5 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0 < 0 || isNaN(data0)){
const err6 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.length_bytes !== undefined){
let data1 = data.length_bytes;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err7 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 9007199254740991 || isNaN(data1)){
const err8 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1 < 0 || isNaN(data1)){
const err9 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.purpose !== undefined){
let data2 = data.purpose;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!(((((((((((((((((((((((((data2 === "zip_end") || (data2 === "zip_directory")) || (data2 === "zip_local_header")) || (data2 === "zip_local_name")) || (data2 === "mimetype")) || (data2 === "manifest")) || (data2 === "whole_after_authorization")) || (data2 === "zip_directory_header")) || (data2 === "zip_directory_name")) || (data2 === "section_table_after_authorization")) || (data2 === "section_content_after_authorization")) || (data2 === "resource_after_authorization")) || (data2 === "section_structure_after_authorization")) || (data2 === "zip_locator_local_signature")) || (data2 === "zip_locator_local_header")) || (data2 === "zip_locator_directory_signature")) || (data2 === "zip_locator_directory_header")) || (data2 === "zip_locator_directory_name")) || (data2 === "zip_locator_local_name")) || (data2 === "zip_locator_eocd")) || (data2 === "zip_comment")) || (data2 === "checksum_document_after_authorization")) || (data2 === "checksum_member_after_authorization")) || (data2 === "signature_document_after_authorization")) || (data2 === "signature_member_after_authorization"))){
const err11 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/enum",keyword:"enum",params:{allowedValues: schema51.properties.purpose.enum},message:"must be equal to one of the allowed values"};
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
validate76.errors = vErrors;
return errors === 0;
}
validate76.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.purpose === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.ranges === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ranges"},message:"must have required property '"+"ranges"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "purpose") || (key0 === "ranges"))){
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
if(data.purpose !== undefined){
let data0 = data.purpose;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!((data0 === "section_structure_after_authorization") || (data0 === "section_interpretation_after_authorization"))){
const err4 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/enum",keyword:"enum",params:{allowedValues: schema54.properties.purpose.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.ranges !== undefined){
let data1 = data.ranges;
if(Array.isArray(data1)){
if(data1.length > 4096){
const err5 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/maxItems",keyword:"maxItems",params:{limit: 4096},message:"must NOT have more than 4096 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data1.length < 1){
const err6 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.offset_bytes === undefined){
const err7 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data2.length_bytes === undefined){
const err8 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key1 in data2){
if(!((key1 === "offset_bytes") || (key1 === "length_bytes"))){
const err9 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data2.offset_bytes !== undefined){
let data3 = data2.offset_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err10 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
const err11 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err12 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data2.length_bytes !== undefined){
let data4 = data2.length_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err13 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
const err14 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err15 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
}
else {
const err16 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err17 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate78.errors = vErrors;
return errors === 0;
}
validate78.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(!(validate76(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate76.errors : vErrors.concat(validate76.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate78(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
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
}
if(!valid0){
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
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
validate75.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate75.evaluated = {"dynamicProps":true,"dynamicItems":false};


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
if(data.input_kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_kind"},message:"must have required property '"+"input_kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.input_byte_length === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_byte_length"},message:"must have required property '"+"input_byte_length"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.ownership_copy === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ownership_copy"},message:"must have required property '"+"ownership_copy"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.capture === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture"},message:"must have required property '"+"capture"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.access_ranges === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "access_ranges"},message:"must have required property '"+"access_ranges"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.filesystem_reads === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "filesystem_reads"},message:"must have required property '"+"filesystem_reads"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "contract") || (key0 === "input_kind")) || (key0 === "input_byte_length")) || (key0 === "ownership_copy")) || (key0 === "capture")) || (key0 === "access_ranges")) || (key0 === "filesystem_reads"))){
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
if(data.contract !== undefined){
if(!(validate69(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate69.errors : vErrors.concat(validate69.errors);
errors = vErrors.length;
}
}
if(data.input_kind !== undefined){
let data1 = data.input_kind;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/input_kind",schemaPath:"#/properties/input_kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if("owned_uint8array" !== data1){
const err9 = {instancePath:instancePath+"/input_kind",schemaPath:"#/properties/input_kind/const",keyword:"const",params:{allowedValue: "owned_uint8array"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.input_byte_length !== undefined){
let data2 = data.input_byte_length;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err10 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
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
const err11 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.ownership_copy !== undefined){
let data3 = data.ownership_copy;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.offset_bytes === undefined){
const err13 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data3.length_bytes === undefined){
const err14 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 in data3){
if(!((key1 === "offset_bytes") || (key1 === "length_bytes"))){
const err15 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data3.offset_bytes !== undefined){
let data4 = data3.offset_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err16 = {instancePath:instancePath+"/ownership_copy/offset_bytes",schemaPath:"#/properties/ownership_copy/properties/offset_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(0 !== data4){
const err17 = {instancePath:instancePath+"/ownership_copy/offset_bytes",schemaPath:"#/properties/ownership_copy/properties/offset_bytes/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data3.length_bytes !== undefined){
let data5 = data3.length_bytes;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err18 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 9007199254740991 || isNaN(data5)){
const err19 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err20 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
}
else {
const err21 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.capture !== undefined){
let data6 = data.capture;
const _errs17 = errors;
let valid4 = false;
const _errs18 = errors;
if(!(validate71(data6, {instancePath:instancePath+"/capture",parentData:data,parentDataProperty:"capture",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
errors = vErrors.length;
}
var _valid0 = _errs18 === errors;
valid4 = valid4 || _valid0;
const _errs19 = errors;
if(data6 !== null){
const err22 = {instancePath:instancePath+"/capture",schemaPath:"#/properties/capture/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid0 = _errs19 === errors;
valid4 = valid4 || _valid0;
if(!valid4){
const err23 = {instancePath:instancePath+"/capture",schemaPath:"#/properties/capture/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
else {
errors = _errs17;
if(vErrors !== null){
if(_errs17){
vErrors.length = _errs17;
}
else {
vErrors = null;
}
}
}
}
if(data.access_ranges !== undefined){
let data7 = data.access_ranges;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
if(!(validate75(data7[i0], {instancePath:instancePath+"/access_ranges/" + i0,parentData:data7,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate75.errors : vErrors.concat(validate75.errors);
errors = vErrors.length;
}
}
}
else {
const err24 = {instancePath:instancePath+"/access_ranges",schemaPath:"#/properties/access_ranges/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.filesystem_reads !== undefined){
let data9 = data.filesystem_reads;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err25 = {instancePath:instancePath+"/filesystem_reads",schemaPath:"#/properties/filesystem_reads/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(0 !== data9){
const err26 = {instancePath:instancePath+"/filesystem_reads",schemaPath:"#/properties/filesystem_reads/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
validate68.errors = vErrors;
return errors === 0;
}
validate68.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.snapshot === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.input_observation === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_observation"},message:"must have required property '"+"input_observation"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "status") || (key0 === "snapshot")) || (key0 === "input_observation"))){
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
if(data.status !== undefined){
let data0 = data.status;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("accepted" !== data0){
const err5 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "accepted"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.snapshot !== undefined){
const err6 = {instancePath:instancePath+"/snapshot",schemaPath:"#/$defs/WholeSectionSnapshot06/false schema",keyword:"false schema",params:{},message:"boolean schema is false"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.input_observation !== undefined){
if(!(validate68(data.input_observation, {instancePath:instancePath+"/input_observation",parentData:data,parentDataProperty:"input_observation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate68.errors : vErrors.concat(validate68.errors);
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
validate67.errors = vErrors;
return errors === 0;
}
validate67.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate66(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:sectionbytes06:NativeSectionByteAccepted06" */;
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

exports.NativeSectionByteRejected06 = validate83;
const schema124 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:sectionbytes06:NativeSectionByteRejected06","title":"NativeSectionByteRejected06","description":"Native owned-byte admission structural data only; opaque requests and byte-read authority require actual native brands.","$ref":"#/$defs/NativeSectionByteRejected06","$defs":{"CapturedInput06":{"type":"object","properties":{"capture_id":{"$ref":"#/$defs/Identifier"},"input_byte_length":{"$ref":"#/$defs/UInt"},"manifest_bytes_digest":{"$ref":"#/$defs/Digest"},"zip_directory_bytes_digest":{"$ref":"#/$defs/Digest"},"table_frames":{"type":"array","items":{"$ref":"#/$defs/CheckedSection06"},"minItems":0},"identity_scope":{"type":"string","const":"observed_metadata_and_loaded_sections_only"}},"required":["capture_id","input_byte_length","manifest_bytes_digest","zip_directory_bytes_digest","table_frames","identity_scope"],"additionalProperties":false},"CheckedSection06":{"type":"object","properties":{"section_id":{"$ref":"#/$defs/Identifier"},"member":{"$ref":"#/$defs/EntryName"},"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"type":"integer","minimum":1},"digest":{"$ref":"#/$defs/Digest"}},"required":["section_id","member","offset_bytes","length_bytes","digest"],"additionalProperties":false},"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"NativeSectionByteContract06":{"type":"object","properties":{"id":{"const":"kdna.section-bytes-node","type":"string"},"version":{"const":"0.1.1-candidate","type":"string"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false},"NativeSectionByteObservation06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"input_kind":{"type":"string","const":"owned_uint8array"},"input_byte_length":{"$ref":"#/$defs/UInt"},"ownership_copy":{"type":"object","properties":{"offset_bytes":{"type":"integer","const":0},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false},"capture":{"anyOf":[{"$ref":"#/$defs/CapturedInput06"},{"type":"null"}]},"access_ranges":{"type":"array","items":{"$ref":"#/$defs/SectionIORange06"}},"filesystem_reads":{"type":"integer","const":0}},"required":["contract","input_kind","input_byte_length","ownership_copy","capture","access_ranges","filesystem_reads"],"additionalProperties":false},"NativeSectionByteRejected06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"status":{"type":"string","enum":["rejected","unsupported"]},"request_id":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null"}]},"stage":{"type":"string","enum":["input","metadata","authorization","content","semantic","integrity"]},"reason":{"$ref":"#/$defs/NonEmptyText"},"diagnostic":{"anyOf":[{"$ref":"#/$defs/SectionFailureDiagnostic06"},{"type":"null"}]},"input_observation":{"anyOf":[{"$ref":"#/$defs/NativeSectionByteObservation06"},{"type":"null"}]},"snapshot":{"type":"null"}},"required":["contract","status","request_id","stage","reason","diagnostic","input_observation","snapshot"],"additionalProperties":false},"NonEmptyText":{"type":"string","minLength":1,"pattern":"\\S"},"SectionFailureDiagnostic06":{"type":"object","properties":{"field":{"anyOf":[{"$ref":"#/$defs/Text"},{"type":"null"}]},"subject":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null"}]}},"required":["field","subject"],"additionalProperties":false},"SectionIORange06":{"oneOf":[{"$ref":"#/$defs/SectionIOSingleRange06"},{"$ref":"#/$defs/SectionIOStructureBatch06"}]},"SectionIOSingleRange06":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"},"purpose":{"type":"string","enum":["zip_end","zip_directory","zip_local_header","zip_local_name","mimetype","manifest","whole_after_authorization","zip_directory_header","zip_directory_name","section_table_after_authorization","section_content_after_authorization","resource_after_authorization","section_structure_after_authorization","zip_locator_local_signature","zip_locator_local_header","zip_locator_directory_signature","zip_locator_directory_header","zip_locator_directory_name","zip_locator_local_name","zip_locator_eocd","zip_comment","checksum_document_after_authorization","checksum_member_after_authorization","signature_document_after_authorization","signature_member_after_authorization"]}},"required":["offset_bytes","length_bytes","purpose"],"additionalProperties":false},"SectionIOStructureBatch06":{"type":"object","properties":{"purpose":{"type":"string","enum":["section_structure_after_authorization","section_interpretation_after_authorization"]},"ranges":{"type":"array","minItems":1,"maxItems":4096,"items":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false}}},"required":["purpose","ranges"],"additionalProperties":false},"Text":{"type":"string"},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991}}};
const schema125 = {"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"status":{"type":"string","enum":["rejected","unsupported"]},"request_id":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null"}]},"stage":{"type":"string","enum":["input","metadata","authorization","content","semantic","integrity"]},"reason":{"$ref":"#/$defs/NonEmptyText"},"diagnostic":{"anyOf":[{"$ref":"#/$defs/SectionFailureDiagnostic06"},{"type":"null"}]},"input_observation":{"anyOf":[{"$ref":"#/$defs/NativeSectionByteObservation06"},{"type":"null"}]},"snapshot":{"type":"null"}},"required":["contract","status","request_id","stage","reason","diagnostic","input_observation","snapshot"],"additionalProperties":false};
const schema129 = {"type":"string","minLength":1,"pattern":"\\S"};

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
if("kdna.section-bytes-node" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.section-bytes-node"},message:"must be equal to constant"};
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
if("0.1.1-candidate" !== data1){
const err7 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/const",keyword:"const",params:{allowedValue: "0.1.1-candidate"},message:"must be equal to constant"};
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
validate85.errors = vErrors;
return errors === 0;
}
validate85.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema130 = {"type":"object","properties":{"field":{"anyOf":[{"$ref":"#/$defs/Text"},{"type":"null"}]},"subject":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null"}]}},"required":["field","subject"],"additionalProperties":false};
const schema131 = {"type":"string"};

function validate87(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate87.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.field === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "field"},message:"must have required property '"+"field"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.subject === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "subject"},message:"must have required property '"+"subject"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "field") || (key0 === "subject"))){
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
if(data.field !== undefined){
let data0 = data.field;
const _errs3 = errors;
let valid1 = false;
const _errs4 = errors;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/field",schemaPath:"#/$defs/Text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
var _valid0 = _errs4 === errors;
valid1 = valid1 || _valid0;
const _errs7 = errors;
if(data0 !== null){
const err4 = {instancePath:instancePath+"/field",schemaPath:"#/properties/field/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err5 = {instancePath:instancePath+"/field",schemaPath:"#/properties/field/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
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
if(data.subject !== undefined){
let data1 = data.subject;
const _errs10 = errors;
let valid3 = false;
const _errs11 = errors;
if(typeof data1 === "string"){
if(func1(data1) > 256){
const err6 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data1) < 1){
const err7 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern6.test(data1)){
const err8 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err9 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid1 = _errs11 === errors;
valid3 = valid3 || _valid1;
const _errs14 = errors;
if(data1 !== null){
const err10 = {instancePath:instancePath+"/subject",schemaPath:"#/properties/subject/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid1 = _errs14 === errors;
valid3 = valid3 || _valid1;
if(!valid3){
const err11 = {instancePath:instancePath+"/subject",schemaPath:"#/properties/subject/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
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
validate87.errors = vErrors;
return errors === 0;
}
validate87.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.section_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "section_id"},message:"must have required property '"+"section_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.member === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member"},message:"must have required property '"+"member"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.offset_bytes === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.length_bytes === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.digest === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "digest"},message:"must have required property '"+"digest"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "section_id") || (key0 === "member")) || (key0 === "offset_bytes")) || (key0 === "length_bytes")) || (key0 === "digest"))){
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
if(data.section_id !== undefined){
let data0 = data.section_id;
if(typeof data0 === "string"){
if(func1(data0) > 256){
const err6 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data0) < 1){
const err7 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern6.test(data0)){
const err8 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err9 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.member !== undefined){
let data1 = data.member;
if(typeof data1 === "string"){
if(func1(data1) > 4096){
const err10 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func1(data1) < 1){
const err11 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!pattern10.test(data1)){
const err12 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
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
const err13 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.offset_bytes !== undefined){
let data2 = data.offset_bytes;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err14 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err15 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err16 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.length_bytes !== undefined){
let data3 = data.length_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err17 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/properties/length_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 < 1 || isNaN(data3)){
const err18 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/properties/length_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.digest !== undefined){
let data4 = data.digest;
if(typeof data4 === "string"){
if(!pattern4.test(data4)){
const err19 = {instancePath:instancePath+"/digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err20 = {instancePath:instancePath+"/digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
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
validate92.errors = vErrors;
return errors === 0;
}
validate92.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.table_frames === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "table_frames"},message:"must have required property '"+"table_frames"+"'"};
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
if(!((((((key0 === "capture_id") || (key0 === "input_byte_length")) || (key0 === "manifest_bytes_digest")) || (key0 === "zip_directory_bytes_digest")) || (key0 === "table_frames")) || (key0 === "identity_scope"))){
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
if(!pattern6.test(data0)){
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
if(data.table_frames !== undefined){
let data4 = data.table_frames;
if(Array.isArray(data4)){
if(data4.length < 0){
const err18 = {instancePath:instancePath+"/table_frames",schemaPath:"#/properties/table_frames/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate92(data4[i0], {instancePath:instancePath+"/table_frames/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate92.errors : vErrors.concat(validate92.errors);
errors = vErrors.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/table_frames",schemaPath:"#/properties/table_frames/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
let data6 = data.identity_scope;
if(typeof data6 !== "string"){
const err20 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if("observed_metadata_and_loaded_sections_only" !== data6){
const err21 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/const",keyword:"const",params:{allowedValue: "observed_metadata_and_loaded_sections_only"},message:"must be equal to constant"};
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
validate91.errors = vErrors;
return errors === 0;
}
validate91.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.offset_bytes === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.length_bytes === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.purpose === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "offset_bytes") || (key0 === "length_bytes")) || (key0 === "purpose"))){
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
if(data.offset_bytes !== undefined){
let data0 = data.offset_bytes;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err4 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 > 9007199254740991 || isNaN(data0)){
const err5 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0 < 0 || isNaN(data0)){
const err6 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.length_bytes !== undefined){
let data1 = data.length_bytes;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err7 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 9007199254740991 || isNaN(data1)){
const err8 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1 < 0 || isNaN(data1)){
const err9 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.purpose !== undefined){
let data2 = data.purpose;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!(((((((((((((((((((((((((data2 === "zip_end") || (data2 === "zip_directory")) || (data2 === "zip_local_header")) || (data2 === "zip_local_name")) || (data2 === "mimetype")) || (data2 === "manifest")) || (data2 === "whole_after_authorization")) || (data2 === "zip_directory_header")) || (data2 === "zip_directory_name")) || (data2 === "section_table_after_authorization")) || (data2 === "section_content_after_authorization")) || (data2 === "resource_after_authorization")) || (data2 === "section_structure_after_authorization")) || (data2 === "zip_locator_local_signature")) || (data2 === "zip_locator_local_header")) || (data2 === "zip_locator_directory_signature")) || (data2 === "zip_locator_directory_header")) || (data2 === "zip_locator_directory_name")) || (data2 === "zip_locator_local_name")) || (data2 === "zip_locator_eocd")) || (data2 === "zip_comment")) || (data2 === "checksum_document_after_authorization")) || (data2 === "checksum_member_after_authorization")) || (data2 === "signature_document_after_authorization")) || (data2 === "signature_member_after_authorization"))){
const err11 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/enum",keyword:"enum",params:{allowedValues: schema51.properties.purpose.enum},message:"must be equal to one of the allowed values"};
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
if(data.purpose === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.ranges === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ranges"},message:"must have required property '"+"ranges"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "purpose") || (key0 === "ranges"))){
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
if(data.purpose !== undefined){
let data0 = data.purpose;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!((data0 === "section_structure_after_authorization") || (data0 === "section_interpretation_after_authorization"))){
const err4 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/enum",keyword:"enum",params:{allowedValues: schema54.properties.purpose.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.ranges !== undefined){
let data1 = data.ranges;
if(Array.isArray(data1)){
if(data1.length > 4096){
const err5 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/maxItems",keyword:"maxItems",params:{limit: 4096},message:"must NOT have more than 4096 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data1.length < 1){
const err6 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.offset_bytes === undefined){
const err7 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data2.length_bytes === undefined){
const err8 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key1 in data2){
if(!((key1 === "offset_bytes") || (key1 === "length_bytes"))){
const err9 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data2.offset_bytes !== undefined){
let data3 = data2.offset_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err10 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
const err11 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err12 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data2.length_bytes !== undefined){
let data4 = data2.length_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err13 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
const err14 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err15 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
}
else {
const err16 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err17 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate98.errors = vErrors;
return errors === 0;
}
validate98.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate95(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate95.evaluated;
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
if(!(validate96(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate96.errors : vErrors.concat(validate96.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate98(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate98.errors : vErrors.concat(validate98.errors);
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
}
if(!valid0){
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
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
validate95.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate95.evaluated = {"dynamicProps":true,"dynamicItems":false};


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
if(data.input_kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_kind"},message:"must have required property '"+"input_kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.input_byte_length === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_byte_length"},message:"must have required property '"+"input_byte_length"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.ownership_copy === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ownership_copy"},message:"must have required property '"+"ownership_copy"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.capture === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture"},message:"must have required property '"+"capture"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.access_ranges === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "access_ranges"},message:"must have required property '"+"access_ranges"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.filesystem_reads === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "filesystem_reads"},message:"must have required property '"+"filesystem_reads"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "contract") || (key0 === "input_kind")) || (key0 === "input_byte_length")) || (key0 === "ownership_copy")) || (key0 === "capture")) || (key0 === "access_ranges")) || (key0 === "filesystem_reads"))){
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
if(data.contract !== undefined){
if(!(validate85(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate85.errors : vErrors.concat(validate85.errors);
errors = vErrors.length;
}
}
if(data.input_kind !== undefined){
let data1 = data.input_kind;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/input_kind",schemaPath:"#/properties/input_kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if("owned_uint8array" !== data1){
const err9 = {instancePath:instancePath+"/input_kind",schemaPath:"#/properties/input_kind/const",keyword:"const",params:{allowedValue: "owned_uint8array"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.input_byte_length !== undefined){
let data2 = data.input_byte_length;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err10 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
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
const err11 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.ownership_copy !== undefined){
let data3 = data.ownership_copy;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.offset_bytes === undefined){
const err13 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data3.length_bytes === undefined){
const err14 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 in data3){
if(!((key1 === "offset_bytes") || (key1 === "length_bytes"))){
const err15 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data3.offset_bytes !== undefined){
let data4 = data3.offset_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err16 = {instancePath:instancePath+"/ownership_copy/offset_bytes",schemaPath:"#/properties/ownership_copy/properties/offset_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(0 !== data4){
const err17 = {instancePath:instancePath+"/ownership_copy/offset_bytes",schemaPath:"#/properties/ownership_copy/properties/offset_bytes/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data3.length_bytes !== undefined){
let data5 = data3.length_bytes;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err18 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 9007199254740991 || isNaN(data5)){
const err19 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err20 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
}
else {
const err21 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.capture !== undefined){
let data6 = data.capture;
const _errs17 = errors;
let valid4 = false;
const _errs18 = errors;
if(!(validate91(data6, {instancePath:instancePath+"/capture",parentData:data,parentDataProperty:"capture",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate91.errors : vErrors.concat(validate91.errors);
errors = vErrors.length;
}
var _valid0 = _errs18 === errors;
valid4 = valid4 || _valid0;
const _errs19 = errors;
if(data6 !== null){
const err22 = {instancePath:instancePath+"/capture",schemaPath:"#/properties/capture/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid0 = _errs19 === errors;
valid4 = valid4 || _valid0;
if(!valid4){
const err23 = {instancePath:instancePath+"/capture",schemaPath:"#/properties/capture/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
else {
errors = _errs17;
if(vErrors !== null){
if(_errs17){
vErrors.length = _errs17;
}
else {
vErrors = null;
}
}
}
}
if(data.access_ranges !== undefined){
let data7 = data.access_ranges;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
if(!(validate95(data7[i0], {instancePath:instancePath+"/access_ranges/" + i0,parentData:data7,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate95.errors : vErrors.concat(validate95.errors);
errors = vErrors.length;
}
}
}
else {
const err24 = {instancePath:instancePath+"/access_ranges",schemaPath:"#/properties/access_ranges/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.filesystem_reads !== undefined){
let data9 = data.filesystem_reads;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err25 = {instancePath:instancePath+"/filesystem_reads",schemaPath:"#/properties/filesystem_reads/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(0 !== data9){
const err26 = {instancePath:instancePath+"/filesystem_reads",schemaPath:"#/properties/filesystem_reads/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
validate89.errors = vErrors;
return errors === 0;
}
validate89.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const pattern38 = new RegExp("\\S", "u");

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
if(data.status === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.request_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_id"},message:"must have required property '"+"request_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.stage === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.reason === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.diagnostic === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "diagnostic"},message:"must have required property '"+"diagnostic"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.input_observation === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_observation"},message:"must have required property '"+"input_observation"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.snapshot === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "contract") || (key0 === "status")) || (key0 === "request_id")) || (key0 === "stage")) || (key0 === "reason")) || (key0 === "diagnostic")) || (key0 === "input_observation")) || (key0 === "snapshot"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.contract !== undefined){
if(!(validate85(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate85.errors : vErrors.concat(validate85.errors);
errors = vErrors.length;
}
}
if(data.status !== undefined){
let data1 = data.status;
if(typeof data1 !== "string"){
const err9 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!((data1 === "rejected") || (data1 === "unsupported"))){
const err10 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema125.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.request_id !== undefined){
let data2 = data.request_id;
const _errs6 = errors;
let valid1 = false;
const _errs7 = errors;
if(typeof data2 === "string"){
if(func1(data2) > 256){
const err11 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func1(data2) < 1){
const err12 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern6.test(data2)){
const err13 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
const _errs10 = errors;
if(data2 !== null){
const err15 = {instancePath:instancePath+"/request_id",schemaPath:"#/properties/request_id/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs10 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err16 = {instancePath:instancePath+"/request_id",schemaPath:"#/properties/request_id/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
}
if(data.stage !== undefined){
let data3 = data.stage;
if(typeof data3 !== "string"){
const err17 = {instancePath:instancePath+"/stage",schemaPath:"#/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!((((((data3 === "input") || (data3 === "metadata")) || (data3 === "authorization")) || (data3 === "content")) || (data3 === "semantic")) || (data3 === "integrity"))){
const err18 = {instancePath:instancePath+"/stage",schemaPath:"#/properties/stage/enum",keyword:"enum",params:{allowedValues: schema125.properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.reason !== undefined){
let data4 = data.reason;
if(typeof data4 === "string"){
if(func1(data4) < 1){
const err19 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!pattern38.test(data4)){
const err20 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
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
const err21 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.diagnostic !== undefined){
let data5 = data.diagnostic;
const _errs18 = errors;
let valid4 = false;
const _errs19 = errors;
if(!(validate87(data5, {instancePath:instancePath+"/diagnostic",parentData:data,parentDataProperty:"diagnostic",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate87.errors : vErrors.concat(validate87.errors);
errors = vErrors.length;
}
var _valid1 = _errs19 === errors;
valid4 = valid4 || _valid1;
const _errs20 = errors;
if(data5 !== null){
const err22 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/properties/diagnostic/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid1 = _errs20 === errors;
valid4 = valid4 || _valid1;
if(!valid4){
const err23 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/properties/diagnostic/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
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
if(data.input_observation !== undefined){
let data6 = data.input_observation;
const _errs23 = errors;
let valid5 = false;
const _errs24 = errors;
if(!(validate89(data6, {instancePath:instancePath+"/input_observation",parentData:data,parentDataProperty:"input_observation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate89.errors : vErrors.concat(validate89.errors);
errors = vErrors.length;
}
var _valid2 = _errs24 === errors;
valid5 = valid5 || _valid2;
const _errs25 = errors;
if(data6 !== null){
const err24 = {instancePath:instancePath+"/input_observation",schemaPath:"#/properties/input_observation/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
var _valid2 = _errs25 === errors;
valid5 = valid5 || _valid2;
if(!valid5){
const err25 = {instancePath:instancePath+"/input_observation",schemaPath:"#/properties/input_observation/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
else {
errors = _errs23;
if(vErrors !== null){
if(_errs23){
vErrors.length = _errs23;
}
else {
vErrors = null;
}
}
}
}
if(data.snapshot !== undefined){
if(data.snapshot !== null){
const err26 = {instancePath:instancePath+"/snapshot",schemaPath:"#/properties/snapshot/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
validate84.errors = vErrors;
return errors === 0;
}
validate84.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate83(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:sectionbytes06:NativeSectionByteRejected06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate83.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate84(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate84.errors : vErrors.concat(validate84.errors);
errors = vErrors.length;
}
validate83.errors = vErrors;
return errors === 0;
}
validate83.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

exports.NativeSectionByteAdmissionResult06 = validate103;
const schema153 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:kdna:candidate:sectionbytes06:NativeSectionByteAdmissionResult06","title":"NativeSectionByteAdmissionResult06","description":"Native owned-byte admission structural data only; opaque requests and byte-read authority require actual native brands.","$ref":"#/$defs/NativeSectionByteAdmissionResult06","$defs":{"CapturedInput06":{"type":"object","properties":{"capture_id":{"$ref":"#/$defs/Identifier"},"input_byte_length":{"$ref":"#/$defs/UInt"},"manifest_bytes_digest":{"$ref":"#/$defs/Digest"},"zip_directory_bytes_digest":{"$ref":"#/$defs/Digest"},"table_frames":{"type":"array","items":{"$ref":"#/$defs/CheckedSection06"},"minItems":0},"identity_scope":{"type":"string","const":"observed_metadata_and_loaded_sections_only"}},"required":["capture_id","input_byte_length","manifest_bytes_digest","zip_directory_bytes_digest","table_frames","identity_scope"],"additionalProperties":false},"CheckedSection06":{"type":"object","properties":{"section_id":{"$ref":"#/$defs/Identifier"},"member":{"$ref":"#/$defs/EntryName"},"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"type":"integer","minimum":1},"digest":{"$ref":"#/$defs/Digest"}},"required":["section_id","member","offset_bytes","length_bytes","digest"],"additionalProperties":false},"Digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"EntryName":{"type":"string","minLength":1,"maxLength":4096,"pattern":"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},"Identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},"NativeSectionByteAccepted06":{"type":"object","properties":{"status":{"type":"string","const":"accepted"},"snapshot":{"$ref":"#/$defs/WholeSectionSnapshot06"},"input_observation":{"$ref":"#/$defs/NativeSectionByteObservation06"}},"required":["status","snapshot","input_observation"],"additionalProperties":false},"NativeSectionByteAdmissionResult06":{"oneOf":[{"$ref":"#/$defs/NativeSectionByteAccepted06"},{"$ref":"#/$defs/NativeSectionByteRejected06"}]},"NativeSectionByteContract06":{"type":"object","properties":{"id":{"const":"kdna.section-bytes-node","type":"string"},"version":{"const":"0.1.1-candidate","type":"string"},"definition_digest":{"$ref":"#/$defs/Digest"}},"required":["id","version","definition_digest"],"additionalProperties":false},"NativeSectionByteObservation06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"input_kind":{"type":"string","const":"owned_uint8array"},"input_byte_length":{"$ref":"#/$defs/UInt"},"ownership_copy":{"type":"object","properties":{"offset_bytes":{"type":"integer","const":0},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false},"capture":{"anyOf":[{"$ref":"#/$defs/CapturedInput06"},{"type":"null"}]},"access_ranges":{"type":"array","items":{"$ref":"#/$defs/SectionIORange06"}},"filesystem_reads":{"type":"integer","const":0}},"required":["contract","input_kind","input_byte_length","ownership_copy","capture","access_ranges","filesystem_reads"],"additionalProperties":false},"NativeSectionByteRejected06":{"type":"object","properties":{"contract":{"$ref":"#/$defs/NativeSectionByteContract06"},"status":{"type":"string","enum":["rejected","unsupported"]},"request_id":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null"}]},"stage":{"type":"string","enum":["input","metadata","authorization","content","semantic","integrity"]},"reason":{"$ref":"#/$defs/NonEmptyText"},"diagnostic":{"anyOf":[{"$ref":"#/$defs/SectionFailureDiagnostic06"},{"type":"null"}]},"input_observation":{"anyOf":[{"$ref":"#/$defs/NativeSectionByteObservation06"},{"type":"null"}]},"snapshot":{"type":"null"}},"required":["contract","status","request_id","stage","reason","diagnostic","input_observation","snapshot"],"additionalProperties":false},"NonEmptyText":{"type":"string","minLength":1,"pattern":"\\S"},"SectionFailureDiagnostic06":{"type":"object","properties":{"field":{"anyOf":[{"$ref":"#/$defs/Text"},{"type":"null"}]},"subject":{"anyOf":[{"$ref":"#/$defs/Identifier"},{"type":"null"}]}},"required":["field","subject"],"additionalProperties":false},"SectionIORange06":{"oneOf":[{"$ref":"#/$defs/SectionIOSingleRange06"},{"$ref":"#/$defs/SectionIOStructureBatch06"}]},"SectionIOSingleRange06":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"},"purpose":{"type":"string","enum":["zip_end","zip_directory","zip_local_header","zip_local_name","mimetype","manifest","whole_after_authorization","zip_directory_header","zip_directory_name","section_table_after_authorization","section_content_after_authorization","resource_after_authorization","section_structure_after_authorization","zip_locator_local_signature","zip_locator_local_header","zip_locator_directory_signature","zip_locator_directory_header","zip_locator_directory_name","zip_locator_local_name","zip_locator_eocd","zip_comment","checksum_document_after_authorization","checksum_member_after_authorization","signature_document_after_authorization","signature_member_after_authorization"]}},"required":["offset_bytes","length_bytes","purpose"],"additionalProperties":false},"SectionIOStructureBatch06":{"type":"object","properties":{"purpose":{"type":"string","enum":["section_structure_after_authorization","section_interpretation_after_authorization"]},"ranges":{"type":"array","minItems":1,"maxItems":4096,"items":{"type":"object","properties":{"offset_bytes":{"$ref":"#/$defs/UInt"},"length_bytes":{"$ref":"#/$defs/UInt"}},"required":["offset_bytes","length_bytes"],"additionalProperties":false}}},"required":["purpose","ranges"],"additionalProperties":false},"Text":{"type":"string"},"UInt":{"type":"integer","minimum":0,"maximum":9007199254740991},"WholeSectionSnapshot06":false}};
const schema154 = {"oneOf":[{"$ref":"#/$defs/NativeSectionByteAccepted06"},{"$ref":"#/$defs/NativeSectionByteRejected06"}]};

function validate107(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate107.evaluated;
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
if("kdna.section-bytes-node" !== data0){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/const",keyword:"const",params:{allowedValue: "kdna.section-bytes-node"},message:"must be equal to constant"};
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
if("0.1.1-candidate" !== data1){
const err7 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/const",keyword:"const",params:{allowedValue: "0.1.1-candidate"},message:"must be equal to constant"};
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
validate107.errors = vErrors;
return errors === 0;
}
validate107.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.section_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "section_id"},message:"must have required property '"+"section_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.member === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member"},message:"must have required property '"+"member"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.offset_bytes === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.length_bytes === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.digest === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "digest"},message:"must have required property '"+"digest"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "section_id") || (key0 === "member")) || (key0 === "offset_bytes")) || (key0 === "length_bytes")) || (key0 === "digest"))){
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
if(data.section_id !== undefined){
let data0 = data.section_id;
if(typeof data0 === "string"){
if(func1(data0) > 256){
const err6 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data0) < 1){
const err7 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern6.test(data0)){
const err8 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err9 = {instancePath:instancePath+"/section_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.member !== undefined){
let data1 = data.member;
if(typeof data1 === "string"){
if(func1(data1) > 4096){
const err10 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func1(data1) < 1){
const err11 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!pattern10.test(data1)){
const err12 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"},message:"must match pattern \""+"^(?!/)(?!.*(?:^|/)(?:\\.|\\.\\.)(?:/|$))(?!.*//)(?!.*[/]$)[^\\\\\\u0000-\\u001f\\u007f-\\u009f]+$"+"\""};
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
const err13 = {instancePath:instancePath+"/member",schemaPath:"#/$defs/EntryName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.offset_bytes !== undefined){
let data2 = data.offset_bytes;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err14 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
const err15 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err16 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.length_bytes !== undefined){
let data3 = data.length_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err17 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/properties/length_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 < 1 || isNaN(data3)){
const err18 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/properties/length_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.digest !== undefined){
let data4 = data.digest;
if(typeof data4 === "string"){
if(!pattern4.test(data4)){
const err19 = {instancePath:instancePath+"/digest",schemaPath:"#/$defs/Digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err20 = {instancePath:instancePath+"/digest",schemaPath:"#/$defs/Digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
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
validate110.errors = vErrors;
return errors === 0;
}
validate110.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate109(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate109.evaluated;
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
if(data.table_frames === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "table_frames"},message:"must have required property '"+"table_frames"+"'"};
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
if(!((((((key0 === "capture_id") || (key0 === "input_byte_length")) || (key0 === "manifest_bytes_digest")) || (key0 === "zip_directory_bytes_digest")) || (key0 === "table_frames")) || (key0 === "identity_scope"))){
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
if(!pattern6.test(data0)){
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
if(data.table_frames !== undefined){
let data4 = data.table_frames;
if(Array.isArray(data4)){
if(data4.length < 0){
const err18 = {instancePath:instancePath+"/table_frames",schemaPath:"#/properties/table_frames/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate110(data4[i0], {instancePath:instancePath+"/table_frames/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate110.errors : vErrors.concat(validate110.errors);
errors = vErrors.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/table_frames",schemaPath:"#/properties/table_frames/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
let data6 = data.identity_scope;
if(typeof data6 !== "string"){
const err20 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if("observed_metadata_and_loaded_sections_only" !== data6){
const err21 = {instancePath:instancePath+"/identity_scope",schemaPath:"#/properties/identity_scope/const",keyword:"const",params:{allowedValue: "observed_metadata_and_loaded_sections_only"},message:"must be equal to constant"};
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
validate109.errors = vErrors;
return errors === 0;
}
validate109.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.offset_bytes === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.length_bytes === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.purpose === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "offset_bytes") || (key0 === "length_bytes")) || (key0 === "purpose"))){
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
if(data.offset_bytes !== undefined){
let data0 = data.offset_bytes;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err4 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 > 9007199254740991 || isNaN(data0)){
const err5 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0 < 0 || isNaN(data0)){
const err6 = {instancePath:instancePath+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.length_bytes !== undefined){
let data1 = data.length_bytes;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err7 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 9007199254740991 || isNaN(data1)){
const err8 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1 < 0 || isNaN(data1)){
const err9 = {instancePath:instancePath+"/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.purpose !== undefined){
let data2 = data.purpose;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!(((((((((((((((((((((((((data2 === "zip_end") || (data2 === "zip_directory")) || (data2 === "zip_local_header")) || (data2 === "zip_local_name")) || (data2 === "mimetype")) || (data2 === "manifest")) || (data2 === "whole_after_authorization")) || (data2 === "zip_directory_header")) || (data2 === "zip_directory_name")) || (data2 === "section_table_after_authorization")) || (data2 === "section_content_after_authorization")) || (data2 === "resource_after_authorization")) || (data2 === "section_structure_after_authorization")) || (data2 === "zip_locator_local_signature")) || (data2 === "zip_locator_local_header")) || (data2 === "zip_locator_directory_signature")) || (data2 === "zip_locator_directory_header")) || (data2 === "zip_locator_directory_name")) || (data2 === "zip_locator_local_name")) || (data2 === "zip_locator_eocd")) || (data2 === "zip_comment")) || (data2 === "checksum_document_after_authorization")) || (data2 === "checksum_member_after_authorization")) || (data2 === "signature_document_after_authorization")) || (data2 === "signature_member_after_authorization"))){
const err11 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/enum",keyword:"enum",params:{allowedValues: schema51.properties.purpose.enum},message:"must be equal to one of the allowed values"};
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
validate114.errors = vErrors;
return errors === 0;
}
validate114.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate116(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate116.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.purpose === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.ranges === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ranges"},message:"must have required property '"+"ranges"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "purpose") || (key0 === "ranges"))){
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
if(data.purpose !== undefined){
let data0 = data.purpose;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!((data0 === "section_structure_after_authorization") || (data0 === "section_interpretation_after_authorization"))){
const err4 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/enum",keyword:"enum",params:{allowedValues: schema54.properties.purpose.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.ranges !== undefined){
let data1 = data.ranges;
if(Array.isArray(data1)){
if(data1.length > 4096){
const err5 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/maxItems",keyword:"maxItems",params:{limit: 4096},message:"must NOT have more than 4096 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data1.length < 1){
const err6 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.offset_bytes === undefined){
const err7 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data2.length_bytes === undefined){
const err8 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key1 in data2){
if(!((key1 === "offset_bytes") || (key1 === "length_bytes"))){
const err9 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data2.offset_bytes !== undefined){
let data3 = data2.offset_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err10 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
const err11 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err12 = {instancePath:instancePath+"/ranges/" + i0+"/offset_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data2.length_bytes !== undefined){
let data4 = data2.length_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err13 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
const err14 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err15 = {instancePath:instancePath+"/ranges/" + i0+"/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
}
else {
const err16 = {instancePath:instancePath+"/ranges/" + i0,schemaPath:"#/properties/ranges/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err17 = {instancePath:instancePath+"/ranges",schemaPath:"#/properties/ranges/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate116.errors = vErrors;
return errors === 0;
}
validate116.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate113(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate113.evaluated;
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
if(!(validate114(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate114.errors : vErrors.concat(validate114.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate116(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate116.errors : vErrors.concat(validate116.errors);
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
}
if(!valid0){
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
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
validate113.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate113.evaluated = {"dynamicProps":true,"dynamicItems":false};


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
if(data.input_kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_kind"},message:"must have required property '"+"input_kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.input_byte_length === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_byte_length"},message:"must have required property '"+"input_byte_length"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.ownership_copy === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ownership_copy"},message:"must have required property '"+"ownership_copy"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.capture === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture"},message:"must have required property '"+"capture"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.access_ranges === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "access_ranges"},message:"must have required property '"+"access_ranges"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.filesystem_reads === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "filesystem_reads"},message:"must have required property '"+"filesystem_reads"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "contract") || (key0 === "input_kind")) || (key0 === "input_byte_length")) || (key0 === "ownership_copy")) || (key0 === "capture")) || (key0 === "access_ranges")) || (key0 === "filesystem_reads"))){
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
if(data.contract !== undefined){
if(!(validate107(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate107.errors : vErrors.concat(validate107.errors);
errors = vErrors.length;
}
}
if(data.input_kind !== undefined){
let data1 = data.input_kind;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/input_kind",schemaPath:"#/properties/input_kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if("owned_uint8array" !== data1){
const err9 = {instancePath:instancePath+"/input_kind",schemaPath:"#/properties/input_kind/const",keyword:"const",params:{allowedValue: "owned_uint8array"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.input_byte_length !== undefined){
let data2 = data.input_byte_length;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err10 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
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
const err11 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/input_byte_length",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.ownership_copy !== undefined){
let data3 = data.ownership_copy;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.offset_bytes === undefined){
const err13 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/required",keyword:"required",params:{missingProperty: "offset_bytes"},message:"must have required property '"+"offset_bytes"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data3.length_bytes === undefined){
const err14 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/required",keyword:"required",params:{missingProperty: "length_bytes"},message:"must have required property '"+"length_bytes"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 in data3){
if(!((key1 === "offset_bytes") || (key1 === "length_bytes"))){
const err15 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data3.offset_bytes !== undefined){
let data4 = data3.offset_bytes;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err16 = {instancePath:instancePath+"/ownership_copy/offset_bytes",schemaPath:"#/properties/ownership_copy/properties/offset_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(0 !== data4){
const err17 = {instancePath:instancePath+"/ownership_copy/offset_bytes",schemaPath:"#/properties/ownership_copy/properties/offset_bytes/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data3.length_bytes !== undefined){
let data5 = data3.length_bytes;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err18 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 9007199254740991 || isNaN(data5)){
const err19 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err20 = {instancePath:instancePath+"/ownership_copy/length_bytes",schemaPath:"#/$defs/UInt/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
}
else {
const err21 = {instancePath:instancePath+"/ownership_copy",schemaPath:"#/properties/ownership_copy/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.capture !== undefined){
let data6 = data.capture;
const _errs17 = errors;
let valid4 = false;
const _errs18 = errors;
if(!(validate109(data6, {instancePath:instancePath+"/capture",parentData:data,parentDataProperty:"capture",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate109.errors : vErrors.concat(validate109.errors);
errors = vErrors.length;
}
var _valid0 = _errs18 === errors;
valid4 = valid4 || _valid0;
const _errs19 = errors;
if(data6 !== null){
const err22 = {instancePath:instancePath+"/capture",schemaPath:"#/properties/capture/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid0 = _errs19 === errors;
valid4 = valid4 || _valid0;
if(!valid4){
const err23 = {instancePath:instancePath+"/capture",schemaPath:"#/properties/capture/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
else {
errors = _errs17;
if(vErrors !== null){
if(_errs17){
vErrors.length = _errs17;
}
else {
vErrors = null;
}
}
}
}
if(data.access_ranges !== undefined){
let data7 = data.access_ranges;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
if(!(validate113(data7[i0], {instancePath:instancePath+"/access_ranges/" + i0,parentData:data7,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate113.errors : vErrors.concat(validate113.errors);
errors = vErrors.length;
}
}
}
else {
const err24 = {instancePath:instancePath+"/access_ranges",schemaPath:"#/properties/access_ranges/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.filesystem_reads !== undefined){
let data9 = data.filesystem_reads;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err25 = {instancePath:instancePath+"/filesystem_reads",schemaPath:"#/properties/filesystem_reads/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(0 !== data9){
const err26 = {instancePath:instancePath+"/filesystem_reads",schemaPath:"#/properties/filesystem_reads/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
validate106.errors = vErrors;
return errors === 0;
}
validate106.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.snapshot === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.input_observation === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_observation"},message:"must have required property '"+"input_observation"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "status") || (key0 === "snapshot")) || (key0 === "input_observation"))){
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
if(data.status !== undefined){
let data0 = data.status;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("accepted" !== data0){
const err5 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "accepted"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.snapshot !== undefined){
const err6 = {instancePath:instancePath+"/snapshot",schemaPath:"#/$defs/WholeSectionSnapshot06/false schema",keyword:"false schema",params:{},message:"boolean schema is false"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.input_observation !== undefined){
if(!(validate106(data.input_observation, {instancePath:instancePath+"/input_observation",parentData:data,parentDataProperty:"input_observation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate106.errors : vErrors.concat(validate106.errors);
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
validate105.errors = vErrors;
return errors === 0;
}
validate105.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.field === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "field"},message:"must have required property '"+"field"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.subject === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "subject"},message:"must have required property '"+"subject"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "field") || (key0 === "subject"))){
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
if(data.field !== undefined){
let data0 = data.field;
const _errs3 = errors;
let valid1 = false;
const _errs4 = errors;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/field",schemaPath:"#/$defs/Text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
var _valid0 = _errs4 === errors;
valid1 = valid1 || _valid0;
const _errs7 = errors;
if(data0 !== null){
const err4 = {instancePath:instancePath+"/field",schemaPath:"#/properties/field/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err5 = {instancePath:instancePath+"/field",schemaPath:"#/properties/field/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
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
if(data.subject !== undefined){
let data1 = data.subject;
const _errs10 = errors;
let valid3 = false;
const _errs11 = errors;
if(typeof data1 === "string"){
if(func1(data1) > 256){
const err6 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func1(data1) < 1){
const err7 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern6.test(data1)){
const err8 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
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
const err9 = {instancePath:instancePath+"/subject",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid1 = _errs11 === errors;
valid3 = valid3 || _valid1;
const _errs14 = errors;
if(data1 !== null){
const err10 = {instancePath:instancePath+"/subject",schemaPath:"#/properties/subject/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid1 = _errs14 === errors;
valid3 = valid3 || _valid1;
if(!valid3){
const err11 = {instancePath:instancePath+"/subject",schemaPath:"#/properties/subject/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
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
validate123.errors = vErrors;
return errors === 0;
}
validate123.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate121(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate121.evaluated;
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
if(data.status === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.request_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_id"},message:"must have required property '"+"request_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.stage === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.reason === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.diagnostic === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "diagnostic"},message:"must have required property '"+"diagnostic"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.input_observation === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_observation"},message:"must have required property '"+"input_observation"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.snapshot === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "contract") || (key0 === "status")) || (key0 === "request_id")) || (key0 === "stage")) || (key0 === "reason")) || (key0 === "diagnostic")) || (key0 === "input_observation")) || (key0 === "snapshot"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.contract !== undefined){
if(!(validate107(data.contract, {instancePath:instancePath+"/contract",parentData:data,parentDataProperty:"contract",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate107.errors : vErrors.concat(validate107.errors);
errors = vErrors.length;
}
}
if(data.status !== undefined){
let data1 = data.status;
if(typeof data1 !== "string"){
const err9 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!((data1 === "rejected") || (data1 === "unsupported"))){
const err10 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema125.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.request_id !== undefined){
let data2 = data.request_id;
const _errs6 = errors;
let valid1 = false;
const _errs7 = errors;
if(typeof data2 === "string"){
if(func1(data2) > 256){
const err11 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func1(data2) < 1){
const err12 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern6.test(data2)){
const err13 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f-\\u009f\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/request_id",schemaPath:"#/$defs/Identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
const _errs10 = errors;
if(data2 !== null){
const err15 = {instancePath:instancePath+"/request_id",schemaPath:"#/properties/request_id/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs10 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err16 = {instancePath:instancePath+"/request_id",schemaPath:"#/properties/request_id/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
}
if(data.stage !== undefined){
let data3 = data.stage;
if(typeof data3 !== "string"){
const err17 = {instancePath:instancePath+"/stage",schemaPath:"#/properties/stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!((((((data3 === "input") || (data3 === "metadata")) || (data3 === "authorization")) || (data3 === "content")) || (data3 === "semantic")) || (data3 === "integrity"))){
const err18 = {instancePath:instancePath+"/stage",schemaPath:"#/properties/stage/enum",keyword:"enum",params:{allowedValues: schema125.properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.reason !== undefined){
let data4 = data.reason;
if(typeof data4 === "string"){
if(func1(data4) < 1){
const err19 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/NonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!pattern38.test(data4)){
const err20 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/NonEmptyText/pattern",keyword:"pattern",params:{pattern: "\\S"},message:"must match pattern \""+"\\S"+"\""};
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
const err21 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/NonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.diagnostic !== undefined){
let data5 = data.diagnostic;
const _errs18 = errors;
let valid4 = false;
const _errs19 = errors;
if(!(validate123(data5, {instancePath:instancePath+"/diagnostic",parentData:data,parentDataProperty:"diagnostic",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate123.errors : vErrors.concat(validate123.errors);
errors = vErrors.length;
}
var _valid1 = _errs19 === errors;
valid4 = valid4 || _valid1;
const _errs20 = errors;
if(data5 !== null){
const err22 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/properties/diagnostic/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid1 = _errs20 === errors;
valid4 = valid4 || _valid1;
if(!valid4){
const err23 = {instancePath:instancePath+"/diagnostic",schemaPath:"#/properties/diagnostic/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
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
if(data.input_observation !== undefined){
let data6 = data.input_observation;
const _errs23 = errors;
let valid5 = false;
const _errs24 = errors;
if(!(validate106(data6, {instancePath:instancePath+"/input_observation",parentData:data,parentDataProperty:"input_observation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate106.errors : vErrors.concat(validate106.errors);
errors = vErrors.length;
}
var _valid2 = _errs24 === errors;
valid5 = valid5 || _valid2;
const _errs25 = errors;
if(data6 !== null){
const err24 = {instancePath:instancePath+"/input_observation",schemaPath:"#/properties/input_observation/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
var _valid2 = _errs25 === errors;
valid5 = valid5 || _valid2;
if(!valid5){
const err25 = {instancePath:instancePath+"/input_observation",schemaPath:"#/properties/input_observation/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
else {
errors = _errs23;
if(vErrors !== null){
if(_errs23){
vErrors.length = _errs23;
}
else {
vErrors = null;
}
}
}
}
if(data.snapshot !== undefined){
if(data.snapshot !== null){
const err26 = {instancePath:instancePath+"/snapshot",schemaPath:"#/properties/snapshot/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
validate121.errors = vErrors;
return errors === 0;
}
validate121.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(!(validate105(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate105.errors : vErrors.concat(validate105.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate121(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate121.errors : vErrors.concat(validate121.errors);
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
}
if(!valid0){
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
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
validate104.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate104.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate103(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:kdna:candidate:sectionbytes06:NativeSectionByteAdmissionResult06" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate103.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate104(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate104.errors : vErrors.concat(validate104.errors);
errors = vErrors.length;
}
else {
var props0 = validate104.evaluated.props;
}
validate103.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate103.evaluated = {"dynamicProps":true,"dynamicItems":false};

