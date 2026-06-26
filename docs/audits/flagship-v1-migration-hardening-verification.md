# Flagship v1 Migration Hardening Verification

**Date:** 2026-06-18

**Scope:** source, local tarball, and npm-registry verification after the Studio v1 export hardening pass.

**Repos involved:**

- `kdna-studio-cli`
- `kdna-studio-core`
- `kdna-cli`
- `kdna-writing`
- `kdna-prompt_diagnosis`
- `kdna-agent_safety`

---

## Verdict

The previous real-asset fidelity blocker is materially improved in local source verification.

All three flagship source repos now migrate through:

```bash
kdna-studio migrate <source> --format v1 --out <asset.kdna>
kdna validate <asset.kdna>
kdna load <asset.kdna> --profile=compact --as=json
kdna load <asset.kdna> --profile=full --as=json
```

with:

- `overall_valid: true`
- legal v1 `asset_id`
- `checksums.json` present and verified
- source manifest metadata preserved in v1 manifest/source metadata
- authored cards preserved in `payload.source_cards`
- major runtime sections present in the full profile
- `quality_badge` and `registry` absent from v1 output
- compact prompt output renders object patterns as readable text, not
  `[object Object]`

This is now backed by source-tree verification, a local tarball clean-install
proof from `/tmp/kdna-clean-proof-2`, and an npm-registry clean-install
proof from `/tmp/kdna-registry-proof`.

It is still **not final public-launch proof** until final per-asset PASS reports,
README/release artifacts, MCP package evidence, website/docs reconciliation, and
issue reconciliation are complete.
Remaining launch work:

- update or supersede per-asset fidelity reports with PASS evidence
- re-run MCP/skills consumption against npm-registry migrated assets
- update public docs and website after release artifacts are accepted

---

## Commands Run

```bash
node <workdir>/kdna-studio-cli/bin/kdna-studio.js migrate \
  <workdir>/kdna-writing \
  --out /tmp/kdna-v1-flagships/writing.kdna \
  --name @aikdna/writing \
  --by kdna-team \
  --statement "v1 flagship migration verification" \
  --format v1

node <workdir>/kdna-studio-cli/bin/kdna-studio.js migrate \
  <workdir>/kdna-prompt_diagnosis \
  --out /tmp/kdna-v1-flagships/prompt_diagnosis.kdna \
  --name @aikdna/prompt_diagnosis \
  --by kdna-team \
  --statement "v1 flagship migration verification" \
  --format v1

node <workdir>/kdna-studio-cli/bin/kdna-studio.js migrate \
  <workdir>/kdna-agent_safety \
  --out /tmp/kdna-v1-flagships/agent_safety.kdna \
  --name @aikdna/agent_safety \
  --by kdna-team \
  --statement "v1 flagship migration verification" \
  --format v1

node <workdir>/kdna-cli/src/cli.js validate /tmp/kdna-v1-flagships/<asset>.kdna
```

Additional local verification after prompt-render hardening:

```bash
npm test
# in <workdir>/kdna-studio-cli
# 18/18 pass

npm test
# in <workdir>/kdna-studio-core
# 128/128 pass

npm test
# in <workdir>/kdna
# core smoke, kdna-core, kdna-eval, and cli-v1 all pass
```

Local tarball clean-install proof:

```bash
npm pack --pack-destination /tmp/kdna-pack-proof-2
# @aikdna/kdna-core@0.11.1
# @aikdna/kdna-studio-core@1.5.3
# @aikdna/kdna-studio-cli@0.5.2

npm install \
  /tmp/kdna-pack-proof-2/aikdna-kdna-core-0.11.1.tgz \
  /tmp/kdna-pack-proof-2/aikdna-kdna-studio-core-1.5.3.tgz \
  /tmp/kdna-pack-proof-2/aikdna-kdna-studio-cli-0.5.2.tgz \
  @aikdna/kdna-cli@0.25.0

./node_modules/.bin/kdna-studio migrate <flagship-source> --format v1 --out <asset.kdna>
./node_modules/.bin/kdna validate <asset.kdna>
./node_modules/.bin/kdna load <asset.kdna> --profile=compact --as=prompt
```

Result: `writing`, `agent_safety`, and `prompt_diagnosis` all exported from
the clean tarball environment, validated with `overall_valid: true`, loaded
as readable compact prompts, and exposed non-empty `core.boundaries`.

Npm registry clean-install proof:

```bash
cd /tmp/kdna-registry-proof
npm init -y
npm install \
  @aikdna/kdna-core@0.11.1 \
  @aikdna/kdna-cli@0.25.0 \
  @aikdna/kdna-studio-core@1.5.3 \
  @aikdna/kdna-studio-cli@0.5.2 \
  @aikdna/kdna@0.9.0

./node_modules/.bin/kdna-studio migrate <workdir>/kdna-writing \
  --format v1 \
  --out /tmp/kdna-registry-proof/out/writing.kdna \
  --name @aikdna/writing \
  --by aikdna-maintainers \
  --statement registry-clean-install-proof

./node_modules/.bin/kdna-studio migrate <workdir>/kdna-agent_safety \
  --format v1 \
  --out /tmp/kdna-registry-proof/out/agent_safety.kdna \
  --name @aikdna/agent_safety \
  --by aikdna-maintainers \
  --statement registry-clean-install-proof

./node_modules/.bin/kdna-studio migrate <workdir>/kdna-prompt_diagnosis \
  --format v1 \
  --out /tmp/kdna-registry-proof/out/prompt_diagnosis.kdna \
  --name @aikdna/prompt_diagnosis \
  --by aikdna-maintainers \
  --statement registry-clean-install-proof

./node_modules/.bin/kdna validate /tmp/kdna-registry-proof/out/<asset>.kdna
./node_modules/.bin/kdna load /tmp/kdna-registry-proof/out/<asset>.kdna --profile=compact --as=prompt
./node_modules/.bin/kdna load /tmp/kdna-registry-proof/out/<asset>.kdna --profile=full --as=json
```

Result: `writing`, `agent_safety`, and `prompt_diagnosis` all exported from
public npm packages, validated with `overall_valid: true`, loaded as readable
compact prompts, and preserved non-empty full-profile runtime sections.

---

## Validation Results

All three assets returned:

```json
{
  "format_valid": true,
  "schema_valid": true,
  "payload_valid": true,
  "checksums_valid": true,
  "load_contract_valid": true,
  "overall_valid": true,
  "problems": []
}
```

---

## Full Profile Counts

| Asset | asset_id | checksums | axioms | boundaries | patterns | scenarios | cases | self_checks | failure_modes | evolution_stages | source_cards |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| writing | `kdna:aikdna:writing` | yes | 4 | 10 | 17 | 2 | 2 | 5 | 3 | 3 | 35 |
| prompt_diagnosis | `kdna:aikdna:prompt_diagnosis` | yes | 3 | 8 | 15 | 2 | 1 | 5 | 2 | 3 | 30 |
| agent_safety | `kdna:aikdna:agent_safety` | yes | 3 | 8 | 14 | 2 | 1 | 5 | 2 | 3 | 29 |

---

## Compact Profile Checks

The compact profile now contains more than axiom one-liners:

| Asset | compact axioms | compact boundaries | compact self_checks | compact failure_modes | compact patterns |
|---|---:|---:|---:|---:|---:|
| writing | 4 | 10 | 5 | 3 | 3 |
| prompt_diagnosis | 3 | 8 | 5 | 2 | 3 |
| agent_safety | 3 | 8 | 5 | 2 | 3 |

The compact prompt rendering was also checked against the three migrated
assets. The previous object coercion symptom (`[object Object]`) is no longer
present in local source verification.

---

## Remaining Fidelity Notes

The export now preserves all imported source cards in `payload.source_cards`, and exposes the main runtime sections.

Known remaining fidelity review points:

- `core.boundaries` is now populated from axiom applicability, ontology
  boundaries, and stance applicability. The per-asset reports still need to
  confirm whether this derived boundary representation is release-grade for
  each domain.
- Source `judgment_version` values such as `2026.05` are normalized to schema-valid semver-like values such as `2026.05.0`.
- Source `asset_type` is preserved as `source_asset_type`; v1 `asset_type` is normalized to schema enum value `domain`.
- `lineage.type` uses schema-valid `adaptation` with `source_lineage_type: "migrated"` because current v1 schema does not allow `"migrated"` as a lineage type.

These are acceptable for v1 launch evidence and are called out in the updated per-asset PASS reports.

---

## Regression Tests Added

`kdna-studio-core`:

```bash
node --test --test-name-pattern 'validateProject accepts every Studio card type' tests/core.test.js
```

Result: pass.

`kdna-studio-cli`:

```bash
node --test --test-name-pattern 'migrate --format v1 maps scoped name' tests/cli.test.js
```

Result: pass.

---

## Current Test Status

- `kdna-studio-cli npm test`: 18/18 pass.
- `kdna-studio-core npm test`: 128/128 pass.
- `kdna npm test`: core smoke, kdna-core, kdna-eval, and cli-v1 all pass.

Remaining launch evidence is no longer blocked by known local test failures,
tarball clean-install failure, npm packaging, or npm registry clean-install
failure. The following package versions are published and used in registry
proof:

1. `@aikdna/kdna-core@0.11.1`
2. `@aikdna/kdna-studio-core@1.5.3`
3. `@aikdna/kdna-studio-cli@0.5.2`
4. `@aikdna/kdna@0.9.0` compatibility package

Remaining launch closure is now:

- update or supersede the pre-hardening per-asset fidelity reports with PASS reports
- publish/prove MCP package path if needed
- update flagship domain READMEs and release artifacts
- finish website/public docs reconciliation
- reconcile issues
