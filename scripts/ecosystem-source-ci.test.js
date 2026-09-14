'use strict';

const assert = require('node:assert/strict');
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
