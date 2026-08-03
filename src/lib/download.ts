/**
 * Triggering a file download from the browser.
 *
 * This was duplicated in three places (the Excel exporter and both QR download
 * buttons), each carrying the same two latent bugs, so it lives here now:
 *
 *   1. The anchor must be IN the document when clicked. Firefox ignores a
 *      synthetic click on a detached anchor; Chromium does not, which is why
 *      the original copies appeared to work.
 *   2. `revokeObjectURL` must NOT be called synchronously after `click()`. The
 *      download reads the blob asynchronously, so revoking immediately is a
 *      race — and WebKit (the Tauri webview on macOS) is the engine most likely
 *      to lose it, producing a silent zero-byte download.
 */

/** Generous window for the browser to start reading the blob before we revoke. */
const REVOKE_DELAY_MS = 60_000;

/**
 * Download an already-addressable resource — a `data:` URI or an object URL
 * whose lifetime the caller manages.
 */
export function downloadUrl(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Download an in-memory blob, revoking its object URL once it is safe to. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
