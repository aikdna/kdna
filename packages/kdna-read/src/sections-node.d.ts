import type { ReadRequest06Candidate, SectionReadAuthority06, WholeSectionSnapshot06, SectionReadCallResult06 } from '@aikdna/kdna-core/sections-node';
import type { TrustedHostReadProvider, HostReadContextData, UInt } from '@aikdna/kdna-core';
export type { ReadRequest06Candidate, SectionReadCallResult06 } from '@aikdna/kdna-core/sections-node';
export type SectionHostObservation = (HostReadContextData & {readonly current_ms:UInt;readonly revoked?:boolean;readonly lift_denial?:boolean}) | import('@aikdna/kdna-core/sections-node').SectionHostObservation06;
export type SectionHostCallbacks = {observe(context:{readonly request:ReadRequest06Candidate;readonly snapshot:WholeSectionSnapshot06|import('@aikdna/kdna-core/sections-node').CatalogSectionSnapshot06|import('@aikdna/kdna-core/sections-node').ScopedSectionSnapshot06}):SectionHostObservation|Promise<SectionHostObservation>;deliver?(result:SectionReadCallResult06):boolean|Promise<boolean>};
export declare function createTrustedHostReadProvider(callbacks:SectionHostCallbacks):TrustedHostReadProvider;
export declare function readSectionNode(input:string,candidate:unknown,authority:SectionReadAuthority06,host:TrustedHostReadProvider):Promise<SectionReadCallResult06>;
