/**
 * Which programme you are editing, and the code that signs people up for it.
 *
 * The scope is SHOWN here, not chosen here. It decides both which rules the
 * tabs below show and which code this button prints, and it is the same scope
 * the rest of the dashboard is in — so it is set once, in the header, and this
 * card reports it. A second picker for the same idea is a second chance to be
 * editing a different branch from the one you are reading.
 *
 * Locked, therefore, but explained: a shop that never scopes a code to a branch
 * cannot tell where its members signed up, and that is worth knowing before you
 * print the poster.
 *
 * A membership belongs to the SHOP, not to a branch — the pass has always
 * carried the org's programme and every branch's location — so the
 * organisation scope has a code of its own, and a member who joins at one
 * branch is a member at all of them either way.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Lock, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { branchLoyaltyQr, orgLoyaltyQr } from "@/data/api/generated/api";
import type { QrResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { QrPreviewDialog } from "@/features/qr/qr-preview-dialog";

import type { ProgramScope } from "./use-program";

export function SignUpCode({
  scope,
  branchName,
}: {
  scope: ProgramScope;
  /** The scoped branch's name, or null when the scope is the whole shop. */
  branchName: string | null;
}) {
  const { t } = useTranslation();
  const [qr, setQr] = useState<QrResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const show = async () => {
    setBusy(true);
    try {
      setQr(
        scope.branchId
          ? await branchLoyaltyQr(scope.branchId, {}, {})
          : await orgLoyaltyQr(scope.orgId, {}, {}),
      );
    } catch (e) {
      // The endpoint refuses to print a card leading to "we run no program
      // here", and says so — worth surfacing rather than swallowing.
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        {/* Reads as a field, behaves as a label: this is what the header
            picker currently says, not something to set twice. */}
        <div
          className="flex w-full items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground sm:w-64"
          title={t("loyalty.scopeLocked", "Set by the branch picker in the header")}
        >
          <Lock className="size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
            {branchName ?? t("loyalty.wholeOrg", "Whole organisation")}
          </span>
        </div>

        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          {branchName
            ? t(
                "loyalty.qrPerBranch",
                "This branch's counter code. It signs people up under this branch's settings, and tells you they joined here.",
              )
            : t(
                "loyalty.qrOrgTip",
                "One code for the whole shop — a poster, a receipt footer, a link in a bio. Pick a branch in the header to print that branch its own code instead: members belong to the shop either way, but a per-branch code is the only way to see where they signed up.",
              )}
        </p>

        <Button
          variant="outline"
          className="shrink-0"
          onClick={() => void show()}
          disabled={busy || !scope.orgId}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
          {scope.branchId
            ? t("loyalty.counterQr", "Counter code")
            : t("loyalty.orgQr", "Sign-up code")}
        </Button>

        <QrPreviewDialog
          qr={qr}
          open={!!qr}
          onOpenChange={(o) => !o && setQr(null)}
          title={t("loyalty.joinQr", "Join code")}
        />
      </CardContent>
    </Card>
  );
}
