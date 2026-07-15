#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT = path.join(SCRIPT_DIR, 'post-cutover-token-authority.json');
const EXPECTED_REPOSITORY = 'open/kdna';
const EXPECTED_TOKEN_COUNT = 62;

function tokenSetDigest(encodedTokens) {
  return createHash('sha256').update(JSON.stringify(encodedTokens)).digest('hex');
}

function buildTokenAuthority(manifest) {
  if (!manifest || typeof manifest !== 'object' || !Array.isArray(manifest.entries)) {
    throw new Error('migration manifest entries are required');
  }
  const tokens = manifest.entries
    .filter((entry) => entry.repo === EXPECTED_REPOSITORY && entry.classification === 'A')
    .flatMap((entry) => {
      if (!Array.isArray(entry.replacements)) {
        throw new Error(`migration entry ${entry.id || '<unknown>'} has no replacements`);
      }
      return entry.replacements;
    })
    .filter((replacement) => replacement.kind !== 'shape')
    .map((replacement) => {
      if (typeof replacement.old !== 'string' || replacement.old.length === 0) {
        throw new Error('migration replacement old value must be a non-empty string');
      }
      return Buffer.from(replacement.old, 'utf8').toString('base64');
    })
    .sort();

  if (tokens.length !== EXPECTED_TOKEN_COUNT || new Set(tokens).size !== EXPECTED_TOKEN_COUNT) {
    throw new Error(
      `expected ${EXPECTED_TOKEN_COUNT} unique non-shape tokens, received ${tokens.length}`,
    );
  }
  return {
    schema: 'kdna.post-cutover-token-authority',
    schema_version: '0.1.0',
    repository: EXPECTED_REPOSITORY,
    encoding: 'base64',
    count: EXPECTED_TOKEN_COUNT,
    token_set_sha256: tokenSetDigest(tokens),
    tokens,
  };
}

function serializeTokenAuthority(authority) {
  return `${JSON.stringify(authority, null, 2)}\n`;
}

function parseArgs(args) {
  let source;
  let output = DEFAULT_OUTPUT;
  let check = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--source') source = args[++index];
    else if (argument === '--output') output = args[++index];
    else if (argument === '--check') check = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  if (!source) {
    throw new Error(
      'usage: generate-post-cutover-token-authority.mjs --source <manifest> [--output <file>] [--check]',
    );
  }
  return { source: path.resolve(source), output: path.resolve(output), check };
}

function main() {
  const { source, output, check } = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(fs.readFileSync(source, 'utf8'));
  const serialized = serializeTokenAuthority(buildTokenAuthority(manifest));
  if (check) {
    if (!fs.existsSync(output) || !fs.readFileSync(output).equals(Buffer.from(serialized))) {
      throw new Error(`post-cutover token authority is stale: ${output}`);
    }
    console.log(`Post-cutover token authority is stable: ${output}`);
    return;
  }
  fs.writeFileSync(output, serialized);
  console.log(`Post-cutover token authority generated: ${output}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export {
  buildTokenAuthority,
  EXPECTED_REPOSITORY,
  EXPECTED_TOKEN_COUNT,
  serializeTokenAuthority,
  tokenSetDigest,
};
