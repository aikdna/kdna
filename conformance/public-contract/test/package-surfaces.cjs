'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  assert = require('node:assert/strict'),
  Module = require('node:module'),
  { pathToFileURL } = require('node:url');
const F = require('./bytes-fixtures.cjs');
const runtime = process.argv[2],
  out = process.argv[3],
  { req, coreDir, readDir } = F.runtime(runtime);
const rows = [];
async function check(id, fn) {
  try {
    rows.push({ id, status: 'MATCH', detail: await fn() });
  } catch (error) {
    rows.push({ id, status: 'FAIL', error: error.message, stack: error.stack });
  }
}
const surfaces = {
  '@aikdna/kdna-core': ['admitBytes'],
  '@aikdna/kdna-core/node': ['admitNode'],
  '@aikdna/kdna-core/browser': ['admitBrowser'],
  '@aikdna/kdna-core/read-boundary': ['inspectSnapshot'],
  '@aikdna/kdna-read': ['admitReadRequest', 'project'],
  '@aikdna/kdna-read/node': ['readNode'],
  '@aikdna/kdna-read/browser': ['readBrowser'],
  '@aikdna/kdna-read/embedding': [
    'createTrustedHostReadProvider',
    'createTrustedReadControlProvider',
  ],
};
// The sandbox loads the accepted packages plus the dependencies those packages
// declare in their own package.json. The generated validators import Ajv's own
// runtime helpers ("ajv/dist/runtime/equal", "ajv/dist/runtime/ucs2length"), so a
// sandbox that admits only the two package directories rejects the real graph.
function packageRootOf(entry, workspaceRoots = []) {
  for (const root of workspaceRoots) if (entry.startsWith(root + path.sep)) return root;
  let dir = path.dirname(entry);
  for (;;) {
    const parent = path.dirname(dir);
    if (path.basename(parent) === 'node_modules') return dir;
    if (
      path.basename(parent).startsWith('@') &&
      path.basename(path.dirname(parent)) === 'node_modules'
    )
      return dir;
    if (parent === dir) throw Error('Cannot locate the package root of ' + entry);
    dir = parent;
  }
}
function declaredDependencyRoots(startDirs) {
  const roots = [],
    visited = new Set(),
    queue = [...startDirs];
  while (queue.length > 0) {
    const dir = queue.shift();
    if (visited.has(dir)) continue;
    visited.add(dir);
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')),
      dependencyRequire = Module.createRequire(path.join(dir, 'package.json'));
    for (const name of [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.optionalDependencies ?? {}),
    ]) {
      let root;
      // An absent optional dependency cannot be loaded either, so it is not a root.
      try {
        root = packageRootOf(dependencyRequire.resolve(name));
      } catch {
        continue;
      }
      roots.push(root);
      queue.push(root);
    }
  }
  return roots;
}
const graphRoots = [...new Set([coreDir, readDir, ...declaredDependencyRoots([coreDir, readDir])])];
// A browser bundle never runs a dependency's Node-only branch: the bundler
// applies the package's own "browser" map before loading the file. The sandbox
// does the same for the object form of that field, so the graph it loads is the
// graph the shipped browser artifact is built from. `false` means an empty module.
function browserFieldTarget(specifier, fromFile, resolve) {
  const owner = packageRootOf(fromFile, [coreDir, readDir]),
    manifest = JSON.parse(fs.readFileSync(path.join(owner, 'package.json'), 'utf8')),
    browser = manifest.browser,
    keys = [specifier];
  if (typeof manifest.name === 'string' && specifier.startsWith(manifest.name + '/'))
    keys.push('./' + specifier.slice(manifest.name.length + 1));
  if (!specifier.startsWith('.') && !specifier.startsWith('node:'))
    keys.push('./' + path.relative(owner, resolve.resolve(specifier)).split(path.sep).join('/'));
  if (browser && typeof browser === 'object' && !Array.isArray(browser))
    for (const key of keys)
      if (Object.hasOwn(browser, key))
        return browser[key] === false ? null : path.resolve(owner, browser[key]);
  return resolve.resolve(specifier);
}
function browserSandbox() {
  const context = vm.createContext({ TextEncoder, TextDecoder });
  const modules = new Map(),
    loaded = [],
    blocked = [];
  function load(file) {
    if (Module.isBuiltin(file)) {
      blocked.push(file);
      throw Error('Node dependency forbidden ' + file);
    }
    assert.ok(
      graphRoots.some((root) => file === root || file.startsWith(root + path.sep)),
      'Only new Core/Read graph',
    );
    if (modules.has(file)) return modules.get(file).exports;
    loaded.push(file);
    const module = { exports: {} };
    modules.set(file, module);
    if (file.endsWith('.json')) {
      // Emulate require() inside the sandbox realm: host-parsed JSON would carry the
      // host realm's Object.prototype and the package's own strict-input copy would
      // reject it before any browser behavior ran.
      module.exports = vm.runInContext('JSON.parse', context)(fs.readFileSync(file, 'utf8'));
      return module.exports;
    }
    const resolve = Module.createRequire(file);
    const factory = vm.runInContext(
      '(function(require,module,exports){' + fs.readFileSync(file, 'utf8') + '\n})',
      context,
      { filename: file },
    );
    factory(
      (name) => {
        const target = browserFieldTarget(name, file, resolve);
        if (target === null) return {};
        return load(target);
      },
      module,
      module.exports,
    );
    return module.exports;
  }
  return { load, context, loaded, blocked };
}
async function main() {
  await check('CJS-ESM-EXACT-EXPORTS', async () => {
    const observed = [];
    for (const [name, keys] of Object.entries(surfaces)) {
      const cjs = req(name);
      assert.deepEqual(Object.keys(cjs).sort(), keys.sort());
      const p = name.startsWith('@aikdna/kdna-core') ? coreDir : readDir;
      const pkg = JSON.parse(fs.readFileSync(path.join(p, 'package.json'))),
        suffix = name.replace(/^@aikdna\/(?:kdna-core|kdna-read)/, '') || '.',
        key = suffix === '.' ? '.' : '.' + suffix;
      const esm = await import(pathToFileURL(path.join(p, pkg.exports[key].import)).href);
      assert.deepEqual(Object.keys(esm).sort(), keys.sort());
      for (const k of keys) assert.equal(esm[k], cjs[k]);
      observed.push({ name, keys, identity_equal: true });
    }
    return observed;
  });
  await check('PRODUCTION-EXPORT-BYPASS-DENIED', () => {
    for (const name of [
      '@aikdna/kdna-core/src/public-contract/brand.js',
      '@aikdna/kdna-core/test',
      '@aikdna/kdna-core/fixture',
      '@aikdna/kdna-read/src/brands.js',
      '@aikdna/kdna-read/test',
    ])
      assert.throws(() => req(name), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
    return { test_issuer_exports: 0 };
  });
  await check('NODE-FREE-ROOT-AND-BROWSER-GRAPH', async () => {
    const sandbox = browserSandbox();
    const read = sandbox.load(req.resolve('@aikdna/kdna-read')),
      browser = sandbox.load(req.resolve('@aikdna/kdna-read/browser')),
      embed = sandbox.load(req.resolve('@aikdna/kdna-read/embedding'));
    const source = JSON.parse(
        fs.readFileSync(path.join(coreDir, 'src/public-contract/generated-contract.json')),
      ),
      asset = F.blank(source.versionTuple),
      candidate = F.candidate(source.versionTuple, asset),
      control = embed.createTrustedReadControlProvider(() => ({
        admission_response_limit_bytes: 1000000,
      }));
    let calls = 0;
    const host = embed.createTrustedHostReadProvider({
      observe: () => {
        calls++;
        throw Error('Host must not run without Core capability');
      },
    });
    const typed = vm.runInContext('new Uint8Array(1)', sandbox.context);
    const result = await browser.readBrowser(typed, candidate, control, host);
    // A byte array is a real browser input, not an unsupported capability: Core
    // admission runs in the sandbox and rejects the one-byte container as invalid
    // before any Host callback. The obligation is the fail-closed ordering below.
    assert.equal(result.channel, 'read_envelope');
    assert.equal(result.envelope.diagnostics[0].code, 'READ_CORE_INVALID');
    assert.equal(calls, 0);
    assert.equal(
      read.project(read.admitReadRequest(candidate, control).admitted_request, {}).diagnostics[0]
        .code,
      'READ_SNAPSHOT_UNATTESTED',
    );
    assert.equal(sandbox.blocked.length, 0);
    assert.equal(
      vm.runInContext(
        'typeof process+":"+typeof Buffer+":"+typeof window+":"+typeof document',
        sandbox.context,
      ),
      'undefined:undefined:undefined:undefined',
    );
    return {
      route:
        'Node vm without Node globals, custom package CJS loader; not an actual browser engine',
      loaded: sandbox.loaded,
      blocked: sandbox.blocked,
      browser_result: result,
    };
  });
  await check('DUPLICATE-CORE-FAILS-CLOSED', () => {
    const folder = path.join(path.dirname(out), 'duplicate-core');
    fs.mkdirSync(folder, { recursive: true });
    const second = path.join(folder, 'node_modules/@aikdna/kdna-core');
    fs.mkdirSync(path.dirname(second), { recursive: true });
    fs.cpSync(coreDir, second, { recursive: true });
    const secondRequire = Module.createRequire(path.join(folder, 'package.json'));
    const independent = secondRequire('@aikdna/kdna-core/read-boundary');
    const core = req('@aikdna/kdna-core'),
      boundary = req('@aikdna/kdna-core/read-boundary'),
      tuple = JSON.parse(
        fs.readFileSync(path.join(coreDir, 'src/public-contract/generated-contract.json')),
      ).versionTuple,
      asset = F.blank(tuple),
      snapshot = core.admitBytes(F.encode(asset, req)).snapshot;
    assert.ok(boundary.inspectSnapshot(snapshot));
    assert.equal(independent.inspectSnapshot(snapshot), null);
    assert.notEqual(independent.inspectSnapshot, boundary.inspectSnapshot);
    const secondRead = path.join(folder, 'node_modules/@aikdna/kdna-read');
    fs.cpSync(readDir, secondRead, { recursive: true });
    const foreignRead = secondRequire('@aikdna/kdna-read'),
      foreignEmbed = secondRequire('@aikdna/kdna-read/embedding');
    const control = foreignEmbed.createTrustedReadControlProvider(() => ({
      admission_response_limit_bytes: 1000000,
    }));
    const admitted = foreignRead.admitReadRequest(F.candidate(tuple, asset), control);
    const failed = foreignRead.project(admitted.admitted_request, snapshot);
    assert.equal(failed.diagnostics[0].code, 'READ_SNAPSHOT_UNATTESTED');
    return { duplicate_core: second, foreign_snapshot: null, foreign_read_result: failed };
  });
  const report = {
    format: 'kdna.package-surfaces/1',
    at: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    count: rows.length,
    matched: rows.filter((x) => x.status === 'MATCH').length,
    failed: rows.filter((x) => x.status === 'FAIL').length,
    rows,
  };
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      matched: report.matched,
      failed: report.failed,
      failures: rows.filter((x) => x.status === 'FAIL'),
    }),
  );
  process.exitCode = report.failed ? 1 : 0;
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
