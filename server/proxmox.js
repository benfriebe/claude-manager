import https from 'https'
import fetch from 'node-fetch'
import config from '../config.js'

const { host, port, tokenId, tokenSecret, node } = config.proxmox

const agent = new https.Agent({ rejectUnauthorized: false }) // Proxmox uses self-signed cert
const BASE = `https://${host}:${port}/api2/json`
const HEADERS = {
  'Authorization': `PVEAPIToken=${tokenId}=${tokenSecret}`,
  'Content-Type': 'application/json',
}

async function api(method, path, body = null) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : null,
    agent,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.errors || json.message || res.statusText)
  return json.data
}

export async function listContainers() {
  const containers = await api('GET', `/nodes/${node}/lxc`)
  // Enrich with config data for containers that match our naming convention
  return containers
    .filter(c => c.name?.startsWith('claude-'))
    .sort((a, b) => a.vmid - b.vmid)
}

export async function getContainerStatus(vmid) {
  return api('GET', `/nodes/${node}/lxc/${vmid}/status/current`)
}

export async function createSession(name) {
  const { templateId, storagePool } = config.proxmox
  // Get next available VMID
  const nextId = await api('GET', '/cluster/nextid')
  
  await api('POST', `/nodes/${node}/lxc/${templateId}/clone`, {
    newid: nextId,
    hostname: `claude-${name}`,
    full: 1,
    storage: storagePool,
  })
  
  // Wait for clone task to finish, then start
  await waitForLock(nextId)
  await api('POST', `/nodes/${node}/lxc/${nextId}/status/start`)
  
  return { vmid: nextId, name: `claude-${name}` }
}

export async function stopSession(vmid) {
  return api('POST', `/nodes/${node}/lxc/${vmid}/status/stop`)
}

export async function destroySession(vmid) {
  // Stop first if running
  try { await stopSession(vmid) } catch {}
  await sleep(2000)
  return api('DELETE', `/nodes/${node}/lxc/${vmid}`)
}

export async function snapshotSession(vmid, snapname, description) {
  return api('POST', `/nodes/${node}/lxc/${vmid}/snapshot`, {
    snapname,
    description,
  })
}

export async function listSnapshots(vmid) {
  return api('GET', `/nodes/${node}/lxc/${vmid}/snapshot`)
}

export async function rollbackSnapshot(vmid, snapname) {
  return api('POST', `/nodes/${node}/lxc/${vmid}/snapshot/${snapname}/rollback`)
}

export async function getContainerIP(vmid) {
  try {
    const ifaces = await api('GET', `/nodes/${node}/lxc/${vmid}/interfaces`)
    const eth = ifaces.find(i => i.name === 'eth0')
    return eth?.['inet']?.split('/')[0] || null
  } catch {
    return null
  }
}

async function waitForLock(vmid, maxWait = 30000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const status = await getContainerStatus(vmid).catch(() => ({ lock: 'clone' }))
    if (!status.lock) return
    await sleep(1000)
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))