import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface UseTerminalOptions {
  onInput?: () => void
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

    // Touch scrolling for mobile — attach to .xterm-screen which sits on top
    const screen = el.querySelector('.xterm-screen') as HTMLElement | null
    let touchStartY = 0
    let touchAccum = 0
    const LINE_HEIGHT = 20

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
      touchAccum = 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchStartY - e.touches[0].clientY
      touchAccum += dy
      touchStartY = e.touches[0].clientY
      const lines = Math.trunc(touchAccum / LINE_HEIGHT)
      if (lines !== 0) {
        term.scrollLines(lines)
        touchAccum -= lines * LINE_HEIGHT
      }
      e.preventDefault()
    }

    if (screen) {
      screen.addEventListener('touchstart', onTouchStart, { passive: true })
      screen.addEventListener('touchmove', onTouchMove, { passive: false })
    }

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
          ws.send(JSON.stringify({ type: 'input', data }))
          optionsRef.current?.onInput?.()
        }
      })
    })

    termRef.current = term
    fitRef.current = fit
    observerRef.current = observer

    return () => {
      disposed = true
      if (screen) {
        screen.removeEventListener('touchstart', onTouchStart)
        screen.removeEventListener('touchmove', onTouchMove)
      }
      observer.disconnect()
      if (ws) ws.close()
      term.dispose()
      termRef.current = null
      wsRef.current = null
      fitRef.current = null
      observerRef.current = null
    }
  }, [vmid, containerRef])
}
