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

**Other changes:**
- `/etc/nginx/mime.types` gained `text/markdown md;`.

**Backups of earlier versions, on the box:**
- `/root/nginx-backups/20261008T101513Z/`: before Phase 1 (folder URLs, 301s, real 404, headers).
- `/root/nginx-backups/20261008T105311Z/`: before the Phase 1 tidy-ups (headers at server level and on the 404 page, a single `Cache-Control` on assets).
- `/root/nginx-backups/20261008T130510Z/` and `20261008T130557Z/`: before the get vhost's folder Markdown fix (the trailing-slash `if` moved to server level; inside `location /` a true `if` dropped `try_files`, so folders never served their `.md`).

**Cron, on the box:** `/etc/cron.daily/madar-prune-get-packs` (source: `deploy/cron/madar-prune-get-packs`) deletes get's `assets/pack.*.tar*` archives older than 30 days, never the one the live `sw.js` names. `--dry-run` lists what it would delete.
