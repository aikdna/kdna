#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');
const { TextDecoder } = require('node:util');
const zlib = require('node:zlib');
const {
  ECOSYSTEM_GATE_STAGE_MAX_BYTES,
  isSafeEcosystemGateStage,
} = require('./ecosystem-gate-stages.js');

const REPO_ROOT = path.resolve(__dirname, '..');
const PACKAGE_RELATIVE = 'packages/kdna-core';
const PACKAGE_NAME = '@aikdna/kdna-core';
const REPOSITORY = 'aikdna/kdna';
const TRUSTED_GIT = '/usr/bin/git';
const AUDITED_NPM_VERSION = '11.17.0';
const TRUSTED_NPM_URL = 'https://registry.npmjs.org/npm/-/npm-11.17.0.tgz';
const TRUSTED_NPM_INTEGRITY =
  'sha512-PurxiZexEHDTE4SSaLI3ZrnbAGiZfeyUcQcxcP5D+hfytNAze/D1IzDuInTn9XVLIbAQUnQuSPXJx02LHjLvQw==';
const TRUSTED_NPM_ENVIRONMENT = 'KDNA_TRUSTED_NPM_TARBALL';
const TRUSTED_NPM_FILENAME = `npm-${AUDITED_NPM_VERSION}.tgz`;
const TRUSTED_NPM_ENTRY_COUNT = 1938;
const TRUSTED_NPM_COMPRESSED_LIMIT = 16 * 1024 * 1024;
const TRUSTED_NPM_UNPACKED_LIMIT = 64 * 1024 * 1024;
const TRUSTED_PUBLISHER_RELATIVE = 'scripts/core-release-publisher.js';
const OFFICIAL_REGISTRY = 'https://registry.npmjs.org/';
const REGISTRY_TIMEOUT_MS = 30_000;
const COMMIT_RE = /^[0-9a-f]{40}$/u;
const OBJECT_RE = /^[0-9a-f]{40}$/u;
const STABLE_SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;
const UTF8 = new TextDecoder('utf-8', { fatal: true });
const TREE_LIMITS = Object.freeze({
  files: 10_000,
  fileBytes: 16 * 1024 * 1024,
  totalBytes: 128 * 1024 * 1024,
  pathBytes: 1024,
  segmentBytes: 255,
});
const TAR_LIMITS = Object.freeze({
  packedBytes: 64 * 1024 * 1024,
  files: 1024,
  fileBytes: 32 * 1024 * 1024,
  totalBytes: 128 * 1024 * 1024,
});
const JSON_LIMITS = Object.freeze({ bytes: 8 * 1024 * 1024, depth: 64 });

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function exactKeys(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} fields are not exact`);
}

function strictJson(bytes, label, limits = JSON_LIMITS) {
  assert(
    limits &&
      Number.isSafeInteger(limits.bytes) &&
      limits.bytes > 0 &&
      limits.bytes <= JSON_LIMITS.bytes &&
      Number.isSafeInteger(limits.depth) &&
      limits.depth > 0 &&
      limits.depth <= JSON_LIMITS.depth,
    `${label} JSON limits are invalid`,
  );
  let source;
  if (Buffer.isBuffer(bytes) || bytes instanceof Uint8Array) {
    assert(bytes.byteLength <= limits.bytes, `${label} exceeds the JSON byte limit`);
    assert(
      !(bytes.byteLength >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf),
      `${label} must not begin with a UTF-8 BOM`,
    );
    try {
      source = UTF8.decode(bytes);
    } catch {
      fail(`${label} is not valid UTF-8`);
    }
  } else {
    assert(typeof bytes === 'string', `${label} must be JSON text or bytes`);
    source = bytes;
  }
  assert(source.charCodeAt(0) !== 0xfeff, `${label} must not begin with a BOM`);
  assert(Buffer.byteLength(source, 'utf8') <= limits.bytes, `${label} exceeds the JSON byte limit`);
  return new DuplicateSafeJsonParser(source, label, limits.depth).parse();
}

class DuplicateSafeJsonParser {
  constructor(source, label, maxDepth) {
    this.source = source;
    this.label = label;
    this.maxDepth = maxDepth;
    this.index = 0;
  }

  reject(message) {
    fail(`${this.label} is not one valid JSON document: ${message} at ${this.index}`);
  }

  whitespace() {
    while (
      this.index < this.source.length &&
      [' ', '\n', '\r', '\t'].includes(this.source[this.index])
    ) {
      this.index += 1;
    }
  }

  parse() {
    this.whitespace();
    const value = this.value(0);
    this.whitespace();
    if (this.index !== this.source.length) this.reject('trailing content');
    return value;
  }

  value(depth) {
    this.whitespace();
    const char = this.source[this.index];
    if (char === '{' || char === '[') {
      if (depth >= this.maxDepth) this.reject('nesting limit exceeded');
      return char === '{' ? this.object(depth + 1) : this.array(depth + 1);
    }
    if (char === '"') return this.string();
    if (char === '-' || (char >= '0' && char <= '9')) return this.number();
    for (const [literal, value] of [
      ['true', true],
      ['false', false],
      ['null', null],
    ]) {
      if (this.source.startsWith(literal, this.index)) {
        this.index += literal.length;
        return value;
      }
    }
    this.reject('expected a value');
  }

  object(depth) {
    const value = {};
    const keys = new Set();
    this.index += 1;
    this.whitespace();
    if (this.source[this.index] === '}') {
      this.index += 1;
      return value;
    }
    while (this.index < this.source.length) {
      if (this.source[this.index] !== '"') this.reject('expected a quoted member name');
      const key = this.string();
      if (keys.has(key)) this.reject(`duplicate member ${JSON.stringify(key)}`);
      keys.add(key);
      this.whitespace();
      if (this.source[this.index] !== ':') this.reject('expected a colon');
      this.index += 1;
      Object.defineProperty(value, key, {
        value: this.value(depth),
        enumerable: true,
        writable: true,
        configurable: true,
      });
      this.whitespace();
      if (this.source[this.index] === '}') {
        this.index += 1;
        return value;
      }
      if (this.source[this.index] !== ',') this.reject('expected a comma or closing brace');
      this.index += 1;
      this.whitespace();
    }
    this.reject('unterminated object');
  }

  array(depth) {
    const value = [];
    this.index += 1;
    this.whitespace();
    if (this.source[this.index] === ']') {
      this.index += 1;
      return value;
    }
    while (this.index < this.source.length) {
      value.push(this.value(depth));
      this.whitespace();
      if (this.source[this.index] === ']') {
        this.index += 1;
        return value;
      }
      if (this.source[this.index] !== ',') this.reject('expected a comma or closing bracket');
      this.index += 1;
      this.whitespace();
    }
    this.reject('unterminated array');
  }

  string() {
    this.index += 1;
    let value = '';
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (char === '"') {
        this.index += 1;
        return value;
      }
      if (char === '\\') {
        this.index += 1;
        value += this.escape();
        continue;
      }
      const code = this.source.charCodeAt(this.index);
      if (code <= 0x1f) this.reject('unescaped control character');
      if (code >= 0xd800 && code <= 0xdbff) {
        const low = this.source.charCodeAt(this.index + 1);
        if (low < 0xdc00 || low > 0xdfff) this.reject('unpaired Unicode surrogate');
        value += this.source.slice(this.index, this.index + 2);
        this.index += 2;
        continue;
      }
      if (code >= 0xdc00 && code <= 0xdfff) this.reject('unpaired Unicode surrogate');
      value += char;
      this.index += 1;
    }
    this.reject('unterminated string');
  }

  escape() {
    const char = this.source[this.index];
    const simple = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
    if (Object.prototype.hasOwnProperty.call(simple, char)) {
      this.index += 1;
      return simple[char];
    }
    if (char !== 'u') this.reject('invalid string escape');
    this.index += 1;
    const first = this.hexCodeUnit();
    if (first >= 0xd800 && first <= 0xdbff) {
      if (this.source.slice(this.index, this.index + 2) !== '\\u') {
        this.reject('unpaired Unicode surrogate');
      }
      this.index += 2;
      const second = this.hexCodeUnit();
      if (second < 0xdc00 || second > 0xdfff) this.reject('unpaired Unicode surrogate');
      return String.fromCodePoint(0x10000 + ((first - 0xd800) << 10) + (second - 0xdc00));
    }
    if (first >= 0xdc00 && first <= 0xdfff) this.reject('unpaired Unicode surrogate');
    return String.fromCharCode(first);
  }

  hexCodeUnit() {
    const token = this.source.slice(this.index, this.index + 4);
    if (!/^[0-9a-fA-F]{4}$/u.test(token)) this.reject('invalid Unicode escape');
    this.index += 4;
    return Number.parseInt(token, 16);
  }

  number() {
    const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/u.exec(
      this.source.slice(this.index),
    );
    if (!match) this.reject('invalid number');
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) this.reject('number is outside the finite range');
    return value;
  }
}

function sha1(bytes) {
  return crypto.createHash('sha1').update(bytes).digest('hex');
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function integrity(bytes) {
  return `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`;
}

function sameFileIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function canonicalTempRoot(candidate = os.tmpdir()) {
  const resolved = fs.realpathSync(candidate);
  const stats = fs.lstatSync(resolved);
  assert(
    stats.isDirectory() && !stats.isSymbolicLink(),
    'system temp root must be one real directory',
  );
  const relative = path.relative(fs.realpathSync(REPO_ROOT), resolved);
  assert(
    relative !== '' && (relative.startsWith('..') || path.isAbsolute(relative)),
    'system temp root must be outside the repository',
  );
  if (typeof process.geteuid === 'function') {
    const effectiveUid = process.geteuid();
    assert(
      stats.uid === effectiveUid || stats.uid === 0,
      'system temp root must be owned by the effective user or root',
    );
  }
  const writableByOtherUsers = (stats.mode & 0o022) !== 0;
  assert(
    !writableByOtherUsers || (stats.mode & 0o1000) !== 0,
    'writable system temp root must use the sticky bit',
  );
  return resolved;
}

function makePrivateTemp(prefix, root = canonicalTempRoot()) {
  assert(/^[a-z0-9-]+$/u.test(prefix || ''), 'private temp prefix is invalid');
  const canonicalRoot = canonicalTempRoot(root);
  const rootBefore = fs.lstatSync(canonicalRoot);
  const directory = fs.mkdtempSync(path.join(canonicalRoot, prefix));
  let created;
  let descriptor;
  try {
    created = fs.lstatSync(directory);
    assert(
      created.isDirectory() && !created.isSymbolicLink(),
      'private temp must remain one real directory',
    );
    assert(fs.realpathSync(directory) === directory, 'private temp path must remain canonical');
    const flags =
      fs.constants.O_RDONLY | (fs.constants.O_DIRECTORY || 0) | (fs.constants.O_NOFOLLOW || 0);
    descriptor = fs.openSync(directory, flags);
    const opened = fs.fstatSync(descriptor);
    assert(
      opened.isDirectory() && sameFileIdentity(created, opened),
      'private temp identity changed before it was secured',
    );
    fs.fchmodSync(descriptor, 0o700);
    const secured = fs.fstatSync(descriptor);
    const finalPath = fs.lstatSync(directory);
    assert(
      secured.isDirectory() &&
        finalPath.isDirectory() &&
        !finalPath.isSymbolicLink() &&
        sameFileIdentity(created, secured) &&
        sameFileIdentity(secured, finalPath),
      'private temp identity changed while it was secured',
    );
    if (typeof process.geteuid === 'function') {
      assert(secured.uid === process.geteuid(), 'private temp must be owned by the effective user');
    }
    assert((secured.mode & 0o777) === 0o700, 'private temp mode must be 0700');
    assert(fs.realpathSync(directory) === directory, 'secured private temp path must be canonical');
    const rootAfter = fs.lstatSync(canonicalTempRoot(canonicalRoot));
    assert(
      sameFileIdentity(rootBefore, rootAfter),
      'system temp root identity changed while creating private temp',
    );
    return directory;
  } catch (error) {
    if (created) {
      try {
        const current = fs.lstatSync(directory);
        if (
          current.isDirectory() &&
          !current.isSymbolicLink() &&
          sameFileIdentity(created, current)
        ) {
          fs.rmdirSync(directory);
        }
      } catch {}
    }
    throw error;
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}

function cleanGitEnvironment(environment = process.env) {
  return {
    TMPDIR: canonicalTempRoot(),
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_SYSTEM: '/dev/null',
    GIT_CONFIG_COUNT: '0',
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_OPTIONAL_LOCKS: '0',
    LC_ALL: 'C',
    LANG: 'C',
  };
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || REPO_ROOT,
    encoding: options.encoding || 'buffer',
    input: options.input,
    env: options.env || process.env,
    maxBuffer: options.maxBuffer || 256 * 1024 * 1024,
    shell: false,
    stdio: options.stdio,
    timeout: options.timeout,
  });
  if (result.error) fail(`${options.label || command} failed: ${result.error.message}`);
  assert(Number.isInteger(result.status), `${options.label || command} returned no integer status`);
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString('utf8').trim()
      : String(result.stderr || '').trim();
    fail(
      `${options.label || command} exited ${result.status}: ${stderr || 'no diagnostic output'}`,
    );
  }
  return result;
}

function runGit(args, options = {}) {
  assert(fs.existsSync(TRUSTED_GIT), `trusted Git is unavailable at ${TRUSTED_GIT}`);
  return runProcess(
    TRUSTED_GIT,
    [
      '--no-replace-objects',
      '-c',
      'core.fsmonitor=false',
      '-c',
      'core.untrackedCache=false',
      ...args,
    ],
    {
      ...options,
      cwd: options.cwd || REPO_ROOT,
      env: cleanGitEnvironment(options.env),
      label: options.label || `git ${args[0] || ''}`,
    },
  );
}

function gitText(args, options = {}) {
  const result = runGit(args, { ...options, encoding: 'utf8' });
  assert(result.stderr === '', `${options.label || `git ${args[0]}`} wrote unexpected stderr`);
  return result.stdout.trim();
}

function gitBytes(args, options = {}) {
  const result = runGit(args, { ...options, encoding: 'buffer' });
  assert(
    result.stderr.length === 0,
    `${options.label || `git ${args[0]}`} wrote unexpected stderr`,
  );
  return result.stdout;
}

function splitNul(bytes, label) {
  assert(Buffer.isBuffer(bytes), `${label} must be bytes`);
  const records = [];
  let start = 0;
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0) continue;
    assert(index > start, `${label} contains an empty record`);
    records.push(Buffer.from(bytes.subarray(start, index)));
    start = index + 1;
  }
  assert(start === bytes.length, `${label} is missing its final NUL terminator`);
  return records;
}

function decodePath(bytes, label) {
  assert(bytes.length > 0 && bytes.length <= TREE_LIMITS.pathBytes, `${label} length is invalid`);
  let value;
  try {
    value = UTF8.decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  const segments = value.split('/');
  assert(!path.posix.isAbsolute(value), `${label} is absolute`);
  assert(!value.includes('\\'), `${label} contains a backslash`);
  assert(!/[\u0000-\u001f\u007f]/u.test(value), `${label} contains a control character`);
  assert(value.normalize('NFC') === value, `${label} is not NFC-normalized`);
  assert(path.posix.normalize(value) === value, `${label} is not canonical`);
  assert(
    segments.every((segment) => segment && segment !== '.' && segment !== '..'),
    `${label} contains an unsafe segment`,
  );
  assert(
    segments.every((segment) => Buffer.byteLength(segment) <= TREE_LIMITS.segmentBytes),
    `${label} contains an oversized segment`,
  );
  assert(!segments.some((segment) => segment.toLowerCase() === '.git'), `${label} contains .git`);
  return value;
}

function parseTreeEntries(raw, limits = TREE_LIMITS) {
  const entries = [];
  let totalBytes = 0;
  const paths = new Set();
  const foldedPaths = new Set();
  for (const [index, record] of splitNul(raw, 'Git tree listing').entries()) {
    const tab = record.indexOf(0x09);
    assert(tab > 0, `Git tree entry ${index} is malformed`);
    const header = record.subarray(0, tab).toString('ascii');
    const match = /^(\d{6}) (blob|commit) ([0-9a-f]{40}) +([0-9]+|-)$/u.exec(header);
    assert(match, `Git tree entry ${index} header is malformed`);
    const [, mode, type, object, sizeText] = match;
    assert(type === 'blob', `Git tree entry ${index} is a gitlink`);
    assert(
      mode === '100644' || mode === '100755',
      `Git tree entry ${index} mode ${mode} is forbidden`,
    );
    assert(OBJECT_RE.test(object), `Git tree entry ${index} object id is invalid`);
    assert(/^\d+$/u.test(sizeText), `Git tree entry ${index} blob size is missing`);
    const size = Number(sizeText);
    assert(
      Number.isSafeInteger(size) && size >= 0 && size <= limits.fileBytes,
      `Git tree entry ${index} size is invalid`,
    );
    const filePath = decodePath(record.subarray(tab + 1), `Git tree entry ${index} path`);
    assert(!paths.has(filePath), `Git tree contains duplicate path ${filePath}`);
    const folded = filePath.toLocaleLowerCase('en-US');
    assert(!foldedPaths.has(folded), `Git tree contains a case-folding collision at ${filePath}`);
    paths.add(filePath);
    foldedPaths.add(folded);
    totalBytes += size;
    assert(totalBytes <= limits.totalBytes, 'Git tree exceeds the total byte limit');
    entries.push(Object.freeze({ path: filePath, mode, object, size }));
    assert(entries.length <= limits.files, 'Git tree exceeds the file-count limit');
  }
  assert(entries.length > 0, 'Git tree must contain files');
  return Object.freeze(entries);
}

function inspectTree(commit, root = REPO_ROOT) {
  assert(COMMIT_RE.test(commit), 'source commit must be a full lowercase commit id');
  const tree = gitText(['rev-parse', '--verify', `${commit}^{tree}`], { cwd: root });
  assert(OBJECT_RE.test(tree), 'source tree id is invalid');
  const entries = parseTreeEntries(
    gitBytes(['ls-tree', '-r', '-z', '--full-tree', '--long', commit], { cwd: root }),
  );
  return Object.freeze({
    commit,
    tree,
    entries,
    fileCount: entries.length,
    totalBytes: entries.reduce((sum, entry) => sum + entry.size, 0),
  });
}

function batchReadBlobs(entries, root = REPO_ROOT) {
  const input = Buffer.from(`${entries.map((entry) => entry.object).join('\n')}\n`, 'ascii');
  const output = gitBytes(['cat-file', '--batch'], {
    cwd: root,
    input,
    maxBuffer: TREE_LIMITS.totalBytes + entries.length * 256,
    label: 'git cat-file --batch',
  });
  const blobs = [];
  let offset = 0;
  for (const [index, entry] of entries.entries()) {
    const newline = output.indexOf(0x0a, offset);
    assert(newline > offset, `blob batch header ${index} is missing`);
    const header = output.subarray(offset, newline).toString('ascii');
    const match = /^([0-9a-f]{40}) blob (\d+)$/u.exec(header);
    assert(match, `blob batch header ${index} is malformed`);
    assert(match[1] === entry.object, `blob batch object ${index} changed`);
    assert(Number(match[2]) === entry.size, `blob batch size ${index} changed`);
    const start = newline + 1;
    const end = start + entry.size;
    assert(end < output.length && output[end] === 0x0a, `blob batch body ${index} is truncated`);
    const bytes = Buffer.from(output.subarray(start, end));
    const object = sha1(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]));
    assert(object === entry.object, `blob ${entry.path} does not match its object id`);
    blobs.push(bytes);
    offset = end + 1;
  }
  assert(offset === output.length, 'blob batch contains trailing output');
  return blobs;
}

function materializeTree(tree, destination, root = REPO_ROOT) {
  assert(!fs.existsSync(destination), `materialization destination already exists: ${destination}`);
  fs.mkdirSync(destination, { recursive: false, mode: 0o700 });
  const blobs = batchReadBlobs(tree.entries, root);
  for (const [index, entry] of tree.entries.entries()) {
    const target = path.join(destination, ...entry.path.split('/'));
    const relative = path.relative(destination, target);
    assert(
      relative && !relative.startsWith('..') && !path.isAbsolute(relative),
      'materialized path escaped its root',
    );
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    fs.writeFileSync(target, blobs[index], {
      flag: 'wx',
      mode: entry.mode === '100755' ? 0o755 : 0o644,
    });
    fs.chmodSync(target, entry.mode === '100755' ? 0o755 : 0o644);
  }
  return destination;
}

function initializeIsolatedGateRepository(sourceRoot, tree, commit, objectRoot = REPO_ROOT) {
  assert(!fs.existsSync(path.join(sourceRoot, '.git')), 'isolated gate source already has .git');
  assert(COMMIT_RE.test(commit || ''), 'isolated gate commit must be a full commit id');
  runGit(['init', '--quiet'], { cwd: sourceRoot });
  runGit(['add', '--force', '--all', '--', '.'], { cwd: sourceRoot });
  assertIndexMatchesTree(tree, sourceRoot);
  const writtenTree = gitText(['write-tree'], {
    cwd: sourceRoot,
    label: 'git write-tree isolated release source',
  });
  assert(writtenTree === tree.tree, 'isolated gate tree object differs from the release tree');
  const commitBytes = gitBytes(['cat-file', 'commit', commit], { cwd: objectRoot });
  const writtenCommit = gitText(['hash-object', '-t', 'commit', '-w', '--stdin'], {
    cwd: sourceRoot,
    input: commitBytes,
    label: 'git hash-object isolated release commit',
  });
  assert(writtenCommit === commit, 'isolated gate commit object differs from the release commit');
  runGit(['update-ref', '--no-deref', 'HEAD', commit], { cwd: sourceRoot });
  assert(
    gitText(['rev-parse', '--verify', 'HEAD^{commit}'], { cwd: sourceRoot }) === commit,
    'isolated gate HEAD differs from the release commit',
  );
  assert(
    gitText(['rev-parse', '--verify', 'HEAD^{tree}'], { cwd: sourceRoot }) === tree.tree,
    'isolated gate HEAD tree differs from the release tree',
  );
  assert(
    gitText(['status', '--porcelain=v2', '--untracked-files=all'], { cwd: sourceRoot }) === '',
    'isolated gate repository is not clean',
  );
  return sourceRoot;
}

function parseIndexEntries(raw) {
  return splitNul(raw, 'Git index listing').map((record, index) => {
    const tab = record.indexOf(0x09);
    assert(tab > 0, `Git index entry ${index} is malformed`);
    const match = /^(\d{6}) ([0-9a-f]{40}) ([0-3])$/u.exec(
      record.subarray(0, tab).toString('ascii'),
    );
    assert(match, `Git index entry ${index} header is malformed`);
    assert(match[3] === '0', `Git index entry ${index} has a nonzero merge stage`);
    return {
      mode: match[1],
      object: match[2],
      path: decodePath(record.subarray(tab + 1), `Git index entry ${index} path`),
    };
  });
}

function assertIndexMatchesTree(tree, root = REPO_ROOT) {
  const gitDirectory = path.join(path.resolve(root), '.git');
  const indexPath = path.join(gitDirectory, 'index');
  const indexStats = fs.lstatSync(indexPath);
  const gitStats = fs.lstatSync(gitDirectory);
  assert(
    gitStats.isDirectory() && !gitStats.isSymbolicLink(),
    'release .git must be one real directory',
  );
  assert(
    indexStats.isFile() && !indexStats.isSymbolicLink() && indexStats.nlink === 1,
    'release index must be one real file with exactly one hard link',
  );
  const relativeIndex = path.relative(fs.realpathSync(gitDirectory), fs.realpathSync(indexPath));
  assert(
    relativeIndex && !relativeIndex.startsWith('..') && !path.isAbsolute(relativeIndex),
    'release index is outside .git',
  );

  const indexEntries = parseIndexEntries(gitBytes(['ls-files', '--stage', '-z'], { cwd: root }));
  assert(
    indexEntries.length === tree.entries.length,
    'Git index file count differs from the release tree',
  );
  for (let index = 0; index < tree.entries.length; index += 1) {
    const expected = tree.entries[index];
    const actual = indexEntries[index];
    assert(
      actual.path === expected.path &&
        actual.mode === expected.mode &&
        actual.object === expected.object,
      `Git index differs from the release tree at ${expected.path}`,
    );
  }

  for (const record of splitNul(
    gitBytes(['ls-files', '-v', '-z'], { cwd: root }),
    'Git index flags',
  )) {
    assert(
      record.length > 2 && record[0] === 0x48 && record[1] === 0x20,
      'Git index contains hidden or skip-worktree entries',
    );
  }
}

function normalizeCommitIdentity(name, email, label) {
  assert(typeof name === 'string' && typeof email === 'string', `${label} identity is invalid`);
  const normalizedName = name
    .normalize('NFC')
    .trim()
    .replace(/[\t ]+/gu, ' ');
  const normalizedEmail = email.normalize('NFC').trim().toLowerCase();
  assert(
    normalizedName &&
      !/[\u0000-\u001f\u007f<>]/u.test(normalizedName) &&
      /^[^<>\s@]+@[^<>\s@]+$/u.test(normalizedEmail),
    `${label} identity is invalid`,
  );
  return `${normalizedName} <${normalizedEmail}>`;
}

function validateNormalizedIdentity(value, label) {
  assert(typeof value === 'string', `${label} identity is invalid`);
  const match = /^([^<>\r\n]+) <([^<>\s@]+@[^<>\s@]+)>$/u.exec(value);
  assert(match, `${label} identity is invalid`);
  assert(normalizeCommitIdentity(match[1], match[2], label) === value, `${label} is not canonical`);
  return value;
}

function parseCommitIdentity(headers, kind) {
  const matches = [
    ...headers.matchAll(
      new RegExp(
        `^${kind} (.+) <([^<>\\s@]+@[^<>\\s@]+)> ([0-9]+) ([+-](?:0[0-9]|1[0-4])[0-5][0-9])$`,
        'gmu',
      ),
    ),
  ];
  assert(matches.length === 1, `release commit must contain one valid ${kind} identity`);
  return Object.freeze({
    normalized: normalizeCommitIdentity(matches[0][1], matches[0][2], kind),
    timestamp: matches[0][3],
    timezone: matches[0][4],
  });
}

function commitDocument(commit, root = REPO_ROOT) {
  const bytes = gitBytes(['cat-file', 'commit', commit], { cwd: root });
  let source;
  try {
    source = UTF8.decode(bytes);
  } catch {
    fail('release commit object is not valid UTF-8');
  }
  assert(!source.includes('\0'), 'release commit object contains NUL');
  const treeMatch = /^tree ([0-9a-f]{40})$/mu.exec(source);
  assert(treeMatch, 'release commit object has no valid tree header');
  const separator = source.indexOf('\n\n');
  assert(separator >= 0, 'release commit object has no message body');
  const headers = source.slice(0, separator);
  const author = parseCommitIdentity(headers, 'author');
  const committer = parseCommitIdentity(headers, 'committer');
  const message = source.slice(separator + 2);
  const trailerBlock = message.trimEnd().split(/\n\n/u).at(-1) || '';
  const signoffs = [
    ...trailerBlock.matchAll(/^Signed-off-by: ([^<>\r\n]+) <([^<>\s@]+@[^<>\s@]+)>$/gmu),
  ].map((match) => normalizeCommitIdentity(match[1], match[2], 'Signed-off-by'));
  assert(signoffs.length > 0, 'release commit must contain a valid DCO Signed-off-by trailer');
  assert(
    signoffs.includes(author.normalized),
    'release commit author must have an exact normalized DCO Signed-off-by trailer',
  );
  return Object.freeze({
    tree: treeMatch[1],
    message,
    author,
    committer,
    signoffs: Object.freeze(signoffs),
    authorSignoffMatch: true,
  });
}

function validateReleaseContext(input) {
  const { pkg, changelog, env, git } = input;
  assert(
    pkg && typeof pkg === 'object' && !Array.isArray(pkg),
    'Core package manifest must be an object',
  );
  assert(pkg.name === PACKAGE_NAME, `Core package name must be ${PACKAGE_NAME}`);
  assert(
    STABLE_SEMVER_RE.test(pkg.version || ''),
    'Core version must be exact stable natural SemVer',
  );
  const tag = pkg.version;
  const ref = `refs/tags/${tag}`;
  assert(env.GITHUB_REPOSITORY === REPOSITORY, `GITHUB_REPOSITORY must be ${REPOSITORY}`);
  assert(
    env.GITHUB_SERVER_URL === 'https://github.com',
    'GITHUB_SERVER_URL must be https://github.com',
  );
  assert(env.GITHUB_EVENT_NAME === 'release', 'GITHUB_EVENT_NAME must be release');
  assert(env.RELEASE_EVENT_ACTION === 'published', 'release action must be published');
  assert(env.RELEASE_TAG_NAME === tag, `release tag must be exactly ${tag}`);
  assert(env.RELEASE_IS_DRAFT === 'false', 'draft releases cannot publish');
  assert(env.RELEASE_IS_PRERELEASE === 'false', 'prereleases cannot publish');
  assert(env.GITHUB_REF === ref, `GITHUB_REF must be exactly ${ref}`);
  if (env.GITHUB_REF_TYPE !== undefined)
    assert(env.GITHUB_REF_TYPE === 'tag', 'GITHUB_REF_TYPE must be tag');
  if (env.GITHUB_REF_NAME !== undefined)
    assert(env.GITHUB_REF_NAME === tag, 'GITHUB_REF_NAME must equal the release tag');
  assert(COMMIT_RE.test(env.GITHUB_SHA || ''), 'GITHUB_SHA must be a full lowercase commit id');
  assert(git.status === '', 'release worktree must be clean');
  assert(COMMIT_RE.test(git.head || ''), 'HEAD must be a full lowercase commit id');
  assert(COMMIT_RE.test(git.tagCommit || ''), 'release tag must dereference to a commit');
  assert(git.tagCommit === git.head, 'release tag commit must equal HEAD');
  assert(env.GITHUB_SHA === git.head, 'GITHUB_SHA must equal HEAD and the release tag commit');
  assert(OBJECT_RE.test(git.tree || ''), 'release tree id is invalid');
  assert(git.commitTree === git.tree, 'commit object tree must equal the inspected release tree');
  assert(Array.isArray(git.signoffs) && git.signoffs.length > 0, 'release commit must satisfy DCO');
  assert(
    git.author && typeof git.author.normalized === 'string',
    'release commit author observation is missing',
  );
  assert(
    git.committer && typeof git.committer.normalized === 'string',
    'release commit committer observation is missing',
  );
  assert(git.authorSignoffMatch === true, 'release commit author DCO match is missing');

  const escaped = pkg.version.replace(/\./gu, '\\.');
  const headings = [
    ...changelog.matchAll(new RegExp(`^## ${escaped}(?: \\(\\d{4}-\\d{2}-\\d{2}\\))?$`, 'gmu')),
  ];
  assert(
    headings.length === 1,
    `Core CHANGELOG must contain exactly one ## ${pkg.version} heading`,
  );
  const finalized = [...changelog.matchAll(/^## (\d+\.\d+\.\d+)(?: \(\d{4}-\d{2}-\d{2}\))?$/gmu)];
  assert(
    finalized.length > 0 && finalized[0][1] === pkg.version,
    'Core version must be the first finalized CHANGELOG entry',
  );
  return Object.freeze({
    name: pkg.name,
    version: pkg.version,
    tag,
    ref,
    commit: git.head,
    tree: git.tree,
    author: git.author.normalized,
    committer: git.committer.normalized,
    signoffs: Object.freeze([...git.signoffs]),
    authorSignoffMatch: true,
  });
}

function readBlobAtPath(tree, relativePath, root = REPO_ROOT) {
  const entry = tree.entries.find((candidate) => candidate.path === relativePath);
  assert(entry, `release tree is missing ${relativePath}`);
  return batchReadBlobs([entry], root)[0];
}

function inspectAuthoritativeRelease(env = process.env, root = REPO_ROOT) {
  const repositoryRoot = gitText(['rev-parse', '--path-format=absolute', '--show-toplevel'], {
    cwd: root,
  });
  assert(
    fs.realpathSync(repositoryRoot) === fs.realpathSync(root),
    'release repository root is ambiguous',
  );
  const head = gitText(['rev-parse', '--verify', 'HEAD^{commit}'], { cwd: root });
  assert(COMMIT_RE.test(head), 'HEAD is not a full lowercase commit id');
  const tree = inspectTree(head, root);
  const pkg = strictJson(
    readBlobAtPath(tree, `${PACKAGE_RELATIVE}/package.json`, root),
    'Core package.json',
  );
  assert(
    STABLE_SEMVER_RE.test(pkg.version || ''),
    'Core package version must be exact stable natural SemVer',
  );
  const tag = pkg.version;
  const tagRef = `refs/tags/${tag}`;
  const exactTagObject = gitText(['show-ref', '--verify', '--hash', tagRef], { cwd: root });
  assert(OBJECT_RE.test(exactTagObject), 'exact Core release tag does not exist');
  const tagCommit = gitText(['rev-parse', '--verify', `${tagRef}^{commit}`], { cwd: root });
  const status = gitText(['status', '--porcelain=v2', '--untracked-files=all'], { cwd: root });
  assertIndexMatchesTree(tree, root);
  const commit = commitDocument(head, root);
  const changelog = UTF8.decode(readBlobAtPath(tree, `${PACKAGE_RELATIVE}/CHANGELOG.md`, root));
  const context = validateReleaseContext({
    pkg,
    changelog,
    env,
    git: {
      status,
      head,
      tagCommit,
      tree: tree.tree,
      commitTree: commit.tree,
      author: commit.author,
      committer: commit.committer,
      signoffs: commit.signoffs,
      authorSignoffMatch: commit.authorSignoffMatch,
    },
  });
  return Object.freeze({ ...context, treeState: tree });
}

function readCanonicalRegularOneLink(file, label, limits = {}) {
  const absolute = path.resolve(file);
  assert(resolveDestination(absolute) === absolute, `${label} path must be canonical`);
  const before = fs.lstatSync(absolute);
  assert(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label} must be a canonical regular file with exactly one hard link`,
  );
  const minimum = limits.minimum ?? 1;
  const maximum = limits.maximum ?? Number.MAX_SAFE_INTEGER;
  assert(
    Number.isSafeInteger(before.size) && before.size >= minimum && before.size <= maximum,
    `${label} size is invalid`,
  );
  const noFollow = fs.constants.O_NOFOLLOW || 0;
  const descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | noFollow);
  try {
    const opened = fs.fstatSync(descriptor);
    assert(
      opened.isFile() &&
        opened.nlink === 1 &&
        opened.dev === before.dev &&
        opened.ino === before.ino &&
        opened.size === before.size,
      `${label} changed while opening`,
    );
    const bytes = fs.readFileSync(descriptor);
    const after = fs.fstatSync(descriptor);
    const pathAfter = fs.lstatSync(absolute);
    assert(
      after.dev === opened.dev &&
        after.ino === opened.ino &&
        after.size === opened.size &&
        after.nlink === 1 &&
        pathAfter.dev === opened.dev &&
        pathAfter.ino === opened.ino &&
        pathAfter.size === opened.size &&
        pathAfter.nlink === 1 &&
        !pathAfter.isSymbolicLink() &&
        fs.realpathSync(absolute) === absolute,
      `${label} changed while reading`,
    );
    assert(bytes.length === opened.size, `${label} read was incomplete`);
    return Object.freeze({ path: absolute, bytes, stat: opened });
  } finally {
    fs.closeSync(descriptor);
  }
}

function defaultTrustedNpmTarball() {
  return path.join(canonicalTempRoot(), 'aikdna-trusted-tools', TRUSTED_NPM_FILENAME);
}

function trustedNpmTarballPath(explicitPath = process.env[TRUSTED_NPM_ENVIRONMENT]) {
  return resolveDestination(path.resolve(explicitPath || defaultTrustedNpmTarball()));
}

function verifyTrustedNpmTarball(file) {
  const candidate = readCanonicalRegularOneLink(
    trustedNpmTarballPath(file),
    'trusted npm release tarball',
    { maximum: TRUSTED_NPM_COMPRESSED_LIMIT },
  );
  assert(
    integrity(candidate.bytes) === TRUSTED_NPM_INTEGRITY,
    `trusted npm release bytes do not match official npm ${AUDITED_NPM_VERSION} integrity`,
  );
  return candidate.bytes;
}

function downloadTrustedNpmBytes(request = https.get) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      callback(value);
    };
    const requested = request(
      new URL(TRUSTED_NPM_URL),
      {
        minVersion: 'TLSv1.2',
        headers: {
          accept: 'application/octet-stream',
          'user-agent': `aikdna-core-release-authority/${AUDITED_NPM_VERSION}`,
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          finish(reject, new Error(`trusted npm source returned HTTP ${response.statusCode}`));
          return;
        }
        const contentLength = response.headers['content-length'];
        if (contentLength !== undefined) {
          if (typeof contentLength !== 'string' || !/^(?:0|[1-9][0-9]*)$/u.test(contentLength)) {
            response.destroy(new Error('trusted npm source content length is invalid'));
            return;
          }
          const declared = Number(contentLength);
          if (
            !Number.isSafeInteger(declared) ||
            declared < 1 ||
            declared > TRUSTED_NPM_COMPRESSED_LIMIT
          ) {
            response.destroy(new Error('trusted npm source content length is outside its limit'));
            return;
          }
        }
        const chunks = [];
        let total = 0;
        response.on('data', (chunk) => {
          total += chunk.length;
          if (total > TRUSTED_NPM_COMPRESSED_LIMIT) {
            response.destroy(new Error('trusted npm source exceeded its compressed byte limit'));
            return;
          }
          chunks.push(Buffer.from(chunk));
        });
        let ended = false;
        response.on('end', () => {
          ended = true;
          if (contentLength !== undefined && total !== Number(contentLength)) {
            finish(reject, new Error('trusted npm source length differs from its response'));
            return;
          }
          if (total < 1) {
            finish(reject, new Error('trusted npm source returned no bytes'));
            return;
          }
          finish(resolve, Buffer.concat(chunks, total));
        });
        response.on('aborted', () =>
          finish(reject, new Error('trusted npm source response was aborted')),
        );
        response.on('close', () => {
          if (!ended) finish(reject, new Error('trusted npm source response closed early'));
        });
        response.on('error', (error) => finish(reject, error));
      },
    );
    requested.setTimeout(REGISTRY_TIMEOUT_MS, () => {
      requested.destroy(new Error('trusted npm source timed out'));
    });
    requested.on('error', (error) => finish(reject, error));
  });
}

async function provisionTrustedNpmTarball({ artifactPath, root = REPO_ROOT, request = https.get }) {
  const destination = assertOutsideRepository(artifactPath, 'trusted npm release tarball', root);
  assert(
    path.basename(destination) === TRUSTED_NPM_FILENAME,
    `trusted npm destination must be named ${TRUSTED_NPM_FILENAME}`,
  );
  assert(!fs.existsSync(destination), 'trusted npm release tarball already exists');
  const bytes = await downloadTrustedNpmBytes(request);
  assert(
    integrity(bytes) === TRUSTED_NPM_INTEGRITY,
    `downloaded npm bytes do not match official npm ${AUDITED_NPM_VERSION} integrity`,
  );
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  let created = false;
  try {
    fs.writeFileSync(destination, bytes, { flag: 'wx', mode: 0o600 });
    created = true;
    verifyTrustedNpmTarball(destination);
    return destination;
  } catch (error) {
    if (created) fs.rmSync(destination, { force: true });
    throw error;
  }
}

function readTrustedNpmEntries(bytes) {
  let archive;
  try {
    archive = zlib.gunzipSync(bytes, { maxOutputLength: TRUSTED_NPM_UNPACKED_LIMIT });
  } catch {
    fail('trusted npm release gzip stream is invalid');
  }
  const entries = [];
  const paths = new Set();
  let totalBytes = 0;
  let offset = 0;
  let zeroBlocks = 0;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      zeroBlocks += 1;
      offset += 512;
      if (zeroBlocks === 2) break;
      continue;
    }
    assert(zeroBlocks === 0, 'trusted npm tar has data after its terminator began');
    const storedChecksum = parseTarNumber(header.subarray(148, 156), 'trusted npm checksum');
    let computedChecksum = 0;
    for (let index = 0; index < 512; index += 1) {
      computedChecksum += index >= 148 && index < 156 ? 0x20 : header[index];
    }
    assert(storedChecksum === computedChecksum, 'trusted npm tar header checksum mismatch');
    const size = parseTarNumber(header.subarray(124, 136), 'trusted npm entry size');
    const mode = parseTarNumber(header.subarray(100, 108), 'trusted npm entry mode');
    assert(size <= TRUSTED_NPM_UNPACKED_LIMIT, 'trusted npm tar entry is oversized');
    assert(mode === 0o644 || mode === 0o755, 'trusted npm tar entry mode is invalid');
    const type = header[156];
    assert(type === 0 || type === 0x30, 'trusted npm tar contains a non-file entry');
    const name = decodeTarHeaderText(header.subarray(0, 100), 'trusted npm tar name');
    const prefix = decodeTarHeaderText(header.subarray(345, 500), 'trusted npm tar prefix');
    const fullPath = prefix ? `${prefix}/${name}` : name;
    const packagePath = decodeTarPath(fullPath, 'trusted npm tar path');
    assert(!paths.has(packagePath), `trusted npm tar duplicates ${packagePath}`);
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    assert(dataEnd <= archive.length, 'trusted npm tar entry is truncated');
    paths.add(packagePath);
    totalBytes += size;
    assert(totalBytes <= TRUSTED_NPM_UNPACKED_LIMIT, 'trusted npm tar exceeds its byte limit');
    entries.push(
      Object.freeze({
        path: packagePath,
        mode,
        bytes: Buffer.from(archive.subarray(dataStart, dataEnd)),
      }),
    );
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  assert(zeroBlocks === 2, 'trusted npm tar is missing its two-block terminator');
  assert(
    archive.subarray(offset).every((byte) => byte === 0),
    'trusted npm tar contains trailing bytes',
  );
  assert(
    entries.length === TRUSTED_NPM_ENTRY_COUNT,
    'trusted npm release entry count is not the audited value',
  );
  return Object.freeze(entries);
}

function extractTrustedNpmRelease(file) {
  const entries = readTrustedNpmEntries(verifyTrustedNpmTarball(file));
  const root = makePrivateTemp('kdna-core-trusted-npm-');
  fs.chmodSync(root, 0o700);
  let complete = false;
  try {
    for (const entry of entries) {
      const target = path.join(root, 'package', ...entry.path.split('/'));
      const relative = path.relative(root, target);
      assert(
        relative && !relative.startsWith('..') && !path.isAbsolute(relative),
        'trusted npm extraction escaped its root',
      );
      fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
      fs.writeFileSync(target, entry.bytes, {
        flag: 'wx',
        mode: entry.mode === 0o755 ? 0o700 : 0o600,
      });
      const written = fs.lstatSync(target);
      assert(
        written.isFile() && !written.isSymbolicLink() && written.nlink === 1,
        `trusted npm extracted file is invalid: ${entry.path}`,
      );
    }
    const npmRoot = path.join(root, 'package');
    const manifestPath = path.join(npmRoot, 'package.json');
    const cliPath = path.join(npmRoot, 'bin', 'npm-cli.js');
    const publishLibraryPath = path.join(npmRoot, 'node_modules', 'libnpmpublish');
    const publishLibraryManifestPath = path.join(publishLibraryPath, 'package.json');
    const manifestFile = readCanonicalRegularOneLink(manifestPath, 'trusted npm manifest', {
      maximum: 1024 * 1024,
    });
    readCanonicalRegularOneLink(cliPath, 'trusted npm CLI', { maximum: 1024 * 1024 });
    const publishLibraryManifestFile = readCanonicalRegularOneLink(
      publishLibraryManifestPath,
      'trusted npm publisher manifest',
      { maximum: 1024 * 1024 },
    );
    const manifest = strictJson(manifestFile.bytes, 'trusted npm manifest');
    assert(
      manifest.name === 'npm' &&
        manifest.version === AUDITED_NPM_VERSION &&
        manifest.bin &&
        manifest.bin.npm === 'bin/npm-cli.js',
      'trusted npm release identity or CLI entry is invalid',
    );
    const publishLibraryManifest = strictJson(
      publishLibraryManifestFile.bytes,
      'trusted npm publisher manifest',
    );
    assert(
      publishLibraryManifest.name === 'libnpmpublish' &&
        typeof publishLibraryManifest.main === 'string',
      'trusted npm publisher library identity is invalid',
    );
    complete = true;
    return Object.freeze({
      cliPath,
      publishLibraryPath,
      root,
      cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
    });
  } finally {
    if (!complete) fs.rmSync(root, { recursive: true, force: true });
  }
}

function createTrustedToolEntries(nodeExecutable, npmCliPath) {
  const directory = makePrivateTemp('kdna-core-node-');
  try {
    const nodeEntry = path.join(directory, 'node');
    const npmEntry = path.join(directory, 'npm');
    fs.symlinkSync(nodeExecutable, nodeEntry, 'file');
    fs.symlinkSync(npmCliPath, npmEntry, 'file');
    assert(
      fs.realpathSync(nodeEntry) === nodeExecutable,
      'trusted Node PATH entry does not resolve to the current Node executable',
    );
    assert(
      fs.realpathSync(npmEntry) === npmCliPath,
      'trusted npm PATH entry does not resolve to the authenticated npm CLI',
    );
    return Object.freeze({ directory, nodeEntry, npmEntry });
  } catch (error) {
    fs.rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

function assertNoInheritedNpmAuthority(environment) {
  for (const key of Object.keys(environment)) {
    if (['npm_execpath', 'npm_node_execpath'].includes(key.toLowerCase())) {
      fail('inherited npm executable authority is forbidden');
    }
  }
}

function resolveTrustedNpmInvocation(options = {}) {
  const environment = options.environment || process.env;
  assertNoInheritedNpmAuthority(environment);
  const nodeExecutable = path.resolve(options.nodeExecutable || process.execPath);
  const node = readCanonicalRegularOneLink(nodeExecutable, 'trusted Node executable', {
    maximum: 512 * 1024 * 1024,
  });
  assert(node.path === process.execPath, 'trusted Node must be the current process executable');
  const tarball = trustedNpmTarballPath(
    options.tarballPath || environment[TRUSTED_NPM_ENVIRONMENT],
  );
  assertOutsideRepository(tarball, 'trusted npm release tarball', options.root || REPO_ROOT);
  const extracted = extractTrustedNpmRelease(tarball);
  let toolEntries;
  try {
    toolEntries = createTrustedToolEntries(node.path, extracted.cliPath);
    return Object.freeze({
      command: node.path,
      prefixArgs: Object.freeze([extracted.cliPath]),
      cliPath: extracted.cliPath,
      publishLibraryPath: extracted.publishLibraryPath,
      toolEntries,
      version: AUDITED_NPM_VERSION,
      releaseUrl: TRUSTED_NPM_URL,
      releaseIntegrity: TRUSTED_NPM_INTEGRITY,
      cleanup: () => {
        fs.rmSync(toolEntries.directory, { recursive: true, force: true });
        extracted.cleanup();
      },
    });
  } catch (error) {
    extracted.cleanup();
    throw error;
  }
}

function cleanNpmEnvironment({
  invocation,
  home,
  cache,
  environment = process.env,
  userconfig,
  allowAuth = false,
}) {
  assert(
    invocation &&
      invocation.command === process.execPath &&
      Array.isArray(invocation.prefixArgs) &&
      invocation.prefixArgs.length === 1 &&
      invocation.toolEntries &&
      typeof invocation.toolEntries.directory === 'string',
    'trusted npm invocation is invalid',
  );
  const allowedEnvironment = new Set([
    'ACTIONS_ID_TOKEN_REQUEST_TOKEN',
    'ACTIONS_ID_TOKEN_REQUEST_URL',
    'CI',
    'GITHUB_ACTIONS',
    'GITHUB_EVENT_NAME',
    'GITHUB_REF',
    'GITHUB_REPOSITORY',
    'GITHUB_REPOSITORY_ID',
    'GITHUB_REPOSITORY_OWNER_ID',
    'GITHUB_RUN_ATTEMPT',
    'GITHUB_RUN_ID',
    'GITHUB_SERVER_URL',
    'GITHUB_SHA',
    'GITHUB_OUTPUT',
    'GITHUB_WORKFLOW_REF',
    'KDNA_CONTROL_ROOT',
    'KDNA_GATE_PROGRESS_LOG',
    'KDNA_CORE_BASELINE',
    'KDNA_STUDIO_CORE_BASELINE',
    'KDNA_ECOSYSTEM_MANIFEST_PATH',
    'KDNA_ECOSYSTEM_REPOS_ROOT',
    'KDNA_PYTHON',
    'KDNA_REPOS_ROOT',
    TRUSTED_NPM_ENVIRONMENT,
    'RELEASE_EVENT_ACTION',
    'RELEASE_IS_DRAFT',
    'RELEASE_IS_PRERELEASE',
    'RELEASE_TAG_NAME',
    'RUNNER_ENVIRONMENT',
  ]);
  const clean = {};
  for (const key of allowedEnvironment) {
    if (typeof environment[key] === 'string') clean[key] = environment[key];
  }
  if (allowAuth && typeof environment.NODE_AUTH_TOKEN === 'string')
    clean.NODE_AUTH_TOKEN = environment.NODE_AUTH_TOKEN;
  return {
    ...clean,
    HOME: home,
    PATH: `${invocation.toolEntries.directory}:${path.dirname(TRUSTED_GIT)}:/usr/bin:/bin`,
    NODE: invocation.command,
    NODE_OPTIONS: '',
    NODE_PATH: '',
    npm_execpath: invocation.cliPath,
    npm_node_execpath: invocation.command,
    npm_config_cache: cache,
    npm_config_registry: OFFICIAL_REGISTRY,
    npm_config_strict_ssl: 'true',
    npm_config_userconfig: userconfig || path.join(home, 'absent-user.npmrc'),
    npm_config_globalconfig: path.join(home, 'absent-global.npmrc'),
    npm_config_ignore_scripts: 'true',
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_update_notifier: 'false',
    TMPDIR: canonicalTempRoot(),
    LC_ALL: 'C',
    LANG: 'C',
  };
}

function assertNoProjectNpmConfig(cwd, projectRoot = cwd) {
  const resolvedCwd = fs.realpathSync(cwd);
  const resolvedRoot = fs.realpathSync(projectRoot);
  const relative = path.relative(resolvedRoot, resolvedCwd);
  assert(
    relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative)),
    'npm cwd must be inside its declared project root',
  );
  let current = resolvedCwd;
  while (true) {
    assert(
      !fs.existsSync(path.join(current, '.npmrc')),
      `project npm config is forbidden: ${current}`,
    );
    if (current === resolvedRoot) break;
    const parent = path.dirname(current);
    assert(parent !== current, 'npm project root is not an ancestor of its cwd');
    current = parent;
  }
}

function createTokenUserConfig(home, environment = process.env) {
  const token = environment.NODE_AUTH_TOKEN;
  assert(
    typeof token === 'string' && token !== '' && !/[\r\n\0]/u.test(token),
    'trusted npm authentication token is missing or invalid',
  );
  const homeState = fs.lstatSync(home);
  assert(
    homeState.isDirectory() && !homeState.isSymbolicLink() && (homeState.mode & 0o777) === 0o700,
    'trusted npm authentication home must be a private directory',
  );
  const userconfig = path.join(home, 'auth-user.npmrc');
  fs.writeFileSync(userconfig, '//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}\n', {
    flag: 'wx',
    mode: 0o600,
  });
  const configState = fs.lstatSync(userconfig);
  assert(
    configState.isFile() &&
      !configState.isSymbolicLink() &&
      configState.nlink === 1 &&
      (configState.mode & 0o777) === 0o600,
    'trusted npm authentication config must be one private regular file',
  );
  return userconfig;
}

function runNpm(invocation, args, options = {}) {
  const home = options.home || makePrivateTemp('kdna-core-npm-home-');
  const removeHome = options.home === undefined;
  const cache = options.cache || path.join(home, 'cache');
  try {
    assertNoProjectNpmConfig(
      options.cwd || REPO_ROOT,
      options.projectRoot || options.cwd || REPO_ROOT,
    );
    return runProcess(invocation.command, [...invocation.prefixArgs, ...args], {
      ...options,
      env: cleanNpmEnvironment({
        invocation,
        home,
        cache,
        environment: options.env,
      }),
      encoding: options.encoding || 'utf8',
      label: options.label || `trusted npm ${args[0] || ''}`,
    });
  } finally {
    if (removeHome) fs.rmSync(home, { recursive: true, force: true });
  }
}

function extractSafeEcosystemFailureStage(args, result) {
  if (
    !Array.isArray(args) ||
    args.length !== 2 ||
    args[0] !== 'run' ||
    args[1] !== 'ecosystem-gate'
  ) {
    return null;
  }
  const output = `${result && typeof result.stdout === 'string' ? result.stdout : ''}\n${
    result && typeof result.stderr === 'string' ? result.stderr : ''
  }`;
  const matches = [
    ...output.matchAll(
      new RegExp(
        `^KDNA_SAFE_ECOSYSTEM_STAGE=([a-z0-9-]{1,${ECOSYSTEM_GATE_STAGE_MAX_BYTES}})\\r?$`,
        'gmu',
      ),
    ),
  ].filter((match) => isSafeEcosystemGateStage(match[1]));
  return matches.length === 1 ? matches[0][1] : null;
}

function runTrustedNpmCommand(args, options = {}) {
  assert(
    Array.isArray(args) &&
      args.length > 0 &&
      args.every((argument) =>
        Boolean(typeof argument === 'string' && argument && !argument.includes('\0')),
      ),
    'trusted-npm requires one or more valid npm arguments',
  );
  const root = options.root || REPO_ROOT;
  const environment = options.environment || process.env;
  const invocation = resolveTrustedNpmInvocation({ environment, root });
  const home = makePrivateTemp('kdna-core-trusted-command-');
  try {
    assertNoProjectNpmConfig(root, root);
    const userconfig =
      options.allowAuth === true ? createTokenUserConfig(home, environment) : undefined;
    const result = spawnSync(invocation.command, [...invocation.prefixArgs, ...args], {
      cwd: root,
      encoding: 'utf8',
      env: cleanNpmEnvironment({
        invocation,
        home,
        cache: path.join(home, 'cache'),
        environment,
        allowAuth: options.allowAuth === true,
        userconfig,
      }),
      maxBuffer: 256 * 1024 * 1024,
      shell: false,
      timeout:
        options.timeout ||
        (Array.isArray(args) && args[0] === 'run' && args[1] === 'ecosystem-gate'
          ? 40 * 60_000
          : 15 * 60_000),
    });
    assert(!result.error, 'trusted npm workflow command failed');
    assert(Number.isInteger(result.status), 'trusted npm workflow command failed');
    if (result.status !== 0) {
      const safeStage = extractSafeEcosystemFailureStage(args, result);
      fail(
        safeStage
          ? `trusted npm workflow command failed at ecosystem stage ${safeStage}`
          : 'trusted npm workflow command failed',
      );
    }
    if (result.stdout) process.stdout.write(result.stdout);
    return true;
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
    invocation.cleanup();
  }
}

function parseTarNumber(bytes, label) {
  if (bytes[0] & 0x80) {
    const copy = Buffer.from(bytes);
    copy[0] &= 0x7f;
    let value = 0n;
    for (const byte of copy) value = value * 256n + BigInt(byte);
    assert(value <= BigInt(Number.MAX_SAFE_INTEGER), `${label} exceeds the safe integer range`);
    return Number(value);
  }
  const source = bytes.toString('ascii').replace(/\0.*$/u, '').trim();
  assert(/^[0-7]*$/u.test(source), `${label} is not octal`);
  return source ? Number.parseInt(source, 8) : 0;
}

function parsePax(bytes) {
  const values = {};
  let offset = 0;
  while (offset < bytes.length) {
    const space = bytes.indexOf(0x20, offset);
    assert(space > offset, 'PAX record length is malformed');
    const lengthText = bytes.subarray(offset, space).toString('ascii');
    assert(/^[1-9]\d*$/u.test(lengthText), 'PAX record length is invalid');
    const length = Number(lengthText);
    assert(
      Number.isSafeInteger(length) && offset + length <= bytes.length,
      'PAX record is truncated',
    );
    assert(bytes[offset + length - 1] === 0x0a, 'PAX record is missing its newline');
    const record = UTF8.decode(bytes.subarray(space + 1, offset + length - 1));
    const equals = record.indexOf('=');
    assert(equals > 0, 'PAX record has no key');
    const key = record.slice(0, equals);
    assert(!Object.prototype.hasOwnProperty.call(values, key), `PAX key ${key} is duplicated`);
    values[key] = record.slice(equals + 1);
    offset += length;
  }
  return values;
}

function decodeTarHeaderText(bytes, label) {
  const nul = bytes.indexOf(0);
  const value = nul === -1 ? bytes : bytes.subarray(0, nul);
  if (nul !== -1) {
    assert(
      bytes.subarray(nul).every((byte) => byte === 0),
      `${label} has nonzero bytes after NUL`,
    );
  }
  try {
    return UTF8.decode(value);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
}

function decodeTarPath(value, label) {
  const bytes = Buffer.from(value, 'utf8');
  assert(
    bytes.length > 0 && bytes.length <= TREE_LIMITS.pathBytes + 8,
    `${label} length is invalid`,
  );
  assert(value.startsWith('package/'), `${label} is outside package/`);
  const packagePath = value.slice('package/'.length);
  decodePath(Buffer.from(packagePath, 'utf8'), label);
  return packagePath;
}

function parseTarFiles(tarball, options = { includeBytes: false }) {
  exactKeys(options, ['includeBytes'], 'tar parser options');
  assert(typeof options.includeBytes === 'boolean', 'tar parser includeBytes option is invalid');
  assert(Buffer.isBuffer(tarball) && tarball.length > 0, 'release artifact is empty');
  assert(
    tarball.length <= TAR_LIMITS.packedBytes,
    'release artifact exceeds the packed byte limit',
  );
  let archive;
  try {
    archive = zlib.gunzipSync(tarball, {
      maxOutputLength: TAR_LIMITS.totalBytes + TAR_LIMITS.files * 1024 + 1024,
    });
  } catch {
    fail('release artifact is not a valid gzip tarball');
  }
  const files = [];
  const paths = new Set();
  let offset = 0;
  let zeroBlocks = 0;
  let pax = {};
  let longPath = null;
  let totalBytes = 0;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      zeroBlocks += 1;
      offset += 512;
      if (zeroBlocks === 2) break;
      continue;
    }
    assert(zeroBlocks === 0, 'tarball contains data after its terminator began');
    const storedChecksum = parseTarNumber(header.subarray(148, 156), 'tar checksum');
    let computedChecksum = 0;
    for (let index = 0; index < 512; index += 1) {
      computedChecksum += index >= 148 && index < 156 ? 0x20 : header[index];
    }
    assert(storedChecksum === computedChecksum, 'tar header checksum mismatch');
    const size = parseTarNumber(header.subarray(124, 136), 'tar entry size');
    assert(size <= TAR_LIMITS.fileBytes, 'tar entry exceeds the file byte limit');
    const mode = parseTarNumber(header.subarray(100, 108), 'tar entry mode');
    const type = String.fromCharCode(header[156] || 0x30);
    const name = decodeTarHeaderText(header.subarray(0, 100), 'tar name');
    const prefix = decodeTarHeaderText(header.subarray(345, 500), 'tar prefix');
    const headerPath = prefix ? `${prefix}/${name}` : name;
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    assert(dataEnd <= archive.length, 'tar entry is truncated');
    const data = Buffer.from(archive.subarray(dataStart, dataEnd));
    if (type === 'x') {
      assert(
        Object.keys(pax).length === 0 && longPath === null,
        'tarball has stacked path metadata',
      );
      pax = parsePax(data);
      assert(
        Object.keys(pax).every((key) => key === 'path' || key === 'size'),
        'tarball contains unsupported PAX metadata',
      );
    } else if (type === 'L') {
      assert(
        Object.keys(pax).length === 0 && longPath === null,
        'tarball has stacked path metadata',
      );
      longPath = decodeTarHeaderText(data, 'GNU long path');
    } else {
      assert(type === '0' || type === '\0', `tar entry type ${JSON.stringify(type)} is forbidden`);
      const fullPath = pax.path || longPath || headerPath;
      if (pax.size !== undefined) assert(/^\d+$/u.test(pax.size), 'PAX size is not canonical');
      const effectiveSize = pax.size === undefined ? size : Number(pax.size);
      assert(
        Number.isSafeInteger(effectiveSize) && effectiveSize === size,
        'PAX size differs from the tar header',
      );
      const packagePath = decodeTarPath(fullPath, 'tar entry path');
      assert(!paths.has(packagePath), `tarball contains duplicate path ${packagePath}`);
      assert(
        mode === 0o644 || mode === 0o755,
        `tar entry ${packagePath} has forbidden mode ${mode.toString(8)}`,
      );
      paths.add(packagePath);
      totalBytes += size;
      assert(totalBytes <= TAR_LIMITS.totalBytes, 'tarball exceeds the unpacked byte limit');
      files.push(
        Object.freeze({
          path: packagePath,
          mode,
          size,
          sha256: sha256(data),
          ...(options.includeBytes ? { bytes: data } : {}),
        }),
      );
      assert(files.length <= TAR_LIMITS.files, 'tarball exceeds the file-count limit');
      pax = {};
      longPath = null;
    }
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  assert(zeroBlocks === 2, 'tarball is missing its two-block terminator');
  assert(
    archive.subarray(offset).every((byte) => byte === 0),
    'tarball contains nonzero trailing bytes',
  );
  assert(Object.keys(pax).length === 0 && longPath === null, 'tarball has dangling path metadata');
  files.sort((left, right) => left.path.localeCompare(right.path));
  return Object.freeze(files);
}

function buildRegistryManifest(rawEvidence, tarball) {
  const evidence = validateReleaseEvidence(rawEvidence);
  validateEvidenceArtifact(evidence, tarball);
  const packageJson = parseTarFiles(tarball, { includeBytes: true }).find(
    (entry) => entry.path === 'package.json',
  );
  assert(packageJson, 'retained Core artifact has no package.json');
  const manifest = strictJson(packageJson.bytes, 'retained Core package.json');
  assert(
    manifest && typeof manifest === 'object' && !Array.isArray(manifest),
    'retained Core package manifest must be an object',
  );
  assert(
    manifest.name === evidence.package.name && manifest.version === evidence.package.version,
    'retained Core package manifest identity differs from evidence',
  );
  for (const field of ['_id', '_nodeVersion', '_npmVersion', 'dist', 'gitHead', 'tag']) {
    assert(
      !Object.prototype.hasOwnProperty.call(manifest, field),
      `retained Core package manifest contains publisher-owned field ${field}`,
    );
  }
  return Object.freeze({ ...manifest, gitHead: evidence.source.commit });
}

function expectedFilename(version) {
  return `aikdna-kdna-core-${version}.tgz`;
}

function validatePack({ reportText, tarball, packageManifest }) {
  const document = strictJson(reportText, 'npm pack report');
  assert(
    Array.isArray(document) && document.length === 1,
    'npm pack must report exactly one artifact',
  );
  const report = document[0];
  exactKeys(
    report,
    [
      'id',
      'name',
      'version',
      'size',
      'unpackedSize',
      'shasum',
      'integrity',
      'filename',
      'files',
      'entryCount',
      'bundled',
    ],
    'npm pack artifact report',
  );
  assert(
    report.name === packageManifest.name && report.version === packageManifest.version,
    'npm pack identity mismatch',
  );
  assert(
    report.filename === expectedFilename(packageManifest.version),
    'npm pack filename mismatch',
  );
  assert(
    Array.isArray(report.bundled) && report.bundled.length === 0,
    'npm pack unexpectedly bundled dependencies',
  );
  assert(report.size === tarball.length, 'npm pack size differs from the artifact bytes');
  assert(report.shasum === sha1(tarball), 'npm pack shasum differs from the artifact bytes');
  assert(
    report.integrity === integrity(tarball),
    'npm pack integrity differs from the artifact bytes',
  );
  const files = parseTarFiles(tarball);
  const reported = Array.isArray(report.files)
    ? report.files
        .map((file) => {
          exactKeys(file, ['path', 'size', 'mode'], 'npm pack file report');
          return { path: file.path, size: file.size, mode: file.mode };
        })
        .sort((left, right) => left.path.localeCompare(right.path))
    : null;
  assert(reported, 'npm pack files report is missing');
  assert(
    JSON.stringify(reported) ===
      JSON.stringify(
        files.map(({ path: filePath, size, mode }) => ({ path: filePath, size, mode })),
      ),
    'npm pack files report differs from the tarball',
  );
  assert(report.entryCount === files.length, 'npm pack entry count differs from the tarball');
  const unpackedSize = files.reduce((sum, file) => sum + file.size, 0);
  assert(report.unpackedSize === unpackedSize, 'npm pack unpacked size differs from the tarball');
  return Object.freeze({
    filename: report.filename,
    integrity: report.integrity,
    shasum: report.shasum,
    sha256: sha256(tarball),
    packed_size: tarball.length,
    unpacked_size: unpackedSize,
    file_count: files.length,
    files,
  });
}

function packMaterializedSource(sourceRoot, invocation, packageManifest, parentTemp, label) {
  const runRoot = path.join(parentTemp, label);
  const artifacts = path.join(runRoot, 'artifacts');
  const home = path.join(runRoot, 'home');
  const cache = path.join(runRoot, 'cache');
  fs.mkdirSync(artifacts, { recursive: true, mode: 0o700 });
  fs.mkdirSync(home, { recursive: true, mode: 0o700 });
  const result = runNpm(
    invocation,
    ['pack', '--json', '--ignore-scripts', '--pack-destination', artifacts],
    {
      cwd: path.join(sourceRoot, ...PACKAGE_RELATIVE.split('/')),
      projectRoot: sourceRoot,
      home,
      cache,
      label: `audited npm pack ${label}`,
      timeout: 120_000,
    },
  );
  assert(result.stderr === '', `${label} npm pack wrote unexpected stderr`);
  const report = strictJson(result.stdout, `${label} npm pack report`);
  assert(
    Array.isArray(report) && report.length === 1 && typeof report[0].filename === 'string',
    `${label} npm pack filename is missing`,
  );
  const artifactPath = path.join(artifacts, report[0].filename);
  const stats = fs.lstatSync(artifactPath);
  assert(
    stats.isFile() && !stats.isSymbolicLink(),
    `${label} npm pack artifact is not a regular file`,
  );
  const tarball = fs.readFileSync(artifactPath);
  const artifact = validatePack({ reportText: result.stdout, tarball, packageManifest });
  return Object.freeze({ artifactPath, reportText: result.stdout, tarball, artifact });
}

function gateEnvironment(invocation, tempRoot) {
  const home = path.join(tempRoot, 'gate-home');
  const cache = path.join(tempRoot, 'gate-cache');
  fs.mkdirSync(home, { recursive: true, mode: 0o700 });
  return cleanNpmEnvironment({ invocation, home, cache });
}

function runNodeGate(scriptPath, cwd, environment, label) {
  const result = runProcess(process.execPath, [scriptPath], {
    cwd,
    encoding: 'utf8',
    env: environment,
    label,
    timeout: 120_000,
  });
  assert(result.stderr === '', `${label} wrote unexpected stderr`);
  return result.stdout.trim();
}

function runReleaseGates({ sourceRoot, invocation, tempRoot }) {
  const environment = gateEnvironment(invocation, tempRoot);
  runNodeGate(
    path.join(sourceRoot, 'scripts', 'check-pack-contents.js'),
    sourceRoot,
    environment,
    'Core pack-content gate',
  );
  runNodeGate(
    path.join(sourceRoot, 'scripts', 'check-public-surface.mjs'),
    sourceRoot,
    environment,
    'Core public-surface gate',
  );
  runNodeGate(
    path.join(sourceRoot, 'scripts', 'check-post-cutover-naming.mjs'),
    sourceRoot,
    environment,
    'Core naming gate',
  );
  return Object.freeze({
    release_readiness: true,
    pack_content: true,
    public_surface: true,
    naming: true,
  });
}

function buildEvidence({ context, artifact, secondArtifact, npmVersion, gitVersion, gates }) {
  assert(artifact.sha256 === secondArtifact.sha256, 'independent npm packs are not byte-identical');
  return Object.freeze({
    schema: 'kdna.core.release-evidence',
    schema_version: '1.0.0',
    source: Object.freeze({
      repository: REPOSITORY,
      ref: context.ref,
      tag: context.tag,
      commit: context.commit,
      tree: context.tree,
      author: context.author,
      committer: context.committer,
      author_signoff_match: context.authorSignoffMatch,
      dco_signoff_count: context.signoffs.length,
      tracked_file_count: context.treeState.fileCount,
      tracked_bytes: context.treeState.totalBytes,
      materialization: 'git-cat-file-blobs',
    }),
    package: Object.freeze({
      name: context.name,
      version: context.version,
      directory: PACKAGE_RELATIVE,
    }),
    tooling: Object.freeze({
      git: gitVersion,
      npm: npmVersion,
      npm_release_url: TRUSTED_NPM_URL,
      npm_release_integrity: TRUSTED_NPM_INTEGRITY,
      npm_release_entry_count: TRUSTED_NPM_ENTRY_COUNT,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    }),
    gates,
    reproducibility: Object.freeze({
      isolated_exact_commit_sources: 2,
      npm_pack_ignore_scripts: true,
      same_platform_byte_equal: true,
      first_sha256: artifact.sha256,
      second_sha256: secondArtifact.sha256,
    }),
    artifact,
  });
}

function validateReleaseEvidence(evidence) {
  exactKeys(
    evidence,
    [
      'schema',
      'schema_version',
      'source',
      'package',
      'tooling',
      'gates',
      'reproducibility',
      'artifact',
    ],
    'Core release evidence',
  );
  assert(
    evidence.schema === 'kdna.core.release-evidence',
    'Core release evidence schema is invalid',
  );
  assert(evidence.schema_version === '1.0.0', 'Core release evidence schema version is invalid');
  exactKeys(
    evidence.source,
    [
      'repository',
      'ref',
      'tag',
      'commit',
      'tree',
      'author',
      'committer',
      'author_signoff_match',
      'dco_signoff_count',
      'tracked_file_count',
      'tracked_bytes',
      'materialization',
    ],
    'Core release evidence source',
  );
  assert(evidence.source.repository === REPOSITORY, 'Core release evidence repository is invalid');
  assert(STABLE_SEMVER_RE.test(evidence.source.tag || ''), 'Core release evidence tag is invalid');
  assert(
    evidence.source.ref === `refs/tags/${evidence.source.tag}`,
    'Core release evidence ref is invalid',
  );
  assert(COMMIT_RE.test(evidence.source.commit || ''), 'Core release evidence commit is invalid');
  assert(OBJECT_RE.test(evidence.source.tree || ''), 'Core release evidence tree is invalid');
  validateNormalizedIdentity(evidence.source.author, 'Core release evidence author');
  validateNormalizedIdentity(evidence.source.committer, 'Core release evidence committer');
  assert(
    evidence.source.author_signoff_match === true,
    'Core release evidence author DCO match is invalid',
  );
  assert(
    Number.isSafeInteger(evidence.source.dco_signoff_count) &&
      evidence.source.dco_signoff_count > 0,
    'Core release evidence DCO count is invalid',
  );
  assert(
    Number.isSafeInteger(evidence.source.tracked_file_count) &&
      evidence.source.tracked_file_count > 0 &&
      evidence.source.tracked_file_count <= TREE_LIMITS.files,
    'Core release evidence tracked file count is invalid',
  );
  assert(
    Number.isSafeInteger(evidence.source.tracked_bytes) &&
      evidence.source.tracked_bytes > 0 &&
      evidence.source.tracked_bytes <= TREE_LIMITS.totalBytes,
    'Core release evidence tracked byte count is invalid',
  );
  assert(
    evidence.source.materialization === 'git-cat-file-blobs',
    'Core release evidence materialization is invalid',
  );

  exactKeys(evidence.package, ['name', 'version', 'directory'], 'Core release evidence package');
  assert(evidence.package.name === PACKAGE_NAME, 'Core release evidence package name is invalid');
  assert(
    evidence.package.version === evidence.source.tag,
    'Core release evidence version differs from its tag',
  );
  assert(
    evidence.package.directory === PACKAGE_RELATIVE,
    'Core release evidence package directory is invalid',
  );

  exactKeys(
    evidence.tooling,
    [
      'git',
      'npm',
      'npm_release_url',
      'npm_release_integrity',
      'npm_release_entry_count',
      'node',
      'platform',
      'arch',
    ],
    'Core release evidence tooling',
  );
  assert(
    /^git version \d+\.\d+\./u.test(evidence.tooling.git || ''),
    'Core release evidence Git version is invalid',
  );
  assert(
    evidence.tooling.npm === AUDITED_NPM_VERSION,
    'Core release evidence npm version is not audited',
  );
  assert(
    evidence.tooling.npm_release_url === TRUSTED_NPM_URL,
    'Core release evidence npm source is not audited',
  );
  assert(
    evidence.tooling.npm_release_integrity === TRUSTED_NPM_INTEGRITY,
    'Core release evidence npm integrity is not audited',
  );
  assert(
    evidence.tooling.npm_release_entry_count === TRUSTED_NPM_ENTRY_COUNT,
    'Core release evidence npm extraction boundary is not audited',
  );
  assert(
    /^v\d+\.\d+\.\d+$/u.test(evidence.tooling.node || ''),
    'Core release evidence Node version is invalid',
  );
  assert(
    typeof evidence.tooling.platform === 'string' && evidence.tooling.platform.length > 0,
    'Core release evidence platform is invalid',
  );
  assert(
    typeof evidence.tooling.arch === 'string' && evidence.tooling.arch.length > 0,
    'Core release evidence architecture is invalid',
  );

  exactKeys(
    evidence.gates,
    ['release_readiness', 'pack_content', 'public_surface', 'naming'],
    'Core release evidence gates',
  );
  assert(
    Object.values(evidence.gates).every((value) => value === true),
    'Core release evidence contains an unpassed gate',
  );

  exactKeys(
    evidence.reproducibility,
    [
      'isolated_exact_commit_sources',
      'npm_pack_ignore_scripts',
      'same_platform_byte_equal',
      'first_sha256',
      'second_sha256',
    ],
    'Core release evidence reproducibility',
  );
  assert(
    evidence.reproducibility.isolated_exact_commit_sources === 2,
    'Core release evidence requires two isolated sources',
  );
  assert(
    evidence.reproducibility.npm_pack_ignore_scripts === true,
    'Core release evidence must disable pack scripts',
  );
  assert(
    evidence.reproducibility.same_platform_byte_equal === true,
    'Core release packs are not byte-equal',
  );
  assert(
    /^[0-9a-f]{64}$/u.test(evidence.reproducibility.first_sha256 || ''),
    'Core first pack digest is invalid',
  );
  assert(
    evidence.reproducibility.second_sha256 === evidence.reproducibility.first_sha256,
    'Core pack digests differ',
  );

  const artifact = evidence.artifact;
  exactKeys(
    artifact,
    [
      'filename',
      'integrity',
      'shasum',
      'sha256',
      'packed_size',
      'unpacked_size',
      'file_count',
      'files',
    ],
    'Core release evidence artifact',
  );
  assert(
    artifact.filename === expectedFilename(evidence.package.version),
    'Core release evidence filename is invalid',
  );
  assert(
    /^sha512-[A-Za-z0-9+/]{86}==$/u.test(artifact.integrity || ''),
    'Core release evidence integrity is invalid',
  );
  assert(/^[0-9a-f]{40}$/u.test(artifact.shasum || ''), 'Core release evidence shasum is invalid');
  assert(/^[0-9a-f]{64}$/u.test(artifact.sha256 || ''), 'Core release evidence sha256 is invalid');
  assert(
    artifact.sha256 === evidence.reproducibility.first_sha256,
    'Core artifact digest differs from reproducibility evidence',
  );
  assert(
    Number.isSafeInteger(artifact.packed_size) &&
      artifact.packed_size > 0 &&
      artifact.packed_size <= TAR_LIMITS.packedBytes,
    'Core release evidence packed size is invalid',
  );
  assert(
    Number.isSafeInteger(artifact.unpacked_size) &&
      artifact.unpacked_size > 0 &&
      artifact.unpacked_size <= TAR_LIMITS.totalBytes,
    'Core release evidence unpacked size is invalid',
  );
  assert(
    Number.isSafeInteger(artifact.file_count) &&
      artifact.file_count > 0 &&
      artifact.file_count <= TAR_LIMITS.files,
    'Core release evidence file count is invalid',
  );
  assert(
    Array.isArray(artifact.files) && artifact.files.length === artifact.file_count,
    'Core release evidence files are invalid',
  );
  let unpackedSize = 0;
  let previous = null;
  for (const file of artifact.files) {
    exactKeys(file, ['path', 'mode', 'size', 'sha256'], 'Core release evidence file');
    decodePath(Buffer.from(file.path, 'utf8'), 'Core release evidence file path');
    assert(
      previous === null || previous.localeCompare(file.path) < 0,
      'Core release evidence files must be uniquely sorted',
    );
    previous = file.path;
    assert(
      file.mode === 0o644 || file.mode === 0o755,
      'Core release evidence file mode is invalid',
    );
    assert(
      Number.isSafeInteger(file.size) && file.size >= 0 && file.size <= TAR_LIMITS.fileBytes,
      'Core release evidence file size is invalid',
    );
    assert(
      /^[0-9a-f]{64}$/u.test(file.sha256 || ''),
      'Core release evidence file digest is invalid',
    );
    unpackedSize += file.size;
  }
  assert(
    unpackedSize === artifact.unpacked_size,
    'Core release evidence unpacked size differs from its files',
  );
  return evidence;
}

function validateEvidenceArtifact(rawEvidence, tarball) {
  const evidence = validateReleaseEvidence(rawEvidence);
  assert(
    Buffer.isBuffer(tarball) && tarball.length === evidence.artifact.packed_size,
    'retained artifact size differs from evidence',
  );
  assert(
    sha1(tarball) === evidence.artifact.shasum,
    'retained artifact shasum differs from evidence',
  );
  assert(
    sha256(tarball) === evidence.artifact.sha256,
    'retained artifact sha256 differs from evidence',
  );
  assert(
    integrity(tarball) === evidence.artifact.integrity,
    'retained artifact integrity differs from evidence',
  );
  const files = parseTarFiles(tarball);
  assert(
    JSON.stringify(files) === JSON.stringify(evidence.artifact.files),
    'retained artifact files differ from evidence',
  );
  return evidence;
}

function resolveDestination(destination) {
  let existing = path.resolve(destination);
  const suffix = [];
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing);
    assert(parent !== existing, `cannot resolve destination ${destination}`);
    suffix.unshift(path.basename(existing));
    existing = parent;
  }
  return path.resolve(fs.realpathSync(existing), ...suffix);
}

function assertOutsideRepository(destination, label, root = REPO_ROOT) {
  const resolved = resolveDestination(destination);
  const relative = path.relative(fs.realpathSync(root), resolved);
  assert(
    relative !== '' && (relative.startsWith('..') || path.isAbsolute(relative)),
    `${label} must be outside the repository`,
  );
  return resolved;
}

function parseArtifactArguments(argv, usage) {
  const evidenceIndex = argv.indexOf('--evidence');
  const artifactIndex = argv.indexOf('--artifact');
  assert(
    argv.length === 4 &&
      evidenceIndex >= 0 &&
      artifactIndex >= 0 &&
      argv[evidenceIndex + 1] &&
      argv[artifactIndex + 1],
    usage,
  );
  const evidencePath = path.resolve(argv[evidenceIndex + 1]);
  const artifactPath = path.resolve(argv[artifactIndex + 1]);
  assert(evidencePath !== artifactPath, 'release evidence and artifact paths must differ');
  return { evidencePath, artifactPath };
}

function parseTrustedNpmArguments(argv) {
  assert(
    argv.length === 2 && argv[0] === '--artifact' && argv[1],
    'usage: provision-npm --artifact <outside-repo/npm-11.17.0.tgz>',
  );
  return { artifactPath: path.resolve(argv[1]) };
}

function verifyTrustedNpmInvocation(options = {}) {
  const invocation = resolveTrustedNpmInvocation(options);
  try {
    const result = runNpm(invocation, ['--version'], {
      label: 'trusted npm version verification',
      timeout: REGISTRY_TIMEOUT_MS,
    });
    assert(result.stderr === '', 'trusted npm version verification wrote unexpected stderr');
    assert(result.stdout.trim() === AUDITED_NPM_VERSION, 'trusted npm version output is invalid');
    return Object.freeze({
      version: invocation.version,
      releaseUrl: invocation.releaseUrl,
      releaseIntegrity: invocation.releaseIntegrity,
    });
  } finally {
    invocation.cleanup();
  }
}

function prepareRelease({ evidencePath, artifactPath, env = process.env, root = REPO_ROOT }) {
  const resolvedEvidence = assertOutsideRepository(evidencePath, 'Core release evidence', root);
  const resolvedArtifact = assertOutsideRepository(artifactPath, 'Core release artifact', root);
  assert(
    resolvedEvidence !== resolvedArtifact,
    'Core release evidence and artifact destinations collide',
  );
  assert(
    !fs.existsSync(resolvedEvidence) && !fs.existsSync(resolvedArtifact),
    'Core release outputs already exist',
  );
  const context = inspectAuthoritativeRelease(env, root);
  assert(
    path.basename(resolvedArtifact) === expectedFilename(context.version),
    'Core release artifact destination must use the npm filename',
  );
  const temp = makePrivateTemp('kdna-core-authoritative-release-');
  let invocation;
  let artifactCreated = false;
  let evidenceCreated = false;
  let complete = false;
  try {
    invocation = resolveTrustedNpmInvocation({ environment: env, root });
    const firstSource = materializeTree(context.treeState, path.join(temp, 'source-one'), root);
    const secondSource = materializeTree(context.treeState, path.join(temp, 'source-two'), root);
    initializeIsolatedGateRepository(firstSource, context.treeState, context.commit, root);
    initializeIsolatedGateRepository(secondSource, context.treeState, context.commit, root);
    const packageManifest = strictJson(
      fs.readFileSync(path.join(firstSource, ...PACKAGE_RELATIVE.split('/'), 'package.json')),
      'materialized Core package.json',
    );
    const gates = runReleaseGates({
      sourceRoot: firstSource,
      invocation,
      tempRoot: path.join(temp, 'gates'),
    });
    const first = packMaterializedSource(
      firstSource,
      invocation,
      packageManifest,
      temp,
      'pack-one',
    );
    const second = packMaterializedSource(
      secondSource,
      invocation,
      packageManifest,
      temp,
      'pack-two',
    );
    assert(
      first.tarball.equals(second.tarball),
      'two isolated exact-commit npm packs differ byte-for-byte',
    );
    const evidence = buildEvidence({
      context,
      artifact: first.artifact,
      secondArtifact: second.artifact,
      npmVersion: AUDITED_NPM_VERSION,
      gitVersion: gitText(['--version'], { cwd: root }),
      gates,
    });
    validateEvidenceArtifact(evidence, first.tarball);
    fs.mkdirSync(path.dirname(resolvedArtifact), { recursive: true, mode: 0o700 });
    fs.mkdirSync(path.dirname(resolvedEvidence), { recursive: true, mode: 0o700 });
    fs.writeFileSync(resolvedArtifact, first.tarball, { flag: 'wx', mode: 0o600 });
    artifactCreated = true;
    assert(
      fs.readFileSync(resolvedArtifact).equals(first.tarball),
      'retained Core artifact differs after writing',
    );
    fs.writeFileSync(resolvedEvidence, `${JSON.stringify(evidence, null, 2)}\n`, {
      flag: 'wx',
      mode: 0o600,
    });
    evidenceCreated = true;
    const rebound = inspectAuthoritativeRelease(env, root);
    assert(
      rebound.commit === context.commit && rebound.tree === context.tree,
      'release binding changed during evidence generation',
    );
    complete = true;
    return evidence;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
    if (invocation) invocation.cleanup();
    if (!complete) {
      if (evidenceCreated) fs.rmSync(resolvedEvidence, { force: true });
      if (artifactCreated) fs.rmSync(resolvedArtifact, { force: true });
    }
  }
}

function expectedRegistryE404(evidence) {
  const spec = `${evidence.package.name}@${evidence.package.version}`;
  return Object.freeze({
    summary: `No match found for version ${evidence.package.version}`,
    detail:
      `The requested resource '${spec}' could not be found or you do not have permission to access it.` +
      '\n\nNote that you can also install from a\ntarball, folder, http url, or git url.',
  });
}

function evaluateRegistryResult(result, rawEvidence) {
  const evidence = validateReleaseEvidence(rawEvidence);
  assert(
    result && !result.error,
    `registry lookup failed: ${result?.error?.message || 'unknown error'}`,
  );
  assert(Number.isInteger(result.status), 'registry lookup returned no integer status');
  assert(
    typeof result.stdout === 'string' && typeof result.stderr === 'string',
    'registry output must be text',
  );
  if (result.status === 1) {
    assert(result.stderr === '', 'registry E404 wrote contradictory or injected stderr');
    const document = strictJson(result.stdout, 'registry E404 stdout');
    exactKeys(document, ['error'], 'registry E404 document');
    exactKeys(document.error, ['code', 'summary', 'detail'], 'registry E404 error');
    const expected = expectedRegistryE404(evidence);
    assert(document.error.code === 'E404', 'registry absence requires E404');
    assert(document.error.summary === expected.summary, 'registry E404 version mismatch');
    assert(document.error.detail === expected.detail, 'registry E404 target mismatch');
    return Object.freeze({ decision: 'publish', shouldPublish: true });
  }
  assert(result.status === 0, `registry lookup exited ${result.status}; refusing publication`);
  assert(result.stderr === '', 'successful registry lookup wrote unexpected stderr');
  const metadata = strictJson(result.stdout, 'registry metadata stdout');
  const keys = Object.keys(metadata).sort();
  const required = ['dist.integrity', 'dist.shasum', 'gitHead', 'name', 'version'].sort();
  assert(
    JSON.stringify(keys) === JSON.stringify(required),
    'registry metadata fields are not exact',
  );
  assert(metadata.name === evidence.package.name, 'registry package name collision');
  assert(metadata.version === evidence.package.version, 'registry package version collision');
  assert(
    metadata['dist.integrity'] === evidence.artifact.integrity,
    'registry integrity collision',
  );
  assert(metadata['dist.shasum'] === evidence.artifact.shasum, 'registry shasum collision');
  assert(COMMIT_RE.test(metadata.gitHead || ''), 'registry gitHead is invalid');
  assert(metadata.gitHead === evidence.source.commit, 'registry gitHead collision');
  return Object.freeze({ decision: 'skip-identical', shouldPublish: false });
}

function queryRegistry(invocation, evidence) {
  const temp = makePrivateTemp('kdna-core-registry-query-');
  try {
    fs.writeFileSync(
      path.join(temp, 'package.json'),
      `${JSON.stringify({ name: 'kdna-core-registry-query', version: '1.0.0', private: true })}\n`,
      { flag: 'wx', mode: 0o600 },
    );
    assertNoProjectNpmConfig(temp, temp);
    const spec = `${evidence.package.name}@${evidence.package.version}`;
    return spawnSync(
      invocation.command,
      [
        ...invocation.prefixArgs,
        'view',
        spec,
        'name',
        'version',
        'dist.integrity',
        'dist.shasum',
        'gitHead',
        '--json',
        '--loglevel=silent',
        `--registry=${OFFICIAL_REGISTRY}`,
      ],
      {
        cwd: temp,
        encoding: 'utf8',
        env: cleanNpmEnvironment({
          invocation,
          home: path.join(temp, 'home'),
          cache: path.join(temp, 'cache'),
        }),
        maxBuffer: 1024 * 1024,
        shell: false,
        timeout: REGISTRY_TIMEOUT_MS,
      },
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function bindCurrentEvidence(rawEvidence, env = process.env, root = REPO_ROOT) {
  const evidence = validateReleaseEvidence(rawEvidence);
  const context = inspectAuthoritativeRelease(env, root);
  assert(evidence.source.repository === REPOSITORY, 'release evidence repository binding is stale');
  assert(evidence.source.ref === context.ref, 'release evidence ref binding is stale');
  assert(evidence.source.tag === context.tag, 'release evidence tag binding is stale');
  assert(evidence.source.commit === context.commit, 'release evidence commit binding is stale');
  assert(evidence.source.tree === context.tree, 'release evidence tree binding is stale');
  assert(evidence.source.author === context.author, 'release evidence author binding is stale');
  assert(
    evidence.source.committer === context.committer,
    'release evidence committer binding is stale',
  );
  assert(
    evidence.source.author_signoff_match === context.authorSignoffMatch,
    'release evidence author DCO binding is stale',
  );
  assert(
    evidence.source.dco_signoff_count === context.signoffs.length,
    'release evidence DCO binding is stale',
  );
  assert(
    evidence.source.tracked_file_count === context.treeState.fileCount,
    'release evidence file-count binding is stale',
  );
  assert(
    evidence.source.tracked_bytes === context.treeState.totalBytes,
    'release evidence byte-count binding is stale',
  );
  assert(
    evidence.package.name === context.name && evidence.package.version === context.version,
    'release evidence package binding is stale',
  );
  assert(evidence.tooling.node === process.version, 'release evidence Node binding is stale');
  assert(
    evidence.tooling.platform === process.platform && evidence.tooling.arch === process.arch,
    'release evidence platform binding is stale',
  );
  assert(
    evidence.tooling.git === gitText(['--version'], { cwd: root }),
    'release evidence Git binding is stale',
  );
  return evidence;
}

function readCandidate({ evidencePath, artifactPath, env = process.env, root = REPO_ROOT }) {
  assertOutsideRepository(evidencePath, 'Core release evidence', root);
  assertOutsideRepository(artifactPath, 'Core release artifact', root);
  const evidenceFile = readCanonicalRegularOneLink(evidencePath, 'Core release evidence', {
    maximum: JSON_LIMITS.bytes,
  });
  const artifactFile = readCanonicalRegularOneLink(artifactPath, 'Core release artifact', {
    maximum: TAR_LIMITS.packedBytes,
  });
  const evidence = bindCurrentEvidence(
    strictJson(evidenceFile.bytes, 'Core release evidence'),
    env,
    root,
  );
  const tarball = artifactFile.bytes;
  validateEvidenceArtifact(evidence, tarball);
  assert(
    path.basename(artifactFile.path) === evidence.artifact.filename,
    'retained Core artifact filename differs from evidence',
  );
  return Object.freeze({ evidence, tarball, artifactPath: artifactFile.path });
}

function writeVerifiedArtifactCopy(directory, evidence, tarball) {
  validateEvidenceArtifact(evidence, tarball);
  const artifactPath = path.join(directory, evidence.artifact.filename);
  fs.writeFileSync(artifactPath, tarball, { flag: 'wx', mode: 0o600 });
  const copy = readCanonicalRegularOneLink(artifactPath, 'secured Core release artifact', {
    maximum: TAR_LIMITS.packedBytes,
  });
  validateEvidenceArtifact(evidence, copy.bytes);
  return copy.path;
}

function guardCandidate({ evidence, tarball, bindCurrent, lookup }) {
  const bound = bindCurrent(evidence);
  validateEvidenceArtifact(bound, tarball);
  return evaluateRegistryResult(lookup(bound), bound);
}

function publishCandidate({ evidence, tarball, artifactPath, bindCurrent, lookup, publish }) {
  const bound = bindCurrent(evidence);
  validateEvidenceArtifact(bound, tarball);
  const decision = evaluateRegistryResult(lookup(bound), bound);
  if (!decision.shouldPublish) return Object.freeze({ ...decision, published: false });
  const rebound = bindCurrent(bound);
  validateEvidenceArtifact(rebound, tarball);
  const result = publish({ evidence: rebound, tarball, artifactPath });
  assert(result && !result.error, 'verified Core publisher failed');
  assert(Number.isInteger(result.status), 'verified Core publisher returned no integer status');
  assert(result.status === 0, 'verified Core publisher failed');
  return Object.freeze({ decision: 'published', shouldPublish: true, published: true });
}

function guardRelease({ evidencePath, artifactPath, env = process.env, root = REPO_ROOT }) {
  const invocation = resolveTrustedNpmInvocation({ environment: env, root });
  try {
    const candidate = readCandidate({ evidencePath, artifactPath, env, root });
    return guardCandidate({
      evidence: candidate.evidence,
      tarball: candidate.tarball,
      bindCurrent: (evidence) => bindCurrentEvidence(evidence, env, root),
      lookup: (evidence) => queryRegistry(invocation, evidence),
    });
  } finally {
    invocation.cleanup();
  }
}

function publishRelease({ evidencePath, artifactPath, env = process.env, root = REPO_ROOT }) {
  assert(
    typeof env.NODE_AUTH_TOKEN === 'string' && env.NODE_AUTH_TOKEN !== '',
    'NODE_AUTH_TOKEN is required for Core publication',
  );
  const temp = makePrivateTemp('kdna-core-publisher-');
  let invocation;
  try {
    invocation = resolveTrustedNpmInvocation({ environment: env, root });
    const candidate = readCandidate({ evidencePath, artifactPath, env, root });
    const publishTree = inspectTree(candidate.evidence.source.commit, root);
    const publishRoot = materializeTree(publishTree, path.join(temp, 'source'), root);
    initializeIsolatedGateRepository(
      publishRoot,
      publishTree,
      candidate.evidence.source.commit,
      root,
    );
    assertNoProjectNpmConfig(publishRoot, publishRoot);
    const securedArtifact = writeVerifiedArtifactCopy(temp, candidate.evidence, candidate.tarball);
    const registryManifest = buildRegistryManifest(candidate.evidence, candidate.tarball);
    const registryManifestPath = path.join(temp, 'registry-manifest.json');
    fs.writeFileSync(registryManifestPath, `${JSON.stringify(registryManifest)}\n`, {
      flag: 'wx',
      mode: 0o600,
    });
    const publisherPath = path.join(publishRoot, ...TRUSTED_PUBLISHER_RELATIVE.split('/'));
    readCanonicalRegularOneLink(publisherPath, 'exact-commit Core publisher', {
      maximum: 1024 * 1024,
    });
    return publishCandidate({
      evidence: candidate.evidence,
      tarball: candidate.tarball,
      artifactPath: securedArtifact,
      bindCurrent: (evidence) => bindCurrentEvidence(evidence, env, root),
      lookup: (evidence) => queryRegistry(invocation, evidence),
      publish: () =>
        spawnSync(
          invocation.command,
          [publisherPath, invocation.publishLibraryPath, registryManifestPath, securedArtifact],
          {
            cwd: publishRoot,
            env: cleanNpmEnvironment({
              invocation,
              home: path.join(temp, 'home'),
              cache: path.join(temp, 'cache'),
              environment: env,
              allowAuth: true,
            }),
            maxBuffer: 16 * 1024 * 1024,
            shell: false,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: 300_000,
          },
        ),
    });
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
    if (invocation) invocation.cleanup();
  }
}

function smokeRelease({ evidencePath, artifactPath, env = process.env, root = REPO_ROOT }) {
  const temp = makePrivateTemp('kdna-core-release-smoke-');
  let invocation;
  try {
    invocation = resolveTrustedNpmInvocation({ environment: env, root });
    const candidate = readCandidate({ evidencePath, artifactPath, env, root });
    const securedArtifact = writeVerifiedArtifactCopy(temp, candidate.evidence, candidate.tarball);
    fs.writeFileSync(
      path.join(temp, 'package.json'),
      `${JSON.stringify({ name: 'kdna-core-release-smoke', version: '1.0.0', private: true })}\n`,
      { flag: 'wx', mode: 0o600 },
    );
    runNpm(
      invocation,
      [
        'install',
        securedArtifact,
        '--ignore-scripts',
        '--package-lock=false',
        '--no-audit',
        '--no-fund',
        `--registry=${OFFICIAL_REGISTRY}`,
      ],
      {
        cwd: temp,
        home: path.join(temp, 'home'),
        cache: path.join(temp, 'cache'),
        label: 'Core exact-tarball clean install',
        timeout: 120_000,
      },
    );
    const probe = [
      "const assert=require('node:assert/strict');",
      "const fs=require('node:fs');",
      "const path=require('node:path');",
      "const core=require('@aikdna/kdna-core');",
      "const remote=require('@aikdna/kdna-core/remote-runtime');",
      "const manifestPath=require.resolve('@aikdna/kdna-core/package.json');",
      'const manifest=require(manifestPath);',
      `assert.equal(manifest.name,${JSON.stringify(candidate.evidence.package.name)});`,
      `assert.equal(manifest.version,${JSON.stringify(candidate.evidence.package.version)});`,
      'assert.match(manifestPath,/node_modules\\/@aikdna\\/kdna-core\\/package\\.json$/);',
      "assert.deepEqual(Object.keys(remote),['loadRemoteRuntimeAsset']);",
      'assert.equal(core.loadRemoteRuntimeAsset,undefined);',
      'assert.equal(core.loadRemoteRuntimeAssetForServer,undefined);',
      'assert.equal(core.loadAssetUnsafe,undefined);',
      "assert.equal(fs.existsSync(path.join(path.dirname(manifestPath),manifest.exports['./remote-runtime'].types)),true);",
      "for(const spec of ['@aikdna/kdna-core/src/container/index.js','@aikdna/kdna-core/src/remote-runtime.js']) assert.throws(()=>require(spec),e=>e&&e.code==='ERR_PACKAGE_PATH_NOT_EXPORTED');",
      "Promise.all([import('@aikdna/kdna-core'),import('@aikdna/kdna-core/remote-runtime')]).then(([esm,resm])=>{assert.equal(esm.loadRemoteRuntimeAsset,undefined);assert.deepEqual(Object.keys(resm).filter(k=>k!=='default'),['loadRemoteRuntimeAsset']);}).catch(e=>{console.error(e);process.exit(1);});",
    ].join('\n');
    const result = runProcess(process.execPath, ['-e', probe], {
      cwd: temp,
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' },
      label: 'Core installed artifact probe',
      timeout: 30_000,
    });
    assert(result.stderr === '', 'Core installed artifact probe wrote unexpected stderr');
    return true;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
    if (invocation) invocation.cleanup();
  }
}

function comparePackageCommits({ baseline, candidate, root = REPO_ROOT }) {
  assert(COMMIT_RE.test(baseline || ''), 'package invariant baseline must be a full commit id');
  assert(COMMIT_RE.test(candidate || ''), 'package invariant candidate must be a full commit id');
  const temp = makePrivateTemp('kdna-core-package-invariant-');
  let invocation;
  try {
    invocation = resolveTrustedNpmInvocation({ root });
    const baselineTree = inspectTree(baseline, root);
    const candidateTree = inspectTree(candidate, root);
    const baselineSource = materializeTree(baselineTree, path.join(temp, 'baseline'), root);
    const candidateSource = materializeTree(candidateTree, path.join(temp, 'candidate'), root);
    const baselineManifest = strictJson(
      fs.readFileSync(path.join(baselineSource, ...PACKAGE_RELATIVE.split('/'), 'package.json')),
      'baseline Core package.json',
    );
    const candidateManifest = strictJson(
      fs.readFileSync(path.join(candidateSource, ...PACKAGE_RELATIVE.split('/'), 'package.json')),
      'candidate Core package.json',
    );
    assert(baselineManifest.name === candidateManifest.name, 'Core package invariant name changed');
    assert(
      baselineManifest.version === candidateManifest.version,
      'Core package invariant version changed',
    );
    const first = packMaterializedSource(
      baselineSource,
      invocation,
      baselineManifest,
      temp,
      'baseline-pack',
    );
    const second = packMaterializedSource(
      candidateSource,
      invocation,
      candidateManifest,
      temp,
      'candidate-pack',
    );
    const installedSurfaceEqual =
      JSON.stringify(first.artifact.files) === JSON.stringify(second.artifact.files);
    assert(installedSurfaceEqual, 'Core package installation paths, modes, or bytes changed');
    return Object.freeze({
      baseline,
      candidate,
      package: `${baselineManifest.name}@${baselineManifest.version}`,
      tar_byte_equal: first.tarball.equals(second.tarball),
      installed_surface_equal: true,
      baseline_sha256: first.artifact.sha256,
      candidate_sha256: second.artifact.sha256,
      files: first.artifact.file_count,
    });
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
    if (invocation) invocation.cleanup();
  }
}

function writeGithubDecision(filePath, decision) {
  assert(filePath, 'GITHUB_OUTPUT is required');
  fs.appendFileSync(
    filePath,
    `should_publish=${decision.shouldPublish ? 'true' : 'false'}\ndecision=${decision.decision}\n`,
    'utf8',
  );
}

function parseInvariantArguments(argv) {
  const baselineIndex = argv.indexOf('--baseline');
  const candidateIndex = argv.indexOf('--candidate');
  assert(
    argv.length === 4 && baselineIndex >= 0 && candidateIndex >= 0,
    'usage: invariant --baseline <commit> --candidate <commit>',
  );
  return { baseline: argv[baselineIndex + 1], candidate: argv[candidateIndex + 1] };
}

async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  if (command === 'provision-npm') {
    const { artifactPath } = parseTrustedNpmArguments(args);
    await provisionTrustedNpmTarball({ artifactPath });
    console.log(`Trusted npm release provisioned: ${AUDITED_NPM_VERSION}`);
    return;
  }
  if (command === 'verify-npm' && args.length === 0) {
    const verified = verifyTrustedNpmInvocation();
    console.log(`Trusted npm release verified: ${verified.version}`);
    return;
  }
  if (command === 'trusted-npm') {
    runTrustedNpmCommand(args);
    return;
  }
  if (command === 'trusted-npm-auth') {
    runTrustedNpmCommand(args, { allowAuth: true });
    return;
  }
  if (command === 'check' && args.length === 0) {
    const context = inspectAuthoritativeRelease();
    console.log(
      `Core release binding verified: ${context.name}@${context.version} ${context.commit}`,
    );
    return;
  }
  if (command === 'prepare') {
    const options = parseArtifactArguments(
      args,
      'usage: prepare --evidence <outside-repo.json> --artifact <outside-repo.tgz>',
    );
    const evidence = prepareRelease(options);
    console.log(
      `Core release artifact prepared: ${evidence.package.name}@${evidence.package.version} ${evidence.artifact.sha256}`,
    );
    return;
  }
  if (command === 'smoke') {
    const options = parseArtifactArguments(
      args,
      'usage: smoke --evidence <outside-repo.json> --artifact <outside-repo.tgz>',
    );
    smokeRelease(options);
    console.log('Core retained artifact clean-install smoke passed');
    return;
  }
  if (command === 'guard') {
    const options = parseArtifactArguments(
      args,
      'usage: guard --evidence <outside-repo.json> --artifact <outside-repo.tgz>',
    );
    const decision = guardRelease(options);
    if (process.env.GITHUB_ACTIONS === 'true')
      writeGithubDecision(process.env.GITHUB_OUTPUT, decision);
    console.log(`Core registry decision: ${decision.decision}`);
    return;
  }
  if (command === 'publish') {
    const options = parseArtifactArguments(
      args,
      'usage: publish --evidence <outside-repo.json> --artifact <outside-repo.tgz>',
    );
    const decision = publishRelease(options);
    console.log(`Core publisher decision: ${decision.decision}`);
    return;
  }
  if (command === 'invariant') {
    const result = comparePackageCommits(parseInvariantArguments(args));
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  fail(
    'usage: core-release-authority.js <provision-npm|verify-npm|trusted-npm|trusted-npm-auth|check|prepare|smoke|guard|publish|invariant>',
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Core release authority rejected: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  AUDITED_NPM_VERSION,
  JSON_LIMITS,
  OFFICIAL_REGISTRY,
  PACKAGE_NAME,
  REPO_ROOT,
  STABLE_SEMVER_RE,
  TAR_LIMITS,
  TREE_LIMITS,
  TRUSTED_GIT,
  TRUSTED_NPM_ENVIRONMENT,
  TRUSTED_NPM_FILENAME,
  TRUSTED_NPM_INTEGRITY,
  TRUSTED_NPM_ENTRY_COUNT,
  TRUSTED_NPM_URL,
  assertNoInheritedNpmAuthority,
  assertIndexMatchesTree,
  assertNoProjectNpmConfig,
  assertOutsideRepository,
  batchReadBlobs,
  bindCurrentEvidence,
  buildEvidence,
  buildRegistryManifest,
  canonicalTempRoot,
  cleanGitEnvironment,
  cleanNpmEnvironment,
  commitDocument,
  createTokenUserConfig,
  comparePackageCommits,
  evaluateRegistryResult,
  extractSafeEcosystemFailureStage,
  expectedRegistryE404,
  downloadTrustedNpmBytes,
  guardCandidate,
  integrity,
  inspectAuthoritativeRelease,
  inspectTree,
  initializeIsolatedGateRepository,
  materializeTree,
  makePrivateTemp,
  packMaterializedSource,
  parseArtifactArguments,
  parseIndexEntries,
  parseInvariantArguments,
  parseTrustedNpmArguments,
  parseTarFiles,
  parseTreeEntries,
  publishCandidate,
  provisionTrustedNpmTarball,
  resolveTrustedNpmInvocation,
  runGit,
  runNpm,
  runTrustedNpmCommand,
  sha1,
  sha256,
  strictJson,
  validateEvidenceArtifact,
  validatePack,
  validateReleaseContext,
  validateReleaseEvidence,
  verifyTrustedNpmInvocation,
  verifyTrustedNpmTarball,
  writeGithubDecision,
};
