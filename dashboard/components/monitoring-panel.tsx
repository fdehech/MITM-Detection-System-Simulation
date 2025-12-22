"use client"

import { useState, useEffect, useRef } from "react"
import { Terminal, Container, CheckCircle2, XCircle, AlertCircle, Maximize2, X } from "lucide-react"
import type { ContainerStatus } from "@/lib/api"
import { getContainerLogs } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MonitoringPanelProps {
  containers: ContainerStatus[]
  isLoading: boolean
}

function LogsModal({
  container,
  title,
  accentColor,
  onClose,
}: {
  container: ContainerStatus
  title: string
  accentColor: string
  onClose: () => void
}) {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    const fetchLogs = async () => {
      try {
        const fetchedLogs = await getContainerLogs(container.name)
        if (isMounted) {
          setLogs(fetchedLogs)
          setIsLoadingLogs(false)
        }
      } catch {
        if (isMounted) {
          setLogs(["Failed to fetch logs. Make sure the backend supports /logs/{container_name} endpoint."])
          setIsLoadingLogs(false)
        }
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 2000) // Poll every 2 seconds

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [container.name])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[80vh] bg-background rounded-xl border border-border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className={cn("text-sm font-mono font-medium", accentColor)}>{title} - Live Logs</span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                container.state === "running" ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground",
              )}
            >
              {container.state}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Logs Content */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-background">
          {isLoadingLogs ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-pulse">●</div>
              <span>Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-muted-foreground">No logs available</div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-3 hover:bg-secondary/30 px-2 py-0.5 rounded">
                  <span className="text-muted-foreground select-none w-8 text-right shrink-0">{index + 1}</span>
                  <span className="text-foreground whitespace-pre-wrap break-all">{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-secondary/30 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span>Auto-refreshing every 2 seconds</span>
          <span>{logs.length} lines</span>
        </div>
      </div>
    </div>
  )
}

function TerminalWindow({
  title,
  container,
  isLoading,
  accentColor,
  onExpand,
}: {
  title: string
  container: ContainerStatus | undefined
  isLoading: boolean
  accentColor: string
  onExpand: () => void
}) {
  const getStateIcon = (state: ContainerStatus["state"]) => {
    switch (state) {
      case "running":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case "stopped":
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />
    }
  }

  const getStateColor = (state: ContainerStatus["state"]) => {
    switch (state) {
      case "running":
        return "text-emerald-400"
      case "stopped":
        return "text-muted-foreground"
      case "error":
        return "text-red-400"
    }
  }

  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden flex flex-col">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <span className={cn("text-xs font-mono ml-2", accentColor)}>{title}</span>
        </div>
        {container && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onExpand}
            title="View logs"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono text-xs flex-1 min-h-[140px]">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-pulse">●</div>
            <span>Fetching status...</span>
          </div>
        ) : !container ? (
          <div className="text-muted-foreground">
            <span className={accentColor}>$</span> Container not found
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-muted-foreground">
              <span className={accentColor}>$</span> docker inspect {container.name}
            </div>
            <div
              className={cn(
                "flex items-center gap-3 p-2 rounded bg-secondary/30",
                "border-l-2",
                container.state === "running"
                  ? "border-l-emerald-500"
                  : container.state === "error"
                    ? "border-l-red-500"
                    : "border-l-muted",
              )}
            >
              <Container className={cn("h-4 w-4", accentColor)} />
              <div className="flex-1">
                <span className="text-foreground font-medium">{container.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 pl-2">
              {getStateIcon(container.state)}
              <span className={cn("text-xs", getStateColor(container.state))}>{container.status}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function MonitoringPanel({ containers, isLoading }: MonitoringPanelProps) {
  const [expandedContainer, setExpandedContainer] = useState<{
    container: ContainerStatus
    title: string
    accentColor: string
  } | null>(null)

  const proxyContainer = containers.find(
    (c) => c.name.toLowerCase().includes("proxy") || c.name.toLowerCase().includes("mitm"),
  )
  const serverContainer = containers.find((c) => c.name.toLowerCase().includes("server"))
  const clientContainer = containers.find((c) => c.name.toLowerCase().includes("client"))

  return (
    <>
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Live Monitoring</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TerminalWindow
            title="Client"
            container={clientContainer}
            isLoading={isLoading}
            accentColor="text-primary"
            onExpand={() =>
              clientContainer &&
              setExpandedContainer({
                container: clientContainer,
                title: "Client",
                accentColor: "text-primary",
              })
            }
          />
          <TerminalWindow
            title="MITM Proxy"
            container={proxyContainer}
            isLoading={isLoading}
            accentColor="text-red-400"
            onExpand={() =>
              proxyContainer &&
              setExpandedContainer({
                container: proxyContainer,
                title: "MITM Proxy",
                accentColor: "text-red-400",
              })
            }
          />
          <TerminalWindow
            title="Server"
            container={serverContainer}
            isLoading={isLoading}
            accentColor="text-emerald-400"
            onExpand={() =>
              serverContainer &&
              setExpandedContainer({
                container: serverContainer,
                title: "Server",
                accentColor: "text-emerald-400",
              })
            }
          />

        </div>
      </div>

      {expandedContainer && (
        <LogsModal
          container={expandedContainer.container}
          title={expandedContainer.title}
          accentColor={expandedContainer.accentColor}
          onClose={() => setExpandedContainer(null)}
        />
      )}
    </>
  )
}
