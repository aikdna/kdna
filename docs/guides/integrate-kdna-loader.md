# Integrate the KDNA Loader

> **Status: Phase 1 placeholder.**

This guide will walk through integrating `@aikdna/kdna-core` into an AI agent runtime. The minimum integration is:

```js
const { loadKdnaSync } = require('@aikdna/kdna-core');
const result = loadKdnaSync('./my-asset.kdna', { profile: 'compact' });
if (result.status === 'loaded') {
  // pass result.domain to your agent
}
```

Phase 1 only documents the format baseline. A full integration guide is reserved for a later phase.
