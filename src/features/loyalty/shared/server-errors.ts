/**
 * The loyalty endpoints' validation refusals, in the reader's language.
 *
 * The server answers in English sentences. The ones a person can fix from the
 * screen they are on are recognised here and given a translated sentence (and,
 * for a form, the field to hang it on); anything else is shown as the server
 * said it — still better than a generic "Bad request".
 */
import { AxiosError } from "axios";
import type { TFunction } from "i18next";

import { getErrorMessage } from "@/data/api/errors";

export type LoyaltyServerError =
  | { kind: "noteRequired"; message: string }
  | { kind: "inactiveReward"; message: string }
  | { kind: "other"; message: string };

const serverText = (e: unknown): string | null => {
  if (!(e instanceof AxiosError)) return null;
  const data = e.response?.data as Record<string, unknown> | undefined;
  const text = data?.error ?? data?.message;
  return typeof text === "string" ? text : null;
};

export function loyaltyServerError(e: unknown, t: TFunction): LoyaltyServerError {
  const text = serverText(e) ?? "";
  // `handlers::adjust`: "Say why the points are being adjusted (note)"
  if (/\(note\)|adjusted/i.test(text) && /say why|note/i.test(text)) {
    return {
      kind: "noteRequired",
      message: t("loyalty.errors.serverNoteRequired", "Say why the points are being adjusted — the reason is required."),
    };
  }
  // `settings::put_reward_items`: "reward items must be active menu items of this org"
  if (/active menu items/i.test(text)) {
    return {
      kind: "inactiveReward",
      message: t(
        "loyalty.errors.serverInactiveReward",
        "One of these rewards is a menu item that is no longer active. Remove it or re-activate the item, then save.",
      ),
    };
  }
  return { kind: "other", message: getErrorMessage(e) };
}
