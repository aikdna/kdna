# Runtime Load Contract

> For the normative profile definitions, see [Load Profiles](./load-profiles.md).

The **load contract** is a manifest block that tells a loader **how** it may read the asset. It does not tell the loader **whether** to read it, or what to do with the result — those are runtime policy decisions.

The load contract lives under `manifest.load_contract`. The schema is part of [`schema/manifest.schema.json`](../../schema/manifest.schema.json).

## Load profiles

A load profile is a named reading strategy. The current contract defines four:

| Profile | Purpose | Typical use |
| --- | --- | --- |
| `index` | Read only the manifest and the asset's identity. | Routing, listing, deduplication. |
| `compact` | Read the manifest and a summary of the payload (axioms, boundaries, the central question). | Most agent invocations. |
| `scenario` | Read only the sections of the payload triggered by a given input. | Input-routed reading, large payloads. |
| `full` | Read the entire payload, all signatures, all attachments. | Editing, audit, deep reasoning, archival. |

Each profile declares three optional fields:

- `requires_decryption` (boolean): does this profile require a decryption key?
- `max_tokens_hint` (integer): a soft upper bound on tokens used by this profile. Loaders SHOULD use it as a hint, not a hard cap.
- `selection` (string): for `scenario`, describes the routing strategy (e.g. `"triggered_sections_only"`).
- `intended_for` (array of strings): free-form labels describing intended use (e.g. `["editing", "audit", "deep_reasoning"]`).

## Example contract

```json
{
  "load_contract": {
    "default_profile": "compact",
    "profiles": {
      "index": {
        "requires_decryption": false,
        "max_tokens_hint": 500
      },
      "compact": {
        "requires_decryption": false,
        "max_tokens_hint": 2500
      },
      "scenario": {
        "requires_decryption": false,
        "selection": "triggered_sections_only"
      },
      "full": {
        "requires_decryption": false,
        "intended_for": ["editing", "audit", "deep_reasoning"]
      }
    }
  }
}
```

In Phase 1, all profiles have `requires_decryption: false` because the example assets are plaintext. Future phases will add encrypted profiles that require the loader to supply a key.

## What the contract is NOT

- It is **not** a recommendation. KDNA Core does not say "you should use this profile for this task". Callers pick.
- It is **not** a quality claim. A profile is not "better" or "worse" than another; it is a different cost/benefit trade-off.
- It is **not** a security boundary. The contract is descriptive; the loader's policy enforces security.

## Loader behaviour

When the official KDNA loader opens a `.kdna` file, it MUST:

1. Read the manifest.
2. If `load_contract` is present, use the profile named in `default_profile` (or the caller-requested profile if different) to determine the reading strategy.
3. If the requested profile has `requires_decryption: true`, refuse to load without a key and emit a `requires_decryption` trace status.
4. If the requested profile's `max_tokens_hint` is exceeded by the actual content, the loader SHOULD emit a warning trace, not silently truncate. A compact projection MUST disclose every non-empty omitted payload path and count in its projection report; prompt rendering MUST carry the same disclosure.
5. Parse both the manifest's `compatibility.min_loader_version` and the loader
   package coordinate as strict `x.y.z` decimal triples. Leading zeros,
   prefixes, prerelease suffixes, build metadata, missing components, and
   whitespace are invalid. Compare arbitrary-size components without numeric
   truncation.
6. If the structurally valid manifest requires a loader coordinate higher than
   the current package coordinate, return a blocking LoadPlan with
   `KDNA_LOADER_VERSION_UNSUPPORTED`, emit `version_incompatible` Runtime
   evidence when a trace is produced, and refuse to load. This is not a
   format/schema failure.

`inspect` and `validate` report `loader_version`, `min_loader_version`, and
`loader_compatible`. `validate.overall_valid` remains the conjunction of the
five structural gates; callers that intend to load MUST use `planLoad` or a
load entry point to enforce implementation compatibility. The default asset
reader verification path also rejects an unsupported loader requirement.

The trace vocabulary is defined in `trace.md`.
