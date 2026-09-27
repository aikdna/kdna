'use strict';
const { getProtectionContract } = require('./protection-declaration.js');
const { admitProtectedNode } = require('./protection-admission.js');
const { bindProtectionOperation, disposeProtectionOperation } = require('./protection-operation.js');
const { protectSourceBytes } = require('./protection-producer.js');
module.exports={getProtectionContract,admitProtectedNode,bindProtectionOperation,disposeProtectionOperation,protectSourceBytes};
