import { execFile } from 'child_process'
import { promisify } from 'util'
import config from '../config.js'
import * as proxmox from './proxmox.js'

const execFileAsync = promisify(execFile)

const SSH_OPTS = [
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'UserKnownHostsFile=/dev/null',
  '-i', '/root/.ssh/id_rsa',
]

function ssh(ip, command) {
  return execFileAsync('ssh', [...SSH_OPTS, `root@${ip}`, command], { timeout: 15000 })
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

function buildNotifyScript(managerUrl) {
  // No jq, no env vars — URL baked in, event name passed as $1
  return [
    '#!/bin/bash',
    `curl -sf -X POST '${managerUrl}/api/alerts' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d "{\\"hostname\\":\\"$(hostname)\\",\\"event\\":\\"$1\\"}" \\`,
    '  >/dev/null 2>&1 &',
    'exit 0',
  ].join('\n')
}

function buildHooksSettings() {
  const cmd = '/opt/claude-manager/notify.sh'
  return JSON.stringify({
    hooks: {
      Notification: [{
        matcher: 'permission_prompt|idle_prompt|elicitation_dialog',
        hooks: [{ type: 'command', command: `${cmd} Notification` }],
      }],
      UserPromptSubmit: [{
        hooks: [{ type: 'command', command: `${cmd} UserPromptSubmit` }],
      }],
      SubagentStart: [{
        hooks: [{ type: 'command', command: `${cmd} SubagentStart` }],
      }],
      Stop: [{
        hooks: [{ type: 'command', command: `${cmd} Stop` }],
      }],
    },
  }, null, 2)
}

export async function provisionHooks(vmid) {
  const managerUrl = config.server.managerUrl
  if (!managerUrl) {
    console.warn('[provision] server.managerUrl not set in config, skipping hook install')
    return
  }

  // Wait for container to boot and get an IP
  console.log(`[provision] waiting for container ${vmid} to get an IP...`)
  await new Promise(r => setTimeout(r, 5000))

  let ip = null
  for (let i = 0; i < 20; i++) {
    ip = await proxmox.getContainerIP(vmid).catch(() => null)
    if (ip) {
      console.log(`[provision] container ${vmid} has IP ${ip}`)
      break
    }
    await new Promise(r => setTimeout(r, 3000))
  }
  if (!ip) {
    console.error(`[provision] could not get IP for container ${vmid} after 65s`)
    return
  }

  // Wait for SSH
  if (!await waitForSSH(ip)) {
    console.error(`[provision] SSH not ready for container ${vmid} (${ip})`)
    return
  }

  try {
    // Write notify script with URL baked in
    const scriptB64 = Buffer.from(buildNotifyScript(managerUrl)).toString('base64')
    await ssh(ip, `mkdir -p /opt/claude-manager && echo '${scriptB64}' | base64 -d > /opt/claude-manager/notify.sh && chmod +x /opt/claude-manager/notify.sh`)

    // Write Claude Code hook settings
    const settingsB64 = Buffer.from(buildHooksSettings()).toString('base64')
    await ssh(ip, `mkdir -p ~/.claude && echo '${settingsB64}' | base64 -d > ~/.claude/settings.json`)

    console.log(`[provision] hooks installed on container ${vmid} (${ip})`)
  } catch (err) {
    console.error(`[provision] failed for container ${vmid}:`, err.message)
  }
}
