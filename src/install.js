/**
 * KDNA Install — v0.7 .kdna-first installer.
 *
 * Sources (priority order):
 *   kdna install <bare>                     → @aikdna/<bare>, from registry
 *   kdna install @scope/name                → from registry (any scope)
 *   kdna install @scope/name@1.2.3          → version pinned (TODO post-v0.7.0)
 *   kdna install ./folder                   → local directory (dev)
 *   kdna install ./file.kdna                → local .kdna file
 *
 * Removed in v0.7 (breaking): github:user/repo, --from-git, cluster:github:...,
 * tarball/SSH fallbacks. Install is now strictly .kdna-driven from the registry.
 *
 * Schema v2.0 — see kdna-registry/SCHEMA.md
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, execFileSync } = require('child_process');
const { RegistryResolver, parseName } = require('./registry');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const INSTALL_DIR = path.join(USER_KDNA_DIR, 'domains');

// Agent skill directories (search order)
const AGENT_SKILL_DIRS = [
  path.join(process.env.HOME || '', '.agents', 'skills'),
  path.join(process.env.HOME || '', '.claude', 'skills'),
  path.join(process.env.HOME || '', '.codex', 'skills'),
  path.join(process.env.HOME || '', '.cursor', 'skills'),
  path.join(process.env.HOME || '', '.gemini', 'antigravity', 'skills'),
];

/**
 * Ensure the kdna-loader skill is installed in ALL detected agent directories.
 * Without this, installed KDNA domains are invisible to agents.
 */
function ensureLoaderSkill() {
  const alreadyInstalled = [];
  const toInstall = [];
  const toUpdate = []; // present but outdated (pre-v2.1)

  // v2.1 marker — present in current SKILL.md, absent in old one
  const V2_1_MARKER = 'applies_when';

  for (const dir of AGENT_SKILL_DIRS) {
    const skillFile = path.join(dir, 'kdna-loader', 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      let isCurrent = false;
      try {
        const content = fs.readFileSync(skillFile, 'utf8');
        isCurrent = content.includes(V2_1_MARKER);
      } catch {
        /* unreadable — treat as missing */
      }
      if (isCurrent) alreadyInstalled.push(dir);
      else toUpdate.push(dir);
    } else {
      toInstall.push(dir);
    }
  }

  // If all up-to-date, nothing to do
  if (toInstall.length === 0 && toUpdate.length === 0) return;

  // Notify which are current
  if (alreadyInstalled.length > 0) {
    console.log(
      `  ✓ kdna-loader (v2.1) found in: ${alreadyInstalled.map((d) => path.basename(path.dirname(d))).join(', ')}`,
    );
  }

  // Install + update share the same target list
  const targets = [...toInstall, ...toUpdate];
  const verb =
    toUpdate.length && !toInstall.length
      ? 'Updating'
      : toInstall.length && !toUpdate.length
        ? 'Installing'
        : 'Installing/updating';
  console.log(`  ${verb} kdna-loader skill (v2.1)...`);

  let installed = 0;
  const sources = [];

  // Source 1: download from kdna-skills repo (single source of truth, v0.7.4+).
  // This must come FIRST so we don't ship stale local copies to users.
  sources.push({
    type: 'remote',
    url: 'https://raw.githubusercontent.com/aikdna/kdna-skills/main/kdna-loader/SKILL.md',
  });

  // Source 2: offline fallback — KDNA repo local checkout, only used if the
  // CDN is unreachable. The npm-published tarball does NOT include SKILL.md
  // files anymore (they live solely in kdna-skills).
  const localTemplate = path.resolve(__dirname, '..', 'skills', 'kdna-loader', 'SKILL.md');
  if (fs.existsSync(localTemplate)) {
    sources.push({ type: 'local', path: localTemplate });
  }

  for (const dir of targets) {
    const skillDir = path.join(dir, 'kdna-loader');
    for (const src of sources) {
      try {
        fs.mkdirSync(skillDir, { recursive: true });
        if (src.type === 'local') {
          fs.copyFileSync(src.path, path.join(skillDir, 'SKILL.md'));
        } else {
          execSync(`curl -fsSL -o "${path.join(skillDir, 'SKILL.md')}" "${src.url}"`, {
            stdio: 'pipe',
            timeout: 10000,
          });
        }
        installed++;
        break; // Move to next agent dir
      } catch {
        // Try next source
      }
    }
  }

  if (installed > 0) {
    console.log(
      `   ✓ kdna-loader installed/updated in ${installed} agent director${installed > 1 ? 'ies' : 'y'}`,
    );
  }

  if (installed < targets.length) {
    console.log(
      `   ⚠ Could not install to ${targets.length - installed} agent director${targets.length - installed > 1 ? 'ies' : 'y'}.`,
    );
    console.log('   Run: kdna setup --force');
  }

  if (installed === 0 && alreadyInstalled.length === 0) {
    console.log('   ⚠ Could not install kdna-loader anywhere.');
    console.log('   Run: kdna setup');
  }
}

function error(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function scopeDir(scope) {
  return path.join(INSTALL_DIR, scope);
}

function domainDir(scope, ident) {
  return path.join(INSTALL_DIR, scope, ident);
}

// ─── Legacy detection ───────────────────────────────────────────────────

function detectLegacyInstalls() {
  if (!fs.existsSync(INSTALL_DIR)) return [];
  const entries = fs.readdirSync(INSTALL_DIR);
  // Legacy: any direct child of INSTALL_DIR that is a directory AND does NOT start with @
  return entries.filter((e) => {
    if (e.startsWith('@') || e.startsWith('.')) return false;
    try {
      return fs.statSync(path.join(INSTALL_DIR, e)).isDirectory();
    } catch {
      return false;
    }
  });
}

function warnLegacy() {
  const legacy = detectLegacyInstalls();
  if (!legacy.length) return;
  console.error('');
  console.error('═'.repeat(64));
  console.error('  v0.7 breaking change: legacy (un-scoped) domains detected');
  console.error('═'.repeat(64));
  console.error('');
  console.error('  These directories use the old un-scoped path layout:');
  legacy.forEach((d) => console.error(`    ~/.kdna/domains/${d}/`));
  console.error('');
  console.error('  Run:  kdna remove <name>   then   kdna install <name>');
  console.error('  (CLI will not read or update legacy directories.)');
  console.error('');
}

// ─── Source parsing ─────────────────────────────────────────────────────

function parseSource(input) {
  // Local file
  if (
    input.endsWith('.kdna') &&
    (input.startsWith('./') || input.startsWith('/') || input.startsWith('~/'))
  ) {
    const resolved = path.resolve(input.replace(/^~/, process.env.HOME || ''));
    if (!fs.existsSync(resolved)) error(`Local file not found: ${resolved}`);
    return { type: 'local-file', path: resolved };
  }

  // Local directory
  if (input.startsWith('./') || input.startsWith('/') || input.startsWith('~/')) {
    const resolved = path.resolve(input.replace(/^~/, process.env.HOME || ''));
    if (!fs.existsSync(resolved)) error(`Local path not found: ${resolved}`);
    if (!fs.statSync(resolved).isDirectory()) error(`Not a directory: ${resolved}`);
    return { type: 'local-dir', path: resolved };
  }

  // Registry name (bare or @scope/name)
  const parsed = parseName(input);
  if (!parsed) {
    error(
      `Cannot parse "${input}". Use:\n` +
        `  kdna install <name>             # @aikdna/<name>\n` +
        `  kdna install @scope/name        # any scope\n` +
        `  kdna install ./folder           # local directory\n` +
        `  kdna install ./file.kdna        # local .kdna file`,
    );
  }
  return { type: 'registry', parsed };
}

// ─── Download helpers ──────────────────────────────────────────────────

function downloadFile(url, dest) {
  ensureDir(path.dirname(dest));
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      execFileSync('curl', ['-fsSL', '--retry', '2', '--retry-delay', '1', '-o', dest, url], {
        timeout: 90000,
        stdio: 'pipe',
      });
      return;
    } catch (e) {
      lastErr = e;
      if (attempt < 3) {
        // brief pause between attempts
        try {
          execFileSync('sleep', ['1'], { stdio: 'ignore' });
        } catch {
          /* ignore */
        }
      }
    }
  }
  const stderr = lastErr?.stderr?.toString().trim() || lastErr?.message || 'unknown';
  throw new Error(`download failed after 3 attempts: ${stderr}`);
}

// ─── Extraction ────────────────────────────────────────────────────────

function extractKdna(kdnaPath, destDir) {
  ensureDir(destDir);
  const script = `import zipfile
zf = zipfile.ZipFile(${JSON.stringify(kdnaPath)}, 'r')
zf.extractall(${JSON.stringify(destDir)})
zf.close()
print('ok')
`;
  try {
    execSync(`python3 -c ${JSON.stringify(script)}`, { stdio: 'pipe' });
    return;
  } catch {
    /* try unzip */
  }
  try {
    execSync(`unzip -q -o "${kdnaPath}" -d "${destDir}"`, { stdio: 'pipe' });
    return;
  } catch {
    error('Cannot extract .kdna file. Install python3 or unzip.');
  }
}

// ─── Signature verification ────────────────────────────────────────────

function verifySignature({ destDir, scope, entry, lenient = true }) {
  const manifest = readJson(path.join(destDir, 'kdna.json'));
  if (!manifest) {
    if (lenient) {
      console.warn('  ⚠ No kdna.json — cannot verify signature.');
      return;
    }
    error('No kdna.json in package — cannot verify signature.');
  }

  const trustKey = scope.trust_pubkey;
  const isPlaceholder = !trustKey || trustKey.includes('PLACEHOLDER');

  // v0.7 bootstrap: signatures may be absent. Warn but allow.
  if (!entry.signature || !manifest.signature) {
    if (isPlaceholder) {
      console.warn(
        `  ⚠ Bootstrap mode: scope ${entry.name.split('/')[0]} has placeholder trust key. Signature not verified.`,
      );
    } else {
      console.warn(
        `  ⚠ ${entry.name}: no signature on package. (Will be required post-bootstrap.)`,
      );
    }
    return;
  }

  // Author pubkey fingerprint must match scope trust_pubkey
  if (manifest.author?.pubkey !== trustKey) {
    error(`${entry.name}: author.pubkey does not match scope trust key. Refusing to install.`);
  }

  // Full Ed25519 verify (requires public_key_pem embedded in the package)
  const pem = manifest.author?.public_key_pem;
  if (!pem) {
    // Legacy package (signed but no embedded PEM). Trust the fingerprint match.
    console.log('  ✓ Signature OK (legacy fingerprint-only mode — no PEM)');
    return;
  }

  // 1. Confirm the embedded PEM hashes to the claimed pubkey fingerprint
  const computedFingerprint = 'ed25519:' + crypto.createHash('sha256').update(pem).digest('hex');
  if (computedFingerprint !== manifest.author.pubkey) {
    error(
      `${entry.name}: embedded public_key_pem does not match author.pubkey fingerprint. Refusing.`,
    );
  }

  // 2. Verify the Ed25519 signature over the canonical payload
  // Canonical payload reconstruction must match publish.js exactly:
  //   - sorted .json filenames
  //   - for kdna.json: strip "signature" field before hashing
  //   - others: raw bytes
  //   - hash each, format "name:hex", join with "\n"
  const sigHex = manifest.signature.replace(/^ed25519:/, '');
  try {
    const files = fs
      .readdirSync(destDir)
      .filter((f) => f.endsWith('.json'))
      .sort();
    const parts = [];
    for (const f of files) {
      const full = path.join(destDir, f);
      let buf;
      if (f === 'kdna.json') {
        const obj = JSON.parse(fs.readFileSync(full, 'utf8'));
        delete obj.signature;
        delete obj._source; // install-time metadata, not part of signed payload
        buf = Buffer.from(JSON.stringify(obj));
      } else {
        buf = fs.readFileSync(full);
      }
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      parts.push(`${f}:${hash}`);
    }
    const payload = parts.join('\n');

    const publicKey = crypto.createPublicKey(pem);
    const ok = crypto.verify(null, Buffer.from(payload), publicKey, Buffer.from(sigHex, 'hex'));
    if (!ok) {
      error(`${entry.name}: Ed25519 signature INVALID. Package may be tampered. Refusing.`);
    }
    console.log('  ✓ Signature OK (Ed25519 verified)');
  } catch (e) {
    if (e.message?.includes('INVALID')) throw e;
    error(`${entry.name}: signature verification failed: ${e.message}`);
  }
}

// ─── Status confirmation (interactive) ─────────────────────────────────

function confirmStatus(entry, yes) {
  const status = entry.status || 'experimental';
  if (yes || (status !== 'experimental' && status !== 'draft')) return true;

  console.log(`  ${entry.name} is ${status} — judgment quality is not yet verified.`);
  console.log(`  Pass --yes to skip this prompt.`);
  try {
    const buf = Buffer.alloc(1);
    process.stdout.write('Continue? [y/N] ');
    fs.readSync(0, buf, 0, 1);
    return buf.toString().trim().toLowerCase() === 'y';
  } catch {
    return false;
  }
}

// ─── Cleanup stale temps ───────────────────────────────────────────────

function cleanStaleTemps() {
  if (!fs.existsSync(INSTALL_DIR)) return;
  try {
    for (const scopeName of fs.readdirSync(INSTALL_DIR)) {
      if (!scopeName.startsWith('@')) continue;
      const sd = path.join(INSTALL_DIR, scopeName);
      if (!fs.statSync(sd).isDirectory()) continue;
      for (const child of fs.readdirSync(sd)) {
        if (child.endsWith('.tmp') || child.endsWith('.kdna.tmp')) {
          try {
            fs.rmSync(path.join(sd, child), { recursive: true, force: true });
          } catch {
            /* ignore */
          }
        }
      }
    }
  } catch {
    /* ignore */
  }
}

// ─── Main install ──────────────────────────────────────────────────────

function cmdInstallExtended(input, args = []) {
  warnLegacy();
  ensureDir(INSTALL_DIR);
  cleanStaleTemps();

  // Auto-install loader skill if missing (without it, agents can't see installed domains)
  ensureLoaderSkill();

  const yes = args.includes('--yes');
  const source = parseSource(input);

  switch (source.type) {
    case 'registry':
      return installFromRegistry(source.parsed, yes);
    case 'local-file':
      return installFromLocalFile(source.path, yes);
    case 'local-dir':
      return installFromLocalDir(source.path, yes);
  }
}

function installFromRegistry(parsed, yes) {
  const resolver = new RegistryResolver({ allowNetwork: true });
  let scope, entry;
  try {
    ({ scope, entry } = resolver.resolve(parsed.full));
  } catch (e) {
    error(e.message);
  }

  if (parsed.wasShort) {
    console.log(`  Resolved "${parsed.ident}" → ${entry.name}`);
  }

  if (entry.deprecated) {
    console.warn(
      `  ⚠ ${entry.name} is deprecated.${entry.replaced_by ? ` Use ${entry.replaced_by} instead.` : ''}`,
    );
  }
  if (entry.access && entry.access !== 'open') {
    error(`${entry.name} requires "${entry.access}" access. Not installable via CLI yet.`);
  }

  if (entry.type === 'cluster') {
    return installCluster(entry, resolver, yes);
  }

  if (!entry.kdna_url) {
    error(
      `${entry.name}@${entry.version} has no kdna_url in registry.\n` +
        `release_status: ${entry.release_status || 'unknown'}\n` +
        `(This domain has not been published as a .kdna file yet. It will be available after v0.7 republish.)`,
    );
  }

  if (!confirmStatus(entry, yes)) {
    console.log('Installation cancelled.');
    process.exit(0);
  }

  installSingleFromUrl({ entry, scope });
}

function installSingleFromUrl({ entry, scope }) {
  const [scopeName, ident] = entry.name.split('/');
  const dest = domainDir(scopeName, ident);
  const tmpFile = path.join(scopeDir(scopeName), `.${ident}-${Date.now()}.kdna.tmp`);

  console.log(`  Downloading ${entry.name}@${entry.version}...`);
  ensureDir(scopeDir(scopeName));
  try {
    downloadFile(entry.kdna_url, tmpFile);
  } catch {
    error(`Failed to download ${entry.kdna_url}`);
  }

  // sha256 check
  const actual = sha256File(tmpFile);
  if (entry.sha256 && actual !== entry.sha256) {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* ignore */
    }
    error(`sha256 mismatch for ${entry.name}: expected ${entry.sha256}, got ${actual}`);
  }
  console.log(`  ✓ sha256 verified`);

  // Replace existing install atomically-ish
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  ensureDir(dest);

  extractKdna(tmpFile, dest);
  try {
    fs.unlinkSync(tmpFile);
  } catch {
    /* ignore */
  }

  verifySignature({ destDir: dest, scope, entry, lenient: true });

  // Stamp install metadata
  const manifest = readJson(path.join(dest, 'kdna.json')) || {};
  manifest._source = {
    type: 'registry',
    name: entry.name,
    version: entry.version,
    kdna_url: entry.kdna_url,
    sha256: entry.sha256,
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dest, 'kdna.json'), JSON.stringify(manifest, null, 2) + '\n');

  console.log(`✓ Installed ${entry.name}@${entry.version}`);
  console.log(`  Location: ${dest}`);
}

function installCluster(clusterEntry, resolver, _yes) {
  const subdomains = clusterEntry.cluster?.domains || [];
  if (!subdomains.length) {
    error(`Cluster ${clusterEntry.name} has no sub-domains listed.`);
  }

  console.log(`Cluster ${clusterEntry.name} → ${subdomains.length} sub-domains`);

  for (const sub of subdomains) {
    try {
      const resolved = resolver.resolve(sub);
      if (!resolved.entry.kdna_url) {
        console.warn(`  ⚠ ${sub}: no kdna_url (skipping)`);
        continue;
      }
      console.log('');
      installSingleFromUrl({ entry: resolved.entry, scope: resolved.scope });
    } catch (e) {
      console.warn(`  ⚠ ${sub}: ${e.message.split('\n')[0]}`);
    }
  }

  // Record the cluster itself
  const [scopeName, ident] = clusterEntry.name.split('/');
  const clusterDest = domainDir(scopeName, ident);
  ensureDir(clusterDest);
  fs.writeFileSync(
    path.join(clusterDest, 'cluster.json'),
    JSON.stringify(
      {
        name: clusterEntry.name,
        version: clusterEntry.version,
        type: 'cluster',
        domains: subdomains,
        composition_rules: clusterEntry.cluster.composition_rules || [],
        installed_at: new Date().toISOString(),
      },
      null,
      2,
    ) + '\n',
  );
  console.log('');
  console.log(`✓ Cluster ${clusterEntry.name} installed`);
}

function installFromLocalFile(filePath, _yes) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) error(`Not a file: ${abs}`);

  const tmpDir = path.join(INSTALL_DIR, '.local-tmp-' + Date.now());
  ensureDir(tmpDir);
  extractKdna(abs, tmpDir);

  const manifest = readJson(path.join(tmpDir, 'kdna.json'));
  const declared = manifest?.name;
  if (!declared || !/^@[a-z][a-z0-9-]*\/[a-z][a-z0-9_]*$/.test(declared)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    error(
      `Package kdna.json.name "${declared || '?'}" must be @scope/name format.\n` +
        `(v0.7 requires scoped names.)`,
    );
  }
  const [scopeName, ident] = declared.split('/');
  const dest = domainDir(scopeName, ident);
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  ensureDir(path.dirname(dest));
  fs.renameSync(tmpDir, dest);

  const destManifest = readJson(path.join(dest, 'kdna.json')) || {};
  destManifest._source = {
    type: 'local-file',
    path: abs,
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dest, 'kdna.json'), JSON.stringify(destManifest, null, 2) + '\n');

  console.log(`✓ Installed ${declared} from local file`);
  console.log(`  Location: ${dest}`);
}

function installFromLocalDir(dirPath, _yes) {
  const abs = path.resolve(dirPath);
  const manifest = readJson(path.join(abs, 'kdna.json'));
  const declared = manifest?.name;
  if (!declared || !/^@[a-z][a-z0-9-]*\/[a-z][a-z0-9_]*$/.test(declared)) {
    error(`Source kdna.json.name "${declared || '?'}" must be @scope/name format.`);
  }
  const [scopeName, ident] = declared.split('/');
  const dest = domainDir(scopeName, ident);
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  ensureDir(path.dirname(dest));
  fs.cpSync(abs, dest, { recursive: true });

  const destManifest = readJson(path.join(dest, 'kdna.json')) || {};
  destManifest._source = {
    type: 'local-dir',
    path: abs,
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dest, 'kdna.json'), JSON.stringify(destManifest, null, 2) + '\n');

  console.log(`✓ Installed ${declared} from local directory (dev mode)`);
  console.log(`  Location: ${dest}`);
}

// ─── Remove ─────────────────────────────────────────────────────────────

function cmdRemove(input) {
  warnLegacy();
  const parsed = parseName(input);
  if (!parsed) error(`Invalid name "${input}". Use @scope/name or bare name.`);
  const dest = domainDir(parsed.scope, parsed.ident);
  if (!fs.existsSync(dest)) {
    console.log(`${parsed.full} is not installed.`);
    return;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  console.log(`✓ Removed ${parsed.full}`);
}

// ─── Info ───────────────────────────────────────────────────────────────

function cmdInfo(input) {
  warnLegacy();
  const parsed = parseName(input);
  if (!parsed) error(`Invalid name "${input}".`);
  const dest = domainDir(parsed.scope, parsed.ident);
  if (!fs.existsSync(dest)) error(`${parsed.full} is not installed.`);

  const manifest = readJson(path.join(dest, 'kdna.json'));
  const core = readJson(path.join(dest, 'KDNA_Core.json'));
  const pat = readJson(path.join(dest, 'KDNA_Patterns.json'));
  const source = manifest?._source || {};

  // ─── Header ─────────────────────────────────────────────────────
  console.log('═'.repeat(64));
  console.log(`  ${parsed.full}`);
  console.log('═'.repeat(64));
  console.log(`  Version:           ${manifest?.version || core?.meta?.version || '?'}`);
  if (manifest?.judgment_version) {
    console.log(`  Judgment version:  ${manifest.judgment_version}`);
  }
  console.log(`  Status:            ${manifest?.status || '?'}`);
  console.log(`  License:           ${manifest?.license?.type || '?'}`);
  console.log(`  Author:            ${manifest?.author?.name || '?'}`);

  // ─── Identity & trust ──────────────────────────────────────────
  console.log('');
  console.log('  ── Identity & trust ──');
  if (manifest?.author?.pubkey) {
    console.log(`  Author pubkey:     ${manifest.author.pubkey.slice(0, 28)}…`);
  }
  if (manifest?.author?.public_key_pem) {
    console.log(`  Embedded PEM:      yes (full Ed25519 verify available)`);
  } else {
    console.log(`  Embedded PEM:      no (legacy pre-v0.7.1 package)`);
  }
  if (source.kdna_url) console.log(`  Source URL:        ${source.kdna_url}`);
  if (source.sha256) console.log(`  Source sha256:     ${source.sha256.slice(0, 32)}…`);
  console.log(`  Installed:         ${source.installed_at || '?'}`);
  console.log(`  Path:              ${dest}`);

  // ─── Judgment surface ──────────────────────────────────────────
  console.log('');
  console.log('  ── Judgment surface ──');
  const axiomCount = (core?.axioms || []).length;
  const ontologyCount = (core?.ontology || []).length;
  const stanceCount = (core?.stances || []).length;
  const misCount = (pat?.misunderstandings || []).length;
  const selfCheckCount = (pat?.self_check || []).length;
  console.log(`  Axioms:            ${axiomCount}`);
  console.log(`  Ontology:          ${ontologyCount}`);
  console.log(`  Stances:           ${stanceCount}`);
  console.log(`  Misunderstandings: ${misCount}`);
  console.log(`  Self-checks:       ${selfCheckCount}`);

  // ─── v2.1 governance score ─────────────────────────────────────
  if (axiomCount > 0) {
    const withApplies = (core?.axioms || []).filter(
      (a) => Array.isArray(a.applies_when) && a.applies_when.length,
    ).length;
    const withDoesNotApply = (core?.axioms || []).filter(
      (a) => Array.isArray(a.does_not_apply_when) && a.does_not_apply_when.length,
    ).length;
    const withFailureRisk = (core?.axioms || []).filter((a) => a.failure_risk).length;
    const pct = Math.round(
      ((withApplies + withDoesNotApply + withFailureRisk) / (axiomCount * 3)) * 100,
    );
    console.log('');
    console.log('  ── v2.1 governance ──');
    console.log(`  axioms with applies_when:      ${withApplies}/${axiomCount}`);
    console.log(`  axioms with does_not_apply:    ${withDoesNotApply}/${axiomCount}`);
    console.log(`  axioms with failure_risk:      ${withFailureRisk}/${axiomCount}`);
    console.log(`  governance coverage:           ${pct}%`);
  }

  // ─── Eval cases ────────────────────────────────────────────────
  const evalDir = path.join(dest, 'evals');
  if (fs.existsSync(evalDir)) {
    const evalFiles = fs.readdirSync(evalDir).filter((f) => f.endsWith('.json'));
    let totalCases = 0;
    for (const f of evalFiles) {
      const data = readJson(path.join(evalDir, f));
      if (data?.cases) totalCases += data.cases.length;
    }
    console.log('');
    console.log('  ── Eval cases ──');
    console.log(`  Files:             ${evalFiles.length}`);
    console.log(`  Total cases:       ${totalCases}`);
  }

  // ─── Known risks (from kdna.json or axioms) ────────────────────
  const risks = [];
  if (core?.axioms) {
    for (const a of core.axioms) {
      if (a.failure_risk) risks.push({ source: a.id, text: a.failure_risk });
    }
  }
  if (risks.length) {
    console.log('');
    console.log('  ── Known failure risks ──');
    for (const r of risks.slice(0, 4)) {
      const short = r.text.length > 110 ? r.text.slice(0, 107) + '…' : r.text;
      console.log(`  ⚠ [${r.source}]`);
      console.log(`    ${short}`);
    }
    if (risks.length > 4) console.log(`  (+ ${risks.length - 4} more — see KDNA_Core.json)`);
  }

  // ─── Files ─────────────────────────────────────────────────────
  const expected = [
    'KDNA_Core.json',
    'KDNA_Patterns.json',
    'KDNA_Scenarios.json',
    'KDNA_Cases.json',
    'KDNA_Reasoning.json',
    'KDNA_Evolution.json',
  ];
  const present = expected.filter((f) => fs.existsSync(path.join(dest, f)));
  console.log('');
  console.log(`  Files: ${present.length}/${expected.length} (${present.join(', ') || 'none'})`);

  console.log('');
  console.log(`  Run 'kdna verify ${parsed.full}' for full structure/trust/judgment scoring.`);
}

// ─── Update ─────────────────────────────────────────────────────────────

function cmdUpdate(input) {
  warnLegacy();
  const parsed = parseName(input);
  if (!parsed) error(`Invalid name "${input}".`);
  const dest = domainDir(parsed.scope, parsed.ident);
  if (!fs.existsSync(dest)) {
    console.log(`${parsed.full} not installed. Run: kdna install ${input}`);
    return;
  }
  const manifest = readJson(path.join(dest, 'kdna.json')) || {};
  const installedVersion = manifest.version || manifest._source?.version || '?';

  const resolver = new RegistryResolver({ allowNetwork: true, refresh: true });
  let entry;
  try {
    ({ entry } = resolver.resolve(parsed.full));
  } catch (e) {
    error(e.message);
  }

  if (entry.version === installedVersion) {
    console.log(`${parsed.full}@${installedVersion} is up to date.`);
    return;
  }
  console.log(`Updating ${parsed.full}: ${installedVersion} → ${entry.version}`);
  cmdInstallExtended(parsed.full, ['--yes']);
}

function cmdUpdateAll() {
  warnLegacy();
  if (!fs.existsSync(INSTALL_DIR)) {
    console.log('No installs.');
    return;
  }
  const scopes = fs.readdirSync(INSTALL_DIR).filter((d) => d.startsWith('@'));
  for (const scope of scopes) {
    const sd = path.join(INSTALL_DIR, scope);
    if (!fs.statSync(sd).isDirectory()) continue;
    for (const ident of fs.readdirSync(sd)) {
      if (ident.startsWith('.')) continue;
      try {
        cmdUpdate(`${scope}/${ident}`);
      } catch (e) {
        console.warn(`  ⚠ ${scope}/${ident}: ${e.message.split('\n')[0]}`);
      }
    }
    console.log('');
  }
}

module.exports = {
  cmdInstallExtended,
  cmdRemove,
  cmdInfo,
  cmdUpdate,
  cmdUpdateAll,
  INSTALL_DIR,
};
