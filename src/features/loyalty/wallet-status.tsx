/**
 * Why there is no "Add to Wallet" button.
 *
 * Every failure in this feature has looked the same from the outside — a
 * missing button, or a save that says "Something went wrong" — while the cause
 * was a variable nobody set, a key file the code never read, a service account
 * Google had not been told about, or a save link over a size limit. None of
 * those reach a customer's screen, and only some reach a log.
 *
 * So it is asked for rather than polled: the check makes live calls to Google,
 * and an admin only wants it when something looks wrong.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getLoyaltyWalletStatus } from "@/data/api/generated/api";
import type { WalletProvider, WalletStatus } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";

function Provider({ name, p }: { name: string; p: WalletProvider }) {
  const { t } = useTranslation();
  // Configured is not the same as working: Apple signs locally and has nobody
  // to ask, Google can be fully configured and still refuse the account.
  const ok = p.configured && p.reachable !== false;
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border/70 p-3">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{name}</p>
        {p.missing.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground">
              {t("loyalty.walletMissing", "Not set on the server:")}
            </p>
            <ul className="space-y-0.5">
              {p.missing.map((m) => (
                <li
                  key={m}
                  className="font-mono text-[11px] [overflow-wrap:anywhere] text-muted-foreground"
                >
                  {m}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {p.detail ? (
          <p className="text-xs [overflow-wrap:anywhere] text-muted-foreground">
            {p.detail}
          </p>
        ) : null}
        {p.configured && !p.detail ? (
          <p className="text-xs text-muted-foreground">
            {t("loyalty.walletReady", "Configured.")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function WalletStatusPanel({ branchId }: { branchId: string | null }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<WalletStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setStatus(
        await getLoyaltyWalletStatus(branchId ? { branch_id: branchId } : {}),
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Wallet className="size-4 shrink-0" />
            {t("loyalty.walletStatus", "Wallet passes")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(
              "loyalty.walletStatusHint",
              "Checks whether Apple and Google will issue a card for this shop.",
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={run} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("loyalty.walletCheck", "Check")}
        </Button>
      </div>

      {error ? (
        <p className="text-xs text-destructive [overflow-wrap:anywhere]">{error}</p>
      ) : null}

      {status ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Provider name="Apple Wallet" p={status.apple} />
          <Provider name="Google Wallet" p={status.google} />
        </div>
      ) : null}
    </div>
  );
}
