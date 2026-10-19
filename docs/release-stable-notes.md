# Stable distribution change notes

These notes describe the reviewed stable distribution candidates. Publication
requires the exact source, retained artifacts and independently approved release
record. Registry acquisition and downstream adoption are separate observations.

## Core 0.37.9

- Distribution-coordinate patch: pairs with Read `0.13.3` from the same reviewed
  source commit. The generated package-set descriptor version fields and
  contract preimages follow the new coordinate. No runtime, schema-shape, rule,
  diagnostic or capability behavior changes.
- Core `0.37.8` remains published under its own identity; its immutable tarball
  keeps the README bytes it shipped with.

## Read 0.13.3

- Moves the exact Core peer pin to `0.37.9` and prepares the release for
  provenance-bearing publication. Read-route behavior, projection, contract
  rules and previously published coordinates are unchanged.
- Read `0.13.2` remains published under its own identity; its registry record
  has no `gitHead` or provenance attestation, and that historical fact is not
  rewritten by this candidate.

## Core 0.37.8

- Distribution-coordinate and packaged-README patch: ships the corrected
  README text in the tarball and pairs with Read `0.13.2` from the same reviewed
  source commit.
- The generated package-set descriptor version fields and contract preimages
  follow the new coordinate. No runtime, schema-shape, rule, diagnostic or
  capability behavior changes.
- Core `0.37.7` remains published under its own identity; its immutable tarball
  keeps the README bytes it shipped with.

## Read 0.13.2

- Moves the exact Core peer pin to `0.37.8` so the paired release can be
  published from the same reviewed source commit, and ships the corrected
  packaged README.
- Read-route behavior, projection, contract rules and previously published
  coordinates are unchanged.

## Core 0.37.7

- Publishes the merged source-migration tree: the new, explicit
  `kdna.source-migration/0.1.0-candidate` route reads exactly the current
  container `0.5.0` public source generation and writes an admitted `0.6.0`
  container with a confirmed `representation_origin`. Historical tuples,
  protected sources and extension members are refused by name; the Read and
  classic admission paths are unchanged and never convert implicitly.
- Carries the regenerated contract preimages and the added migration module in
  the bundled public contracts; every previously published coordinate keeps its
  bytes, and the compiled classic tuple keeps its identity.
- Pairs with Read `0.13.1` from the same reviewed source commit.

## Read 0.13.1

- Moves the exact Core peer pin to `0.37.7` so the paired release can be
  published from the same reviewed source commit. Read-route behavior is
  unchanged; no previously published coordinate changes bytes.

## Core 0.37.6

- Re-publishes the same Core content from the corrected reviewed source commit
  so that the paired Read `0.13.0` release can be published from the same
  commit. Apart from the version coordinate itself nothing moves: the generated
  package-set contract and package manifests declare the exact Read peer
  `0.13.0`, and the compiled browser/Node tuple keeps its identity.
- New installations pairing with Read `0.13.0` should use this coordinate;
  `0.37.5` remains published and valid on its own, and every earlier published
  coordinate and preview tag stays in place.

## Core 0.37.2

- Includes the current public contract exports and generated native-sections
  contract, derived from the maintained semantic source with checked preimages.
- Makes path, Node byte and browser byte admission classify short ZIP prefixes,
  damaged containers and foreign-family input consistently. Non-file paths,
  including a FIFO without a writer, reject before authorization without blocking.
- Retains separate compiled-container and native-sections contracts, explicit
  Host authority, snapshot identity, bounded resources and disclosure state.
  Diagnostics do not provide accepted content or execution authority.
- Uses stable distribution coordinates with Read `0.11.3`; protocol and contract
  versions retain their own identities. Browser decryption remains a trusted Host
  responsibility. Product acceptance and platform coverage require their own
  evidence.

## Core 0.37.5

- Issues the deferred retained-plan target for every selection-closure member
  the paired Read reduction may deliver as a reduced entry behind its own
  expansion handle, so one session can resolve and expand the member under the
  reader's complete admission. The change is additive: existing request
  semantics, the plan tuple and admission behavior are unchanged, and a plan
  that mints no handles is untouched.
- Moves the distribution coordinate together with its paired companion: the
  generated package-set contract and the package manifests declare the exact
  Read peer `0.13.0`.
- Changes no protocol, contract or capability: the compiled browser/Node tuple
  keeps its identity, browser decryption remains a trusted Host responsibility
  and no Host is activated.
- Leaves Core `0.37.2`, `0.37.3`, `0.37.4` and every published preview tag in
  place: an installed combination keeps working until its owner chooses to move.

## Read 0.13.0

- Reduces the exact-selection body surface with `kdna.read.model-view/0.2.0`:
  non-selected judgment members the closure reaches fold to their focus, core
  expression and meaning markers behind the reader's own expansion handles;
  selected judgments keep their full body, and relationship bodies are carried
  once with reference entries naming them. A member with no issued handle keeps
  its full body, a mixed delivery refuses rather than guessing, and the full
  printed view carries no reduction machinery and no field-level difference
  from the previous surface.
- Resolves expansion handles by id within the session that issued them: an
  unknown, stale, expired or foreign-snapshot handle is refused explicitly
  instead of being used, and resolution grants nothing by itself — using a
  handle still passes the reader's complete admission.
- Keeps the compiled and native-sections Read contracts `kdna.read/0.6.4` and
  `kdna.read/0.7.0-candidate`, and declares the exact Core peer `0.37.6`. Read
  `0.12.0` and `0.12.1` and their published artifacts stay available, and
  adoption remains its own evidence.

## Core 0.37.4

- Adds the read-only `getMethodRoleTable()` accessor on the `./components`
  subpath: a fresh deeply frozen copy of the current per-term method-role
  vocabulary (`kdna.r2-semantics/1`) that admission checks, so an authoring
  client can explain a method-role rejection without copying the vocabulary or
  provoking one first. The accessor answers no admission question and decides
  nothing.
- Moves the distribution coordinate together with its paired companion: the
  generated package-set contract and the package manifests declare the exact
  Read peer `0.12.1`.
- Changes no protocol, contract or capability: the compiled browser/Node tuple
  keeps its identity, browser decryption remains a trusted Host responsibility
  and no Host is activated.
- Leaves Core `0.37.2`, `0.37.3` and every published preview tag in place: an
  installed combination keeps working until its owner chooses to move.

## Read 0.12.1

- Moves the distribution coordinate only: an exact peer move to
  `@aikdna/kdna-core@0.37.4` with no export, contract or behavior change.
- Keeps the compiled and native-sections Read contracts `kdna.read/0.6.4` and
  `kdna.read/0.7.0-candidate`; Read `0.12.0` and its published artifact stay
  available, and adoption remains its own evidence.

## Core 0.37.3

- Moves the distribution coordinate only, so that Core and Read are published
  from one reviewed commit and one exact pair. The generated package-set contract
  and the package README declare the exact Read peer `0.12.0`.
- Changes no protocol, contract or capability: the compiled browser/Node tuple
  core `kdna.core/0.8.2`, container `0.5.0`, payload `0.5.1`, canonical IR
  `0.6.1` and Read `kdna.read/0.6.4`, and the native section tuple container
  `0.6.0` / Read `kdna.read/0.7.0-candidate`, keep their identities. Browser
  decryption remains a trusted Host responsibility and no Host is activated.
- Leaves Core `0.37.2`, Read `0.11.3` and every published preview tag in place:
  an installed combination keeps working until its owner chooses to move.

## Read 0.12.0

- Exports the model view projection. A consumer that asks for the default surface
  receives the author body — declarations, catalog, selected judgments, closure,
  references, relationships, missing material, provenance and asset capability —
  plus one fingerprint carrying the asset, snapshot and request identity and the
  observed A/C/E digests. The target index and the expansion handles are the only
  content keys the default surface moves, and the fingerprint names them as
  omitted together with a recovery request.
- Removes nothing from the full view: the same read re-requested with
  `view: 'full'` returns every envelope and content field in one call. A
  rejection, a no-body control or a transport failure reaches the caller
  verbatim; an envelope or content shape this projection has not been taught is
  refused rather than silently reduced. The projection observes nothing and
  performs no read, validation or authorization of its own.
- Keeps the compiled and native-sections Read contracts `kdna.read/0.6.4` and
  `kdna.read/0.7.0-candidate`, and declares the exact Core peer `0.37.3`. Read
  `0.11.3` and its published artifact stay available; publication establishes the
  coordinate, and adoption and task quality require their own evidence.

## Read 0.11.3

- Uses exact Core peer `0.37.2` for compiled and native-sections Read through their
  respective versioned contracts, including the existing ordinary and Host-unlocked
  browser section path.
- Keeps selection, required support closure, budgets, expansion and confirmed
  delivery explicit. Reopening requires fresh authority and handles.
- Supports the reviewed native CLI `0.39.0` graph. Studio's compiled-container
  route remains separately checked; a distribution version does not merge the
  two container families or establish Reader product acceptance.
