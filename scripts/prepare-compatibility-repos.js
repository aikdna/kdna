#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { resolveComponentPath } = require('./ecosystem-manifest');
const { TRUSTED_GIT, cleanGitEnvironment } = require('./core-release-authority');

function prepareCompatibilityRepos(controlRoot, destination, reposRoot) {
  const manifest = JSON.parse(fs.readFileSync(path.join(controlRoot, 'ecosystem-manifest.json')));
  const selected = manifest.components.filter(
    (component) => component.local_path && component.local_path !== '.' && component.source_commit,
  );
  assert.equal(selected.length, 16, 'compatibility repository inventory differs');
  const inputs = selected.map((component) => {
    assert.match(component.repository, /^aikdna\/[a-z0-9-]+$/u);
    assert.match(component.source_commit, /^[a-f0-9]{40}$/u);
    const source = resolveComponentPath(controlRoot, component, { reposRoot });
    assert.ok(
      source && fs.lstatSync(source).isDirectory() && !fs.lstatSync(source).isSymbolicLink(),
      `missing compatibility history for ${component.repository}`,
    );
    return { component, source: fs.realpathSync(source) };
  });
  destination = path.resolve(destination);
  const parent = fs.realpathSync(path.dirname(destination));
  destination = path.join(parent, path.basename(destination));
  for (const source of [fs.realpathSync(controlRoot), ...inputs.map((input) => input.source)]) {
    assert.ok(
      destination !== source && !destination.startsWith(source + path.sep),
      'compatibility destination must be outside source repositories',
    );
  }
  fs.mkdirSync(destination, { mode: 0o700 }); // Must be a new directory.
  const git = (args) =>
    execFileSync(TRUSTED_GIT, args, {
      env: cleanGitEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120000,
    })
      .toString()
      .trim();
  const records = [];
  for (const { component, source } of inputs) {
    const name = component.repository.split('/').pop();
    const target = path.join(destination, name);
    // A local shared clone reads immutable source objects; it writes no source
    // checkout, worktree metadata or branch, and never fetches a moving ref.
    git(['clone', '--shared', '--no-checkout', '--quiet', source, target]);
    git(['-C', target, 'checkout', '--detach', '--quiet', component.source_commit]);
    assert.equal(git(['-C', target, 'rev-parse', 'HEAD']), component.source_commit);
    assert.equal(git(['-C', target, 'status', '--porcelain']), '');
    records.push({
      repository: component.repository,
      commit: component.source_commit,
      path: target,
    });
  }
  return records;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--destination') {
    console.error('usage: prepare-compatibility-repos.js --destination NEW_DIRECTORY');
    process.exit(2);
  }
  try {
    const root = path.resolve(__dirname, '..');
    const records = prepareCompatibilityRepos(root, args[1], process.env.KDNA_ECOSYSTEM_REPOS_ROOT);
    console.log(JSON.stringify({ status: 'COMPATIBILITY_INPUTS_PREPARED', repositories: records }));
  } catch (error) {
    console.error(`compatibility input preparation failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { prepareCompatibilityRepos };
