import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BookOpen, Coffee, Plus, Ruler, Trash2 } from "lucide-react";
import { FormDialog } from "@/shared/ui/form-dialog";
import { BilingualField } from "@/shared/ui/bilingual-field";
import { MoneyField } from "@/shared/ui/money-field";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { ImageUploader } from "@/shared/ui/image-uploader";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
  useGetMenuItem, createMenuItem, updateMenuItem, uploadMenuItemImage, upsertSize, deleteSize,
  upsertDrinkRecipe, deleteDrinkRecipe,
  getListMenuItemsQueryKey, getGetMenuItemQueryKey, getListCategoriesQueryKey,
} from "@/shared/api/generated/api";
import { getListSkuCostsQueryKey } from "@/entities/costing/queries";
import { useCatalog } from "@/entities/inventory/queries";
import {
  menuItemSchema, updateMenuItemSchema, type MenuItemValues,
} from "@/entities/menu/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { RecipeBuilder } from "@/features/recipe-builder/recipe-builder";
import { CategoryDialog } from "./category-dialog";
import type { Category, MenuItem } from "@/shared/types";

// ── Size templates — named size sets persisted client-side ──────────────────
interface SizeTemplate {
  name: string;
  sizes: { label: string; price_egp: string; display_order: number }[];
}
const SIZE_TEMPLATES_KEY = "sufrix-size-templates";
const loadSizeTemplates = (): SizeTemplate[] => {
  try {
    return JSON.parse(localStorage.getItem(SIZE_TEMPLATES_KEY) ?? "[]");
  } catch {
    return [];
  }
};

interface RecipeRow {
  size_label: string;
  org_ingredient_id: string | null;
  ingredient_name: string;
  ingredient_unit: string;
  quantity_used: number;
}

const recipeKey = (r: { size_label: string; ingredient_name: string }) => `${r.size_label}::${r.ingredient_name}`;

function SectionHeading({ icon: Icon, title, hint }: { icon: typeof Coffee; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2 pt-4 mt-4 border-t">
      <Icon size={14} className="text-primary" />
      <p className="text-sm font-bold">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * The whole menu item in ONE place: basics, category (with inline create),
 * sizes (with templates), and the recipe — saved together. Replaces the old
 * three-stop flow (categories tab → item dialog → recipes page).
 */
export function MenuItemEditor({
  open,
  onClose,
  edit,
  orgId,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  edit: MenuItem | null;
  orgId: string;
  categories: Category[];
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: liveItem } = useGetMenuItem(edit?.id as string, { query: { enabled: !!edit?.id } });
  const { data: catalog = [] } = useCatalog(orgId);

  const [newCategory, setNewCategory] = useState(false);
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([]);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [sizeTemplates, setSizeTemplates] = useState<SizeTemplate[]>(loadSizeTemplates);

  const form = useForm<MenuItemValues>({
    // create requires a category (backend contract); update may clear it
    resolver: zodResolver(edit ? updateMenuItemSchema : menuItemSchema),
    defaultValues: {
      name: edit?.name ?? "",
      name_translations: edit?.name_translations ?? {},
      description: edit?.description ?? "",
      description_translations: edit?.description_translations ?? {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      base_price: (edit ? String(edit.base_price / 100) : "") as any,
      category_id: edit?.category_id ?? "",
      is_active: edit?.is_active ?? true,
      display_order: edit?.display_order ?? 0,
      sizes: [],
    },
  });

  const { fields: sizes, append: appendSize, remove: removeSizeField, replace: replaceSizes } = useFieldArray({
    control: form.control,
    name: "sizes",
  });

  useEffect(() => {
    if (liveItem) {
      form.reset({
        ...form.getValues(),
        sizes: liveItem.sizes.map((s) => ({
          id: s.id,
          label: s.label,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          price_override: String(s.price_override / 100) as any,
          display_order: s.display_order,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveItem]);

  // ── Recipe wiring ──────────────────────────────────────────────────────────
  const watchedSizes = form.watch("sizes") ?? [];
  const sizeLabels = watchedSizes.map((s) => s.label).filter(Boolean);
  const initialRecipeRows = liveItem?.recipes ?? [];
  const recipeSizes = Array.from(
    new Set([...(sizeLabels.length > 0 ? sizeLabels : ["one_size"]), ...initialRecipeRows.map((r) => r.size_label)]),
  );

  const priceForSize = (size: string): number | null => {
    const override = watchedSizes.find((s) => s.label === size)?.price_override;
    const parse = (v: unknown) => {
      const n = parseFloat(String(v ?? ""));
      return Number.isFinite(n) ? Math.round(n * 100) : null;
    };
    return parse(override) ?? parse(form.getValues("base_price"));
  };

  // ── Size templates ─────────────────────────────────────────────────────────
  const saveSizeTemplate = () => {
    const current = form.getValues("sizes") ?? [];
    if (current.length === 0) return;
    const name = window.prompt(t("menu.itemDialog.templateNamePrompt"));
    if (!name?.trim()) return;
    const tpl: SizeTemplate = {
      name: name.trim(),
      sizes: current.map((sz, i) => ({
        label: sz.label,
        price_egp: String(sz.price_override ?? ""),
        display_order: sz.display_order ?? i,
      })),
    };
    const next = [...sizeTemplates.filter((x) => x.name !== tpl.name), tpl];
    localStorage.setItem(SIZE_TEMPLATES_KEY, JSON.stringify(next));
    setSizeTemplates(next);
    toast.success(t("menu.itemDialog.templateSaved", { name: tpl.name }));
  };

  const applySizeTemplate = (name: string) => {
    const tpl = sizeTemplates.find((x) => x.name === name);
    if (!tpl) return;
    replaceSizes(
      tpl.sizes.map((sz, i) => ({
        label: sz.label,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        price_override: sz.price_egp as any,
        display_order: sz.display_order ?? i,
      })),
    );
  };

  // ── Save: item → sizes → recipe rows, all in one go ────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: async (v: MenuItemValues) => {
      const payload = {
        name: v.name,
        name_translations: v.name_translations,
        description: v.description || null,
        description_translations: v.description_translations,
        base_price: v.base_price,
        category_id: v.category_id || null,
        is_active: v.is_active,
        display_order: v.display_order,
      };

      const itemRes = await (edit
        ? updateMenuItem(edit.id, payload as never)
        : createMenuItem({ ...payload, org_id: orgId } as never));
      const itemId = itemRes.id;

      // sizes diff
      const existingSizes = liveItem?.sizes ?? [];
      const keptIds = new Set((v.sizes ?? []).map((s) => s.id).filter(Boolean));
      await Promise.all(existingSizes.filter((s) => !keptIds.has(s.id)).map((s) => deleteSize(itemId, s.id)));
      for (const [idx, s] of (v.sizes ?? []).entries()) {
        await upsertSize(itemId, {
          label: s.label,
          price_override: s.price_override,
          display_order: s.display_order ?? idx,
        } as never);
      }

      // recipe diff — rows reported by the embedded builder
      const currentKeys = new Set(recipeRows.map(recipeKey));
      const removed = initialRecipeRows.filter((r) => !currentKeys.has(recipeKey(r)));
      for (const r of recipeRows) await upsertDrinkRecipe(itemId, r as never);
      for (const r of removed) await deleteDrinkRecipe(itemId, r.size_label, { ingredient_name: r.ingredient_name });

      return itemRes;
    },
    onSuccess: (itemRes) => {
      qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMenuItemQueryKey(itemRes.id) });
      qc.invalidateQueries({ queryKey: getListSkuCostsQueryKey() });
      if (!edit && pendingImage) {
        // item is already visible; the image fills in when this resolves
        uploadMenuItemImage(itemRes.id, { image: pendingImage as never })
          .then(() => qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() }))
          .catch((e) => toast.error(getErrorMessage(e)));
      }
      toast.success(t("common.save"));
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // image (edit mode uploads immediately, create mode buffers)
  const uploadImage = useMutation({
    mutationFn: (file: File) => uploadMenuItemImage(edit!.id, { image: file as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMenuItemQueryKey(edit!.id) });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const removeImage = useMutation({
    mutationFn: () => updateMenuItem(edit!.id, { image_url: null } as never),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMenuItemQueryKey(edit!.id) });
      toast.success(t("menu.itemDialog.imageRemoved"));
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <FormDialog
        open={open}
        onClose={onClose}
        title={edit ? t("menu.itemDialog.edit") : t("menu.itemDialog.new")}
        description={edit ? undefined : t("menu.editor.newHint")}
        form={form}
        onSubmit={(v) => mutate(v)}
        isPending={isPending}
        size="xl"
      >
        {/* ── Basics ─────────────────────────────────────────────────────── */}
        <BilingualField control={form.control} name="name" label={t("common.name")} placeholder={t("menu.itemDialog.namePh")} arPlaceholder="الاسم بالعربي" />
        <BilingualField control={form.control} name="description" label={t("common.description")} placeholder={t("menu.itemDialog.descPh")} />
        <div className="grid grid-cols-2 gap-3">
          <MoneyField control={form.control} name="base_price" label={t("common.price")} />
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.category")}</FormLabel>
                <div className="flex gap-2">
                  <Select value={field.value || "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}>
                    <FormControl><SelectTrigger className="flex-1"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {edit && <SelectItem value="__none__">{t("menu.noCategory")}</SelectItem>}
                      {!edit && !field.value && <SelectItem value="__none__" disabled>{t("menu.editor.pickCategory")}</SelectItem>}
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {/* inline category creation — no more leaving the dialog */}
                  <Button type="button" variant="outline" size="sm" title={t("menu.addCategory")} onClick={() => setNewCategory(true)}>
                    <Plus size={13} />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <FormField
            control={form.control}
            name="display_order"
            render={({ field }) => (
              <FormItem className="w-40">
                <FormLabel>{t("menu.displayOrder")}</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 !space-y-0 pt-6">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel>{t("common.active")}</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {/* ── Image ──────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("menu.itemDialog.image")}</p>
          {edit ? (
            <ImageUploader
              value={liveItem?.image_url ?? edit.image_url}
              onUpload={async (file) => {
                const res = await uploadImage.mutateAsync(file);
                return (res as { image_url?: string }).image_url ?? "";
              }}
              onRemove={liveItem?.image_url || edit.image_url ? async () => { await removeImage.mutateAsync(); } : undefined}
              hint={t("menu.itemDialog.imageHint")}
            />
          ) : (
            <ImageUploader
              value={pendingPreview}
              onUpload={async (file) => {
                if (pendingPreview) URL.revokeObjectURL(pendingPreview);
                const url = URL.createObjectURL(file);
                setPendingImage(file);
                setPendingPreview(url);
                return url;
              }}
              onRemove={
                pendingPreview
                  ? () => {
                      URL.revokeObjectURL(pendingPreview);
                      setPendingImage(null);
                      setPendingPreview(null);
                    }
                  : undefined
              }
              hint={t("menu.itemDialog.imageUploadsAfterSave")}
            />
          )}
        </div>

        {/* ── Sizes ──────────────────────────────────────────────────────── */}
        <SectionHeading icon={Ruler} title={t("menu.editor.sizes")} hint={t("menu.editor.sizesHint")} />
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {sizeTemplates.length > 0 && (
            <Select value="" onValueChange={applySizeTemplate}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder={t("menu.itemDialog.applyTemplate")} /></SelectTrigger>
              <SelectContent>
                {sizeTemplates.map((tpl) => <SelectItem key={tpl.name} value={tpl.name}>{tpl.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {sizes.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={saveSizeTemplate}>
              {t("menu.itemDialog.saveTemplate")}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => appendSize({ label: "", price_override: 0 as unknown as number, display_order: sizes.length })}>
            <Plus size={14} className="me-2" /> {t("menu.editor.addSize")}
          </Button>
        </div>
        {sizes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3 bg-muted/30 rounded-lg border border-dashed">
            {t("menu.editor.noSizes")}
          </p>
        ) : (
          <div className="space-y-3">
            {sizes.map((sz, idx) => (
              <div key={sz.id} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border">
                <FormField
                  control={form.control}
                  name={`sizes.${idx}.label`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">{t("menu.editor.sizeLabel")}</FormLabel>
                      <FormControl><Input placeholder="e.g. Large" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`sizes.${idx}.price_override`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">{t("common.price")} (EGP)</FormLabel>
                      <FormControl><Input type="number" step="0.01" min="0" {...field} value={(field.value as unknown as string) ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="iconSm" className="text-destructive mt-6" onClick={() => removeSizeField(idx)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* ── Recipe ─────────────────────────────────────────────────────── */}
        <SectionHeading icon={BookOpen} title={t("menu.editor.recipe")} hint={t("menu.editor.recipeHint")} />
        <div className="-mx-4">
          <RecipeBuilder
            orgId={orgId}
            sizes={recipeSizes}
            initialRows={initialRecipeRows}
            catalog={catalog}
            priceForSize={priceForSize}
            deferred
            onRowsChange={setRecipeRows}
            // ingredient onboarding lives in Inventory — here you only map
            // existing ingredients to the item's sizes
            allowCreateIngredient={false}
          />
        </div>
      </FormDialog>

      {newCategory && (
        <CategoryDialog
          open={newCategory}
          onClose={() => setNewCategory(false)}
          edit={null}
          orgId={orgId}
          onCreated={(cat) => {
            // auto-select the freshly created category
            form.setValue("category_id", cat.id, { shouldDirty: true, shouldValidate: true });
            qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          }}
        />
      )}
    </>
  );
}
