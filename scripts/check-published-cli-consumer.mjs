#!/usr/bin/env node
// Installs the published CLI in an empty consumer prefix and exercises the
// public teaching sample through inspect, validate, and exact-selection read.
// Registry byte checks prove what was served; this gate proves that a consumer
// can install and use that served coordinate without a source checkout.
import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAMPLE = join(ROOT, 'examples/native-team-update/team-update-1.0.0.kdna');
const ASSET_ID = 'asset:team-update-format';
const ASSET_VERSION = '1.0.0';
const JUDGMENT_ID = 'update:order';

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env,
    maxBuffer: 8 * 1024 * 1024,
    timeout: 180_000,
  });
  if (result.error) fail(`${command}: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    fail(`${command} exited ${result.status}${detail ? `\n${detail}` : ''}`);
  }
  return result.stdout.trim();
}

function parseJson(output, label) {
  try {
    return JSON.parse(output);
  } catch {
    return fail(`${label} did not return one JSON document`);
  }
}

function budgetBytes(value, label) {
  if (typeof value === 'string' && /^[0-9a-f]+$/u.test(value)) return BigInt(`0x${value}`);
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  return fail(`${label} is not a nonnegative byte count`);
}

async function main() {
  const matrix = JSON.parse(readFileSync(join(ROOT, 'docs/release-coordinates.json'), 'utf8'));
  const cli = matrix.packages.find((entry) => entry.unit === 'cli');
  assert(cli?.name === '@aikdna/kdna-cli', 'release matrix has no published CLI coordinate');
  assert(
    typeof cli.version === 'string' && cli.version.length > 0,
    'CLI coordinate has no version',
  );

  const work = await mkdtemp(join(tmpdir(), 'kdna-published-consumer-'));
  try {
    const home = join(work, 'home');
    const prefix = join(work, 'prefix');
    const cache = join(work, 'npm-cache');
    const userconfig = join(work, 'npmrc');
    await Promise.all([mkdir(home), mkdir(prefix), mkdir(cache)]);

    const env = {
      ...process.env,
      CI: '1',
      HOME: home,
      npm_config_audit: 'false',
      npm_config_cache: cache,
      npm_config_fund: 'false',
      npm_config_update_notifier: 'false',
      npm_config_userconfig: userconfig,
    };
    run(
      'npm',
      [
        'install',
        '--prefix',
        prefix,
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--save-exact',
        `${cli.name}@${cli.version}`,
      ],
      env,
    );

    const executable = join(
      prefix,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'kdna.cmd' : 'kdna',
    );
    assert(
      run(executable, ['--version'], env) === cli.version,
      'installed CLI reports the wrong version',
    );

    const inspected = parseJson(run(executable, ['inspect', SAMPLE, '--json'], env), 'inspect');
    assert(inspected.status === 'accepted', 'public sample was not accepted by inspect');
    assert(inspected.format_valid === true, 'public sample format is not valid');
    assert(inspected.asset?.asset_id === ASSET_ID, 'public sample asset_id changed');
    assert(inspected.asset?.asset_version === ASSET_VERSION, 'public sample asset version changed');

    const validated = parseJson(
      run(executable, ['validate', SAMPLE, '--json', '--system'], env),
      'validate --system',
    );
    assert(validated.status === 'accepted', 'public sample was not accepted by validate --system');

    const read = parseJson(
      run(
        executable,
        [
          'read',
          SAMPLE,
          '--mode',
          'exact_selection',
          '--asset-id',
          ASSET_ID,
          '--asset-version',
          ASSET_VERSION,
          '--judgment-id',
          JUDGMENT_ID,
          '--budget',
          '1000000',
          '--allow-read',
          '--view',
          'full',
        ],
        env,
      ),
      'read',
    );
    const envelope = read.envelope;
    assert(read.channel === 'read_envelope', 'public sample read did not return a read envelope');
    assert(envelope?.status === 'ready', 'public sample exact read is not ready');
    assert(envelope?.mode === 'exact_selection', 'public sample read used the wrong mode');
    assert(envelope?.asset?.asset_id === ASSET_ID, 'public sample read changed asset_id');
    assert(
      envelope?.asset?.asset_version === ASSET_VERSION,
      'public sample read changed asset version',
    );
    assert(
      Array.isArray(envelope?.content?.selected?.judgment_ids) &&
        envelope.content.selected.judgment_ids.includes(JUDGMENT_ID),
      'public sample read did not return the selected judgment',
    );
    const limit = budgetBytes(envelope?.budget?.limit_bytes, 'read budget limit');
    const required = budgetBytes(envelope?.budget?.required_bytes, 'read required bytes');
    assert(required <= limit, 'public sample read exceeded its budget');

    console.log(
      `published consumer smoke passed: ${cli.name}@${cli.version}, ` +
        `${ASSET_ID}@${ASSET_VERSION}/${JUDGMENT_ID}, ${required} bytes`,
    );
  } finally {
    await rm(work, { force: true, recursive: true });
  }
}

function isEntryPoint() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  try {
    await main();
  } catch (error) {
    console.error(`published consumer smoke failed: ${error.message}`);
    process.exitCode = 1;
  }
}
