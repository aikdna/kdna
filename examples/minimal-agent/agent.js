#!/usr/bin/env node
/**
 * minimal-agent — The simplest possible KDNA demo.
 *
 * Usage:
 *   node examples/minimal-agent/agent.js
 *
 * This demo shows the same user input processed three ways:
 *   1. Generic AI (no KDNA)
 *   2. sales KDNA (price objection → certainty diagnosis)
 *   3. management KDNA (execution failure → upstream diagnosis)
 *
 * It does NOT use an LLM. It simulates judgment paths to prove that
 * KDNA changes reasoning trajectories before a single word is generated.
 */

const { loadDomain, formatContext } = require('../../src/loader');

const TEST_INPUTS = [
  {
    input: "The client keeps saying our price is too high.",
    domains: ['sales', 'management'],
  },
  {
    input: "My team lead keeps missing every deadline I set.",
    domains: ['management', 'sales'],
  },
  {
    input: "The team missed another deadline despite clear instructions.",
    domains: ['management', 'sales'],
  },
];
const DOMAIN_DIRS = {
  sales: __dirname + '/../sales',
  management: __dirname + '/../management',
};

console.log('='.repeat(70));
console.log('  KDNA Minimal Agent Demo');
console.log('  Proving: KDNA changes reasoning trajectories, not wording');
console.log('='.repeat(70));

for (const { input, domains } of TEST_INPUTS) {
  console.log('\n' + '─'.repeat(70));
  console.log(`\n  USER INPUT: "${input}"\n`);

  console.log('  ── GENERIC AGENT (no KDNA) ──');
  console.log('  Response: Provide generic advice based on surface-level');
  console.log('  interpretation of the words as stated. No domain-specific');
  console.log('  judgment framework is available.\n');

  for (const domain of domains) {
    const loaded = loadDomain(DOMAIN_DIRS[domain], { mode: 'all' });
    if (!loaded) {
      console.log(`  ── ${domain.toUpperCase()} KDNA ── (domain load failed)`);
      continue;
    }

    console.log(`  ── ${domain.toUpperCase()} KDNA ──`);
    const ctx = formatContext(loaded);
    const lines = ctx.split('\n');

    // Show key insight: the first misunderstanding and first axiom
    let axiomFound = false;
    let misunderstandingFound = false;
    let stanceFound = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!stanceFound && line.startsWith('### Stances')) {
        stanceFound = true;
        console.log('  [STANCE] ' + lines[i + 1].replace(/^- /, ''));
      }

      if (!axiomFound && line.startsWith('- **')) {
        axiomFound = true;
        console.log('  [AXIOM]  ' + line.replace(/^- \*\*/, '').replace(/\*\* /, ': '));
        if (lines[i + 1] && lines[i + 1].startsWith('  *Why:*')) {
          console.log('           ' + lines[i + 1].replace(/^\s+\*Why:\*\s*/, 'Why: '));
        }
      }

      if (!misunderstandingFound && line.startsWith('- **Wrong:**')) {
        misunderstandingFound = true;
        console.log('  [CAUGHT MISUNDERSTANDING]');
        console.log('    Wrong:   ' + line.replace(/^- \*\*Wrong:\*\* /, ''));
        if (lines[i + 1]) {
          console.log('    Correct: ' + lines[i + 1].replace(/^\s+\*\*Correct:\*\* /, ''));
        }
      }

      if (stanceFound && axiomFound && misunderstandingFound) break;
    }

    if (!misunderstandingFound) {
      console.log('  (no relevant misunderstanding pattern loaded)');
    }
  }
}

console.log('\n' + '='.repeat(70));
console.log('  KEY INSIGHT:');
console.log('  The same input produces completely different cognitive analyses');
console.log('  depending on which KDNA domain is loaded. KDNA changes what the');
console.log('  agent considers, questions, and rules out — before generating');
console.log('  any output.');
console.log('');
console.log('  This is NOT prompt engineering. This is cognition encoding.');
console.log('='.repeat(70));
