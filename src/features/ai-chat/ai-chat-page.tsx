import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Send, Sparkles } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/data/api/errors";
import { useChat } from "@/data/api/generated/api";
import type { AiChatResponse } from "@/data/api/generated/models";

import { AiResultView } from "./ai-result-view";

interface Turn {
  id: number;
  question: string;
  status: "loading" | "done" | "error";
  response?: AiChatResponse;
  error?: string;
}

export function AiChatPage() {
  const { t, i18n } = useTranslation();
  const chat = useChat();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    t("aiChat.suggest.sales", "How were sales last week?"),
    t("aiChat.suggest.topProducts", "Top 5 products this month"),
    t("aiChat.suggest.byBranch", "Compare sales by branch"),
    t("aiChat.suggest.peak", "What are my peak hours?"),
    t("aiChat.suggest.payments", "Cash vs card breakdown"),
    t("aiChat.suggest.profit", "Most profitable products"),
  ];

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || chat.isPending) return;
    const id = nextId.current++;
    setTurns((prev) => [...prev, { id, question: q, status: "loading" }]);
    setInput("");
    // Scroll after the DOM updates.
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
    );

    try {
      const response = await chat.mutateAsync({
        data: {
          question: q,
          include_summary: true,
          locale: i18n.resolvedLanguage ?? "en",
        },
      });
      setTurns((prev) =>
        prev.map((turn) => (turn.id === id ? { ...turn, status: "done", response } : turn)),
      );
    } catch (err) {
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === id ? { ...turn, status: "error", error: getErrorMessage(err) } : turn,
        ),
      );
    } finally {
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
      );
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <Page className="flex h-[calc(100dvh-4rem)] max-w-[900px] flex-col">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            {t("aiChat.title", "AI Analytics")}
          </span>
        }
        description={t(
          "aiChat.subtitle",
          "Ask about your business in plain language — sales, products, branches, and more.",
        )}
      />

      {/* Conversation */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto pb-4">
        {turns.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Sparkles className="size-6 text-primary" aria-hidden="true" />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("aiChat.empty", "Try one of these, or ask your own question.")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => void send(s)}
                  disabled={chat.isPending}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((turn) => (
            <div key={turn.id} className="space-y-3">
              {/* User question (bubble, start-aligned to the end for RTL/LTR) */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-ee-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                  {turn.question}
                </div>
              </div>

              {/* Assistant answer */}
              {turn.status === "loading" ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-56 w-full rounded-lg" />
                </div>
              ) : turn.status === "error" ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {turn.error}
                </div>
              ) : turn.response ? (
                <div className="space-y-3">
                  {turn.response.summary ? (
                    <p className="text-sm leading-relaxed">{turn.response.summary}</p>
                  ) : null}
                  <AiResultView res={turn.response} />
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <div className="border-t bg-background pt-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={t("aiChat.placeholder", "Ask about sales, products, branches…")}
            className="max-h-40 min-h-[2.75rem] resize-none"
          />
          <Button
            onClick={() => void send(input)}
            disabled={chat.isPending || !input.trim()}
            size="icon"
            aria-label={t("aiChat.send", "Send")}
          >
            {chat.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t("aiChat.disclaimer", "Answers are generated from your own data. Double-check before acting.")}
        </p>
      </div>
    </Page>
  );
}
