import { useState, useRef, useCallback } from 'react'
import ChatPanel from './ChatPanel'
import PreviewPanel from './PreviewPanel'
import TerminalPanel from './TerminalPanel'

const MIN_TERMINAL_HEIGHT = 120
const MAX_TERMINAL_HEIGHT = 600
const DEFAULT_TERMINAL_HEIGHT = 280

export default function WorkspaceLayout({ sandboxId, previewUrl, onReset }) {
  const [terminalHeight, setTerminalHeight] = useState(DEFAULT_TERMINAL_HEIGHT)
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(DEFAULT_TERMINAL_HEIGHT)

  const handleResizeStart = useCallback((e) => {
    isDragging.current = true
    dragStartY.current = e.clientY
    dragStartHeight.current = terminalHeight

    const onMouseMove = (e) => {
      if (!isDragging.current) return
      const delta = dragStartY.current - e.clientY
      const newHeight = Math.max(MIN_TERMINAL_HEIGHT,
        Math.min(MAX_TERMINAL_HEIGHT, dragStartHeight.current + delta))
      setTerminalHeight(newHeight)
    }

    const onMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }, [terminalHeight])

  return (
    <div className="workspace-root">
      {/* Header */}
      <div className="workspace-header">
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>DevSandbox</span>
          </div>
          <div className="w-px h-4" style={{ background: 'var(--border)' }} />
          {/* Sandbox ID badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
            style={{
              background: 'rgba(6,182,212,0.08)',
              border: '1px solid rgba(6,182,212,0.2)',
              color: 'var(--accent-cyan)',
              fontFamily: 'monospace',
            }}>
            <div className="status-dot online" />
            <span>{sandboxId?.slice(0, 8)}...{sandboxId?.slice(-4)}</span>
          </div>
        </div>

        {/* Center - tab bar style */}
        <div className="hidden md:flex items-center gap-1 px-1 py-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          {[
            { label: 'Chat', icon: '💬' },
            { label: 'Preview', icon: '🌐' },
            { label: 'Terminal', icon: '💻' },
          ].map(t => (
            <div key={t.label} className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </div>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open Preview
          </a>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            Destroy
          </button>
        </div>
      </div>

      {/* Body — 3-panel layout */}
      <div className="workspace-body">
        {/* Left: Chat */}
        <ChatPanel sandboxId={sandboxId} />

        {/* Right: Preview + Terminal */}
        <div className="right-column">
          {/* Preview fills remaining height */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <PreviewPanel previewUrl={previewUrl} />
          </div>

          {/* Resize handle */}
          <div
            className="resize-handle"
            onMouseDown={handleResizeStart}
            title="Drag to resize terminal"
            style={{
              height: '5px',
              cursor: 'row-resize',
              background: 'var(--border)',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#7c3aed'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--border)'}
          />

          {/* Terminal with dynamic height */}
          <div style={{ height: `${terminalHeight}px`, flexShrink: 0, overflow: 'hidden' }}>
            <TerminalPanel sandboxId={sandboxId} />
          </div>
        </div>
      </div>
    </div>
  )
}
