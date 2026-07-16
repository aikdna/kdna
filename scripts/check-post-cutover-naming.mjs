#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';
import { gunzipSync, inflateRawSync } from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import releaseAuthority from './core-release-authority.js';

const { TRUSTED_GIT, cleanGitEnvironment } = releaseAuthority;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const ALLOWLIST_PATH = path.join(SCRIPT_DIR, 'post-cutover-naming-allowlist.json');
const ALLOWLIST_RELATIVE_PATH = path.relative(ROOT, ALLOWLIST_PATH).split(path.sep).join('/');
const ALLOWLIST_AUTHORITY_DIGEST =
  '8aad12a135da7a50604870c1af7cd1c3f28805c07436ce9bae9253fd1580f28b';
const TOKEN_AUTHORITY_PATH = path.join(SCRIPT_DIR, 'post-cutover-token-authority.json');
const TOKEN_AUTHORITY_RELATIVE_PATH = path
  .relative(ROOT, TOKEN_AUTHORITY_PATH)
  .split(path.sep)
  .join('/');
const TOKEN_AUTHORITY_FILE_DIGEST =
  '3d810cd1c8cabe83e4b9d5ec0a2c74473d93b94968a332ac98ef0077022298b9';
const TOKEN_AUTHORITY_COUNT = 73;
const ARCHIVE_LIMITS = Object.freeze({
  archiveBytes: 25 * 1024 * 1024,
  entries: 256,
  entryBytes: 8 * 1024 * 1024,
  totalBytes: 32 * 1024 * 1024,
  ratio: 200,
});
const VERSION_PREFIX = String.fromCharCode(118);
const VERSION_PREFIX_UPPER = VERSION_PREFIX.toUpperCase();
const UTF8 = new TextDecoder('utf-8', { fatal: true });

function coordinateTailPattern() {
  return '[0-9]+(?:\\.[0-9]+){0,2}(?:(?:[rR][cC][0-9]*)(?:[-_][A-Za-z][A-Za-z0-9._-]*)?|[-_][A-Za-z][A-Za-z0-9._-]*)?';
}

function versionPattern() {
  return `${VERSION_PREFIX}${coordinateTailPattern()}`;
}

function candidateRules() {
  const coordinate = `[${VERSION_PREFIX}${VERSION_PREFIX_UPPER}]${coordinateTailPattern()}`;
  return [
    {
      name: 'owned-responsibility-generation',
      regex: new RegExp(
        `\\b(?:KDNA(?:\\s+Core)?|Core|Container|Capsule|Runtime|ConsumptionPlan|JudgmentTrace|Agent\\s+Host|Host|Trace|Schema|Payload|Envelope|Cluster|Assay|Studio)[\\s/_-]+${coordinate}(?![A-Za-z0-9])`,
        'giu',
      ),
    },
    {
      name: 'owned-release-prefix',
      regex: new RegExp(
        `\\b(?:kdna(?:-core|-eval)?|agent)-${VERSION_PREFIX}(?=(?:[0-9]|\\$|\\{))`,
        'gu',
      ),
    },
    {
      name: 'generation-route-coordinate',
      regex: /\/[vV][0-9]+\/[A-Za-z0-9][A-Za-z0-9._~-]*/gu,
    },
    {
      name: 'owned-identifier-generation',
      regex:
        /\b(?:[a-z][A-Za-z0-9_]*(?:Capsule|Plan|Host|Trace|Core|KDNA|Container|Profile|Schema|Payload|Envelope|Cluster|Runtime)V[0-9]+|[A-Z][A-Z0-9_]*_V[0-9]+)\b/gu,
    },
    {
      name: 'owned-infix-generation',
      regex:
        /\b(?:[A-Za-z_$][A-Za-z0-9_$]*V[0-9]+Layout|[A-Za-z_$][A-Za-z0-9_$]*FromV[0-9]+Payload)\b/gu,
    },
    {
      name: 'owned-suffix-generation',
      regex:
        /\b(?:KDNA|Core|Container|Capsule|Profile|Runtime|ConsumptionPlan|JudgmentTrace|AgentHost|Host|Trace|Schema|Payload|Envelope|Cluster|Assay|Studio)V[0-9]+\b/giu,
    },
  ];
}

function decodeText(bytes) {
  try {
    return UTF8.decode(bytes);
  } catch {
    return null;
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseTokenAuthority(bytes, expectedDigest = TOKEN_AUTHORITY_FILE_DIGEST) {
  const actualDigest = sha256(bytes);
  if (actualDigest !== expectedDigest) {
    throw new Error(`post-cutover token authority file digest mismatch: ${actualDigest}`);
  }
  const parsed = JSON.parse(UTF8.decode(bytes));
  const keys = Object.keys(parsed || {}).sort();
  const expectedKeys = [
    'count',
    'encoding',
    'repository',
    'schema',
    'schema_version',
    'token_set_sha256',
    'tokens',
  ];
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    throw new Error('post-cutover token authority fields are not exact');
  }
  if (
    parsed.schema !== 'kdna.post-cutover-token-authority' ||
    parsed.schema_version !== '0.1.0' ||
    parsed.repository !== 'open/kdna' ||
    parsed.encoding !== 'base64'
  ) {
    throw new Error('post-cutover token authority coordinate is invalid');
  }
  if (
    parsed.count !== TOKEN_AUTHORITY_COUNT ||
    !Array.isArray(parsed.tokens) ||
    parsed.tokens.length !== TOKEN_AUTHORITY_COUNT
  ) {
    throw new Error(`post-cutover token authority must contain ${TOKEN_AUTHORITY_COUNT} tokens`);
  }
  if (JSON.stringify([...parsed.tokens].sort()) !== JSON.stringify(parsed.tokens)) {
    throw new Error('post-cutover token authority tokens must be sorted');
  }
  const encodedDigest = sha256(Buffer.from(JSON.stringify(parsed.tokens)));
  if (parsed.token_set_sha256 !== encodedDigest) {
    throw new Error('post-cutover token authority token-set digest mismatch');
  }
  const decoded = parsed.tokens.map((encoded, index) => {
    if (typeof encoded !== 'string' || encoded.length === 0) {
      throw new Error(`post-cutover token authority token ${index} is invalid`);
    }
    const token = Buffer.from(encoded, 'base64');
    if (token.length === 0 || token.toString('base64') !== encoded) {
      throw new Error(`post-cutover token authority token ${index} is not canonical base64`);
    }
    return token;
  });
  if (new Set(decoded.map((token) => token.toString('hex'))).size !== TOKEN_AUTHORITY_COUNT) {
    throw new Error('post-cutover token authority tokens must be unique');
  }
  return decoded;
}

function loadTokenAuthority() {
  return parseTokenAuthority(fs.readFileSync(TOKEN_AUTHORITY_PATH));
}

function git(args) {
  return execFileSync(TRUSTED_GIT, ['--no-replace-objects', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: cleanGitEnvironment(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function gitBytes(args) {
  return execFileSync(TRUSTED_GIT, ['--no-replace-objects', ...args], {
    cwd: ROOT,
    encoding: 'buffer',
    env: cleanGitEnvironment(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function splitNulBytes(bytes) {
  const values = [];
  let start = 0;
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0) continue;
    if (index > start) values.push(Buffer.from(bytes.subarray(start, index)));
    start = index + 1;
  }
  if (start < bytes.length) values.push(Buffer.from(bytes.subarray(start)));
  return values;
}

function assertArchiveSize(bytes, label) {
  if (!Buffer.isBuffer(bytes) || bytes.length > ARCHIVE_LIMITS.archiveBytes) {
    throw new Error(`${label}: archive exceeds the ${ARCHIVE_LIMITS.archiveBytes}-byte limit`);
  }
}

function decodeArchivePath(bytes, label, { allowDirectory = false } = {}) {
  if (bytes.includes(0)) throw new Error(`${label}: archive path contains NUL`);
  let value;
  try {
    value = UTF8.decode(bytes);
  } catch {
    throw new Error(`${label}: archive path is not valid UTF-8`);
  }
  const candidate = allowDirectory && value.endsWith('/') ? value.slice(0, -1) : value;
  if (
    candidate === '' ||
    value.includes('\\') ||
    path.posix.isAbsolute(candidate) ||
    /^[A-Za-z]:/u.test(candidate) ||
    candidate.split('/').some((part) => part === '' || part === '.' || part === '..') ||
    path.posix.normalize(candidate) !== candidate
  ) {
    throw new Error(`${label}: unsafe archive path: ${JSON.stringify(value)}`);
  }
  return value;
}

const CRC32_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function findZipEnd(bytes, label) {
  const minimum = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (bytes.readUInt32LE(offset) !== 0x06054b50) continue;
    const commentLength = bytes.readUInt16LE(offset + 20);
    if (offset + 22 + commentLength === bytes.length) return offset;
  }
  throw new Error(`${label}: ZIP end-of-central-directory record is missing`);
}

function safeZipEntries(bytes, label = 'KDNA archive') {
  assertArchiveSize(bytes, label);
  if (bytes.length < 22) throw new Error(`${label}: ZIP archive is truncated`);
  const endOffset = findZipEnd(bytes, label);
  const disk = bytes.readUInt16LE(endOffset + 4);
  const centralDisk = bytes.readUInt16LE(endOffset + 6);
  const diskEntries = bytes.readUInt16LE(endOffset + 8);
  const entryCount = bytes.readUInt16LE(endOffset + 10);
  const centralSize = bytes.readUInt32LE(endOffset + 12);
  const centralOffset = bytes.readUInt32LE(endOffset + 16);
  if (
    disk !== 0 ||
    centralDisk !== 0 ||
    diskEntries !== entryCount ||
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  ) {
    throw new Error(`${label}: multi-disk and ZIP64 archives are not supported`);
  }
  if (entryCount > ARCHIVE_LIMITS.entries) {
    throw new Error(`${label}: ZIP entry count exceeds ${ARCHIVE_LIMITS.entries}`);
  }
  if (centralOffset + centralSize !== endOffset) {
    throw new Error(`${label}: ZIP central directory bounds are invalid`);
  }

  const metadata = [];
  const names = new Set();
  let cursor = centralOffset;
  let totalBytes = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > endOffset || bytes.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error(`${label}: ZIP central directory entry ${index} is invalid`);
    }
    const madeBy = bytes.readUInt16LE(cursor + 4);
    const flags = bytes.readUInt16LE(cursor + 8);
    const method = bytes.readUInt16LE(cursor + 10);
    const expectedCrc = bytes.readUInt32LE(cursor + 16);
    const compressedSize = bytes.readUInt32LE(cursor + 20);
    const uncompressedSize = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const startDisk = bytes.readUInt16LE(cursor + 34);
    const externalAttributes = bytes.readUInt32LE(cursor + 38);
    const localOffset = bytes.readUInt32LE(cursor + 42);
    const end = cursor + 46 + nameLength + extraLength + commentLength;
    if (end > endOffset) throw new Error(`${label}: ZIP central directory entry is truncated`);
    if ((flags & ~0x0800) !== 0 || ![0, 8].includes(method) || startDisk !== 0) {
      throw new Error(`${label}: ZIP entry ${index} uses unsupported flags, method, or disk`);
    }
    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    const name = decodeArchivePath(nameBytes, label);
    if (name.endsWith('/') || names.has(name)) {
      throw new Error(`${label}: ZIP entry path is a directory or duplicate: ${name}`);
    }
    names.add(name);
    const platform = madeBy >>> 8;
    const unixType = (externalAttributes >>> 16) & 0o170000;
    if (
      (platform === 3 && unixType !== 0 && unixType !== 0o100000) ||
      (externalAttributes & 0x10) !== 0
    ) {
      throw new Error(`${label}: ZIP entry is not a regular file: ${name}`);
    }
    if (
      compressedSize > ARCHIVE_LIMITS.entryBytes ||
      uncompressedSize > ARCHIVE_LIMITS.entryBytes ||
      (uncompressedSize > 0 && compressedSize === 0) ||
      (compressedSize > 0 && uncompressedSize / compressedSize > ARCHIVE_LIMITS.ratio)
    ) {
      throw new Error(`${label}: ZIP entry exceeds size or compression-ratio limits: ${name}`);
    }
    totalBytes += uncompressedSize;
    if (totalBytes > ARCHIVE_LIMITS.totalBytes) {
      throw new Error(`${label}: ZIP expanded size exceeds ${ARCHIVE_LIMITS.totalBytes}`);
    }
    metadata.push({
      name,
      nameBytes,
      flags,
      method,
      expectedCrc,
      compressedSize,
      uncompressedSize,
      localOffset,
    });
    cursor = end;
  }
  if (cursor !== endOffset) throw new Error(`${label}: ZIP central directory has trailing bytes`);

  const ranges = [];
  const entries = [];
  for (const entry of metadata) {
    const { localOffset } = entry;
    if (localOffset + 30 > centralOffset || bytes.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`${label}: ZIP local header is invalid for ${entry.name}`);
    }
    const flags = bytes.readUInt16LE(localOffset + 6);
    const method = bytes.readUInt16LE(localOffset + 8);
    const expectedCrc = bytes.readUInt32LE(localOffset + 14);
    const compressedSize = bytes.readUInt32LE(localOffset + 18);
    const uncompressedSize = bytes.readUInt32LE(localOffset + 22);
    const nameLength = bytes.readUInt16LE(localOffset + 26);
    const extraLength = bytes.readUInt16LE(localOffset + 28);
    const nameStart = localOffset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (
      flags !== entry.flags ||
      method !== entry.method ||
      expectedCrc !== entry.expectedCrc ||
      compressedSize !== entry.compressedSize ||
      uncompressedSize !== entry.uncompressedSize ||
      dataEnd > centralOffset ||
      !bytes.subarray(nameStart, nameStart + nameLength).equals(entry.nameBytes)
    ) {
      throw new Error(`${label}: ZIP local and central metadata disagree for ${entry.name}`);
    }
    const compressed = bytes.subarray(dataStart, dataEnd);
    let content;
    try {
      content =
        method === 0
          ? Buffer.from(compressed)
          : inflateRawSync(compressed, { maxOutputLength: ARCHIVE_LIMITS.entryBytes + 1 });
    } catch (error) {
      throw new Error(
        `${label}: ZIP entry cannot be decompressed: ${entry.name}: ${error.message}`,
      );
    }
    if (content.length !== uncompressedSize || crc32(content) !== expectedCrc) {
      throw new Error(`${label}: ZIP entry integrity failed: ${entry.name}`);
    }
    ranges.push([localOffset, dataEnd, entry.name]);
    entries.push({ name: entry.name, bytes: content, method });
  }
  ranges.sort((left, right) => left[0] - right[0]);
  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index][0] < ranges[index - 1][1]) {
      throw new Error(
        `${label}: ZIP entries overlap: ${ranges[index - 1][2]} and ${ranges[index][2]}`,
      );
    }
  }
  return entries;
}

function parseTarOctal(bytes, label) {
  const text = bytes.toString('ascii').replace(/\0.*$/u, '').trim();
  if (text === '') return 0;
  if (!/^[0-7]+$/u.test(text)) throw new Error(`${label}: tar numeric field is invalid`);
  return Number.parseInt(text, 8);
}

function decodeTarPathField(bytes, label) {
  const nul = bytes.indexOf(0);
  const end = nul === -1 ? bytes.length : nul;
  if (nul !== -1 && bytes.subarray(nul).some((byte) => byte !== 0)) {
    throw new Error(`${label}: tar path field has data after NUL`);
  }
  try {
    return UTF8.decode(bytes.subarray(0, end));
  } catch {
    throw new Error(`${label}: tar path is not valid UTF-8`);
  }
}

function safeNpmTarballEntries(bytes, label = 'npm package') {
  assertArchiveSize(bytes, label);
  let tar;
  try {
    tar = gunzipSync(bytes, { maxOutputLength: ARCHIVE_LIMITS.totalBytes + 1 });
  } catch (error) {
    throw new Error(`${label}: tarball cannot be decompressed: ${error.message}`);
  }
  if (
    tar.length > ARCHIVE_LIMITS.totalBytes ||
    (bytes.length > 0 && tar.length / bytes.length > ARCHIVE_LIMITS.ratio)
  ) {
    throw new Error(`${label}: tarball exceeds expanded-size or compression-ratio limits`);
  }
  const entries = [];
  const names = new Set();
  let offset = 0;
  let totalBytes = 0;
  let headerCount = 0;
  let zeroBlocks = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      zeroBlocks += 1;
      offset += 512;
      if (zeroBlocks === 2) break;
      continue;
    }
    zeroBlocks = 0;
    headerCount += 1;
    if (headerCount > ARCHIVE_LIMITS.entries) {
      throw new Error(`${label}: tar entry count exceeds ${ARCHIVE_LIMITS.entries}`);
    }
    const storedChecksum = parseTarOctal(header.subarray(148, 156), label);
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    const actualChecksum = checksumHeader.reduce((sum, byte) => sum + byte, 0);
    if (storedChecksum !== actualChecksum) throw new Error(`${label}: tar header checksum failed`);
    const size = parseTarOctal(header.subarray(124, 136), label);
    const type = header[156];
    const namePart = decodeTarPathField(header.subarray(0, 100), label);
    const prefix = decodeTarPathField(header.subarray(345, 500), label);
    const name = decodeArchivePath(
      Buffer.from(prefix ? `${prefix}/${namePart}` : namePart),
      label,
      { allowDirectory: type === 53 },
    );
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    const next = dataStart + Math.ceil(size / 512) * 512;
    if (size > ARCHIVE_LIMITS.entryBytes || dataEnd > tar.length || next > tar.length) {
      throw new Error(`${label}: tar entry is truncated or too large: ${name}`);
    }
    if (type === 53) {
      if (!name.endsWith('/')) throw new Error(`${label}: malformed tar directory: ${name}`);
    } else {
      if (type !== 0 && type !== 48)
        throw new Error(`${label}: tar entry is not a regular file: ${name}`);
      if (!name.startsWith('package/'))
        throw new Error(`${label}: tar entry is outside package/: ${name}`);
      if (names.has(name)) throw new Error(`${label}: duplicate tar entry: ${name}`);
      names.add(name);
      totalBytes += size;
      if (totalBytes > ARCHIVE_LIMITS.totalBytes) {
        throw new Error(`${label}: tar expanded size exceeds ${ARCHIVE_LIMITS.totalBytes}`);
      }
      entries.push({ name, bytes: Buffer.from(tar.subarray(dataStart, dataEnd)) });
    }
    offset = next;
  }
  if (zeroBlocks < 2 || tar.subarray(offset).some((byte) => byte !== 0)) {
    throw new Error(`${label}: tarball terminator or trailing padding is invalid`);
  }
  return entries;
}

function discoverPackageRoots() {
  return git(['ls-files', '-z', ':(glob)**/package.json'])
    .split('\0')
    .filter(Boolean)
    .filter((packagePath) => packagePath !== 'package.json')
    .filter((packagePath) => {
      const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, packagePath), 'utf8'));
      return (
        manifest.private !== true &&
        typeof manifest.name === 'string' &&
        typeof manifest.version === 'string'
      );
    })
    .map((packagePath) => path.posix.dirname(packagePath))
    .sort();
}

function trackedRecords() {
  return splitNulBytes(gitBytes(['ls-files', '-z', '--cached', '--others', '--exclude-standard']))
    .map((relativePathBytes) => ({
      relativePathBytes,
      absolutePath: Buffer.concat([Buffer.from(ROOT), Buffer.from(path.sep), relativePathBytes]),
    }))
    .filter(({ absolutePath }) => fs.existsSync(absolutePath))
    .map(({ relativePathBytes, absolutePath }) => {
      const stats = fs.lstatSync(absolutePath);
      const relativePath = decodeText(relativePathBytes);
      if (relativePath === null) {
        throw new Error(
          `tracked naming path is not valid UTF-8: ${relativePathBytes.toString('hex')}`,
        );
      }
      if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new Error(`tracked naming surface is not a regular file: ${relativePath}`);
      }
      const bytes = fs.readFileSync(absolutePath);
      return {
        path: relativePath,
        pathBytes: relativePathBytes,
        surface: 'tracked',
        bytes,
      };
    });
}

function runPack(packageRoot, destination, dryRun) {
  const args = ['pack', '--json', '--ignore-scripts'];
  if (dryRun) args.push('--dry-run');
  else args.push('--pack-destination', destination);
  const output = execFileSync('npm', args, {
    cwd: path.join(ROOT, packageRoot),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const reports = JSON.parse(output);
  if (!Array.isArray(reports) || reports.length !== 1 || !Array.isArray(reports[0].files)) {
    throw new Error(`${packageRoot}: npm pack did not return one structured file report`);
  }
  return reports[0];
}

function dryRunPackRecords(packageRoot, report) {
  return report.files.map(({ path: packedPath }) => {
    const sourcePath = path.posix.join(packageRoot, packedPath);
    const source = path.join(ROOT, sourcePath);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
      throw new Error(`${packageRoot}: dry-run pack path has no source file: ${packedPath}`);
    }
    return {
      path: sourcePath,
      surface: 'pack-dry-run',
      bytes: fs.readFileSync(source),
    };
  });
}

function actualPackRecords(packageRoot, destination, report) {
  const tarball = path.join(destination, report.filename);
  if (!fs.existsSync(tarball)) {
    throw new Error(`${packageRoot}: npm pack tarball is missing: ${report.filename}`);
  }
  const archiveEntries = safeNpmTarballEntries(
    fs.readFileSync(tarball),
    `${packageRoot}/${report.filename}`,
  );
  const byPath = new Map(archiveEntries.map((entry) => [entry.name, entry.bytes]));
  const expected = report.files.map(({ path: packedPath }) => `package/${packedPath}`).sort();
  const actual = [...byPath.keys()].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${packageRoot}: npm report and tarball file surfaces disagree`);
  }
  return report.files.map(({ path: packedPath }) => {
    return {
      path: path.posix.join(packageRoot, packedPath),
      surface: 'packed-tarball',
      bytes: byPath.get(`package/${packedPath}`),
    };
  });
}

function packageRecords() {
  const records = [];
  for (const packageRoot of discoverPackageRoots()) {
    const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-naming-pack-'));
    try {
      const dryRun = runPack(packageRoot, destination, true);
      records.push(...dryRunPackRecords(packageRoot, dryRun));
      const actual = runPack(packageRoot, destination, false);
      records.push(...actualPackRecords(packageRoot, destination, actual));
    } finally {
      fs.rmSync(destination, { recursive: true, force: true });
    }
  }
  return records;
}

function parseAllowlist(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('naming allowlist must be an object');
  }
  const manifestKeys = Object.keys(parsed).sort();
  if (JSON.stringify(manifestKeys) !== JSON.stringify(['exceptions', 'schema', 'schema_version'])) {
    throw new Error('naming allowlist manifest fields are not exact');
  }
  if (parsed.schema !== 'kdna.post-cutover-naming-allowlist' || parsed.schema_version !== '0.1.0') {
    throw new Error('naming allowlist schema coordinate is invalid');
  }
  if (!Array.isArray(parsed.exceptions)) {
    throw new Error('naming allowlist exceptions must be an array');
  }
  const seen = new Set();
  for (const [index, entry] of parsed.exceptions.entries()) {
    const keys = Object.keys(entry || {}).sort();
    if (JSON.stringify(keys) !== JSON.stringify(['owner', 'path', 'reason', 'token'])) {
      throw new Error(`allowlist entry ${index} fields are not exact`);
    }
    for (const key of keys) {
      if (typeof entry[key] !== 'string' || entry[key].trim() !== entry[key] || entry[key] === '') {
        throw new Error(`allowlist entry ${index} ${key} must be a non-empty trimmed string`);
      }
    }
    if (entry.reason.length < 16) {
      throw new Error(`allowlist entry ${index} reason is not specific enough`);
    }
    if (!/third-party/iu.test(entry.reason)) {
      throw new Error(`allowlist entry ${index} reason must identify a third-party coordinate`);
    }
    if (/\b(?:AI)?KDNA\b/iu.test(entry.owner)) {
      throw new Error(`allowlist entry ${index} cannot be owned by KDNA`);
    }
    if (path.isAbsolute(entry.path) || entry.path.split('/').includes('..')) {
      throw new Error(`allowlist entry ${index} path must be repository-relative`);
    }
    const identity = `${entry.path}\0${entry.token}`;
    if (seen.has(identity)) throw new Error(`duplicate allowlist entry for ${entry.path}`);
    seen.add(identity);
  }
  assertAllowlistAuthority(parsed.exceptions, ALLOWLIST_AUTHORITY_DIGEST);
  return parsed.exceptions;
}

function allowlistAuthorityDigest(exceptions) {
  const tuples = exceptions
    .map(({ path: entryPath, token, owner, reason }) => [entryPath, token, owner, reason])
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return createHash('sha256').update(JSON.stringify(tuples)).digest('hex');
}

function assertAllowlistAuthority(exceptions, expectedDigest) {
  const authorityDigest = allowlistAuthorityDigest(exceptions);
  if (authorityDigest !== expectedDigest) {
    throw new Error(`naming allowlist authority digest mismatch: ${authorityDigest}`);
  }
}

function matchingSpans(text, token) {
  const spans = [];
  let start = 0;
  while (start <= text.length) {
    const index = text.indexOf(token, start);
    if (index === -1) break;
    spans.push([index, index + token.length]);
    start = index + token.length;
  }
  return spans;
}

function normalizeRecord(record) {
  const bytes = Buffer.isBuffer(record.bytes)
    ? record.bytes
    : Buffer.from(typeof record.text === 'string' ? record.text : '', 'utf8');
  return {
    ...record,
    bytes,
    pathBytes: Buffer.isBuffer(record.pathBytes)
      ? record.pathBytes
      : Buffer.from(record.path, 'utf8'),
    text: typeof record.text === 'string' ? record.text : decodeText(bytes),
    rawText: bytes.toString('latin1'),
    rawPathText: (record.pathBytes || Buffer.from(record.path, 'utf8')).toString('latin1'),
  };
}

function hasKdnaSuffix(pathBytes) {
  if (pathBytes.length < 5) return false;
  const suffix = Buffer.from(pathBytes.subarray(pathBytes.length - 5));
  for (let index = 0; index < suffix.length; index += 1) {
    if (suffix[index] >= 0x41 && suffix[index] <= 0x5a) suffix[index] += 0x20;
  }
  return suffix.equals(Buffer.from('.kdna'));
}

function expandArchiveRecords(records) {
  const expanded = [];
  for (const input of records) {
    const record = normalizeRecord(input);
    expanded.push(record);
    if (!hasKdnaSuffix(record.pathBytes)) continue;
    for (const entry of safeZipEntries(record.bytes, record.path)) {
      expanded.push(
        normalizeRecord({
          path: `${record.path}!/${entry.name}`,
          pathBytes: Buffer.concat([
            record.pathBytes,
            Buffer.from('!/', 'utf8'),
            Buffer.from(entry.name, 'utf8'),
          ]),
          surface: `${record.surface}-kdna-entry`,
          bytes: entry.bytes,
        }),
      );
    }
  }
  return expanded;
}

function bufferMatches(bytes, token) {
  const offsets = [];
  let offset = 0;
  while (offset <= bytes.length - token.length) {
    const index = bytes.indexOf(token, offset);
    if (index === -1) break;
    offsets.push(index);
    offset = index + Math.max(1, token.length);
  }
  return offsets;
}

function allowedSpans(record, allowlist) {
  const pathEntries = allowlist.filter((entry) => entry.path === record.path);
  return {
    path: pathEntries.flatMap((entry) => matchingSpans(record.rawPathText, entry.token)),
    text: pathEntries.flatMap((entry) => matchingSpans(record.rawText, entry.token)),
  };
}

function spanIsAllowed(spans, start, end) {
  return spans.some(([allowedStart, allowedEnd]) => start >= allowedStart && end <= allowedEnd);
}

function lineAt(text, index) {
  const before = text.slice(0, index);
  return before.split('\n').length;
}

function collectCandidates(value, rules = candidateRules()) {
  const findings = [];
  for (const rule of rules) {
    rule.regex.lastIndex = 0;
    for (const match of value.matchAll(rule.regex)) {
      findings.push({
        rule: rule.name,
        token: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }
  return findings;
}

function validateAllowlist(allowlist, records) {
  const rules = candidateRules();
  for (const entry of allowlist) {
    if ([ALLOWLIST_RELATIVE_PATH, TOKEN_AUTHORITY_RELATIVE_PATH].includes(entry.path)) {
      throw new Error('allowlist cannot contain a self exception for an authority file');
    }
    const matchingRecords = records
      .map((record) => normalizeRecord(record))
      .filter((record) => record.path === entry.path);
    if (matchingRecords.length !== 1) {
      throw new Error(`allowlist path must name one tracked file: ${entry.path}`);
    }
    const record = matchingRecords[0];
    const combined = `${record.path}\n${record.rawText}`;
    if (!combined.includes(entry.token)) {
      throw new Error(`allowlist token is stale at ${entry.path}: ${entry.token}`);
    }
    const tokenCandidates = collectCandidates(entry.token, rules);
    if (tokenCandidates.length === 0) {
      throw new Error(`allowlist token does not contain a gated candidate: ${entry.path}`);
    }
  }
}

function scanRecords(records, allowlist, authorityTokens = loadTokenAuthority()) {
  const violations = [];
  const rules = candidateRules();
  for (const record of expandArchiveRecords(records)) {
    const allowed = allowedSpans(record, allowlist);
    for (const tokenBytes of authorityTokens) {
      const token = tokenBytes.toString('utf8');
      for (const start of bufferMatches(record.pathBytes, tokenBytes)) {
        violations.push({
          rule: 'authority-exact-old-token',
          token,
          start,
          end: start + tokenBytes.length,
          path: record.path,
          line: null,
          surface: record.surface,
        });
      }
      for (const start of bufferMatches(record.bytes, tokenBytes)) {
        violations.push({
          rule: 'authority-exact-old-token',
          token,
          start,
          end: start + tokenBytes.length,
          path: record.path,
          line: null,
          surface: record.surface,
        });
      }
    }
    // The allowlist is full-tuple hash-bound before scanning. Its exact
    // third-party tokens necessarily contain candidates, so do not make the
    // authority file require a circular exception for itself.
    const scanCandidateRules = record.path !== ALLOWLIST_RELATIVE_PATH;
    for (const finding of scanCandidateRules ? collectCandidates(record.rawPathText, rules) : []) {
      if (!spanIsAllowed(allowed.path, finding.start, finding.end)) {
        violations.push({ ...finding, path: record.path, line: null, surface: record.surface });
      }
    }
    for (const finding of scanCandidateRules ? collectCandidates(record.rawText, rules) : []) {
      if (!spanIsAllowed(allowed.text, finding.start, finding.end)) {
        violations.push({
          ...finding,
          path: record.path,
          line: lineAt(record.rawText, finding.start),
          surface: record.surface,
        });
      }
    }
  }
  return violations;
}

function deduplicateViolations(violations) {
  const grouped = new Map();
  for (const violation of violations) {
    const key = [violation.path, violation.line, violation.rule, violation.token].join('\0');
    const existing = grouped.get(key);
    if (existing) existing.surfaces.add(violation.surface);
    else grouped.set(key, { ...violation, surfaces: new Set([violation.surface]) });
  }
  return [...grouped.values()]
    .map((violation) => ({ ...violation, surfaces: [...violation.surfaces].sort() }))
    .sort(
      (left, right) =>
        left.path.localeCompare(right.path) ||
        (left.line || 0) - (right.line || 0) ||
        left.rule.localeCompare(right.rule),
    );
}

function main() {
  const tracked = trackedRecords();
  const allowlist = parseAllowlist(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
  const authorityTokens = loadTokenAuthority();
  validateAllowlist(allowlist, tracked);
  const packed = packageRecords();
  const violations = deduplicateViolations(
    scanRecords([...tracked, ...packed], allowlist, authorityTokens),
  );
  if (violations.length > 0) {
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify({ violations }, null, 2));
      process.exitCode = 1;
      return;
    }
    console.error(`Post-cutover naming audit found ${violations.length} violation(s):`);
    for (const violation of violations) {
      const location =
        violation.line === null ? violation.path : `${violation.path}:${violation.line}`;
      console.error(
        `  ${location} [${violation.rule}; ${violation.surfaces.join(', ')}] ${JSON.stringify(violation.token)}`,
      );
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `Post-cutover naming audit passed: ${tracked.length} tracked files, ${packed.length / 2} files across dry-run and actual package surfaces, ${authorityTokens.length} hash-bound retired tokens, ${allowlist.length} exact third-party exceptions.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export {
  allowlistAuthorityDigest,
  assertAllowlistAuthority,
  collectCandidates,
  deduplicateViolations,
  discoverPackageRoots,
  expandArchiveRecords,
  parseAllowlist,
  parseTokenAuthority,
  safeNpmTarballEntries,
  safeZipEntries,
  scanRecords,
  validateAllowlist,
  versionPattern,
};
