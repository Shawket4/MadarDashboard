// Builds a throwaway tree, runs manifest.mjs and manifest.py on it, and checks the result.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readlinkSync, utimesSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = mkdtempSync(path.join(tmpdir(), "dl-"));
const put = (rel, body, sidecar) => {
  const f = path.join(root, "files", rel);
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, body);
  utimesSync(f, 1790000000, 1790000000);
  if (sidecar) writeFileSync(`${f}.sha256`, `${createHash("sha256").update(body).digest("hex")}  ${path.basename(f)}\n`);
};
put("pos/0.9.0/Madar-POS-0.9.0-macos.zip", "old");
put("pos/0.10.0/Madar-POS-0.10.0-macos.zip", "ten", true);
put("pos/0.10.0/Madar-POS-0.10.0-android.apk", "apk");
put("pos/0.11.0-beta.1/Madar-POS-0.11.0-beta.1-macos.zip", "beta");
put("dawam/1.0.2/Dawam-1.0.2-android.apk", "d");
put("pos/0.10.0/.hidden", "x");

const read = () => JSON.parse(readFileSync(path.join(root, "files/manifest.json"), "utf8"));
const strip = (m) => JSON.stringify({ ...m, generated: 0 });
execFileSync("node", [path.join(here, "manifest.mjs"), root]);
const a = read();
execFileSync("python3", [path.join(here, "manifest.py"), root]);
const b = read();
assert.equal(strip(a), strip(b), "node and python manifests differ");

const pos = a.products.pos.releases;
assert.deepEqual(pos.map((r) => r.version), ["0.11.0-beta.1", "0.10.0", "0.9.0"]);
assert.equal(pos[1].files.length, 2, "sidecar and dotfiles are not files");
assert.equal(pos[1].files[1].sha256, createHash("sha256").update("ten").digest("hex"));
assert.equal(pos[1].files[1].tag, "v0.10.0");
assert.equal(a.products.dawam.releases[0].tag, "staff-v1.0.2");
assert.equal(pos[1].files[1].latest, "/files/pos/latest/Madar-POS-latest-macos.zip", "latest follows the newest stable release, not the beta");
assert.equal(readlinkSync(path.join(root, "files/pos/latest/Madar-POS-latest-macos.zip")), "../0.10.0/Madar-POS-0.10.0-macos.zip");
console.log("manifest tests ok");
