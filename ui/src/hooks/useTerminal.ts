import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface ModifierState {
  ctrl: boolean
  alt: boolean
}

interface UseTerminalOptions {
  onInput?: () => void
  modifierRef?: React.RefObject<ModifierState>
  onModifierConsumed?: () => void
}

export function useTerminal(
  containerRef: React.RefObject<HTMLDivElement | null>,
  vmid: number | null,
  options?: UseTerminalOptions,
) {
  const termRef = useRef<Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const el = containerRef.current
    if (!el || !vmid) return

    let disposed = false
    let ws: WebSocket | null = null

    const term = new Terminal({
      theme: {
        background: '#0a0e14',
        foreground: '#c5cdd8',
        cursor: '#00ff9f',
        selectionBackground: '#1e2a3a',
        black: '#0a0e14',
        brightBlack: '#3e5068',
        white: '#c5cdd8',
        brightWhite: '#ffffff',
        green: '#00ff9f',
        brightGreen: '#00ff9f',
        cyan: '#00e5ff',
        brightCyan: '#00e5ff',
        red: '#ff3d5a',
        brightRed: '#ff3d5a',
        yellow: '#ffb300',
        brightYellow: '#ffb300',
        blue: '#5c8fff',
        brightBlue: '#5c8fff',
        magenta: '#bf5af2',
        brightMagenta: '#bf5af2',
      },
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      cursorBlink: true,
      scrollback: 5000,
      allowTransparency: true,
    })

    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(el)

    // Mobile touch scrolling workaround
    // xterm.js's internal Gesture system intercepts touch events but its
    // viewport scroll handling is broken in v6. Since wheel events work fine,
    // we intercept touches in the capture phase (before xterm's handlers)
    // and re-dispatch them as synthetic wheel events.
    // See: https://github.com/xtermjs/xterm.js/issues/5377
    // See: https://github.com/xtermjs/xterm.js/pull/5685
    const viewport = el.querySelector('.xterm-viewport') as HTMLElement | null
    let lastTouchY = 0
    let isTouchScrolling = false

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        lastTouchY = e.touches[0].clientY
        isTouchScrolling = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchScrolling || e.touches.length !== 1) return
      const currentY = e.touches[0].clientY
      const deltaY = lastTouchY - currentY
      lastTouchY = currentY

      if (deltaY !== 0 && viewport) {
        viewport.dispatchEvent(new WheelEvent('wheel', {
          deltaY,
          deltaMode: 0, // pixels
          bubbles: true,
          cancelable: true,
        }))
      }

      e.preventDefault()
      e.stopPropagation()
    }

    const handleTouchEnd = () => {
      isTouchScrolling = false
    }

    // Use capture phase to intercept before xterm's internal Gesture system
    el.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true })
    el.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false })
    el.addEventListener('touchend', handleTouchEnd, { capture: true, passive: true })

    const observer = new ResizeObserver(() => {
      fit.fit()
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
      }
    })
    observer.observe(el)

    // Defer initial fit + WebSocket connection until browser layout is complete
    requestAnimationFrame(() => {
      if (disposed) return
      fit.fit()

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
      ws = new WebSocket(`${protocol}//${location.host}/terminal?vmid=${vmid}`)
      wsRef.current = ws

      ws.onopen = () => {
        ws!.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
      }

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        if (msg.type === 'output') term.write(msg.data)
      }

      ws.onclose = () => {
        term.write('\r\n\x1b[33m[connection closed]\x1b[0m\r\n')
      }

      term.onData((data) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          const mod = optionsRef.current?.modifierRef?.current
          let transformed = data
          if (mod && (mod.ctrl || mod.alt) && data.length === 1) {
            if (mod.ctrl) {
              const code = data.toLowerCase().charCodeAt(0)
              if (code >= 97 && code <= 122) {
                transformed = String.fromCharCode(code - 96)
              }
            } else if (mod.alt) {
              transformed = '\x1b' + data
            }
            mod.ctrl = false
            mod.alt = false
            optionsRef.current?.onModifierConsumed?.()
          }
          ws.send(JSON.stringify({ type: 'input', data: transformed }))
          optionsRef.current?.onInput?.()
        }
      })
    })

    termRef.current = term
    fitRef.current = fit
    observerRef.current = observer

    return () => {
      disposed = true
      el.removeEventListener('touchstart', handleTouchStart, { capture: true })
      el.removeEventListener('touchmove', handleTouchMove, { capture: true })
      el.removeEventListener('touchend', handleTouchEnd, { capture: true })
      observer.disconnect()
      if (ws) ws.close()
      term.dispose()
      termRef.current = null
      wsRef.current = null
      fitRef.current = null
      observerRef.current = null
    }
  }, [vmid, containerRef])

  const sendInput = (data: string) => {
    termRef.current?.input(data)
  }

  return { sendInput }
}
