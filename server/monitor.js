import { spawn } from 'node-pty'
import { EventEmitter } from 'events'
import * as proxmox from './proxmox.js'

const SYNC_INTERVAL = 15_000
const RETRY_DELAY = 5_000

export class SessionMonitor extends EventEmitter {
  constructor() {
    super()
    this.connections = new Map() // vmid -> { pty, ip }
    this.pollInterval = null
  }

  start() {
    console.log('[monitor] starting session monitor')
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
          console.log(`[monitor] removing monitor for stopped container ${vmid}`)
          conn.pty.kill()
          this.connections.delete(vmid)
        }
      }

      // Add connections for new running containers
      for (const container of running) {
        if (!this.connections.has(container.vmid)) {
          const ip = await proxmox.getContainerIP(container.vmid).catch(() => null)
          if (ip) {
            this.connect(container.vmid, ip)
          } else {
            console.log(`[monitor] no IP for container ${container.vmid}, will retry`)
          }
        }
      }
    } catch (err) {
      console.error('[monitor] sync error:', err.message)
    }
  }

  connect(vmid, ip) {
    console.log(`[monitor] connecting to container ${vmid} (${ip})`)

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
        console.log(`[monitor] bell detected from container ${vmid}`)
        this.emit('bell', vmid)
      }
    })

    pty.onExit(({ exitCode }) => {
      console.log(`[monitor] container ${vmid} monitor exited (code=${exitCode})`)
      this.connections.delete(vmid)
    })

    this.connections.set(vmid, { pty, ip })
  }
}
