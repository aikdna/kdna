# KDNA Public Roadmap

> Public direction, not an internal delivery schedule. Only released and
> reproducible behavior is described as current capability.

## Where KDNA Is Now

KDNA has one current asset model and two complementary use paths:

- **Single asset** — the atomic, foundational, default path.
- **Cluster** — the explicit advanced path for coordinating multiple assets.

Anyone can create assets. The protocol and toolchain do not approve authors or
judge content quality. AIKDNA-published assets are reference material, not the
ecosystem's exclusive content source.

The current stable baseline is local public-asset creation and consumption:

```text
author → .kdna → validate → LoadPlan → load/project → Runtime Capsule → Agent
```

Licensed and remote access contracts exist, with maturity disclosed separately
from the container and public-asset path.

## Current Priorities

### 1. Runtime and security closure

- keep one container, one payload contract, and one Agent interface;
- prove public, licensed, and remote behavior with reproducible fixtures;
- preserve in-memory-only handling for decrypted licensed content;
- fail closed on malformed, unauthorized, or unverifiable input.

### 2. Author experience

- make the first independent asset easy to create without private knowledge;
- keep review and Evidence optional unless an author makes a corresponding
  claim;
- preserve scope boundaries so one asset remains understandable and reusable.

### 3. Single asset and Cluster together

- keep all default commands usable with one asset and no hidden Router;
- keep Cluster explicit, role-based, conflict-aware, and independently
  testable;
- report routing quality separately from answer quality.

### 4. Cross-runtime compatibility

- maintain shared fixtures across JS, Swift, React, Web, and Agent adapters;
- require compatible runtimes to implement LoadPlan, authorization, integrity
  verification, and Runtime Capsule output;
- test Codex, Claude Code, and OpenCode through the same public toolchain.

### 5. An author-led ecosystem

- publish minimal, encrypted, remote, and Cluster reference examples;
- document self-publication without an official registry dependency;
- make author identity, version, compatibility, and optional evidence legible;
- let independent creators and applications choose their own distribution and
  business models.

## What KDNA Core Is Not Building

- a content judge or truth authority;
- an official-only authoring system;
- a mandatory registry, marketplace, or hosted service;
- a universal asset ranking or recommendation engine;
- a replacement for RAG, memory, skills, workflows, evaluation, or
  fine-tuning;
- one giant asset that replaces scoped assets and explicit Cluster composition.

## How to Contribute

- Create an asset: [30-Minute Authoring Guide](./30-minute-authoring-guide.md)
- Integrate a runtime: [Consumption Runtime](./consumption-runtime.md)
- Add conformance coverage: [`conformance/`](../conformance/)
- Publish a reference asset: [aikdna/kdna-assets](https://github.com/aikdna/kdna-assets)
- Report protocol or implementation ambiguity through the relevant public
  repository issue tracker.
