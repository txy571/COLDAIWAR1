/**
 * @file Multiplayer & app configuration
 * @desc Controls WebSocket server and base path for static export.
 *       Override multiplayer host via localStorage key "multiplayer_worker_host".
 */

// Next.js static export basePath (must match next.config.js)
export const BASE_PATH = '/COLDAIWAR1'

// In production (GitHub Pages), connect to Cloudflare Worker
// In development (localhost), connect to local wrangler dev server
const PROD_WS_HOST = 'coldwar-multiplayer.183107.xyz'
const DEV_WS_HOST = 'localhost:8787'

export function getMultiplayerHost(): string {
  if (typeof window === 'undefined') return DEV_WS_HOST

  const saved = localStorage.getItem('multiplayer_worker_host')
  if (saved) return saved

  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return DEV_WS_HOST
  }

  return PROD_WS_HOST
}

export function getWsProtocol(host: string): 'ws' | 'wss' {
  return host.includes('localhost') || host.includes('127.0.0.1') ? 'ws' : 'wss'
}
