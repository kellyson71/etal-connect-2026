// ESLint para o JavaScript puro do protótipo, do mapa e dos scripts (sem build).
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/vendor/**',
      'prototipo/mapa3d/**',
      'dist/**',
      'publico/**',
      'node_modules/**',
      '.contexto/**',
      'backend/**',
      'docs/demos/**',
      'docs/comparacao-modelos/**',
      'prototipo/plan-data.js',
      'prototipo/campus-data.js',
      'prototipo/campus-limpo.js',
      'prototipo/campus-fundo.js',
      'prototipo/campus-verde.js',
      'prototipo/sprites.js',
    ],
  },
  js.configs.recommended,
  {
    // protótipo: scripts clássicos que se falam por variáveis globais (window.*)
    files: ['prototipo/**/*.js', 'docs/assets/*.js'],
    languageOptions: { sourceType: 'script', ecmaVersion: 'latest', globals: { ...globals.browser } },
  },
  {
    files: ['mapa3d/src/**/*.js', '**/*.mjs', 'eslint.config.js'],
    languageOptions: { sourceType: 'module', ecmaVersion: 'latest', globals: { ...globals.browser } },
  },
  {
    files: ['scripts/**/*.mjs', 'prototipo/tests/**', 'mapa3d/tests/**', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
];
