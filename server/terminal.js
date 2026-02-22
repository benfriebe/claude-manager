import { spawn } from 'node-pty'
import * as proxmox from './proxmox.js'

export async function handleTerminalSocket(ws, vmid) {
  // Get the container's IP directly
  const ip = await proxmox.getContainerIP(vmid)
  if (!ip) {
    ws.send(JSON.stringify({ type: 'output', data: 'Could not get container IP\r\n' }))
    ws.close()
    return
  }

  const pty = spawn('ssh', [
    '-tt',                        // force TTY
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'UserKnownHostsFile=/dev/null',
    '-i', '/root/.ssh/id_rsa',   // key from webui container to target containers
    `root@${ip}`,
    'tmux new-session -A -s main'
  ], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    env: process.env,
  })

  pty.onData(data => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'output', data }))
  })

  pty.onExit(() => ws.close())

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw)
      if (msg.type === 'input') pty.write(msg.data)
      if (msg.type === 'resize') pty.resize(msg.cols, msg.rows)
    } catch {}
  })

  ws.on('close', () => pty.kill())
}