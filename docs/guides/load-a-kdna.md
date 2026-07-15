# Load a KDNA Asset

This guide will walk through loading a `.kdna` file at runtime. The minimum flow is:

1. Read the manifest from `kdna.json`.
2. Check the strict `compatibility.min_loader_version` coordinate against your
   loader package coordinate.
3. Pick a load profile (default: `compact`).
4. Read the payload entry according to the profile.
5. Validate the payload against the declared `compatibility.profile` schema.
6. Apply your runtime policy (out of scope for KDNA Core).

The full loading flow is implemented by
[`@aikdna/kdna-core`](https://github.com/aikdna/kdna-core). Its `inspect` and
`validate` reports expose `loader_version`, `min_loader_version`, and
`loader_compatible`. Use `planLoad` or `loadAuthorized` for a load decision: a
structurally valid asset whose requirement is above the current loader is
blocked with `KDNA_LOADER_VERSION_UNSUPPORTED`, while a malformed requirement
remains a schema failure.
