#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const SIGN_OFF_PATTERN = /^Signed-off-by:\s*(.+?)\s*<([^<>]+)>\s*$/iu;

function commitHasMatchingSignOff({ authorName, authorEmail, message }) {
  const expectedName = String(authorName).trim();
  const expectedEmail = String(authorEmail).trim().toLowerCase();
  return String(message)
    .split(/\r?\n/u)
    .map((line) => SIGN_OFF_PATTERN.exec(line))
    .filter(Boolean)
    .some((match) => (
      match[1].trim() === expectedName
      && match[2].trim().toLowerCase() === expectedEmail
    ));
}

function git(args) {
  return execFileSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function verifyCommitRecords(records) {
  const failures = records.filter((record) => !commitHasMatchingSignOff(record));
  if (failures.length > 0) {
    const summary = failures
      .map((record) => `${record.sha} (${record.authorName} <${record.authorEmail}>)`)
      .join(', ');
    throw new Error(`commits missing an author-matching Signed-off-by trailer: ${summary}`);
  }
}

function main() {
  const [base, head] = process.argv.slice(2);
  if (!SHA_PATTERN.test(base || '') || !SHA_PATTERN.test(head || '')) {
    throw new Error('DCO base and head must be exact 40-character commit SHAs');
  }
  execFileSync('git', ['merge-base', '--is-ancestor', base, head], {
    cwd: repositoryRoot,
    stdio: 'ignore',
  });
  const commits = git(['rev-list', '--reverse', `${base}..${head}`]).split(/\r?\n/u).filter(Boolean);
  if (commits.length === 0) throw new Error('pull request commit range is empty');
  const records = commits.map((sha) => ({
    sha,
    authorName: git(['show', '-s', '--format=%an', sha]),
    authorEmail: git(['show', '-s', '--format=%ae', sha]),
    message: git(['show', '-s', '--format=%B', sha]),
  }));
  verifyCommitRecords(records);
  console.log(`DCO verified for ${records.length} pull request commit(s).`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`DCO verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { commitHasMatchingSignOff, verifyCommitRecords };
