/**
 * kdna init <name> — Scaffold a new KDNA domain from template.
 */

const fs = require('fs');
const path = require('path');

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

  // Copy template
  fs.mkdirSync(targetDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);

  function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      if (fs.statSync(srcPath).isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        let content = fs.readFileSync(srcPath, 'utf8');
        content = content.replace(/example_domain/g, name);
        content = content.replace(/YYYY-MM-DD/g, today);
        fs.writeFileSync(destPath, content);
      }
    }
  }

  copyRecursive(templateDir, targetDir);

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

module.exports = { cmdInit };
