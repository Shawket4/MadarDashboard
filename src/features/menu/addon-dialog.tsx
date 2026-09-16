import { useEffect, useMemo, useState } from "react";
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
import { Plus } from "lucide-react";
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
  createOption,
  patchOption,
  useListGroups,
} from "@/data/api/generated/api";
import type { AddonItem } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, piastresToEgp } from "@/lib/format";
import { arOf, invalidateCatalog } from "./util";
import { GroupEditorDialog } from "./groups/group-editor-dialog";

interface Props {
  orgId: string;
  addon: AddonItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Add-on editor on the UNIFIED model: an add-on is a modifier OPTION inside a
 * reusable group. The add-on is created inside an EXISTING group picked by
 * name; a missing group is made in the choice-group editor ("New group"), which
 * sets its legacy type from what choosing does. Groups are never created here
 * implicitly (that named them after their type and blocked a second bean
 * group). Moving an existing option between groups isn't supported inline.
 */
export function AddonDialog({ orgId, addon, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const editing = !!addon;

  const groupsQ = useListGroups({ org_id: orgId }, { query: { enabled: open && !!orgId } });
  const groups = useMemo(() => groupsQ.data ?? [], [groupsQ.data]);

  // Shared groups only; the item-private "Options" sets carry no legacy type.
  const groupChoices = useMemo(() => groups.filter((g) => g.legacy_addon_type != null), [groups]);
  const [newGroup, setNewGroup] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        name_ar: z.string().optional(),
        group_id: z.string().min(1, t("common.requiredField", "This field is required")),
        default_price: z.coerce.number<number>().min(0),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", name_ar: "", group_id: "", default_price: 0, is_active: true },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: addon?.name ?? "",
        name_ar: arOf(addon?.name_translations),
        group_id: "",
        default_price: addon ? piastresToEgp(addon.default_price) : 0,
        is_active: addon?.is_active ?? true,
      });
    }
  }, [open, addon, form]);

  // Editing: show the option's group once the group list is in.
  const addonGroupId = addon ? (groups.find((g) => g.options.some((o) => o.id === addon.id))?.id ?? "") : "";
  useEffect(() => {
    if (open && addonGroupId) form.setValue("group_id", addonGroupId);
  }, [open, addonGroupId, form]);

  const onDone = () => {
    toast.success(t("common.savedChanges", "Changes saved"));
    void invalidateCatalog();
    onOpenChange(false);
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
        await createOption(v.group_id, {
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
                name="group_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("menu.groups.addonGroup", "Group")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={editing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("common.select", "Select…")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groupChoices.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editing ? (
                      <p className="text-xs text-muted-foreground">
                        {t("menu.addonTypeLocked", "The type (group) can't change — recreate the add-on to move it.")}
                      </p>
                    ) : (
                      <Button type="button" variant="link" size="sm" className="h-auto justify-start p-0" onClick={() => setNewGroup(true)}>
                        <Plus className="size-3.5" /> {t("menu.groups.new", "New group")}
                      </Button>
                    )}
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
        {newGroup ? (
          <GroupEditorDialog
            orgId={orgId}
            group={null}
            open={newGroup}
            onOpenChange={setNewGroup}
            onSaved={(g) => {
              void groupsQ.refetch();
              form.setValue("group_id", g.id, { shouldValidate: true });
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
