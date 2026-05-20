const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const REGISTRY_DIR = path.join(USER_KDNA_DIR, 'registry');
const REGISTRY_CACHE = path.join(REGISTRY_DIR, 'domains.json');
const CANONICAL_REGISTRY_URL =
  process.env.KDNA_REGISTRY_URL ||
  'https://raw.githubusercontent.com/knowledge-dna/kdna-registry/main/domains.json';

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeRegistry(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.domains)) return data.domains;
  return null;
}

function fetchRegistry() {
  const raw = execFileSync('curl', ['-fsSL', CANONICAL_REGISTRY_URL], {
    encoding: 'utf8',
    timeout: 30000,
  });
  const data = JSON.parse(raw);
  const domains = normalizeRegistry(data);
  if (!domains) throw new Error('Registry response does not contain a domains array');
  fs.mkdirSync(REGISTRY_DIR, { recursive: true });
  fs.writeFileSync(REGISTRY_CACHE, JSON.stringify(data, null, 2) + '\n');
  return domains;
}

function loadRegistry(options = {}) {
  const { allowNetwork = false, refresh = false } = options;

  const envFile = process.env.KDNA_REGISTRY_FILE;
  if (!refresh && envFile) {
    const domains = normalizeRegistry(readJson(envFile));
    if (domains) return domains;
  }

  if (!refresh) {
    const cached = normalizeRegistry(readJson(REGISTRY_CACHE));
    if (cached) return cached;
  }

  if (allowNetwork) {
    try {
      return fetchRegistry();
    } catch {
      const cached = normalizeRegistry(readJson(REGISTRY_CACHE));
      if (cached) return cached;
    }
  }

  const fixture = path.join(__dirname, '..', 'registry', 'domains.json');
  return normalizeRegistry(readJson(fixture)) || [];
}

module.exports = {
  CANONICAL_REGISTRY_URL,
  REGISTRY_CACHE,
  fetchRegistry,
  loadRegistry,
};
