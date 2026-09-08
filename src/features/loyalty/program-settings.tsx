/**
 * The loyalty program's rules, for the org or for one branch.
 *
 * Scoped exactly like the backend: the org row is the default every branch
 * runs on, and a branch row REPLACES it wholesale for that branch. Wholesale
 * rather than field-by-field because a half-inherited earn rule is impossible to
 * reason about at a counter — an admin looking at a branch sees exactly the
 * numbers that branch uses.
 *
 * Money is piastres on the wire and EGP on screen, via the shared helpers.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WalletStatusPanel } from "./wallet-status";
import { BirthdayPreview } from "./birthday-preview";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/app/segmented-control";
import { useConfirm } from "@/components/app/confirm-dialog";
import {
  deleteLoyaltySettings,
  useGetLoyaltySettings,
  usePutLoyaltySettings,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, piastresToEgp } from "@/lib/format";

import { currencyLabel, isOwnOverride } from "./util";

const schema = z.object({
  enabled: z.boolean(),
  program_name: z.string().min(1),
  program_name_ar: z.string().optional(),
  mode: z.enum(["points", "visits"]),
  /** EGP in the form; piastres on the wire. */
  earn_egp_per_point: z.coerce.number<number>().positive(),
  earn_on_discounted: z.boolean(),
  earn_include_tax: z.boolean(),
  default_reward_cost: z.coerce.number<number>().int().positive(),
  require_otp: z.boolean(),
  reward_any_item: z.boolean(),
  birthday_enabled: z.boolean(),
  // Empty means a greeting and no gift, which is the common case.
  birthday_reward_amount: z.string().optional(),
  birthday_message: z.string().optional(),
  birthday_message_ar: z.string().optional(),
  terms: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function ProgramSettings({
  orgId,
  branchId,
}: {
  orgId: string;
  branchId: string | null;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const params = branchId ? { branch_id: branchId } : {};
  const query = useGetLoyaltySettings(params);
  const save = usePutLoyaltySettings();
  const settings = query.data;
  const inherited = Boolean(branchId) && !isOwnOverride(settings, branchId);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: settings
      ? {
          enabled: settings.enabled,
          program_name: settings.program_name,
          program_name_ar: settings.program_name_ar ?? "",
          mode: settings.mode === "visits" ? "visits" : "points",
          earn_egp_per_point: piastresToEgp(settings.earn_piastres_per_point),
          earn_on_discounted: settings.earn_on_discounted,
          earn_include_tax: settings.earn_include_tax,
          default_reward_cost: settings.default_reward_cost,
          require_otp: settings.require_otp,
          reward_any_item: settings.reward_any_item ?? false,
          birthday_enabled: settings.birthday_enabled ?? false,
          birthday_reward_amount: settings.birthday_reward_amount
            ? String(settings.birthday_reward_amount)
            : "",
          birthday_message: settings.birthday_message ?? "",
          birthday_message_ar: settings.birthday_message_ar ?? "",
          terms: settings.terms ?? "",
        }
      : undefined,
  });

  // What the preview renders: the saved settings with the form's live edits on
  // top, so it shows what SAVING would send rather than what was last saved.
  const watched = form.watch();
  const previewSettings =
    settings && watched.birthday_enabled
      ? {
          ...settings,
          program_name: watched.program_name || settings.program_name,
          mode: watched.mode,
          birthday_reward_amount: Number(watched.birthday_reward_amount) || null,
          birthday_message: watched.birthday_message || null,
          birthday_message_ar: watched.birthday_message_ar || null,
        }
      : null;

  const mode = form.watch("mode");

  // The form is a copy of the scope's settings; switching scope must reload it
  // rather than leave the previous branch's numbers on screen.
  useEffect(() => {
    if (settings) form.reset(undefined, { keepValues: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const submit = async (v: Values) => {
    try {
      await save.mutateAsync({
        data: {
          org_id: orgId,
          branch_id: branchId,
          enabled: v.enabled,
          program_name: v.program_name,
          program_name_ar: v.program_name_ar || null,
          mode: v.mode,
          earn_piastres_per_point: egpToPiastres(v.earn_egp_per_point),
          earn_on_discounted: v.earn_on_discounted,
          earn_include_tax: v.earn_include_tax,
          default_reward_cost: v.default_reward_cost,
          require_otp: v.require_otp,
          reward_any_item: v.reward_any_item,
          birthday_enabled: v.birthday_enabled,
          birthday_reward_amount: v.birthday_enabled
            ? Number(v.birthday_reward_amount) || null
            : null,
          birthday_message: v.birthday_enabled ? v.birthday_message || null : null,
          birthday_message_ar: v.birthday_enabled ? v.birthday_message_ar || null : null,
          terms: v.terms || null,
          terms_ar: settings?.terms_ar ?? null,
        },
      });
      toast.success(t("loyalty.saved", "Program saved"));
      await query.refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const revert = async () => {
    if (!branchId) return;
    const ok = await confirm({
      title: t("loyalty.revertTitle", "Use the organisation's program here?"),
      description: t(
        "loyalty.revertBody",
        "This branch will follow the organisation-wide settings again. Its own rules are removed.",
      ),
    });
    if (!ok) return;
    try {
      await deleteLoyaltySettings({ branch_id: branchId });
      toast.success(t("loyalty.reverted", "Back to the organisation's program"));
      await query.refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      {inherited ? (
        <p className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
          {t(
            "loyalty.inheritedHint",
            "This branch follows the organisation's program. Saving here gives it rules of its own.",
          )}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">{t("loyalty.enabled", "Program is running")}</p>
              <p className="text-xs text-muted-foreground">
                {t("loyalty.enabledHint", "Customers can join and collect here.")}
              </p>
            </div>
            <Switch
              checked={form.watch("enabled")}
              onCheckedChange={(v) => form.setValue("enabled", v, { shouldDirty: true })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="program_name">{t("loyalty.programName", "Program name")}</Label>
              <Input id="program_name" {...form.register("program_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="program_name_ar">
                {t("loyalty.programNameAr", "Program name (Arabic)")}
              </Label>
              <Input id="program_name_ar" dir="rtl" {...form.register("program_name_ar")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-sm font-bold">{t("loyalty.whatTheyCollect", "What customers collect")}</p>
            <p className="text-xs text-muted-foreground">
              {t(
                "loyalty.whatTheyCollectHint",
                "One or the other. A card that counted two things at once would need two answers to “how close am I”.",
              )}
            </p>
          </div>
          <SegmentedControl
            value={mode}
            onChange={(v) => form.setValue("mode", v as "points" | "visits", { shouldDirty: true })}
            options={[
              { value: "points", label: t("loyalty.modePoints", "Points on spend") },
              { value: "visits", label: t("loyalty.modeVisits", "A stamp per order") },
            ]}
          />

          {mode === "points" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="earn">{t("loyalty.earnRate", "EGP that earns one point")}</Label>
                <Input
                  id="earn"
                  type="number"
                  step="any"
                  className="font-mono"
                  {...form.register("earn_egp_per_point")}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-xs font-normal text-muted-foreground">
                  {t("loyalty.onDiscounted", "Earn on what was actually paid, after discounts")}
                </Label>
                <Switch
                  checked={form.watch("earn_on_discounted")}
                  onCheckedChange={(v) =>
                    form.setValue("earn_on_discounted", v, { shouldDirty: true })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-xs font-normal text-muted-foreground">
                  {t("loyalty.includeTax", "Include tax in what earns")}
                </Label>
                <Switch
                  checked={form.watch("earn_include_tax")}
                  onCheckedChange={(v) =>
                    form.setValue("earn_include_tax", v, { shouldDirty: true })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  "loyalty.tipsNeverEarn",
                  "Tips never earn — that is the staff's money, not a sale.",
                )}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t(
                "loyalty.stampHint",
                "Every order is one stamp, whatever the bill comes to.",
              )}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="cost">
              {t("loyalty.defaultCost", "Default cost of a reward")} (
              {currencyLabel(mode, form.watch("default_reward_cost"))})
            </Label>
            <Input
              id="cost"
              type="number"
              className="font-mono"
              {...form.register("default_reward_cost")}
            />
            <p className="text-xs text-muted-foreground">
              {t(
                "loyalty.defaultCostHint",
                "Offered when you add a reward. Each reward can be priced on its own, so one list can hold “espresso, 5 orders” beside “cake, 10”.",
              )}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">{t("loyalty.requireOtp", "Verify phone on signup")}</p>
              <p className="text-xs text-muted-foreground">
                {t("loyalty.requireOtpHint", "Sends a WhatsApp code, like ordering and bookings.")}
              </p>
            </div>
            <Switch
              checked={form.watch("require_otp")}
              onCheckedChange={(v) => form.setValue("require_otp", v, { shouldDirty: true })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">
                {t("loyalty.anyItem", "Any item can be a reward")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(
                  "loyalty.anyItemHint",
                  "Opens the whole menu at the price below, instead of only the Rewards list. Off by default — a list lets you offer an espresso without also offering the steak.",
                )}
              </p>
            </div>
            <Switch
              checked={form.watch("reward_any_item")}
              onCheckedChange={(v) =>
                form.setValue("reward_any_item", v, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">
                {t("loyalty.birthdays", "Birthdays")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(
                  "loyalty.birthdaysHint",
                  "Asks for a date of birth at signup and sends a WhatsApp greeting on the day. Off means the form does not ask at all.",
                )}
              </p>
            </div>
            <Switch
              checked={form.watch("birthday_enabled")}
              onCheckedChange={(v) =>
                form.setValue("birthday_enabled", v, { shouldDirty: true })
              }
            />
          </div>

          {form.watch("birthday_enabled") ? (
            <div className="space-y-4 rounded-lg border border-border/70 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="birthday_reward_amount">
                  {t("loyalty.birthdayGift", "Birthday gift")}
                </Label>
                <Input
                  id="birthday_reward_amount"
                  inputMode="numeric"
                  placeholder={t("loyalty.birthdayGiftNone", "Leave empty for a greeting only")}
                  {...form.register("birthday_reward_amount")}
                />
                <p className="text-xs text-muted-foreground">
                  {t(
                    "loyalty.birthdayGiftHint",
                    "Points or stamps added on the day. Optional — plenty of shops greet without giving anything away.",
                  )}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthday_message">
                  {t("loyalty.birthdayMessage", "Message (English)")}
                </Label>
                <Input
                  id="birthday_message"
                  placeholder={t(
                    "loyalty.birthdayMessagePlaceholder",
                    "Leave empty to use ours. {name} becomes their name.",
                  )}
                  {...form.register("birthday_message")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="birthday_message_ar">
                  {t("loyalty.birthdayMessageAr", "Message (Arabic)")}
                </Label>
                <Input
                  id="birthday_message_ar"
                  dir="rtl"
                  placeholder={t(
                    "loyalty.birthdayMessageArPlaceholder",
                    "Leave empty and Arabic members get the English one.",
                  )}
                  {...form.register("birthday_message_ar")}
                />
              </div>

              <BirthdayPreview settings={previewSettings} />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="terms">{t("loyalty.terms", "Terms (shown on the pass)")}</Label>
            <Input id="terms" {...form.register("terms")} />
          </div>

          {/* Sits with the pass settings, because "the customer has no Add to
              Wallet button" is the question it answers. */}
          <div className="border-t pt-4">
            <WalletStatusPanel branchId={branchId} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("common.save", "Save")}
        </Button>
        {branchId && !inherited ? (
          <Button type="button" variant="outline" onClick={() => void revert()}>
            <RotateCcw className="size-4" />
            {t("loyalty.revert", "Follow the organisation")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
