// Separate build for the standalone public reservations app (reservations.madar-pos.cloud).
// Distinct from vite.config.ts: NO TanStack file-router plugin (this app uses a
// hand-built, code-based router with ONLY the public booking routes), and a
// separate output dir so the deployed bundle contains zero admin/dashboard code.
//
// Same isolation as the ordering app, for the same reason: a public origin that
// anyone can reach should not be able to load admin code, and must not share
// cookies or localStorage with the dashboard.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import compression from "vite-plugin-compression";
import { constants as zlibConstants } from "node:zlib";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Dev-only: the entry is order.html (not index.html), so serve it for every
    // navigation in `vite` dev (SPA fallback). No effect on build or preview.
    {
      name: "reservations-spa-fallback",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.headers.accept?.includes("text/html")) req.url = "/reservations.html";
          next();
        });
      },
    },
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
    compression({ algorithm: "gzip", ext: ".gz", threshold: 1024, deleteOriginFile: false, compressionOptions: { level: 9 } }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    outDir: "dist-reservations",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, "reservations.html"),
    },
  },
});
