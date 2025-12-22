"use client"

import { useState, useEffect } from "react"
import { Settings, RotateCcw, Save, Shield, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Config } from "@/lib/api"

interface ConfigPanelProps {
  config: Config | null
  onSave: (config: Partial<Config>) => Promise<void>
  onReset: () => Promise<void>
  isSaving: boolean
  isResetting: boolean
}

export function ConfigPanel({ config, onSave, onReset, isSaving, isResetting }: ConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<Partial<Config>>({})

  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
  }, [config])

  const handleSave = () => {
    onSave(localConfig)
  }

  const updateConfig = <K extends keyof Config>(key: K, value: Config[K]) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      {/* Client Config Card */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Client Config</h2>
        </div>

        <div className="space-y-6">
          {/* Message Interval */}
          <div className="space-y-2">
            <Label htmlFor="message_interval" className="text-foreground">
              Message Interval (s)
            </Label>
            <Input
              id="message_interval"
              type="number"
              min={0}
              step={0.1}
              value={localConfig.message_interval ?? 0}
              onChange={(e) => updateConfig("message_interval", Number.parseFloat(e.target.value) || 0)}
              className="bg-input border-border text-foreground"
            />
          </div>

          {/* Message Payload */}
          <div className="space-y-2">
            <Label htmlFor="payload" className="text-foreground">
              Message Payload
            </Label>
            <Input
              id="payload"
              type="text"
              value={localConfig.payload ?? ""}
              onChange={(e) => updateConfig("payload", e.target.value)}
              placeholder="Enter message payload"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Server Detection Config Card */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Server className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Server Detection Config</h2>
        </div>

        <div className="space-y-6">
          {/* Server-side Detection */}
          <div className="flex items-center justify-between">
            <Label htmlFor="detection_enabled" className="text-foreground">
              Server-side Detection
            </Label>
            <Switch
              id="detection_enabled"
              checked={localConfig.detection_enabled ?? false}
              onCheckedChange={(checked) => updateConfig("detection_enabled", checked)}
            />
          </div>

          {localConfig.detection_enabled && (
            <div className="space-y-2">
              <Label htmlFor="max_delay" className="text-foreground">
                Max Delay Threshold (s)
              </Label>
              <Input
                id="max_delay"
                type="number"
                min={0}
                step={0.1}
                value={localConfig.max_delay ?? 0}
                onChange={(e) => updateConfig("max_delay", Number.parseFloat(e.target.value) || 0)}
                className="bg-input border-border text-foreground"
              />
            </div>
          )}
        </div>
      </div>

      {/* MITM Proxy Config Card */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">MITM Proxy Config</h2>
        </div>

        <div className="space-y-6">
          {/* Enable MITM Proxy */}
          <div className="flex items-center justify-between">
            <Label htmlFor="use_proxy" className="text-foreground">
              Enable MITM Proxy
            </Label>
            <Switch
              id="use_proxy"
              checked={localConfig.use_proxy ?? false}
              onCheckedChange={(checked) => updateConfig("use_proxy", checked)}
            />
          </div>

          {localConfig.use_proxy && (
            <>
              {/* Attack Mode */}
              <div className="space-y-2">
                <Label htmlFor="proxy_mode" className="text-foreground">
                  Attack Mode
                </Label>
                <Select
                  value={localConfig.proxy_mode ?? "transparent"}
                  onValueChange={(value) => updateConfig("proxy_mode", value as Config["proxy_mode"])}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="transparent">Transparent</SelectItem>
                    <SelectItem value="modify">Modify</SelectItem>
                    <SelectItem value="replay">Replay</SelectItem>
                    <SelectItem value="delay">Delay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delay Duration - Only visible when mode is delay */}
              {localConfig.proxy_mode === "delay" && (
                <div className="space-y-2">
                  <Label htmlFor="delay_duration" className="text-foreground">
                    Delay Duration (s)
                  </Label>
                  <Input
                    id="delay_duration"
                    type="number"
                    min={0}
                    step={0.1}
                    value={localConfig.delay_duration ?? 0}
                    onChange={(e) => updateConfig("delay_duration", Number.parseFloat(e.target.value) || 0)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Buttons Card */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            disabled={isResetting}
            className="border-border hover:bg-secondary hover:text-foreground bg-transparent"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isResetting ? "Resetting..." : "Reset"}
          </Button>
        </div>
      </div>
    </div>
  )
}
