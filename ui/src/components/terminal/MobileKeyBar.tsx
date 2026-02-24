interface MobileKeyBarProps {
  ctrlActive: boolean
  altActive: boolean
  onCtrlToggle: () => void
  onAltToggle: () => void
  sendInput: (data: string) => void
}

export function MobileKeyBar({
  ctrlActive,
  altActive,
  onCtrlToggle,
  onAltToggle,
  sendInput,
}: MobileKeyBarProps) {
  const prevent = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
  }

  const tap = (data: string) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    sendInput(data)
  }

  const stickyClass = (active: boolean) =>
    active
      ? 'bg-[#00ff9f]/20 text-[#00ff9f] shadow-[0_0_6px_#00ff9f80]'
      : 'bg-bg-sidebar text-text-secondary'

  return (
    <div className="flex items-center gap-1 border-t border-border bg-bg-sidebar px-2 py-1.5">
      <button
        className="rounded border border-border bg-bg-sidebar px-2 py-1 font-mono text-[11px] text-text-secondary active:bg-white/10"
        onTouchStart={tap('\x1b')}
        onMouseDown={prevent}
      >
        Esc
      </button>
      <button
        className="rounded border border-border bg-bg-sidebar px-2 py-1 font-mono text-[11px] text-text-secondary active:bg-white/10"
        onTouchStart={tap('\t')}
        onMouseDown={prevent}
      >
        Tab
      </button>
      <button
        className={`rounded border border-border px-2 py-1 font-mono text-[11px] active:bg-white/10 ${stickyClass(ctrlActive)}`}
        onTouchStart={(e) => {
          e.preventDefault()
          onCtrlToggle()
        }}
        onMouseDown={prevent}
      >
        Ctrl
      </button>
      <button
        className={`rounded border border-border px-2 py-1 font-mono text-[11px] active:bg-white/10 ${stickyClass(altActive)}`}
        onTouchStart={(e) => {
          e.preventDefault()
          onAltToggle()
        }}
        onMouseDown={prevent}
      >
        Alt
      </button>
      <div className="mx-1 h-4 w-px bg-border" />
      <button
        className="rounded border border-border bg-bg-sidebar px-2 py-1 font-mono text-[11px] text-text-secondary active:bg-white/10"
        onTouchStart={tap('\x1b[D')}
        onMouseDown={prevent}
      >
        ←
      </button>
      <button
        className="rounded border border-border bg-bg-sidebar px-2 py-1 font-mono text-[11px] text-text-secondary active:bg-white/10"
        onTouchStart={tap('\x1b[B')}
        onMouseDown={prevent}
      >
        ↓
      </button>
      <button
        className="rounded border border-border bg-bg-sidebar px-2 py-1 font-mono text-[11px] text-text-secondary active:bg-white/10"
        onTouchStart={tap('\x1b[A')}
        onMouseDown={prevent}
      >
        ↑
      </button>
      <button
        className="rounded border border-border bg-bg-sidebar px-2 py-1 font-mono text-[11px] text-text-secondary active:bg-white/10"
        onTouchStart={tap('\x1b[C')}
        onMouseDown={prevent}
      >
        →
      </button>
    </div>
  )
}
