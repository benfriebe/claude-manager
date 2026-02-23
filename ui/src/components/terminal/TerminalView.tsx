import { useRef } from 'react'
import { useTerminal } from '../../hooks/useTerminal'

interface TerminalViewProps {
  vmid: number
}

export function TerminalView({ vmid }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useTerminal(containerRef, vmid)

  return <div ref={containerRef} className="flex-1 overflow-hidden" />
}
