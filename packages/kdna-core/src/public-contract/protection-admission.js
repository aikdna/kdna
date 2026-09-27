'use strict';
const { inflateRawSync } = require('node:zlib');
const { parseContainer } = require('./container.js');
const { capture } = require('./node-capture.js');
const { parseJson, freeze } = require('./strict-input.js');
const { validate } = require('./validate.js');
const { rejected } = require('./admit.js');
const { decodeValidatedPayload, assertContentBindings, finishAdmission } = require('./semantic-admission.js');
const { digest, contentTreePreimage, runtimeEntryPreimage } = require('./digests.js');
const { options, provider, declaration, failure, isFailure } = require('./protection-declaration.js');
const { decodeEnvelope } = require('./protection-envelope-codec.js');
const { validateEnvelope, decryptPassword } = require('./protection-crypto.js');
const { verifyIntegrity } = require('./protection-integrity.js');
const { verifyGrant, grantPlaintext } = require('./protection-grant.js');
const { issueOperation } = require('./protection-operation.js');
// The private seam. `metadata` is an optional out-parameter: a caller inside this
// package can ask for the original member table (name/type/mode) of the very same
// parse, without a second container parse and without changing any public output.
function parseProtectedAsset(bytes,signaturePolicy,checkDeclaration,setStage=()=>{},metadata=null) {
  setStage('container');const entries=parseContainer(bytes,(data,maxOutputLength)=>inflateRawSync(data,{maxOutputLength}),metadata??undefined);
  setStage('manifest');const manifest=validate('Manifest',parseJson(entries['kdna.json']));
  const profile=checkDeclaration(manifest);
  const digests={A:digest(bytes),C:digest(contentTreePreimage(entries)),E:digest(runtimeEntryPreimage(entries,manifest))};
  assertContentBindings(manifest,digests.C);
  const integrity=verifyIntegrity(entries,manifest,digests.E,signaturePolicy);
  return {entries,manifest,profile,digests,integrity};
}
async function admitProtectedNode(input, inputOptions, inputProvider) {
  let copied, plaintext, retained=false, stage='input';
  try {
    copied=options(inputOptions);const trustedProvider=provider(inputProvider,copied.credential.kind);
    if(typeof input!=='string' && !(input instanceof Uint8Array))return failure(null);
    stage='container';const bytes=typeof input==='string'?await capture(input):new Uint8Array(input);
    const {entries,manifest,profile,digests,integrity}=parseProtectedAsset(bytes,copied.signaturePolicy,m=>declaration(m,copied.credential,trustedProvider),value=>{stage=value;});
    let envelope=null,verified=null;
    if(profile) {
      envelope=validateEnvelope(decodeEnvelope(entries['payload.kdnab']),profile);
      if(copied.credential.kind==='password')plaintext=decryptPassword(envelope,copied.credential,manifest);
      else { verified=verifyGrant(copied.credential.grantBytes,copied.credential,manifest,envelope,digests.A);plaintext=grantPlaintext(verified,manifest,envelope); }
    }
    stage='payload';const payload=decodeValidatedPayload(manifest,plaintext??entries['payload.kdnab']);
    stage='interpretation';const result=finishAdmission(manifest,payload,entries,digests,integrity.checksums==='verified_document_1'?digests.E:null);
    const source=result.status==='accepted'?{kind:'snapshot',snapshot:result.snapshot}:{kind:'catalog',catalog:result};
    const issued=await issueOperation({credential:copied.credential,provider:trustedProvider,manifest,envelope,verified,digests,profile,integrity,source,plaintextDigest:plaintext?digest(plaintext):null});retained=true;
    return freeze(result.status==='accepted'?{status:'accepted',snapshot:result.snapshot,...issued}:{status:'catalog_only',catalog:result,...issued});
  } catch(error) {
    if(isFailure(error)||stage==='input')return failure(error);
    return freeze({status:'core_rejected',stage,core:rejected(error?.code==='MODULE_NOT_FOUND'?'READ_CORE_CAPABILITY_UNAVAILABLE':error.reason??'READ_CORE_INVALID',error.component_failure??null,error.diagnostic??null)});
  } finally {
    plaintext?.fill(0);
    if(!retained && copied)for(const name of ['password','grantBytes','deviceAgreementPrivateKeyPkcs8'])copied.credential[name]?.fill(0);
  }
}
// B3 additive seam: the SAME admission, retaining the authenticated plaintext and the
// original member table for the one caller that is allowed to see them.
//
// This is deliberately a separate function rather than a flag on `admitProtectedNode`:
// the accepted entry point's text, outputs, error precedence and zeroing stay exactly as
// accepted, so nothing about protected admission changes for existing callers. The two
// bodies share `parseProtectedAsset`, which is the seam that already existed.
async function admitProtectedSource(input, inputOptions, inputProvider) {
  let copied, plaintext=null, retained=false, stage='input';
  const metadata=[];
  try {
    copied=options(inputOptions);const trustedProvider=provider(inputProvider,copied.credential.kind);
    if(typeof input!=='string' && !(input instanceof Uint8Array))return failure(null);
    stage='container';const bytes=typeof input==='string'?await capture(input):new Uint8Array(input);
    const {entries,manifest,profile,digests,integrity}=parseProtectedAsset(bytes,copied.signaturePolicy,m=>declaration(m,copied.credential,trustedProvider),value=>{stage=value;},metadata);
    let envelope=null,verified=null;
    if(profile) {
      envelope=validateEnvelope(decodeEnvelope(entries['payload.kdnab']),profile);
      if(copied.credential.kind==='password')plaintext=decryptPassword(envelope,copied.credential,manifest);
      else { verified=verifyGrant(copied.credential.grantBytes,copied.credential,manifest,envelope,digests.A);plaintext=grantPlaintext(verified,manifest,envelope); }
    }
    stage='payload';const payload=decodeValidatedPayload(manifest,plaintext??entries['payload.kdnab']);
    stage='interpretation';const result=finishAdmission(manifest,payload,entries,digests,integrity.checksums==='verified_document_1'?digests.E:null);
    if(result.status!=='accepted')return freeze({status:'catalog_only',catalog:result});
    const issued=await issueOperation({credential:copied.credential,provider:trustedProvider,manifest,envelope,verified,digests,profile,integrity,source:{kind:'snapshot',snapshot:result.snapshot},plaintextDigest:plaintext?digest(plaintext):null});
    retained=true;
    const members=metadata.map(row=>({...row,bytes:new Uint8Array(entries[row.name])}));
    const inventory=members.map(({bytes:content,...row})=>({...row,size:content.length,sha256:digest(content)}));
    // The retained record is sealed but NOT deep-frozen: `strict-input.freeze` recurses
    // into every value, and freezing a typed array with elements throws. These byte
    // arrays are owned copies the caller is expected to be able to zero.
    return Object.freeze({status:'source',bytes:new Uint8Array(bytes),entries,manifest,payload,digests,profile,integrity,snapshot:result.snapshot,plaintext:plaintext?Buffer.from(plaintext):null,members,inventory,operation:issued.operation,receipt:issued.receipt});
  } catch(error) {
    if(isFailure(error)||stage==='input')return failure(error);
    return freeze({status:'core_rejected',stage,core:rejected(error?.code==='MODULE_NOT_FOUND'?'READ_CORE_CAPABILITY_UNAVAILABLE':error.reason??'READ_CORE_INVALID',error.component_failure??null,error.diagnostic??null)});
  } finally {
    if(!retained&&plaintext)plaintext.fill(0);
    if(!retained&&copied)for(const name of ['password','grantBytes','deviceAgreementPrivateKeyPkcs8'])copied.credential[name]?.fill(0);
  }
}
module.exports={admitProtectedNode,parseProtectedAsset,admitProtectedSource};
