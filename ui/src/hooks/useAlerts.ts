import { useState, useEffect, useCallback, useRef } from 'react'

export function useAlerts() {
  const [alertVmids, setAlertVmids] = useState<Set<number>>(new Set())
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let disposed = false
    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect() {
      if (disposed) return

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${location.host}/alerts`)
      wsRef.current = ws

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

      ws.onclose = () => {
        wsRef.current = null
        if (!disposed) {
          reconnectTimer = setTimeout(connect, 3000)
        }
      }
    }

    connect()

    return () => {
      disposed = true
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
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
