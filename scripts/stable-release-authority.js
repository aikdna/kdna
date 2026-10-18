#!/usr/bin/env node
'use strict';
const { createAuthority } = require('./release-channel-authority.js');
const authority = createAuthority({
  channel: 'stable',
  base_commit: 'b28b0b4c831365727df748c980895f059c8e677e',
  versions: { core: '0.37.8', read: '0.13.2' },
});
if (require.main === module) {
  try {
    authority.main();
  } catch (error) {
    console.error('Stable release rejected: ' + error.message);
    process.exitCode = 1;
  }
}
module.exports = authority;
