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

test('container schema validation does not depend on the host project cwd', () => {
  const tmp = os.tmpdir();
  const containerEntry = path.join(
    repoRoot,
    'packages',
    'kdna-core',
    'src',
    'container',
    'index.js',
  );
  const example = path.join(repoRoot, 'examples', 'minimal');
  const script = `
    const container = require(${JSON.stringify(containerEntry)});
    const result = container.validate(${JSON.stringify(example)});
    if (!result.overall_valid) {
      throw new Error(JSON.stringify(result.problems || result, null, 2));
    }
  `;

  execFileSync(process.execPath, ['-e', script], { cwd: tmp });
});

test('dispatcher load failure warns instead of being silently swallowed', () => {
  const containerEntry = path.join(repoRoot, 'packages', 'kdna-core', 'src', 'container', 'index.js');
  const script = `
    const Module = require('node:module');
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
      if (request.endsWith('container-dispatcher.js')) {
        const error = new Error('tampered dispatcher: simulated syntax failure');
        error.code = 'ERR_TAMPERED';
        throw error;
      }
      return originalLoad.apply(this, arguments);
    };
    process.on('warning', (warning) => {
      if (warning.code === 'KDNA_DISPATCHER_DEGRADED') {
        console.log('WARNING_EMITTED: ' + warning.message);
      }
    });
    const container = require(${JSON.stringify(containerEntry)});
    if (typeof container.validate !== 'function') {
      throw new Error('container API missing after dispatcher failure');
    }
  `;
  const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  assert.match(out, /WARNING_EMITTED: container-dispatcher failed to load/);
});

test('genuinely missing dispatcher module falls back without a warning', () => {
  const containerEntry = path.join(repoRoot, 'packages', 'kdna-core', 'src', 'container', 'index.js');
  const script = `
    const Module = require('node:module');
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
      if (request.endsWith('container-dispatcher.js')) {
        const error = new Error("Cannot find module '../container-dispatcher.js'");
        error.code = 'MODULE_NOT_FOUND';
        throw error;
      }
      return originalLoad.apply(this, arguments);
    };
    let warned = false;
    process.on('warning', (warning) => {
      if (warning.code === 'KDNA_DISPATCHER_DEGRADED') warned = true;
    });
    const container = require(${JSON.stringify(containerEntry)});
    if (typeof container.validate !== 'function') {
      throw new Error('container API missing after dispatcher loss');
    }
    if (warned) throw new Error('MODULE_NOT_FOUND fallback must stay silent');
    console.log('SILENT_FALLBACK_OK');
  `;
  const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  assert.match(out, /SILENT_FALLBACK_OK/);
});
