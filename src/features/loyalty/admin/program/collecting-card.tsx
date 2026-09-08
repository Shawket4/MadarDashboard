/**
 * What the programme collects, and how fast.
 *
 * Points or stamps, never both: a card counting two things at once would need
 * two answers to "how close am I", which is the one question it exists to
 * answer. The earn rate only exists for points — a stamp is a stamp whatever
 * the bill came to — so it is shown only there rather than greyed out.
 */
import { useTranslation } from "react-i18next";
import type { UseFormReturn } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";
import { SegmentedControl } from "@/components/app/segmented-control";

import { currencyLabel } from "../../shared/util";
import type { ProgramValues } from "./form-schema";
import { Group, TextRow, ToggleRow } from "./fields";

export function CollectingCard({ form }: { form: UseFormReturn<ProgramValues> }) {
  const { t } = useTranslation();
  const mode = form.watch("mode");

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <Group
          title={t("loyalty.whatTheyCollect", "What customers collect")}
          hint={t(
            "loyalty.whatTheyCollectHint",
            "One or the other. A card that counted two things at once would need two answers to “how close am I”.",
          )}
        >
          <SegmentedControl
            value={mode}
            onChange={(v) =>
              form.setValue("mode", v as ProgramValues["mode"], { shouldDirty: true })
            }
            options={[
              { value: "points", label: t("loyalty.modePoints", "Points on spend") },
              { value: "visits", label: t("loyalty.modeVisits", "A stamp per order") },
            ]}
          />
        </Group>

        {mode === "points" ? (
          <div className="space-y-3">
            <TextRow
              form={form}
              name="earn_egp_per_point"
              type="number"
              mono
              label={t("loyalty.earnRate", "EGP that earns one point")}
            />
            <ToggleRow
              form={form}
              name="earn_on_discounted"
              subdued
              label={t(
                "loyalty.onDiscounted",
                "Earn on what was actually paid, after discounts",
              )}
            />
            <ToggleRow
              form={form}
              name="earn_include_tax"
              subdued
              label={t("loyalty.includeTax", "Include tax in what earns")}
            />
            <p className="text-xs text-muted-foreground">
              {t(
                "loyalty.tipsNeverEarn",
                "Tips never earn — that is the staff's money, not a sale.",
              )}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("loyalty.stampHint", "Every order is one stamp, whatever the bill comes to.")}
          </p>
        )}

        <TextRow
          form={form}
          name="default_reward_cost"
          type="number"
          mono
          label={`${t("loyalty.defaultCost", "Default cost of a reward")} (${currencyLabel(
            mode,
            form.watch("default_reward_cost"),
          )})`}
          hint={t(
            "loyalty.defaultCostHint",
            "Offered when you add a reward. Each reward can be priced on its own, so one list can hold “espresso, 5 orders” beside “cake, 10”.",
          )}
        />

        <ToggleRow
          form={form}
          name="reward_any_item"
          label={t("loyalty.anyItem", "Any item can be a reward")}
          hint={t(
            "loyalty.anyItemHint",
            "Opens the whole menu at the price above, instead of only the Rewards list. Off by default — a list lets you offer an espresso without also offering the steak.",
          )}
        />
      </CardContent>
    </Card>
  );
}
