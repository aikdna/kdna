// Generated from specs/public-semantic-source.json; do not edit.
import type { ReadAdmissionResult, AdmittedReadRequest, CanonicalReadSnapshot, ReadProjection, TrustedReadControlProvider } from '@aikdna/kdna-core';
export type * from '@aikdna/kdna-core';
export declare function admitReadRequest(candidate: unknown, controlProvider: TrustedReadControlProvider): ReadAdmissionResult;
export declare function project(request: AdmittedReadRequest, snapshot: CanonicalReadSnapshot): ReadProjection;
