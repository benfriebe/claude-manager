import { useState, useEffect, useCallback } from 'react'

export function useAlerts() {
  const [alertVmids, setAlertVmids] = useState<Set<number>>(new Set())

  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${location.host}/alerts`)

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'bell') {
        setAlertVmids((prev) => {
          if (prev.has(msg.vmid)) return prev
          const next = new Set(prev)
          next.add(msg.vmid)
          return next
        })
      }
    }

    return () => ws.close()
  }, [])

  const clearAlert = useCallback((vmid: number) => {
    setAlertVmids((prev) => {
      if (!prev.has(vmid)) return prev
      const next = new Set(prev)
      next.delete(vmid)
      return next
    })
  }, [])

  return { alertVmids, clearAlert }
}
