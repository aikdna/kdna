#!/usr/bin/env node
const { execSync } = require('child_process');
const major = parseInt(process.versions.node.split('.')[0], 10);

const flag = major <= 18 ? '--experimental-test-runner --test' : '--test';
const cmd = `node ${flag} ${__dirname}/*.test.js`;

try {
  execSync(cmd, { stdio: 'inherit', shell: true });
} catch (e) {
  process.exit(e.status || 1);
}
