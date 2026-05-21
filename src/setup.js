#!/usr/bin/env node
/**
 * kdna setup — One-command KDNA installation.
 *
 * Detects the user's AI agent, installs kdna-loader + kdna-create skills,
 * creates directory structure, and initializes the local registry.
 * Zero domains are installed by default.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const DOMAINS_DIR = path.join(USER_KDNA_DIR, 'domains');
const CLUSTERS_DIR = path.join(USER_KDNA_DIR, 'clusters');
const SKILLS_REPO = 'https://raw.githubusercontent.com/knowledge-dna/kdna-skills/main';

const AGENTS = [
  {
    name: 'OpenCode',
    dir: path.join(process.env.HOME, '.agents'),
    skillsDir: 'skills',
    dataDir: 'Kdna',
  },
  {
    name: 'Codex',
    dir: path.join(process.env.HOME, '.codex'),
    skillsDir: 'skills',
    dataDir: 'Kdna',
  },
  {
    name: 'Claude Code',
    dir: path.join(process.env.HOME, '.claude'),
    skillsDir: 'skills',
    dataDir: 'Kdna',
  },
  {
    name: 'Cursor',
    dir: path.join(process.env.HOME, '.cursor'),
    skillsDir: 'skills',
    dataDir: 'Kdna',
  },
  {
    name: 'GitHub Copilot',
    dir: path.join(process.env.HOME, '.agents'),
    skillsDir: 'skills',
    dataDir: 'Kdna',
  },
];

function log(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}
function warn(msg) {
  console.log(`\x1b[33m⚠\x1b[0m ${msg}`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function detectAgents() {
  return AGENTS.filter((a) => fs.existsSync(a.dir));
}

async function downloadSkill(agent, skillName) {
  const skillDir = path.join(agent.dir, agent.skillsDir, skillName);
  ensureDir(skillDir);

  const url = `${SKILLS_REPO}/${skillName}/SKILL.md`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const content = await res.text();
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
    return true;
  } catch {
    // Fallback: copy from local if available
    const localPath = path.join(__dirname, '..', '..', 'kdna-skills', skillName, 'SKILL.md');
    if (fs.existsSync(localPath)) {
      fs.copyFileSync(localPath, path.join(skillDir, 'SKILL.md'));
      return true;
    }
    return false;
  }
}

async function cmdSetup() {
  console.log('');
  console.log('KDNA Setup');
  console.log('═'.repeat(40));
  console.log('');

  // 1. CLI version
  const pkg = require(path.join(__dirname, '..', 'package.json'));
  log(`KDNA CLI v${pkg.version}`);

  // 2. Detect agents
  const detected = detectAgents();

  if (!detected.length) {
    warn('No supported AI agents detected.');
    console.log('  Supported: OpenCode (~/.agents), Codex (~/.codex),');
    console.log('  Claude Code (~/.claude), Cursor (~/.cursor)');
    console.log('');
    console.log('  Manual setup:');
    console.log('    mkdir -p ~/.codex/skills/kdna-loader');
    console.log('    curl -o ~/.codex/skills/kdna-loader/SKILL.md \\');
    console.log(`      ${SKILLS_REPO}/kdna-loader/SKILL.md`);
    console.log('');
  } else {
    log(`Detected: ${detected.map((a) => a.name).join(', ')}`);

    // 3. Install skills for each agent
    for (const agent of detected) {
      const loaderOk = await downloadSkill(agent, 'kdna-loader');
      const createOk = await downloadSkill(agent, 'kdna-create');

      if (loaderOk && createOk) {
        log(`kdna-loader + kdna-create → ${agent.name}`);
      } else {
        warn(`Failed to install skills for ${agent.name}`);
      }

      // Create data directory
      const dataDir = path.join(agent.dir, agent.dataDir);
      ensureDir(dataDir);
    }
  }

  // 4. KDNA data root
  ensureDir(DOMAINS_DIR);
  ensureDir(CLUSTERS_DIR);
  log(`KDNA data root: ${USER_KDNA_DIR}/`);

  // 5. Initialize local registry
  const registryFile = path.join(USER_KDNA_DIR, 'registry.json');
  if (!fs.existsSync(registryFile)) {
    const registry = {
      version: '0.5',
      root: USER_KDNA_DIR,
      domains: [],
    };
    fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2) + '\n');
    log('Registry initialized');
  }

  console.log('');
  console.log('KDNA is ready. Next:');
  console.log('');
  console.log('  1. Add domains:      kdna install writing');
  console.log('  2. Or create:         ask your agent "create a KDNA for my domain"');
  console.log('  3. Browse available:  kdna list --available');
  console.log('');
}

module.exports = { cmdSetup, detectAgents };
