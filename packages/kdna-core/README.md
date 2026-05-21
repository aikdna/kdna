# @aikdna/kdna-core

Pure logic library (zero dependencies) for loading, validating, linting, rendering, and composing KDNA domain cognition packages.

## Installation

```bash
npm install @aikdna/kdna-core
```

## Usage

```js
const { lintDomain, validateDomainSchema, validateCrossFile, renderDomain } = require('@aikdna/kdna-core');

// Validate a domain
const dataMap = {
  'KDNA_Core.json': { meta: { domain: 'my_domain' }, axioms: [...] },
  'KDNA_Patterns.json': { meta: { domain: 'my_domain' }, self_check: [...] }
};

const lintResult = lintDomain(dataMap);
const schemaResult = validateDomainSchema(dataMap, schemas);
const crossResult = validateCrossFile(dataMap);
```

## API

### `lintDomain(dataMap)`
Structural linting — checks required files, field presence, unique IDs, yes/no answerable self-checks, cross-file references, and flags potentially vague axioms.

Returns `{ errors: string[], warnings: string[] }`.

### `validateDomainSchema(dataMap, schemaMap)`
JSON Schema validation against published schemas (KDNA_Core, KDNA_Patterns, KDNA_Scenarios, KDNA_Cases, KDNA_Reasoning, KDNA_Evolution).

Returns `{ errors: string[], warnings: string[] }`.

### `validateCrossFile(dataMap)`
Cross-file consistency checks — ensures references between domain files are valid.

Returns `{ errors: string[], warnings: string[] }`.

### `renderDomain(dataMap, options?)`
Renders domain files into a structured context block using a standard template. The rendered context preserves the domain's structure as distinct, named sections suitable for agent system prompts.

## License

Apache-2.0
