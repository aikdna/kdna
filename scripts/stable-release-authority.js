#!/usr/bin/env node
'use strict';
const { createAuthority } = require('./release-channel-authority.js');
const authority = createAuthority({
  channel: 'stable',
  base_commit: 'd9c036661459b0588dba715a800997f1790e14f1',
  versions: { core: '0.37.6', read: '0.13.0' },
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
