# Public contract generation

`generate.mjs` reads the semantic definition, design bindings, implementation
sites and proof declarations from `--root`. It writes derived files to
`--out-dir` and uses `--scratch-dir` for validator compilation.
For a cumulative source it routes to the complete native builder; sources
without the native representation module retain the base generation route.

A separate local build host can provide the locked tooling dependencies:

```sh
node scripts/public-contract/generate.mjs \
  --source specs/public-semantic-source.json \
  --root . \
  --dependency-root ./build-host \
  --out-dir ./build/public-contract \
  --scratch-dir ./build/validator-scratch
```

The build host must provide TypeScript for the declaration inventory and the
exact AJV version declared by Core. The generator checks the AJV version.
Dependencies are installed separately; generation does not install them.
If `--dependency-root` is omitted, tooling resolves from the script's location.
An offline runtime host containing only runtime dependencies does not provide
all build tools.

Generated structural schemas and declarations do not establish runtime
admission, Host authority, human acceptance or release status. Native module
outputs require their corresponding source definitions and generation recipes.

`generate-native.mjs` composes the base and nine native owners in one run. It
requires a cumulative source matching `native-output-recipe.json` and an
explicit `--dependency-root`. The recipe contains type ownership, output paths
and guarded metadata projections; semantic type values come from the source.
It also compiles the separate sixteen-root browser dispatch with its own AJV
options. API declarations keep their original opaque owners and import paths.

`verify.mjs` checks the complete native output set for a cumulative source, then
compiles the declared structural schemas. Pass the same explicit dependency host
used for generation:

```sh
node scripts/public-contract/verify.mjs \
  --source specs/public-semantic-source.json \
  --root . \
  --dependency-root ./build-host \
  --out-dir ./build/public-contract
```

Sources without the native representation module retain the base generation
check. An explicit `--ajv` cannot select a different host when
`--dependency-root` is provided. Native source edits must also reconcile the
recipe input identity and the guarded metadata preimages before regeneration.

`generate.mjs` supports `--check` to compare without writing.
`verify.mjs` performs that check internally and does not accept `--check`.
Generation builds
the complete output map before replacing files and requires scratch and
outputs on one filesystem. Symbolic links, shared hardlinks, unknown paths and
duplicate outputs are rejected. A failed replacement rolls back earlier
replacements; an incomplete rollback retains staged originals for recovery.
