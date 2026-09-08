/**
 * The loyalty program's admin: its rules, the rewards it offers, the members it
 * has, and the code that stands on the counter.
 *
 * Everything here is scoped — the org's own settings, or one branch's override.
 * The scope picker sits at the top rather than inside each tab, because the
 * question "which branch am I editing" applies to all of them at once and an
 * admin who answers it per-tab will eventually answer it inconsistently.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, QrCode } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { branchLoyaltyQr, orgLoyaltyQr, useListBranches } from "@/data/api/generated/api";
import type { QrResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthStore } from "@/data/stores/auth.store";
import { QrPreviewDialog } from "@/features/qr/qr-preview-dialog";
import { toast } from "sonner";

import { MembersList } from "./members-list";
import { ProgramSettings } from "./program-settings";
import { RewardCatalogue } from "./reward-catalogue";

const ORG_SCOPE = "__org__";

export function LoyaltyPage() {
  const { t } = useTranslation();
  const orgId = useAuthStore((s) => s.user?.org_id) ?? "";
  const branches = useListBranches(
    { org_id: orgId },
    { query: { enabled: !!orgId } },
  );
  const [scope, setScope] = useState<string>(ORG_SCOPE);
  const branchId = scope === ORG_SCOPE ? null : scope;
  const [qr, setQr] = useState<QrResponse | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const showQr = async () => {
    setQrLoading(true);
    try {
      // A membership belongs to the SHOP, so the whole-organisation scope has a
      // code of its own — a poster, a receipt footer, a link in a bio. Picking
      // a branch you did not mean, just to get something printable, was the
      // only way to do that.
      setQr(
        branchId
          ? await branchLoyaltyQr(branchId, {}, {})
          : await orgLoyaltyQr(orgId, {}, {}),
      );
    } catch (e) {
      // The endpoint refuses to print a card that leads to "we run no program
      // here", and says so — worth surfacing rather than swallowing.
      toast.error(getErrorMessage(e));
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title={t("nav.loyalty", "Loyalty")}
        description={t(
          "loyalty.subtitle",
          "Points or stamps, the rewards they buy, and the code that signs people up.",
        )}
      />

      <div className="flex w-full flex-wrap items-center gap-3">
        <Select value={scope} onValueChange={setScope}>
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

        <Button variant="outline" onClick={() => void showQr()} disabled={qrLoading || !orgId}>
          {qrLoading ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
          {branchId
            ? t("loyalty.counterQr", "Counter code")
            : t("loyalty.orgQr", "Sign-up code")}
        </Button>
      </div>

      <Tabs defaultValue="program">
        <TabsList>
          <TabsTrigger value="program">{t("loyalty.tabProgram", "Program")}</TabsTrigger>
          <TabsTrigger value="rewards">{t("loyalty.tabRewards", "Rewards")}</TabsTrigger>
          <TabsTrigger value="members">{t("loyalty.tabMembers", "Members")}</TabsTrigger>
        </TabsList>
        <TabsContent value="program" className="pt-4">
          <ProgramSettings orgId={orgId} branchId={branchId} />
        </TabsContent>
        <TabsContent value="rewards" className="pt-4">
          <RewardCatalogue orgId={orgId} branchId={branchId} />
        </TabsContent>
        <TabsContent value="members" className="pt-4">
          <MembersList branchId={branchId} />
        </TabsContent>
      </Tabs>

      {/* The per-branch code a customer scans to join. Static and printed once,
          so it must keep working with no reprint — which is why it points at a
          short link the server owns rather than a URL baked into the image. */}
      <QrPreviewDialog
        qr={qr}
        open={qr !== null}
        onOpenChange={(open) => {
          if (!open) setQr(null);
        }}
      />

      <Card>
        <CardContent className="p-5 text-xs text-muted-foreground">
          {branchId
            ? t(
                "loyalty.qrPerBranch",
                "This branch's counter code. It signs people up under this branch's settings.",
              )
            : t(
                "loyalty.qrOrgHint",
                "One code for the whole shop — for a poster, a receipt footer or a link in a bio. Members belong to the shop, not to a branch, so their card works everywhere either way.",
              )}
        </CardContent>
      </Card>
    </Page>
  );
}
