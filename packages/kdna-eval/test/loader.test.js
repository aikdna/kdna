const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os");
const { mkdtemp, writeFile, rm } = require("node:fs/promises");

const {
  listDomains,
  loadDomainFromFile,
  loadDomainFromData,
  loadDomains,
  listPersonas,
  loadPersona,
  KDNA_DIR
} = require("../src/loader.js");

test("listDomains returns names from kdna dir", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kdna-eval-"));
  await writeFile(path.join(dir, "test.kdna"), JSON.stringify({ id: "test.kdna", schemaVersion: 1 }));
  await writeFile(path.join(dir, "other.kdna"), JSON.stringify({ id: "other.kdna", schemaVersion: 1 }));
  await writeFile(path.join(dir, "not.kdna.txt"), "");

  const names = await listDomains(dir);
  assert.ok(names.includes("test.kdna"));
  assert.ok(names.includes("other.kdna"));
  assert.ok(!names.includes("not.kdna.txt"));

  await rm(dir, { recursive: true, force: true });
});

test("listDomains returns empty for nonexistent dir", async () => {
  const names = await listDomains("/nonexistent/dir");
  assert.deepEqual(names, []);
});

test("loadDomainFromFile loads JSON file", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kdna-eval-"));
  const domainData = { id: "loaded.kdna", schemaVersion: 1, axioms: [{ id: "a1", dimensions: ["story"], condition: { path: "text", op: "eq", value: "hello" }, effect: { value: 5 } }] };
  await writeFile(path.join(dir, "loaded.kdna"), JSON.stringify(domainData));

  const domain = await loadDomainFromFile("loaded.kdna", dir);
  assert.equal(domain.id, "loaded.kdna");
  assert.equal(domain.axioms.length, 1);

  await rm(dir, { recursive: true, force: true });
});

test("loadDomainFromFile falls back to built-in defaults", async () => {
  const domain = await loadDomainFromFile("segment_selection.kdna", "/nonexistent/dir");
  assert.equal(domain.id, "segment_selection.kdna");
  assert.ok(domain._fallback);
  assert.ok(domain.axioms.length > 0);
});

test("loadDomainFromData parses raw JSON", () => {
  const domain = loadDomainFromData({ id: "programmatic.kdna", schemaVersion: 1, axioms: [] });
  assert.equal(domain.id, "programmatic.kdna");
});

test("loadDomainFromData accepts string JSON", () => {
  const domain = loadDomainFromData(JSON.stringify({ id: "string.kdna", schemaVersion: 1 }), "string.kdna");
  assert.equal(domain.id, "string.kdna");
});

test("loadDomainFromData validates minimum schema", () => {
  assert.throws(() => loadDomainFromData({}), /missing id/);
  assert.throws(() => loadDomainFromData({ id: "x" }), /missing id/);
});

test("loadDomains batch loads with fallbacks", async () => {
  const { loaded, skipped } = await loadDomains(["segment_selection.kdna", "nonexistent.kdna"], { kdnaDir: "/nonexistent/dir" });
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, "segment_selection.kdna");
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].id, "nonexistent.kdna");
});

test("listPersonas returns built-in defaults when no dir", async () => {
  const ids = await listPersonas("/nonexistent/dir");
  assert.ok(ids.includes("explainer-director"));
  assert.ok(ids.includes("documentary-director"));
  assert.ok(ids.includes("vlog-director"));
});

test("listPersonas includes filesystem personas", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kdna-eval-"));
  const personasDir = path.join(dir, "personas");
  const { mkdir } = require("node:fs/promises");
  await mkdir(personasDir, { recursive: true });
  await writeFile(path.join(personasDir, "custom.json"), JSON.stringify({ id: "custom", schemaVersion: 1, name: "Custom", ruleOfSix: { emotion: 1, story: 0, rhythm: 0, eyeTrace: 0, twoD: 0, threeD: 0 }, domains: [], preferences: {} }));

  const ids = await listPersonas(dir);
  assert.ok(ids.includes("custom"));
  assert.ok(ids.includes("explainer-director"));

  await rm(dir, { recursive: true, force: true });
});

test("loadPersona loads from filesystem", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kdna-eval-"));
  const personasDir = path.join(dir, "personas");
  const { mkdir } = require("node:fs/promises");
  await mkdir(personasDir, { recursive: true });
  const persona = { id: "loaded", schemaVersion: 1, name: "Loaded", description: "Test", ruleOfSix: { emotion: 1, story: 0, rhythm: 0, eyeTrace: 0, twoD: 0, threeD: 0 }, domains: [], preferences: {} };
  await writeFile(path.join(personasDir, "loaded.json"), JSON.stringify(persona));

  const result = await loadPersona("loaded", { kdnaDir: dir });
  assert.equal(result.id, "loaded");

  await rm(dir, { recursive: true, force: true });
});

test("loadPersona falls back to built-in", async () => {
  const persona = await loadPersona("explainer-director", { kdnaDir: "/nonexistent/dir" });
  assert.equal(persona.id, "explainer-director");
  assert.ok(persona._fallback);
  assert.ok(persona.ruleOfSix.emotion > 0);
});

test("KDNA_DIR points to home .kdna", () => {
  assert.ok(KDNA_DIR.endsWith(".kdna"));
});
