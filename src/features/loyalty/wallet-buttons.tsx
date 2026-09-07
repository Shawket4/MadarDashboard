/**
 * One "Add to Wallet" button, pointed at the wallet this device actually has.
 *
 * A customer does not think in platforms; they think "put this on my phone". So
 * the detected wallet leads, and the other stays reachable as a quiet line
 * underneath — detection is a guess, and a wrong guess has to be recoverable in
 * one tap rather than leaving someone with a pass they cannot install.
 *
 * Three cases beyond the happy one, all of which happen:
 *  - only ONE wallet is configured — it leads regardless of the device, because
 *    a button that works beats a button that matches;
 *  - a desktop with neither — both are offered, since the visitor is usually
 *    about to send the link to their phone;
 *  - neither wallet configured at all — the member's QR is shown instead. The
 *    programme still works and the till still scans; nobody stares at a dead
 *    button.
 */
import { useTranslation } from "react-i18next";
import { Wallet } from "lucide-react";

import { detectWallet, type WalletKind } from "./detect-wallet";

interface Props {
  passes: { apple_url?: string | null; google_url?: string | null; any?: boolean };
  /** Member token — used for the on-page QR fallback. */
  token: string;
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
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-5 text-center">
        <img
          src={`/api/public/loyalty/card/${encodeURIComponent(token)}/qr.png`}
          alt={t("loyalty.yourCode", "Your code")}
          className="aspect-square w-full max-w-44 rounded-xl bg-white p-2"
        />
        <p className="text-sm text-muted-foreground">
          {t("loyalty.showThisCode", "Show this code at the counter to collect your points.")}
        </p>
      </div>
    );
  }

  // The detected wallet leads when we have it; otherwise whichever exists does.
  // A single configured wallet always leads, because a button that works beats
  // a button that matches the device.
  const detected = detectWallet();
  const primary: WalletKind =
    detected && urls[detected] ? detected : available[0]!;
  const secondary = available.find((k) => k !== primary) ?? null;

  const label: Record<WalletKind, string> = {
    apple: t("loyalty.addToApple", "Add to Apple Wallet"),
    google: t("loyalty.addToGoogle", "Save to Google Wallet"),
  };
  const otherLabel: Record<WalletKind, string> = {
    apple: t("loyalty.useAppleInstead", "Use Apple Wallet instead"),
    google: t("loyalty.useGoogleInstead", "Use Google Wallet instead"),
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <a
        href={urls[primary]!}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-[15px] font-semibold text-background transition-opacity hover:opacity-90 motion-reduce:transition-none"
      >
        <Wallet className="size-[18px]" />
        {label[primary]}
      </a>

      {/* Reachable, not shouted: the customer whose device we guessed wrong is
          rare, and should not have to hunt. */}
      {secondary ? (
        <a
          href={urls[secondary]!}
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {otherLabel[secondary]}
        </a>
      ) : null}
    </div>
  );
}
