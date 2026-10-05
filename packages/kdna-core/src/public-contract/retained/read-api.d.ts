import type { TrustedHostReadProvider } from '@aikdna/kdna-core';
import type { WholeSectionSnapshot06, CatalogSectionSnapshot06, RetainedSectionRequest06, RetainedSectionPreparationData06, RetainedSectionHostObservation06, RetainedSectionReadCallResult06, PreparedRetainedSectionRead06 } from '@aikdna/kdna-core/retained-sections-node';
export type { RetainedSectionReadCallResult06, RetainedSectionHostObservation06 } from '@aikdna/kdna-core/retained-sections-node';
export type RetainedSectionHostCallbacks06 = { observe(context: { readonly request: RetainedSectionRequest06; readonly snapshot: WholeSectionSnapshot06 | CatalogSectionSnapshot06; readonly preparation: RetainedSectionPreparationData06 }): RetainedSectionHostObservation06 | Promise<RetainedSectionHostObservation06>; deliver?(result: RetainedSectionReadCallResult06): boolean | Promise<boolean> };
export declare function createTrustedHostReadProvider(callbacks: RetainedSectionHostCallbacks06): TrustedHostReadProvider;
export declare function readRetainedSection(prepared: PreparedRetainedSectionRead06, host: TrustedHostReadProvider): Promise<RetainedSectionReadCallResult06>;
