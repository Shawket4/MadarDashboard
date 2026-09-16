import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check } from "lucide-react";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUploader } from "@/components/app/image-uploader";
import { TimezoneSelect } from "@/components/app/timezone-select";
import { provisionOrg, uploadOrgLogo, useListTemplates } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { cn } from "@/lib/utils";
import { MAX_PERCENT } from "./tax-rate";
import {
  STEP_FIELD,
  conflictTarget,
  emptyProvisionForm,
  provisionSchemas,
  slugify,
  toProvisionRequest,
  type ProvisionFormInput,
  type ProvisionFormValues,
  type StepIndex,
} from "./provision";
import { invalidateOrgs } from "./util";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ProvisionWizard({ open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<StepIndex>(0);
  const [busy, setBusy] = useState(false);
  const templates = useListTemplates({ query: { enabled: open } });
  const isAr = i18n.language?.startsWith("ar");

  // The logo is buffered until the org exists, then uploaded separately.
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const revoke = () => { if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; } };
  useEffect(() => () => revoke(), []);

  const schema = useMemo(() => provisionSchemas(t).full, [t]);
  const form = useForm<ProvisionFormInput, unknown, ProvisionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyProvisionForm(),
  });

  const stepTitles = [
    t("orgs.wizard.stepBusiness", "Business"),
    t("orgs.wizard.stepBranch", "First branch"),
    t("orgs.wizard.stepOwner", "Owner"),
  ];

  const next = async () => {
    if (await form.trigger(STEP_FIELD[step])) setStep((s) => Math.min(2, s + 1) as StepIndex);
  };

  const submit = async (v: ProvisionFormValues) => {
    setBusy(true);
    try {
      const created = await provisionOrg(toProvisionRequest(v));
      if (pendingLogo) {
        try {
          await uploadOrgLogo(created.org.id, { logo: pendingLogo });
        } catch (e) {
          // The org exists; a failed logo is fixable from the edit dialog.
          toast.error(getErrorMessage(e));
        }
      }
      void invalidateOrgs();
      toast.success(t("orgs.createdToast", "Organization created"));
      onOpenChange(false);
    } catch (e) {
      const target = conflictTarget(e);
      if (target) {
        setStep(target.step);
        form.setError(target.field, { type: "server", message: target.message });
      } else {
        toast.error(getErrorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const taxRate = form.watch("business.tax_rate");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("orgs.newTitle", "New Organization")}</DialogTitle>
          <DialogDescription>
            {t("orgs.wizard.stepOf", { current: step + 1, total: 3, defaultValue: "Step {{current}} of {{total}}" })}
            {" · "}
            {stepTitles[step]}
          </DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2 text-xs" aria-label={t("orgs.wizard.progress", "Progress")}>
          {stepTitles.map((title, i) => (
            <li key={title} className="flex flex-1 items-center gap-2" aria-current={i === step ? "step" : undefined}>
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  i < step && "border-primary bg-primary text-primary-foreground",
                  i === step && "border-primary text-foreground",
                  i > step && "text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("truncate", i === step ? "font-medium" : "text-muted-foreground")}>{title}</span>
            </li>
          ))}
        </ol>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 2) void next();
              else void form.handleSubmit(submit)(e);
            }}
            className="space-y-4"
          >
            {step === 0 ? (
              <>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">{t("orgs.logo", "Logo")}</p>
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
                </div>
                <FormField control={form.control} name="business.name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orgs.orgName", "Organization Name")}</FormLabel>
                    <FormControl><Input {...field} onChange={(e) => { field.onChange(e); form.setValue("business.slug", slugify(e.target.value)); }} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="business.slug" render={({ field }) => (
                  <FormItem><FormLabel>{t("orgs.slug", "Slug")}</FormLabel><FormControl><Input {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="business.template" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orgs.wizard.template", "Template")}</FormLabel>
                    <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
                      {(templates.data ?? []).map((tpl) => {
                        const selected = field.value === tpl.key;
                        return (
                          <button
                            key={tpl.key}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => field.onChange(tpl.key)}
                            className={cn(
                              "rounded-lg border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              selected ? "border-primary bg-primary/5" : "hover:bg-muted",
                            )}
                          >
                            <p className="text-sm font-semibold">{isAr ? tpl.name_ar : tpl.name_en}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {tpl.key === "restaurant"
                                ? t("orgs.wizard.restaurantHint", "Tables, waiters and kitchen.")
                                : tpl.key === "cafe"
                                  ? t("orgs.wizard.cafeHint", "Counter service; the cashier marks items ready. No bookings.")
                                  : null}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    {templates.isError ? <p className="text-xs text-destructive">{getErrorMessage(templates.error)}</p> : null}
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="business.currency_code" render={({ field }) => (
                    <FormItem><FormLabel>{t("orgs.currency", "Currency")}</FormLabel><FormControl><Input {...field} className="font-mono uppercase" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="business.tax_rate" render={({ field }) => (
                    <FormItem><FormLabel>{t("orgs.taxRate", "Tax Rate (%)")}</FormLabel><FormControl><Input type="number" step="0.1" min="0" max={MAX_PERCENT} {...field} value={field.value as number | string} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="business.timezone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orgs.timezone", "Timezone")}</FormLabel>
                    <FormControl><TimezoneSelect value={field.value} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            ) : null}

            {step === 1 ? (
              <>
                <FormField control={form.control} name="branch.name" render={({ field }) => (
                  <FormItem><FormLabel>{t("orgs.wizard.branchName", "Branch name")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="branch.address" render={({ field }) => (
                  <FormItem><FormLabel>{t("orgs.wizard.address", "Address (optional)")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="branch.phone" render={({ field }) => (
                  <FormItem><FormLabel>{t("orgs.wizard.phone", "Phone (optional)")}</FormLabel><FormControl><Input type="tel" dir="ltr" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <FormField control={form.control} name="owner.name" render={({ field }) => (
                  <FormItem><FormLabel>{t("orgs.wizard.ownerName", "Owner name")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="owner.email" render={({ field }) => (
                  <FormItem><FormLabel>{t("orgs.wizard.email", "Email")}</FormLabel><FormControl><Input type="email" dir="ltr" autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="owner.password" render={({ field }) => (
                  <FormItem><FormLabel>{t("orgs.wizard.password", "Password")}</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="owner.pin" render={({ field }) => (
                  <FormItem><FormLabel>{t("orgs.wizard.pin", "PIN (optional, 6 digits)")}</FormLabel><FormControl><Input inputMode="numeric" maxLength={6} dir="ltr" className="font-mono" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium">{t("orgs.wizard.summaryTitle", "The new organization starts with:")}</p>
                  <ul className="mt-2 list-disc space-y-1 ps-5 text-muted-foreground">
                    <li>{t("orgs.wizard.summaryVoid", "A teller may void only their own sale, within 10 minutes.")}</li>
                    <li>{t("orgs.wizard.summaryRefund", "Refunds need a manager's approval.")}</li>
                    <li>{t("orgs.wizard.summaryWaiter", "Waiters can't refund.")}</li>
                    <li>{t("orgs.wizard.summaryTax", { rate: Number(taxRate) || 0, defaultValue: "Tax {{rate}}% unless set." })}</li>
                  </ul>
                </div>
              </>
            ) : null}

            <DialogFooter>
              {step === 0 ? (
                <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              ) : (
                <Button type="button" variant="outline" disabled={busy} onClick={() => setStep((s) => (s - 1) as StepIndex)}>{t("common.back", "Back")}</Button>
              )}
              {step < 2 ? (
                <Button type="submit">{t("common.next", "Next")}</Button>
              ) : (
                <Button type="submit" loading={busy}>{t("common.create", "Create")}</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
