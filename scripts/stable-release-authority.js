#!/usr/bin/env node
'use strict';
const { createAuthority } = require('./release-channel-authority.js');
const authority = createAuthority({
  channel: 'stable',
  base_commit: '522e98578af1951cde55115884e88b7aa91e936e',
  versions: { core: '0.37.10', read: '0.13.4' },
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
