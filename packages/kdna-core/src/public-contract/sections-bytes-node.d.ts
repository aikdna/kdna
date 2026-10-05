import type { AdmittedSectionReadRequest06, SectionSignaturePolicy06, WholeSectionSnapshot06 } from './sections/types.js';
import type { NativeSectionByteAuthorityContext06, NativeSectionByteReadAuthority06, NativeSectionByteAdmissionResult06 } from './sectionbytes/types.js';
export type * from './sectionbytes/types.js';
export type { AdmittedSectionReadRequest06, WholeSectionSnapshot06, SectionSignaturePolicy06 } from './sections/types.js';
export declare function createNativeSectionByteReadAuthority(callback:(context:Readonly<NativeSectionByteAuthorityContext06>)=>boolean|Promise<boolean>,signaturePolicy?:SectionSignaturePolicy06):NativeSectionByteReadAuthority06;
export declare function admitSectionBytesNode(input:Uint8Array,request:AdmittedSectionReadRequest06,authority:NativeSectionByteReadAuthority06):Promise<NativeSectionByteAdmissionResult06>;
