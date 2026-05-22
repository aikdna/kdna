/**
 * kdna init <name>        — Scaffold a new KDNA domain from template.
 * kdna cluster init <name> — Scaffold a new KDNA cluster from template.
 */

const fs = require('fs');
const path = require('path');

/**
 * Recursively copy a directory, applying string replacements.
 */
function copyRecursive(src, dest, replacements) {
  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath, replacements);
    } else {
      let content = fs.readFileSync(srcPath, 'utf8');
      for (const [pattern, to] of Object.entries(replacements)) {
        content = content.replaceAll(pattern, to);
      }
      fs.writeFileSync(destPath, content);
    }
  }
}

function cmdInit(name) {
  if (!name) {
    console.error('Error: Domain name required. Usage: kdna init <name>');
    process.exit(1);
  }

  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    console.error(
      `Error: Invalid domain name "${name}". Must be lowercase letters, numbers, underscores. Start with a letter.`,
    );
    process.exit(1);
  }

  const templateDir = path.resolve(__dirname, '..', 'templates', 'minimal-domain');
  const targetDir = path.resolve(name);

  if (fs.existsSync(targetDir)) {
    console.error(`Error: Directory already exists: ${targetDir}`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);

  fs.mkdirSync(targetDir, { recursive: true });
  copyRecursive(templateDir, targetDir, {
    example_domain: name,
    'YYYY-MM-DD': today,
  });

  console.log(`✓ Created KDNA domain: ${targetDir}/`);
  console.log(`  Files: KDNA_Core.json, KDNA_Patterns.json, kdna.json, tests/before-after.json`);

  // Run structural validation (lint + schema only). Content quality checks
  // are for publish time, not scaffold time — the template contains placeholders
  // marked [TODO] that the author is expected to replace.
  try {
    const { execSync } = require('child_process');
    const cli = process.argv[1];
    const validCmd = `node "${cli}" validate "${targetDir}"`;
    const { status } = execSync(validCmd, { stdio: 'pipe', encoding: 'utf8' });
    // Structural validation passed (non-zero exit means purely structural failure)
    if (status === null || status === undefined) {
      console.log(`  ✓ Structural validation passed (lint + schema OK)`);
    }
  } catch (e) {
    console.error(`  ⚠ Structural validation had issues:`);
    const stderr = e.stderr?.toString() || e.stdout?.toString() || '';
    if (stderr)
      console.error(
        stderr
          .trim()
          .split('\n')
          .map((l) => `    ${l}`)
          .join('\n'),
      );
  }

  console.log('');
  console.log(`Next steps:`);
  console.log(`  1. Edit ${targetDir}/KDNA_Core.json — replace all [TODO] placeholders`);
  console.log(
    `  2. Edit ${targetDir}/KDNA_Patterns.json — replace terminology and misunderstandings`,
  );
  console.log(`  3. Edit ${targetDir}/kdna.json — set author, description, repo`);
  console.log(`  4. Run: kdna validate ${name}               (structural check)`);
  console.log(`  5. Run: kdna publish --check ${name}         (content quality gate)`);
  console.log(`  6. Run: kdna verify ${name}                  (full judgment scoring)`);
}

/**
 * kdna cluster init <name> — Scaffold a new KDNA cluster from template.
 */
function cmdClusterInit(name) {
  if (!name) {
    console.error('Error: Cluster name required. Usage: kdna cluster init <name>');
    process.exit(1);
  }

  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    console.error(
      `Error: Invalid cluster name "${name}". Must be lowercase letters, numbers, underscores. Start with a letter.`,
    );
    process.exit(1);
  }

  const clusterTemplateDir = path.resolve(__dirname, '..', 'templates', 'cluster');
  const domainTemplateDir = path.resolve(__dirname, '..', 'templates', 'minimal-domain');
  const targetDir = path.resolve(name);

  if (fs.existsSync(targetDir)) {
    console.error(`Error: Directory already exists: ${targetDir}`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);

  // Copy cluster manifest with replacements
  fs.mkdirSync(targetDir, { recursive: true });

  let clusterContent = fs.readFileSync(path.join(clusterTemplateDir, 'KDNA_Cluster.json'), 'utf8');
  clusterContent = clusterContent.replace(/example_cluster/g, name);
  clusterContent = clusterContent.replace(
    /sub_domain_/g,
    `${name.replace(/_cluster$/, '')}_domain_`,
  );
  fs.writeFileSync(path.join(targetDir, 'KDNA_Cluster.json'), clusterContent);

  // Copy cluster README
  const clusterReadme = fs.readFileSync(path.join(clusterTemplateDir, 'README.md'), 'utf8');
  fs.writeFileSync(
    path.join(targetDir, 'README.md'),
    clusterReadme.replace(/example_cluster/g, name),
  );

  // Create first example sub-domain from domain template
  const subDir = path.join(targetDir, 'domain_one');
  fs.mkdirSync(subDir, { recursive: true });
  copyRecursive(domainTemplateDir, subDir, {
    example_domain: `${name.replace(/_cluster$/, '')}_domain_one`,
    'YYYY-MM-DD': today,
  });

  console.log(`✅ Created KDNA cluster: ${targetDir}/`);
  console.log(`   Files: KDNA_Cluster.json, domain_one/ (6 KDNA files + kdna.json + tests/)`);
  console.log('');
  console.log(`Next steps:`);
  console.log(
    `  1. Edit ${targetDir}/KDNA_Cluster.json — set packages, composition rules, routing`,
  );
  console.log(
    `  2. Edit ${targetDir}/domain_one/KDNA_Core.json — fill in axioms, concepts, stances`,
  );
  console.log(
    `  3. Add more sub-domains: cp -r ${targetDir}/domain_one ${targetDir}/your_new_domain`,
  );
  console.log(`  4. Run: kdna validate ${name}              (check all sub-domains)`);
}

module.exports = { cmdInit, cmdClusterInit };
