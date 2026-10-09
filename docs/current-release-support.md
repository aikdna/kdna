# Current source, supported combinations and distribution

Snapshot: 2026-10-09. Package versions in source, public Git revisions, npm
artifacts, GitHub releases and editor Marketplace versions are separate
coordinates. The candidate combinations below are not declared published by
this page. Check the actual channel and exact release revision before installing.

## Native and Studio entry points

For a new native asset workflow, use CLI `0.39.0-rc.native-sections.3`, Core
`0.37.1-rc.browser.1` and Read `0.11.2-rc.browser.1` together. The native route
uses container `0.6.0` and Read `0.7.0-candidate`. Its complete source delivery
contains the CLI and all eleven required companion archives, a relative-file
lock, full member bindings and licenses. Follow the
[CLI acquisition guide](https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md)
and [public author example](https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md).
The example creates and saves, reads exact selections, revises official Source,
reopens and reuses the revised asset, and preserves the original.

The Loader/MCP source candidate `0.8.0-rc.native-sections.1` embeds that exact
native graph. Follow its [complete checkout instructions](https://github.com/aikdna/kdna-skills/blob/main/mcp-server/README.md).
It is a local operator-bound stdio adapter; its npm publication is disabled.
Named Agent Host delivery and semantic adoption remain unassessed.

StudioCLI `0.13.0-rc.components.2` and StudioCore `4.0.0-rc.components.2` use the
same SDK package pair with a different container `0.5.0` / Read `0.6.4` route.
Use their [source installation and ordinary/protected session guide](https://github.com/aikdna/kdna-studio-cli#readme).
Session authoring, role-specific adoption, revision, save/read/verify and
explicit protected export retain that route's source and credential contracts.
Protected consumption and saved-file revision use the separate
[Studio local Host adapter](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/references/studio-protected-host.md)
with the same container0.5 / Read0.6.4 graph. StudioCLI's static read command
does not unlock protected files. The adapter requires an independently trusted
launcher to bind the installation, file, exact digest, purpose, lifetime and
permissions through a dedicated descriptor; credentials use separate pipes.
A descriptor supplied by an Agent does not establish authorization by itself.
The current Studio exporter requires an explicitly complete method; a
method-absent proposal is not supported by that route.
The native CLI does not read Studio's container. Neither route establishes real
human identity, editorial acceptance, model execution or action permission.

Core/Read's [exact artifact procedure](release-preview.md) and
[contract status](core-read-current-status.md) specify the preview pair. Once
published, use exact versions and verify official registry integrity and release
source identity. Core/Read use `browser-preview`; native CLI uses
`native-preview`. These channels preserve `latest`. An older installed graph
must retain its own lock rather than receive an injected newer SDK pair.

## Repository-by-repository support

“Complete source” means the exact Git revision, including its tracked vendor
archives, lock, examples and license texts. It does not mean that a package with
the same version already exists on npm. The table records public channel
baselines observed on the snapshot date; it does not reinterpret those older
artifacts as current candidates.

| Repository | Current source route and dependency boundary | Existing public distribution baseline |
| --- | --- | --- |
| [kdna](https://github.com/aikdna/kdna) | Exact Core/Read preview pair above; complete specifications, generated contracts and conformance sources. Separate auxiliary packages retain the scope below. | npm Core `0.37.0`, Read `0.11.1`; their own contracts and artifacts. |
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Native `.3` source delivery above; Node >=22. Native Plan/load unavailable. | npm native `.2` on `r2.7`; loading CLI `0.36.1` on `latest`. `.2` already exists and cannot be overwritten. |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Complete-source MCP `.8` above; Loader/native Creator and explicitly matched Studio Creator. | npm MCP `0.5.0`; not the current native adapter. |
| [kdna-studio-core](https://github.com/aikdna/kdna-studio-core) | Complete-source `4.0.0-rc.components.2`; exact current SDK pair, container0.5 session route. | npm `3.0.0`. Current source is not a stable npm release. |
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Complete-source `0.13.0-rc.components.2` with that exact StudioCore/SDK graph. | npm `0.11.0`. Current source is not a stable npm release. |
| [kdna-assets](https://github.com/aikdna/kdna-assets) | Source/index `0.3.0-rc.component-semantics.1`, verification scope `0.1.5`, with the older pinned SDK/Studio graph. Historical assets retain their own format and may reject under a newer reader. | GitHub release `0.1.1`; source asset index, not an npm SDK. |

This repository documents and releases the five core repositories above. Web,
React, server, activation, editor, application-scaffold and Apple-platform lines
are not part of this repository's release surface, are not documented here and
are not referenced from here. An existing installation of an earlier line keeps
its own lock and stays outside the preview pair; this repository makes no claim
about its availability, support or public channel.

Published third-party dependencies resolve through their locked registry URLs
and integrity values. Those larger graphs require registry access on a cold
installation unless their documented acquisition step supplies a separate
cache. Do not claim that every repository installs offline.

## Auxiliary distribution

[Auxiliary support](../packages/AUXILIARY-SUPPORT.md) distinguishes Python,
Conformance, Eval and the compatibility alias:

- Python source `0.8.0rc2` is a stdlib Python >=3.11 implementation of its pinned
  older container/Core/IR/Read contract, not current preview parity. Its source
  wheel/sdist recipe is in the [Python README](../python-sdk/README.md). PyPI
  `aikdna` `0.6.0` is a different existing release.
- Published Conformance `0.2.0` is preserved. The source dispatcher requires the
  complete Git worker/vector graph and its explicit runtime. It cannot be
  acquired by installing only that older npm artifact.
- Eval `0.3.2` remains experimental claimant-owned assessment, outside current
  Core/Read conformance and official quality acceptance.
- Published compatibility `@aikdna/kdna` `0.14.0` binds CLI `0.36.1` / Core
  `0.21.0`. Its same-version source manifest is a different historical graph;
  new native users should use the exact CLI entry point above.

## Verification and limits

Preserve the exact source revision and resulting lock. Run the repository's
declared acquisition, source-binding and product checks from a new directory.
Stable package publication guards must reject candidate/file-dependency graphs;
source distribution does not bypass them. Actual public acquisition must be
checked after publication, independently of local source installation.

Scripted content and engineering tests do not establish author confirmation,
named Agent Host adoption, production accounts, native application release,
device runtime or human acceptance. Protected flows require the producing
route's explicit trusted Host, credential channel and readback; failure must
remain a refusal rather than a plaintext fallback.
