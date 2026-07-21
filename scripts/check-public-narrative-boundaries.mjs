#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Adapter-specific smoke instructions are versioned with that adapter. They
// remain in the narrative audit, but their command examples are not treated as
// Core CLI documentation here.
const ADAPTER_COMMAND_DOCS = new Set(['docs/CROSS_AGENT_SMOKE_TEST.md']);

const FORBIDDEN = [
  [
    'skill-execution-kdna-judgment',
    /Skills?\s+(?:(?:is|are|only)\s+)?execution[.,;:]?\s*KDNA\s+(?:(?:is|provides|only)\s+)?judgment/i,
  ],
  ['skill-executes-kdna-judges', /Skills? executes?\.\s*KDNA judges?/i],
  [
    'skill-execution-kdna-judgment-zh',
    /Skill\s*负责执行[。；，,]?\s*KDNA[^\n]{0,20}(?:判断|思考)/i,
  ],
  ['prompt-untestable', /Prompts? (?:are|is) not testable/i],
  ['prompt-unversioned', /Prompts? (?:are|is) not versioned/i],
  ['prompt-uncomposable', /Prompts? (?:are|is) not composable/i],
  ['prompt-uninspectable', /Prompts? (?:are|is) not inspectable/i],
  ['prompt-verification-none', /\|\s*Verification\s*\|\s*None\s*\|/i],
  ['rag-wrong-for-judgment', /RAG[^\n.]{0,80}(?:is|as) (?:the )?wrong tool[^\n.]{0,40}judgment/i],
  ['facts-belong-judgment-belongs', /Facts and knowledge belong[^\n]+\nJudgment belongs to KDNA/i],
  [
    'rag-facts-kdna-judgment',
    /RAG (?:provides|retrieves) (?:only )?facts[^\n]+KDNA (?:provides|encodes) (?:the )?(?:rules|judgment)/i,
  ],
  ['rag-facts-kdna-judgment-zh', /RAG\s*(?:只)?提供事实[。；，,]?\s*KDNA[^\n]{0,24}(?:规则|判断)/i],
  ['universal-human-source', /^### 1\. Human judgment is the source\s*$/im],
  [
    'universal-human-confirmation',
    /This boundary is absolute\. No candidate enters \.kdna without human confirmation/i,
  ],
  [
    'mechanical-agent-operations',
    /Tool selection, code execution, file I\/O[^\n]+mechanical operations/i,
  ],
  ['mechanical-agent-operations-zh', /工具选择、代码执行、文件 I\/O[^\n]+机械操作/i],
  [
    'project-value-is-output-improvement',
    /KDNA(?:'s)? value proposition is that structured domain judgment improves agent decisions/i,
  ],
  [
    'baseline-superiority-as-contract',
    /presence of the domain made the output worse than baseline/i,
  ],
  [
    'compare-command-implemented-claim',
    /Status:\*\*\s*Implemented\.[^\n]*`kdna compare`/i,
  ],
  [
    'compare-command-usage-claim',
    /`kdna compare` is the easiest way to see KDNA's value/i,
  ],
  [
    'better-than-unloaded-release-question',
    /test whether an agent using this domain judges better than one without it/i,
  ],
  ['current-cli-compare-example', /^\s*kdna\s+compare(?:\s|$)/im],
  ['current-cli-asset-sign-example', /^\s*kdna\s+sign(?:\s|$)/im],
  ['current-cli-asset-verify-example', /^\s*kdna\s+verify(?:\s|$)/im],
  ['current-cli-asset-revoke-example', /^\s*kdna\s+revoke(?:\s|$)/im],
  ['current-cli-version-mutation-example', /^\s*kdna\s+version\s+(?:bump|history)(?:\s|$)/im],
  ['historical-benchmark-90-to-96', /90\.0%[^\n]{0,80}96\.7%/i],
  ['historical-five-arm-score-positive', /(?:^|[^\d])\+0\.09(?:[^\d]|$)/m],
  ['historical-five-arm-score-negative', /(?:^|[^\d])-0\.17(?:[^\d]|$)/m],
  ['historical-blind-score-positive', /(?:^|[^\d])\+0\.19(?:[^\d]|$)/m],
  ['historical-blind-score-negative', /(?:^|[^\d])-0\.14(?:[^\d]|$)/m],
  ['historical-agreement-percent', /95\.6%/i],
  ['autonomous-task-selection', /agent automatically decides per task whether KDNA applies/i],
  ['silent-loader-application', /(?:loader|agent) (?:should )?apply KDNA silently/i],
  ['better-judgment-loader-promise', /user (?:should )?see(?:s)? better judgment/i],
  ['hidden-kdna-use', /do not mention KDNA[^\n]{0,100}unless the user explicitly asks/i],
  ['global-store-shared-authority', /all agents share the `?~\/\.kdna\/?`? asset store/i],
  ['install-to-library', /Install to KDNA Library/i],
  ['no-kdna-value-threshold', /minimum_threshold_for_kdna_value/i],
  ['no-kdna-uplift-baseline', /(?:must\s+)?improve average score[^\n]{0,100}no-KDNA baseline/i],
  ['universal-behavior-test', /The only valid test:[^\n]{0,120}(?:without|no-KDNA)[^\n]{0,120}(?:with|KDNA loaded)/i],
];

const REQUIRED_GUARDRAILS = new Map([
  [
    'docs/core-narrative-and-boundaries.md',
    ['independent asset and a shared loading contract', 'claim exclusive ownership of judgment or automatic behavioral superiority', 'KDNA does not require a global asset library'],
  ],
  [
    'docs/loader-behavior.md',
    ['explicitly supplied', 'Discovery is not consent', 'disable, switch, and rollback controls'],
  ],
  [
    'docs/integrations.md',
    ['Current supported technical path', '**Unassessed**', 'not the current product contract'],
  ],
  [
    'docs/local-kdna-home-spec.md',
    ['Historical implementation note', 'The canonical portable object is a `.kdna` file'],
  ],
  ['docs/kdna-and-ai-stack.md', ['The boundary is a contract', 'The same judgment may appear']],
  ['docs/kdna-and-ai-stack.zh.md', ['边界是合同', '同一判断可以同时存在']],
  [
    'docs/faq-kdna-vs-skill.md',
    ['does not claim exclusive ownership of', 'The same judgment can be represented in both'],
  ],
  [
    'docs/agents-lack-judgment.md',
    ['Judgment can already live', 'does not by itself prove'],
  ],
  [
    'docs/kdna-compare-report.md',
    ['does not expose a', 'not a Preview release gate'],
  ],
  [
    'docs/judgment-contamination.md',
    ['# Scope Mismatch and Boundary Leakage', 'do not imply that KDNA owns all'],
  ],
  [
    'packages/kdna-eval/README.md',
    ['claimant-scoped', 'not KDNA Core authority', 'does not use Prompt/Skill superiority'],
  ],
]);

function narrativeFiles() {
  const roots = [
    'README.md',
    'README.zh.md',
    'PUBLISHING_EXAMPLE.md',
    'docs',
    'specs',
    'templates',
    'skills',
    'packages/kdna-eval/README.md',
  ];
  const files = [];

  function visit(path) {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(path)) visit(join(path, entry));
      return;
    }
    if (
      path.endsWith('.md') ||
      path.endsWith('templates/standard-domain/evals/scoring.json')
    ) files.push(path);
  }

  for (const root of roots) visit(join(REPO_ROOT, root));
  return files;
}

export function findNarrativeViolations(relPath, content) {
  if (relPath.startsWith('docs/archive/')) return [];
  const rules = ADAPTER_COMMAND_DOCS.has(relPath)
    ? FORBIDDEN.filter(([rule]) => !rule.startsWith('current-cli-'))
    : FORBIDDEN;
  return rules.flatMap(([rule, pattern]) =>
    pattern.test(content) ? [{ path: relPath, rule }] : [],
  );
}

export function findMissingGuardrails(
  read = (path) => readFileSync(join(REPO_ROOT, path), 'utf8'),
) {
  const failures = [];
  for (const [path, snippets] of REQUIRED_GUARDRAILS) {
    const content = read(path);
    for (const snippet of snippets) {
      if (!content.includes(snippet)) failures.push({ path, snippet });
    }
  }
  return failures;
}

export function auditRepository() {
  const violations = [];
  for (const path of narrativeFiles()) {
    const relPath = relative(REPO_ROOT, path);
    violations.push(...findNarrativeViolations(relPath, readFileSync(path, 'utf8')));
  }
  return { violations, missingGuardrails: findMissingGuardrails() };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditRepository();
  if (result.violations.length || result.missingGuardrails.length) {
    console.error('public narrative boundary check failed');
    for (const item of result.violations) {
      console.error(`  ${item.path}: forbidden ${item.rule}`);
    }
    for (const item of result.missingGuardrails) {
      console.error(`  ${item.path}: missing guardrail ${JSON.stringify(item.snippet)}`);
    }
    process.exit(1);
  }
  console.log('public narrative boundary check passed');
}
