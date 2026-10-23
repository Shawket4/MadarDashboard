import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/toast";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUploader } from "@/components/app/image-uploader";
import { TimezoneSelect } from "@/components/app/timezone-select";
import {
  createOrg, getGetOrgPlanQueryKey, updateOrg, uploadOrgLogo, useEndOrgAddon, useGetOrgPlan, usePutOrgAddon,
} from "@/data/api/generated/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Org } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { MAX_PERCENT, fractionToPercent, percentToFraction } from "./tax-rate";
import {
  SocialLinksFields,
  socialLinksPatch,
  socialLinksSchema,
  socialLinksToForm,
} from "./social-links";
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
  // Which modules an org has is Madar's call (PS-2): only a super admin sees
  // or sends them; the server refuses the PATCH from anyone else anyway.
  const superAdmin = useAuthStore((s) => s.user?.role === "super_admin");
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
        // A PERCENT here, converted to the fraction the API stores on submit.
        // The max is the guard that was missing: without it, `14` sailed
        // through the form and came back a 400 from the server.
        tax_rate: z.coerce
          .number<number>()
          .min(0, t("orgs.taxRateRange", "Enter a rate between 0 and 100"))
          .max(MAX_PERCENT, t("orgs.taxRateRange", "Enter a rate between 0 and 100")),
        receipt_footer: z.string().optional(),
        timezone: z.string().min(1, t("common.requiredField", "This field is required")),
        is_active: z.boolean(),
        custom_branding: z.boolean(),
        // PS-2 / SA-5: at least one; switching one off hides it, keeps every record.
        modules: z.array(z.enum(["pos", "dawam"])).min(1, t("dawam.modulesAtLeastOne", "Pick at least one module")),
        // The org's plan (madar-plan): Madar's call, a super admin's alone.
        plan: z.enum(["free", "paid"]),
        tax_inclusive: z.boolean(),
        // A percent here too, for the same reason the tax rate is.
        service_charge_rate: z.coerce
          .number<number>()
          .min(0, t("orgs.taxRateRange", "Enter a rate between 0 and 100"))
          .max(MAX_PERCENT, t("orgs.taxRateRange", "Enter a rate between 0 and 100")),
        service_charge_taxable: z.boolean(),
        require_table_for_orders: z.boolean(),
        social: socialLinksSchema(t),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", currency_code: "EGP", tax_rate: 0, receipt_footer: "", timezone: "Africa/Cairo", is_active: true, custom_branding: false, modules: ["pos"], plan: "paid", tax_inclusive: false, service_charge_rate: 0, service_charge_taxable: true, require_table_for_orders: false, social: socialLinksToForm(null) },
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
        tax_rate: fractionToPercent(org?.tax_rate),
        receipt_footer: org?.receipt_footer ?? "",
        timezone: org?.timezone ?? "Africa/Cairo",
        is_active: org?.is_active ?? true,
        custom_branding: org?.custom_branding ?? false,
        plan: org?.plan === "free" ? "free" : "paid",
        modules: (org?.modules ?? ["pos"]).filter((m): m is "pos" | "dawam" => m === "pos" || m === "dawam"),
        tax_inclusive: org?.tax_inclusive ?? false,
        service_charge_rate: fractionToPercent(org?.service_charge_rate),
        service_charge_taxable: org?.service_charge_taxable ?? true,
        require_table_for_orders: org?.require_table_for_orders ?? false,
        social: socialLinksToForm(org?.social_links),
      });
    }
    // Keyed on the org, not its row: a logo upload refetches the row, and
    // re-filling then wiped whatever was typed and not yet saved (ADM-ORG-058).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, org?.id]);

  useEffect(() => () => revoke(), []);

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      if (org) {
        await updateOrg(org.id, {
          name: v.name, slug: v.slug, currency_code: v.currency_code,
          tax_rate: percentToFraction(v.tax_rate), receipt_footer: v.receipt_footer || null, timezone: v.timezone, is_active: v.is_active,
          custom_branding: v.custom_branding,
          ...(superAdmin ? { modules: v.modules } : {}),
          // Only a change is sent: a move to Free is a downgrade (data kept, paid features off).
          ...(superAdmin && v.plan !== (org.plan === "free" ? "free" : "paid") ? { plan: v.plan } : {}),
          tax_inclusive: v.tax_inclusive,
          service_charge_rate: percentToFraction(v.service_charge_rate),
          service_charge_taxable: v.service_charge_taxable,
          require_table_for_orders: v.require_table_for_orders,
          social_links: socialLinksPatch(v.social, org.social_links),
        });
      } else {
        // Everything the form collects, not just the six fields create used to
        // take. A shop set up with a 12% service charge and tax-inclusive
        // pricing got neither, was told the organisation had been created, and
        // discovered in the edit dialog that half of what it typed had been
        // dropped.
        const created = await createOrg({
          name: v.name, slug: v.slug, currency_code: v.currency_code,
          tax_rate: percentToFraction(v.tax_rate),
          tax_inclusive: v.tax_inclusive,
          service_charge_rate: percentToFraction(v.service_charge_rate),
          service_charge_taxable: v.service_charge_taxable,
          require_table_for_orders: v.require_table_for_orders,
          receipt_footer: v.receipt_footer || null, timezone: v.timezone, logo: pendingLogo ?? undefined,
        });
        // `POST /orgs` takes no modules and starts every org on POS alone;
        // anything else is set right after, by the same super admin.
        const picked = [...v.modules].sort().join(",");
        if (superAdmin && picked !== "pos") {
          await updateOrg(created.id, { modules: v.modules });
        }
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
          <DialogDescription>{editing ? t("orgs.editDescription", "Update the details for this organization.") : t("orgs.newDescription", "Fill in the details to create a new organization.")}</DialogDescription>
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
                <FormItem><FormLabel>{t("orgs.taxRate", "Tax Rate (%)")}</FormLabel><FormControl><Input type="number" step="0.1" min="0" max={MAX_PERCENT} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            {/* How the rate above is applied, and the charge that shares its
                base. Both are org-wide defaults; a branch trading under a
                different regime overrides them on the branch itself. */}
            <FormField control={form.control} name="tax_inclusive" render={({ field }) => (
              <FormItem className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between gap-4">
                  <FormLabel className="font-normal">
                    {t("orgs.taxInclusive", "Menu prices include tax")}
                  </FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "orgs.taxInclusiveHint",
                    "On, the price on the menu is what the customer pays and the receipt shows the tax it already contained. Off, tax is added at checkout.",
                  )}
                </p>
              </FormItem>
            )} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="service_charge_rate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("orgs.serviceCharge", "Service charge (%)")}</FormLabel>
                  <FormControl><Input type="number" step="0.1" min="0" max={MAX_PERCENT} {...field} /></FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t("orgs.serviceChargeHint", "0 for none. Shown as its own line on the bill.")}
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="service_charge_taxable" render={({ field }) => (
                <FormItem className="flex flex-col justify-center rounded-lg bg-muted p-3">
                  <div className="flex items-center justify-between gap-4">
                    <FormLabel className="font-normal">
                      {t("orgs.serviceChargeTaxable", "Tax the service charge")}
                    </FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </div>
                </FormItem>
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

            <FormField control={form.control} name="require_table_for_orders" render={({ field }) => (
              <FormItem className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between gap-4">
                  <FormLabel className="font-normal">
                    {t("orgs.requireTable", "Every dine-in sale belongs to a table")}
                  </FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "orgs.requireTableHint",
                    "The till stops ringing up dine-in sales on their own — staff seat the party from the floor, add their items, then settle. Branches with no floor are unaffected, and a queued offline sale still replays.",
                  )}
                </p>
              </FormItem>
            )} />

            {/* A paid tier, and this dialog is super-admin only — which is why
                the switch lives on the ORGANISATION rather than in the settings
                an org manager can reach. */}
            <FormField control={form.control} name="custom_branding" render={({ field }) => (
              <FormItem className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between gap-4">
                  <FormLabel className="font-normal">
                    {t("orgs.customBranding", "Custom branding")}
                  </FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "orgs.customBrandingHint",
                    "Puts this organisation's own logo and colours on customer loyalty cards and the signup page. Off, they use Madar's. Madar stays in the footer either way.",
                  )}
                </p>
              </FormItem>
            )} />

            {superAdmin ? (
              <FormField control={form.control} name="modules" render={({ field }) => (
                <FormItem className="rounded-lg bg-muted p-3">
                  <FormLabel>{t("dawam.modules", "Modules")}</FormLabel>
                  <div className="flex flex-wrap gap-4">
                    {(["pos", "dawam"] as const).map((m) => (
                      <label key={m} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(m)}
                          onCheckedChange={(on) => field.onChange(on ? [...field.value, m] : field.value.filter((x) => x !== m))}
                        />
                        {m === "pos" ? t("dawam.modulePos", "Madar POS") : t("dawam.moduleDawam", "Dawam by Madar")}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("dawam.modulesHint", "Switching a module off hides its pages and keeps every record.")}
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
            ) : null}

            {superAdmin && editing ? (
              <FormField control={form.control} name="plan" render={({ field }) => (
                <FormItem className="rounded-lg bg-muted p-3">
                  <FormLabel>{t("orgs.plan", "Plan")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">{t("plan.paid", "Paid")}</SelectItem>
                      <SelectItem value="free">{t("plan.free", "Free")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {field.value === "free" && org?.plan !== "free"
                      ? t("orgs.planDowngradeHint", "Moving to Free keeps every record. Inventory, loyalty, online ordering, bookings, kitchen screens, floor, Dawam and branding switch off, and each branch keeps one active till.")
                      : org?.signup_source === "self"
                        ? t("orgs.planSelfHint", "This shop signed up by itself.")
                        : t("orgs.planHint", "Free is POS only: one branch, one till. Upgrading is done here.")}
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
            ) : null}

            {superAdmin && org && org.plan === "free" ? <LoyaltyAddonSwitch orgId={org.id} /> : null}

            {org && org.plan === "free" ? <OverFreeLimitsNote orgId={org.id} /> : null}

            {/* Editable here as well as in the shop's own brand settings: an
                org manager owns their links, and support has to be able to fix
                a bad one without borrowing the manager's login.

                Edit only — `POST /orgs` is multipart and takes no social links,
                and fields that quietly discard what was typed are worse than
                fields that are not there yet. */}
            {editing ? <SocialLinksFields /> : null}

            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" loading={busy}>{editing ? t("common.save", "Save") : t("common.create", "Create")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Loyalty sold on its own (Rewards by Madar): a super admin switches the `loyalty` add-on
 * on a Free org. It saves at once, apart from the form: it is a sale, not an
 * edit of the org. Paid already includes loyalty, and moving to paid ends it
 * (the server's rule), so it is only offered on Free.
 */
function LoyaltyAddonSwitch({ orgId }: { orgId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const plan = useGetOrgPlan(orgId);
  const on = plan.data?.addons?.includes("loyalty") ?? false;
  const done = {
    onSuccess: () => qc.invalidateQueries({ queryKey: getGetOrgPlanQueryKey(orgId) }),
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  };
  const put = usePutOrgAddon({ mutation: done });
  const end = useEndOrgAddon({ mutation: done });
  const busy = plan.isLoading || put.isPending || end.isPending;
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-muted p-3">
      <div className="space-y-1">
        <label htmlFor="addon-loyalty" className="text-sm font-medium">
          {t("orgs.addonLoyalty", "Loyalty add-on (Rewards by Madar)")}
        </label>
        <p className="text-xs text-muted-foreground">
          {t("orgs.addonLoyaltyHint", "Stamp cards, wallet passes and the teller page on the Free plan. Upgrading to Paid ends it; going back to Free does not bring it back.")}
        </p>
      </div>
      <Switch
        id="addon-loyalty"
        checked={on}
        disabled={busy}
        onCheckedChange={(next) =>
          next
            ? put.mutate({ id: orgId, feature: "loyalty", data: {} })
            : end.mutate({ id: orgId, feature: "loyalty" })
        }
      />
    </div>
  );
}

/**
 * A downgraded org keeps all of its branches, and sells on one till in each
 * (`GET /orgs/{id}/plan`). Say so when the dialog is open on one that is past
 * Free's limits, so support knows why a till shows "not active" and what to do.
 */
function OverFreeLimitsNote({ orgId }: { orgId: string }) {
  const { t } = useTranslation();
  const q = useGetOrgPlan(orgId);
  const plan = q.data;
  if (!plan || plan.plan !== "free" || (!plan.over_branch_limit && plan.inactive_tills === 0)) return null;
  return (
    <div role="status" className="space-y-1 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
      <p className="font-medium">{t("orgs.overFreeTitle", "Over the Free plan's limits")}</p>
      <ul className="list-disc space-y-0.5 ps-5 text-muted-foreground">
        {plan.over_branch_limit ? (
          <li>
            {t("orgs.overFreeBranches", {
              branches: plan.live_branches,
              limit: plan.branch_limit ?? 1,
              defaultValue: "{{branches}} branches; Free includes {{limit}}. It cannot add a branch.",
            })}
          </li>
        ) : null}
        {plan.inactive_tills > 0 ? (
          <li>
            {t("orgs.overFreeTills", {
              tills: plan.inactive_tills,
              defaultValue: "Tills switched off: {{tills}}. The owner chooses each branch's active till under Settings > Plan.",
            })}
          </li>
        ) : null}
      </ul>
      <p className="text-muted-foreground">{t("orgs.overFreeAction", "Move it back to the paid plan to switch every till on again.")}</p>
    </div>
  );
}
