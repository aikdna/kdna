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
  listPersonas
} = require("../src/loader.js");

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

test("loadFlatDomainFromFile falls back to built-in defaults", async () => {
  const domain = await loadFlatDomainFromFile("segment_selection.kdna", "/nonexistent");
  assert.equal(domain.id, "segment_selection.kdna");
  assert.equal(domain._source.type, "builtin-fallback");
  assert.equal(domain._source.package, "@aikdna/kdna-eval");
  assert.ok(domain.x_eval.rules.length > 0);
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

  const { loaded, skipped } = await loadFlatDomains(["a.kdna", "b.kdna", "c.kdna"], { kdnaDir: dir });
  assert.equal(loaded.length, 3);
  assert.equal(loaded[0].id, "a");
  assert.equal(loaded[1].id, "b");
  assert.equal(loaded[2].id, "c");
  await rm(dir, { recursive: true, force: true });
});

test("loadFlatDomains returns skipped for missing", async () => {
  const { loaded, skipped } = await loadFlatDomains(["segment_selection.kdna", "nonexistent.kdna"], { kdnaDir: "/nonexistent" });
  assert.equal(loaded.length, 1);
  assert.equal(skipped.length, 1);
});

test("listPersonas returns built-in defaults when no dir", async () => {
  const ids = await listPersonas("/nonexistent");
  assert.ok(ids.includes("explainer-director"));
});

test("listPersonas includes filesystem personas", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kdna-eval-"));
  const pd = path.join(dir, "personas");
  await mkdir(pd, { recursive: true });
  await writeFile(path.join(pd, "custom.json"), JSON.stringify({ id: "custom", schemaVersion: 1, name: "C", ruleOfSix: {}, domains: [], preferences: {} }));
  const ids = await listPersonas(dir);
  assert.ok(ids.includes("custom"));
  await rm(dir, { recursive: true, force: true });
});

test("loadPersona falls back with provenance", async () => {
  const p = await loadPersona("explainer-director", { kdnaDir: "/nonexistent" });
  assert.equal(p.id, "explainer-director");
  assert.equal(p._source.type, "builtin-fallback");
});
