import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

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
        <div className="mb-4 flex items-center border border-border bg-bg-primary px-3 py-2 focus-within:border-neon-green/50">
          <span className="mr-2 text-neon-green text-xs">{'>'}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="api-refactor"
            pattern="[a-z0-9-]+"
            className="flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
            autoFocus
          />
          <span className="animate-blink text-neon-green text-xs">_</span>
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
