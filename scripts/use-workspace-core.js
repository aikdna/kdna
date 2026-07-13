'use strict';

// Monorepo end-to-end tests exercise the candidate Core workspace even when
// an already-published CLI package still declares the previous Core version.
// This avoids circular release ordering without changing any published
// consumer dependency or accepting a local file dependency in a package.

const Module = require('node:module');
const path = require('node:path');

const packageName = '@aikdna/kdna-core';
const packageRoot = path.join(__dirname, '..', 'packages', 'kdna-core');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveWorkspaceCore(request, parent, isMain, options) {
  if (request === packageName) {
    return path.join(packageRoot, 'src', 'index.js');
  }
  if (request === `${packageName}/package.json`) {
    return path.join(packageRoot, 'package.json');
  }
  if (request.startsWith(`${packageName}/`)) {
    const localRequest = path.join(packageRoot, request.slice(packageName.length + 1));
    return originalResolveFilename.call(this, localRequest, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
