# Real-Human Acceptance — Boundary Declaration

This directory holds the **prepared materials** for the real-human acceptance
suite. It contains methodology only: scripts, operation sheets, and verdict
templates. It contains **no** acceptance results and **no** SIMULATION output.

## Real-human vs SIMULATION isolation

- **Real-human material** = assets and observations produced by a human (the
  Owner) exercising the product with their own judgment. This is the only
  material that may count toward real-human acceptance.
- **SIMULATION material** = assets and observations produced by an agent
  rehearsing the same steps in isolation. SIMULATION is a mechanism test only.
  It never counts toward real-human acceptance.

The two are **strictly isolated**:

1. SIMULATION-produced assets never enter this suite and never enter any
   public asset repository.
2. Real-human assets produced from these scripts are marked `real-human` and
   kept separate from any SIMULATION run directory.
3. A drill or rehearsal that uses generated/judgment-free content is
   SIMULATION, regardless of who runs it.

## What may and may not be recorded here

May be added after an acceptance run:

- The completed verdict table (dated), with the observed `Actual` column.
- The real-human asset's coordinates (without credentials or private paths).

Must never be added:

- Agent-authored or generated judgment passed off as real-human.
- Credential values, key prefixes, or provider error bodies.
- Local machine paths as release evidence.
- Internal repo/PR identifiers.

## The five gates

The create script's "five gates" are the validation layers a produced asset
must pass: container structure, manifest schema, payload schema,
checksum/digest, and load contract. Passing the gates proves the asset is a
well-formed KDNA; it does **not** prove the judgment is correct or safe.

## Source of truth

The 0/8 real-human acceptance state is tracked in the workspace acceptance
ledger, not in this directory. This directory is the public-safe preparation
surface only. Any claim of real-human acceptance must cite the dated completed
verdict table, not these templates.
