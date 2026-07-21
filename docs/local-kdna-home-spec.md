# Local KDNA State — Historical Store Design

> **Status:** Historical implementation note. It is not the canonical user
> model or a protocol requirement.

Earlier CLI work defined `~/.kdna/packages/` as a global installed-asset store.
Published commands may still read or write that layout. The KDNA protocol does
not require a global asset library, installation step, active version, registry
cache, or automatic discovery.

## Current invariant

The canonical portable object is a `.kdna` file. A conforming Host may consume
an explicit file path directly. Saving a file, attaching it to a project,
authorizing it, deciding that it applies, and loading it are separate events.

## Optional local state

A CLI or app may use `~/.kdna/` for private implementation state such as:

- validation or projection caches that can be rebuilt;
- receipts recording exact file digest and prior authorization;
- Host attachment records approved by the user;
- credentials stored through an appropriate system secret store;
- local traces that respect the user's privacy settings.

Such state must not become an independent source of judgment authority. It must
not silently replace an attached asset with a newer version, make every saved
file eligible for every task, or imply user consent.

## Compatibility status

The previous `packages/`, `index.json`, registry, Cluster, feedback, and eval
layout remains relevant only to the published implementation surfaces that use
it. Those surfaces require separate compatibility and product review. New Host
integrations should use explicit files or exact user-approved attachments.
