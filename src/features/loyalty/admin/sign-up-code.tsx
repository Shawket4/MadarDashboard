/**
 * Which programme you are editing, and the code that signs people up for it.
 *
 * The two belong together: the scope decides both which rules the tabs below
 * show AND which code this button prints, and separating them made "whole
 * organisation" a scope with nothing to hand a customer.
 *
 * A membership belongs to the SHOP, not to a branch — the pass has always
 * carried the org's programme and every branch's location — so the
 * organisation scope has a code of its own. Picking a branch you did not mean,
 * purely to get something printable, was the only way to do that before.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { branchLoyaltyQr, orgLoyaltyQr, useListBranches } from "@/data/api/generated/api";
import type { QrResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { QrPreviewDialog } from "@/features/qr/qr-preview-dialog";

import type { ProgramScope } from "./use-program";

/** The select's value for "no branch". A sentinel, because "" is not selectable. */
export const ORG_SCOPE = "__org__";

export function SignUpCode({
  scope,
  onScopeChange,
}: {
  scope: ProgramScope;
  onScopeChange: (branchId: string | null) => void;
}) {
  const { t } = useTranslation();
  const branches = useListBranches(
    { org_id: scope.orgId },
    { query: { enabled: !!scope.orgId } },
  );
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
        <Select
          value={scope.branchId ?? ORG_SCOPE}
          onValueChange={(v) => onScopeChange(v === ORG_SCOPE ? null : v)}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORG_SCOPE}>
              {t("loyalty.wholeOrg", "Whole organisation (default)")}
            </SelectItem>
            {(branches.data ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          {scope.branchId
            ? t(
                "loyalty.qrPerBranch",
                "This branch's counter code. It signs people up under this branch's settings.",
              )
            : t(
                "loyalty.qrOrgHint",
                "One code for the whole shop — for a poster, a receipt footer or a link in a bio. Members belong to the shop, not to a branch, so their card works everywhere either way.",
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
