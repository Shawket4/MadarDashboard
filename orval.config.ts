import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: '../SufrixRust/openapi.json',
    output: {
      mode: 'split',
      target: 'src/data/api/generated/api.ts',
      schemas: 'src/data/api/generated/models',
      client: 'react-query',
      mock: true,
      httpClient: 'axios',
      override: {
        header: () => '/* eslint-disable */\n// @ts-nocheck\n',
        mutator: {
          path: 'src/data/api/custom-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
  zod: {
    input: '../SufrixRust/openapi.json',
    output: {
      mode: 'split',
      target: 'src/data/api/generated/zod/api.zod.ts',
      client: 'zod',
      override: {
        header: () => '/* eslint-disable */\n// @ts-nocheck\n',
      }
    }
  }
});
