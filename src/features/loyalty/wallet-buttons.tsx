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
 *  - the device's wallet is NOT configured but the other is — the QR leads,
 *    because an Apple badge is no use to an Android phone, and the other badge
 *    stays underneath for someone on the wrong device;
 *  - neither is configured — the QR alone. The programme still works and the
 *    till still scans.
 */
import { useTranslation } from "react-i18next";

import { detectWallet, type WalletKind } from "./detect-wallet";

interface Props {
  passes: { apple_url?: string | null; google_url?: string | null; any?: boolean };
  /** Member token — used for the QR, which works on every device. */
  token: string;
}

const BADGE: Record<WalletKind, { src: string; alt: string }> = {
  apple: { src: "/wallet/add-to-apple-wallet.svg", alt: "Add to Apple Wallet" },
  google: { src: "/wallet/add-to-google-wallet.svg", alt: "Add to Google Wallet" },
};

function MemberQr({ token, caption }: { token: string; caption: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-5 text-center">
      <img
        src={`/api/public/loyalty/card/${encodeURIComponent(token)}/qr.png`}
        alt=""
        className="aspect-square w-full max-w-44 rounded-xl bg-white p-2"
      />
      <p className="text-sm text-muted-foreground">{caption}</p>
    </div>
  );
}

export function WalletButtons({ passes, token }: Props) {
  const { t } = useTranslation();
  const urls: Record<WalletKind, string | null> = {
    apple: passes.apple_url ?? null,
    google: passes.google_url ?? null,
  };
  const available = (["apple", "google"] as const).filter((k) => urls[k]);

  if (available.length === 0) {
    return (
      <MemberQr
        token={token}
        caption={t(
          "loyalty.showThisCode",
          "Show this code at the counter to collect your points.",
        )}
      />
    );
  }

  const detected = detectWallet();

  // The device has a wallet we cannot serve — an Android phone with no Google
  // Wallet configured, most often. Leading with an Apple badge there would be
  // worse than useless, so the QR leads: it works on every device and is what
  // the till scans anyway.
  if (detected && !urls[detected]) {
    const other = available[0]!;
    return (
      <div className="flex flex-col gap-3">
        <MemberQr
          token={token}
          caption={t(
            "loyalty.noWalletHere",
            "Show this code at the counter — it works without a wallet app.",
          )}
        />
        <a href={urls[other]!} className="mx-auto" aria-label={BADGE[other].alt}>
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
