# Platform File Association — Design Proposal

> **Status:** Proposed, not implemented as a released KDNA desktop product.

The desired platform behavior is file-first: a user opens a `.kdna` file in a
compatible app, inspects it, and may attach it to a task, session, app, or
project. Opening a file never installs, authorizes, or loads it silently.

## Proposed macOS behavior

1. Register `.kdna` as `application/vnd.kdna.asset` and a custom UTType.
2. Double-click opens an inspector showing identity, version, digest,
   provenance, declared scope, access requirements, and validation state.
3. Available actions are **Validate**, **Attach…**, **View contents where
   permitted**, and **Close**.
4. **Attach…** requires a user-chosen scope and records the exact version and
   digest. It does not copy the file into a mandatory global library.
5. Quick Look, drag-and-drop, and share-sheet support may follow after the core
   open-and-attach flow is implemented and accepted.

## Invariants

- inspection is not authorization;
- attachment is not automatic applicability;
- a newer file does not replace an approved attachment silently;
- every active attachment is visible and can be disabled or rolled back;
- GUI operations must use the same Core validation and LoadPlan contracts as
  the CLI.

Swift Core and Swift Studio provide reusable technical components. Their
existence does not prove that the desktop file-association experience above has
been shipped.
