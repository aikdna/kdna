# Public static policy 1.0.0

Definition digest: `sha256:a28980e46f5f24a9a5190fcd380b813f996db307603620d3f2ab1a14ffb679bb`. Generated from the unique public semantic source. Static rules are not execution results.

1. H is SHA-256 of existing canonicalJson UTF-8 bytes with sha256: prefix. D binds this complete definition, including types and limits. The public registry is fixed and not caller configurable.

2. Exactly one opt-in carrier may occur at the actual owning Judgment.extensions position. It must be critical and match id, definition, contract id/version and D. Unknown critical semantics reject. Noncritical arbitrary data is never interpreted.

3. An opt-in requires the same owner's formation_rule. Its conditions must be explicitly empty in this version; nonempty conditions reject and are never erased, moved into scope, conjoined with entries or overridden. Every entry must express its complete condition. Ordinary judgments without opt-in retain existing meanings and may have nonempty formation conditions.

4. rule.output_contract_ref equals both the owning result_contract.id and formation_rule.output_contract_ref. Every candidate result_type/value obeys that result contract's type, shape and cardinality. Candidates are possible declared outcomes, never already formed Result or runtime IssueResult.

5. Only priority strategy with explicit higher-first or lower-first direction and interpreted conditions is supported. Priority means first-matching-priority and selects at most one candidate, never all matching candidates. Traverse entries in the explicit direction. An entry whose condition is true may determine the candidate only when every earlier condition is explicitly false. If multiple conditions are true, only the earliest qualifying true entry determines the candidate. An earlier unknown or unevaluated condition blocks later candidates: it is never treated as false or skipped. Unknown strategy or condition kind rejects. Priority values are unique safe unsigned integers; array order is not priority. These are shared static interpretation rules, not execution: Core and Read do not evaluate conditions or choose a candidate.

6. Candidate and entry keys are unique within their respective lists. Candidate references and candidate fallback resolve locally. Duplicate keys, dangling references, wrong owner and malformed declarations reject. Fallback applies only when every entry condition is explicitly false; unknown or unevaluated conditions do not permit fallback. Fallback is either one declared candidate or explicit no_match with authored explanation; omission is not an implicit fallback. A true entry preceding an unknown later entry still determines the single candidate when all entries preceding that true entry are false. Declaring these cases does not claim that any conditions have actually been evaluated.

7. Names, meanings, condition statements and no_match explanations are nonempty scalar Unicode with no surrounding whitespace and exact UTF-8 limits. Canonical rule content and aggregate limits reject without truncation. Original arrays and full rule are retained; normalized candidates sort by key and entries by explicit priority direction.

8. rule_digest is H(authored rule). declaration_digest is H(complete decoded carrier). Core supplies one typed owned static_policy IR node and exact selection includes it as mandatory. Read uses that same node with full final-envelope budget and current Host gates; no Reader decoder, guessed branch relation, evaluator, action permission or runtime result is introduced.

9. Absence of this module does not imply an invalid simple assertion or require every judgment to have rules. Formal creation separately binds authored entries, candidates, strategy and fallback to its actual selected candidate and saved-byte evidence. Static hashes do not prove truth, identity or editorial approval.
