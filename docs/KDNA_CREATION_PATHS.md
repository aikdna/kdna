# KDNA Creation Paths

This document defines the valid creation paths for `.kdna` assets.

## Core Principle

**Any entity can create a `.kdna` file. Format validity is determined by `kdna validate`, not by author identity, registry listing, Human Lock status, or signature presence.**

## Creation Paths

### 1. Human-authored via Studio (Recommended)

Domain expert authors judgment cards through KDNA Studio, locks cards, compiles, and exports.

- **Toolchain**: Studio Core / CLI / VS Code extension
- **Provenance**: `authoring.created_by: "human"` or `"kdna-studio"`
- **Characteristics**: Full authoring pipeline with guided card creation, Human Lock, quality gates

### 2. Agent-authored via SDK / CLI / MCP

AI agent creates `.kdna` files by generating spec-compliant JSON, then validates through official toolchain.

- **Toolchain**: Official SDK (`@aikdna/kdna-core`) or CLI (`kdna validate`)
- **Provenance**: `authoring.created_by: "agent"` or `"agent-assisted"`
- **Characteristics**: Must pass `kdna validate`; Human Lock optional; quality gates informational
- **Status**: **Valid and allowed.** Agent-created KDNA is a first-class creation path.

### 3. Agent-assisted + Human-confirmed (Hybrid)

Agent proposes judgment content; human reviews, edits, and confirms; toolchain validates.

- **Toolchain**: Studio Core or SDK + human review
- **Provenance**: `authoring.created_by: "hybrid"`, `authoring.human_confirmed: true`
- **Characteristics**: Combines agent productivity with human oversight; Human Lock optional but recommended

### 4. App-integrated via Official SDK

Applications programmatically generate `.kdna` files through the official SDK.

- **Toolchain**: `@aikdna/kdna-core` SDK
- **Provenance**: `authoring.created_by: "app"`, with `authoring.tool_name` and `authoring.tool_version`
- **Characteristics**: Embedded creation in third-party applications

### 5. Third-party Compatible Exporter

Any tool that produces a spec-compliant `.kdna` file and passes `kdna validate`.

- **Toolchain**: Third-party tool, validated by official CLI
- **Provenance**: `authoring.created_by: <tool_name>`, `authoring.conformance.passed: true`
- **Characteristics**: Must record conformance metadata; no magic strings required

## Recommended Creation Path

The **official KDNA toolchain** (Studio Core + CLI + SDK) is the recommended creation path. It provides:

- Guided authoring with judgment cards
- Automated validation and cross-file consistency checks
- Compilation, digest computation, and provenance metadata
- Optional Human Lock, signing, and encryption

Use the official SDK or CLI to validate output regardless of creation path.

## What Is NOT Required

The following are **optional enhancements**, not creation requirements:

- ❌ Registry listing
- ❌ Human Lock
- ❌ Signature
- ❌ Encryption
- ❌ License metadata
- ❌ Quality badge
- ❌ `@aikdna/` scope prefix

A `.kdna` file created by an agent, without Human Lock, without signature, without encryption, and validated by `kdna validate` — is a **valid KDNA asset**.
