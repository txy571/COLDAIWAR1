/**
 * @file 行动指令输入面板
 * @desc 玩家提交文本指令：4类别(经济/军事/政治/外交)+200字限制
 *       已提交后显示等待状态，每回合每方仅1条指令
 *       @todo 设计文档要求6行动点/回合系统，当前限制为1条
 *       @todo TECH类别在UI中被省略，数据模型支持但未包含
 */
'use client'

import { useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { ActionCategory, PlayerAction, Side } from '@/types'
import { audioManager } from '@/lib/audio'


const MAX_CHARS = 200

const CATEGORIES: { id: ActionCategory; label: string; icon: string }[] = [
  { id: 'ECONOMIC', label: '经济', icon: '💰' },
  { id: 'MILITARY', label: '军事', icon: '⚔️' },
  { id: 'POLITICAL', label: '政治', icon: '🏛' },
  { id: 'DIPLOMATIC', label: '外交', icon: '🤝' },
  { id: 'TECH', label: '科技', icon: '🔬' },
]

export function ActionInput() {
  const phase = useGameStore(s => s.phase)
  const side = (phase === 'USA_ACTION' ? 'usa' : phase === 'USSR_ACTION' ? 'ussr' : null) as Side | null

  if (!side) {
    return (
      <div className="p-6 text-center text-stone-400 text-xs font-serif italic">
        <p className="mb-1">等待指令...</p>
        <p className="text-[10px]">{phase === 'AI_EVENT' ? 'AI事件阶段' : phase === 'RESOLVE' ? 'AI结算中' : ''}</p>
      </div>
    )
  }

  return <ActionForm key={side + useGameStore.getState().turn} side={side} />
}

function ActionForm({ side }: { side: Side }) {
  const [category, setCategory] = useState<ActionCategory>('ECONOMIC')
  const [description, setDescription] = useState('')

  const turn = useGameStore(s => s.turn)
  const addPlayerAction = useGameStore(s => s.addPlayerAction)

  // Check if already submitted this turn
  const alreadySubmitted = useGameStore(s =>
    s.players[side].recentActions.some(a => a.turn === s.turn && a.status === 'PENDING')
  )
  const charsLeft = MAX_CHARS - description.length

  const handleSubmit = useCallback(() => {
    audioManager.playClick()
    const text = description.trim()
    if (!text || text.length > MAX_CHARS) return


    const action: PlayerAction = {
      id: `action_${Date.now()}`,
      turn: useGameStore.getState().turn,
      category,
      target: '',
      description: text,
      cost: 0,
      status: 'PENDING',
    }
    addPlayerAction(side, action)
    setDescription('')

    // Sync via multiplayer manager if active
    if (typeof window !== 'undefined' && (window as any).mpManager) {
      (window as any).mpManager.submitAction(action)
    }

    const store = useGameStore.getState()
    store.addNewsItem({
      id: `action_news_${Date.now()}`,
      turn: store.turn,
      year: store.year,
      headline: `${side === 'usa' ? '美国' : '苏联'}提交指令：${text.substring(0, 30)}`,
      summary: `${side === 'usa' ? '美国' : '苏联'}提交了${CATEGORIES.find(c => c.id === category)?.label}行动，等待AI裁判判定。`,
      bias: side === 'usa' ? 'PRO_USA' : 'PRO_USSR',
      sourceRegion: 'global',
    })
  }, [description, category, side, addPlayerAction])

  const currentActor = useGameStore(s => s.currentActor)

  if (alreadySubmitted) {
    return (
      <div className="p-3 text-xs space-y-2">
        <div className={`text-center py-2 rounded-sm border font-bold text-[10px] tracking-wider ${
          side === 'usa' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
        }`}>
          {side === 'usa' ? '🇺🇸 美国' : '🇷🇺 苏联'}
        </div>
        <div className="text-center text-[var(--text-muted)] text-[10px] italic py-3">
          ✅ 指令已提交，等待 AI 裁判判定
        </div>
        {useGameStore.getState().players[side].recentActions
          .filter(a => a.turn === turn && a.status === 'PENDING')
          .slice(0, 1)
          .map(a => (
            <div key={a.id} className="p-2 bg-[var(--bg-panel)]/60 border border-[var(--border-main)] rounded-sm text-[10px] text-[var(--text-primary)]">
              <span className="font-bold">
                {CATEGORIES.find(c => c.id === a.category)?.icon}
                {CATEGORIES.find(c => c.id === a.category)?.label}
              </span>
              <p className="mt-0.5">{a.description}</p>
            </div>
          ))
        }
      </div>
    )
  }

  return (
    <div className="p-3 text-xs space-y-2">
      {/* Side indicator */}
      <div className={`text-center py-1.5 rounded-sm border font-bold text-[10px] tracking-wider ${
        side === 'usa' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
      }`}>
        {side === 'usa' ? '🇺🇸 美国回合 — 请下达指令' : '🇷🇺 苏联回合 — 请下达指令'}
      </div>

      {/* 类别 */}
      <div className="flex gap-1">
        {CATEGORIES.map(c => (
          <button key={c.id}
            className={`flex-1 py-1.5 text-xs rounded-sm border transition-all ${
              category === c.id
                ? 'bg-[var(--border-dark)] text-[var(--text-light)] border-[var(--border-dark)] shadow-sm'
                : 'bg-[var(--bg-panel)]/40 text-[var(--text-primary)] border-[var(--border-main)] hover:bg-[var(--bg-panel)]/80'
            }`}
            onClick={() => {
              setCategory(c.id)
              audioManager.playClick()
            }}
          >{c.icon}<span className="ml-0.5 text-[9px]">{c.label}</span></button>
        ))}
      </div>

      {/* 输入框 */}
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder={`输入${CATEGORIES.find(c => c.id === category)?.label}指令...（200字以内）\n例如："向西德提供经济援助"`}
        className="w-full h-20 text-[10px] bg-[var(--bg-panel)]/40 border border-[var(--border-main)] rounded-sm p-2 resize-none outline-none focus:border-[var(--border-dark)] placeholder:text-[var(--text-muted)]/50 font-mono text-[var(--text-primary)]"
        maxLength={MAX_CHARS}
      />

      {/* 字数 + 提交 */}
      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-mono ${charsLeft < 20 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
          {charsLeft} / {MAX_CHARS}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!description.trim() || description.trim().length > MAX_CHARS}
          className="brass-button px-4 py-1.5 text-xs font-bold text-stone-900 rounded-sm tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ▶ 提交给 AI 裁判
        </button>
      </div>
      <p className="text-[8px] text-[var(--text-muted)] leading-tight">每回合每方只能提交一条指令。AI裁判将根据内容判定效果。</p>
    </div>
  )
}
