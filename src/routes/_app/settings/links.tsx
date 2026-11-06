import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved (2026-11-06): the Links page and the QR codes are one page now. */
export const Route = createFileRoute("/_app/settings/links")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/links-qr" });
  },
});
