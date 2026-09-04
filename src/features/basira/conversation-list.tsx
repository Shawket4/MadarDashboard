/**
 * The conversation rail.
 *
 * One component, rendered in two places: a fixed rail from `xl` up, and the
 * body of a slide-over below that. It previously existed only as an `<aside
 * className="hidden lg:flex">`, which meant that on a phone or a tablet the
 * list of your own conversations did not exist at all — you could start a new
 * one but never return to an old one. A feature that is unreachable on the
 * device most managers carry is not a responsive layout problem, it is a
 * missing feature.
 */
import { useTranslation } from "react-i18next";
import { MessageSquarePlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";

import type { ConversationSummary } from "./types";

export function ConversationList({
  conversations,
  activeId,
  loading,
  onOpen,
  onNew,
  onRename,
  onDelete,
  isRtl,
}: {
  conversations: ConversationSummary[];
  activeId?: string;
  loading: boolean;
  onOpen: (id: string) => void;
  onNew: () => void;
  onRename: (c: ConversationSummary) => void;
  onDelete: (c: ConversationSummary) => void;
  isRtl: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Button variant="outline" className="w-full justify-start gap-2" onClick={onNew}>
        <MessageSquarePlus className="size-4" />
        {t("basira.newChat", "New conversation")}
      </Button>

      {/* Native overflow rather than a ScrollArea: this pane is a flex child of
          a fixed-height column, so it must be free to shrink. `min-h-0` is what
          allows that — without it a flex item refuses to go below its content
          height and the scroll silently moves to the page instead. */}
      <div className="-me-1 min-h-0 flex-1 overflow-y-auto pe-1">
        {loading ? (
          <div className="space-y-1.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-1 pt-2 text-xs leading-relaxed text-muted-foreground">
            {t("basira.noChats", "Your conversations will appear here.")}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id} className="group/item relative">
                  <button
                    type="button"
                    onClick={() => onOpen(c.id)}
                    className={cn(
                      // Padded on the trailing side to leave room for the menu,
                      // so a long title is truncated by the box rather than
                      // sliding underneath the button.
                      "w-full rounded-lg px-2.5 py-2 pe-9 text-start transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <span className="block truncate text-[13px] font-medium">{c.title}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/80">
                      {t("basira.turnCount", "{{count}} questions", { count: c.turn_count })}
                      {c.last_turn_at ? ` · ${fmtDate(c.last_turn_at)}` : ""}
                    </span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "absolute top-1.5 size-7",
                          isRtl ? "start-1" : "end-1",
                          // Always visible on touch, where there is no hover to
                          // reveal it. `group-hover` alone hides rename/delete
                          // from every phone and tablet user permanently.
                          "opacity-100 xl:opacity-0 xl:group-hover/item:opacity-100 xl:focus-visible:opacity-100",
                        )}
                        aria-label={t("common.more", "More")}
                      >
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRtl ? "start" : "end"}>
                      <DropdownMenuItem onClick={() => onRename(c)}>
                        <Pencil className="size-3.5" />
                        {t("common.rename", "Rename")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(c)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        {t("common.delete", "Delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
