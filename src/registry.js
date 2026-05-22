/**
 * RegistryResolver — KDNA v0.7 registry client.
 *
 * Responsibilities:
 *   1. Resolve names: bare → @aikdna/bare, validate @scope/name format
 *   2. Route lookups to the right registry (official vs private)
 *   3. Cache registry metadata locally
 *   4. Surface scope trust info to install/publish
 *
 * Schema v2.0 — see kdna-registry/SCHEMA.md
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const REGISTRY_DIR = path.join(USER_KDNA_DIR, 'registry');
const CONFIG_FILE = path.join(USER_KDNA_DIR, 'config.json');

const DEFAULT_OFFICIAL_SCOPE = '@aikdna';
const CANONICAL_REGISTRY_URL =
  process.env.KDNA_REGISTRY_URL ||
  'https://raw.githubusercontent.com/aikdna/kdna-registry/main/domains.json';

const NAME_RE = /^@([a-z][a-z0-9-]*)\/([a-z][a-z0-9_]*)$/;
const BARE_NAME_RE = /^[a-z][a-z0-9_]*$/;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

// ─── Name parsing ───────────────────────────────────────────────────────

/**
 * Parse a name string into { scope, ident, full }.
 * - "@aikdna/writing" → { scope: "@aikdna", ident: "writing", full: "@aikdna/writing" }
 * - "writing" → expanded to default official scope → @aikdna/writing
 * Returns null if invalid.
 */
function parseName(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();

  const scoped = trimmed.match(NAME_RE);
  if (scoped) {
    return {
      scope: `@${scoped[1]}`,
      ident: scoped[2],
      full: trimmed,
      wasShort: false,
    };
  }

  if (BARE_NAME_RE.test(trimmed)) {
    const scope = DEFAULT_OFFICIAL_SCOPE;
    return {
      scope,
      ident: trimmed,
      full: `${scope}/${trimmed}`,
      wasShort: true,
    };
  }

  return null;
}

// ─── Config (multi-registry routing) ────────────────────────────────────

function loadConfig() {
  const cfg = readJson(CONFIG_FILE) || {};
  return {
    default_scope: cfg.default_scope || DEFAULT_OFFICIAL_SCOPE,
    registries: cfg.registries || {},
  };
}

// ─── Registry source ────────────────────────────────────────────────────

class RegistrySource {
  constructor(url, cacheFile) {
    this.url = url;
    this.cacheFile = cacheFile;
  }

  fetch() {
    const raw = execFileSync('curl', ['-fsSL', this.url], { encoding: 'utf8', timeout: 30000 });
    const data = JSON.parse(raw);
    writeJson(this.cacheFile, data);
    return data;
  }

  load({ allowNetwork = false, refresh = false } = {}) {
    if (!refresh) {
      const cached = readJson(this.cacheFile);
      if (cached) return cached;
    }
    if (allowNetwork) {
      try {
        return this.fetch();
      } catch {
        const cached = readJson(this.cacheFile);
        if (cached) return cached;
      }
    }
    return null;
  }
}

// ─── Resolver ───────────────────────────────────────────────────────────

class RegistryResolver {
  constructor({ allowNetwork = true, refresh = false } = {}) {
    this.allowNetwork = allowNetwork;
    this.refresh = refresh;
    this.config = loadConfig();
    this._sources = new Map();
    this._registries = new Map();
  }

  _sourceForScope(scopeName) {
    if (this._sources.has(scopeName)) return this._sources.get(scopeName);

    const cfgEntry = this.config.registries[scopeName];
    let url, cacheName;

    if (cfgEntry) {
      url = typeof cfgEntry === 'string' ? cfgEntry : cfgEntry.url;
      cacheName = `${scopeName.replace('@', '')}.json`;
    } else {
      // Default: all unknown scopes route to canonical official registry
      url = CANONICAL_REGISTRY_URL;
      cacheName = 'domains.json';
    }

    const cacheFile = path.join(REGISTRY_DIR, cacheName);
    const source = new RegistrySource(url, cacheFile);
    this._sources.set(scopeName, source);
    return source;
  }

  _loadRegistryForScope(scopeName) {
    if (this._registries.has(scopeName)) return this._registries.get(scopeName);
    const source = this._sourceForScope(scopeName);
    const data = source.load({ allowNetwork: this.allowNetwork, refresh: this.refresh });
    this._registries.set(scopeName, data);
    return data;
  }

  /**
   * Get a scope descriptor from its registry.
   * Returns { type, trust_pubkey, registry_url, verified } or null.
   */
  getScope(scopeName) {
    const reg = this._loadRegistryForScope(scopeName);
    if (!reg || !reg.scopes) return null;
    return reg.scopes[scopeName] || null;
  }

  /**
   * Resolve a name (bare or @scope/name) into:
   *   { parsed, scope, entry, registry }
   * Throws on any failure with a clear message.
   */
  resolve(input) {
    const parsed = parseName(input);
    if (!parsed) {
      throw new Error(
        `Invalid name "${input}". Use @scope/name (e.g. @aikdna/writing) or a bare name for the official scope.`,
      );
    }

    const registry = this._loadRegistryForScope(parsed.scope);
    if (!registry) {
      throw new Error(
        `Cannot load registry for scope ${parsed.scope}. Network unavailable and no cache.`,
      );
    }

    if (registry.schema_version && registry.schema_version !== '2.0') {
      throw new Error(
        `Registry schema_version ${registry.schema_version} not supported. This CLI requires 2.0.`,
      );
    }

    const scope = registry.scopes?.[parsed.scope];
    if (!scope) {
      throw new Error(`Scope ${parsed.scope} not registered in registry.`);
    }

    const entry = (registry.domains || []).find((d) => d.name === parsed.full);
    if (!entry) {
      const sameScope = (registry.domains || [])
        .filter((d) => d.name.startsWith(parsed.scope + '/'))
        .map((d) => d.name);
      const hint = sameScope.length
        ? `\nKnown ${parsed.scope}/ domains: ${sameScope.join(', ')}`
        : '';
      throw new Error(`Domain ${parsed.full} not found in registry.${hint}`);
    }

    if (entry.yanked) {
      const reason = entry.yanked_reason ? `\nReason: ${entry.yanked_reason}` : '';
      const when = entry.yanked_at ? ` (yanked ${entry.yanked_at.slice(0, 10)})` : '';
      const replace = entry.replaced_by ? `\nTry: kdna install ${entry.replaced_by}` : '';
      throw new Error(`${entry.name}@${entry.version} has been yanked${when}.${reason}${replace}`);
    }

    return { parsed, scope, entry, registry };
  }

  /**
   * List all domains across registries already loaded (does not trigger network for other scopes).
   * For now this is just the official registry's domains.
   */
  listAllDomains() {
    const reg = this._loadRegistryForScope(DEFAULT_OFFICIAL_SCOPE);
    return reg?.domains || [];
  }
}

// ─── Backwards-compatible helpers (used by remaining v0.6 code paths) ──

function loadRegistry(options = {}) {
  const resolver = new RegistryResolver({
    allowNetwork: options.allowNetwork ?? false,
    refresh: options.refresh ?? false,
  });
  return resolver.listAllDomains();
}

function fetchRegistry() {
  const source = new RegistrySource(
    CANONICAL_REGISTRY_URL,
    path.join(REGISTRY_DIR, 'domains.json'),
  );
  const data = source.fetch();
  return data.domains || [];
}

module.exports = {
  RegistryResolver,
  parseName,
  loadRegistry,
  fetchRegistry,
  CANONICAL_REGISTRY_URL,
  REGISTRY_CACHE: path.join(REGISTRY_DIR, 'domains.json'),
  DEFAULT_OFFICIAL_SCOPE,
};
