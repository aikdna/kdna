/**
 * KDNA Demo — Multi-domain before/after judgment comparison.
 *
 * Usage: kdna demo [domain]
 *   kdna demo              → decision_state (default)
 *   kdna demo writing      → writing demo
 *   kdna demo decision_state → decision_state demo
 *   kdna demo --trace      → JSON trace output
 */

const { loadDomain } = require('./loader');
const path = require('path');

const DEMOS = {
  decision_state: {
    title: 'Discussion vs Decision',
    input: `Team discussed technical debt in the authentication module. After debate, the tech lead said: "We need more data on user impact before we prioritize this. Let's revisit once we have that." No date was set. No owner was assigned. No criteria defined for "enough data."`,
    noKdna: `The team discussed technical debt in the authentication module. The tech lead wants more data on user impact before prioritizing. They plan to revisit this once they have the data.

Key points:
- Authentication module has technical debt
- Need user impact data
- Will revisit when data is available
- No immediate action required`,
    withKdna: `**Decision State: UNRESOLVED**

Four critical elements are missing:
1. No specific choice — "Prioritize this" is vague
2. No named owner — "We" is not a person
3. No timing — "Revisit once we have that" has no date
4. No condition specificity — "More data" is unbounded

Why this matters: treating discussion as decision leads to action items for commitments that don't exist.

Triggered: AX-001 Discussion≠Decision, AX-002 Silence≠Commitment, FW-002 Deferral Validation, MS-003 Vague deferral misclassification`,
    whatChanged: [
      'Generic AI: summarizes content passively — misses that no action was committed.',
      'KDNA: identifies missing commitment elements (owner, timing, choice, condition).',
      'KDNA: classifies state as UNRESOLVED rather than describing it as neutral.',
      'KDNA: transparent judgment path — shows which axioms triggered.',
    ],
  },

  code_review: {
    title: 'Code Review',
    input: `Pull Request: "Refactor: extract authentication logic into AuthService class." Changes: moved 200 lines from UserController to new AuthService. Added unit tests for happy path. No tests for invalid token, expired session, or concurrent login scenarios.`,
    noKdna: `Code review: LGTM. Clean extraction, good separation of concerns. Tests cover the main flow. Ship it.`,
    withKdna: `**Review: Behavior-first analysis completed.**

Findings:
1. Missing edge case tests: invalid token, expired session, concurrent login — these are the highest-risk scenarios for authentication code. The happy-path test coverage is not sufficient.
2. The refactor moved 200 lines but the PR description does not state what behavioral guarantees are preserved. What existing integration tests verify the auth flow end-to-end?

Preference (optional): Consider renaming AuthService.authenticate() to AuthService.verifyCredentials() for clarity.

Verified: Core extraction is clean. No logic changes detected in happy-path comparison.
Checked: Callers of UserController — all three updated correctly.
Not checked: Session timeout behavior after refactor — auth token expiry logic was in the moved code block. Verify with integration test.

Triggered: AX-002 Behavior before implementation. AX-003 Comment classification — findings cite specific failure modes. FW-001 Behavior-First Review applied. MS-001 Silent approval is not review.`,
    whatChanged: [
      'Generic AI: LGTM, ship it — no verification recorded.',
      'KDNA: Documents what was verified, what was not checked, and what risk remains.',
      'KDNA: Classifies findings (must-fix) vs preferences (optional) explicitly.',
      'KDNA: Identifies the highest-risk missing tests (auth edge cases) rather than style feedback.',
    ],
  },
  writing: {
    title: 'Product Announcement',
    input: `Write a product announcement for a new AI-powered analytics dashboard called "InsightFlow". It has real-time data, beautiful visualizations, and helps teams make better decisions.`,
    noKdna: `Introducing InsightFlow: Your AI-Powered Analytics Dashboard

In today's fast-paced business environment, data-driven decisions are more critical than ever. InsightFlow brings the power of artificial intelligence to your analytics workflow, with stunning real-time visualizations and intuitive dashboards that your entire team will love.

Key features:
- Real-time data that keeps you ahead of the curve
- Beautiful, customizable visualizations
- AI-powered insights that help you make smarter decisions
- Seamless team collaboration

Don't get left behind. Try InsightFlow today and transform the way your team works with data.

Schedule a demo now!`,
    withKdna: `**Judgment: Warning — decorative language, no argument structure**

Issues detected:
1. No cognitive hook — what specific problem does the reader have that InsightFlow solves? "Data-driven decisions" is everyone's problem, which means it's no one's specific problem.
2. Anxiety-selling pattern detected — "Don't get left behind" creates fear without earning the right to resolve it.
3. Vague judgment terms — "smarter decisions" and "better decisions" say nothing. What specific decision does InsightFlow improve?

Recommended rewrite direction:
- Open with the specific frustration: "Your team spent 3 hours in a spreadsheet and still doesn't know which channel drove last month's revenue."
- Name the cognitive contrast: "Most dashboards show you what happened. InsightFlow tells you which number to act on."
- Replace decorative adjectives with operational claims.

Triggered: AX-001 Writing problems are structural, not language-level. AX-002 Content must exert judgment pressure on the reader. Banned terms: "beautiful", "stunning", "transform", "Don't get left behind". Self-check: Does the title create a real decision question? → FAIL.`,
    whatChanged: [
      'Generic AI: produces fluent, decorative marketing copy with no argument.',
      'KDNA: rejects anxiety-selling language and vague judgment claims.',
      'KDNA: demands a cognitive hook — what specific problem?',
      'KDNA: flags banned decorative terms and suggests operational alternatives.',
    ],
  },
};

function runDemo(domainName = 'decision_state') {
  const demo = DEMOS[domainName];
  if (!demo) {
    console.error(`Unknown demo: ${domainName}`);
    console.error(`Available: ${Object.keys(DEMOS).join(', ')}`);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`KDNA Demo: ${demo.title}`);
  console.log('='.repeat(60));
  console.log();
  console.log('TASK:');
  console.log('-'.repeat(60));
  console.log(demo.input);
  console.log('-'.repeat(60));
  console.log();

  console.log('WITHOUT KDNA (Generic AI):');
  console.log('-'.repeat(60));
  console.log(demo.noKdna);
  console.log('-'.repeat(60));
  console.log();

  console.log('WITH KDNA (Judgment-First):');
  console.log('-'.repeat(60));
  console.log(demo.withKdna);
  console.log('-'.repeat(60));
  console.log();

  console.log('WHAT CHANGED:');
  console.log('-'.repeat(60));
  demo.whatChanged.forEach((c, i) => console.log(`${i + 1}. ${c}`));
  console.log('-'.repeat(60));
  console.log();

  // Load domain trace if available
  try {
    let domainPath;
    if (domainName === 'decision_state') {
      domainPath = path.resolve(__dirname, '..', 'examples', 'decision_state');
    } else {
      domainPath = path.resolve(__dirname, '..', '..', `kdna-${domainName}`);
    }

    const domain = loadDomain(domainPath, { mode: 'all' });
    if (domain) {
      console.log('DOMAIN LOADED:');
      console.log(`  ${domain.core.meta.domain} v${domain.core.meta.version}`);
      console.log(`  Axioms: ${domain.core?.axioms?.length || 0}`);
      console.log(`  Concepts: ${domain.core?.ontology?.length || 0}`);
      console.log(`  Frameworks: ${domain.core?.frameworks?.length || 0}`);
      console.log(`  Misunderstandings: ${domain.patterns?.misunderstandings?.length || 0}`);
      console.log(`  Self-checks: ${domain.patterns?.self_check?.length || 0}`);
      if (domain.patterns?.terminology?.banned_terms?.length) {
        console.log(`  Banned terms: ${domain.patterns.terminology.banned_terms.length}`);
      }
    }
  } catch {
    // Domain files not available locally
  }

  console.log();
  console.log('TRY IT:');
  console.log(`  npx @aikdna/kdna demo ${domainName}`);
  console.log(`  kdna install ${domainName}`);
  console.log(`  kdna validate ~/.kdna/domains/${domainName}`);
  console.log();
}

function runDemoJson(domainName = 'decision_state') {
  const demo = DEMOS[domainName];
  if (!demo) {
    console.error(JSON.stringify({ error: `Unknown demo: ${domainName}` }));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        demo: domainName,
        input: demo.input,
        without_kdna: demo.noKdna,
        with_kdna: demo.withKdna,
        what_changed: demo.whatChanged,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

module.exports = { runDemo, runDemoJson, DEMOS };
