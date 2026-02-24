import { useState, useEffect, useCallback, useRef } from 'react'

export type SessionActivity = 'active' | 'needs_input'

export function useAlerts() {
  const [sessionStates, setSessionStates] = useState<Map<number, SessionActivity>>(new Map())
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
        if (msg.type === 'state') {
          setSessionStates((prev) => {
            const next = new Map(prev)
            if (msg.state === 'idle') {
              next.delete(msg.vmid)
            } else {
              next.set(msg.vmid, msg.state as SessionActivity)
            }
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

  // Clear needs_input (user is responding) — transitions to active
  const clearAlert = useCallback((vmid: number) => {
    setSessionStates((prev) => {
      if (prev.get(vmid) !== 'needs_input') return prev
      const next = new Map(prev)
      next.set(vmid, 'active')
      return next
    })
  }, [])

  return { sessionStates, clearAlert }
}
