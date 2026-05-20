/**
 * @aikdna/kdna — Full toolkit: core logic + Node.js I/O + CLI utilities
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const loader = require('./loader.js');
const core = require('@aikdna/kdna-core');

// Loader (Node.js file-system-backed)
export const { loadDomain, loadCorePatterns, classifyInput, formatContext, FILE_MAP } = loader;

// Core data-first API
export const { loadCorePatternsFromData, loadDomainFromData, loadDomainFromFiles } = core;

// Validation & lint
export const { lintDomain, validateDomainSchema, validateCrossFile } = core;

// Render
export const { renderPreviewHTML, escHtml, renderCard } = core;

export default {
  loadDomain,
  loadCorePatterns,
  classifyInput,
  formatContext,
  FILE_MAP,
  loadCorePatternsFromData,
  loadDomainFromData,
  loadDomainFromFiles,
  lintDomain,
  validateDomainSchema,
  validateCrossFile,
  renderPreviewHTML,
  escHtml,
  renderCard,
};
