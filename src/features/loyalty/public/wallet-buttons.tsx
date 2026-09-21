/**
 * One "Add to Wallet" badge, aimed at the wallet this device actually has.
 *
 * A customer does not think in platforms; they think "put this on my phone". So
 * one badge leads and the other, when there is one, stays reachable as a quiet
 * line underneath — detection is a guess, and a wrong guess has to be
 * recoverable in one tap.
 *
 * The badges are Apple's and Google's own artwork (see `public/wallet/README.md`
 * for the swap). Both vendors forbid recolouring or stretching theirs, which is
 * why this sets a HEIGHT and lets the width follow, and why the image is not
 * styled beyond that.
 *
 * The cases that actually happen, in order of how often:
 *  - the device's wallet is configured — one badge, done;
 *  - the device's wallet is NOT configured but the other is — the badge is
 *    demoted to a line, because an Apple badge is no use to an Android phone;
 *  - neither is configured — nothing at all.
 *
 * None of these show a QR any more. The code lives on the CARD, above, where
 * both wallet passes also put it: it is what the till scans, it works on every
 * device, and it should not appear only in the cases where we failed to offer a
 * wallet.
 *
 * ## The Apple badge is slow, and the page says so
 * The Google save is a redirect to Google — instant. The Apple one downloads a
 * pass the server signs per member, and a bare link to that is seconds of
 * nothing, which reads as "broken" at a counter. So the tap starts a download
 * the PAGE owns (`usePassDownload`, in `card-page.tsx`): the card above comes
 * alive while the pass is fetched (`card-press.tsx`), and this panel carries
 * the words — "Making your card…", then "Opening Wallet…" as the browser is
 * sent to the now-warm URL, or a way to try again when it will not come.
 */
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { chromeEscapeUrl, detectInAppBrowser } from "./detect-inapp";
import { detectWallet, type WalletKind } from "./detect-wallet";
import type { PassDownload } from "./use-pass-download";

interface Props {
  passes: { apple_url?: string | null; google_url?: string | null; any?: boolean };
  /** The Apple pass download the page owns; the badge only starts it. */
  pass: PassDownload;
}

/** The quiet line the other wallet gets. */
const LINE =
  "rounded text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

const BADGE: Record<WalletKind, { src: string; alt: string }> = {
  apple: { src: "/wallet/add-to-apple-wallet.svg", alt: "Add to Apple Wallet" },
  google: { src: "/wallet/add-to-google-wallet.svg", alt: "Add to Google Wallet" },
};

/** The badge as a link, at the vendors' minimum tap height, focus-ringed like every other control. */
function Badge({
  kind,
  href,
  className = "",
  onClick,
}: {
  kind: WalletKind;
  href: string;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-label={BADGE[kind].alt}
      className={`inline-block rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${className}`}
    >
      {/* Height set, width free: both vendors' guidelines forbid stretching. */}
      <img src={BADGE[kind].src} alt={BADGE[kind].alt} className="block h-full w-auto" />
    </a>
  );
}

/**
 * The Apple badge with its own weather: the badge when idle, the card being
 * made while the pass downloads, "opening" as it is handed over, and a plain
 * way back when it fails.
 */
function ApplePassBadge({
  href,
  pass: { phase, start },
  className = "",
}: {
  href: string;
  pass: PassDownload;
  className?: string;
}) {
  const { t } = useTranslation();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Modifier clicks are the customer asking for a tab; let the link be one.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    start();
  };

  if (phase === "idle") return <Badge kind="apple" href={href} className={className} onClick={onClick} />;

  if (phase === "failed") {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 text-center">
        <p className="max-w-[30ch] text-[15px] leading-snug">
          {t("loyalty.passFailed", "We couldn't make your card just now.")}
        </p>
        <Button variant="outline" size="lg" onClick={start} className="rounded-full">
          {t("loyalty.passRetry", "Try again")}
        </Button>
      </div>
    );
  }

  // The words. The picture is the card above, which the page is pressing.
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-3 rounded-full border border-border/70 bg-card pe-5 ps-4 shadow-sm ${className}`}
    >
      <span
        aria-hidden
        className={`size-2.5 shrink-0 rounded-full bg-primary ${
          phase === "making" ? "motion-safe:animate-pulse" : ""
        }`}
      />
      <span className="text-[15px] font-medium leading-none">
        {phase === "making"
          ? t("loyalty.passMaking", "Making your card…")
          : t("loyalty.passOpening", "Opening Wallet…")}
      </span>
    </div>
  );
}

/** The demoted Apple link — the same download, so the same weather, in a line. */
function ApplePassLine({
  href,
  pass: { phase, start },
  className = "",
}: {
  href: string;
  pass: PassDownload;
  className?: string;
}) {
  const { t } = useTranslation();

  if (phase === "failed") {
    return (
      <span role="alert" className="text-center text-[13px] leading-snug text-muted-foreground">
        {t("loyalty.passFailed", "We couldn't make your card just now.")}{" "}
        <button
          type="button"
          onClick={start}
          className="rounded text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t("loyalty.passRetry", "Try again")}
        </button>
      </span>
    );
  }
  if (phase !== "idle") {
    return (
      <span role="status" aria-live="polite" className="text-[13px] text-muted-foreground">
        {phase === "making"
          ? t("loyalty.passMaking", "Making your card…")
          : t("loyalty.passOpening", "Opening Wallet…")}
      </span>
    );
  }
  return (
    <a
      href={href}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        start();
      }}
      className={className}
    >
      {t("loyalty.useAppleInstead", "Use Apple Wallet instead")}
    </a>
  );
}

export function WalletButtons({ passes, pass }: Props) {
  const { t } = useTranslation();
  const urls: Record<WalletKind, string | null> = {
    apple: passes.apple_url ?? null,
    google: passes.google_url ?? null,
  };
  const available = (["apple", "google"] as const).filter((k) => urls[k]);

  // No wallet configured for this tenant. The card above already carries the
  // code, so there is nothing to add rather than something to apologise for.
  if (available.length === 0) return null;

  const detected = detectWallet();

  // The device has a wallet we cannot serve — an Android phone with no Google
  // Wallet configured, most often. Leading with an Apple badge there would be
  // worse than useless, so the card leads: its code works on every device and
  // is what the till scans anyway. The other wallet's badge stays, smaller,
  // for the customer who knows they want it.
  if (detected && !urls[detected]) {
    const other = available[0]!;
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-center text-[13px] leading-snug text-muted-foreground">
          {t("loyalty.noWalletHere", "Show this code at the counter — it works without a wallet app.")}
        </p>
        {other === "apple" ? (
          <ApplePassBadge href={urls.apple!} pass={pass} className="h-11" />
        ) : (
          <Badge kind="google" href={urls.google!} className="h-11" />
        )}
      </div>
    );
  }

  // Otherwise the detected wallet leads; a single configured wallet always
  // leads, because a badge that works beats a badge that matches the device.
  const primary: WalletKind = detected && urls[detected] ? detected : available[0]!;
  const secondary = available.find((k) => k !== primary) ?? null;

  // iOS inside an in-app browser never reaches here: `src/loyalty/main.tsx`
  // replaces the whole page, because a pkpass cannot install from a webview.
  // What remains is Android, where the save link loads but asks for a Google
  // sign-in the webview cannot satisfy.
  const inApp = detectInAppBrowser();

  // Android: the Google save link loads but demands a Google sign-in the
  // webview cannot satisfy. `intent://` hands it to Chrome, which already has
  // the customer signed in, and falls back to the plain link without Chrome.
  const href = (kind: WalletKind) => {
    const url = urls[kind]!;
    return inApp?.android && kind === "google" ? chromeEscapeUrl(url) : url;
  };


  return (
    <div className="flex flex-col items-center gap-3">
      {primary === "apple" ? (
        <ApplePassBadge href={urls.apple!} pass={pass} className="h-[52px]" />
      ) : (
        <Badge kind="google" href={href("google")} className="h-[52px]" />
      )}
      {secondary === "apple" ? (
        <ApplePassLine href={urls.apple!} pass={pass} className={LINE} />
      ) : secondary === "google" ? (
        <a href={href("google")} className={LINE}>
          {t("loyalty.useGoogleInstead", "Use Google Wallet instead")}
        </a>
      ) : null}
    </div>
  );
}
