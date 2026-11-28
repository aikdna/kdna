import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ENGINE_PATH = path.join(ROOT, 'packages/kdna-core/src/public-contract/schema-validator.js');

function compactEngineSource() {
  const raw = fs.readFileSync(ENGINE_PATH, 'utf8');
  return raw
    .replace(/^'use strict';\s*/u, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'))
    .join('\n');
}

export function emitSelfContainedValidators({
  header = '',
  defsExpression,
  rootMap,
  allErrors = true,
  singleRoot = null,
}) {
  const engine = compactEngineSource();
  const opts = `{ allErrors: ${Boolean(allErrors)} }`;
  const lines = [
    header ? header.replace(/\n+$/u, '') : null,
    "'use strict';",
    'const { createValidator, createValidators } = (() => {',
    'const module = { exports: {} };',
    engine,
    'return module.exports;',
    '})();',
    `const defs = ${defsExpression};`,
  ].filter((line) => line !== null);

  if (singleRoot) {
    lines.push(
      `module.exports = createValidator({ $ref: ${JSON.stringify('#/$defs/' + singleRoot)} }, defs, ${opts});`,
    );
  } else if (Array.isArray(rootMap)) {
    lines.push(`module.exports = createValidators(defs, ${JSON.stringify(rootMap)}, ${opts});`);
  } else {
    const entries = Object.entries(rootMap)
      .map(
        ([exportName, defName]) =>
          `${JSON.stringify(exportName)}: createValidator({ $ref: ${JSON.stringify('#/$defs/' + defName)} }, defs, ${opts})`,
      )
      .join(', ');
    lines.push(`module.exports = { ${entries} };`);
  }
  return Buffer.from(lines.join('\n') + '\n', 'utf8');
}

export function emitLinkedValidators({
  header = '',
  engineImport,
  defsExpression,
  rootMap,
  allErrors = true,
  singleRoot = null,
}) {
  const opts = `{ allErrors: ${Boolean(allErrors)} }`;
  const lines = [
    header ? header.replace(/\n+$/u, '') : null,
    "'use strict';",
    `const { createValidator, createValidators } = require(${JSON.stringify(engineImport)});`,
    `const defs = ${defsExpression};`,
  ].filter((line) => line !== null);

  if (singleRoot) {
    lines.push(
      `module.exports = createValidator({ $ref: ${JSON.stringify('#/$defs/' + singleRoot)} }, defs, ${opts});`,
    );
  } else if (Array.isArray(rootMap)) {
    lines.push(`module.exports = createValidators(defs, ${JSON.stringify(rootMap)}, ${opts});`);
  } else {
    const entries = Object.entries(rootMap)
      .map(
        ([exportName, defName]) =>
          `${JSON.stringify(exportName)}: createValidator({ $ref: ${JSON.stringify('#/$defs/' + defName)} }, defs, ${opts})`,
      )
      .join(', ');
    lines.push(`module.exports = { ${entries} };`);
  }
  return Buffer.from(lines.join('\n') + '\n', 'utf8');
}

export function emitProtectionValidators({ header = '' }) {
  const lines = [
    header ? header.replace(/\n+$/u, '') : null,
    "'use strict';",
    "const { createValidator, createValidators } = require('./schema-validator.js');",
    "const { envelopeRegExp } = require('./protection-envelope-codec.js');",
    "const defs = { ...require('./generated-contract.json').types, ...require('./protection-contract.generated.json').types };",
    'const opts = { allErrors: false, regExp: envelopeRegExp };',
    "const passwordSchema = require('../../schema/envelope-aead.schema.json');",
    "const externalSchema = require('../../schema/external-grant-envelope.schema.json');",
    "const grantSchema = require('../../schema/external-key-grant.schema.json');",
    'module.exports = {',
    "  ...createValidators(defs, ['ProtectionReceipt', 'ProtectedAdmissionResult', 'ProtectedReadResult', 'ProtectedTransportCommitResult', 'ChecksumsDocument1'], opts),",
    '  PasswordEnvelope: createValidator(passwordSchema, passwordSchema.$defs || passwordSchema.definitions || {}, opts),',
    '  ExternalEnvelope: createValidator(externalSchema, externalSchema.$defs || externalSchema.definitions || {}, opts),',
    '  ExternalGrant: createValidator(grantSchema, grantSchema.$defs || grantSchema.definitions || {}, opts),',
    '};',
  ].filter((line) => line !== null);
  return Buffer.from(lines.join('\n') + '\n', 'utf8');
}
