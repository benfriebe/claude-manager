interface StatusIndicatorProps {
  status: 'running' | 'stopped'
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  if (status === 'running') {
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-neon-green opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-green shadow-[0_0_6px_var(--color-neon-green)]" />
      </span>
    )
  }

  return <span className="h-2 w-2 shrink-0 rounded-full bg-text-muted" />
}
