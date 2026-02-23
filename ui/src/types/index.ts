export interface Session {
  vmid: number
  name: string
  status: 'running' | 'stopped'
  cpus: number
  mem: number
  maxmem: number
  ip: string | null
}

export interface Snapshot {
  name: string
  description?: string
  snaptime?: number
  parent?: string
}
