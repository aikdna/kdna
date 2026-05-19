/**
 * KDNA Demo — Show no-KDNA / with-KDNA judgment difference in 60 seconds.
 *
 * Uses pre-stored outputs so the demo works offline.
 */

const { loadDomain } = require('./loader');
const path = require('path');

const DEMO_SCENARIO = {
  title: 'Sprint Planning Meeting',
  input: `Team discussed technical debt in the authentication module. After debate, the tech lead said: "We need more data on user impact before we prioritize this. Let's revisit once we have that." No date was set. No owner was assigned to gather data. No criteria defined for "enough data."`,
};

const NO_KDNA_OUTPUT = `The team discussed technical debt in the authentication module. The tech lead wants more data on user impact before prioritizing. They plan to revisit this once they have the data.

Key points:
- Authentication module has technical debt
- Need user impact data
- Will revisit when data is available
- No immediate action required`;

const WITH_KDNA_OUTPUT = `**Decision State: UNRESOLVED**

The meeting produced discussion, not a decision. Four critical elements are missing:

1. **No specific choice**: "Prioritize this" is vague — what exactly will be done and when?
2. **No named owner**: Who gathers the user impact data? "We" is not a person.
3. **No timing**: "Revisit once we have that" has no date. This is a deferral without structure.
4. **No condition specificity**: "More data" is unbounded. How much is enough? What metrics?

**Why this matters**: If an AI agent treats this as a decision, it will generate action items for a commitment that does not exist. The team will leave thinking "we decided" when in reality no one is accountable.

**Triggered axioms**:
- "Discussion is not decision. Broad agreement is not commitment." (AX-001)
- "The absence of objection is not the presence of commitment." (AX-002)

**Triggered framework**: Deferral Validation — the condition ("more data") lacks specificity, date, and decision owner. This is UNRESOLVED, not intentional deferral.`;

function runDemo() {
  console.log('\n=== KDNA Demo: Discussion vs Decision ===\n');
  console.log(`Scenario: ${DEMO_SCENARIO.title}`);
  console.log('-'.repeat(60));
  console.log(DEMO_SCENARIO.input);
  console.log('-'.repeat(60));
  console.log();

  console.log('\n--- WITHOUT KDNA (Generic AI Summary) ---\n');
  console.log(NO_KDNA_OUTPUT);
  console.log();

  console.log('\n--- WITH KDNA (Judgment-First Analysis) ---\n');
  console.log(WITH_KDNA_OUTPUT);
  console.log();

  console.log('\n=== What Changed? ===\n');
  console.log(
    'Without KDNA, the AI summarizes content — producing a pleasant but useless summary of a non-decision.',
  );
  console.log(
    'With KDNA, the AI checks structural elements (owner, timing, choice, action) and classifies the state.',
  );
  console.log();
  console.log('Key differences:');
  console.log(
    "  1. Generic AI: 'No immediate action required' — misses that NO action was ever committed.",
  );
  console.log('  2. KDNA: Explicitly identifies 4 missing elements that prevent execution.');
  console.log(
    '  3. KDNA: Distinguishes vague deferral from intentional deferral using the Deferral Validation framework.',
  );
  console.log(
    '  4. KDNA: Shows which axioms and frameworks were triggered — transparent judgment path.',
  );
  console.log();

  console.log('\n=== Judgment Trace ===\n');
  console.log('When KDNA loads, the agent receives structured judgment context:');
  console.log();
  try {
    const domainDir = path.resolve(__dirname, '..', 'examples', 'decision_state');
    const domain = loadDomain(domainDir, { mode: 'all' });
    if (domain) {
      console.log(`  Loaded package: ${domain.core.meta.domain} v${domain.core.meta.version}`);
      console.log(`  Axioms: ${domain.core?.axioms?.length || 0}`);
      console.log(`  Ontology entries: ${domain.core?.ontology?.length || 0}`);
      console.log(`  Frameworks: ${domain.core?.frameworks?.length || 0}`);
      console.log(`  Misunderstandings: ${domain.patterns?.misunderstandings?.length || 0}`);
      console.log(`  Self-checks: ${domain.patterns?.self_check?.length || 0}`);
      console.log();
      console.log('Triggered by this scenario:');
      console.log("  [AX-001] 'Discussion is not decision. Broad agreement is not commitment.'");
      console.log(
        "    → Scenario shows 'discussed' and 'after debate' but no commitment structure.",
      );
      console.log("  [AX-002] 'The absence of objection is not the presence of commitment.'");
      console.log('    → No one objected, but no one accepted ownership either.');
      console.log("  [MS-003] Vague deferral ('need more data') without condition, date, owner.");
      console.log('    → Maps to UNRESOLVED, not intentional deferral.');
      console.log('  [FW-002] Deferral Validation: fails all 3 checks (condition, date, owner).');
      console.log();
      console.log('Self-checks the agent runs:');
      console.log('  ✓ Did I check for all four operational commitment elements?');
      console.log('  ✓ Did I classify the decision state (not just describe content)?');
      console.log(
        '  ✗ Did I verify deferral language has specific condition, date, and decision owner?',
      );
      console.log("    → FAIL: 'more data' is vague, no date, no owner.");
    }
  } catch (err) {
    console.log('  Debug:', err.message);
    console.log('  (Domain files not available for trace display)');
  }

  console.log('\n=== Try it yourself ===\n');
  console.log('  kdna validate ./examples/decision_state');
  console.log('  kdna eval ./examples/decision_state');
  console.log('  node benchmarks/eval-decision-state.js --limit=5 --kdna');
  console.log();
}

function buildTrace() {
  const domainDir = path.resolve(__dirname, '..', 'examples', 'decision_state');
  const domain = loadDomain(domainDir, { mode: 'all' });
  if (!domain) return null;

  return {
    trace_version: '0.1.0',
    trace_id: `trace_${Date.now()}`,
    timestamp: new Date().toISOString(),
    input_hash: 'sha256:demo',
    loaded_package: {
      domain: domain.core.meta.domain,
      version: domain.core.meta.version,
      source: 'local',
      loaded_files: ['KDNA_Core.json', 'KDNA_Patterns.json'],
    },
    triggered_concepts: [
      {
        id: 'unresolved',
        name: 'Unresolved Discussion',
        match_signal: "discussed, after debate, let's revisit",
      },
    ],
    triggered_axioms: [
      {
        id: 'AX-001',
        statement: 'Discussion is not decision. Broad agreement is not commitment.',
      },
      {
        id: 'AX-002',
        statement: 'The absence of objection is not the presence of commitment.',
      },
    ],
    triggered_frameworks: [
      {
        id: 'FW-002',
        name: 'Deferral Validation',
        steps_applied: [
          'Check condition specificity',
          'Check deferral date',
          'Check decision owner',
        ],
      },
    ],
    triggered_misunderstandings: [
      {
        id: 'MS-003',
        description: 'Vague deferral without condition, date, owner',
        evidence: "Let's revisit once we have that — no date, no owner, no criteria",
      },
    ],
    self_checks: [
      {
        check_id: 'SC-1',
        description: 'Did I verify all four operational commitment elements?',
        passed: false,
        reason: 'Missing: explicit choice, owner, timing, condition specificity',
      },
      {
        check_id: 'SC-2',
        description: 'Did I distinguish social agreement from explicit choice?',
        passed: true,
        reason: 'No explicit choice was made; social agreement detected',
      },
      {
        check_id: 'SC-5',
        description:
          'Did I verify deferral language has specific condition, date, and decision owner?',
        passed: false,
        reason: "'More data' is vague, no date set, no owner assigned",
      },
    ],
    generated_judgment: {
      classification: 'UNRESOLVED',
      confidence: 'high',
      missing_elements: ['explicit choice', 'owner', 'timing', 'condition specificity'],
      recommended_action:
        "Before execution: assign owner, set date, define 'enough data' criteria. Do not treat as decided.",
      reasoning_summary:
        'Input shows discussion and vague deferral without operational commitment structure. All four commitment elements are missing.',
    },
    agent_info: {
      agent_name: 'kdna-demo',
      agent_version: '0.4.0',
    },
  };
}

function runDemoJson() {
  const trace = buildTrace();
  if (!trace) {
    console.error(JSON.stringify({ error: 'Failed to load domain' }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(trace, null, 2));
}

module.exports = { runDemo, runDemoJson, DEMO_SCENARIO, NO_KDNA_OUTPUT, WITH_KDNA_OUTPUT };
