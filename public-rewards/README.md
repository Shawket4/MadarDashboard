# public-rewards: the Rewards teller page's static files

Served at the root of rewards.madar-pos.cloud (Vite `publicDir` of `vite.rewards.config.ts`).
This README is stripped from the build (`noDocsInTheBundle`).

The brand files are copies of the Rewards by Madar design system export
(`~/Desktop/Madar/Rewards Design System/export/`, see its README). To update them, copy the
new export over the same names; no code changes.

| File | From the export | Used by |
|---|---|---|
| `favicon.svg`, `favicon.ico`, `favicon-32.png` | `png/pwa/` | `rewards.html` |
| `apple-touch-icon-180.png` | `png/pwa/` | `rewards.html` |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | `png/pwa/` | `manifest.webmanifest` |
| `splash-{light,dark}-WxH.png` (46) | `png/pwa/` | `rewards.html` (the links from `splash-links.html`) |
| `tile-ink.svg` | `svg/` | the page header |

`manifest.webmanifest` and `sw.js` are ours.
