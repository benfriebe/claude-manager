import { useCallback, useRef } from 'react'
import { useTerminal } from '../../hooks/useTerminal'

interface TerminalViewProps {
  vmid: number
  onInput?: () => void
}

export function TerminalView({ vmid, onInput }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { termRef } = useTerminal(containerRef, vmid, { onInput })

  const touchY = useRef(0)
  const touchAccum = useRef(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchY.current = e.touches[0].clientY
    touchAccum.current = 0
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const term = termRef.current
    if (!term) return
    const dy = touchY.current - e.touches[0].clientY
    touchAccum.current += dy
    touchY.current = e.touches[0].clientY
    const lines = Math.trunc(touchAccum.current / 20)
    if (lines !== 0) {
      term.scrollLines(lines)
      touchAccum.current -= lines * 20
    }
    e.preventDefault()
  }, [termRef])

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
      <div
        className="absolute inset-0 sm:hidden"
        style={{ touchAction: 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      />
    </div>
  )
}
