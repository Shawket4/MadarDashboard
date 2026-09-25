/**
 * The combo editor (`/menu/combos/$comboId`, `new` for a new one): one page,
 * one Save through `PUT /combos/{id}` (or `POST /combos`), the image through
 * the menu item upload after it.
 *
 * - General: names, category, description, image, price, active.
 * - Slots: what the customer picks, with surcharges and size rules (C1, C9).
 * - Availability: optional windows with days, hours, dates and a branch (C4, §11.3).
 * - Branches: the branch price and on/off live in Pricing & Availability, and
 *   the channels in Settings (§11.1: org-wide, NO per-combo channel toggles).
 * - Price check: live economics, warnings that never block Save (C11).
 *
 * Without `menu.combos.edit` the page is read-only: every control disabled,
 * no Save — never a button whose only outcome is a 403.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { ErrorState } from "@/components/app/empty-state";
import { ImageUploader } from "@/components/app/image-uploader";
import { StatusPill } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Restricted } from "@/components/app/restricted";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "@/components/ui/form";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { useScope } from "@/data/scope/use-scope";
import { Cap } from "@/generated/capabilities";
import { useDebounced } from "@/lib/use-debounced";

import { createCombo, deleteCombo, updateCombo, uploadComboImage, useCombo } from "./api";
import { EconomicsPanel } from "./economics-panel";
import {
  EMPTY_COMBO,
  comboSchema,
  fromWire,
  toEconomicsBody,
  toWire,
  type ComboFormInput,
  type ComboFormValues,
} from "./form-schema";
import { SlotsEditor } from "./slots-editor";
import { useMenuOptions } from "./use-menu-options";
import { invalidateCombos, isFixedShape } from "./util";
import { WindowsEditor, type WindowErrors } from "./windows-editor";

const routeApi = getRouteApi("/_app/menu/combos_/$comboId");
const NONE = "__none__";

/** A coded refusal about one slot names it in the page's words (COMBO_SLOT_INVALID {slot_index}). */
function saveErrorMessage(e: unknown, v: ComboFormValues, t: (k: string, o?: Record<string, unknown>) => string): string {
  if (e instanceof AxiosError) {
    const data = e.response?.data as { code?: string; vars?: Record<string, unknown> } | undefined;
    const idx = Number(data?.vars?.slot_index);
    if (data?.code === "COMBO_SLOT_INVALID" && Number.isInteger(idx)) {
      const slot = v.slots[idx]?.name || t("combos.slots.slotN", { defaultValue: "Slot {{n}}", n: idx + 1 });
      return t("errors.codes.COMBO_SLOT_INVALID", { slot });
    }
  }
  return getErrorMessage(e);
}

export function ComboEditorPage() {
  const { comboId } = routeApi.useParams();
  const isNew = comboId === "new";
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const authz = useAuthz();
  const canRead = authz.can(Cap.menuItemsRead);
  const canEdit = authz.can(Cap.menuCombosEdit);
  const { branchId } = useScope();

  const comboQ = useCombo(comboId, {}, { enabled: !isNew && canRead });
  const menu = useMenuOptions(canRead);

  const form = useForm<ComboFormInput, unknown, ComboFormValues>({
    resolver: zodResolver(comboSchema),
    defaultValues: EMPTY_COMBO,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const previewUrl = useMemo(() => (pendingImage ? URL.createObjectURL(pendingImage) : null), [pendingImage]);
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);
  const [saving, setSaving] = useState(false);

  // Seed once per combo; a background refetch never clobbers an edit.
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (isNew) {
      if (seededFor.current !== "new") form.reset(EMPTY_COMBO);
      seededFor.current = "new";
      return;
    }
    if (comboQ.data && seededFor.current !== comboQ.data.id) {
      form.reset(fromWire(comboQ.data));
      setPendingImage(null);
      seededFor.current = comboQ.data.id;
    }
  }, [isNew, comboQ.data, form]);

  const values = useWatch({ control: form.control }) as ComboFormInput;
  const econBody = useDebounced(useMemo(() => toEconomicsBody(values), [values]), 450);
  // Stable identity for the query key: only a changed body asks again.
  const econKey = JSON.stringify(econBody);
  const stableBody = useMemo(() => (econKey === "null" ? null : (JSON.parse(econKey) as typeof econBody)), [econKey]);

  const dirty = form.formState.isDirty || pendingImage !== null;
  useEffect(() => {
    if (!dirty || !canEdit) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty, canEdit]);

  const goBack = () => void navigate({ to: "/menu/combos" });

  const submit = async (v: ComboFormValues) => {
    if (saving) return;
    setSaving(true);
    try {
      const body = toWire(v);
      const saved = isNew ? await createCombo(body) : await updateCombo(comboId, body);
      if (pendingImage) {
        try {
          await uploadComboImage(saved.id, pendingImage);
        } catch (e) {
          toast.error(t("combos.imageFailed", { defaultValue: "The combo was saved, but its image wasn't: {{error}}", error: getErrorMessage(e) }));
        }
      }
      setPendingImage(null);
      form.reset(fromWire(saved));
      seededFor.current = saved.id;
      toast.success(isNew ? t("combos.created", "Combo created") : t("common.savedChanges", "Changes saved"));
      void invalidateCombos();
      if (isNew) void navigate({ to: "/menu/combos/$comboId", params: { comboId: saved.id }, replace: true });
    } catch (e) {
      toast.error(saveErrorMessage(e, v, t));
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = (errors: FieldErrors<ComboFormValues>) => {
    // Say it, and take the owner to it: a Save that silently does nothing is the worst outcome.
    toast.error(t("combos.fixErrors", "Some fields need attention before saving."));
    const first = document.querySelector<HTMLElement>("[aria-invalid='true'], [role='alert']");
    first?.scrollIntoView?.({ block: "center" });
    void errors;
  };

  const remove = async () => {
    const ok = await confirm({
      title: t("combos.deleteTitle", { defaultValue: "Delete {{name}}?", name: form.getValues("name") }),
      description: t(
        "combos.deleteBody",
        "It leaves the menu at every branch and on every channel. Past orders keep their lines and still show in the Bundles report.",
      ),
      confirmLabel: t("common.delete", "Delete"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteCombo(comboId);
      toast.success(t("combos.deleted", "Combo deleted"));
      void invalidateCombos();
      form.reset(form.getValues());
      goBack();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const title = isNew ? t("combos.new", "New combo") : t("combos.title", "Combos");
  if (authz.ready && !canRead) return <Restricted title={title} />;

  if (!isNew && comboQ.isLoading) {
    return (
      <Page>
        <PageHeader back={{ onClick: goBack }} title={<Skeleton className="h-7 w-56" />} />
        <div className="space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </Page>
    );
  }
  if (!isNew && (comboQ.isError || !comboQ.data)) {
    return (
      <Page>
        <PageHeader back={{ onClick: goBack }} title={title} />
        <ErrorState
          title={t("combos.loadError", "Couldn't load this combo")}
          message={comboQ.error ? getErrorMessage(comboQ.error) : undefined}
          onRetry={() => void comboQ.refetch()}
          retrying={comboQ.isFetching}
        />
      </Page>
    );
  }

  const ro = !canEdit;
  const errs = form.formState.errors;
  const fixed = isFixedShape(
    (values.slots ?? []).filter(Boolean).map((s) => ({
      min: Number(s.min),
      max: Number(s.max),
      choices: (s.choices ?? []).filter(Boolean).map((c) => ({ menu_item_id: c.target === "item" ? c.menu_item_id : null, category_id: c.target === "category" ? c.category_id : null })),
    })),
  );
  const imageUrl = previewUrl ?? comboQ.data?.image_url ?? null;
  const name = values.name?.trim() || (isNew ? t("combos.new", "New combo") : t("combos.untitled", "Untitled combo"));
  const branchLabel = branchId ? (menu.branchName(branchId) ?? "—") : t("combos.econ.orgPrices", "organisation prices");
  const msg = (e: unknown): string | undefined => (e as { message?: string } | undefined)?.message;
  const windowErrors = (errs.windows as unknown as Record<string, unknown>[] | undefined)?.map((w) =>
    w ? ({ weekdays: msg(w.weekdays), ends_at: msg(w.ends_at), valid_to: msg(w.valid_to) } satisfies WindowErrors) : undefined,
  );

  return (
    <Page className="pb-24">
      <PageHeader
        back={{ onClick: goBack }}
        title={name}
        subtitle={
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <StatusPill tone="info" size="sm">
              {fixed ? t("combos.fixedBundle", "Fixed bundle") : t("combos.mealDeal", "Meal deal")}
            </StatusPill>
            {values.is_active === false ? (
              <StatusPill tone="neutral" size="sm">
                {t("common.inactive", "Inactive")}
              </StatusPill>
            ) : null}
            {ro ? (
              <StatusPill tone="neutral" size="sm">
                {t("combos.readOnly", "Read only")}
              </StatusPill>
            ) : null}
          </span>
        }
        actions={
          !isNew && canEdit ? (
            <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => void remove()}>
              <Trash2 className="size-4" /> {t("common.delete", "Delete")}
            </Button>
          ) : undefined
        }
      />

      <Form {...form}>
        <form
          noValidate
          onSubmit={(e) => void form.handleSubmit(submit, onInvalid)(e)}
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div className="min-w-0 space-y-6">
            <Section id="combo-general" title={t("combos.sections.general", "General")}>
              <fieldset disabled={ro} className="flex min-w-0 flex-col gap-5 sm:flex-row">
                <div className="shrink-0">
                  <ImageUploader
                    value={imageUrl}
                    onUpload={(file) => {
                      setPendingImage(file);
                      return Promise.resolve("");
                    }}
                    onRemove={pendingImage ? () => setPendingImage(null) : undefined}
                    hint={t("menu.imageHint", "PNG/JPG/WebP, up to 5 MB")}
                    disabled={ro}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="combo-name">{t("combos.name", "Name")}</Label>
                      <Input id="combo-name" aria-invalid={!!errs.name} {...form.register("name")} />
                      {errs.name?.message ? (
                        <p role="alert" className="text-xs text-destructive">
                          {t(errs.name.message)}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="combo-name-ar">{t("combos.nameAr", "Name (Arabic)")}</Label>
                      <Input id="combo-name-ar" dir="rtl" {...form.register("name_ar")} />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="combo-price">{t("combos.price", "Combo price")}</Label>
                      <Input
                        id="combo-price"
                        inputMode="decimal"
                        dir="ltr"
                        className="font-mono"
                        aria-invalid={!!errs.price}
                        aria-describedby="combo-price-hint"
                        {...form.register("price")}
                      />
                      {errs.price?.message ? (
                        <p role="alert" className="text-xs text-destructive">
                          {t(errs.price.message)}
                        </p>
                      ) : (
                        <p id="combo-price-hint" className="text-xs text-muted-foreground">
                          {t("combos.priceHint", "Covers each slot's included size. Extras, bigger sizes and add-ons are added on top.")}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="combo-category">{t("combos.col.category", "Category")}</Label>
                      <Controller
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)} disabled={ro}>
                            <SelectTrigger id="combo-category" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>{t("combos.noCategory", "No category")}</SelectItem>
                              {menu.categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <p className="text-xs text-muted-foreground">{t("combos.categoryHint", "Where the combo shows on the till and the menus.")}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="combo-description">{t("combos.description", "Description")}</Label>
                      <Textarea id="combo-description" rows={2} {...form.register("description")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="combo-description-ar">{t("combos.descriptionAr", "Description (Arabic)")}</Label>
                      <Textarea id="combo-description-ar" dir="rtl" rows={2} {...form.register("description_ar")} />
                    </div>
                  </div>
                  <Controller
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
                        <div>
                          <Label htmlFor="combo-active">{t("combos.active", "On the menu")}</Label>
                          <p className="text-xs text-muted-foreground">{t("combos.activeHint", "Off hides it everywhere without deleting it.")}</p>
                        </div>
                        <Switch id="combo-active" checked={!!field.value} onCheckedChange={field.onChange} disabled={ro} />
                      </div>
                    )}
                  />
                </div>
              </fieldset>
            </Section>

            <Section
              id="combo-slots"
              title={t("combos.sections.slots", "Slots")}
              description={t(
                "combos.sections.slotsDesc",
                "What the customer picks. One slot with one item and a fixed count makes a fixed bundle; several choices make a meal deal.",
              )}
            >
              <SlotsEditor menu={menu} disabled={ro} />
            </Section>

            <Section
              id="combo-availability"
              title={t("combos.sections.availability", "Availability")}
              description={t("combos.sections.availabilityDesc", "Optional. With no window it is on sale whenever the menu is.")}
            >
              <Controller
                control={form.control}
                name="windows"
                render={({ field }) => (
                  <WindowsEditor
                    idPrefix="combo"
                    value={(field.value ?? []) as ComboFormValues["windows"]}
                    onChange={field.onChange}
                    branches={menu.branches}
                    errors={windowErrors}
                    disabled={ro}
                  />
                )}
              />
            </Section>

            <Section id="combo-branches" title={t("combos.sections.branches", "Branches and channels")}>
              <div className="space-y-3 text-sm">
                <LinkRow
                  to="/menu/pricing"
                  label={t("combos.branches.pricing", "Branch prices and on/off")}
                  hint={t("combos.branches.pricingHint", "A branch or delivery channel can have its own combo price, or not sell it, in Pricing & Availability.")}
                />
                <LinkRow
                  to="/settings/combos"
                  label={t("combos.branches.channels", "Where combos are sold")}
                  hint={t("combos.branches.channelsHint", "POS, QR, online and delivery are switched for every combo at once, with branch exceptions, in Settings.")}
                />
              </div>
            </Section>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-4">
            <EconomicsPanel
              body={stableBody}
              branchId={branchId}
              branchLabel={branchLabel}
              names={{
                item: menu.itemName,
                slot: (id) => (values.slots ?? []).find((s) => s.id === id)?.name,
              }}
            />
          </aside>

          {canEdit ? (
            <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
              <div className="pointer-events-auto flex items-center gap-3 rounded-full border bg-card/95 px-4 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
                <span className="text-sm font-medium">
                  {dirty ? t("combos.unsaved", "Unsaved changes") : isNew ? t("combos.notSavedYet", "Not saved yet") : t("combos.allSaved", "All changes saved")}
                </span>
                {dirty && !isNew ? (
                  <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => (comboQ.data ? (form.reset(fromWire(comboQ.data)), setPendingImage(null)) : undefined)}>
                    {t("combos.discard", "Discard")}
                  </Button>
                ) : null}
                <Button type="submit" size="sm" loading={saving} disabled={saving || (!dirty && !isNew)}>
                  {isNew ? t("combos.create", "Create combo") : t("common.save", "Save")}
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </Form>
    </Page>
  );
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 space-y-4">
      <header className="space-y-0.5">
        <h2 id={`${id}-title`} className="text-base font-semibold tracking-[-0.005em]">
          {title}
        </h2>
        {description ? <p className="max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function LinkRow({ to, label, hint }: { to: string; label: string; hint: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
    </Link>
  );
}
