import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, Building2, Clock, GitBranch,
  LayoutGrid, Package, Receipt, ShoppingBag, TrendingUp, Users as UsersIcon,
} from "lucide-react";
import { PageShell } from "@/shared/ui/page-shell";
import { StatCard } from "@/shared/ui/stat-card";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  useListOrgs, useListBranches, useListUsers, useListOrders,
  getGetCurrentShiftQueryOptions,
} from "@/shared/api/generated/api";
import { reportApi } from "@/entities/report/api";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { usePermissions } from "@/shared/hooks/use-permissions";
import { useScopedParams } from "@/shared/scope/use-scoped-params";
import { useScopeStore } from "@/shared/scope/scope-store";
import { SetupChecklist } from "@/widgets/setup-checklist/setup-checklist";
import { QUERY_KEYS } from "@/shared/config/constants";
import { cairoDateISO, cairoNow, fmtDateTime, fmtDuration, fmtMoney } from "@/shared/lib/format";
import { apiClient } from "@/shared/api/client";
import type { Branch, BranchInventoryItem, BranchSalesReport } from "@/shared/types";
import type { Order } from "@/shared/api/generated/models/order";
import type { Shift } from "@/shared/api/generated/models/shift";
import { useQueries } from "@tanstack/react-query";

const greet = (name: string, t: (k: string, p?: Record<string, unknown>) => string) => {
  const h = new Date().getHours();
  const key = h < 12 ? "greetingMorning" : h < 18 ? "greetingAfternoon" : "greetingEvening";
  return t(`dashboard.${key}`, { name });
};

/** The equal-length window immediately before [from, to] (for KPI trends). */
const priorPeriod = (from: string, to: string): { from: string; to: string } => {
  const f = new Date(from).getTime();
  const t2 = new Date(to).getTime();
  const span = Math.max(0, t2 - f);
  return { from: new Date(f - span - 1).toISOString(), to: new Date(f - 1).toISOString() };
};

const pctChange = (current: number, previous: number): { value: number; label: string } | undefined =>
  previous > 0 ? { value: ((current - previous) / previous) * 100, label: "" } : undefined;

// ── Branch card — fully prop-fed (queries are lifted to the page) ────────────
function BranchCard({
  branch,
  openShift,
  sales,
  lowStockCount,
  onOpen,
}: {
  branch: Branch;
  openShift: Shift | null;
  sales: BranchSalesReport | undefined;
  lowStockCount: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card className="cursor-pointer hover:shadow-md transition-all" onClick={onOpen}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GitBranch size={14} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">{branch.name}</p>
              <p className="text-xs text-muted-foreground">
                {openShift ? `${t("shifts.shiftIsOpen")} · ${openShift.teller_name}` : t("dashboard.noActiveShift")}
              </p>
            </div>
          </div>
          {openShift && <Badge variant="success" className="text-xs">{t("shiftStatus.open")}</Badge>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted p-2">
            <p className="text-xs text-muted-foreground">{t("dashboard.todaySales")}</p>
            <p className="text-sm font-bold tabular">{sales ? fmtMoney(sales.total_revenue) : "—"}</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <p className="text-xs text-muted-foreground">{t("dashboard.orders")}</p>
            <p className="text-sm font-bold tabular">{sales?.total_orders ?? "—"}</p>
          </div>
        </div>

        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-warning">
            <AlertTriangle size={11} />
            <span>{t("dashboard.lowStockItems", { count: lowStockCount })}</span>
          </div>
        )}

        {openShift && (
          <p className="text-xs text-muted-foreground">
            {t("dashboard.running")}: <span className="font-mono">{fmtDuration(openShift.opened_at)}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Recent orders — driven by the global scope branch ────────────────────────
function RecentOrdersPanel({ branchId }: { branchId: string | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data } = useListOrders(
    { branch_id: branchId ?? undefined, per_page: 8, page: 1 },
    { query: { enabled: !!branchId } },
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold flex items-center gap-2"><Receipt size={14} /> {t("dashboard.recentOrders")}</p>
          <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>{t("common.all")}</Button>
        </div>
        {!branchId ? (
          <EmptyState icon={Clock} title={t("orders.selectBranch")} className="py-8" />
        ) : !data?.data?.length ? (
          <EmptyState icon={ShoppingBag} title={t("dashboard.noOrdersYet")} className="py-8" />
        ) : (
          <div className="space-y-2">
            {data.data.map((o: Order) => (
              <div key={o.id} onClick={() => navigate("/orders")} className="flex items-center gap-2 rounded-lg bg-muted/40 hover:bg-muted px-3 py-2 cursor-pointer">
                <span className="font-mono text-xs font-bold text-primary">#{o.order_number}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{o.customer_name ?? o.teller_name}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(o.created_at)}</p>
                </div>
                <Badge variant="outline" className="text-xs">{t(`payments.${o.payment_method}`, { defaultValue: o.payment_method })}</Badge>
                <span className="font-bold tabular text-xs">{fmtMoney(o.total_amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Attention panel — prioritized issues across branches ─────────────────────
interface AttentionItem {
  key: string;
  priority: number;
  icon: typeof AlertTriangle;
  text: string;
  sub?: string;
  to: string;
}

function AttentionPanel({ items }: { items: AttentionItem[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-bold flex items-center gap-2 mb-3">
          <AlertTriangle size={14} /> {t("dashboard.attention")}
        </p>
        {items.length === 0 ? (
          <EmptyState icon={Package} title={t("dashboard.allClear")} className="py-8" />
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {items.map((it) => (
              <div
                key={it.key}
                onClick={() => navigate(it.to)}
                className="flex items-center gap-3 rounded-lg bg-warning/5 hover:bg-warning/10 border border-warning/20 px-3 py-2 cursor-pointer"
              >
                <it.icon size={14} className="text-warning shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{it.text}</p>
                  {it.sub && <p className="text-xs text-muted-foreground tabular truncate">{it.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role, orgId, isSuperAdmin } = useCurrentContext();
  const { can } = usePermissions();
  const { branchId: scopeBranchId, from, to } = useScopedParams();
  const setScopeBranch = useScopeStore((s) => s.setBranch);

  const { data: orgs = [] } = useListOrgs({ query: { enabled: isSuperAdmin } });
  const { data: branches = [] } = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId && (isSuperAdmin || can("branches", "read")) } });
  const { data: users = [] } = useListUsers({ org_id: orgId || undefined }, { query: { enabled: (isSuperAdmin || can("users", "read")) && !!orgId } });

  const canSeeShifts = isSuperAdmin || can("shifts", "read");
  const canSeeOrders = isSuperAdmin || can("orders", "read");
  const canSeeStock = isSuperAdmin || can("inventory", "read");

  // ── Lifted per-branch queries (BranchCard is purely prop-fed) ──────────────
  const shiftResults = useQueries({
    queries: branches.map((b) => ({
      ...getGetCurrentShiftQueryOptions(b.id),
      refetchInterval: 60_000,
      enabled: !!b.id && canSeeShifts,
    })),
  });

  // Today's window for the branch cards
  const now = cairoNow();
  const todayFrom = cairoDateISO(now.getFullYear(), now.getMonth(), now.getDate());
  const todayTo = cairoDateISO(now.getFullYear(), now.getMonth(), now.getDate(), true);

  const todaySalesResults = useQueries({
    queries: branches.map((b) => ({
      queryKey: QUERY_KEYS.branchSales(b.id, { from: todayFrom, to: todayTo }),
      queryFn: () => reportApi.branchSales(b.id, { from: todayFrom, to: todayTo }),
      enabled: !!b.id && canSeeOrders,
      staleTime: 60_000,
    })),
  });

  // Scope-period sales + the prior equal period (drives the KPI trends)
  const periodParams = { from: from ?? todayFrom, to: to ?? todayTo };
  const prior = priorPeriod(periodParams.from, periodParams.to);

  const periodSalesResults = useQueries({
    queries: branches.map((b) => ({
      queryKey: QUERY_KEYS.branchSales(b.id, periodParams),
      queryFn: () => reportApi.branchSales(b.id, periodParams),
      enabled: !!b.id && canSeeOrders,
      staleTime: 60_000,
    })),
  });
  const priorSalesResults = useQueries({
    queries: branches.map((b) => ({
      queryKey: QUERY_KEYS.branchSales(b.id, prior),
      queryFn: () => reportApi.branchSales(b.id, prior),
      enabled: !!b.id && canSeeOrders,
      staleTime: 5 * 60_000,
    })),
  });

  const stockResults = useQueries({
    queries: branches.map((b) => ({
      queryKey: ["stock-low", b.id],
      queryFn: async () => {
        const res = await apiClient.get<BranchInventoryItem[]>(`/inventory/branches/${b.id}/stock`);
        return { branchId: b.id, items: res.data.filter((s) => s.below_reorder) };
      },
      enabled: !!b.id && canSeeStock,
      staleTime: 5 * 60_000,
    })),
  });

  // ── KPI aggregates ──────────────────────────────────────────────────────────
  const sum = (rs: typeof periodSalesResults, pick: (r: BranchSalesReport) => number) =>
    rs.reduce((s, r) => s + (r.data ? pick(r.data) : 0), 0);

  const revenue = sum(periodSalesResults, (r) => r.total_revenue);
  const prevRevenue = sum(priorSalesResults, (r) => r.total_revenue);
  const orders = sum(periodSalesResults, (r) => r.total_orders);
  const prevOrders = sum(priorSalesResults, (r) => r.total_orders);
  const aov = orders > 0 ? revenue / orders : 0;
  const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;
  const activeShiftCount = shiftResults.filter((r) => r.data?.has_open_shift).length;

  // ── Attention items ─────────────────────────────────────────────────────────
  const attention = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    // Branches with no open shift during business hours (9:00–23:00 Cairo)
    const hour = cairoNow().getHours();
    const businessHours = hour >= 9 && hour < 23;
    if (businessHours && canSeeShifts) {
      branches.forEach((b, i) => {
        const r = shiftResults[i];
        if (r?.data && !r.data.has_open_shift) {
          items.push({
            key: `shift-${b.id}`,
            priority: 0,
            icon: Clock,
            text: t("dashboard.noOpenShiftAt", { branch: b.name }),
            to: "/shifts",
          });
        }
      });
    }
    // Low stock
    stockResults.forEach((r) => {
      const branchName = branches.find((b) => b.id === r.data?.branchId)?.name ?? "";
      (r.data?.items ?? []).forEach((s) => {
        items.push({
          key: `stock-${r.data?.branchId}-${s.id}`,
          priority: 1,
          icon: Package,
          text: s.ingredient_name,
          sub: `${branchName} · ${Number(s.current_stock).toFixed(2)} / ${Number(s.reorder_threshold).toFixed(2)} ${s.unit}`,
          to: "/inventory",
        });
      });
    });
    return items.sort((a, b) => a.priority - b.priority).slice(0, 14);
  }, [branches, shiftResults, stockResults, canSeeShifts, t]);

  const openBranch = (id: string) => {
    // clicking a branch focuses the global scope, then drills into orders
    setScopeBranch(id);
    navigate("/orders");
  };

  return (
    <PageShell
      title={user ? greet(user.name.split(" ")[0], t) : t("nav.dashboard")}
      description={role ? t("dashboard.subtitle") : undefined}
    >
      <SetupChecklist />

      {/* KPI row — scope period with trend vs the prior equal period */}
      {canSeeOrders && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <StatCard label={t("orders.totalRevenue")} value={revenue} formatType="money" icon={Receipt} accent="success" trend={pctChange(revenue, prevRevenue)} />
          <StatCard label={t("dashboard.orders")} value={orders} icon={ShoppingBag} accent="info" trend={pctChange(orders, prevOrders)} />
          <StatCard label={t("analytics.avgOrder")} value={aov} formatType="money" icon={TrendingUp} accent="violet" trend={pctChange(aov, prevAov)} />
          <StatCard label={t("dashboard.activeShifts")} value={`${activeShiftCount}/${branches.length || 0}`} icon={Clock} accent="primary" />
        </div>
      )}

      {/* Super-admin platform stats stay available */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <StatCard label={t("nav.orgs")} value={orgs.length} icon={Building2} onClick={() => navigate("/orgs")} />
          <StatCard label={t("users.totalUsers")} value={users.length} icon={UsersIcon} accent="info" onClick={() => navigate("/users")} />
          <StatCard label={t("nav.branches")} value={branches.length} icon={GitBranch} accent="violet" onClick={() => navigate("/branches")} />
          <StatCard label={t("dashboard.operating")} value={`${activeShiftCount}/${branches.length || 0}`} icon={LayoutGrid} accent="success" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(canSeeShifts || canSeeStock) && <AttentionPanel items={attention} />}
        {canSeeOrders && <RecentOrdersPanel branchId={scopeBranchId} />}
      </div>

      {/* Branch status grid */}
      {(isSuperAdmin || can("branches", "read")) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold flex items-center gap-2"><GitBranch size={14} /> {t("dashboard.branchStatus")}</p>
              <Button variant="ghost" size="sm" onClick={() => navigate("/branches")}>{t("common.all")}</Button>
            </div>
            {branches.length === 0 ? (
              <EmptyState icon={GitBranch} title={t("common.noResults")} className="py-8" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {branches.map((b, i) => (
                  <BranchCard
                    key={b.id}
                    branch={b}
                    openShift={shiftResults[i]?.data?.open_shift ?? null}
                    sales={todaySalesResults[i]?.data}
                    lowStockCount={stockResults[i]?.data?.items.length ?? 0}
                    onOpen={() => openBranch(b.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
