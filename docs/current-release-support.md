# Current source, supported combinations and distribution

Snapshot: 2026-10-12. Package source versions, public Git revisions, npm bytes,
GitHub releases and dist-tags are separate facts. The five stable coordinates
Core `0.37.2`, Read `0.12.0`, native CLI `0.39.0`, Studio Core `4.0.0` and
Studio CLI `0.13.0` are published on `latest`, each from its reviewed source
commit with a retained, byte-verified artifact; the machine-readable matrix is
[release-coordinates.json](./release-coordinates.json). No earlier preview is
relabeled or overwritten. MCP/Creator/protected Host remain complete Git source
deliveries, with no MCP npm target.

> **Superseded statement (kept for the record).** The 2026-10-11 snapshot read:
> "This wave prepares five new stable coordinates for `latest`: Core `0.37.2`,
> Read `0.11.3`, native CLI `0.39.0`, Studio Core `4.0.0` and Studio CLI
> `0.13.0`. All five are unpublished source candidates until exact release and
> registry evidence establishes otherwise." That statement was current on
> 2026-10-11 and is superseded by the published results above; it is retained
> here rather than silently rewritten.

## Native and Studio entry points

For a new native asset workflow, use CLI `0.39.0`, Core
`0.37.2` and Read `0.12.0` together. The native route
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

StudioCLI `0.13.0` and StudioCore `4.0.0` use the
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

Core/Read's [exact stable artifact procedure](release-stable.md) and
[contract status](core-read-current-status.md) specify the candidate pair.
Publication targets `latest` only after each exact dependency is public:
Core → Read → native CLI and Studio Core → Studio CLI. MCP's complete source
graph is rebound separately. Every new artifact requires registry integrity,
source identity and installed-consumer checks. An older graph retains its own
lock; a newer SDK pair must not be injected into it.

## Repository-by-repository support

“Complete source” means the exact Git revision, including its tracked vendor
archives, lock, examples and license texts. It does not mean that a package with
the same version already exists on npm. The table records public channel
baselines observed on the snapshot date; it does not reinterpret those older
artifacts as current candidates.

| Repository | Current source route and dependency boundary | Existing public distribution baseline |
| --- | --- | --- |
| [kdna](https://github.com/aikdna/kdna) | Exact Core/Read stable candidate pair above; complete specifications, generated contracts and conformance sources. Separate auxiliary packages retain the scope below. | npm Core `0.37.0`, Read `0.11.1`; their own contracts and artifacts. |
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Published native `0.39.0` stable delivery; Node >=22. Native Plan/load unavailable. | Native previews keep their exact graphs; the earlier `0.36.1` line keeps its own loading contract. Existing versions cannot be overwritten. |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Complete-source MCP `.8` above; Loader/native Creator and explicitly matched Studio Creator. | npm MCP `0.5.0`; not the current native adapter. |
| [kdna-studio-core](https://github.com/aikdna/kdna-studio-core) | Complete-source `4.0.0`; exact current SDK pair, container0.5 session route. | npm `3.0.0`. Current source is not a stable npm release. |
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Complete-source `0.13.0` with that exact StudioCore/SDK graph. | npm `0.11.0`. Current source is not a stable npm release. |
| [kdna-assets](https://github.com/aikdna/kdna-assets) | Source/index `0.3.0-rc.component-semantics.1`, verification scope `0.1.5`, with the older pinned SDK/Studio graph. Historical assets retain their own format and may reject under a newer reader. | GitHub release `0.1.1`; source asset index, not an npm SDK. |

This stable wave covers the five main npm packages and the complete source
deliveries described above. Web, React, server, activation, editor,
application-scaffold and Apple-platform lines remain outside this wave.
Their existing installations retain their own locks and declared scope;
this candidate does not migrate, revive or retire those channels.

Published third-party dependencies resolve through their locked registry URLs
and integrity values. Those larger graphs require registry access on a cold
installation unless their documented acquisition step supplies a separate
cache. Do not claim that every repository installs offline.

## Auxiliary distribution

[Auxiliary support](../packages/AUXILIARY-SUPPORT.md) distinguishes Python,
Conformance, Eval and the compatibility alias:

- Python source `0.8.0rc2` is a stdlib Python >=3.11 implementation of its pinned
  older container/Core/IR/Read contract, not current SDK parity. Its source
  wheel/sdist recipe is in the [Python README](../python-sdk/README.md). Published
  PyPI `aikdna` `0.8.0rc2` retains its prerelease scope; `0.6.0` is the separate
  latest stable release. Neither establishes current SDK parity.
- Published Conformance `0.2.0` is preserved. The source dispatcher requires the
  complete Git worker/vector graph and its explicit runtime. It cannot be
  acquired by installing only that older npm artifact.
- Eval `0.3.2` remains experimental claimant-owned assessment, outside current
  Core/Read conformance and official quality acceptance.
- Published compatibility `@aikdna/kdna` `0.14.0` binds CLI `0.36.1` / Core
  `0.21.0`. Its same-version source manifest is a different historical graph;
  new native users should use the exact CLI entry point above.

## Published channel history

These official registry observations are from 2026-10-11. Re-read the exact
package metadata before installation; a dist-tag can change, while the retained
version's tarball and integrity remain its identity. These rows record the
preview channels and the `latest` values observed before the stable publication
described above.

| Package | Published preview | Preview tag | Earlier `latest` observed |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.1-rc.browser.1` | `browser-preview` | `0.37.0` |
| `@aikdna/kdna-read` | `0.11.2-rc.browser.1` | `browser-preview` | `0.11.1` |
| `@aikdna/kdna-cli` | `0.39.0-rc.native-sections.3` | `native-preview` | `0.36.1` |
| `@aikdna/kdna-studio-core` | `4.0.0-rc.components.2` | `components-preview` | `3.0.0` |
| `@aikdna/kdna-studio-cli` | `0.13.0-rc.components.2` | `components-preview` | `0.11.0` |

The two browser preview archives retain older README text that described them
as unpublished. Their official registry publication and exact bytes supersede
that wording for those two previews only. Use the [preview release record](release-preview.md)
for their release procedure and the official metadata for
[Core](https://registry.npmjs.org/@aikdna%2fkdna-core/0.37.1-rc.browser.1),
[Read](https://registry.npmjs.org/@aikdna%2fkdna-read/0.11.2-rc.browser.1),
[CLI](https://registry.npmjs.org/@aikdna%2fkdna-cli/0.39.0-rc.native-sections.3),
[Studio Core](https://registry.npmjs.org/@aikdna%2fkdna-studio-core/4.0.0-rc.components.2)
and [Studio CLI](https://registry.npmjs.org/@aikdna%2fkdna-studio-cli/0.13.0-rc.components.2).

## Verification and limits

Preserve the exact source revision and resulting lock. Run the repository's
declared acquisition, source-binding and product checks from a new directory.
Stable package publication guards reject prerelease or file-dependency graphs;
source distribution does not bypass them. Actual public acquisition must be
checked after publication, independently of local source installation.

Scripted content and engineering tests do not establish author confirmation,
named Agent Host adoption, production accounts, native application release,
device runtime or human acceptance. Protected flows require the producing
route's explicit trusted Host, credential channel and readback; failure must
remain a refusal rather than a plaintext fallback.
