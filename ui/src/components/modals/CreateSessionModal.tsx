import { useState, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

function TerminalInput({
  value,
  onChange,
  placeholder,
  pattern,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  pattern?: string
  autoFocus?: boolean
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className="flex items-center border border-border bg-bg-primary px-3 py-2 focus-within:border-neon-green/50"
      onClick={() => wrapperRef.current?.querySelector('input')?.focus()}
    >
      <span className="mr-2 shrink-0 text-xs text-neon-green">{'>'}</span>
      <div ref={wrapperRef} className="relative min-w-0 flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          pattern={pattern}
          className="w-full bg-transparent text-xs text-text-primary caret-transparent outline-none placeholder:text-text-muted"
          autoFocus={autoFocus}
        />
        {/* Invisible sizer + visible blinking cursor positioned after text */}
        <div className="pointer-events-none absolute inset-0 flex items-center text-xs">
          <span className="invisible whitespace-pre">{value || ''}</span>
          <span className="animate-blink text-neon-green">_</span>
        </div>
      </div>
    </div>
  )
}

interface CreateSessionModalProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<void>
}

export function CreateSessionModal({ open, onClose, onCreate }: CreateSessionModalProps) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setCreating(true)
    try {
      await onCreate(trimmed)
      setName('')
      onClose()
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="new_session">
      <form onSubmit={handleSubmit}>
        <label className="mb-1 block text-[11px] text-text-secondary">
          session name
        </label>
        <div className="mb-2">
          <TerminalInput
            value={name}
            onChange={setName}
            placeholder="api-refactor"
            pattern="[a-z0-9\-]+"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            cancel
          </Button>
          <Button type="submit" variant="primary" disabled={creating || !name.trim()}>
            {creating ? 'creating...' : '[create]'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
