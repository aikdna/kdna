'use strict';
const A=require('./native-package-set-admission.js');
module.exports={getNativePackageSetContract:()=>A.descriptor,validateNativePackageSetStructure:A.validateStructure,createTrustedNativePackageSetMemberProvider:A.createTrustedPackageSetMemberProvider,admitNativePackageSetNode:A.admit,recheckNativePackageSet:A.recheck,inspectAdmittedNativePackageSet:A.inspectAdmission,verifyNativePackageSetHandoff:require('./native-package-set-handoff.js').verify};
