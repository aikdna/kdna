# Browser preview change notes

These are prerelease package notes. The stable channel retains its own versions,
artifacts and release gates. A source checkout is not a registry release.

## Core 0.37.1-rc.browser.1

- Adds retained browser admission for ordinary native-sections bytes and for
  protected sections supplied by an independently trusted Host after unlock.
- Keeps authorization, snapshot identity, required support closure, bounded
  resources and disclosure state explicit. Core does not decrypt in the browser.
- Preserves the separately versioned Node native-sections APIs. The published
  native CLI keeps its exact Core/Read dependency graph.
- Distributed on the `browser-preview` npm tag. This preview does not establish
  Reader product acceptance, authenticated human identity, every platform or
  production security. Use exact versions and the documented Host boundary.

## Read 0.11.2-rc.browser.1

- Adds retained browser Read for ordinary and Host-unlocked protected sections,
  using exact Core peer `0.37.1-rc.browser.1`.
- Keeps selected support closure, scope, budget refusal, snapshot-local expansion
  and confirmed delivery explicit. Reopen requires new authority and handles.
- Distributed on the `browser-preview` npm tag. Do not combine this SDK pair
  with the published native CLI's different exact dependency graph. Broader
  adapters and Reader products require their own adoption and runtime evidence.
