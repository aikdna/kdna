#!/usr/bin/env node
'use strict';
const { createPublisher } = require('./release-channel-publisher.js');
const publisher = createPublisher({
  channel: 'preview',
  versions: {
    '@aikdna/kdna-core': '0.37.1-rc.browser.1',
    '@aikdna/kdna-read': '0.11.2-rc.browser.1',
  },
});
if (require.main === module)
  publisher.main().catch(() => {
    console.error('Verified preview publisher rejected the request');
    process.exitCode = 1;
  });
module.exports = publisher;
