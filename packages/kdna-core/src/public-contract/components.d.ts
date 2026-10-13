// Generated from specs/public-semantic-source.json; do not edit.
import type { ComponentSemanticsDescriptor } from './types.js';
export declare function getComponentSemanticsContract(): ComponentSemanticsDescriptor;
export declare function getNativeMethodRequirements(): { readonly definition_digest: string; readonly requirements: ReadonlyArray<{readonly term:string;readonly component_types:readonly string[];readonly binding_roles:readonly string[]}> };
export declare function getMethodRoleTable(): { readonly contract_id: string; readonly roles: Readonly<Record<string, {readonly required: readonly string[]; readonly optional: readonly string[]}>> };
