# KDNA Media Type

This document defines how `.kdna` assets identify themselves to operating
systems, HTTP clients, registries, and loaders.

The media type identifies the outer transport container, not the KDNA judgment
payload format. A conforming KDNA v2 asset requires `payload.kdnab`,
`signature.kdsig`, manifest validation, and conforming runtime loading — the
`+zip` suffix reflects the outer package structure only.

## Current Media Type

The current recommended media type is:

```text
application/vnd.aikdna.kdna+zip
```

Rationale:

- KDNA is controlled by the AiKDNA project, so the vendor tree is the right
  public-registration path before any standards-tree submission.
- `.kdna` uses a ZIP outer package for transport compatibility, so the
  registered `+zip` structured syntax suffix makes the container structure
  explicit to generic tooling.
- `application/x-kdna` uses an unregistered `x-` prefix and is not part of the
  KDNA protocol.

## Rejected Values

```text
application/x-kdna
```

Conforming tools MUST reject this value in registry metadata, HTTP
responses, CLI package metadata, operating system integration files, and `.kdna`
root `mimetype` entries.

## ZIP Identification

Every conforming `.kdna` asset MUST include a root `mimetype` entry with
exactly this content and no trailing newline:

```text
application/vnd.aikdna.kdna+zip
```

Writers SHOULD place `mimetype` as the first ZIP entry and SHOULD store it
without compression. Loaders MUST inspect both `mimetype` and `kdna.json`; a
`.kdna` extension alone is not sufficient.

## Future Registration Path

1. Use `application/vnd.aikdna.kdna+zip` for the current protocol version.
2. Prepare an IANA vendor-tree registration once the format is frozen.
3. Consider a standards-tree type only after independent implementations and a
   standards body or RFC path exist.

The `+zip` suffix is part of the registered media type and identifies the outer
container. It does not imply that conforming consumption is possible with
generic ZIP tools.

## Security Considerations

KDNA assets are executable only in the sense that they influence AI judgment.
They MUST be treated as untrusted input until structure, digest, signature,
revocation state, risk level, and policy fit are checked.
