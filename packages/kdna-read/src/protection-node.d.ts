// Generated protection Read facade.
import type { CanonicalReadSnapshot, CoreAdmissionCatalogOnly, ReadRequest, ReadCallResult, HostReadContextData, TrustedReadControlProvider } from '@aikdna/kdna-core';
import type { ProtectionOperation, ProtectionPreparedDelivery, ProtectedReadResult, ProtectedTransportCommitResult, ProtectedHostReadProvider } from '@aikdna/kdna-core/protection-node';
export type * from '@aikdna/kdna-core/protection-node';
export type ProtectedHostObservation = HostReadContextData & { readonly current_ms: number; readonly revoked?: boolean; readonly lift_denial?: boolean };
export type ProtectedHostObservationContext = { readonly request: ReadRequest; readonly snapshot: CanonicalReadSnapshot | CoreAdmissionCatalogOnly };
export type ProtectedHostCallbacks = { readonly observe: (context: ProtectedHostObservationContext) => ProtectedHostObservation | Promise<ProtectedHostObservation>; readonly deliver: (result: ReadCallResult, prepared: ProtectionPreparedDelivery) => boolean | Promise<boolean> };
export type TrustedProtectedTransport = { readonly observeScope: (context: ProtectedHostObservationContext) => ProtectedHostObservation | Promise<ProtectedHostObservation>; readonly commit: (result: ReadCallResult) => boolean };
export declare function createTrustedProtectedHostReadProvider(callbacks: ProtectedHostCallbacks): ProtectedHostReadProvider;
export declare function readProtectedNode(operation: ProtectionOperation, request: unknown, control: TrustedReadControlProvider, host: ProtectedHostReadProvider): Promise<ProtectedReadResult>;
export declare function commitProtectedTransport(operation: ProtectionOperation, prepared: ProtectionPreparedDelivery, transport: TrustedProtectedTransport): Promise<ProtectedTransportCommitResult>;
