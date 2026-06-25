# NPM Publish Prep Audit — T0 / T1 Findings

**Date**: 2026-06-25
**Author**: Local Claude session
**Scope**: Pre-publish verification for `@aikdna/kdna-core@0.13.4` and `@aikdna/kdna-cli@0.28.0`
**Status**: T0/T1 complete; tag strategy derived

---

## TL;DR

1. **The "npm 0.13.3 has old schema" claim is FALSE** — local and published schemas are byte-identical. The drift fix is still valuable as a forward guardrail, but it does **not** block this publish.
2. **All default install paths resolve to `latest` / `stable`** — no documentation routes a new user to `@beta`. Therefore the security + schema fixes **must ship to `stable/latest`**, not `beta`.
3. **Tag strategy**:
   - `@aikdna/kdna-core@0.13.4` → `latest` (patch; schema drift guardrail)
   - `@aikdna/kdna-cli@0.28.0` → `latest` (security fix to `load --has-password`; not breaking)
   - `@aikdna/kdna-studio-core@1.6.0` → `beta` (minor, large surface)
   - `@aikdna/kdna-studio-cli` → consider `0.6.6` patch on `latest` instead of `0.7.0` minor, if the only change is help text

---

## T0 — Schema Drift Verification

### Method
1. `npm pack @aikdna/kdna-core@0.13.3` → tarball
2. Extract to `/tmp/kdna-audit/extracted-0.13.3/package/`
3. `diff -q` against local `packages/kdna-core/schema/`

### Result — all 5 schemas byte-identical

```
load-plan.schema.json:           (no diff)
manifest.schema.json:            (no diff)
load-contract.schema.json:       (no diff)
checksums.schema.json:           (no diff)
payload-profile-v1.schema.json:  (no diff)
```

### Access enum comparison

Both local and 0.13.3 publish `enum: ["public", "licensed", "remote", null]` in `load-plan.schema.json`. **Identical**.

### Implication

The previously reported "0.13.3 contains the old schema" assumption is **falsified**.
This is good news for the publish (no user-visible drift to communicate), but the
forward-looking T13 (schema-drift-check.mjs in CI) **remains valuable** — it would
have caught any drift between local and the next release, which is the failure mode
the team is trying to prevent.

### Open follow-up

`load-plan.schema.json:79` has a second enum: `["minimal", "remote", "none"]`
(this appears to be a `payload_profile` enum, not `access`). The team should
confirm whether this is the canonical set before shipping 0.13.4 — if it has
also drifted in some other published version, the same fix applies.

---

## T1 — Default Install Path Audit

### Method
`rg` for `npm install|npx` of `@aikdna/kdna*` across all public entry points:
- `kdna/README.md`, `kdna/README.zh.md`
- `kdna/docs/*` (start-here, try-kdna, getting-started, etc.)
- `kdna-website/src/pages/*` (the live website)
- `kdna-website/RELEASE_STATUS.md`

### Result — every default path is `@aikdna/kdna-cli` with no tag

| File | Line | Command |
|---|---|---|
| `kdna/README.md` | 18 | `npm install -g @aikdna/kdna-cli` |
| `kdna/README.zh.md` | 125 | `npm install -g @aikdna/kdna-cli` |
| `kdna/docs/start-here.md` | 24 | `npm install -g @aikdna/kdna-cli` |
| `kdna/docs/try-kdna.md` | 6 | `npm install -g @aikdna/kdna-cli` |
| `kdna/docs/getting-started.md` | — | `npm install -g @aikdna/kdna-cli @aikdna/kdna-studio-cli` |
| `kdna-website/src/pages/home.js` | 13 | `npm install -g @aikdna/kdna-cli` |
| `kdna-website/src/pages/ecosystem.js` | 7 | `npm install -g @aikdna/kdna-cli @aikdna/kdna-studio-cli` |
| `kdna-website/RELEASE_STATUS.md` | — | `npm install -g @aikdna/kdna-cli` |
| `kdna-website/src/pages/domains.js` | 110 | `npm install -g @aikdna/kdna-cli` |

**Zero occurrences** of `@beta`, `@latest`, or pinned version numbers in the
default install commands. All paths resolve to npm's `latest` dist-tag = `stable`.

### Implication — fixes must reach `latest`

If `@aikdna/kdna-core@0.13.4` and `@aikdna/kdna-cli@0.28.0` are published
**only** to `beta`, then:

- The first command a new user runs (`npm install -g @aikdna/kdna-cli`)
  pulls **0.27.6** from `latest`, which still has the security bypass.
- The fix exists on npm but is unreachable by the documented install path.
- This is the "publish but unreachable" failure mode that erodes user trust.

**Conclusion**: the T16 security fix and any schema drift fix must be
**published to `latest`**, not `beta`. A `beta`-only release would require
also updating every install command above to `@aikdna/kdna-cli@0.28.0` or
`@beta` — which is a much larger change and still leaks the old version to
search engines / cache layers.

### Required follow-up — version drift in `status.md`

`kdna/docs/status.md:24` currently reads:
```
- **`kdna inspect`** — inspect local v1 `.kdna` containers (available via `npm install -g @aikdna/kdna-cli@0.27.6`)
```

After publishing `0.28.0`, this line **must** be updated to `0.28.0`,
otherwise the status page contradicts the README default install path.

### Out-of-scope install paths (audit noted, no action needed)

- `kdna/docs/releases/*.md` — historical release notes, pinning old versions
  is intentional and correct
- `kdna/docs/audits/*.md` — historical audits with `@aikdna/kdna-cli@0.25.x`
  references, also intentional
- `kdna/scripts/validate-ecosystem-manifest.js:142-143` — CI guard pinning
  `@aikdna/kdna-cli@0.26.1` as a legacy proof asset, intentional

---

## Decisions captured here (for the v2.1 work plan)

1. **kdna-core 0.13.4** → publish to `latest`
2. **kdna-cli 0.28.0** → publish to `latest` (security fix is not breaking;
   E2E must verify `plan-load --has-password` still works for planning and
   `load --password=<correct>` still decrypts)
3. **kdna-studio-core 1.6.0** → publish to `beta` (minor bump, large surface)
4. **kdna-studio-cli** → reconsider: prefer `0.6.6` patch on `latest` over
   `0.7.0` minor if the only change is help text. Avoid version-bumping a
   small fix.
5. **T13** is reframed: the goal is now **"prevent future drift"**, not
   "fix current npm schema drift" (because the latter does not exist).

---

## Test status

| Test | Status |
|---|---|
| Guardrail in kdna-cli (34 files) | ✅ 0 findings |
| Guardrail in kdna-studio-cli (5 files) | ✅ 0 findings |
| Guardrail in kdna-workpack (release-surface, 18 files) | ✅ 0 findings |
| `npm run test:all` on kdna main | ⏳ blocked on P0 merge |
| `e2e-password.test.js` | ⏳ blocked on P0 merge |
