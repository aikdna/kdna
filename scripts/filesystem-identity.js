'use strict';

const fs = require('node:fs');
const path = require('node:path');

function normalizeWindowsIdentity(resolvedPath) {
  let normalized = path.win32.normalize(String(resolvedPath).replaceAll('/', '\\'));
  if (/^\\\\\?\\UNC\\/iu.test(normalized)) {
    normalized = `\\\\${normalized.slice(8)}`;
  } else if (/^\\\\\?\\/u.test(normalized)) {
    normalized = normalized.slice(4);
  }
  const root = path.win32.parse(normalized).root;
  while (normalized.length > root.length && normalized.endsWith('\\')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized.toLowerCase();
}

function canonicalFilesystemIdentity(inputPath, options = {}) {
  const platform = options.platform || process.platform;
  const realpath = options.realpath || fs.realpathSync.native || fs.realpathSync;
  const resolved = realpath(inputPath);
  if (platform === 'win32') return normalizeWindowsIdentity(resolved);
  return path.normalize(resolved);
}

function sameFilesystemIdentity(left, right, options = {}) {
  return canonicalFilesystemIdentity(left, options) === canonicalFilesystemIdentity(right, options);
}

module.exports = {
  canonicalFilesystemIdentity,
  normalizeWindowsIdentity,
  sameFilesystemIdentity,
};
