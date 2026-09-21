import { defineConfig } from 'orval';

// The backend checkout to read the spec from. Defaults to the sibling
// MadarRust clone; point MADAR_BACKEND_DIR at a worktree (e.g. wt-perm-api)
// to generate against a feature branch's spec.
const backendDir = process.env.MADAR_BACKEND_DIR ?? '../MadarRust';

const input = {
  target: `${backendDir}/openapi.json`,
} as const;

export default defineConfig({
  api: {
    input,
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
    input,
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
