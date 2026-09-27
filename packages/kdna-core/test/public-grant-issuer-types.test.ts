import {getExternalGrantIssuerContract,issueExternalKeyGrantForAsset} from '@aikdna/kdna-core/key-grant-issuer-node';
import type {IssuerOptions,IssuerSecrets,IssuanceResult,IssuerAdmissionObservation} from '@aikdna/kdna-core/key-grant-issuer-node';
const descriptor=getExternalGrantIssuerContract();
const version:'0.35.0-rc.source.1'=descriptor.implementation.version;
const exportsTuple:readonly ['getExternalGrantIssuerContract','issueExternalKeyGrantForAsset']=descriptor.exports;
declare const options:IssuerOptions,secrets:IssuerSecrets;
const result:Promise<IssuanceResult>=issueExternalKeyGrantForAsset(new Uint8Array(),options,secrets);
void result.then(value=>{if(value.status==='issued'){const bytes:Uint8Array=value.grantBytes;const capability=value.admission.asset_capability;void bytes;void capability;
 // @ts-expect-error finite admission has no Payload or IR
 value.admission.ir;
}else{
 // @ts-expect-error failure has no grant
 value.grantBytes;
}});
// @ts-expect-error catalog is explicitly blocked
const wrong:IssuerAdmissionObservation={status:'catalog_only',asset_capability:'mixed',interpretation:'complete'};
// @ts-expect-error unsigned caller A is not an option
issueExternalKeyGrantForAsset(new Uint8Array(),{...options,A:'sha256:00'},secrets);
// @ts-expect-error caller plaintext is not an input carrier
issueExternalKeyGrantForAsset({plaintext:new Uint8Array()},options,secrets);
void version;void exportsTuple;void wrong;
