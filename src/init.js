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
      for (const [from, to] of Object.entries(replacements)) {
        content = content.replace(from, to);
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
    /example_domain/g: name,
    /YYYY-MM-DD/g: today,
  });

  console.log(`✓ Created KDNA domain: ${targetDir}/`);
  console.log(`  Files: KDNA_Core.json, KDNA_Patterns.json, kdna.json, tests/before-after.json`);

  // Validate
  try {
    const { execSync } = require('child_process');
    const cli = process.argv[1];
    execSync(`node "${cli}" validate "${targetDir}"`, { stdio: 'pipe' });
    console.log(`  ✓ Validation passed`);

    execSync(`node "${cli}" validate --schema "${targetDir}"`, { stdio: 'pipe' });
    console.log(`  ✓ Schema validation passed`);
  } catch {
    console.log(`  ⚠ Validation had issues — check files manually`);
  }

  console.log('');
  console.log(`Next steps:`);
  console.log(`  1. Edit ${targetDir}/KDNA_Core.json — fill in your axioms, concepts, stances`);
  console.log(
    `  2. Edit ${targetDir}/KDNA_Patterns.json — terminology, misunderstandings, self-checks`,
  );
  console.log(`  3. Edit ${targetDir}/kdna.json — metadata`);
  console.log(`  4. Run: kdna publish --check ${name}  (quality gate)`);
  console.log(`  5. Run: kdna eval ${name}                 (test judgment)`);
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
  clusterContent = clusterContent.replace(/sub_domain_/g, `${name.replace(/_cluster$/, '')}_domain_`);
  fs.writeFileSync(path.join(targetDir, 'KDNA_Cluster.json'), clusterContent);

  // Copy cluster README
  const clusterReadme = fs.readFileSync(path.join(clusterTemplateDir, 'README.md'), 'utf8');
  fs.writeFileSync(path.join(targetDir, 'README.md'), clusterReadme.replace(/example_cluster/g, name));

  // Create first example sub-domain from domain template
  const subDir = path.join(targetDir, 'domain_one');
  fs.mkdirSync(subDir, { recursive: true });
  copyRecursive(domainTemplateDir, subDir, {
    /example_domain/g: `${name.replace(/_cluster$/, '')}_domain_one`,
    /YYYY-MM-DD/g: today,
  });

  console.log(`✅ Created KDNA cluster: ${targetDir}/`);
  console.log(`   Files: KDNA_Cluster.json, domain_one/ (6 KDNA files + kdna.json + tests/)`);
  console.log('');
  console.log(`Next steps:`);
  console.log(`  1. Edit ${targetDir}/KDNA_Cluster.json — set packages, composition rules, routing`);
  console.log(`  2. Edit ${targetDir}/domain_one/KDNA_Core.json — fill in axioms, concepts, stances`);
  console.log(`  3. Add more sub-domains: cp -r ${targetDir}/domain_one ${targetDir}/your_new_domain`);
  console.log(`  4. Run: kdna validate ${name}              (check all sub-domains)`);
}

module.exports = { cmdInit, cmdClusterInit };
