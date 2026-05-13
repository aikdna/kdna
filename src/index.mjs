import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const lib = require('./loader.js');

export const { loadDomain, loadCorePatterns, classifyInput, formatContext, FILE_MAP } = lib;
export default lib;
