# KDNA Versioning Guide

When you publish a KDNA domain, versions matter. A careless version bump erodes trust; a disciplined one builds it.

## Version Numbers

KDNA uses [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`

| Bump | When | Example |
|------|------|---------|
| **PATCH** (0.1.0 → 0.1.1) | Fix typos, clarify wording, add examples. Judgment behavior unchanged. | `one_sentence` was "Trust matters" → "Trust is the buyer's confidence in your intent, not their comfort with your manner." |
| **MINOR** (0.1.0 → 0.2.0) | Add axiom, concept, misunderstanding, self-check, or framework. OR modify framework steps. May change agent judgment. | Add AX-003: "Price objections are certainty deficits." Add MS-004: misunderstanding about rapport vs trust. |
| **MAJOR** (0.1.0 → 1.0.0) | Remove or redefine a core axiom. Change domain scope. Change access mode (open → licensed). Breaking change. | Remove AX-002 entirely. Split "sales" domain into "b2b_sales" and "consumer_sales". |

### Decision Tree

```
Did you only fix wording/examples?
  → PATCH

Did you add or change judgment content (axioms, concepts, frameworks)?
  → MINOR

Did you remove or fundamentally redefine what the domain judges?
  → MAJOR
```

## Semantic vs Non-Semantic Changes

| Change | Semantic? | Bump |
|--------|:---------:|:----:|
| Fix a typo in `full_statement` | No | PATCH |
| Rewrite `full_statement` to be more operational | No | PATCH |
| Add a better `trigger_signal` | No | PATCH |
| Add a new misunderstanding (`MS-00X`) | Yes | **MINOR** |
| Add a new axiom (`AX-00X`) | Yes | **MINOR** |
| Change framework `steps` array | Yes | **MINOR** |
| Remove an axiom | Yes | **MAJOR** |
| Change domain scope (narrowing or broadening) | Yes | **MAJOR** |
| Change `access` mode (open → licensed/runtime) | Yes | **MAJOR** |

## Where Version Appears

A single version bump must update ALL of these:

1. **`kdna.json`** → `"version": "0.2.0"`
2. **Every KDNA JSON file meta** → `"version": "1.0-rc"` (spec version, not package version — see below)
3. **`CHANGELOG.md`** → New version entry
4. **`package.json`** (if npm package) → `"version": "0.2.0"`
5. **Registry** → Update `domains.json` entry when published

## Package Version vs Spec Version

KDNA has TWO version concepts:

| Concept | Field | Example | Changes when |
|---------|-------|---------|-------------|
| Package version | `kdna.json` → `version` | `"0.2.0"` | Domain content changes |
| Spec version | KDNA JSON files → `meta.version` | `"1.0-rc"` | KDNA protocol format changes |

The spec version in each KDNA JSON file refers to which version of the KDNA protocol the file follows — NOT the domain's content version. A domain at `0.2.0` can still use spec version `1.0-rc`.

## Version and Evaluation

Every version change that affects judgment (MINOR + MAJOR) MUST be re-evaluated:

```bash
# Before release, compare old vs new
kdna compare --before examples/my_domain_v1 --after examples/my_domain_v2
```

The `evaluation_history` in `domains.json` tracks this:
```json
{
  "version": "0.2.0",
  "eval_score": 85,
  "test_count": 4,
  "evaluated_at": "2026-06-01T00:00:00Z",
  "change_from_previous": "+5 (added AX-003)"
}
```

If a version change DEGRADES judgment, do not release — fix the regression first.

## Pre-Release Checklist

Before bumping and publishing:

- [ ] All files reference the correct `meta.version` (spec version)
- [ ] `kdna.json` `version` matches the new package version
- [ ] `kdna-lint` and `kdna-validate` pass
- [ ] `CHANGELOG.md` has an entry for this version
- [ ] If MINOR or MAJOR: re-run benchmark and record `evaluation_history`
- [ ] If MAJOR: notify existing users of breaking change
- [ ] No regression compared to previous version

## CLI Shortcut

```bash
# Bump version and run all checks
kdna version bump patch   # 0.1.0 → 0.1.1
kdna version bump minor   # 0.1.0 → 0.2.0
kdna version bump major   # 0.1.0 → 1.0.0

# Show version history
kdna version history examples/sales
```

(CLI implementation pending — currently manual)
