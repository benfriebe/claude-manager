import type { SessionActivity } from '../../hooks/useAlerts'

interface StatusIndicatorProps {
  status: 'running' | 'stopped'
  activity?: SessionActivity
}

export function StatusIndicator({ status, activity }: StatusIndicatorProps) {
  if (status !== 'running') {
    return <span className="h-2 w-2 shrink-0 rounded-full bg-text-muted" />
  }

  if (activity === 'needs_input') {
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-neon-blue opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-blue shadow-[0_0_6px_var(--color-neon-blue)]" />
      </span>
    )
  }

  if (activity === 'active') {
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-neon-amber opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-amber shadow-[0_0_6px_var(--color-neon-amber)]" />
      </span>
    )
  }

  // Idle — static green with glow
  return (
    <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-neon-green shadow-[0_0_6px_var(--color-neon-green)]" />
  )
}
