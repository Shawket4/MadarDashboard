import { createFileRoute } from "@tanstack/react-router";
import { QrPage } from "@/features/qr/qr-page";

export const Route = createFileRoute("/_app/qr")({
  component: QrPage,
});
