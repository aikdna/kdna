import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectKdna, InspectError } from '../docs/inspector/inspector-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => new Uint8Array(fs.readFileSync(path.join(ROOT, rel)));
const SAMPLE = 'examples/native-team-update/team-update-1.0.0.kdna';

test('inspector parses the 0.6.0 native sample cleanly', async () => {
  const report = await inspectKdna(read(SAMPLE));
  assert.equal(report.summary.asset_id, 'asset:team-update-format');
  assert.equal(report.summary.format_version, '0.6.0');
  assert.equal(report.tuple.container, '0.6.0');
  assert.equal(report.tuple.payload_profile, 'kdna.payload.judgment');
  assert.deepEqual(
    report.catalog.map((c) => c.judgment_id),
    ['update:order', 'update:evidence', 'update:rationale'],
  );
  assert.equal(report.payload.status, 'plain');
  assert.equal(report.payload.encrypted, false);
  assert.ok(report.payload.members.some((m) => m.name === 'sections/pack-0.kdnab'));
  assert.ok(report.payload.tables.length > 0);
  assert.ok(report.payload.tables.every((t) => t.digest === 'ok'));
  assert.ok(report.notices.every((n) => n.level === 'info'));
});

test('inspector entry list agrees with an independent ZIP listing', async () => {
  const listing = spawnSync('unzip', ['-Z1', path.join(ROOT, SAMPLE)], { encoding: 'utf8' });
  if (listing.status !== 0) return; // unzip unavailable; structural tests above still apply
  const report = await inspectKdna(read(SAMPLE));
  assert.deepEqual(report.entries.map((e) => e.name).sort(), listing.stdout.split('\n').filter(Boolean).sort());
});

test('encrypted payload yields a clear notice, not a crash', async () => {
  const report = await inspectKdna(read('fixtures/test_protected_entry.kdna'));
  assert.equal(report.payload.status, 'encrypted');
  assert.equal(report.encryption.profile, 'kdna.encryption.password');
  const warn = report.notices.find((n) => n.level === 'warn');
  assert.match(warn.text, /encrypted \/ password-protected/);
  assert.match(warn.text, /cannot be read here/);
});

test('inspector fails closed on non-containers and tampered tables', async () => {
  await assert.rejects(inspectKdna(new Uint8Array([1, 2, 3])), (e) => e instanceof InspectError && e.code === 'KDNA_NOT_A_CONTAINER');
  const bytes = read(SAMPLE);
  const tampered = bytes.slice();
  // Flip a byte inside the stored pack-1 member (the end of the archive body).
  const marker = Buffer.from('sections/pack-1.kdnab');
  const at = Buffer.from(tampered).lastIndexOf(marker, Buffer.from(tampered).indexOf(Buffer.from('PK\x01\x02')));
  tampered[at + marker.length + 40] ^= 0xff;
  const report = await inspectKdna(tampered);
  assert.ok(report.notices.some((n) => n.level === 'error'));
});

test('generated page is fresh, offline, account-free and syntactically valid', () => {
  const check = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'check-asset-inspector.mjs')], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
  const html = fs.readFileSync(path.join(ROOT, 'docs', 'inspector', 'index.html'), 'utf8');
  assert.ok(!html.includes('__KDNA_'));
  assert.ok(!/web-client/i.test(html));
  assert.ok(!/https?:\/\//i.test(html), 'page must carry no external links');
  assert.ok(!/\b(sign[ -]?in|log[ -]?in|sign[ -]?up|account)\b/i.test(html.replace(/no account is needed/, '')));
  assert.ok(!/<script[^>]+src=/i.test(html));
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-insp-')), 'page.mjs');
  fs.writeFileSync(tmp, script);
  const syntax = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
});
