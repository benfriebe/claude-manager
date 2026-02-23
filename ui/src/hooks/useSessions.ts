import { useState, useEffect, useCallback } from 'react'
import type { Session } from '../types'
import { api } from '../lib/api'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const data = await api.getSessions()
      setSessions(data)
    } catch {
      // silently fail on poll errors
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    const interval = setInterval(refetch, 15000)
    return () => clearInterval(interval)
  }, [refetch])

  return { sessions, loading, refetch }
}
