#!/usr/bin/env node
/**
 * v1-inspect.mjs — print a manifest summary for a .kdna source directory.
 *
 * Usage: node scripts/v1-inspect.mjs <source-dir>
 *
 * Outputs identity fields only. NEVER prints trust, recommended, high_quality,
 * or officially_approved (Phase 1 boundary: content-neutral output).
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: node scripts/v1-inspect.mjs <source-dir>');
  process.exit(2);
}
const abs = path.resolve(sourceDir);
if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
  console.error(`Not a directory: ${abs}`);
  process.exit(2);
}

const manifestPath = path.join(abs, 'kdna.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`Not a .kdna source directory: missing kdna.json in ${abs}`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const out = {
  asset_id: manifest.asset_id,
  asset_uid: manifest.asset_uid,
  title: manifest.title,
  version: manifest.version,
  judgment_version: manifest.judgment_version,
  asset_type: manifest.asset_type,
  kdna_version: manifest.kdna_version,
  payload: manifest.payload ? manifest.payload.path : null,
  payload_encrypted: manifest.payload ? manifest.payload.encrypted : null,
  profile: manifest.compatibility ? manifest.compatibility.profile : null,
  load_contract_default_profile: manifest.load_contract
    ? manifest.load_contract.default_profile
    : null,
};
console.log(JSON.stringify(out, null, 2));
