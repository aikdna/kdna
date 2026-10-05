import type { TrustedHostReadProvider } from '@aikdna/kdna-core';
import type { WholeSectionSnapshot06, RetainedSectionRequest06, RetainedSectionPreparationData06, RetainedSectionReadCallResult06, PreparedRetainedSectionRead06 } from '@aikdna/kdna-core/retained-sections-node';
export type { RetainedSectionReadCallResult06, RetainedSectionHostObservation06 } from '@aikdna/kdna-core/retained-sections-node';
export type RetainedSectionBrowserObserveJson = (context: { readonly request: RetainedSectionRequest06; readonly snapshot: WholeSectionSnapshot06; readonly preparation: RetainedSectionPreparationData06 }) => string | Promise<string>;
export declare function createTrustedHostReadProviderJson(observeJson: RetainedSectionBrowserObserveJson, deliver?: (result: RetainedSectionReadCallResult06) => boolean | Promise<boolean>): TrustedHostReadProvider;
// The original shared brand is preserved; unsupported catalog-origin preparation is consumed/closed with body-free READ_SNAPSHOT_UNATTESTED transport.
export declare function readRetainedSection(prepared: PreparedRetainedSectionRead06, host: TrustedHostReadProvider): Promise<RetainedSectionReadCallResult06>;
