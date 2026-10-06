// Generated protected-browser definitions; schema validity is not authority.
import type { CanonicalReadSnapshot, CoreAdmissionCatalogOnly, CoreAdmissionRejected } from '../packages/kdna-core/src/public-contract/types.js';
import type { ProtectionDiagnostic, ProtectionRuntimeDescriptor, ProtectedSignaturePolicy, TrustedProtectionProvider } from '../packages/kdna-core/src/public-contract/protection-node.js';
export type ConsumerUnlockSelection = { readonly "slotIndex": number; readonly "slot": string; readonly "kdf_profile": "scrypt-sha256" | "argon2id"; };
export type ConsumerUnlockObservation = { readonly "kind": "consumer_unlock_observation"; readonly "proof": "observation_not_authority"; readonly "checked_at_ms": number; readonly "selection": ConsumerUnlockSelection; };
export type ProtectedBrowserInput = { readonly "bytes": Uint8Array; readonly "plaintextPayload": Uint8Array; readonly "observation": ConsumerUnlockObservation; readonly "signaturePolicy"?: ProtectedSignaturePolicy; };
export type ProtectedBrowserDisclosure = { readonly "slot_selection": ConsumerUnlockSelection; readonly "observation_not_authority": true; readonly "provenance": "host_supplied_triple"; };
export type ProtectedBrowserAccepted = { readonly "status": "accepted"; readonly "snapshot": CanonicalReadSnapshot; readonly "disclosure": ProtectedBrowserDisclosure; };
export type ProtectedBrowserCatalogOnly = { readonly "status": "catalog_only"; readonly "catalog": CoreAdmissionCatalogOnly; readonly "disclosure": ProtectedBrowserDisclosure; };
export type ProtectedBrowserCoreRejected = { readonly "status": "core_rejected"; readonly "stage": "container" | "manifest" | "payload" | "interpretation"; readonly "core": CoreAdmissionRejected; };
export type ProtectedBrowserFailed = { readonly "status": "protection_failed"; readonly "diagnostic": ProtectedBrowserDiagnostic; };
// The observation-phase codes are the reviewed family extension settled under
// D-CBPA-IMPL-3 (2026-10-06); the shared node codes keep their stages.
export type ProtectedBrowserDiagnostic = (ProtectionDiagnostic | { readonly "code": "PROTECTION_OBSERVATION_INVALID"; readonly "stage": "observation"; } | { readonly "code": "PROTECTION_OBSERVATION_BINDING_INVALID"; readonly "stage": "binding"; } | { readonly "code": "PROTECTION_NOT_DECLARED"; readonly "stage": "declaration"; });
export type ProtectedBrowserAdmissionResult = (ProtectedBrowserAccepted | ProtectedBrowserCatalogOnly | ProtectedBrowserCoreRejected | ProtectedBrowserFailed);
export declare function getProtectionContract(): ProtectionRuntimeDescriptor;
export declare function admitProtectedBrowser(input: ProtectedBrowserInput, provider: TrustedProtectionProvider): Promise<ProtectedBrowserAdmissionResult>;
