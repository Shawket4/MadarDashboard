/**
 * Basira — the analytics assistant.
 *
 * Named for بصيرة, "insight": what the merchant gets, rather than what the
 * machinery is. "AI" describes an implementation detail and overclaims; this
 * thing reads a fixed set of your own business measures and says what it found.
 *
 * The layout is a working tool, not a chat toy: conversations on the left,
 * transcript in the middle, and every answer carrying the chart AND a
 * provenance line saying exactly which query produced it. That last part is the
 * difference between an assistant you can act on and one you have to verify by
 * hand — the number is only useful if you can see what it counted.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
  ChevronDown,
  Loader2,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Send,
  Sparkle,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/app/empty-state";
import { Page, PageHeader } from "@/components/app/page";
import { useConfirm } from "@/components/app/confirm-dialog";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/data/api/errors";
import { toast } from "sonner";

import * as api from "./api";
import { ResultView, ScopeBadge } from "./result-block";
import type {
  ChatFrame,
  ConversationSummary,
  Exchange,
  ResultBlock,
} from "./types";

/** Questions offered on an empty conversation. Deliberately specific — a vague
 *  prompt teaches the merchant nothing about what the thing can actually do. */
const STARTERS = [
  { key: "topProducts", fallback: "What sold best last month?" },
  { key: "branchCompare", fallback: "Compare my branches this month" },
  { key: "peakHours", fallback: "When are we busiest?" },
  { key: "waste", fallback: "What am I wasting the most money on?" },
] as const;

let localId = 0;
const nextId = () => `x${++localId}`;

export function BasiraPage() {
  const { t, i18n } = useTranslation();
  const confirm = useConfirm();
  const isRtl = i18n.dir() === "rtl";

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshList = useCallback(async () => {
    try {
      setConversations(await api.listConversations());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  // Abort an in-flight turn when the page unmounts, so a half-read stream does
  // not keep a connection open behind a navigation.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [exchanges]);

  /** Open a stored conversation. */
  const openConversation = useCallback(
    async (id: string) => {
      abortRef.current?.abort();
      setActiveId(id);
      setLoadingThread(true);
      try {
        const detail = await api.getConversation(id);
        setExchanges(
          detail.turns.map((turn) => ({
            id: turn.id,
            question: turn.question,
            answer: turn.answer,
            kind: turn.kind,
            // Stored turns keep the QUERY, never the rows — re-running the spec
            // is what would give current figures, and showing last week's
            // numbers as if they were today's would be worse than showing none.
            results: [],
            pending: false,
            fromHistory: true,
          })),
        );
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoadingThread(false);
      }
    },
    [],
  );

  const startNew = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(undefined);
    setExchanges([]);
  }, []);

  const ask = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const id = nextId();
      setQuestion("");
      setBusy(true);
      setExchanges((prev) => [
        ...prev,
        { id, question: trimmed, results: [], pending: true },
      ]);

      const patch = (fn: (x: Exchange) => Exchange) =>
        setExchanges((prev) => prev.map((x) => (x.id === id ? fn(x) : x)));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let createdId: string | undefined;
        await api.askStreaming({
          question: trimmed,
          conversationId: activeId,
          locale: i18n.language?.startsWith("ar") ? "ar" : "en",
          signal: controller.signal,
          onFrame: (frame: ChatFrame) => {
            switch (frame.event) {
              case "started":
                if (frame.conversation_id) createdId = frame.conversation_id;
                break;
              case "thinking":
                patch((x) => ({ ...x, step: frame.step, querying: undefined }));
                break;
              case "querying":
                patch((x) => ({ ...x, querying: frame.title ?? frame.dataset }));
                break;
              case "result":
                // Charts land as they finish, so something real is on screen
                // while the model is still writing the sentence about it.
                patch((x) => ({ ...x, results: [...x.results, frame.block], querying: undefined }));
                break;
              case "answer": {
                const r = frame.response;
                createdId = r.conversation_id ?? createdId;
                patch((x) => ({
                  ...x,
                  pending: false,
                  step: undefined,
                  querying: undefined,
                  kind: r.kind,
                  answer: r.kind === "clarify" ? r.question : r.text,
                  // Trust the terminal frame over the streamed blocks: it is
                  // the contract, and a dropped progress frame must not leave
                  // the transcript missing a chart.
                  results: r.kind === "clarify" ? [] : r.results,
                }));
                break;
              }
              case "error":
                patch((x) => ({ ...x, pending: false, step: undefined, error: frame.message }));
                break;
            }
          },
        });

        if (createdId && createdId !== activeId) {
          setActiveId(createdId);
          void refreshList();
        } else if (activeId) {
          void refreshList();
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        patch((x) => ({ ...x, pending: false, step: undefined, error: getErrorMessage(err) }));
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [activeId, busy, i18n.language, refreshList],
  );

  const rename = useCallback(
    async (c: ConversationSummary) => {
      const title = window.prompt(t("basira.renamePrompt", "Rename conversation"), c.title);
      if (!title?.trim()) return;
      try {
        await api.renameConversation(c.id, title.trim());
        void refreshList();
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [refreshList, t],
  );

  const remove = useCallback(
    async (c: ConversationSummary) => {
      const ok = await confirm({
        title: t("basira.deleteTitle", "Delete this conversation?"),
        description: t(
          "basira.deleteBody",
          "The questions and answers are removed. Your data is not affected.",
        ),
        confirmLabel: t("common.delete", "Delete"),
        destructive: true,
      });
      if (!ok) return;
      try {
        await api.deleteConversation(c.id);
        if (c.id === activeId) startNew();
        void refreshList();
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [activeId, confirm, refreshList, startNew, t],
  );

  const isEmpty = exchanges.length === 0 && !loadingThread;

  return (
    <Page>
      <PageHeader
        title={t("basira.title", "Basira")}
        description={t(
          "basira.subtitle",
          "Ask about your business in plain language. Every answer shows the figures behind it.",
        )}
      />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* ── Conversations ───────────────────────────────────────────── */}
        <aside className="hidden lg:flex lg:flex-col lg:gap-2">
          <Button variant="outline" className="justify-start gap-2" onClick={startNew}>
            <MessageSquarePlus className="size-4" />
            {t("basira.newChat", "New conversation")}
          </Button>
          <ScrollArea className="h-[calc(100svh-15rem)] pe-1">
            {loadingList ? (
              <div className="space-y-1.5 pt-1">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-2 pt-3 text-xs text-muted-foreground">
                {t("basira.noChats", "Your conversations will appear here.")}
              </p>
            ) : (
              <ul className="space-y-0.5 pt-1">
                {conversations.map((c) => (
                  <li key={c.id} className="group/item flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void openConversation(c.id)}
                      className={cn(
                        "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-start text-[13px] transition-colors",
                        c.id === activeId
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                      title={c.title}
                    >
                      {c.title}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100 focus-visible:opacity-100"
                          aria-label={t("common.more", "More")}
                        >
                          <MoreHorizontal className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRtl ? "start" : "end"}>
                        <DropdownMenuItem onClick={() => void rename(c)}>
                          <Pencil className="size-3.5" />
                          {t("common.rename", "Rename")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => void remove(c)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                          {t("common.delete", "Delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </aside>

        {/* ── Transcript ──────────────────────────────────────────────── */}
        <section className="flex min-h-[calc(100svh-13rem)] flex-col rounded-xl border border-border/70 bg-card">
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {loadingThread ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-2/5" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : isEmpty ? (
              <Welcome onPick={(q) => void ask(q)} />
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-6">
                {exchanges.map((x) => (
                  <ExchangeView key={x.id} exchange={x} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Composer ─────────────────────────────────────────────── */}
          <div className="border-t border-border/70 p-3 sm:p-4">
            <form
              className="mx-auto flex max-w-3xl items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void ask(question);
              }}
            >
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter breaks the line — the convention
                  // in every chat the merchant already uses.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask(question);
                  }
                }}
                rows={1}
                disabled={busy}
                placeholder={t("basira.placeholder", "Ask about sales, staff, stock…")}
                className="max-h-40 min-h-11 resize-none"
              />
              <Button type="submit" size="icon" className="size-11 shrink-0" disabled={busy || !question.trim()}>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className={cn("size-4", isRtl && "-scale-x-100")} />
                )}
                <span className="sr-only">{t("basira.send", "Send")}</span>
              </Button>
            </form>
            <p className="mx-auto mt-2 max-w-3xl text-[11px] text-muted-foreground">
              {t(
                "basira.disclaimer",
                "Reads your own business figures. Staff names are replaced with codes before anything leaves.",
              )}
            </p>
          </div>
        </section>
      </div>
    </Page>
  );
}

function Welcome({ onPick }: { onPick: (q: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
        <Sparkle className="size-5" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        {t("basira.welcomeTitle", "What would you like to know?")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(
          "basira.welcomeBody",
          "Ask in English or Arabic. Answers come with the chart and the query behind them.",
        )}
      </p>
      <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => {
          const label = t(`basira.starters.${s.key}`, s.fallback);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onPick(label)}
              className="rounded-lg border border-border/70 px-3 py-2.5 text-start text-[13px] text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground"
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExchangeView({ exchange }: { exchange: Exchange }) {
  const { t } = useTranslation();
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-3"
    >
      <p className="ms-auto w-fit max-w-[85%] rounded-2xl rounded-ee-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
        {exchange.question}
      </p>

      {exchange.pending && !exchange.answer ? (
        <Working step={exchange.step} querying={exchange.querying} />
      ) : null}

      {exchange.results.map((block, i) => (
        <BlockCard key={i} block={block} />
      ))}

      {exchange.answer ? (
        <p
          className={cn(
            "max-w-[95%] text-sm leading-relaxed text-foreground",
            exchange.kind === "clarify" && "italic text-muted-foreground",
          )}
        >
          {exchange.answer}
        </p>
      ) : null}

      {exchange.fromHistory && exchange.kind !== "clarify" ? (
        <p className="text-[11px] text-muted-foreground">
          {t("basira.historyNote", "Charts are not stored — ask again for current figures.")}
        </p>
      ) : null}

      {exchange.error ? (
        <EmptyState
          title={t("basira.failed", "That question could not be answered")}
          description={exchange.error}
          className="border-destructive/30"
        />
      ) : null}
    </motion.article>
  );
}

function Working({ step, querying }: { step?: number; querying?: string }) {
  const { t } = useTranslation();
  const label = querying
    ? t("basira.running", "Looking up {{what}}…", { what: querying })
    : step && step > 1
      ? t("basira.rethinking", "Refining the query…")
      : t("basira.thinking", "Working on it…");
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

function BlockCard({ block }: { block: ResultBlock }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/70 bg-background p-3 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {block.title ? (
          <h3 className="text-[13px] font-medium text-foreground">{block.title}</h3>
        ) : null}
        <ScopeBadge block={block} />
      </div>

      <ResultView block={block} />

      {/* Provenance. Renders the RESOLVED query — the dataset, the real dates,
          the filters that actually ran — never the model's raw arguments. It is
          what makes a number checkable instead of something to take on faith. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
        {t("basira.provenance", "What was queried")}
      </button>
      {open ? <Provenance block={block} /> : null}
    </div>
  );
}

function Provenance({ block }: { block: ResultBlock }) {
  const { t } = useTranslation();
  const spec = block.spec;

  const parts = useMemo(() => {
    const out: string[] = [spec.dataset];
    if (spec.dimensions?.length) out.push(`by ${spec.dimensions.join(" × ")}`);
    if (spec.measures?.length) out.push(spec.measures.join(", "));
    const filters = Object.entries(spec.filters ?? {});
    if (filters.length) out.push(filters.map(([k, v]) => `${k}=${v}`).join(" "));
    return out;
  }, [spec]);

  const period =
    block.period_from && block.period_to
      ? `${block.period_from.slice(0, 10)} → ${block.period_to.slice(0, 10)}`
      : t("basira.allTime", "all time");

  return (
    <div className="mt-2 space-y-1 rounded-lg bg-muted/50 p-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
      <p>{parts.join(" · ")}</p>
      <Separator className="my-1.5" />
      <p>
        {period} · {block.scope.label} · {block.row_count}{" "}
        {t("basira.rows", "rows")}
      </p>
    </div>
  );
}
