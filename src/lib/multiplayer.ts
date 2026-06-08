/**
 * @file Multiplayer Manager
 * @desc Coordinates WebSocket connection with Cloudflare Durable Objects worker.
 *       Includes a fully functional offline local mock mode as fallback.
 */

import { getMultiplayerHost, getWsProtocol } from '@/config/multiplayer'

export type MultiplayerEvent =
  | { type: 'INIT'; side: 'usa' | 'ussr' | 'observer'; gameState: any; timer: number }
  | { type: 'PLAYER_JOINED'; side: string; message: string }
  | { type: 'PLAYER_LEFT'; side: string; message: string }
  | { type: 'GAME_STATE_SYNC'; gameState: any }
  | { type: 'ACTION_SUBMITTED'; side: 'usa' | 'ussr'; action: any }
  | { type: 'TIMER_TICK'; seconds: number }
  | { type: 'TIMER_TIMEOUT'; side: 'usa' | 'ussr' | 'none' }
  | { type: 'CHAT_MSG'; side: string; text: string }
  | { type: 'CONNECTION_ERROR'; message: string }

export class MultiplayerManager {
  private socket: WebSocket | null = null
  private roomId: string
  private side: 'usa' | 'ussr' | 'observer'
  private isOfflineMock = false
  private noMockFallback = false
  private timerInterval: any = null
  private secondsLeft = 60
  private onEventCallback: (ev: MultiplayerEvent) => void

  constructor(
    roomId: string,
    side: 'usa' | 'ussr' | 'observer',
    onEvent: (ev: MultiplayerEvent) => void,
    useOfflineMock = false,
    noMockFallback = false
  ) {
    this.roomId = roomId
    this.side = side
    this.onEventCallback = onEvent
    this.isOfflineMock = useOfflineMock
    this.noMockFallback = noMockFallback

    if (useOfflineMock) {
      this.initMockMode()
    } else {
      this.connect()
    }
  }

  private connect() {
    const wsHost = getMultiplayerHost()
    const protocol = getWsProtocol(wsHost)
    const wsUrl = `${protocol}://${wsHost}/ws?room=${encodeURIComponent(this.roomId)}&side=${this.side}`
    try {
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        console.log('Connected to multiplayer server.')
      }

      this.socket.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          this.onEventCallback(data)
        } catch (err) {
          console.error('Error parsing socket data:', err)
        }
      }

      this.socket.onerror = () => {
        if (this.noMockFallback) {
          this.onEventCallback({ type: 'CONNECTION_ERROR', message: '无法连接到联机服务器，请检查网络后重试' })
          return
        }
        console.warn('Socket error, falling back to offline mock mode')
        this.isOfflineMock = true
        this.initMockMode()
      }

      this.socket.onclose = () => {
        if (!this.isOfflineMock) {
          console.warn('Socket closed. Attempting reconnect in 3s...')
          setTimeout(() => this.connect(), 3000)
        }
      }
    } catch (err) {
      if (this.noMockFallback) {
        this.onEventCallback({ type: 'CONNECTION_ERROR', message: '无法连接到联机服务器，请检查网络后重试' })
        return
      }
      console.warn('Connection failed, entering offline mock mode')
      this.isOfflineMock = true
      this.initMockMode()
    }
  }

  private initMockMode() {
    console.log(`[Multiplayer Mock] Joined room "${this.roomId}" as ${this.side.toUpperCase()}`)
    setTimeout(() => {
      this.onEventCallback({
        type: 'INIT',
        side: this.side,
        gameState: null,
        timer: this.secondsLeft,
      })

      // Simulate opponent joining after a brief delay
      const opponent = this.side === 'usa' ? 'ussr' : 'usa'
      this.onEventCallback({
        type: 'PLAYER_JOINED',
        side: opponent,
        message: `[MOCK] ${opponent.toUpperCase()} has joined.`,
      })
    }, 1000)
  }

  public sendGameState(gameState: any) {
    if (this.isOfflineMock) return
    this.send({ type: 'GAME_STATE_UPDATE', gameState })
  }

  public submitAction(action: any) {
    if (this.isOfflineMock) {
      if (this.side === 'observer') return
      this.onEventCallback({ type: 'ACTION_SUBMITTED', side: this.side, action })

      // Auto-simulate opponent submit in mock mode after 3 seconds
      const opponentSide = this.side === 'usa' ? 'ussr' : 'usa'
      setTimeout(() => {
        this.onEventCallback({
          type: 'ACTION_SUBMITTED',
          side: opponentSide,
          action: {
            id: `mock_${Date.now()}`,
            category: 'ECONOMIC',
            description: `[MOCK] ${opponentSide.toUpperCase()} 决定推进战略基础设施建设。`,
            status: 'PENDING',
          },
        })
      }, 3000)
      return
    }

    this.send({ type: 'SUBMIT_ACTION', action })
  }

  public startTimer(activeSide: 'usa' | 'ussr' | 'none') {
    if (this.isOfflineMock) {
      this.stopTimer()
      this.secondsLeft = 60
      this.onEventCallback({ type: 'TIMER_TICK', seconds: this.secondsLeft })
      this.timerInterval = setInterval(() => {
        this.secondsLeft--
        this.onEventCallback({ type: 'TIMER_TICK', seconds: this.secondsLeft })
        if (this.secondsLeft <= 0) {
          this.stopTimer()
          this.onEventCallback({ type: 'TIMER_TIMEOUT', side: activeSide })
        }
      }, 1000)
      return
    }

    this.send({ type: 'START_TIMER', activeSide })
  }

  public resetTimer() {
    if (this.isOfflineMock) {
      this.secondsLeft = 60
      this.onEventCallback({ type: 'TIMER_TICK', seconds: this.secondsLeft })
      return
    }
    this.send({ type: 'RESET_TIMER' })
  }

  public stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  public sendChat(text: string) {
    if (this.isOfflineMock) {
      this.onEventCallback({ type: 'CHAT_MSG', side: this.side, text })
      // Opponent simulated response
      const opponent = this.side === 'usa' ? 'ussr' : 'usa'
      setTimeout(() => {
        this.onEventCallback({
          type: 'CHAT_MSG',
          side: opponent,
          text: `[MOCK] 收到！正在拟定战略指令...`,
        })
      }, 2000)
      return
    }
    this.send({ type: 'CHAT', text })
  }

  private send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    }
  }

  /** Replace the event callback at runtime (used after lobby → game transition) */
  public setEventCallback(callback: (ev: MultiplayerEvent) => void) {
    this.onEventCallback = callback
  }

  public disconnect() {
    this.stopTimer()
    if (this.socket) {
      this.socket.close()
    }
  }
}
