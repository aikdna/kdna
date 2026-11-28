'use strict';
const { createValidator, createValidators } = require("../schema-validator.js");
const defs = require('../native-types.generated.json');
module.exports = createValidators(defs, ["NativeSectionByteContract06","NativeSectionByteObservation06","NativeSectionByteAuthorityContext06","NativeSectionByteReadAuthority06","NativeSectionByteAccepted06","NativeSectionByteRejected06","NativeSectionByteAdmissionResult06"], { allErrors: true });
