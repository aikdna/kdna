'use strict';
const {copyJson,freeze}=require('./strict-input.js');
// A Creation profile supplies requiredness independently of Core admission.
// The authored object is copied without inserting any declarations.
function assessAuthorship(authored,required,core,confirmationClaim=null){
 const output=copyJson(authored),missing=required.filter(key=>!Object.hasOwn(output,key));
 return freeze({output,core,writer:missing.length?'insufficient':'sufficient',confirmation:confirmationClaim===null?'not_evaluated':'claimed_unverified',diagnostic:missing.length?'WRITER_REQUIRED_DECLARATION_MISSING':null,missing,synthesized_fields:[]});
}
module.exports={assessAuthorship};
