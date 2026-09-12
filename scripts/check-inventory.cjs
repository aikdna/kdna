#!/usr/bin/env node
'use strict';
/*
 * Permanent repository-inventory gate for the kdna monorepo.
 *
 * Why it exists: this public repository's working tree accumulated 31 internal
 * materials (internal acceptance records that carry workstation and recovery
 * paths). They sat untracked, but `docs/audits/` already had tracked files in
 * HEAD, so a single `git add -A` would have published them. Counting
 * `git status --short` lines cannot see a file that a broad `.gitignore`
 * pattern swallows, and it cannot see the difference between "present but
 * untracked" and "present, ignored, and forgotten".
 *
 * What it does: compares the inventory the repository DECLARES
 * (release-surface/inventory.json) with the inventory git can actually see:
 *   1. the declared tracked-file count must equal `git ls-files | wc -l`;
 *   2. every present path matching a must-track glob must be tracked;
 *   3. every present-but-untracked path must be declared;
 *   4. every present-but-ignored path must be declared;
 *   5. no path matching a forbidden-tracked glob may ever be tracked.
 *
 * The must-track and forbidden-tracked globs are hard-coded here on purpose:
 * emptying or weakening the manifest cannot switch the rule off.
 *
 * Inputs come from git itself. There is deliberately NO flag that accepts a
 * caller-supplied inventory/state/file list, so a stub that prints success
 * cannot satisfy it: `--inventory`, `--state` and `--files` are refused with
 * exit status 2, as is any other argument.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Flags that would let a caller feed the gate its own answer. Refused, never parsed.
const REFUSED_INPUT_FLAGS = Object.freeze(['--inventory', '--state', '--files']);

// Hard invariants. NOT read from the manifest, so the manifest cannot drop them.
const REQUIRED_MUST_TRACK = Object.freeze([
  'python-sdk/kdna/core/_schemas/*.json',
  'packages/kdna-core/schema/*.json',
  'schema/*.json',
  'packages/kdna-conformance/public-contract/**',
]);
const FORBIDDEN_TRACKED = Object.freeze([
  'docs/audits/2026-09-*',
  'docs/audits/OPEN-WAVE0-PUBLIC-BASELINE.json',
  'python-sdk/delivery/**',
  '**/evidence/**',
  '*.log',
  '*.DS_Store',
]);
const SUCCESS_LINE = 'KDNA-MONOREPO-INVENTORY: MATCH';

function git(root, args) {
  const out = execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  });
  return out.split('\n').filter((line) => line !== '');
}

// Minimal gitignore-style matcher, explicit about its own semantics:
//   `**` crosses `/`; `*` and `?` do not cross `/`;
//   a pattern containing no `/` matches the basename at any depth.
function globToRegExp(pattern) {
  const anchored = pattern.includes('/');
  const segments = pattern.split('/');
  const parts = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const last = i === segments.length - 1;
    if (segment === '**') {
      parts.push(last ? '.*' : '(?:[^/]+/)*');
      continue;
    }
    let out = '';
    for (const c of segment) {
      if (c === '*') out += '[^/]*';
      else if (c === '?') out += '[^/]';
      else out += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
    parts.push(last ? out : `${out}/`);
  }
  const body = parts.join('');
  return new RegExp(anchored ? `^${body}$` : `^(?:.*/)?${body}$`);
}

const REGEXP_CACHE = new Map();
function matchesAny(file, patterns) {
  for (const pattern of patterns) {
    let re = REGEXP_CACHE.get(pattern);
    if (!re) {
      re = globToRegExp(pattern);
      REGEXP_CACHE.set(pattern, re);
    }
    if (re.test(file)) return pattern;
  }
  return null;
}

function loadManifest(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const key of ['must_track_globs', 'allowed_untracked_globs', 'allowed_ignored_globs']) {
    if (!Array.isArray(manifest[key])) {
      throw new Error(`inventory manifest: ${key} must be an array`);
    }
  }
  if (!Number.isInteger(manifest.tracked_count) || manifest.tracked_count < 0) {
    throw new Error('inventory manifest: tracked_count must be a non-negative integer');
  }
  return manifest;
}

function checkInventory({ root, manifestPath }) {
  const manifest = loadManifest(manifestPath);
  const failures = [];

  // (1) the declared in-repository file count must equal reality.
  const tracked = git(root, ['ls-files']);
  const trackedSet = new Set(tracked);
  if (tracked.length !== manifest.tracked_count) {
    failures.push(
      `declared tracked_count=${manifest.tracked_count} but git tracks ${tracked.length} files` +
        ' (re-pin release-surface/inventory.json in the same change that adds or removes files)',
    );
  }

  // (2) the manifest may add required globs but never drop a hard invariant.
  for (const required of REQUIRED_MUST_TRACK) {
    if (!manifest.must_track_globs.includes(required)) {
      failures.push(`manifest no longer declares the required in-repository glob ${required}`);
    }
  }

  // (3) everything the manifest says must be in the repository must be TRACKED.
  //     A file hidden by a broad ignore pattern shows up here and nowhere else.
  // NOTE: `git ls-files --cached` and `--others --ignored` do not combine:
  // passing `--ignored` suppresses the cached list. The on-disk set is
  // `--cached --others` (untracked-and-ignored files are "others" without
  // `--exclude-standard`), which is tracked + present-but-unignored +
  // present-but-ignored.
  const present = [...new Set(git(root, ['ls-files', '--cached', '--others']))];
  let mustTrackPresent = 0;
  for (const file of present) {
    const pattern = matchesAny(file, manifest.must_track_globs);
    if (!pattern) continue;
    mustTrackPresent++;
    if (!trackedSet.has(file)) {
      failures.push(
        `"${file}" matches declared must-track glob "${pattern}" but is NOT tracked` +
          ' (ignored or untracked paths are invisible in `git status --short`)',
      );
    }
  }

  // (4) present-but-untracked paths must be explicitly allowed.
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard']);
  for (const file of untracked) {
    if (!matchesAny(file, manifest.allowed_untracked_globs)) {
      failures.push(`"${file}" is present and untracked but is not declared in allowed_untracked_globs`);
    }
  }

  // (5) present-but-ignored paths must be explicitly allowed. This is the rule
  //     that makes the ignore surface a reviewed declaration rather than an
  //     accident of the pattern list.
  const ignored = git(root, ['ls-files', '--others', '--ignored', '--exclude-standard']);
  for (const file of ignored) {
    if (!matchesAny(file, manifest.allowed_ignored_globs)) {
      failures.push(`"${file}" is present and ignored but is not declared in allowed_ignored_globs`);
    }
  }

  // (6) internal material must never be tracked, whatever the ignore file says.
  const forbiddenHits = [];
  for (const file of tracked) {
    const pattern = matchesAny(file, FORBIDDEN_TRACKED);
    if (pattern) {
      forbiddenHits.push(file);
      failures.push(`"${file}" matches forbidden-tracked glob "${pattern}" but IS tracked (internal material must never enter the public surface)`);
    }
  }

  return {
    failures,
    counts: {
      tracked: tracked.length,
      untracked: untracked.length,
      ignored: ignored.length,
      present: present.length,
      must_track_present: mustTrackPresent,
      forbidden_tracked: forbiddenHits.length,
    },
    manifest,
  };
}

function main(argv) {
  for (const arg of argv) {
    // `--inventory foo`, `--inventory=foo` and bare `--inventory` are all the
    // same back door: a caller handing the gate its own answer.
    const refused = REFUSED_INPUT_FLAGS.find((flag) => arg === flag || arg.startsWith(`${flag}=`));
    if (refused) {
      console.error(`check-inventory: refusing caller-supplied inventory input ${arg} (this gate takes its input from git, never from the caller)`);
      return 2;
    }
    console.error(`check-inventory: unknown argument ${arg}`);
    console.error('usage: check-inventory.cjs   (takes no arguments by design)');
    return 2;
  }

  const root = path.resolve(__dirname, '..');
  const manifestPath = path.join(root, 'release-surface', 'inventory.json');
  let result;
  try {
    result = checkInventory({ root, manifestPath });
  } catch (error) {
    console.error(`check-inventory: ${error.message}`);
    return 1;
  }

  const { counts, failures } = result;
  if (failures.length > 0) {
    for (const failure of failures) console.error(`INVENTORY FAIL: ${failure}`);
    return 1;
  }
  console.log(`${SUCCESS_LINE} — declared and git-visible sets agree; no hidden in-repository bytes.`);
  console.log(
    `  tracked=${counts.tracked} (declared ${result.manifest.tracked_count}) | must-track present=${counts.must_track_present} all tracked` +
      ` | untracked=${counts.untracked} all declared | ignored=${counts.ignored} all declared | forbidden-tracked=${counts.forbidden_tracked}`,
  );
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
    console.error('KDNA_INVENTORY_ENTRY_GUARD_FAILED: refusing to run under an unresolved entry path');
    process.exit(2);
  }
  process.exit(main(process.argv.slice(2)));
}

module.exports = { checkInventory, globToRegExp, matchesAny, REQUIRED_MUST_TRACK, FORBIDDEN_TRACKED, REFUSED_INPUT_FLAGS, SUCCESS_LINE };
