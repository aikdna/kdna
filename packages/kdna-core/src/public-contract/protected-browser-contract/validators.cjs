'use strict';
const { createValidator, createValidators } = require("../schema-validator.js");
const defs = require('../native-types.generated.json');
module.exports = createValidators(defs, ["BrowserProtectedRequest","BrowserProtectedSignaturePolicy","BrowserProtectedAuthorityContext","BrowserProtectedHostObservation","BrowserProtectedBinding","BrowserProtectedExpansionHandle","BrowserProtectedCallResult","BrowserProtectedRequestAdmission","BrowserProtectedSnapshotData","BrowserProtectedAdmissionResult","BrowserProtectedReadResult","BrowserProtectedTransportCommitResult","BrowserProtectedReadAuthority","TrustedBrowserProtectedHost","BrowserProtectedDeliveryToken","BrowserProtectedHostContext","ProtectedManifest06Candidate","CanonicalIR06Candidate"], { allErrors: true });
