import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** An icon-only row action: ghost button, aria-label, tooltip. Destructive tints the glyph only. */
export function RowAction({
  label,
  children,
  destructive,
  className,
  asChild,
  ...props
}: { label: string; children: ReactNode; destructive?: boolean } & Omit<ComponentProps<typeof Button>, "children">) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          asChild={asChild}
          className={cn(destructive && "text-destructive hover:text-destructive", className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
