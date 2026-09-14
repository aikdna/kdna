#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  REPOSITORIES,
  jsonDigest,
  run,
  verifyCheckout,
  assertCheckoutAnchor,
  readRegular,
  declarations,
  compareDeclarations,
  compareMembers,
  inspectArchive,
  packSource,
  resolveTrustedNpmInvocation,
} = require('./ecosystem-source-graph');
const { runNpm } = require('./core-release-authority');
const { verifyChildChecks } = require('./ecosystem-source-ci');

function validateInventory(inventory) {
  assert.equal(inventory.schema_version, '1.0.0');
  assert.ok(Array.isArray(inventory.repositories));
  const names = inventory.repositories.map((row) => row.repository);
  assert.deepEqual(
    [...names].sort(),
    REPOSITORIES.map((name) => `aikdna/${name}`).sort(),
    'current source repository inventory differs in either direction',
  );
  for (const record of inventory.repositories) {
    if (record.repository === 'aikdna/kdna') {
      assert.equal(record.identity, 'current-control-checkout');
      assert.equal(
        record.commit,
        undefined,
        'control checkout must not have a self-referential pin',
      );
    } else {
      assert.match(record.commit, /^[a-f0-9]{40}$/u);
      assert.match(record.tree, /^[a-f0-9]{40}$/u);
      assert.match(record.ci.head, /^[a-f0-9]{40}$/u);
    }
    assert.ok(Array.isArray(record.packs));
    assert.equal(
      new Set(record.packs.map((pack) => pack.directory)).size,
      record.packs.length,
      'duplicate source pack declaration',
    );
  }
}

async function main(argv) {
  assert.ok(
    argv.length === 2 && argv[0] === '--work-dir',
    'usage: ecosystem-source-gate.js --work-dir NEW_DIRECTORY',
  );
  const root = path.resolve(__dirname, '..');
  const inventory = JSON.parse(readRegular(root, 'scripts/ecosystem-source-inventory.json'));
  validateInventory(inventory);
  assert.ok(
    process.env.KDNA_SOURCE_REPOS_ROOT,
    'KDNA_SOURCE_REPOS_ROOT must explicitly identify the fixed source checkouts',
  );
  const reposRoot = fs.realpathSync(process.env.KDNA_SOURCE_REPOS_ROOT);
  const locations = new Map(
    inventory.repositories.map((record) => {
      const name = record.repository.split('/')[1];
      return [record.repository, name === 'kdna' ? root : path.join(reposRoot, name)];
    }),
  );
  const requested = path.resolve(argv[1]);
  const work = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  for (const location of locations.values()) {
    const actual = fs.realpathSync(location);
    assert.ok(
      work !== actual && !work.startsWith(actual + path.sep),
      'source gate output must be outside source checkouts',
    );
  }
  fs.mkdirSync(work, { mode: 0o700 }); // Existing output is never a reusable passing receipt.
  const report = {
    schema_version: '1.0.0',
    status: 'INCOMPLETE',
    started_at: new Date().toISOString(),
    scope: 'current-source-integration',
    repositories: [],
    local_packs: [],
    archive_comparisons: [],
    child_ci: [],
    local_root_commands: [],
    limitations: inventory.proof_limits,
  };
  const save = () =>
    fs.writeFileSync(path.join(work, 'source-gate.json'), JSON.stringify(report, null, 2) + '\n');
  let invocation;
  try {
    const allPacks = new Map();
    const anchors = new Map();
    for (const record of inventory.repositories) {
      const location = locations.get(record.repository);
      const checkout = verifyCheckout(location, record, record.repository === 'aikdna/kdna');
      anchors.set(record.repository, checkout);
      compareDeclarations(declarations(location, checkout.files), record);
      for (const swift of record.swift)
        for (const dependency of swift.dependencies || []) {
          const producer = inventory.repositories.find(
            (item) => dependency.url === `https://github.com/${item.repository}.git`,
          );
          assert.ok(producer, 'Swift source dependency is absent from the current graph');
          assert.equal(
            dependency.revision,
            producer.commit,
            'Swift source dependency differs from its exact graph pin',
          );
        }
      report.repositories.push({
        repository: record.repository,
        commit: checkout.head,
        tree: checkout.tree,
        execution: 'local-source-bytes-and-graph',
        tracked_files: checkout.files.length,
        registered_legs: record.registered_legs,
      });
      console.log(`source bytes and declarations verified: ${record.repository}`);
    }
    invocation = resolveTrustedNpmInvocation();
    for (const record of inventory.repositories)
      for (const [index, expected] of record.packs.entries()) {
        const destination = path.join(work, `pack-${record.repository.split('/')[1]}-${index}`);
        const actual = packSource(
          locations.get(record.repository),
          expected.directory,
          destination,
          invocation,
        );
        assert.equal(actual.name, expected.name);
        assert.equal(actual.version, expected.version);
        assert.equal(
          actual.member_count,
          expected.member_count,
          'current source pack member count differs',
        );
        assert.equal(
          actual.members_sha256,
          expected.members_sha256,
          'current source pack members or bytes differ',
        );
        assert.deepEqual(
          actual.members.map((member) => member.path),
          expected.paths,
          'current source pack paths differ',
        );
        const key = `${actual.name}@${actual.version}`;
        assert.ok(!allPacks.has(key), 'ambiguous current source package producer');
        allPacks.set(key, { record, expected, actual });
        report.local_packs.push({
          repository: record.repository,
          directory: expected.directory,
          name: actual.name,
          version: actual.version,
          sha256: actual.sha256,
          integrity: actual.integrity,
          members_sha256: actual.members_sha256,
          member_count: actual.member_count,
          execution: 'local-real-npm-pack',
          install_scope: expected.install_scope,
        });
        console.log(`actual source package verified: ${key} (${actual.member_count} members)`);
      }
    const compared = new Set();
    for (const record of inventory.repositories)
      for (const archive of record.archives) {
        if (!archive.name.startsWith('@aikdna/') || compared.has(archive.sha256)) continue;
        compared.add(archive.sha256);
        const producer = allPacks.get(`${archive.name}@${archive.version}`);
        const expected = inventory.archive_comparisons.find(
          (row) => row.archive_sha256 === archive.sha256,
        );
        assert.ok(expected, 'KDNA archive has no source comparison declaration');
        if (!producer) {
          assert.equal(expected.relationship, 'retained-other-coordinate');
          report.archive_comparisons.push(expected);
          continue;
        }
        assert.equal(expected.producer, producer.record.repository);
        const actual = inspectArchive(readRegular(locations.get(record.repository), archive.path));
        const differences = compareMembers(actual.members, producer.actual.members);
        assert.deepEqual(differences, expected.differences, 'archive/source differences changed');
        assert.equal(
          expected.relationship,
          differences.length ? 'distinct-fixed-archive-and-source-pack' : 'equal-package-members',
        );
        report.archive_comparisons.push(expected);
      }
    assert.equal(
      compared.size,
      inventory.archive_comparisons.length,
      'archive comparison inventory has extra rows',
    );
    save();
    for (const record of inventory.repositories)
      if (record.repository !== 'aikdna/kdna') {
        report.child_ci.push(await verifyChildChecks(record));
        save();
        console.log(`remote checks and source tree verified: ${record.repository}`);
      }
    const npmCommands = [
      ['run', 'test:core-smoke'],
      ['test'],
      ['run', 'validate:examples'],
      ['audit', '--audit-level=high'],
    ];
    for (const args of npmCommands) {
      const started = new Date().toISOString();
      const log = `root-${args.join('-')}.log`;
      const command = {
        command: ['trusted-npm', ...args],
        status: 'INCOMPLETE',
        started_at: started,
        log,
      };
      report.local_root_commands.push(command);
      save();
      const output = fs.openSync(path.join(work, log), 'wx', 0o600);
      try {
        runNpm(invocation, args, {
          cwd: root,
          projectRoot: root,
          timeout: 600000,
          stdio: ['ignore', output, output],
        });
        command.status = 'PASS';
      } catch (error) {
        command.status = /ETIMEDOUT/u.test(error.message) ? 'TIMED_OUT' : 'FAILED';
        throw error;
      } finally {
        fs.closeSync(output);
        save();
      }
    }
    const python = process.env.KDNA_PYTHON || 'python3';
    const pythonCommand = {
      command: ['python', 'scripts/run-source-pytest.py'],
      status: 'INCOMPLETE',
      started_at: new Date().toISOString(),
      log: 'root-python.log',
      receipt: 'root-python.json',
    };
    report.local_root_commands.push(pythonCommand);
    save();
    const pythonLog = fs.openSync(path.join(work, pythonCommand.log), 'wx', 0o600);
    try {
      run(python, ['-I', path.join(root, 'scripts/run-source-pytest.py'), root, work], {
        cwd: root,
        timeout: 300000,
        stdio: ['ignore', pythonLog, pythonLog],
      });
      const receipt = JSON.parse(readRegular(work, pythonCommand.receipt));
      assert.equal(receipt.status, 'PASS', 'Python runner did not verify execution');
      pythonCommand.counts = receipt.counts;
      pythonCommand.status = 'PASS';
    } catch (error) {
      pythonCommand.status = /ETIMEDOUT/u.test(error.message) ? 'TIMED_OUT' : 'FAILED';
      throw error;
    } finally {
      fs.closeSync(pythonLog);
      save();
    }
    for (const record of inventory.repositories) {
      const final = verifyCheckout(
        locations.get(record.repository),
        record,
        record.repository === 'aikdna/kdna',
      );
      assertCheckoutAnchor(final, anchors.get(record.repository));
    }
    report.status = 'PASS';
    report.completed_at = new Date().toISOString();
    save();
    console.log(
      'current source integration PASS; local executions and remote checks are recorded separately',
    );
  } catch (error) {
    report.status = 'BLOCKED';
    report.failure = error.message;
    report.completed_at = new Date().toISOString();
    save();
    throw error;
  } finally {
    invocation?.cleanup();
  }
}

if (require.main === module)
  main(process.argv.slice(2)).catch((error) => {
    console.error(`current source integration blocked: ${error.message}`);
    process.exitCode = 1;
  });
module.exports = { main, validateInventory };
