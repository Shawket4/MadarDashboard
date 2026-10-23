import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Archive } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { AxiosError } from "axios";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/app/status-pill";
import { ErrorState } from "@/components/app/empty-state";
import {
  archiveCatalogItem,
  unarchiveCatalogItem,
  useGetCatalogItemUsage,
  useListCatalog,
} from "@/data/api/generated/api";
import type { IngredientUsageRef, OrgIngredient } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtNumber, fmtUnit } from "@/lib/format";
import { invalidateInventory } from "./lib";
import { useOrgId } from "@/hooks/use-org-id";

/**
 * Archiving an ingredient (2026-10-18). An archived ingredient leaves the
 * pickers, the count sheets (once no branch holds stock) and the reorder
 * suggestions; recipes that use it keep deducting it, and history keeps
 * showing it with this badge. The catalog list (`GET …/catalog`, no status)
 * still returns it with `archived_at`, so name and cost lookups never go blank.
 */

/** Offered in a picker: active and not archived. */
export const isPickable = (c: Pick<OrgIngredient, "is_active" | "archived_at">): boolean => c.is_active && !c.archived_at;

/**
 * Picker filter that keeps whatever is already chosen, so a saved line that
 * uses an archived ingredient still shows its name instead of "Select…".
 */
export const pickableOrChosen = <T extends Pick<OrgIngredient, "id" | "is_active" | "archived_at">>(
  catalog: readonly T[],
  chosen: Iterable<string | null | undefined> = [],
): T[] => {
  const keep = new Set<string>();
  for (const id of chosen) if (id) keep.add(id);
  return catalog.filter((c) => isPickable(c) || keep.has(c.id));
};

/** The ids of the org's archived ingredients (from the shared catalog query). */
export function useArchivedIngredientIds(orgId: string | null | undefined): ReadonlySet<string> {
  const catalog = useListCatalog(orgId ?? "", undefined, { query: { enabled: !!orgId } });
  return useMemo(() => new Set((catalog.data ?? []).filter((c) => c.archived_at).map((c) => c.id)), [catalog.data]);
}

/** "Archived" beside an ingredient's name, wherever history shows one. */
export function ArchivedBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <StatusPill tone="neutral" icon={Archive} size="sm" className={className}>
      {t("inventory.archive.badge", "Archived")}
    </StatusPill>
  );
}

/**
 * An ingredient's name in a history view (reports, counts, transfers, POs),
 * with the "Archived" badge when the shared catalog says it is archived.
 */
export function IngredientName({ id, name, className }: { id: string | null | undefined; name: string; className?: string }) {
  const archivedIds = useArchivedIngredientIds(useOrgId());
  return (
    <span className={className ?? "inline-flex flex-wrap items-center gap-2"}>
      <span className="font-medium">{name}</span>
      {id && archivedIds.has(id) ? <ArchivedBadge /> : null}
    </span>
  );
}

const KIND_ORDER = ["recipe", "modifier_option", "swap", "recipe_base", "packaging_rule", "purchase_order", "stocktake", "transfer"] as const;

/** The archived ingredient a create/rename collided with (409 `INGREDIENT_NAME_ARCHIVED`), if any. */
export function archivedNameHolder(err: unknown): string | null {
  if (!(err instanceof AxiosError)) return null;
  const data = err.response?.data as { code?: unknown; vars?: { ingredient_id?: unknown } } | undefined;
  return data?.code === "INGREDIENT_NAME_ARCHIVED" && typeof data.vars?.ingredient_id === "string" ? data.vars.ingredient_id : null;
}

/** Unarchive, then refresh every inventory read. */
export async function unarchiveIngredient(orgId: string, item: Pick<OrgIngredient, "id" | "name">, t: (k: string, d: string, o?: Record<string, unknown>) => string) {
  try {
    await unarchiveCatalogItem(orgId, item.id);
    await invalidateInventory();
    toast.success(t("inventory.archive.unarchived", "{{name}} is active again", { name: item.name }));
    return true;
  } catch (e) {
    toast.error(getErrorMessage(e));
    return false;
  }
}

interface ArchiveDialogProps {
  orgId: string;
  item: Pick<OrgIngredient, "id" | "name" | "unit"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchived?: () => void;
}

/**
 * Archive confirmation: what still uses the ingredient and what stock it
 * holds, read from `GET …/usage`. Archiving changes neither: those recipes
 * keep deducting it and the stock stays until it is counted or wasted down.
 */
export function ArchiveIngredientDialog({ orgId, item, open, onOpenChange, onArchived }: ArchiveDialogProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const usage = useGetCatalogItemUsage(orgId, item?.id ?? "", { query: { enabled: open && !!item, staleTime: 0 } });
  const data = usage.data;

  const groups = useMemo(() => {
    const by = new Map<string, IngredientUsageRef[]>();
    for (const u of data?.usages ?? []) by.set(u.kind, [...(by.get(u.kind) ?? []), u]);
    return KIND_ORDER.filter((k) => by.has(k)).map((k) => ({ kind: k, rows: by.get(k)! }));
  }, [data]);

  const kindLabel = (kind: string): string => {
    switch (kind) {
      case "recipe": return t("inventory.archive.kind.recipe", "Menu recipes");
      case "modifier_option": return t("inventory.archive.kind.modifierOption", "Add-ons and options");
      case "swap": return t("inventory.archive.kind.swap", "Swaps");
      case "recipe_base": return t("inventory.archive.kind.recipeBase", "Recipe bases");
      case "packaging_rule": return t("inventory.archive.kind.packagingRule", "Packaging rules");
      case "purchase_order": return t("inventory.archive.kind.purchaseOrder", "Open purchase orders");
      case "stocktake": return t("inventory.archive.kind.stocktake", "Open stock counts");
      case "transfer": return t("inventory.archive.kind.transfer", "Open transfers");
      default: return kind;
    }
  };

  const archive = async () => {
    if (!item) return;
    setBusy(true);
    try {
      await archiveCatalogItem(orgId, item.id, { confirm: true });
      await invalidateInventory();
      toast.success(t("inventory.archive.archived", "{{name}} archived", { name: item.name }));
      onOpenChange(false);
      onArchived?.();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent data-testid="archive-ingredient-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-balance">
            {t("inventory.archive.title", "Archive {{name}}?", { name: item?.name ?? "" })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-pretty">
            {t(
              "inventory.archive.consequence",
              "It leaves ingredient pickers, stock counts and reorder suggestions. Its history stays, and you can unarchive it any time.",
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {usage.isLoading ? (
          <div className="space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>
        ) : usage.error ? (
          <ErrorState message={getErrorMessage(usage.error)} onRetry={() => void usage.refetch()} className="py-6" />
        ) : data ? (
          <div className="max-h-[50vh] space-y-3 overflow-y-auto text-sm">
            {groups.length ? (
              <section className="space-y-1.5" data-testid="archive-usages">
                <h3 className="font-medium">{t("inventory.archive.stillUsed", "Still used in")}</h3>
                <p className="text-muted-foreground">
                  {t("inventory.archive.keepsDeducting", "These keep deducting and costing it after you archive it. Remove it from them if they should stop.")}
                </p>
                {groups.map((g) => (
                  <div key={g.kind}>
                    <p className="text-xs font-medium text-muted-foreground">{kindLabel(g.kind)} · {fmtNumber(g.rows.length)}</p>
                    <ul className="ms-4 list-disc">
                      {g.rows.map((u) => (
                        <li key={`${u.kind}-${u.id}-${u.detail ?? ""}`}>
                          {u.name}{u.detail ? <span className="text-muted-foreground"> · {u.detail}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ) : null}
            {data.stock.length ? (
              <section className="space-y-1.5" data-testid="archive-stock">
                <h3 className="font-medium">{t("inventory.archive.onHand", "Stock on hand")}</h3>
                <ul className="space-y-0.5">
                  {data.stock.map((s) => (
                    <li key={s.branch_id} className="flex justify-between gap-3">
                      <span>{s.branch_name}</span>
                      <span className="tabular-nums">{fmtNumber(s.on_hand)} {fmtUnit(item?.unit ?? data.unit)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground">
                  {t("inventory.archive.stockStays", "Archiving doesn't change stock. Those branches still see it in counts until it is counted or wasted down to zero.")}
                </p>
              </section>
            ) : null}
            {!groups.length && !data.stock.length ? (
              <p className="text-muted-foreground">{t("inventory.archive.unused", "Nothing uses it and no branch holds any.")}</p>
            ) : null}
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t("common.cancel", "Cancel")}</AlertDialogCancel>
          <Button onClick={() => void archive()} disabled={busy || !data} data-testid="archive-confirm">
            <Archive className="size-4" />
            {t("inventory.archive.action", "Archive")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
