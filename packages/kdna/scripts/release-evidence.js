'use strict';

const crypto = require('node:crypto');
const path = require('node:path');
const zlib = require('node:zlib');
const { COMMIT_RE, EXPECTED_PACKAGE_NAME, STABLE_VERSION_RE } = require('./release-policy');

const EXPECTED_FILES = Object.freeze([
  'bin/kdna-lint.js',
  'bin/kdna-validate.js',
  'bin/kdna.js',
  'CHANGELOG.md',
  'package.json',
  'README.md',
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exactKeys(value, expected, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  assert(JSON.stringify(actual) === JSON.stringify(wanted), `${label} fields are not exact`);
}

function isCanonicalSha512Integrity(value) {
  if (typeof value !== 'string' || !/^sha512-[A-Za-z0-9+/]{86}==$/u.test(value)) return false;
  const encoded = value.slice('sha512-'.length);
  const digest = Buffer.from(encoded, 'base64');
  return digest.length === 64 && digest.toString('base64') === encoded;
}

function parseJsonDocument(text, label) {
  assert(typeof text === 'string' && text.trim().length > 0, `${label} must not be empty`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} must be one complete JSON document`);
  }
}

function parseTarNumber(field) {
  if (field[0] & 0x80) {
    const bytes = Buffer.from(field);
    bytes[0] &= 0x7f;
    let value = 0n;
    for (const byte of bytes) value = value * 256n + BigInt(byte);
    assert(value <= BigInt(Number.MAX_SAFE_INTEGER), 'tar entry size exceeds the safe range');
    return Number(value);
  }
  const text = field.toString('ascii').replace(/\0.*$/u, '').trim();
  assert(/^[0-7]*$/u.test(text), 'tar header contains an invalid numeric field');
  return text === '' ? 0 : Number.parseInt(text, 8);
}

function parsePax(buffer) {
  const values = {};
  let offset = 0;
  while (offset < buffer.length) {
    const space = buffer.indexOf(0x20, offset);
    assert(space > offset, 'invalid PAX record length');
    const lengthText = buffer.subarray(offset, space).toString('ascii');
    assert(/^[1-9]\d*$/u.test(lengthText), 'invalid PAX record length');
    const length = Number(lengthText);
    assert(Number.isSafeInteger(length) && offset + length <= buffer.length, 'truncated PAX record');
    const record = buffer.subarray(space + 1, offset + length - 1).toString('utf8');
    assert(buffer[offset + length - 1] === 0x0a, 'PAX record must end with a newline');
    const equals = record.indexOf('=');
    assert(equals > 0, 'invalid PAX record');
    values[record.slice(0, equals)] = record.slice(equals + 1);
    offset += length;
  }
  return values;
}

function parseTarFiles(tarball) {
  let archive;
  try {
    archive = zlib.gunzipSync(tarball);
  } catch {
    throw new Error('release artifact must be one valid gzip stream');
  }
  const files = [];
  let offset = 0;
  let pax = {};
  let longName = null;
  let zeroBlocks = 0;

  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      zeroBlocks += 1;
      offset += 512;
      if (zeroBlocks === 2) break;
      continue;
    }
    assert(zeroBlocks === 0, 'tar archive contains data after its terminator began');

    const storedChecksum = parseTarNumber(header.subarray(148, 156));
    let computedChecksum = 0;
    for (let index = 0; index < header.length; index += 1) {
      computedChecksum += index >= 148 && index < 156 ? 0x20 : header[index];
    }
    assert(storedChecksum === computedChecksum, 'tar header checksum mismatch');

    const size = parseTarNumber(header.subarray(124, 136));
    const type = String.fromCharCode(header[156] || 0x30);
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/u, '');
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/u, '');
    const headerName = prefix ? `${prefix}/${name}` : name;
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    assert(dataEnd <= archive.length, 'truncated tar entry');
    const data = archive.subarray(dataStart, dataEnd);

    if (type === 'x') {
      pax = parsePax(data);
    } else if (type === 'L') {
      longName = data.toString('utf8').replace(/\0.*$/u, '');
    } else {
      const effectiveName = pax.path || longName || headerName;
      const effectiveSize = pax.size === undefined ? size : Number(pax.size);
      assert(Number.isSafeInteger(effectiveSize) && effectiveSize >= 0, 'invalid PAX file size');
      assert(type === '0' || type === '\0', `unsupported tar entry type ${JSON.stringify(type)}`);
      assert(effectiveName.startsWith('package/'), 'packed file must be rooted under package/');
      const packagePath = effectiveName.slice('package/'.length);
      assert(
        packagePath &&
          !packagePath.startsWith('/') &&
          !packagePath.split('/').some((segment) => segment === '..' || segment === ''),
        'unsafe packed path',
      );
      files.push({ path: packagePath, size: effectiveSize });
      pax = {};
      longName = null;
    }

    offset = dataStart + Math.ceil(size / 512) * 512;
  }

  assert(zeroBlocks === 2, 'tar archive is missing its two-block terminator');
  assert(
    archive.subarray(offset).every((byte) => byte === 0),
    'tar archive contains non-zero trailing bytes',
  );
  assert(Object.keys(pax).length === 0 && longName === null, 'dangling tar metadata entry');
  files.sort((left, right) => left.path.localeCompare(right.path));
  const unique = new Set(files.map((file) => file.path));
  assert(unique.size === files.length, 'tar archive contains duplicate file paths');
  assert(
    JSON.stringify(files.map((file) => file.path)) === JSON.stringify(EXPECTED_FILES),
    'compatibility tarball file allowlist mismatch',
  );
  return files;
}

function validatePackReport({ reportText, tarball, pkg, source }) {
  assert(pkg.name === EXPECTED_PACKAGE_NAME, `package name must be ${EXPECTED_PACKAGE_NAME}`);
  assert(STABLE_VERSION_RE.test(pkg.version), 'package version must be stable canonical SemVer');
  assert(
    source.ref === `refs/tags/compat/${pkg.version}`,
    'source ref must be the canonical compatibility version tag',
  );
  assert(COMMIT_RE.test(source.commit || ''), 'source commit must be 40-character lowercase hex');

  const reports = parseJsonDocument(reportText, 'npm pack output');
  assert(Array.isArray(reports) && reports.length === 1, 'npm pack must report exactly one artifact');
  const report = reports[0];
  assert(report && typeof report === 'object' && !Array.isArray(report), 'npm pack report is invalid');
  assert(report.name === pkg.name && report.version === pkg.version, 'npm pack identity mismatch');
  assert(
    typeof report.filename === 'string' && path.basename(report.filename) === report.filename,
    'unsafe pack filename',
  );
  assert(Buffer.isBuffer(tarball) && tarball.length > 0, 'packed tarball is empty');

  const shasum = crypto.createHash('sha1').update(tarball).digest('hex');
  const integrity = `sha512-${crypto.createHash('sha512').update(tarball).digest('base64')}`;
  assert(report.shasum === shasum, 'npm pack shasum does not match the tarball bytes');
  assert(report.integrity === integrity, 'npm pack integrity does not match the tarball bytes');
  assert(report.size === tarball.length, 'npm pack size does not match the tarball bytes');

  const files = parseTarFiles(tarball);
  const reportedFiles = Array.isArray(report.files)
    ? report.files
        .map((file) => ({ path: file.path, size: file.size }))
        .sort((left, right) => left.path.localeCompare(right.path))
    : null;
  assert(reportedFiles !== null, 'npm pack must report its files');
  assert(
    JSON.stringify(reportedFiles) === JSON.stringify(files),
    'npm pack file report does not match the tarball',
  );
  const unpackedSize = files.reduce((total, file) => total + file.size, 0);
  assert(report.entryCount === files.length, 'npm pack entry count does not match the tarball');
  assert(report.unpackedSize === unpackedSize, 'npm pack unpacked size does not match the tarball');

  return Object.freeze({
    schema: 'kdna.compat.release-evidence',
    version: '1.0',
    source: { ref: source.ref, commit: source.commit },
    package: { name: pkg.name, version: pkg.version },
    artifact: {
      filename: report.filename,
      integrity,
      shasum,
      packed_size: tarball.length,
      unpacked_size: unpackedSize,
      file_count: files.length,
      files,
    },
  });
}

function validateReleaseEvidence(evidence) {
  assert(
    evidence && typeof evidence === 'object' && !Array.isArray(evidence),
    'release evidence must be an object',
  );
  assert(
    evidence.schema === 'kdna.compat.release-evidence' && evidence.version === '1.0',
    'release evidence schema mismatch',
  );
  exactKeys(evidence, ['schema', 'version', 'source', 'package', 'artifact'], 'release evidence');
  exactKeys(evidence.source, ['ref', 'commit'], 'release evidence source');
  exactKeys(evidence.package, ['name', 'version'], 'release evidence package');
  assert(
    evidence.package && evidence.package.name === EXPECTED_PACKAGE_NAME,
    'release evidence package mismatch',
  );
  assert(
    STABLE_VERSION_RE.test(evidence.package.version || ''),
    'release evidence version is invalid',
  );
  assert(
    evidence.source &&
      evidence.source.ref === `refs/tags/compat/${evidence.package.version}`,
    'release evidence ref mismatch',
  );
  assert(COMMIT_RE.test(evidence.source.commit || ''), 'release evidence commit is invalid');
  const artifact = evidence.artifact;
  exactKeys(
    artifact,
    [
      'filename',
      'integrity',
      'shasum',
      'packed_size',
      'unpacked_size',
      'file_count',
      'files',
    ],
    'release evidence artifact',
  );
  assert(
    artifact.filename === `aikdna-kdna-${evidence.package.version}.tgz`,
    'release evidence filename mismatch',
  );
  assert(
    artifact && isCanonicalSha512Integrity(artifact.integrity),
    'release evidence integrity is invalid',
  );
  assert(/^[0-9a-f]{40}$/u.test(artifact.shasum || ''), 'release evidence shasum is invalid');
  assert(
    Number.isSafeInteger(artifact.packed_size) && artifact.packed_size > 0,
    'release evidence packed size is invalid',
  );
  assert(
    Number.isSafeInteger(artifact.unpacked_size) && artifact.unpacked_size > 0,
    'release evidence unpacked size is invalid',
  );
  assert(
    Number.isSafeInteger(artifact.file_count) && artifact.file_count === EXPECTED_FILES.length,
    'release evidence file count is invalid',
  );
  assert(
    Array.isArray(artifact.files) && artifact.files.length === artifact.file_count,
    'release evidence files mismatch',
  );
  const files = artifact.files.map((file) => {
    exactKeys(file, ['path', 'size'], 'release evidence file');
    assert(typeof file.path === 'string', 'release evidence file path is invalid');
    assert(
      Number.isSafeInteger(file.size) && file.size >= 0,
      'release evidence file size is invalid',
    );
    return { path: file.path, size: file.size };
  });
  assert(
    JSON.stringify(files.map((file) => file.path)) === JSON.stringify(EXPECTED_FILES),
    'release evidence file allowlist mismatch',
  );
  assert(
    files.reduce((total, file) => total + file.size, 0) === artifact.unpacked_size,
    'release evidence unpacked size does not match its files',
  );
  return evidence;
}

function validateEvidenceArtifact(rawEvidence, tarball) {
  const evidence = validateReleaseEvidence(rawEvidence);
  assert(Buffer.isBuffer(tarball) && tarball.length > 0, 'verified release artifact is empty');
  const shasum = crypto.createHash('sha1').update(tarball).digest('hex');
  const integrity = `sha512-${crypto.createHash('sha512').update(tarball).digest('base64')}`;
  assert(tarball.length === evidence.artifact.packed_size, 'verified artifact packed size mismatch');
  assert(shasum === evidence.artifact.shasum, 'verified artifact shasum mismatch');
  assert(integrity === evidence.artifact.integrity, 'verified artifact integrity mismatch');
  const files = parseTarFiles(tarball);
  assert(
    JSON.stringify(files) === JSON.stringify(evidence.artifact.files),
    'verified artifact files mismatch',
  );
  assert(files.length === evidence.artifact.file_count, 'verified artifact file count mismatch');
  const unpackedSize = files.reduce((total, file) => total + file.size, 0);
  assert(
    unpackedSize === evidence.artifact.unpacked_size,
    'verified artifact unpacked size mismatch',
  );
  return evidence;
}

module.exports = {
  EXPECTED_FILES,
  parseJsonDocument,
  parseTarFiles,
  validatePackReport,
  validateEvidenceArtifact,
  validateReleaseEvidence,
};
