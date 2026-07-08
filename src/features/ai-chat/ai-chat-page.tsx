import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ArrowUp, Loader2, MessagesSquare, ShieldCheck } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/data/api/errors";
import { useChat } from "@/data/api/generated/api";
import type { AiChatResponse } from "@/data/api/generated/models";
import { fadeInUp, scaleIn, springSoft, staggerContainer } from "@/lib/motion";

import { AiResultView } from "./ai-result-view";
import { LoadingKeywords } from "./loading-keywords";

interface Turn {
  id: number;
  question: string;
  status: "loading" | "done" | "error";
  response?: AiChatResponse;
  error?: string;
}

export function AiChatPage() {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const chat = useChat();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = turns.length > 0;

  const suggestions = [
    t("aiChat.suggest.sales", "How were sales last week?"),
    t("aiChat.suggest.topProducts", "Top 5 products this month"),
    t("aiChat.suggest.byBranch", "Compare sales by branch"),
    t("aiChat.suggest.peak", "What are my peak hours?"),
    t("aiChat.suggest.payments", "Cash vs card breakdown"),
    t("aiChat.suggest.profit", "Most profitable products"),
  ];

  const scrollToEnd = () =>
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
    );

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || chat.isPending) return;
    const id = nextId.current++;
    setTurns((prev) => [...prev, { id, question: q, status: "loading" }]);
    setInput("");
    scrollToEnd();

    try {
      const response = await chat.mutateAsync({
        data: { question: q, include_summary: true, locale: i18n.resolvedLanguage ?? "en" },
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
      scrollToEnd();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const hintChips = (compact: boolean) => (
    <div
      className={
        compact
          ? "flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex flex-wrap justify-center gap-2"
      }
    >
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => void send(s)}
          disabled={chat.isPending}
          className="shrink-0 rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <Page className="flex h-[calc(100dvh-4rem)] max-w-[880px] flex-col gap-4">
      <motion.div variants={fadeInUp} initial="hidden" animate="show">
        <PageHeader
          title={t("aiChat.title", "Ask your data")}
          description={t(
            "aiChat.subtitle",
            "Ask in plain language. A deterministic algorithm matches your question to a verified report and answers with your real numbers — never guessed, no hallucinations.",
          )}
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" aria-hidden="true" />
              {t("aiChat.badge", "Verified reports · real numbers")}
            </span>
          }
        />
      </motion.div>

      <LayoutGroup>
        {/* Conversation */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto pe-1">
          {!started ? (
            <motion.div
              className="flex h-full flex-col items-center justify-center gap-5 text-center"
              variants={staggerContainer(0.06)}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={scaleIn} className="rounded-2xl bg-primary/10 p-3.5">
                <MessagesSquare className="size-7 text-primary" aria-hidden="true" />
              </motion.div>
              <motion.div variants={fadeInUp} className="space-y-1.5">
                <h2 className="text-lg font-semibold tracking-tight">
                  {t("aiChat.heroTitle", "What would you like to know?")}
                </h2>
                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                  {t("aiChat.empty", "Pick a question to start, or type your own.")}
                </p>
              </motion.div>
              <motion.div layoutId="ai-hints" transition={springSoft} className="w-full max-w-xl">
                {hintChips(false)}
              </motion.div>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {turns.map((turn) => (
                <motion.div
                  key={turn.id}
                  layout={!reduce}
                  variants={fadeInUp}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {/* Question */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-ee-sm bg-primary px-4 py-2 text-sm text-primary-foreground shadow-sm">
                      {turn.question}
                    </div>
                  </div>

                  {/* Answer */}
                  {turn.status === "loading" ? (
                    <div className="space-y-3">
                      <LoadingKeywords />
                      <Skeleton className="h-52 w-full rounded-xl" />
                    </div>
                  ) : turn.status === "error" ? (
                    <motion.div
                      variants={fadeInUp}
                      initial="hidden"
                      animate="show"
                      className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                    >
                      {turn.error}
                    </motion.div>
                  ) : turn.response ? (
                    <div className="space-y-3">
                      {turn.response.summary ? (
                        <p className="text-sm leading-relaxed">{turn.response.summary}</p>
                      ) : null}
                      <AiResultView res={turn.response} />
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Composer + persistent hints (they migrate here after the first message) */}
        <div className="shrink-0 space-y-3">
          {started ? (
            <motion.div layoutId="ai-hints" transition={springSoft}>
              {hintChips(true)}
            </motion.div>
          ) : null}

          <div className="flex items-end gap-1.5 rounded-2xl border bg-background p-1.5 shadow-sm transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={t("aiChat.placeholder", "Ask about sales, products, branches…")}
              className="max-h-40 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0"
            />
            <Button
              onClick={() => void send(input)}
              disabled={chat.isPending || !input.trim()}
              size="icon"
              className="size-9 shrink-0 rounded-xl"
              aria-label={t("aiChat.send", "Send")}
            >
              {chat.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {t("aiChat.disclaimer", "Every answer runs a verified report over your own data.")}
          </p>
        </div>
      </LayoutGroup>
    </Page>
  );
}
