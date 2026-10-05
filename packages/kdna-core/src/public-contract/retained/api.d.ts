import type { WholeSectionSnapshot06, CatalogSectionSnapshot06, ScopedSectionSnapshot06, SectionSignaturePolicy06 } from './sections/types.js';
import type { RetainedSectionRequestAdmission06, AdmittedRetainedSectionRequest06, RetainedSectionRequest06, RetainedSectionAuthorityContext06, RetainedSectionReadAuthority06, RetainedSectionPreparationResult06, PreparedRetainedSectionRead06, RetainedSectionPreparationData06 } from './retained/types.js';
export type * from './retained/types.js';
export type { WholeSectionSnapshot06, CatalogSectionSnapshot06, ScopedSectionSnapshot06, SectionSignaturePolicy06 } from './sections/types.js';
export declare function admitRetainedSectionRequest(candidate: unknown): RetainedSectionRequestAdmission06;
export declare function inspectRetainedSectionRequest(request: AdmittedRetainedSectionRequest06): Readonly<RetainedSectionRequest06> | null;
export declare function createRetainedSectionReadAuthority(callback: (context: Readonly<RetainedSectionAuthorityContext06>) => boolean | Promise<boolean>, signaturePolicy?: SectionSignaturePolicy06): RetainedSectionReadAuthority06;
// ScopedSectionSnapshot06 is a recognized diagnostic input only; all its modes return origin_scope_insufficient in this first subarc.
export declare function prepareRetainedSectionRead(snapshot: WholeSectionSnapshot06 | CatalogSectionSnapshot06 | ScopedSectionSnapshot06, request: AdmittedRetainedSectionRequest06, authority: RetainedSectionReadAuthority06): Promise<RetainedSectionPreparationResult06>;
export declare function inspectRetainedSectionPreparation(prepared: PreparedRetainedSectionRead06): Readonly<RetainedSectionPreparationData06> | null;
