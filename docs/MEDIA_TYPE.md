# KDNA Media Type

This document defines how `.kdna` assets identify themselves to operating
systems, HTTP clients, registries, and loaders.

## Current Media Type

The current KDNA media type is:

```text
application/vnd.kdna.asset
```

Rationale:

- KDNA assets are self-contained judgment payloads, not generic ZIP archives.
- The `+zip` structured syntax suffix is intentionally omitted because the
  container format is an implementation detail of the KDNA Asset Container.
- `application/x-kdna` uses an unregistered `x-` prefix and is not part of the
  KDNA 1.0 protocol.

## Rejected Values

```text
application/x-kdna
```

Conforming tools MUST reject this value in registry metadata, HTTP
responses, CLI package metadata, operating system integration files, and `.kdna`
root `mimetype` entries.

## ZIP Identification

Every `.kdna` asset MUST include a root `mimetype` entry with exactly this
content and no trailing newline:

```text
application/vnd.kdna.asset
```

Writers SHOULD place `mimetype` as the first ZIP entry and SHOULD store it
without compression. Loaders MUST inspect both `mimetype` and `kdna.json`; a
`.kdna` extension alone is not sufficient.

## Future Registration Path

1. Use `application/vnd.kdna.asset` for KDNA 1.0.
2. Prepare an IANA vendor-tree registration once the 1.0 format is frozen.
3. Consider a standards-tree type only after independent implementations and a
   standards body or RFC path exist.

## Security Considerations

KDNA assets are executable only in the sense that they influence AI judgment.
They MUST be treated as untrusted input until structure, digest, signature,
revocation state, risk level, and policy fit are checked.
