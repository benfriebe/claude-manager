import type { Session } from '../../types'
import type { SessionActivity } from '../../hooks/useAlerts'
import { cn } from '../../lib/cn'
import { StatusIndicator } from './StatusIndicator'
import { Button } from '../ui/Button'

interface SessionCardProps {
  session: Session
  active: boolean
  activity?: SessionActivity
  onSelect: (session: Session) => void
  onStop: (vmid: number) => void
  onStart: (vmid: number) => void
  onDestroy: (vmid: number) => void
}

export function SessionCard({
  session,
  active,
  activity,
  onSelect,
  onStop,
  onStart,
  onDestroy,
}: SessionCardProps) {
  const displayName = session.name.replace('claude-', '')

  return (
    <div
      className={cn(
        'group relative cursor-pointer border-l-2 border-transparent px-4 py-3 transition-all duration-150 hover:bg-bg-hover',
        active && 'border-l-neon-green bg-bg-hover',
      )}
      onClick={() => onSelect(session)}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="truncate text-xs font-medium text-text-primary">
          {displayName}
        </span>
        <StatusIndicator status={session.status} activity={activity} />
      </div>

      <div className="flex gap-2 text-[10px] text-text-muted">
        <span>vmid:{session.vmid}</span>
        {session.ip && <span>{session.ip}</span>}
        {session.mem > 0 && (
          <span>{Math.round(session.mem / 1024 / 1024)}MB</span>
        )}
      </div>

      <div className="mt-2 flex gap-1">
        {session.status === 'running' ? (
          <Button
            small
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onStop(session.vmid)
            }}
          >
            stop
          </Button>
        ) : (
          <Button
            small
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onStart(session.vmid)
            }}
          >
            start
          </Button>
        )}
        <Button
          small
          variant="danger"
          onClick={(e) => {
            e.stopPropagation()
            onDestroy(session.vmid)
          }}
        >
          destroy
        </Button>
      </div>
    </div>
  )
}
