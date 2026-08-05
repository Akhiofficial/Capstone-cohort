import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import net from 'node:net'

// ── Agent WebSocket Tunnel Plugin ─────────────────────────────────────────────
// Problem: browsers can't resolve *.agent.localhost wildcard subdomains.
// Solution: intercept WebSocket upgrade at the Vite server level and create a
//           raw TCP tunnel directly to {sandboxId}.agent.localhost:80.
//
// IMPORTANT: Uses prependListener so this handler runs BEFORE Vite's own ws
// proxy. After taking over the socket we mark it so Vite's handler skips it.
function agentWsTunnelPlugin() {
  return {
    name: 'agent-ws-tunnel',
    configureServer(server) {
      const handled = new WeakSet()

      // prependListener ensures we intercept BEFORE Vite's built-in ws proxy
      server.httpServer?.prependListener('upgrade', (req, clientSocket, head) => {
        const match = req.url?.match(/^\/agent\/([^/]+)/)
        if (!match) return // not ours — let Vite handle it normally

        // Mark this socket as claimed so no other handler touches it
        handled.add(clientSocket)

        const sandboxId = match[1]
        const targetHost = `${sandboxId}.agent.localhost`
        const forwardedPath = req.url.replace(`/agent/${sandboxId}`, '') || '/'

        const serverSocket = net.connect(80, targetHost, () => {
          // Forward the HTTP Upgrade handshake to the real agent host
          const upgradeHeaders = [
            `GET ${forwardedPath} HTTP/1.1`,
            `Host: ${targetHost}`,
            ...Object.entries(req.headers)
              .filter(([k]) => k !== 'host')
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`),
            '',
            '',
          ].join('\r\n')

          serverSocket.write(upgradeHeaders)
          if (head?.length) serverSocket.write(head)

          // Bidirectional pipe
          serverSocket.pipe(clientSocket)
          clientSocket.pipe(serverSocket)
        })

        serverSocket.on('error', (err) => {
          if (err.code !== 'ECONNRESET' && err.code !== 'ECONNABORTED') {
            console.warn(`[agent-ws] ${targetHost}: ${err.message}`)
          }
          if (!clientSocket.destroyed) clientSocket.destroy()
        })

        clientSocket.on('error', () => {
          if (!serverSocket.destroyed) serverSocket.destroy()
        })

        clientSocket.on('close', () => {
          if (!serverSocket.destroyed) serverSocket.destroy()
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), agentWsTunnelPlugin()],
  server: {
    proxy: {
      // ── REST + SSE (sandbox start, AI invoke) ─────────────────────────────
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
      },

      // ── Agent HTTP polling fallback (/agent/{id}/socket.io?transport=polling)
      // NOTE: ws: true intentionally OMITTED — WebSocket is handled by the plugin above.
      //       Keeping ws:true would cause a double-handler conflict (ECONNABORTED).
      '/agent': {
        target: 'http://localhost',
        changeOrigin: true,
        // No 'rewrite' here — if we rewrite before proxyReq, req.url loses the sandboxId
        // and we can no longer extract it to set the Host header. Handle both together:
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // req.url is still the ORIGINAL path here: /agent/{sandboxId}/...
            const match = req.url?.match(/^\/agent\/([^/]+)(\/.*)?$/)
            if (match) {
              const [, sandboxId, rest = '/'] = match
              proxyReq.setHeader('host', `${sandboxId}.agent.localhost`)
              // Strip the /agent/{sandboxId} prefix from the forwarded path
              proxyReq.path = rest || '/'
            }
          })
          // Suppress harmless abort errors from React StrictMode double-invoke
          proxy.on('error', (err) => {
            if (err.code !== 'ECONNRESET' && err.code !== 'ECONNABORTED') {
              console.warn('[agent-http]', err.message)
            }
          })
        },
      },
    },
  },
})
