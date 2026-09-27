// Generated from specs/public-semantic-source.json; do not edit.
import type { Manifest, Payload, CoreAdmissionRejected } from './types.js';
export type SourceMember = { name: string; type: 'file'; mode: number; bytes: Uint8Array };
export type SourceInventoryEntry = { name: string; type: 'file'; mode: number; size: number; sha256: string };
export type OpenedSource = { manifest: Manifest; payload: Payload; members: SourceMember[]; inventory: SourceInventoryEntry[]; artifact_digest: string };
export type SourceAccepted = { status: 'accepted'; source: OpenedSource; proof_limits: readonly string[] };
export declare function openSourceBytes(input: Uint8Array): SourceAccepted | CoreAdmissionRejected;
export declare function packSourceBytes(predecessorBytes: Uint8Array, edits: { manifest?: Manifest; payload?: Payload }): (SourceAccepted & { bytes: Uint8Array }) | CoreAdmissionRejected;
export type AuthoringWorkflowContract = { readonly id: 'kdna.authoring-workflow/2'; readonly version: '2.0.0'; readonly minimum_candidates: 1; readonly rules: readonly string[]; readonly definition_digest: string };
export declare function getAuthoringWorkflowContract(): AuthoringWorkflowContract;
