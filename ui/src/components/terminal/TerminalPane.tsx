import { useEffect, useState } from 'react'
import type { Session } from '../../types'
import { BrowserView } from './BrowserView'
import { SessionToolbar } from './SessionToolbar'
import { TerminalEmptyState } from './TerminalEmptyState'
import { TerminalView } from './TerminalView'

type Tab = 'terminal' | 'browser'

interface TerminalPaneProps {
  session: Session | null
  onSnapshot: () => void
  onBack: () => void
  onInput?: () => void
  mobileHidden: boolean
}

export function TerminalPane({
  session,
  onSnapshot,
  onBack,
  onInput,
  mobileHidden,
}: TerminalPaneProps) {
  const [activeTab, setActiveTab] = useState<Tab>('terminal')
  const [splitMode, setSplitMode] = useState(false)
  const [browserPort, setBrowserPort] = useState('')

  useEffect(() => {
    setActiveTab('terminal')
    setSplitMode(false)
    setBrowserPort('')
  }, [session?.vmid])

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-primary ${
        mobileHidden ? 'max-sm:hidden' : ''
      }`}
    >
      {session ? (
        <>
          <SessionToolbar
            session={session}
            activeTab={activeTab}
            splitMode={splitMode}
            onTabChange={setActiveTab}
            onSplitToggle={() => setSplitMode((s) => !s)}
            onSnapshot={onSnapshot}
            onBack={onBack}
          />
          <div className={`flex min-h-0 flex-1 ${splitMode ? 'flex-row' : 'flex-col'}`}>
            <div
              className={`flex min-h-0 flex-col ${
                splitMode
                  ? 'flex-1 border-r border-border'
                  : activeTab === 'terminal'
                    ? 'flex-1'
                    : 'hidden'
              }`}
            >
              <TerminalView key={session.vmid} vmid={session.vmid} onInput={onInput} />
            </div>
            <div
              className={`flex min-h-0 flex-col ${
                splitMode
                  ? 'flex-1'
                  : activeTab === 'browser'
                    ? 'flex-1'
                    : 'hidden'
              }`}
            >
              <BrowserView
                ip={session.ip}
                port={browserPort}
                onPortChange={setBrowserPort}
              />
            </div>
          </div>
        </>
      ) : (
        <TerminalEmptyState />
      )}
    </div>
  )
}
