import { AxiosError } from "axios";
import i18n from "@/i18n";
import { fmtDate, fmtTime } from "@/lib/format";

/**
 * A coded refusal's figures (`ErrorBody.vars`) ready for its sentence: a
 * date reads as a date, an instant as a time; everything else as sent.
 */
function codedVars(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k === "date" && typeof v === "string") out[k] = fmtDate(v);
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
    const vars = codedVars(data?.vars);
    if (typeof vars.field === "string") vars.field = opts.fieldLabel?.(vars.field) ?? vars.field;
    // A paid month can't be reopened, so it gets its own wording (PERIOD_CLOSED {paid}).
    const key =
      code === "PERIOD_CLOSED" && vars.paid === true
        ? "PERIOD_CLOSED_paid"
        : code === "SETTING_OUT_OF_RANGE"
          ? settingKey(vars)
          : // A manager's move names who already has the block (B-ROTA-1); the app's claim sends no figures.
            code === "ALREADY_ROSTERED" && typeof vars.name === "string"
            ? "ALREADY_ROSTERED_named"
            : code;
    if (key && i18n.exists(`errors.codes.${key}`)) return t(`errors.codes.${key}`, vars);

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
