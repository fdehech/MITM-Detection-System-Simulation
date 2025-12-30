"use client"

import { useState, useEffect, useRef } from "react"
import { Terminal, Container, CheckCircle2, XCircle, AlertCircle, Maximize2, X, LayoutGrid, Trash2, Copy, Download, Check } from "lucide-react"
import type { ContainerStatus } from "@/lib/api"
import { getLogs } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MonitoringPanelProps {
  containers: ContainerStatus[]
  isLoading: boolean
}

function ConsoleView({
  container,
  title,
  accentColor,
  showTitle = true,
}: {
  container: ContainerStatus | undefined
  title: string
  accentColor: string
  showTitle?: boolean
}) {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(true)
  const [copied, setCopied] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container) return
    let isMounted = true

    const fetchLogs = async () => {
      try {
        const { logs: fetchedLogs } = await getLogs(container.name)
        if (isMounted) {
          setLogs(fetchedLogs)
          setIsLoadingLogs(false)
        }
      } catch {
        if (isMounted) {
          setLogs(["Failed to fetch logs."])
          setIsLoadingLogs(false)
        }
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 3000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [container?.name])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const handleClear = () => setLogs([])
  
  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${container?.name || "logs"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!container) return <div className="p-4 text-muted-foreground italic">Container not found</div>

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-lg border border-border overflow-hidden group/console">
      <div className="px-3 py-1.5 bg-secondary/30 border-b border-border flex items-center justify-between min-h-[32px]">
        <div className="flex items-center gap-2">
          {showTitle && (
            <span className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", accentColor)}>
              {title}
            </span>
          )}
          <span className="text-[9px] text-muted-foreground font-mono opacity-50">
            {container.status}
          </span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover/console:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy Logs"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={handleDownload}
            title="Download Logs"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 text-muted-foreground hover:text-red-400"
            onClick={handleClear}
            title="Clear Terminal"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-3 font-mono text-[10px] leading-relaxed">
        {isLoadingLogs ? (
          <div className="text-muted-foreground animate-pulse">Connecting to stream...</div>
        ) : logs.length === 0 ? (
          <div className="text-muted-foreground/50 italic">No output yet</div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-muted-foreground/20 select-none w-4 text-right shrink-0">{index + 1}</span>
                <span className="text-zinc-300 break-all">{log}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  )
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[80vh] bg-background rounded-xl border border-border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className={cn("text-sm font-mono font-medium", accentColor)}>{title} - Live Logs</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConsoleView container={container} title={title} accentColor={accentColor} showTitle={false} />
        </div>
      </div>
    </div>
  )
}

function FullExpansionModal({
  containers,
  onClose,
}: {
  containers: { client?: ContainerStatus; proxy?: ContainerStatus; server?: ContainerStatus }
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Global Lab Monitoring</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="bg-background/50 border-border hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50">
          <X className="h-4 w-4 mr-2" />
          Close Lab View
        </Button>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-tighter text-primary">Client Node</span>
          </div>
          <ConsoleView container={containers.client} title="Client" accentColor="text-primary" showTitle={false} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs font-bold uppercase tracking-tighter text-red-400">MITM Proxy</span>
          </div>
          <ConsoleView container={containers.proxy} title="Proxy" accentColor="text-red-400" showTitle={false} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-tighter text-emerald-400">Server Node</span>
          </div>
          <ConsoleView container={containers.server} title="Server" accentColor="text-emerald-400" showTitle={false} />
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
      case "running": return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case "stopped": return <XCircle className="h-4 w-4 text-muted-foreground" />
      case "error": return <AlertCircle className="h-4 w-4 text-red-400" />
    }
  }

  const getStateColor = (state: ContainerStatus["state"]) => {
    switch (state) {
      case "running": return "text-emerald-400"
      case "stopped": return "text-muted-foreground"
      case "error": return "text-red-400"
    }
  }

  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden flex flex-col group hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500/50" />
            <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
            <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
          </div>
          <span className={cn("text-[10px] font-bold font-mono ml-2 uppercase tracking-widest", accentColor)}>{title}</span>
        </div>
        {container && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onExpand}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="p-4 font-mono text-[10px] flex-1 min-h-[120px]">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
            <span>Fetching status...</span>
          </div>
        ) : !container ? (
          <div className="text-muted-foreground italic">Container not found</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded bg-secondary/20 border border-border/50">
              <Container className={cn("h-4 w-4", accentColor)} />
              <span className="text-foreground font-medium">{container.name}</span>
            </div>
            <div className="flex items-center gap-2 pl-1">
              {getStateIcon(container.state)}
              <span className={cn("font-medium", getStateColor(container.state))}>{container.status}</span>
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
  const [isFullExpanded, setIsFullExpanded] = useState(false)

  const proxyContainer = containers.find(c => c.name.toLowerCase().includes("proxy") || c.name.toLowerCase().includes("mitm"))
  const serverContainer = containers.find(c => c.name.toLowerCase().includes("server"))
  const clientContainer = containers.find(c => c.name.toLowerCase().includes("client"))

  const labContainers = {
    client: clientContainer,
    proxy: proxyContainer,
    server: serverContainer
  }

  return (
    <>
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Live Monitoring</h2>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/10 hover:text-primary"
            onClick={() => setIsFullExpanded(true)}
          >
            <LayoutGrid className="h-3 w-3 mr-2" />
            Expand Lab View
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TerminalWindow
            title="Client"
            container={clientContainer}
            isLoading={isLoading}
            accentColor="text-primary"
            onExpand={() => clientContainer && setExpandedContainer({ container: clientContainer, title: "Client", accentColor: "text-primary" })}
          />
          <TerminalWindow
            title="MITM Proxy"
            container={proxyContainer}
            isLoading={isLoading}
            accentColor="text-red-400"
            onExpand={() => proxyContainer && setExpandedContainer({ container: proxyContainer, title: "MITM Proxy", accentColor: "text-red-400" })}
          />
          <TerminalWindow
            title="Server"
            container={serverContainer}
            isLoading={isLoading}
            accentColor="text-emerald-400"
            onExpand={() => serverContainer && setExpandedContainer({ container: serverContainer, title: "Server", accentColor: "text-emerald-400" })}
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

      {isFullExpanded && (
        <FullExpansionModal
          containers={labContainers}
          onClose={() => setIsFullExpanded(false)}
        />
      )}
    </>
  )
}
