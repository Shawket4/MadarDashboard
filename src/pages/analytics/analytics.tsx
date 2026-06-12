import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart2, Coffee, Package, Users } from "lucide-react";
import { PageShell } from "@/shared/ui/page-shell";
import { EmptyState } from "@/shared/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { useListBranches as useBranches } from "@/shared/api/generated/api";
import { useScopedParams } from "@/shared/scope/use-scoped-params";
import { useCurrentContext } from "@/shared/hooks/use-current-context";

type Granularity = "hourly" | "daily" | "monthly";
type TabKey = "overview" | "revenue" | "items" | "tellers" | "branches" | "inventory";


import { OverviewTab } from "./overview-tab";
import { RevenueTab } from "./revenue-tab";
import { ItemsTab } from "./items-tab";
import { TellersTab } from "./tellers-tab";
import { BranchesTab } from "./branches-tab";
import { InventoryTab } from "./inventory-tab";

export default function Analytics() {
  const { t, i18n } = useTranslation(); /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ void i18n.language;
  const { orgId, isSuperAdmin, isOrgAdmin } = useCurrentContext();
  const { data: branches = [] } = useBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  // Branch and period come from the global scope bar in the header (B.1)
  const { branchId: selBranch, from, to } = useScopedParams();
  const [gran, setGran] = useState<Granularity>("daily");
  const [tab, setTab] = useState<TabKey>("overview");

  const canCompareBranches = (isSuperAdmin || isOrgAdmin) && branches.length > 1;

  if (!orgId) return <PageShell title={t("analytics.title")} description={t("analytics.subtitle")}>{null}</PageShell>;

  return (
    <PageShell title={t("analytics.title")} description={t("analytics.subtitle")}>
      <div className="flex rounded-lg border p-0.5 bg-muted w-fit">
        {(["hourly", "daily", "monthly"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGran(g)}
            className={`px-3 py-1 text-xs rounded ${gran === g ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"}`}
          >
            {t(`analytics.granularity.${g}`)}
          </button>
        ))}
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">{t("analytics.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="revenue">{t("analytics.tabs.revenue")}</TabsTrigger>
          <TabsTrigger value="items">{t("analytics.tabs.items")}</TabsTrigger>
          <TabsTrigger value="tellers">{t("analytics.tabs.tellers")}</TabsTrigger>
          {canCompareBranches && <TabsTrigger value="branches">{t("analytics.tabs.branches")}</TabsTrigger>}
          <TabsTrigger value="inventory">{t("analytics.tabs.inventory")}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {selBranch ? <OverviewTab branchId={selBranch} from={from} to={to} /> : <EmptyState icon={BarChart2} title={t("orders.selectBranch")} />}
        </TabsContent>
        <TabsContent value="revenue">
          {selBranch ? <RevenueTab branchId={selBranch} from={from} to={to} granularity={gran} /> : <EmptyState icon={BarChart2} title={t("orders.selectBranch")} />}
        </TabsContent>
        <TabsContent value="items">
          {selBranch ? <ItemsTab branchId={selBranch} from={from} to={to} /> : <EmptyState icon={Coffee} title={t("orders.selectBranch")} />}
        </TabsContent>
        <TabsContent value="tellers">
          {selBranch ? <TellersTab branchId={selBranch} from={from} to={to} /> : <EmptyState icon={Users} title={t("orders.selectBranch")} />}
        </TabsContent>
        {canCompareBranches && (
          <TabsContent value="branches">
            <BranchesTab orgId={orgId} from={from} to={to} />
          </TabsContent>
        )}
        <TabsContent value="inventory">
          {selBranch ? <InventoryTab branchId={selBranch} /> : <EmptyState icon={Package} title={t("orders.selectBranch")} />}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
