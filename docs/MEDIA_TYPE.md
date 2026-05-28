# KDNA Media Type

This document defines how `.kdna` assets identify themselves to operating
systems, HTTP clients, registries, and loaders.

## Current Media Type

The current recommended media type is:

```text
application/vnd.aikdna.kdna+zip
```

Rationale:

- KDNA is controlled by the AiKDNA project, so the vendor tree is the right
  public-registration path before any standards-tree submission.
- `.kdna` is a ZIP container, so the registered `+zip` structured syntax suffix
  makes the underlying container explicit to generic tooling.
- `application/x-kdna` uses an unregistered `x-` prefix and is not part of the
  KDNA v1.0 protocol.

## Rejected Values

```text
application/x-kdna
```

Conforming v1.0 tools MUST reject this value in registry metadata, HTTP
responses, CLI package metadata, operating system integration files, and `.kdna`
root `mimetype` entries.

## ZIP Identification

Every v1.0-compatible `.kdna` asset MUST include a root `mimetype` entry with
exactly this content and no trailing newline:

```text
application/vnd.aikdna.kdna+zip
```

Writers SHOULD place `mimetype` as the first ZIP entry and SHOULD store it
without compression. Loaders MUST inspect both `mimetype` and `kdna.json`; a
`.kdna` extension alone is not sufficient.

## Future Registration Path

1. Use `application/vnd.aikdna.kdna+zip` for v1.0.
2. Prepare an IANA vendor-tree registration once the v1.0 format is frozen.
3. Consider a standards-tree type only after independent implementations and a
   standards body or RFC path exist.

## Security Considerations

KDNA assets are executable only in the sense that they influence AI judgment.
They MUST be treated as untrusted input until structure, digest, signature,
revocation state, risk level, and policy fit are checked.
