#!/usr/bin/env node
/**
 * core-smoke — require-time smoke test for @aikdna/kdna-core.
 *
 * Prevents regressions like the missing STANDARD_ENTRIES bug from re-entering
 * main. Fails CI if:
 *   - require() throws at module load
 *   - STANDARD_ENTRIES is missing or empty
 *   - the standard entries don't match the loader FILE_MAP
 *
 * Runs from the kdna monorepo root (resolves packages/kdna-core/src) and from
 * any consumer that has @aikdna/kdna-core installed in node_modules.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  PASS ${name}`);
  } catch (e) {
    failures += 1;
    console.error(`  FAIL ${name}: ${e.message}`);
  }
}

// 1. Load from monorepo source (the development path).
const monorepoSource = path.join(
  __dirname,
  '..',
  'packages',
  'kdna-core',
  'src',
  'asset-reader.js',
);
if (fs.existsSync(monorepoSource)) {
  console.log('core-smoke: monorepo source path');
  const reader = require(monorepoSource);
  check('asset-reader.js loads without throwing', () => {
    if (!reader) throw new Error('module exports falsy');
  });
  check('STANDARD_ENTRIES exported', () => {
    if (!reader.STANDARD_ENTRIES) throw new Error('STANDARD_ENTRIES not exported');
  });
  check('STANDARD_ENTRIES is a non-empty array', () => {
    if (!Array.isArray(reader.STANDARD_ENTRIES) || reader.STANDARD_ENTRIES.length === 0) {
      throw new Error('STANDARD_ENTRIES must be a non-empty array');
    }
  });
  check('STANDARD_ENTRIES entries are all strings ending in .json', () => {
    for (const e of reader.STANDARD_ENTRIES) {
      if (typeof e !== 'string' || !e.endsWith('.json')) {
        throw new Error(`bad entry: ${e}`);
      }
    }
  });
  check('STANDARD_ENTRIES is frozen', () => {
    if (!Object.isFrozen(reader.STANDARD_ENTRIES)) {
      throw new Error('STANDARD_ENTRIES must be Object.freeze()d to prevent mutation');
    }
  });

  // Exercise the real current container path. A fabricated entries Map is not
  // a Runtime asset and must not be accepted as a substitute for original
  // container bytes.
  check('loadProfileSync returns a Runtime Capsule for current .kdna bytes', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-smoke-'));
    try {
      const coreRoot = path.join(__dirname, '..', 'packages', 'kdna-core');
      const v1 = require(path.join(coreRoot, 'src', 'v1', 'index.js'));
      const source = path.join(__dirname, '..', 'examples', 'minimal');
      const assetPath = path.join(tmp, 'smoke.kdna');
      v1.pack(source, assetPath);
      const bytes = fs.readFileSync(assetPath);
      const asset = reader.createKdnaAssetReader().openSync(bytes);
      const result = reader.createKdnaAssetReader().loadProfileSync(asset, 'compact');
      if (!result || result.type !== 'kdna.context.capsule') {
        throw new Error('loadProfileSync did not return a Runtime Capsule');
      }

      let rejected = false;
      try {
        reader.createKdnaAssetReader().openSync(bytes.subarray(0, bytes.length - 22));
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error('truncated current asset was not rejected');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // 2. Source-level invariant: every STANDARD_ENTRIES entry must be in loader.FILE_MAP.
  const loader = require(path.join(__dirname, '..', 'packages', 'kdna-core', 'src', 'loader.js'));
  const fileMap = loader.FILE_MAP || {};
  const fileMapValues = new Set(Object.values(fileMap));
  check('every STANDARD_ENTRIES entry exists in loader.FILE_MAP', () => {
    for (const e of reader.STANDARD_ENTRIES) {
      if (!fileMapValues.has(e)) {
        throw new Error(`${e} not in loader.FILE_MAP — keep STANDARD_ENTRIES in lockstep`);
      }
    }
  });
  check('every loader.FILE_MAP value is in STANDARD_ENTRIES', () => {
    for (const v of fileMapValues) {
      if (!reader.STANDARD_ENTRIES.includes(v)) {
        throw new Error(`loader.FILE_MAP has ${v} but STANDARD_ENTRIES does not`);
      }
    }
  });

  // 3. Top-level index.js (the public entry) must also load.
  const indexPath = path.join(__dirname, '..', 'packages', 'kdna-core', 'src', 'index.js');
  check('kdna-core/src/index.js loads and re-exports STANDARD_ENTRIES', () => {
    const m = require(indexPath);
    if (!m.STANDARD_ENTRIES) throw new Error('index.js does not re-export STANDARD_ENTRIES');
    if (m.STANDARD_ENTRIES !== reader.STANDARD_ENTRIES) {
      throw new Error('STANDARD_ENTRIES in index.js is a different reference than asset-reader.js');
    }
  });
} else {
  console.log('core-smoke: not in monorepo, checking installed package only');
}

// 4. Load from installed package (the consumer path). This is what every
// downstream CLI / Studio / VSCode extension actually does at startup.
try {
  const installed = require.resolve('@aikdna/kdna-core');
  console.log('core-smoke: installed @aikdna/kdna-core found at ' + installed);
  const m = require('@aikdna/kdna-core');
  check('installed @aikdna/kdna-core loads without throwing', () => {
    if (!m) throw new Error('installed module exports falsy');
  });
  check('installed @aikdna/kdna-core exports STANDARD_ENTRIES', () => {
    if (!m.STANDARD_ENTRIES) throw new Error('installed package missing STANDARD_ENTRIES');
  });
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('core-smoke: @aikdna/kdna-core not installed, skipping consumer check');
  } else {
    failures += 1;
    console.error(`  FAIL installed @aikdna/kdna-core require: ${e.message}`);
  }
}

if (failures > 0) {
  console.error(`\ncore-smoke: ${failures} failure(s)`);
  process.exit(1);
}
console.log('\ncore-smoke: all checks passed');
