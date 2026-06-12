import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Copy, Edit2, Percent, Plus, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { EditableGrid, type EditableColumn } from "@/shared/ui/editable-grid";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { runBulk } from "@/shared/lib/bulk-runner";
import {
  createMenuItem, updateMenuItem, getMenuItem, upsertSize, upsertDrinkRecipe,
  getListMenuItemsQueryKey, getGetMenuItemQueryKey,
} from "@/shared/api/generated/api";
import { getListSkuCostsQueryKey } from "@/entities/costing/queries";
import { ItemCostCell } from "@/entities/costing/cost-cells";
import { getErrorMessage } from "@/shared/api/errors";
import { getTranslatedName } from "@/shared/lib/translation";
import type { SkuCost } from "@/shared/api/generated/models";
import type { Category, MenuItem } from "@/shared/types";

/** Bulk price adjustment over the selected rows: "+N EGP" or "×N %". */
function BulkPriceDialog({
  open,
  onClose,
  rows,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  rows: MenuItem[];
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"add" | "multiply">("add");
  const [value, setValue] = useState("");
  const [running, setRunning] = useState(false);

  const apply = async () => {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) return;
    setRunning(true);
    try {
      const { failed } = await runBulk(rows, (item) => {
        const next =
          mode === "add"
            ? item.base_price + Math.trunc(n * 100) // EGP → piastres
            : Math.trunc(item.base_price * (n / 100));
        return updateMenuItem(item.id, { base_price: Math.max(0, next) } as never);
      });
      if (failed.length > 0) {
        toast.error(t("menu.grid.bulkSummaryFailed", { ok: rows.length - failed.length, failed: failed.length }));
      } else {
        toast.success(t("menu.grid.bulkSummary", { count: rows.length }));
      }
      onDone();
      onClose();
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{t("menu.grid.bulkPrice", { count: rows.length })}</DialogTitle></DialogHeader>
        <DialogBody>
          <div className="flex gap-2">
            <Select value={mode} onValueChange={(v) => setMode(v as "add" | "multiply")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="add">{t("menu.grid.addEgp")}</SelectItem>
                <SelectItem value="multiply">{t("menu.grid.multiplyPct")}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="any"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === "add" ? "5" : "110"}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {mode === "add" ? t("menu.grid.addEgpHint") : t("menu.grid.multiplyPctHint")}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="button" loading={running} onClick={apply}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ItemsGrid({
  orgId,
  items,
  categories,
  skuCostsByItem,
  isLoading,
  onEditFull,
  onDelete,
  onAdd,
}: {
  orgId: string;
  items: MenuItem[];
  categories: Category[];
  skuCostsByItem: Map<string, SkuCost[]>;
  isLoading: boolean;
  onEditFull: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onAdd: () => void;
}) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [bulkRows, setBulkRows] = useState<MenuItem[] | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
    qc.invalidateQueries({ queryKey: getListSkuCostsQueryKey() });
  };

  const commitRow = async (item: MenuItem, patch: Record<string, unknown>) => {
    try {
      await updateMenuItem(item.id, patch as never);
      invalidate();
      qc.invalidateQueries({ queryKey: getGetMenuItemQueryKey(item.id) });
      toast.success(t("common.save"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  /** GET → POST "(copy)" → replay sizes → replay recipe lines. */
  const duplicate = async (item: MenuItem) => {
    try {
      const full = await getMenuItem(item.id);
      const created = await createMenuItem({
        org_id: orgId,
        name: `${full.name} (copy)`,
        name_translations: full.name_translations,
        description: full.description,
        description_translations: full.description_translations,
        base_price: full.base_price,
        category_id: full.category_id,
        is_active: false, // copies start inactive so they don't leak to the POS mid-edit
        display_order: full.display_order,
      } as never);
      for (const s of full.sizes ?? []) {
        await upsertSize(created.id, {
          label: s.label,
          price_override: s.price_override,
          display_order: s.display_order,
        } as never);
      }
      for (const r of full.recipes ?? []) {
        await upsertDrinkRecipe(created.id, {
          size_label: r.size_label,
          org_ingredient_id: r.org_ingredient_id,
          ingredient_name: r.ingredient_name,
          ingredient_unit: r.ingredient_unit,
          quantity_used: r.quantity_used,
        } as never);
      }
      invalidate();
      toast.success(t("menu.grid.duplicated", { name: full.name }));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  /** Paste-to-create fan-out (bounded concurrency, per-row failures survive). */
  const createFromPaste = async (rows: Record<string, string>[]) => {
    const byName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.id]));
    const { ok, failed } = await runBulk(rows, (row) => {
      // create contract requires category_id — unknown names fail the row
      const categoryId = byName.get((row.category ?? "").trim().toLowerCase());
      if (!categoryId) return Promise.reject(new Error(row.category ?? ""));
      return createMenuItem({
        org_id: orgId,
        name: row.name,
        base_price: Math.trunc(parseFloat(row.base_price) * 100),
        category_id: categoryId,
        description: row.description || null,
        is_active: true,
        display_order: 0,
      } as never);
    });
    invalidate();
    if (failed.length > 0) {
      toast.error(t("menu.grid.bulkCreateFailed", { ok: ok.length, failed: failed.length }), {
        action: {
          label: t("menu.grid.retryFailed"),
          onClick: () => void createFromPaste(failed.map((f) => f.row)),
        },
      });
    } else {
      toast.success(t("menu.grid.bulkCreated", { count: ok.length }));
    }
  };

  const columns: EditableColumn<MenuItem>[] = useMemo(() => [
    {
      key: "name",
      header: t("common.name"),
      type: "text",
      getValue: (m) => m.name,
      renderDisplay: (m) => <span className="font-semibold text-sm">{getTranslatedName(m, i18n.language)}</span>,
    },
    {
      key: "base_price",
      header: t("common.price"),
      type: "money",
      getValue: (m) => m.base_price,
    },
    {
      key: "category_id",
      header: t("common.category"),
      type: "select",
      options: categories.map((c) => ({ value: c.id, label: c.name })),
      getValue: (m) => m.category_id ?? "",
    },
    {
      key: "is_active",
      header: t("common.active"),
      type: "boolean",
      getValue: (m) => m.is_active,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [categories, i18n.language, t]);

  const extraColumns: ColumnDef<MenuItem>[] = useMemo(() => [
    {
      id: "cost",
      header: t("menu.costMargin"),
      cell: ({ row }) => <ItemCostCell skus={skuCostsByItem.get(row.original.id) ?? []} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="iconSm" title={t("menu.grid.fullEditor")} onClick={() => onEditFull(row.original)}>
            <Edit2 size={13} />
          </Button>
          <Button variant="ghost" size="iconSm" title={t("menu.grid.duplicate")} onClick={() => void duplicate(row.original)}>
            <Copy size={13} />
          </Button>
          <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => onDelete(row.original)}>
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [skuCostsByItem, t]);

  const getRowId = useCallback((m: MenuItem) => m.id, []);

  return (
    <>
      <EditableGrid<MenuItem>
        rows={items}
        getRowId={getRowId}
        columns={columns}
        extraColumns={extraColumns}
        onCommitRow={commitRow}
        onAddRow={onAdd}
        addRowLabel={t("menu.addItem")}
        searchKey="name"
        isLoading={isLoading}
        bulkActions={(selected, clear) => (
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => {
              setBulkRows(selected);
              clear();
            }}
          >
            <Percent size={13} /> {t("menu.grid.bulkPriceAction")}
          </Button>
        )}
        onPasteRows={createFromPaste}
        pasteColumns={[
          { key: "name", header: t("common.name") },
          { key: "base_price", header: `${t("common.price")} (EGP)` },
          { key: "category", header: t("common.category") },
          { key: "description", header: t("common.description") },
        ]}
        pasteValidate={(row) => {
          if (!row.name?.trim()) return t("menu.grid.nameRequired");
          const p = parseFloat(row.base_price);
          if (!Number.isFinite(p) || p < 0) return t("menu.grid.priceInvalid");
          const known = categories.some((c) => c.name.trim().toLowerCase() === (row.category ?? "").trim().toLowerCase());
          if (!known) return t("menu.grid.categoryUnknown");
          return null;
        }}
      />
      {bulkRows && (
        <BulkPriceDialog
          open={!!bulkRows}
          onClose={() => setBulkRows(null)}
          rows={bulkRows}
          onDone={invalidate}
        />
      )}
      {/* keep an explicit add affordance for empty grids */}
      {items.length === 0 && !isLoading && (
        <Button size="sm" variant="outline" onClick={onAdd} className="gap-1 mt-2">
          <Plus size={13} /> {t("menu.addItem")}
        </Button>
      )}
    </>
  );
}
