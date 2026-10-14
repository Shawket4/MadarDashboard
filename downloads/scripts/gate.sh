#!/bin/sh
# The ONLY thing the CI key can run on the box (authorized_keys: command="…",restrict).
# Installed as /usr/local/bin/madar-downloads-gate.
#   rsync …   →  rrsync, jailed to /var/www/madar-downloads/files (write only)
#   rebuild   →  rebuild manifest.json + the latest links (one at a time)
case "$SSH_ORIGINAL_COMMAND" in
  rebuild) exec flock "$HOME/.rebuild.lock" /usr/local/bin/madar-downloads-rebuild /var/www/madar-downloads ;;
  "rsync --server "*) exec /usr/bin/rrsync -wo /var/www/madar-downloads/files ;;
  *) echo "madar-downloads: refused" >&2; exit 1 ;;
esac
