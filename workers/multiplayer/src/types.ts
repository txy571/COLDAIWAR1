/**
 * @file Shared types for Cloudflare Workers multiplayer backend
 */

export interface InitPayload {
  side: 'usa' | 'ussr' | 'observer'
  gameState: any
  timer: number
}

export interface ChatPayload {
  text: string
}

export interface SubmitActionPayload {
  id: string
  category: string
  description: string
  status: string
}

export interface StartTimerPayload {
  activeSide: 'usa' | 'ussr' | 'none'
}

export interface GameStateUpdatePayload {
  gameState: any
}

export type ClientMessage =
  | { type: 'SUBMIT_ACTION'; action: SubmitActionPayload; side: 'usa' | 'ussr' }
  | { type: 'CHAT'; text: string; side: string }
  | { type: 'START_TIMER'; activeSide: 'usa' | 'ussr' | 'none' }
  | { type: 'RESET_TIMER' }
  | { type: 'GAME_STATE_UPDATE'; gameState: any }

export interface RoomState {
  players: Map<string, { side: 'usa' | 'ussr' | 'observer'; ready: boolean }>
  timerSeconds: number
  timerInterval: ReturnType<typeof setInterval> | null
  timerActiveSide: 'usa' | 'ussr' | 'none'
  currentTurn: number
}

export interface WsClient {
  id: string
  side: 'usa' | 'ussr' | 'observer'
  ws: WebSocket
}
