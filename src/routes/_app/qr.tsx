import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved: QR codes are configuration, and share Settings › Links & QR codes with the Links page. */
export const Route = createFileRoute("/_app/qr")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/links-qr", search: { section: "codes" } });
  },
});
