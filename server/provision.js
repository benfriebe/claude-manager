import { execFile } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import path from 'path'
import config from '../config.js'
import * as proxmox from './proxmox.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const execFileAsync = promisify(execFile)

const SSH_OPTS = [
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'UserKnownHostsFile=/dev/null',
  '-i', '/root/.ssh/id_rsa',
]

const HOOKS_SETTINGS = JSON.stringify({
  hooks: {
    Notification: [{
      matcher: 'permission_prompt|idle_prompt|elicitation_dialog',
      hooks: [{ type: 'command', command: '/opt/claude-manager/notify.sh' }],
    }],
    UserPromptSubmit: [{
      hooks: [{ type: 'command', command: '/opt/claude-manager/notify.sh' }],
    }],
    SubagentStart: [{
      hooks: [{ type: 'command', command: '/opt/claude-manager/notify.sh' }],
    }],
    Stop: [{
      hooks: [{ type: 'command', command: '/opt/claude-manager/notify.sh' }],
    }],
  },
}, null, 2)

function ssh(ip, command) {
  return execFileAsync('ssh', [...SSH_OPTS, `root@${ip}`, command], { timeout: 15000 })
}

function scp(localPath, ip, remotePath) {
  return execFileAsync('scp', [...SSH_OPTS, localPath, `root@${ip}:${remotePath}`], { timeout: 15000 })
}

async function waitForSSH(ip, maxWait = 30000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    try {
      await ssh(ip, 'true')
      return true
    } catch {
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  return false
}

export async function provisionHooks(vmid) {
  const managerUrl = config.server.managerUrl
  if (!managerUrl) {
    console.warn('[provision] server.managerUrl not set in config, skipping hook install')
    return
  }

  // Wait for container to get an IP
  let ip = null
  for (let i = 0; i < 10; i++) {
    ip = await proxmox.getContainerIP(vmid).catch(() => null)
    if (ip) break
    await new Promise(r => setTimeout(r, 2000))
  }
  if (!ip) {
    console.error(`[provision] could not get IP for container ${vmid}`)
    return
  }

  // Wait for SSH
  if (!await waitForSSH(ip)) {
    console.error(`[provision] SSH not ready for container ${vmid} (${ip})`)
    return
  }

  try {
    // Install notify script
    await ssh(ip, 'mkdir -p /opt/claude-manager')
    await scp(path.join(__dirname, '../container-hooks/notify.sh'), ip, '/opt/claude-manager/notify.sh')
    await ssh(ip, 'chmod +x /opt/claude-manager/notify.sh')

    // Set CLAUDE_MANAGER_URL in environment
    await ssh(ip, `grep -q '^CLAUDE_MANAGER_URL=' /etc/environment 2>/dev/null && sed -i 's|^CLAUDE_MANAGER_URL=.*|CLAUDE_MANAGER_URL=${managerUrl}|' /etc/environment || echo 'CLAUDE_MANAGER_URL=${managerUrl}' >> /etc/environment`)

    // Write Claude Code hook settings
    const b64 = Buffer.from(HOOKS_SETTINGS).toString('base64')
    await ssh(ip, `mkdir -p ~/.claude && echo '${b64}' | base64 -d > ~/.claude/settings.json`)

    console.log(`[provision] hooks installed on container ${vmid} (${ip})`)
  } catch (err) {
    console.error(`[provision] failed for container ${vmid}:`, err.message)
  }
}
