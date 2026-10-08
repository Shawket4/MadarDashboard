# nginx on the VPS: reference copies

These are copies of the live files on the production VPS (187.124.33.153), taken on 2026-10-08 right after they were installed. The deploy workflow does not install them; they are here so audits and reviews can read the real configuration.

**Keeping them current:** if you change one of these files on the box, copy it back here.

**Where each file lives on the box:**

| File here | Path on the box |
|---|---|
| `get.madar-pos.cloud` | `/etc/nginx/sites-available/get.madar-pos.cloud` (enabled by a symlink) |
| `madar-pos.cloud` | `/etc/nginx/sites-available/madar-pos.cloud` (enabled by a symlink; also serves `www.`) |
| `madar-security-headers.conf` | `/etc/nginx/snippets/` |
| `madar-markdown.conf` | `/etc/nginx/conf.d/` (the `$md_suffix` map for `Accept: text/markdown`) |

**Other changes:**
- `/etc/nginx/mime.types` gained `text/markdown md;`.

**Backups of earlier versions, on the box:**
- `/root/nginx-backups/20261008T101513Z/`: before Phase 1 (folder URLs, 301s, real 404, headers).
- `/root/nginx-backups/20261008T105311Z/`: before the Phase 1 tidy-ups (headers at server level and on the 404 page, a single `Cache-Control` on assets).
