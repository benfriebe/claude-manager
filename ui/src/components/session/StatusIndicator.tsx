interface StatusIndicatorProps {
  status: 'running' | 'stopped'
  alerting?: boolean
}

export function StatusIndicator({ status, alerting }: StatusIndicatorProps) {
  if (status === 'running') {
    const color = alerting ? 'bg-neon-blue' : 'bg-neon-green'
    const glow = alerting
      ? 'shadow-[0_0_6px_var(--color-neon-blue)]'
      : 'shadow-[0_0_6px_var(--color-neon-green)]'

    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={`absolute inline-flex h-full w-full animate-ping-slow rounded-full ${color} opacity-75`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${color} ${glow}`} />
      </span>
    )
  }

  return <span className="h-2 w-2 shrink-0 rounded-full bg-text-muted" />
}
