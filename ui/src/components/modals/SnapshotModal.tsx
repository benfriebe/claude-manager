import { useState, useEffect } from 'react'
import type { Snapshot } from '../../types'
import { api } from '../../lib/api'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface SnapshotModalProps {
  open: boolean
  onClose: () => void
  vmid: number
  onRollback: (snapname: string) => void
  onCreated: () => void
}

export function SnapshotModal({
  open,
  onClose,
  vmid,
  onRollback,
  onCreated,
}: SnapshotModalProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (open) loadSnapshots()
  }, [open, vmid])

  async function loadSnapshots() {
    try {
      const snaps = await api.getSnapshots(vmid)
      setSnapshots(snaps)
    } catch {
      // ignore
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      await api.createSnapshot(vmid, name.trim(), description.trim())
      setName('')
      setDescription('')
      onCreated()
      await loadSnapshots()
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="snapshots">
      <form onSubmit={handleCreate} className="mb-4">
        <label className="mb-1 block text-[11px] text-text-secondary">
          snapshot name
        </label>
        <div className="mb-2 flex items-baseline border border-border bg-bg-primary px-3 py-2 focus-within:border-neon-green/50">
          <span className="shrink-0 mr-2 text-neon-green text-xs">{'>'}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="pre-refactor"
            size={1}
            className="w-0 min-w-0 flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>

        <label className="mb-1 block text-[11px] text-text-secondary">
          description (optional)
        </label>
        <div className="mb-3 flex items-baseline border border-border bg-bg-primary px-3 py-2 focus-within:border-neon-green/50">
          <span className="shrink-0 mr-2 text-neon-green text-xs">{'>'}</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="before major changes"
            size={1}
            className="w-0 min-w-0 flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          small
          disabled={creating || !name.trim()}
        >
          {creating ? 'creating...' : '[create_snapshot]'}
        </Button>
      </form>

      <div className="border-t border-border pt-3">
        <div className="mb-2 text-[11px] text-text-secondary">existing snapshots</div>
        {snapshots.length === 0 ? (
          <div className="text-[11px] text-text-muted">no snapshots</div>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {snapshots.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between border border-border bg-bg-primary px-3 py-2"
              >
                <div>
                  <div className="text-xs text-text-primary">{s.name}</div>
                  {s.description && (
                    <div className="text-[10px] text-text-muted">
                      {s.description}
                    </div>
                  )}
                </div>
                <Button
                  small
                  variant="ghost"
                  onClick={() => onRollback(s.name)}
                >
                  restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          close
        </Button>
      </div>
    </Modal>
  )
}
