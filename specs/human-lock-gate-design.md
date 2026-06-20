# Human Lock Gate — Design & Implementation Plan

Version: 0.1
Status: Draft
Based on: `KDNA/specs/human-lock.md` (SPEC)

> Current boundary: this gate applies to Studio/review workflows that claim
> Human Lock or human confirmation. It does not make Human Lock a universal
> KDNA Core format-validity or creation requirement.

## 1. Objective

Transform the Human Judgment Lock from a documented principle into an enforceable gate across three enforcement points:
1. **Studio** — prevent export/publish of domains with judgment-class changes that lack Human Lock
2. **CLI** (`kdna publish`, `kdna dev pack`, `kdna diff`) — fail on judgment-class diff without lock
3. **Registry CI** — block PRs that contain judgment-class changes without lock evidence

## 2. Judgment-Class Diff Detection

### 2.1 Fields That Trigger Human Lock Requirement

Per `human-lock.md` § Fields Requiring Human Judgment Lock:

**★ Core (MUST enforce):**
- `axioms` — any add/remove/revise in KDNA_Core.json
- `value_order` — any reorder/add/remove in KDNA_Core.json
- `judgment_role` — any change to acts_as, does_not_act_as, responsibility
- `boundaries` — any change to what must not be done in KDNA_Patterns.json
- `risk_model` — any change to which errors cost the most
- `composition.policy.json` — any change to selection, priority, conflict, merge, or output rules

**○ Extended (SHOULD enforce for production):**
- `ontology` — concept boundary or trigger signal changes
- `frameworks` — steps or when_to_use changes
- `stances` — stance declarations or applicability changes
- `banned_terms` — any add/remove
- `aesthetic_preferences` — taste-based judgment changes

### 2.2 Diff Algorithm

```
function detectJudgmentClassChanges(previousVersion, currentVersion):
    changes = {
        hasJudgmentClassChange: false,
        affectedFields: [],
        requiresHumanLock: false
    }

    for each file in [KDNA_Core.json, KDNA_Patterns.json, ...]:
        prev = previousVersion[file]
        curr = currentVersion[file]

        diff = deepDiff(prev, curr, { ignoreFields: ['meta.updated', 'meta.version'] })

        for each change in diff:
            if change.path is in JUDGMENT_CLASS_FIELDS:
                changes.affectedFields.push({
                    file: file,
                    path: change.path,
                    type: change.type  // 'added' | 'removed' | 'modified'
                })

    changes.hasJudgmentClassChange = changes.affectedFields.length > 0
    changes.requiresHumanLock = changes.hasJudgmentClassChange

    return changes
```

### 2.3 Stable Serialization

To prevent false positives from key ordering:
- All JSON objects are sorted by key before comparison
- `stableStringify()` is used (already implemented in studio-core)
- Array order is preserved (axioms order matters for value_order)

## 3. Enforcement Points

### 3.1 Studio Gate

**Location**: `studio-core/src/project/index.js` → `saveProject()` / `exportProject()`

**Behavior**:
1. Before export, compare current project state against last published version
2. If `detectJudgmentClassChanges()` returns `hasJudgmentClassChange: true`:
   - Check `KDNA_Evolution.json > human_locks[]` for a recent lock matching the affected fields
   - If no Human Lock found: **BLOCK export** with clear error message listing affected fields
3. Error message format:
   ```
   Human Lock Required: The following judgment-class fields changed without a Human Judgment Lock:
     - KDNA_Core.json > axioms[2].full_statement (modified)
     - KDNA_Patterns.json > risk_model.high_cost_errors (modified)
   
   To unlock: review these changes and record a Human Lock in KDNA_Evolution.json,
   or run: kdna lock --project ./path/to/project
   ```

### 3.2 CLI Gate

**Location**: `kdna-cli` → `commands/publish.js`, `commands/pack.js`, `commands/diff.js`

**Behavior**:
1. `kdna diff <domain>`: Show judgment-class changes between versions, highlight which require Human Lock
2. `kdna publish <domain>`: Before publishing, run judgment-class diff detection; fail with exit code 3 if lock required but missing
3. `kdna dev pack <domain>`: Same check as publish; warn but allow (pack is development-only)

**Exit codes**:
- 0: No judgment-class changes, or changes properly locked
- 3: Judgment-class changes detected without Human Lock (BLOCK)
- 4: Judgment-class changes detected, lock present but expired or incomplete (WARN)

### 3.3 Registry CI Gate

**Location**: `kdna-registry/.github/workflows/validate.yml` (to be created)

**Behavior**:
1. On PR that modifies a domain's KDNA files:
   - Run `kdna diff --base main --head PR` for affected domains
   - If judgment-class changes detected without lock: **BLOCK merge** with CI comment
2. CI comment format:
   ```
   ⛔ Judgment Governance Block
   
   This PR changes judgment-class fields in @aikdna/domain-name:
     - axioms: 2 axioms modified
     - boundaries: 1 boundary added
   
   Human Judgment Lock required before merge.
   Record a lock via: kdna lock @aikdna/domain-name --reason "..."
   ```

## 4. Human Lock Record Format (in KDNA_Evolution.json)

```json
{
  "human_locks": [
    {
      "lock_id": "lock_writing_2026_05_24_001",
      "proposal_id": "prop_writing_2026_05_24_001",
      "locked_at": "2026-05-24T14:00:00Z",
      "locked_by": "human-identifier",
      "lock_type": "accept",
      "reason": "Revised axiom AX-002 to clarify that price objections include non-monetary cost objections.",
      "affected_files": ["KDNA_Core.json"],
      "affected_paths": ["axioms[1].full_statement"],
      "diff_summary": "Modified: 1 axiom full_statement. No boundary or risk_model changes."
    }
  ]
}
```

## 5. Implementation Phases

### Phase 2a (Week 5-6): Studio + CLI Diff Detection
- Implement `detectJudgmentClassChanges()` in `studio-core`
- Add judgment-class diff display to `kdna diff`
- Add Human Lock check to Studio export flow

### Phase 2b (Week 7-8): CLI Publishing Gate
- Implement `kdna publish` pre-flight Human Lock check
- Implement `kdna lock` command for recording Human Lock entries
- Add `--force` flag (with audit logging) for emergency overrides

### Phase 3 (Week 9-12): Registry CI Integration
- Create GitHub Actions workflow for judgment governance
- Add PR comment bot for lock requirements
- Implement staging-to-default graduation checks

## 6. Emergency Override Path

Per `human-lock.md` § Emergency Overrides:
- `kdna publish --force --reason "CRITICAL: <explanation>"` bypasses the lock check
- Emergency overrides are audited: logged with `event_type: "emergency_override"`
- Must be formally ratified within 72 hours

## 7. Success Criteria

- Studio: judgment-class changes without lock are blocked at export with clear error
- CLI: `kdna publish` returns exit code 3 on unlocked judgment-class changes
- Registry CI: PRs with unlocked judgment-class changes get blocked with explanatory comment
- Emergency override path exists but is audited and rare

---

*This design document references `KDNA/specs/human-lock.md` for the authoritative specification of which fields require Human Lock and the lock record format.*
