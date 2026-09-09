// Separate build for the standalone customer ordering app (order.madar-pos.cloud).
// Distinct from vite.config.ts: NO TanStack file-router plugin (the order app uses a
// hand-built, code-based router with ONLY the public order/track routes), and a
// separate output dir so the deployed bundle contains zero admin/dashboard code.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import compression from "vite-plugin-compression";
import { constants as zlibConstants } from "node:zlib";

// Where this build will be mounted.
//
// The same bundle has to serve two places: the root of its own hostname, and a
// sub-path on a shop's own hostname (`drops.madar-pos.cloud/order`). A base is
// baked into every asset URL at build time and there is only one of it, so this
// is built twice rather than made clever at runtime — the alternatives were a
// `<base href>` injected per mount, which re-anchors every relative URL in the
// document including the router's, and relative asset paths, which break the
// moment a route has depth. Both of those fail in production and pass locally.
//
// `MADAR_MOUNT=/order/` selects the shop build; unset is the standalone host.
const mount = process.env.MADAR_MOUNT ?? "/";

export default defineConfig({
  base: mount,
  plugins: [
    react(),
    tailwindcss(),
    // Dev-only: the entry is order.html (not index.html), so serve it for every
    // navigation in `vite` dev (SPA fallback). No effect on build or preview.
    {
      name: "order-spa-fallback",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.headers.accept?.includes("text/html")) req.url = "/order.html";
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
    outDir: mount === "/" ? "dist-order" : "dist-order-shop",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, "order.html"),
    },
  },
});
