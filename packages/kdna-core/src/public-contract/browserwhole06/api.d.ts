import type { AdmittedSectionReadRequest06, Request06_whole_asset } from '../sections/types.js';
import type { NativeBrowserSectionByteContract06, NativeBrowserSectionByteReadAuthority06, NativeBrowserSectionByteAuthorityContext06, NativeBrowserSectionByteAdmissionResult06 } from './types.js';
export type * from './types.js';
export type { AdmittedSectionReadRequest06 } from '../sections/types.js';
export declare function getNativeBrowserSectionContract(): Readonly<NativeBrowserSectionByteContract06>;
export declare function admitBrowserSectionRequestJson(text:string):AdmittedSectionReadRequest06;
export declare function inspectBrowserSectionRequest(token:AdmittedSectionReadRequest06):Readonly<Request06_whole_asset>|null;
export declare function createNativeBrowserSectionReadAuthority(callback:(context:Readonly<NativeBrowserSectionByteAuthorityContext06>)=>boolean|Promise<boolean>,policyJson?:string):NativeBrowserSectionByteReadAuthority06;
export declare function admitSectionBytesBrowser(input:Uint8Array,request:AdmittedSectionReadRequest06,authority:NativeBrowserSectionByteReadAuthority06):Promise<NativeBrowserSectionByteAdmissionResult06>;
