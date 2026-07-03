#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const reposRoot = process.env.KDNA_REPOS_ROOT
  ? path.resolve(process.env.KDNA_REPOS_ROOT)
  : path.resolve(repoRoot, '..');

const packages = [
  {
    repo: 'kdna-web-server',
    packageName: '@aikdna/kdna-web-server',
    scripts: ['ci', 'test', 'lint'],
    files: [
      'package-lock.json',
      'scripts/lint.js',
      'src/index.js',
      'src/runtime.js',
      'src/storage.js',
      'src/adapters/nextjs/index.js',
      'src/adapters/express/index.js',
      'src/adapters/cloudflare/index.js',
      'tests/server.test.js',
    ],
    exports: ['.', './nextjs', './express', './cloudflare'],
    forbiddenPeerDependencies: ['@aikdna/kdna-studio-core'],
    exactPeerDependencies: {
      '@aikdna/kdna-core': '^0.15.10',
    },
    packageJsonFiles: ['package.json'],
  },
  {
    repo: 'kdna-web-client',
    packageName: '@aikdna/kdna-web-client',
    scripts: ['ci', 'test', 'build', 'size'],
    files: [
      'package-lock.json',
      'scripts/build.js',
      'scripts/size.js',
      'src/index.js',
      'tests/client.test.js',
    ],
    exports: ['.'],
    packageJsonFiles: ['package.json'],
    forbiddenText: [
      {
        files: ['README.md', 'docs/security-model.md', 'CONTRIBUTING.md'],
        patterns: [
          'Passwords and license keys are arguments',
          'must not accept, store, or transmit passwords or',
        ],
      },
    ],
  },
  {
    repo: 'kdna-react',
    packageName: '@aikdna/kdna-react',
    scripts: ['ci', 'test', 'build'],
    files: ['package-lock.json', 'scripts/build.js', 'src/index.js', 'tests/react.test.js'],
    exports: ['.'],
    peerDependencies: ['react', 'react-dom'],
    forbiddenPeerDependencies: ['@aikdna/kdna-web-client', '@aikdna/kdna-web-server'],
    packageJsonFiles: ['package.json'],
    forbiddenFiles: ['docs/components/KDNACreatorWizard.md', 'docs/components/KDNAExportButton.md'],
    forbiddenText: [
      {
        files: ['README.md', 'src/index.js'],
        patterns: ['KDNACreatorWizard', 'data-kdna-creator-wizard'],
      },
      {
        files: ['README.md', 'src/index.js'],
        patterns: ['KDNAExportButton'],
      },
      {
        files: ['README.md'],
        patterns: ['/export'],
      },
      {
        files: ['NOTICE', 'CONTRIBUTING.md', 'SECURITY.md'],
        patterns: [
          'builds on @aikdna/kdna-web-client',
          'wrappers over `@aikdna/kdna-web-client`',
          'wraps web-client/server adapter state',
          'asset creation',
        ],
      },
    ],
  },
  {
    repo: 'create-kdna-web-app',
    packageName: 'create-kdna-web-app',
    scripts: ['ci', 'test'],
    files: [
      'package-lock.json',
      'bin/create-kdna-web-app.js',
      'src/scaffold.js',
      'tests/scaffold.test.js',
      'templates/nextjs/package.json',
      'templates/nextjs/.env.local.example',
      'templates/nextjs/app/api/kdna/[...route]/route.js',
      'templates/nextjs/app/page.jsx',
      'templates/nextjs/scripts/smoke.mjs',
      'templates/nextjs-pages/package.json',
      'templates/nextjs-pages/.env.local.example',
      'templates/nextjs-pages/pages/api/kdna/[...route].js',
      'templates/nextjs-pages/pages/index.jsx',
      'templates/nextjs-pages/scripts/smoke.mjs',
      'templates/express/package.json',
      'templates/express/.env.example',
      'templates/express/src/server.js',
      'templates/express/public/index.html',
      'templates/express/scripts/smoke.mjs',
    ],
    bins: ['create-kdna-web-app'],
    packageJsonFiles: [
      'package.json',
      'templates/nextjs/package.json',
      'templates/nextjs-pages/package.json',
      'templates/express/package.json',
    ],
    forbiddenText: [
      {
        files: [
          'package.json',
          'README.md',
          'templates/nextjs/.env.local.example',
          'templates/nextjs/app/api/kdna/[...route]/route.js',
          'templates/nextjs-pages/.env.local.example',
          'templates/nextjs-pages/pages/api/kdna/[...route].js',
          'templates/express/.env.example',
          'templates/express/src/server.js',
        ],
        patterns: ['KDNA_REMOTE_URL', 'remoteServerUrl'],
      },
      {
        files: ['package.json', 'README.md'],
        patterns: ['bare Node.js'],
      },
      {
        files: ['README.md', 'docs/getting-started.md'],
        patterns: ['releases/latest/download'],
      },
      {
        files: [
          'README.md',
          'CONTRIBUTING.md',
          'NOTICE',
          'templates/nextjs/package.json',
          'templates/nextjs-pages/package.json',
        ],
        patterns: ['@aikdna/kdna-web-client'],
      },
    ],
  },
];

const failures = [];

function fail(repo, message) {
  failures.push(`${repo}: ${message}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function exists(root, relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function readText(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function normalizePackagePath(relPath) {
  return path.posix
    .normalize(relPath.replace(/\\/g, '/').replace(/^\.\//, ''))
    .replace(/^\.\//, '');
}

function localMarkdownLinks(markdown) {
  const links = [];
  const markdownLinkPattern = /!?\[[^\]]+\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g;
  for (const match of markdown.matchAll(markdownLinkPattern)) {
    const target = match[1].trim();
    if (
      !target ||
      target.startsWith('#') ||
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('mailto:') ||
      target.startsWith('tel:') ||
      target.startsWith('/')
    ) {
      continue;
    }

    const withoutFragment = target.split('#')[0].split('?')[0];
    if (!withoutFragment) continue;
    links.push(normalizePackagePath(withoutFragment));
  }
  return links;
}

function packageFilesInclude(pkg, relPath) {
  const normalizedPath = normalizePackagePath(relPath);
  if (normalizedPath === 'package.json') return true;

  for (const entry of pkg.files || []) {
    const normalizedEntry = normalizePackagePath(entry);
    if (normalizedEntry.endsWith('/')) {
      if (normalizedPath.startsWith(normalizedEntry)) return true;
      continue;
    }
    if (normalizedPath === normalizedEntry) return true;
  }
  return false;
}

function exportedPath(pkg, key) {
  const target = pkg.exports && pkg.exports[key];
  if (typeof target === 'string') return target;
  if (target && typeof target === 'object') {
    return target.default || target.import || target.require || null;
  }
  return null;
}

function dependencySections(pkg) {
  return [
    ['dependencies', pkg.dependencies],
    ['devDependencies', pkg.devDependencies],
    ['peerDependencies', pkg.peerDependencies],
    ['optionalDependencies', pkg.optionalDependencies],
  ];
}

function checkPackageDependencyRanges(repo, root, relPath) {
  if (!exists(root, relPath)) return;
  const pkg = readJson(path.join(root, relPath));
  for (const [sectionName, section] of dependencySections(pkg)) {
    if (!section || typeof section !== 'object') continue;
    for (const [depName, range] of Object.entries(section)) {
      if (range === 'latest') {
        fail(repo, `${relPath} ${sectionName}.${depName} uses floating range: latest`);
      }
    }
  }
}

for (const spec of packages) {
  const root = path.join(reposRoot, spec.repo);
  if (!fs.existsSync(root)) {
    fail(spec.repo, `repository not found under ${reposRoot}`);
    continue;
  }

  const packagePath = path.join(root, 'package.json');
  if (!fs.existsSync(packagePath)) {
    fail(spec.repo, 'missing package.json');
    continue;
  }

  const pkg = readJson(packagePath);
  if (pkg.name !== spec.packageName) {
    fail(spec.repo, `package name mismatch: expected ${spec.packageName}, got ${pkg.name}`);
  }

  for (const relPath of spec.packageJsonFiles || ['package.json']) {
    checkPackageDependencyRanges(spec.repo, root, relPath);
  }

  for (const scriptName of spec.scripts || []) {
    if (!pkg.scripts || !pkg.scripts[scriptName]) {
      fail(spec.repo, `missing npm script: ${scriptName}`);
    }
  }

  for (const file of spec.files || []) {
    if (!exists(root, file)) fail(spec.repo, `missing file: ${file}`);
  }

  for (const file of spec.forbiddenFiles || []) {
    if (exists(root, file)) fail(spec.repo, `forbidden file present: ${file}`);
  }

  if (exists(root, 'README.md')) {
    for (const target of localMarkdownLinks(readText(root, 'README.md'))) {
      if (target.includes('..')) {
        fail(spec.repo, `README.md links outside package root: ${target}`);
        continue;
      }
      if (!exists(root, target)) {
        fail(spec.repo, `README.md links to missing local file: ${target}`);
        continue;
      }
      if (!packageFilesInclude(pkg, target)) {
        fail(spec.repo, `README.md links to local file omitted from package files: ${target}`);
      }
    }
  }

  for (const key of spec.exports || []) {
    const target = exportedPath(pkg, key);
    if (!target) {
      fail(spec.repo, `missing export: ${key}`);
      continue;
    }
    if (!exists(root, target)) {
      fail(spec.repo, `export ${key} points to missing file: ${target}`);
    }
  }

  for (const binName of spec.bins || []) {
    const target = pkg.bin && pkg.bin[binName];
    if (!target) {
      fail(spec.repo, `missing bin: ${binName}`);
      continue;
    }
    if (!exists(root, target)) fail(spec.repo, `bin ${binName} points to missing file: ${target}`);
  }

  for (const depName of spec.peerDependencies || []) {
    if (!pkg.peerDependencies || !pkg.peerDependencies[depName]) {
      fail(spec.repo, `missing peer dependency: ${depName}`);
    }
  }

  for (const [depName, expectedRange] of Object.entries(spec.exactPeerDependencies || {})) {
    const actualRange = pkg.peerDependencies && pkg.peerDependencies[depName];
    if (actualRange !== expectedRange) {
      fail(
        spec.repo,
        `peer dependency ${depName} must be ${expectedRange}, got ${actualRange || 'missing'}`,
      );
    }
  }

  for (const depName of spec.forbiddenPeerDependencies || []) {
    if (pkg.peerDependencies && pkg.peerDependencies[depName]) {
      fail(spec.repo, `forbidden peer dependency present: ${depName}`);
    }
  }

  for (const rule of spec.forbiddenText || []) {
    for (const file of rule.files || []) {
      if (!exists(root, file)) continue;
      const text = readText(root, file);
      for (const pattern of rule.patterns || []) {
        if (text.includes(pattern)) fail(spec.repo, `${file} contains forbidden text: ${pattern}`);
      }
    }
  }
}

if (failures.length > 0) {
  for (const message of failures) console.error(`FAIL ${message}`);
  console.error(`web package readiness failed: ${failures.length} failure(s)`);
  process.exit(1);
}

console.log(`web package readiness passed: ${packages.length} package(s)`);
