import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createUser, updateUser, useListOrgs } from "@/data/api/generated/api";
import type { UserPublic, UserRole } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthStore } from "@/data/stores/auth.store";
import { invalidateUsers } from "./util";

const ALL_ROLES: UserRole[] = ["super_admin", "org_admin", "branch_manager", "teller"];

interface Props {
  orgId: string;
  user: UserPublic | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function UserDialog({ orgId, user, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const editing = !!user;
  const [busy, setBusy] = useState(false);
  const currentRole = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = currentRole === "super_admin";

  const { data: orgs = [] } = useListOrgs({ query: { enabled: isSuperAdmin && !editing } });

  const availableRoles = useMemo<UserRole[]>(
    () => isSuperAdmin ? ALL_ROLES : currentRole === "branch_manager" ? ["teller"] : ALL_ROLES.filter((r) => r !== "super_admin"),
    [isSuperAdmin, currentRole],
  );

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        email: z.string().email(t("common.invalidEmail", "Invalid email")).optional().or(z.literal("")),
        phone: z.string().optional(),
        role: z.enum(["super_admin", "org_admin", "branch_manager", "teller"]),
        org_id: z.string().optional(),
        pin: z.string().regex(/^\d{4,6}$/, t("users.pinError", "PIN must be 4-6 digits")).optional().or(z.literal("")),
        password: z.string().optional(),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", role: "teller", org_id: orgId, pin: "", password: "", is_active: true },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        role: (user?.role as UserRole) ?? (currentRole === "branch_manager" ? "teller" : "teller"),
        org_id: user?.org_id ?? orgId,
        pin: "",
        password: "",
        is_active: user?.is_active ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, orgId]);

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      if (user) {
        await updateUser(user.id, {
          name: v.name, email: v.email || null, phone: v.phone || null, role: v.role, is_active: v.is_active,
          ...(v.pin ? { pin: v.pin } : {}), ...(v.password ? { password: v.password } : {}),
        });
      } else {
        await createUser({
          name: v.name, role: v.role, org_id: (isSuperAdmin ? v.org_id : orgId) || orgId,
          email: v.email || null, phone: v.phone || null,
          ...(v.pin ? { pin: v.pin } : {}), ...(v.password ? { password: v.password } : {}),
        });
      }
      void invalidateUsers();
      toast.success(editing ? t("users.updatedToast", "User updated") : t("users.createdToast", "User created"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("users.editTitle", "Edit User") : t("users.newTitle", "New User")}</DialogTitle>
          <DialogDescription>{t("users.subtitle", "Manage staff accounts and access")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>{t("users.fullName", "Full Name")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>{t("auth.email", "Email")}</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>{t("users.phone", "Phone")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="pin" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.pin", "PIN (4-6 digits)")}</FormLabel>
                  <FormControl><Input type="password" inputMode="numeric" maxLength={6} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} placeholder={editing ? "••••" : ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>{t("auth.password", "Password")}</FormLabel><FormControl><Input type="password" {...field} value={field.value ?? ""} placeholder={editing ? t("users.leaveBlank", "Leave blank to keep") : t("common.optional", "Optional")} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.role", "Role")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{availableRoles.map((r) => <SelectItem key={r} value={r}>{t(`roles.${r}`, r)}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {isSuperAdmin && !editing ? (
                <FormField control={form.control} name="org_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("users.org", "Organization")}</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              ) : null}
            </div>
            {editing ? (
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div><FormLabel>{t("users.activeAccount", "Active Account")}</FormLabel><p className="text-xs text-muted-foreground">{t("users.activeHint", "Inactive users cannot log in")}</p></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" loading={busy}>{editing ? t("common.saveChanges", "Save Changes") : t("common.create", "Create")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
