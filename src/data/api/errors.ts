import { AxiosError } from "axios";
import i18n from "@/i18n";

/** Extract a human-readable message from any API / JS error. */
export const getErrorMessage = (err: unknown): string => {
  const t = i18n.getFixedT(null, "translation");

  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const data = err.response?.data as Record<string, unknown> | undefined;

    // A stable `code` the UI knows reads in the user's language; anything else
    // falls back to the server's own message.
    const code = typeof data?.code === "string" ? data.code : undefined;
    if (code && i18n.exists(`errors.codes.${code}`)) return t(`errors.codes.${code}`);

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
