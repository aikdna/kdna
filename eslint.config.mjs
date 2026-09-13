import js from '@eslint/js';

// Ajv standalone validators are emitted by scripts/public-contract/generate.mjs
// and their exact bytes are bound by specs/public-generation-manifest.json
// (VALIDATOR_OUTPUTS). They are machine output, so linting or hand-editing them
// would desync the generated surface; the generator owns them. Every other file
// under the lint scope stays covered.
const generatedValidators = {
  ignores: [
    'packages/kdna-core/src/public-contract/*.generated.js',
    'packages/kdna-read/src/*.generated.js',
  ],
};

export default [
  generatedValidators,
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
    },
  },
];
