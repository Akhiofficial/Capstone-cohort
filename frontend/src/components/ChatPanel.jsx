import { useEffect, useRef, useState } from 'react';
import { useAIChat } from '../hooks/useAIChat';
import { Send, Paperclip, Mic, StopCircle, RefreshCw, Play } from 'lucide-react';

function MessageBubble({ msg, onOpenFile }) {
  const isUser = msg.type === 'user';
  const isStatus = msg.type === 'status';

  if (isStatus) {
    // If it's a file update status, make it look like a card
    if (msg.content.includes('Updating files') || msg.content.includes('updated')) {
      return (
        <div className="my-3 p-3 rounded-xl bg-[rgba(124,58,237,0.05)] border border-[rgba(124,58,237,0.15)] animate-slideIn">
          <div className="flex items-center gap-2 mb-2 text-sm text-[var(--accent-cyan)]">
            <RefreshCw size={14} className="animate-spin" />
            <span className="font-medium">AI updated project files</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-3 opacity-80 font-mono line-clamp-2">
            {msg.content}
          </p>
        </div>
      );
    }

    return (
      <div className="chat-bubble status flex items-start gap-2 animate-slideIn opacity-70">
        <Play size={12} className="mt-0.5 flex-shrink-0 text-[var(--text-muted)]" />
        <span className="font-mono text-[11px]">{msg.content}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4 animate-slideIn`}>
      <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 ${
        isUser 
          ? 'bg-[var(--accent-bg)] text-[var(--text-primary)] border border-[rgba(255,255,255,0.05)]' 
          : 'bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] border border-[rgba(255,255,255,0.02)]'
      }`}>
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
      <span className="text-[10px] text-[var(--text-muted)] mt-1.5 px-2">
        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 p-3 mb-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] max-w-[80px]">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full"
          style={{
            background: 'var(--text-secondary)',
            animation: `pulseGlow 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
      ))}
    </div>
  );
}

export default function ChatPanel({ sandboxId, onOpenFile, isCollapsed }) {
  const { messages, isStreaming, streamingStatus, sendMessage, clearMessages } = useAIChat(sandboxId);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, streamingStatus]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 h-full flex flex-col items-center py-4 border-l border-[var(--border)] bg-[rgba(255,255,255,0.01)]">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[320px] md:w-[380px] h-full flex flex-col border-l border-[var(--border)] bg-[#0A0D14] flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.3)]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
            <span className="text-white text-[10px] font-bold">AI</span>
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">AI Assistant</span>
          {isStreaming && (
             <span className="flex h-2 w-2 relative ml-1">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
             </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar scroll-smooth">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} onOpenFile={onOpenFile} />
        ))}
        {isStreaming && <TypingIndicator />}
        
        {isStreaming && streamingStatus && (
           <div className="flex items-center justify-center mt-2">
             <div className="text-[10px] px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[var(--border)] text-[var(--text-muted)] animate-pulse font-mono">
               {streamingStatus}
             </div>
           </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Premium Chat Input */}
      <div className="p-4 bg-[rgba(255,255,255,0.01)] border-t border-[var(--border)]">
        <div 
          className={`relative flex flex-col rounded-xl overflow-hidden transition-all duration-300 ${
            input.trim() ? 'bg-[rgba(255,255,255,0.04)] border-[var(--border-strong)]' : 'bg-[rgba(255,255,255,0.02)] border-[var(--border)]'
          } focus-within:border-[rgba(124,58,237,0.5)] focus-within:shadow-[0_0_15px_rgba(124,58,237,0.1)]`}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Describe what you want to build..."
            rows={3}
            className="w-full px-4 pt-3 pb-2 text-[13px] resize-none outline-none bg-transparent text-[var(--text-primary)] custom-scrollbar"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <div className="flex items-center justify-between px-3 py-2 bg-[rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-1 text-[var(--text-muted)]">
              <button className="p-1.5 hover:text-white transition-colors"><Paperclip size={14} /></button>
              <button className="p-1.5 hover:text-white transition-colors"><Mic size={14} /></button>
            </div>
            
            {isStreaming ? (
              <button 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(239,68,68,0.1)] text-red-400 hover:bg-[rgba(239,68,68,0.2)] transition-colors text-xs font-medium"
              >
                <StopCircle size={14} /> Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={`flex items-center justify-center p-1.5 rounded-lg transition-all ${
                  input.trim() 
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]' 
                    : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]'
                }`}
              >
                <Send size={14} className={input.trim() ? "ml-0.5" : ""} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
