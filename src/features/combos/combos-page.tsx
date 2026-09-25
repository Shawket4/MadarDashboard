/**
 * Menu › Combos: every combo (a menu item of kind `combo`) with what an owner
 * checks at a glance — price, how many slots, whether it's a fixed bundle,
 * whether it can be sold right now, and its default margin with a warning
 * chip when the server has something to say.
 *
 * Channels are not per combo (§11.1): one org-wide switch per channel, with
 * branch overrides, under Settings. The header links there.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowRight, Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

import { AssetImage, assetOf } from "@/components/app/asset-image";
import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Restricted } from "@/components/app/restricted";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListCategories } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useOrgId } from "@/hooks/use-org-id";
import { fmtMoney } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { useDebounced } from "@/lib/use-debounced";

import { deleteCombo, useCombos } from "./api";
import { arOf } from "./types";
import type { ComboSummary } from "./types";
import { fmtRate, invalidateCombos } from "./util";

const ALL = "__all__";
const PER_PAGE = 25;

export function CombosPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const orgId = useOrgId();
  const authz = useAuthz();
  const canRead = authz.can(Cap.menuItemsRead);
  const canEdit = authz.can(Cap.menuCombosEdit);
  const canSettings = authz.canAny(Cap.orgSettingsRead, Cap.menuCombosEdit);

  const [search, setSearch] = useState("");
  const q = useDebounced(search, 300);
  const [category, setCategory] = useState(ALL);
  const [active, setActive] = useState(ALL);
  const [pageIndex, setPageIndex] = useState(0);
  useEffect(() => setPageIndex(0), [q, category, active]);

  const params = useMemo(
    () => ({
      q: q || undefined,
      category_id: category === ALL ? undefined : category,
      is_active: active === ALL ? undefined : active === "active",
      page: pageIndex + 1,
      per_page: PER_PAGE,
    }),
    [q, category, active, pageIndex],
  );
  const list = useCombos(params, { enabled: canRead && !!orgId });
  const categories = useListCategories({ org_id: orgId ?? "" }, { query: { enabled: canRead && !!orgId } });
  const categoryName = useMemo(() => {
    const m = new Map((categories.data ?? []).map((c) => [c.id, getTranslatedName(c, lang)]));
    return (id: string | null | undefined) => (id ? (m.get(id) ?? "—") : "—");
  }, [categories.data, lang]);

  const open = (id: string) => void navigate({ to: "/menu/combos/$comboId", params: { comboId: id } });

  const remove = async (c: ComboSummary) => {
    const name = getTranslatedName(c, lang);
    const ok = await confirm({
      title: t("combos.deleteTitle", { defaultValue: "Delete {{name}}?", name }),
      description: t(
        "combos.deleteBody",
        "It leaves the menu at every branch and on every channel. Past orders keep their lines and still show in the Bundles report.",
      ),
      confirmLabel: t("common.delete", "Delete"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteCombo(c.id);
      toast.success(t("combos.deleted", "Combo deleted"));
      void invalidateCombos();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columns = useMemo<ColumnDef<ComboSummary>[]>(
    () => [
      {
        id: "name",
        header: t("combos.col.name", "Combo"),
        meta: { phone: "title" },
        cell: ({ row }) => {
          const c = row.original;
          const ar = arOf(c.name_translations);
          return (
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-muted-foreground">
                {c.image_url || assetOf(c) ? (
                  <AssetImage asset={assetOf(c)} legacyUrl={c.image_url} sizes="128px" className="size-full object-cover" />
                ) : (
                  <UtensilsCrossed aria-hidden className="size-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5 truncate text-sm font-semibold">
                  {c.name}
                  {c.is_fixed ? <Badge variant="secondary">{t("combos.fixed", "Fixed")}</Badge> : null}
                </p>
                {ar ? (
                  <p dir="rtl" className="truncate text-xs text-muted-foreground">
                    {ar}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: "category",
        header: t("combos.col.category", "Category"),
        meta: { label: t("combos.col.category", "Category") },
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{categoryName(row.original.category_id)}</span>,
      },
      {
        id: "price",
        header: t("combos.col.price", "Price"),
        meta: { numeric: true, label: t("combos.col.price", "Price") },
        cell: ({ row }) => <span className="font-semibold">{fmtMoney(row.original.price)}</span>,
      },
      {
        id: "slots",
        header: t("combos.col.slots", "Slots"),
        meta: { numeric: true, label: t("combos.col.slots", "Slots") },
        cell: ({ row }) => row.original.slot_count,
      },
      {
        id: "margin",
        header: t("combos.col.margin", "Margin"),
        meta: { numeric: true, label: t("combos.col.margin", "Margin") },
        cell: ({ row }) => {
          const c = row.original;
          return (
            <span className="inline-flex items-center justify-end gap-1.5">
              {c.warning_count > 0 ? (
                <StatusPill tone="warning" size="sm" icon={AlertTriangle}>
                  {t("combos.warningCount", { defaultValue: "{{count}} warnings", count: c.warning_count })}
                </StatusPill>
              ) : null}
              <bdi>{fmtRate(c.margin_default)}</bdi>
            </span>
          );
        },
      },
      {
        id: "status",
        header: t("combos.col.status", "Status"),
        meta: { label: t("combos.col.status", "Status") },
        cell: ({ row }) => {
          const c = row.original;
          if (!c.is_active) return <StatusPill tone="neutral">{t("common.inactive", "Inactive")}</StatusPill>;
          return c.available_now ? (
            <StatusPill tone="success">{t("combos.availableNow", "On sale now")}</StatusPill>
          ) : (
            <StatusPill tone="accent">{t("combos.notNow", "Not on sale now")}</StatusPill>
          );
        },
      },
    ],
    [t, categoryName],
  );

  if (authz.ready && !canRead) {
    return <Restricted title={t("combos.title", "Combos")} who={t("combos.noAccess", "Your account can't see the menu. The owner can give you access.")} />;
  }

  const data = list.data?.data ?? [];
  const pageCount = list.data?.total_pages ?? 0;
  const filtered = !!(q || category !== ALL || active !== ALL);

  return (
    <Page>
      <PageHeader
        title={t("combos.title", "Combos")}
        description={t(
          "combos.subtitle",
          "Meal deals and fixed bundles: a set price for items picked from slots. Each item keeps its own recipe, station and stock.",
        )}
        actions={
          <>
            {canSettings ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/settings/combos">
                  {t("combos.channelsLink", "Channels and margin")}
                  <ArrowRight aria-hidden className="size-3.5 rtl:rotate-180" />
                </Link>
              </Button>
            ) : null}
            {canEdit ? (
              <Button onClick={() => open("new")}>
                <Plus className="size-4" /> {t("combos.new", "New combo")}
              </Button>
            ) : null}
          </>
        }
        below={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search aria-hidden className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("combos.searchPlaceholder", "Search combos")}
                aria-label={t("combos.searchPlaceholder", "Search combos")}
                className="h-9 ps-8"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-auto min-w-40" aria-label={t("combos.col.category", "Category")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("combos.allCategories", "All categories")}</SelectItem>
                {(categories.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {getTranslatedName(c, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={active} onValueChange={setActive}>
              <SelectTrigger className="h-9 w-auto min-w-32" aria-label={t("combos.col.status", "Status")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("combos.allStatuses", "Active and inactive")}</SelectItem>
                <SelectItem value="active">{t("common.active", "Active")}</SelectItem>
                <SelectItem value="inactive">{t("common.inactive", "Inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        loading={list.isLoading}
        error={list.error}
        onRetry={() => void list.refetch()}
        getRowId={(c) => c.id}
        onRowClick={(c) => open(c.id)}
        rowActions={(c) =>
          canEdit ? (
            <>
              <Button variant="ghost" size="icon-sm" aria-label={t("common.edit", "Edit")} onClick={() => open(c.id)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                aria-label={t("common.delete", "Delete")}
                onClick={() => void remove(c)}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          ) : null
        }
        manualPagination
        pageCount={pageCount}
        pagination={{ pageIndex, pageSize: PER_PAGE }}
        onPaginationChange={(u) => setPageIndex((typeof u === "function" ? u({ pageIndex, pageSize: PER_PAGE }) : u).pageIndex)}
        emptyState={
          <EmptyState
            icon={UtensilsCrossed}
            title={filtered ? t("combos.emptyFiltered", "No combo matches these filters") : t("combos.empty", "No combos yet")}
            description={
              filtered
                ? undefined
                : t(
                    "combos.emptyHint",
                    "A combo sells several items at one price: a burger meal with a side and a drink, or a coffee and a cake.",
                  )
            }
            action={
              canEdit && !filtered ? (
                <Button onClick={() => open("new")}>
                  <Plus className="size-4" /> {t("combos.new", "New combo")}
                </Button>
              ) : undefined
            }
          />
        }
      />
    </Page>
  );
}
