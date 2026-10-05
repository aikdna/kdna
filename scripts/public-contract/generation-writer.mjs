import fs from 'node:fs';
import path from 'node:path';

function fail(message, code = 'PATH') {
  throw Object.assign(new Error(message), { code });
}
function stat(p) {
  try {
    return fs.lstatSync(p);
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}
function inspectAncestors(p, leafFile = false) {
  const end = path.resolve(p);
  for (let current = end; ; current = path.dirname(current)) {
    const s = stat(current);
    if (s) {
      if (s.isSymbolicLink()) fail('Symbolic link in generation path');
      if (current === end && leafFile) {
        if (!s.isFile() || s.nlink !== 1) fail('Output must be an independent regular file');
      } else if (!s.isDirectory()) fail('Generation ancestor must be a directory');
    }
    if (current === path.dirname(current)) break;
  }
}
function nearestDevice(p) {
  for (let current = path.resolve(p); ; current = path.dirname(current)) {
    const s = stat(current);
    if (s) return s.dev;
    if (current === path.dirname(current)) fail('No filesystem ancestor');
  }
}

export class UniqueOutputMap extends Map {
  set(relative, data) {
    if (this.has(relative)) fail('Duplicate generated output: ' + relative, 'GENERATION_DUPLICATE');
    return super.set(relative, data);
  }
}

export function mergeOutputs(target, entries) {
  for (const [relative, data] of entries) {
    if (target.has(relative))
      fail('Duplicate generated output: ' + relative, 'GENERATION_DUPLICATE');
    target.set(relative, data);
  }
  return target;
}

export function outputPlan(outputs, { root, allowed }) {
  if (!(outputs instanceof Map) || !(allowed instanceof Set))
    fail('Explicit output map and allowlist required');
  root = path.resolve(root);
  inspectAncestors(root);
  const plan = [];
  for (const [relative, data] of outputs) {
    if (
      typeof relative !== 'string' ||
      !relative ||
      relative.includes('\\') ||
      relative.includes('\0') ||
      path.isAbsolute(relative) ||
      relative.split('/').some((s) => !s || s === '.' || s === '..') ||
      !allowed.has(relative)
    )
      fail('Unapproved generated output');
    if (!Buffer.isBuffer(data)) fail('Generated output must be bytes');
    const destination = path.join(root, relative);
    inspectAncestors(destination, true);
    plan.push({ relative, destination, data });
  }
  return plan;
}

export function compareOutputs(outputs, options) {
  const drift = [];
  for (const row of outputPlan(outputs, options)) {
    if (!stat(row.destination)) drift.push({ path: row.relative, reason: 'missing' });
    else if (!fs.readFileSync(row.destination).equals(row.data))
      drift.push({ path: row.relative, reason: 'bytes_differ' });
  }
  return drift;
}

export function writeOutputs(outputs, options) {
  const root = path.resolve(options.root),
    scratch = path.resolve(options.scratch);
  const scratchRelative = path.relative(root, scratch);
  if (
    !scratchRelative ||
    (!path.isAbsolute(scratchRelative) &&
      scratchRelative !== '..' &&
      !scratchRelative.startsWith('..' + path.sep))
  )
    fail('Scratch must be outside output tree');
  inspectAncestors(scratch);
  const plan = outputPlan(outputs, { ...options, root });
  const device = nearestDevice(scratch);
  for (const row of plan)
    if (nearestDevice(path.dirname(row.destination)) !== device)
      fail('Atomic generation requires one filesystem');
  fs.mkdirSync(scratch, { recursive: true });
  const stage = fs.mkdtempSync(path.join(scratch, 'generation-'));
  const directories = [],
    applied = [];
  let retainStage = false;
  function createParents(p) {
    const missing = [];
    for (let current = p; !stat(current); current = path.dirname(current)) missing.push(current);
    for (const current of missing.reverse()) {
      inspectAncestors(current);
      fs.mkdirSync(current);
      directories.push(current);
    }
  }
  try {
    for (let i = 0; i < plan.length; i++) {
      const row = plan[i],
        s = stat(row.destination);
      row.previous = s ? fs.readFileSync(row.destination) : null;
      row.mode = s ? s.mode & 0o777 : 0o644;
      fs.writeFileSync(path.join(stage, 'new-' + i), row.data, { flag: 'wx', mode: row.mode });
      fs.chmodSync(path.join(stage, 'new-' + i), row.mode);
      if (row.previous !== null) {
        fs.writeFileSync(path.join(stage, 'old-' + i), row.previous, {
          flag: 'wx',
          mode: row.mode,
        });
        fs.chmodSync(path.join(stage, 'old-' + i), row.mode);
      }
    }
    for (let i = 0; i < plan.length; i++) {
      const row = plan[i];
      inspectAncestors(row.destination, true);
      createParents(path.dirname(row.destination));
      if (fs.statSync(path.dirname(row.destination)).dev !== device)
        fail('Generation filesystem changed');
      fs.renameSync(path.join(stage, 'new-' + i), row.destination);
      applied.push(i);
    }
  } catch (error) {
    const failures = [];
    for (const i of applied.reverse()) {
      const row = plan[i];
      try {
        inspectAncestors(row.destination, true);
        if (row.previous === null) fs.unlinkSync(row.destination);
        else fs.renameSync(path.join(stage, 'old-' + i), row.destination);
      } catch (e) {
        failures.push(e);
      }
    }
    for (const directory of directories.reverse())
      try {
        fs.rmdirSync(directory);
      } catch (e) {
        if (e.code !== 'ENOENT' && e.code !== 'ENOTEMPTY') failures.push(e);
      }
    if (failures.length) {
      retainStage = true;
      throw Object.assign(new Error('Generation rollback incomplete; staged originals retained'), {
        code: 'GENERATION_ROLLBACK_INCOMPLETE',
        cause: error,
        recoveryDirectory: stage,
      });
    }
    throw error;
  } finally {
    if (!retainStage) fs.rmSync(stage, { recursive: true, force: true });
  }
  return { writes: plan.length };
}
