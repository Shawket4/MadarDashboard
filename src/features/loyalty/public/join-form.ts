/**
 * The sign-up form's rules, apart from how it looks: what makes the details
 * ready to send, and the exact body `POST /public/loyalty/join` receives.
 *
 * The form keeps its own state (no react-hook-form: no public bundle carries
 * it, and this page is opened on a phone at a counter, often on a shop's
 * wi-fi). The rules are a Zod schema, as every form here has.
 */
import { z } from "zod";

import { birthdayComplete, daysIn, type Birthday } from "@/components/inputs/birthday";
import type { JoinInfo, JoinInput } from "@/data/api/generated/models";

/** The server refuses a longer name (`loyalty::public::join`). */
export const NAME_MAX = 80;

/**
 * Ready to send: a name, a whole phone (canonical E.164 digits), and a
 * birthday that is both halves or neither (the server's `valid_birthday`).
 */
export const joinDetailsSchema = z.object({
  name: z.string().trim().min(1).max(NAME_MAX),
  phone: z.string().regex(/^\d{10,15}$/),
  birthday: z
    .object({ month: z.number().int().min(1).max(12).nullable(), day: z.number().int().min(1).max(31).nullable() })
    .refine((b) => (b.month === null) === (b.day === null) && (b.month === null || b.day! <= daysIn(b.month)), {
      message: "half a birthday is not one",
    }),
});

export interface JoinDetails {
  name: string;
  /** Canonical, or null while the number is not whole yet. */
  phone: string | null;
  birthday: Birthday;
}

export const detailsReady = (d: JoinDetails): boolean =>
  joinDetailsSchema.safeParse({ ...d, phone: d.phone ?? "", birthday: { month: d.birthday.month, day: d.birthday.day } })
    .success;

/**
 * The join request. A branch code names the branch (where they joined); an
 * org-wide code names the shop. The birthday goes only where the shop asked
 * for one and only as a pair, and never a year: the API stores none.
 */
export function joinPayload({
  info, branchId, orgId, details, phone, deviceToken, locale,
}: {
  info: Pick<JoinInfo, "birthday_enabled">;
  branchId?: string;
  orgId?: string;
  details: JoinDetails;
  phone: string;
  deviceToken: string | null;
  locale: "en" | "ar";
}): JoinInput {
  const birthday = info.birthday_enabled && birthdayComplete(details.birthday) ? details.birthday : null;
  return {
    branch_id: branchId,
    org_id: branchId ? undefined : orgId,
    name: details.name.trim(),
    phone,
    device_token: deviceToken ?? undefined,
    locale,
    birth_month: birthday?.month ?? undefined,
    birth_day: birthday?.day ?? undefined,
  };
}

/**
 * Which sentence explains the programme, from what the shop configured. A cost
 * of zero means no reward is priced yet, and a rate of zero means points are
 * not earned on spend: neither is printed as a figure.
 */
export function ruleKind(info: Pick<JoinInfo, "mode" | "next_reward_cost" | "earn_piastres_per_point">):
  | "stampsWithTarget"
  | "stamps"
  | "pointsWithTarget"
  | "pointsRate"
  | "points" {
  if (info.mode === "visits") return info.next_reward_cost > 0 ? "stampsWithTarget" : "stamps";
  if (info.earn_piastres_per_point <= 0) return "points";
  return info.next_reward_cost > 0 ? "pointsWithTarget" : "pointsRate";
}
