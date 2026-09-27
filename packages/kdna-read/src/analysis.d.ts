import type { AssetIdentity, ReadEnvelope, ReadEnvelopeReady, Selection, VersionTuple, IRReadNode, Dependency } from '@aikdna/kdna-core';

export interface ReadDataAuthority {
  readonly proof: 'data-only-not-new-acceptance';
  readonly input_validation: 'read-schema-shape-only';
  readonly identity: 'not_verified';
  readonly action_authorization: 'not_evaluated';
  readonly current_run_results: 'not_evaluated';
}
export type ReadAnalysisJSON = null | boolean | number | string | readonly ReadAnalysisJSON[] | { readonly [key: string]: ReadAnalysisJSON };
export interface ReadDependencySummary {
  readonly definition: Dependency;
  readonly required: boolean;
  readonly producer_definition_supplied: boolean;
  readonly producer_formation_rule_supplied: boolean | null;
  /** A static authored result is NOT a result evaluated for the current task. */
  readonly producer_static_result_declared: boolean | null;
  readonly current_run_result: 'not_evaluated';
}
export type ReadDataSummary = {
  readonly kind: 'read-data-summary'; readonly status: 'unavailable'; readonly read_status: ReadEnvelope['status'];
  readonly diagnostics: ReadEnvelope['diagnostics']; readonly authority: ReadDataAuthority;
} | {
  readonly kind: 'read-data-summary'; readonly status: 'summarized'; readonly asset: AssetIdentity; readonly tuple: VersionTuple; readonly selection: Selection | null;
  readonly scope: { readonly kind: 'selected-closure' | 'selection-not-supplied' | 'unselected-catalog-or-declarations'; readonly dependency_inventory: 'disclosed-only'; readonly closure_node_count: number; readonly expansion_available: boolean; readonly supplied_judgment_ids: readonly string[] };
  readonly judgments: readonly { readonly judgment_id: string; readonly question: string; readonly formation_rule_supplied: boolean; readonly static_result_declared: boolean; readonly current_run_result: 'not_evaluated' }[];
  readonly dependencies: readonly ReadDependencySummary[];
  readonly shared_declarations: readonly Omit<IRReadNode, 'id'>[];
  readonly authorship_and_authority_claims: { readonly nodes: readonly Omit<IRReadNode, 'id'>[]; readonly provenance: Pick<ReadEnvelopeReady['content']['provenance'], 'confirmation' | 'verifier_id' | 'evidence_ref'>; readonly declarer_links: string; readonly interpretation: string };
  readonly missing: ReadEnvelopeReady['content']['missing'];
  readonly supplied_role_counts: Readonly<Record<string, number>>;
  readonly authority: ReadDataAuthority;
};
export interface ReadDataChanges {
  readonly changed: boolean;
  readonly changes: readonly { readonly key: string; readonly kind: 'added' | 'removed' | 'changed'; readonly before: ReadAnalysisJSON; readonly after: ReadAnalysisJSON }[];
}
export interface ReadSelectionComparison {
  readonly kind: 'read-selection-data-comparison'; readonly status: 'compared'; readonly comparison_scope: 'supplied-selected-content-only';
  readonly selection: { readonly asset_id: string; readonly judgment_id: string };
  readonly input_bindings: { readonly before: Pick<ReadEnvelopeReady, 'asset' | 'tuple' | 'snapshot_id' | 'request_id' | 'digests' | 'receipt' | 'budget'>; readonly after: Pick<ReadEnvelopeReady, 'asset' | 'tuple' | 'snapshot_id' | 'request_id' | 'digests' | 'receipt' | 'budget'> };
  readonly domain_content: ReadDataChanges; readonly shared_declarations: ReadDataChanges;
  readonly metadata: ReadDataChanges & { readonly interpretation: string; readonly review_required: boolean };
  /** changed=null means the known supply shape matches but omitted opaque source identities cannot be compared. */
  readonly supply_scope: { readonly changed: boolean | null; readonly observed_shape_changed: boolean; readonly before: ReadAnalysisJSON; readonly after: ReadAnalysisJSON; readonly unresolved_targets: { readonly before: number; readonly after: number }; readonly opaque_target_equivalence: 'not-established' | 'not-applicable' };
  readonly comparison_rules: { readonly node_identity: string; readonly values: string; readonly references: string; readonly metadata_roles: readonly string[]; readonly shared_roles_when_owner_null: readonly string[]; readonly metadata_is_harmless: false; readonly unchanged_domain_implies_behavioral_equivalence: false; readonly envelope_observations: string; readonly behavioral_equivalence: 'not-evaluated' };
  readonly authority: ReadDataAuthority;
}
/** Clones and shape-checks a current formal Read envelope; no new admission or authorization is granted. */
export declare function summarizeRead(envelope: ReadEnvelope): ReadDataSummary;
/** Same asset/tuple/selected source judgment only; versions may differ. Unselected/absent closures and ambiguous source identity throw coded errors. */
export declare function compareReadSelections(before: ReadEnvelope, after: ReadEnvelope): ReadSelectionComparison;
