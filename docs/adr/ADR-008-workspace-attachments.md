# ADR-008: File-first workspace attachments

- **Status**: accepted
- **Date**: 2026-07-23
- **Deciders**: aikdna
- **Refs**: ADR-004, `docs/KDNA_PRODUCT_CONTRACT.md`, `docs/REGISTRY_IS_OPTIONAL.md`

## Context

A `.kdna` asset is a file. Saving a file, approving it for one workspace,
deciding that it applies to a task, authorizing its protected content, and
loading a Runtime Capsule are separate events. The existing package-store and
global-discovery commands collapse those events and cannot be the default
local-user model.

This decision freezes the first workspace attachment contract. It is a local
CLI/Host contract, not a KDNA container field, Core protocol extension,
registry, marketplace, or new repository.

## Decision

### Workspace authority

The only persistent authority for automatic consideration in a workspace is:

```text
<workspace>/.kdna/attachments.json
```

The first implementation creates only:

```text
.kdna/
├── attachments.json
├── assets/
│   └── sha256-<64 lowercase hex>.kdna
└── .gitignore
```

There is no fallback to `~/.kdna/packages`, no directory scan, no global
inheritance, and no merge between parent and child workspace records.

Given an explicit Host working directory, resolution checks that directory and
then its parents for the nearest `.kdna/attachments.json`. It stops before
crossing the explicit Host workspace root, the current user's home boundary,
or the filesystem root. No record returns `skip: no_approved_attachment`.

### Exact attachment record

`attachments.json` has this closed shape. Unknown top-level, attachment,
asset, scope, or history fields are rejected.

```json
{
  "document_type": "kdna.workspace-attachments",
  "schema_version": "0.1.0",
  "workspace": {
    "root_marker": ".kdna/attachments.json"
  },
  "attachments": [
    {
      "attachment_id": "att_0123456789abcdef01234567",
      "asset": {
        "id": "kdna:example:writing-style",
        "version": "1.0.0",
        "digest": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        "snapshot": "assets/sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef.kdna"
      },
      "state": "enabled",
      "role": "article-writing",
      "scope": {
        "kind": "workspace",
        "applies_to": ["draft", "rewrite", "headline"],
        "does_not_apply_to": ["fact-check", "code", "administration"]
      },
      "resolution_policy": "load_when_clear_ask_when_ambiguous",
      "approved_at": "2026-07-23T00:00:00.000Z",
      "update_policy": "explicit_switch_only",
      "history": [
        {
          "asset": {
            "id": "kdna:example:writing-style",
            "version": "0.9.0",
            "digest": "sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
            "snapshot": "assets/sha256-abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789.kdna"
          },
          "replaced_at": "2026-07-22T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

The fixed constraints are:

- `attachment_id` is `att_` plus 24 lowercase hexadecimal characters and is
  unique within the record.
- `asset.id` and `asset.version` come from Core inspection of the packaged
  asset. The record does not invent identity.
- `asset.digest` is SHA-256 over the exact packaged bytes.
- `asset.snapshot` is exactly the digest-derived relative path under
  `.kdna/assets/`; absolute paths, separators other than `/`, `..`, symlinks,
  and alternate names are rejected.
- `state` is `enabled` or `disabled`.
- `role` is a non-empty user-approved display and conflict boundary.
- `scope.kind` is `workspace`; both scope arrays contain unique, non-empty
  strings and may be empty.
- `resolution_policy` and `update_policy` have the single values shown above.
- Timestamps are UTC RFC 3339 strings. They record local actions and make no
  authorship or quality claim.
- `history` is an ordered stack of prior exact assets. `switch` appends the
  former active asset. `rollback` pops the newest entry. Snapshot files are not
  deleted automatically.
- Passwords, keys, tokens, authorization material, source paths, task content,
  and judgment content never enter the record.
- Any schema version other than `0.1.0` fails closed.

### Commands

The default local-user command table is:

| Command | Contract |
|---|---|
| `kdna attach <file>` | Validate one explicit regular `.kdna` file, preview identity and LoadPlan, obtain approval, and create an immutable workspace snapshot and enabled record. |
| `kdna attachments` | Show the current workspace record, exact digest, state, scope, and history without loading judgment content. |
| `kdna resolve --cwd <workspace> --task-file <file>` | Return the closed resolver JSON below. Task text is read from a bounded regular file, not argv. |
| `kdna disable <attachment-id>` | Atomically retain but exclude one attachment from future resolution. |
| `kdna enable <attachment-id>` | Atomically make one attachment eligible again; it does not force a load. |
| `kdna switch <attachment-id> <file>` | Validate and approve one explicit new file, snapshot it, push the prior asset to history, and atomically change the active asset. |
| `kdna rollback <attachment-id>` | Pop and restore the newest retained history entry without network access. |
| `kdna remove <attachment-id>` | Remove only the attachment relation. First-release removal does not delete snapshots. |

`attach`, `attachments`, and every mutation accept `--cwd <workspace>`.
`attach` accepts `--role <text>`, repeatable `--applies-to <text>`, repeatable
`--does-not-apply-to <text>`, and `--yes`. Without `--yes`, an interactive
terminal must confirm the preview. Non-interactive attachment without `--yes`
is rejected. Missing scope terms are allowed but resolve to `ask`, never an
automatic load. `switch` retains the approved role and scope and accepts
`--yes` under the same approval rule.

Existing explicit-file `validate`, `inspect`, `plan-load`, and `load` remain.
They do not resolve package names or global store entries in the new default
surface.

The following old default surfaces exit the help and dispatch table:
`available`, `match`, asset `install`, package `remove`, `update`, package
`list`, `registry`, and `setup`. The name `remove` now has only the workspace
attachment meaning above. No alias or parallel command preserves the old
global-store model.

Status and Host-install commands are not added in this decision. Host adapters
are enabled by each Host's own explicit installation mechanism.

### Exact resolver result

`resolve` emits one JSON object with this closed shape:

```json
{
  "document_type": "kdna.workspace-resolution",
  "schema_version": "0.1.0",
  "decision": "load",
  "reason_code": "single_approved_attachment_clearly_applies",
  "workspace_root": ".",
  "selected": {
    "attachment_id": "att_0123456789abcdef01234567",
    "asset_id": "kdna:example:writing-style",
    "version": "1.0.0",
    "digest": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "role": "article-writing"
  },
  "candidates": [
    {
      "attachment_id": "att_0123456789abcdef01234567",
      "asset_id": "kdna:example:writing-style",
      "version": "1.0.0",
      "digest": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      "role": "article-writing"
    }
  ],
  "authorization": "satisfied",
  "integrity": "verified"
}
```

`decision` is `load`, `ask`, `skip`, or `block`. `selected` is the candidate
object only for `load` and is otherwise `null`. `candidates` contains only
enabled candidates relevant to the decision. `workspace_root` is relative to
the Host-provided working directory and never an absolute path.
`authorization` is `satisfied`, `required`, or `not_checked`; `integrity` is
`verified`, `failed`, or `not_checked`.

The reason codes and decisions are fixed:

| Condition | Result |
|---|---|
| no record or no enabled attachment | `skip: no_approved_attachment` |
| unsupported or invalid attachment record | `block: attachment_schema_unsupported` |
| snapshot absent | `block: snapshot_missing` |
| snapshot bytes differ from the recorded digest | `block: snapshot_digest_mismatch` |
| non-regular snapshot, invalid container, or invalid LoadPlan | `block: asset_invalid` |
| protected load is not currently authorized | `block: authorization_required` |
| every candidate explicitly excludes the task | `skip: outside_scope` |
| scope is empty, unmatched, or internally ambiguous | `ask: ambiguous_scope` |
| multiple candidates apply or same-role candidates disagree | `ask: attachment_conflict` |
| adapter does not support resolver schema `0.1.0` | `block: adapter_incompatible` |
| exactly one approved candidate clearly applies | `load: single_approved_attachment_clearly_applies` |

Scope comparison is deterministic and model-free. Task and scope phrases are
Unicode strings normalized by trimming, collapsing whitespace, and
case-folding. A phrase matches only as a literal substring. A positive and
negative match for one attachment is ambiguous. Multiple positive candidates,
or positive and negative candidates with the same role, conflict. A single
positive candidate may load only when no same-role contradiction exists.
Resolvers do not rank, recommend, compose, or infer an unstated scope.

`load` is an eligibility result, not projection delivery. A Host that receives
`load` must visibly identify the selected attachment and then use the existing
Core `planLoad → authorize → load` path. `resolve` itself does not reveal a
projection.

### File safety, permissions, and atomicity

- Source and task inputs must be bounded regular non-symlink files. Asset
  validation, digesting, and copying use one opened descriptor and stable
  before/after identity and size checks.
- `.kdna/` and `.kdna/assets/` use mode `0700`; records, locks, temporary
  files, and snapshots use `0600` where the platform supports POSIX modes.
- Attach and switch write the validated bytes to a same-directory temporary
  file, fsync it, verify the digest, and rename it to the digest-derived name.
- Manifest mutations acquire one exclusive `.kdna/attachments.lock`, write a
  same-directory temporary record, fsync it, rename it atomically, fsync the
  parent directory where supported, and release the lock in `finally`.
- A crash before record rename leaves no enabled relation. A crash after
  snapshot rename may leave an unreferenced immutable snapshot, which has no
  authority and is safe to retain.
- Existing snapshots are reused only after regular-file and digest
  verification. A different file can never replace bytes at an existing
  digest path.
- Readers consume only a complete record and re-verify every enabled snapshot.
  Integrity or authorization failures do not delete or disable the relation.
- `.kdna/.gitignore` ignores `/assets/`, `/attachments.json`,
  `/attachments.lock`, and same-directory temporary files. The ignore file is
  the only workspace attachment file intended for version control by default.

## Consequences

- KDNA CLI owns the single reference implementation for attachment state and
  resolution.
- Studio, VS Code, MCP, and Host adapters must call or faithfully consume this
  contract; they must not create a second database or resolver.
- Skill and MCP layers are read-only for attachment relationships. They may
  resolve an explicit file or the current approved workspace record and must
  display adoption before projection delivery.
- New asset files, network availability, and global package state cannot
  silently change an attachment.
- Core container, LoadPlan, authorization, projection, and Runtime Capsule
  contracts remain unchanged.
