const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os");
const { mkdtemp, writeFile, rm, mkdir } = require("node:fs/promises");
const {
  listDomains,
  loadFlatDomainFromFile,
  loadFlatDomainFromData,
  loadFlatDomains,
  loadDomainFromFile,
  loadPersona,
  listPersonas,
  validateDomain,
  validatePersona,
} = require("../src/loader.js");

function validPersona(overrides = {}) {
  return {
    id: "test-persona",
    schemaVersion: 1,
    name: "Test",
    description: "A test persona.",
    ruleOfSix: {},
    domains: [],
    preferences: {},
    ...overrides,
  };
}

test("listDomains returns names from kdna dir", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kdna-eval-"));
  await writeFile(path.join(dir, "test.kdna"), JSON.stringify({ id: "test", schemaVersion: 1 }));
  await writeFile(path.join(dir, "other.json"), JSON.stringify({ id: "other", schemaVersion: 1 }));
  const names = await listDomains(dir);
  assert.ok(names.includes("test.kdna"));
  assert.ok(names.includes("other.json"));
  await rm(dir, { recursive: true, force: true });
});

test("loadFlatDomainFromFile loads JSON file", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kdna-eval-"));
  await writeFile(path.join(dir, "loaded.kdna"), JSON.stringify({ id: "loaded", schemaVersion: 1, x_eval: { rules: [] } }));
  const domain = await loadFlatDomainFromFile("loaded.kdna", dir);
  assert.equal(domain.id, "loaded");
  assert.equal(domain._source.type, "flat-file");
  await rm(dir, { recursive: true, force: true });
});

test("loadFlatDomainFromFile uses provided defaults as fallback", async () => {
  const defaults = { "my-domain.kdna": { id: "my-domain", schemaVersion: 1, x_eval: { rules: [] } } };
  const domain = await loadFlatDomainFromFile("my-domain.kdna", "/nonexistent", defaults);
  assert.equal(domain.id, "my-domain");
  assert.equal(domain._source.type, "builtin-fallback");
});

test("loadDomainFromFile is an alias for loadFlatDomainFromFile", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kdna-eval-"));
  await writeFile(path.join(dir, "alias.kdna"), JSON.stringify({ id: "alias", schemaVersion: 1 }));
  const domain = await loadDomainFromFile("alias.kdna", dir);
  assert.equal(domain.id, "alias");
  await rm(dir, { recursive: true, force: true });
});

test("loadFlatDomainFromData parses object and string", () => {
  assert.equal(loadFlatDomainFromData({ id: "p", schemaVersion: 1 }).id, "p");
  assert.equal(loadFlatDomainFromData(JSON.stringify({ id: "s", schemaVersion: 1 }), "s").id, "s");
});

test("loadFlatDomains preserves input order", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kdna-eval-"));
  await writeFile(path.join(dir, "a.kdna"), JSON.stringify({ id: "a", schemaVersion: 1 }));
  await writeFile(path.join(dir, "b.kdna"), JSON.stringify({ id: "b", schemaVersion: 1 }));
  await writeFile(path.join(dir, "c.kdna"), JSON.stringify({ id: "c", schemaVersion: 1 }));
  const { loaded } = await loadFlatDomains(["a.kdna", "b.kdna", "c.kdna"], { kdnaDir: dir });
  assert.equal(loaded.length, 3);
  assert.equal(loaded[0].id, "a");
  assert.equal(loaded[1].id, "b");
  assert.equal(loaded[2].id, "c");
  await rm(dir, { recursive: true, force: true });
});

test("loadFlatDomains reports skipped for missing domains", async () => {
  const defaults = { "existing.kdna": { id: "existing", schemaVersion: 1 } };
  const { loaded, skipped } = await loadFlatDomains(["existing.kdna", "missing.kdna"], { kdnaDir: "/nonexistent", defaults });
  assert.equal(loaded.length, 1);
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].id, "missing.kdna");
});

test("listPersonas returns built-in defaults when no dir", async () => {
  const defaults = { "my-persona": { id: "my-persona", schemaVersion: 1, name: "Test", ruleOfSix: {}, domains: [], preferences: {} } };
  const ids = await listPersonas("/nonexistent", defaults);
  assert.deepEqual(ids, ["my-persona"]);
});

test("listPersonas includes filesystem personas", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kdna-eval-"));
  const pd = path.join(dir, "personas");
  await mkdir(pd, { recursive: true });
  await writeFile(path.join(pd, "custom.json"), JSON.stringify({ id: "custom", schemaVersion: 1, name: "C", ruleOfSix: {}, domains: [], preferences: {} }));
  const ids = await listPersonas(dir, { "builtin": { id: "builtin", schemaVersion: 1, name: "B", ruleOfSix: {}, domains: [], preferences: {} } });
  assert.ok(ids.includes("custom"));
  assert.ok(ids.includes("builtin"));
  await rm(dir, { recursive: true, force: true });
});

test("loadPersona falls back with provenance", async () => {
  const defaults = { "test-persona": validPersona() };
  const p = await loadPersona("test-persona", { kdnaDir: "/nonexistent", defaults });
  assert.equal(p.id, "test-persona");
  assert.equal(p._source.type, "builtin-fallback");
});

test("validateDomain rejects values that violate its declared return type", () => {
  const hostileDomains = [
    [{ id: 42, schemaVersion: "one" }, /id must be a non-empty string/],
    [{ id: "domain", schemaVersion: "one" }, /schemaVersion must be a finite number/],
    [{ id: "domain", schemaVersion: 1, x_eval: [] }, /x_eval must be an object/],
    [
      { id: "domain", schemaVersion: 1, x_eval: { rules: [{}] } },
      /x_eval\.rules\[0\]\.id must be a string/,
    ],
    [
      {
        id: "domain",
        schemaVersion: 1,
        axioms: [
          {
            id: "rule",
            dimensions: [1],
            condition: { path: "score", op: "gt", value: 0 },
            effect: { value: 1 },
          },
        ],
      },
      /axioms\[0\]\.dimensions must be an array of strings/,
    ],
    [{ id: "domain", schemaVersion: 1, thresholds: [] }, /thresholds must be an object/],
    [{ id: "domain", schemaVersion: 1, _source: { type: 1 } }, /_source\.type/],
  ];

  for (const [domain, expectedError] of hostileDomains) {
    assert.throws(() => validateDomain(domain, "hostile"), expectedError);
  }
});

test("validateDomain accepts and preserves every declared scoring-rule shape", () => {
  const domain = {
    id: "domain",
    schemaVersion: 1,
    x_eval: {
      rules: [
        {
          id: "rule",
          dimensions: ["quality"],
          condition: { path: "score", op: "between", min: 0, max: 1 },
          effect: { value: 1, multiplyBy: "weight", clamp: { min: 0, max: 2 } },
        },
      ],
      thresholds: { promotion: 0.8 },
    },
    _source: { type: "programmatic", id: "domain" },
  };
  assert.strictEqual(validateDomain(domain, "valid"), domain);
});

test("validatePersona rejects incomplete and mistyped declared fields", () => {
  const hostilePersonas = [
    [{ ...validPersona(), name: undefined }, /name must be a non-empty string/],
    [{ ...validPersona(), name: 42 }, /name must be a non-empty string/],
    [{ ...validPersona(), schemaVersion: "one" }, /schemaVersion must be a finite number/],
    [{ ...validPersona(), description: undefined }, /description must be a string/],
    [{ ...validPersona(), ruleOfSix: { clarity: "high" } }, /ruleOfSix\.clarity/],
    [{ ...validPersona(), domains: [{ id: "domain", weight: "one" }] }, /domains\[0\]\.weight/],
    [{ ...validPersona(), preferences: [] }, /preferences must be an object/],
    [{ ...validPersona(), _source: null }, /_source must be an object/],
  ];

  for (const [persona, expectedError] of hostilePersonas) {
    assert.throws(() => validatePersona(persona), expectedError);
  }
});

test("invalid fallback defaults cannot bypass Domain or Persona validation", async () => {
  await assert.rejects(
    loadFlatDomainFromFile("bad.kdna", "/nonexistent", {
      "bad.kdna": { id: 42, schemaVersion: "one" },
    }),
    /id must be a non-empty string/,
  );
  await assert.rejects(
    loadPersona("bad", {
      kdnaDir: "/nonexistent",
      defaults: { bad: { id: "bad", schemaVersion: 1 } },
    }),
    /name must be a non-empty string/,
  );
  assert.throws(() => loadFlatDomainFromData("null"), /Invalid domain programmatic/);
});
