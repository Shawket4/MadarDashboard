import { AxiosError } from "axios";
import type { TFunction } from "i18next";
import { madarWhatsAppHref } from "@/config/contact";
import i18n from "@/i18n";
import { fmtDate, fmtDateTimeFull, fmtTime } from "@/lib/format";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** The kinds the backend's AppError writes before its sentence. */
const SERVER_KIND_PREFIX = /^(?:Unauthorized|Forbidden|Not found|Bad request|Conflict|Service unavailable|Database error): /;

/**
 * A coded refusal's figures (`ErrorBody.vars`) ready for its sentence: a
 * date reads as a date, an instant as a time, weekdays and a status as
 * words; everything else as sent.
 */
function codedVars(raw: unknown, t: TFunction): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k === "date" && typeof v === "string") out[k] = fmtDate(v);
    // Weekdays 0 = Sunday (SHIFT_DAYS_IN_USE); a request's status (REQUEST_ALREADY_DECIDED).
    else if (k === "days" && Array.isArray(v))
      out[k] = v.map((d) => t(`staff.${WEEKDAY_KEYS[Number(d)] ?? ""}`, String(d))).join(t("common.listSeparator", ", "));
    // A block's day that has its own times but isn't one of its days (SHIFT_DAY_TIMES_OFF_DAY).
    else if (k === "day_of_week" && typeof v === "number") out[k] = t(`staff.${WEEKDAY_KEYS[v] ?? ""}`, String(v));
    else if (k === "status" && typeof v === "string") out[k] = t(`staff.req_${v}`, v);
    // People named in a refusal (SALARY_MISSING, D9).
    else if (k === "names" && Array.isArray(v)) out[k] = v.join(t("common.listSeparator", ", "));
    // The instant an offline punch claims (PUNCH_IN_FUTURE, PUNCH_TOO_OLD): its date matters too.
    else if (k === "at" && typeof v === "string") out[k] = fmtDateTimeFull(v);
    else if (k.endsWith("_at") && typeof v === "string") out[k] = fmtTime(v);
    else out[k] = v;
  }
  return out;
}

/**
 * SETTING_OUT_OF_RANGE (attendance rules, B-SETUP-1) comes in four shapes:
 * a list of allowed values, or a range whose ends may be open.
 */
function settingKey(vars: Record<string, unknown>): string {
  if (Array.isArray(vars.allowed)) return "SETTING_OUT_OF_RANGE_choice";
  if (vars.min_inclusive === false) return "SETTING_OUT_OF_RANGE_above";
  if (vars.max_inclusive === false) return "SETTING_OUT_OF_RANGE_below";
  return "SETTING_OUT_OF_RANGE";
}

/** A work shift's numbers as the shift dialog labels them (SHIFT_SETTING_INVALID {field}). */
const SHIFT_FIELD_LABELS: Record<string, [string, string]> = {
  grace_minutes: ["staff.graceMinutes", "Grace (minutes)"],
  break_minutes: ["staff.breakMinutes", "Break (minutes)"],
  overtime_threshold_minutes: ["staff.otThreshold", "Overtime after (minutes)"],
  checkin_window_minutes: ["staff.checkinWindow", "Check-in opens (minutes early)"],
  half_day_threshold_minutes: ["staff.halfDayThreshold", "Half day below (minutes)"],
  overtime_multiplier: ["staff.otMultiplier", "Overtime multiplier"],
  ot_day_multiplier: ["staff.otDayMultiplier", "Day overtime rate"],
  ot_night_multiplier: ["staff.otNightMultiplier", "Night overtime rate"],
};

/** A payroll month's status as the Payroll page names it (PERIOD_* {status, from, to}, M43). */
const PERIOD_STATUS_KEYS: Record<string, [string, string]> = {
  draft: ["dawam.phase_open", "Open"],
  generated: ["dawam.phase_approved", "Approved"],
  paid: ["dawam.phase_paid", "Paid"],
  closed: ["dawam.phase_closed", "Closed"],
};

/** Codes whose `status` picks the sentence rather than filling it in. */
const STATUS_VARIANTS: Record<string, string[]> = {
  CANCEL_REASON_REQUIRED: ["approved"],
  OPEN_SHIFT_CLOSED: ["filled", "cancelled"],
};

/** Refusals that mean the screen is stale: someone else decided, claimed or
 *  handled it first. The page refreshes so the list says what is true (H2-B2). */
const STALE_CODES = new Set([
  "REQUEST_ALREADY_DECIDED", "ALREADY_DECIDED", "FLAG_HANDLED", "ALREADY_CLAIMED",
  "CLAIM_ALREADY_DECIDED", "NO_PENDING_CLAIM", "SWAP_STALE", "SUGGESTION_STALE",
  // Nothing waiting any more: decided, withdrawn, filled or cancelled elsewhere (H2-B9).
  "NO_CLAIM_WAITING", "NO_SWAP_WAITING", "NO_SWAP_TO_CANCEL", "OPEN_SHIFT_CLOSED",
  "NO_COVER_WAITING", "NO_OVERTIME_WAITING", "PAYSLIP_ALREADY_PAID",
  // A stock transfer moved on under this person (another side acted first).
  "TRANSFER_CHANGED", "TRANSFER_STEP_NOT_OPEN",
]);
/** A plan refusal is a 403 `{code: "plan_*", feature, error, error_ar}` (madar-plan); every `plan_` code reads the same way. */
export const isPlanRefusal = (code: unknown): boolean => typeof code === "string" && code.startsWith("plan_");

/**
 * Changes only Madar makes for an owner (`PATCH /orgs/{id}`): a field the owner
 * may not set, and a currency that is fixed once the shop has taken an order.
 * The owner cannot fix either in the dashboard, so the message points at Madar.
 */
const MADAR_ONLY_CODES = new Set(["ORG_FIELD_MADAR_ONLY", "ORG_CURRENCY_LOCKED"]);

const errorCode = (err: unknown): string | undefined => {
  const c = err instanceof AxiosError ? (err.response?.data as { code?: unknown } | undefined)?.code : undefined;
  return typeof c === "string" ? c : undefined;
};

/** Whether the way on from this refusal is a message to Madar (a plan limit, a Madar-only change). */
export const needsMadar = (err: unknown): boolean => {
  const code = errorCode(err);
  return code !== undefined && (isPlanRefusal(code) || MADAR_ONLY_CODES.has(code));
};

/** WhatsApp to Madar, prefilled with what the owner was trying to do, in the UI language. */
export function madarContactHref(err?: unknown): string {
  const t = i18n.getFixedT(null, "translation");
  const code = err === undefined ? undefined : errorCode(err);
  const feature = err instanceof AxiosError ? (err.response?.data as { feature?: unknown } | undefined)?.feature : undefined;
  if (code && MADAR_ONLY_CODES.has(code))
    return madarWhatsAppHref(
      t(code === "ORG_CURRENCY_LOCKED" ? "errors.contactMessage.currency" : "errors.contactMessage.field"),
    );
  if (typeof feature === "string" && i18n.exists(`plan.features.${feature}`))
    return madarWhatsAppHref(t("plan.upgrade.message", { feature: t(`plan.features.${feature}`) }));
  return madarWhatsAppHref(t("plan.upgrade.messageGeneric"));
}

/** Messages that point at Madar, so a toast showing one can offer the "Contact Madar" action (see lib/contact-toast). */
const madarMessages = new Map<string, string>();
export const madarActionFor = (message: string): string | undefined => madarMessages.get(message);
const forMadar = (err: unknown, message: string): string => {
  madarMessages.set(message, madarContactHref(err));
  return message;
};

/** The server's limiter said "not now" (429): ask again later, keep what is shown. */
export const isRateLimited = (err: unknown): boolean => err instanceof AxiosError && err.response?.status === 429;

export const isStaleRefusal = (err: unknown): boolean => {
  if (!(err instanceof AxiosError)) return false;
  const code = (err.response?.data as { code?: unknown } | undefined)?.code;
  return typeof code === "string" && STALE_CODES.has(code);
};

/**
 * Extract a human-readable message from any API / JS error. `fieldLabel`
 * names a refused field in the page's words (a coded refusal's `vars.field`).
 */
/** What a REASON_REQUIRED refusal was about: the caller knows, the server sends no vars (A5). */
export type ReasonFor = "payLine" | "stopLine" | "punchFor" | "decline" | "correctAdvance";

const ARABIC_LETTER = /[\u0600-\u06FF]/;
const isArabicUi = (): boolean => (i18n.resolvedLanguage ?? i18n.language ?? "").startsWith("ar");

export const getErrorMessage = (
  err: unknown,
  opts: {
    fieldLabel?: (field: string) => string;
    reasonFor?: ReasonFor;
    /** The form picks a month, not a day: a closed month says "pick an open month" (A5). */
    monthForm?: boolean;
  } = {},
): string => {
  const t = i18n.getFixedT(null, "translation");

  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const data = err.response?.data as Record<string, unknown> | undefined;

    // A stable `code` the UI knows reads in the user's language; anything else
    // falls back to the server's own message.
    const code = typeof data?.code === "string" ? data.code : undefined;
    const rawVars = (data?.vars && typeof data.vars === "object" ? data.vars : {}) as Record<string, unknown>;
    const vars = codedVars(data?.vars, t);
    // A value the client sent that the server didn't know reads as sent (STATUS_UNKNOWN).
    if (code === "STATUS_UNKNOWN") vars.status = rawVars.status;
    if (code?.startsWith("PERIOD_"))
      for (const k of ["status", "from", "to"]) {
        const w = typeof rawVars[k] === "string" ? PERIOD_STATUS_KEYS[rawVars[k] as string] : undefined;
        if (w) vars[k] = t(w[0], w[1]);
      }
    const shiftField = code === "SHIFT_SETTING_INVALID" && typeof vars.field === "string" ? SHIFT_FIELD_LABELS[vars.field] : undefined;
    if (typeof vars.field === "string")
      vars.field = opts.fieldLabel?.(vars.field) ?? (shiftField ? t(shiftField[0], shiftField[1]) : vars.field);
    const variant =
      code && typeof rawVars.status === "string" && STATUS_VARIANTS[code]?.includes(rawVars.status) ? `${code}_${rawVars.status}` : undefined;
    // A paid month can't be reopened, so it gets its own wording (PERIOD_CLOSED {paid}).
    const reasonKey =
      code === "REASON_REQUIRED" && opts.reasonFor
        ? `REASON_REQUIRED_${opts.reasonFor}`
        : code === "PERIOD_CLOSED" && opts.monthForm
          ? vars.paid === true ? "PERIOD_CLOSED_paid_month" : "PERIOD_CLOSED_month"
          : undefined;
    const key = reasonKey ?? variant ?? (
      code === "PERIOD_CLOSED" && vars.paid === true
        ? "PERIOD_CLOSED_paid"
        : code === "SETTING_OUT_OF_RANGE"
          ? settingKey(vars)
          : // Refusals that name who or what, when the server sends the figures (B-ROTA-1, B-ROTA-3);
            // the app's claim and an older server send none.
            (code === "ALREADY_ROSTERED" || code === "SHIFT_DAYS_IN_USE") && typeof vars.name === "string"
            ? `${code}_named`
            : code === "SHIFTS_OVERLAP" && typeof vars.a === "string"
              ? "SHIFTS_OVERLAP_named"
              : // Over the cap with no amount: the caller may not see the salary it reveals (D7).
                code === "ADVANCE_OVER_CAP" && vars.more_egp === undefined && vars.over_cap === true
                ? "ADVANCE_OVER_CAP_owner"
                : code);
    // A plan refusal (403 `plan_*`, madar-plan) carries its own sentence in both
    // languages: the Arabic UI reads `error_ar`, the English one `error`. The
    // upgrade hint closes it, so a toast always says how to go on.
    if (isPlanRefusal(code)) {
      const ar = typeof data?.error_ar === "string" ? data.error_ar : undefined;
      const en = typeof data?.error === "string" ? data.error.replace(SERVER_KIND_PREFIX, "") : undefined;
      const sentence = (isArabicUi() ? (ar ?? en) : en) ?? t("plan.refused");
      return forMadar(err, `${sentence} ${t("plan.upgrade.hint")}`);
    }
    // Only Madar changes these for an owner; say so, and say who to ask.
    if (code && MADAR_ONLY_CODES.has(code)) return forMadar(err, t(`errors.codes.${code}`));
    if (key && i18n.exists(`errors.codes.${key}`)) return t(`errors.codes.${key}`, vars);
    // The limiter's 429 carries no code and English prose: word it, never as the network.
    if (status === 429 && !code) return t("errors.tooManyRequests");
    // A 403 the server didn't code is a missing right; its prose is English (B-ROTA-9).
    if (status === 403 && !code) return t("errors.unauthorized");

    // Backend convention: { error: "..." } or { message: "..." }. The server
    // prefixes the error's kind ("Conflict: …", AppError's Display); the
    // reader wants the sentence (owner decision 43).
    const sentence =
      typeof data?.error === "string"
        ? data.error.replace(SERVER_KIND_PREFIX, "")
        : typeof data?.message === "string"
          ? data.message
          : undefined;
    // The server writes English: inside the Arabic UI its sentence gives way
    // to the status's own words below (an English line on an Arabic screen).
    if (sentence !== undefined && !(isArabicUi() && !ARABIC_LETTER.test(sentence))) return sentence;

    // Network / offline
    if (!err.response) return t("errors.networkError");

    switch (status) {
      case 401:
        return t("errors.sessionExpired");
      case 403:
        return t("errors.unauthorized");
      case 404:
        return t("errors.notFound");
      case 409:
        return t("errors.conflict");
      case 400:
      case 422:
        return t("errors.validation");
      default:
        return status && status >= 500 ? t("errors.server") : err.message;
    }
  }

  if (err instanceof Error) return err.message;
  return t("errors.unknown");
};
