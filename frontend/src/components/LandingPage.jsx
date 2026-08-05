import { useState } from 'react'

export default function LandingPage({ onStart }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    try {
      await onStart()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const features = [
    { icon: '🤖', label: 'AI Code Generation' },
    { icon: '⚡', label: 'Live Preview' },
    { icon: '💻', label: 'Cloud Terminal' },
    { icon: '📁', label: 'File Management' },
  ]

  return (
    <div
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* ── Background orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full opacity-20"
          style={{
            width: '600px', height: '600px',
            top: '-15%', left: '-8%',
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full opacity-15"
          style={{
            width: '500px', height: '500px',
            bottom: '-15%', right: '-8%',
            background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: '300px', height: '300px',
            top: '38%', right: '18%',
            background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)',
            animation: 'float 6s ease-in-out infinite 2s',
          }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-3xl mx-auto gap-0">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-7"
          style={{
            background: 'rgba(124,58,237,0.12)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
          AI-Powered Cloud Sandbox
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl font-black leading-[1.1] tracking-tight mb-5"
          style={{ color: 'var(--text-primary)' }}
        >
          Build frontend in seconds
          <span
            className="block mt-2"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            with AI at your side
          </span>
        </h1>

        {/* Description */}
        <p
          className="text-base sm:text-lg leading-relaxed max-w-xl mb-9"
          style={{ color: 'var(--text-secondary)' }}
        >
          Spin up an instant cloud sandbox, describe what you want,
          and watch your frontend come to life — complete with a live
          preview and full terminal access.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-9">
          {features.map(f => (
            <div
              key={f.label}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          id="start-sandbox-btn"
          onClick={handleStart}
          disabled={loading}
          className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-bold text-white border-none cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:scale-105"
          style={{
            background: loading
              ? 'rgba(124,58,237,0.4)'
              : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            boxShadow: loading
              ? 'none'
              : '0 0 40px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.4)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            if (!loading) e.currentTarget.style.boxShadow = '0 0 60px rgba(124,58,237,0.75), 0 8px 30px rgba(0,0,0,0.5)'
          }}
          onMouseLeave={e => {
            if (!loading) e.currentTarget.style.boxShadow = '0 0 40px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.4)'
          }}
        >
          {loading ? (
            <>
              <svg className="spinner w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>Starting sandbox...</span>
            </>
          ) : (
            <>
              <svg className="shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Start Sandbox</span>
              <svg
                className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div
            className="mt-5 px-5 py-3 rounded-xl text-sm animate-slideIn"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Loading hint */}
        {loading && (
          <p className="mt-4 text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>
            Provisioning your cloud environment...
          </p>
        )}

        {/* Footer note */}
        <p className="mt-10 text-xs" style={{ color: 'var(--text-muted)' }}>
          Sandboxes run in isolated containers · No setup required
        </p>
      </div>
    </div>
  )
}
