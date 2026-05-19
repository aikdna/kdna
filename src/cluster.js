/**
 * KDNA Cluster — Composable judgment system operations.
 *
 * Commands:
 *   cluster lint <path>     Validate cluster manifest
 *   cluster apply <path> [input]  Simulate cluster routing
 */

const fs = require('fs');
const path = require('path');

function error(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// ─── Lint ──────────────────────────────────────────────────────────────

function cmdClusterLint(clusterPath) {
  const abs = path.resolve(clusterPath);
  if (!fs.existsSync(abs)) error(`Cluster file not found: ${abs}`);

  const cluster = readJson(abs);
  if (!cluster) error('Invalid JSON');
  if (!cluster.name) error('Missing cluster name');
  if (!cluster.version) error('Missing cluster version');
  if (!cluster.packages || !Array.isArray(cluster.packages)) error('Missing packages array');
  if (cluster.packages.length < 2) error('Cluster must have ≥2 packages');

  let warnings = 0;
  let errors = 0;

  // Check each package
  const roles = ['primary', 'advisor', 'constraint', 'critic'];
  let primaryCount = 0;

  for (const pkg of cluster.packages) {
    if (!pkg.id) {
      console.error(`  ✗ Package missing id`);
      errors++;
      continue;
    }
    if (!pkg.role) {
      console.error(`  ✗ ${pkg.id}: missing role`);
      errors++;
      continue;
    }
    if (!roles.includes(pkg.role)) {
      console.error(`  ✗ ${pkg.id}: invalid role "${pkg.role}" (must be: ${roles.join(', ')})`);
      errors++;
    }
    if (pkg.role === 'primary') primaryCount++;
    if (!pkg.use_when || !Array.isArray(pkg.use_when) || pkg.use_when.length === 0) {
      console.warn(`  ⚠ ${pkg.id}: no use_when conditions (will never be auto-selected)`);
      warnings++;
    }
  }

  if (primaryCount === 0) {
    console.error(`  ✗ No primary package defined (exactly one required)`);
    errors++;
  } else if (primaryCount > 1) {
    console.warn(`  ⚠ ${primaryCount} primary packages (typically exactly one)`);
    warnings++;
  }

  // Check composition rules
  if (!cluster.composition_rules || cluster.composition_rules.length === 0) {
    console.warn(`  ⚠ No composition rules defined`);
    warnings++;
  }

  // Check routing questions
  if (!cluster.routing_questions || cluster.routing_questions.length === 0) {
    console.warn(`  ⚠ No routing questions defined`);
    warnings++;
  }

  // Check for duplicate package ids
  const ids = cluster.packages.map((p) => p.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    for (const d of [...new Set(dupes)]) {
      console.error(`  ✗ Duplicate package id: "${d}"`);
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`\n  ${errors} error(s), ${warnings} warning(s)`);
    process.exit(1);
  }

  console.log(`✓ KDNA Cluster valid: ${cluster.name} v${cluster.version}`);
  console.log(
    `  Packages: ${cluster.packages.length} (${primaryCount} primary, ${cluster.packages.filter((p) => p.role === 'advisor').length} advisor, ${cluster.packages.filter((p) => p.role === 'constraint').length} constraint, ${cluster.packages.filter((p) => p.role === 'critic').length} critic)`,
  );
  console.log(`  Rules: ${cluster.composition_rules?.length || 0}`);
  console.log(`  Routing questions: ${cluster.routing_questions?.length || 0}`);
  if (warnings > 0) console.log(`  ${warnings} warning(s)`);
}

// ─── Apply ─────────────────────────────────────────────────────────────

function cmdClusterApply(clusterPath, input) {
  const abs = path.resolve(clusterPath);
  if (!fs.existsSync(abs)) error(`Cluster file not found: ${abs}`);

  const cluster = readJson(abs);
  if (!cluster || !cluster.packages) error('Invalid cluster file');

  // Use input from argument, or from stdin, or prompt
  let taskInput = input;
  if (!taskInput) {
    // Try reading from stdin if not a TTY
    if (!process.stdin.isTTY) {
      taskInput = fs.readFileSync(0, 'utf8').trim();
    }
    if (!taskInput) {
      console.log('Enter task description (Ctrl+D when done):');
      taskInput = fs.readFileSync(0, 'utf8').trim();
    }
  }

  if (!taskInput) {
    error('No input provided. Usage: kdna cluster apply <path> "<task description>"');
  }

  const inputLower = taskInput.toLowerCase();

  // Select primary: best-matching package by use_when keyword overlap
  const primaryCandidates = cluster.packages.filter((p) => p.role === 'primary');
  const advisorCandidates = cluster.packages.filter((p) => p.role === 'advisor');
  const constraintCandidates = cluster.packages.filter((p) => p.role === 'constraint');

  function matchScore(pkg) {
    if (!pkg.use_when) return 0;
    let score = 0;
    for (const kw of pkg.use_when) {
      if (inputLower.includes(kw.toLowerCase())) score++;
    }
    return score;
  }

  // Pick primary with highest keyword match
  const scored = primaryCandidates.map((p) => ({ pkg: p, score: matchScore(p) }));
  scored.sort((a, b) => b.score - a.score);
  const primary = scored[0]?.pkg || primaryCandidates[0];

  // Pick advisors that match (max 3, score > 0)
  const advisors = advisorCandidates
    .map((p) => ({ pkg: p, score: matchScore(p) }))
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((a) => a.pkg);

  // Load constraints that match (always active if triggered)
  const constraints = constraintCandidates
    .map((p) => ({ pkg: p, score: matchScore(p) }))
    .filter((c) => c.score > 0)
    .map((c) => c.pkg);

  // Output
  console.log('═'.repeat(60));
  console.log(`  Cluster: ${cluster.name} v${cluster.version}`);
  console.log('═'.repeat(60));
  console.log('');
  console.log(`  Task: ${taskInput.length > 80 ? taskInput.slice(0, 80) + '...' : taskInput}`);
  console.log('');

  console.log('  ── Selected Packages ──');
  console.log('');
  console.log(`  Primary:  ${primary.id} (${primary.role})`);
  if (primary.use_when) {
    const matched = primary.use_when.filter((kw) => inputLower.includes(kw.toLowerCase()));
    console.log(
      `    Matched: ${matched.length > 0 ? matched.join(', ') : '(fallback — no keyword match)'}`,
    );
  }

  if (advisors.length > 0) {
    console.log('');
    console.log(`  Advisors (${advisors.length}):`);
    for (const a of advisors) {
      const matched = (a.use_when || []).filter((kw) => inputLower.includes(kw.toLowerCase()));
      console.log(`    • ${a.id} — matched: ${matched.join(', ')}`);
    }
  }

  if (constraints.length > 0) {
    console.log('');
    console.log(`  Constraints (${constraints.length}):`);
    for (const c of constraints) {
      const matched = (c.use_when || []).filter((kw) => inputLower.includes(kw.toLowerCase()));
      console.log(`    • ${c.id} — triggered by: ${matched.join(', ')}`);
    }
  }

  if (advisors.length === 0 && constraints.length === 0) {
    console.log('');
    console.log('  No advisors or constraints matched. Only primary loaded.');
  }

  console.log('');
  console.log('  ── Composition Rules ──');
  if (cluster.composition_rules) {
    for (const rule of cluster.composition_rules) {
      console.log(`    • ${rule}`);
    }
  }

  console.log('');
  console.log('  ── Routing Questions (to refine selection) ──');
  if (cluster.routing_questions) {
    for (const q of cluster.routing_questions) {
      console.log(`    ? ${q}`);
    }
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log(`  Total packages to load: ${1 + advisors.length + constraints.length}`);
  console.log('═'.repeat(60));
}

module.exports = { cmdClusterLint, cmdClusterApply };
