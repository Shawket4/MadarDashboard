import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BookOpen, CupSoda, Plus, Ruler, Search, Trash2, X } from "lucide-react";
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
  putModifierGroups,
  putSizeRecipe,
  putSizes,
  updateMenuItem,
  uploadMenuItemImage,
  useGetMenuItem,
  useListAddonItems,
  useListCatalog,
  useListGroups,
} from "@/data/api/generated/api";
import type { AddonItem, Category, MenuItem, UploadResponse } from "@/data/api/generated/models";
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

const humanizeAddonType = (type: string) => {
  const base = type.endsWith("_type") ? type.slice(0, -"_type".length) : type;
  return base.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export function MenuItemDialog({ orgId, categories, item, defaultCategoryId, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const editing = !!item;
  const [newCategory, setNewCategory] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [recipeRows, setRecipeRows] = useState<CleanRow[]>([]);
  // Per-item allowed addons state.
  const [allowedIds, setAllowedIds] = useState<Set<string>>(new Set());
  const [addonSearch, setAddonSearch] = useState("");

  // Full item (sizes + recipes + allowed_addon_ids) for edit mode.
  const { data: liveItem } = useGetMenuItem(item?.id ?? "", { query: { enabled: open && !!item?.id } });
  const catalog = useListCatalog(orgId, { query: { enabled: open && !!orgId } });
  const { data: allAddons } = useListAddonItems({ org_id: orgId }, { query: { enabled: open && !!orgId } });
  // Reusable modifier groups — the allowlist picker writes group ATTACHMENTS
  // (unified model) keyed by each addon's type → its group.
  const { data: modifierGroups } = useListGroups({ org_id: orgId }, { query: { enabled: open && !!orgId } });

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        name_ar: z.string().optional(),
        description: z.string().optional(),
        description_ar: z.string().optional(),
        base_price: z.coerce.number<number>().min(0),
        category_id: z.string().min(1, t("common.requiredField", "This field is required")),
        is_active: z.boolean(),
        sizes: z.array(
          z.object({
            id: z.string().optional(),
            label: z.string().min(1, t("common.requiredField", "This field is required")),
            price_override: z.coerce.number<number>().min(0),
          }),
        ),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
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
      setAddonSearch("");
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

  // Load sizes + allowed addon IDs once the full item arrives (edit).
  useEffect(() => {
    if (liveItem) {
      form.setValue(
        "sizes",
        liveItem.sizes.map((s) => ({ id: s.id, label: s.label, price_override: piastresToEgp(s.price_override) })),
      );
      setAllowedIds(new Set(liveItem.allowed_addon_ids));
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

      // Sizes — one replace-set on the unified endpoint (the server upserts by
      // label and soft-deactivates removed sizes that have order history). The
      // returned Studio aggregate carries the size IDS the recipes need.
      const studio = await putSizes(itemId, {
        sizes: v.sizes.map((s, i) => ({
          label: s.label,
          price: egpToPiastres(s.price_override),
          sort: i,
          is_active: true,
        })),
      });

      // Recipe — replace-set per size on `recipe_lines` (id-keyed: only rows
      // linked to a catalog ingredient are writable; the builder always links).
      for (const size of studio.sizes) {
        const lines = recipeRows
          .filter((r) => r.size_label === size.label && r.org_ingredient_id)
          .map((r) => ({
            ingredient_id: r.org_ingredient_id!,
            quantity: r.quantity_used,
            unit: r.ingredient_unit,
          }));
        await putSizeRecipe(size.id, { lines });
      }

      if (!item && pendingImage) {
        await uploadMenuItemImage(itemId, { image: pendingImage });
      }

      // Offered add-ons — group ATTACHMENTS on the unified model: each selected
      // addon's type maps to its reusable group, the selection becoming that
      // attachment's `included_option_ids`. Empty selection = no attachments
      // (old clients keep their org-default via the shim; new clients author
      // offers in the Studio's Modifiers tab).
      const typeOf = new Map((allAddons ?? []).map((a) => [a.id, a.addon_type]));
      const groupByType = new Map(
        (modifierGroups ?? []).map((g) => [g.legacy_addon_type ?? g.name, g]),
      );
      const byType = new Map<string, string[]>();
      for (const id of allowedIds) {
        const ty = typeOf.get(id);
        if (!ty) continue;
        byType.set(ty, [...(byType.get(ty) ?? []), id]);
      }
      const groups = Array.from(byType.entries()).flatMap(([ty, ids], i) => {
        const g = groupByType.get(ty);
        return g ? [{ group_id: g.id, sort: i, included_option_ids: ids }] : [];
      });
      await putModifierGroups(itemId, { groups });

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

  // Addon picker: group by type, filtered by search query.
  const addonGroups = useMemo(() => {
    const q = addonSearch.trim().toLowerCase();
    const list = (allAddons ?? []).filter((a) => !q || a.name.toLowerCase().includes(q));
    const byType = new Map<string, AddonItem[]>();
    for (const a of list) {
      const arr = byType.get(a.addon_type) ?? [];
      arr.push(a);
      byType.set(a.addon_type, arr);
    }
    return Array.from(byType.entries()).map(([type, items]) => ({ type, items }));
  }, [allAddons, addonSearch]);

  const selectedAddons = useMemo<AddonItem[]>(
    () => (allAddons ?? []).filter((a) => allowedIds.has(a.id)),
    [allAddons, allowedIds],
  );

  const toggleGroup = (items: AddonItem[]) => {
    const allSelected = items.every((a) => allowedIds.has(a.id));
    setAllowedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) items.forEach((a) => next.delete(a.id));
      else items.forEach((a) => next.add(a.id));
      return next;
    });
  };

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
                      <Button type="button" variant="ghost" size="icon-sm" className="mt-6 text-destructive" aria-label={t("menu.removeSize", "Remove size")} onClick={() => remove(idx)}>
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

              {/* Allowed addons */}
              <div className="border-t pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <CupSoda className="size-4 text-primary" />
                  <p className="text-sm font-semibold">{t("menu.addons", "Addons")}</p>
                  <span className="text-xs text-muted-foreground">{t("menu.addonsHint", "Which addons customers can pick for this item")}</span>
                </div>

                {/* Selected addons as removable chips */}
                {selectedAddons.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {selectedAddons.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-xs font-medium"
                      >
                        {a.name}
                        <button
                          type="button"
                          onClick={() => setAllowedIds((prev) => { const next = new Set(prev); next.delete(a.id); return next; })}
                          className="ms-0.5 text-muted-foreground hover:text-foreground"
                          aria-label={t("common.remove", "Remove")}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t("menu.addonsEmpty", "No addons selected — the full org catalog applies.")}
                  </p>
                )}

                {/* Search + grouped picker */}
                <div className="rounded-lg border">
                  <div className="border-b p-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        value={addonSearch}
                        onChange={(e) => setAddonSearch(e.target.value)}
                        placeholder={t("menu.searchAddons", "Search addons…")}
                        className="h-auto py-1.5 ps-8 pe-3 text-xs"
                      />
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto divide-y">
                    {addonGroups.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        {t("menu.noAddonsMatch", "No addons match")}
                      </p>
                    ) : (
                      addonGroups.map(({ type, items }) => {
                        const allGroupSelected = items.every((a) => allowedIds.has(a.id));
                        return (
                          <div key={type}>
                            {/* Group header */}
                            <div className="flex items-center justify-between bg-muted/30 px-3 py-1.5">
                              <span className="text-xs font-semibold text-foreground">
                                {humanizeAddonType(type)}
                                <span className="ms-1.5 font-normal text-muted-foreground">({items.length})</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleGroup(items)}
                                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded"
                              >
                                {allGroupSelected
                                  ? t("common.deselectAll", "Deselect all")
                                  : t("common.selectAll", "Select all")}
                              </button>
                            </div>
                            {/* Group items */}
                            <div className="flex flex-wrap gap-1.5 p-2.5">
                              {items.map((a) => {
                                const active = allowedIds.has(a.id);
                                return (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() =>
                                      setAllowedIds((prev) => {
                                        const next = new Set(prev);
                                        if (active) next.delete(a.id);
                                        else next.add(a.id);
                                        return next;
                                      })
                                    }
                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                                      active
                                        ? "border-border bg-accent text-foreground"
                                        : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                                    }`}
                                  >
                                    {a.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
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
