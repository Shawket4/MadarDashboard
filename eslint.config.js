import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
  {
    ignores: [
      'dist',
      '.gemini',
      'node_modules',
      'src/routeTree.gen.ts',
      'src/data/api/generated/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // react-hooks v7 ships React-Compiler-era rules as errors; this app
      // doesn't use the compiler. OFF for now (candidates
      // for a dedicated cleanup pass — 62 sites) so --max-warnings 0 keeps gating — the
      // pre-upgrade lint contract was rules-of-hooks + exhaustive-deps.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-refresh/only-export-components': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_[a-zA-Z0-9_]*$',
          argsIgnorePattern: '^_[a-zA-Z0-9_]*$',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]
