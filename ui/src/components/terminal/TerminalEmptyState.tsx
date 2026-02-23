export function TerminalEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-text-muted">
      <pre className="text-[10px] leading-tight text-text-muted/50">
{`  ┌──────────────────────┐
  │  ╭─────────────────╮  │
  │  │ $ _              │  │
  │  │                  │  │
  │  │                  │  │
  │  ╰─────────────────╯  │
  │     ┌──────────┐      │
  └─────┤          ├──────┘
        └──────────┘`}
      </pre>
      <p className="text-xs">select a running session to open terminal</p>
    </div>
  )
}
