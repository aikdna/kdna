'use strict';
const {states}=require('./budget.js');
// These are independent stage observations, never fields read from an asset.
function correlateStates(coreObservation,writerObservation,confirmationObservation,permissionObservation='not_evaluated'){
 return {...states(),core:coreObservation,writer:writerObservation,confirmation:confirmationObservation,read_permission:permissionObservation};
}
module.exports={correlateStates};
