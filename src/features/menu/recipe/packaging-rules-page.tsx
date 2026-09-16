import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Package, Pencil, Play, Plus, Trash2 } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Combobox } from "@/components/app/combobox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useListCategories, useListMenuCatalog } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { getTranslatedName } from "@/lib/translation";
import { useOrgId } from "@/hooks/use-org-id";
import { invalidateCatalog } from "../util";
import { ownPayload, type GridBlock } from "./grid-model";
import { LabelGridEditor } from "./label-grid-editor";
import { useIngredientPicker } from "./use-ingredient-picker";
import {
  applyPackagingRules,
  createPackagingRule,
  deletePackagingRule,
  packagingRulesKey,
  patchPackagingRule,
  usePackagingRules,
  type ApplyPackagingRulesResult,
  type PackagingRuleOut,
} from "./modeling-api";

const ANY = "";

/**
 * Packaging rules: cups, lids and straws added to sizes by match (item > category
 * + size label > category > size label). Applied on "Apply rules" or whenever an
 * item's sizes / recipe / base are saved.
 */
export function PackagingRulesPage() {
  const { t, i18n } = useTranslation();
  const orgId = useOrgId();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const rulesQ = usePackagingRules(!!orgId);
  const [editing, setEditing] = useState<PackagingRuleOut | "new" | null>(null);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<ApplyPackagingRulesResult | null>(null);

  const categoriesQ = useListCategories({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const itemsQ = useListMenuCatalog({ org_id: orgId ?? "", per_page: 500 }, { query: { enabled: !!orgId } });
  const categoryOptions = useMemo(
    () =>
      (categoriesQ.data ?? []).map((c) => ({
        value: c.id,
        label: getTranslatedName({ name: c.name, name_translations: c.name_translations }, i18n.language),
      })),
    [categoriesQ.data, i18n.language],
  );
  const itemOptions = useMemo(
    () => (itemsQ.data?.data ?? []).map((m) => ({ value: m.id, label: m.name })),
    [itemsQ.data],
  );
  const labelOf = (opts: { value: string; label: string }[], id: string | null) =>
    id ? (opts.find((o) => o.value === id)?.label ?? "—") : null;

  const apply = async () => {
    setApplying(true);
    try {
      const r = await applyPackagingRules();
      setResult(r);
      void invalidateCatalog();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setApplying(false);
    }
  };

  const remove = async (r: PackagingRuleOut) => {
    const ok = await confirm({
      title: t("modeling.packaging.deleteTitle", 'Delete "{{name}}"?', { name: r.name }),
      description: t("modeling.packaging.deleteDesc", "Sizes keep their current packaging until rules are applied again."),
      confirmLabel: t("common.delete", "Delete"),
    });
    if (!ok) return;
    try {
      await deletePackagingRule(r.id);
      void qc.invalidateQueries({ queryKey: packagingRulesKey });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const rules = rulesQ.data ?? [];
  return (
    <Page width="reading">
      <PageHeader
        title={t("modeling.packaging.title", "Packaging rules")}
        subtitle={t(
          "modeling.packaging.subtitle",
          "Cups, lids and straws added to sizes automatically. The most specific matching rule wins.",
        )}
        actions={
          <>
            <Button size="sm" variant="outline" loading={applying} onClick={() => void apply()}>
              <Play className="size-4" /> {t("modeling.packaging.apply", "Apply rules")}
            </Button>
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus className="size-4" /> {t("modeling.packaging.new", "New rule")}
            </Button>
          </>
        }
      />
      {result ? (
        <Alert className="mb-4">
          <AlertTitle>{t("modeling.packaging.appliedTitle", "Rules applied")}</AlertTitle>
          <AlertDescription>
            {t(
              "modeling.packaging.appliedBody",
              "{{seen}} sizes checked · {{withRule}} matched a rule · {{changed}} changed · {{manual}} keep hand-entered packaging",
              {
                seen: result.sizes_seen,
                withRule: result.sizes_with_rule,
                changed: result.sizes_changed,
                manual: result.sizes_with_manual_packaging,
              },
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      {rulesQ.isLoading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : rulesQ.isError ? (
        <ErrorState
          title={t("modeling.packaging.loadError", "Could not load packaging rules")}
          message={getErrorMessage(rulesQ.error)}
          onRetry={() => void rulesQ.refetch()}
        />
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("modeling.packaging.empty", "No packaging rules yet")}
          description={t("modeling.packaging.emptyHint", "e.g. Iced drinks · Cup → 16oz cup, lid, straw.")}
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {rules.map((r) => {
            const match = [
              labelOf(itemOptions, r.match_item_id),
              labelOf(categoryOptions, r.match_category_id),
              r.match_size_label,
            ].filter(Boolean);
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 pe-2 ps-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {r.name}
                    {!r.is_active ? <StatusPill tone="neutral" size="sm">{t("common.inactive", "Inactive")}</StatusPill> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {match.length ? match.join(" · ") : t("modeling.packaging.matchAll", "Every size")}
                    {" → "}
                    {r.lines.map((l) => `${l.ingredient_name} ${Number(l.quantity)}`).join(", ") || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => setEditing(r)} aria-label={t("common.edit", "Edit")}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => void remove(r)}
                    aria-label={t("common.delete", "Delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <RuleDialog
        orgId={orgId}
        rule={editing === "new" ? null : editing}
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        categoryOptions={categoryOptions}
        itemOptions={itemOptions}
      />
    </Page>
  );
}

const RULE_COL = "qty";

function RuleDialog({
  orgId,
  rule,
  open,
  onOpenChange,
  categoryOptions,
  itemOptions,
}: {
  orgId: string | null;
  rule: PackagingRuleOut | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryOptions: { value: string; label: string }[];
  itemOptions: { value: string; label: string }[];
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { catalogById, ingredientOptions } = useIngredientPicker(orgId);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("common.requiredField", "This field is required")),
        match_category_id: z.string(),
        match_size_label: z.string(),
        match_item_id: z.string(),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", match_category_id: ANY, match_size_label: "", match_item_id: ANY, is_active: true },
  });
  const [blocks, setBlocks] = useState<GridBlock[]>([]);
  const qtyLabel = t("common.quantity", "Quantity");

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: rule?.name ?? "",
      match_category_id: rule?.match_category_id ?? ANY,
      match_size_label: rule?.match_size_label ?? "",
      match_item_id: rule?.match_item_id ?? ANY,
      is_active: rule?.is_active ?? true,
    });
    setBlocks([
      {
        key: RULE_COL,
        label: qtyLabel,
        lines: (rule?.lines ?? []).map((l) => ({
          ingredient_id: l.ingredient_id,
          quantity: String(Number(l.quantity)),
          unit: l.unit,
        })),
      },
    ]);
  }, [open, rule, form, qtyLabel]);

  const submit = async (v: Values) => {
    const body = {
      name: v.name.trim(),
      match_category_id: v.match_category_id || null,
      match_size_label: v.match_size_label.trim() || null,
      match_item_id: v.match_item_id || null,
      is_active: v.is_active,
      lines: ownPayload(blocks[0]?.lines ?? []),
    };
    try {
      if (rule) await patchPackagingRule(rule.id, body);
      else await createPackagingRule(body);
      toast.success(t("modeling.packaging.saved", "Rule saved. Apply rules to update existing sizes."));
      void qc.invalidateQueries({ queryKey: packagingRulesKey });
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? t("modeling.packaging.edit", "Edit rule") : t("modeling.packaging.new", "New rule")}</DialogTitle>
          <DialogDescription>
            {t("modeling.packaging.matchHelp", "Leave a match empty to match any. An item match beats category + size, which beats either alone.")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.name", "Name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="match_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("modeling.packaging.matchCategory", "Menu category")}</FormLabel>
                    <Combobox
                      options={[{ value: ANY, label: t("modeling.packaging.any", "Any") }, ...categoryOptions]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="match_size_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("modeling.packaging.matchSize", "Size label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("modeling.packaging.any", "Any")} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="match_item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("modeling.packaging.matchItem", "Item")}</FormLabel>
                    <Combobox
                      options={[{ value: ANY, label: t("modeling.packaging.any", "Any") }, ...itemOptions]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />
            </div>
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
              gridId="rule-lines"
              blocks={blocks}
              onChange={setBlocks}
              catalogById={catalogById}
              ingredientOptions={ingredientOptions}
            />
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
