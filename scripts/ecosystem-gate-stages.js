'use strict';

const ECOSYSTEM_GATE_STAGE_MAX_BYTES = 32;
const ECOSYSTEM_GATE_STAGES = Object.freeze([
  'core-test',
  'core-examples',
  'core-manifest',
  'core-public-truth',
  'core-audit',
  'python-adapter',
  'cli-install',
  'cli-audit',
  'mcp-install',
  'mcp-audit',
  'studio-core-install',
  'studio-core-audit',
  'studio-cli-install',
  'studio-cli-audit',
  'cli-test',
  'mcp-test',
  'studio-core-test',
  'studio-cli-test',
  'swift-test',
  'proof-asset-validate',
  'proof-asset-plan',
  'proof-asset-load',
  'core-tarball',
  'cli-tarball',
  'mcp-tarball',
]);
const ECOSYSTEM_GATE_STAGE_SET = new Set(ECOSYSTEM_GATE_STAGES);

function isSafeEcosystemGateStage(stage) {
  return (
    typeof stage === 'string' &&
    Buffer.byteLength(stage, 'utf8') <= ECOSYSTEM_GATE_STAGE_MAX_BYTES &&
    ECOSYSTEM_GATE_STAGE_SET.has(stage)
  );
}

module.exports = {
  ECOSYSTEM_GATE_STAGE_MAX_BYTES,
  ECOSYSTEM_GATE_STAGES,
  isSafeEcosystemGateStage,
};
