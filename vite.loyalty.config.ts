// Separate build for the standalone public loyalty app (loyalty.madar-pos.cloud).
//
// Same isolation as the ordering and reservations apps, for the same reason: a
// public origin that anyone can reach by scanning a QR on a counter should not
// be able to load admin code, and must not share cookies or localStorage with
// the dashboard. No TanStack file-router plugin (this app has a hand-built,
// code-based router with only the public loyalty routes) and its own output dir,
// so the deployed bundle contains zero admin/dashboard code.
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
    // Dev-only: the entry is loyalty.html (not index.html), so serve it for
    // every navigation in `vite` dev (SPA fallback). No effect on build.
    {
      name: "loyalty-spa-fallback",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.headers.accept?.includes("text/html")) req.url = "/loyalty.html";
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
    outDir: "dist-loyalty",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, "loyalty.html"),
    },
  },
});
