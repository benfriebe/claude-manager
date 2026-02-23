import type { Session } from '../../types'
import { SessionCard } from './SessionCard'

interface SessionListProps {
  sessions: Session[]
  loading: boolean
  activeVmid: number | null
  onSelect: (session: Session) => void
  onStop: (vmid: number) => void
  onStart: (vmid: number) => void
  onDestroy: (vmid: number) => void
}

export function SessionList({
  sessions,
  loading,
  activeVmid,
  onSelect,
  onStop,
  onStart,
  onDestroy,
}: SessionListProps) {
  if (loading) {
    return (
      <div className="flex-1 px-4 py-6 text-center text-xs text-text-muted">
        loading...
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="flex-1 px-4 py-6 text-center text-xs text-text-muted">
        no sessions
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {sessions.map((s) => (
        <SessionCard
          key={s.vmid}
          session={s}
          active={activeVmid === s.vmid}
          onSelect={onSelect}
          onStop={onStop}
          onStart={onStart}
          onDestroy={onDestroy}
        />
      ))}
    </div>
  )
}
