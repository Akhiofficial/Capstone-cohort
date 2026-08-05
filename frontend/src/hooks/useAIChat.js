import { useState, useCallback, useRef } from 'react'

const AI_API = '/api/ai/invoke'

export function useAIChat(sandboxId) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'ai',
      content: '👋 Hi! I\'m your AI assistant. Describe what frontend you want to build and I\'ll generate it for you.',
      timestamp: Date.now(),
    }
  ])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingStatus, setStreamingStatus] = useState('')
  const abortRef = useRef(null)

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), timestamp: Date.now(), ...msg }])
  }, [])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isStreaming) return

    // Add user message
    addMessage({ type: 'user', content: text.trim() })
    setIsStreaming(true)
    setStreamingStatus('Connecting to AI...')

    // Abort any previous stream
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(AI_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), projectId: sandboxId }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const statusLines = []

      setStreamingStatus('Connected. Processing...')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          // SSE format: "data: ..." or plain text
          const content = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed

          if (content === '[DONE]' || content === 'Connection closed') {
            continue
          }

          // Check if it's a timestamp log line (e.g. "00:11:36.469\nUpdating files...")
          // or plain status message
          setStreamingStatus(content)
          statusLines.push(content)

          // Add status bubble for key events
          if (
            content.includes('Listing files') ||
            content.includes('Reading files') ||
            content.includes('Updating files') ||
            content.includes('Files') ||
            content.includes('listed') ||
            content.includes('updated') ||
            content.includes('read')
          ) {
            addMessage({ type: 'status', content })
          }
        }
      }

      // Add final AI completion message
      addMessage({
        type: 'ai',
        content: '✅ Done! Your changes have been applied. Check the preview panel to see the result.',
      })
      setStreamingStatus('')
    } catch (err) {
      if (err.name !== 'AbortError') {
        addMessage({
          type: 'ai',
          content: `❌ Error: ${err.message}`,
        })
        setStreamingStatus('')
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [sandboxId, isStreaming, addMessage])

  const clearMessages = useCallback(() => {
    setMessages([{
      id: 'welcome',
      type: 'ai',
      content: '👋 Hi! I\'m your AI assistant. Describe what frontend you want to build and I\'ll generate it for you.',
      timestamp: Date.now(),
    }])
  }, [])

  return { messages, isStreaming, streamingStatus, sendMessage, clearMessages }
}
