'use strict';
const { createValidator, createValidators } = require("../schema-validator.js");
const defs = require('../native-types.generated.json');
module.exports = createValidators(defs, ["AdmittedSourceMigrationRequest06","NativeSourceMigrationAuthority06","SourceMigrationAuthorityContext06","SourceMigrationCaptureRow06","SourceMigrationDiagnostic06","SourceMigrationFailure06","SourceMigrationObservation06","SourceMigrationRequest06","SourceMigrationRequestAdmission06","SourceMigrationRouteContract06"], { allErrors: true });
