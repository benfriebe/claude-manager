let sessions = []
let activeSession = null
let term = null
let fitAddon = null
let ws = null
let resizeObserver = null

// --- Session management ---

async function loadSessions() {
  const res = await fetch('/api/sessions')
  sessions = await res.json()
  renderSessions()
}

function renderSessions() {
  const list = document.getElementById('session-list')
  const count = document.getElementById('session-count')
  count.textContent = sessions.length

  if (sessions.length === 0) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:#475569;font-size:13px">No sessions yet</div>'
    return
  }

  list.innerHTML = sessions.map(s => `
    <div class="session-card ${activeSession?.vmid === s.vmid ? 'active' : ''}" 
         onclick="selectSession(${s.vmid})">
      <div class="session-card-top">
        <span class="session-name">${s.name.replace('claude-', '')}</span>
        <span class="status-dot ${s.status}"></span>
      </div>
      <div class="session-meta">
        <span>VMID ${s.vmid}</span>
        ${s.ip ? `<span>${s.ip}</span>` : ''}
        ${s.mem ? `<span>${Math.round(s.mem / 1024 / 1024)}MB</span>` : ''}
      </div>
      <div class="session-actions">
        ${s.status === 'running' 
          ? `<button class="btn-ghost btn-sm" onclick="stopSession(event, ${s.vmid})">Stop</button>`
          : `<button class="btn-ghost btn-sm" onclick="startSession(event, ${s.vmid})">Start</button>`
        }
        <button class="btn-danger btn-sm" onclick="destroySession(event, ${s.vmid})">Destroy</button>
      </div>
    </div>
  `).join('')
}

async function selectSession(vmid) {
  const session = sessions.find(s => s.vmid === vmid)
  if (!session || session.status !== 'running') {
    toast('Session is not running', 'error')
    return
  }

  activeSession = session
  renderSessions()
  openTerminal(vmid, session.name)
  
  // On mobile, hide sidebar and show terminal
  document.getElementById('sidebar').classList.add('hidden-mobile')
  document.getElementById('back-btn').style.display = 'block'
}

function showSidebar() {
  document.getElementById('sidebar').classList.remove('hidden-mobile')
  document.getElementById('back-btn').style.display = 'none'
  activeSession = null
  renderSessions()
  closeTerminal()
}

// --- Terminal ---

function openTerminal(vmid, name) {
  closeTerminal()

  document.getElementById('empty-state').style.display = 'none'
  const activeDiv = document.getElementById('active-terminal')
  activeDiv.style.display = 'flex'
  document.getElementById('terminal-title').textContent = name

  term = new Terminal({
    theme: {
      background: '#0d1117',
      foreground: '#e2e8f0',
      cursor: '#a78bfa',
      selectionBackground: '#3730a3',
    },
    fontSize: 13,
    fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
    cursorBlink: true,
    scrollback: 5000,
    allowTransparency: true,
  })

  fitAddon = new FitAddon.FitAddon()
  term.loadAddon(fitAddon)
  term.open(document.getElementById('terminal-container'))
  fitAddon.fit()

  // WebSocket connection
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${location.host}/terminal?vmid=${vmid}`)

  ws.onopen = () => {
    // Send initial size
    ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
  }

  ws.onmessage = e => {
    const msg = JSON.parse(e.data)
    if (msg.type === 'output') term.write(msg.data)
  }

  ws.onclose = () => {
    term.write('\r\n\x1b[33m[Connection closed]\x1b[0m\r\n')
  }

  term.onData(data => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data }))
    }
  })

  // Resize handling
  resizeObserver = new ResizeObserver(() => {
    fitAddon.fit()
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
    }
  })
  resizeObserver.observe(document.getElementById('terminal-container'))
}

function closeTerminal() {
  if (ws) { ws.close(); ws = null }
  if (term) { term.dispose(); term = null }
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
  document.getElementById('empty-state').style.display = 'flex'
  document.getElementById('active-terminal').style.display = 'none'
}

// --- Session actions ---

async function createSession() {
  const name = document.getElementById('new-session-name').value.trim()
  if (!name) return

  const btn = event.target
  btn.textContent = 'Creating...'
  btn.disabled = true

  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e.error)))

    closeModal('create-modal')
    toast(`Session claude-${name} created`, 'success')
    await loadSessions()
  } catch (err) {
    toast(err || 'Failed to create session', 'error')
  } finally {
    btn.textContent = 'Create & Start'
    btn.disabled = false
  }
}

async function stopSession(e, vmid) {
  e.stopPropagation()
  if (!confirm('Stop this session?')) return
  await fetch(`/api/sessions/${vmid}/stop`, { method: 'POST' })
  toast('Session stopped', 'success')
  await loadSessions()
}

async function startSession(e, vmid) {
  e.stopPropagation()
  await fetch(`/api/sessions/${vmid}/start`, { method: 'POST' })
  toast('Session starting...', 'success')
  setTimeout(loadSessions, 2000)
}

async function destroySession(e, vmid) {
  e.stopPropagation()
  if (!confirm('Permanently destroy this session? This cannot be undone.')) return
  await fetch(`/api/sessions/${vmid}`, { method: 'DELETE' })
  if (activeSession?.vmid === vmid) closeTerminal()
  toast('Session destroyed', 'success')
  await loadSessions()
}

// --- Snapshots ---

async function createSnapshot() {
  const name = document.getElementById('snap-name').value.trim()
  const description = document.getElementById('snap-desc').value.trim()
  if (!name || !activeSession) return

  await fetch(`/api/sessions/${activeSession.vmid}/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })

  toast('Snapshot created', 'success')
  loadSnapshotList()
}

async function loadSnapshotList() {
  if (!activeSession) return
  const snaps = await fetch(`/api/sessions/${activeSession.vmid}/snapshots`).then(r => r.json())
  const list = document.getElementById('snapshot-list')

  if (snaps.length === 0) {
    list.innerHTML = '<div style="color:#475569;font-size:12px">No snapshots yet</div>'
    return
  }

  list.innerHTML = snaps.map(s => `
    <div class="snapshot-item">
      <div>
        <div>${s.name}</div>
        ${s.description ? `<div style="color:#64748b">${s.description}</div>` : ''}
      </div>
      <button class="btn-ghost btn-sm" onclick="rollback('${s.name}')">Restore</button>
    </div>
  `).join('')
}

async function rollback(snapname) {
  if (!confirm(`Rollback to snapshot "${snapname}"? Current state will be lost.`)) return
  await fetch(`/api/sessions/${activeSession.vmid}/snapshots/${snapname}/rollback`, { method: 'POST' })
  toast('Rolled back to ' + snapname, 'success')
  closeModal('snapshot-modal')
}

// --- UI helpers ---

function openCreateModal() {
  document.getElementById('create-modal').classList.remove('hidden')
  setTimeout(() => document.getElementById('new-session-name').focus(), 100)
}

function openSnapshotModal() {
  document.getElementById('snapshot-modal').classList.remove('hidden')
  loadSnapshotList()
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden')
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden')
  })
})

function toast(msg, type = 'success') {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.className = `toast show ${type}`
  setTimeout(() => el.className = 'toast', 3000)
}

// --- Init ---
loadSessions()
setInterval(loadSessions, 15000) // Refresh every 15s