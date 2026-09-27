// Generated from specs/public-semantic-source.json; do not edit.
import type { ReadCallResult } from '@aikdna/kdna-core';
import type { PackageSetDecision, PackageSetHandoffResult, PackageSetLocalFailure, PackageSetNodeDescriptor } from '@aikdna/kdna-core/package-set-node';
export type PackageReadContract = { readonly "descriptor": PackageSetNodeDescriptor; readonly "core_contract_digest": string; readonly "schema_id": string; readonly "schema_path": string; readonly "proof_limits": string };
export type PackageSetReadProviderConfig = { readonly "host_id": string; readonly "host_epoch": string; readonly "members": unknown; readonly "observeRead": (input: unknown) => unknown; readonly "sink"?: (result: ReadCallResult) => boolean };
declare const TrustedPackageReadProviderBrand: unique symbol;
export type TrustedPackageReadProvider = { readonly [TrustedPackageReadProviderBrand]: true };
declare const DeliveredPackageReadBrand: unique symbol;
export type DeliveredPackageRead = { readonly [DeliveredPackageReadBrand]: true };
export type PackageSetHandleRegistration = "none" | "registered";
export type PackageSetReadResult = { readonly "decision": PackageSetDecision | null; readonly "readResult": ReadCallResult | null; readonly "delivered": DeliveredPackageRead | null; readonly "local_failure": PackageSetLocalFailure | null; readonly "sink_invoked": boolean; readonly "sink_confirmed": boolean; readonly "registered_handles": number; readonly "registered_handle_ids": ReadonlyArray<string>; readonly "handle_registration": PackageSetHandleRegistration; readonly "host_closed": boolean; readonly "member_observations": number; readonly "reader_observations": number };
export declare function getPackageReadContract(): PackageReadContract;
export declare function createTrustedPackageReadProvider(config: PackageSetReadProviderConfig): TrustedPackageReadProvider;
export declare function readPackageSetNode(request: unknown, control: unknown, provider: unknown): Promise<PackageSetReadResult>;
export declare function sealPackageSetHandoff(deliveredToken: unknown, admittedPlan: unknown): PackageSetHandoffResult;
export declare function admitPackageSetHandoff(wire: unknown, deliveredToken: unknown, admittedPlan: unknown): PackageSetHandoffResult;
