/**
 * kdna version bump <patch|minor|major> [path] — Bump domain version.
 *
 * Updates kdna.json and all KDNA JSON file meta versions.
 */

const fs = require('fs');
const path = require('path');

function error(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function cmdVersionBump(level, domainPath) {
  if (!level || !['patch', 'minor', 'major'].includes(level)) {
    error(
      'Usage: kdna version bump <patch|minor|major> [path]\n\n  patch — fix wording, no judgment change\n  minor — add axiom/concept/framework (may change judgment)\n  major — remove/redefine axiom or change scope (breaking)',
    );
  }

  const targetDir = path.resolve(domainPath || '.');

  // Read kdna.json
  const manifestPath = path.join(targetDir, 'kdna.json');
  const manifest = readJson(manifestPath);
  if (!manifest) error(`kdna.json not found in ${targetDir}`);

  const oldVersion = manifest.version;
  if (!oldVersion) error('No version field in kdna.json');

  // Parse semver
  const parts = oldVersion.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    error(`Invalid semver: "${oldVersion}". Expected MAJOR.MINOR.PATCH`);
  }

  let [major, minor, patch] = parts;

  switch (level) {
    case 'patch':
      patch++;
      break;
    case 'minor':
      minor++;
      patch = 0;
      break;
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      break;
  }

  const newVersion = `${major}.${minor}.${patch}`;

  console.log(`Bumping version: ${oldVersion} → ${newVersion} (${level})`);
  console.log('');

  // Update kdna.json
  manifest.version = newVersion;
  manifest.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`  ✓ kdna.json`);

  // Update all KDNA JSON files
  const kdnaFiles = fs
    .readdirSync(targetDir)
    .filter((f) => f.startsWith('KDNA_') && f.endsWith('.json'));

  for (const file of kdnaFiles) {
    const filePath = path.join(targetDir, file);
    const data = readJson(filePath);
    if (data && data.meta) {
      // meta.version is spec version, not package version — keep it
      // But update any updated/created dates
      if (data.meta.updated) {
        data.meta.updated = new Date().toISOString().slice(0, 10);
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      console.log(`  ✓ ${file} (meta unchanged — spec version)`);
    }
  }

  // CHANGELOG reminder
  const changelogPath = path.join(targetDir, 'CHANGELOG.md');
  console.log('');
  if (fs.existsSync(changelogPath)) {
    console.log(`  ⚠ Remember to add ${newVersion} entry to CHANGELOG.md`);
  } else {
    console.log(`  ⚠ Consider creating CHANGELOG.md`);
  }

  // Benchmark reminder for minor/major
  if (level === 'minor' || level === 'major') {
    console.log(`  ⚠ MINOR/MAJOR bump — must re-run benchmark before release`);
    console.log(`     kdna verify ${domainPath || '.'}`);
  }

  console.log('');
  console.log(`Done. Version: ${oldVersion} → ${newVersion}`);
}

module.exports = { cmdVersionBump };
