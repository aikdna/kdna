'use strict';

const { parseJson, canonicalJson, utf8, reject, freeze } = require('./strict-input.js');
const { parseContainer } = require('./container.js');
const { decodePayload } = require('./cbor.js');
const { digest, contentTreePreimage, runtimeEntryPreimage, runtimeEntryNames, evidence } = require('./digests.js');
const { validate } = require('./validate.js');
const { buildIR } = require('./canonical-ir.js');
const { issueSnapshot } = require('./brand.js');
const { versionTuple } = require('./generated-contract.json');

function rejected(reason,componentFailure=null) {
  const componentCodes=require('./generated-contract.json').types.CoreComponentFailure.properties.code.enum;
  const allowed=['READ_INPUT_INVALID','READ_CORE_INVALID','READ_CORE_CAPABILITY_UNAVAILABLE','READ_INTERPRETATION_INCOMPLETE',...componentCodes];
  if(!allowed.includes(reason))reason='READ_CORE_INVALID';
  const interpretationFailure=reason==='READ_INTERPRETATION_INCOMPLETE'||componentCodes.includes(reason);
  const states={core:interpretationFailure?'valid':reason==='READ_CORE_INVALID'?'invalid':'not_evaluated',interpretation:interpretationFailure?'blocked':'not_evaluated'};
  return freeze({status:'rejected',reason,states,component_failure:componentCodes.includes(reason)?componentFailure:null,diagnostics:[{code:reason,stage:reason==='READ_INPUT_INVALID'||reason==='READ_CORE_CAPABILITY_UNAVAILABLE'?'input':'core',severity:'error',subject:null,field:null}]});
}
function admit(input, inflate) {
  try {
    if (!(input instanceof Uint8Array)) return rejected('READ_INPUT_INVALID');
    const bytes = new Uint8Array(input);
    const entries = parseContainer(bytes,inflate);
    const manifest = validate('Manifest',parseJson(entries['kdna.json']));
    if (manifest.payload.encrypted || manifest.encryption || entries['signature.kdsig'] || entries['checksums.json']) return rejected('READ_CORE_CAPABILITY_UNAVAILABLE');
    const payload = validate('Payload',decodePayload(entries['payload.kdnab']));
    if (payload.asset.asset_id !== manifest.asset_id || payload.asset.asset_version !== manifest.version || payload.asset.judgment_version !== manifest.judgment_version) reject('READ_CORE_INVALID');
    const A=digest(bytes),C=digest(contentTreePreimage(entries)),E=digest(runtimeEntryPreimage(entries,manifest));
    if ((manifest.content_digest&&manifest.content_digest!==C)||(manifest.authoring?.content_digest&&manifest.authoring.content_digest!==C)) reject('READ_CORE_INVALID');
    const expectedE=null; // No public checksums-document admission profile is implemented.
    const ir=buildIR(manifest,payload,entries);
    const uuid=globalThis.crypto?.randomUUID?.();if(!uuid)return rejected('READ_CORE_CAPABILITY_UNAVAILABLE');
    const data={snapshot_id:'snapshot:'+uuid,tuple:versionTuple,asset:payload.asset,digests:{A:evidence('A',A),C:evidence('C',C,manifest.content_digest??null,manifest.content_digest?{kind:'manifest_declaration',source_id:'kdna.json'}:null),E:evidence('E',E,expectedE,expectedE?{kind:'checksums_declaration',source_id:'checksums.json'}:null)},ir,ir_digest:digest(utf8(canonicalJson(ir))),runtime_entry_names:runtimeEntryNames(entries,manifest),expansion_targets:ir.expansion_targets};
    return freeze({status:'accepted',snapshot:issueSnapshot(data)});
  } catch(error) {
    return rejected(error?.code==='MODULE_NOT_FOUND'?'READ_CORE_CAPABILITY_UNAVAILABLE':error?.reason,error?.component_failure??null);
  }
}
module.exports={admit,rejected};
