import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved: QR codes are configuration and now live under Settings. */
export const Route = createFileRoute("/_app/qr")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/qr" });
  },
});
