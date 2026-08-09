#!/usr/bin/env node
// Builds the zero-dependency single-file KDNA asset inspector by inlining the
// @aikdna/kdna-web-client browser library into an HTML page. No bundler is
// used: the library is exactly two ESM files, so we splice them by hand and
// pin the result to the installed package version.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_CLIENT_SRC = path.join(ROOT, 'node_modules', '@aikdna', 'kdna-web-client', 'src');
const TEMPLATE_PATH = path.join(ROOT, 'docs', 'inspector', 'inspector.template.html');
const OUT_PATH = process.env.KDNA_INSPECTOR_OUT
  ? path.resolve(process.env.KDNA_INSPECTOR_OUT)
  : path.join(ROOT, 'docs', 'inspector', 'index.html');

function readSource(name) {
  const file = path.join(WEB_CLIENT_SRC, name);
  if (!fs.existsSync(file)) {
    throw new Error(
      `kdna-web-client source missing: ${name}. Run "npm install" so the pinned ` +
        '@aikdna/kdna-web-client devDependency is present.',
    );
  }
  return fs.readFileSync(file, 'utf8');
}

const webClientPkg = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, 'node_modules', '@aikdna', 'kdna-web-client', 'package.json'),
    'utf8',
  ),
);
const webClientVersion = webClientPkg.version;

const validators = readSource(path.join('generated', 'runtime-validators.js'));
const indexSource = readSource('index.js');

// The generated validators end with a single minified export list. Rewrite it
// as local bindings using the exact names index.js imports (including its two
// import renames) so the two files concatenate into one module.
const EXPORT_LIST =
  'export{Ls as KDNA_ASSET_ID_PATTERN,Ks as KDNA_SCHEMA_AUTHORITY,Fs as validateJudgmentTrace,Us as validateRuntimeCapsule}';
if (!validators.includes(EXPORT_LIST)) {
  throw new Error(
    'kdna-web-client generated validators export list changed; the inspector ' +
      'bundler must be reviewed before continuing.',
  );
}
const validatorsBody = validators.replace(
  EXPORT_LIST,
  'const KDNA_ASSET_ID_PATTERN=Ls,KDNA_SCHEMA_AUTHORITY=Ks,' +
    'validateCanonicalJudgmentTrace=Fs,validateCanonicalRuntimeCapsule=Us;',
);

// Drop only the import block that pulls in the generated validators; the rest
// of index.js is self-contained browser ESM.
const IMPORT_BLOCK =
  "import {\n  KDNA_ASSET_ID_PATTERN,\n  KDNA_SCHEMA_AUTHORITY,\n  validateJudgmentTrace as validateCanonicalJudgmentTrace,\n  validateRuntimeCapsule as validateCanonicalRuntimeCapsule,\n} from './generated/runtime-validators.js';";
if (!indexSource.includes(IMPORT_BLOCK)) {
  throw new Error(
    'kdna-web-client index.js import block changed; the inspector bundler ' +
      'must be reviewed before continuing.',
  );
}
const indexBody = indexSource.replace(IMPORT_BLOCK, '');

const libraryBundle = `${validatorsBody}\n${indexBody}`;
const libraryDigest = createHash('sha256').update(libraryBundle).digest('hex');

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
if (!template.includes('/*__KDNA_WEB_CLIENT_BUNDLE__*/')) {
  throw new Error('inspector template is missing the bundle placeholder');
}
const page = template
  .replace('/*__KDNA_WEB_CLIENT_BUNDLE__*/', () => libraryBundle)
  .replaceAll('__KDNA_WEB_CLIENT_VERSION__', webClientVersion)
  .replaceAll('__KDNA_WEB_CLIENT_DIGEST__', libraryDigest);

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, page);
console.log(
  `asset-inspector: wrote ${path.relative(ROOT, OUT_PATH)} ` +
    `(@aikdna/kdna-web-client@${webClientVersion}, sha256:${libraryDigest.slice(0, 16)}…, ` +
    `${fs.statSync(OUT_PATH).size} bytes)`,
);
