# Studio Export → v1 Container E2E Status — June 2026

## Verdict: BLOCKED

Studio (`kdna-studio migrate`) produces v2-format containers. The v1 Core format
(minimal manifest schema, JSON-encoded payload, v1 mimetype, checksums.json)
is not yet produced by Studio.

## What works

- kdna-cli v0.25.0: v1 pack/validate/load ✓
- @aikdna/kdna-core 0.11.0: digest matching ✓
- kdna-studio migrate: produces v2 .kdna containers (paylod.kdnab is CBOR, not
  JSON; manifest is v2 schema, not v1)

## Minimal proof (v1 path without Studio)

```bash
# Use a v1 source directory (the examples/minimal fixture)
kdna pack examples/minimal /tmp/minimal.kdna
kdna validate /tmp/minimal.kdna    # all gates pass, digest verified
kdna load /tmp/minimal.kdna --profile=compact --as=prompt   # clean text
```

This proves the **consumer side** (CLI → validate → load) is complete.
The **producer side** (Studio export) is pending.

## Next

`kdna-studio migrate --format v1` as a planned feature. Until then, the
official CLI path (`kdna pack` from a v1 source directory) is the current
v1 container creation path.
