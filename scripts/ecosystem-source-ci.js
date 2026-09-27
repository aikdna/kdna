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

function actionsRunId(record, run) {
  assert.ok(Number.isSafeInteger(run.id) && run.id > 0, 'invalid Actions check ID');
  const html = repositoryUrl(run.html_url, record.repository, 'github.com');
  const suffix = html.pathname.slice(record.repository.length + 1);
  const match = suffix.match(new RegExp(`^/actions/runs/([1-9][0-9]*)/job/${run.id}$`, 'u'));
  assert.ok(match, 'Actions check URL identity differs');
  const id = Number(match[1]);
  assert.ok(Number.isSafeInteger(id), 'invalid Actions run ID');
  return id;
}

function maintenanceCandidate(record, run) {
  return (
    run.name === 'Dependabot' &&
    run.app?.id === 15368 &&
    run.app.slug === 'github-actions' &&
    !record.ci.required.some((item) => item.name === run.name)
  );
}

function validateMaintenanceRun(record, check, action) {
  assert.ok(action && typeof action === 'object', 'Dependabot Actions run metadata is missing');
  const id = actionsRunId(record, check);
  const api = `https://api.github.com/repos/${record.repository}`;
  const html = `https://github.com/${record.repository}`;
  assert.equal(check.details_url, check.html_url, 'maintenance check details URL differs');
  assert.equal(action.id, id, 'maintenance Actions run ID differs');
  assert.equal(action.url, `${api}/actions/runs/${id}`, 'maintenance API URL differs');
  assert.equal(action.html_url, `${html}/actions/runs/${id}`, 'maintenance HTML URL differs');
  assert.equal(action.head_sha, record.ci.head, 'maintenance head differs');
  assert.equal(action.head_commit?.id, record.ci.head, 'maintenance commit differs');
  assert.equal(action.head_commit?.tree_id, record.tree, 'maintenance tree differs');
  assert.ok(
    Number.isSafeInteger(check.check_suite?.id) && check.check_suite.id > 0,
    'maintenance check suite identity is missing',
  );
  assert.equal(action.check_suite_id, check.check_suite.id, 'maintenance check suite differs');
  assert.equal(action.check_suite_url, `${api}/check-suites/${check.check_suite.id}`);
  assert.ok(Number.isSafeInteger(action.workflow_id) && action.workflow_id > 0);
  assert.equal(action.workflow_url, `${api}/actions/workflows/${action.workflow_id}`);
  assert.equal(action.jobs_url, `${api}/actions/runs/${id}/jobs`);
  assert.equal(
    action.path,
    'dynamic/dependabot/dependabot-updates',
    'not a Dependabot update path',
  );
  assert.equal(action.event, 'dynamic', 'not a Dependabot update event');
  assert.equal(action.status, 'completed', 'maintenance Actions run is unfinished');
  assert.equal(action.conclusion, check.conclusion, 'maintenance conclusion differs');
  assert.ok(
    ['success', 'failure'].includes(action.conclusion),
    'unsupported maintenance conclusion',
  );
  assert.ok(Number.isSafeInteger(action.run_attempt) && action.run_attempt > 0);
  for (const actor of [action.actor, action.triggering_actor]) {
    assert.equal(actor?.login, 'dependabot[bot]', 'maintenance actor login differs');
    assert.equal(actor.id, 49699333, 'maintenance actor ID differs');
    assert.equal(actor.type, 'Bot', 'maintenance actor type differs');
    assert.equal(actor.url, 'https://api.github.com/users/dependabot%5Bbot%5D');
    assert.equal(actor.html_url, 'https://github.com/apps/dependabot');
  }
  for (const repository of [action.repository, action.head_repository]) {
    assert.equal(repository?.full_name, record.repository, 'maintenance repository differs');
    assert.equal(repository.name, record.repository.split('/')[1]);
    assert.equal(repository.owner?.login, record.repository.split('/')[0]);
    assert.ok(Number.isSafeInteger(repository.id) && repository.id > 0);
    assert.equal(repository.url, api, 'maintenance repository API URL differs');
    assert.equal(repository.html_url, html, 'maintenance repository HTML URL differs');
    assert.equal(repository.fork, false, 'maintenance repository is a fork');
  }
  assert.equal(
    action.repository.id,
    action.head_repository.id,
    'maintenance repository ID differs',
  );
  return {
    classification: 'dependabot-automated-update',
    code_acceptance: false,
    update_failure_unresolved: check.conclusion === 'failure',
    actions_run: {
      id,
      url: action.html_url,
      api_url: action.url,
      check_suite_id: action.check_suite_id,
      workflow_id: action.workflow_id,
      path: action.path,
      event: action.event,
      run_attempt: action.run_attempt,
      repository_id: action.repository.id,
      actor: { id: action.actor.id, login: action.actor.login, type: action.actor.type },
      triggering_actor: {
        id: action.triggering_actor.id,
        login: action.triggering_actor.login,
        type: action.triggering_actor.type,
      },
    },
  };
}

function validateCheckRuns(record, commit, runs, requireExpected = true, actions = new Map()) {
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
  const maintenance = [];
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
      actionsRunId(record, run);
    } else {
      assert.equal(suffix, `/runs/${run.id}`, 'security check URL identity differs');
    }
    assert.equal(run.status, 'completed', `CI check is unfinished: ${run.name}`);
    const observed = {
      id: run.id,
      name: run.name,
      head: run.head_sha,
      app: { id: run.app.id, slug: run.app.slug },
      conclusion: run.conclusion,
      url: run.html_url,
    };
    if (required.has(run.name)) {
      const app = required.get(run.name);
      assert.equal(run.app.id, app.id, 'required CI application ID differs');
      assert.equal(run.app.slug, app.slug, 'required CI application identity differs');
      assert.equal(run.conclusion, 'success', `required CI check did not succeed: ${run.name}`);
      seen.add(run.name);
    } else if (maintenanceCandidate(record, run)) {
      maintenance.push({
        ...observed,
        ...validateMaintenanceRun(record, run, actions.get(actionsRunId(record, run))),
      });
      continue;
    } else {
      if (run.conclusion !== 'success')
        unexecuted.push({ name: run.name, conclusion: run.conclusion, url: run.html_url });
      assert.equal(
        run.conclusion,
        'success',
        `observed CI check failed, was cancelled, or did not execute: ${run.name}`,
      );
    }
    checks.push(observed);
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
    maintenance_checks: maintenance,
    maintenance_failures_unresolved: maintenance.some((check) => check.update_failure_unresolved),
    unexecuted_optional_checks: unexecuted,
  };
}

async function githubJson(endpoint) {
  assert.match(endpoint, /^repos\/aikdna\/[a-z0-9-]+\//u);
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    const response = await fetch(`https://api.github.com/${endpoint}`, {
      redirect: 'error',
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
  const result = spawnSync('gh', ['api', '--hostname', 'github.com', endpoint], {
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
      const actions = new Map();
      for (const run of runs)
        if (maintenanceCandidate(record, run)) {
          const id = actionsRunId(record, run);
          if (!actions.has(id))
            actions.set(id, await request(`repos/${record.repository}/actions/runs/${id}`));
        }
      return validateCheckRuns(record, commit, runs, requireExpected, actions);
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
