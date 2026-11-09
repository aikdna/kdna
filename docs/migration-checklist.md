# 0.5 → 0.6 migration checklist

Use this checklist only for a current-generation public source: container
`0.5.0`, profile `kdna.payload.judgment` version `0.5.1`. The conversion is
explicit, writes a new file and never rewrites the source.

The command is not a general compatibility promise. Historical tuples,
protected sources, checksums, signatures and extension members are refused by
name. If the source is already container `0.6.0`, do not convert it; validate
and read it directly.

## Prerequisites

- Node 22 or later;
- `@aikdna/kdna-cli@0.43.2` with its exact Core `0.37.9` / Read `0.13.3`
  companion graph;
- an explicit destination filename that does not already exist;
- permission to write a new file and to disclose the result for this task.

## Checklist

1. **Bind the source and destination.** Use the exact source path and a new
   output path. Do not use a directory, a symlink or an existing file as the
   destination.

2. **Record the source digest.**

   ```sh
   shasum -a 256 source-0.5.kdna   # macOS
   sha256sum source-0.5.kdna       # Linux
   ```

   Use the printed digest as `sha256:<digest>` for `--expected-a`. Do not use
   `kdna inspect` for this step: the current CLI reads current containers and
   rejects a 0.5 source with `READ_UNSUPPORTED_VERSION` at the metadata stage.
   That rejection is expected and does not indicate a damaged or unsupported
   fixture; `convert` performs the explicit 0.5 binding itself.

3. **Convert with explicit permission.**

   ```sh
   npx --no-install kdna convert source-0.5.kdna \
     --expected-a sha256:<digest-from-inspect> \
     --output converted-0.6.kdna \
     --allow-source
   ```

   A successful result has `status: "saved"` and reports the new file's byte
   length, SHA-256 and `representation_origin`. A rejected conversion must
   leave no output file.

4. **Validate the new file with system checks.**

   ```sh
   npx --no-install kdna validate converted-0.6.kdna --system --json
   ```

   Require `status: "accepted"` and `states.core: "valid"`. A non-zero warning
   count is reported, not silently converted into an admission failure.

5. **Read only the judgments the task needs.**

   ```sh
   npx --no-install kdna read converted-0.6.kdna \
     --mode catalog --budget 1000000 --allow-read
   ```

   Use the returned asset ID, asset version and judgment ID in one exact
   selection. Do not treat the catalog as disclosed judgment content.

## Reproducible fixture

The CLI repository tracks a synthetic current-generation 0.5 source at
[`tests/fixtures/migration-source-0.5.kdna`](https://github.com/aikdna/kdna-cli/blob/662a7e77d8de1a7bb9b59e194ff3f562e8a4ab40/tests/fixtures/migration-source-0.5.kdna).
It is 5,725 bytes with SHA-256
`35cc7c7ccda8dcf18adda438628a07f665491f2e06c79ff7cf99e7dc8295aff6`.

On 2026-11-09, the published CLI produced a 21,845-byte output with SHA-256
`d5c3c752fde0a1568587e3503ade61705d377de322dd1155ae67183e160e9bb6`;
`validate --system` returned `accepted`, `core: valid` and
`system.status: clean`; the catalog contained one synthetic judgment.

This fixture proves the explicit conversion route on its declared input. It
does not prove migration of an arbitrary historical or protected asset, human
acceptance, authorial adoption or action permission.
