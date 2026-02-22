export default {
    proxmox: {
      host: '192.168.2.1',      // or 100.x.x.x Tailscale IP
      port: 8006,
      tokenId: 'claude-ui@pve!webui',
      tokenSecret: 'your-token-secret',
      node: 'pve',                   // your node name
      templateId: 200,               // your Claude template VMID
      storagePool: 'local-lvm',
    },
    server: {
      port: 3000,
      sessionSecret: 'change-this-to-something-random',
    }
  }