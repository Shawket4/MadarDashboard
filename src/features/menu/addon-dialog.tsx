import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BilingualField } from "@/components/app/bilingual-field";
import {
  createGroup,
  createOption,
  patchOption,
  useListGroups,
} from "@/data/api/generated/api";
import type { AddonItem } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, piastresToEgp } from "@/lib/format";
import { arOf, invalidateCatalog } from "./util";

interface Props {
  orgId: string;
  addon: AddonItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The canonical legacy addon types every org understands (swap families first). */
const CANONICAL_TYPES = ["milk_type", "coffee_type", "extra"] as const;

/**
 * Add-on editor on the UNIFIED model: an add-on is a modifier OPTION inside a
 * reusable group. The type field is a MANAGED dropdown (the group), not free
 * text — creating an option under a type that has no group yet creates the
 * group with `legacy_addon_type` set, so OLD clients keep seeing the option
 * through the shim's flat `type` projection. Moving an existing option between
 * groups isn't supported inline (recreate it under the other type).
 */
export function AddonDialog({ orgId, addon, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const editing = !!addon;

  const groupsQ = useListGroups({ org_id: orgId }, { query: { enabled: open && !!orgId } });
  const groups = useMemo(() => groupsQ.data ?? [], [groupsQ.data]);

  // The selectable "types": every existing group keyed by its legacy type (or
  // name for custom groups) + the canonical trio.
  const typeChoices = useMemo(() => {
    const set = new Set<string>(CANONICAL_TYPES);
    for (const g of groups) set.add(g.legacy_addon_type ?? g.name);
    return Array.from(set).sort();
  }, [groups]);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        name_ar: z.string().optional(),
        addon_type: z.string().min(1, t("common.requiredField", "This field is required")),
        default_price: z.coerce.number<number>().min(0),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", name_ar: "", addon_type: "extra", default_price: 0, is_active: true },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: addon?.name ?? "",
        name_ar: arOf(addon?.name_translations),
        addon_type: addon?.addon_type ?? "extra",
        default_price: addon ? piastresToEgp(addon.default_price) : 0,
        is_active: addon?.is_active ?? true,
      });
    }
  }, [open, addon, form]);

  const onDone = () => {
    toast.success(t("common.savedChanges", "Changes saved"));
    void invalidateCatalog();
    onOpenChange(false);
  };

  /** Find the group presented as `type`, creating it (with the legacy type set,
   * so old clients see its options through the shim) when absent. */
  const ensureGroupId = async (type: string): Promise<string> => {
    const existing = groups.find((g) => (g.legacy_addon_type ?? g.name) === type);
    if (existing) return existing.id;
    const created = await createGroup({
      name: type,
      selection_type: type === "milk_type" ? "single" : "multi",
      min_selections: 0,
      max_selections: type === "milk_type" ? 1 : null,
      is_required: false,
      sort: 0,
      legacy_addon_type: type,
    });
    return created.id;
  };

  const submit = async (v: Values) => {
    const name_translations = v.name_ar ? { ar: v.name_ar } : undefined;
    try {
      if (addon) {
        await patchOption(addon.id, {
          name: v.name,
          name_translations,
          price: egpToPiastres(v.default_price),
          is_active: v.is_active,
        });
      } else {
        const groupId = await ensureGroupId(v.addon_type);
        await createOption(groupId, {
          name: v.name,
          name_translations,
          price: egpToPiastres(v.default_price),
          is_active: v.is_active,
        });
      }
      onDone();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const busy = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("menu.editAddon", "Edit add-on") : t("menu.newAddon", "New add-on")}</DialogTitle>
          <DialogDescription>{t("menu.addonDesc", "Add-ons are modifiers like extra shots or milk types.")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <BilingualField control={form.control} enName="name" arName="name_ar" label={t("common.name", "Name")} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="addon_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("menu.addonType", "Type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={editing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeChoices.map((tp) => (
                          <SelectItem key={tp} value={tp}>
                            {tp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editing ? (
                      <p className="text-xs text-muted-foreground">
                        {t("menu.addonTypeLocked", "The type (group) can't change — recreate the add-on to move it.")}
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="default_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("menu.defaultPrice", "Default price (EGP)")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.active", "Active")}</FormLabel>
                    <FormControl>
                      <div className="pt-2">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" loading={busy}>
                {t("common.save", "Save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
