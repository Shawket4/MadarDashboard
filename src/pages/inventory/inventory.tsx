import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, Boxes, ClipboardList, Package } from "lucide-react";
import { PageShell } from "@/shared/ui/page-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { useListBranches as useBranches } from "@/shared/api/generated/api";
import { type TransferSuggestion } from "./stock-tools";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { useScopedParams } from "@/shared/scope/use-scoped-params";

import { CatalogTab } from "./catalog-tab";
import { StockTab } from "./stock-tab";
import { AdjustmentsTab } from "./adjustments-tab";
import { TransfersTab } from "./transfers-tab";

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Inventory() {
  const { t } = useTranslation();
  const { orgId } = useCurrentContext();
  const { data: branches = [] } = useBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  // Branch comes from the global scope bar in the header (B.1)
  const { branchId } = useScopedParams();
  const [tab, setTab] = useState<"catalog" | "stock" | "adjustments" | "transfers">("catalog");
  // "transfer from surplus branch" jumps to the transfers tab with the form prefilled
  const [transferPrefill, setTransferPrefill] = useState<TransferSuggestion | null>(null);

  const active = branches.find((b) => b.id === branchId) ?? branches[0];

  if (!orgId) return <PageShell title={t("inventory.title")} description={t("inventory.subtitle")}>{null}</PageShell>;

  return (
    <PageShell title={t("inventory.title")} description={active ? active.name : t("inventory.subtitle")}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="catalog"><Boxes size={14} /> {t("inventory.tabs.catalog")}</TabsTrigger>
          <TabsTrigger value="stock"><Package size={14} /> {t("inventory.tabs.stock")}</TabsTrigger>
          <TabsTrigger value="adjustments"><ClipboardList size={14} /> {t("inventory.tabs.adjustments")}</TabsTrigger>
          <TabsTrigger value="transfers"><ArrowLeftRight size={14} /> {t("inventory.tabs.transfers")}</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog"><CatalogTab orgId={orgId} /></TabsContent>
        <TabsContent value="stock">
          <StockTab
            orgId={orgId}
            branchId={active?.id ?? ""}
            branches={branches}
            onTransferSuggested={(sugg) => { setTransferPrefill(sugg); setTab("transfers"); }}
          />
        </TabsContent>
        <TabsContent value="adjustments"><AdjustmentsTab branchId={active?.id ?? ""} /></TabsContent>
        <TabsContent value="transfers"><TransfersTab orgId={orgId} branchId={active?.id ?? ""} prefill={transferPrefill} onPrefillConsumed={() => setTransferPrefill(null)} /></TabsContent>
      </Tabs>
    </PageShell>
  );
}

