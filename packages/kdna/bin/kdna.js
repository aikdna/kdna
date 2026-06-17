#!/usr/bin/env node
/**
 * kdna — KDNA CLI shim with KDNA Core v1 route awareness.
 *
 * Routing rules:
 *
 *   inspect  <path>      v1 source dir or v1 .kdna container → v1 logic
 *                        anything else                            → upstream
 *   validate <path>      v1 source dir or v1 .kdna container → v1 logic
 *                        anything else                            → upstream
 *   pack     <src> <out> v1 source dir                            → v1 logic
 *                        anything else                            → upstream
 *   unpack   <in>  <out> v1 .kdna container                       → v1 logic
 *                        anything else                            → upstream
 *
 *   <anything else>                                              → upstream
 *
 * v2 (legacy `application/vnd.aikdna.kdna+zip`) and arbitrary
 * non-v1 inputs are deliberately NOT routed to v1 logic. They fall
 * through to the upstream @aikdna/kdna-cli, which keeps its existing
 * behavior (including its "use kdna dev …" error for directory ops).
 *
 * The upstream CLI is the canonical v0.20.x runtime control plane.
 * This shim only adds v1 detection so the v1 file format — a thin,
 * content-neutral asset format defined in docs/core/ — is reachable
 * from the `kdna` entry point that npm packages expose.
 */

'use strict';

const path = require('node:path');

const args = process.argv.slice(2);
const cmd = args[0];

if (shouldRouteV1(args)) {
  routeV1(args);
} else {
  // Defer everything else to the upstream CLI.
  require('@aikdna/kdna-cli/src/cli.js');
}

function shouldRouteV1(args) {
  const cmd = args[0];
  if (cmd !== 'inspect' && cmd !== 'validate' && cmd !== 'pack' && cmd !== 'unpack') {
    return false;
  }
  // Find the first non-flag argument (the input path).
  const positional = args.slice(1).filter((a) => !a.startsWith('--'));
  if (positional.length === 0) return false;
  const input = positional[0];
  const abs = path.resolve(input);
  try {
    return require('../src/v1-cli').isV1SourceDir(abs) || require('../src/v1-cli').detectContainerFormat(abs) === 'v1';
  } catch {
    return false;
  }
}

function routeV1(args) {
  const v1 = require('../src/v1-cli');
  const cmd = args[0];
  const jsonMode = args.includes('--json');
  const positional = args.slice(1).filter((a) => !a.startsWith('--'));
  const input = positional[0];

  try {
    if (cmd === 'inspect') {
      const out = v1.inspect(input);
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'validate') {
      const result = v1.validate(input);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.overall_valid ? 0 : 1);
    }
    if (cmd === 'pack') {
      const out = positional[1];
      if (!out) {
        console.error('Usage: kdna pack <source-dir> <output.kdna>');
        process.exit(2);
      }
      const r = v1.pack(input, out);
      console.log(`Packed: ${r.outputPath}`);
      console.log(`Entries: ${r.entries.length} (${r.entries.join(', ')})`);
      return;
    }
    if (cmd === 'unpack') {
      const out = positional[1];
      if (!out) {
        console.error('Usage: kdna unpack <input.kdna> <output-dir>');
        process.exit(2);
      }
      const r = v1.unpack(input, out);
      console.log(`Unpacked: ${r.outputDir}`);
      console.log(`Entries: ${r.entries.length} (${r.entries.join(', ')})`);
      return;
    }
  } catch (e) {
    // Content-neutral error: never decorate with trust / recommended /
    // high_quality / officially_approved.
    console.error(`v1 ${cmd} failed: ${e.message}`);
    process.exit(1);
  }
}
