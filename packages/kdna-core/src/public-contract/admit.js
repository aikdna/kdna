'use strict';

const { parseJson, reject, freeze } = require('./strict-input.js');
const { parseContainer } = require('./container.js');
const { digest, contentTreePreimage, runtimeEntryPreimage } = require('./digests.js');
const { validate } = require('./validate.js');
const { decodeValidatedPayload, assertContentBindings, finishAdmission } = require('./semantic-admission.js');

function rejected(reason,componentFailure=null,detail=null) {
  const componentCodes=require('./generated-contract.json').types.CoreComponentFailure.properties.code.enum;
  const allowed=['READ_INPUT_INVALID','READ_CORE_INVALID','READ_CORE_CAPABILITY_UNAVAILABLE','READ_INTERPRETATION_INCOMPLETE','READ_STATIC_POLICY_INVALID','READ_UNSUPPORTED_CRITICAL','READ_UNSUPPORTED_VERSION','READ_MIXED_VERSION_TUPLE',...componentCodes];
  if(!allowed.includes(reason))reason='READ_CORE_INVALID';
  const interpretationFailure=reason==='READ_UNSUPPORTED_CRITICAL'||reason==='READ_INTERPRETATION_INCOMPLETE'||reason==='READ_STATIC_POLICY_INVALID'||componentCodes.includes(reason);
  const states={core:interpretationFailure?'valid':reason==='READ_CORE_INVALID'?'invalid':'not_evaluated',interpretation:interpretationFailure?'blocked':'not_evaluated'};
  // Only coordinates from the same Core validation are retained. Never return
  // rejected source values or treat authoring diagnostics as a second gate.
  // eslint-disable-next-line no-control-regex -- Intentionally reject C0 and DEL in diagnostic coordinates.
  const safe=value=>typeof value==='string'&&value.length<=1024&&value.isWellFormed()&&!/[\u0000-\u001f\u007f]/.test(value)?value:null;
  const subject=safe(detail?.subject),field=safe(detail?.field);
  return freeze({status:'rejected',reason,states,component_failure:componentCodes.includes(reason)?componentFailure:null,diagnostics:[{code:reason,stage:reason==='READ_INPUT_INVALID'||reason==='READ_CORE_CAPABILITY_UNAVAILABLE'?'input':'core',severity:'error',subject,field}]});
}
function admit(input, inflate) {
  try {
    if (!(input instanceof Uint8Array)) return rejected('READ_INPUT_INVALID');
    const bytes = new Uint8Array(input);
    const entries = parseContainer(bytes, inflate);
    const manifest = validate('Manifest', parseJson(entries['kdna.json']));
    // Keep the established protection-marker precedence on the ordinary surface.
    if (manifest.payload.encrypted || manifest.encryption || entries['signature.kdsig'] || entries['checksums.json']) return rejected('READ_CORE_CAPABILITY_UNAVAILABLE');
    if (Object.hasOwn(manifest, 'entitlement')) reject('READ_CORE_INVALID');
    const payload = decodeValidatedPayload(manifest, entries['payload.kdnab']);
    const A = digest(bytes), C = digest(contentTreePreimage(entries)), E = digest(runtimeEntryPreimage(entries, manifest));
    assertContentBindings(manifest, C);
    return finishAdmission(manifest, payload, entries, { A, C, E });
  } catch (error) {
    return rejected(error?.code === 'MODULE_NOT_FOUND' ? 'READ_CORE_CAPABILITY_UNAVAILABLE' : error?.reason, error?.component_failure ?? null, error?.diagnostic ?? null);
  }
}
module.exports = { admit, rejected };
