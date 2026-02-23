import type { Session } from '../../types'
import { Button } from '../ui/Button'

interface TerminalToolbarProps {
  session: Session
  onSnapshot: () => void
  onBack: () => void
}

export function TerminalToolbar({ session, onSnapshot, onBack }: TerminalToolbarProps) {
  const displayName = session.name.replace('claude-', '')

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-bg-sidebar px-4 py-2">
      <button
        className="text-text-muted hover:text-text-primary sm:hidden cursor-pointer text-xs"
        onClick={onBack}
      >
        {'<- back'}
      </button>
      <span className="flex-1 truncate text-xs text-text-secondary">
        {displayName}
        <span className="ml-2 text-text-muted">vmid:{session.vmid}</span>
      </span>
      <Button small variant="ghost" onClick={onSnapshot}>
        snapshot
      </Button>
    </div>
  )
}
