'use strict';
const { createValidator, createValidators } = require("../schema-validator.js");
const defs = require('../native-types.generated.json');
module.exports = createValidators(defs, ["NativeBrowserSectionByteContract06","NativeBrowserSectionByteObservation06","NativeBrowserSectionByteAuthorityContext06","NativeBrowserSectionByteReadAuthority06","NativeBrowserSectionByteAccepted06","NativeBrowserSectionByteRejected06","NativeBrowserSectionByteAdmissionResult06","Request06_whole_asset","SectionSignaturePolicy06"], { allErrors: true });
