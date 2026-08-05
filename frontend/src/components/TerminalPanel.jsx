import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

export default function TerminalPanel({ sandboxId }) {
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)

  const initTerminal = useCallback(() => {
    if (!terminalRef.current || xtermRef.current) return

    const term = new Terminal({
      theme: {
        background: '#080810',
        foreground: '#e2e0ff',
        cursor: '#7c3aed',
        cursorAccent: '#0a0a15',
        selectionBackground: 'rgba(124,58,237,0.3)',
        black: '#1a1a2e',
        red: '#ff6b6b',
        green: '#51cf66',
        yellow: '#ffd43b',
        blue: '#748ffc',
        magenta: '#cc5de8',
        cyan: '#22d3ee',
        white: '#dee2e6',
        brightBlack: '#495057',
        brightRed: '#ff8787',
        brightGreen: '#8ce99a',
        brightYellow: '#ffe066',
        brightBlue: '#91a7ff',
        brightMagenta: '#da77f2',
        brightCyan: '#66d9e8',
        brightWhite: '#f8f9fa',
      },
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      allowTransparency: true,
      scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    term.writeln('\x1b[1;35m╭─────────────────────────────────────────╮\x1b[0m')
    term.writeln('\x1b[1;35m│  \x1b[1;36mDevSandbox Terminal\x1b[1;35m                      │\x1b[0m')
    term.writeln('\x1b[1;35m│  \x1b[0;90mConnecting to sandbox container...\x1b[1;35m       │\x1b[0m')
    term.writeln('\x1b[1;35m╰─────────────────────────────────────────╯\x1b[0m')
    term.writeln('')

    return term
  }, [])

  useEffect(() => {
    if (!sandboxId || !terminalRef.current) return

    const term = initTerminal()
    if (!term) return

    let socket = null
    let cancelled = false

    // Delay connection by 300ms to let React StrictMode's first unmount-remount
    // cycle complete before we open the socket — avoids duplicate WS upgrades
    const connectTimer = setTimeout(() => {
      if (cancelled) return

      // Connect via Vite proxy: /agent/{sandboxId} → http://{sandboxId}.agent.localhost
      // This avoids the browser's inability to resolve *.agent.localhost subdomains.
      // Use polling FIRST so HTTP errors from the proxy (404/504) surface gracefully
      // instead of causing 'Invalid frame header' on the WebSocket tunnel.
      socket = io(window.location.origin, {
        path: `/agent/${sandboxId}/socket.io`,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: 3,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        setConnected(true)
        setConnecting(false)
        term.writeln('\x1b[1;32m✓ Connected to sandbox terminal\x1b[0m')
        term.writeln('')
      })

      socket.on('disconnect', () => {
        setConnected(false)
        term.writeln('\r\n\x1b[1;31m✗ Disconnected from terminal\x1b[0m')
      })

      socket.on('connect_error', (err) => {
        setConnected(false)
        setConnecting(false)
        term.writeln(`\r\n\x1b[1;31m✗ Connection error: ${err.message}\x1b[0m`)
      })

      // Receive terminal output
      socket.on('terminal-output', (data) => {
        if (typeof data === 'string') {
          term.write(data)
        } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
          term.write(new Uint8Array(data))
        }
      })

      // Send terminal input — event name MUST match agent server: 'terminal-input'
      term.onData((data) => {
        if (socket?.connected) {
          socket.emit('terminal-input', data)
        }
      })
    }, 300)

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddonRef.current?.fit()
    })
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current)
    }

    return () => {
      cancelled = true
      clearTimeout(connectTimer)
      resizeObserver.disconnect()
      socket?.disconnect()
      term.dispose()
      xtermRef.current = null
    }
  }, [sandboxId, initTerminal])

  const handleClear = () => {
    xtermRef.current?.clear()
  }

  const handleCopy = () => {
    const selection = xtermRef.current?.getSelection()
    if (selection) navigator.clipboard.writeText(selection)
  }

  return (
    <div className="terminal-panel" style={{ background: '#080810' }}>
      {/* Panel Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ color: 'var(--text-muted)' }}>
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          <span className="panel-title ml-1">Terminal</span>
          <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-muted)',
              fontSize: '10px',
            }}>
            {sandboxId?.slice(0, 8)}...
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <div className={`status-dot ${connecting ? 'loading' : connected ? 'online' : 'offline'}`} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {connecting ? 'Connecting' : connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {/* Actions */}
          <button onClick={handleCopy} title="Copy selection"
            className="px-2 py-1 rounded text-xs transition-colors"
            style={{ color: 'var(--text-muted)', background: 'transparent' }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>
            Copy
          </button>
          <button onClick={handleClear} title="Clear terminal"
            className="px-2 py-1 rounded text-xs transition-colors"
            style={{ color: 'var(--text-muted)', background: 'transparent' }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>
            Clear
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div className="terminal-content" ref={terminalRef} style={{ background: '#080810', flex: 1, minHeight: 0 }} />
    </div>
  )
}
