import type { Session } from '../../types'
import { Button } from '../ui/Button'

type Tab = 'terminal' | 'browser'

interface SessionToolbarProps {
  session: Session
  activeTab: Tab
  splitMode: boolean
  onTabChange: (tab: Tab) => void
  onSplitToggle: () => void
  onSnapshot: () => void
  onBack: () => void
}

export function SessionToolbar({
  session,
  activeTab,
  splitMode,
  onTabChange,
  onSplitToggle,
  onSnapshot,
  onBack,
}: SessionToolbarProps) {
  const displayName = session.name.replace('claude-', '')

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-bg-sidebar px-4 py-2">
      <button
        className="cursor-pointer text-xs text-text-muted hover:text-text-primary sm:hidden"
        onClick={onBack}
      >
        {'<- back'}
      </button>
      <span className="truncate text-xs text-text-secondary">
        {displayName}
        <span className="ml-2 text-text-muted">vmid:{session.vmid}</span>
      </span>

      <div className="flex items-center gap-0.5 rounded border border-border">
        {(['terminal', 'browser'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`cursor-pointer px-2 py-0.5 font-mono text-[11px] transition-colors ${
              activeTab === tab
                ? 'bg-neon-green/10 text-neon-green'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <button
        onClick={onSplitToggle}
        className={`max-sm:hidden cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px] transition-colors ${
          splitMode
            ? 'border-neon-green/60 text-neon-green shadow-[0_0_4px_rgba(0,255,170,0.15)]'
            : 'border-border text-text-muted hover:text-text-primary hover:border-border-bright'
        }`}
      >
        split
      </button>

      <div className="flex-1" />
      <Button small variant="ghost" onClick={onSnapshot}>
        snapshot
      </Button>
    </div>
  )
}
