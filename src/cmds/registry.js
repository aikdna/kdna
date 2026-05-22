const fs = require('fs');
const path = require('path');
const { CANONICAL_REGISTRY_URL, REGISTRY_CACHE, fetchRegistry } = require('../registry');
const { error, readJson, loadRegistry, INSTALL_DIR } = require('./_common');

function cmdList(showAvailable) {
  if (showAvailable) {
    const domains = loadRegistry({ allowNetwork: true });
    if (!domains || !domains.length) {
      error('No registry found.');
    }

    console.log('Available KDNA domains:');
    console.log(`Registry: ${REGISTRY_CACHE}`);
    console.log('');
    for (const d of domains) {
      const name = d.name || d.id || '?';
      const [scope, ident] = name.includes('/') ? name.split('/') : [null, name];
      const installedPath = scope ? path.join(INSTALL_DIR, scope, ident) : null;
      const installed = installedPath && fs.existsSync(installedPath) ? '[installed]' : '';
      const yanked = d.yanked ? '[yanked] ' : '';
      const dep = d.deprecated ? '[deprecated] ' : '';
      console.log(
        `  ${name.padEnd(36)} ${(d.version || '?').padEnd(8)} ${(d.type || 'domain').padEnd(8)} ${(d.status || '').padEnd(14)} ${yanked}${dep}${installed}`,
      );
      if (d.description) console.log(`    ${d.description}`);
      console.log('');
    }
    return;
  }

  if (!fs.existsSync(INSTALL_DIR)) {
    console.log('No domains installed.');
    console.log(`Installation directory: ${INSTALL_DIR}`);
    return;
  }

  // v0.7 layout: ~/.kdna/domains/@scope/name/
  const scopes = fs.readdirSync(INSTALL_DIR).filter((d) => {
    if (!d.startsWith('@')) return false;
    try {
      return fs.statSync(path.join(INSTALL_DIR, d)).isDirectory();
    } catch {
      return false;
    }
  });

  const installed = [];
  for (const scope of scopes) {
    const sd = path.join(INSTALL_DIR, scope);
    for (const ident of fs.readdirSync(sd)) {
      if (ident.startsWith('.')) continue;
      const full = path.join(sd, ident);
      try {
        if (!fs.statSync(full).isDirectory()) continue;
      } catch {
        continue;
      }
      installed.push({ scope, ident, full });
    }
  }

  // Detect and warn about legacy (un-scoped) installs
  const legacy = fs.readdirSync(INSTALL_DIR).filter((d) => {
    if (d.startsWith('@') || d.startsWith('.')) return false;
    try {
      return fs.statSync(path.join(INSTALL_DIR, d)).isDirectory();
    } catch {
      return false;
    }
  });
  if (legacy.length) {
    console.log('⚠ Legacy (un-scoped) directories detected — please remove + re-install:');
    legacy.forEach((d) => console.log(`    ~/.kdna/domains/${d}/`));
    console.log('');
  }

  if (!installed.length) {
    console.log('No v0.7 domains installed.');
    console.log(`Run: kdna install <name>      # e.g. kdna install writing`);
    return;
  }

  console.log('Installed KDNA domains:');
  console.log('');
  for (const { scope, ident, full } of installed) {
    const core = readJson(path.join(full, 'KDNA_Core.json'));
    const manifest = readJson(path.join(full, 'kdna.json'));
    const cluster = readJson(path.join(full, 'cluster.json'));
    const name = `${scope}/${ident}`;
    const version = manifest?.version || manifest?._source?.version || core?.meta?.version || '?';
    const kind = cluster ? '[cluster]' : '';
    const desc = manifest?.description || core?.meta?.purpose || '';
    console.log(`  ${name.padEnd(36)} v${version} ${kind}`);
    if (desc) console.log(`    ${desc}`);
  }
  console.log('');
  console.log(`Location: ${INSTALL_DIR}`);
}

function cmdRegistry(subcommand) {
  if (subcommand !== 'refresh') {
    error('Usage: kdna registry refresh');
  }
  const domains = fetchRegistry();
  console.log(`✓ Registry refreshed from ${CANONICAL_REGISTRY_URL}`);
  console.log(`  Cache: ${REGISTRY_CACHE}`);
  console.log(`  Domains: ${domains.length}`);
}

module.exports = {
  cmdList,
  cmdRegistry,
};
