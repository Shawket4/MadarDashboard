import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // downloads/ and site/ are their own projects with their own tests (node scripts, not vitest suites)
    exclude: ['**/node_modules/**', 'downloads/**', 'site/**', '.claude/**'],
  }
}))
