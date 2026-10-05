'use strict';
const {isUtf8} = require('node:buffer');
const strict = require('./strict-input.js');
const {digestCanonical} = require('./digests.js');
const definition = require('./execution06/contract.json');
const validators = require('./execution06/validators.cjs');
const contract = strict.freeze({versionTuple: definition.module.version.wire_tuple, types: definition.types});
// Branch identity only. Full source/types/install identities are tracked separately.
const definitionDigest = digestCanonical(definition.module);
const known = new WeakSet();
function fail(code) {
  const error = Object.assign(new Error(code), {executionCode: code});
  known.add(error);
  throw error;
}
function knownCode(error) { return error && typeof error === 'object' && known.has(error) ? error.executionCode : undefined; }
function inputCopy(input) {
  try { return strict.copyJson(input); }
  catch (error) {
    if (error?.reason === 'READ_INPUT_INVALID') fail('EXECUTION_INPUT_INVALID');
    throw error;
  }
}
function inputJson(input) {
  if (typeof input !== 'string' && !(input instanceof Uint8Array)) return inputCopy(input);
  if (input instanceof Uint8Array && !isUtf8(input)) fail('EXECUTION_INPUT_INVALID');
  try { return strict.parseJson(input); }
  catch (error) {
    if (error?.reason === 'READ_INPUT_INVALID') fail('EXECUTION_INPUT_INVALID');
    // A native JSON syntax error is input data only when raw JSON independently fails.
    if (error instanceof SyntaxError) {
      try { JSON.parse(typeof input === 'string' ? input : new TextDecoder('utf-8', {fatal:true}).decode(input)); }
      catch { fail('EXECUTION_INPUT_INVALID'); }
    }
    throw error;
  }
}
module.exports = {strict, contract, validators, definitionDigest, fail, knownCode, inputCopy, inputJson};
