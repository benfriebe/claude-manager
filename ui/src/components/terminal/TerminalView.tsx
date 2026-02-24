import { useRef } from 'react'
import { useTerminal } from '../../hooks/useTerminal'

interface TerminalViewProps {
  vmid: number
  onInput?: () => void
}

export function TerminalView({ vmid, onInput }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useTerminal(containerRef, vmid, { onInput })

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  )
}
