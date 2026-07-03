import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePutSizes } from "@/data/api/generated/api";
import type { StudioAggregate } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, piastresToEgp } from "@/lib/format";
import { StudioSection } from "./studio-section";

interface Props {
  studio: StudioAggregate;
  itemId: string;
  onSaved: () => void;
}

interface SizeRow {
  id?: string;
  label: string;
  price: string; // EGP text
  is_active: boolean;
}

const toRows = (studio: StudioAggregate): SizeRow[] =>
  [...studio.sizes]
    .sort((a, b) => a.sort - b.sort)
    .map((s) => ({ id: s.id, label: s.label, price: String(piastresToEgp(s.price)), is_active: s.is_active }));

export function SizesTab({ studio, itemId, onSaved }: Props) {
  const { t } = useTranslation();
  const form = useForm<{ rows: SizeRow[] }>({ defaultValues: { rows: toRows(studio) } });
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "rows" });

  useEffect(() => {
    form.reset({ rows: toRows(studio) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.catalog_revision]);

  const save = usePutSizes({
    mutation: {
      onSuccess: () => {
        toast.success(t("common.savedChanges", "Changes saved"));
        onSaved();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const onSubmit = (v: { rows: SizeRow[] }) => {
    const clean = v.rows
      .map((r, i) => ({ label: r.label.trim(), price: r.price, is_active: r.is_active, sort: i }))
      .filter((r) => r.label.length > 0);
    if (clean.length === 0) {
      toast.error(t("menu.studio.sizes.needOne", "Add at least one size."));
      return;
    }
    save.mutate({
      id: itemId,
      data: {
        sizes: clean.map((r) => {
          const n = parseFloat(r.price);
          return {
            label: r.label,
            price: Number.isFinite(n) ? egpToPiastres(n) : 0,
            is_active: r.is_active,
            sort: r.sort,
          };
        }),
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <StudioSection
        title={t("menu.studio.tabs.sizes", "Sizes & pricing")}
        description={t("menu.studio.sizes.desc", "Each size has its own price. Reorder to control how they appear.")}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", price: "0", is_active: true })}>
            <Plus className="size-4" /> {t("menu.addSize", "Add size")}
          </Button>
        }
      >
        {fields.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/30 py-6 text-center text-sm text-muted-foreground">
            {t("menu.studio.sizes.empty", "No sizes yet. Add one to set a price.")}
          </p>
        ) : (
          <div className="space-y-2">
            <div className="hidden grid-cols-[auto_1fr_9rem_auto_auto] items-center gap-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <span className="w-5" />
              <span>{t("menu.sizeLabel", "Label")}</span>
              <span>{t("common.price", "Price")} (EGP)</span>
              <span>{t("common.active", "Active")}</span>
              <span className="w-8" />
            </div>
            {fields.map((f, idx) => (
              <div
                key={f.id}
                className="grid grid-cols-[auto_1fr_9rem_auto_auto] items-center gap-3 rounded-lg border bg-muted/20 p-2 sm:p-3"
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label={t("menu.studio.sizes.moveUp", "Move up")}
                    disabled={idx === 0}
                    onClick={() => move(idx, idx - 1)}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <GripVertical className="size-4" />
                  </button>
                </div>
                <Input
                  placeholder={t("menu.studio.sizes.labelPh", "e.g. Small")}
                  {...form.register(`rows.${idx}.label` as const)}
                />
                <Input type="number" step="0.01" min="0" {...form.register(`rows.${idx}.price` as const)} />
                <div className="flex items-center justify-center">
                  <Switch
                    checked={form.watch(`rows.${idx}.is_active`)}
                    onCheckedChange={(v) => form.setValue(`rows.${idx}.is_active`, v)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  aria-label={t("menu.removeSize", "Remove size")}
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {t(
            "menu.studio.sizes.softDelete",
            "Sizes with order history are deactivated rather than deleted, preserving past orders.",
          )}
        </p>
      </StudioSection>

      <div className="flex items-center justify-end">
        <Button type="submit" loading={save.isPending}>
          {t("common.save", "Save")}
        </Button>
      </div>
    </form>
  );
}
