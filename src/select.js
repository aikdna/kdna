#!/usr/bin/env node
/**
 * kdna select — Given a user task, automatically select the right
 * KDNA packages and assign roles (Primary / Advisor / Constraint).
 *
 * Usage: node src/cli.js select "客户说价格太高了怎么办"
 */

const fs = require('fs');
const path = require('path');
const { loadRegistry: loadCanonicalRegistry } = require('./registry');

const DOMAINS_DIR =
  process.env.KDNA_DOMAINS || path.join(process.env.HOME || '.', '.kdna', 'domains');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function loadRegistry() {
  return loadCanonicalRegistry({ allowNetwork: true });
}

function findAvailableDomains() {
  const registry = loadRegistry();
  const available = [];

  // Check installed domains first
  if (fs.existsSync(DOMAINS_DIR)) {
    for (const dir of fs.readdirSync(DOMAINS_DIR)) {
      const full = path.join(DOMAINS_DIR, dir);
      if (fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'KDNA_Core.json'))) {
        const manifest = readJson(path.join(full, 'kdna.json'));
        const core = readJson(path.join(full, 'KDNA_Core.json'));
        if (core) {
          available.push({
            id: dir,
            name: manifest?.name || core.meta?.domain || dir,
            keywords: manifest?.keywords || [],
            description: manifest?.description || core.meta?.purpose || '',
            status: manifest?.status || 'experimental',
            core_insight: manifest?.core_insight || '',
            stances: core.stances || [],
            installed: true,
          });
        }
      }
    }
  }

  // Add registry domains not yet installed
  for (const d of registry) {
    if (!available.find((a) => a.id === d.id)) {
      available.push({
        id: d.id,
        name: d.name || d.id,
        keywords: d.keywords || [],
        description: d.description || '',
        status: d.status || 'experimental',
        core_insight: d.core_insight || '',
        installed: false,
      });
    }
  }

  return available;
}

function scoreDomain(domain, input) {
  const text = input.toLowerCase();
  let score = 0;

  // #23: Task-signal mapping — action verbs that strongly indicate domain
  const taskSignals = {
    writing: [
      'write',
      'writing',
      'author',
      'draft',
      'revise',
      'edit',
      'blog post',
      'article',
      'essay',
      'copy',
    ],
    agent_safety: [
      'irreversible',
      'sandbox',
      'delete file',
      'delete database',
      'rm -rf',
      'sudo rm',
    ],
    decision_state: ['meeting', 'decision', 'decide', 'discussed', 'agreed', 'deferred'],
    content_strategy: ['audience', 'topic', 'content strategy', 'editorial'],
    prompt_diagnosis: [
      'prompt fail',
      'prompt not working',
      'bad prompt',
      'improve prompt',
      'prompt diagnosis',
    ],
    code_review: ['code review', 'pull request', 'pr review', 'review code', 'refactor'],
    knowledge_management: ['knowledge base', 'taxonomy', 'curate'],
    open_source_project: ['open source', 'adoption', 'community', 'contributors'],
    kdna_authoring: ['create kdna', 'author kdna', 'domain cognition', 'kdna domain'],
  };

  const signals = taskSignals[domain.id] || [];
  for (const signal of signals) {
    if (text.includes(signal)) score += 10;
  }

  // Keyword matching
  for (const kw of domain.keywords) {
    if (text.includes(kw.toLowerCase())) score += 5;
  }

  // Name/ID matching (boosted for exact verb matches)
  const domainWords = domain.id.toLowerCase().replace(/-/g, ' ').split(/\s+/);
  for (const w of domainWords) {
    if (w.length > 2 && text.includes(w)) score += 6;
  }

  // Description matching (low weight)
  const descWords = domain.description.toLowerCase().split(/\s+/);
  for (const word of descWords) {
    if (word.length > 3 && text.includes(word) && !word.startsWith('[todo')) score += 1;
  }

  // Core insight matching (strong signal)
  if (domain.core_insight) {
    const insightWords = domain.core_insight.toLowerCase().split(/\s+/);
    for (const word of insightWords) {
      if (word.length > 3 && text.includes(word)) score += 2;
    }
  }

  // Status boost
  if (domain.status === 'basic') score += 2;
  if (domain.status === 'stable') score += 3;

  // Installed boost
  if (domain.installed) score += 2;

  return score;
}

function detectRiskSignals(input) {
  const text = input.toLowerCase();
  const signals = [];

  const riskPatterns = [
    {
      words: ['deadline', 'urgent', 'asap', '紧急', '截止'],
      domain: 'decision_state',
      reason: 'Time pressure without clear decision state creates execution risk',
    },
    {
      words: ['delete', 'remove', 'clean up', 'organize', '删除', '清理'],
      domain: 'agent_safety',
      reason: 'File operations may be irreversible — verify authorization and backup first',
    },
    {
      words: ['just build it', 'quick fix', 'hack', 'workaround', '临时'],
      domain: 'agent_safety',
      reason: 'Quick fixes without safety checks create downstream risk',
    },
    {
      words: ['fire', 'terminate', 'let go', '开除', '解雇'],
      domain: 'agent_safety',
      reason: 'Irreversible personnel decisions require verification of authorization scope',
    },
  ];

  for (const pattern of riskPatterns) {
    if (pattern.words.some((w) => text.includes(w))) {
      signals.push(pattern);
    }
  }

  return signals;
}

function cmdSelect(input) {
  if (!input) {
    console.error('Usage: kdna select "<task description>"');
    process.exit(1);
  }

  const domains = findAvailableDomains();
  if (!domains.length) {
    console.log('No KDNA domains available. Install with: kdna install <domain>');
    return;
  }

  // Score all domains
  const scored = domains
    .map((d) => ({ domain: d, score: scoreDomain(d, input) }))
    .sort((a, b) => b.score - a.score);

  // Select primary (highest score above threshold)
  const threshold = 2;
  const qualified = scored.filter((s) => s.score >= threshold);

  if (!qualified.length) {
    console.log('No matching KDNA domain found for this task.');
    console.log('Available domains:', domains.map((d) => d.id).join(', '));
    return;
  }

  // Assign roles
  const primary = qualified[0];
  const advisors = qualified.slice(1, 4);
  const risks = detectRiskSignals(input);

  // Output
  console.log('═'.repeat(50));
  console.log(`  KDNA Selection for: "${input.substring(0, 60)}${input.length > 60 ? '...' : ''}"`);
  console.log('═'.repeat(50));
  console.log('');

  console.log(`  Primary: ${primary.domain.name} (${primary.domain.id})`);
  console.log(
    `    Score: ${primary.score} | Status: ${primary.domain.status} | ${primary.domain.installed ? 'Installed' : 'Not installed'}`,
  );
  if (primary.domain.core_insight) console.log(`    Insight: ${primary.domain.core_insight}`);
  console.log('');

  if (advisors.length) {
    console.log('  Advisors:');
    for (const a of advisors) {
      console.log(
        `    - ${a.domain.name} (score: ${a.score})${a.domain.installed ? '' : ' [not installed]'}`,
      );
    }
    console.log('');
  }

  if (risks.length) {
    console.log('  Constraints (risk signals detected):');
    for (const r of risks) {
      console.log(`    - ${r.domain}: ${r.reason}`);
    }
    console.log('');
  }

  // Loading command
  console.log('  Load command:');
  const loadCmd = primary.domain.installed
    ? `kdna-loader: load ${primary.domain.id} as primary`
    : `kdna install ${primary.domain.id} && kdna-loader: load ${primary.domain.id} as primary`;
  console.log(`    ${loadCmd}`);
  console.log('');

  // Selection rationale
  console.log('  Why this selection:');
  console.log(
    `    Matched keywords: ${primary.domain.keywords.filter((k) => input.toLowerCase().includes(k.toLowerCase())).join(', ') || '(from domain name/description match)'}`,
  );
  if (risks.length)
    console.log(
      `    Risk signals triggered: ${risks.map((r) => r.reason.split('.')[0]).join('; ')}`,
    );
  console.log('');
  console.log('═'.repeat(50));
}

module.exports = { cmdSelect, findAvailableDomains, scoreDomain };
