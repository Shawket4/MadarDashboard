import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/features/customers/customers-page";
import { customersSearch } from "@/features/customers/search";

/** Customers: list, detail, edit, merge and PDPL erase. Gated on customers.view.
 *  Search and filters live in the URL and are restored on return. */
export const Route = createFileRoute("/_app/customers")({
  validateSearch: customersSearch.validateSearch,
  beforeLoad: customersSearch.beforeLoad,
  component: CustomersPage,
});
