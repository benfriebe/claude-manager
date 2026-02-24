import type { Session } from '../../types'
import { SessionList } from '../session/SessionList'

interface SidebarProps {
  sessions: Session[]
  loading: boolean
  activeVmid: number | null
  alertVmids: Set<number>
  onSelect: (session: Session) => void
  onStop: (vmid: number) => void
  onStart: (vmid: number) => void
  onDestroy: (vmid: number) => void
  mobileHidden: boolean
}

export function Sidebar({
  sessions,
  loading,
  activeVmid,
  alertVmids,
  onSelect,
  onStop,
  onStart,
  onDestroy,
  mobileHidden,
}: SidebarProps) {
  return (
    <div
      className={`flex w-70 shrink-0 flex-col overflow-hidden border-r border-border bg-bg-sidebar max-sm:w-full ${
        mobileHidden ? 'max-sm:hidden' : ''
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
        <span>sessions</span>
        <span className="text-text-muted">{sessions.length}</span>
      </div>
      <SessionList
        sessions={sessions}
        loading={loading}
        activeVmid={activeVmid}
        alertVmids={alertVmids}
        onSelect={onSelect}
        onStop={onStop}
        onStart={onStart}
        onDestroy={onDestroy}
      />
    </div>
  )
}
