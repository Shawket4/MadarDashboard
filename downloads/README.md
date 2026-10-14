# Madar downloads (downloads.madar-pos.cloud)

One page listing every build CI ships: a card per product, newest version first, older ones
collapsed, and per file its size, date, SHA-256 (with a copy button) and a stable "latest"
link. English at `/`, Arabic (RTL) at `/ar/`.

A **separate Astro project** from `site/`: its own `package.json`, lockfile and
`node_modules`, nothing imported from `../site` or `../shared`. Static HTML and CSS, no React,
no client islands, no WASM, no animation libraries. One 1.5 KB module script (`src/scripts/live.ts`,
served same-origin, so the CSP's `script-src 'self'` is enough). Tokens are copied by value
from `site/src/styles/global.css`.

```bash
cd downloads
npm ci
MANIFEST_SRC=/path/to/manifest.json npm run build   # or a URL; default is https://downloads.madar-pos.cloud/manifest.json
npm run dev                                # http://localhost:5185/
npm test                                   # manifest generators (node and python) agree
npm run verify                             # EN/AR x 4 widths in Chrome (CHROME_PATH=...), JS off, live refresh
npm run deploy                             # owner only: build + rsync dist/ to the box's site/ folder
```

## Linking to a product: `?app=`

`/?app=<id>` (and `/ar/?app=<id>`) centres that product's card and rings it (`.card.spotlight`,
`src/scripts/live.ts`); no `app`, or an unknown id, changes nothing. Ids: `pos`, `kitchen`,
`dawam`, `dashboard`, `dashboard-desktop`. Without JS, `#<id>` (the card's `id`) still scrolls
to it. The marketing site links this way (`downloadsHref` in `site/src/lib/site.ts`); it is
re-applied after a live refresh, and reduced motion jumps instead of scrolling smoothly.

## How it fits together (no Node on the box)

```
CI (release job)  --rsync-->  box: /var/www/madar-downloads/files/<product>/<version>/<file>(+ .sha256)
                  --ssh rebuild-->  madar-downloads-rebuild (python3, = scripts/manifest.py)
                                    writes files/manifest.json + files/<product>/latest/* symlinks
browser           <-- page (static, baked from the manifest at build time)
                  <-- /manifest.json fetched by live.ts; if newer, the SAME template (src/lib/render.ts)
                      re-renders the list in place
```

- **The list is in the HTML**, so it works with JS off (copy buttons are `hidden` until the
  script runs). That snapshot is as old as the last `npm run deploy`.
- **With JS on it is always current**: `live.ts` fetches `/manifest.json` (nginx caches it for
  60 s) and re-renders with the one template, `src/lib/render.ts`, which Astro also uses to bake.
  So a release shows up without redeploying the page. Redeploy now and then to refresh the
  no-JS snapshot.
- Decision: the box regenerates only the JSON (stdlib Python, already there). CI never builds
  the page, so the other repos need no checkout of this one.

## Layout on the box

```
/var/www/madar-downloads/
  madar-brochure.pdf            untouched; madar-pos.cloud/madar-brochure.pdf
  site/                         this page (root-owned; npm run deploy)
  files/                        owned by madar-deploy
    manifest.json               served at /manifest.json
    <product>/<version>/<file>  and <file>.sha256   (served at /files/..., immutable cache)
    <product>/latest/<file>     symlinks, "latest" in place of the version in the name
```

Products: `pos`, `kitchen`, `dawam`, `dashboard` (Flutter app, `dash-v*`), `dashboard-desktop`
(Tauri, `v*` in MadarDashboard). Version = the tag without its prefix (`v`, `staff-v`, `dash-v`,
`kitchen-v`); the prefix map is `TAG_PREFIX` in `scripts/manifest.mjs`/`.py`. File names follow
`Madar-<Product>-<version>-<platform>[-<abi>].<ext>`; the platform icon and label are read from
the name (`src/lib/render.ts`, `platformOf`). A name that contains its version gets a stable link
(`/files/pos/latest/Madar-POS-latest-android-arm64.apk`); the newest non-pre-release wins.

## manifest.json schema

```jsonc
{
  "generated": "2026-10-14T16:33:09Z",          // when the rebuild ran
  "products": {
    "<product id>": {
      "releases": [                              // newest version first
        {
          "version": "0.14.0",                   // the folder name
          "tag": "v0.14.0",
          "date": "2026-10-14T06:49:00Z",        // newest file date in the release
          "files": [
            {
              "name": "Madar-POS-0.14.0-android-arm64.apk",
              "size": 58217561,                  // bytes
              "sha256": "<64 hex>",              // from <name>.sha256 when uploaded, else computed
              "url": "/files/pos/0.14.0/Madar-POS-0.14.0-android-arm64.apk",
              "date": "2026-10-14T06:49:00Z",    // file mtime, UTC
              "tag": "v0.14.0",
              "latest": "/files/pos/latest/Madar-POS-latest-android-arm64.apk"  // only on the newest stable release
            }
          ]
        }
      ]
    }
  }
}
```

Rebuild it anywhere: `node scripts/manifest.mjs <root>` (local tree laid out as above), or on the
box `ssh madar-deploy@187.124.33.153 rebuild` (what CI runs), or `madar-downloads-rebuild <root>`.

## The box (set up 2026-10-14)

- `madar-deploy`: key-only, `authorized_keys` is `command="/usr/local/bin/madar-downloads-gate",restrict ...`.
  The gate (`scripts/gate.sh`) allows only `rsync --server` (through `rrsync -wo`, jailed to
  `files/`) and `rebuild`. No shell, no forwarding.
- nginx: `deploy/nginx/downloads.madar-pos.cloud` + `madar-download-types.conf`. Cloudflare-proxied through the
  wildcard record and Origin CA certificate, so no DNS or cert work. Security headers and the public CSP are
  included; autoindex is off, and `/files/` serves only versioned files and `latest/` links.
- Versioned files are `immutable` for a year: **never re-upload different bytes under an existing version**
  (Cloudflare and browsers would keep the old ones). Cut a new version instead.

## CI

Secrets on each repo that uploads (`madar`, `MadarDashboard`): `DOWNLOADS_SSH_KEY` (the private key),
`DOWNLOADS_HOST` (`187.124.33.153`), `DOWNLOADS_KNOWN_HOSTS` (the host's ed25519 line). The step is
`continue-on-error`, skips quietly when a secret is missing, and never runs on pull requests.
