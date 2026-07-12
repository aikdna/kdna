const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');

const { readAsset } = require('../src/container-dispatcher.js');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

test('container dispatcher loads sibling modules from packaged src layout', () => {
  const asset = readAsset(path.join(repoRoot, 'examples', 'minimal'));

  assert.equal(asset.sourceKind, 'dir');
  assert.equal(asset.format, 'dir');
  assert.equal(asset.mimetype, 'application/vnd.kdna.asset');
  assert.equal(asset.manifest.asset_id, 'kdna:example:agent-project-context');
  assert.equal(asset.manifest.title, 'Agent Project Context');
});

test('v1 schema validation does not depend on the host project cwd', () => {
  const tmp = os.tmpdir();
  const v1Entry = path.join(repoRoot, 'packages', 'kdna-core', 'src', 'v1', 'index.js');
  const example = path.join(repoRoot, 'examples', 'minimal');
  const script = `
    const v1 = require(${JSON.stringify(v1Entry)});
    const result = v1.validate(${JSON.stringify(example)});
    if (!result.overall_valid) {
      throw new Error(JSON.stringify(result.problems || result, null, 2));
    }
  `;

  execFileSync(process.execPath, ['-e', script], { cwd: tmp });
});
