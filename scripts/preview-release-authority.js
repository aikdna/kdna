#!/usr/bin/env node
'use strict';
const { createAuthority } = require('./release-channel-authority.js');
const authority = createAuthority({
  channel: 'preview',
  base_commit: 'c4299d751e0b5cac9474d2a95ce976c9cac0b267',
  versions: { core: '0.37.1-rc.browser.1', read: '0.11.2-rc.browser.1' },
});
if (require.main === module) {
  try {
    authority.main();
  } catch (error) {
    console.error('Preview release rejected: ' + error.message);
    process.exitCode = 1;
  }
}
module.exports = authority;
