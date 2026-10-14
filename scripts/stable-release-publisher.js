#!/usr/bin/env node
'use strict';
const { createPublisher } = require('./release-channel-publisher.js');
const publisher = createPublisher({
  channel: 'stable',
  versions: { '@aikdna/kdna-core': '0.37.5', '@aikdna/kdna-read': '0.13.0' },
});
if (require.main === module)
  publisher.main().catch(() => {
    console.error('Verified stable publisher rejected the request');
    process.exitCode = 1;
  });
module.exports = publisher;
