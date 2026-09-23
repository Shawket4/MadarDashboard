import type { TFunction } from "i18next";
import { AxiosError } from "axios";
import { z } from "zod";

import type { ProvisionOrgRequest } from "@/data/api/generated/models";
import { MAX_PERCENT, percentToFraction } from "./tax-rate";

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

/** Step indexes of the wizard (0-based): business, first branch, owner. */
export const STEPS = ["business", "branch", "owner"] as const;
export type StepIndex = 0 | 1 | 2;

export function provisionSchemas(t: TFunction) {
  const required = t("common.requiredField", "This field is required");
  const business = z.object({
    name: z.string().trim().min(1, required),
    slug: z.string().trim().min(1, required),
    template: z.string().min(1, t("orgs.wizard.templateRequired", "Choose a template")),
    currency_code: z.string().trim().min(1, required),
    timezone: z.string().min(1, required),
    // A PERCENT on screen; converted to a fraction in toProvisionRequest.
    tax_rate: z.coerce
      .number<number>()
      .min(0, t("orgs.taxRateRange", "Enter a rate between 0 and 100"))
      .max(MAX_PERCENT, t("orgs.taxRateRange", "Enter a rate between 0 and 100")),
    // PS-2: which products this business has; POS alone unless Madar says so.
    modules: z.array(z.enum(["pos", "dawam"])).min(1, t("dawam.modulesAtLeastOne", "Pick at least one module")),
  });
  const branch = z.object({
    name: z.string().trim().min(1, required),
    address: z.string().optional(),
    phone: z.string().optional(),
  });
  const owner = z.object({
    name: z.string().trim().min(1, required),
    email: z.email(t("orgs.wizard.emailInvalid", "Enter a valid email")),
    password: z.string().min(8, t("orgs.wizard.passwordMin", "At least 8 characters")),
    pin: z
      .string()
      .optional()
      .refine((p) => !p || /^\d{6}$/.test(p), t("orgs.wizard.pinInvalid", "The PIN is exactly 6 digits")),
  });
  const full = z.object({ business, branch, owner });
  return { business, branch, owner, full };
}

export type ProvisionSchemas = ReturnType<typeof provisionSchemas>;
export type ProvisionFormInput = z.input<ProvisionSchemas["full"]>;
export type ProvisionFormValues = z.output<ProvisionSchemas["full"]>;

/** The form section each step owns, for `form.trigger(...)`. */
export const STEP_FIELD: Record<StepIndex, keyof ProvisionFormValues> = {
  0: "business",
  1: "branch",
  2: "owner",
};

export const emptyProvisionForm = (): ProvisionFormInput => ({
  business: { name: "", slug: "", template: "", currency_code: "EGP", timezone: "Africa/Cairo", tax_rate: 0, modules: ["pos"] },
  branch: { name: "", address: "", phone: "" },
  owner: { name: "", email: "", password: "", pin: "" },
});

const opt = (s: string | undefined | null) => {
  const v = s?.trim();
  return v ? v : undefined;
};

/** Form values → the `POST /orgs/provision` body. Empty optional fields are omitted. */
export function toProvisionRequest(v: ProvisionFormValues): ProvisionOrgRequest {
  const body: ProvisionOrgRequest = {
    name: v.business.name.trim(),
    slug: v.business.slug.trim(),
    template: v.business.template,
    currency_code: v.business.currency_code.trim().toUpperCase(),
    timezone: v.business.timezone,
    tax_rate: percentToFraction(v.business.tax_rate),
    modules: v.business.modules,
    branch: { name: v.branch.name.trim() },
    owner: { name: v.owner.name.trim(), email: v.owner.email.trim(), password: v.owner.password },
  };
  const address = opt(v.branch.address);
  const phone = opt(v.branch.phone);
  const pin = opt(v.owner.pin);
  if (address) body.branch.address = address;
  if (phone) body.branch.phone = phone;
  if (pin) body.owner.pin = pin;
  return body;
}

/**
 * Where a 409 from provisioning belongs. The backend returns no stable code for
 * these conflicts, so this matches on the message text: "Slug '…' is already
 * taken" → step 1 slug, "Email already in use" → step 3 email.
 */
export function conflictTarget(
  err: unknown,
): { step: StepIndex; field: "business.slug" | "owner.email"; message: string } | null {
  if (!(err instanceof AxiosError) || err.response?.status !== 409) return null;
  const data = err.response.data as Record<string, unknown> | undefined;
  const message =
    typeof data?.error === "string" ? data.error : typeof data?.message === "string" ? data.message : "";
  if (/slug/i.test(message)) return { step: 0, field: "business.slug", message };
  if (/email/i.test(message)) return { step: 2, field: "owner.email", message };
  return null;
}
