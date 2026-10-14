// Madar downloads: downloads.madar-pos.cloud
// Static output, English at / and Arabic at /ar/. No integrations, no client framework.
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://downloads.madar-pos.cloud",
  trailingSlash: "always",
  // The vhost serves /assets/ with a one-year immutable cache: hashed files go there.
  // Never inline: the page is `script-src 'self'`, and one stylesheet is cheap.
  build: { format: "directory", inlineStylesheets: "never", assets: "assets" },
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
