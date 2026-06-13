import { createFileRoute } from "@tanstack/react-router";
import { PaymentMethodsPage } from "@/features/payment-methods/payment-methods-page";

/** ?edit=<id>|new opens the payment-method editor. */
export const Route = createFileRoute("/_app/settings/payment-methods")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  component: PaymentMethodsPage,
});
