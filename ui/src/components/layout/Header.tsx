import { Button } from '../ui/Button'

interface HeaderProps {
  onCreateSession: () => void
}

export function Header({ onCreateSession }: HeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border bg-bg-sidebar px-2 py-2">
      <div className="flex items-center gap-2">
        <span className="text-neon-green text-lg leading-none">&#x2B21;</span>
        <h1 className="text-sm font-semibold text-text-primary">
          claude_agent_manager
        </h1>
      </div>
      <Button variant="primary" onClick={onCreateSession}>
        [+ new_session]
      </Button>
    </header>
  )
}
