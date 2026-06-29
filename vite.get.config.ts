// Separate build for the standalone marketing landing (get.madar-pos.cloud).
// Mirrors vite.order.config.ts: NO TanStack file-router plugin (the landing is a
// single static page), a separate output dir, and zero admin/dashboard code in the
// shipped bundle.
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
    outDir: "dist-get",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, "get.html"),
    },
  },
});
