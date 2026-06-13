import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BookOpen, Plus, Ruler, Trash2 } from "lucide-react";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BilingualField } from "@/components/app/bilingual-field";
import { ImageUploader } from "@/components/app/image-uploader";
import { CategoryDialog } from "./category-dialog";
import {
  createMenuItem,
  deleteDrinkRecipe,
  deleteSize,
  updateMenuItem,
  uploadMenuItemImage,
  upsertDrinkRecipe,
  upsertSize,
  useGetMenuItem,
  useListCatalog,
} from "@/data/api/generated/api";
import type { Category, MenuItem, UploadResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, piastresToEgp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { RecipeBuilder, type CleanRow, type RecipeRowInit } from "@/features/recipes/recipe-builder";
import { invalidateRecipes } from "@/features/recipes/util";
import { arOf, invalidateCatalog } from "./util";

interface Props {
  orgId: string;
  categories: Category[];
  item: MenuItem | null;
  defaultCategoryId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const imageUrlOf = (res: UploadResponse): string => {
  const r = res as { image_url?: string; url?: string };
  return r.image_url ?? r.url ?? "";
};

export function MenuItemDialog({ orgId, categories, item, defaultCategoryId, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const editing = !!item;
  const [newCategory, setNewCategory] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [recipeRows, setRecipeRows] = useState<CleanRow[]>([]);

  // Full item (sizes + recipes) for edit mode.
  const { data: liveItem } = useGetMenuItem(item?.id ?? "", { query: { enabled: open && !!item?.id } });
  const catalog = useListCatalog(orgId, { query: { enabled: open && !!orgId } });

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        name_ar: z.string().optional(),
        description: z.string().optional(),
        description_ar: z.string().optional(),
        base_price: z.coerce.number().min(0),
        category_id: z.string().min(1, t("common.requiredField", "This field is required")),
        is_active: z.boolean(),
        sizes: z.array(
          z.object({
            id: z.string().optional(),
            label: z.string().min(1, t("common.requiredField", "This field is required")),
            price_override: z.coerce.number().min(0),
          }),
        ),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", name_ar: "", description: "", description_ar: "", base_price: 0, category_id: "", is_active: true, sizes: [] },
  });
  const { fields: sizes, append, remove } = useFieldArray({ control: form.control, name: "sizes" });

  // ── Recipe wiring (embedded builder, committed with the form) ──────────────
  const initialRecipeRows = useMemo<RecipeRowInit[]>(
    () => (liveItem?.recipes ?? []).map((r) => ({
      size_label: r.size_label, org_ingredient_id: r.org_ingredient_id ?? null, ingredient_name: r.ingredient_name, ingredient_unit: r.ingredient_unit, quantity_used: r.quantity_used,
    })),
    [liveItem?.recipes],
  );
  const watchedSizes = form.watch("sizes") ?? [];
  const sizeLabels = watchedSizes.map((s) => s.label).filter(Boolean);
  const recipeSizes = Array.from(new Set([...(sizeLabels.length ? sizeLabels : ["one_size"]), ...initialRecipeRows.map((r) => r.size_label)]));
  const priceForSize = (size: string): number | null => {
    const toP = (v: unknown) => { const n = parseFloat(String(v ?? "")); return Number.isFinite(n) ? Math.round(n * 100) : null; };
    return toP(watchedSizes.find((s) => s.label === size)?.price_override) ?? toP(form.getValues("base_price"));
  };

  // Reset basics when opening.
  useEffect(() => {
    if (open) {
      setPendingImage(null);
      setPendingPreview(null);
      form.reset({
        name: item?.name ?? "",
        name_ar: arOf(item?.name_translations),
        description: item?.description ?? "",
        description_ar: arOf(item?.description_translations),
        base_price: item ? piastresToEgp(item.base_price) : 0,
        category_id: item?.category_id ?? defaultCategoryId ?? "",
        is_active: item?.is_active ?? true,
        sizes: [],
      });
    }
  }, [open, item, defaultCategoryId, form]);

  // Load sizes once the full item arrives (edit).
  useEffect(() => {
    if (liveItem) {
      form.setValue(
        "sizes",
        liveItem.sizes.map((s) => ({ id: s.id, label: s.label, price_override: piastresToEgp(s.price_override) })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveItem]);

  const save = useMutation({
    mutationFn: async (v: Values) => {
      const payload = {
        name: v.name,
        name_translations: v.name_ar ? { ar: v.name_ar } : undefined,
        description: v.description || null,
        description_translations: v.description_ar ? { ar: v.description_ar } : undefined,
        base_price: egpToPiastres(v.base_price),
        category_id: v.category_id,
      };
      const res = item
        ? await updateMenuItem(item.id, { ...payload, is_active: v.is_active })
        : await createMenuItem({ org_id: orgId, ...payload });
      const itemId = res.id;

      // Sizes diff: delete removed, upsert the rest.
      const existing = liveItem?.sizes ?? [];
      const keptIds = new Set(v.sizes.map((s) => s.id).filter(Boolean));
      await Promise.all(existing.filter((s) => !keptIds.has(s.id)).map((s) => deleteSize(itemId, s.id)));
      for (const s of v.sizes) {
        await upsertSize(itemId, { label: s.label, price_override: egpToPiastres(s.price_override) });
      }

      // Recipe diff — rows streamed from the embedded builder.
      const rk = (r: { size_label: string; ingredient_name: string }) => `${r.size_label}::${r.ingredient_name}`;
      const keptKeys = new Set(recipeRows.map(rk));
      for (const r of recipeRows) await upsertDrinkRecipe(itemId, r);
      for (const r of (liveItem?.recipes ?? []).filter((x) => !keptKeys.has(rk(x)))) {
        await deleteDrinkRecipe(itemId, r.size_label, { ingredient_name: r.ingredient_name });
      }

      if (!item && pendingImage) {
        await uploadMenuItemImage(itemId, { image: pendingImage });
      }
      return res;
    },
    onSuccess: () => {
      toast.success(t("common.savedChanges", "Changes saved"));
      void invalidateCatalog();
      void invalidateRecipes();
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t("menu.editItem", "Edit item") : t("menu.newItem", "New item")}</DialogTitle>
            <DialogDescription>{t("menu.itemDesc", "Define the product, price, image and sizes.")}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
              <BilingualField control={form.control} enName="name" arName="name_ar" label={t("common.name", "Name")} />
              <BilingualField control={form.control} enName="description" arName="description_ar" label={t("common.description", "Description")} textarea />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="base_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("menu.basePrice", "Base price (EGP)")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.category", "Category")}</FormLabel>
                      <div className="flex gap-2">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={t("menu.selectCategory", "Select category")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {getTranslatedName({ name: c.name, name_translations: c.name_translations }, i18n.language)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" title={t("menu.newCategory", "New category")} onClick={() => setNewCategory(true)}>
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-end justify-between gap-4">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pb-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">{t("common.active", "Active")}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Image */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{t("menu.itemImage", "Image")}</p>
                {item ? (
                  <ImageUploader
                    value={liveItem?.image_url ?? item.image_url}
                    onUpload={async (file) => {
                      const res = await uploadMenuItemImage(item.id, { image: file });
                      void invalidateCatalog();
                      return imageUrlOf(res);
                    }}
                    onRemove={
                      liveItem?.image_url || item.image_url
                        ? async () => {
                            await updateMenuItem(item.id, { image_url: null });
                            void invalidateCatalog();
                          }
                        : undefined
                    }
                    hint={t("menu.imageHint", "PNG/JPG/WebP, up to 5 MB")}
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
                    hint={t("menu.imageAfterSave", "Uploads after the item is saved")}
                  />
                )}
              </div>

              {/* Sizes */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <Ruler className="size-4 text-primary" />
                  <p className="text-sm font-semibold">{t("menu.sizes", "Sizes")}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", price_override: 0 })}>
                  <Plus className="size-4" />
                  {t("menu.addSize", "Add size")}
                </Button>
              </div>
              {sizes.length === 0 ? (
                <p className="rounded-lg border border-dashed bg-muted/30 py-3 text-center text-sm text-muted-foreground">
                  {t("menu.noSizes", "No sizes — the base price applies.")}
                </p>
              ) : (
                <div className="space-y-2">
                  {sizes.map((sz, idx) => (
                    <div key={sz.id} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                      <FormField
                        control={form.control}
                        name={`sizes.${idx}.label`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs">{t("menu.sizeLabel", "Label")}</FormLabel>
                            <FormControl>
                              <Input placeholder="Large" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`sizes.${idx}.price_override`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs">{t("common.price", "Price")} (EGP)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon-sm" className="mt-6 text-destructive" onClick={() => remove(idx)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recipe (per-size ingredients) */}
              <div className="border-t pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <p className="text-sm font-semibold">{t("menu.recipe", "Recipe")}</p>
                  <span className="text-xs text-muted-foreground">{t("menu.recipeHint", "What this item consumes, per size")}</span>
                </div>
                <RecipeBuilder
                  orgId={orgId}
                  sizes={recipeSizes}
                  initialRows={initialRecipeRows}
                  catalog={catalog.data ?? []}
                  priceForSize={priceForSize}
                  deferred
                  onRowsChange={setRecipeRows}
                  allowCreateIngredient={false}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button type="submit" loading={save.isPending}>
                  {t("common.save", "Save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {newCategory ? (
        <CategoryDialog
          orgId={orgId}
          category={null}
          open={newCategory}
          onOpenChange={setNewCategory}
          onCreated={(cat) => form.setValue("category_id", cat.id, { shouldValidate: true })}
        />
      ) : null}
    </>
  );
}
