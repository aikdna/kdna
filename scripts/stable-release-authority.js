#!/usr/bin/env node
'use strict';
const { createAuthority } = require('./release-channel-authority.js');
const authority = createAuthority({
  channel: 'stable',
  base_commit: 'a56152fa78971517798408f65cb07eb7d37caf10',
  versions: { core: '0.37.11', read: '0.13.5' },
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
