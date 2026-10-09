#!/usr/bin/env bash
# The dashboard's copies of madar-shared vector files must be byte-identical to
# the files at the tag they name (src/lib/*.source.json). Run by CI; needs
# network. Locally, with a madar-shared checkout beside this one, the vitest
# suite checks the same thing without it.
set -euo pipefail
cd "$(dirname "$0")/.."
status=0
for src in src/lib/*.source.json; do
  copy="${src%.source.json}.json"
  repo=$(node -p "require('./$src').repo")
  tag=$(node -p "require('./$src').tag")
  path=$(node -p "require('./$src').path")
  url="https://raw.githubusercontent.com/$repo/$tag/$path"
  if curl -fsSL "$url" | cmp -s - "$copy"; then
    echo "ok       $copy = $repo@$tag:$path"
  else
    echo "DIFFERS  $copy vs $url" >&2
    status=1
  fi
done
exit $status
