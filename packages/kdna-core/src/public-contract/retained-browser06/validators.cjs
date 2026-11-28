'use strict';
const { createValidator, createValidators } = require("../schema-validator.js");
const defs = require('../native-types.generated.json');
module.exports = createValidators(defs, ["RetainedSectionRequest06","SectionSignaturePolicy06","RetainedSectionFailure06","RetainedSectionAuthorityContext06","RetainedSectionPreparationData06","RetainedSectionHostObservation06","RetainedSectionReadCallResult06"], { allErrors: true });
