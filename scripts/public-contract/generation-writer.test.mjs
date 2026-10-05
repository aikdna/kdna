import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  compareOutputs,
  mergeOutputs,
  writeOutputs,
  UniqueOutputMap,
} from './generation-writer.mjs';

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'kdna-generation-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return {
    directory,
    root: path.join(directory, 'output'),
    scratch: path.join(directory, 'scratch'),
    allowed: new Set(['a.txt', 'nested/b.txt']),
  };
}
const outputs = () =>
  new Map([
    ['a.txt', Buffer.from('new-a')],
    ['nested/b.txt', Buffer.from('new-b')],
  ]);

test('writes complete outputs; check reads only and preserves file permissions', (t) => {
  const f = fixture(t);
  fs.mkdirSync(f.root);
  fs.writeFileSync(path.join(f.root, 'a.txt'), 'old-a');
  fs.chmodSync(path.join(f.root, 'a.txt'), 0o640);
  assert.equal(writeOutputs(outputs(), f).writes, 2);
  assert.deepEqual(compareOutputs(outputs(), f), []);
  assert.equal(fs.statSync(path.join(f.root, 'a.txt')).mode & 0o777, 0o640);
  fs.rmSync(f.scratch, { recursive: true });
  assert.deepEqual(compareOutputs(outputs(), f), []);
  assert.equal(fs.existsSync(f.scratch), false);
  assert.deepEqual(compareOutputs(new Map([['a.txt', Buffer.from('changed')]]), f), [
    { path: 'a.txt', reason: 'bytes_differ' },
  ]);
});

test('rejects collisions, unapproved output paths and scratch within output before writing', (t) => {
  const f = fixture(t);
  assert.throws(
    () =>
      new UniqueOutputMap([
        ['a.txt', Buffer.from('first')],
        ['a.txt', Buffer.from('second')],
      ]),
    (e) => e.code === 'GENERATION_DUPLICATE',
  );
  assert.throws(
    () => mergeOutputs(outputs(), [['a.txt', Buffer.from('other')]]),
    (e) => e.code === 'GENERATION_DUPLICATE',
  );
  for (const relative of ['../escape', '/escape', 'nested/../a.txt', 'unknown.txt']) {
    assert.throws(
      () => writeOutputs(new Map([[relative, Buffer.from('bad')]]), f),
      (e) => e.code === 'PATH',
    );
  }
  assert.throws(
    () => writeOutputs(outputs(), { ...f, scratch: path.join(f.root, 'scratch') }),
    (e) => e.code === 'PATH',
  );
  assert.throws(
    () => writeOutputs(outputs(), { ...f, root: path.parse(f.root).root }),
    (e) => e.code === 'PATH',
  );
  assert.equal(fs.existsSync(f.root), false);
  assert.equal(fs.existsSync(f.scratch), false);
});

test('rejects dangling and ancestor links, hardlinks, and linked scratch paths', (t) => {
  const f = fixture(t);
  fs.mkdirSync(f.root);
  const outside = path.join(f.directory, 'outside');
  fs.writeFileSync(outside, 'preserve');
  const a = path.join(f.root, 'a.txt');
  fs.symlinkSync(path.join(f.directory, 'missing'), a);
  assert.throws(
    () => writeOutputs(outputs(), f),
    (e) => e.code === 'PATH',
  );
  fs.unlinkSync(a);
  fs.linkSync(outside, a);
  assert.throws(
    () => writeOutputs(outputs(), f),
    (e) => e.code === 'PATH',
  );
  fs.unlinkSync(a);
  const real = path.join(f.directory, 'real');
  fs.mkdirSync(real);
  fs.symlinkSync(real, path.join(f.root, 'nested'));
  assert.throws(
    () => writeOutputs(outputs(), f),
    (e) => e.code === 'PATH',
  );
  fs.unlinkSync(path.join(f.root, 'nested'));
  fs.symlinkSync(f.root, f.scratch);
  assert.throws(
    () => writeOutputs(outputs(), f),
    (e) => e.code === 'PATH',
  );
  fs.unlinkSync(f.scratch);
  const alias = path.join(f.directory, 'alias');
  fs.symlinkSync(f.directory, alias);
  assert.throws(
    () => writeOutputs(outputs(), { ...f, root: path.join(alias, 'output') }),
    (e) => e.code === 'PATH',
  );
  assert.equal(fs.readFileSync(outside, 'utf8'), 'preserve');
  assert.equal(fs.existsSync(f.scratch), false);
});

test('rolls back earlier writes after a later commit fails', (t) => {
  const f = fixture(t);
  fs.mkdirSync(f.root);
  fs.writeFileSync(path.join(f.root, 'a.txt'), 'old-a');
  const original = fs.renameSync;
  try {
    fs.renameSync = (from, to) => {
      if (path.basename(from) === 'new-1')
        throw Object.assign(new Error('injected commit failure'), { code: 'EIO' });
      return original(from, to);
    };
    assert.throws(
      () => writeOutputs(outputs(), f),
      (e) => e.code === 'EIO',
    );
  } finally {
    fs.renameSync = original;
  }
  assert.equal(fs.readFileSync(path.join(f.root, 'a.txt'), 'utf8'), 'old-a');
  assert.equal(fs.existsSync(path.join(f.root, 'nested')), false);
  assert.deepEqual(fs.readdirSync(f.scratch), []);
});

test('keeps staged originals when rollback itself fails', (t) => {
  const f = fixture(t);
  fs.mkdirSync(f.root);
  fs.writeFileSync(path.join(f.root, 'a.txt'), 'old-a');
  const original = fs.renameSync;
  let error;
  try {
    fs.renameSync = (from, to) => {
      if (['new-1', 'old-0'].includes(path.basename(from)))
        throw Object.assign(new Error('injected failure'), { code: 'EIO' });
      return original(from, to);
    };
    try {
      writeOutputs(outputs(), f);
    } catch (e) {
      error = e;
    }
  } finally {
    fs.renameSync = original;
  }
  assert.equal(error.code, 'GENERATION_ROLLBACK_INCOMPLETE');
  assert.equal(fs.readFileSync(path.join(error.recoveryDirectory, 'old-0'), 'utf8'), 'old-a');
  assert.equal(fs.readFileSync(path.join(f.root, 'a.txt'), 'utf8'), 'new-a');
});

test('rejects a filesystem device mismatch before staging or replacing files', (t) => {
  const f = fixture(t);
  fs.mkdirSync(f.root);
  fs.mkdirSync(f.scratch);
  fs.writeFileSync(path.join(f.root, 'a.txt'), 'old-a');
  const original = fs.lstatSync;
  try {
    fs.lstatSync = (p, ...args) => {
      const s = original(p, ...args);
      if (p === f.scratch) {
        const altered = Object.create(s);
        altered.dev = s.dev + 1;
        return altered;
      }
      return s;
    };
    assert.throws(
      () => writeOutputs(outputs(), f),
      (e) => e.code === 'PATH',
    );
  } finally {
    fs.lstatSync = original;
  }
  assert.equal(fs.readFileSync(path.join(f.root, 'a.txt'), 'utf8'), 'old-a');
  assert.deepEqual(fs.readdirSync(f.scratch), []);
});
