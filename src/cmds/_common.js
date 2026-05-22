const fs = require('fs');
const path = require('path');
const { loadRegistry: loadCanonicalRegistry } = require('../registry');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const INSTALL_DIR = path.join(USER_KDNA_DIR, 'domains');

function usage() {
  console.log(`kdna — KDNA domain cognition asset tool

Usage:

  --- Domain authors ---
  kdna init <name>              Scaffold a new KDNA domain from template
  kdna validate <path>          Validate a domain directory
  kdna validate --schema <path>   ...with JSON Schema
  kdna pack <path>              Pack a domain folder into a .kdna container
  kdna pack --output <dir> <path>   Output .kdna to specific directory
  kdna unpack <path>            Unpack a .kdna container to a folder
  kdna inspect <path>           Inspect a domain directory or .kdna file
  kdna publish <path>           Pack + sign + output registry patch
  kdna publish <path> --release-tag <tag> --repo <o/r>   ...also upload to GitHub
  kdna publish --check <path>   Run quality gate only (no pack/upload)
  kdna version bump <patch|minor|major> [path]   Bump domain version
  kdna cluster lint <path>      Validate a cluster manifest

  --- Domain consumers ---
  kdna install <name>           Install official domain: @aikdna/<name>
  kdna install @scope/name      Install any scoped domain
  kdna install @aikdna/animation    Install a cluster (installs all sub-domains)
  kdna install ./file.kdna      Install from a local .kdna file
  kdna install ./folder         Install from a local directory (dev)
  kdna remove <name>            Uninstall a domain
  kdna update <name>            Update an installed domain
  kdna update --all             Update all installed domains
  kdna info <name>              Show version, signature, governance, risks
  kdna list                     List installed domains
  kdna list --available         List available domains from registry
  kdna search <keyword>         Search registry by name/keywords/insight
  kdna registry refresh         Refresh the canonical registry cache

  --- Quality + judgment ---
  kdna verify <name>            Quality check: structure + trust + judgment
  kdna compare <name> --input "<text>"   With/without KDNA reasoning diff
  kdna diff <name>@<v1> <name>@<v2>      Judgment-level diff between versions

  --- Agent-facing (called by the kdna-loader skill) ---
  kdna available [--json]                List installed domains + v2.1 fields
  kdna match "<task>" [--json]           Hint signals (dropped + weak overlap)
  kdna load <name> [--as=prompt|json|raw]   Emit domain in agent-ready format

  --- Identity ---
  kdna identity init            Generate Ed25519 identity key pair
  kdna identity show            Display public key and buyer ID
  kdna identity export [--out]  Backup private key (passphrase-encrypted)
  kdna identity import <file>   Restore identity from backup

  --- Other ---
  kdna setup                    One-command setup: CLI + skill + data root
  kdna version                  Show kdna CLI version
  kdna help                     Show this help

Examples:
  kdna install writing
  kdna verify @aikdna/writing
  kdna available
  kdna init my_domain
  kdna publish ./my_domain --release-tag v0.1.0 --repo yourname/kdna-my_domain`);
}

function error(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function loadRegistry() {
  return loadCanonicalRegistry({ allowNetwork: true });
}

module.exports = {
  USER_KDNA_DIR,
  INSTALL_DIR,
  usage,
  error,
  readJson,
  writeJson,
  loadRegistry,
};
