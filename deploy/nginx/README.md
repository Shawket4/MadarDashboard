# nginx on the VPS: reference copies

These are copies of the live files on the production VPS (187.124.33.153), taken on 2026-10-08 right after they were installed. The deploy workflow does not install them; they are here so audits and reviews can read the real configuration.

**Keeping them current:** if you change one of these files on the box, copy it back here.

**Ahead of the box:** the Phase 4a edits to the five SPA vhosts (apex, demo, order, reservations, loyalty; described below) were made here first. They are live only once each file is copied to its path below, `sudo nginx -t` passes and nginx is reloaded.

**Where each file lives on the box:**

| File here | Path on the box |
|---|---|
| `get.madar-pos.cloud` | `/etc/nginx/sites-available/get.madar-pos.cloud` (enabled by a symlink) |
| `madar-pos.cloud` | `/etc/nginx/sites-available/madar-pos.cloud` (enabled by a symlink; also serves `www.`) |
| `demo.madar-pos.cloud` | `/etc/nginx/sites-available/demo.madar-pos.cloud` (enabled by a symlink) |
| `order.madar-pos.cloud` | `/etc/nginx/sites-available/order.madar-pos.cloud` (enabled by a symlink; the box's layout, not yet confirmed for this file) |
| `reservations.madar-pos.cloud` | `/etc/nginx/sites-available/reservations.madar-pos.cloud` (enabled by a symlink; the box's layout, not yet confirmed for this file) |
| `loyalty.madar-pos.cloud` | `/etc/nginx/sites-available/loyalty.madar-pos.cloud` (enabled by a symlink) |
| `madar-security-headers.conf` | `/etc/nginx/snippets/` |
| `madar-markdown.conf` | `/etc/nginx/conf.d/` (the `$md_suffix` map for `Accept: text/markdown`) |

The tenant wildcard vhost (`<slug>.madar-pos.cloud`, which serves the loyalty, `/order/` and `/book/` bundles) is not here: it lives in MadarRust (`deploy/shop/nginx-wildcard.conf`).

**The SPA hosts (apex, demo, order, reservations, loyalty), Phase 4a:** a path that looks like a file (it ends in `.` plus letters or digits: `/openapi.json`, `/llms.txt`, `/x.md`) and anything under `/.well-known/` is served from the build or answered with a real 404, never with the app's HTML. This is safe because no client route ends that way: org, branch, item, combo and order ids are UUIDs, the loyalty card token (`/card/`, `/now/`) is `M` plus base64url, and the booking token (`/manage/`) is hex. Every prefix location is `^~`, so the regex cannot take `/assets/` (cache headers) or `/api/` (the backend, including Apple Wallet calls that end in `pass.cloud.madar-pos.loyalty`) away from it. The regex location carries the same headers as the SPA fallback, because the fallback's internal redirect to the HTML shell lands in it.

**Agent readiness, root and Markdown 404s (2026-10-08, branch `feat/agent-readiness-root`; ahead of the box):** the get and apex vhosts here are ahead of the live files until the owner installs them. `nginx -t` passed on a throwaway copy of the box's config (nginx 1.26.3); their behaviour was checked against `site/scripts/verify.mjs`'s mimic (`SERVE=1 npm run verify` serves it for curl), not a real nginx. The apex install also brings the Phase 4a edits above live (the box's apex predates them).
- **get:** `/` is the bilingual root page (`get.html`), still `index.md` for `Accept: text/markdown`. Every 404 is `404.html`, or `404.md` for Markdown requests (status 404, `text/markdown; charset=utf-8`, `Vary: Accept`): `try_files /404$md_suffix /404.html` inside the internal `location = /404.html`. `/pricing`, `/features`, `/faq`, `/about` and `/contact` (with or without the slash) 301 to `/en/<page>/`; `/privacy` and `/terms` 301 to the legal site. `/<path>.html` 301s to `/<path>/` when that folder exists (server level, like the slash rule: `set` + two `if`s, no `if` inside a location).
- **apex (madar-pos.cloud):** `location = /` serves `index.md` for Markdown requests and `index.html` otherwise, with `Vary: Accept`. A Markdown request for an app route has nothing to serve (`try_files $uri /index.html$md_suffix =404`: `/index.html.md` never exists) and gets `404.md` with status 404 (`error_page 404 @not_found`); HTML requests keep the SPA fallback, and other 404s keep nginx's own page. `/pricing`, `/features`, `/about` and `/contact` 301 to get's `/en/` pages, `/privacy` and `/terms` to the legal site (no dashboard route uses those names; the app's pricing is `/menu/pricing`). `charset utf-8` now covers `text/plain` and `text/markdown`, so `llms.txt` and the Markdown declare UTF-8. The build ships `index.md`, `404.md` and `llms.txt` from `public-apex/` (the dashboard build only: `public/` goes into every bundle).

**Other changes:**
- `/etc/nginx/mime.types` gained `text/markdown md;`.

**Backups of earlier versions, on the box:**
- `/root/nginx-backups/20261008T101513Z/`: before Phase 1 (folder URLs, 301s, real 404, headers).
- `/root/nginx-backups/20261008T105311Z/`: before the Phase 1 tidy-ups (headers at server level and on the 404 page, a single `Cache-Control` on assets).
- `/root/nginx-backups/20261008T130510Z/` and `20261008T130557Z/`: before the get vhost's folder Markdown fix (the trailing-slash `if` moved to server level; inside `location /` a true `if` dropped `try_files`, so folders never served their `.md`).

**Cron, on the box:** `/etc/cron.daily/madar-prune-get-packs` (source: `deploy/cron/madar-prune-get-packs`) deletes get's `assets/pack.*.tar*` archives older than 30 days, never the one the live `sw.js` names. `--dry-run` lists what it would delete.
