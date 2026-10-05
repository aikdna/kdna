import type { WholeSectionSnapshot06 } from './sections/types.js';
import type { RetainedSectionRequestAdmission06, AdmittedRetainedSectionRequest06, RetainedSectionRequest06, RetainedSectionAuthorityContext06, RetainedSectionReadAuthority06, RetainedSectionPreparationResult06, PreparedRetainedSectionRead06, RetainedSectionPreparationData06 } from './retained/types.js';
export type * from './retained/types.js';
export type { WholeSectionSnapshot06 } from './sections/types.js';
export declare function getRetainedSectionBrowserContract(): Readonly<{ id: 'kdna.retained-sections-browser'; version: '0.1.0-candidate'; definition_digest: string }>;
export declare function admitRetainedSectionRequestJson(requestJson: string): RetainedSectionRequestAdmission06;
export declare function inspectRetainedSectionRequest(request: AdmittedRetainedSectionRequest06): Readonly<RetainedSectionRequest06> | null;
export declare function createRetainedSectionReadAuthorityJson(callback: (context: Readonly<RetainedSectionAuthorityContext06>) => boolean | Promise<boolean>, signaturePolicyJson?: string): RetainedSectionReadAuthority06;
// This adapter resolves only the original native whole snapshot owner.
export declare function prepareRetainedSectionRead(snapshot: WholeSectionSnapshot06, request: AdmittedRetainedSectionRequest06, authority: RetainedSectionReadAuthority06): Promise<RetainedSectionPreparationResult06>;
export declare function inspectRetainedSectionPreparation(prepared: PreparedRetainedSectionRead06): Readonly<RetainedSectionPreparationData06> | null;
