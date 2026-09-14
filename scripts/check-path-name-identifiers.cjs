#!/usr/bin/env node
'use strict';
/*
 * Permanent path-name identifier gate for the kdna monorepo.
 *
 * Why it exists: on 2026-09-13 a public batch was found to carry 109 tracked
 * file names whose PATH carried an internal work-order identifier in lowercase
 * (`pd275-…`, `pd278-json-…`, `current-pd278-json-…`). Every gate in this
 * repository scanned file CONTENT, or scanned only for the V-generation naming
 * class, so a lowercase work-order identifier in a PATH NAME was invisible:
 * re-adding `pd275-inexact-0.kdna` left all five gates green. A path name is
 * the most exposed surface of all — it travels to every clone, every archive
 * listing, every `find`, and every search result — so it needs its own gate.
 *
 * What it does: every present path name (tracked, plus present-but-unignored)
 * is matched against a case-insensitive, separator-tolerant work-order
 * identifier pattern. The pattern accepts `-` and `_` between the letters and
 * the digits, so `pd275`, `PD275`, `PD-275`, `pd_275` and `ir_retention_pd273`
 * are all the same defect.
 *
 * Inputs come from git. There is deliberately NO flag that accepts a
 * caller-supplied path list, so a stub that prints success cannot satisfy it.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Flags that would let a caller feed the gate its own answer. Refused, never parsed.
const REFUSED_INPUT_FLAGS = Object.freeze(['--paths', '--files', '--list', '--allow', '--ignore']);

// Hard invariant. NOT read from any manifest or data file, so emptying or
// weakening a manifest cannot switch the rule off.
//
// A work-order identifier is the two letters `pd`, an optional `-`/`_`
// separator, then two to four digits. It is case-insensitive on purpose: the
// 2026-09-13 leak was entirely lowercase, so a case-sensitive ruler (the one
// that existed) would never have seen it.
const WORK_ORDER_PATH_PATTERN = /[Pp][Dd][-_]?[0-9]{2,4}/u;

const SUCCESS_LINE = 'KDNA-PATH-NAME-IDENTIFIERS: CLEAN';

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'buffer',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  });
}

function splitNulBytes(bytes) {
  const values = [];
  let start = 0;
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0) continue;
    if (index > start) values.push(bytes.subarray(start, index));
    start = index + 1;
  }
  if (start < bytes.length) values.push(bytes.subarray(start));
  return values;
}

// The path-name surface is what a clone actually materialises: files git
// tracks, plus files present in the working tree that a broad ignore rule does
// NOT swallow. The ignored surface is internal evidence (`docs/audits/…`) and
// is intentionally out of scope here; `scripts/check-inventory.cjs` governs it.
function presentPaths(root) {
  const bytes = git(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']);
  const seen = new Set();
  for (const raw of splitNulBytes(bytes)) {
    seen.add(raw.toString('utf8'));
  }
  return [...seen].sort();
}

function scanPathNames(paths) {
  const violations = [];
  for (const candidate of paths) {
    const match = candidate.match(WORK_ORDER_PATH_PATTERN);
    if (match) violations.push({ path: candidate, token: match[0] });
  }
  return violations;
}

function checkPathNames({ root }) {
  const paths = presentPaths(root);
  const violations = scanPathNames(paths);
  return { violations, counts: { scanned: paths.length } };
}

function main(argv) {
  for (const arg of argv) {
    // `--paths foo`, `--paths=foo` and bare `--paths` are all the same back
    // door: a caller handing the gate its own answer.
    const refused = REFUSED_INPUT_FLAGS.find((flag) => arg === flag || arg.startsWith(`${flag}=`));
    if (refused) {
      console.error(
        `check-path-name-identifiers: refusing caller-supplied path input ${arg} (this gate takes its input from git, never from the caller)`,
      );
      return 2;
    }
    console.error(`check-path-name-identifiers: unknown argument ${arg}`);
    console.error('usage: check-path-name-identifiers.cjs   (takes no arguments by design)');
    return 2;
  }

  const root = path.resolve(__dirname, '..');
  let result;
  try {
    result = checkPathNames({ root });
  } catch (error) {
    console.error(`check-path-name-identifiers: ${error.message}`);
    return 1;
  }

  const { counts, violations } = result;
  if (violations.length > 0) {
    const cap = 50;
    console.error(
      `PATH-NAME FAIL: ${violations.length} path name(s) carry a work-order identifier:`,
    );
    for (const violation of violations.slice(0, cap)) {
      console.error(`  ${violation.path}  [token ${JSON.stringify(violation.token)}]`);
    }
    if (violations.length > cap) {
      console.error(`PATH-NAME FAIL: ... and ${violations.length - cap} more not shown`);
    }
    console.error(
      'Remediation: rename the path to its neutral public wording (see the 2026-09-13 ' +
        'work-order neutralization batch) and update every reference in the same change.',
    );
    return 1;
  }
  console.log(
    `${SUCCESS_LINE} — no path name carries a work-order identifier (case-insensitive, -/_ tolerant).`,
  );
  console.log(`  scanned=${counts.scanned} present path names`);
  return 0;
}

// Entry guard: compared through realpath so an invocation through a symlink
// still runs the gate (and can never exit 0 silently, which is the failure mode
// this guard exists to prevent).
if (require.main === module) {
  let invoked;
  try {
    invoked = fs.realpathSync(process.argv[1]);
  } catch {
    invoked = null;
  }
  let self;
  try {
    self = fs.realpathSync(__filename);
  } catch {
    self = null;
  }
  if (!invoked || !self || invoked !== self) {
    console.error(
      'KDNA_PATH_NAME_ENTRY_GUARD_FAILED: refusing to run under an unresolved entry path',
    );
    process.exit(2);
  }
  process.exit(main(process.argv.slice(2)));
}

module.exports = {
  checkPathNames,
  presentPaths,
  scanPathNames,
  REFUSED_INPUT_FLAGS,
  SUCCESS_LINE,
  WORK_ORDER_PATH_PATTERN,
};
