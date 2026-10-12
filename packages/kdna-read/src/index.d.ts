// Generated from specs/public-semantic-source.json; do not edit.
import type { ReadAdmissionResult, AdmittedReadRequest, CanonicalReadSnapshot, ReadProjection, TrustedReadControlProvider } from '@aikdna/kdna-core';
export type * from '@aikdna/kdna-core';
export declare function admitReadRequest(candidate: unknown, controlProvider: TrustedReadControlProvider): ReadAdmissionResult;
export declare function project(request: AdmittedReadRequest, snapshot: CanonicalReadSnapshot): ReadProjection;
export type ModelViewName = 'body' | 'full';
export declare const MODEL_VIEW_CONTRACT: 'kdna.read.model-view/0.1.0';
export interface ModelViewOptions { readonly view?: ModelViewName; readonly mode?: string; }
export type ModelViewContent = Pick<ReadContent, 'declarations' | 'catalog' | 'selected' | 'closure' | 'references' | 'relationships' | 'missing' | 'provenance' | 'asset_capability'>;
export interface ModelViewFingerprint { readonly asset: AssetIdentity; readonly snapshot_id: Identifier; readonly request_id: Identifier; readonly attested?: { readonly A?: string; readonly C?: string; readonly E?: string }; readonly omitted: { readonly envelope: ReadonlyArray<string>; readonly content: ReadonlyArray<string> }; readonly recovery: { readonly view: 'full'; readonly mode?: string }; }
export interface ModelViewBody { readonly view_contract: 'kdna.read.model-view/0.1.0'; readonly view: 'body'; readonly status: 'ready' | 'catalog_only'; readonly fingerprint: ModelViewFingerprint; readonly content: ModelViewContent; }
export declare function projectModelView<T>(result: T, options?: ModelViewOptions): T | ModelViewBody;
