const fs = require('fs');
const path = require('path');
const { error, readJson } = require('./_common');
const {
  loadCluster,
  classifySignalsAcrossDomains,
  composeContextWithAttribution,
  detectDomainConflicts,
  generateClusterTrace,
} = require('@aikdna/kdna-core');

function cmdCluster(args) {
  const { cmdClusterLint } = require('../cluster');
  const sub = args[1];
  const target = args[2];

  if (sub === 'lint') {
    if (!target) error('Usage: kdna cluster lint <path>');
    cmdClusterLint(target);
  } else if (sub === 'init') {
    const { cmdClusterInit } = require('../init');
    cmdClusterInit(target);
  } else if (sub === 'info') {
    if (!target) error('Usage: kdna cluster info <path>');
    cmdClusterInfo(target);
  } else if (sub === 'load') {
    if (!target) error('Usage: kdna cluster load <cluster.json> --input "<task>"');
    cmdClusterLoad(target, args);
  } else if (sub === 'match') {
    if (!target) error('Usage: kdna cluster match <cluster.json> --input "<task>"');
    cmdClusterMatch(target, args);
  } else if (sub === 'apply') {
    error(
      'kdna cluster apply was removed in v0.9.\n' +
        'To install a cluster (which installs all its sub-domains):\n' +
        '  kdna install @aikdna/animation',
    );
  } else {
    error(
      `Unknown cluster subcommand: ${sub || '(none)'}\n` +
        'Usage: kdna cluster lint <path>\n' +
        '       kdna cluster init <name>\n' +
        '       kdna cluster info <cluster.json>\n' +
        '       kdna cluster match <cluster.json> --input "<task>"\n' +
        '       kdna cluster load <cluster.json> --input "<task>"',
    );
  }
}

function cmdClusterInfo(target, format = 'human') {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) error(`Cluster manifest not found: ${abs}`);

  const manifest = readJson(abs);
  if (!manifest) error(`Invalid cluster manifest (not valid JSON)`);
  if (!manifest.cluster_id) error(`Not a valid cluster manifest (missing cluster_id)`);

  const domainCount = (manifest.domains || []).length;
  const requiredCount = (manifest.domains || []).filter((d) => d.required !== false).length;
  const composition = manifest.composition || {};

  console.log(`${manifest.name || manifest.cluster_id}`);
  console.log(`  Cluster ID:       ${manifest.cluster_id}`);
  console.log(`  Version:          ${manifest.version || '?'}`);
  console.log(`  Type:             ${manifest.type || 'horizontal'}`);
  console.log(`  Status:           ${manifest.status || 'experimental'}`);
  console.log(`  Domains:          ${domainCount} total, ${requiredCount} required`);
  console.log(`  Strategy:         ${composition.strategy || 'fixed'}`);
  console.log(`  Max active:       ${composition.max_active_domains || 'unlimited'}`);
  console.log(`  Conflict policy:  ${composition.conflict_policy || 'surface'}`);
  console.log('');

  if (manifest.domains?.length) {
    console.log('  Domain inventory:');
    for (const d of manifest.domains) {
      const req = d.required !== false ? '(required)' : '(optional)';
      console.log(`    ${d.role.padEnd(16)} ${d.id} ${req}`);
    }
    console.log('');
  }

  if (manifest.relationships?.length) {
    console.log('  Relationships:');
    for (const r of manifest.relationships) {
      console.log(`    ${r.from} --${r.type}--> ${r.to}`);
    }
    console.log('');
  }
}

/**
 * Load a cluster: resolve domains from installed ~/.kdna/domains/,
 * classify input signals, compose context with attribution, detect
 * conflicts, and emit the composed context.
 */
function cmdClusterLoad(target, args = []) {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) error(`Cluster manifest not found: ${abs}`);

  const inputIdx = args.indexOf('--input');
  const input = inputIdx >= 0 ? args[inputIdx + 1] : '';
  if (!input) error('Usage: kdna cluster load <cluster.json> --input "<task>"');

  const manifest = readJson(abs);
  if (!manifest || !manifest.cluster_id) error('Not a valid cluster manifest');

  const INSTALL_DIR = path.join(
    process.env.HOME || process.env.USERPROFILE || '.',
    '.kdna',
    'domains',
  );

  // Domain loader: resolve from installed ~/.kdna/domains/
  const domainLoader = (domainId) => {
    const [scope, ident] = domainId.startsWith('@')
      ? [domainId.slice(0, domainId.indexOf('/')), domainId.slice(domainId.indexOf('/') + 1)]
      : ['@aikdna', domainId];
    const dir = path.join(INSTALL_DIR, scope, ident);
    const core = readJson(path.join(dir, 'KDNA_Core.json'));
    const pat = readJson(path.join(dir, 'KDNA_Patterns.json'));
    if (!core || !pat) return null;
    return { core, patterns: pat };
  };

  const result = loadCluster(abs, domainLoader);
  if (result.errors.length) {
    console.error('Warnings:');
    result.errors.forEach((e) => console.error(`  - ${e}`));
  }

  // Classify signals
  const classification = classifySignalsAcrossDomains(input, result.domains);

  console.log(`Cluster: ${manifest.cluster_id}`);
  console.log(`Input:   ${input.slice(0, 100)}${input.length > 100 ? '...' : ''}`);
  console.log('');

  if (classification.excluded.length) {
    console.log(`Excluded domains (${classification.excluded.length}):`);
    classification.excluded.forEach((d) => {
      console.log(`  - ${d.id} (${d.reason})`);
    });
    console.log('');
  }

  if (!classification.selected.length) {
    console.log('No domains matched. Try a different input or check domain trigger_signals.');
    return;
  }

  console.log(`Selected domains (${classification.selected.length}):`);
  classification.selected.forEach((d) => {
    console.log(`  + ${d.id} (${d.role}) ← ${d.reason}`);
  });
  console.log('');

  // Detect conflicts
  const conflicts = detectDomainConflicts(classification.selected);
  if (conflicts.length) {
    console.log(`Conflicts detected (${conflicts.length}):`);
    conflicts.forEach((c) => {
      console.log(`  ⚠ [${c.type}] ${c.domains.join(' vs ')}: ${c.description}`);
    });
    console.log('');
  }

  // Compose context with attribution
  const { context } = composeContextWithAttribution(classification.selected);
  console.log('─'.repeat(64));
  console.log(context);
  console.log('─'.repeat(64));

  // Judgment trace
  const trace = generateClusterTrace({
    input,
    loadedDomains: result.domains,
    activeDomains: classification.selected,
    conflicts,
  });
  console.log('');
  console.log('Judgment trace:');
  console.log(JSON.stringify(trace, null, 2));
}

/**
 * Match input against cluster domains without composing full context.
 */
function cmdClusterMatch(target, args = []) {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) error(`Cluster manifest not found: ${abs}`);

  const inputIdx = args.indexOf('--input');
  const input = inputIdx >= 0 ? args[inputIdx + 1] : '';
  if (!input) error('Usage: kdna cluster match <cluster.json> --input "<task>"');

  const manifest = readJson(abs);
  if (!manifest || !manifest.cluster_id) error('Not a valid cluster manifest');

  const INSTALL_DIR = path.join(
    process.env.HOME || process.env.USERPROFILE || '.',
    '.kdna',
    'domains',
  );

  const domainLoader = (domainId) => {
    const [scope, ident] = domainId.startsWith('@')
      ? [domainId.slice(0, domainId.indexOf('/')), domainId.slice(domainId.indexOf('/') + 1)]
      : ['@aikdna', domainId];
    const dir = path.join(INSTALL_DIR, scope, ident);
    const core = readJson(path.join(dir, 'KDNA_Core.json'));
    const pat = readJson(path.join(dir, 'KDNA_Patterns.json'));
    if (!core || !pat) return null;
    return { core, patterns: pat };
  };

  const result = loadCluster(abs, domainLoader);
  const classification = classifySignalsAcrossDomains(input, result.domains);

  console.log(`Input: ${input.slice(0, 100)}${input.length > 100 ? '...' : ''}`);
  console.log(`Cluster: ${manifest.cluster_id} (${result.domains.length} domains loaded)`);
  console.log('');
  console.log(
    `Matched: ${classification.selected.length} | Excluded: ${classification.excluded.length}`,
  );
  console.log('');

  classification.selected.forEach((d) => {
    console.log(`  ✓ ${d.id} [${d.role}]`);
  });
  classification.excluded.forEach((d) => {
    console.log(`  ✗ ${d.id}: ${d.reason}`);
  });
}

module.exports = { cmdCluster };
