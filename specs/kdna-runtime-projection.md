# KDNA Runtime Projection

Status: Draft  
Normative: Yes for consumers that load or project judgment content

## 1. Scope

Runtime projection defines what a consumer may pass to a model, tool, plugin, or
remote runtime after a `.kdna` asset is authorized.

## 2. Principle

KDNA consumers SHOULD NOT blindly place the full decrypted judgment payload into
ordinary model context.

The preferred flow is:

1. Core validates and plans the load.
2. Core decrypts only if required and authorized.
3. A projection layer selects the smallest task-relevant judgment structure.
4. The consumer sends that projection to the model or tool.
5. Trace records which asset, version, and judgment IDs influenced the task.

## 3. Projection Policies

| Policy | Meaning |
|---|---|
| `minimal` | Local task-scoped projection from an authorized local asset. |
| `remote` | Projection is returned by a remote KDNA Runtime. |
| `none` | No projection may be produced. |

## 4. Local Licensed Assets

For local licensed assets, plaintext judgment content MUST remain in memory.
Consumers MUST NOT write extracted source JSON as the canonical portable asset
or as an alternate source of runtime authority.

Local projection reduces accidental exposure but does not prevent authorized
learning. Authors who cannot accept full local plaintext exposure SHOULD choose
`remote`.

## 5. Remote Assets

Remote assets return task-scoped projections. The client MUST NOT receive the
full KDNA payload.

Remote runtimes SHOULD:

- verify entitlement per request;
- rate-limit projection calls;
- detect extraction-like patterns;
- avoid returning complete axioms, ontology, or full source structures in one
  response;
- emit audit events without protected plaintext.

The deployer's server-side full Capsule and the client-facing task projection
are different disclosure boundaries. In the JS reference implementation, a
deployer that physically controls the packaged remote asset may obtain the
server-side Capsule only through
`@aikdna/kdna-core/remote-runtime.loadRemoteRuntimeAsset(input)`. That
operation is remote-only, single-asset, option-free, and fixed to the `full`
JSON profile. It does not authorize the network caller or decide what may leave
the server.

The embedding remote Runtime MUST authenticate and authorize each request,
derive the minimum task-relevant projection, and keep the full Capsule inside
the deployer-controlled server boundary. Ordinary consumer Core entry points
MUST continue to deny local loading of the same remote asset.

## 6. Tool And Plugin Boundary

Consumers MUST default-deny full protected payload access to tools, plugins,
logs, crash reports, and debug exports.

Task-needed projections MAY be sent to tools only when the current workflow
requires it and the trace records the exposure boundary.
