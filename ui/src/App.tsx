import { useState, useCallback } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import type { Session } from './types'
import { api } from './lib/api'
import { useSessions } from './hooks/useSessions'
import { Header } from './components/layout/Header'
import { MainLayout } from './components/layout/MainLayout'
import { Sidebar } from './components/layout/Sidebar'
import { TerminalPane } from './components/terminal/TerminalPane'
import { CreateSessionModal } from './components/modals/CreateSessionModal'
import { SnapshotModal } from './components/modals/SnapshotModal'
import { ConfirmDialog } from './components/modals/ConfirmDialog'
import { Scanline } from './components/ui/Scanline'

function termToast(msg: string, type: 'success' | 'error') {
  toast(
    <span className="font-mono text-xs">
      <span className={type === 'success' ? 'text-neon-green' : 'text-neon-red'}>
        {type === 'success' ? '[OK] ' : '[ERR] '}
      </span>
      {msg}
    </span>,
    {
      style: {
        background: '#141a22',
        border: '1px solid #1e2a3a',
        color: '#c5cdd8',
        borderRadius: '0',
        padding: '8px 12px',
      },
      duration: 3000,
    },
  )
}

interface ConfirmState {
  title: string
  message: string
  confirmLabel: string
  danger: boolean
  onConfirm: () => void
}

export default function App() {
  const { sessions, loading, refetch } = useSessions()
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [mobileShowTerminal, setMobileShowTerminal] = useState(false)

  const selectSession = useCallback(
    (session: Session) => {
      if (session.status !== 'running') {
        termToast('session is not running', 'error')
        return
      }
      setActiveSession(session)
      setMobileShowTerminal(true)
    },
    [],
  )

  const handleBack = useCallback(() => {
    setActiveSession(null)
    setMobileShowTerminal(false)
  }, [])

  const handleCreate = useCallback(
    async (name: string) => {
      try {
        await api.createSession(name)
        termToast(`session claude-${name} created`, 'success')
        await refetch()
      } catch (err: unknown) {
        termToast(
          err instanceof Error ? err.message : 'failed to create session',
          'error',
        )
        throw err
      }
    },
    [refetch],
  )

  const handleStop = useCallback(
    (vmid: number) => {
      setConfirm({
        title: 'stop_session',
        message: 'Stop this session?',
        confirmLabel: 'stop',
        danger: false,
        onConfirm: async () => {
          try {
            await api.stopSession(vmid)
            termToast('session stopped', 'success')
            if (activeSession?.vmid === vmid) {
              setActiveSession(null)
              setMobileShowTerminal(false)
            }
            await refetch()
          } catch {
            termToast('failed to stop session', 'error')
          }
        },
      })
    },
    [refetch, activeSession],
  )

  const handleStart = useCallback(
    async (vmid: number) => {
      try {
        await api.startSession(vmid)
        termToast('session starting...', 'success')
        setTimeout(refetch, 2000)
      } catch {
        termToast('failed to start session', 'error')
      }
    },
    [refetch],
  )

  const handleDestroy = useCallback(
    (vmid: number) => {
      setConfirm({
        title: 'destroy_session',
        message:
          'Permanently destroy this session? This cannot be undone.',
        confirmLabel: 'destroy',
        danger: true,
        onConfirm: async () => {
          try {
            await api.destroySession(vmid)
            if (activeSession?.vmid === vmid) {
              setActiveSession(null)
              setMobileShowTerminal(false)
            }
            termToast('session destroyed', 'success')
            await refetch()
          } catch {
            termToast('failed to destroy session', 'error')
          }
        },
      })
    },
    [refetch, activeSession],
  )

  const handleRollback = useCallback(
    (snapname: string) => {
      if (!activeSession) return
      setConfirm({
        title: 'rollback_snapshot',
        message: `Rollback to snapshot "${snapname}"? Current state will be lost.`,
        confirmLabel: 'rollback',
        danger: true,
        onConfirm: async () => {
          try {
            await api.rollbackSnapshot(activeSession.vmid, snapname)
            termToast(`rolled back to ${snapname}`, 'success')
            setSnapshotModalOpen(false)
          } catch {
            termToast('failed to rollback', 'error')
          }
        },
      })
    },
    [activeSession],
  )

  return (
    <>
      <Scanline />
      <Toaster position="bottom-right" />

      <Header onCreateSession={() => setCreateModalOpen(true)} />

      <MainLayout>
        <Sidebar
          sessions={sessions}
          loading={loading}
          activeVmid={activeSession?.vmid ?? null}
          onSelect={selectSession}
          onStop={handleStop}
          onStart={handleStart}
          onDestroy={handleDestroy}
          mobileHidden={mobileShowTerminal}
        />
        <TerminalPane
          session={activeSession}
          onSnapshot={() => setSnapshotModalOpen(true)}
          onBack={handleBack}
          mobileHidden={!mobileShowTerminal && activeSession !== null}
        />
      </MainLayout>

      <CreateSessionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />

      {activeSession && (
        <SnapshotModal
          open={snapshotModalOpen}
          onClose={() => setSnapshotModalOpen(false)}
          vmid={activeSession.vmid}
          onRollback={handleRollback}
          onCreated={() => termToast('snapshot created', 'success')}
        />
      )}

      {confirm && (
        <ConfirmDialog
          open={true}
          onClose={() => setConfirm(null)}
          onConfirm={confirm.onConfirm}
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
        />
      )}
    </>
  )
}
