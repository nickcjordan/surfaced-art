import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

function Badge({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(
        "inline-flex items-center bg-surface text-muted-text text-sm font-medium px-3 py-1 rounded whitespace-nowrap shrink-0",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
