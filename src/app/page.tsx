'use client'

/**
 * @file 主页面 — 冷战大战略游戏界面
 * @desc 三栏式布局：左侧(热点排行/末日时钟/局势/区域分/边界变更) +
 *       中央(D3.js世界地图) + 右侧(国家情报/行动指令/科技树/AI设置)
 *       底栏新闻滚动条，顶部金属风格标题栏含美苏数据看板
 *       回合推进逻辑：AI事件→美国行动→苏联行动→AI结算
 *       TODO: 行动点系统未实现(设计文档要求6点/回合)
 *       TODO: 响应式布局未实现(设计文档4个断点)
 *       TODO: 音效系统未实现
 */
import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { WorldMap } from '@/components/map/WorldMap'
import { CountryInfo } from '@/components/panels/CountryInfo'
import { ActionInput } from '@/components/panels/ActionInput'
import { TechTreePanel } from '@/components/panels/TechTreePanel'
import { DoomsdayClock } from '@/components/panels/DoomsdayClock'
import { ApiSettings } from '@/components/panels/ApiSettings'
import { EventPopup } from '@/components/panels/EventPopup'
import { ResolutionResults } from '@/components/panels/ResolutionResults'
import { FactionSelect } from '@/components/panels/FactionSelect'
import { NewsTicker } from '@/components/panels/NewsTicker'
import { BorderChanges } from '@/components/panels/BorderChanges'
import { selectCwsRanking, selectFlashpoints } from '@/store/selectors'
import { executeIntelPhase, executeAIPhase, executeResolutionPhase } from '@/engine/turnLoop'
import { resolvePendingActions } from '@/engine/aiJudge'
import { checkVictory } from '@/engine/victory'
import { VictoryScreen } from '@/components/panels/VictoryScreen'
import { MultiplayerPanel } from '@/components/panels/MultiplayerPanel'
import { MultiplayerManager } from '@/lib/multiplayer'
import { audioManager } from '@/lib/audio'
import { i18n } from '@/lib/i18n'
import type { Situation } from '@/types/situation'
import type { VictoryResult } from '@/engine/victory'

export default function Home() {
  const year = useGameStore(s => s.year)
  const turn = useGameStore(s => s.turn)
  const phase = useGameStore(s => s.phase)
  const globalTension = useGameStore(s => s.globalTension)
  const store = useGameStore()
  const cwsRanking = useGameStore(selectCwsRanking)
  const flashpoints = useGameStore(selectFlashpoints)
  const activeSituations = useGameStore(s => s.activeSituations)
  const selectedCountryId = useGameStore(s => s.selectedCountryId)
  const setSelectedCountryId = useGameStore(s => s.setSelectedCountryId)
  const usa = useGameStore(s => s.players.usa)
  const ussr = useGameStore(s => s.players.ussr)
  const [victory, setVictory] = useState<VictoryResult | null>(null)
  const [faction, setFaction] = useState<'usa' | 'ussr' | null>(null)
  const resetGame = useGameStore(s => s.resetGame)

  // --- Audio & i18n ---
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    audioManager.init()
    setLang(i18n.getLocale())
    setIsMuted(audioManager.isMuted())
  }, [])

  const handleToggleMute = () => {
    const nextMute = audioManager.toggleMute()
    setIsMuted(nextMute)
  }

  const handleToggleLang = () => {
    const nextLang = lang === 'zh' ? 'en' : 'zh'
    i18n.setLocale(nextLang)
    setLang(nextLang)
  }

  const handleExportReport = () => {
    const reportText = `=== COLD WAR GRAND STRATEGY WAR REPORT ===\nYear: ${year}\nTurn: ${turn}\nTension: ${globalTension}\n\n=== TIMELINE EVENTS ===\n` +
      store.timeline.map(e => `[${e.year} - Turn ${e.turn}] ${e.title}: ${e.description}`).join('\n')
    
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `war_report_year_${year}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  // --- Multiplayer states ---
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [onlineTimer, setOnlineTimer] = useState<number | null>(null)
  const [mpMessages, setMpMessages] = useState<string[]>([])
  const [mpRole, setMpRole] = useState<'usa' | 'ussr' | 'observer' | null>(null)

  const handleJoinRoom = (roomId: string, side: 'usa' | 'ussr' | 'observer') => {
    if (typeof window === 'undefined') return
    if ((window as any).mpManager) {
      (window as any).mpManager.disconnect()
    }

    const manager = new MultiplayerManager(
      roomId,
      side,
      (ev) => {
        switch (ev.type) {
          case 'INIT':
            setActiveRoomId(roomId)
            setMpRole(ev.side)
            setOnlineTimer(ev.timer)
            if (ev.side === 'usa' || ev.side === 'ussr') {
              setFaction(ev.side)
            }
            setMpMessages((prev) => [...prev, `[系统] 已成功连接到房间 ${roomId}，角色为：${ev.side.toUpperCase()}`])
            break
          case 'PLAYER_JOINED':
            setMpMessages((prev) => [...prev, ev.message])
            break
          case 'PLAYER_LEFT':
            setMpMessages((prev) => [...prev, ev.message])
            break
          case 'CHAT_MSG':
            setMpMessages((prev) => [...prev, `${ev.side.toUpperCase()}: ${ev.text}`])
            break
          case 'TIMER_TICK':
            setOnlineTimer(ev.seconds)
            break
          case 'ACTION_SUBMITTED':
            if (ev.side !== side) {
              store.addPlayerAction(ev.side, ev.action)
              setMpMessages((prev) => [...prev, `[系统] 对手 ${ev.side.toUpperCase()} 已提交指令！`])
            }
            break
          case 'TIMER_TIMEOUT':
            setMpMessages((prev) => [...prev, `[系统] 回合超时！自动结算。`])
            handleAdvancePhase()
            break
          case 'GAME_STATE_SYNC':
            break
        }
      },
      true // Offline mock sync mode
    )

    manager.startTimer(side === 'observer' ? 'none' : side)
    ;(window as any).mpManager = manager
  }

  const handleLeaveRoom = () => {
    if (typeof window !== 'undefined' && (window as any).mpManager) {
      (window as any).mpManager.disconnect()
      ;(window as any).mpManager = null
    }
    setActiveRoomId(null)
    setOnlineTimer(null)
    setMpRole(null)
    setMpMessages([])
  }

  const handleSendChat = (text: string) => {
    if (typeof window !== 'undefined' && (window as any).mpManager) {
      (window as any).mpManager.sendChat(text)
    }
  }

  const handleAdvancePhase = async () => {
    audioManager.playTick()
    if (store.globalTension > 75) {
      audioManager.playAlert()
    }
    const currentPhase = store.phase
    // Lock: player can only advance their own faction's turn
    if (currentPhase === 'USA_ACTION' && faction !== 'usa') return
    if (currentPhase === 'USSR_ACTION' && faction !== 'ussr') return

    switch (currentPhase) {
      case 'AI_EVENT':
        executeAIPhase(store)
        store.advancePhase()
        break
      case 'USA_ACTION':
        await resolvePendingActions(store, 'usa')
        store.advancePhase()
        break
      case 'USSR_ACTION':
        await resolvePendingActions(store, 'ussr')
        store.advancePhase()
        break
      case 'RESOLVE':
        executeIntelPhase(store)
        executeResolutionPhase(store)
        const result = checkVictory(store)
        if (result.won) {
          setVictory(result)
          audioManager.playWin()
        } else {
          store.advancePhase()
        }
        break
    }
  }

  const phaseLabel = phase === 'AI_EVENT' ? '🤖 AI 事件' :
    phase === 'USA_ACTION' ? '🇺🇸 美国行动' :
    phase === 'USSR_ACTION' ? '🇷🇺 苏联行动' : '⚖️ AI 结算中'

  const advanceLabel = phase === 'AI_EVENT' ? '▶ 开始本轮' :
    phase === 'USA_ACTION' ? '⏭ 结束美方行动（→苏方）' :
    phase === 'USSR_ACTION' ? '⏭ 结束苏方行动（→结算）' :
    phase === 'RESOLVE' ? '▶ 推进到下一轮' : '▶ 推进'

  // Show faction selection before entering game
  if (!faction) {
    return <FactionSelect onSelect={setFaction} />
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] p-2 sm:p-4 text-[var(--text-primary)] transition-colors duration-500 flex items-center justify-center theme-font">
      <div className={`w-full max-w-7xl h-[95vh] border-4 border-[var(--border-dark)] shadow-2xl rounded-sm flex flex-col overflow-hidden relative ${store.currentEra === 'INFO_AGE' ? 'cyber-glass' : 'paper-texture bg-[var(--bg-canvas)]'}`}
        data-era={store.currentEra.toLowerCase()}>

        {/* CRT Vignette screen curvature effect */}
        {store.currentEra === 'IRON_CURTAIN' && <div className="crt-vignette" />}

        {/* ═══ 顶栏 ═══ */}
        <header className={`px-4 sm:px-6 py-2 flex justify-between items-center border-b-4 border-[var(--border-dark)] z-10 shrink-0 ${store.currentEra === 'POST_WW2' ? 'metal-dashboard text-stone-200' : 'bg-[var(--bg-header)] text-[var(--text-primary)]'}`}>
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl tracking-widest font-bold flex items-center gap-2">
              {i18n.t('title')} <span className="text-[var(--text-muted)] font-normal text-base">· {year}</span>
            </h1>
            {/* Quick config options */}
            <div className="flex gap-2">
              <button
                onClick={handleToggleLang}
                className="px-2 py-0.5 bg-stone-800 text-[9px] font-bold border border-stone-600 rounded-sm hover:bg-stone-700 transition-colors"
                title="Switch Language"
              >
                🌐 {lang === 'zh' ? 'EN' : '中文'}
              </button>
              <button
                onClick={handleToggleMute}
                className="px-2 py-0.5 bg-stone-800 text-[9px] font-bold border border-stone-600 rounded-sm hover:bg-stone-700 transition-colors"
                title="Toggle Sound"
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button
                onClick={handleExportReport}
                className="px-2 py-0.5 bg-stone-800 text-[9px] font-bold border border-stone-600 rounded-sm hover:bg-stone-700 transition-colors"
                title="Export War Report"
              >
                💾 {lang === 'zh' ? '导出战报' : 'Export'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-6 text-sm">
            {/* 美国 */}
            <div className="flex items-center gap-2 sm:gap-3 bg-blue-950/40 px-3 py-1.5 rounded-sm border border-blue-800/60 text-[11px] sm:text-xs">
              <span className="font-bold text-blue-400 tracking-wide">🇺🇸 美国</span>
              <span className="text-stone-400">|</span>
              <span className="text-stone-300">💰{usa.budget}</span>
              <span className="text-stone-300">📊{usa.publicSupport}%</span>
              <span className="text-amber-400 font-bold">{usa.victoryScore}分</span>
            </div>
            {/* 苏联 */}
            <div className="flex items-center gap-2 sm:gap-3 bg-red-950/40 px-3 py-1.5 rounded-sm border border-red-800/60 text-[11px] sm:text-xs">
              <span className="font-bold text-red-400 tracking-wide">🇷🇺 苏联</span>
              <span className="text-stone-400">|</span>
              <span className="text-stone-300">💰{ussr.budget}</span>
              <span className="text-stone-300">📊{ussr.publicSupport}%</span>
              <span className="text-amber-400 font-bold">{ussr.victoryScore}分</span>
            </div>

            <div className="flex items-center gap-2 bg-[var(--bg-panel)]/40 px-3 py-1.5 rounded-sm border border-[var(--border-main)]/50 text-[11px] sm:text-xs">
              <span className="text-[var(--text-muted)]">第{turn}轮</span>
              <span className={`font-bold ${globalTension > 60 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
                ☢ {globalTension}
              </span>
              <span className={`text-[9px] ${
                phase === 'USA_ACTION' ? 'text-blue-500' : phase === 'USSR_ACTION' ? 'text-red-500' : 'text-[var(--text-muted)]'
              }`}>{phaseLabel}</span>
            </div>

            <button
              onClick={handleAdvancePhase}
              disabled={
                (phase === 'USA_ACTION' && faction !== 'usa') ||
                (phase === 'USSR_ACTION' && faction !== 'ussr')
              }
              className={`px-3 py-1 text-xs font-bold rounded-sm tracking-wider ${
                (phase === 'USA_ACTION' && faction !== 'usa') ||
                (phase === 'USSR_ACTION' && faction !== 'ussr')
                  ? 'bg-stone-700/30 text-stone-600 cursor-not-allowed border border-stone-700/30'
                  : 'brass-button text-stone-900'
              }`}
            >
              {advanceLabel}
            </button>
          </div>
        </header>

        {/* ═══ 主体内容 ═══ */}
        <div className="flex flex-1 overflow-hidden">

          {/* ─── 左侧面板 ─── */}
          <aside className="w-72 sm:w-80 bg-[var(--bg-sidebar)] border-r-2 border-[var(--border-main)] flex flex-col z-10 shrink-0 overflow-y-auto">

            {/* 战略热点 */}
            <div className="p-4 sm:p-5 border-b-2 border-[var(--border-main)]/40">
              <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3 flex justify-between items-center">
                <span>🌡 战略热点</span>
                <span className="font-mono text-[var(--text-muted)]">冷战分</span>
              </h2>
              <div className="space-y-2">
                {cwsRanking.map((c, i) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCountryId(c.id)}
                    className={`flex items-center gap-2 p-1 -mx-1 rounded-sm transition-colors cursor-pointer text-xs ${
                      selectedCountryId === c.id ? 'bg-[var(--border-main)]/30 ring-1 ring-[var(--border-main)]/50' : 'hover:bg-[var(--border-main)]/10'
                    }`}
                  >
                    <span className="text-[var(--text-muted)] w-4 text-right font-mono">{i + 1}</span>
                    <span className={`flex-1 font-medium ${
                      selectedCountryId === c.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}>{c.name}</span>
                    <div className="threat-meter w-16">
                      <div
                        className={`fill ${c.cws > 75 ? 'bg-red-600' : c.cws > 50 ? 'bg-amber-600' : 'bg-stone-400'}`}
                        style={{ width: `${c.cws}%` }}
                      />
                    </div>
                    <span className={`font-mono text-xs w-6 text-right font-bold ${
                      c.cws > 75 ? 'text-red-600' : c.cws > 50 ? 'text-amber-600' : 'text-stone-500'
                    }`}>{c.cws}</span>
                  </div>
                ))}
              </div>
            </div>

            <DoomsdayClock />

            {/* 当前局势 */}
            <div className="p-4 sm:p-5 border-b-2 border-[var(--border-main)]/40">
              <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3">🚩 当前局势</h2>
              {activeSituations.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">暂无活跃局势</p>
              ) : (
                <div className="space-y-2">
                  {activeSituations.map((sit: Situation) => {
                    const stage = sit.stages[sit.currentStage]
                    return (
                      <div key={sit.id} className="wood-frame bg-[var(--bg-panel)]/40 p-2.5 text-xs rounded-sm">
                        <div className="font-bold text-[var(--text-primary)] text-xs mb-1">{sit.name}</div>
                        <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                          <span>{stage?.name}</span>
                          <span className="font-mono">({sit.stageProgress}/{stage?.durationTurns})</span>
                        </div>
                        <div className="threat-meter mt-1.5">
                          <div className="fill bg-amber-600" style={{ width: `${(sit.stageProgress / (stage?.durationTurns || 1)) * 100}%` }} />
                        </div>
                        <div className="text-[10px] text-red-700 font-bold mt-1">冷战分 +{sit.cwsImpact}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 区域局势 */}
            <div className="p-4 sm:p-5 border-b-2 border-[var(--border-main)]/40">
              <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3">📊 区域局势</h2>
              <div className="space-y-3">
                {Object.entries(store.regionalScores).slice(0, 8).map(([key, r]) => (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-mono">{r.cws}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--border-main)]/35 rounded-full overflow-hidden flex">
                      <div className="bg-blue-500/70 h-full transition-all" style={{ width: `${Math.min(100, r.cws)}%` }} />
                      <div className="bg-red-500/70 h-full transition-all" style={{ width: `${Math.max(0, Math.min(100 - r.cws, r.cws * 0.4))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 热点警报 */}
            {flashpoints.length > 0 && (
              <div className="p-4 sm:p-5 mt-auto border-t-2 border-red-700/30 bg-red-900/5">
                <h2 className="text-[10px] font-bold text-red-700 uppercase tracking-[0.2em] mb-2">⚠ 热点警报</h2>
                {flashpoints.map(f => (
                  <p key={f.id} className="text-[10px] text-red-800 font-medium">
                    {f.name} · 冷战分 {f.coldWarScore}
                  </p>
                ))}
              </div>
            )}

            {/* 边界变更面板 */}
            <BorderChanges />
          </aside>

          {/* ─── 中央：地图 ─── */}
          <main className="flex-1 relative bg-[var(--bg-canvas)] overflow-hidden flex flex-col">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]" />
            <div className="flex-1 relative">
              <WorldMap />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--bg-panel)]/90 border-2 border-[var(--border-main)] px-4 py-1.5 shadow-md rounded-sm text-[10px] text-[var(--text-primary)] whitespace-nowrap">
                🗺 滚轮缩放 · 拖拽平移 · 双击放大
              </div>
              <div className="absolute top-4 right-4 bg-[var(--bg-panel)]/90 border-2 border-[var(--border-main)] p-3 shadow-lg rounded-sm max-w-[180px] hidden sm:block">
                <h3 className="font-bold text-[var(--text-primary)] text-[10px] mb-0.5 tracking-wide">📋 情报</h3>
                <p className="text-[9px] text-[var(--text-muted)] leading-tight">点击国家查看详情与影响力数据。</p>
              </div>
            </div>
          </main>

          {/* ─── 右侧面板 ─── */}
          <aside className="w-72 bg-[var(--bg-sidebar)] border-l-2 border-[var(--border-main)] flex flex-col overflow-y-auto shrink-0">
            <div className="border-b-2 border-[var(--border-main)]/40">
              <div className="p-3 bg-[var(--bg-panel)]/10 border-b border-[var(--border-main)]/30">
                <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">📋 情报分析</h2>
              </div>
              <CountryInfo />
            </div>
            <div className="border-b-2 border-[var(--border-main)]/40">
              <div className="p-3 bg-[var(--bg-panel)]/10 border-b border-[var(--border-main)]/30">
                <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">🎯 指挥中心</h2>
              </div>
              <ActionInput />
            </div>
            <div className="flex-1">
              <div className="p-3 bg-[var(--bg-panel)]/10 border-b border-[var(--border-main)]/30">
                <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">🔬 科技研发</h2>
              </div>
              <TechTreePanel />
            </div>
            <MultiplayerPanel
              activeRoomId={activeRoomId}
              onlineTimer={onlineTimer}
              mpMessages={mpMessages}
              mpRole={mpRole}
              onJoinRoom={handleJoinRoom}
              onLeaveRoom={handleLeaveRoom}
              onSendChat={handleSendChat}
            />
            <ApiSettings />
          </aside>
        </div>

        {/* ═══ 底部新闻条 ═══ */}
        <div className="border-t-2 border-[var(--border-main)] bg-[var(--bg-panel)] text-[var(--text-primary)] shrink-0">
          <NewsTicker />
        </div>
      </div>

      {/* Event Popup + Resolution Results */}
      <EventPopup />
      <ResolutionResults />

      {/* Victory Screen */}
      {victory && (
        <VictoryScreen
          result={victory}
          store={store}
          onRestart={() => {
            resetGame()
            setVictory(null)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
