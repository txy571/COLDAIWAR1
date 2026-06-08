/**
 * @file AI裁判裁决结果弹窗
 * @desc 通过eventBus监听resolution事件，显示CWS/影响力/预算等变化列表
 *       有驳回时显示琥珀警告，8秒自动消失
 */
'use client'

import { useState, useEffect } from 'react'
import { on } from '@/lib/eventBus'
import { audioManager } from '@/lib/audio'

export interface ResolutionChange {
  type: 'cws' | 'influence' | 'budget' | 'prestige' | 'score' | 'rejection'
  side: string
  country?: string
  delta: number
  description: string
}

export interface ResolutionEvent {
  id: string
  turn: number
  title: string
  changes: ResolutionChange[]
}

export function ResolutionResults() {
  const [visible, setVisible] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<ResolutionEvent | null>(null)

  useEffect(() => {
    return on('resolution', (event: ResolutionEvent) => {
      setCurrentEvent(event)
      setVisible(true)
      const hasRejected = event.changes.some(c => c.type === 'rejection')
      if (hasRejected) {
        audioManager.playLose()
      }
      const timer = setTimeout(() => setVisible(false), 8000)
      return () => clearTimeout(timer)
    })
  }, [])

  if (!visible || !currentEvent) return null

  const hasRejected = currentEvent.changes.some(c => c.type === 'rejection')

  return (
    <div className="fixed top-16 right-4 z-40 max-w-sm animate-slide-in">
      <div className={`border-2 shadow-xl rounded-sm text-xs ${
        hasRejected
          ? 'bg-amber-900/90 border-amber-600 text-stone-100'
          : 'bg-stone-800/90 border-stone-600 text-stone-200'
      }`}>
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
          <span className="font-bold text-[10px] tracking-wider">⚖️ AI 裁判裁决</span>
          <button onClick={() => setVisible(false)} className="text-white/50 hover:text-white/80 text-sm leading-none">✕</button>
        </div>
        <div className="p-3 space-y-1.5">
          <div className="font-bold text-xs mb-1">{currentEvent.title}</div>
          {currentEvent.changes.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span className={c.delta > 0 ? 'text-green-400' : c.delta < 0 ? 'text-red-400' : 'text-stone-400'}>
                {c.delta > 0 ? '▲' : c.delta < 0 ? '▼' : '◆'}
              </span>
              <span className="flex-1">{c.description}</span>
              {c.type !== 'rejection' && (
                <span className={`font-mono font-bold ${
                  c.delta > 0 ? 'text-green-400' : c.delta < 0 ? 'text-red-400' : 'text-stone-500'
                }`}>
                  {c.delta > 0 ? '+' : ''}{c.delta}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
