import { Check, ChevronDown, MapPin } from "lucide-react";

import type { PublicBranch } from "@/data/api/generated/models/publicBranch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BranchSelectorProps {
  branches: PublicBranch[];
  currentId: string;
  onSelect: (branch: PublicBranch) => void;
  align?: "start" | "center" | "end";
}

/**
 * The branch chip — a real dropdown selector. Tapping it opens an inline menu of
 * deliverable branches (not a route back to the branch step).
 */
export function BranchSelector({ branches, currentId, onSelect, align = "start" }: BranchSelectorProps) {
  const current = branches.find((b) => b.id === currentId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          <MapPin className="size-4 shrink-0 text-brand" />
          <span className="max-w-[10rem] truncate font-medium">{current?.name ?? ""}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[13rem]">
        {branches.map((b) => (
          <DropdownMenuItem key={b.id} onSelect={() => onSelect(b)} className="gap-2">
            <MapPin className="size-4 shrink-0 text-brand" />
            <span className="min-w-0 flex-1 truncate">{b.name}</span>
            {b.id === currentId && <Check className="size-4 shrink-0 text-brand" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
