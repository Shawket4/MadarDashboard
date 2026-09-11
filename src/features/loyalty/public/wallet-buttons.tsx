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
 */
import { useTranslation } from "react-i18next";

import { detectWallet, type WalletKind } from "./detect-wallet";

interface Props {
  passes: { apple_url?: string | null; google_url?: string | null; any?: boolean };
}

const BADGE: Record<WalletKind, { src: string; alt: string }> = {
  apple: { src: "/wallet/add-to-apple-wallet.svg", alt: "Add to Apple Wallet" },
  google: { src: "/wallet/add-to-google-wallet.svg", alt: "Add to Google Wallet" },
};

/** The badge as a link, at the vendors' minimum tap height, focus-ringed like every other control. */
function Badge({ kind, href, className = "" }: { kind: WalletKind; href: string; className?: string }) {
  return (
    <a
      href={href}
      aria-label={BADGE[kind].alt}
      className={`inline-block rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${className}`}
    >
      {/* Height set, width free: both vendors' guidelines forbid stretching. */}
      <img src={BADGE[kind].src} alt={BADGE[kind].alt} className="block h-full w-auto" />
    </a>
  );
}

export function WalletButtons({ passes }: Props) {
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
        <Badge kind={other} href={urls[other]!} className="h-11" />
      </div>
    );
  }

  // Otherwise the detected wallet leads; a single configured wallet always
  // leads, because a badge that works beats a badge that matches the device.
  const primary: WalletKind = detected && urls[detected] ? detected : available[0]!;
  const secondary = available.find((k) => k !== primary) ?? null;

  return (
    <div className="flex flex-col items-center gap-3">
      <Badge kind={primary} href={urls[primary]!} className="h-[52px]" />
      {secondary ? (
        <a
          href={urls[secondary]!}
          className="rounded text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {secondary === "apple"
            ? t("loyalty.useAppleInstead", "Use Apple Wallet instead")
            : t("loyalty.useGoogleInstead", "Use Google Wallet instead")}
        </a>
      ) : null}
    </div>
  );
}
