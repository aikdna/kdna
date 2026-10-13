# Stable distribution change notes

These notes describe the reviewed stable distribution candidates. Publication
requires the exact source, retained artifacts and independently approved release
record. Registry acquisition and downstream adoption are separate observations.

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
