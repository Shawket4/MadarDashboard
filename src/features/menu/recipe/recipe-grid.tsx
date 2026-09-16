import { useMemo, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, ArrowRight, Copy, Lock, MoreHorizontal, Plus, Scaling, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import type { OrgIngredient } from "@/data/api/generated/models";
import { currencyLabel, egpToPiastres, fmtMoney, fmtPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FixCostPopover } from "../studio/fix-cost-popover";
import { newBlockKey, type RecipeLineDraft, type SizeBlockDraft } from "../studio/util";
import {
  addRow,
  buildGridRows,
  copyColumn,
  removeRow,
  scaleColumn,
  setCell,
  swapGroupFor,
  type GridRow,
  type SwapGroupInfo,
} from "./grid-model";

interface Props {
  blocks: SizeBlockDraft[];
  setBlocks: Dispatch<SetStateAction<SizeBlockDraft[]>>;
  recipeDirtyKeys: Set<string>;
  catalogById: Map<string, OrgIngredient>;
  ingredientOptions: ComboboxOption[];
  orgId: string | null;
  onCostFixed: () => void;
  /** Groups attached to the item (for the "swappable" badge). */
  swapGroups: SwapGroupInfo[];
  /** Recipe base names by id (for "Base: <name>" tags). */
  baseNames: Map<string, string>;
  /** Name of the item this one's recipe follows; set = the whole recipe is read-only. */
  followsName: string | null;
  /** Rendered above the grid (base picker, link state). */
  toolbar?: React.ReactNode;
}

const costOf = (catalogById: Map<string, OrgIngredient>, id: string): number | null => {
  const c = catalogById.get(id);
  return c?.cost_per_unit != null && c.cost_per_unit > 0 ? c.cost_per_unit : null;
};

const estimateFor = (catalogById: Map<string, OrgIngredient>, lines: RecipeLineDraft[]) => {
  let sum = 0;
  let incomplete = false;
  for (const l of lines) {
    if (l.quantity.trim() === "") continue;
    const qty = Number(l.quantity);
    const unitCost = costOf(catalogById, l.ingredient_id);
    if (!l.ingredient_id || unitCost == null || !Number.isFinite(qty)) {
      incomplete = true;
      continue;
    }
    sum += unitCost * qty;
  }
  return { piastres: sum, incomplete };
};

/** Move focus to the cell `dr` rows away in the same column. */
const moveFocus = (e: KeyboardEvent<HTMLInputElement>, dr: number) => {
  const el = e.currentTarget;
  const row = Number(el.dataset.row);
  const col = el.dataset.col;
  const next = document.querySelector<HTMLInputElement>(`input[data-grid="recipe"][data-row="${row + dr}"][data-col="${col}"]`);
  if (next) {
    e.preventDefault();
    next.focus();
    next.select();
  }
};

const onCellKey = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "ArrowDown" || (e.key === "Enter" && !e.shiftKey)) moveFocus(e, 1);
  else if (e.key === "ArrowUp" || (e.key === "Enter" && e.shiftKey)) moveFocus(e, -1);
};

/** Only digits and one decimal point, as typed. */
const cleanQty = (v: string) => v.replace(/,/g, ".").replace(/[^\d.]/g, "");

/**
 * The Studio recipe grid: rows = ingredients, columns = sizes, cells = quantity in
 * the ingredient's unit, with a Price row on top. Lines expanded from a recipe base,
 * a packaging rule or a linked source render greyed and read-only; the page's save
 * only sends own lines, and only for sizes that changed.
 */
export function RecipeGrid({
  blocks,
  setBlocks,
  recipeDirtyKeys,
  catalogById,
  ingredientOptions,
  orgId,
  onCostFixed,
  swapGroups,
  baseNames,
  followsName,
  toolbar,
}: Props) {
  const { t } = useTranslation();
  const readOnly = followsName != null;
  const [scaleFor, setScaleFor] = useState<string | null>(null);

  const rows = useMemo(() => buildGridRows(blocks), [blocks]);
  const ownRowIds = useMemo(() => new Set(rows.filter((r) => r.source === "own").map((r) => r.ingredient_id)), [rows]);
  const addableOptions = useMemo(
    () => ingredientOptions.filter((o) => !ownRowIds.has(o.value)),
    [ingredientOptions, ownRowIds],
  );

  const patchBlock = (key: string, patch: Partial<SizeBlockDraft>) =>
    setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  const moveBlock = (key: string, dir: -1 | 1) =>
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.key === key);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  const addBlock = () =>
    setBlocks((prev) => [
      ...prev,
      {
        key: newBlockKey(),
        label: "",
        price: "0",
        seededLabel: null,
        seededPrice: null,
        serverCost: null,
        baseId: null,
        // A new size starts with the same own rows (blank) so the grid stays rectangular.
        lines: buildGridRows(prev)
          .filter((r) => r.source === "own")
          .map((r) => ({ ingredient_id: r.ingredient_id, quantity: "", unit: r.unit, source: "own" as const })),
      },
    ]);

  const sourceTag = (row: GridRow): string | null => {
    if (row.source === "base") {
      const b = blocks.find((bl) => bl.key === row.blockKeys[0]);
      const name = (b?.baseId && baseNames.get(b.baseId)) || "—";
      return t("modeling.grid.tagBase", "Base: {{name}}", { name });
    }
    if (row.source === "rule") return t("modeling.grid.tagRule", "Packaging rule");
    if (row.source === "linked") return t("modeling.grid.tagLinked", "Follows {{name}}", { name: followsName ?? "—" });
    return null;
  };

  const slugOf = (id: string) => catalogById.get(id)?.category_slug;

  const columns = useMemo<ColumnDef<GridRow>[]>(() => {
    const ingredientCol: ColumnDef<GridRow> = {
      id: "ingredient",
      header: () => t("recipes.ingredient", "Ingredient"),
      cell: ({ row }) => {
        const r = row.original;
        const ing = catalogById.get(r.ingredient_id);
        const tag = sourceTag(r);
        const swapGroup = r.source !== "rule" ? swapGroupFor(ing?.category_slug, swapGroups, slugOf) : null;
        const uncosted = !!ing && costOf(catalogById, r.ingredient_id) == null;
        return (
          <div className="flex min-w-40 flex-col gap-1">
            <span className={cn("text-sm font-medium", r.source !== "own" && "text-muted-foreground")}>
              {ing?.name ?? t("modeling.grid.unknownIngredient", "Unknown ingredient")}
            </span>
            <span className="flex flex-wrap items-center gap-1">
              {tag ? (
                <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
                  <Lock className="size-3" aria-hidden="true" />
                  {tag}
                </Badge>
              ) : null}
              {swapGroup ? (
                <Badge variant="secondary" className="font-normal">
                  {t("modeling.grid.swappable", "swappable · default of {{group}}", { group: swapGroup })}
                </Badge>
              ) : null}
              {uncosted && !readOnly ? <FixCostPopover ingredient={ing} orgId={orgId} onFixed={onCostFixed} /> : null}
            </span>
          </div>
        );
      },
    };

    const sizeCols: ColumnDef<GridRow>[] = blocks.map((b) => ({
      id: `size:${b.key}`,
      header: () => b.label,
      cell: ({ row }) => {
        const r = row.original;
        const value = r.cells[b.key];
        const unitLabel = t(`units.${r.unit}`, r.unit);
        const editable = r.source === "own" && !readOnly;
        if (!editable) {
          return (
            <span className="block text-end text-sm tabular-nums text-muted-foreground">
              {value !== undefined ? `${value} ${unitLabel}` : "—"}
            </span>
          );
        }
        return (
          <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/50">
            <Input
              type="text"
              inputMode="decimal"
              data-grid="recipe"
              data-row={row.index}
              data-col={b.key}
              value={value ?? ""}
              placeholder="—"
              aria-label={t("modeling.grid.cellAria", "{{ingredient}} in {{size}}", {
                ingredient: catalogById.get(r.ingredient_id)?.name ?? "",
                size: b.label,
              })}
              onKeyDown={onCellKey}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) =>
                setBlocks((prev) => setCell(prev, b.key, r.ingredient_id, cleanQty(e.target.value), r.unit))
              }
              className="h-8 w-20 border-0 bg-transparent text-end tabular-nums shadow-none focus-visible:ring-0"
            />
            <span className="min-w-8 pe-2 text-xs text-muted-foreground">{unitLabel}</span>
          </div>
        );
      },
    }));

    const actionsCol: ColumnDef<GridRow> = {
      id: "actions",
      header: () => null,
      cell: ({ row }) =>
        row.original.source === "own" && !readOnly ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            aria-label={t("recipes.builder.removeIngredient", "Remove ingredient")}
            onClick={() => setBlocks((prev) => removeRow(prev, row.original.ingredient_id))}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null,
    };
    return [ingredientCol, ...sizeCols, actionsCol];
    // sourceTag/slugOf are derived from the listed deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, catalogById, swapGroups, baseNames, followsName, readOnly, orgId, onCostFixed, setBlocks, t]);

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel(), getRowId: (r) => r.key });

  const scaleBlock = blocks.find((b) => b.key === scaleFor) ?? null;

  return (
    <div className="space-y-3">
      {toolbar}
      {readOnly ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {t("modeling.grid.followsReadOnly", "This recipe follows {{name}}. Unlink it to edit amounts here.", {
            name: followsName,
          })}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/40">
                {hg.headers.map((h) => {
                  const blockKey = h.column.id.startsWith("size:") ? h.column.id.slice(5) : null;
                  const b = blockKey ? blocks.find((bl) => bl.key === blockKey) : null;
                  if (!b) {
                    return (
                      <th key={h.id} className="px-3 py-2 text-start align-bottom text-xs font-medium text-muted-foreground">
                        {h.column.id === "actions" && !readOnly ? (
                          <Button type="button" variant="ghost" size="sm" onClick={addBlock}>
                            <Plus className="size-4" /> {t("modeling.grid.addSize", "Size")}
                          </Button>
                        ) : (
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}
                      </th>
                    );
                  }
                  const idx = blocks.indexOf(b);
                  const dirty = recipeDirtyKeys.has(b.key) || !b.id || b.label !== (b.seededLabel ?? "");
                  return (
                    <th key={h.id} className={cn("px-2 py-2 align-bottom", dirty && "bg-accent/60")}>
                      <div className="flex items-center gap-1">
                        <Input
                          value={b.label}
                          placeholder={t("menu.studio.sizes.labelPh", "e.g. Small")}
                          aria-label={t("menu.sizeLabel", "Label")}
                          onChange={(e) => patchBlock(b.key, { label: e.target.value })}
                          className="h-8 w-24 font-medium"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t("modeling.grid.columnActions", "Size actions")}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled={idx === 0} onClick={() => moveBlock(b.key, -1)}>
                              <ArrowLeft className="size-4 rtl:rotate-180" /> {t("modeling.grid.moveLeft", "Move earlier")}
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={idx === blocks.length - 1} onClick={() => moveBlock(b.key, 1)}>
                              <ArrowRight className="size-4 rtl:rotate-180" /> {t("modeling.grid.moveRight", "Move later")}
                            </DropdownMenuItem>
                            {!readOnly ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger disabled={blocks.length < 2}>
                                    <Copy className="size-4" /> {t("modeling.grid.copyFrom", "Copy from")}
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {blocks
                                      .filter((o) => o.key !== b.key)
                                      .map((o) => (
                                        <DropdownMenuItem
                                          key={o.key}
                                          onClick={() => setBlocks((prev) => copyColumn(prev, o.key, b.key))}
                                        >
                                          {o.label || t("modeling.grid.untitledSize", "Untitled size")}
                                        </DropdownMenuItem>
                                      ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuItem onClick={() => setScaleFor(b.key)}>
                                  <Scaling className="size-4" /> {t("modeling.grid.scale", "Scale ×…")}
                                </DropdownMenuItem>
                              </>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => setBlocks((prev) => prev.filter((x) => x.key !== b.key))}
                            >
                              <Trash2 className="size-4" /> {t("menu.removeSize", "Remove size")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
            {/* Price row */}
            <tr className="border-b">
              <th scope="row" className="px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                {t("common.price", "Price")} ({currencyLabel()})
              </th>
              {blocks.map((b) => (
                <td key={b.key} className={cn("px-2 py-2", b.price !== (b.seededPrice ?? "") && "bg-accent/60")}>
                  <Input
                    type="text"
                    inputMode="decimal"
                    data-grid="recipe"
                    data-row={-1}
                    data-col={b.key}
                    value={b.price}
                    aria-label={t("modeling.grid.priceAria", "Price of {{size}}", { size: b.label })}
                    onKeyDown={onCellKey}
                    onChange={(e) => patchBlock(b.key, { price: cleanQty(e.target.value) })}
                    className="h-8 w-28 text-end tabular-nums"
                  />
                </td>
              ))}
              <td />
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={cn("border-b last:border-b-0", row.original.source !== "own" && "bg-muted/25")}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 py-1.5 align-middle first:px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!readOnly ? (
              <tr className="border-t">
                <td className="px-3 py-2" colSpan={blocks.length + 2}>
                  <Combobox
                    className="max-w-xs"
                    options={addableOptions}
                    value={null}
                    onChange={(v) => {
                      const unit = catalogById.get(v)?.unit ?? "g";
                      setBlocks((prev) => addRow(prev, v, unit));
                      requestAnimationFrame(() => {
                        const inputs = document.querySelectorAll<HTMLInputElement>('input[data-grid="recipe"]');
                        const col = blocks[0]?.key;
                        const target = [...inputs].reverse().find((i) => i.dataset.col === col);
                        target?.focus();
                      });
                    }}
                    placeholder={t("modeling.grid.addIngredient", "+ ingredient")}
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/20">
              <th scope="row" className="px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                {t("modeling.grid.cost", "Cost · margin")}
              </th>
              {blocks.map((b) => {
                const estimated = !b.id || recipeDirtyKeys.has(b.key) || b.price !== b.seededPrice;
                const est = estimated ? estimateFor(catalogById, b.lines) : null;
                const incomplete = estimated ? est!.incomplete : (b.serverCost?.incomplete ?? false);
                const cost = estimated ? est!.piastres : (b.serverCost?.piastres ?? null);
                const priceEgp = Number(b.price);
                const pricePiastres = Number.isFinite(priceEgp) ? egpToPiastres(priceEgp) : 0;
                const margin =
                  !incomplete && cost != null && pricePiastres > 0 ? (pricePiastres - cost) / pricePiastres : null;
                return (
                  <td key={b.key} className="px-2 py-2 text-end text-xs text-muted-foreground">
                    {b.lines.length === 0 ? (
                      "—"
                    ) : incomplete || cost == null ? (
                      t("menu.studio.recipe.incomplete", "Cost incomplete")
                    ) : (
                      <span className="font-mono tabular-nums">
                        {estimated ? "≈ " : null}
                        {fmtMoney(cost)}
                        {margin != null ? ` · ${fmtPercent(margin)}` : null}
                      </span>
                    )}
                  </td>
                );
              })}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {t(
          "modeling.grid.hint",
          "Enter or ↓ moves down a column, Tab moves across. Greyed rows come from a base, a packaging rule or a linked item and are edited there.",
        )}
      </p>

      <ScaleDialog
        open={!!scaleBlock}
        onOpenChange={(o) => !o && setScaleFor(null)}
        target={scaleBlock}
        blocks={blocks}
        onApply={(fromKey, factor) => {
          if (!scaleBlock) return;
          setBlocks((prev) =>
            fromKey === scaleBlock.key ? scaleColumn(prev, scaleBlock.key, factor) : copyColumn(prev, fromKey, scaleBlock.key, factor),
          );
          setScaleFor(null);
        }}
      />
    </div>
  );
}

function ScaleDialog({
  open,
  onOpenChange,
  target,
  blocks,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: SizeBlockDraft | null;
  blocks: SizeBlockDraft[];
  onApply: (fromKey: string, factor: number) => void;
}) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        from: z.string().min(1),
        factor: z
          .string()
          .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, t("modeling.grid.factorInvalid", "Enter a number above 0")),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: { from: target?.key ?? "", factor: "1" },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("modeling.grid.scaleTitle", "Scale {{size}}", { size: target?.label ?? "" })}
          </DialogTitle>
          <DialogDescription>
            {t(
              "modeling.grid.scaleDesc",
              "Multiplies the own amounts. Pick another size to start from its amounts instead (e.g. Double = Single × 2).",
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => onApply(v.from, Number(v.factor)))} className="space-y-4">
            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("modeling.grid.scaleFrom", "Start from")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {blocks.map((b) => (
                        <SelectItem key={b.key} value={b.key}>
                          {b.label || t("modeling.grid.untitledSize", "Untitled size")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="factor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("modeling.grid.factor", "Multiply by")}</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit">{t("modeling.grid.apply", "Apply")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
