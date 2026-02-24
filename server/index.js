import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { fileURLToPath } from 'url'
import path from 'path'
import * as proxmox from './proxmox.js'
import { handleTerminalSocket } from './terminal.js'
import { provisionHooks } from './provision.js'
import config from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const server = createServer(app)

const terminalWss = new WebSocketServer({ noServer: true })
const alertsWss = new WebSocketServer({ noServer: true })

// Route WebSocket upgrades to the correct handler
server.on('upgrade', (req, socket, head) => {
  const { pathname } = new URL(req.url, 'http://localhost')
  if (pathname === '/terminal') {
    terminalWss.handleUpgrade(req, socket, head, (ws) => {
      terminalWss.emit('connection', ws, req)
    })
  } else if (pathname === '/alerts') {
    alertsWss.handleUpgrade(req, socket, head, (ws) => {
      alertsWss.emit('connection', ws, req)
    })
  } else {
    socket.destroy()
  }
})

// --- Session activity state broadcast ---
// States: 'active' (Claude working), 'needs_input' (waiting for user), 'idle' (finished)
const sessionStates = new Map() // vmid -> state

function eventToState(event) {
  if (event === 'Notification') return 'needs_input'
  if (event === 'UserPromptSubmit' || event === 'SubagentStart') return 'active'
  if (event === 'Stop') return 'idle'
  return null
}

function broadcastState(vmid, state) {
  const prev = sessionStates.get(vmid)
  if (prev === state) return

  if (state === 'idle') {
    sessionStates.delete(vmid)
  } else {
    sessionStates.set(vmid, state)
  }

  const msg = JSON.stringify({ type: 'state', vmid, state })
  for (const client of alertsWss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(msg)
    }
  }
}

// Cache hostname -> vmid mapping
let hostnameCache = new Map()
let hostnameCacheTime = 0
const CACHE_TTL = 10_000

async function resolveHostnameToVmid(hostname) {
  const now = Date.now()
  if (now - hostnameCacheTime > CACHE_TTL) {
    const containers = await proxmox.listContainers()
    hostnameCache = new Map(containers.map(c => [c.name, c.vmid]))
    hostnameCacheTime = now
  }
  return hostnameCache.get(hostname) ?? null
}

app.use(express.json())
app.use(express.static(path.join(__dirname, '../dist')))

// --- API Routes ---

// Receive alert from Claude Code hooks running inside containers
app.post('/api/alerts', async (req, res) => {
  const { hostname, event } = req.body
  if (!hostname || !event) return res.status(400).json({ error: 'hostname and event required' })

  try {
    const vmid = await resolveHostnameToVmid(hostname)
    const state = eventToState(event)
    if (vmid && state) {
      broadcastState(vmid, state)
    }
  } catch {}

  res.json({ ok: true })
})

// List all claude- containers with status
app.get('/api/sessions', async (req, res) => {
  try {
    const containers = await proxmox.listContainers()
    const sessions = await Promise.all(containers.map(async c => {
      const ip = c.status === 'running'
        ? await proxmox.getContainerIP(c.vmid).catch(() => null)
        : null
      return {
        vmid: c.vmid,
        name: c.name,
        status: c.status,
        cpus: c.cpus,
        mem: c.mem,
        maxmem: c.maxmem,
        ip,
      }
    }))
    res.json(sessions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create new session from template
app.post('/api/sessions', async (req, res) => {
  const { name } = req.body
  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    return res.status(400).json({ error: 'Name must be lowercase alphanumeric with hyphens' })
  }
  try {
    const session = await proxmox.createSession(name)
    // Provision hooks in background — don't block the response
    provisionHooks(session.vmid).catch(() => {})
    res.json(session)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Stop a session
app.post('/api/sessions/:vmid/stop', async (req, res) => {
  try {
    await proxmox.stopSession(req.params.vmid)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Start a stopped session
app.post('/api/sessions/:vmid/start', async (req, res) => {
  try {
    await proxmox.api('POST', `/nodes/${config.proxmox.node}/lxc/${req.params.vmid}/status/start`)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Destroy a session entirely
app.delete('/api/sessions/:vmid', async (req, res) => {
  try {
    await proxmox.destroySession(req.params.vmid)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Snapshot
app.post('/api/sessions/:vmid/snapshots', async (req, res) => {
  const { name, description } = req.body
  try {
    await proxmox.snapshotSession(req.params.vmid, name, description)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/sessions/:vmid/snapshots', async (req, res) => {
  try {
    const snaps = await proxmox.listSnapshots(req.params.vmid)
    res.json(snaps.filter(s => s.name !== 'current'))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/sessions/:vmid/snapshots/:snapname/rollback', async (req, res) => {
  try {
    await proxmox.rollbackSnapshot(req.params.vmid, req.params.snapname)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SPA catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// --- WebSocket handlers ---
terminalWss.on('connection', (ws, req) => {
  const vmid = new URL(req.url, 'http://localhost').searchParams.get('vmid')
  if (!vmid) return ws.close()
  handleTerminalSocket(ws, vmid)
})

// Send current state snapshot to newly connected alert clients
alertsWss.on('connection', (ws) => {
  for (const [vmid, state] of sessionStates) {
    ws.send(JSON.stringify({ type: 'state', vmid, state }))
  }
})

server.listen(config.server.port, () => {
  console.log(`Claude Manager running on :${config.server.port}`)
})
