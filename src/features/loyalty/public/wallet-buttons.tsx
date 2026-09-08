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
  // worse than useless, so the QR leads: it works on every device and is what
  // the till scans anyway.
  if (detected && !urls[detected]) {
    const other = available[0]!;
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-center text-xs text-muted-foreground">
          {t(
            "loyalty.noWalletHere",
            "Your card is above — show it at the counter. No wallet app needed.",
          )}
        </p>
        <a href={urls[other]!} aria-label={BADGE[other].alt}>
          <img src={BADGE[other].src} alt={BADGE[other].alt} className="h-11 w-auto" />
        </a>
      </div>
    );
  }

  // Otherwise the detected wallet leads; a single configured wallet always
  // leads, because a badge that works beats a badge that matches the device.
  const primary: WalletKind = detected && urls[detected] ? detected : available[0]!;
  const secondary = available.find((k) => k !== primary) ?? null;

  return (
    <div className="flex flex-col items-center gap-3">
      <a href={urls[primary]!} aria-label={BADGE[primary].alt}>
        {/* Height set, width free: both vendors' guidelines forbid stretching. */}
        <img src={BADGE[primary].src} alt={BADGE[primary].alt} className="h-[52px] w-auto" />
      </a>
      {secondary ? (
        <a
          href={urls[secondary]!}
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {secondary === "apple"
            ? t("loyalty.useAppleInstead", "Use Apple Wallet instead")
            : t("loyalty.useGoogleInstead", "Use Google Wallet instead")}
        </a>
      ) : null}
    </div>
  );
}
