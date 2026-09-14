'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const APPS = new Map([
  [15368, 'github-actions'],
  [57789, 'github-advanced-security'],
]);
const SHA = /^[a-f0-9]{40}$/u;

function repositoryName(value) {
  assert.match(value, /^aikdna\/[a-z0-9-]+$/u, 'invalid source CI repository');
  return value;
}

function repositoryUrl(value, repository, hostname) {
  const url = new URL(value);
  const prefix = hostname === 'api.github.com' ? `/repos/${repository}/` : `/${repository}/`;
  assert.ok(
    url.origin === `https://${hostname}` &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash,
  );
  assert.ok(url.pathname.startsWith(prefix), 'CI result belongs to another repository');
  return url;
}

function validateCheckRuns(record, commit, runs, requireExpected = true) {
  repositoryName(record.repository);
  assert.match(record.commit, SHA);
  assert.match(record.tree, SHA);
  assert.match(record.ci.head, SHA);
  assert.equal(commit.sha, record.ci.head, 'CI commit identity differs');
  assert.equal(commit.tree?.sha, record.tree, 'CI commit tree differs from selected source');
  assert.equal(
    repositoryUrl(commit.url, record.repository, 'api.github.com').pathname,
    `/repos/${record.repository}/git/commits/${record.ci.head}`,
    'CI commit URL identity differs',
  );
  assert.ok(Array.isArray(record.ci.required) && record.ci.required.length > 0);
  const required = new Map();
  for (const item of record.ci.required) {
    assert.ok(typeof item.name === 'string' && item.name.length > 0);
    assert.ok(!required.has(item.name), 'duplicate required CI name');
    assert.ok(APPS.has(item.app?.id), 'unrecognized required CI application ID');
    assert.equal(APPS.get(item.app.id), item.app.slug, 'unrecognized required CI application');
    required.set(item.name, item.app);
  }
  assert.ok(Array.isArray(runs) && runs.length > 0, 'no CI checks were observed');
  const ids = new Set();
  const seen = new Set();
  const unexecuted = [];
  const checks = [];
  for (const run of runs) {
    assert.ok(
      Number.isSafeInteger(run.id) && run.id > 0 && !ids.has(run.id),
      'invalid or duplicate CI run ID',
    );
    ids.add(run.id);
    assert.equal(run.head_sha, record.ci.head, 'CI check head differs');
    repositoryUrl(run.url, record.repository, 'api.github.com');
    assert.equal(new URL(run.url).pathname, `/repos/${record.repository}/check-runs/${run.id}`);
    const html = repositoryUrl(run.html_url, record.repository, 'github.com');
    assert.ok(APPS.has(run.app?.id), 'unrecognized observed CI application ID');
    assert.equal(APPS.get(run.app.id), run.app.slug, 'unrecognized observed CI application');
    const suffix = html.pathname.slice(record.repository.length + 1);
    if (run.app.id === 15368) {
      assert.match(
        suffix,
        new RegExp(`^/actions/runs/[1-9][0-9]*/job/${run.id}$`, 'u'),
        'Actions check URL identity differs',
      );
    } else {
      assert.equal(suffix, `/runs/${run.id}`, 'security check URL identity differs');
    }
    assert.equal(run.status, 'completed', `CI check is unfinished: ${run.name}`);
    if (required.has(run.name)) {
      const app = required.get(run.name);
      assert.equal(run.app.id, app.id, 'required CI application ID differs');
      assert.equal(run.app.slug, app.slug, 'required CI application identity differs');
      assert.equal(run.conclusion, 'success', `required CI check did not succeed: ${run.name}`);
      seen.add(run.name);
    } else {
      if (run.conclusion !== 'success')
        unexecuted.push({ name: run.name, conclusion: run.conclusion, url: run.html_url });
      assert.equal(
        run.conclusion,
        'success',
        `observed CI check failed, was cancelled, or did not execute: ${run.name}`,
      );
    }
    checks.push({
      id: run.id,
      name: run.name,
      head: run.head_sha,
      app: { id: run.app.id, slug: run.app.slug },
      conclusion: run.conclusion,
      url: run.html_url,
    });
  }
  if (requireExpected)
    assert.deepEqual(
      [...seen].sort(),
      [...required.keys()].sort(),
      'required CI checks are missing',
    );
  return {
    repository: record.repository,
    source_commit: record.commit,
    source_tree: record.tree,
    ci_head: record.ci.head,
    execution: 'remote-check-runs',
    required_checks: [...seen].sort(),
    checks,
    unexecuted_optional_checks: unexecuted,
  };
}

async function githubJson(endpoint) {
  assert.match(endpoint, /^repos\/aikdna\/[a-z0-9-]+\//u);
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    const response = await fetch(`https://api.github.com/${endpoint}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'KDNA-source-integration',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(30000),
    });
    assert.ok(response.ok, `GitHub CI query returned HTTP ${response.status}`);
    const text = await response.text();
    assert.ok(Buffer.byteLength(text) <= 8 * 1024 * 1024, 'GitHub CI response exceeds its bound');
    return JSON.parse(text);
  }
  const result = spawnSync('gh', ['api', endpoint], {
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 8 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  assert.ok(!result.error && result.status === 0, 'authenticated GitHub CI query failed');
  return JSON.parse(result.stdout);
}

async function queryChecks(record, request, requireExpected) {
  repositoryName(record.repository);
  assert.match(record.ci.head, SHA);
  const commit = await request(`repos/${record.repository}/git/commits/${record.ci.head}`);
  const runs = [];
  let count;
  for (let page = 1; page <= 20; page += 1) {
    const response = await request(
      `repos/${record.repository}/commits/${record.ci.head}/check-runs?filter=all&per_page=100&page=${page}`,
    );
    assert.ok(
      Number.isSafeInteger(response.total_count) &&
        response.total_count >= 0 &&
        response.total_count <= 2000,
    );
    if (count === undefined) count = response.total_count;
    assert.equal(response.total_count, count, 'CI check inventory changed during pagination');
    assert.ok(Array.isArray(response.check_runs));
    runs.push(...response.check_runs);
    if (runs.length >= count) {
      assert.equal(runs.length, count, 'CI check inventory is inconsistent');
      if (!requireExpected && runs.length === 0) {
        assert.equal(commit.sha, record.commit);
        assert.equal(commit.tree?.sha, record.tree);
        assert.equal(
          repositoryUrl(commit.url, record.repository, 'api.github.com').pathname,
          `/repos/${record.repository}/git/commits/${record.commit}`,
          'post-merge commit URL identity differs',
        );
        return {
          repository: record.repository,
          source_commit: record.commit,
          execution: 'remote-check-runs',
          status: 'no-post-merge-checks-observed',
          checks: [],
        };
      }
      return validateCheckRuns(record, commit, runs, requireExpected);
    }
    assert.ok(response.check_runs.length > 0, 'CI check inventory is truncated');
  }
  throw new Error('CI check pagination exceeded its bound');
}

async function verifyChildChecks(record, request = githubJson) {
  const reviewed = await queryChecks(record, request, true);
  const postMerge =
    record.commit === record.ci.head
      ? reviewed
      : await queryChecks({ ...record, ci: { ...record.ci, head: record.commit } }, request, false);
  return {
    repository: record.repository,
    source_commit: record.commit,
    source_tree: record.tree,
    reviewed,
    post_merge: postMerge,
  };
}

module.exports = { validateCheckRuns, verifyChildChecks };
