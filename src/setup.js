#!/usr/bin/env node
/**
 * kdna setup — One-command KDNA installation.
 *
 * Detects the user's AI agent, installs the kdna-loader skill (the only
 * KDNA skill), creates the data directory, and initializes the local
 * registry cache. Zero domains are installed by default — domains are
 * a separate `kdna install <name>` action.
 *
 * The kdna-loader skill teaches the agent how to discover and use KDNA
 * domains via the kdna CLI's available/match/load commands. Domains
 * themselves are not skills.
 */

const fs = require('fs');
const path = require('path');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const DOMAINS_DIR = path.join(USER_KDNA_DIR, 'domains');
const CLUSTERS_DIR = path.join(USER_KDNA_DIR, 'clusters');
const SKILLS_REPO = 'https://raw.githubusercontent.com/knowledge-dna/kdna-skills/main';

const AGENTS = [
  {
    name: 'OpenCode',
    dir: path.join(process.env.HOME || '', '.agents'),
    skillsDir: 'skills',
  },
  {
    name: 'Codex',
    dir: path.join(process.env.HOME || '', '.codex'),
    skillsDir: 'skills',
  },
  {
    name: 'Claude Code',
    dir: path.join(process.env.HOME || '', '.claude'),
    skillsDir: 'skills',
  },
  {
    name: 'Cursor',
    dir: path.join(process.env.HOME || '', '.cursor'),
    skillsDir: 'skills',
  },
  {
    name: 'Gemini Antigravity',
    dir: path.join(process.env.HOME || '', '.gemini', 'antigravity'),
    skillsDir: 'skills',
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

// v2.1 marker — written into SKILL.md so we can detect outdated copies
const V2_1_MARKER = 'kdna available';

async function downloadSkill(agent) {
  const skillDir = path.join(agent.dir, agent.skillsDir, 'kdna-loader');
  ensureDir(skillDir);
  const dest = path.join(skillDir, 'SKILL.md');

  // 1. Try remote (source of truth)
  try {
    const res = await fetch(`${SKILLS_REPO}/kdna-loader/SKILL.md`);
    if (res.ok) {
      const content = await res.text();
      if (content.includes(V2_1_MARKER)) {
        fs.writeFileSync(dest, content);
        return { ok: true, source: 'remote' };
      }
    }
  } catch {
    /* network failure — try fallback */
  }

  // 2. Fall back to bundled copy (works offline)
  const local = path.join(__dirname, '..', 'skills', 'kdna-loader', 'SKILL.md');
  if (fs.existsSync(local)) {
    fs.copyFileSync(local, dest);
    return { ok: true, source: 'bundled fallback' };
  }

  return { ok: false };
}

function cleanLegacySkills(agent) {
  // Pre-v0.9 we also installed kdna-create. Remove any stale copy.
  const legacy = path.join(agent.dir, agent.skillsDir, 'kdna-create');
  if (fs.existsSync(legacy)) {
    try {
      fs.rmSync(legacy, { recursive: true, force: true });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function cmdSetup() {
  console.log('');
  console.log('KDNA Setup');
  console.log('═'.repeat(40));
  console.log('');

  // 1. CLI version
  const pkg = require(path.join(__dirname, '..', 'package.json'));
  log(`KDNA CLI v${pkg.version}`);

  // 2. KDNA data root
  ensureDir(DOMAINS_DIR);
  ensureDir(CLUSTERS_DIR);
  log(`Data root: ${USER_KDNA_DIR}/`);

  // 2b. Clean legacy (un-scoped) domain directories from pre-v0.7
  if (fs.existsSync(DOMAINS_DIR)) {
    const legacy = fs.readdirSync(DOMAINS_DIR).filter((e) => {
      if (e.startsWith('@') || e.startsWith('.')) return false;
      try {
        return fs.statSync(path.join(DOMAINS_DIR, e)).isDirectory();
      } catch {
        return false;
      }
    });
    if (legacy.length) {
      console.log('');
      warn(
        `Removing ${legacy.length} legacy (un-scoped) domain director${legacy.length > 1 ? 'ies' : 'y'}:`,
      );
      for (const d of legacy) {
        const dPath = path.join(DOMAINS_DIR, d);
        try {
          fs.rmSync(dPath, { recursive: true, force: true });
          log(`  removed ~/.kdna/domains/${d}/`);
        } catch (e) {
          warn(`  could not remove ~/.kdna/domains/${d}/ — ${e.message}`);
          console.log(`    To remove manually:  rm -rf ~/.kdna/domains/${d}/`);
        }
      }
      console.log('  Re-install with: kdna install @aikdna/<name>');
      console.log('');
    }
  }

  // 3. Detect agents
  const detected = detectAgents();

  if (!detected.length) {
    warn('No supported AI agents detected.');
    console.log('  Supported: OpenCode (~/.agents), Codex (~/.codex),');
    console.log('  Claude Code (~/.claude), Cursor (~/.cursor),');
    console.log('  Gemini Antigravity (~/.gemini/antigravity)');
    console.log('');
    console.log('  When you install one, re-run: kdna setup');
    console.log('');
  } else {
    log(`Detected agents: ${detected.map((a) => a.name).join(', ')}`);

    for (const agent of detected) {
      const result = await downloadSkill(agent);
      if (result.ok) {
        log(`kdna-loader → ${agent.name}  (${result.source})`);
      } else {
        warn(`Failed to install kdna-loader for ${agent.name}`);
      }
      if (cleanLegacySkills(agent)) {
        log(`removed legacy kdna-create from ${agent.name}`);
      }
    }
  }

  console.log('');
  console.log('Setup complete. KDNA is ready.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Install a domain:    kdna install @aikdna/writing');
  console.log('  2. Verify it:           kdna verify @aikdna/writing');
  console.log('  3. Browse the registry: kdna list --available');
  console.log('  4. In your agent, ask any judgment-related question.');
  console.log('     The kdna-loader skill will discover installed domains');
  console.log('     and apply them silently when relevant.');
  console.log('');
}

module.exports = { cmdSetup, detectAgents };
