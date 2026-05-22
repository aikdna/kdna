/**
 * Agent-facing commands — what the kdna-loader skill calls.
 *
 *   kdna available --json
 *     List installed domains, lean JSON, includes v2.1 applies_when fields
 *     and yanked status. Excludes yanked. ~200 bytes per domain.
 *     The agent uses this as its primary discovery source and decides
 *     which domain (if any) fits the task by reading the applies_when
 *     and does_not_apply_when fields against the task in its own words.
 *
 *   kdna match "<task>" [--json]
 *     Auxiliary signal — does NOT decide which domain to use. Returns:
 *       - dropped: domains whose does_not_apply_when clearly matches the
 *         task (hard disqualification — agent should respect)
 *       - hints: substring overlap signals per domain (weak — agent should
 *         not treat as a fit decision; many false positives expected)
 *     The agent makes the final call using its own language understanding.
 *
 *   kdna load <name> [--as=prompt|json|raw]
 *     Read the domain's Core + Patterns and emit:
 *       --as=prompt (default): compact text suitable for system-prompt
 *                              injection (axioms one-liners + stances +
 *                              banned-terms + misunderstandings + self-checks)
 *       --as=json:  raw JSON of Core + Patterns
 *       --as=raw:   concatenated raw file contents
 *
 * These commands are the supported interface between the kdna-loader
 * skill and the KDNA file format. The skill should not parse JSON
 * directly.
 */

const fs = require('fs');
const path = require('path');
const { parseName } = require('./registry');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const INSTALL_DIR = path.join(USER_KDNA_DIR, 'domains');

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function listInstalled() {
  if (!fs.existsSync(INSTALL_DIR)) return [];
  const out = [];
  for (const scopeName of fs.readdirSync(INSTALL_DIR)) {
    if (!scopeName.startsWith('@')) continue;
    const scopeDir = path.join(INSTALL_DIR, scopeName);
    try {
      if (!fs.statSync(scopeDir).isDirectory()) continue;
      for (const ident of fs.readdirSync(scopeDir)) {
        if (ident.startsWith('.')) continue;
        const dir = path.join(scopeDir, ident);
        if (!fs.statSync(dir).isDirectory()) continue;
        out.push({ scope: scopeName, ident, dir, full: `${scopeName}/${ident}` });
      }
    } catch {
      /* skip */
    }
  }
  return out;
}

// ─── kdna available ────────────────────────────────────────────────────

function cmdAvailable(args = []) {
  const wantJson = args.includes('--json');
  const installed = listInstalled();

  const out = [];
  for (const e of installed) {
    const manifest = readJson(path.join(e.dir, 'kdna.json')) || {};
    if (manifest.yanked === true) continue;

    const core = readJson(path.join(e.dir, 'KDNA_Core.json')) || {};

    // Pull applies_when across all axioms (this is what the agent needs
    // for fit-check). Collapsing per-axiom into one set makes the agent's
    // matching decision much cheaper.
    const applies_when = [];
    const does_not_apply_when = [];
    const failure_risks = [];
    for (const a of core.axioms || []) {
      if (Array.isArray(a.applies_when)) applies_when.push(...a.applies_when);
      if (Array.isArray(a.does_not_apply_when)) does_not_apply_when.push(...a.does_not_apply_when);
      if (a.failure_risk) failure_risks.push(a.failure_risk);
    }

    out.push({
      name: manifest.name || e.full,
      version: manifest.version || null,
      judgment_version: manifest.judgment_version || null,
      status: manifest.status || 'experimental',
      description: manifest.description || '',
      core_insight: manifest.core_insight || '',
      keywords: manifest.keywords || [],
      applies_when,
      does_not_apply_when,
      failure_risks,
    });
  }

  if (wantJson) {
    const result = out.length
      ? out
      : {
          count: 0,
          domains: [],
          note: 'No domains installed. Run: kdna install <name>   See: kdna list --available',
        };
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  // Human format
  if (!out.length) {
    console.log('No KDNA domains installed.');
    console.log('Install with: kdna install <name>');
    return;
  }
  console.log(`${out.length} installed KDNA domain(s):`);
  for (const d of out) {
    console.log('');
    console.log(`  ${d.name}  v${d.version || '?'}  [${d.status}]`);
    if (d.description) console.log(`    ${d.description}`);
    if (d.applies_when.length) {
      console.log(`    applies when: ${d.applies_when.length} situations declared`);
    }
    if (d.does_not_apply_when.length) {
      console.log(`    does NOT apply when: ${d.does_not_apply_when.length} situations declared`);
    }
  }
}

// ─── kdna match ────────────────────────────────────────────────────────

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9_一-鿿]+/g)
    .filter(Boolean);
}

function overlapScore(taskTokens, declaredText) {
  if (!declaredText) return { hits: 0, coverage: 0 };
  const declaredTokens = tokenize(declaredText);
  if (!declaredTokens.length) return { hits: 0, coverage: 0 };
  const dSet = new Set(declaredTokens);
  let hits = 0;
  for (const t of taskTokens) if (dSet.has(t)) hits++;
  const coverage = taskTokens.length ? hits / taskTokens.length : 0;
  return { hits, coverage };
}

// Minimum signal strength to report a hint (avoid noise from single-word matches)
const MIN_HITS = 2;
const MIN_COVERAGE = 0.15;

function domainRelevanceScore(taskTokens, domain) {
  let score = 0;
  const sources = [
    (domain.description || '').toLowerCase(),
    (domain.core_insight || '').toLowerCase(),
    (domain.keywords || []).join(' ').toLowerCase(),
  ];
  for (const source of sources) {
    const tokens = tokenize(source);
    const srcSet = new Set(tokens);
    for (const t of taskTokens) {
      if (srcSet.has(t)) score += 2;
    }
  }
  return score;
}

function cmdMatch(taskText, args = []) {
  const wantJson = args.includes('--json');
  if (!taskText) {
    console.error('Usage: kdna match "<task description>" [--json]');
    process.exit(2);
  }
  const taskTokens = tokenize(taskText);
  const installed = listInstalled();

  const dropped = [];
  const hints = [];

  for (const e of installed) {
    const manifest = readJson(path.join(e.dir, 'kdna.json')) || {};
    if (manifest.yanked === true) {
      dropped.push({ name: manifest.name || e.full, reason: 'yanked' });
      continue;
    }
    const core = readJson(path.join(e.dir, 'KDNA_Core.json')) || {};

    // does_not_apply_when disqualification (HARD signal)
    let disqualified = null;
    for (const a of core.axioms || []) {
      for (const d of a.does_not_apply_when || []) {
        const score = overlapScore(taskTokens, d);
        if (score.hits >= 2) {
          disqualified = { axiom: a.id, text: d };
          break;
        }
      }
      if (disqualified) break;
    }
    if (disqualified) {
      dropped.push({
        name: manifest.name || e.full,
        reason: `does_not_apply_when matched on ${disqualified.axiom}`,
        evidence: disqualified.text.slice(0, 120),
      });
      continue;
    }

    // applies_when hint signals (WEAK — for context only, not a decision)
    const signals = [];
    for (const a of core.axioms || []) {
      for (const ap of a.applies_when || []) {
        const score = overlapScore(taskTokens, ap);
        if (score.hits >= MIN_HITS || score.coverage >= MIN_COVERAGE) {
          signals.push({
            source: `${a.id}.applies_when`,
            hits: score.hits,
            coverage: score.coverage,
            text: ap.slice(0, 120),
          });
        }
      }
    }

    // Domain-level relevance: check description, core_insight, keywords
    const domainRelevance = domainRelevanceScore(taskTokens, manifest);

    if (signals.length || domainRelevance >= 2) {
      hints.push({
        name: manifest.name || e.full,
        description: manifest.description || '',
        status: manifest.status || 'experimental',
        domain_relevance: domainRelevance,
        top_signals: signals.sort((a, b) => b.hits - a.hits).slice(0, 3),
      });
    }
  }

  // Sort hints by combined relevance (applies_when hits + domain relevance)
  hints.sort((a, b) => {
    const aScore = a.top_signals.reduce((s, sig) => s + sig.hits, 0) + (a.domain_relevance || 0);
    const bScore = b.top_signals.reduce((s, sig) => s + sig.hits, 0) + (b.domain_relevance || 0);
    return bScore - aScore;
  });

  const result = {
    task: taskText.slice(0, 200),
    dropped,
    hints,
    no_strong_matches: hints.length === 0,
    note:
      'These are surface keyword signals only — many false positives are normal. ' +
      "The agent must read each candidate domain's description + applies_when " +
      'in full and decide using language understanding. dropped is a hard signal: ' +
      'do not load any domain in dropped.',
  };

  if (wantJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  // Human format — make it clear this is hint not decision
  console.log(`Task: ${taskText.slice(0, 100)}${taskText.length > 100 ? '…' : ''}`);
  console.log('');
  console.log(`This is a HINT report. The agent makes the final fit decision`);
  console.log(`by reading each candidate's full description and applies_when.`);
  console.log('');

  if (dropped.length) {
    console.log(`Dropped (does_not_apply_when matched — do NOT load these):`);
    for (const d of dropped) {
      console.log(`  ✗ ${d.name}: ${d.reason}`);
      if (d.evidence) console.log(`    "${d.evidence}"`);
    }
    console.log('');
  }

  if (!hints.length) {
    console.log('No strong keyword matches from installed domains.');
    console.log('This means one of:');
    console.log('  - No KDNA domain fits this task yet');
    console.log('  - The fit is by meaning, not by word overlap');
    console.log('  - The matching domain is not installed');
    console.log('');
    console.log('Run: kdna available  to see what is installed and decide.');
    console.log('See the registry: kdna search "<query>"  (searches all published domains)');
  } else {
    console.log(`Keyword hints (${hints.length} domains had some token overlap):`);
    for (const h of hints) {
      console.log(`  ${h.name}  [${h.status}]`);
      console.log(`    ${h.description}`);
      const relevanceIndicator =
        h.domain_relevance >= 2
          ? ` (domain relevance: ${'★'.repeat(Math.min(h.domain_relevance, 5))})`
          : '';
      if (relevanceIndicator) console.log(relevanceIndicator);
      for (const s of h.top_signals) {
        const pct = Math.round((s.coverage || 0) * 100);
        console.log(`    ↳ ${s.source} (${s.hits} hits, ${pct}% coverage): ${s.text}`);
      }
    }
    console.log('');
    console.log('To consider any of these, read its full data: kdna load <name> --as=json');
  }
}

// ─── kdna load ─────────────────────────────────────────────────────────

function cmdLoad(input, args = []) {
  const formatIdx = args.findIndex((a) => a.startsWith('--as'));
  let format = 'prompt';
  if (formatIdx >= 0) {
    const eq = args[formatIdx].indexOf('=');
    format = eq > 0 ? args[formatIdx].slice(eq + 1) : args[formatIdx + 1];
  }

  const parsed = parseName(input);
  if (!parsed) {
    console.error(`Invalid name "${input}". Use @scope/name or bare name.`);
    process.exit(2);
  }
  const dir = path.join(INSTALL_DIR, parsed.scope, parsed.ident);
  if (!fs.existsSync(dir)) {
    console.error(`${parsed.full} is not installed. Run: kdna install ${input}`);
    process.exit(2);
  }

  const manifest = readJson(path.join(dir, 'kdna.json')) || {};
  if (manifest.yanked === true) {
    console.error(`${parsed.full}@${manifest.version} has been yanked.`);
    if (manifest.replaced_by) console.error(`Try: ${manifest.replaced_by}`);
    process.exit(2);
  }
  const core = readJson(path.join(dir, 'KDNA_Core.json')) || {};
  const pat = readJson(path.join(dir, 'KDNA_Patterns.json')) || {};

  if (format === 'json') {
    process.stdout.write(JSON.stringify({ manifest, core, patterns: pat }, null, 2) + '\n');
    return;
  }

  if (format === 'raw') {
    for (const f of ['KDNA_Core.json', 'KDNA_Patterns.json']) {
      const p = path.join(dir, f);
      if (fs.existsSync(p)) {
        process.stdout.write(`\n=== ${f} ===\n`);
        process.stdout.write(fs.readFileSync(p, 'utf8'));
      }
    }
    return;
  }

  // Default: --as=prompt — compact text optimized for system-prompt injection.
  // Goal: minimum token cost while preserving all judgment surface.
  const lines = [];
  lines.push(`# KDNA loaded: ${manifest.name || parsed.full}`);
  if (manifest.judgment_version) lines.push(`# judgment_version: ${manifest.judgment_version}`);
  if (manifest.core_insight) lines.push(`# core insight: ${manifest.core_insight}`);
  lines.push('');

  if (core.axioms?.length) {
    lines.push('## Axioms (reason from these)');
    for (const a of core.axioms) {
      lines.push(`- ${a.one_sentence}`);
      if (a.applies_when?.length) {
        lines.push(`  APPLIES WHEN: ${a.applies_when.join('; ')}`);
      }
      if (a.does_not_apply_when?.length) {
        lines.push(`  DOES NOT APPLY WHEN: ${a.does_not_apply_when.join('; ')}`);
      }
      if (a.failure_risk) lines.push(`  RISK IF MISAPPLIED: ${a.failure_risk}`);
    }
    lines.push('');
  }

  if (core.stances?.length) {
    lines.push('## Stances');
    for (const s of core.stances) {
      const text = typeof s === 'string' ? s : s.stance;
      if (text) lines.push(`- ${text}`);
    }
    lines.push('');
  }

  if (pat.terminology?.banned_terms?.length) {
    lines.push('## Banned terms (do not use even if user uses them)');
    for (const t of pat.terminology.banned_terms) {
      const term = typeof t === 'string' ? t : t.term;
      const replace = typeof t === 'object' ? t.replace_with : null;
      lines.push(`- "${term}"${replace ? ` → use: ${replace}` : ''}`);
    }
    lines.push('');
  }

  if (pat.misunderstandings?.length) {
    lines.push('## Misunderstandings to detect and avoid');
    for (const m of pat.misunderstandings) {
      lines.push(`- WRONG: ${m.wrong}`);
      lines.push(`  CORRECT: ${m.correct}`);
      if (m.failure_risk) lines.push(`  RISK: ${m.failure_risk}`);
    }
    lines.push('');
  }

  if (pat.self_check?.length) {
    lines.push('## Self-checks (answer before final output)');
    for (const q of pat.self_check) {
      const text = typeof q === 'string' ? q : q.question;
      if (text) lines.push(`- ${text}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('Apply silently. Do not quote KDNA to the user. Do not say "according to KDNA".');
  lines.push('User intent + evidence always override KDNA axioms.');

  process.stdout.write(lines.join('\n') + '\n');
}

module.exports = { cmdAvailable, cmdMatch, cmdLoad };
