import { useRef, useState, useCallback } from 'react'
import { useTerminal } from '../../hooks/useTerminal'
import { MobileKeyBar } from './MobileKeyBar'

interface TerminalViewProps {
  vmid: number
  onInput?: () => void
}

export function TerminalView({ vmid, onInput }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const modifierRef = useRef({ ctrl: false, alt: false })
  const [modifierState, setModifierState] = useState({ ctrl: false, alt: false })

  const onModifierConsumed = useCallback(() => {
    setModifierState({ ctrl: false, alt: false })
  }, [])

  const { sendInput } = useTerminal(containerRef, vmid, {
    onInput,
    modifierRef,
    onModifierConsumed,
  })

  const toggleCtrl = useCallback(() => {
    const next = !modifierRef.current.ctrl
    modifierRef.current = { ctrl: next, alt: false }
    setModifierState({ ctrl: next, alt: false })
  }, [])

  const toggleAlt = useCallback(() => {
    const next = !modifierRef.current.alt
    modifierRef.current = { ctrl: false, alt: next }
    setModifierState({ ctrl: false, alt: next })
  }, [])

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0 max-sm:bottom-12"
        style={{ touchAction: 'pan-y' }}
      />
      <div className="absolute inset-x-0 bottom-0 sm:hidden">
        <MobileKeyBar
          ctrlActive={modifierState.ctrl}
          altActive={modifierState.alt}
          onCtrlToggle={toggleCtrl}
          onAltToggle={toggleAlt}
          sendInput={sendInput}
        />
      </div>
    </div>
  )
}
