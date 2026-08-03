import { useCallback, useEffect, useRef, useState } from "react";

import { downloadBlob } from "@/lib/download";
import type { CredentialWithSecret } from "@/data/api/generated/models";
import { buildHandoffFiles, handoffFilename } from "./handoff-content";
import { buildEncryptedHandoffZip } from "./handoff-zip";
import { generatePassphrase } from "./passphrase";

export type HandoffMode = "created" | "rotated";
export type HandoffStatus = "building" | "ready" | "failed";

export interface IssuedCredential {
  credential: CredentialWithSecret;
  mode: HandoffMode;
}

/**
 * Turns a freshly-issued credential into an encrypted archive on disk.
 *
 * The caller must mount this only when a credential has actually been issued
 * (`{issued ? <HandoffDialog … /> : null}`), because the passphrase is derived
 * ONCE from the lazy `useState` initialiser — one mount is one credential is one
 * passphrase. Deriving it during render instead would rotate it on every
 * re-render, so the archive on disk would stop matching the passphrase on
 * screen: an intermittent failure the operator could not possibly diagnose.
 *
 * What this actually guarantees: the password is never rendered, never placed on
 * the clipboard, and never enters the react-query cache — it lives only in the
 * caller's `useState` and inside the encrypted blob. It is NOT scrubbed from
 * memory; JS strings cannot be zeroed and DevTools can read component state.
 * Don't claim more than that in the UI copy.
 */
export function useCredentialHandoff(issued: IssuedCredential) {
  // Defensive: callers pre-flight `hasSecureRandom()` before issuing, so this
  // should never throw. Swallowing it here rather than letting it escape a
  // render keeps a missing CSPRNG from blanking the page via an error boundary
  // — `build()` then reports it through the normal failed state.
  const [passphrase] = useState(() => {
    try {
      return generatePassphrase();
    } catch {
      return "";
    }
  });

  const [status, setStatus] = useState<HandoffStatus>("building");
  const [error, setError] = useState<unknown>(null);
  const [downloadCount, setDownloadCount] = useState(0);

  // Only ever touched inside callbacks and effects, never during render.
  const blobRef = useRef<Blob | null>(null);
  const filenameRef = useRef("");

  const build = useCallback(async () => {
    setStatus("building");
    setError(null);
    try {
      if (!passphrase) throw new Error("Secure random number generation is unavailable.");

      const issuedAt = new Date();
      const files = buildHandoffFiles({
        label: issued.credential.name,
        username: issued.credential.username,
        secret: issued.credential.secret,
        branchName: issued.credential.branch_name,
        issuedAt,
        mode: issued.mode,
      });

      const blob = await buildEncryptedHandoffZip(files, passphrase);
      blobRef.current = blob;
      filenameRef.current = handoffFilename(issued.credential.username, issuedAt);

      downloadBlob(blob, filenameRef.current);
      setDownloadCount((n) => n + 1);
      setStatus("ready");
    } catch (e) {
      // Recoverable: the secret is still in memory, so Retry can rebuild.
      setError(e);
      setStatus("failed");
    }
  }, [issued, passphrase]);

  useEffect(() => {
    void build();
  }, [build]);

  const downloadAgain = useCallback(() => {
    if (!blobRef.current) return;
    downloadBlob(blobRef.current, filenameRef.current);
    setDownloadCount((n) => n + 1);
  }, []);

  return {
    status,
    error,
    passphrase,
    /** 0 means the operator has not got the file yet — used to guard closing. */
    downloadCount,
    downloadAgain,
    retry: build,
  };
}
