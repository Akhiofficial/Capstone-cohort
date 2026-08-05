import { useEffect, useRef, useState } from 'react'
import { useAIChat } from '../hooks/useAIChat'

function MessageBubble({ msg }) {
  const isUser = msg.type === 'user'
  const isStatus = msg.type === 'status'

  if (isStatus) {
    return (
      <div className="chat-bubble status flex items-start gap-2 animate-slideIn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" className="mt-0.5 flex-shrink-0">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>{msg.content}</span>
      </div>
    )
  }

  return (
    <div className={`chat-bubble ${isUser ? 'user' : 'ai'}`}>
      <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
      <div className="flex items-center justify-end mt-1.5">
        <span style={{ fontSize: '10px', opacity: 0.5 }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="chat-bubble ai flex items-center gap-1.5" style={{ padding: '12px 16px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="w-2 h-2 rounded-full"
          style={{
            background: 'var(--text-secondary)',
            animation: `pulseGlow 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
      ))}
    </div>
  )
}

export default function ChatPanel({ sandboxId }) {
  const { messages, isStreaming, streamingStatus, sendMessage, clearMessages } = useAIChat(sandboxId)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestions = [
    'Create a dark landing page with a hero section',
    'Make a counter app with animations',
    'Build a todo list with local storage',
    'Add a navigation bar with smooth scroll',
  ]

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <span className="panel-title">AI Assistant</span>
          {isStreaming && (
            <div className="flex items-center gap-1.5 ml-1">
              <div className="status-dot loading" />
              <span className="text-xs" style={{ color: '#f59e0b', fontSize: '10px' }}>Generating...</span>
            </div>
          )}
        </div>
        <button onClick={clearMessages} title="Clear chat"
          className="p-1.5 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isStreaming && <TypingIndicator />}

        {/* Status indicator */}
        {isStreaming && streamingStatus && (
          <div className="text-xs px-3 py-1.5 rounded-lg animate-pulse"
            style={{
              background: 'rgba(6,182,212,0.06)',
              border: '1px solid rgba(6,182,212,0.15)',
              color: 'var(--accent-cyan)',
              fontFamily: 'monospace',
            }}>
            ⚙ {streamingStatus}
          </div>
        )}

        {/* Suggestions (show when only welcome message) */}
        {messages.length === 1 && !isStreaming && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Try asking:</p>
            {suggestions.map(s => (
              <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }}
                className="text-left px-3 py-2.5 rounded-xl text-xs transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'
                  e.currentTarget.style.background = 'rgba(124,58,237,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}>
                💡 {s}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="relative flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-strong)',
          }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={isStreaming ? 'AI is working...' : 'Describe what you want to build...'}
            rows={3}
            className="w-full px-4 pt-3 pb-1 text-sm resize-none outline-none bg-transparent"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif',
              caretColor: '#7c3aed',
            }}
          />
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isStreaming ? '✨ Generating your code...' : 'Enter ↵ to send · Shift+Enter for newline'}
            </span>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: input.trim() && !isStreaming
                  ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                  : 'rgba(255,255,255,0.1)',
                boxShadow: input.trim() && !isStreaming ? '0 0 16px rgba(124,58,237,0.4)' : 'none',
              }}>
              {isStreaming ? (
                <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white"
                  strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
