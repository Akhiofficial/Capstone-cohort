import { useState, useRef } from 'react'

export default function PreviewPanel({ previewUrl }) {
  const iframeRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setLoading(true)
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="preview-panel">
      {/* Header */}
      <div className="panel-header" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="panel-title">Preview</span>
          {/* URL bar */}
          <div className="flex-1 min-w-0 mx-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md text-xs truncate"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
                maxWidth: '320px',
              }}>
              <span className="text-green-400">●</span>
              <span className="truncate">{previewUrl}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Refresh */}
          <button onClick={handleRefresh} title="Refresh preview"
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" className={loading ? 'spinner' : ''}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
          {/* Open in new tab */}
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Open in new tab"
            className="p-1.5 rounded transition-colors block"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 top-10 flex items-center justify-center z-10"
          style={{ background: 'var(--bg-primary)' }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-t-violet-500 spinner"
              style={{ borderColor: 'rgba(124,58,237,0.2)', borderTopColor: '#7c3aed' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading preview...</p>
          </div>
        </div>
      )}

      {/* iframe */}
      <iframe
        ref={iframeRef}
        key={refreshKey}
        src={previewUrl}
        className="preview-iframe"
        title="Sandbox Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        onLoad={() => setLoading(false)}
      />
    </div>
  )
}
