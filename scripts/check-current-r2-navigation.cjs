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
// Published coordinates are read from the release matrix, not typed in this file.
// A coordinate the gate pins must have exactly one source, or a matrix edit and a
// gate edit drift apart; that drift is what this gate exists to catch, so it must
// not be able to create it. The pinned literals are unchanged and still matched
// exactly and still required to be present uniquely.
const RELEASE_COORDINATES_PATH = 'docs/release-coordinates.json';
// A coordinate the matrix does not carry becomes this value, which no document can
// contain, so the run fails on the named issue rather than matching `undefined`.
const MISSING_COORDINATE = '\u0000release-coordinates-missing';
const RELEASE_UNITS = Object.freeze(['core', 'read', 'cli', 'studio-core', 'studio-cli']);
// A unit may carry a declared source candidate that leads the published
// coordinate. The matrix keeps recording only observed publication facts; the
// candidate is named separately so the two can differ without either side
// silently overwriting the other.
function numericVersion(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)$/u);
  return match ? match.slice(1).map(Number) : null;
}
function isStrictSuccessor(candidate, published) {
  const left = numericVersion(candidate);
  const right = numericVersion(published);
  if (!left || !right) return false;
  for (let index = 0; index < 3; index += 1) {
    if (left[index] > right[index]) return true;
    if (left[index] < right[index]) return false;
  }
  return false;
}
function releaseCoordinates(read, check) {
  const matrix = JSON.parse(read(RELEASE_COORDINATES_PATH));
  const rows = new Map((matrix.packages ?? []).map((row) => [row.unit, row]));
  const packages = {};
  for (const unit of RELEASE_UNITS) {
    const row = rows.get(unit);
    check(
      `release-coordinates:packages.${unit}`,
      Boolean(row && row.name && row.version && row.npm_tag),
      { unit },
    );
    // A declared candidate must strictly lead the published coordinate: it
    // describes a source that is ahead, never a restatement of what is already
    // published.
    const candidate = row?.candidate_version;
    check(
      `release-coordinates:candidate-declared.${unit}`,
      candidate === undefined || isStrictSuccessor(candidate, row?.version),
      { candidate: candidate ?? null, published: row?.version ?? null },
    );
    packages[unit] = {
      name: row?.name ?? MISSING_COORDINATE,
      version: row?.version ?? MISSING_COORDINATE,
      tag: row?.npm_tag ?? MISSING_COORDINATE,
      candidate: candidate ?? null,
    };
  }
  const mcp = (matrix.git_only ?? [])[0];
  check('release-coordinates:git_only', Boolean(mcp && mcp.name && mcp.mcp_version), {
    git_only: matrix.git_only,
  });
  return {
    packages,
    // The channel the matrix publishes the stable line on, read once.
    tag: matrix.npm_tag ?? MISSING_COORDINATE,
    preview: matrix.preserved_preview_tags ?? {},
    mcp: mcp
      ? {
          name: mcp.name,
          version: mcp.mcp_version ?? MISSING_COORDINATE,
          main_commit: mcp.main_commit ?? MISSING_COORDINATE,
        }
      : { name: MISSING_COORDINATE, version: MISSING_COORDINATE, main_commit: MISSING_COORDINATE },
  };
}
// Exact companion candidates; earlier published previews are admitted only in
// separately bounded historical statements, never as arbitrary current identities.
function companionCoordinates(coordinates) {
  const { packages, mcp } = coordinates;
  return Object.freeze([
    packages.cli.version,
    packages['studio-core'].version,
    packages['studio-cli'].version,
    mcp.version,
  ]);
}
const SOURCE_PATH = 'specs/public-semantic-source.json';
// Current-target vocabulary: an rc-era source identifies its line through the
// version suffix; a promoted stable source identifies it through the unique
// current target row. Zero or multiple current rows stay a hard failure.
const CURRENT_TARGET_STATUSES = new Set(['CURRENT_UNPUBLISHED_TARGET', 'CURRENT_RELEASED_TARGET']);
function currentLineOf(targets, coreVersion) {
  const rc = coreVersion.split('-rc.')[1]?.replace(/\.(\d+)$/, '.rc$1');
  if (typeof rc === 'string') return rc;
  const current = targets.filter((row) => CURRENT_TARGET_STATUSES.has(row?.status));
  return current.length === 1 ? current[0]?.line : undefined;
}
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
  const line = currentLineOf(
    Array.isArray(source.target_lines) ? source.target_lines : [],
    versions.core,
  );
  const targets = Array.isArray(source.target_lines) ? source.target_lines : [];
  const rows = targets.filter((row) => row?.line === line);
  const current = targets.filter((row) => CURRENT_TARGET_STATUSES.has(row?.status));
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
  'docs/current-release-support.md',
  'docs/release-stable.md',
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
// Navigation projection, not an HTML sanitizer. Each input character is visited once.
// A closing angle consumes the pending tag segment. An unterminated segment keeps
// its text but not its angle brackets, matching the existing heading-fragment rule.
function headingText(text) {
  const visible = [];
  let pending = null;
  for (const character of text) {
    if (character === '<') {
      pending ??= [];
    } else if (character === '>') {
      pending = null;
    } else {
      (pending ?? visible).push(character);
    }
  }
  return visible.join('') + (pending === null ? '' : pending.join(''));
}
function anchors(text) {
  const result = new Set(),
    counts = new Map();
  for (const match of unfenced(text).matchAll(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    // Project heading text to a fragment identifier, never an HTML rendering.
    const base = headingText(match[1])
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
// Built per call so the current-release coordinates inside these texts come from
// the release matrix, exactly as the pinned literals do.
function retainedIdentityContexts(released, channelTag) {
  return [
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
      file: 'docs/version-and-capability-matrix.md',
      role: 'downstream',
      heading: '## 2. Current Core/Read source and preserved component observations',
      text: '| `@aikdna/kdna-cli` | `0.40.0-rc.protection.1` | Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1`; private candidate; Node >=22 |\n| `@aikdna/kdna-studio-core` | `4.5.0-rc.material-edit.1` | Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1`; local unpublished source; Node >=22 |\n| `@aikdna/kdna-studio-cli` | `0.17.0-rc.material-edit.1` | Studio Core `4.5.0-rc.material-edit.1` / Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1`; local unpublished source; Node >=22 |\n| `@aikdna/kdna-mcp-server` | `0.8.1-rc.combination.1` | CLI `0.39.1-rc.combination.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1`; private candidate; Node >=22 |',
    },
    {
      file: 'docs/version-and-capability-matrix.md',
      role: 'historical',
      heading: '## 2. Current Core/Read source and preserved component observations',
      text: '| `@aikdna/kdna-cli` | `0.38.0-rc.component-semantics.1` | Unpublished candidate (`private`) |\n| `@aikdna/kdna-studio-core` | `4.0.0-rc.components.1` | Unpublished candidate (`private`) |\n| `@aikdna/kdna-studio-cli` | `0.13.0-rc.components.1` | Unpublished candidate |\n| `@aikdna/kdna-mcp-server` | `0.7.0-rc.component-semantics.1` | Unpublished candidate (`private`) |\n| `@aikdna/kdna-assets` | `0.3.0-rc.component-semantics.1` | Unpublished source bundle (`private`) |',
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
    {
      file: 'README.md',
      role: 'downstream',
      heading: '## Current source: choose the matching implementation',
      text: `| [Native CLI](https://github.com/aikdna/kdna-cli#readme) | CLI \`${released.cli.version}\` with its own exact Core \`0.37.7\` / Read \`0.13.1\` pins | Container \`0.6.0\`, Read \`0.7.0-candidate\`: create, save, inspect, validate, retained read and Source revision; Node >=22 |`,
    },
    {
      file: 'README.md',
      role: 'downstream',
      heading: '## Current source: choose the matching implementation',
      text: '| [Loader/MCP](https://github.com/aikdna/kdna-skills#readme) | MCP `0.8.0-rc.native-sections.3` with that exact native CLI and its Core `0.37.7` / Read `0.13.1` pins | Complete-source, operator-bound local stdio Read; named Host delivery/adoption `NOT_RUN` |',
    },
    {
      file: 'README.md',
      role: 'downstream',
      heading: '## Current source: choose the matching implementation',
      text: `| [Studio session](https://github.com/aikdna/kdna-studio-cli#readme) | StudioCLI \`${released['studio-cli'].version}\` / StudioCore \`${released['studio-core'].version}\` on their own pinned Core \`0.37.2\` / Read \`0.11.3\` line | Complete-source session creation, revision, save/read/verify and explicit protected export; container \`0.5.0\`, Read \`0.6.4\` |`,
    },
    {
      file: 'README.md',
      role: 'downstream',
      heading: '## Current source: choose the matching implementation',
      text: `Published Core \`0.37.0\` / Read \`0.11.1\` retain their own contracts and artifacts.\nHistorical native CLI \`0.39.0-rc.native-sections.2\` binds Core\n\`0.36.0-rc.r2.7\` / Read \`0.11.0-rc.r2.7\`; loading CLI \`0.36.1\` binds Core\n\`0.21.0\` and \`cbor-x\` \`1.6.4\`. Do not inject a new SDK pair into either older\ninstallation. CLI \`.2\` and \`.3\` remain published previews; the published stable\nline is \`${released.cli.version}\`, which must not overwrite either preview. The separate Studio ordinary/protected guide\nsupplies its own preparation, trusted Host/credential boundary and readback\ninstructions; named Host delivery and independent acceptance remain \`NOT_RUN\`.\nTechnical checks and\nscripted examples do not establish human confirmation, editorial fitness or\nactual task adoption.`,
    },
    {
      file: 'README.md',
      role: 'downstream',
      heading: '## Ecosystem',
      text: `| [kdna-cli](https://github.com/aikdna/kdna-cli) | Published CLI \`${released.cli.version}\` on \`${channelTag}\`; native previews and the earlier \`0.36.1\` loading line retained | Native authoring, explicit Read and Source revision; its own exact Core \`0.37.7\` / Read \`0.13.1\` pins |`,
    },
    {
      file: 'README.md',
      role: 'downstream',
      heading: '## Ecosystem',
      text: `| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Published StudioCLI \`${released['studio-cli'].version}\` on \`${channelTag}\`; historical npm \`0.11.0\` and \`0.13.0\` retained | Terminal creation session; container \`0.5.0\` / Read \`0.6.4\`, separate from native CLI |`,
    },
    {
      file: 'README.md',
      role: 'downstream',
      heading: '## Ecosystem',
      text: `| [kdna-studio-core](https://github.com/aikdna/kdna-studio-core) | Published StudioCore \`${released['studio-core'].version}\` on \`${channelTag}\`; historical npm \`3.0.0\` and \`4.0.0\` retained | Studio session SDK and explicit protected export; its own Host/credential boundary |`,
    },
    {
      file: 'README.md',
      role: 'downstream',
      heading: '## Ecosystem',
      text: `| [kdna-skills](https://github.com/aikdna/kdna-skills) | Loader/Creator source; MCP \`0.8.0-rc.native-sections.3\` npm-unpublished by policy, delivered through GitHub releases; historical npm MCP \`0.5.0\` | Matched published native \`${released.cli.version}\` graph; operator-bound local stdio, named Host delivery/adoption \`NOT_RUN\` |`,
    },
    {
      file: 'README.zh.md',
      role: 'downstream',
      heading: '## 当前源码：选择匹配的实现',
      text: `| [原生 CLI](https://github.com/aikdna/kdna-cli#readme) | CLI \`${released.cli.version}\` 与其自身精确 Core \`0.37.7\` / Read \`0.13.1\` | container \`0.6.0\` / Read \`0.7.0-candidate\`；创建、保存、检查、验证、会话读取和 Source 修订；Node >=22 |`,
    },
    {
      file: 'README.zh.md',
      role: 'downstream',
      heading: '## 当前源码：选择匹配的实现',
      text: '| [Loader/MCP](https://github.com/aikdna/kdna-skills#readme) | MCP `0.8.0-rc.native-sections.3` 与上述精确 CLI 及其 Core `0.37.7` / Read `0.13.1` | 完整源码、本地 operator 绑定的 stdio Read；具名 Host 交付与采用 `NOT_RUN` |',
    },
    {
      file: 'README.zh.md',
      role: 'downstream',
      heading: '## 当前源码：选择匹配的实现',
      text: `| [Studio 会话](https://github.com/aikdna/kdna-studio-cli#readme) | StudioCLI \`${released['studio-cli'].version}\` / StudioCore \`${released['studio-core'].version}\` 在各自固定的 Core \`0.37.2\` / Read \`0.11.3\` 线上 | 完整源码会话创作、修订、保存/读取/复验和显式保护导出；container \`0.5.0\` / Read \`0.6.4\` |`,
    },
    {
      file: 'README.zh.md',
      role: 'downstream',
      heading: '## 已发布原生 CLI 0.39.0-rc.native-sections.2 的独立路径',
      text: '## 已发布原生 CLI 0.39.0-rc.native-sections.2 的独立路径',
    },
    {
      file: 'README.zh.md',
      role: 'downstream',
      heading: '## 已发布原生 CLI 0.39.0-rc.native-sections.2 的独立路径',
      text: '下面保留已发布原生线的独立历史示例。可从 npm 取得公开预发布包 `@aikdna/kdna-cli@0.39.0-rc.native-sections.2`，\n其精确依赖为 `@aikdna/kdna-core@0.36.0-rc.r2.7` 与\n`@aikdna/kdna-read@0.11.0-rc.r2.7`。该组合保留 container `0.6.0` / Read\n`0.7.0-candidate` 的原生合同，上述浏览器候选不替换其 Core/Read。包内\n[原生交付说明](https://unpkg.com/@aikdna/kdna-cli@0.39.0-rc.native-sections.2/docs/native-delivery.md)\n记载冻结的离线依赖图，仍含发布前措辞；registry 安装解析独立依赖图，应保留其生成的 lock。\n从包内[作者示例](https://unpkg.com/@aikdna/kdna-cli@0.39.0-rc.native-sections.2/examples/team-update/README.md)\n及[可执行原生配方](https://unpkg.com/@aikdna/kdna-cli@0.39.0-rc.native-sections.2/examples/native-workflow.cjs)\n开始这条原生创作路径，使用上述已发布 CLI 组合。该 CLI 包未包含专门的原生 Creator 指南，\n这条路径使用包内作者示例与配方。Studio 保留独立创作路径。',
    },
    {
      file: 'README.zh.md',
      role: 'downstream',
      heading: '## 已发布原生 CLI 0.39.0-rc.native-sections.2 的独立路径',
      text: '```sh\nmkdir kdna-native-example\ncd kdna-native-example\nnpm init -y\nnpm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.39.0-rc.native-sections.2\nnode node_modules/@aikdna/kdna-cli/examples/native-workflow.cjs node_modules/@aikdna/kdna-cli/examples/team-update/author.json ./team-update-output\n```',
    },
    {
      file: 'README.md',
      role: 'downstream',
      heading: '## Current source: choose the matching implementation',
      text: '```sh\nmkdir kdna-native-example\ncd kdna-native-example\nnpm init -y\nnpm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.43.0\nnode node_modules/@aikdna/kdna-cli/examples/native-workflow.cjs node_modules/@aikdna/kdna-cli/examples/team-update/author.json ./team-update-output\n```',
    },
    {
      file: 'README.zh.md',
      role: 'downstream',
      heading: '## 当前源码：选择匹配的实现',
      text: '```sh\nmkdir kdna-native-example\ncd kdna-native-example\nnpm init -y\nnpm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.43.0\nnode node_modules/@aikdna/kdna-cli/examples/native-workflow.cjs node_modules/@aikdna/kdna-cli/examples/team-update/author.json ./team-update-output\n```',
    },
    {
      file: 'docs/core-read-current-status.md',
      role: 'downstream',
      heading: '## Matching consumer routes',
      text: `| Native CLI | CLI \`${released.cli.version}\` with its own exact Core \`0.37.7\` / Read \`0.13.1\` pins | Container0.6 create/save/read/source-open/source-pack. Explicit permission, retained same-session handles; no Plan/load or protected-browser credential interface. |`,
    },
    {
      file: 'docs/core-read-current-status.md',
      role: 'downstream',
      heading: '## Matching consumer routes',
      text: '| Loader/MCP | MCP `0.8.0-rc.native-sections.3` with that exact CLI and its Core `0.37.7` / Read `0.13.1` pins | Complete Git source plus bundled graph; one operator-bound local file. npm publication disabled. Actual Host delivery/adoption remains unassessed. |',
    },
    {
      file: 'docs/core-read-current-status.md',
      role: 'downstream',
      heading: '## Matching consumer routes',
      text: `| Studio | StudioCLI \`${released['studio-cli'].version}\` / StudioCore \`${released['studio-core'].version}\` with its own pinned SDK pair (Core \`0.37.2\` / Read \`0.11.3\`) | Container0.5/Read0.6.4 session, fresh role-specific adoption, revision, save/read/verify and explicit protected export. Use Studio's reader; nativeCLI does not read these assets. |`,
    },
    {
      file: 'docs/core-read-current-status.md',
      role: 'downstream',
      heading: '## Matching consumer routes',
      text: 'The immediately preceding Core `0.37.7` / Read `0.13.1` pair remains\ninstallable; native CLI `0.43.0` still pins it. The published history also\nretains Core `0.37.0` / Read `0.11.1` and native CLI\n`0.39.0-rc.native-sections.2` with Core `0.36.0-rc.r2.7` / Read\n`0.11.0-rc.r2.7`. These are distinct installed graphs. The stable coordinates\nabove are supplied by the official registry.\nNo page, clean checkout, package.json version or draft PR establishes that fact.',
    },
    {
      file: 'docs/core-read-current-status.md',
      role: 'downstream',
      heading: '## Exact SDK pair and contracts',
      text: 'and Read `kdna.read/0.7.0-candidate`.',
    },
    {
      file: 'docs/start-here.md',
      role: 'downstream',
      heading: '## Current source entry',
      text: `Use the [current support and distribution matrix](./current-release-support.md)\nand [matching-source guide](./core-read-current-status.md#choose-and-obtain-one-matching-delivery).\nThe native entry is CLI \`${released.cli.version}\` with exact Core\n\`0.37.7\` / Read \`0.13.1\`, container0.6 and\nRead0.7-candidate. CLI \`${released.cli.version}\` retains its own exact companion graph; the\nnewly published Core \`${released.core.version}\` / Read \`${released.read.version}\` pair is not yet bound by a native\nCLI release. Prepare the complete twelve-archive delivery using the\n[CLI generator](https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md).\nSource availability and registry publication are separate facts; the registry\nrecipe in the [README](../README.md#current-source-choose-the-matching-implementation)\nis conditional on those exact published versions.`,
    },
    {
      file: 'docs/start-here.md',
      role: 'downstream',
      heading: '## Current source entry',
      text: 'The [Loader/MCP source](https://github.com/aikdna/kdna-skills#readme) is\n`0.8.0-rc.native-sections.3` with that same exact native CLI/SDK graph. Its npm\npublication is disabled and named Host delivery remains NOT_RUN. Installing a\nSkill or copying a process vector does not establish Host activation.',
    },
    {
      file: 'docs/start-here.md',
      role: 'downstream',
      heading: '## Current source entry',
      text: `For Studio creation and local protection, use StudioCLI\n\`${released['studio-cli'].version}\` / StudioCore \`${released['studio-core'].version}\` and their complete\nsource graph. This separate route uses container0.5 / Read0.6.4. Saved protected\nconsumption and revision use the [trusted local Host guide](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/references/studio-protected-host.md),\nnot StudioCLI's static read command or native container0.6. Credentials and\npermissions belong to the independently trusted launcher, not asset text.`,
    },
    {
      file: 'docs/current-release-support.md',
      role: 'downstream',
      heading: '## Native and Studio entry points',
      text: `For a new native asset workflow, use CLI \`${released.cli.version}\`, Core\n\`0.37.7\` and Read \`0.13.1\` together. CLI \`${released.cli.version}\` retains its own exact\nCore \`0.37.7\` / Read \`0.13.1\` companion graph; the newly published Core\n\`${released.core.version}\` / Read \`${released.read.version}\` pair is not yet bound by a native CLI release. The native route\nuses container \`0.6.0\` and Read \`0.7.0-candidate\`. Its complete source delivery\ncontains the CLI and all eleven required companion archives, a relative-file\nlock, full member bindings and licenses. Follow the\n[CLI acquisition guide](https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md)\nand [public author example](https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md).\nThe example creates and saves, reads exact selections, revises official Source,\nreopens and reuses the revised asset, and preserves the original.`,
    },
    {
      file: 'docs/current-release-support.md',
      role: 'downstream',
      heading: '## Native and Studio entry points',
      text: 'The Loader/MCP source candidate `0.8.0-rc.native-sections.3` embeds that exact\nnative graph. Follow its [complete checkout instructions](https://github.com/aikdna/kdna-skills/blob/main/mcp-server/README.md).\nIt is a local operator-bound stdio adapter; its npm publication is disabled.\nNamed Agent Host delivery and semantic adoption remain unassessed.',
    },
    {
      file: 'docs/current-release-support.md',
      role: 'downstream',
      heading: '## Native and Studio entry points',
      text: `StudioCLI \`${released['studio-cli'].version}\` and StudioCore \`${released['studio-core'].version}\` use their own pinned SDK package pair\n(Core \`0.37.2\` / Read \`0.11.3\`) with a different container \`0.5.0\` / Read \`0.6.4\` route.\nUse their [source installation and ordinary/protected session guide](https://github.com/aikdna/kdna-studio-cli#readme).\nSession authoring, role-specific adoption, revision, save/read/verify and\nexplicit protected export retain that route's source and credential contracts.\nProtected consumption and saved-file revision use the separate\n[Studio local Host adapter](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/references/studio-protected-host.md)\nwith the same container0.5 / Read0.6.4 graph. StudioCLI's static read command\ndoes not unlock protected files. The adapter requires an independently trusted\nlauncher to bind the installation, file, exact digest, purpose, lifetime and\npermissions through a dedicated descriptor; credentials use separate pipes.\nA descriptor supplied by an Agent does not establish authorization by itself.\nThe current Studio exporter requires an explicitly complete method; a\nmethod-absent proposal is not supported by that route.\nThe native CLI does not read Studio's container. Neither route establishes real\nhuman identity, editorial acceptance, model execution or action permission.`,
    },
    {
      file: 'docs/current-release-support.md',
      role: 'downstream',
      heading: '## Repository-by-repository support',
      text: `| [kdna-studio-core](https://github.com/aikdna/kdna-studio-core) | Complete-source \`${released['studio-core'].version}\`; its own pinned SDK pair, container0.5 session route. | npm \`${released['studio-core'].version}\`; historical npm \`3.0.0\` and \`4.0.0\` retained. |`,
    },
    {
      file: 'docs/current-release-support.md',
      role: 'downstream',
      heading: '## Repository-by-repository support',
      text: `| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Complete-source \`${released['studio-cli'].version}\` with that exact StudioCore/SDK graph. | npm \`${released['studio-cli'].version}\`; historical npm \`0.11.0\` and \`0.13.0\` retained. |`,
    },
    {
      file: 'docs/current-release-support.md',
      role: 'downstream',
      heading: '## Repository-by-repository support',
      text: '| [kdna-assets](https://github.com/aikdna/kdna-assets) | Source/index `0.3.0-rc.component-semantics.1`, verification scope `0.1.5`, with the older pinned SDK/Studio graph. Historical assets retain their own format and may reject under a newer reader. | GitHub release `0.1.1`; source asset index, not an npm SDK. |',
    },
    {
      file: 'docs/current-release-support.md',
      role: 'downstream',
      heading: '## Repository-by-repository support',
      text: '| [kdna](https://github.com/aikdna/kdna) | Exact published Core/Read pair above; complete specifications, generated contracts and conformance sources. Separate auxiliary packages retain the scope below. | npm Core `0.37.0`, Read `0.11.1`; their own contracts and artifacts. |',
    },
    {
      file: 'docs/current-release-support.md',
      role: 'downstream',
      heading: '## Repository-by-repository support',
      text: `| [kdna-cli](https://github.com/aikdna/kdna-cli) | Published native \`${released.cli.version}\` stable delivery; Node >=22. Native Plan/load unavailable. | Native previews keep their exact graphs; the earlier \`0.36.1\` line keeps its own loading contract. Existing versions cannot be overwritten. |`,
    },
    {
      file: 'docs/current-release-support.md',
      role: 'downstream',
      heading: '## Repository-by-repository support',
      text: '| [kdna-skills](https://github.com/aikdna/kdna-skills) | Complete-source MCP `.8` above; Loader/native Creator and explicitly matched Studio Creator. | npm MCP `0.5.0`; not the current native adapter. |',
    },
    {
      file: 'packages/kdna-core/README.md',
      role: 'downstream',
      heading: '# KDNA Core',
      text: 'Container `0.6.0` and Read `0.7.0-candidate`. See the',
    },
    {
      file: 'packages/kdna-read/README.md',
      role: 'downstream',
      heading: '# KDNA Read',
      text: 'the native section route separately uses `kdna.read/0.7.0-candidate`.',
    },
    {
      file: 'packages/kdna-core/README.md',
      role: 'historical',
      heading: '# KDNA Core',
      text: 'The earlier published Core `0.37.1-rc.browser.1` / Read\n`0.11.2-rc.browser.1` previews retain their own byte identities and tags.',
    },
    {
      file: 'docs/current-release-support.md',
      role: 'historical',
      heading: '## Published channel history',
      text: `| Package | Published preview | Preview tag | Earlier \`${channelTag}\` observed |\n| --- | --- | --- | --- |\n| \`@aikdna/kdna-core\` | \`0.37.1-rc.browser.1\` | \`browser-preview\` | \`0.37.0\` |\n| \`@aikdna/kdna-read\` | \`0.11.2-rc.browser.1\` | \`browser-preview\` | \`0.11.1\` |\n| \`@aikdna/kdna-cli\` | \`0.39.0-rc.native-sections.3\` | \`native-preview\` | \`0.36.1\` |\n| \`@aikdna/kdna-studio-core\` | \`4.0.0-rc.components.2\` | \`components-preview\` | \`3.0.0\` |\n| \`@aikdna/kdna-studio-cli\` | \`0.13.0-rc.components.2\` | \`components-preview\` | \`0.11.0\` |`,
    },
    {
      file: 'docs/version-and-capability-matrix.md',
      role: 'historical',
      heading: '## 2. Current Core/Read source and preserved component observations',
      text: '| `@aikdna/kdna-core` | `0.37.1-rc.browser.1` | Unpublished browser candidate; Node >=20; separate byte-bound acceptance |\n| `@aikdna/kdna-read` | `0.11.2-rc.browser.1` | Exact Core `0.37.1-rc.browser.1` peer; unpublished browser candidate; Node >=20 |',
    },
  ];
}
function maskRetainedIdentities(file, text, check, contexts) {
  let current = text;
  for (const context of contexts.filter((item) => item.file === file)) {
    const start = text.indexOf(context.text);
    const heading =
      context.text === context.heading && start >= 0
        ? context.heading
        : start < 0
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
function checkIdentityOccurrences(file, text, source, check, companions, contexts) {
  const current = maskRetainedIdentities(file, text, check, contexts),
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
    record('current-package', match, [versions.core, versions.read, ...companions]);
  }
  // Stable package identities also remain visible in the occurrence ledger.
  // They are not a global numeric allowlist: current owner/table checks below
  // still reject missing, duplicated, stale or wrongly assigned coordinates.
  for (const version of Object.values(versions).filter((value) => !value.includes('-'))) {
    const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const match of current.matchAll(new RegExp('(?<![0-9.])' + escaped + '(?![0-9.-])', 'g')))
      record('current-package', match, [version]);
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
  // Published coordinates come from the release matrix; the current package
  // versions come from the semantic source. They describe the same releases, so a
  // disagreement between them is a defect, not a preference: it is recorded here
  // rather than resolved silently in either direction.
  const coordinates = releaseCoordinates(read, check);
  const released = coordinates.packages;
  const channelTag = coordinates.tag;
  for (const unit of ['core', 'read'])
    check(
      `release-coordinates:source-consistency.${unit}`,
      source.engineering.package_versions[unit] === coordinates.packages[unit].version ||
        source.engineering.package_versions[unit] === coordinates.packages[unit].candidate,
      {
        semantic_source: source.engineering.package_versions[unit],
        release_matrix: coordinates.packages[unit].version,
        declared_candidate: coordinates.packages[unit].candidate,
      },
    );
  // The published block may never carry a declared candidate: the candidate is
  // a source fact, and a reader of the published statement can only install what
  // the registry actually serves.
  const publishedBlock = (() => {
    const text = read('README.md');
    const start = text.indexOf('<!-- release-coordinates:begin');
    const end = text.indexOf('<!-- release-coordinates:end -->');
    return start >= 0 && end > start ? text.slice(start, end) : '';
  })();
  // The comparison is package-scoped: a different package may legitimately
  // publish the same number (read 0.13.0 beside studio-cli 0.13.0), and only
  // THIS package's row may not render the candidate as its published artifact.
  const declaredCandidates = Object.entries(coordinates.packages)
    .filter(([, row]) => typeof row.candidate === 'string')
    .map(([unit, row]) => ({ unit, name: row.name, candidate: row.candidate }));
  check(
    'release-coordinates:candidate-not-published',
    declaredCandidates.every(
      (row) => !publishedBlock.includes('`' + row.name + '` | `' + row.candidate + '`'),
    ),
    { declared_candidates: declaredCandidates, block_chars: publishedBlock.length },
  );
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
  const currentLine = currentLineOf(
    Array.isArray(source.target_lines) ? source.target_lines : [],
    versions.core,
  );
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
  contains('README.md', null, '> **KDNA gives reusable judgment', [
    `| \`${released.core.name}\` | \`${released.core.version}\` | \`${released.core.tag}\` |`,
    `| \`${released.cli.name}\` | \`${released.cli.version}\` | \`${released.cli.tag}\` |`,
    `| \`${released['studio-cli'].name}\` | \`${released['studio-cli'].version}\` | \`${released['studio-cli'].tag}\` |`,
    'All five stable coordinates are',
    'MCP remains a Git source channel',
  ]);
  contains('docs/start-here.md', '## Which line', '## What do you want', [
    '| Published stable distribution |',
    `Core \`${released.core.version}\`, Read \`${released.read.version}\`, CLI \`${released.cli.version}\``,
    `| Published on \`${released.read.tag}\` |`,
    '| Published previews |',
    `| Earlier \`${channelTag}\` observation |`,
  ]);
  contains('docs/release-stable.md', null, null, [
    versions.core,
    versions.read,
    'publication gates that produced them; the same procedure applies to later',
    'stable-release-authority.js candidate --unit core',
    'stable-release-authority.js candidate --unit read',
    'stable-release-authority.js candidate-smoke --unit core',
    "Read's release smoke requires an approved,",
    'already-public exact Core companion and a genuine release approval',
    'published, nondraft **stable releases**',
    'kdna.stable-release-approval/1',
    "Only the selected package's",
    `\`${channelTag}\` may transition to the approved new version; other tags remain fixed`,
    'adds no MCP npm package',
  ]);
  check(
    'current-status:no-self-artifact-digest',
    !/[a-f0-9]{64}/.test(segment('docs/core-read-current-status.md', null, '## Preserved history')),
    'Current package identities are bound by external release evidence, not an enclosing-archive self-hash',
  );
  check(
    'stable-procedure:no-unapproved-read-smoke',
    !read('docs/release-stable.md').includes('candidate-smoke --unit read'),
    'Read smoke requires its approved public Core companion; local candidate evidence cannot supply it',
  );
  contains('README.md', null, '## Published CLI', [
    '**R2**',
    'native execution 0.3.1',
    `| Core/Read | Core \`${released.core.version}\` / Read \`${released.read.version}\``,
    'SPEC-INDEX.md#kdna-public-specification-index',
  ]);
  contains('README.md', '## Published CLI 0.36.1 walkthrough', '```bash', [
    `Core \`${released.core.version}\` / Read \`${released.read.version}\``,
    'Keep its exact historical dependencies',
  ]);
  contains('README.zh.md', '## 当前源码', '## 已发布 CLI', [
    versions.core,
    versions.read,
    '原生 0.3.1 Plan/Capsule',
    '普通 root/browser',
    '显式 Node',
  ]);
  contains('docs/start-here.md', '## Current source entry', '## 5-Minute Quick Start', [
    `\`${released.core.version}\` / Read \`${released.read.version}\``,
    'Source availability and registry publication are separate facts',
    'publication is disabled and named Host delivery remains NOT_RUN',
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
  contains('docs/core-read-current-status.md', null, '## Matching consumer routes', [
    versions.core,
    versions.read,
    // The sentence describes the peer the maintained source declares, so it
    // follows the source coordinate rather than the last published one.
    `Read declares Core \`${versions.core}\` as its exact peer`,
    `container \`${tuple.container}\``,
    `${tuple.payload_profile}/${tuple.payload_version}`,
    tuple.core,
    tuple.ir,
    tuple.read,
    'execution coordinates `0.3.1`',
    'Unknown critical semantics reject',
    'denied,\ndeferred and over-budget disclosures are not absence',
    'Ordinary root/browser\nadmission retains protection refusals',
    'not enable Plan/load in the native asset CLI',
  ]);
  contains('docs/core-read-current-status.md', '## Choose and obtain', '## Preserved history', [
    'real-release event gate',
    `New stable versions target \`${channelTag}\` in dependency order`,
    'existing version collisions fail closed',
    'do not fall back to plaintext or a raw parser',
  ]);
  contains('docs/current-release-support.md', null, '## Native and Studio entry points', [
    'All five are unpublished',
    'relabeled or overwritten',
  ]);
  contains(
    'docs/current-release-support.md',
    '## Native and Studio entry points',
    '## Repository-by-repository support',
    [
      'its npm publication is disabled',
      'Named Agent Host delivery and semantic adoption remain unassessed',
      'A descriptor supplied by an Agent does not establish authorization by itself',
      `Publication targets \`${channelTag}\` only after each exact dependency is public`,
      'Every new artifact requires registry integrity',
    ],
  );
  contains('README.md', '## Current source:', '## Published CLI', [
    'The exact published coordinate installs from an empty cache with:',
    'CLI `.2` and `.3` remain published previews',
    'which must not overwrite either preview',
    'Native CLI Plan/load remains unavailable',
  ]);
  contains('README.zh.md', '## 当前源码', '## 已发布原生 CLI', [
    '已发布的精确坐标可从空缓存安装',
    '原生 CLI 的 Plan/load 不可用',
    `已发布稳定线是 \`${released.cli.version}\`，不能覆盖已经发布的 \`.2\` 或 \`.3\``,
  ]);
  contains('README.md', '## Current source:', '## Published CLI', [
    `| Core/Read | Core \`${released.core.version}\` / Read \`${released.read.version}\` | Ordinary and Host-unlocked protected browser SDK; declared Node reference exports; Node >=20 |`,
  ]);
  contains('README.zh.md', '## 当前源码', '## 已发布原生 CLI', [
    `| Core/Read | Core \`${released.core.version}\` / Read \`${released.read.version}\` | 普通与 Host 解锁的受保护浏览器 SDK、声明的 Node 参考入口；Node >=20 |`,
  ]);
  // A current table has one row per named route. A correct retained row cannot
  // excuse an appended second row with a different graph or publication claim.
  function tableRoles(file, start, end, roles) {
    const rows = segment(file, start, end)
      .split('\n')
      .filter((line) => line.startsWith('| '))
      .map((line) => line.split('|')[1].trim());
    check(`${file}:current-table-roles:${start}`, isDeepEqual(rows.slice(2), roles), {
      expected: roles,
      observed: rows.slice(2),
    });
  }
  tableRoles('README.md', '## Current source:', '## Published CLI', [
    'Core/Read',
    '[Native CLI](https://github.com/aikdna/kdna-cli#readme)',
    '[Loader/MCP](https://github.com/aikdna/kdna-skills#readme)',
    '[Studio session](https://github.com/aikdna/kdna-studio-cli#readme)',
  ]);
  tableRoles('README.zh.md', '## 当前源码', '## 已发布原生 CLI', [
    'Core/Read',
    '[原生 CLI](https://github.com/aikdna/kdna-cli#readme)',
    '[Loader/MCP](https://github.com/aikdna/kdna-skills#readme)',
    '[Studio 会话](https://github.com/aikdna/kdna-studio-cli#readme)',
  ]);
  tableRoles(
    'docs/core-read-current-status.md',
    '## Matching consumer routes',
    '## Choose and obtain',
    ['Native CLI', 'Loader/MCP', 'Studio'],
  );
  tableRoles(
    'docs/current-release-support.md',
    '## Repository-by-repository support',
    '## Auxiliary distribution',
    [
      'kdna',
      'kdna-cli',
      'kdna-skills',
      'kdna-studio-core',
      'kdna-studio-cli',
      'kdna-assets',
      // Only the core release wave and the licensed-asset index are named here.
      // A repository outside that set is not referenced from this table at all.
    ].map((name) => `[${name}](https://github.com/aikdna/${name})`),
  );
  for (const file of ['README.md', 'README.zh.md'])
    contains(
      file,
      file === 'README.md' ? '## Current source:' : '## 当前源码',
      file === 'README.md' ? '## Published CLI' : '## 已发布原生 CLI',
      [
        'https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md)',
        'https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md)',
        'https://github.com/aikdna/kdna-cli/blob/main/examples/native-workflow.cjs)',
        './examples/native-team-update/README.md)',
      ],
    );
  const matrix = 'docs/version-and-capability-matrix.md';
  contains(matrix, null, '## Why one matrix', ['**R2**']);
  contains(matrix, '## 2.', '## 3.', [
    `| \`@aikdna/kdna-core\` | \`${released.core.version}\``,
    `| \`@aikdna/kdna-read\` | \`${released.read.version}\` | Exact Core \`${released.core.version}\``,
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
  const companions = companionCoordinates(coordinates);
  const retainedContexts = retainedIdentityContexts(released, channelTag);
  const identityClaims = DOCUMENTS.flatMap((file) =>
    checkIdentityOccurrences(file, read(file), source, check, companions, retainedContexts),
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
    for (const name of ['core', 'read']) {
      const version = versions[name];
      const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // The current family comes from the source, including new prerelease
      // labels. The all-coordinate pass above still rejects older families.
      const family = version.includes('-rc.')
        ? escaped.replace(/\\\.\d+$/, '\\.\\d+')
        : escaped + '(?![0-9.-])';
      exactFamily(file, start, end, new RegExp(family, 'g'), version);
    }
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
  headingText,
  validateSchemaNavigation,
  validateSourceMap,
  validateCurrentTarget,
  checkCurrentNavigation,
  markdownLinks,
  DOCUMENTS,
  // Tooling surface: the retained-identity expectations and the loaded
  // release matrix, so a maintenance script can reconcile the documents the
  // check audits instead of transcribing the templates by hand.
  retainedIdentityContexts,
  releaseCoordinates,
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
