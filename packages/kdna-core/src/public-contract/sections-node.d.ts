import type { ReadRequest06Candidate, AdmittedSectionReadRequest06, SectionReadAuthority06, WholeSectionSnapshot06, WholeSectionSnapshotData06, CapturedInput06, AssetIdentity, Digest, SectionIORange06, SectionAdmissionUnsupported06, SectionAdmissionRejected06 } from './sections/types.js';
export type * from './sections/types.js';
export type SectionAuthorityContext = Readonly<{request:ReadRequest06Candidate;request_digest:Digest;capture:Omit<CapturedInput06,'table_frames'>;manifest_identity:AssetIdentity;mode:ReadRequest06Candidate['mode'];operation:'read'|'produce_checksums'|'produce_signature';signature_policy:import('./sections/types.js').SectionSignaturePolicy06;signature_policy_digest:Digest;signature_read_intent:import('./sections/types.js').SectionSignatureReadIntent06;signature_read_intent_digest:Digest}>;
export type SectionAdmissionResult = Readonly<{status:'accepted';snapshot:WholeSectionSnapshot06|import('./sections/types.js').CatalogSectionSnapshot06|import('./sections/types.js').ScopedSectionSnapshot06;request?:AdmittedSectionReadRequest06;io:ReadonlyArray<SectionIORange06>;input_byte_length:number}> | SectionAdmissionUnsupported06 | SectionAdmissionRejected06;
export declare function admitSectionRequest(candidate:unknown):AdmittedSectionReadRequest06;
export declare function inspectSectionRequest(token:unknown):ReadRequest06Candidate|null;
export declare function createSectionReadAuthority(callback:(context:SectionAuthorityContext)=>boolean|Promise<boolean>,signaturePolicy?:import('./sections/types.js').SectionSignaturePolicy06):SectionReadAuthority06;
export declare function admitSectionNode(input:string,request:AdmittedSectionReadRequest06,authority:SectionReadAuthority06):Promise<SectionAdmissionResult>;
export declare function inspectWholeSectionSnapshot(token:unknown):WholeSectionSnapshotData06|null;

export function inspectSectionSnapshot(snapshot: unknown): import("./sections/types.js").CatalogSectionSnapshotData06 | import("./sections/types.js").SectionSnapshotData06 | null;

export declare function bindSectionExpansionRequest(origin:WholeSectionSnapshot06|import('./sections/types.js').ScopedSectionSnapshot06,candidate:unknown):AdmittedSectionReadRequest06;

export type SectionChecksumProductionResult = Readonly<{status:'produced';bytes:Uint8Array;evidence:import('./sections/types.js').SectionChecksumProducerEvidence06;io:ReadonlyArray<SectionIORange06>}> | SectionAdmissionUnsupported06 | SectionAdmissionRejected06;
export declare function createSectionChecksumsNode(input:string,request:AdmittedSectionReadRequest06,authority:SectionReadAuthority06):Promise<SectionChecksumProductionResult>;

export type SectionSignatureProductionResult = Readonly<{status:'produced';bytes:Uint8Array;evidence:import('./sections/types.js').SectionSignatureProducerEvidence06;io:ReadonlyArray<SectionIORange06>}> | SectionAdmissionUnsupported06 | SectionAdmissionRejected06;
export declare function createSectionSignatureNode(input:string,request:AdmittedSectionReadRequest06,authority:SectionReadAuthority06,options:import('./sections/types.js').SectionSignatureProducerOptions06,signingSeed:Uint8Array):Promise<SectionSignatureProductionResult>;
