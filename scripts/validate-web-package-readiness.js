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
  },
  {
    repo: 'kdna-react',
    packageName: '@aikdna/kdna-react',
    scripts: ['ci', 'test', 'build'],
    files: ['package-lock.json', 'scripts/build.js', 'src/index.js', 'tests/react.test.js'],
    exports: ['.'],
    peerDependencies: ['react', 'react-dom'],
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
    forbiddenText: [
      {
        files: [
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

function exportedPath(pkg, key) {
  const target = pkg.exports && pkg.exports[key];
  if (typeof target === 'string') return target;
  if (target && typeof target === 'object') {
    return target.default || target.import || target.require || null;
  }
  return null;
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

  for (const scriptName of spec.scripts || []) {
    if (!pkg.scripts || !pkg.scripts[scriptName]) {
      fail(spec.repo, `missing npm script: ${scriptName}`);
    }
  }

  for (const file of spec.files || []) {
    if (!exists(root, file)) fail(spec.repo, `missing file: ${file}`);
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
