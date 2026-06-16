# KDNA Loader SDK

> **Status: Phase 1 placeholder.**

The KDNA Loader SDK is the embeddable runtime that AI agents use to read `.kdna` files. It validates the container, applies the load contract, decrypts entries when permitted, and returns the payload to the caller.

Implementation: [`@aikdna/kdna-core`](https://github.com/aikdna/kdna-core) (the `kdna-core` package in this monorepo)

The SDK is loader-safety-mandatory (see `principles.md`, item 8). It refuses to silently succeed on bad inputs.
