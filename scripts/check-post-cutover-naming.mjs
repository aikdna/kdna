#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const ALLOWLIST_PATH = path.join(SCRIPT_DIR, 'post-cutover-naming-allowlist.json');
const ALLOWLIST_RELATIVE_PATH = path.relative(ROOT, ALLOWLIST_PATH).split(path.sep).join('/');
const ALLOWLIST_AUTHORITY_DIGEST =
  '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';
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
      name: 'owned-identifier-generation',
      regex:
        /\b(?:[a-z][A-Za-z0-9_]*(?:Capsule|Plan|Host|Trace|Core|KDNA|Container|Profile|Schema|Payload|Envelope|Cluster|Runtime)V[0-9]+|[A-Z][A-Z0-9_]*_V[0-9]+)\b/gu,
    },
    {
      name: 'owned-suffix-generation',
      regex:
        /\b(?:KDNA|Core|Container|Capsule|Profile|Runtime|ConsumptionPlan|JudgmentTrace|AgentHost|Host|Trace|Schema|Payload|Envelope|Cluster|Assay|Studio)V[0-9]+\b/giu,
    },
  ];
}

function decodeText(bytes) {
  if (bytes.includes(0)) return null;
  try {
    return UTF8.decode(bytes);
  } catch {
    return null;
  }
}

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
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
  return git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    .split('\0')
    .filter(Boolean)
    .filter((relativePath) => fs.existsSync(path.join(ROOT, relativePath)))
    .map((relativePath) => {
      const bytes = fs.readFileSync(path.join(ROOT, relativePath));
      return {
        path: relativePath,
        surface: 'tracked',
        text: decodeText(bytes),
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
      text: decodeText(fs.readFileSync(source)),
    };
  });
}

function actualPackRecords(packageRoot, destination, report) {
  const tarball = path.join(destination, report.filename);
  if (!fs.existsSync(tarball)) {
    throw new Error(`${packageRoot}: npm pack tarball is missing: ${report.filename}`);
  }
  const unpackRoot = path.join(destination, 'unpacked');
  fs.mkdirSync(unpackRoot);
  execFileSync('tar', ['-xzf', tarball, '-C', unpackRoot], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return report.files.map(({ path: packedPath }) => {
    const unpacked = path.join(unpackRoot, 'package', packedPath);
    if (!fs.existsSync(unpacked) || !fs.statSync(unpacked).isFile()) {
      throw new Error(`${packageRoot}: tarball path is missing: ${packedPath}`);
    }
    return {
      path: path.posix.join(packageRoot, packedPath),
      surface: 'packed-tarball',
      text: decodeText(fs.readFileSync(unpacked)),
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

function allowedSpans(record, allowlist) {
  const pathEntries = allowlist.filter((entry) => entry.path === record.path);
  return {
    path: pathEntries.flatMap((entry) => matchingSpans(record.path, entry.token)),
    text:
      record.text === null
        ? []
        : pathEntries.flatMap((entry) => matchingSpans(record.text, entry.token)),
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
    if (entry.path === ALLOWLIST_RELATIVE_PATH) {
      throw new Error('allowlist cannot contain a self exception');
    }
    const matchingRecords = records.filter((record) => record.path === entry.path);
    if (matchingRecords.length !== 1) {
      throw new Error(`allowlist path must name one tracked file: ${entry.path}`);
    }
    const record = matchingRecords[0];
    const combined = `${record.path}\n${record.text || ''}`;
    if (!combined.includes(entry.token)) {
      throw new Error(`allowlist token is stale at ${entry.path}: ${entry.token}`);
    }
    const tokenCandidates = collectCandidates(entry.token, rules);
    if (tokenCandidates.length === 0) {
      throw new Error(`allowlist token does not contain a gated candidate: ${entry.path}`);
    }
  }
}

function scanRecords(records, allowlist) {
  const violations = [];
  const rules = candidateRules();
  for (const record of records) {
    const allowed = allowedSpans(record, allowlist);
    for (const finding of collectCandidates(record.path, rules)) {
      if (!spanIsAllowed(allowed.path, finding.start, finding.end)) {
        violations.push({ ...finding, path: record.path, line: null, surface: record.surface });
      }
    }
    if (record.text === null) continue;
    for (const finding of collectCandidates(record.text, rules)) {
      if (!spanIsAllowed(allowed.text, finding.start, finding.end)) {
        violations.push({
          ...finding,
          path: record.path,
          line: lineAt(record.text, finding.start),
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
  validateAllowlist(allowlist, tracked);
  const packed = packageRecords();
  const violations = deduplicateViolations(scanRecords([...tracked, ...packed], allowlist));
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
    `Post-cutover naming audit passed: ${tracked.length} tracked files, ${packed.length / 2} files across dry-run and actual package surfaces, ${allowlist.length} exact third-party exceptions.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export {
  allowlistAuthorityDigest,
  assertAllowlistAuthority,
  collectCandidates,
  deduplicateViolations,
  discoverPackageRoots,
  parseAllowlist,
  scanRecords,
  validateAllowlist,
  versionPattern,
};
