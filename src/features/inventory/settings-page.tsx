import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrgId } from "@/hooks/use-org-id";
import { getErrorMessage } from "@/data/api/errors";
import { updateInventorySettings, useGetInventorySettings } from "@/data/api/generated/api";
import { invalidateInventory } from "./lib";

/** Inventory ▸ Settings — org-wide inventory rules (variance tolerance). */
export function SettingsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const settings = useGetInventorySettings(orgId ?? "", { query: { enabled: !!orgId } });
  const [pct, setPct] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings.data) setPct(String(settings.data.stocktake_variance_threshold_pct));
  }, [settings.data]);

  if (!orgId) {
    return (
      <Page>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("inventory.settings.title", "Inventory settings")}</h1>
        </div>
        <EmptyState icon={Settings2} title={t("inventory.pickOrg", "Select an organization to manage inventory")} />
      </Page>
    );
  }

  const save = async () => {
    const value = parseFloat(pct);
    if (!Number.isFinite(value) || value < 0) return;
    setBusy(true);
    try {
      await updateInventorySettings(orgId, { stocktake_variance_threshold_pct: value });
      await invalidateInventory();
      toast.success(t("inventory.settings.saved", "Settings saved"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("inventory.settings.title", "Inventory settings")}</h1>
        <p className="text-sm text-muted-foreground">{t("inventory.settings.subtitle", "Organization-wide inventory rules")}</p>
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t("inventory.settings.varianceThreshold", "Stock-count variance tolerance")}</CardTitle>
          <CardDescription>
            {t(
              "inventory.settings.varianceThresholdHint",
              "A counted item is flagged when its difference from expected is at least this percent. Flagged items need a reason before a count can be finalized.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-48 space-y-1.5">
            <Label>{t("inventory.settings.percent", "Percent")}</Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="0.1"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                disabled={settings.isLoading}
                className="pe-8 tabular"
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <Button loading={busy} disabled={settings.isLoading || pct === ""} onClick={() => void save()}>
            {t("common.save", "Save")}
          </Button>
        </CardContent>
      </Card>
    </Page>
  );
}
