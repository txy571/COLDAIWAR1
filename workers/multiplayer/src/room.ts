/**
 * @file Room Durable Object — manages a single game room's WebSocket connections,
 *       game state, and round timer. Each room ID maps to one DO instance.
 */
import type { WsClient, RoomState, ClientMessage } from './types'

const TIMER_DURATION = 60

export class GameRoom {
  private state: DurableObjectState
  private ctx: DurableObjectState
  private clients: WsClient[] = []
  private loaded = false
  private gameState: any = null
  private room: RoomState = {
    players: new Map(),
    timerSeconds: TIMER_DURATION,
    timerInterval: null,
    timerActiveSide: 'none',
    currentTurn: 1,
  }

  constructor(state: DurableObjectState, ctx: DurableObjectState) {
    this.state = state
    this.ctx = ctx
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/ws') {
      return new Response('Not found', { status: 404 })
    }

    let side = (url.searchParams.get('side') || 'observer') as 'usa' | 'ussr' | 'observer'

    // Resolve side conflicts: if requested side is occupied, assign opposite side (if free)
    if (side === 'usa' || side === 'ussr') {
      const isOccupied = this.clients.some(c => c.side === side)
      if (isOccupied) {
        const oppositeSide = side === 'usa' ? 'ussr' : 'usa'
        const isOppositeOccupied = this.clients.some(c => c.side === oppositeSide)
        if (!isOppositeOccupied) {
          side = oppositeSide
        } else {
          side = 'observer'
        }
      }
    }

    const clientId = crypto.randomUUID()

    // Verify WebSocket upgrade
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }

    // Load game state from storage if not loaded
    if (!this.loaded) {
      try {
        this.gameState = await this.state.storage.get("gameState") || null
      } catch (err) {
        console.error("Failed to load game state:", err)
      }
      this.loaded = true
    }

    const pair = new WebSocketPair()
    const [server, client] = Object.values(pair)

    // Accept the WebSocket
    server.accept()

    const wsClient: WsClient = { id: clientId, side, ws: server }
    this.clients.push(wsClient)

    // Track player
    if (side === 'usa' || side === 'ussr') {
      this.room.players.set(side, { side, ready: true })
    }

    // Send INIT to the new client (with current state and players list)
    this.sendTo(server, {
      type: 'INIT',
      side,
      gameState: this.gameState,
      timer: this.room.timerSeconds,
      activePlayers: Array.from(this.room.players.keys()),
    })

    // Notify others that active players changed
    this.broadcast({
      type: 'PLAYERS_CHANGED',
      activePlayers: Array.from(this.room.players.keys()),
    })

    // Notify others that a player joined
    this.broadcast(
      {
         type: 'PLAYER_JOINED',
         side,
         message: `[系统] ${side.toUpperCase()} 已加入房间`,
      },
      clientId
    )

    // Handle messages from this client
    server.addEventListener('message', (event: MessageEvent) => {
      try {
        const msg: ClientMessage = JSON.parse(event.data as string)
        this.handleMessage(msg, wsClient)
      } catch (err) {
        console.error('Failed to parse message:', err)
      }
    })

    // Handle disconnect
    server.addEventListener('close', () => {
      this.clients = this.clients.filter((c) => c.id !== clientId)
      if (side === 'usa' || side === 'ussr') {
        this.room.players.delete(side)
      }

      this.broadcast({
        type: 'PLAYER_LEFT',
        side,
        message: `[系统] ${side.toUpperCase()} 已离开房间`,
      })

      // Notify others that active players list changed
      this.broadcast({
        type: 'PLAYERS_CHANGED',
        activePlayers: Array.from(this.room.players.keys()),
      })

      // Stop timer if no players remain
      if (this.room.players.size === 0 && this.room.timerInterval) {
        clearInterval(this.room.timerInterval)
        this.room.timerInterval = null
      }
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  private handleMessage(msg: ClientMessage, client: WsClient): void {
    switch (msg.type) {
      case 'CHAT':
        this.broadcast({
          type: 'CHAT_MSG',
          side: msg.side || client.side,
          text: msg.text,
        })
        break

      case 'SUBMIT_ACTION':
        if (msg.side === 'usa' || msg.side === 'ussr') {
          this.broadcast({
            type: 'ACTION_SUBMITTED',
            side: msg.side,
            action: msg.action,
          })
        }
        break

      case 'START_TIMER':
        this.startTimer(msg.activeSide)
        break

      case 'RESET_TIMER':
        this.resetTimer()
        break

      case 'GAME_STATE_UPDATE':
        this.gameState = msg.gameState
        this.state.storage.put("gameState", msg.gameState).catch(err => {
          console.error("Failed to save game state to storage:", err)
        })
        this.broadcast({
          type: 'GAME_STATE_SYNC',
          gameState: msg.gameState,
        })
        break

      default:
        break
    }
  }

  private startTimer(activeSide: 'usa' | 'ussr' | 'none'): void {
    // Clear existing timer
    if (this.room.timerInterval) {
      clearInterval(this.room.timerInterval)
    }

    this.room.timerSeconds = TIMER_DURATION
    this.room.timerActiveSide = activeSide

    this.broadcast({ type: 'TIMER_TICK', seconds: this.room.timerSeconds })

    this.room.timerInterval = setInterval(() => {
      this.room.timerSeconds--
      this.broadcast({ type: 'TIMER_TICK', seconds: this.room.timerSeconds })

      if (this.room.timerSeconds <= 0) {
        if (this.room.timerInterval) {
          clearInterval(this.room.timerInterval)
          this.room.timerInterval = null
        }
        this.broadcast({ type: 'TIMER_TIMEOUT', side: activeSide })
        this.room.currentTurn++
      }
    }, 1000)
  }

  private resetTimer(): void {
    this.room.timerSeconds = TIMER_DURATION
    this.broadcast({ type: 'TIMER_TICK', seconds: this.room.timerSeconds })
  }

  private sendTo(ws: WebSocket, data: unknown): void {
    try {
      ws.send(JSON.stringify(data))
    } catch {
      // Connection may be closed
    }
  }

  private broadcast(data: unknown, excludeId?: string): void {
    const msg = JSON.stringify(data)
    for (const client of this.clients) {
      if (client.id === excludeId) continue
      try {
        client.ws.send(msg)
      } catch {
        // Remove dead connections
        this.clients = this.clients.filter((c) => c.id !== client.id)
      }
    }
  }
}
