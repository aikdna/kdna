import type { CanonicalReadSnapshot } from './types.js';
import type { BrowserProtectedRequestAdmission, AdmittedBrowserProtectedRequest, BrowserProtectedRequest, BrowserProtectedAuthorityContext, BrowserProtectedReadAuthority, BrowserProtectedAdmissionResult, BrowserProtectedSnapshot, BrowserProtectedSnapshotData, BrowserProtectedOperation } from './protected-browser-contract/types.js';
export type * from './protected-browser-contract/types.js';
export declare function admitProtectedPayloadRequestJson(requestJson: string): BrowserProtectedRequestAdmission;
export declare function inspectProtectedPayloadRequest(request: AdmittedBrowserProtectedRequest): Readonly<BrowserProtectedRequest> | null;
export declare function createProtectedPayloadReadAuthorityJson(callback: (context: Readonly<BrowserProtectedAuthorityContext>) => boolean | Promise<boolean>, signaturePolicyJson?: string): BrowserProtectedReadAuthority;
// Consumes one genuine admitProtectedBrowser origin. No new decryption or physical read.
export declare function admitProtectedSectionBrowser(snapshot: CanonicalReadSnapshot, request: AdmittedBrowserProtectedRequest, authority: BrowserProtectedReadAuthority): Promise<BrowserProtectedAdmissionResult>;
export declare function inspectProtectedPayloadSnapshot(snapshot: BrowserProtectedSnapshot): Readonly<BrowserProtectedSnapshotData> | null;
export declare function bindProtectedPayloadRequest(operation: BrowserProtectedOperation, requestJson: string): BrowserProtectedRequestAdmission;
export declare function disposeProtectedSectionOperation(operation: BrowserProtectedOperation): void;
