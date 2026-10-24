// Separate build for Rewards by Madar (rewards.madar-pos.cloud): loyalty sold on
// its own. One entry (rewards.html, src/rewards-app): the owner's dashboard at
// the root and the counter at /counter. Its own public dir (public-rewards: the
// manifest, the service worker and the brand files), so no other bundle ships
// them. The API is the host's /api/ (proxied to a local backend in dev:
// REWARDS_API_TARGET, default http://localhost:8081).
//
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import compression from "vite-plugin-compression";
import { constants as zlibConstants } from "node:zlib";
import { noDocsInTheBundle } from "./vite/no-docs-in-the-bundle";
import { preloadMotion } from "./vite/preload-motion";
import { preloadRules } from "./vite/preload-rules";
import { zodJitless } from "./vite/zod-jitless";

export default defineConfig({
  // The toast library loads on the first toast; pre-bundle it so dev does not reload then.
  optimizeDeps: { include: ["sileo", "motion/react"] },
  plugins: [
    // `public/` is copied verbatim, so a README beside an asset ships with it.
    noDocsInTheBundle(),
    // GSAP downloads with the HTML (still a lazy chunk): motion is ready at once.
    preloadMotion(),
    // The rules' wasm downloads with the HTML, not after the entry has run.
    preloadRules(),
    zodJitless(),
    react(),
    tailwindcss(),
    // Dev-only: the entry is rewards.html, served for every navigation.
    {
      name: "rewards-spa-fallback",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.headers.accept?.includes("text/html")) req.url = "/rewards.html";
          next();
        });
      },
    },
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
      deleteOriginFile: false,
      filter: /\.(js|mjs|json|css|html|wasm)$/i, // the default list, plus the rules' wasm
      compressionOptions: {
        params: {
          [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
          [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_TEXT,
        },
      },
    }),
    compression({ algorithm: "gzip", ext: ".gz", threshold: 1024, deleteOriginFile: false, filter: /\.(js|mjs|json|css|html|wasm)$/i, compressionOptions: { level: 9 } }),
  ],
  server: {
    proxy: {
      "/api": {
        target: process.env.REWARDS_API_TARGET ?? "http://localhost:8081",
        changeOrigin: false,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src"), "@shared": path.resolve(__dirname, "./shared") },
  },
  publicDir: "public-rewards",
  build: {
    outDir: "dist-rewards",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, "rewards.html"),
    },
  },
});
