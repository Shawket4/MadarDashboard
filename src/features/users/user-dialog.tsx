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

const ALL_ROLES: UserRole[] = ["super_admin", "org_admin", "branch_manager", "teller", "waiter", "kitchen"];

/** The two credentials are INDEPENDENT, not alternatives: a PIN signs someone in
 *  at a till, an email + password signs them in to the dashboard, and under
 *  architecture E an owner or a branch manager works a till too. The form used
 *  to show only one of the two, keyed on the role, which is why Tasbeeh
 *  (org_admin) and "One Ninety" (branch_manager) have no PIN in production and
 *  cannot sign in on a tablet at all. Both are always offered now; the role only
 *  decides which one is REQUIRED. */
const POS_ROLES: UserRole[] = ["teller", "waiter", "kitchen"];
const isPosRole = (r: UserRole) => POS_ROLES.includes(r);

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
    () => isSuperAdmin ? ALL_ROLES : currentRole === "branch_manager" ? ["teller", "waiter", "kitchen"] : ALL_ROLES.filter((r) => r !== "super_admin"),
    [isSuperAdmin, currentRole],
  );

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t("common.requiredField", "This field is required")),
          email: z.string().email(t("common.invalidEmail", "Invalid email")).optional().or(z.literal("")),
          phone: z.string().optional(),
          role: z.enum(["super_admin", "org_admin", "branch_manager", "teller", "waiter", "kitchen"]),
          org_id: z.string().optional(),
          pin: z.string().regex(/^\d{4,6}$/, t("users.pinError", "PIN must be 4-6 digits")).optional().or(z.literal("")),
          password: z.string().optional(),
          is_active: z.boolean(),
        })
        // Both credentials are offered to everyone; the role decides which one
        // is required. On edit, a blank credential means "keep the current one".
        .superRefine((v, ctx) => {
          if (isPosRole(v.role)) {
            if (!editing && !v.pin) {
              ctx.addIssue({ path: ["pin"], code: z.ZodIssueCode.custom, message: t("users.pinRequired", "PIN is required") });
            }
            if (v.password && !v.email) {
              ctx.addIssue({ path: ["email"], code: z.ZodIssueCode.custom, message: t("users.emailRequired", "Email is required") });
            }
          } else {
            if (!v.email) {
              ctx.addIssue({ path: ["email"], code: z.ZodIssueCode.custom, message: t("users.emailRequired", "Email is required") });
            }
            if (!editing && !v.password) {
              ctx.addIssue({ path: ["password"], code: z.ZodIssueCode.custom, message: t("users.passwordRequired", "Password is required") });
            }
          }
        }),
    [t, editing],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
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
    // Send whichever credentials were filled in. They are independent: a person
    // may hold a PIN for the till AND an email + password for the dashboard.
    // A blank field is left out, which on edit means "keep what is there".
    const email = v.email || null;
    const cred = {
      ...(v.pin ? { pin: v.pin } : {}),
      ...(v.password ? { password: v.password } : {}),
    };
    try {
      if (user) {
        await updateUser(user.id, {
          name: v.name, email, phone: v.phone || null, role: v.role, is_active: v.is_active, ...cred,
        });
      } else {
        await createUser({
          name: v.name, role: v.role, org_id: (isSuperAdmin ? v.org_id : orgId) || orgId,
          email, phone: v.phone || null, ...cred,
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

  const selectedRole = form.watch("role");
  const pos = isPosRole(selectedRole);

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

            {/* Role first — it decides which credential the rest of the form asks for. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              ) : (
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>{t("users.phone", "Phone")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              )}
            </div>
            {isSuperAdmin && !editing ? (
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>{t("users.phone", "Phone")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
            ) : null}

            {/* Both credentials, always. The role decides which is required. */}
            <FormField control={form.control} name="pin" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {pos ? t("users.pin", "PIN (4-6 digits)") : t("users.pinOptional", "Till PIN (optional)")}
                </FormLabel>
                <FormControl><Input type="password" inputMode="numeric" maxLength={6} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} placeholder={editing ? "••••" : ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>{pos ? t("users.emailOptional", "Email (optional)") : t("auth.email", "Email")}</FormLabel>
                  <FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{pos ? t("users.passwordOptional", "Password (optional)") : t("auth.password", "Password")}</FormLabel>
                  <FormControl><Input type="password" {...field} value={field.value ?? ""} placeholder={editing ? t("users.leaveBlank", "Leave blank to keep") : ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <p className="text-xs text-muted-foreground">
              {pos
                ? t("users.posCredHint2", "The PIN signs them in at a till. Add an email and password only if they also use the dashboard.")
                : t("users.dashCredHint2", "The email and password sign them in to the dashboard. Add a PIN if they also work a till.")}
            </p>
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
