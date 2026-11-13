# KDNA Studio

> **Historical / Legacy Line Notice:** `@aikdna/kdna-studio-cli` (`0.14.0`) and `@aikdna/kdna-studio-core` (`4.1.0`) maintain the separate **legacy Container `0.5.0` session line**. For all current **Container `0.6.0`** judgment-work creation (`init --example`, `validate-input`, `create --draft`), local password protection (`protect`), and selective reading (`read`), use **`@aikdna/kdna-cli`** (see [Start Here](../start-here.md)).
>
> **Status: placeholder.** The Studio docs will be expanded as the pre-release
> authoring contract gains exact-version compatibility evidence.

KDNA Studio is the authoring environment for KDNA assets. Producers use Studio to encode their judgment systems as `.kdna` files.

The Studio is implemented across two repos:

- [`@aikdna/kdna-studio-core`](https://www.npmjs.com/package/@aikdna/kdna-studio-core) — the compile pipeline and library
- [`@aikdna/kdna-studio-cli`](https://www.npmjs.com/package/@aikdna/kdna-studio-cli) — the CLI wrapper

See those repos for the current implementation. This page does not assign a
blanket maturity level to either component.
