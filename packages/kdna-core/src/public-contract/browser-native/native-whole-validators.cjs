'use strict';
const { createValidator, createValidators } = require("../schema-validator.js");
const defs = require('../sections/contract.json').types;
module.exports = createValidators(defs, ["Manifest06Candidate","StoredRepresentationMetadata06","RepresentationMetadata06","Representation06TableDirectoryRow","Representation06DataSectionRow","Representation06TopicRow","Representation06NodeSectionRow","ExperimentalStoredXrefFrame06","ExpansionTarget","IRReadNode","CanonicalIR06Candidate","WholeSectionSnapshotData06","ChecksumsDocument06","SectionSignaturePolicy06","SectionSignatureReadIntent06","SectionSignatureVerification06"], { allErrors: false });
