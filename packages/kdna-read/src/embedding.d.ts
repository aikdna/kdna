// Generated from specs/public-semantic-source.json; do not edit.
import type { TrustedReadControlProvider, TrustedHostReadProvider, HostReadContextData, UInt, ReadRequest, CanonicalReadSnapshot, ReadCallResult } from '@aikdna/kdna-core';
export type HostObservation = HostReadContextData & { readonly current_ms: UInt; readonly revoked?: boolean; readonly lift_denial?: boolean };
export type HostCallbacks = { observe(context: { readonly request: ReadRequest; readonly snapshot: CanonicalReadSnapshot }): HostObservation | Promise<HostObservation>; deliver?(result: ReadCallResult): boolean | Promise<boolean> };
export declare function createTrustedReadControlProvider(observe: () => { readonly admission_response_limit_bytes: UInt }): TrustedReadControlProvider;
export declare function createTrustedHostReadProvider(callbacks: HostCallbacks): TrustedHostReadProvider;
