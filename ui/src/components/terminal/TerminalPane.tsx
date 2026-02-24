import type { Session } from '../../types'
import { TerminalEmptyState } from './TerminalEmptyState'
import { TerminalToolbar } from './TerminalToolbar'
import { TerminalView } from './TerminalView'

interface TerminalPaneProps {
  session: Session | null
  onSnapshot: () => void
  onBack: () => void
  mobileHidden: boolean
}

export function TerminalPane({
  session,
  onSnapshot,
  onBack,
  mobileHidden,
}: TerminalPaneProps) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-primary ${
        mobileHidden ? 'max-sm:hidden' : ''
      }`}
    >
      {session ? (
        <>
          <TerminalToolbar
            session={session}
            onSnapshot={onSnapshot}
            onBack={onBack}
          />
          <TerminalView key={session.vmid} vmid={session.vmid} />
        </>
      ) : (
        <TerminalEmptyState />
      )}
    </div>
  )
}
