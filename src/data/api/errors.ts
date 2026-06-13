import { AxiosError } from "axios";
import i18n from "@/i18n";

/** Extract a human-readable message from any API / JS error. */
export const getErrorMessage = (err: unknown): string => {
  const t = i18n.getFixedT(null, "translation");

  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const data = err.response?.data as Record<string, unknown> | undefined;

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
