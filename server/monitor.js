import { spawn } from 'node-pty'
import { EventEmitter } from 'events'
import * as proxmox from './proxmox.js'

const SYNC_INTERVAL = 15_000
const BELL_COOLDOWN = 2_000 // debounce rapid bells per session

export class SessionMonitor extends EventEmitter {
  constructor() {
    super()
    this.connections = new Map() // vmid -> { pty, ip }
    this.lastBell = new Map()   // vmid -> timestamp
    this.pollInterval = null
  }

  start() {
    this.sync()
    this.pollInterval = setInterval(() => this.sync(), SYNC_INTERVAL)
  }

  stop() {
    clearInterval(this.pollInterval)
    for (const [, conn] of this.connections) {
      conn.pty.kill()
    }
    this.connections.clear()
  }

  async sync() {
    try {
      const containers = await proxmox.listContainers()
      const running = containers.filter(c => c.status === 'running')
      const runningVmids = new Set(running.map(c => c.vmid))

      // Remove connections for stopped/destroyed containers
      for (const [vmid, conn] of this.connections) {
        if (!runningVmids.has(vmid)) {
          conn.pty.kill()
          this.connections.delete(vmid)
        }
      }

      // Add connections for new running containers
      for (const container of running) {
        if (!this.connections.has(container.vmid)) {
          const ip = await proxmox.getContainerIP(container.vmid).catch(() => null)
          if (ip) this.connect(container.vmid, ip)
        }
      }
    } catch (err) {
      // Silently retry on next cycle
    }
  }

  connect(vmid, ip) {
    const pty = spawn('ssh', [
      '-tt',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ServerAliveInterval=30',
      '-o', 'LogLevel=ERROR',
      '-i', '/root/.ssh/id_rsa',
      `root@${ip}`,
      'tmux attach-session -t main -r 2>/dev/null || exit 0'
    ], {
      name: 'xterm-256color',
      cols: 300,
      rows: 100,
      env: process.env,
    })

    pty.onData(data => {
      if (data.includes('\x07')) {
        const now = Date.now()
        const last = this.lastBell.get(vmid) || 0
        if (now - last > BELL_COOLDOWN) {
          this.lastBell.set(vmid, now)
          this.emit('bell', vmid)
        }
      }
    })

    pty.onExit(() => {
      this.connections.delete(vmid)
      // Retry connection on next sync cycle
    })

    this.connections.set(vmid, { pty, ip })
  }
}
