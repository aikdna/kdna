/**
 * @aikdna/kdna — Full toolkit: core logic + Node.js I/O + CLI utilities
 */
const loader = require('./loader');
const core = require('@aikdna/kdna-core');

module.exports = {
  // Loader (Node.js file-system-backed)
  loadDomain: loader.loadDomain,
  loadCorePatterns: loader.loadCorePatterns,
  classifyInput: loader.classifyInput,
  formatContext: loader.formatContext,
  FILE_MAP: loader.FILE_MAP,
  // Core data-first API (re-exported for direct use)
  loadCorePatternsFromData: core.loadCorePatternsFromData,
  loadDomainFromData: core.loadDomainFromData,
  loadDomainFromFiles: core.loadDomainFromFiles,
  // Validation & lint (re-exported from core)
  lintDomain: core.lintDomain,
  validateDomainSchema: core.validateDomainSchema,
  validateCrossFile: core.validateCrossFile,
  // Render (re-exported from core)
  renderPreviewHTML: core.renderPreviewHTML,
  escHtml: core.escHtml,
  renderCard: core.renderCard,
};
