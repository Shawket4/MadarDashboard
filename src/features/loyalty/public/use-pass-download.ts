/**
 * Where the Apple pass is between the tap and Wallet opening.
 *
 *  idle ──tap──▶ making ──arrived──▶ opening ──(a moment)──▶ idle
 *                  └──────failed──────▶ failed ──try again──▶ making
 *
 * The page fetches the pass FIRST (`preparePass`) — the slow part, and the
 * part that can fail — and only then sends the browser to the same URL: the
 * plain navigation Safari needs to raise its "Add pass" sheet, now answered
 * from a warm cache. `opening` is that hand-off, held briefly so the page does
 * not snap back to rest under the customer's thumb before the sheet lands.
 *
 * Lives outside the button because the whole page wears this state: the card
 * above is what is being made, and it is the card that shows it.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { preparePass } from "./prepare-pass";

export type PassPhase = "idle" | "making" | "opening" | "failed";

export interface PassDownload {
  phase: PassPhase;
  /** Begin, or begin again after a failure. A no-op while one is in flight. */
  start: () => void;
}

/** How long "opening" lingers before the badge is offered again. */
const OPENING_MS = 2500;

export function usePassDownload(url: string | null | undefined): PassDownload {
  const [phase, setPhase] = useState<PassPhase>("idle");
  const abort = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      abort.current?.abort();
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const start = useCallback(() => {
    if (!url || phase === "making" || phase === "opening") return;
    const ctl = new AbortController();
    abort.current = ctl;
    setPhase("making");
    preparePass(url, { signal: ctl.signal }).then(
      () => {
        if (ctl.signal.aborted) return;
        setPhase("opening");
        // The same URL, now warm. `assign` rather than `open`: a navigation is
        // never popup-blocked, and a pkpass answer does not leave the page.
        window.location.assign(url);
        timer.current = setTimeout(() => setPhase("idle"), OPENING_MS);
      },
      (err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPhase("failed");
      },
    );
  }, [url, phase]);

  return { phase, start };
}
