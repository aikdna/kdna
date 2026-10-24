# KDNA Authoring Guide — Writing Your First `author-input.json`

This guide covers the **current published CLI** (`@aikdna/kdna-cli@0.43.2`) `create`
command input format. It documents the admission rules the CLI actually enforces —
including several that are not in the JSON schema and were verified empirically.
A complete runnable minimal template is at
[`examples/author-input-minimal.json`](./examples/author-input-minimal.json) (2
judgments, ~10 KB).

For the published loading-line walkthrough (CLI 0.36.1), see
[Try KDNA](./try-kdna.md). For the 30-minute Studio-line guide, see
[30-minute authoring guide](./30-minute-authoring-guide.md).

## Quick start

```bash
mkdir my-first-asset && cd my-first-asset
npm init -y
npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.43.2
# Copy the minimal template, edit it, then:
npx --no-install kdna create author-input.json --output my-asset.kdna --allow-create
npx --no-install kdna inspect my-asset.kdna
npx --no-install kdna validate my-asset.kdna
npx --no-install kdna read my-asset.kdna --mode catalog --budget 1000000 --allow-read
```

**Install flags** — which are actually needed for the install itself vs. defense in depth:

| Flag | Needed? | What it does |
| --- | --- | --- |
| `--save-exact` | Recommended | Pins the exact version in `package.json` (no `^` drift) |
| `--ignore-scripts` | **Recommended** (security) | Skips any package lifecycle scripts; this package needs none |
| `--omit=optional` | **Required for the bound Host graph** | Prevents `cbor-extract` from being pulled in; the unbound package is rejected by the Host (see the [start-here](./start-here.md) note) |
| `--no-audit` / `--no-fund` | Optional | Suppresses registry advisory/funding requests; no functional effect |

## The three top-level keys

```json
{ "manifest": { ... }, "payload": { ... }, "members": [] }
```

| Key | What goes in it |
| --- | --- |
| `manifest` | **17 fields** — asset identity, version, creator, history |
| `payload` | **25 keys** — judgments and everything they reference |
| `members` | Attachments as base64; empty array `[]` for a text-only asset |

## Rule 1: Version alignment (four places must match)

The admission layer checks that these **four fields are identical**:

```
manifest.version            ─┐
manifest.judgment_version    ├─ all must be the same string (e.g. "1.0.0")
payload.asset.asset_version ─┤
payload.asset.judgment_version ─┘
```

Changing only one side is rejected with a generic `READ_CORE_INVALID`. Use full
semver (`"2.0.0"`, not `"2.0"`). When revising an existing asset with
`source-open`/`source-pack`, bump all four together.

## Rule 2: Method term → component role sequence templates

Each judgment has a `method` block. The `method.method.term` **determines the exact
ordered sequence of component roles**. Missing, extra, out-of-order or mismatched
roles are rejected. These are the verified templates:

| `term` | Required component `role` sequence (in order) |
| --- | --- |
| `interpretation` | `解读对象`, `解释关系` |
| `inference` | `判断前提`, `推导关系` |
| `tradeoff` | `候选方案`, `比较因素`, `取舍原则` |
| `criteria_comparison` | `判断标准`, `对照办法`, `归结办法` |
| `feeling` | `个人感受` |

Each component also carries `material_refs` (empty array `[]` is fine — but the
key **must be present**; omitting it is rejected).

## Rule 3: The other empirically verified admission rules

These were verified against CLI 0.43.2 / Core 0.37.9 and are **not** all visible in
the JSON schema (the schema allows things the admission layer rejects):

1. **`payload.asset` has no `asset_uid`** — only `asset_id`, `asset_version`,
   `judgment_version`. (The `asset_uid` lives in `manifest` only.)
2. **`payload.declarations`** uses exactly the keys `highest_question` and
   `boundaries` — not free-form names.
3. **`payload.attributions`** must use the closed shape
   `{"state":"provided","value":[{"role":"creator","actor_ids":[...],"statement":"..."}]}`.
4. **`payload.kernel.purpose`** uses `{"kind":"authored","statement":"..."}`
   (not `{"kind":"summary"}`).
5. **`payload.materials[].source_refs`** items are **plain identifier strings**
   (`["source:my-source"]`), not `{kind,id}` objects.
6. **`answer_kind`** must be in the enum: `determination`, `classification`,
   `evaluation`, `status`, `diagnosis`, `estimate`, `prediction`, `applicability`,
   `ranking`, `selection`, `adjustment`, `interpretation`, `stance`, `preference`,
   `guidance`, `composite`, `other`.
7. **`examples` are optional** (the official CLI example has `examples: []`), but
   if provided each must have the full shape including `title`, `context`,
   `adopted_judgments`, `application`, `results`, `source_refs`.
8. **Session input**: each stdin line to `kdna read --session` must be a complete
   ReadRequest **including the full 9-key `tuple`** (copy it from `kdna inspect`
   output's `tuple` field). A request without the tuple is rejected with
   `READ_INPUT_INVALID`.

## Boundary structure

Per-judgment `boundaries`:

```json
"boundaries": {
  "state": "provided",
  "value": [{
    "id": "boundary:my-judgment",
    "effect": "limit",
    "statement": "Applies to ...; does not apply when ...",
    "declared_by": "actor:my-actor",
    "applies_to": { "kind": "judgments", "judgment_refs": ["judgment:my-judgment"] },
    "exception_refs": []
  }]
}
```

Boundaries state the scope where the judgment holds. A judgment without a
boundary is weaker when an Agent cites it — the boundary travels with the
closure on every `exact_selection` read.

## Revision and conversion

- **Revise an existing asset**: first get the current digest with
  `kdna inspect existing.kdna` — the `digests.A.observed` field is the `--expected-a`
  value. Then:
  ```bash
  npx --no-install kdna source-open existing.kdna --expected-a sha256:<A-from-inspect> --allow-source > open-output.json
  # edit open-output.json's "edits" object, then:
  npx --no-install kdna source-pack existing.kdna --edits edits.json --expected-a sha256:<same-A> --output revised.kdna --allow-source
  ```
  The original file is never modified. Bump all four version fields in `edits`.
- **Convert 0.5 → 0.6**: same pattern — `inspect` first to get `--expected-a`.

## What `create` does NOT do

Technical validity is separate from authorship confirmation, adoption or action
authorization. A `saved` status means the bytes were written and admitted — it
does not certify content quality or grant any permission.
