Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/Users/shawket/Desktop/MadarDashboard`
Data dir ($UA_DIR): `/Users/shawket/Desktop/MadarDashboard/.ua`
Project: `madar-dashboard` — Internal management dashboard for Madar: a React 19 + TypeScript + Vite web app, packaged for desktop with Tauri, built around the Madar Rust backend. Note: this project has over 100 source files; consider scoping analysis to a subdirectory for faster results.
Languages: `config, css, html, icns, javascript, json, lottie, markdown, python, rust, shell, toml, txt, typescript, unknown, xml, yaml`
Batch: `15/28`
Skill directory (for bundled scripts): `/Users/shawket/.claude/plugins/cache/understand-anything/understand-anything/2.9.4/skills/understand`
Plugin root (already built; set PLUGIN_ROOT env): `/Users/shawket/.claude/plugins/cache/understand-anything/understand-anything/2.9.4`
Output: write to `/Users/shawket/Desktop/MadarDashboard/.ua/intermediate/batch-15.json` (single-file mode) OR `batch-15-part-<k>.json` (split mode). Use EXACTLY this naming.

Generate all textual content in English.

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):
```json
{"src/features/integrations/handoff-content.ts":["src/features/integrations/util.ts"],"src/features/integrations/handoff-zip.ts":["src/features/integrations/handoff-content.ts"],"src/features/integrations/passphrase.ts":[],"src/features/integrations/use-credential-handoff.ts":["src/features/integrations/handoff-content.ts","src/features/integrations/handoff-zip.ts","src/features/integrations/passphrase.ts","src/lib/download.ts"],"src/lib/download.ts":[]}
```

Cross-batch neighbors with their exported symbols:
```json
{"src/features/integrations/handoff-content.ts":[{"path":"src/features/integrations/util.ts","batchIndex":2,"symbols":["invalidateCredentials","isRevoked","analyticsUrl","basicAuthHeader","randomUsernameSuffix","buildUsername"]}],"src/features/integrations/passphrase.ts":[{"path":"src/features/integrations/credential-dialog.tsx","batchIndex":5,"symbols":["CredentialDialog"]},{"path":"src/features/integrations/integrations-page.tsx","batchIndex":7,"symbols":["IntegrationsPage"]}],"src/features/integrations/use-credential-handoff.ts":[{"path":"src/features/integrations/handoff-dialog.tsx","batchIndex":5,"symbols":["HandoffDialog"]},{"path":"src/features/integrations/integrations-page.tsx","batchIndex":7,"symbols":["IntegrationsPage"]}],"src/lib/download.ts":[{"path":"src/features/qr/qr-page.tsx","batchIndex":11,"symbols":["QrPage"]},{"path":"src/features/qr/qr-preview-dialog.tsx","batchIndex":11,"symbols":["QrPreviewDialog"]},{"path":"src/lib/excel.ts","batchIndex":9,"symbols":["toExcelDateSerial","exportToExcel"]}]}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields):
1. `src/features/integrations/handoff-content.ts` (232 lines, language: `typescript`, fileCategory: `code`)
2. `src/features/integrations/handoff-zip.ts` (61 lines, language: `typescript`, fileCategory: `code`)
3. `src/features/integrations/passphrase.ts` (74 lines, language: `typescript`, fileCategory: `code`)
4. `src/features/integrations/use-credential-handoff.ts` (103 lines, language: `typescript`, fileCategory: `code`)
5. `src/lib/download.ts` (39 lines, language: `typescript`, fileCategory: `code`)
