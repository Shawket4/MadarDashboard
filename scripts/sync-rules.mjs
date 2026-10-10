#!/usr/bin/env node
// Re-vendor madar-shared's WebAssembly rules (SHARED_RULES_PLAN.md Step 3):
//   npm run sync:rules -- <madar-shared>/dist [ref]
// Copies dist/full and dist/public (scripts/build-wasm.sh's output) into
// src/lib/rules/wasm/, checks the bytes against dist/SHA256SUMS, and rewrites
// each .source.json: the commit they were built from (the checkout's HEAD
// unless given) and each file's sha256, which scripts/check-shared-vectors.sh
// verifies.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [dist, refArg] = process.argv.slice(2);
if (!dist) {
  console.error("usage: npm run sync:rules -- <madar-shared>/dist [ref]");
  process.exit(1);
}
const git = (...args) => execFileSync("git", ["-C", dist, ...args], { encoding: "utf8" }).trim();
const ref = refArg ?? git("rev-parse", "HEAD");
if (!refArg && git("status", "--porcelain")) {
  console.warn(`sync:rules: ${dist} has uncommitted changes; ${ref} may not be what was built`);
}

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const sums = Object.fromEntries(
  readFileSync(resolve(dist, "SHA256SUMS"), "utf8")
    .trim()
    .split("\n")
    .map((line) => line.split(/\s+/).reverse()),
);

for (const pkg of ["full", "public"]) {
  const to = resolve(import.meta.dirname, "../src/lib/rules/wasm", pkg);
  rmSync(to, { recursive: true, force: true });
  cpSync(resolve(dist, pkg), to, { recursive: true });
  const files = {};
  for (const f of readdirSync(to).sort()) {
    files[f] = sha256(resolve(to, f));
    if (sums[`${pkg}/${f}`] !== files[f]) throw new Error(`${pkg}/${f} does not match ${dist}/SHA256SUMS`);
  }
  const source = {
    about:
      "Built by madar-shared's scripts/build-wasm.sh at this ref and copied here by `npm run sync:rules`; never edit these files. scripts/check-shared-vectors.sh checks the hashes.",
    repo: "Shawket4/madar-shared",
    ref,
    files,
  };
  writeFileSync(resolve(to, ".source.json"), `${JSON.stringify(source, null, 2)}\n`);
  console.log(`${pkg}: ${Object.keys(files).length} files @ ${ref}`);
}
