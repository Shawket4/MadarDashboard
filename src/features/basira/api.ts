/**
 * Basira's data layer.
 *
 * Conversations go through the ordinary axios client so they inherit auth, the
 * org/branch headers and the 401 handling every other call gets. The chat turn
 * does NOT: it is `text/event-stream`, and axios buffers the whole body before
 * resolving, which would defeat the entire point. That one call uses `fetch`
 * with a `ReadableStream` reader and re-creates the header injection by hand —
 * the duplication is deliberate and is why it lives beside the rest rather than
 * being hidden inside a hook.
 */
import { apiClient } from "@/data/api/client";
import { authHeaders } from "@/data/api/stream-auth";
import { env } from "@/data/config/env";
import { reportHandledError } from "@/lib/report-error";
import type {
  ChatFrame,
  ConversationDetail,
  ConversationSummary,
  QuerySpec,
} from "./types";

// ── Conversations ───────────────────────────────────────────────────────────

export async function listConversations(limit = 30): Promise<ConversationSummary[]> {
  const { data } = await apiClient.get<{ conversations: ConversationSummary[] }>(
    "/ai/conversations",
    { params: { limit } },
  );
  return data.conversations ?? [];
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const { data } = await apiClient.get<ConversationDetail>(`/ai/conversations/${id}`);
  return data;
}

export async function renameConversation(id: string, title: string): Promise<void> {
  await apiClient.patch(`/ai/conversations/${id}`, { title });
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/ai/conversations/${id}`);
}

// ── The streamed turn ───────────────────────────────────────────────────────

export interface AskOptions {
  question: string;
  conversationId?: string;
  locale?: string;
  signal?: AbortSignal;
  /** Called for every frame, in order. */
  onFrame: (frame: ChatFrame) => void;
}

/**
 * Ask a question, streaming the answer.
 *
 * Resolves when the stream closes. Rejects only on a transport failure — a
 * turn that failed *inside* the agent arrives as an `error` frame, because that
 * is a thing to render rather than a thing to retry.
 */
export async function askStreaming({
  question,
  conversationId,
  locale,
  signal,
  onFrame,
}: AskOptions): Promise<void> {
  const response = await fetch(`${env.VITE_API_URL}/ai/chat/stream`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      question,
      conversation_id: conversationId,
      locale,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    // Everything cheap fails before the stream opens, so this is a real HTTP
    // error with a JSON body — surface its message rather than a status code.
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* keep the status-based message */
    }
    if (response.status >= 500) {
      reportHandledError(
        { component: "basira", operation: `http_${response.status}` },
        new Error(message),
      );
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line. A partial frame stays in the
      // buffer until the rest of it arrives — chunk boundaries do not respect
      // frame boundaries, and parsing per-chunk would silently drop data.
      let split = buffer.indexOf("\n\n");
      while (split !== -1) {
        const raw = buffer.slice(0, split);
        buffer = buffer.slice(split + 2);
        const frame = parseFrame(raw);
        if (frame) onFrame(frame);
        split = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseFrame(raw: string): ChatFrame | null {
  const dataLine = raw.split("\n").find((l) => l.startsWith("data: "));
  if (!dataLine) return null;
  try {
    return JSON.parse(dataLine.slice(6)) as ChatFrame;
  } catch {
    // A frame we cannot parse is a backend/client version mismatch. Dropping it
    // is right — the terminal frame still carries the whole answer.
    return null;
  }
}

// ── Pinning an answer ───────────────────────────────────────────────────────

/**
 * Run a spec directly through the metrics endpoint.
 *
 * This is what makes "pin this answer" a single action: the spec Basira returns
 * is already a valid widget definition, so re-running it needs no translation.
 */
export async function runSpec(spec: QuerySpec) {
  const { data } = await apiClient.post("/metrics/query", {
    widgets: [{ key: "pinned", spec }],
  });
  return data;
}
