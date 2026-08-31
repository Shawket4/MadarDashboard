import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";
import compression from "vite-plugin-compression";
import { constants as zlibConstants } from "node:zlib";
import { readFileSync } from "node:fs";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const pkgVersion = (
  JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf8")) as { version: string }
).version;

// Sentry release: shared by the runtime SDK (via the `__SENTRY_RELEASE__`
// define below) and by the source-map upload, so stack traces resolve.
const sentryRelease = process.env.VITE_SENTRY_RELEASE || `madar-dashboard@${pkgVersion}`;

// Source maps are only built + uploaded when CI supplies Sentry credentials.
// Locally (and for anyone building without them) the build stays map-free and
// fast, exactly as before. See .env.example for the variable list.
const sentryUpload = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT,
);

export default defineConfig({
  define: {
    __SENTRY_RELEASE__: JSON.stringify(sentryRelease),
  },
  plugins: [
    // Must precede the React plugin so generated routes are transformed.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
      deleteOriginFile: false,
      compressionOptions: {
        params: {
          [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
          [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_TEXT,
        },
      },
    }),
    compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
      deleteOriginFile: false,
      compressionOptions: { level: 9 },
    }),
    // Must stay last: it consumes the emitted bundle + maps.
    ...(sentryUpload
      ? [
          sentryVitePlugin({
            url: process.env.SENTRY_URL || "https://sentry.madar-pos.cloud",
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: sentryRelease },
            sourcemaps: {
              // Upload the maps, then delete them so they never ship to users.
              filesToDeleteAfterUpload: ["./dist/**/*.map"],
            },
            telemetry: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5173, host: true },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "@tanstack/react-router",
      "recharts",
      "date-fns",
      // exceljs is CommonJS — it MUST be pre-bundled (esbuild CJS→ESM interop)
      // so the dynamic `import("exceljs")` exposes a usable Workbook constructor
      // in dev. Excluding it breaks the dev export with "Workbook is not a
      // constructor" (prod is fine — Rollup handles CJS). It still lands in its
      // own lazy "exceljs-vendor" chunk via build.rollupOptions.manualChunks.
      "exceljs",
    ],
  },
  build: {
    // No prod sourcemaps by default: smaller dist + faster build (the dev server
    // keeps inline maps). When Sentry credentials are present we emit "hidden"
    // maps — no `sourceMappingURL` comment in the JS — purely so the plugin can
    // upload them and then delete them from dist.
    sourcemap: sentryUpload ? "hidden" : false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          // Sentry — checked before React because "@sentry/react/" also
          // matches the "/react/" test further down.
          if (id.includes("@sentry/")) return "sentry-vendor";

          // Charts
          if (id.includes("recharts") || id.includes("/d3-")) return "chart-vendor";

          // Forms + validation
          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform") ||
            id.includes("/zod/")
          ) {
            return "form-vendor";
          }

          // TanStack Router (kept separate from Query/Table)
          if (id.includes("@tanstack/react-router") || id.includes("@tanstack/router")) {
            return "router-vendor";
          }
          // TanStack Query + Table
          if (id.includes("@tanstack/")) return "query-vendor";

          // Animation
          if (id.includes("/motion/") || id.includes("framer-motion")) return "motion-vendor";

          // i18n
          if (id.includes("i18next") || id.includes("react-i18next")) return "i18n-vendor";

          // Date utilities
          if (id.includes("date-fns")) return "date-vendor";

          // Radix UI primitives (shadcn)
          if (id.includes("@radix-ui/")) return "ui-vendor";

          // React core
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "react-vendor";
          }

          // Excel export
          if (id.includes("exceljs")) return "exceljs-vendor";

          // Encrypted credential handoff (zip.js). Pure ESM, so unlike exceljs
          // it needs no optimizeDeps entry — just its own lazy chunk.
          if (id.includes("@zip.js")) return "zip-vendor";

          return undefined;
        },
      },
    },
  },
});
