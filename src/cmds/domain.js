const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { error, readJson, writeJson } = require('./_common');

// ─── Validate ────────────────────────────────────────────────────────

function cmdValidate(dir, schemaOnly) {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    error(`Not a directory: ${abs}`);
  }

  const { lintDomain, validateDomainSchema, validateCrossFile } = require('@aikdna/kdna-core');

  // Try multiple schema locations: development (packages/kdna-core/schema) vs npm package (../schema)
  let SCHEMA_DIR = path.join(__dirname, '..', '..', 'packages', 'kdna-core', 'schema');
  if (!fs.existsSync(SCHEMA_DIR)) {
    SCHEMA_DIR = path.join(__dirname, '..', '..', 'schema');
  }

  // Read all KDNA JSON files
  const files = fs.readdirSync(abs).filter((f) => f.endsWith('.json') && f !== 'kdna.json');
  const dataMap = {};
  const schemaMap = {};

  for (const f of files) {
    try {
      dataMap[f] = JSON.parse(fs.readFileSync(path.join(abs, f), 'utf8'));
    } catch (e) {
      dataMap[f] = null;
      console.error(`  JSON parse error in ${f}: ${e.message}`);
    }
  }

  // Schema validation — always load all available schemas
  const FILE_TO_SCHEMA = {
    'KDNA_Core.json': 'KDNA_Core.schema.json',
    'KDNA_Patterns.json': 'KDNA_Patterns.schema.json',
    'KDNA_Scenarios.json': 'KDNA_Scenarios.schema.json',
    'KDNA_Cases.json': 'KDNA_Cases.schema.json',
    'KDNA_Reasoning.json': 'KDNA_Reasoning.schema.json',
    'KDNA_Evolution.json': 'KDNA_Evolution.schema.json',
  };

  const loadedSchemas = [];
  const missingSchemas = [];
  for (const [, schemaFile] of Object.entries(FILE_TO_SCHEMA)) {
    const schemaPath = path.join(SCHEMA_DIR, schemaFile);
    if (fs.existsSync(schemaPath)) {
      try {
        schemaMap[schemaFile] = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        loadedSchemas.push(schemaFile);
      } catch {
        missingSchemas.push(schemaFile);
      }
    } else {
      missingSchemas.push(schemaFile);
    }
  }

  if (missingSchemas.length) {
    console.log(
      `  Note: ${missingSchemas.length} schema file(s) not found (optional file schemas): ${missingSchemas.join(', ')}`,
    );
    console.log(`  Schema dir: ${SCHEMA_DIR}`);
  }

  // Validation layers
  const errors = [];
  const warnings = [];

  // Layer 1: Lint (structural + content checks)
  if (!schemaOnly) {
    const lintResult = lintDomain(dataMap);
    errors.push(...lintResult.errors);
    warnings.push(...lintResult.warnings);
  }

  // Layer 2: JSON Schema validation against loaded schemas
  const schemaResult = validateDomainSchema(dataMap, schemaMap);
  errors.push(...schemaResult.errors);
  warnings.push(...schemaResult.warnings);

  // Layer 3: Cross-file consistency
  const crossResult = validateCrossFile(dataMap);
  errors.push(...crossResult.errors);
  warnings.push(...crossResult.warnings);

  if (warnings.length) {
    console.log('Warnings:');
    warnings.forEach((w) => console.log(`  - ${w}`));
  }
  if (errors.length) {
    console.error('Errors:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const validCount = Object.keys(dataMap).filter((k) => dataMap[k]).length;
  const schemaInfo = schemaOnly
    ? ` (schema-only mode, ${loadedSchemas.length} schemas loaded)`
    : '';
  console.log(`✓ KDNA domain valid: ${abs} (${validCount} files, schema OK${schemaInfo})`);
}

// ─── Pack / Unpack (.kdna ZIP container) ──────────────────────────────────

function cmdPack(dir, outputDir) {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    error(`Not a directory: ${abs}`);
  }

  const core = readJson(path.join(abs, 'KDNA_Core.json'));
  const pat = readJson(path.join(abs, 'KDNA_Patterns.json'));
  if (!core) error('KDNA_Core.json not found or invalid');
  if (!pat) error('KDNA_Patterns.json not found or invalid');

  const domainName = core.meta?.domain || path.basename(abs);

  // Ensure kdna.json manifest exists (generate if missing)
  let manifest = readJson(path.join(abs, 'kdna.json'));
  if (!manifest) {
    const jsonCount = fs
      .readdirSync(abs)
      .filter((f) => f.endsWith('.json') && f !== 'kdna.json').length;
    manifest = {
      kdna_spec: '0.4',
      name: domainName,
      version: core.meta?.version || '0.1.0',
      status: 'experimental',
      access: 'open',
      language: 'en',
      author: { name: '', id: '' },
      license: { type: 'CC-BY-4.0' },
      description: core.meta?.purpose || `${domainName} domain cognition`,
      file_count: jsonCount,
      created: core.meta?.created || new Date().toISOString().slice(0, 10),
      updated: new Date().toISOString().slice(0, 10),
    };
    writeJson(path.join(abs, 'kdna.json'), manifest);
  }

  // Create ZIP container — try python3, then zip command, then Node.js native
  const outName = `${domainName}.kdna`;
  const outPath = outputDir ? path.join(outputDir, outName) : path.join(process.cwd(), outName);
  if (outputDir && !fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  let packed = false;

  // Strategy 1: python3 zipfile (built-in on macOS, most Linux) — use temp file
  const tmpPyFile = path.join(
    fs.existsSync('/tmp') ? '/tmp' : require('os').tmpdir(),
    `kdna-pack-${Date.now()}.py`,
  );
  try {
    const pyScript = `import zipfile, os
src = ${JSON.stringify(abs)}
out = ${JSON.stringify(outPath)}
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in sorted(os.listdir(src)):
        fp = os.path.join(src, f)
        if os.path.isfile(fp) and (f.endswith('.json') or f in ('README.md', 'LICENSE', 'kdna.json')):
            zf.write(fp, f)
`;
    fs.writeFileSync(tmpPyFile, pyScript);
    execSync(`python3 ${tmpPyFile}`, { stdio: 'pipe' });
    packed = true;
  } catch {
    /* Strategy 1 failed, try next */
  } finally {
    try {
      fs.unlinkSync(tmpPyFile);
    } catch {
      /* cleanup */
    }
  }

  // Strategy 2: system zip command
  if (!packed) {
    const cwd = process.cwd();
    try {
      process.chdir(abs);
      execSync(
        `zip -q -r "${outPath}" *.json README.md LICENSE 2>/dev/null || zip -q -r "${outPath}" *.json`,
        { stdio: 'pipe' },
      );
      process.chdir(cwd);
      packed = true;
    } catch {
      process.chdir(cwd);
    }
  }

  // #22: Strategy 3 — Node.js native ZIP (no external dependencies)
  if (!packed) {
    try {
      createNodeZip(abs, outPath);
      packed = true;
    } catch {
      /* last attempt failed */
    }
  }

  if (!packed) {
    const platform = process.platform;
    const hints = {
      darwin: 'macOS includes python3 — ensure it is in PATH.',
      linux: 'Install python3 or zip: apt install python3 / yum install python3 / apk add python3',
      win32: 'Install python3 from python.org, or use WSL.',
    };
    error(`Cannot create ZIP.\n${hints[platform] || 'Install python3 or zip command.'}`);
  }

  const fileCount = manifest.file_count || 0;
  console.log(`✓ Packed: ${outPath}`);
  console.log(`  Domain: ${domainName} v${manifest.version}`);
  console.log(`  Files: ${fileCount} KDNA JSONs`);
  console.log(`  Container: ZIP (DEFLATE)`);
}

// #22: Node.js-native ZIP creator (zero dependencies, fallback when python3/zip unavailable)
function createNodeZip(srcDir, outPath) {
  const zlib = require('zlib');
  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith('.json'))
    .concat(['README.md', 'LICENSE'].filter((f) => fs.existsSync(path.join(srcDir, f))));

  const centralDir = [];
  const fileData = [];
  let offset = 0;

  for (const f of files) {
    const raw = fs.readFileSync(path.join(srcDir, f));
    const crc = crc32(raw);
    const compressed = zlib.deflateRawSync(raw);
    const useStore = compressed.length >= raw.length;

    const nameBytes = Buffer.from(f, 'utf8');
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // general purpose bit flag (UTF-8)
    localHeader.writeUInt16LE(useStore ? 0 : 8, 8); // compression method: stored or deflated
    // skip mod time, mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(useStore ? raw.length : compressed.length, 18); // compressed size
    localHeader.writeUInt32LE(raw.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBytes.length, 26);

    const stored = useStore ? raw : compressed;

    fileData.push(Buffer.concat([localHeader, nameBytes, stored]));
    offset += localHeader.length + nameBytes.length + stored.length;

    // Central directory entry
    const cdEntry = Buffer.alloc(46);
    cdEntry.writeUInt32LE(0x02014b50, 0); // central dir signature
    cdEntry.writeUInt16LE(20, 4); // version made by
    cdEntry.writeUInt16LE(20, 6); // version needed
    cdEntry.writeUInt16LE(0x0800, 8); // UTF-8
    cdEntry.writeUInt16LE(useStore ? 0 : 8, 10);
    cdEntry.writeUInt32LE(crc, 16);
    cdEntry.writeUInt32LE(useStore ? raw.length : compressed.length, 20);
    cdEntry.writeUInt32LE(raw.length, 24);
    cdEntry.writeUInt16LE(nameBytes.length, 28);
    cdEntry.writeUInt32LE(offset - stored.length - nameBytes.length - localHeader.length, 42);
    centralDir.push(Buffer.concat([cdEntry, nameBytes]));
  }

  const cdOffset = offset;
  const cdSize = centralDir.reduce((s, e) => s + e.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // disk with CD
  eocd.writeUInt16LE(files.length, 8); // entries on disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(cdSize, 12); // CD size
  eocd.writeUInt32LE(cdOffset, 16); // CD offset
  eocd.writeUInt16LE(0, 20); // comment length

  const all = Buffer.concat([...fileData, ...centralDir, eocd]);
  fs.writeFileSync(outPath, all);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function cmdUnpack(filePath, force) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    error(`Not a file: ${abs}`);
  }
  if (!abs.endsWith('.kdna')) {
    error(`Not a .kdna file: ${abs}`);
  }

  const domainName = path.basename(abs, '.kdna');
  const outDir = path.join(path.dirname(abs), domainName);

  if (fs.existsSync(outDir)) {
    if (!force) error(`Directory already exists: ${outDir}\nUse --force to overwrite.`);
    fs.rmSync(outDir, { recursive: true, force: true });
  }

  fs.mkdirSync(outDir, { recursive: true });

  // Unzip using python3 zipfile (built-in) — use temp file to avoid -c multiline escaping issues
  const tmpUnpackPy = path.join(
    fs.existsSync('/tmp') ? '/tmp' : require('os').tmpdir(),
    `kdna-unpack-${Date.now()}.py`,
  );
  try {
    const script = `import zipfile, os
zf = zipfile.ZipFile(${JSON.stringify(abs)}, 'r')
zf.extractall(${JSON.stringify(outDir)})
zf.close()
`;
    fs.writeFileSync(tmpUnpackPy, script);
    execSync(`python3 ${tmpUnpackPy}`, { stdio: 'pipe' });
  } catch {
    // Fallback: use system unzip
    try {
      execSync(`unzip -q -o "${abs}" -d "${outDir}"`, { stdio: 'pipe' });
    } catch {
      error('Cannot unpack ZIP. Install python3 or unzip command.');
    }
  } finally {
    try {
      fs.unlinkSync(tmpUnpackPy);
    } catch {
      /* cleanup */
    }
  }

  console.log(`✓ Unpacked: ${outDir}`);
  const files = fs.readdirSync(outDir);
  console.log(`  Files: ${files.length}`);
  files.forEach((f) => console.log(`    ${f}`));
}

// ─── Inspect .kdna file (ZIP container or legacy merged JSON) ────────────

function inspectKdnaFile(filePath) {
  const abs = path.resolve(filePath);
  fs.statSync(abs); // verify file exists

  // Detect format: ZIP container (binary header PK\x03\x04) vs text
  const head = Buffer.alloc(4);
  const fd = fs.openSync(abs, 'r');
  fs.readSync(fd, head, 0, 4, 0);
  fs.closeSync(fd);
  const isZip = head[0] === 0x50 && head[1] === 0x4b;

  let core, patterns, manifest;
  const presentFiles = [];

  if (isZip) {
    // ZIP container — extract to temp, read files
    const os = require('os');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-inspect-'));
    try {
      const tmpInspectPy = path.join(
        fs.existsSync('/tmp') ? '/tmp' : require('os').tmpdir(),
        `kdna-inspect-${Date.now()}.py`,
      );
      try {
        const script = `import zipfile, os
zf = zipfile.ZipFile(${JSON.stringify(abs)}, 'r')
zf.extractall(${JSON.stringify(tmpDir)})
zf.close()
`;
        fs.writeFileSync(tmpInspectPy, script);
        execSync(`python3 ${tmpInspectPy}`, { stdio: 'pipe' });
      } finally {
        try {
          fs.unlinkSync(tmpInspectPy);
        } catch {
          /* cleanup */
        }
      }
    } catch {
      try {
        execSync(`unzip -q -o "${abs}" -d "${tmpDir}"`, { stdio: 'pipe' });
      } catch {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        error('Cannot read .kdna container. Install python3 or unzip.');
      }
    }

    core = readJson(path.join(tmpDir, 'KDNA_Core.json'));
    patterns = readJson(path.join(tmpDir, 'KDNA_Patterns.json'));
    manifest = readJson(path.join(tmpDir, 'kdna.json'));

    for (const f of fs.readdirSync(tmpDir)) {
      if (f.startsWith('KDNA_') && f.endsWith('.json')) {
        presentFiles.push(f);
      }
      if (f === 'README.md' || f === 'LICENSE') presentFiles.push(f);
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  } else {
    // Legacy merged JSON/YAML format (deprecated)
    const raw = fs.readFileSync(abs, 'utf8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = parseSimpleYaml(raw);
    }

    if (!data || !data.meta) error(`Invalid .kdna file: missing meta section`);

    const m = data.meta || {};
    manifest = {
      name: m.name || m.domain,
      version: m.version || '?',
      status: data.status || '?',
      access: data.access || '?',
      language: data.language || '?',
      author: data.author || { name: '?' },
      license: data.license || { type: '?' },
      description: data.description || m.purpose || '?',
      spec_version: m.spec_version || data.kdna_spec || '?',
    };
    core = data.core || {};
    patterns = data.patterns || {};
    presentFiles.push('.kdna (legacy merged format)');
    if (data.scenarios) {
      presentFiles.push('scenarios (inline)');
    }
    if (data.cases) {
      presentFiles.push('cases (inline)');
    }
    if (data.reasoning) {
      presentFiles.push('reasoning (inline)');
    }
    if (data.evolution) {
      presentFiles.push('evolution (inline)');
    }
  }

  if (!core) error('KDNA_Core.json not found in container');

  const m = manifest || {};
  const c = core;
  const p = patterns || {};

  console.log('═'.repeat(50));
  console.log(`  ${m.name || c.meta?.domain || path.basename(abs, '.kdna')} — KDNA Domain`);
  console.log('═'.repeat(50));
  console.log('');
  console.log(`  Format:      .kdna ${isZip ? '(ZIP container)' : '(legacy merged)'}`);
  console.log(`  Spec:        ${m.spec_version || m.kdna_spec || '0.4'}`);
  console.log(`  Version:     ${m.version || '?'}`);
  console.log(`  Status:      ${m.status || 'experimental'}`);
  console.log(`  Access:      ${m.access || 'open'}`);
  console.log(`  Author:      ${m.author?.name || '?'}`);
  console.log(`  License:     ${m.license?.type || '?'}`);
  console.log(`  Created:     ${m.created || c.meta?.created || '?'}`);
  console.log(`  Description: ${m.description || c.meta?.purpose || '?'}`);
  console.log('');
  console.log('  ── Content ──');
  console.log(`  Axioms:             ${(c.axioms || []).length}`);
  console.log(`  Ontology concepts:  ${(c.ontology || []).length}`);
  console.log(`  Frameworks:         ${(c.frameworks || []).length}`);
  console.log(`  Stances:            ${(c.stances || []).length}`);
  console.log(`  Banned terms:       ${(p.terminology?.banned_terms || []).length}`);
  console.log(`  Misunderstandings:  ${(p.misunderstandings || []).length}`);
  console.log(`  Self-checks:        ${(p.self_check || []).length}`);
  console.log('');
  console.log('  ── Files ──');
  presentFiles.forEach((f) => console.log(`    ${f}`));
  console.log('');
  console.log('═'.repeat(50));
}

function parseSimpleYaml(raw) {
  // Parse a simple subset of YAML (no nesting beyond 1 level for sections)
  const result = {};
  let currentSection = null;

  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Section header: "core:" or "  core:" etc
    if (/^[a-z_]+:$/.test(trimmed)) {
      currentSection = trimmed.slice(0, -1);
      if (!result[currentSection]) result[currentSection] = {};
      continue;
    }

    // Key: value
    const kv = trimmed.match(/^([a-z_]+):\s*(.*)/i);
    if (kv && !kv[1].startsWith('-')) {
      const key = kv[1];
      const val = kv[2].trim().replace(/^["']|["']$/g, '');
      if (currentSection) {
        if (key === 'version' && typeof result[currentSection] === 'object') {
          result[currentSection][key] = val;
        } else if (!result[currentSection][key]) {
          result[currentSection][key] = val;
        }
      } else {
        result[key] = val;
      }
      continue;
    }

    // Array item: "- value"
    if (trimmed.startsWith('- ') && currentSection) {
      // For counts only, we don't parse full arrays
      if (currentSection === 'axioms' || currentSection === 'stances') {
        if (!result.core) result.core = {};
        if (!result.core[currentSection]) result.core[currentSection] = [];
        result.core[currentSection].push({ _parsed: true });
      }
    }
  }

  return result;
}

// ─── Inspect ───────────────────────────────────────────────────────────

function cmdInspect(dir) {
  const abs = path.resolve(dir);
  const stat = fs.existsSync(abs) ? fs.statSync(abs) : null;
  if (!stat) error(`Path not found: ${abs}`);

  // Single .kdna file
  if (stat.isFile() && abs.endsWith('.kdna')) {
    inspectKdnaFile(abs);
    return;
  }

  // Directory — existing logic
  if (!stat.isDirectory()) error(`Not a KDNA domain: ${abs}`);

  const core = readJson(path.join(abs, 'KDNA_Core.json'));
  const manifest = readJson(path.join(abs, 'kdna.json'));

  if (!core) {
    error(`Not a KDNA domain (KDNA_Core.json not found in ${abs})`);
  }

  const m = manifest || {};
  const c = core;

  console.log('═'.repeat(50));
  console.log(`  ${m.name || c.meta?.domain || path.basename(abs)} — KDNA Domain`);
  console.log('═'.repeat(50));
  console.log('');
  console.log(`  Version:     ${m.version || c.meta?.version || '?'}`);
  console.log(`  Status:      ${m.status || 'experimental'}`);
  console.log(`  Access:      ${m.access || 'open'}`);
  console.log(`  Language:    ${m.language || c.meta?.language || '?'}`);
  console.log(`  Author:      ${m.author?.name || '?'}`);
  if (m.author?.id) console.log(`               ${m.author.id}`);
  console.log(`  License:     ${m.license?.type || '?'}`);
  console.log(`  Created:     ${c.meta?.created || '?'}`);
  console.log(`  Description: ${m.description || c.meta?.purpose || '?'}`);
  console.log('');

  const expected = [
    'KDNA_Core.json',
    'KDNA_Patterns.json',
    'KDNA_Scenarios.json',
    'KDNA_Cases.json',
    'KDNA_Reasoning.json',
    'KDNA_Evolution.json',
  ];

  console.log('  ── File Set ──');
  for (const f of expected) {
    const exists = fs.existsSync(path.join(abs, f));
    console.log(`  ${exists ? '✓' : '○'} ${f}`);
  }

  console.log('');
  console.log('  ── Content ──');
  console.log(`  Axioms:             ${(c.axioms || []).length}`);
  console.log(`  Ontology concepts:  ${(c.ontology || []).length}`);
  console.log(`  Frameworks:         ${(c.frameworks || []).length}`);
  console.log(`  Core structures:    ${(c.core_structure || []).length}`);
  console.log(`  Stances:            ${(c.stances || []).length}`);

  const pat = readJson(path.join(abs, 'KDNA_Patterns.json'));
  if (pat) {
    const preferred = pat.terminology?.preferred_terms || pat.terminology?.standard_terms || [];
    console.log(`  Preferred terms:    ${preferred.length}`);
    console.log(`  Banned terms:       ${(pat.terminology?.banned_terms || []).length}`);
    console.log(`  Misunderstandings:  ${(pat.misunderstandings || []).length}`);
    console.log(`  Self-checks:        ${(pat.self_check || []).length}`);
  }

  const sce = readJson(path.join(abs, 'KDNA_Scenarios.json'));
  if (sce) console.log(`  Scenarios:          ${(sce.scenes || []).length}`);

  const cas = readJson(path.join(abs, 'KDNA_Cases.json'));
  if (cas) console.log(`  Cases:              ${(cas.cases || []).length}`);

  const rea = readJson(path.join(abs, 'KDNA_Reasoning.json'));
  if (rea) console.log(`  Reasoning chains:   ${(rea.reasoning_chains || []).length}`);

  const evo = readJson(path.join(abs, 'KDNA_Evolution.json'));
  if (evo) console.log(`  Evolution stages:   ${(evo.stages || []).length}`);

  console.log('');
  console.log('  ── Axioms ──');
  for (const a of c.axioms || []) {
    console.log(`  • ${a.one_sentence}`);
  }

  console.log('');
  console.log('═'.repeat(50));
}

module.exports = {
  cmdValidate,
  cmdPack,
  cmdUnpack,
  cmdInspect,
};
