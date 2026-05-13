const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const { loadDomain, loadCorePatterns, classifyInput, formatContext } = require('../src/loader');

const EXAMPLES = path.join(__dirname, '..', 'examples');

describe('Loader', () => {
  describe('loadCorePatterns', () => {
    it('loads Core + Patterns from a valid domain', () => {
      const result = loadCorePatterns(path.join(EXAMPLES, 'communication'));
      assert.ok(result);
      assert.ok(result.core);
      assert.ok(result.patterns);
      assert.strictEqual(result.core.meta.domain, 'communication');
      assert.strictEqual(result.patterns.meta.domain, 'communication');
    });

    it('returns null for a nonexistent domain', () => {
      const result = loadCorePatterns(path.join(EXAMPLES, 'nonexistent'));
      assert.strictEqual(result, null);
    });

    it('loads code_review domain', () => {
      const result = loadCorePatterns(path.join(EXAMPLES, 'from-wiki-to-kdna', 'kdna'));
      assert.ok(result);
      assert.strictEqual(result.core.meta.domain, 'code_review');
    });

    it('loads Chinese product_decision domain', () => {
      const result = loadCorePatterns(path.join(EXAMPLES, 'product_decision'));
      assert.ok(result);
      assert.strictEqual(result.core.meta.domain, 'product_decision');
      assert.ok(result.core.axioms.length >= 4);
      assert.ok(result.patterns.self_check.length >= 5);
    });
  });

  describe('classifyInput', () => {
    it('detects scenario signals', () => {
      const result = classifyInput('I have a situation where my teammate is defensive');
      assert.ok(result.includes('scenarios'));
    });

    it('detects reasoning signals', () => {
      const result = classifyInput('Why should I avoid saying "you should"?');
      assert.ok(result.includes('reasoning'));
    });

    it('detects evolution signals', () => {
      const result = classifyInput('How can I measure my progress in code review?');
      assert.ok(result.includes('evolution'));
    });

    it('detects case signals', () => {
      const result = classifyInput('Show me an example of a good code review');
      assert.ok(result.includes('cases'));
    });

    it('detects multiple signals', () => {
      const result = classifyInput(
        'In this conflict situation, why does the principle apply? Can you show me an example?',
      );
      assert.ok(result.includes('scenarios'));
      assert.ok(result.includes('reasoning'));
      assert.ok(result.includes('cases'));
    });

    it('returns empty for neutral input', () => {
      const result = classifyInput('Hello');
      assert.strictEqual(result.length, 0);
    });

    it('detects Chinese scenario signals', () => {
      const result = classifyInput('我有一个关于沟通冲突的场景需要讨论');
      assert.ok(result.includes('scenarios'));
    });

    it('detects Chinese reasoning signals', () => {
      const result = classifyInput('为什么我们不应该说"你应该如何做"？');
      assert.ok(result.includes('reasoning'));
    });

    it('detects Chinese case signals', () => {
      const result = classifyInput('请给我展示一个案例示例');
      assert.ok(result.includes('cases'));
    });

    it('detects Chinese evolution signals', () => {
      const result = classifyInput('如何评估和提升自己的代码审查水平？');
      assert.ok(result.includes('evolution'));
    });

    it('detects mixed Chinese-English signals', () => {
      const result = classifyInput(
        '在这个conflict situation中，为什么这个principle apply？可以给我一个example吗？',
      );
      assert.ok(result.includes('scenarios'));
      assert.ok(result.includes('reasoning'));
      assert.ok(result.includes('cases'));
    });
  });

  describe('loadDomain', () => {
    it('loads minimum by default', () => {
      const result = loadDomain(path.join(EXAMPLES, 'communication'));
      assert.ok(result);
      assert.ok(result.core);
      assert.ok(result.patterns);
    });

    it('loads minimum explicitly', () => {
      const result = loadDomain(path.join(EXAMPLES, 'communication'), { mode: 'minimum' });
      assert.ok(result);
      assert.ok(result.core);
      assert.ok(result.patterns);
      assert.strictEqual(result.scenarios, undefined);
    });

    it('loads all files with mode all', () => {
      const result = loadDomain(path.join(EXAMPLES, 'communication'), { mode: 'all' });
      assert.ok(result);
      assert.ok(result.scenarios);
      assert.ok(result.reasoning);
    });

    it('auto-loads optional files based on input', () => {
      const result = loadDomain(path.join(EXAMPLES, 'communication'), {
        input: 'I have a conflict with a coworker. Why does the approach work?',
      });
      assert.ok(result);
      assert.ok(result.scenarios);
      assert.ok(result.reasoning);
    });

    it('returns null for nonexistent domain', () => {
      const result = loadDomain(path.join(EXAMPLES, 'nonexistent'));
      assert.strictEqual(result, null);
    });
  });

  describe('formatContext', () => {
    it('produces a non-empty string for a loaded domain', () => {
      const domain = loadDomain(path.join(EXAMPLES, 'communication'));
      const ctx = formatContext(domain);
      assert.ok(typeof ctx === 'string');
      assert.ok(ctx.length > 0);
    });

    it('includes stances', () => {
      const domain = loadDomain(path.join(EXAMPLES, 'communication'));
      const ctx = formatContext(domain);
      assert.ok(ctx.includes('Stances'));
    });

    it('includes banned terms', () => {
      const domain = loadDomain(path.join(EXAMPLES, 'communication'));
      const ctx = formatContext(domain);
      assert.ok(ctx.includes('Avoid These Terms') || ctx.includes('avoid'));
    });

    it('includes self checks', () => {
      const domain = loadDomain(path.join(EXAMPLES, 'communication'));
      const ctx = formatContext(domain);
      assert.ok(ctx.includes('Before Responding'));
    });

    it('includes optional scenario content when loaded', () => {
      const domain = loadDomain(path.join(EXAMPLES, 'communication'), { mode: 'all' });
      const ctx = formatContext(domain);
      assert.ok(ctx.includes('Relevant Scenarios'));
    });

    it('includes case content when loaded', () => {
      const domain = loadDomain(path.join(EXAMPLES, 'communication'), { mode: 'all' });
      const ctx = formatContext(domain);
      assert.ok(ctx.includes('Cases'));
      assert.ok(ctx.includes('Repairing after a misunderstood message'));
    });

    it('includes evolution content when loaded', () => {
      const domain = loadDomain(path.join(EXAMPLES, 'communication'), { mode: 'all' });
      const ctx = formatContext(domain);
      assert.ok(ctx.includes('Growth Stages'));
      assert.ok(ctx.includes('Capability Layers'));
      assert.ok(ctx.includes('Measurement'));
    });

    it('formats code_review domain with all files loaded', () => {
      const domain = loadDomain(path.join(EXAMPLES, 'from-wiki-to-kdna', 'kdna'), { mode: 'all' });
      const ctx = formatContext(domain);
      assert.ok(ctx.includes('Domain Cognition'));
      assert.ok(ctx.includes('Stances'));
      assert.ok(ctx.includes('Cases'));
      assert.ok(ctx.includes('Growth Stages'));
      assert.ok(ctx.includes('Reasoning Chains'));
    });

    it('returns empty string for null domain', () => {
      assert.strictEqual(formatContext(null), '');
      assert.strictEqual(formatContext({}), '');
    });
  });
});
