/**
 * KDNA Install — Multi-source domain installation.
 *
 * Sources:
 *   kdna install <domain-id>                    Registry (default)
 *   kdna install github:user/repo               GitHub repo
 *   kdna install github:user/repo@v1.2.0        GitHub repo, version pinned
 *   kdna install github:user/repo#main           GitHub repo, branch
 *   kdna install ./folder                        Local directory
 *   kdna install ./file.kdna                     Local .kdna file
 *   kdna install --from-git <url>                Raw git URL
 *
 * Commands:
 *   kdna remove <domain>                         Uninstall
 *   kdna info <domain>                           Show source/version/trust
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadRegistry } = require('./registry');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const INSTALL_DIR = path.join(USER_KDNA_DIR, 'domains');
const CLUSTERS_DIR = path.join(USER_KDNA_DIR, 'clusters');

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

function confirmStatus(domainId, status, yes) {
  if (yes || (status !== 'experimental' && status !== 'draft')) return true;
  console.log(`  Domain: ${domainId} (${status})`);
  console.log(`  This domain is ${status} — judgment quality is not yet verified.`);
  console.log(`  Use --yes to skip this check.`);
  try {
    const buf = Buffer.alloc(1);
    process.stdout.write('Continue? [y/N] ');
    fs.readSync(0, buf, 0, 1);
    const answer = buf.toString().trim().toLowerCase();
    return answer === 'y';
  } catch {
    return false;
  }
}

// ─── Parse source ──────────────────────────────────────────────────────

function parseSource(input) {
  let isCluster = false;
  let inner = input;

  // cluster:github:user/repo or cluster:domain-id
  if (input.startsWith('cluster:')) {
    isCluster = true;
    inner = input.slice(8);
  }

  // github:user/repo@version or github:user/repo#branch or github:user/repo
  const ghMatch = inner.match(/^github:([^/]+)\/([^@#]+)(?:@(.+))?(?:#(.+))?$/);
  if (ghMatch) {
    const [, user, repo, version, branch] = ghMatch;
    const cleanRepo = repo.replace(/\.git$/, '');
    return {
      type: 'github',
      url: `https://github.com/${user}/${cleanRepo}.git`,
      tarballUrl: `https://api.github.com/repos/${user}/${cleanRepo}/tarball/${version || branch || 'main'}`,
      version: version || branch || 'main',
      display: `${user}/${cleanRepo}${version ? '@' + version : branch ? '#' + branch : ''}`,
      isCluster,
    };
  }

  // Local directory
  if (inner.startsWith('./') || inner.startsWith('/') || inner.startsWith('~/')) {
    const resolved = path.resolve(inner.replace(/^~/, process.env.HOME || ''));
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return { type: 'local-dir', path: resolved, display: resolved, isCluster };
    }
    if (fs.existsSync(resolved) && resolved.endsWith('.kdna')) {
      return { type: 'local-file', path: resolved, display: resolved, isCluster };
    }
    error(`Local path not found: ${resolved}`);
  }

  // Registry short name
  if (/^[a-z][a-z0-9_-]*$/.test(inner)) {
    return { type: 'registry', id: inner, isCluster };
  }

  error(
    `Cannot parse source: "${input}". Try:\n  kdna install <domain-id>\n  kdna install github:user/repo\n  kdna install cluster:github:user/repo\n  kdna install ./folder`,
  );
}

// ─── Install ────────────────────────────────────────────────────────────

function cmdInstallExtended(input, args) {
  ensureDir(INSTALL_DIR);

  // #25: Clean up stale .tmp directories from previous failed installs
  try {
    const dirs = fs.readdirSync(INSTALL_DIR);
    for (const d of dirs) {
      if (d.endsWith('.tmp')) {
        const full = path.join(INSTALL_DIR, d);
        if (fs.statSync(full).isDirectory()) {
          fs.rmSync(full, { recursive: true, force: true });
        }
      }
    }
  } catch { /* No installed domains to scan */ }

  const yes = args && args.includes('--yes');
  const source = parseSource(input);

  switch (source.type) {
    case 'registry':
      installFromRegistry(source.id, yes);
      break;
    case 'github':
      installFromGitHub(source, yes);
      break;
    case 'local-dir':
      installFromLocalDir(source.path, yes);
      break;
    case 'local-file':
      installFromLocalFile(source.path);
      break;
  }

  // If installing a cluster, also install all referenced domains
  if (source.isCluster) {
    installClusterDomains(source);
  }
}

function installFromRegistry(domainId, yes) {
  const domains = loadRegistry({ allowNetwork: true });
  if (!domains || !domains.length) {
    error('No registry found. Run: kdna list --available');
  }

  const entry = domains.find((d) => d.id === domainId);
  if (!entry) {
    const allIds = domains.map((d) => d.id).join(', ');
    error(`Domain "${domainId}" not found in registry.\nAvailable: ${allIds}`);
  }

  if (entry.access && entry.access !== 'open') {
    error(
      `Domain "${domainId}" requires "${entry.access}" access. Only open domains can be installed via CLI.`,
    );
  }

  const status = entry.status || 'experimental';
  if (!confirmStatus(domainId, status, yes)) {
    console.log('Installation cancelled.');
    process.exit(0);
  }

  const dest = path.join(INSTALL_DIR, domainId);
  const repoUrl = entry.repo;
  const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
  const tarballUrl = repoMatch
    ? `https://api.github.com/repos/${repoMatch[1]}/${repoMatch[2]}/tarball/main`
    : null;

  installRepo(repoUrl, tarballUrl, dest, domainId);

  const manifest = readJson(path.join(dest, 'kdna.json')) || {};
  manifest._source = {
    type: 'registry',
    id: domainId,
    url: repoUrl,
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dest, 'kdna.json'), JSON.stringify(manifest, null, 2) + '\n');
}

function installFromGitHub(source, yes) {
  const domainId = source.display.replace(/[@#]/g, '-').replace(/\//g, '-');
  let dest = path.join(INSTALL_DIR, domainId);

  console.log(`Installing github:${source.display}...`);
  installRepo(source.url, source.tarballUrl, dest, domainId);

  // Resolve canonical domain name from installed kdna.json
  const manifest = readJson(path.join(dest, 'kdna.json')) || {};
  const core = readJson(path.join(dest, 'KDNA_Core.json'));
  const canonicalName = manifest.name || core?.meta?.domain;
  if (canonicalName && canonicalName !== domainId) {
    const canonicalDest = path.join(INSTALL_DIR, canonicalName);
    if (fs.existsSync(canonicalDest)) {
      fs.rmSync(canonicalDest, { recursive: true, force: true });
    }
    fs.renameSync(dest, canonicalDest);
    dest = canonicalDest;
    console.log(`  Installed as: ${canonicalName}`);
  }

  // Save source metadata
  manifest._source = {
    type: 'github',
    url: source.url,
    version: source.version,
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dest, 'kdna.json'), JSON.stringify(manifest, null, 2) + '\n');
}

function installFromLocalDir(dirPath, yes) {
  const abs = path.resolve(dirPath);
  const manifest = readJson(path.join(abs, 'kdna.json'));
  const core = readJson(path.join(abs, 'KDNA_Core.json'));

  const domainId = manifest?.name || core?.meta?.domain || path.basename(abs);

  const status = manifest?.status || 'experimental';
  if (!confirmStatus(domainId, status, yes)) {
    console.log('Installation cancelled.');
    process.exit(0);
  }

  const dest = path.join(INSTALL_DIR, domainId);

  if (fs.existsSync(dest)) {
    console.log(`Removing existing install: ${dest}`);
    fs.rmSync(dest, { recursive: true, force: true });
  }

  console.log(`Installing from ${abs}...`);
  fs.cpSync(abs, dest, { recursive: true });

  const destManifest = readJson(path.join(dest, 'kdna.json')) || {};
  destManifest._source = { type: 'local', path: abs, installed_at: new Date().toISOString() };
  fs.writeFileSync(path.join(dest, 'kdna.json'), JSON.stringify(destManifest, null, 2) + '\n');

  validateInstalledDomain(dest);
  console.log(`✓ Installed: ${domainId}`);
}

function installFromLocalFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    error(`Not a file: ${abs}`);
  }

  const domainId = path.basename(abs, '.kdna');
  const dest = path.join(INSTALL_DIR, domainId);

  if (fs.existsSync(dest)) {
    console.log(`Removing existing install: ${dest}`);
    fs.rmSync(dest, { recursive: true, force: true });
  }

  ensureDir(dest);

  // .kdna is a ZIP container — extract contents into the domain folder
  const script = `
import zipfile, os
zf = zipfile.ZipFile(${JSON.stringify(abs)}, 'r')
zf.extractall(${JSON.stringify(dest)})
zf.close()
print('ok')
`;
  try {
    execSync(`python3 -c ${JSON.stringify(script)}`, { stdio: 'pipe' });
  } catch {
    try {
      execSync(`unzip -q -o "${abs}" -d "${dest}"`, { stdio: 'pipe' });
    } catch {
      error('Cannot extract .kdna file. Install python3 or unzip command.');
    }
  }

  // Try to read domain name from extracted manifest
  const manifest = readJson(path.join(dest, 'kdna.json'));
  const core = readJson(path.join(dest, 'KDNA_Core.json'));
  const resolvedId = manifest?.name || core?.meta?.domain || domainId;

  // Rename dest if domain id differs from filename
  if (resolvedId !== domainId) {
    const newDest = path.join(INSTALL_DIR, resolvedId);
    if (fs.existsSync(newDest)) {
      fs.rmSync(newDest, { recursive: true, force: true });
    }
    fs.renameSync(dest, newDest);
  }

  const finalDest = resolvedId !== domainId ? path.join(INSTALL_DIR, resolvedId) : dest;

  // Write source metadata
  const destManifest = readJson(path.join(finalDest, 'kdna.json')) || {};
  destManifest._source = { type: 'local-file', path: abs, installed_at: new Date().toISOString() };
  fs.writeFileSync(path.join(finalDest, 'kdna.json'), JSON.stringify(destManifest, null, 2) + '\n');

  validateInstalledDomain(finalDest);
  console.log(`✓ Installed: ${resolvedId}`);
  console.log(`  Location: ${finalDest}`);
}

function installRepo(repoUrl, tarballUrl, dest, domainId) {
  if (fs.existsSync(dest)) {
    console.log(`Updating ${domainId}...`);
    // #26: Only try git pull if this is a git repository
    const isGitRepo = fs.existsSync(path.join(dest, '.git'));
    if (isGitRepo) {
      try {
        execSync(`git -C "${dest}" pull`, { stdio: 'inherit' });
        validateInstalledDomain(dest);
        return;
      } catch {
        console.log('Pull failed, re-cloning...');
        fs.rmSync(dest, { recursive: true, force: true });
      }
    } else {
      // Tarball-installed — clean re-download instead of misleading git error
      console.log('Re-installing (tarball source)...');
      fs.rmSync(dest, { recursive: true, force: true });
    }
  }

  console.log(`Cloning ${repoUrl}...`);

  // Try HTTPS clone
  try {
    execSync(`git clone --depth 1 "${repoUrl}" "${dest}"`, { stdio: 'pipe', timeout: 30000 });
    validateInstalledDomain(dest);
    return;
  } catch {
    /* HTTPS clone failed, try next strategy */
  }

  // Try SSH clone
  const sshUrl = repoUrl.replace(/https:\/\/github\.com\//, 'git@github.com:') + '.git';
  try {
    execSync(`git clone --depth 1 "${sshUrl}" "${dest}"`, { stdio: 'pipe', timeout: 30000 });
    validateInstalledDomain(dest);
    return;
  } catch {
    /* SSH clone failed, try next strategy */
  }

  // Try tarball
  if (tarballUrl) {
    console.log(`Trying tarball download...`);
    let tgz = null;
    let tmpDir = null;
    try {
      tgz = `${dest}.tar.gz`;
      tmpDir = `${dest}.tmp`;
      execSync(`curl -fsSL -o "${tgz}" "${tarballUrl}"`, { stdio: 'pipe', timeout: 60000 });
      ensureDir(tmpDir);
      execSync(`tar -xzf "${tgz}" -C "${tmpDir}"`, { stdio: 'pipe' });
      fs.unlinkSync(tgz);
      tgz = null;
      const entries = fs.readdirSync(tmpDir);
      if (entries.length === 1) {
        const wrapper = path.join(tmpDir, entries[0]);
        if (fs.statSync(wrapper).isDirectory()) fs.renameSync(wrapper, dest);
        else fs.renameSync(tmpDir, dest);
      } else {
        fs.renameSync(tmpDir, dest);
      }
      tmpDir = null;
      validateInstalledDomain(dest);
      return;
    } catch {
      // #25: Clean up temp files on failure
      try { if (tgz) fs.unlinkSync(tgz); } catch { /* cleanup may fail */ }
      try { if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* cleanup may fail */ }
    }
  }

  error(`Failed to install "${domainId}". Tried: HTTPS clone, SSH clone, tarball download.`);
}

function validateInstalledDomain(dest) {
  const core = readJson(path.join(dest, 'KDNA_Core.json'));
  if (!core) {
    console.warn(`  ⚠ No KDNA_Core.json found — this may not be a valid KDNA domain`);
  }
}

// ─── Remove ─────────────────────────────────────────────────────────────

function cmdRemove(domainId) {
  const dest = path.join(INSTALL_DIR, domainId);
  if (!fs.existsSync(dest)) {
    console.log(`Domain "${domainId}" is not installed.`);
    return;
  }

  fs.rmSync(dest, { recursive: true, force: true });
  console.log(`✓ Removed: ${domainId}`);
}

// ─── Info ───────────────────────────────────────────────────────────────

function cmdInfo(domainId) {
  const dest = path.join(INSTALL_DIR, domainId);
  if (!fs.existsSync(dest)) {
    error(`Domain "${domainId}" is not installed. Run: kdna list`);
  }

  const manifest = readJson(path.join(dest, 'kdna.json'));
  const core = readJson(path.join(dest, 'KDNA_Core.json'));
  const source = manifest?._source || {};

  console.log('═'.repeat(50));
  console.log(`  ${domainId}`);
  console.log('═'.repeat(50));
  console.log('');
  console.log(`  Version:    ${manifest?.version || core?.meta?.version || '?'}`);
  console.log(`  Status:     ${manifest?.status || '?'}`);
  console.log(`  License:    ${manifest?.license?.type || '?'}`);

  if (source.type) {
    console.log(
      `  Source:     ${source.type === 'github' ? 'github:' + source.url.replace(/\.git$/, '').replace('https://github.com/', '') + (source.version !== 'main' ? '@' + source.version : '') : source.type === 'local' ? source.path : source.type}`,
    );
    console.log(
      `  Trust:      ${source.type === 'github' ? '⚠ unverified (third-party)' : 'local'}`,
    );
  }

  console.log(`  Installed:  ${source.installed_at || 'unknown'}`);
  console.log(`  Path:       ${dest}`);
  console.log('');

  const expected = [
    'KDNA_Core.json',
    'KDNA_Patterns.json',
    'KDNA_Scenarios.json',
    'KDNA_Cases.json',
    'KDNA_Reasoning.json',
    'KDNA_Evolution.json',
  ];
  const present = expected.filter((f) => fs.existsSync(path.join(dest, f)));
  console.log(`  Files: ${present.length}/6 (${present.join(', ') || 'none'})`);
  console.log('');
}

// ─── Update ─────────────────────────────────────────────────────────────

function cmdUpdate(domainId) {
  const dest = path.join(INSTALL_DIR, domainId);
  if (!fs.existsSync(dest)) {
    console.log(`Domain "${domainId}" is not installed. Install first: kdna install ${domainId}`);
    return;
  }

  if (!fs.existsSync(path.join(dest, '.git'))) {
    console.log(`Cannot update "${domainId}" — not installed from git.`);
    return;
  }

  try {
    console.log(`Updating ${domainId}...`);
    execSync(`git -C "${dest}" pull`, { stdio: 'inherit' });
    console.log(`✓ Updated: ${domainId}`);
  } catch {
    console.log(
      `Update failed. Try reinstalling: kdna remove ${domainId} && kdna install ${domainId}`,
    );
  }
}

// ─── Update all ─────────────────────────────────────────────────────────

function cmdUpdateAll() {
  const entries = fs.existsSync(INSTALL_DIR)
    ? fs.readdirSync(INSTALL_DIR).filter((d) => {
        const full = path.join(INSTALL_DIR, d);
        return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, '.git'));
      })
    : [];

  if (entries.length === 0) {
    console.log('No installed domains to update.');
    return;
  }

  for (const domainId of entries) {
    cmdUpdate(domainId);
    console.log('');
  }
}

// ─── Cluster domain installation ───────────────────────────────────────

function installClusterDomains(source) {
  // Find the cluster.json in the installed directory
  let clusterDir;
  let clusterId;

  switch (source.type) {
    case 'github':
      clusterId = source.url.split('/').pop().replace('.git', '');
      clusterDir = path.join(CLUSTERS_DIR, clusterId);
      break;
    case 'registry':
      clusterId = source.id;
      clusterDir = path.join(CLUSTERS_DIR, clusterId);
      break;
    case 'local-dir':
      clusterId = path.basename(source.path);
      clusterDir = path.join(CLUSTERS_DIR, clusterId);
      break;
    default:
      return;
  }

  let clusterFile = path.join(clusterDir, 'cluster.json');
  if (!fs.existsSync(clusterFile)) {
    // Also check the installed domain directory (clusters installed as domains)
    const altFile = path.join(INSTALL_DIR, clusterId, 'cluster.json');
    if (fs.existsSync(altFile)) {
      clusterFile = altFile;
    } else {
      return;
    }
  }

  const cluster = readJson(clusterFile);
  if (!cluster || !Array.isArray(cluster.packages)) return;

  console.log('');
  console.log(`Installing ${cluster.packages.length} domains from cluster...`);

  for (const pkg of cluster.packages) {
    const domainId = pkg.id || pkg;
    if (typeof domainId !== 'string') continue;

    const domainDir = path.join(INSTALL_DIR, domainId);
    if (fs.existsSync(domainDir)) {
      console.log(`  ✓ ${domainId} (already installed)`);
      continue;
    }

    // Try registry first, then github
    try {
      cmdInstallExtended(domainId, ['--yes']);
    } catch {
      console.log(`  ⚠ ${domainId}: install failed`);
    }
  }
}

module.exports = { cmdInstallExtended, cmdRemove, cmdInfo, cmdUpdate, cmdUpdateAll };
