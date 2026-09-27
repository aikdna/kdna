# Public static policy 2.0.0

Definition digest: `sha256:c3f8aec755b58fe98deb201ce5b9f30cd729e1b10bf636608b87e863f6c7cf92`. Generated from the unique public semantic source. Static rules are not execution results. Historical [/1](static-policy.md) is retained unchanged and is not accepted by this R2 binding.

Native R2 binding (part of the definition digest):

```json
{
  "owner": "actual R2 Judgment with form.term=rule and complete focus, answer_kind, method, core_expression, ports and result contract",
  "formation_rule_condition_refs": "required explicit empty array",
  "formation_rule_policy": "must be absent; exclusive with native ConditionalPolicy",
  "module_scope": "Candidate/entry keys and complete interpreted conditions are module-local. They do not create native R2 Ref targets or relax P.conditions/Ref/ConditionalPolicy requirements.",
  "projection": "IRNode_judgment.static_policy_interpretation",
  "projection_ownership": "Core-derived typed node field, never authored Judgment input or node.value field",
  "selected_body": "Complete interpretation is mandatory judgment body, with original authored_rule, normalized rule, actual owner and all digests retained. Exact selection and expansion apply Host gates and final complete-body budget; rejection never truncates the body.",
  "deferred_body": "whole_asset and catalog retain R2 deferred body rules, with later lawful exact_selection and expand retrieving complete interpretation",
  "migration": "Carrier /2 adaptation is not native ConditionalPolicy migration. Native migration requires explicit condition/Ref/priority/unknown/fallback equivalence evidence."
}
```

1. H is SHA-256 of existing canonicalJson UTF-8 bytes with sha256: prefix. D binds this complete definition, including types and limits. The public registry is fixed and not caller configurable.

2. Exactly one opt-in carrier may occur at the actual owning Judgment.extensions position. It must be critical and match id, definition, contract id/version and D. Unknown critical semantics reject. Noncritical arbitrary data is never interpreted.

3. An opt-in requires a complete R2 rule judgment and the same owner's formation_rule. formation_rule.condition_refs must be explicitly empty; nonempty refs reject and are never erased, moved into scope, conjoined with module entries or overridden. formation_rule.policy must be absent. Every module entry expresses its complete interpreted condition within this module's scope; this exception does not relax native R2 condition or Ref rules. All R2 formalization and actual result-contract requirements remain mandatory.

4. rule.output_contract_ref equals both the owning result_contract.id and formation_rule.output_contract_ref. Every candidate result_type/value obeys that result contract's type, shape and cardinality. Candidates are possible declared outcomes, never already formed Result or runtime IssueResult.

5. Only priority strategy with explicit higher-first or lower-first direction and interpreted conditions is supported. Priority means first-matching-priority and selects at most one candidate, never all matching candidates. Traverse entries in the explicit direction. An entry whose condition is true may determine the candidate only when every earlier condition is explicitly false. If multiple conditions are true, only the earliest qualifying true entry determines the candidate. An earlier unknown or unevaluated condition blocks later candidates: it is never treated as false or skipped. Unknown strategy or condition kind rejects. Priority values are unique safe unsigned integers; array order is not priority. These are shared static interpretation rules, not execution: Core and Read do not evaluate conditions or choose a candidate.

6. Candidate and entry keys are unique within their respective lists. Candidate references and candidate fallback resolve locally. Duplicate keys, dangling references, wrong owner and malformed declarations reject. Fallback applies only when every entry condition is explicitly false; unknown or unevaluated conditions do not permit fallback. Fallback is either one declared candidate or explicit no_match with authored explanation; omission is not an implicit fallback. A true entry preceding an unknown later entry still determines the single candidate when all entries preceding that true entry are false. Declaring these cases does not claim that any conditions have actually been evaluated.

7. Names, meanings, condition statements and no_match explanations are nonempty scalar Unicode with no surrounding whitespace and exact UTF-8 limits. Canonical rule content and aggregate limits reject without truncation. Original arrays and full rule are retained; normalized candidates sort by key and entries by explicit priority direction.

8. rule_digest is H(authored rule). declaration_digest is H(complete decoded carrier). Core supplies the complete typed interpretation at IRNode_judgment.static_policy_interpretation, outside the authored value. It is mandatory selected-judgment body, including authored_rule, normalized rule, owner and digests. Read exact_selection and expand retain it in full and account for all required content, references, conditions and results under final-envelope budget and current Host gates; reject rather than truncate. whole_asset/catalog follow R2 deferred-body rules. No independent static_policy Ref target, Reader decoder, guessed branch relation, evaluator, action permission or runtime result is introduced.

9. Absence of this module does not imply an invalid simple assertion or require every judgment to have rules. Formal creation separately binds authored entries, candidates, strategy and fallback to its actual selected candidate and saved-byte evidence. Static hashes do not prove truth, identity or editorial approval.

10. Only critical kdna.static-policy/2 at its actual owner with this version and definition digest adopts this definition. Old /1 carriers, old definition digests, mixed identities and tampered declarations reject in the new tuple; no renaming, skipping or inferred migration is permitted. This carrier binding does not claim that migration to native R2 ConditionalPolicy has occurred.
