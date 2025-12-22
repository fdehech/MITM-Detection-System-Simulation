const API_BASE = "http://localhost:8000"

export interface Config {
  use_proxy: boolean
  proxy_mode: "transparent" | "random_delay" | "drop" | "reorder"
  delay_min: number
  delay_max: number
  drop_rate: number
  reorder_window: number
  max_delay: number
  message_interval: number
  payload: string
  detection_enabled: boolean
  simulation_timing: number
}

export interface SimulationStatus {
  running: boolean
  containers: ContainerStatus[]
}

export interface ContainerStatus {
  name: string
  status: string
  state: "running" | "stopped" | "error"
}

export async function getConfig(): Promise<Config> {
  const res = await fetch(`${API_BASE}/config`)
  if (!res.ok) throw new Error("Failed to fetch config")
  return res.json()
}

export async function updateConfig(config: Partial<Config>): Promise<Config> {
  const res = await fetch(`${API_BASE}/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  })
  if (!res.ok) throw new Error("Failed to update config")
  return res.json()
}

export async function startSimulation(build = false): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/simulation/start?build=${build}`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to start simulation")
  return res.json()
}

export async function stopSimulation(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/simulation/stop`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to stop simulation")
  return res.json()
}

export async function resetSimulation(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/simulation/reset`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to reset simulation")
  return res.json()
}

export async function getSimulationStatus(): Promise<SimulationStatus> {
  const res = await fetch(`${API_BASE}/simulation/status`)
  if (!res.ok) throw new Error("Failed to fetch status")
  return res.json()
}

export async function getContainerLogs(containerName: string, tail = 100): Promise<string[]> {
  const res = await fetch(`${API_BASE}/logs/${containerName}?tail=${tail}`)
  if (!res.ok) throw new Error("Failed to fetch logs")
  const data = await res.json()
  return data.logs
}
