import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { getConversation, listConversations } from "./api";

/** One prefix for the rail and every thread, so a turn, rename or delete refreshes both. */
export const CONVERSATIONS_KEY = ["/ai/conversations"] as const;
const LIST_LIMIT = 30;

/** The conversation rail: the page reads it and the sidebar prefetch warms it. */
export const conversationsQueryOptions = () =>
  queryOptions({ queryKey: [...CONVERSATIONS_KEY, { limit: LIST_LIMIT }], queryFn: () => listConversations(LIST_LIMIT) });

/** One stored thread: opening it reads this, hovering it in the rail warms it. */
export const conversationQueryOptions = (id: string) =>
  queryOptions({ queryKey: [...CONVERSATIONS_KEY, id], queryFn: () => getConversation(id) });

/** Sidebar/palette intent. */
export function prefetchBasira(qc: QueryClient): void {
  void qc.prefetchQuery(conversationsQueryOptions());
}
