"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Header } from "@/components/header"
import { ConfigPanel } from "@/components/config-panel"
import { ControlPanel } from "@/components/control-panel"
import { MonitoringPanel } from "@/components/monitoring-panel"
import {
  getConfig,
  updateConfig,
  startSimulation,
  stopSimulation,
  resetSimulation,
  getSimulationStatus,
  type Config,
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function Dashboard() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)

  // Fetch config
  const {
    data: config,
    error: configError,
    mutate: mutateConfig,
  } = useSWR("config", getConfig, {
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load configuration. Is the backend running?",
        variant: "destructive",
      })
    },
  })

  // Fetch status with polling
  const {
    data: status,
    error: statusError,
    mutate: mutateStatus,
    isValidating: isRefreshing,
  } = useSWR("status", getSimulationStatus, {
    refreshInterval: 3000, // Poll every 3 seconds
    onError: () => {
      // Silent error for status polling
    },
  })

  const handleRefresh = useCallback(() => {
    mutateStatus()
    mutateConfig()
  }, [mutateStatus, mutateConfig])

  const handleSaveConfig = useCallback(
    async (newConfig: Partial<Config>) => {
      setIsSaving(true)
      try {
        await updateConfig(newConfig)
        await mutateConfig()
        toast({
          title: "Success",
          description: "Configuration saved successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save configuration",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    },
    [mutateConfig, toast],
  )

  const handleReset = useCallback(async () => {
    setIsResetting(true)
    try {
      await resetSimulation()
      await mutateConfig()
      toast({
        title: "Success",
        description: "Configuration reset to defaults",
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
  }, [mutateConfig, toast])

  const handleStart = useCallback(
    async (build: boolean) => {
      setIsStarting(true)
      try {
        await startSimulation(build)
        await mutateStatus()
        toast({
          title: "Success",
          description: "Simulation started successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to start simulation",
          variant: "destructive",
        })
      } finally {
        setIsStarting(false)
      }
    },
    [mutateStatus, toast],
  )

  const handleStop = useCallback(async () => {
    setIsStopping(true)
    try {
      await stopSimulation()
      await mutateStatus()
      toast({
        title: "Success",
        description: "Simulation stopped successfully",
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
  }, [mutateStatus, toast])

  const isRunning = status?.running ?? false
  const containers = status?.containers ?? []

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header running={isRunning} onRefresh={handleRefresh} isRefreshing={isRefreshing} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <ConfigPanel
              config={config ?? null}
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
              config={config ?? null}
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
      <Toaster />
    </div>
  )
}
