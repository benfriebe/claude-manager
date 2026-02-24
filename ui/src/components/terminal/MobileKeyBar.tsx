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

  const btn =
    'rounded border border-border bg-bg-sidebar px-3 py-1.5 font-mono text-xs text-text-secondary active:bg-white/10'

  const stickyClass = (active: boolean) =>
    active
      ? 'rounded border border-border px-3 py-1.5 font-mono text-xs active:bg-white/10 bg-[#00ff9f]/20 text-[#00ff9f] shadow-[0_0_6px_#00ff9f80]'
      : btn

  return (
    <div className="flex items-center gap-1.5 border-t border-border bg-bg-sidebar px-2.5 py-2">
      <button className={btn} onTouchStart={tap('\x1b')} onMouseDown={prevent}>
        Esc
      </button>
      <button className={btn} onTouchStart={tap('\t')} onMouseDown={prevent}>
        Tab
      </button>
      <button
        className={stickyClass(ctrlActive)}
        onTouchStart={(e) => { e.preventDefault(); onCtrlToggle() }}
        onMouseDown={prevent}
      >
        Ctrl
      </button>
      <button
        className={stickyClass(altActive)}
        onTouchStart={(e) => { e.preventDefault(); onAltToggle() }}
        onMouseDown={prevent}
      >
        Alt
      </button>
      <div className="mx-0.5 h-5 w-px bg-border" />
      <button className={btn} onTouchStart={tap('\x1b[D')} onMouseDown={prevent}>
        ←
      </button>
      <button className={btn} onTouchStart={tap('\x1b[B')} onMouseDown={prevent}>
        ↓
      </button>
      <button className={btn} onTouchStart={tap('\x1b[A')} onMouseDown={prevent}>
        ↑
      </button>
      <button className={btn} onTouchStart={tap('\x1b[C')} onMouseDown={prevent}>
        →
      </button>
      <div className="mx-0.5 h-5 w-px bg-border" />
      <button className={btn} onTouchStart={tap('\r')} onMouseDown={prevent}>
        Enter
      </button>
    </div>
  )
}
