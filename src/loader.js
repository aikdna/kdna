/**
 * KDNA Loader — Runtime library for loading KDNA domain cognition into agent context.
 *
 * This module provides the Node.js file-system-backed API.
 * Pure logic lives in @aikdna/kdna-core; this module handles I/O.
 */

const fs = require('fs');
const path = require('path');
const core = require('@aikdna/kdna-core');

const FILE_MAP = core.FILE_MAP;

/**
 * Read and parse a KDNA JSON file.
 * Returns null if the file does not exist.
 */
function readFile(domainDir, filename) {
  const filePath = path.join(domainDir, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Load the minimum required KDNA files (Core + Patterns).
 * Always load these. They form the cognition baseline.
 */
function loadCorePatterns(domainDir) {
  const coreData = readFile(domainDir, FILE_MAP.core);
  const patternsData = readFile(domainDir, FILE_MAP.patterns);
  return core.loadCorePatternsFromData(coreData, patternsData);
}

/**
 * Load a complete KDNA domain.
 *
 * @param {string} domainDir — path to the domain folder
 * @param {object} [options]
 * @param {string} [options.input] — user input text for conditional loading
 * @param {'all'|'minimum'|'auto'} [options.mode='auto'] — loading mode
 * @returns {object|null} loaded KDNA files keyed by type, or null if minimum files are missing
 */
function loadDomain(domainDir, options = {}) {
  const dataMap = { core: null, patterns: null };

  dataMap.core = readFile(domainDir, FILE_MAP.core);
  dataMap.patterns = readFile(domainDir, FILE_MAP.patterns);

  if (!dataMap.core || !dataMap.patterns) return null;

  // Also read optional files that might be present
  for (const key of ['scenarios', 'cases', 'reasoning', 'evolution']) {
    const data = readFile(domainDir, FILE_MAP[key]);
    if (data) dataMap[key] = data;
  }

  return core.loadDomainFromData(dataMap, options);
}

module.exports = {
  loadDomain,
  loadCorePatterns,
  classifyInput: core.classifyInput,
  formatContext: core.formatContext,
  FILE_MAP,
};
