/**
 * Which wallet this device actually has.
 *
 * The customer should see ONE button that works, not a choice between two
 * platforms they do not think about. Detection is a guess, though, so it is
 * only ever used to pick which button LEADS — the other stays reachable
 * underneath, because being wrong must be recoverable in one tap rather than
 * leaving someone with a pass they cannot install.
 */
export type WalletKind = "apple" | "google";

/**
 * Best guess from the user agent, or `null` on a desktop that has neither.
 *
 * Three details that user-agent sniffing usually gets wrong here:
 *
 *  - **iPadOS lies.** Since iPadOS 13 Safari reports itself as Macintosh. The
 *    give-away is touch points: a real Mac reports 0. Without this check every
 *    iPad is misread as a desktop Mac.
 *  - **macOS belongs on the Apple side.** Safari there adds passes to Wallet
 *    and iCloud syncs them to the customer's iPhone, so a Mac is a real target
 *    rather than a fallback case.
 *  - **Windows and Linux have no wallet.** They return `null` so the caller
 *    shows everything available instead of guessing — a desktop visitor is
 *    usually about to send the link to their phone.
 */
export function detectWallet(): WalletKind | null {
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent;
  // Android before Apple: some Android browsers put "Mac OS X" in their UA.
  if (/android/i.test(ua)) return "google";

  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadPretendingToBeAMac =
    /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  if (iOS || iPadPretendingToBeAMac) return "apple";

  // A real Mac: Safari adds the pass and iCloud carries it to their phone.
  if (/Macintosh|Mac OS X/.test(ua)) return "apple";

  return null;
}
