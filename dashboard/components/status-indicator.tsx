"use client"

import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  running: boolean
  className?: string
}

export function StatusIndicator({ running, className }: StatusIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <div className={cn("h-3 w-3 rounded-full", running ? "bg-emerald-500" : "bg-red-500")} />
        {running && <div className="absolute inset-0 h-3 w-3 rounded-full bg-emerald-500 animate-ping opacity-75" />}
      </div>
      <span
        className={cn("text-sm font-medium uppercase tracking-wider", running ? "text-emerald-400" : "text-red-400")}
      >
        Simulation: {running ? "RUNNING" : "STOPPED"}
      </span>
    </div>
  )
}
