import type { AdmittedSectionReadRequest06 } from '../sections/types.js';
import type { NativeBrowserSectionByteReadAuthority06, NativeBrowserSectionByteAdmissionResult06 } from './types.js';
export declare function admitSectionBytesBrowser(input:Uint8Array,request:AdmittedSectionReadRequest06,authority:NativeBrowserSectionByteReadAuthority06):Promise<NativeBrowserSectionByteAdmissionResult06>;
