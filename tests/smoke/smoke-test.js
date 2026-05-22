/**
 * Smoke test for 6 first-wave KDNA domains.
 * Verifies:
 *  1. All 6 domains load without errors
 *  2. formatContext produces domain-specific output (not generic)
 *  3. Same input + different domain = different context
 *  4. Keyword matching triggers correct domain
 *  5. Core + Patterns + optional files all parse
 *
 * Usage: node tests/smoke/smoke-test.js
 * Requires: KDNA repo root as working directory, 6 domains in /Users/AI/K/kdna-*
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { loadDomain, formatContext } = require('../../src/loader');

const DOMAINS = [
  { id: 'writing', path: '/Users/AI/K/kdna-writing' },
  { id: 'knowledge_management', path: '/Users/AI/K/kdna-knowledge_management' },
  { id: 'prompt_diagnosis', path: '/Users/AI/K/kdna-prompt_diagnosis' },
  { id: 'agent_safety', path: '/Users/AI/K/kdna-agent_safety' },
  { id: 'open_source_project', path: '/Users/AI/K/kdna-open_source_project' },
  { id: 'content_strategy', path: '/Users/AI/K/kdna-content_strategy' },
];

// Sample inputs that should trigger each domain
const SAMPLES = {
  writing: 'Review this article I wrote about remote work. It got zero shares.',
  knowledge_management: 'I have 500 notes in Obsidian about leadership. Is my knowledge base good?',
  prompt_diagnosis: 'I keep improving this prompt but the output is still wrong. Why?',
  agent_safety: 'Help me organize my project — clean up and remove anything unnecessary.',
  open_source_project: 'Why does my open source project have only 12 stars after 6 months?',
  content_strategy: 'Give me content ideas for my newsletter about productivity.',
};

describe('Smoke — First-Wave Domains', () => {
  describe('1. All domains load successfully', () => {
    for (const d of DOMAINS) {
      it(`loads ${d.id}`, () => {
        const result = loadDomain(d.path, { mode: 'all' });
        assert.ok(result, `${d.id} should load`);
        assert.ok(result.core, `${d.id} should have core`);
        assert.ok(result.patterns, `${d.id} should have patterns`);
        assert.strictEqual(result.core.meta.domain, d.id, `${d.id} meta.domain mismatch`);
      });
    }
  });

  describe('2. All domains have 6 files', () => {
    for (const d of DOMAINS) {
      it(`${d.id} has all 6 KDNA files`, () => {
        const result = loadDomain(d.path, { mode: 'all' });
        assert.ok(result.scenarios, `${d.id} missing scenarios`);
        assert.ok(result.cases, `${d.id} missing cases`);
        assert.ok(result.reasoning, `${d.id} missing reasoning`);
        assert.ok(result.evolution, `${d.id} missing evolution`);
      });
    }
  });

  describe('3. Axioms are domain-specific (not slogan)', () => {
    const SLOGANS = [
      'is important',
      'matters',
      'is key',
      'is the key',
      'is essential',
      'be helpful',
    ];

    for (const d of DOMAINS) {
      it(`${d.id} axioms pass anti-slogan check`, () => {
        const result = loadDomain(d.path, { mode: 'all' });
        for (const axiom of result.core.axioms) {
          const text = axiom.one_sentence.toLowerCase();
          const isSlogan = SLOGANS.some((s) => text.includes(s)) && text.length < 50;
          assert.ok(!isSlogan, `${d.id}: slogan axiom detected: "${axiom.one_sentence}"`);
        }
      });
    }
  });

  describe('4. Stances are prescriptive (not truisms)', () => {
    const TRUISMS = ['be honest', 'be helpful', 'be clear', 'be professional'];

    for (const d of DOMAINS) {
      it(`${d.id} stances pass anti-truism check`, () => {
        const result = loadDomain(d.path, { mode: 'all' });
        for (const stance of result.core.stances) {
          const text = stance.toLowerCase();
          const isTruism = TRUISMS.some((t) => text.includes(t)) && text.length < 60;
          assert.ok(!isTruism, `${d.id}: truism stance detected: "${stance}"`);
        }
      });
    }
  });

  describe('5. Banned terms have why + replace_with', () => {
    for (const d of DOMAINS) {
      it(`${d.id} banned terms are complete`, () => {
        const result = loadDomain(d.path, { mode: 'all' });
        const terms = result.patterns.terminology.banned_terms;
        assert.ok(terms.length >= 2, `${d.id}: need at least 2 banned terms`);
        for (const t of terms) {
          assert.ok(t.why && t.why.length > 10, `${d.id}: banned term "${t.term}" has weak why`);
          assert.ok(
            t.replace_with && t.replace_with.length > 5,
            `${d.id}: banned term "${t.term}" missing replace_with`,
          );
        }
      });
    }
  });

  describe('6. Self-checks are yes/no and domain-specific', () => {
    const GENERIC = [
      'is this helpful',
      'is this good',
      'is this clear',
      'is this correct',
      'did i follow',
    ];

    for (const d of DOMAINS) {
      it(`${d.id} self-checks pass anti-generic check`, () => {
        const result = loadDomain(d.path, { mode: 'all' });
        for (const check of result.patterns.self_check) {
          const text = check.toLowerCase();
          const isGeneric = GENERIC.some((g) => text.includes(g)) && text.length < 30;
          assert.ok(!isGeneric, `${d.id}: generic self-check: "${check}"`);
        }
      });
    }
  });

  describe('7. formatContext produces unique output per domain', () => {
    it('same input produces different context for each domain', () => {
      const input = 'Give me feedback on this';
      const contexts = new Set();

      for (const d of DOMAINS) {
        const result = loadDomain(d.path, { input, mode: 'auto' });
        const ctx = formatContext(result);
        assert.ok(ctx.length > 100, `${d.id}: context too short (${ctx.length} chars)`);
        contexts.add(ctx.substring(0, 200));
      }

      // Each domain should produce meaningfully different context
      // At least 5 of 6 should be unique in the first 200 chars
      assert.ok(contexts.size >= 5, `Only ${contexts.size}/6 domains produce unique context`);
    });
  });

  describe('8. Domain-specific input triggers correct domain keywords', () => {
    it('writing input triggers writing domain', () => {
      const result = loadDomain(DOMAINS[0].path, { input: SAMPLES.writing, mode: 'auto' });
      const ctx = formatContext(result);
      assert.ok(ctx.includes('writing'), 'Context should mention writing domain');
      assert.ok(
        ctx.includes('argument') || ctx.includes('hook') || ctx.includes('structural'),
        'Context should include writing-specific terms',
      );
    });

    it('agent_safety input triggers safety-related content', () => {
      const result = loadDomain(DOMAINS[3].path, { input: SAMPLES.agent_safety, mode: 'auto' });
      const ctx = formatContext(result);
      assert.ok(
        ctx.includes('agent_safety') || ctx.includes('safety'),
        'Context should mention safety',
      );
      assert.ok(
        ctx.includes('irreversible') || ctx.includes('authorization') || ctx.includes('backup'),
        'Context should include safety-specific terms',
      );
    });

    it('knowledge_management input triggers KM content', () => {
      const result = loadDomain(DOMAINS[1].path, {
        input: SAMPLES.knowledge_management,
        mode: 'auto',
      });
      const ctx = formatContext(result);
      assert.ok(
        ctx.includes('knowledge_management') || ctx.includes('knowledge'),
        'Context should mention knowledge management',
      );
      assert.ok(
        ctx.includes('raw material') ||
          ctx.includes('knowledge asset') ||
          ctx.includes('proposition'),
        'Context should include KM-specific terms',
      );
    });
  });

  describe('9. No domain produces empty or error context', () => {
    for (const d of DOMAINS) {
      it(`${d.id} formatContext is non-empty and valid`, () => {
        const result = loadDomain(d.path, { mode: 'minimum' });
        const ctx = formatContext(result);
        assert.ok(ctx && ctx.length > 50, `${d.id}: minimum context too short`);
        assert.ok(!ctx.includes('undefined'), `${d.id}: context contains undefined`);
        assert.ok(!ctx.includes('null'), `${d.id}: context contains null`);
      });
    }
  });

  describe('10. Optional files load conditionally', () => {
    it('scenarios load when input mentions situation', () => {
      const result = loadDomain(DOMAINS[0].path, {
        input: 'I have a situation where my content failed',
        mode: 'auto',
      });
      assert.ok(result.scenarios, 'scenarios should load for situation input');
    });

    it('reasoning loads when input asks why', () => {
      const result = loadDomain(DOMAINS[0].path, {
        input: 'Why does my writing fail?',
        mode: 'auto',
      });
      assert.ok(result.reasoning, 'reasoning should load for why input');
    });

    it('cases load when input asks for example', () => {
      const result = loadDomain(DOMAINS[0].path, {
        input: 'Show me an example of good writing feedback',
        mode: 'auto',
      });
      assert.ok(result.cases, 'cases should load for example input');
    });
  });
});
