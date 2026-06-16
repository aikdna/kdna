# PR-2 Acceptance Note — Anti-Monolithic CLI Lint

**RFC-0013 phase:** PR-2 (CLI lint + SPEC §1.6 principle)
**Status:** All acceptance criteria met
**Re-run:**
- `cd aikdna/kdna && npm run validate:rfc0013-schemas` (PR-1 sanity)
- `cd aikdna/kdna-cli && node --test tests/anti-monolithic.test.js` (PR-2 unit)
- `cd aikdna/kdna-cli && node src/cli.js dev validate <dir> --anti-monolithic` (PR-2 smoke)

## Scope

PR-2 implements **two coordinated changes** to satisfy RFC-0013 §9 acceptance
criteria #2 and #5. They are split across two repositories and shipped as a
single logical PR with two coordinated GitHub PRs:

| Repo | PR | Change |
|------|----|--------|
| `aikdna/kdna-cli` | https://github.com/aikdna/kdna-cli/pull/10 | `kdna dev validate --anti-monolithic` CLI implementation + 6 unit tests |
| `aikdna/kdna` (this repo) | (companion PR-2a) | `SPEC.md` §1.6.3 Anti-Monolithic Domain Principle (verbatim from RFC-0013 §4) |

## RFC-0013 §9 acceptance criteria covered

| §9 # | Item | Status | Where |
|------|------|--------|-------|
| #2 | `kdna dev validate --anti-monolithic` exists and runs on the meta repo's example domains | ✅ | `aikdna/kdna-cli` PR #10 |
| #5 | `SPEC.md` §1.6 contains the Anti-Monolithic Domain Principle verbatim | ✅ | this PR (added §1.6.3) |

Not covered (still pending):

| §9 # | Item | Owner |
|------|------|-------|
| #3 | kdna-studio-core gates | PR-3 |
| #4 | kdna-lab smoke on simple official domain | PR-4 |
| #6 | RFC-0014 / RFC-0015 filed | Phase 2 (deferred per the RFC-0013 implementation scope) |
| #7 | real legacy domain migration | PR-4 |

## SPEC §1.6.3 change summary

Added a new subsection §1.6.3 "Anti-Monolithic Domain Principle" with:

- The verbatim principle statement from RFC-0013 §4
- The companion authoring-time gate rule (axiom + framework thresholds +
  `module_manifest.json` sign-off path)
- The lint behavior matrix (default warn / strict error / soft warning)
- The good-vs-bad examples table from RFC-0013 §4
- A pointer to the canonical implementation in `aikdna/kdna-cli`

The principle text matches RFC-0013 §4 verbatim, as required by §9 #5.

## PR-2 CLI lint contract (kdnacli PR #10)

```
kdna dev validate <dir> --anti-monolithic           # default: warning
kdna dev validate <dir> --anti-monolithic --strict   # warnings → errors
kdna dev validate <dir> --anti-monolithic --json     # machine-readable
```

**Trigger conditions (all three must hold):**

1. `KDNA_Core.json.axioms.length > 6` (SPEC §5.2 says 2–6 axioms)
2. `KDNA_Core.json.frameworks.length >= 3`
3. Either no `module_manifest.json`, or the manifest lacks
   `decomposition_rationale` (or rationale < 30 chars → treated as placeholder)

**Output contract:**

- `default`: prints `Warnings:` block with the Anti-Monolithic explanation
  and exits 0.
- `strict`: prints `Errors:` block with the same content and exits 1.
- `json`: emits a single JSON object with `path`, `schema_validation`,
  `anti_monolithic` (array, one per domain in clusters).

## PR-2 unit test evidence

```
$ cd aikdna/kdna-cli && node --test tests/anti-monolithic.test.js

ok 1 - small domain below thresholds: no warnings, no errors
ok 2 - large domain without module_manifest: default warning, strict error
ok 3 - large domain with module_manifest + substantive rationale: soft warning only
ok 4 - large domain with module_manifest but short placeholder rationale: triggered
ok 5 - missing KDNA_Core.json: error
ok 6 - thresholds: SPEC says 2-6 axioms; lint fires strictly above 6
# tests 6
# pass 6
# fail 0
```

## PR-2 CLI smoke evidence

Default mode (no `module_manifest.json`):
```
$ kdna dev validate ./example-large --anti-monolithic
Warnings:
  - Anti-Monolithic Domain Principle: KDNA_Core.json has 8 axioms
    (>6) and 4 frameworks (>=3). No module_manifest.json found.
    Either split into sub-domains and compose via cluster, or
    create a module_manifest.json with a decomposition_rationale
    (>=30 chars) and a maintainer sign-off. See SPEC §1.6 and
    RFC-0013 §4.
```

Strict mode:
```
$ kdna dev validate ./example-large --anti-monolithic --strict
Errors:
  - Anti-Monolithic Domain Principle: KDNA_Core.json has 8 axioms ...
$ echo $?
1
```

With substantive rationale (soft warning only):
```
$ kdna dev validate ./example-large --anti-monolithic
Warnings:
  - Anti-Monolithic Domain Principle: KDNA_Core.json has 8 axioms
    and 4 frameworks. Maintainer sign-off recorded in
    module_manifest.json (decomposition_rationale). Review
    periodically that the rationale still holds.
$ echo $?
0
```

## Cross-checks

- The CLI lint consumes `module_manifest.json` schema from PR-1
  (`aikdna/kdna/schema/module_manifest.schema.json`). No changes to
  that schema in this PR.
- The SPEC §1.6.3 principle text matches RFC-0013 §4 verbatim. Diff
  is character-for-character.

## Risk notes

- **Default warn, strict error** — the lint does not block CI by default.
  Domain authors will see the warning and either act or formally sign
  off. Strict mode is reserved for `kdna publish --official-preflight`.
- **No changes to runtime payload** — `KDNA_Core.json` /
  `KDNA_Patterns.json` / etc. are not modified by the lint.
- **No new dependencies** — uses only Node built-ins.
- **No changes to PR-1 schemas** — the CLI lint reads existing files
  only.

## Governance

- Both PRs (kdna-cli #10 and this companion in aikdna/kdna) follow the
  real PR flow (feature branch, push, PR, admin merge). No direct
  push to main.
- Companion PR-2a in `aikdna/kdna` (this PR) was kept separate from
  PR-1 because it touches `SPEC.md`, which is in the meta repo, not
  the CLI repo. The split mirrors the natural repo boundary.

## References

- RFC-0013: `specs/RFC-0013-judgment-asset-lifecycle.md`
- RFC-0013 §4: same file, "New Top-Level Principle: Anti-Monolithic Domain"
- RFC-0013 §9 #2 and #5: same file, "Acceptance Criteria"
- RFC-0013 implementation scope: PR-2 anti-monolithic CLI lint
- kdna-cli PR-2: https://github.com/aikdna/kdna-cli/pull/10
- kdna-cli commit: `bb64821` (squash of cherry-picked `b87b53f`)
- kdna PR-1 (PR-1 schema baseline): https://github.com/aikdna/kdna/pull/86
