# Load a KDNA Asset

> **Status: Phase 1 placeholder.**

This guide will walk through loading a `.kdna` file at runtime. The minimum flow is:

1. Read the manifest from `kdna.json`.
2. Check `compatibility.min_loader_version` against your loader version.
3. Pick a load profile (default: `compact`).
4. Read the payload entry according to the profile.
5. Validate the payload against the declared `compatibility.profile` schema.
6. Apply your runtime policy (out of scope for KDNA Core).

Phase 1 provides a reference `inspect` command (`scripts/v1-inspect.mjs`) that demonstrates steps 1–2. The full loading flow is implemented by [`@aikdna/kdna-core`](https://github.com/aikdna/kdna-core).
