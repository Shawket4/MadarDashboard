import { createFileRoute } from "@tanstack/react-router";
import { paymentMethodsSearch } from "@/features/payment-methods/search";
import { PaymentMethodsPage } from "@/features/payment-methods/payment-methods-page";

/** ?edit=<id>|new opens the payment-method editor. */
export const Route = createFileRoute("/_app/settings/payment-methods")({
  validateSearch: (s: Record<string, unknown>) => ({
    ...paymentMethodsSearch.validateSearch(s),
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  beforeLoad: paymentMethodsSearch.beforeLoad,
  component: PaymentMethodsPage,
});
