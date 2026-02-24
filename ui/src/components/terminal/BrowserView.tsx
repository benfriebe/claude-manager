import { useState } from 'react'

interface BrowserViewProps {
  ip: string | null
  port: string
  onPortChange: (port: string) => void
}

export function BrowserView({ ip, port, onPortChange }: BrowserViewProps) {
  const [draft, setDraft] = useState(port)
  const [committed, setCommitted] = useState(port)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return
    onPortChange(draft)
    setCommitted(draft)
  }

  if (!ip) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-text-muted">
        no IP available
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
        <label className="text-xs text-text-muted">port</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '')
            setDraft(v)
          }}
          placeholder="8080"
          className="w-20 border border-border bg-bg-primary px-2 py-0.5 font-mono text-xs text-text-primary outline-none focus:border-neon-green/60"
        />
        <button
          type="submit"
          className="cursor-pointer border border-border px-2 py-0.5 font-mono text-xs text-text-secondary transition-colors hover:border-neon-green/60 hover:text-neon-green"
        >
          go
        </button>
      </form>
      {committed ? (
        <iframe
          src={`http://${ip}:${committed}`}
          className="min-h-0 flex-1 border-none bg-white"
          title="Container browser"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-xs text-text-muted">
          enter a port and press go
        </div>
      )}
    </div>
  )
}
