/**
 * "Contact Madar" on every error toast that points at Madar.
 *
 * Over a hundred call sites say `toast.error(getErrorMessage(e))`. A plan
 * refusal or a Madar-only change (`needsMadar`) ends in "contact Madar", so
 * rather than touch each one, `toast.error` is wrapped once: when the message
 * is one `getErrorMessage` wrote for such a refusal, the toast gains a WhatsApp
 * action that stays until the owner closes it. Any other toast is untouched.
 */
import { toast } from "sonner";

import { madarActionFor } from "@/data/api/errors";
import i18n from "@/i18n";

type ErrorToast = typeof toast.error;

let installed = false;

export function installContactToast(): void {
  if (installed) return;
  installed = true;
  const original: ErrorToast = toast.error.bind(toast);
  toast.error = ((message, data) => {
    const href = typeof message === "string" ? madarActionFor(message) : undefined;
    if (!href || data?.action) return original(message, data);
    return original(message, {
      duration: 12_000,
      ...data,
      action: {
        label: i18n.t("errors.contact", "Contact Madar"),
        onClick: () => void window.open(href, "_blank", "noopener,noreferrer"),
      },
    });
  }) as ErrorToast;
}
