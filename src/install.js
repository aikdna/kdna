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

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const INSTALL_DIR = path.join(USER_KDNA_DIR, 'domains');
const REGISTRY_CACHE = path.join(USER_KDNA_DIR, 'registry', 'domains.json');

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

// ─── Parse source ──────────────────────────────────────────────────────

function parseSource(input) {
  // github:user/repo@version or github:user/repo#branch or github:user/repo
  const ghMatch = input.match(/^github:([^/]+)\/([^@#]+)(?:@(.+))?(?:#(.+))?$/);
  if (ghMatch) {
    const [, user, repo, version, branch] = ghMatch;
    const cleanRepo = repo.replace(/\.git$/, '');
    return {
      type: 'github',
      url: `https://github.com/${user}/${cleanRepo}.git`,
      tarballUrl: `https://api.github.com/repos/${user}/${cleanRepo}/tarball/${version || branch || 'main'}`,
      version: version || branch || 'main',
      display: `${user}/${cleanRepo}${version ? '@' + version : branch ? '#' + branch : ''}`,
    };
  }

  // Local directory
  if (input.startsWith('./') || input.startsWith('/') || input.startsWith('~/')) {
    const resolved = path.resolve(input.replace(/^~/, process.env.HOME || ''));
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return { type: 'local-dir', path: resolved, display: resolved };
    }
    if (fs.existsSync(resolved) && resolved.endsWith('.kdna')) {
      return { type: 'local-file', path: resolved, display: resolved };
    }
    error(`Local path not found: ${resolved}`);
  }

  // Registry short name
  if (/^[a-z][a-z0-9_-]*$/.test(input)) {
    return { type: 'registry', id: input };
  }

  error(
    `Cannot parse source: "${input}". Try:\n  kdna install <domain-id>\n  kdna install github:user/repo\n  kdna install ./folder`,
  );
}

// ─── Install ────────────────────────────────────────────────────────────

function cmdInstallExtended(input) {
  ensureDir(INSTALL_DIR);

  const source = parseSource(input);

  switch (source.type) {
    case 'registry':
      installFromRegistry(source.id);
      break;
    case 'github':
      installFromGitHub(source);
      break;
    case 'local-dir':
      installFromLocalDir(source.path);
      break;
    case 'local-file':
      installFromLocalFile(source.path);
      break;
  }
}

function installFromRegistry(domainId) {
  const domains = readJson(REGISTRY_CACHE);
  if (!domains || !domains.length) {
    error('No registry found. Run: kdna list --available');
  }

  const entry = Array.isArray(domains)
    ? domains.find((d) => d.id === domainId)
    : domains.domains?.find((d) => d.id === domainId);
  if (!entry) {
    const allIds = (Array.isArray(domains) ? domains : domains.domains || [])
      .map((d) => d.id)
      .join(', ');
    error(`Domain "${domainId}" not found in registry.\nAvailable: ${allIds}`);
  }

  if (entry.access && entry.access !== 'open') {
    error(
      `Domain "${domainId}" requires "${entry.access}" access. Only open domains can be installed via CLI.`,
    );
  }

  const dest = path.join(INSTALL_DIR, domainId);
  const repoUrl = entry.repo;
  const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
  const tarballUrl = repoMatch
    ? `https://api.github.com/repos/${repoMatch[1]}/${repoMatch[2]}/tarball/main`
    : null;

  installRepo(repoUrl, tarballUrl, dest, domainId);
}

function installFromGitHub(source) {
  const domainId = source.display.replace(/[@#]/g, '-').replace(/\//g, '-');
  const dest = path.join(INSTALL_DIR, domainId);

  console.log(`Installing github:${source.display}...`);
  installRepo(source.url, source.tarballUrl, dest, domainId);

  // Save source metadata
  const manifest = readJson(path.join(dest, 'kdna.json')) || {};
  manifest._source = {
    type: 'github',
    url: source.url,
    version: source.version,
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dest, 'kdna.json'), JSON.stringify(manifest, null, 2) + '\n');
}

function installFromLocalDir(dirPath) {
  const abs = path.resolve(dirPath);
  const manifest = readJson(path.join(abs, 'kdna.json'));
  const core = readJson(path.join(abs, 'KDNA_Core.json'));

  const domainId = manifest?.name || core?.meta?.domain || path.basename(abs);
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
  const raw = fs.readFileSync(abs, 'utf8');
  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    // Try simple YAML subset
    const lines = raw.split('\n');
    data = {};
    for (const line of lines) {
      const m = line.match(/^([a-z_]+):\s*(.*)/i);
      if (m) data[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }

  const domainId = data?.meta?.domain || data?.domain || path.basename(abs, '.kdna');
  const dest = path.join(INSTALL_DIR, domainId);

  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }

  ensureDir(dest);
  fs.writeFileSync(path.join(dest, path.basename(abs)), raw);

  console.log(`✓ Installed .kdna file: ${domainId}`);
  console.log(`  Location: ${dest}`);
  console.log(`  Note: .kdna single file — run kdna inspect ${dest} to view`);
}

function installRepo(repoUrl, tarballUrl, dest, domainId) {
  if (fs.existsSync(dest)) {
    console.log(`Updating ${domainId}...`);
    try {
      execSync(`git -C "${dest}" pull`, { stdio: 'inherit' });
      validateInstalledDomain(dest);
      return;
    } catch {
      console.log('Pull failed, re-cloning...');
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
    try {
      const tgz = `${dest}.tar.gz`;
      execSync(`curl -fsSL -o "${tgz}" "${tarballUrl}"`, { stdio: 'pipe', timeout: 60000 });
      const tmp = `${dest}.tmp`;
      ensureDir(tmp);
      execSync(`tar -xzf "${tgz}" -C "${tmp}"`, { stdio: 'pipe' });
      fs.unlinkSync(tgz);
      const entries = fs.readdirSync(tmp);
      if (entries.length === 1) {
        const wrapper = path.join(tmp, entries[0]);
        if (fs.statSync(wrapper).isDirectory()) fs.renameSync(wrapper, dest);
        else fs.renameSync(tmp, dest);
      } else {
        fs.renameSync(tmp, dest);
      }
      validateInstalledDomain(dest);
      return;
    } catch {
      /* Tarball strategy failed */
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

module.exports = { cmdInstallExtended, cmdRemove, cmdInfo, cmdUpdate, cmdUpdateAll };
