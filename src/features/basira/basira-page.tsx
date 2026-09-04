/**
 * Basira — the analytics assistant.
 *
 * Named for بصيرة, "insight": what the merchant gets, rather than what the
 * machinery is. "AI" describes an implementation detail and overclaims; this
 * reads a fixed set of your own business measures and says what it found.
 *
 * ── Layout ─────────────────────────────────────────────────────────────────
 *
 * A full-height workspace, not a page that scrolls. The window is the frame;
 * the transcript scrolls inside it and the composer stays put, so the input is
 * always where you left it and the page never scrolls out from under a chart
 * mid-answer.
 *
 * Two arrangements, one component tree:
 *   • xl and up — conversation rail pinned beside the transcript.
 *   • below xl — the same rail in a slide-over, opened from the toolbar.
 *
 * The rail used to be `hidden lg:flex`, which meant a phone or tablet user
 * could start a conversation but never reopen one. That is not a layout
 * compromise; on those devices the feature simply was not there.
 *
 * ── Presentation ───────────────────────────────────────────────────────────
 *
 * Answers are laid out as findings, not as chat: the question is a heading, the
 * finding is prose beneath it, and the evidence sits under that with a
 * provenance line naming the exact query. The number is only worth acting on if
 * you can see what it counted, so the query is one click away from every chart.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowUp,
  ChevronDown,
  Clock3,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/app/confirm-dialog";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import { getErrorMessage } from "@/data/api/errors";
import { toast } from "sonner";

import * as api from "./api";
import { ResultView, ScopeBadge } from "./result-block";
import { ConversationList } from "./conversation-list";
import { blocksFromStoredTurn } from "./history";
import type { ChatFrame, ConversationSummary, Exchange, ResultBlock } from "./types";

/**
 * Questions offered on an empty conversation. Deliberately specific: a vague
 * prompt teaches the merchant nothing about what this can actually do, and the
 * first question someone asks sets their expectation of the whole feature.
 */
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
  const [railOpen, setRailOpen] = useState(false);
  const [renaming, setRenaming] = useState<ConversationSummary | null>(null);

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

  // Abort an in-flight turn on unmount, so a half-read stream does not keep a
  // connection open behind a navigation.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [exchanges]);

  const openConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    setActiveId(id);
    setRailOpen(false);
    setLoadingThread(true);
    try {
      const detail = await api.getConversation(id);
      setExchanges(
        detail.turns.map((turn) => ({
          id: turn.id,
          question: turn.question,
          answer: turn.answer,
          kind: turn.kind,
          // Charts come back with the turn. They are the figures that were on
          // screen when the question was asked, so they are dated rather than
          // presented as current — see `blocksFromStoredTurn`.
          results: blocksFromStoredTurn(turn),
          capturedAt: turn.specs.find((s) => s.captured_at)?.captured_at ?? undefined,
          pending: false,
          fromHistory: true,
        })),
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const startNew = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(undefined);
    setExchanges([]);
    setRailOpen(false);
  }, []);

  const ask = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const id = nextId();
      setQuestion("");
      setBusy(true);
      setExchanges((prev) => [...prev, { id, question: trimmed, results: [], pending: true }]);

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
                patch((x) => ({
                  ...x,
                  results: [...x.results, frame.block],
                  querying: undefined,
                }));
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

  const commitRename = useCallback(
    async (title: string) => {
      const target = renaming;
      if (!target || !title.trim()) return;
      setRenaming(null);
      try {
        await api.renameConversation(target.id, title.trim());
        void refreshList();
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [refreshList, renaming],
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
  const activeTitle = conversations.find((c) => c.id === activeId)?.title;

  const listProps = {
    conversations,
    activeId,
    loading: loadingList,
    onOpen: (id: string) => void openConversation(id),
    onNew: startNew,
    onRename: (c: ConversationSummary) => setRenaming(c),
    onDelete: (c: ConversationSummary) => void remove(c),
    isRtl,
  };

  return (
    /* Fills the space the app shell leaves, rather than claiming a viewport
       height of its own -- there is a header and a footer above and below this
       outlet, and `100dvh` here would push the composer off the bottom of the
       screen by exactly their height.
   
       `min-h-0` is load-bearing on this and on every flex ancestor of a scroll
       pane. A flex item defaults to `min-height: auto`, which refuses to shrink
       below its content; the panes then grow to fit and the scrolling silently
       moves to the document -- taking the composer with it, exactly when the
       transcript is longest and the input matters most. */
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b border-border/70 px-3 py-2.5 sm:px-5">
        {/* Below xl the rail lives in a slide-over, so it needs a way in. */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 xl:hidden"
          onClick={() => setRailOpen(true)}
          aria-label={t("basira.showConversations", "Conversations")}
        >
          <MessageSquare className="size-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {activeTitle ?? t("basira.title", "Basira")}
          </h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {t("basira.subtitle", "Ask about your business in plain language.")}
          </p>
        </div>

        <Button variant="ghost" size="icon" className="shrink-0 xl:hidden" onClick={startNew}>
          <MessageSquarePlus className="size-4" />
          <span className="sr-only">{t("basira.newChat", "New conversation")}</span>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[276px] shrink-0 border-e border-border/70 p-3 xl:block">
          <ConversationList {...listProps} />
        </aside>

        <Sheet open={railOpen} onOpenChange={setRailOpen}>
          <SheetContent
            side={isRtl ? "right" : "left"}
            className="flex w-[86vw] max-w-[340px] flex-col gap-0 p-0"
          >
            <SheetHeader className="border-b border-border/70 p-3">
              <SheetTitle className="text-sm">
                {t("basira.conversations", "Conversations")}
              </SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 p-3">
              <ConversationList {...listProps} />
            </div>
          </SheetContent>
        </Sheet>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
              {loadingThread ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-2/5" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : isEmpty ? (
                <Welcome onPick={(q) => void ask(q)} />
              ) : (
                <div className="flex flex-col gap-9">
                  {exchanges.map((x) => (
                    <ExchangeView key={x.id} exchange={x} onRetry={() => void ask(x.question)} />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
            <form
              className="mx-auto flex w-full max-w-3xl items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void ask(question);
              }}
            >
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter breaks the line — the convention in
                  // every chat the merchant already uses. On touch the soft
                  // keyboard sends its own newline, so this stays desktop-only.
                  if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
                    e.preventDefault();
                    void ask(question);
                  }
                }}
                rows={1}
                disabled={busy}
                placeholder={t("basira.placeholder", "Ask about sales, staff, stock…")}
                className="max-h-40 min-h-11 resize-none py-3 text-[15px] sm:text-sm"
              />
              <Button
                type="submit"
                size="icon"
                className="size-11 shrink-0 rounded-full"
                disabled={busy || !question.trim()}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
                <span className="sr-only">{t("basira.send", "Send")}</span>
              </Button>
            </form>
            <p className="mx-auto mt-2 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
              {t(
                "basira.disclaimer",
                "Reads your own business figures. Staff names are replaced with codes before anything leaves.",
              )}
            </p>
          </div>
        </section>
      </div>

      <RenameDialog
        conversation={renaming}
        onCancel={() => setRenaming(null)}
        onSave={(title) => void commitRename(title)}
      />
    </div>
  );
}

/**
 * Rename, as a real dialog.
 *
 * This was a `window.prompt`, which cannot be translated, cannot be styled,
 * ignores RTL, and on iOS Safari renders as a system alert bearing the site's
 * domain — the single most out-of-place thing that can appear in a product.
 */
function RenameDialog({
  conversation,
  onCancel,
  onSave,
}: {
  conversation: ConversationSummary | null;
  onCancel: () => void;
  onSave: (title: string) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (conversation) setValue(conversation.title);
  }, [conversation]);

  return (
    <Dialog open={conversation !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("basira.renamePrompt", "Rename conversation")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(value);
          }}
        >
          <Input value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={!value.trim()}>
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Welcome({ onPick }: { onPick: (q: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start py-6 sm:py-12">
      <h2 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">
        {t("basira.welcomeTitle", "What would you like to know?")}
      </h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
        {t(
          "basira.welcomeBody",
          "Ask in English or Arabic. Every answer comes with the chart and the exact query behind it.",
        )}
      </p>
      <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => {
          const label = t(`basira.starters.${s.key}`, s.fallback);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onPick(label)}
              className="rounded-xl border border-border/70 px-3.5 py-3 text-start text-[13px] leading-snug text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground"
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExchangeView({ exchange, onRetry }: { exchange: Exchange; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="scroll-mt-6"
    >
      {/* The question reads as a heading rather than a chat bubble. Scrolling
          back through a long conversation then works like scanning a report,
          which is what someone is actually doing when they return to one. */}
      <h2 className="text-pretty text-[15px] font-semibold leading-snug text-foreground sm:text-base">
        {exchange.question}
      </h2>

      <div className="mt-3 space-y-3">
        {exchange.pending && !exchange.answer ? (
          <Working step={exchange.step} querying={exchange.querying} />
        ) : null}

        {exchange.answer ? (
          <p
            className={cn(
              "text-[15px] leading-relaxed text-foreground sm:text-sm",
              exchange.kind === "clarify" && "text-muted-foreground",
            )}
          >
            {exchange.answer}
          </p>
        ) : null}

        {exchange.capturedAt && exchange.results.length > 0 ? (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock3 className="size-3 shrink-0" />
            {t("basira.asAt", "Figures as at {{when}}", {
              when: fmtDateTime(exchange.capturedAt),
            })}
          </p>
        ) : null}

        {exchange.results.map((block, i) => (
          <BlockCard key={i} block={block} stale={Boolean(exchange.capturedAt)} />
        ))}

        {exchange.error ? <Failure message={exchange.error} onRetry={onRetry} /> : null}
      </div>
    </motion.article>
  );
}

/**
 * A failed turn.
 *
 * The backend now says what went wrong and what to try instead, so this renders
 * that sentence as the primary content rather than burying it under a generic
 * "something went wrong" title. Retry sits next to it because re-asking is the
 * correct first move for a timeout or a dropped stream.
 */
function Failure({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 sm:flex-row sm:items-start sm:gap-3">
      <AlertCircle className="size-4 shrink-0 text-destructive sm:mt-0.5" />
      <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-foreground">{message}</p>
      <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onRetry}>
        <RefreshCw className="size-3.5" />
        {t("common.retry", "Try again")}
      </Button>
    </div>
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

function BlockCard({ block, stale }: { block: ResultBlock; stale?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="flex flex-wrap items-center gap-2 px-3 pt-3 sm:px-4 sm:pt-4">
        {block.title ? (
          <h3 className="text-[13px] font-medium text-foreground">{block.title}</h3>
        ) : null}
        <ScopeBadge block={block} />
      </div>

      {/* The renderer can produce a wide table; it must scroll inside its own
          box rather than making the whole workspace scroll sideways. */}
      <div className="min-w-0 overflow-x-auto px-3 py-3 sm:px-4">
        <ResultView block={block} />
      </div>

      {/* Provenance: the RESOLVED query — dataset, real dates, filters that
          actually ran — never the model's raw arguments. It is what makes a
          number checkable instead of something to take on faith. */}
      <div className="border-t border-border/70 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
          {t("basira.provenance", "What was queried")}
        </button>
        {open ? <Provenance block={block} stale={stale} /> : null}
      </div>
    </div>
  );
}

function Provenance({ block, stale }: { block: ResultBlock; stale?: boolean }) {
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
    <div className="mt-2 space-y-1 overflow-x-auto rounded-lg bg-muted/50 p-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
      <p className="whitespace-pre-wrap break-words">{parts.join(" · ")}</p>
      <Separator className="my-1.5" />
      <p className="break-words">
        {period} · {block.scope.label} · {block.row_count} {t("basira.rows", "rows")}
        {stale ? ` · ${t("basira.stored", "stored")}` : ""}
      </p>
    </div>
  );
}
