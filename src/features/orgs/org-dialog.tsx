import { useEffect, useMemo, useRef, useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUploader } from "@/components/app/image-uploader";
import { TimezoneSelect } from "@/components/app/timezone-select";
import { createOrg, updateOrg, uploadOrgLogo } from "@/data/api/generated/api";
import type { Org } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAppStore } from "@/data/stores/app.store";
import { invalidateOrgs } from "./util";

const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

interface Props {
  org: Org | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function OrgDialog({ org, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const editing = !!org;
  const [busy, setBusy] = useState(false);
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  const setSelectedOrg = useAppStore((s) => s.setSelectedOrg);

  // Create mode buffers the logo until submit; edit mode uploads immediately.
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const revoke = () => { if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; } };

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        slug: z.string().min(1, t("common.requiredField", "This field is required")),
        currency_code: z.string().min(1, t("common.requiredField", "This field is required")),
        tax_rate: z.coerce.number().min(0),
        receipt_footer: z.string().optional(),
        timezone: z.string().min(1, t("common.requiredField", "This field is required")),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", currency_code: "EGP", tax_rate: 0, receipt_footer: "", timezone: "Africa/Cairo", is_active: true },
  });

  useEffect(() => {
    if (open) {
      setPendingLogo(null);
      revoke();
      setPreviewUrl(null);
      form.reset({
        name: org?.name ?? "",
        slug: org?.slug ?? "",
        currency_code: org?.currency_code ?? "EGP",
        tax_rate: org?.tax_rate ?? 0,
        receipt_footer: org?.receipt_footer ?? "",
        timezone: org?.timezone ?? "Africa/Cairo",
        is_active: org?.is_active ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, org]);

  useEffect(() => () => revoke(), []);

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      if (org) {
        await updateOrg(org.id, {
          name: v.name, slug: v.slug, currency_code: v.currency_code,
          tax_rate: v.tax_rate, receipt_footer: v.receipt_footer || null, timezone: v.timezone, is_active: v.is_active,
        });
      } else {
        await createOrg({
          name: v.name, slug: v.slug, currency_code: v.currency_code,
          tax_rate: v.tax_rate, receipt_footer: v.receipt_footer || null, timezone: v.timezone, logo: pendingLogo ?? undefined,
        });
      }
      void invalidateOrgs();
      toast.success(editing ? t("orgs.updatedToast", "Organization updated") : t("orgs.createdToast", "Organization created"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("orgs.editTitle", "Edit Organization") : t("orgs.newTitle", "New Organization")}</DialogTitle>
          <DialogDescription>{t("orgs.subtitle", "Manage all coffee brands and franchises")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t("orgs.logo", "Logo")}</p>
              {org ? (
                <ImageUploader
                  value={org.logo_url}
                  hint={t("orgs.logoHint", "Recommended: square PNG or SVG, at least 128×128 px")}
                  onUpload={async (file) => {
                    const updated = await uploadOrgLogo(org.id, { logo: file });
                    void invalidateOrgs();
                    if (org.id === selectedOrgId) setSelectedOrg(org.id, updated.logo_url);
                    return updated.logo_url ?? "";
                  }}
                  onRemove={org.logo_url ? async () => {
                    await updateOrg(org.id, { logo_url: null });
                    void invalidateOrgs();
                    if (org.id === selectedOrgId) setSelectedOrg(org.id, null);
                    toast.success(t("orgs.logoRemoved", "Logo removed"));
                  } : undefined}
                />
              ) : (
                <ImageUploader
                  value={previewUrl}
                  hint={t("orgs.logoHint", "Recommended: square PNG or SVG, at least 128×128 px")}
                  onUpload={async (file) => {
                    revoke();
                    const url = URL.createObjectURL(file);
                    previewRef.current = url;
                    setPendingLogo(file);
                    setPreviewUrl(url);
                    return url;
                  }}
                  onRemove={previewUrl ? async () => { revoke(); setPendingLogo(null); setPreviewUrl(null); } : undefined}
                />
              )}
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("orgs.orgName", "Organization Name")}</FormLabel>
                <FormControl><Input {...field} onChange={(e) => { field.onChange(e); if (!org) form.setValue("slug", slugify(e.target.value)); }} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem><FormLabel>{t("orgs.slug", "Slug")}</FormLabel><FormControl><Input {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="currency_code" render={({ field }) => (
                <FormItem><FormLabel>{t("orgs.currency", "Currency")}</FormLabel><FormControl><Input {...field} className="font-mono uppercase" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tax_rate" render={({ field }) => (
                <FormItem><FormLabel>{t("orgs.taxRate", "Tax Rate (%)")}</FormLabel><FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="timezone" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("orgs.timezone", "Timezone")}</FormLabel>
                <FormControl><TimezoneSelect value={field.value} onChange={field.onChange} /></FormControl>
                <p className="text-xs text-muted-foreground">{t("orgs.timezoneHint", "Default for all branches. A branch can override its own.")}</p>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="receipt_footer" render={({ field }) => (
              <FormItem><FormLabel>{t("orgs.receiptFooter", "Receipt Footer")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            {editing ? (
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <FormLabel>{t("common.active", "Active")}</FormLabel>
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
