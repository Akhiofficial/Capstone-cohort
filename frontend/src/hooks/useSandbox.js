import { useState, useCallback, useEffect } from 'react'

const SESSION_KEY = 'devsandbox_session'

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return null
}

function saveSession(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch (_) {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch (_) {}
}

// Poll the agent until it responds (any non-5xx = agent pod is up and routing works).
// Uses the Vite HTTP proxy: /agent/{id} → http://{id}.agent.localhost
async function waitForAgent(sandboxId, { maxAttempts = 90, intervalMs = 2000 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      console.log(`[useSandbox] Polling agent pod (attempt ${i + 1}/${maxAttempts})...`)
      const res = await fetch(`/agent/${sandboxId}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      })
      // 200 = agent root route
      // 404 could be from nginx but means routing is working
      // Anything < 500 means the agent pod is reachable
      if (res.status < 500) {
        console.log(`[useSandbox] Agent pod ready (HTTP ${res.status}) after ${i + 1} attempts.`)
        return true
      }
      console.log(`[useSandbox] Agent pod returned HTTP ${res.status}, retrying...`)
    } catch (err) {
      // network error / ECONNREFUSED / timeout — pod not ready, keep polling
      console.log(`[useSandbox] Agent pod connection failed or timed out: ${err.message || err.toString()}. Retrying...`)
    }
    await new Promise(r => setTimeout(r, intervalMs))
  }
  return false
}

export function useSandbox() {
  const saved = loadSession()

  const [sandboxId, setSandboxId] = useState(saved?.sandboxId ?? null)
  const [previewUrl, setPreviewUrl] = useState(saved?.previewUrl ?? null)
  const [agentBaseUrl, setAgentBaseUrl] = useState(saved?.agentBaseUrl ?? null)
  // If restoring from session, still verify the pod is alive before marking ready
  const [status, setStatus] = useState(saved?.sandboxId ? 'loading' : 'idle')
  const [error, setError] = useState(null)

  // On mount: if we have a saved session, verify the agent is still alive
  useEffect(() => {
    if (!saved?.sandboxId) return

    waitForAgent(saved.sandboxId).then(alive => {
      if (alive) {
        setStatus('ready')
      } else {
        // Stale session — sandbox pod is gone, reset
        clearSession()
        setSandboxId(null)
        setPreviewUrl(null)
        setAgentBaseUrl(null)
        setStatus('idle')
        setError('Previous sandbox session has expired. Please start a new one.')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist session whenever key values change
  useEffect(() => {
    if (sandboxId && previewUrl) {
      saveSession({ sandboxId, previewUrl, agentBaseUrl })
    }
  }, [sandboxId, previewUrl, agentBaseUrl])

  const startSandbox = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(`/api/sandbox/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to start sandbox')

      const agent = `http://${data.sandboxId}.agent.localhost`
      setSandboxId(data.sandboxId)
      setPreviewUrl(data.previewUrl)
      setAgentBaseUrl(agent)

      // Wait for the agent pod to actually be ready before flipping to 'ready'
      setStatus('loading') // keep spinner while pod warms up
      const alive = await waitForAgent(data.sandboxId)
      if (!alive) throw new Error('Sandbox started but agent pod did not become ready in time')

      setStatus('ready')
      return data
    } catch (err) {
      setError(err.message)
      setStatus('error')
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    clearSession()
    setSandboxId(null)
    setPreviewUrl(null)
    setAgentBaseUrl(null)
    setStatus('idle')
    setError(null)
  }, [])

  return { sandboxId, previewUrl, agentBaseUrl, status, error, startSandbox, reset }
}
