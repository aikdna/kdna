/**
 * Project-level KDNA config.
 *
 * Files (checked in priority order):
 *   ./.kdna/config.json
 *   ./kdna.config.json
 *
 * Schema:
 *   {
 *     "kdna": {
 *       "domains": ["@aikdna/writing", "@aikdna/agent_safety"],
 *       "mode": "auto" | "manual",
 *       "conflict_policy": "surface" | "first_wins"
 *     }
 *   }
 *
 * The loader skill (kdna-loader) reads this when entering a repo
 * and pre-loads the listed domains.
 */

const fs = require('fs');
const path = require('path');

function findProjectConfig(startDir) {
  let dir = path.resolve(startDir || process.cwd());
  const root = path.parse(dir).root;
  while (true) {
    const candidates = [
      path.join(dir, '.kdna', 'config.json'),
      path.join(dir, 'kdna.config.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try { return { path: p, content: JSON.parse(fs.readFileSync(p, 'utf8')) }; }
        catch (e) { return { path: p, error: e.message }; }
      }
    }
    if (dir === root) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function cmdProjectInfo() {
  const found = findProjectConfig();
  if (!found) {
    console.log('No project-level KDNA config found.');
    console.log('');
    console.log('To create one at the current directory:');
    console.log('');
    console.log('  mkdir -p .kdna && cat > .kdna/config.json <<EOF');
    console.log('{');
    console.log('  "kdna": {');
    console.log('    "domains": ["@aikdna/writing"],');
    console.log('    "mode": "auto",');
    console.log('    "conflict_policy": "surface"');
    console.log('  }');
    console.log('}');
    console.log('EOF');
    return;
  }
  if (found.error) {
    console.error(`Found ${found.path} but could not parse: ${found.error}`);
    process.exit(1);
  }

  const cfg = found.content?.kdna || {};
  console.log('═'.repeat(60));
  console.log('  Project KDNA config');
  console.log('═'.repeat(60));
  console.log(`  Path:               ${found.path}`);
  console.log(`  Mode:               ${cfg.mode || 'manual'}`);
  console.log(`  Conflict policy:    ${cfg.conflict_policy || 'surface'}`);
  console.log(`  Pinned domains:     ${(cfg.domains || []).length}`);
  for (const d of cfg.domains || []) {
    console.log(`    - ${d}`);
  }
  console.log('');
  console.log('  The kdna-loader skill reads this when an agent enters this repo.');
}

function cmdProjectInit(domains) {
  const dir = path.join(process.cwd(), '.kdna');
  const file = path.join(dir, 'config.json');
  if (fs.existsSync(file)) {
    console.error(`Already exists: ${file}`);
    console.error('Edit it directly, or delete and re-init.');
    process.exit(1);
  }
  fs.mkdirSync(dir, { recursive: true });
  const cfg = {
    kdna: {
      domains: domains.length ? domains : ['@aikdna/writing'],
      mode: 'auto',
      conflict_policy: 'surface',
    },
  };
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`✓ Created ${file}`);
  console.log('');
  console.log('  Pinned domains:');
  for (const d of cfg.kdna.domains) console.log(`    - ${d}`);
  console.log('');
  console.log('  Agents using the kdna-loader skill will auto-load these');
  console.log('  when working in this repo.');
}

module.exports = { findProjectConfig, cmdProjectInfo, cmdProjectInit };
