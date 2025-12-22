"use client"

import { Play, Square, Wrench } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Config } from "@/lib/api"

interface ControlPanelProps {
  running: boolean
  onStart: (build: boolean) => Promise<void>
  onStop: () => Promise<void>
  isStarting: boolean
  isStopping: boolean
}

export function ControlPanel({ running, onStart, onStop, isStarting, isStopping }: ControlPanelProps) {
  const [forceBuild, setForceBuild] = useState(false)

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Wrench className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Simulation Control</h2>
      </div>

      <div className="space-y-4">
        {/* Force Rebuild Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="force-build"
            checked={forceBuild}
            onCheckedChange={(checked) => setForceBuild(checked === true)}
          />
          <Label htmlFor="force-build" className="text-sm text-muted-foreground cursor-pointer">
            Force Rebuild (rebuild Docker containers)
          </Label>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => onStart(forceBuild)}
            disabled={running || isStarting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            <Play className="h-4 w-4 mr-2" />
            {isStarting ? "Starting..." : "START"}
          </Button>
          <Button onClick={onStop} disabled={!running || isStopping} variant="destructive" className="flex-1">
            <Square className="h-4 w-4 mr-2" />
            {isStopping ? "Stopping..." : "STOP"}
          </Button>
        </div>
      </div>
    </div>
  )
}
