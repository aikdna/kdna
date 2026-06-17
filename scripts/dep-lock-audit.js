#!/usr/bin/env node
/**
 * dep-lock-audit — scan consumer repos for unpinned / floating dependencies.
 *
 * PR-8 scope:
 *   - Swift: .branch("main"), .branch("master") are flagged
 *   - JS:   package.json scripts that auto-run npm install in pretest
 *   - Python: dependencies without upper bounds
 *
 * Run from kdna monorepo with KDNA_REPOS_ROOT pointing at the workspace.
 */

const fs = require('fs');
const path = require('path');

const REPOS_ROOT = process.env.KDNA_REPOS_ROOT || path.resolve(__dirname, '..', '..');

const findings = [];

function flag(severity, repo, file, msg) {
  findings.push({ severity, repo, file, msg });
}

function checkSwift(repoName, repoPath) {
  const pkgPath = path.join(repoPath, 'Package.swift');
  if (!fs.existsSync(pkgPath)) return;
  let src = fs.readFileSync(pkgPath, 'utf8');
  // Strip // and /* */ comments to avoid flagging remediation notes.
  src = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[[:space:]]*\/\/.*$/gm, '')
    .replace(/([^:])\/\/.*$/gm, '$1');
  // Match .branch("main"), .branch("master"), .branch("HEAD")
  const branchRe = /\.branch\(\s*"(main|master|HEAD)"\s*\)/g;
  let m;
  while ((m = branchRe.exec(src)) !== null) {
    flag(
      'FAIL',
      repoName,
      'Package.swift',
      `floating branch dependency .branch("${m[1]}") — pin to exact tag instead`,
    );
  }
  // Match .revision("") without value, or .branch() with empty string
  if (/\.branch\(\s*""\s*\)/.test(src)) {
    flag('FAIL', repoName, 'Package.swift', 'empty .branch("")');
  }
}

function checkJsScripts(repoName, repoPath) {
  const pkgPath = path.join(repoPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return;
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (_) {
    return;
  }
  if (!pkg.scripts) return;
  for (const [name, cmd] of Object.entries(pkg.scripts)) {
    if (/^(pre|post)?test/.test(name) && /npm install/.test(cmd)) {
      flag(
        'WARN',
        repoName,
        'package.json',
        `script "${name}" runs "npm install" — prefer explicit "npm ci" in CI`,
      );
    }
    if (name === 'pretest' && /--ignore-scripts/.test(cmd)) {
      flag(
        'WARN',
        repoName,
        'package.json',
        `pretest runs "npm install --ignore-scripts" — hides lockfile drift; remove`,
      );
    }
  }
}

function checkPyproject(repoName, repoPath) {
  const pyprojectPath = path.join(repoPath, 'pyproject.toml');
  if (!fs.existsSync(pyprojectPath)) return;
  const src = fs.readFileSync(pyprojectPath, 'utf8');
  // Naive: flag any dep without an upper bound or == pin
  const depRe = /^\s*["']?([a-zA-Z0-9_-]+)\s*([><=!~]+)\s*([\d.]+)/gm;
  let m;
  while ((m = depRe.exec(src)) !== null) {
    const [, name, op, ver] = m;
    if (op === '>=' && !src.includes(`<=`)) {
      // No upper bound is fine for libs but risky for crypto. Flag for crypto-adjacent names.
      if (/(crypto|hash|kdf|cipher|aes|argon|bcrypt|scrypt|nacl)/i.test(name)) {
        flag(
          'WARN',
          repoName,
          'pyproject.toml',
          `crypto-related dep "${name}${op}${ver}" has no upper bound`,
        );
      }
    }
  }
}

function main() {
  if (!fs.existsSync(REPOS_ROOT)) {
    console.error(`dep-lock-audit: ${REPOS_ROOT} does not exist`);
    process.exit(2);
  }
  for (const entry of fs.readdirSync(REPOS_ROOT)) {
    const repoPath = path.join(REPOS_ROOT, entry);
    if (!fs.statSync(repoPath).isDirectory()) continue;
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    checkSwift(entry, repoPath);
    checkJsScripts(entry, repoPath);
    checkPyproject(entry, repoPath);
  }

  if (findings.length === 0) {
    console.log('dep-lock-audit: no floating deps found');
    return;
  }

  for (const f of findings) {
    const tag = f.severity === 'FAIL' ? 'FAIL' : 'WARN';
    console.log(`${tag} ${f.repo}/${f.file}: ${f.msg}`);
  }

  const failures = findings.filter((f) => f.severity === 'FAIL');
  if (failures.length > 0) {
    console.error(
      `\ndep-lock-audit: ${failures.length} critical, ${findings.length - failures.length} warnings`,
    );
    process.exit(1);
  }
  console.log(`\ndep-lock-audit: ${findings.length} warning(s), no criticals`);
}

if (require.main === module) main();
module.exports = { checkSwift, checkJsScripts, checkPyproject };
