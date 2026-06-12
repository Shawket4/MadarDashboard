import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useCreateBranch, useUpdateBranch, getListBranchesQueryKey } from "@/shared/api/generated/api";
import { branchSchema, type BranchValues } from "@/entities/branch/schemas";
import { PRINTER_BRANDS } from "@/shared/config/constants";
import { getErrorMessage } from "@/shared/api/errors";
import type { Branch } from "@/shared/types";

export function BranchDialog({ open, onClose, edit, orgId }: { open: boolean; onClose: () => void; edit?: Branch | null; orgId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const form = useForm<BranchValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: edit?.name ?? "",
      address: edit?.address ?? "",
      phone: edit?.phone ?? "",
      timezone: edit?.timezone ?? "Africa/Cairo",
      is_active: edit?.is_active ?? true,
      printer_brand: edit?.printer_brand ?? "none",
      printer_ip: edit?.printer_ip ?? "",
      printer_port: edit?.printer_port ?? 9100,
    },
  });

  const printerBrand = form.watch("printer_brand");

  const updateBranch = useUpdateBranch({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListBranchesQueryKey({ org_id: orgId ?? "" }) });
        toast.success(t("branches.updatedToast"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  const createBranch = useCreateBranch({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListBranchesQueryKey({ org_id: orgId ?? "" }) });
        toast.success(t("branches.createdToast"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  function onSubmit(v: BranchValues) {
    const hasPrinter = v.printer_brand !== "none";
    const payload = {
      org_id: orgId,
      name: v.name,
      address: v.address || null,
      phone: v.phone || null,
      timezone: v.timezone,
      is_active: v.is_active,
      printer_brand: hasPrinter ? (v.printer_brand as "star" | "epson") : null,
      printer_ip: hasPrinter ? (v.printer_ip ?? null) : null,
      printer_port: hasPrinter ? (v.printer_port ?? null) : null,
    };
    if (edit) {
      updateBranch.mutate({ id: edit.id, data: payload });
    } else {
      createBranch.mutate({ data: payload });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{edit ? t("branches.editTitle") : t("branches.newTitle")}</DialogTitle>
          <DialogDescription>{t("branches.subtitle")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("branches.branchName")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("branches.phone")}</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("branches.timezone")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("branches.address")}</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Printer size={14} className="text-muted-foreground" />
                  <p className="text-sm font-semibold">{t("branches.printerConfig")}</p>
                </div>
                <FormField
                  control={form.control}
                  name="printer_brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("branches.printerBrand")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t("branches.brands.none")}</SelectItem>
                          {PRINTER_BRANDS.map((b) => (
                            <SelectItem key={b} value={b}>{t(`branches.brands.${b}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {printerBrand !== "none" && (
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="printer_ip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("branches.printerIp")}</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="192.168.1.100" className="font-mono" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="printer_port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("branches.printerPort")}</FormLabel>
                          <FormControl><Input type="number" {...field} value={field.value ?? 9100} className="font-mono" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {edit && (
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg bg-muted p-3 !space-y-0">
                      <div>
                        <FormLabel>{t("common.active")}</FormLabel>
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
              <Button type="submit" loading={updateBranch.isPending || createBranch.isPending}>{edit ? t("common.saveChanges") : t("common.create")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

