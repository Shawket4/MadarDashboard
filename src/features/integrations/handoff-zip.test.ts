// @vitest-environment node
//
// Node rather than jsdom: jsdom has gaps in Blob.arrayBuffer, and Node 20+
// supplies Blob, crypto.getRandomValues and Response natively. Disabling zip.js
// web workers (see handoff-zip.ts) is what makes this runnable at all.
import { describe, expect, it } from "vitest";

import { buildHandoffFiles } from "./handoff-content";
import { buildEncryptedHandoffZip } from "./handoff-zip";
import { generatePassphrase } from "./passphrase";

const files = buildHandoffFiles({
  label: "Rue — One Ninety",
  username: "rue-one-ninety-k7m2",
  secret: "s3cret-partner-token",
  branchName: "One Ninety",
  issuedAt: new Date("2026-08-04T09:30:00Z"),
  mode: "created",
});

/** Read the archive back with zip.js's own reader. */
async function readZip(blob: Blob, passphrase: string) {
  const { ZipReader, BlobReader, TextWriter, configure } = await import(
    "@zip.js/zip.js/lib/zip-core.js"
  );
  configure({ useWebWorkers: false });
  const reader = new ZipReader(new BlobReader(blob), { password: passphrase });
  const entries = await reader.getEntries();
  const out: { name: string; text: string; encrypted: boolean }[] = [];
  for (const entry of entries) {
    // `Entry` is a union that includes directory entries, which carry no reader.
    if (!("getData" in entry) || !entry.getData) continue;
    out.push({
      name: entry.filename,
      text: await entry.getData(new TextWriter()),
      encrypted: entry.encrypted === true,
    });
  }
  await reader.close();
  return out;
}

describe("buildEncryptedHandoffZip", () => {
  it("round-trips every file under the correct passphrase", async () => {
    const passphrase = generatePassphrase();
    const blob = await buildEncryptedHandoffZip(files, passphrase);

    expect(blob.type).toBe("application/zip");

    const entries = await readZip(blob, passphrase);
    expect(entries.map((e) => e.name)).toEqual(["README.txt", "credentials.txt"]);
    for (const entry of entries) {
      expect(entry.encrypted).toBe(true);
      expect(entry.text).toBe(files.find((f) => f.name === entry.name)!.text);
    }
  });

  it("rejects a wrong passphrase", async () => {
    const blob = await buildEncryptedHandoffZip(files, generatePassphrase());
    await expect(readZip(blob, generatePassphrase())).rejects.toThrow();
  });
});
