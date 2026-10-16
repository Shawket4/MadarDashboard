import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

import { composeRefs, DISTANCE, OverlayOpenProvider, recipes, useOverlayOpen, useOverlayRoot, usePresence } from "@/lib/motion"

function Collapsible({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  // Held here so CollapsibleContent can stay mounted through its exit.
  const [isOpen, setOpen] = useOverlayRoot(open, defaultOpen, onOpenChange)
  return (
    <OverlayOpenProvider value={isOpen}>
      <CollapsiblePrimitive.Root data-slot="collapsible" open={isOpen} onOpenChange={setOpen} {...props} />
    </OverlayOpenProvider>
  )
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

/** Opening, the content rises in; closing, it leaves before the space closes. */
const reveal = recipes.rise("product", DISTANCE.xs)

function CollapsibleContent({
  ref,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  const own = React.useRef<HTMLDivElement>(null)
  const open = useOverlayOpen()
  // Whatever is open on the first render just shows.
  const mounted = usePresence(open ?? true, [[own, reveal]], { initial: false })
  const forceMount = open === null ? undefined : mounted ? (true as const) : undefined
  return (
    <CollapsiblePrimitive.CollapsibleContent
      ref={composeRefs(own, ref)}
      data-slot="collapsible-content"
      forceMount={forceMount}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
