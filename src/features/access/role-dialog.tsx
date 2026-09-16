import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRole, renameRole } from "@/data/api/generated/api";
import type { RoleView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { ROLE_KIND_LABELS, type RoleKind } from "@/generated/capabilities";

import { bilingual } from "./catalog";

const KINDS: RoleKind[] = ["branch_manager", "teller", "waiter", "kitchen"];
const NONE = "none";

const schema = z.object({
  name_en: z.string().trim().min(1).max(80),
  name_ar: z.string().trim().min(1).max(80),
  kind: z.enum(["branch_manager", "teller", "waiter", "kitchen"]),
  copy_from: z.string(),
});
type Values = z.infer<typeof schema>;

export function RoleDialog({
  open,
  onOpenChange,
  role,
  roles,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** null = create */
  role: RoleView | null;
  roles: RoleView[];
  onSaved: (r: RoleView) => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name_en: role?.name_en ?? "",
      name_ar: role?.name_ar ?? "",
      kind: (KINDS.includes(role?.kind as RoleKind) ? role?.kind : "teller") as Values["kind"],
      copy_from: NONE,
    },
  });
  const kind = form.watch("kind");

  const submit = async (v: Values) => {
    try {
      const saved = role
        ? await renameRole(role.id, { name_en: v.name_en, name_ar: v.name_ar })
        : await createRole({
            name_en: v.name_en,
            name_ar: v.name_ar,
            kind: v.kind,
            copy_from: v.copy_from === NONE ? null : v.copy_from,
          });
      onSaved(saved);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? t("access.renameRole", "Rename role") : t("access.newRole", "New role")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("access.nameEn", "Name (English)")}</FormLabel>
                  <FormControl><Input {...field} dir="ltr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("access.nameAr", "Name (Arabic)")}</FormLabel>
                  <FormControl><Input {...field} dir="rtl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!role ? (
              <>
                <FormField
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("access.kind", "Works like")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {KINDS.map((k) => (
                            <SelectItem key={k} value={k}>{bilingual(ROLE_KIND_LABELS[k].en, ROLE_KIND_LABELS[k].ar, lang)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="copy_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("access.copyFrom", "Start from")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>{t("access.copyDefaults", "The usual defaults")}</SelectItem>
                          {roles
                            .filter((r) => r.kind === kind)
                            .map((r) => (
                              <SelectItem key={r.id} value={r.id}>{bilingual(r.name_en, r.name_ar, lang)}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>{t("common.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
