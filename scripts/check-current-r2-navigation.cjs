#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const MODULES = [
  'protection_admission',
  'package_set_node',
  'external_grant_issuer',
  'protected_source',
];
const SOURCE_PATH = 'specs/public-semantic-source.json';
function navigationError(message) {
  return Object.assign(new Error(message), { code: 'SOURCE_NAVIGATION_CONFLICT' });
}
function validateSchemaNavigation(source) {
  const artifacts = source.artifacts?.filter((item) => typeof item.root === 'string');
  if (!artifacts || artifacts.length !== 9) throw navigationError('Expected nine root artifacts');
  const expected = Object.create(null);
  for (const item of [
    ...artifacts.map(({ root, path: schemaPath }) => ({ root, schemaPath })),
    ...MODULES.map((key) => ({ root: source[key]?.root, schemaPath: source[key]?.schema_path })),
  ]) {
    if (
      typeof item.root !== 'string' ||
      typeof item.schemaPath !== 'string' ||
      Object.hasOwn(expected, item.root)
    ) {
      throw navigationError('Missing or duplicate authoritative schema root');
    }
    expected[item.root] = item.schemaPath;
  }
  const actual = source.r2_semantics?.schema_paths;
  if (
    !actual ||
    Array.isArray(actual) ||
    JSON.stringify(Object.keys(actual).sort()) !== JSON.stringify(Object.keys(expected).sort())
  ) {
    throw navigationError('Schema navigation has missing or extra roots');
  }
  for (const [root, schemaPath] of Object.entries(expected)) {
    if (actual[root] !== schemaPath)
      throw navigationError(
        `${root}: navigation differs from its owning artifact/module (${schemaPath})`,
      );
  }
  return expected;
}

function admitNavigation(name, condition, detail) {
  if (!condition) throw navigationError(`${name}: ${JSON.stringify(detail)}`);
}
function validateSourceMap(source, map, check = admitNavigation) {
  const owners = [
    ...source.artifacts
      .filter((item) => typeof item.root === 'string')
      .map((item) => ({ path: item.path, sources: [SOURCE_PATH] })),
    ...[...MODULES, 'transport_admission'].map((key) => ({
      path: source[key]?.schema_path,
      sources: [SOURCE_PATH, `${SOURCE_PATH}#/${key}`],
    })),
    {
      path: source.protection_admission?.checksums?.schema_path,
      sources: [SOURCE_PATH, `${SOURCE_PATH}#/protection_admission/checksums`],
    },
  ];
  const paths = owners.map((owner) => owner.path),
    edges = Array.isArray(map?.edges) ? map.edges : [];
  const schemaEdges = edges.filter(
    (edge) => typeof edge?.target === 'string' && edge.target.endsWith('.schema.json'),
  );
  const historical = new Set((source.historical_artifacts ?? []).map((item) => item.path));
  check(
    'source-map:machine-source',
    map?.single_machine_editable_source?.path === SOURCE_PATH &&
      map.single_machine_editable_source.status === 'PRESENT_UNPUBLISHED',
    map?.single_machine_editable_source,
  );
  check(
    'source-map:schema-set',
    paths.every((value) => typeof value === 'string') &&
      new Set(paths).size === paths.length &&
      schemaEdges.length === paths.length &&
      schemaEdges.every((edge) => paths.includes(edge.target)),
    { expected: paths, observed: schemaEdges.map((edge) => edge.target) },
  );
  for (const owner of owners) {
    const rows = edges.filter((edge) => edge?.target === owner.path);
    check(
      `source-map:owner:${owner.path}`,
      rows.length === 1 && owner.sources.includes(rows[0].source),
      { expected_sources: owner.sources, rows },
    );
    check(
      `source-map:current-not-historical:${owner.path}`,
      !historical.has(owner.path),
      owner.path,
    );
  }
  return paths;
}
function isDeepEqual(actual, expected) {
  try {
    assert.deepEqual(actual, expected);
    return true;
  } catch {
    return false;
  }
}
function validateCurrentTarget(source, decisions, check = admitNavigation) {
  const versions = source.engineering.package_versions;
  const line = versions.core.split('-rc.')[1]?.replace(/\.(\d+)$/, '.rc$1');
  const targets = Array.isArray(source.target_lines) ? source.target_lines : [];
  const rows = targets.filter((row) => row?.line === line);
  const current = targets.filter((row) => row?.status === 'CURRENT_UNPUBLISHED_TARGET');
  check(
    'current-target:unique',
    typeof line === 'string' && rows.length === 1 && current.length === 1 && current[0] === rows[0],
    { expected: line, rows, current },
  );
  check(
    'current-target:tuple',
    rows.length === 1 && isDeepEqual(rows[0].versionTuple, source.versionTuple),
    { expected: source.versionTuple, observed: rows.map((row) => row.versionTuple) },
  );
  check(
    'current-target:packages',
    rows.length === 1 && isDeepEqual(rows[0].package_versions, [versions]),
    { expected: [versions], observed: rows.map((row) => row.package_versions) },
  );
  // This is a recorded observation, not a self-hash: source pins decisions and
  // cannot require that decisions embed the digest of that same source.
  check(
    'current-decisions:source-present',
    typeof decisions.source_of_future_machine_semantics === 'string' &&
      /^specs\/public-semantic-source\.json \(PRESENT: [1-9]\d* bytes, sha256 [a-f0-9]{64}\)$/.test(
        decisions.source_of_future_machine_semantics,
      ),
    decisions.source_of_future_machine_semantics,
  );
}

const DOCUMENTS = [
  'README.md',
  'README.zh.md',
  'SPEC-INDEX.md',
  'docs/version-taxonomy.md',
  'docs/versioning.md',
  'docs/version-matrix.md',
  'packages/kdna-core/README.md',
  'packages/kdna-read/README.md',
  'docs/core-read-current-status.md',
  'docs/start-here.md',
  'docs/status.zh.md',
  'docs/status.md',
  'docs/version-and-capability-matrix.md',
  'docs/consumption-runtime.md',
  'specs/protection-admission.md',
  'specs/protected-source-r2.md',
  'specs/external-grant-issuer.md',
  'specs/protection-adoption.md',
  'specs/kdna-crypto-profiles.md',
  'specs/read-contract.md',
  'specs/public-version-policy.md',
];
function unfenced(text) {
  let fence = null;
  return text
    .split('\n')
    .filter((line) => {
      const match = line.match(/^\s*(`{3,}|~{3,})/);
      if (match) {
        if (!fence) fence = match[1][0];
        else if (match[1][0] === fence) fence = null;
        return false;
      }
      return !fence;
    })
    .join('\n');
}
function anchors(text) {
  const result = new Set(),
    counts = new Map();
  for (const match of unfenced(text).matchAll(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = match[1]
      .replace(/<[^>]*>/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '')
      .replace(/\s/g, '-');
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    result.add(count ? `${base}-${count}` : base);
  }
  for (const match of text.matchAll(/<(?:a|[a-z][a-z0-9]*)\b[^>]*\b(?:id|name)=["']([^"']+)["']/gi))
    result.add(match[1]);
  return result;
}

// These exact, bounded statements retain their independently reviewed history or
// downstream graph. They are not version allowlists: moving a value elsewhere,
// changing its role, or appending a current claim leaves it subject to checking.
const RETAINED_IDENTITY_CONTEXTS = [
  {
    file: 'README.md',
    role: 'downstream',
    heading: '## Current source: choose the matching implementation',
    text: '| [Native asset CLI](https://github.com/aikdna/kdna-cli#readme) | CLI `0.39.0-rc.native-sections.2` / exact Core `0.36.0-rc.r2.7` and Read `0.11.0-rc.r2.7` archives | `create`, `inspect`, `validate`, retained `read`, `source-open`, `source-pack`; Node >=22; unpublished |\n| [Canonical Loader/MCP](https://github.com/aikdna/kdna-skills#readme) | MCP `0.8.1-rc.combination.1` / CLI `0.39.1-rc.combination.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1` | Operator-bound local Read adapter; Node >=22; Host adoption unassessed |',
  },
  {
    file: 'README.md',
    role: 'downstream',
    heading: '## Ecosystem',
    text: '| [kdna-skills](https://github.com/aikdna/kdna-skills) | `kdna-loader` (Unassessed); local MCP `0.8.1-rc.combination.1`; historical npm MCP `0.5.0` | Agent and MCP adapter mission; not automatic judgment authority |',
  },
  {
    file: 'packages/kdna-core/README.md',
    role: 'historical',
    heading: '## Explicit Protection Node surface',
    text: 'This surface was introduced in the historical `0.30.0-rc.protection.1` candidate and is present in the current source manifest above. The explicit `/protection-node` entry follows [protection admission](../../specs/protection-admission.md). Closed generated declarations define credentials, trusted providers, opaque operations and disclosure results. Ordinary root/browser APIs retain capability refusal; they do not gain implicit secret handling or I/O. Its current artifact requires its own package/runtime evidence; this source description makes no account-service, product-adoption or publication claim.',
  },
  {
    file: 'packages/kdna-core/README.md',
    role: 'historical',
    heading: '## Explicit key-grant issuer surface',
    text: 'Core `0.31.1-rc.grant.2` / Read `0.7.2-rc.grant.2` are historical introduction coordinates, not the current package identity. The current source manifest includes the Node-only `@aikdna/kdna-core/key-grant-issuer-node` subpath with `getExternalGrantIssuerContract()` and `issueExternalKeyGrantForAsset(bytesOrAbsolutePath, options, secrets)`. All signed fields and `timeout_ms` are explicit. The issuer authenticates actual encrypted bytes before wrapping a device grant. Its R2 admission observation preserves complete admission or body-free rejection; unsupported critical meaning cannot enter a catalog fallback. It discloses existing grant metadata, never Payload/IR/CEK, and does not authorize account membership, Read scope or actions. Caller pins issuer identity independently. See `specs/external-grant-issuer.md` in the source distribution.',
  },
  {
    file: 'packages/kdna-read/README.md',
    role: 'historical',
    heading: '## Explicit Protection Node surface',
    text: 'Read `0.7.0-rc.protection.2` with Core `0.30.0-rc.protection.1` records the historical introduction of this surface. The current source package and exact Core peer are stated above. The explicit `/protection-node` entry follows [protection admission](../../specs/protection-admission.md). Closed generated declarations define credentials, trusted providers, opaque operations and disclosure results. Ordinary root/browser APIs retain capability refusal; they do not gain implicit secret handling or I/O. Its current artifact requires its own package/runtime evidence; this source description makes no account-service, product-adoption or publication claim.',
  },
  {
    file: 'packages/kdna-read/README.md',
    role: 'historical',
    heading: '## Explicit key-grant issuer boundary',
    text: 'Core `0.31.1-rc.grant.2` / Read `0.7.2-rc.grant.2` are historical introduction coordinates, not the current package identity. The current bound Core includes the Node-only `@aikdna/kdna-core/key-grant-issuer-node` subpath with `getExternalGrantIssuerContract()` and `issueExternalKeyGrantForAsset(bytesOrAbsolutePath, options, secrets)`. All signed fields and `timeout_ms` are explicit. The issuer authenticates actual encrypted bytes before wrapping a device grant. Its R2 admission observation preserves complete admission or body-free rejection; unsupported critical meaning cannot enter a catalog fallback. It discloses existing grant metadata, never Payload/IR/CEK, and does not authorize account membership, Read scope or actions. Caller pins issuer identity independently. See `specs/external-grant-issuer.md` in the source distribution.',
  },
  {
    file: 'docs/core-read-current-status.md',
    role: 'downstream',
    heading: '## Choose and obtain one matching delivery',
    text: '| Runtime CLI | CLI `0.40.0-rc.protection.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1` | [CLI README](https://github.com/aikdna/kdna-cli#readme), [binding](https://github.com/aikdna/kdna-cli/blob/main/public-contract-binding.json), [archive inventory](https://github.com/aikdna/kdna-cli/blob/main/release-surface/dependency-archives.json); Node >=22 |\n| Loader/MCP | MCP `0.8.1-rc.combination.1` / CLI `0.39.1-rc.combination.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1` | [MCP manifest](https://github.com/aikdna/kdna-skills/blob/main/mcp-server/package.json), [complete local installation](https://github.com/aikdna/kdna-skills/blob/main/mcp-server/README.md), [canonical Loader](https://github.com/aikdna/kdna-skills/blob/main/kdna-loader/SKILL.md); Node >=22 |\n| Studio creation and bounded source revision | Studio CLI `0.17.0-rc.material-edit.1` / Studio Core `4.5.0-rc.material-edit.1` / Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1` | [Studio installation](https://github.com/aikdna/kdna-studio-cli#readme), [archive/member binding](https://github.com/aikdna/kdna-studio-cli/blob/main/src/public-bindings.json), [Creator](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/SKILL.md); Node >=22; use the complete source identity below and its installation conditions |',
  },
  {
    file: 'docs/core-read-current-status.md',
    role: 'historical',
    heading: '## Preserved history',
    text: "fallback. Grammar.2's proposed Core/Read labels were `0.27.0-rc.grammar.2` /\n`0.5.0-rc.grammar.2`, while its observed manifests still bore\n`0.25.0-rc.authoring.4` / `0.4.0-rc.authoring.4`. That mismatch is a historical\nobservation, not the current package state. Active 0.1 remains in force at its",
  },
  {
    file: 'docs/core-read-current-status.md',
    role: 'historical',
    heading: '## Preserved history',
    text: 'The 2026-09-13 implementation observation concerned Core\n`0.24.0-rc.component-semantics.2` and Read `0.3.0-rc.component-semantics.2`.\nIt recorded static admission and projection, with Capsule/Plan admission and',
  },
  {
    file: 'docs/start-here.md',
    role: 'downstream',
    heading: '## Current source entry',
    text: '- [Runtime CLI](https://github.com/aikdna/kdna-cli#readme): CLI `0.40.0-rc.protection.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1`.\n- [Canonical Loader/MCP](https://github.com/aikdna/kdna-skills#readme): MCP `0.8.1-rc.combination.1` / CLI `0.39.1-rc.combination.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1`.',
  },
  {
    file: 'docs/version-and-capability-matrix.md',
    role: 'downstream',
    heading: '## 2. Current Core/Read source and preserved component observations',
    text: '| `@aikdna/kdna-cli` | `0.40.0-rc.protection.1` | Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1`; private candidate; Node >=22 |\n| `@aikdna/kdna-studio-core` | `4.5.0-rc.material-edit.1` | Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1`; local unpublished source; Node >=22 |\n| `@aikdna/kdna-studio-cli` | `0.17.0-rc.material-edit.1` | Studio Core `4.5.0-rc.material-edit.1` / Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1`; local unpublished source; Node >=22 |\n| `@aikdna/kdna-mcp-server` | `0.8.1-rc.combination.1` | CLI `0.39.1-rc.combination.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1`; private candidate; Node >=22 |',
  },
  {
    file: 'docs/version-and-capability-matrix.md',
    role: 'historical',
    heading: '## 2. Current Core/Read source and preserved component observations',
    text: '| `@aikdna/kdna-cli` | `0.38.0-rc.component-semantics.1` | Unpublished candidate (`private`) |\n| `@aikdna/kdna-studio-core` | `4.0.0-rc.components.1` | Unpublished candidate (`private`) |\n| `@aikdna/kdna-studio-cli` | `0.13.0-rc.components.1` | Unpublished candidate |\n| `@aikdna/kdna-web-server` | `0.5.0-rc.component-semantics.1` | Unpublished candidate |\n| `@aikdna/kdna-web-client` | `0.5.0-rc.component-semantics.1` | Unpublished candidate |\n| `@aikdna/kdna-react` | `0.6.0-rc.component-semantics.1` | Unpublished candidate |\n| `@aikdna/kdna-mcp-server` | `0.7.0-rc.component-semantics.1` | Unpublished candidate (`private`) |\n| `@aikdna/kdna-assets` | `0.3.0-rc.component-semantics.1` | Unpublished source bundle (`private`) |\n| `@aikdna/kdna-remote-server` | `0.6.0-rc.component-semantics.1` | Unpublished candidate |\n| `@aikdna/kdna-activation-server` | `0.4.0-rc.component-semantics.1` | Unpublished candidate |',
  },
  {
    file: 'docs/version-and-capability-matrix.md',
    role: 'historical',
    heading: '## 2. Current Core/Read source and preserved component observations',
    text: 'The earlier Core `0.24.0-rc.component-semantics.2` and Read\n`0.3.0-rc.component-semantics.2` rows are preserved here as historical source\nobservations. Grammar.2 later proposed Core `0.27.0-rc.grammar.2` / Read\n`0.5.0-rc.grammar.2`, with actual manifests still labeled\n`0.25.0-rc.authoring.4` / `0.4.0-rc.authoring.4`. That mismatch belongs to the\nsuperseded grammar.2 record; the current R2 manifests match their declared\npackage labels.',
  },
  {
    file: 'docs/version-and-capability-matrix.md',
    role: 'historical',
    heading: '## 3. Protocol, container, IR and API axes',
    text: '| `authoring.4` | `0.2.0` / `0.2.0` | `0.4.0` / `0.3.0` / `0.3.0` | `0.25.0-rc.authoring.4` / `0.4.0-rc.authoring.4` |\n| `grammar.1` | `0.3.0` / `0.3.0` | `0.5.0` / `0.4.0` / `0.4.0` | `0.26.0-rc.grammar.1` / `0.5.0-rc.grammar.1` |\n| `grammar.2` | `0.4.0` / `0.3.0` | `0.6.0` / `0.4.0` / `0.4.0` | `0.27.0-rc.grammar.2` / `0.5.0-rc.grammar.2` |',
  },
  {
    file: 'specs/kdna-crypto-profiles.md',
    role: 'historical',
    heading: '## 8. Separate protection integration candidate',
    text: 'B0 schemas/types alone were not callable support. Core0.30.0-rc.protection.1 and\nRead0.7.0-rc.protection.1 provide the B1 candidate Node surfaces; exact installed\nconsumer, fixed-vector and lifecycle evidence still require independent review.',
  },
  {
    file: 'specs/public-version-policy.md',
    role: 'historical',
    heading: '### RC2 candidate correction',
    text: 'Historical S12-D006 kept the initial R2 Core0.8.0 target tuple while issuing Core 0.36.0-rc.r2.2 and Read 0.11.0-rc.r2.2. The three fixed protection-admission, protected-source and issuer wrappers advance to binding:r2:2 and retain binding1 schemas as unaccepted rc1 history. Other unaccepted R2 schema targets are corrected to the accepted R2 definitions, with explicit rc1-to-rc2 content/digest differences. These drafts are neither identical nor claimed mutually compatible. Pre-R2 historical public schema bytes remain unchanged.',
  },
  {
    file: 'specs/public-version-policy.md',
    role: 'historical',
    heading: '### R2 RC3 installation boundary (S12-D011 revision2)',
    text: 'The historical RC3 candidate pair was Core `0.36.0-rc.r2.3` and Read `0.11.0-rc.r2.3` with an exact peer. Its Core semantic coordinate is `kdna.core/0.8.1`; other R2 tuple axes are unchanged. Frozen RC1/RC2 Core `0.8.0` combinations are unaccepted historical candidates, not supported alternatives. A complete old request tuple is `READ_UNSUPPORTED_VERSION`; an actual mixed tuple is `READ_MIXED_VERSION_TUPLE`.',
  },
  {
    file: 'specs/public-version-policy.md',
    role: 'historical',
    heading: '### R2 RC3 installation boundary (S12-D011 revision2)',
    text: 'No public callable, signature, diagnostic or payload selector is added. `inspectSnapshot(snapshot)` and Core-internal branding keep their existing roles. Protected/PackageSet descriptor and authorization checks remain required. The browser graph uses package metadata and generated data only, not Node-only inspection. Data-only analysis remains a schema-only helper. This boundary does not repair old-old combinations or authenticate malicious replacement of all runtime code. Fixed protection/source/issuer wrappers used binding:r2:3; binding1/2 bytes remain immutable unaccepted history.',
  },
  {
    file: 'specs/public-version-policy.md',
    role: 'historical',
    heading: '### R2 RC4 Browser correction (S12-D012)',
    text: 'The historical RC4 exact pair was Core `0.36.0-rc.r2.4` / Read `0.11.0-rc.r2.4`, with Core `kdna.core/0.8.1` and Read `kdna.read/0.6.1`. Only the Read tuple axis changes from RC3. Both packages compile the entire new tuple; ordinary installation checks and genuine snapshot comparisons remain separate. Metadata-only changes cannot make RC3 and RC4 compatible. The complete old RC3 tuple is unsupported; no old decoder is selected.',
  },
  {
    file: 'specs/public-version-policy.md',
    role: 'historical',
    heading: '### R2 RC4 Browser correction (S12-D012)',
    text: 'Its Read schema was `read-contract-0.6.1.schema.json`, id `urn:kdna:schema:read:0.6.1`. The former 0.6 source and package mirror retain fixed RC3 bytes as unaccepted history. Protection/source/issuer wrappers use binding:r2:4; binding1-3 remain unchanged. Other unaccepted R2 draft schemas regenerate their complete reachable types with an explicit difference ledger.',
  },
  {
    file: 'specs/public-version-policy.md',
    role: 'historical',
    heading: '## Current packed-documentation and installation combination (S12-D016)',
    text: 'Prior Read0.6, Read0.6.1 and Read0.6.2 source/mirror bytes and binding1–5 wrappers are fixed history.',
  },
  {
    file: 'specs/public-version-policy.md',
    role: 'historical',
    heading: '### R2 RC5 current-navigation candidate (S12-D013)',
    text: 'The frozen RC5 exact pair was Core `0.36.0-rc.r2.5` / Read `0.11.0-rc.r2.5`, Core `kdna.core/0.8.1`, Read `kdna.read/0.6.2`, with Read Schema `read-contract-0.6.2.schema.json`, id `urn:kdna:schema:read:0.6.2`, and binding:r2:5 wrappers. These fixed historical schema and package coordinates are superseded; their original bytes and identifiers remain unchanged. A complete RC5 tuple is unsupported by the current combination.',
  },
];
function maskRetainedIdentities(file, text, check) {
  let current = text;
  for (const context of RETAINED_IDENTITY_CONTEXTS.filter((item) => item.file === file)) {
    const start = text.indexOf(context.text);
    const heading =
      start < 0
        ? ''
        : text
            .slice(0, start)
            .split('\n')
            .filter((line) => /^#{1,6} /.test(line))
            .at(-1);
    const valid =
      start >= 0 && text.indexOf(context.text, start + 1) < 0 && heading === context.heading;
    check(
      `${file}:retained-${context.role}:${context.heading}:${start}`,
      valid,
      'Retained statement or its bounded role changed; review its identity ownership',
    );
    if (valid)
      current =
        current.slice(0, start) +
        context.text.replace(/[^\n]/g, ' ') +
        current.slice(start + context.text.length);
  }
  return current;
}
// Parse each inline destination, including the outer link of [![badge](image)](target).
// Fenced examples are excluded, while nested parentheses and escaped delimiters
// inside a destination retain their actual URL rather than a truncated prefix.
function markdownLinks(text) {
  const input = unfenced(text),
    links = [];
  for (let i = 0; i < input.length - 1; i++) {
    if (input[i] !== ']' || input[i + 1] !== '(' || input[i - 1] === '\\') continue;
    let j = i + 2;
    while (/\s/.test(input[j] ?? '') && j < input.length) j++;
    const start = j;
    let href = '',
      depth = 0;
    if (input[j] === '<') {
      j++;
      const begin = j;
      while (j < input.length && input[j] !== '>') j++;
      if (j === input.length) continue;
      href = input.slice(begin, j++);
    } else {
      for (; j < input.length; j++) {
        const ch = input[j];
        if (ch === '\\' && j + 1 < input.length) {
          href += input[++j];
          continue;
        }
        if (ch === '(') {
          depth++;
          href += ch;
          continue;
        }
        if (ch === ')' && depth > 0) {
          depth--;
          href += ch;
          continue;
        }
        if (ch === ')' || (/\s/.test(ch) && depth === 0)) break;
        href += ch;
      }
    }
    if (href && j < input.length && depth === 0) links.push({ href, offset: start });
  }
  return links;
}
function checkIdentityOccurrences(file, text, source, check) {
  const current = maskRetainedIdentities(file, text, check),
    versions = source.engineering.package_versions;
  const observed = [];
  const record = (kind, match, expected) => {
    const value = match[0],
      line = current.slice(0, match.index).split('\n').length;
    observed.push({ file, line, kind, value, expected });
    check(`${file}:${line}:${kind}:${value}`, expected.includes(value), {
      observed: value,
      expected,
    });
  };
  // Any major/minor family is admitted to this check; obsolete .source/.grammar
  // packages cannot escape by avoiding the current .r2 prerelease prefix.
  for (const match of current.matchAll(
    /(?<![0-9./_-])\d+\.\d+\.\d+-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*/g,
  )) {
    record('current-package', match, [versions.core, versions.read]);
  }
  for (const match of current.matchAll(
    /kdna\.(?:core|canonical-ir|runtime-capsule|consumption-plan|agent-host|judgment-trace|read)\/\d+\.\d+\.\d+/g,
  )) {
    record('current-tuple', match, Object.values(source.versionTuple));
  }
  for (const match of current.matchAll(/read-contract-\d+(?:\.\d+)*\.schema\.json/g)) {
    record('governing-read-schema', match, [
      path.basename(source.artifacts.find((item) => item.root === 'ReadCallResult').path),
    ]);
  }
  for (const match of current.matchAll(
    /(?:protection-admission|protected-source|external-grant-issuer)-r2-binding-\d+\.schema\.json/g,
  )) {
    record(
      'current-module-schema',
      match,
      MODULES.map((key) => path.basename(source[key].schema_path)),
    );
  }
  for (const match of current.matchAll(
    /urn:kdna:schema:(?:protection-admission|protected-source|external-grant-issuer):1\.0\.0:binding:r2:\d+/g,
  )) {
    record(
      'current-module-id',
      match,
      MODULES.map((key) => source[key].schema_id),
    );
  }
  for (const match of current.matchAll(/binding:r2:\d+/g)) {
    record('current-binding', match, [
      source.protection_admission.schema_id.match(/binding:r2:\d+$/)[0],
    ]);
  }
  const native = source.versionTuple.runtime.split('/')[1].replace(/\.0$/, '');
  for (const match of current.matchAll(
    /(?:native(?: execution)?|Native|原生)\s+\d+\.\d+(?:\.\d+)?/g,
  )) {
    const value = match[0].match(/\d+\.\d+(?:\.\d+)?/)[0];
    check(`${file}:current-native:${match.index}`, value === native || value === native + '.0', {
      observed: value,
      expected: native,
    });
  }
  for (const match of current.matchAll(
    /\b(Core|Read)(?:[ \t`]+(?:package|source|version|coordinate|is))*[ \t`]*(\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?)/g,
  )) {
    // Full bare numeric declarations on explicitly current lines are semantic
    // or package coordinates. Published examples without a current assertion
    // remain governed by their named sections and the role audit.
    const lineStart = current.lastIndexOf('\n', match.index) + 1;
    const lineEnd = current.indexOf('\n', match.index);
    const line = current.slice(lineStart, lineEnd < 0 ? undefined : lineEnd);
    if (/current|当前/i.test(line)) {
      const name = match[1].toLowerCase();
      check(
        `${file}:current-owner:${match.index}`,
        [versions[name], source.versionTuple[name].split('/')[1]].includes(match[2]),
        { observed: match[2], owner: name },
      );
    }
  }
  return observed;
}

function checkCurrentNavigation(root, options = {}) {
  root = path.resolve(root);
  const read = options.readText ?? ((rel) => fs.readFileSync(path.join(root, rel), 'utf8'));
  const source = JSON.parse(read('specs/public-semantic-source.json'));
  const expected = validateSchemaNavigation(source),
    issues = [],
    checks = [];
  const tuple = source.versionTuple,
    versions = source.engineering.package_versions;
  const decisionDocument = JSON.parse(read('specs/public-contract-decisions.json'));
  const decisions = decisionDocument.version_policy;
  function check(name, condition, detail) {
    checks.push({ name, pass: Boolean(condition) });
    if (!condition) issues.push({ name, detail });
  }
  validateSourceMap(source, JSON.parse(read('specs/public-source-map.json')), check);
  validateCurrentTarget(source, decisionDocument, check);

  const payloadAxis = [tuple.payload_profile, tuple.payload_version].every(
    (value) => typeof value === 'string' && value.length > 0,
  )
    ? tuple.payload_profile + '/' + tuple.payload_version
    : undefined;
  const axes = {
    container: tuple.container,
    payload: payloadAxis,
    core_api: tuple.core,
    canonical_ir: tuple.ir,
    runtime_capsule: tuple.runtime,
    consumption_plan: tuple.plan,
    agent_host: tuple.host,
    trace: tuple.trace,
    read: tuple.read,
    package_set_handoff: source.types?.PackageSetHandoff?.properties?.contract?.const,
  };
  const declaredAxes = Array.isArray(decisions.design_axes) ? decisions.design_axes : [];
  const expectedAxisNames = new Set(Object.keys(axes));
  const observedAxisNames = declaredAxes.map((row) => row?.axis);
  check(
    'current-decisions:axis-set',
    observedAxisNames.length === expectedAxisNames.size &&
      new Set(observedAxisNames).size === expectedAxisNames.size &&
      observedAxisNames.every((axis) => expectedAxisNames.has(axis)),
    { expected: [...expectedAxisNames], observed: observedAxisNames },
  );
  const currentLine = versions.core.split('-rc.')[1]?.replace(/\.(\d+)$/, '.rc$1');
  check('current-decisions:line', decisions.line === currentLine, {
    expected: currentLine,
    observed: decisions.line,
  });
  for (const [axis, value] of Object.entries(axes)) {
    const ownerPresent = typeof value === 'string' && value.length > 0;
    check(
      `source-owner:axis:${axis}`,
      ownerPresent,
      'Current axis must have an explicit source-owned value',
    );
    const rows = declaredAxes.filter((row) => row?.axis === axis);
    check(
      `current-decisions:axis:${axis}`,
      ownerPresent && rows.length === 1 && rows[0].target === value,
      { expected: value, rows },
    );
  }
  try {
    assert.deepEqual(decisions.supported_tuple, tuple);
    check('current-decisions:tuple', true);
  } catch (error) {
    check('current-decisions:tuple', false, error.message);
  }
  for (const [name, version] of Object.entries(versions)) {
    const rows = decisions.planned_packages.filter((row) => row.name === `@aikdna/kdna-${name}`);
    check(
      `current-decisions:package:${name}`,
      rows.length === 1 &&
        rows[0].candidate_version === version &&
        rows[0].current_source_version === version &&
        rows[0].line === currentLine,
      { expected: version, expected_line: currentLine, rows },
    );
  }
  function segment(file, start, end) {
    const text = read(file),
      a = start ? text.indexOf(start) : 0;
    const b = end ? text.indexOf(end, a + (start?.length ?? 0)) : text.length;
    check(
      `${file}:section:${start ?? 'start'}`,
      a >= 0 && b >= a,
      'Required current section missing',
    );
    return a >= 0 && b >= a ? text.slice(a, b) : '';
  }
  function contains(file, start, end, values) {
    const text = segment(file, start, end);
    for (const value of values)
      check(
        `${file}:current:${value}`,
        text.includes(value),
        'Current declaration missing or stale',
      );
  }
  function exactFamily(file, start, end, regex, expectedValue) {
    const values = [...segment(file, start, end).matchAll(regex)].map((match) => match[0]);
    check(
      `${file}:identity-family:${regex.source}`,
      values.length > 0 && values.every((value) => value === expectedValue),
      { expected: expectedValue, observed: values },
    );
  }
  contains('README.md', null, '## Published CLI', [
    '**R2**',
    'native execution 0.3.1',
    `| This repository | Core \`${versions.core}\` / Read \`${versions.read}\``,
    'SPEC-INDEX.md#kdna-public-specification-index',
  ]);
  contains('README.zh.md', '## 当前源码', '## 已发布 CLI', [
    versions.core,
    versions.read,
    'R2',
    '原生 0.3.1 Plan/Capsule',
    '普通 root/browser',
    '显式 Node',
  ]);
  contains('docs/start-here.md', '## Current source entry', '## 5-Minute Quick Start', [
    `- This protocol repository: Core \`${versions.core}\` / Read \`${versions.read}\``,
  ]);
  contains('docs/status.zh.md', null, '## 当前成熟度', [
    '当前 R2',
    '原生 0.3.1 Plan/Capsule',
    '普通 root/browser',
    '显式 Node',
  ]);
  contains('docs/consumption-runtime.md', '## Current source', '## Published CLI', [
    'does not require a Plan/Capsule step',
    'execution-contract-0.3.md',
    'static 0.3.1',
  ]);
  contains('docs/core-read-current-status.md', null, '## Choose and obtain', [
    '**R2**',
    versions.core,
    versions.read,
    tuple.core,
    tuple.ir,
    tuple.read,
    `container \`${tuple.container}\``,
    `payload profile \`${tuple.payload_profile}\``,
    `version \`${tuple.payload_version}\``,
    'Trace `0.3.1`',
  ]);
  contains('docs/core-read-current-status.md', '## Choose and obtain', '## What is implemented', [
    `| Core/Read source | Core \`${versions.core}\` / Read \`${versions.read}\``,
  ]);
  contains('docs/core-read-current-status.md', '## What is implemented', '## Quickstart', [
    'reject all four modes',
    'execution-contract-0.3.md',
    'historical catalog-only critical fallback is not active',
  ]);
  const matrix = 'docs/version-and-capability-matrix.md';
  contains(matrix, null, '## Why one matrix', ['**R2**']);
  contains(matrix, '## 2.', '## 3.', [
    `| \`@aikdna/kdna-core\` | \`${versions.core}\``,
    `| \`@aikdna/kdna-read\` | \`${versions.read}\` | Exact Core \`${versions.core}\``,
  ]);
  contains(
    matrix,
    '## 3.',
    'Superseded unpublished lines',
    Object.values(tuple)
      .filter((value) => value.startsWith('kdna.'))
      .concat([
        'Current unpublished source (`R2`)',
        '| `0.5.1` (`kdna.payload.judgment`)',
        'execution-contract-0.3.md',
      ]),
  );

  contains(matrix, '## 6.', '## 7.', ['Native 0.3.1 formats']);
  contains(matrix, '## 7.', '## Related documents', ['| Core / Read R2 |']);
  check(
    'matrix:no-current-old-reception',
    !segment(matrix, '## 7.', '## Related documents').includes('Core / Read grammar.'),
    'Current reception must identify R2',
  );
  const matrixAxes = segment(matrix, '## 3.', 'Superseded unpublished lines');
  for (const [label, value] of [
    ['Container `format_version`', `\`${tuple.container}\``],
    ['Payload profile version', `\`${tuple.payload_version}\` (\`${tuple.payload_profile}\`)`],
    ['Core public API', `\`${tuple.core}\``],
    ['Canonical IR', `\`${tuple.ir}\``],
    ['Runtime Capsule `contract_version`', `\`${tuple.runtime}\``],
    ['Consumption Plan `contract_version`', `\`${tuple.plan}\``],
    ['Agent Host exchange', `\`${tuple.host}\``],
    ['Judgment Trace `contract_version`', `\`${tuple.trace}\``],
    ['Read API', `\`${tuple.read}\``],
  ]) {
    const rows = matrixAxes.split('\n').filter((line) => line.startsWith(`| ${label} |`));
    check(
      `matrix:current-axis:${label}`,
      rows.length === 1 && rows[0].split('|').at(-2).trim() === value,
      { expected: value, rows },
    );
  }

  contains('docs/status.md', 'See the [current Core/Read guide]', 'A single explicitly selected', [
    'Current R2 Core `/execution` supplies native 0.3.1 static Plan/Capsule',
    'Ordinary root, Node and\nbrowser admission refuse',
    '[explicit Node protection]',
  ]);
  const statusRows = segment('docs/status.md', '## Maturity by Layer', '## Current source entry');
  const statusCurrent = segment('docs/status.md', null, '## Published CLI');
  check(
    'docs/status.md:no-unscoped-old-refusal',
    !/current Core (?:does not implement encrypted-container admission|rejects (?:encryption|signed containers))|and Plan admission, and execution are unavailable/i.test(
      statusCurrent,
    ),
    'An old blanket refusal cannot coexist with the current entry-specific capability statements',
  );
  for (const [label, required] of [
    ['KDNA Asset Container', ['ordinary Core admission', 'explicit Node protection']],
    ['Licensed access', ['Explicit Node protection', 'production accounts']],
    ['Signing and revocation', ['Ordinary Core admission', 'explicit Node integrity']],
    [
      'Single-asset consumption runtime',
      ['optional native 0.3.1 static Plan/Capsule', 'configured Host'],
    ],
  ]) {
    const rows = statusRows.split('\n').filter((line) => line.startsWith(`| ${label} |`));
    check(
      `docs/status.md:current-capability:${label}`,
      rows.length === 1 && required.every((value) => rows[0].includes(value)),
      rows,
    );
  }
  const identityClaims = DOCUMENTS.flatMap((file) =>
    checkIdentityOccurrences(file, read(file), source, check),
  );
  const readArtifact = source.artifacts.find((item) => item.root === 'ReadCallResult');
  contains('SPEC-INDEX.md', null, null, [readArtifact.path, 'specs/protected-source-r2.md']);
  check(
    'SPEC-INDEX:current-protected-source',
    !read('SPEC-INDEX.md').includes('protected-source-r2-binding-'),
    'Current index must not select a fixed historical binding page',
  );
  contains(
    'packages/kdna-read/README.md',
    'Remote transport admission first validates',
    '## Explicit key-grant issuer boundary',
    [
      'schema-accepted ready and rejected responses',
      'catalog reading mode remains supported',
      'status `catalog_only` is outside the current schema',
      'rejected before these binding comparisons',
    ],
  );
  check(
    'packed-read:transport-role',
    !read('packages/kdna-read/README.md').includes('both ready and catalog-only responses'),
    'Historical catalog_only cannot be described as reaching current transport binding comparison',
  );
  contains('specs/read-contract.md', null, null, [tuple.read]);
  contains('specs/read-contract.md', null, '## Authored content', [
    `[${path.basename(readArtifact.path)}](${path.basename(readArtifact.path)})`,
  ]);
  contains('specs/read-contract.md', '## Current installation boundary', null, [
    versions.core,
    versions.read,
    tuple.core,
    tuple.read,
    `binding:r2:${source.protection_admission.schema_id.split(':').at(-1)}`,
  ]);
  for (const [key, file] of [
    ['protection_admission', 'specs/protection-admission.md'],
    ['external_grant_issuer', 'specs/external-grant-issuer.md'],
    ['protected_source', 'specs/protected-source-r2.md'],
  ]) {
    const module = source[key];
    contains(
      file,
      null,
      key === 'protection_admission' ? '## 1.' : key === 'external_grant_issuer' ? '# B2.0' : null,
      [
        module.id,
        module.schema_id,
        path.basename(module.schema_path),
        versions.core,
        versions.read,
      ],
    );
    const current = segment(
      file,
      null,
      key === 'protection_admission' ? '## 1.' : key === 'external_grant_issuer' ? '# B2.0' : null,
    );
    const schemas = [...current.matchAll(/urn:kdna:schema:[a-z-]+:1\.0\.0:binding:r2:\d+/g)].map(
      (match) => match[0],
    );
    check(
      `${file}:fixed-binding`,
      schemas.length > 0 && schemas.every((id) => id === module.schema_id),
      schemas,
    );
    for (const match of read(file).matchAll(/\]\(([^)]*-r2-binding-\d+\.schema\.json)\)/g)) {
      check(
        `${file}:current-schema-link`,
        match[1] === path.basename(module.schema_path),
        match[1],
      );
    }
  }
  contains('specs/protection-admission.md', null, '## 1.', [
    `binding ${source.protection_admission.schema_id.split(':').at(-1)} candidate`,
  ]);
  const protectionResults = segment('specs/protection-admission.md', '## 5.', '## 6.');
  check(
    'protection:current-result-unions',
    !/^\| catalog_only \|/m.test(protectionResults) &&
      !protectionResults.includes('Includes genuine ready, catalog_only or existing Read refusal.'),
    'Current protection result unions have no catalog_only arm or fallback',
  );
  contains('specs/protection-admission.md', '## 5.', '## 6.', [
    'Catalog mode remains supported; unknown critical semantics never yield a catalog_only result.',
  ]);
  contains('specs/protection-adoption.md', null, '## 2.', [
    versions.core,
    versions.read,
    'current R2 explicit Node',
    'ordinary public root',
    'Explicit Node protection',
  ]);
  contains('specs/kdna-crypto-profiles.md', null, '## 1.', [
    'Current R2 ordinary root/browser',
    'Explicit Node protection',
  ]);
  contains(
    'specs/kdna-crypto-profiles.md',
    'The paragraph above records the historical B1 candidate.',
    null,
    [versions.core, versions.read],
  );
  const policy = 'specs/public-version-policy.md';
  contains(policy, null, '## Candidate history', [
    ...Object.values(tuple),
    versions.core,
    versions.read,
    readArtifact.id,
    path.basename(readArtifact.path),
    ...MODULES.map((key) => source[key].schema_id),
  ]);
  const transport = source.transport_admission,
    currentPolicy = segment(policy, null, '## Candidate history');
  const transportIds = [
    ...currentPolicy.matchAll(/urn:kdna:schema:read-transport-admission:[0-9.]+/g),
  ].map((match) => match[0]);
  check(
    'policy:transport-binding',
    [transport.contract, transport.schema_id, path.basename(transport.schema_path)].every((value) =>
      currentPolicy.includes(value),
    ) &&
      transportIds.length > 0 &&
      transportIds.every((id) => id === transport.schema_id),
    'Current transport contract, schema identity and path must agree with their owning source',
  );
  for (const [key, coordinate] of Object.entries(tuple)) {
    contains(policy, '## Exact supported combination', 'The local package candidates', [
      `| ${key} | \`${coordinate}\` |`,
    ]);
  }
  // Check each current R2 identity family, not just presence of an extra correct paragraph.
  for (const [file, start, end] of [
    ['README.zh.md', '## 当前源码', '## 已发布 CLI'],
    ['specs/read-contract.md', '## Current installation boundary', null],
    [policy, null, '## Candidate history'],
    ['docs/core-read-current-status.md', null, '## Choose and obtain'],
    ...['packages/kdna-core/README.md', 'packages/kdna-read/README.md'].map((file) => [
      file,
      null,
      '\n## ',
    ]),
    ...[
      'specs/protection-admission.md',
      'specs/external-grant-issuer.md',
      'specs/protected-source-r2.md',
      'specs/protection-adoption.md',
    ].map((file) => [
      file,
      null,
      file.endsWith('protection-admission.md')
        ? '## 1.'
        : file.endsWith('external-grant-issuer.md')
          ? '# B2.0'
          : file.endsWith('protection-adoption.md')
            ? '## 2.'
            : null,
    ]),
  ]) {
    exactFamily(file, start, end, /0\.36\.0-rc\.r2\.\d+/g, versions.core);
    exactFamily(file, start, end, /0\.11\.0-rc\.r2\.\d+/g, versions.read);
  }
  for (const name of ['core', 'read']) {
    const prefix = `packages/kdna-${name}`,
      pkg = JSON.parse(read(`${prefix}/package.json`));
    check(`${name}:source-package`, pkg.version === versions[name], pkg.version);
    if (name === 'read')
      check(
        'read:exact-peer',
        pkg.peerDependencies['@aikdna/kdna-core'] === versions.core,
        pkg.peerDependencies,
      );
    contains(`${prefix}/README.md`, null, '\n## ', [
      versions[name],
      tuple.core,
      ...(name === 'read' ? [tuple.read, versions.core] : []),
    ]);
  }
  contains('docs/version-taxonomy.md', '## Compatibility Coordinates', '## Release Coordinates', [
    String(tuple.container),
    String(tuple.payload_version),
  ]);
  for (const file of ['docs/versioning.md', 'docs/version-matrix.md'])
    contains(file, null, null, [
      'Historical versioning examples.',
      '../specs/public-version-policy.md',
    ]);
  let linkCount = 0;
  for (const file of DOCUMENTS) {
    for (const { href } of markdownLinks(read(file))) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue;
      linkCount++;
      const [filename, fragment] = href.split('#');
      const target = path.resolve(
        root,
        path.dirname(file),
        decodeURIComponent(filename || path.basename(file)),
      );
      check(
        `${file}:link:${href}`,
        target.startsWith(root + path.sep) && fs.existsSync(target),
        'Missing or outside-source link target',
      );
      if (fragment && path.extname(target) === '.md' && fs.existsSync(target)) {
        const relative = path.relative(root, target);
        check(
          `${file}:anchor:${href}`,
          anchors(read(relative)).has(decodeURIComponent(fragment)),
          'Missing target heading or explicit anchor',
        );
      }
    }
  }
  if (options.compiled !== false) {
    const prefix = options.consumer
      ? path.join(path.resolve(options.consumer), 'node_modules/@aikdna')
      : path.join(root, 'packages');
    const json = (rel) => JSON.parse(fs.readFileSync(path.join(prefix, rel), 'utf8'));
    const contract = json('kdna-core/src/public-contract/generated-contract.json');
    try {
      assert.deepEqual(contract.r2_semantics.schema_paths, source.r2_semantics.schema_paths);
      assert.deepEqual(contract.versionTuple, tuple);
      check('compiled:source-navigation-tuple', true);
    } catch (error) {
      check('compiled:source-navigation-tuple', false, error.message);
    }
    for (const [key, basename] of [
      ['protection_admission', 'protection-contract'],
      ['external_grant_issuer', 'issuer-contract'],
      ['protected_source', 'protected-source-contract'],
      ['package_set_node', 'package-set-contract'],
    ]) {
      const module = json(`kdna-core/src/public-contract/${basename}.generated.json`);
      check(
        `compiled:${key}:owning-schema`,
        module.schema_id === source[key].schema_id &&
          module.schema_path === expected[source[key].root],
        module.schema_path,
      );
    }
    const guard = json('kdna-read/src/installation.generated.json');
    check(
      'compiled:installation-pair',
      guard.core_version === versions.core && guard.read_version === versions.read,
      guard,
    );
    for (const name of ['core', 'read']) {
      const pkg = json(`kdna-${name}/package.json`);
      check(
        `compiled:${name}:actual-package`,
        pkg.version === versions[name] &&
          (name !== 'read' || pkg.peerDependencies['@aikdna/kdna-core'] === versions.core),
        pkg.version,
      );
      check(
        `compiled:${name}:readme-bytes`,
        fs.readFileSync(path.join(prefix, `kdna-${name}/README.md`), 'utf8') ===
          read(`packages/kdna-${name}/README.md`),
        'Installed/packed README differs from checked source navigation',
      );
    }
  }
  return {
    status: issues.length ? 'FAIL' : 'PASS',
    schema_roots: Object.keys(expected).length,
    documents: DOCUMENTS,
    local_links: linkCount,
    identity_claims: identityClaims,
    checks,
    issues,
    proof_limits: [
      'Checks named current sections and local navigation, not natural-language completeness or release acceptance.',
      'Package README links are verified in their complete source-distribution context; sibling repository documents are not npm package members.',
    ],
  };
}
module.exports = {
  validateSchemaNavigation,
  validateSourceMap,
  validateCurrentTarget,
  checkCurrentNavigation,
  markdownLinks,
  DOCUMENTS,
};
if (require.main === module) {
  try {
    const args = process.argv.slice(2),
      rootIndex = args.indexOf('--root'),
      consumerIndex = args.indexOf('--consumer');
    const root = rootIndex < 0 ? path.resolve(__dirname, '..') : args[rootIndex + 1];
    const result = checkCurrentNavigation(root, {
      compiled: !args.includes('--documents-only'),
      consumer: consumerIndex < 0 ? null : args[consumerIndex + 1],
    });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.issues.length ? 1 : 0;
  } catch (error) {
    console.error(
      JSON.stringify({
        status: 'ERROR',
        code: error.code ?? 'NAVIGATION_CHECK_ERROR',
        message: error.message,
      }),
    );
    process.exitCode = 1;
  }
}
