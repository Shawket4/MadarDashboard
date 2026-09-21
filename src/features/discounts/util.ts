import { z } from "zod";
import type { TFunction } from "i18next";

import { queryClient } from "@/data/api/query";
import { MAX_PERCENT } from "@/features/orgs/tax-rate";

export const invalidateDiscounts = () =>
  queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/discounts"),
  });

/// The discount form's rules, as a schema.
///
/// Lives here rather than inside the dialog so it can be tested on its own —
/// it is the money rule the dashboard is responsible for, and the one place
/// this app can stop a discount that overshoots before it ever reaches a till.
///
/// The cap is PER TYPE. It used to be one flat `.max(MAX_PERCENT)`, which read
/// as "100%" for a percentage and silently as "100 EGP" for a fixed amount —
/// so a 200 EGP discount, an ordinary thing to want, was refused by an
/// untranslated "Too big" from Zod with no clue why. A fixed amount has no
/// ceiling: the till and the server both cap it to the bill, so the worst an
/// over-large one can do is make a sale free.
export const discountSchema = (t: TFunction) =>
  z
    .object({
      name: z.string().min(1, t("common.requiredField", "This field is required")),
      name_ar: z.string().optional(),
      dtype: z.enum(["percentage", "fixed"]),
      // Percent on screen, fraction on the wire — the same boundary the tax
      // rate crosses, and the reason the cap is 100 rather than 1.
      value: z.coerce.number<number>(),
      is_active: z.boolean(),
    })
    .superRefine((v, ctx) => {
      if (Number.isNaN(v.value) || v.value < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: t("discounts.valueNegative", "A discount can't be less than zero."),
        });
        return;
      }
      // A percentage over 100 would take more than the whole bill. It cannot
      // drive a total negative — both the till and the server clamp it — but
      // it is still not a thing anyone means, so it is refused HERE, where the
      // person can see what they typed.
      if (v.dtype === "percentage" && v.value > MAX_PERCENT) {
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: t(
            "discounts.percentRange",
            "Enter a percentage between 0 and 100. 100% makes the order free.",
          ),
        });
      }
    });
