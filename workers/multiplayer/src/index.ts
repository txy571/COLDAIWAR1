/**
 * @file Cloudflare Worker entry point
 * @desc Accepts WebSocket connections at /ws?room=X&side=Y and
 *       routes them to the appropriate GameRoom Durable Object.
 */

import { GameRoom } from './room'

export { GameRoom }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const roomId = url.searchParams.get('room') || 'default'

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      })
    }

    // Only handle /ws path
    if (url.pathname !== '/ws') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'coldwar-multiplayer',
          version: '1.0.0',
          rooms: 'WebSocket connections at /ws?room=NAME&side=usa|ussr|observer',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      )
    }

    // Get the Durable Object stub for this room
    const doId = env.GAME_ROOM.idFromName(roomId)
    const stub = env.GAME_ROOM.get(doId)

    // Forward the request to the Durable Object
    return stub.fetch(request)
  },
}

interface Env {
  GAME_ROOM: DurableObjectNamespace
}
