'use strict';
const { createValidator, createValidators } = require("../schema-validator.js");
const defs = require('../native-types.generated.json');
module.exports = createValidators(defs, ["NativeCreationManifest06","NativeCreationRequest06","AdmittedNativeCreationRequest06","NativeCreationAuthority06","NativeCreationContract06","NativeCreationInputObservation06","NativeCreationAuthorityContext06","NativeCreationManifestAction06","NativeCreationEvidence06","NativeCreationRequestAdmission06"], { allErrors: true });
