"use client"

import { RefreshCw, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusIndicator } from "./status-indicator"

interface HeaderProps {
  running: boolean
  onRefresh: () => void
  isRefreshing: boolean
}

export function Header({ running, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="glass-panel rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">MITM Detection System Control</h1>
            <p className="text-muted-foreground text-sm">Monitor and control your security simulation</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusIndicator running={running} />
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="border-border hover:bg-secondary hover:text-foreground bg-transparent"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh Status
          </Button>
        </div>
      </div>
    </header>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
