'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const { validateCheckRuns, verifyChildChecks } = require('./ecosystem-source-ci');

function fixture() {
  const repository = 'aikdna/kdna-core-swift';
  const head = 'a'.repeat(40);
  const tree = 'b'.repeat(40);
  const app = { id: 15368, slug: 'github-actions' };
  const record = {
    repository,
    commit: 'c'.repeat(40),
    tree,
    ci: { head, required: [{ name: 'test', app }] },
  };
  const commit = {
    sha: head,
    tree: { sha: tree },
    url: `https://api.github.com/repos/${repository}/git/commits/${head}`,
  };
  const run = (id, name = 'test') => ({
    id,
    name,
    head_sha: head,
    app: { ...app },
    url: `https://api.github.com/repos/${repository}/check-runs/${id}`,
    html_url: `https://github.com/${repository}/actions/runs/10/job/${id}`,
    status: 'completed',
    conclusion: 'success',
  });
  return { record, commit, runs: [run(1), run(2), run(3, 'additional')], run };
}

test('CI binds an exact source tree across a normal rebase and retains duplicate checks', () => {
  const f = fixture();
  const result = validateCheckRuns(f.record, f.commit, f.runs);
  assert.notEqual(result.ci_head, result.source_commit);
  assert.equal(result.checks.length, 3);
  assert.deepEqual(result.required_checks, ['test']);
});

const mutations = [
  [
    'tree differs',
    (f) => {
      f.commit.tree.sha = 'd'.repeat(40);
    },
  ],
  [
    'commit head differs',
    (f) => {
      f.commit.sha = 'd'.repeat(40);
    },
  ],
  [
    'check head differs',
    (f) => {
      f.runs[1].head_sha = 'd'.repeat(40);
    },
  ],
  [
    'wrong commit repository',
    (f) => {
      f.commit.url = f.commit.url.replace('kdna-core-swift', 'kdna');
    },
  ],
  [
    'wrong commit URL SHA',
    (f) => {
      f.commit.url = f.commit.url.replace(f.record.ci.head, 'd'.repeat(40));
    },
  ],
  [
    'unrelated same-repository commit URL',
    (f) => {
      f.commit.url = `https://api.github.com/repos/${f.record.repository}/issues/5`;
    },
  ],
  [
    'unrelated same-repository check URL',
    (f) => {
      f.runs[0].html_url = `https://github.com/${f.record.repository}/issues/5`;
    },
  ],
  [
    'wrong HTML job ID',
    (f) => {
      f.runs[0].html_url += '9';
    },
  ],
  [
    'API URL port',
    (f) => {
      f.runs[0].url = f.runs[0].url.replace('api.github.com', 'api.github.com:8443');
    },
  ],
  [
    'HTML URL query',
    (f) => {
      f.runs[0].html_url += '?job=other';
    },
  ],
  [
    'commit URL fragment',
    (f) => {
      f.commit.url += '#other';
    },
  ],
  [
    'wrong check repository',
    (f) => {
      f.runs[1].html_url = f.runs[1].html_url.replace('kdna-core-swift', 'kdna');
    },
  ],
  [
    'wrong API check identity',
    (f) => {
      f.runs[1].url += '0';
    },
  ],
  [
    'missing required check',
    (f) => {
      f.runs = [f.runs[2]];
    },
  ],
  [
    'duplicate required declaration',
    (f) => {
      f.record.ci.required.push(f.record.ci.required[0]);
    },
  ],
  [
    'missing declared application',
    (f) => {
      f.record.ci.required[0].app = {};
    },
  ],
  [
    'missing observed application',
    (f) => {
      delete f.runs[1].app;
    },
  ],
  [
    'unknown observed application',
    (f) => {
      f.runs[1].app = { id: 12, slug: 'github-actions' };
    },
  ],
  [
    'application identity differs',
    (f) => {
      f.runs[1].app.slug = 'other';
    },
  ],
  [
    'required application differs',
    (f) => {
      f.runs[1].app = { id: 57789, slug: 'github-advanced-security' };
    },
  ],
  [
    'duplicate run ID',
    (f) => {
      f.runs[1].id = 1;
    },
  ],
  [
    'unfinished duplicate',
    (f) => {
      f.runs[1].status = 'in_progress';
    },
  ],
  [
    'failed duplicate',
    (f) => {
      f.runs[1].conclusion = 'failure';
    },
  ],
  [
    'cancelled duplicate',
    (f) => {
      f.runs[1].conclusion = 'cancelled';
    },
  ],
  [
    'skipped required check',
    (f) => {
      f.runs[1].conclusion = 'skipped';
    },
  ],
  [
    'neutral required check',
    (f) => {
      f.runs[1].conclusion = 'neutral';
    },
  ],
  [
    'failed additional check',
    (f) => {
      f.runs[2].conclusion = 'failure';
    },
  ],
  [
    'cancelled additional check',
    (f) => {
      f.runs[2].conclusion = 'cancelled';
    },
  ],
  [
    'unfinished additional check',
    (f) => {
      f.runs[2].status = 'queued';
    },
  ],
  [
    'no observed checks',
    (f) => {
      f.runs = [];
    },
  ],
];
for (const [label, mutate] of mutations) {
  test(`reject ${label}`, () => {
    const f = fixture();
    mutate(f);
    assert.throws(() => validateCheckRuns(f.record, f.commit, f.runs));
  });
}

test('present skipped and neutral jobs block the result even when they are not required', () => {
  for (const conclusion of ['skipped', 'neutral']) {
    const f = fixture();
    f.runs[2].conclusion = conclusion;
    assert.throws(() => validateCheckRuns(f.record, f.commit, f.runs), /did not execute/u);
  }
});

test('all check pages are fetched, including older failed duplicate attempts', async () => {
  const f = fixture();
  const calls = [];
  f.record.commit = f.record.ci.head;
  const request = async (endpoint) => {
    calls.push(endpoint);
    if (endpoint.includes('/git/commits/')) return f.commit;
    return {
      total_count: 3,
      check_runs: endpoint.endsWith('page=1') ? f.runs.slice(0, 2) : f.runs.slice(2),
    };
  };
  assert.equal((await verifyChildChecks(f.record, request)).reviewed.checks.length, 3);
  assert.equal(calls.length, 3);
  f.runs[2].conclusion = 'failure';
  await assert.rejects(verifyChildChecks(f.record, request), /failed, was cancelled/u);
});

test('a failed post-merge check cannot be hidden by successful checks on an equal reviewed tree', async () => {
  const f = fixture();
  const request = async (endpoint) => {
    const isMain = endpoint.includes(f.record.commit);
    if (endpoint.includes('/git/commits/'))
      return {
        ...f.commit,
        sha: isMain ? f.record.commit : f.record.ci.head,
        url: `https://api.github.com/${endpoint}`,
      };
    return {
      total_count: 1,
      check_runs: isMain
        ? [{ ...f.run(5, 'extra'), head_sha: f.record.commit, conclusion: 'failure' }]
        : [f.runs[0]],
    };
  };
  await assert.rejects(verifyChildChecks(f.record, request), /failed, was cancelled/u);
});

test('an absent post-merge run inventory is disclosed, not counted as another execution', async () => {
  const f = fixture();
  const request = async (endpoint) => {
    const isMain = endpoint.includes(f.record.commit);
    if (endpoint.includes('/git/commits/'))
      return {
        ...f.commit,
        sha: isMain ? f.record.commit : f.record.ci.head,
        url: `https://api.github.com/${endpoint}`,
      };
    return { total_count: isMain ? 0 : 1, check_runs: isMain ? [] : [f.runs[0]] };
  };
  const result = await verifyChildChecks(f.record, request);
  assert.equal(result.post_merge.status, 'no-post-merge-checks-observed');
});

test('Advanced Security links use the observed run identity format', () => {
  const f = fixture();
  f.runs.push({
    ...f.run(9, 'CodeQL'),
    app: { id: 57789, slug: 'github-advanced-security' },
    html_url: `https://github.com/${f.record.repository}/runs/9`,
  });
  assert.equal(validateCheckRuns(f.record, f.commit, f.runs).checks.length, 4);
  f.runs[3].html_url += '0';
  assert.throws(() => validateCheckRuns(f.record, f.commit, f.runs), /URL identity differs/u);
});

for (const variant of ['empty page', 'changed total', 'too many rows', 'query failure']) {
  test(`CI pagination rejects ${variant}`, async () => {
    const f = fixture();
    let page = 0;
    const request = async (endpoint) => {
      if (endpoint.includes('/git/commits/')) return f.commit;
      page += 1;
      if (variant === 'query failure') throw new Error('query failed');
      if (variant === 'too many rows') return { total_count: 1, check_runs: f.runs };
      return {
        total_count: variant === 'changed total' && page === 2 ? 4 : 3,
        check_runs: page === 1 ? f.runs.slice(0, 1) : [],
      };
    };
    await assert.rejects(verifyChildChecks(f.record, request));
  });
}

function maintenanceFixture() {
  const f = fixture();
  f.record.commit = f.record.ci.head;
  const id = 35549927290;
  const api = `https://api.github.com/repos/${f.record.repository}`;
  const html = `https://github.com/${f.record.repository}`;
  f.check = {
    ...f.run(106182649896, 'Dependabot'),
    conclusion: 'failure',
    check_suite: { id: 96249279590 },
    html_url: `${html}/actions/runs/${id}/job/106182649896`,
  };
  f.check.details_url = f.check.html_url;
  f.runs.push(f.check);
  const actor = {
    login: 'dependabot[bot]',
    id: 49699333,
    type: 'Bot',
    url: 'https://api.github.com/users/dependabot%5Bbot%5D',
    html_url: 'https://github.com/apps/dependabot',
  };
  const repository = {
    id: 1234,
    full_name: f.record.repository,
    name: f.record.repository.split('/')[1],
    owner: { login: 'aikdna' },
    url: api,
    html_url: html,
    fork: false,
  };
  f.action = {
    id,
    url: `${api}/actions/runs/${id}`,
    html_url: `${html}/actions/runs/${id}`,
    head_sha: f.record.ci.head,
    head_commit: { id: f.record.ci.head, tree_id: f.record.tree },
    check_suite_id: f.check.check_suite.id,
    check_suite_url: `${api}/check-suites/${f.check.check_suite.id}`,
    workflow_id: 303125655,
    workflow_url: `${api}/actions/workflows/303125655`,
    jobs_url: `${api}/actions/runs/${id}/jobs`,
    path: 'dynamic/dependabot/dependabot-updates',
    event: 'dynamic',
    status: 'completed',
    conclusion: 'failure',
    run_attempt: 1,
    actor,
    triggering_actor: { ...actor },
    repository,
    head_repository: structuredClone(repository),
  };
  f.calls = [];
  f.request = async (endpoint) => {
    f.calls.push(endpoint);
    if (endpoint === `repos/${f.record.repository}/git/commits/${f.record.ci.head}`)
      return f.commit;
    if (
      endpoint ===
      `repos/${f.record.repository}/commits/${f.record.ci.head}/check-runs?filter=all&per_page=100&page=1`
    )
      return { total_count: f.runs.length, check_runs: f.runs };
    assert.equal(endpoint, `repos/${f.record.repository}/actions/runs/${id}`);
    return f.action;
  };
  return f;
}

test('verified automatic update failure stays visible outside successful code checks', async () => {
  const f = maintenanceFixture();
  const result = (await verifyChildChecks(f.record, f.request)).reviewed;
  assert.equal(result.checks.length, 3);
  assert.deepEqual(result.required_checks, ['test']);
  assert.equal(result.maintenance_checks.length, 1);
  assert.equal(result.maintenance_failures_unresolved, true);
  const maintenance = result.maintenance_checks[0];
  assert.equal(maintenance.id, f.check.id);
  assert.equal(maintenance.conclusion, 'failure');
  assert.equal(maintenance.url, f.check.html_url);
  assert.equal(maintenance.code_acceptance, false);
  assert.equal(maintenance.update_failure_unresolved, true);
  assert.equal(maintenance.actions_run.api_url, f.action.url);
  assert.deepEqual(maintenance.actions_run.actor, {
    id: 49699333,
    login: 'dependabot[bot]',
    type: 'Bot',
  });
  assert.equal(f.calls.length, 3);
});

test('successful update jobs are also maintenance and cannot supply required code checks', async () => {
  const f = maintenanceFixture();
  f.check.conclusion = f.action.conclusion = 'success';
  let result = (await verifyChildChecks(f.record, f.request)).reviewed;
  assert.equal(result.maintenance_checks.length, 1);
  assert.equal(result.maintenance_failures_unresolved, false);
  assert.equal(result.maintenance_checks[0].code_acceptance, false);
  f.record.ci.required.push({ name: 'Dependabot', app: { ...f.check.app } });
  f.calls.length = 0;
  result = (await verifyChildChecks(f.record, f.request)).reviewed;
  assert.equal(result.maintenance_checks.length, 0);
  assert.equal(result.checks.length, 4);
  assert.deepEqual(result.required_checks, ['Dependabot', 'test']);
  assert.equal(
    f.calls.some((call) => call.includes('/actions/runs/')),
    false,
  );
  f.check.conclusion = 'failure';
  await assert.rejects(
    verifyChildChecks(f.record, f.request),
    /required CI check did not succeed/u,
  );
});

const maintenanceMutations = [
  ['check suite absent', (f) => delete f.check.check_suite],
  ['check suite forged', (f) => (f.check.check_suite.id += 1)],
  ['check details URL forged', (f) => (f.check.details_url += '?other')],
  ['check head forged', (f) => (f.check.head_sha = 'd'.repeat(40))],
  ['check API URL forged', (f) => (f.check.url += '0')],
  ['check unfinished', (f) => (f.check.status = 'in_progress')],
  ['check run URL forged', (f) => (f.check.html_url += '?other')],
  ['check application ID forged', (f) => (f.check.app.id = 1)],
  ['check application slug forged', (f) => (f.check.app.slug = 'other')],
  ['ordinary CI name', (f) => (f.check.name = 'test-other')],
  ['CodeQL Actions name', (f) => (f.check.name = 'CodeQL')],
  [
    'Advanced Security application',
    (f) => {
      f.check.app = { id: 57789, slug: 'github-advanced-security' };
      f.check.html_url = `https://github.com/${f.record.repository}/runs/${f.check.id}`;
    },
  ],
  ['Actions run metadata absent', (f) => (f.action = undefined)],
  ['Actions run ID forged', (f) => (f.action.id += 1)],
  ['Actions run API URL forged', (f) => (f.action.url += '?other')],
  ['Actions run HTML URL forged', (f) => (f.action.html_url += '#other')],
  ['Actions run head forged', (f) => (f.action.head_sha = 'd'.repeat(40))],
  ['Actions commit forged', (f) => (f.action.head_commit.id = 'd'.repeat(40))],
  ['Actions tree forged', (f) => (f.action.head_commit.tree_id = 'd'.repeat(40))],
  ['Actions check suite forged', (f) => (f.action.check_suite_id += 1)],
  ['Actions check suite URL forged', (f) => (f.action.check_suite_url += '0')],
  ['Actions workflow ID forged', (f) => (f.action.workflow_id += 1)],
  ['Actions workflow URL forged', (f) => (f.action.workflow_url += '/other')],
  ['Actions jobs URL forged', (f) => (f.action.jobs_url += '?other')],
  ['ordinary workflow with Dependabot name', (f) => (f.action.path = '.github/workflows/test.yml')],
  ['ordinary bot-triggered push', (f) => (f.action.event = 'push')],
  ['Actions unfinished', (f) => (f.action.status = 'in_progress')],
  ['Actions conclusion differs', (f) => (f.action.conclusion = 'success')],
  ['Actions attempt missing', (f) => delete f.action.run_attempt],
];
for (const name of ['actor', 'triggering_actor']) {
  for (const [field, value] of [
    ['login', 'other[bot]'],
    ['id', 49699334],
    ['type', 'User'],
    ['url', 'https://api.github.com/users/other'],
    ['html_url', 'https://github.com/apps/other'],
  ])
    maintenanceMutations.push([`${name} ${field} forged`, (f) => (f.action[name][field] = value)]);
}
for (const name of ['repository', 'head_repository']) {
  for (const [field, value] of [
    ['full_name', 'aikdna/other'],
    ['name', 'other'],
    ['owner', { login: 'other' }],
    ['id', 1235],
    ['url', 'https://api.github.com/repos/aikdna/other'],
    ['html_url', 'https://github.com/aikdna/other'],
    ['fork', true],
  ])
    maintenanceMutations.push([`${name} ${field} forged`, (f) => (f.action[name][field] = value)]);
}
for (const [label, mutate] of maintenanceMutations) {
  test(`maintenance classification fails closed: ${label}`, async () => {
    const f = maintenanceFixture();
    await verifyChildChecks(f.record, f.request);
    const before = structuredClone({ check: f.check, action: f.action });
    mutate(f);
    assert.notDeepEqual({ check: f.check, action: f.action }, before);
    await assert.rejects(verifyChildChecks(f.record, f.request));
  });
}

for (const key of Object.keys(maintenanceFixture().action)) {
  test(`maintenance classification requires Actions metadata field ${key}`, async () => {
    const f = maintenanceFixture();
    delete f.action[key];
    await assert.rejects(verifyChildChecks(f.record, f.request));
  });
}

test('a same-name check has no maintenance exemption without fetched run metadata', () => {
  const f = maintenanceFixture();
  assert.throws(() => validateCheckRuns(f.record, f.commit, f.runs), /metadata is missing/u);
});

test('Actions query failure is blocking and never retried through an anonymous fallback', async () => {
  const f = maintenanceFixture();
  const request = async (endpoint) => {
    if (endpoint.includes('/actions/runs/')) throw new Error('HTTP 403: actions read denied');
    return f.request(endpoint);
  };
  await assert.rejects(verifyChildChecks(f.record, request), /HTTP 403/u);
});

test('cancelled, skipped and unknown maintenance conclusions remain blocking', async () => {
  for (const conclusion of ['cancelled', 'skipped', 'neutral', 'timed_out', null, 'unknown']) {
    const f = maintenanceFixture();
    f.check.conclusion = f.action.conclusion = conclusion;
    await assert.rejects(verifyChildChecks(f.record, f.request), /unsupported maintenance/u);
  }
});

test('verified maintenance failure cannot hide an additional code failure', async () => {
  const f = maintenanceFixture();
  f.runs.push({ ...f.run(9, 'other-code'), conclusion: 'failure' });
  await assert.rejects(verifyChildChecks(f.record, f.request), /observed CI check failed/u);
});

test('all automatic-update duplicate attempts remain visible while missing required code blocks', async () => {
  const f = maintenanceFixture();
  f.runs.push({
    ...f.check,
    id: 106182649897,
    url: f.check.url.replace('106182649896', '106182649897'),
    html_url: f.check.html_url.replace('106182649896', '106182649897'),
    details_url: f.check.details_url.replace('106182649896', '106182649897'),
  });
  const result = (await verifyChildChecks(f.record, f.request)).reviewed;
  assert.equal(result.maintenance_checks.length, 2);
  assert.equal(f.calls.filter((call) => call.includes('/actions/runs/')).length, 1);
  f.runs = f.runs.filter((run) => run.name !== 'test');
  await assert.rejects(verifyChildChecks(f.record, f.request), /required CI checks are missing/u);
});

for (const mode of ['authenticated CLI hostname', 'token query permission failure']) {
  test(`trusted Actions metadata transport: ${mode}`, () => {
    const f = maintenanceFixture();
    const responses = {
      [`repos/${f.record.repository}/git/commits/${f.record.ci.head}`]: f.commit,
      [`repos/${f.record.repository}/commits/${f.record.ci.head}/check-runs?filter=all&per_page=100&page=1`]:
        { total_count: f.runs.length, check_runs: f.runs },
      [`repos/${f.record.repository}/actions/runs/${f.action.id}`]: f.action,
    };
    const script = `
      const assert = require('node:assert/strict');
      const responses = ${JSON.stringify(responses)};
      const mode = ${JSON.stringify(mode)};
      let queriedActions = false;
      require('node:child_process').spawnSync = (file, args) => {
        assert.equal(mode, 'authenticated CLI hostname', 'token failure must not fall back');
        assert.equal(file, 'gh');
        assert.deepEqual(args.slice(0, 3), ['api', '--hostname', 'github.com']);
        assert(Object.hasOwn(responses, args[3]));
        if (args[3].includes('/actions/runs/')) queriedActions = true;
        return { status: 0, stdout: JSON.stringify(responses[args[3]]) };
      };
      globalThis.fetch = async (url, options) => {
        assert.equal(mode, 'token query permission failure');
        assert(url.startsWith('https://api.github.com/'));
        assert.equal(options.redirect, 'error');
        assert.equal(options.headers.Authorization, 'Bearer synthetic-test-token');
        const endpoint = url.slice('https://api.github.com/'.length);
        assert(Object.hasOwn(responses, endpoint));
        if (endpoint.includes('/actions/runs/')) {
          queriedActions = true;
          return { ok: false, status: 403 };
        }
        return { ok: true, text: async () => JSON.stringify(responses[endpoint]) };
      };
      const { verifyChildChecks } = require(${JSON.stringify(require.resolve('./ecosystem-source-ci'))});
      (async () => {
        const result = verifyChildChecks(${JSON.stringify(f.record)});
        if (mode === 'token query permission failure') await assert.rejects(result, /HTTP 403/u);
        else assert.equal((await result).reviewed.maintenance_checks.length, 1);
        assert(queriedActions);
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `;
    const result = spawnSync(process.execPath, ['-e', script], {
      encoding: 'utf8',
      env: {
        PATH: process.env.PATH,
        GH_HOST: 'untrusted.example.invalid',
        ...(mode === 'token query permission failure' ? { GH_TOKEN: 'synthetic-test-token' } : {}),
      },
      timeout: 10000,
    });
    assert.equal(result.status, 0, result.stderr);
  });
}
