Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/Users/shawket/Desktop/MadarDashboard`
Data dir ($UA_DIR): `/Users/shawket/Desktop/MadarDashboard/.ua`
Project: `madar-dashboard` — Internal management dashboard for Madar: a React 19 + TypeScript + Vite web app, packaged for desktop with Tauri, built around the Madar Rust backend. Note: this project has over 100 source files; consider scoping analysis to a subdirectory for faster results.
Languages: `config, css, html, icns, javascript, json, lottie, markdown, python, rust, shell, toml, txt, typescript, unknown, xml, yaml`
Batch: `28/28`
Skill directory (for bundled scripts): `/Users/shawket/.claude/plugins/cache/understand-anything/understand-anything/2.9.4/skills/understand`
Plugin root (already built; set PLUGIN_ROOT env): `/Users/shawket/.claude/plugins/cache/understand-anything/understand-anything/2.9.4`
Output: write to `/Users/shawket/Desktop/MadarDashboard/.ua/intermediate/batch-28.json` (single-file mode) OR `batch-28-part-<k>.json` (split mode). Use EXACTLY this naming.

Generate all textual content in English.

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):
```json
{"src-tauri/src/lib.rs":[],"src-tauri/src/main.rs":[],"src-tauri/tauri.conf.json":[],"src/features/qr/lib.ts":[],"src/fontsource.d.ts":[],"src/i18n/locales/ar.json":[],"src/i18n/locales/en.json":[],"src/styles/globals.css":[],"src/test/setup.ts":[],"vite.config.ts":[],"vite.get.config.ts":[],"vite.order.config.ts":[],"vitest.config.ts":["vite.config.ts"]}
```

Cross-batch neighbors with their exported symbols:
```json
{"src/i18n/locales/ar.json":[{"path":"src/i18n/index.ts","batchIndex":12,"symbols":["SUPPORTED_LANGUAGES","applyHtmlDir"]}],"src/i18n/locales/en.json":[{"path":"src/i18n/index.ts","batchIndex":12,"symbols":["SUPPORTED_LANGUAGES","applyHtmlDir"]}],"src/styles/globals.css":[{"path":"src/get/main.tsx","batchIndex":12,"symbols":[]},{"path":"src/main.tsx","batchIndex":2,"symbols":[]},{"path":"src/order/main.tsx","batchIndex":12,"symbols":[]}]}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields):
1. `src-tauri/src/lib.rs` (24 lines, language: `rust`, fileCategory: `code`)
2. `src-tauri/src/main.rs` (6 lines, language: `rust`, fileCategory: `code`)
3. `src-tauri/tauri.conf.json` (38 lines, language: `json`, fileCategory: `config`)
4. `src/features/qr/lib.ts` (2 lines, language: `typescript`, fileCategory: `code`)
5. `src/fontsource.d.ts` (4 lines, language: `typescript`, fileCategory: `code`)
6. `src/i18n/locales/ar.json` (3819 lines, language: `json`, fileCategory: `config`)
7. `src/i18n/locales/en.json` (3721 lines, language: `json`, fileCategory: `config`)
8. `src/styles/globals.css` (405 lines, language: `css`, fileCategory: `markup`)
9. `src/test/setup.ts` (3 lines, language: `typescript`, fileCategory: `code`)
10. `vite.config.ts` (116 lines, language: `typescript`, fileCategory: `code`)
11. `vite.get.config.ts` (52 lines, language: `typescript`, fileCategory: `code`)
12. `vite.order.config.ts` (52 lines, language: `typescript`, fileCategory: `code`)
13. `vitest.config.ts` (10 lines, language: `typescript`, fileCategory: `code`)
