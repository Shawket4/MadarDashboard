import { createFileRoute } from "@tanstack/react-router";
import { WhatsappPage } from "@/features/whatsapp/whatsapp-page";

/** Super-admin WhatsApp gateway link (QR pairing, status, pause). */
export const Route = createFileRoute("/_app/settings/whatsapp")({
  component: WhatsappPage,
});
