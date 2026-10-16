import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

// Animation goes through src/lib/motion only (CLAUDE.md, "Motion"). GSAP is
// private to that folder so it can stay lazy, and the old libraries are gone.
// Spread into every no-restricted-imports below: a later block's rule replaces
// an earlier one's for the files they share.
const GSAP_MSG = 'GSAP is private to src/lib/motion (it loads lazily). Use a motion hook or component from @/lib/motion.'
const OLD_MSG = 'The app animates with GSAP through @/lib/motion.'
const motionPaths = [
  { name: 'gsap', message: GSAP_MSG },
  { name: '@gsap/react', message: GSAP_MSG },
  { name: 'motion', message: OLD_MSG },
  { name: 'framer-motion', message: OLD_MSG },
  { name: 'tw-animate-css', message: OLD_MSG },
]
// A slash in the middle anchors these to the package, never to @/lib/motion.
const motionImports = [
  { group: ['gsap/*'], message: GSAP_MSG },
  { group: ['motion/*'], message: OLD_MSG },
]

export default [
  {
    ignores: [
      'dist',
      '.gemini',
      'node_modules',
      'src/routeTree.gen.ts',
      'src/data/api/generated/**',
      'src/generated/**',
      // madar-shared's wasm-bindgen output, vendored by `npm run sync:rules`.
      'src/lib/rules/wasm/**',
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

  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/motion/**'],
    rules: {
      'no-restricted-imports': ['error', { paths: motionPaths, patterns: motionImports }],
    },
  },

  // The three public bundles are separately built, separately deployed apps on
  // their own hosts. Ordering and reservations must not reach into each other:
  // a change to the storefront should never be able to break the booking flow.
  // Anything they genuinely both need lives in `features/public-shell`.
  {
    files: ['src/features/reservations/**', 'src/reservations/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: motionPaths,
          patterns: [
            ...motionImports,
            {
              group: ['**/features/public-ordering/**', '../public-ordering/**'],
              message:
                'Reservations must not import from public-ordering — they are separate bundles. Move what you need into features/public-shell.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/public-ordering/**', 'src/order/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: motionPaths,
          patterns: [
            ...motionImports,
            {
              group: ['**/features/reservations/**', '../reservations/**'],
              message:
                'Ordering must not import from reservations — they are separate bundles. Move what you need into features/public-shell.',
            },
          ],
        },
      ],
    },
  },

  // Entity images render through AssetImage (variant srcset, lazy). A raw
  // <img src={x.image_url}> ships the full-size original to a 32px cell.
  {
    files: ["src/**/*.tsx"],
    ignores: ["src/components/app/asset-image.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='img'] > JSXAttribute[name.name='src'] MemberExpression[property.name=/^(image_url|logo_url)$/]",
          message: "Use <AssetImage> for entity images (TILLS_CONTRACT §11.10).",
        },
      ],
    },
  },
]
