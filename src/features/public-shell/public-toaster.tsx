import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { OctagonXIcon } from "lucide-react";
import { Toaster as Sonner, toast } from "sonner";

import i18n from "@/i18n";

import { usePublicTheme } from "./use-public-theme";

/**
 * The guest bundles' toaster: the storefront's own theme (not the dashboard's),
 * and the reader's direction, so an Arabic toast reads right to left.
 */
export function PublicToaster() {
  const mode = usePublicTheme((s) => s.mode);
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  return (
    <Sonner
      theme={mode}
      dir={lang.startsWith("ar") ? "rtl" : "ltr"}
      position="top-center"
      richColors
      closeButton
      icons={{ error: <OctagonXIcon className="size-4" /> }}
    />
  );
}

/**
 * One toast for the form's error at a time: a new one REPLACES the last, so a
 * customer who taps Submit three times sees one message, not a stack.
 */
const FORM_ERROR = "public-form-error";

/**
 * Say why a form did not go through where the customer is looking.
 *
 * Every guest form keeps its message in place — under the field, above the
 * button — and on a phone that place is usually off-screen: the name field is
 * at the top of a checkout the customer submitted from the bottom. The toast
 * carries the same words to the top of the screen. The inline copy stays, so
 * the field that needs fixing is still marked when they scroll to it.
 */
export function toastFormError(message: string, more = false) {
  toast.error(message, {
    id: FORM_ERROR,
    description: more ? i18nMore() : undefined,
  });
}

// Read at call time: the toast is raised outside React, in the reader's current language.
const i18nMore = () =>
  i18n.t("publicShell.formErrors.more", "Other fields need attention too.");

/**
 * Toast an error held in state, each time it is raised. Pages already clear
 * their error before a retry, so a second failure with the same words is a new
 * value and toasts again.
 */
export function useErrorToast(message: string | null | undefined) {
  useEffect(() => {
    if (message) toastFormError(message);
  }, [message]);
}
