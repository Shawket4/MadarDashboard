#!/usr/bin/env bash
# Builds the page from the live manifest and puts it on the box (owner only: needs the
# root key). Adds and updates files in site/, never deletes (old hashed assets are tiny
# and a Cloudflare-cached page may still name them).
#   npm run deploy            DEPLOY_HOST=root@187.124.33.153 by default
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
rsync -rt dist/ "${DEPLOY_HOST:-root@187.124.33.153}:/var/www/madar-downloads/site/"
echo "deployed -> https://downloads.madar-pos.cloud/"
