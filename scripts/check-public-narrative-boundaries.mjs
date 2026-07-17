#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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
];

const REQUIRED_GUARDRAILS = new Map([
  [
    'docs/core-narrative-and-boundaries.md',
    ['asset-contract boundary', 'KDNA does not monopolize judgment'],
  ],
  ['docs/kdna-and-ai-stack.md', ['The boundary is a contract', 'The same judgment may appear']],
  ['docs/kdna-and-ai-stack.zh.md', ['边界是合同', '同一判断可以同时存在']],
  [
    'docs/faq-kdna-vs-skill.md',
    ['does not claim exclusive ownership of', 'The same judgment can be represented in both'],
  ],
]);

function markdownFiles() {
  const roots = ['README.md', 'README.zh.md', 'docs'];
  const files = [];

  function visit(path) {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(path)) visit(join(path, entry));
      return;
    }
    if (path.endsWith('.md')) files.push(path);
  }

  for (const root of roots) visit(join(REPO_ROOT, root));
  return files;
}

export function findNarrativeViolations(relPath, content) {
  if (relPath.startsWith('docs/archive/')) return [];
  return FORBIDDEN.flatMap(([rule, pattern]) =>
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
  for (const path of markdownFiles()) {
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
