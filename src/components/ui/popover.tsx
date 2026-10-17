import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { composeRefs, OverlayOpenProvider, useOverlayRoot, usePopperPresence } from "@/lib/motion"

function Popover({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  // Held here so PopoverContent can stay mounted through its exit.
  const [isOpen, setOpen] = useOverlayRoot(open, defaultOpen, onOpenChange)
  return (
    <OverlayOpenProvider value={isOpen}>
      <PopoverPrimitive.Root data-slot="popover" open={isOpen} onOpenChange={setOpen} {...props} />
    </OverlayOpenProvider>
  )
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ref,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const own = React.useRef<HTMLDivElement>(null)
  const { mounted, forceMount } = usePopperPresence(own)
  if (!mounted) return null
  return (
    <PopoverPrimitive.Portal forceMount={forceMount}>
      <PopoverPrimitive.Content
        ref={composeRefs(own, ref)}
        forceMount={forceMount}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
}
