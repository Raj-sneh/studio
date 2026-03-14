
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Stubbed Calendar component to save disk space.
 */
export type CalendarProps = React.HTMLAttributes<HTMLDivElement>;

function Calendar({ className, ...props }: CalendarProps) {
  return (
    <div className={cn("p-3 text-center", className)} {...props}>
      <p className="text-sm text-muted-foreground">Native date selection is used instead.</p>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
