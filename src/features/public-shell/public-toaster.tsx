/**
 * Moved to the one toast module, @/components/ui/toast. Kept as a re-export so a
 * branch still importing this path builds; `node scripts/codemod-toast.mjs`
 * rewrites such imports. No toast code lives here.
 */
export { Toaster as PublicToaster, toastFormError, useErrorToast } from "@/components/ui/toast";
