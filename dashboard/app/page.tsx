"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Shield, Activity, Terminal, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { ConfigPanel } from "@/components/config-panel"
import { ControlPanel } from "@/components/control-panel"
import { MonitoringPanel } from "@/components/monitoring-panel"
import { getConfig, updateConfig, startSimulation, stopSimulation, getSimulationStatus, resetConfig } from "@/lib/api"
import type { Config, SimulationStatus } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const { toast } = useToast()
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Shared local config state for all panels
  const [localConfig, setLocalConfig] = useState<Partial<Config>>({})

  const { data: config, mutate: mutateConfig } = useSWR<Config>("/config", getConfig)
  const { data: status, mutate: mutateStatus } = useSWR<SimulationStatus>("/simulation/status", getSimulationStatus, {
    refreshInterval: 2000,
  })

  // Sync localConfig when data is fetched
  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
  }, [config])

  const handleConfigChange = <K extends keyof Config>(key: K, value: Config[K]) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      await updateConfig(localConfig)
      await mutateConfig()
      toast({
        title: "Success",
        description: "Configuration updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStart = async (build: boolean) => {
    setIsStarting(true)
    try {
      await startSimulation(build)
      await mutateStatus()
      toast({
        title: "Simulation Started",
        description: "The MITM simulation is now running.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start simulation",
        variant: "destructive",
      })
    } finally {
      setIsStarting(false)
    }
  }

  const handleStop = async () => {
    setIsStopping(true)
    try {
      await stopSimulation()
      await mutateStatus()
      toast({
        title: "Simulation Stopped",
        description: "The MITM simulation has been shut down.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop simulation",
        variant: "destructive",
      })
    } finally {
      setIsStopping(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all settings to factory defaults?")) return
    setIsResetting(true)
    try {
      await resetConfig()
      await mutateConfig()
      toast({
        title: "Reset Successful",
        description: "Configuration has been restored to defaults.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset configuration",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  const isRunning = status?.running ?? false
  const containers = status?.containers ?? []

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">MITM Detection System</h1>
              <p className="text-muted-foreground">Monitor and configure your network security lab</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
              isRunning 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              <Activity className={`h-4 w-4 ${isRunning ? "animate-pulse" : ""}`} />
              <span className="text-sm font-medium uppercase tracking-wider">
                {isRunning ? "System Active" : "System Offline"}
              </span>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Containers</p>
              <p className="text-2xl font-bold text-foreground">{containers.filter(c => c.state === "running").length} / {containers.length}</p>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Attack Mode</p>
              <p className="text-2xl font-bold text-foreground capitalize">{config?.proxy_mode.replace('_', ' ') ?? 'None'}</p>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isRunning ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              {isRunning ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Detection Status</p>
              <p className="text-2xl font-bold text-foreground">{config?.detection_enabled ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <ConfigPanel
              localConfig={localConfig}
              onChange={handleConfigChange}
              onSave={handleSaveConfig}
              onReset={handleReset}
              isSaving={isSaving}
              isResetting={isResetting}
              showOnly={["client", "server", "proxy"]}
            />
          </div>

          {/* Control and Monitoring */}
          <div className="lg:col-span-2 space-y-6">
            <ConfigPanel
              localConfig={localConfig}
              onChange={handleConfigChange}
              onSave={handleSaveConfig}
              onReset={handleReset}
              isSaving={isSaving}
              isResetting={isResetting}
              showOnly={["simulation", "actions"]}
            />
            <ControlPanel
              running={isRunning}
              onStart={handleStart}
              onStop={handleStop}
              isStarting={isStarting}
              isStopping={isStopping}
            />
            <MonitoringPanel containers={containers} isLoading={isRefreshing && !status} />
          </div>
        </div>
      </div>
    </main>
  )
}
