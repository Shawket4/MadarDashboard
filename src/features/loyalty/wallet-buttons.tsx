/**
 * The "add to wallet" pair, plus the honest fallback.
 *
 * Either side may be missing: a tenant with only Google credentials configured
 * shows one button, not a broken one. When NEITHER wallet is configured the
 * member's QR is shown on the page instead — the program still works, the till
 * still scans, and nobody is staring at two dead buttons.
 */
import { useTranslation } from "react-i18next";

interface Props {
  passes: { apple_url?: string | null; google_url?: string | null; any?: boolean };
  /** Member token — used for the on-page QR fallback. */
  token: string;
}

export function WalletButtons({ passes, token }: Props) {
  const { t } = useTranslation();
  const apple = passes.apple_url ?? null;
  const google = passes.google_url ?? null;

  if (!apple && !google) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-5 text-center">
        <img
          src={`/api/public/loyalty/card/${encodeURIComponent(token)}/qr.png`}
          alt={t("loyalty.yourCode", "Your code")}
          className="size-44 rounded-xl bg-white p-2"
        />
        <p className="text-sm text-muted-foreground">
          {t("loyalty.showThisCode", "Show this code at the counter to collect your points.")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {apple ? (
        <a
          href={apple}
          className="flex h-12 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90 motion-reduce:transition-none"
        >
          {t("loyalty.addToApple", "Add to Apple Wallet")}
        </a>
      ) : null}
      {google ? (
        <a
          href={google}
          className="flex h-12 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted motion-reduce:transition-none"
        >
          {t("loyalty.addToGoogle", "Save to Google Wallet")}
        </a>
      ) : null}
    </div>
  );
}
