import { createFileRoute } from "@tanstack/react-router";

import { AiChatPage } from "@/features/ai-chat/ai-chat-page";

/** AI analytics chat — ask about your data in plain language. */
export const Route = createFileRoute("/_app/insights/ai-chat")({
  component: AiChatPage,
});
