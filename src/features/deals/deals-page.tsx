/**
 * Menu › Deals: mix & match ("any 2 bites for 90") and buy X get Y ("buy 2
 * coffees, get a cookie"). A deal is its own small rule over the cart, not a
 * menu item; it shows in the Bundles report next to the combos.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { BadgePercent, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Restricted } from "@/components/app/restricted";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { usePageSearch } from "@/data/scope/use-page-search";
import { Cap } from "@/generated/capabilities";
import { getTranslatedName } from "@/lib/translation";
import { deleteDeal, useDeals } from "@/features/combos/api";
import { arOf } from "@/features/combos/types";
import type { DealRule } from "@/features/combos/types";
import { useMenuOptions } from "@/features/combos/use-menu-options";
import { invalidateCombos, windowSummary } from "@/features/combos/util";

import { DealDialog } from "./deal-dialog";
import { dealRuleText, poolText } from "./util";

export function DealsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const confirm = useConfirm();
  const authz = useAuthz();
  const canRead = authz.can(Cap.menuItemsRead);
  const canEdit = authz.can(Cap.menuDealsEdit);

  const q = useDeals({}, { enabled: canRead });
  const menu = useMenuOptions(canRead);
  const deals = useMemo(() => [...(q.data ?? [])].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)), [q.data]);

  const [s, update] = usePageSearch<{ edit: string }>();
  const editing = s.edit && s.edit !== "new" ? (deals.find((d) => d.id === s.edit) ?? null) : null;
  const dialogOpen = s.edit === "new" ? canEdit : !!editing;

  const remove = async (d: DealRule) => {
    const name = getTranslatedName(d, lang);
    const ok = await confirm({
      title: t("deals.deleteTitle", { defaultValue: "Delete {{name}}?", name }),
      description: t("deals.deleteBody", "Tills stop suggesting it and checkout stops applying it. Orders that used it keep it, and it stays in the Bundles report."),
      confirmLabel: t("common.delete", "Delete"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteDeal(d.id);
      toast.success(t("deals.deleted", "Deal deleted"));
      void invalidateCombos();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columns = useMemo<ColumnDef<DealRule>[]>(
    () => [
      {
        id: "name",
        header: t("deals.col.name", "Deal"),
        meta: { phone: "title" },
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{d.name}</p>
              {arOf(d.name_translations) ? (
                <p dir="rtl" className="truncate text-xs text-muted-foreground">
                  {arOf(d.name_translations)}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "rule",
        header: t("deals.col.rule", "Rule"),
        meta: { label: t("deals.col.rule", "Rule") },
        cell: ({ row }) => <span className="text-sm">{dealRuleText(t, row.original)}</span>,
      },
      {
        id: "pool",
        header: t("deals.col.pool", "Counts"),
        meta: { label: t("deals.col.pool", "Counts") },
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
            {poolText(t, row.original.pool, menu)}
            {row.original.reward_pool.length ? ` → ${poolText(t, row.original.reward_pool, menu)}` : ""}
          </span>
        ),
      },
      {
        id: "when",
        header: t("deals.col.when", "When"),
        meta: { label: t("deals.col.when", "When") },
        cell: ({ row }) => {
          const w = row.original.windows;
          return (
            <span className="text-sm text-muted-foreground">
              {w.length === 0
                ? t("combos.windows.always", "Always available")
                : w.length === 1
                  ? windowSummary(t, w[0], menu.branchName)
                  : t("deals.windowsCount", { defaultValue: "{{count}} windows", count: w.length })}
            </span>
          );
        },
      },
      {
        id: "status",
        header: t("combos.col.status", "Status"),
        meta: { label: t("combos.col.status", "Status") },
        cell: ({ row }) => {
          const d = row.original;
          const exceptions = d.branch_overrides.length;
          return (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <StatusPill tone={d.is_active ? "success" : "neutral"}>{d.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")}</StatusPill>
              {exceptions > 0 ? (
                <StatusPill tone="info" size="sm">
                  {t("deals.branchExceptions", { defaultValue: "{{count}} branch exceptions", count: exceptions })}
                </StatusPill>
              ) : null}
            </span>
          );
        },
      },
    ],
    [t, menu],
  );

  if (authz.ready && !canRead) return <Restricted title={t("deals.title", "Deals")} />;

  return (
    <Page>
      <PageHeader
        title={t("deals.title", "Deals")}
        description={t(
          "deals.subtitle",
          "Mix and match and buy X get Y. The till suggests a deal when the cart qualifies; QR and online checkout apply the best one.",
        )}
        actions={
          canEdit ? (
            <Button onClick={() => update({ edit: "new" })}>
              <Plus className="size-4" /> {t("deals.new", "New deal")}
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={deals}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => void q.refetch()}
        getRowId={(d) => d.id}
        onRowClick={(d) => update({ edit: d.id })}
        rowActions={(d) =>
          canEdit ? (
            <>
              <Button variant="ghost" size="icon-sm" aria-label={t("common.edit", "Edit")} onClick={() => update({ edit: d.id })}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={t("common.delete", "Delete")} onClick={() => void remove(d)}>
                <Trash2 className="size-4" />
              </Button>
            </>
          ) : null
        }
        emptyState={
          <EmptyState
            icon={BadgePercent}
            title={t("deals.empty", "No deals yet")}
            description={t("deals.emptyHint", "For example: any two pastries for 90, or buy two coffees and get a cookie free.")}
            action={
              canEdit ? (
                <Button onClick={() => update({ edit: "new" })}>
                  <Plus className="size-4" /> {t("deals.new", "New deal")}
                </Button>
              ) : undefined
            }
          />
        }
      />
      <DealDialog
        deal={editing}
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) update({ edit: undefined });
        }}
        menu={menu}
        canEdit={canEdit}
        nextSort={deals.length}
      />
    </Page>
  );
}
