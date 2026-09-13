#!/usr/bin/env node
/**
 * core-smoke — require-time smoke test for @aikdna/kdna-core.
 *
 * Two surfaces are exercised and must stay separate:
 *
 *   - the accepted public contract (the component-semantics release candidate)
 *     exports exactly `admitBytes` at the root. Source of truth:
 *     specs/public-semantic-source.json:7768-7774
 *     ("engineering.core_surface.root"), mirrored by the entry table in
 *     packages/kdna-core/README.md:7-13 and enforced by
 *     conformance/public-contract/test/package-surfaces.cjs:6. Restoring a
 *     retired alias here would contradict packages/kdna-core/README.md:32
 *     ("Root exports contain no old API aliases").
 *   - the retained 0.22 source line that still lives in this repository and
 *     backs the in-repo container tests (`src/asset-reader.js`, `src/loader.js`,
 *     `src/index.js`). Those files are deliberately absent from the package
 *     export map (packages/kdna-core/package.json "exports"/"files"), and
 *     packages/kdna-core/README.md:32 says historical tests are not evidence
 *     for this RC.
 *
 * Fails CI if require() throws at module load, if the accepted public root
 * surface is missing, or if the retained source line breaks its internal
 * lockstep.
 *
 * Runs from the kdna monorepo root (resolves packages/kdna-core/src) and from
 * any consumer that has @aikdna/kdna-core installed in node_modules.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// The accepted public root surface. Kept as an explicit literal so that a
// change in the public contract forces a conscious edit here instead of
// silently following it. Citation: specs/public-semantic-source.json:7768-7774.
const ACCEPTED_ROOT_EXPORTS = ['admitBytes'];

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

function assertAcceptedRootSurface(m, where) {
  if (!m) throw new Error(`${where}: module exports falsy`);
  if (typeof m.admitBytes !== 'function') {
    throw new Error(`${where}: admitBytes is not exported as a function`);
  }
  const observed = Object.keys(m).sort();
  if (observed.join(',') !== [...ACCEPTED_ROOT_EXPORTS].sort().join(',')) {
    throw new Error(
      `${where}: root exports ${JSON.stringify(observed)}; expected exactly ${JSON.stringify(
        ACCEPTED_ROOT_EXPORTS,
      )}`,
    );
  }
}

// 1. Retained 0.22 source line (in-repo only; not the package public surface).
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
      const container = require(path.join(coreRoot, 'src', 'container', 'index.js'));
      const source = path.join(__dirname, '..', 'examples', 'minimal');
      const assetPath = path.join(tmp, 'smoke.kdna');
      container.pack(source, assetPath);
      const bytes = fs.readFileSync(assetPath);
      const asset = reader.createKdnaAssetReader().openSync(bytes);
      const result = reader.createKdnaAssetReader().loadProfileSync(asset, 'compact');
      if (!result || result.type !== 'kdna.runtime-capsule') {
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

  // 3. The retained line's internal entry (src/index.js) must also load. This
  // is NOT the package public entry — the package entry is
  // src/public-contract/index.js, checked below.
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

// 4. The current public contract entry, loaded from the monorepo source. The
// package "main"/"exports" point here (packages/kdna-core/package.json), so it
// is the surface every consumer of this checkout receives.
const publicEntry = path.join(
  __dirname,
  '..',
  'packages',
  'kdna-core',
  'src',
  'public-contract',
  'index.js',
);
if (fs.existsSync(publicEntry)) {
  check('monorepo src/public-contract/index.js exports the accepted root surface', () => {
    assertAcceptedRootSurface(require(publicEntry), 'monorepo src/public-contract/index.js');
  });
}

// 5. Load from installed package (the consumer path). This is what every
// downstream CLI / Studio / VSCode extension actually does at startup.
try {
  const installed = require.resolve('@aikdna/kdna-core');
  console.log('core-smoke: installed @aikdna/kdna-core found at ' + installed);
  const m = require('@aikdna/kdna-core');
  check('installed @aikdna/kdna-core loads without throwing', () => {
    if (!m) throw new Error('installed module exports falsy');
  });
  check('installed @aikdna/kdna-core exports the accepted root surface', () => {
    assertAcceptedRootSurface(m, 'installed @aikdna/kdna-core');
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
