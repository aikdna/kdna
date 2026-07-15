# Judgment Payload Profile

Profile ID: `kdna.payload.judgment`

Profile coordinate: `0.1.0`

Encoding: strict CBOR in `payload.kdnab`

The normative schema is
[`schema/payload-profile.schema.json`](../../schema/payload-profile.schema.json).
At minimum, a payload declares the profile, profile coordinate,
`core.highest_question`, and `core.axioms`.

The profile can carry scoped `worldview`, `value_order`, `judgment_role`,
axioms, boundaries, patterns, scenarios, cases, self-checks, and failure modes.
These fields are judgment content. Loaders preserve validated values and their
ordering; they do not trim, normalize, score, or invent them.

The profile does not define how judgment is extracted from books, experts, or
other source material. It defines the interoperable result after an authoring
process has produced a payload.

Encryption changes the envelope around payload bytes, not the semantic payload
profile after authorized decryption.
