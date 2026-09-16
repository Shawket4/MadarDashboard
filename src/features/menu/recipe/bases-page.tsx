import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Layers3, Pencil, Plus, Trash2 } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { BilingualField } from "@/components/app/bilingual-field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { invalidateCatalog } from "../util";
import type { GridBlock } from "./grid-model";
import { LabelGridEditor } from "./label-grid-editor";
import { useIngredientPicker } from "./use-ingredient-picker";
import { ALL_SIZES, addLabelColumn, fromLabelBlocks, removeLabelColumn, toLabelBlocks } from "./label-model";
import {
  createRecipeBase,
  deleteRecipeBase,
  patchRecipeBase,
  putRecipeBaseLines,
  recipeBasesKey,
  useRecipeBases,
  useRecipeBaseUsage,
  type RecipeBaseOut,
} from "./modeling-api";

/**
 * Recipe bases: shared line sets (e.g. "Blended matcha") that item sizes expand.
 * Lines are per size label; the unlabelled column applies to every size.
 */
export function RecipeBasesPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const basesQ = useRecipeBases(!!orgId);
  const [editing, setEditing] = useState<RecipeBaseOut | "new" | null>(null);

  const remove = async (b: RecipeBaseOut) => {
    const ok = await confirm({
      title: t("modeling.bases.deleteTitle", 'Delete "{{name}}"?', { name: b.name }),
      description: t(
        "modeling.bases.deleteDesc",
        "Sizes using this base lose its lines. Their own lines stay.",
      ),
      confirmLabel: t("common.delete", "Delete"),
    });
    if (!ok) return;
    try {
      await deleteRecipeBase(b.id);
      toast.success(t("modeling.bases.deleted", "Base deleted"));
      void qc.invalidateQueries({ queryKey: recipeBasesKey });
      void invalidateCatalog();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Page width="reading">
      <PageHeader
        title={t("modeling.bases.title", "Recipe bases")}
        subtitle={t(
          "modeling.bases.subtitle",
          "Lines several drinks share. Edit once and every size using the base follows.",
        )}
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-4" /> {t("modeling.bases.new", "New base")}
          </Button>
        }
      />
      {basesQ.isLoading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : basesQ.isError ? (
        <ErrorState
          title={t("modeling.bases.loadError", "Could not load recipe bases")}
          message={getErrorMessage(basesQ.error)}
          onRetry={() => void basesQ.refetch()}
        />
      ) : (basesQ.data ?? []).length === 0 ? (
        <EmptyState
          icon={Layers3}
          title={t("modeling.bases.empty", "No recipe bases yet")}
          description={t("modeling.bases.emptyHint", "Create one for lines many drinks share, then pick it in an item's recipe.")}
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {(basesQ.data ?? []).map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-2 pe-2 ps-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-medium">
                  {b.name}
                  {!b.is_active ? <StatusPill tone="neutral" size="sm">{t("common.inactive", "Inactive")}</StatusPill> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("modeling.bases.affects", "Affects {{items}} items / {{sizes}} sizes", {
                    items: b.item_count,
                    sizes: b.size_count,
                  })}
                  {" · "}
                  {t("modeling.bases.lineCount", "{{count}} lines", { count: b.lines.length })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="icon-sm" variant="ghost" onClick={() => setEditing(b)} aria-label={t("common.edit", "Edit")}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => void remove(b)}
                  aria-label={t("common.delete", "Delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <BaseEditorDialog
        orgId={orgId}
        base={editing === "new" ? null : editing}
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </Page>
  );
}

function BaseEditorDialog({
  orgId,
  base,
  open,
  onOpenChange,
}: {
  orgId: string | null;
  base: RecipeBaseOut | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { catalogById, ingredientOptions } = useIngredientPicker(orgId);
  const usageQ = useRecipeBaseUsage(open && base ? base.id : null);
  const allLabel = t("modeling.grid.allSizes", "All sizes");

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("common.requiredField", "This field is required")),
        name_ar: z.string(),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", name_ar: "", is_active: true } });
  const [blocks, setBlocks] = useState<GridBlock[]>([]);
  const [pristineLines, setPristineLines] = useState("[]");

  useEffect(() => {
    if (!open) return;
    form.reset({ name: base?.name ?? "", name_ar: base?.name_ar ?? "", is_active: base?.is_active ?? true });
    const seeded = toLabelBlocks(base?.lines ?? [], [], allLabel);
    setBlocks(seeded);
    setPristineLines(JSON.stringify(fromLabelBlocks(seeded)));
  }, [open, base, form, allLabel]);

  const submit = async (v: Values) => {
    const lines = fromLabelBlocks(blocks).map((l, i) => ({ ...l, sort: i }));
    try {
      if (!base) {
        await createRecipeBase({ name: v.name.trim(), name_ar: v.name_ar.trim() || null, is_active: v.is_active, lines });
        toast.success(t("modeling.bases.created", "Base created"));
      } else {
        let changed = 0;
        if (v.name.trim() !== base.name || (v.name_ar.trim() || null) !== base.name_ar || v.is_active !== base.is_active) {
          const r = await patchRecipeBase(base.id, { name: v.name.trim(), name_ar: v.name_ar.trim() || null, is_active: v.is_active });
          changed += r.sizes_changed;
        }
        if (JSON.stringify(fromLabelBlocks(blocks)) !== pristineLines) {
          const r = await putRecipeBaseLines(base.id, lines);
          changed += r.sizes_changed;
        }
        toast.success(t("modeling.bases.saved", "Base saved · {{count}} sizes updated", { count: changed }));
      }
      void qc.invalidateQueries({ queryKey: recipeBasesKey });
      void invalidateCatalog();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const usage = usageQ.data;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{base ? t("modeling.bases.edit", "Edit base") : t("modeling.bases.new", "New base")}</DialogTitle>
          <DialogDescription>
            {usage
              ? t("modeling.bases.affects", "Affects {{items}} items / {{sizes}} sizes", {
                  items: usage.item_count,
                  sizes: usage.size_count,
                })
              : t("modeling.bases.editorDesc", "Amounts in the All sizes column apply to every size; a size column overrides it.")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <BilingualField control={form.control} enName="name" arName="name_ar" label={t("common.name", "Name")} />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">{t("common.active", "Active")}</FormLabel>
                </FormItem>
              )}
            />
            <LabelGridEditor
              gridId="base-lines"
              blocks={blocks}
              onChange={setBlocks}
              catalogById={catalogById}
              ingredientOptions={ingredientOptions}
              onAddColumn={(label) => setBlocks((prev) => addLabelColumn(prev, label))}
              removableKeys={new Set(blocks.filter((b) => b.key !== ALL_SIZES).map((b) => b.key))}
              onRemoveColumn={(key) => setBlocks((prev) => removeLabelColumn(prev, key))}
            />
            {usage && usage.sizes.length > 0 ? (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  {t("modeling.bases.usedBy", "Used by")}
                </summary>
                <ul className="mt-2 space-y-0.5">
                  {usage.sizes.map((s) => (
                    <li key={s.size_id}>
                      {s.menu_item_name} · <span className="text-muted-foreground">{s.size_label}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {t("common.save", "Save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
