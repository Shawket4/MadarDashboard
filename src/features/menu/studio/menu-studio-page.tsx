import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Boxes, Copy, Info } from "lucide-react";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useConfirm } from "@/components/app/confirm-dialog";
import {
  duplicateItem,
  putItemOptions,
  putModifierGroups,
  putSizeRecipe,
  putSizes,
  updateMenuItem,
  uploadMenuItemImage,
  useGetStudio,
  useListCatalog,
} from "@/data/api/generated/api";
import type { ItemOptionInput, StudioAggregate } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { useOrgId } from "@/hooks/use-org-id";
import { invalidateCatalog } from "../util";
import {
  EMPTY_PRISTINE,
  invalidateIngredientCosts,
  invalidateStudio,
  itemSig,
  modifiersSig,
  optionsSig,
  recipeSig,
  sizesSig,
  toAttachDrafts,
  toItemValues,
  toOptionRows,
  toSizeBlocks,
  type AttachDraft,
  type ItemDraftValues,
  type OptionRowDraft,
  type PristineSigs,
  type SizeBlockDraft,
} from "./util";
import { SectionItem } from "./section-item";
import { SectionSizes } from "./section-sizes";
import { SectionModifiers } from "./section-modifiers";
import { SectionOptions } from "./section-options";

const routeApi = getRouteApi("/_app/menu/items/$itemId");

/** Old `?tab=` deep links → section anchors. `availability` (and anything else
 * without a section) lands on the header, whose pricing link is its new home. */
const TAB_TO_SECTION: Record<string, string> = {
  basics: "item",
  sizes: "sizes",
  recipe: "sizes",
  modifiers: "modifiers",
  options: "options",
};

const EMPTY_ITEM: ItemDraftValues = {
  name: "",
  name_ar: "",
  description: "",
  description_ar: "",
  category_id: "",
  is_active: true,
};

/**
 * Menu Studio — ONE scrollable editor for a menu item (item · sizes+recipes ·
 * modifiers · item-only options) with a single dirty store and ONE batched save.
 * Branch/channel pricing & availability live exclusively on /menu/pricing; the
 * header links there instead of duplicating that data here.
 *
 * Save orchestration (sequential, order matters — see save()):
 *   validate → updateMenuItem (+image) → putSizes → putSizeRecipe per dirty/new
 *   size → putModifierGroups → putItemOptions → invalidate + one toast.
 * Each section's pristine signature is re-baselined only after ITS step succeeds;
 * a failing step toasts which section failed and stops — earlier writes stand
 * (idempotent replace-sets) and retrying Save re-runs only what's still dirty.
 */
export function MenuStudioPage() {
  const { t, i18n } = useTranslation();
  const { itemId } = routeApi.useParams();
  const { tab } = routeApi.useSearch();
  const navigate = useNavigate();
  const orgId = useOrgId();
  const confirm = useConfirm();

  const studioQ = useGetStudio(itemId, { query: { enabled: !!itemId } });
  const studio = studioQ.data;

  // Org ingredient catalog — shared by the sizes (recipe) and options sections.
  const catalogQ = useListCatalog(orgId ?? "", { query: { enabled: !!orgId } });
  // Stable identity: `data ?? []` mints a fresh [] every render,
  // invalidating every useMemo keyed on it (react-hooks v7 catch).
  const catalog = useMemo(() => catalogQ.data ?? [], [catalogQ.data]);
  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const ingredientOptions = useMemo(
    () =>
      catalog
        .filter((c) => c.is_active)
        .map((c) => ({ value: c.id, label: c.name, hint: t(`units.${c.unit}`, c.unit), keywords: c.category })),
    [catalog, t],
  );

  // ── Draft state (the single dirty store) ────────────────────────────────────
  const form = useForm<ItemDraftValues>({ defaultValues: EMPTY_ITEM });
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [blocks, setBlocks] = useState<SizeBlockDraft[]>([]);
  const [attached, setAttached] = useState<AttachDraft[]>([]);
  const [rows, setRows] = useState<OptionRowDraft[]>([]);
  const [pristine, setPristine] = useState<PristineSigs>(EMPTY_PRISTINE);
  const [saving, setSaving] = useState(false);

  // Local object-URL preview for a staged (not yet uploaded) image file.
  const previewUrl = useMemo(() => (pendingImage ? URL.createObjectURL(pendingImage) : null), [pendingImage]);
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  // ── Dirty flags (signature vs pristine, per section) ────────────────────────
  const itemValues = form.watch();
  const itemFieldsDirty = !!studio && itemSig(itemValues) !== pristine.item;
  const imageDirty = pendingImage !== null || imageRemoved;
  const itemDirty = !!studio && (itemFieldsDirty || imageDirty);
  const sizesDirty = !!studio && sizesSig(blocks) !== pristine.sizes;
  const recipeDirtyKeys = useMemo(() => {
    const dirty = new Set<string>();
    for (const b of blocks) {
      const base = pristine.recipes[b.key];
      if (base === undefined || recipeSig(b.lines) !== base) dirty.add(b.key);
    }
    return dirty;
  }, [blocks, pristine.recipes]);
  const anyRecipeDirty = recipeDirtyKeys.size > 0;
  const modifiersDirty = !!studio && modifiersSig(attached) !== pristine.modifiers;
  const optionsDirty = !!studio && optionsSig(rows) !== pristine.options;
  const sizesSectionDirty = sizesDirty || anyRecipeDirty;
  const dirtyCount =
    (itemDirty ? 1 : 0) + (sizesSectionDirty ? 1 : 0) + (modifiersDirty ? 1 : 0) + (optionsDirty ? 1 : 0);

  // ── Seeding from the server aggregate ───────────────────────────────────────
  // Re-seed whenever the aggregate refetches, but never clobber a dirty section
  // (mid-edit refetches happen — e.g. an inline ingredient-cost fix). `force`
  // overrides for Discard and when the route's item changes.
  const dirtyRef = useRef({ item: false, image: false, sizes: false, modifiers: false, options: false });
  dirtyRef.current = {
    item: itemFieldsDirty,
    image: imageDirty,
    sizes: sizesDirty || anyRecipeDirty,
    modifiers: modifiersDirty,
    options: optionsDirty,
  };

  const seedFrom = useCallback(
    (s: StudioAggregate, force: boolean) => {
      const d = dirtyRef.current;
      const seedItem = force || !d.item;
      const seedSizes = force || !d.sizes;
      const seedModifiers = force || !d.modifiers;
      const seedOptions = force || !d.options;

      const itemV = toItemValues(s);
      const sizeBlocks = toSizeBlocks(s);
      const attachDrafts = toAttachDrafts(s);
      const optionRows = toOptionRows(s);

      if (seedItem) form.reset(itemV);
      if (force || !d.image) {
        setPendingImage(null);
        setImageRemoved(false);
      }
      if (seedSizes) setBlocks(sizeBlocks);
      if (seedModifiers) setAttached(attachDrafts);
      if (seedOptions) setRows(optionRows);

      setPristine((prev) => {
        const next: PristineSigs = { ...prev, recipes: { ...prev.recipes } };
        if (seedItem) next.item = itemSig(itemV);
        if (seedSizes) {
          next.sizes = sizesSig(sizeBlocks);
          next.recipes = Object.fromEntries(sizeBlocks.map((b) => [b.key, recipeSig(b.lines)]));
        }
        if (seedModifiers) next.modifiers = modifiersSig(attachDrafts);
        if (seedOptions) next.options = optionsSig(optionRows);
        return next;
      });
    },
    [form],
  );

  const seededForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!studio) return;
    const force = seededForRef.current !== studio.id;
    seedFrom(studio, force);
    seededForRef.current = studio.id;
  }, [studio, seedFrom]);

  // ── Unsaved-changes guard (browser/tab close) ───────────────────────────────
  const anyDirty = dirtyCount > 0;
  useEffect(() => {
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  // ── Old `?tab=` deep links → scroll to the mapped section once loaded ───────
  const scrolledRef = useRef(false);
  useEffect(() => {
    scrolledRef.current = false;
  }, [itemId]);
  useEffect(() => {
    if (!studio || scrolledRef.current) return;
    scrolledRef.current = true;
    const section = tab ? TAB_TO_SECTION[tab] : undefined;
    if (!section) return;
    requestAnimationFrame(() => {
      document.getElementById(`studio-section-${section}`)?.scrollIntoView({ block: "start" });
    });
  }, [studio, tab]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const goBack = () => void navigate({ to: "/menu/items", search: (prev: Record<string, unknown>) => ({ ...prev }) });

  const onDuplicate = async () => {
    const ok = await confirm({
      title: t("menu.studio.duplicateTitle", "Duplicate this item?"),
      description: t(
        "menu.studio.duplicateDesc",
        "Creates a new item with the same sizes, recipes, modifiers, options and overrides. The copy has no order history.",
      ),
      confirmLabel: t("menu.grid.duplicate", "Duplicate"),
    });
    if (!ok) return;
    try {
      const created = await duplicateItem(itemId);
      const newId = (created as { id?: string }).id;
      toast.success(t("menu.studio.duplicated", "Item duplicated"));
      if (newId) void navigate({ to: "/menu/items/$itemId", params: { itemId: newId }, search: {} });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const discard = () => {
    if (studio) seedFrom(studio, true);
  };

  // ── The single batched save ─────────────────────────────────────────────────
  const save = async () => {
    if (!studio || saving) return;
    const v = form.getValues();

    // 1 · Validate — toast the first violation and abort.
    if (!v.name.trim()) {
      toast.error(t("menu.studio.validate.nameRequired", "Item name is required"));
      return;
    }
    const seenLabels = new Set<string>();
    for (const b of blocks) {
      const label = b.label.trim();
      if (!label) {
        toast.error(t("menu.studio.validate.sizeLabel", "Every size needs a label"));
        return;
      }
      if (seenLabels.has(label)) {
        toast.error(t("menu.studio.validate.sizeLabelDup", 'Size labels must be unique — "{{label}}" repeats', { label }));
        return;
      }
      seenLabels.add(label);
      const p = parseFloat(b.price);
      if (!Number.isFinite(p) || p < 0) {
        toast.error(t("menu.studio.validate.priceFor", 'Enter a valid price for "{{name}}"', { name: label }));
        return;
      }
    }
    for (const r of rows) {
      if (!r.name.trim()) {
        toast.error(t("menu.studio.validate.optionName", "Every option needs a name"));
        return;
      }
      const p = parseFloat(r.price);
      if (!Number.isFinite(p) || p < 0) {
        toast.error(t("menu.studio.validate.priceFor", 'Enter a valid price for "{{name}}"', { name: r.name.trim() }));
        return;
      }
    }

    const fail = (section: string, e: unknown) =>
      toast.error(
        t("menu.studio.saveFailedIn", "Couldn't save {{section}}: {{error}}", {
          section,
          error: getErrorMessage(e),
        }),
      );

    setSaving(true);
    try {
      // 2 · Item details (+ staged image upload / removal).
      if (itemDirty) {
        try {
          if (itemFieldsDirty || imageRemoved) {
            await updateMenuItem(itemId, {
              name: v.name,
              name_translations: v.name_ar ? { ar: v.name_ar } : {},
              description: v.description || null,
              description_translations: v.description_ar ? { ar: v.description_ar } : {},
              category_id: v.category_id || null,
              is_active: v.is_active,
              ...(imageRemoved ? { image_url: null } : {}),
            });
          }
          if (pendingImage) await uploadMenuItemImage(itemId, { image: pendingImage });
        } catch (e) {
          fail(t("menu.studio.basics.title", "Item details"), e);
          return;
        }
        setPristine((p) => ({ ...p, item: itemSig(v) }));
        setPendingImage(null);
        setImageRemoved(false);
      }

      // 3 · Sizes — replace-set. Runs when sizes OR any recipe is dirty, because
      // the fresh aggregate it returns is the only source of size ids for step 4.
      if (sizesDirty || anyRecipeDirty) {
        let agg: StudioAggregate;
        try {
          agg = await putSizes(itemId, {
            sizes: blocks.map((b, i) => ({
              label: b.label.trim(),
              price: egpToPiastres(parseFloat(b.price)),
              sort: i,
              is_active: true,
            })),
          });
        } catch (e) {
          fail(t("menu.studio.sections.sizesTitle", "Sizes, price & recipe"), e);
          return;
        }
        setPristine((p) => ({ ...p, sizes: sizesSig(blocks) }));
        const idByLabel = new Map(agg.sizes.map((s) => [s.label, s.id]));
        // Adopt the server ids locally so a later retry treats them as existing.
        setBlocks((prev) => prev.map((b) => (b.id ? b : { ...b, id: idByLabel.get(b.label.trim()) })));

        // 4 · Recipes — one replace-set per dirty or new size, keyed via label→id.
        for (const b of blocks) {
          if (b.id && !recipeDirtyKeys.has(b.key)) continue;
          const sizeId = idByLabel.get(b.label.trim());
          if (!sizeId) continue;
          const lines = b.lines
            .filter((l) => l.ingredient_id && Number.isFinite(parseFloat(l.quantity)))
            .map((l) => ({ ingredient_id: l.ingredient_id, quantity: parseFloat(l.quantity), unit: l.unit }));
          try {
            await putSizeRecipe(sizeId, { lines });
          } catch (e) {
            fail(t("menu.studio.sectionRecipeFor", 'the recipe for "{{label}}"', { label: b.label.trim() }), e);
            return;
          }
          setPristine((p) => ({ ...p, recipes: { ...p.recipes, [b.key]: recipeSig(b.lines) } }));
        }
      }

      // 5 · Modifier attachments — replace-set in current order.
      if (modifiersDirty) {
        try {
          await putModifierGroups(itemId, {
            groups: attached.map((a, i) => ({
              group_id: a.group_id,
              sort: i,
              min_override: a.min,
              max_override: a.max,
              is_required_override: a.is_required,
              included_option_ids: a.included_option_ids,
            })),
          });
        } catch (e) {
          fail(t("menu.studio.tabs.modifiers", "Modifiers"), e);
          return;
        }
        setPristine((p) => ({ ...p, modifiers: modifiersSig(attached) }));
      }

      // 6 · Item-only options — replace-set.
      if (optionsDirty) {
        const options: ItemOptionInput[] = rows.map((r) => {
          const qty = parseFloat(r.quantity);
          const hasRecipe = !!r.ingredient_id && Number.isFinite(qty);
          return {
            id: r.id ?? undefined,
            name: r.name.trim(),
            price: egpToPiastres(parseFloat(r.price)),
            is_active: r.is_active,
            recipe: hasRecipe ? [{ ingredient_id: r.ingredient_id, quantity: qty, unit: r.unit }] : null,
          };
        });
        try {
          await putItemOptions(itemId, { options });
        } catch (e) {
          fail(t("menu.studio.tabs.options", "Options"), e);
          return;
        }
        setPristine((p) => ({ ...p, options: optionsSig(rows) }));
      }

      // 7 · Refresh + one toast. The refetch re-seeds the pristine state.
      invalidateStudio(itemId);
      void invalidateCatalog();
      toast.success(t("common.savedChanges", "Changes saved"));
    } finally {
      setSaving(false);
    }
  };

  const onCostFixed = useCallback(() => invalidateIngredientCosts(orgId, itemId), [orgId, itemId]);

  // ── Loading / error states ──────────────────────────────────────────────────
  if (studioQ.isLoading) {
    return (
      <Page>
        <div className="mx-auto w-full max-w-4xl space-y-8">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="h-6 w-56" />
            <Skeleton className="ms-auto h-8 w-28 rounded-md" />
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </Page>
    );
  }

  if (studioQ.isError || !studio) {
    return (
      <Page>
        <Button variant="ghost" size="sm" onClick={goBack} className="w-fit -ms-2 text-muted-foreground">
          <ArrowLeft className="size-4 rtl:rotate-180" /> {t("menu.studio.backToItems", "Back to items")}
        </Button>
        <EmptyState
          icon={Info}
          title={t("menu.studio.loadError", "Could not load this item")}
          action={
            <Button variant="outline" onClick={() => void studioQ.refetch()}>
              {t("common.retry", "Retry")}
            </Button>
          }
        />
      </Page>
    );
  }

  const name = getTranslatedName({ name: studio.name, name_translations: studio.name_translations }, i18n.language);
  const imageUrl = previewUrl ?? (imageRemoved ? null : (studio.image_url ?? null));
  const hasRemovableImage = !!previewUrl || (!!studio.image_url && !imageRemoved);

  return (
    <Page className="space-y-0">
      {/* ── Sticky header ── */}
      <div className="sticky top-14 z-20 -mx-4 -mt-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-3 gap-y-1.5 py-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ms-2 text-muted-foreground"
            onClick={goBack}
            aria-label={t("menu.studio.backToItems", "Back to items")}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 truncate text-base font-semibold tracking-tight sm:text-lg">
              {name || t("menu.studio.untitled", "Untitled item")}
            </h1>
            {!studio.is_active ? <Badge variant="secondary">{t("common.inactive", "Inactive")}</Badge> : null}
            {studio.used_in_bundles.length > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="gap-1 font-normal">
                    <Boxes className="size-3.5" aria-hidden="true" />
                    {t("menu.studio.usedInBundlesN", "Used in {{count}} bundles", {
                      count: studio.used_in_bundles.length,
                    })}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <ul className="space-y-0.5">
                    {studio.used_in_bundles.map((b) => (
                      <li key={b.bundle_id}>{b.name}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          <div className="ms-auto flex items-center gap-3">
            <Link
              to="/menu/pricing"
              search={(prev: Record<string, unknown>) => ({ ...prev })}
              className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {t("menu.studio.pricingLink", "Branch & channel pricing")}
              <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            </Link>
            <Button type="button" variant="outline" size="sm" onClick={() => void onDuplicate()}>
              <Copy className="size-4" /> {t("menu.grid.duplicate", "Duplicate")}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="mx-auto w-full max-w-4xl divide-y divide-border pb-16 pt-2">
        <SectionShell
          id="studio-section-item"
          title={t("menu.studio.basics.title", "Item details")}
          description={t("menu.studio.basics.desc", "The name, description and category customers see.")}
          dirty={itemDirty}
        >
          <SectionItem
            form={form}
            orgId={orgId}
            imageUrl={imageUrl}
            onPickImage={(file) => {
              setPendingImage(file);
              setImageRemoved(false);
            }}
            onRemoveImage={
              hasRemovableImage
                ? () => {
                    if (pendingImage) setPendingImage(null);
                    else setImageRemoved(true);
                  }
                : undefined
            }
          />
        </SectionShell>

        <SectionShell
          id="studio-section-sizes"
          title={t("menu.studio.sections.sizesTitle", "Sizes, price & recipe")}
          description={t(
            "menu.studio.sections.sizesDesc",
            "Each size has its own price and recipe. Costs update as you type.",
          )}
          dirty={sizesSectionDirty}
        >
          <SectionSizes
            blocks={blocks}
            setBlocks={setBlocks}
            recipeDirtyKeys={recipeDirtyKeys}
            catalogById={catalogById}
            ingredientOptions={ingredientOptions}
            orgId={orgId}
            onCostFixed={onCostFixed}
          />
        </SectionShell>

        <SectionShell
          id="studio-section-modifiers"
          title={t("menu.studio.tabs.modifiers", "Modifiers")}
          description={t(
            "menu.studio.modifiers.desc",
            "Attach reusable modifier groups. Pick which options are offered and set the rules per item.",
          )}
          dirty={modifiersDirty}
        >
          <SectionModifiers orgId={orgId} itemId={itemId} attached={attached} setAttached={setAttached} />
        </SectionShell>

        <SectionShell
          id="studio-section-options"
          title={t("menu.studio.tabs.options", "Options")}
          description={t(
            "menu.studio.options.desc",
            "Priced add-ons private to this item. Each can optionally deduct an ingredient when chosen.",
          )}
          dirty={optionsDirty}
        >
          <SectionOptions
            rows={rows}
            setRows={setRows}
            catalogById={catalogById}
            ingredientOptions={ingredientOptions}
          />
        </SectionShell>
      </div>

      {/* ── Sticky save bar — only while there are unsaved changes ── */}
      {dirtyCount > 0 ? (
        <div className="pointer-events-none sticky bottom-4 z-30 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border bg-card/95 px-4 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <span className="text-sm font-medium tabular">
              {t("menu.studio.unsavedN", "{{count}} unsaved changes", { count: dirtyCount })}
            </span>
            <Button variant="ghost" size="sm" onClick={discard} disabled={saving}>
              {t("menu.studio.discard", "Discard")}
            </Button>
            <Button size="sm" onClick={() => void save()} loading={saving} disabled={saving}>
              {t("common.save", "Save")}
            </Button>
          </div>
        </div>
      ) : null}
    </Page>
  );
}

/** One editor section: anchor target + quiet heading (with a dirty dot) + body.
 * Flat on the page surface — no card chrome. */
function SectionShell({
  id,
  title,
  description,
  dirty,
  children,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  dirty: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 py-8 first:pt-6">
      <header className="mb-4 space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {dirty ? <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" /> : null}
        </h2>
        {description ? <p className="max-w-prose text-xs text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
