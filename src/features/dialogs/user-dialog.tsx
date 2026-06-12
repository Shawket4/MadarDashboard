import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useCreateUser, useUpdateUser, useListOrgs, getListUsersQueryKey } from "@/shared/api/generated/api";
import { createUserSchema, updateUserSchema, type CreateUserValues, type UpdateUserValues } from "@/entities/user/schemas";
import { ROLES } from "@/shared/config/constants";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { getErrorMessage } from "@/shared/api/errors";
import type { Role } from "@/shared/config/constants";
import type { UserPublic } from "@/shared/types";


export function UserDialog({ open, onClose, edit }: { open: boolean; onClose: () => void; edit?: UserPublic | null }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { isSuperAdmin, user, role: currentUserRole } = useCurrentContext();
  const { data: orgs = [] } = useListOrgs({ query: { enabled: isSuperAdmin } });

  const isEdit = !!edit;
  const form = useForm<CreateUserValues | UpdateUserValues>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: isEdit
      ? {
          name: edit!.name,
          email: edit!.email ?? "",
          phone: edit!.phone ?? "",
          role: edit!.role,
          is_active: edit!.is_active,
          pin: "",
          password: "",
        }
      : {
          name: "",
          email: "",
          phone: "",
          role: currentUserRole === "branch_manager" ? "teller" : "teller",
          is_active: true,
          org_id: user?.org_id ?? "",
          pin: "",
          password: "",
        },
  });

  const createReq = useCreateUser({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast.success(t("users.createdToast"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  const updateReq = useUpdateUser({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast.success(t("users.updatedToast"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  const isPending = createReq.isPending || updateReq.isPending;

  const mutate = (v: CreateUserValues | UpdateUserValues) => {
    if (isEdit) {
      const updateValues = v as UpdateUserValues;
      const payload = {
        name: v.name,
        email: v.email || null,
        phone: v.phone || null,
        role: v.role,
        is_active: v.is_active,
        ...(updateValues.pin ? { pin: updateValues.pin } : {}),
        ...(updateValues.password ? { password: updateValues.password } : {}),
      };
      updateReq.mutate({ id: edit!.id, data: payload as any });
    } else {
      const createValues = v as CreateUserValues;
      const payload = {
        name: createValues.name,
        role: createValues.role,
        org_id: createValues.org_id,
        email: createValues.email || null,
        phone: createValues.phone || null,
        is_active: createValues.is_active,
        ...(createValues.pin ? { pin: createValues.pin } : {}),
        ...(createValues.password ? { password: createValues.password } : {}),
      };
      createReq.mutate({ data: payload as any });
    }
  };

  const availableRoles: Role[] = isSuperAdmin
    ? [...ROLES]
    : currentUserRole === "branch_manager"
    ? ["teller"]
    : ROLES.filter((r) => r !== "super_admin");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("users.editTitle") : t("users.newTitle")}</DialogTitle>
          <DialogDescription>{t("users.subtitle")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <form onSubmit={form.handleSubmit((v) => mutate(v as any))}>
            <DialogBody>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("users.fullName")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.email")}</FormLabel>
                      <FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("users.phone")}</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  name={"pin" as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("users.pin")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                          placeholder={isEdit ? "•••• (leave blank to keep)" : "••••"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  name={"password" as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.password")}</FormLabel>
                      <FormControl><Input type="password" {...field} placeholder={isEdit ? "Leave blank to keep" : t("common.optional")} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("users.role")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {availableRoles.map((r) => (
                            <SelectItem key={r} value={r}>{t(`roles.${r}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isSuperAdmin && !isEdit && (
                  <FormField
                    control={form.control}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    name={"org_id" as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("users.org")}</FormLabel>
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {isEdit && (
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg bg-muted p-3 !space-y-0">
                      <div>
                        <FormLabel>{t("users.activeAccount")}</FormLabel>
                        <p className="text-xs text-muted-foreground">{t("users.activeHint")}</p>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
              )}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
              <Button type="submit" loading={isPending}>{isEdit ? t("common.saveChanges") : t("common.create")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

