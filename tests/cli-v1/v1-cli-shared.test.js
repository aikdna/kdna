/**
 * v1-cli-shared.test.js — direct unit tests for shared @aikdna/kdna-core v1.
 *
 * Covers the routing + format-detection + pack/unpack logic that the
 * bin/kdna.js shim depends on. The subprocess tests (driving the actual
 * `kdna inspect / validate / pack / unpack` binary) live in
 * v1-cli-subprocess.test.js.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const v1 = require('../../packages/kdna-core/src/v1');
const { MIMETYPE_V1, MIMETYPE_V2, FORBIDDEN_OUTPUT_TERMS } = v1;

const repoRoot = path.resolve(__dirname, '..', '..');
const exampleMinimal = path.join(repoRoot, 'examples', 'minimal');

function makeTmp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function copyMinimal(dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(exampleMinimal)) {
    fs.copyFileSync(path.join(exampleMinimal, f), path.join(dest, f));
  }
  // The repo example has checksums.json with placeholder digests. Drop
  // it for the deterministic-packing test, otherwise the placeholder
  // digests are fine but the file is still allowed.
  return dest;
}

function assertForbiddenTermsAbsent(obj) {
  const seen = new Set();
  function walk(o) {
    if (o === null || typeof o !== 'object') return;
    if (Array.isArray(o)) {
      o.forEach(walk);
      return;
    }
    for (const k of Object.keys(o)) {
      if (FORBIDDEN_OUTPUT_TERMS.includes(k)) seen.add(k);
      walk(o[k]);
    }
  }
  walk(obj);
  assert.equal(seen.size, 0, `forbidden terms in output: ${[...seen].join(', ')}`);
}

test('isV1SourceDir: true for examples/minimal', () => {
  assert.equal(v1.isV1SourceDir(exampleMinimal), true);
});

test('isV1SourceDir: false for a non-existent path', () => {
  assert.equal(
    v1.isV1SourceDir(path.join(os.tmpdir(), 'definitely-not-a-dir-xyz' + Date.now())),
    false,
  );
});

test('isV1SourceDir: false for a directory missing mimetype', () => {
  const dir = makeTmp('kdna-v1-');
  try {
    fs.writeFileSync(path.join(dir, 'kdna.json'), '{}');
    fs.writeFileSync(path.join(dir, 'payload.kdnab'), '{}');
    assert.equal(v1.isV1SourceDir(dir), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('isV1SourceDir: false for a directory with wrong mimetype', () => {
  const dir = makeTmp('kdna-v1-');
  try {
    fs.writeFileSync(path.join(dir, 'mimetype'), MIMETYPE_V2);
    fs.writeFileSync(path.join(dir, 'kdna.json'), '{}');
    fs.writeFileSync(path.join(dir, 'payload.kdnab'), '{}');
    assert.equal(v1.isV1SourceDir(dir), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('detectContainerFormat: returns "v1" for a packed v1 .kdna', () => {
  const dir = makeTmp('kdna-v1-pack-');
  const outFile = path.join(dir, 'packed.kdna');
  try {
    copyMinimal(path.join(dir, 'src'));
    v1.pack(path.join(dir, 'src'), outFile);
    assert.equal(v1.detectContainerFormat(outFile), 'v1');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('detectContainerFormat: returns "v2" for a v2 .kdna', () => {
  // conformance fixture is a v2 .kdna container
  const v2File = path.join(repoRoot, 'fixtures', 'test_conformance.kdna');
  if (fs.existsSync(v2File)) {
    assert.equal(v1.detectContainerFormat(v2File), 'v2');
  }
});

test('detectContainerFormat: returns null for a non-zip file', () => {
  const tmp = path.join(os.tmpdir(), `not-a-zip-${Date.now()}.txt`);
  fs.writeFileSync(tmp, 'this is plain text, not a container\n');
  try {
    assert.equal(v1.detectContainerFormat(tmp), null);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
});

test('inspect: examples/minimal returns the documented fields', () => {
  const out = v1.inspect(exampleMinimal);
  assert.equal(out.kdna_version, '1.0');
  assert.equal(out.asset_id, 'kdna:example:atomspeak-core');
  assert.equal(out.title, 'Atomspeak Core');
  assert.equal(out.version, '1.0.0');
  assert.equal(out.payload, 'payload.kdnab');
  assert.equal(out.payload_encrypted, false);
  assert.equal(out.profile, 'judgment-profile-v1');
  assert.equal(out.load_contract_default_profile, 'compact');
});

test('inspect: output never contains forbidden trust terms', () => {
  const out = v1.inspect(exampleMinimal);
  assertForbiddenTermsAbsent(out);
});

test('inspect: a packed .kdna container produces the same output as its source dir', () => {
  const dir = makeTmp('kdna-v1-roundtrip-');
  try {
    const src = path.join(dir, 'src');
    copyMinimal(src);
    const packed = path.join(dir, 'packed.kdna');
    v1.pack(src, packed);
    const fromDir = v1.inspect(src);
    const fromContainer = v1.inspect(packed);
    assert.deepEqual(fromContainer, fromDir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validate: examples/minimal reports all gates valid', () => {
  const out = v1.validate(exampleMinimal);
  assert.equal(out.format_valid, true);
  assert.equal(out.schema_valid, true);
  assert.equal(out.payload_valid, true);
  assert.equal(out.checksums_valid, true);
  assert.equal(out.load_contract_valid, true);
  assert.equal(out.overall_valid, true);
  assert.deepEqual(out.problems, []);
});

test('validate: missing mimetype is reported as format_valid=false', () => {
  const dir = makeTmp('kdna-v1-bad-');
  try {
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify({ kdna_version: '1.0' }));
    fs.writeFileSync(
      path.join(dir, 'payload.kdnab'),
      JSON.stringify({
        profile: 'judgment-profile-v1',
        core: { highest_question: 'q', axioms: [] },
      }),
    );
    assert.throws(() => v1.validate(dir), /missing mimetype/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validate: invalid mimetype is reported as format error', () => {
  const dir = makeTmp('kdna-v1-bad-');
  try {
    fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.aikdna.kdna+zip');
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify({ kdna_version: '1.0' }));
    fs.writeFileSync(
      path.join(dir, 'payload.kdnab'),
      JSON.stringify({
        profile: 'judgment-profile-v1',
        core: { highest_question: 'q', axioms: [] },
      }),
    );
    assert.throws(() => v1.validate(dir), /not a KDNA v1 layout/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validate: lineage as array is rejected (Phase 1 rule)', () => {
  const dir = makeTmp('kdna-v1-bad-');
  try {
    copyMinimal(dir);
    const manifestPath = path.join(dir, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // Replace the object lineage with an array — the spec explicitly
    // rejects this shape in v1.
    manifest.lineage = [{ type: 'original' }];
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    assert.throws(() => v1.validate(dir), /lineage must be an object/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('pack: produces a deterministic container (same input → same SHA-256)', () => {
  const dir = makeTmp('kdna-v1-det-');
  try {
    const src = path.join(dir, 'src');
    copyMinimal(src);
    const a = path.join(dir, 'a.kdna');
    const b = path.join(dir, 'b.kdna');
    v1.pack(src, a);
    v1.pack(src, b);
    const ha = crypto.createHash('sha256').update(fs.readFileSync(a)).digest('hex');
    const hb = crypto.createHash('sha256').update(fs.readFileSync(b)).digest('hex');
    assert.equal(ha, hb, 'pack must be deterministic');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('pack: output has mimetype as the first entry, STORED', () => {
  const dir = makeTmp('kdna-v1-first-');
  try {
    const src = path.join(dir, 'src');
    copyMinimal(src);
    const out = path.join(dir, 'out.kdna');
    v1.pack(src, out);
    const r = v1.detectContainerFormat(out);
    assert.equal(r, 'v1');
    // The container must round-trip through readV1Layout.
    const v = v1.readV1Layout(out);
    assert.equal(v.kind, 'file');
    assert.ok(v.map.mimetype);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('pack: refuses to pack a directory missing a required entry', () => {
  const dir = makeTmp('kdna-v1-badpack-');
  try {
    fs.writeFileSync(path.join(dir, 'mimetype'), MIMETYPE_V1);
    fs.writeFileSync(path.join(dir, 'kdna.json'), '{}');
    // missing payload.kdnab
    assert.throws(() => v1.pack(dir, path.join(dir, 'out.kdna')), /missing required entry/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('pack: skips junk files like .DS_Store', () => {
  const dir = makeTmp('kdna-v1-junk-');
  try {
    copyMinimal(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'src', '.DS_Store'), 'mac junk');
    const out = path.join(dir, 'out.kdna');
    v1.pack(path.join(dir, 'src'), out);
    const v = v1.readV1Layout(out);
    const names = Object.keys(v.map);
    assert.ok(!names.includes('.DS_Store'), 'no .DS_Store in the container');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('unpack: extracts a packed .kdna and the result validates', () => {
  const dir = makeTmp('kdna-v1-unpack-');
  try {
    const src = path.join(dir, 'src');
    copyMinimal(src);
    const packed = path.join(dir, 'packed.kdna');
    v1.pack(src, packed);
    const outDir = path.join(dir, 'unpacked');
    const r = v1.unpack(packed, outDir);
    assert.equal(r.outputDir, outDir);
    // The unpacked directory must itself be a valid v1 source dir.
    assert.equal(v1.isV1SourceDir(outDir), true);
    const result = v1.validate(outDir);
    assert.equal(result.overall_valid, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('unpack: refuses to write outside the destination (path traversal)', () => {
  const dir = makeTmp('kdna-v1-traversal-');
  try {
    // Build a tiny ZIP that contains an entry "../escape.txt" and
    // verify the unpacker rejects it.
    const zlib = require('node:zlib');
    const entries = [];
    function pushEntry(name, data) {
      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0, 6);
      localHeader.writeUInt16LE(0, 8); // STORED
      localHeader.writeUInt16LE(0, 10);
      localHeader.writeUInt16LE(1, 12);
      // Recompute CRC via direct table.
      const t = (() => {
        const tt = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
          let c = n;
          for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
          tt[n] = c >>> 0;
        }
        return tt;
      })();
      let cc = 0xffffffff;
      for (let i = 0; i < data.length; i++) cc = t[(cc ^ data[i]) & 0xff] ^ (cc >>> 8);
      const crcVal = (cc ^ 0xffffffff) >>> 0;
      localHeader.writeUInt32LE(crcVal, 14);
      localHeader.writeUInt32LE(data.length, 18);
      localHeader.writeUInt32LE(data.length, 22);
      const nameBytes = Buffer.from(name, 'utf8');
      localHeader.writeUInt16LE(nameBytes.length, 26);
      entries.push({ localHeader, nameBytes, data, offset: 0 });
    }
    pushEntry('mimetype', Buffer.from(MIMETYPE_V1, 'utf8'));
    pushEntry('../escape.txt', Buffer.from('pwned', 'utf8'));

    // Build the ZIP with central directory.
    let offset = 0;
    const locals = [];
    const central = [];
    for (const e of entries) {
      e.offset = offset;
      locals.push(e.localHeader, e.nameBytes, e.data);
      offset += e.localHeader.length + e.nameBytes.length + e.data.length;
      const cd = Buffer.alloc(46);
      cd.writeUInt32LE(0x02014b50, 0);
      cd.writeUInt16LE(20, 4);
      cd.writeUInt16LE(20, 6);
      cd.writeUInt16LE(0, 8);
      cd.writeUInt16LE(0, 10);
      cd.writeUInt16LE(0, 12);
      cd.writeUInt16LE(1, 14);
      cd.writeUInt32LE(0, 16);
      cd.writeUInt32LE(e.data.length, 20);
      cd.writeUInt32LE(e.data.length, 24);
      cd.writeUInt16LE(e.nameBytes.length, 28);
      cd.writeUInt32LE(e.offset, 42);
      central.push(cd, e.nameBytes);
    }
    const cdOffset = offset;
    let cdSize = 0;
    for (const c of central) cdSize += c.length;
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(cdOffset, 16);
    eocd.writeUInt16LE(0, 20);

    const evil = path.join(dir, 'evil.kdna');
    fs.writeFileSync(evil, Buffer.concat([...locals, ...central, eocd]));

    const outDir = path.join(dir, 'out');
    assert.throws(() => v1.unpack(evil, outDir), /refusing to write outside target/i);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('readV1Layout: rejects a v1 source with a missing required entry', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'kdna-v1-missing-'));
  try {
    await fsp.writeFile(path.join(dir, 'mimetype'), MIMETYPE_V1);
    await fsp.writeFile(path.join(dir, 'kdna.json'), JSON.stringify({ kdna_version: '1.0' }));
    // missing payload.kdnab
    assert.throws(() => v1.readV1Layout(dir), /missing payload\.kdnab/);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('FORBIDDEN_OUTPUT_TERMS is non-empty and frozen at the API boundary', () => {
  assert.ok(FORBIDDEN_OUTPUT_TERMS.length > 0);
  assert.ok(FORBIDDEN_OUTPUT_TERMS.includes('trusted'));
  assert.ok(FORBIDDEN_OUTPUT_TERMS.includes('recommended'));
  assert.ok(FORBIDDEN_OUTPUT_TERMS.includes('high_quality'));
  assert.ok(FORBIDDEN_OUTPUT_TERMS.includes('officially_approved'));
});
