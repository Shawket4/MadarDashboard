import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/features/customers/customers-page";

/** Customers: list, detail, edit, merge and PDPL erase. Gated on customers.view. */
export const Route = createFileRoute("/_app/customers")({
  component: CustomersPage,
});
