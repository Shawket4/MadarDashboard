import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { composeRefs, OverlayOpenProvider, useOverlayRoot, usePopperPresence } from "@/lib/motion"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  // Held here so TooltipContent can stay mounted through its exit.
  const [isOpen, setOpen] = useOverlayRoot(open, defaultOpen, onOpenChange)
  return (
    <OverlayOpenProvider value={isOpen}>
      <TooltipPrimitive.Root data-slot="tooltip" open={isOpen} onOpenChange={setOpen} {...props} />
    </OverlayOpenProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const own = React.useRef<HTMLDivElement>(null)
  const { mounted, forceMount } = usePopperPresence(own)
  if (!mounted) return null
  return (
    <TooltipPrimitive.Portal forceMount={forceMount}>
      <TooltipPrimitive.Content
        ref={composeRefs(own, ref)}
        forceMount={forceMount}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
