#!/usr/bin/env node
'use strict';
const { createAuthority } = require('./release-channel-authority.js');
const authority = createAuthority({
  channel: 'stable',
  base_commit: '0193072d803ea161d8157382c1590d81882c94df',
  versions: { core: '0.37.9', read: '0.13.3' },
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
