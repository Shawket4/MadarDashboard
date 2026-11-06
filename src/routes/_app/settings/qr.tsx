import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved (2026-11-06): QR codes share one page with the Links page; land on the codes. */
export const Route = createFileRoute("/_app/settings/qr")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/links-qr", search: { section: "codes" } });
  },
});
