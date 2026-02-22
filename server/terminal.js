import { spawn } from 'node-pty'
import config from '../config.js'

const activeSessions = new Map()

export function handleTerminalSocket(ws, vmid) {
  const { node } = config.proxmox
  
  // We exec into the container via pct exec — this runs on the Proxmox host
  // The WebUI container needs SSH access to the Proxmox host, or run on it directly
  const pty = spawn('pct', ['exec', String(vmid), '--', 'bash', '-c',
    'tmux new-session -A -s main'
  ], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    env: process.env,
  })

  const sessionKey = `${vmid}-${Date.now()}`
  activeSessions.set(sessionKey, pty)

  pty.onData(data => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }))
    }
  })

  pty.onExit(() => {
    ws.close()
    activeSessions.delete(sessionKey)
  })

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw)
      if (msg.type === 'input') pty.write(msg.data)
      if (msg.type === 'resize') pty.resize(msg.cols, msg.rows)
    } catch {}
  })

  ws.on('close', () => {
    pty.kill()
    activeSessions.delete(sessionKey)
  })
}