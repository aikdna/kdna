/**
 * @aikdna/kdna-core — ESM entry point
 */
export {
  FILE_MAP,
  loadCorePatternsFromData,
  loadDomainFromData,
  loadDomainFromFiles,
  classifyInput,
  formatContext,
} from './loader.js';

export { lintDomain } from './lint-pure.js';

export { validateDomainSchema, validateCrossFile } from './validate-pure.js';

export { renderPreviewHTML, escHtml, renderCard } from './render.js';

export { composeContext, classifySignals, composeChecks, loadAndCompose } from './compose.js';
