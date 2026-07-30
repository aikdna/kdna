# Judgment Payload Profile

Profile ID: `kdna.payload.judgment`

Profile coordinate: `0.1.0`

Encoding: strict CBOR in `payload.kdnab`

The normative schema is
[`schema/payload-profile.schema.json`](../../schema/payload-profile.schema.json).
At minimum, a payload declares the profile, profile coordinate, and at least
one non-empty `core.axioms` judgment. It also identifies its scope through a
highest question, judgment role, boundary, or axiom applicability condition.
`core.highest_question` is optional for Core format validity.

The profile can carry scoped `worldview`, `value_order`, `judgment_role`,
axioms, boundaries, `core_structure` relations, patterns, scenarios, cases,
self-checks, and failure modes. These fields are judgment content. Loaders
preserve selected declared values and their ordering; they do not trim,
normalize, score, or invent them.

The established `core_structure` shape requires `from`, `to`, and `via`,
permits only the documented public relation fields, and limits `via` to
`priority` or `exception`. The current Creation Writer emits only accepted
relations in that closed set. Local `compact` projection preserves relation order and the closed
public shape; unknown properties are schema-invalid rather than a channel for
private authoring state. Prompt projection renders only the public endpoints
and relation value. `full` preserves the complete schema-valid Payload.
Remote projection remains governed by its separate non-extraction contract.

The profile does not define how judgment is extracted from books, experts, or
other source material. It defines the interoperable result after an authoring
process has produced a payload.

An official Creation Writer follows a stricter output profile: it explicitly
declares `highest_question`, `worldview`, ordered `value_order`,
`judgment_role`, and global boundaries. That authoring rule does not make the
fields universal Core requirements. See
[Creation Output Boundary](../../specs/creation-output-boundary.md).

Encryption changes the envelope around payload bytes, not the semantic payload
profile after authorized decryption.
