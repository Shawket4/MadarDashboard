/**
 * Builds the AES-256 encrypted handoff archive.
 *
 * zip.js is loaded with a dynamic `import()` so it never lands in the entry
 * bundle (`vite.config.ts` gives it its own `zip-vendor` chunk, mirroring how
 * ExcelJS is handled).
 *
 * Web Workers are disabled deliberately. The Tauri CSP allows `worker-src
 * blob:` but NOT `script-src blob:`, and WebKit — the macOS Tauri webview — has
 * historically fallen back to `script-src` when creating workers, so a blob
 * worker is a coin flip there. Workers buy nothing for a ~2 KB archive, and a
 * worker failure would surface AFTER the credential already exists server-side,
 * which is the worst-timed failure this feature has.
 *
 * NOTE ON COMPATIBILITY: AES-256 zips are WinZip AE-2. Verified locally that
 * 7-Zip opens them and rejects a wrong password — but Info-ZIP `unzip` (the
 * default CLI on macOS and most Linux boxes) CANNOT, failing with "need PK
 * compat. v5.1". Windows Explorer and macOS Archive Utility likewise only
 * understand legacy ZipCrypto. The partner needs 7-Zip, WinRAR, Keka, or
 * Python's pyzipper, and the UI has to say so — guidance placed inside the
 * archive is unreadable until it has already been opened.
 */

import type { HandoffFile } from "./handoff-content";

export { handoffFilename } from "./handoff-content";

/** Loaded once, on first use. */
async function zipCore() {
  // The writer-only entry (`lib/zip-core-writer.js`) omits BlobWriter/TextReader,
  // so use the core entry, which carries readers, writers and `configure`.
  const core = await import("@zip.js/zip.js/lib/zip-core.js");
  core.configure({ useWebWorkers: false });
  return core;
}

/**
 * @param passphrase the generated ZIP password — see `passphrase.ts`.
 * @returns a `application/zip` blob, encrypted with AES-256.
 */
export async function buildEncryptedHandoffZip(
  files: HandoffFile[],
  passphrase: string,
): Promise<Blob> {
  const { ZipWriter, BlobWriter, TextReader } = await zipCore();

  const writer = new ZipWriter(new BlobWriter("application/zip"), {
    password: passphrase,
    // 3 = AES-256. `zipCrypto: false` is explicit rather than implied: the
    // legacy ZipCrypto cipher is trivially broken and must never be selected
    // just because it is what stock unzip tools happen to understand.
    encryptionStrength: 3,
    zipCrypto: false,
  });

  for (const file of files) {
    await writer.add(file.name, new TextReader(file.text));
  }

  return writer.close();
}
