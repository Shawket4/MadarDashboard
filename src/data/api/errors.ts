import { AxiosError } from "axios";
import type { TFunction } from "i18next";
import i18n from "@/i18n";
import { fmtDate, fmtTime } from "@/lib/format";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

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
    else if (k === "status" && typeof v === "string") out[k] = t(`staff.req_${v}`, v);
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

/** Refusals that mean the screen is stale: someone else decided, claimed or
 *  handled it first. The page refreshes so the list says what is true (H2-B2). */
const STALE_CODES = new Set([
  "REQUEST_ALREADY_DECIDED", "ALREADY_DECIDED", "FLAG_HANDLED", "ALREADY_CLAIMED",
  "CLAIM_ALREADY_DECIDED", "NO_PENDING_CLAIM", "SWAP_STALE", "SUGGESTION_STALE",
]);
export const isStaleRefusal = (err: unknown): boolean => {
  if (!(err instanceof AxiosError)) return false;
  const code = (err.response?.data as { code?: unknown } | undefined)?.code;
  return typeof code === "string" && STALE_CODES.has(code);
};

/**
 * Extract a human-readable message from any API / JS error. `fieldLabel`
 * names a refused field in the page's words (a coded refusal's `vars.field`).
 */
export const getErrorMessage = (err: unknown, opts: { fieldLabel?: (field: string) => string } = {}): string => {
  const t = i18n.getFixedT(null, "translation");

  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const data = err.response?.data as Record<string, unknown> | undefined;

    // A stable `code` the UI knows reads in the user's language; anything else
    // falls back to the server's own message.
    const code = typeof data?.code === "string" ? data.code : undefined;
    const vars = codedVars(data?.vars, t);
    if (typeof vars.field === "string") vars.field = opts.fieldLabel?.(vars.field) ?? vars.field;
    // A paid month can't be reopened, so it gets its own wording (PERIOD_CLOSED {paid}).
    const key =
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
              : code;
    if (key && i18n.exists(`errors.codes.${key}`)) return t(`errors.codes.${key}`, vars);
    // A 403 the server didn't code is a missing right; its prose is English (B-ROTA-9).
    if (status === 403 && !code) return t("errors.unauthorized");

    // Backend convention: { error: "..." } or { message: "..." }
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;

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
      case 422:
        return t("errors.validation");
      default:
        return status && status >= 500 ? t("errors.server") : err.message;
    }
  }

  if (err instanceof Error) return err.message;
  return t("errors.unknown");
};
