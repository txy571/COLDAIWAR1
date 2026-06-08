'use client'

/**
 * @file MultiplayerLobby
 * @desc 联机大厅 — 所有玩家必须通过此界面创建/加入房间并连接 CF Worker，
 *       匹配成功后自动进入游戏。没有开放入口。
 */

import { useState, useRef, useEffect } from 'react'
import { MultiplayerManager, MultiplayerEvent } from '@/lib/multiplayer'
import { audioManager } from '@/lib/audio'
import { useGameStore } from '@/store/gameStore'

interface MultiplayerLobbyProps {
  onGameStart: (roomId: string, side: 'usa' | 'ussr', manager: MultiplayerManager) => void
}

type Phase = 'home' | 'creating' | 'joining' | 'connecting' | 'waiting' | 'error'

export function MultiplayerLobby({ onGameStart }: MultiplayerLobbyProps) {
  const [phase, setPhase] = useState<Phase>('home')
  const [roomId, setRoomId] = useState('')
  const [roomIdInput, setRoomIdInput] = useState('')
  const [mySide, setMySide] = useState<'usa' | 'ussr' | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [useMock, setUseMock] = useState(false)
  const [preferredSide, setPreferredSide] = useState<'usa' | 'ussr'>('usa')
  // API settings state
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [apiProvider, setApiProvider] = useState<'openai' | 'anthropic' | 'deepseek'>('openai')
  const [apiKey, setApiKey] = useState('')
  const [apiSaved, setApiSaved] = useState(false)

  // Load saved API settings on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedKey = localStorage.getItem('ai_judge_api_key')
    const savedProvider = localStorage.getItem('ai_judge_provider') as 'openai' | 'anthropic' | 'deepseek' | null
    if (savedKey) setApiKey(savedKey)
    if (savedProvider) setApiProvider(savedProvider)
  }, [])

  const saveApiSettings = () => {
    audioManager.playClick()
    localStorage.setItem('ai_judge_api_key', apiKey.trim())
    localStorage.setItem('ai_judge_provider', apiProvider)
    setApiSaved(true)
    setTimeout(() => setApiSaved(false), 2000)
  }
  const managerRef = useRef<MultiplayerManager | null>(null)

  // Refs to avoid stale closures in WebSocket callbacks
  const roomIdRef = useRef(roomId)
  roomIdRef.current = roomId
  const onGameStartRef = useRef(onGameStart)
  onGameStartRef.current = onGameStart
  const mySideRef = useRef(mySide)
  mySideRef.current = mySide

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  const generateRoomId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)]
    return result
  }

  const startGame = (side: 'usa' | 'ussr') => {
    if (managerRef.current) {
      onGameStartRef.current(roomIdRef.current, side, managerRef.current)
    }
  }

  // Manual override: visible when waiting with opponent connected
  const [canManualEnter, setCanManualEnter] = useState(false)

  // After PLAYER_JOINED or full activePlayers, enable manual enter too
  const triggerGameStart = (side: 'usa' | 'ussr') => {
    setCanManualEnter(false)
    startGame(side)
  }

  // NOT wrapped in useCallback — needs fresh values from refs
  const handleLobbyEvent = (ev: MultiplayerEvent) => {
    switch (ev.type) {
      case 'INIT':
        if (ev.side === 'usa' || ev.side === 'ussr') setMySide(ev.side)
        setPhase('waiting')
        if (ev.gameState) {
          useGameStore.getState().loadGameState(ev.gameState)
          addLog(`[系统] 已从服务器同步房间历史局势数据！`)
        }
        const both: boolean = !!(ev.activePlayers && ev.activePlayers.length >= 2)
        if (both) {
          addLog(`[系统] 已连接至房间，对手已就位！`)
          addLog('[系统] ⚡ 进入游戏！')
          startGame(ev.side as 'usa' | 'ussr')
        } else {
          addLog(`[系统] 已连接至服务器，房间: ${ev.side === 'usa' ? '等待苏方加入...' : '等待美方加入...'}`)
        }
        break
      case 'PLAYER_JOINED':
        addLog(ev.message)
        addLog('[系统] ⚡ 对手已就位，进入游戏！')
        setCanManualEnter(true)
        const mySideAfterJoin: 'usa' | 'ussr' = ev.side === 'usa' ? 'ussr' : 'usa'
        startGame(mySideAfterJoin)
        break
      case 'PLAYERS_CHANGED':
        if (ev.activePlayers && ev.activePlayers.length >= 2) {
          addLog(`[系统] 检测到双方已就位！`)
          setCanManualEnter(true)
          startGame(mySideRef.current || 'usa')
        }
        break
      case 'CONNECTION_ERROR':
        setErrorMsg(ev.message)
        setPhase('error')
        break
      case 'PLAYER_LEFT':
        addLog(ev.message)
        break
      default:
        break
    }
  }

  const cleanup = () => {
    if (managerRef.current) {
      managerRef.current.disconnect()
      managerRef.current = null
    }
    setPhase('home')
    setRoomId('')
    setMySide(null)
    setLog([])
    setErrorMsg(null)
  }

  const handleCreateRoom = async () => {
    audioManager.playClick()
    const id = generateRoomId()
    setRoomId(id)
    setMySide(preferredSide)
    setPhase('connecting')
    setLog([])
    setErrorMsg(null)
    addLog(`[系统] 正在创建房间 ${id}（${preferredSide === 'usa' ? '🇺🇸 美国' : '🇷🇺 苏联'}）...`)

    const mgr = new MultiplayerManager(
      id,
      preferredSide,
      handleLobbyEvent,
      useMock,
      true
    )
    managerRef.current = mgr
  }

  const handleJoinRoom = () => {
    if (!roomIdInput.trim()) return
    audioManager.playClick()
    const opponentSide: 'usa' | 'ussr' = preferredSide === 'usa' ? 'ussr' : 'usa'
    const id = roomIdInput.trim().toUpperCase()
    setRoomId(id)
    setMySide(opponentSide)
    setPhase('connecting')
    setLog([])
    setErrorMsg(null)
    addLog(`[系统] 正在连接房间 ${id}（${opponentSide === 'usa' ? '🇺🇸 美国' : '🇷🇺 苏联'}）...`)

    const mgr = new MultiplayerManager(
      id,
      opponentSide,
      handleLobbyEvent,
      useMock,
      true
    )
    managerRef.current = mgr
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4">
      <div className="w-full max-w-md border-4 border-[var(--border-dark)] shadow-2xl bg-[var(--bg-canvas)]">
        {/* Header */}
        <div className="bg-[var(--bg-header)] border-b-4 border-[var(--border-dark)] p-6 sm:p-8 text-center">
          <h1 className="text-2xl sm:text-3xl tracking-[0.3em] font-bold text-[var(--text-primary)]">
            COLD AI WAR
          </h1>
          <p className="text-[9px] text-[var(--text-muted)] tracking-[0.2em] mt-3 uppercase">
            联机对战 · 必须通过大厅进入
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150" />
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-300" />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {phase === 'home' && (
            <div className="space-y-5">
              {/* Online/Mock Selector Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-stone-100 border border-stone-300 rounded-sm">
                <span className="text-[10px] font-bold text-stone-600 font-mono">联机连接模式:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setUseMock(false); audioManager.playClick(); }}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-sm border font-mono transition-all ${
                      !useMock ? 'bg-stone-700 text-stone-50 border-stone-700 shadow-sm' : 'bg-stone-50 text-stone-500 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    在线联机
                  </button>
                  <button
                    onClick={() => { setUseMock(true); audioManager.playClick(); }}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-sm border font-mono transition-all ${
                      useMock ? 'bg-stone-700 text-stone-50 border-stone-700 shadow-sm' : 'bg-stone-50 text-stone-500 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    本地 Mock
                  </button>
                </div>
              </div>

              {/* AI API Settings */}
              <div className="border border-stone-300 rounded-sm overflow-hidden">
                <button
                  onClick={() => { setShowApiSettings(!showApiSettings); audioManager.playClick(); }}
                  className="w-full flex items-center justify-between p-2.5 text-[9px] font-mono font-bold text-stone-500 hover:text-stone-700 bg-stone-100/50 transition-colors"
                >
                  <span>🤖 AI 裁判设置</span>
                  <span>{showApiSettings ? '▲' : '▼'}</span>
                </button>
                {showApiSettings && (
                  <div className="p-3 border-t border-stone-300/50 space-y-2.5 bg-stone-50/30">
                    <div className="flex gap-1.5">
                      {(['openai', 'anthropic', 'deepseek'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => { setApiProvider(p); audioManager.playClick(); }}
                          className={`flex-1 py-1.5 text-[9px] border rounded-sm font-mono font-bold transition-colors ${
                            apiProvider === p ? 'bg-stone-700 text-stone-50 border-stone-700' : 'bg-stone-50 text-stone-500 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : 'DeepSeek'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder={`输入 ${apiProvider === 'openai' ? 'OpenAI' : apiProvider === 'anthropic' ? 'Anthropic' : 'DeepSeek'} API Key...`}
                      className="w-full bg-stone-50 border border-stone-400 rounded-sm p-1.5 text-[9px] font-mono outline-none focus:border-stone-600 placeholder:text-stone-300"
                    />
                    <button
                      onClick={saveApiSettings}
                      className="w-full py-1.5 bg-stone-700 hover:bg-stone-800 text-stone-50 text-[9px] font-bold rounded-sm transition-colors"
                    >
                      {apiSaved ? '✓ 已保存' : '保存 API 设置'}
                    </button>
                    <p className="text-[7px] text-stone-400 leading-tight">
                      未配置时将自动回退本地规则引擎。DeepSeek 使用兼容 OpenAI 的 API 格式。
                    </p>
                  </div>
                )}
              </div>

              {/* Side Selector */}
              <div className="flex bg-stone-200/60 rounded-sm overflow-hidden border border-stone-400/60">
                <button
                  className={`flex-1 py-2 text-xs font-bold font-mono tracking-wider transition-colors ${
                    preferredSide === 'usa' ? 'bg-blue-900/20 text-blue-700 border-r border-stone-400/60 shadow-inner' : 'text-stone-500 hover:text-stone-700'
                  }`}
                  onClick={() => { setPreferredSide('usa'); audioManager.playClick(); }}
                >🇺🇸 美国</button>
                <button
                  className={`flex-1 py-2 text-xs font-bold font-mono tracking-wider transition-colors ${
                    preferredSide === 'ussr' ? 'bg-red-900/20 text-red-700 shadow-inner' : 'text-stone-500 hover:text-stone-700'
                  }`}
                  onClick={() => { setPreferredSide('ussr'); audioManager.playClick(); }}
                >🇷🇺 苏联</button>
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full py-3.5 bg-stone-700 hover:bg-stone-800 text-stone-100 font-bold tracking-wider text-sm rounded-sm transition-all active:scale-[0.98]"
              >
                🎮 创建房间（{preferredSide === 'usa' ? '🇺🇸 美国' : '🇷🇺 苏联'}）
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-main)]/30" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-[var(--bg-canvas)] text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
                    或
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[9px] text-[var(--text-muted)] uppercase tracking-[0.15em] font-mono font-bold">
                  输入房间号加入
                </label>
                <input
                  type="text"
                  placeholder="6 位房间号"
                  maxLength={6}
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  className="w-full bg-stone-50 border-2 border-stone-400 rounded-sm p-3 text-center text-xl font-bold tracking-[0.25em] uppercase outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  autoFocus
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!roomIdInput.trim()}
                  className="w-full py-3 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-400 disabled:cursor-not-allowed text-stone-100 font-bold tracking-wider text-sm rounded-sm transition-all active:scale-[0.98]"
                >
                  🔗 加入房间
                </button>
              </div>
            </div>
          )}

          {phase === 'connecting' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-lg font-bold tracking-[0.3em] text-[var(--text-primary)]">{roomId}</div>
              <div className="flex justify-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">正在连接联机服务器...</p>
              <button onClick={cleanup} className="text-[9px] text-red-600 hover:text-red-800 underline">
                取消
              </button>
            </div>
          )}

          {phase === 'waiting' && (
            <div className="text-center py-8 space-y-5">
              <div className="inline-block border-2 border-dashed border-amber-600/60 rounded-sm px-5 py-3">
                <div className="text-[9px] text-[var(--text-muted)] mb-1 tracking-wider">房间号</div>
                <div className="text-2xl font-bold tracking-[0.35em] text-[var(--text-primary)]">{roomId}</div>
              </div>

              <div className="flex justify-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>

              <p className="text-[10px] text-[var(--text-muted)] font-mono">等待对手加入...</p>
              <p className="text-[9px] text-[var(--text-muted)]">
                将上方房间号发送给好友，对方输入后加入同一房间
              </p>

              {/* Log */}
              {log.length > 0 && (
                <div className="h-20 overflow-y-auto border border-[var(--border-main)]/20 bg-stone-50/50 p-2 rounded-sm text-[8px] font-mono text-left space-y-1">
                  {log.map((msg, i) => (
                    <div key={i} className="text-stone-600 leading-tight">{msg}</div>
                  ))}
                </div>
              )}

              {canManualEnter && (
                <button
                  onClick={() => startGame(mySideRef.current || 'usa')}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold tracking-wider rounded-sm transition-all animate-pulse text-sm"
                >
                  ⚡ 进入游戏（手动）
                </button>
              )}

              <button onClick={cleanup} className="text-[9px] text-red-600 hover:text-red-800 underline">
                取消 / 返回
              </button>
            </div>
          )}

          {phase === 'error' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-4xl">⚠️</div>
              <p className="text-[11px] text-red-700 font-bold">{errorMsg || '连接失败'}</p>
              <button
                onClick={cleanup}
                className="px-6 py-2 bg-stone-700 hover:bg-stone-800 text-stone-100 text-xs font-bold rounded-sm transition-colors"
              >
                返回大厅
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-main)]/20 px-6 py-3">
          <p className="text-[8px] text-[var(--text-muted)] text-center font-mono">
            {phase === 'home'
              ? '通过 Cloudflare Durable Objects 实时同步'
              : phase === 'error'
              ? '请检查网络后重试'
              : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
