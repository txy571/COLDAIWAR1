/**
 * @file 事件弹窗
 * @desc 自动弹出最新重要新闻，5秒自动消失，三种样式(危机红/行动琥珀/普通灰)
 *       过滤稳定性新闻和快讯类条目
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { NewsItem } from '@/types'
import { audioManager } from '@/lib/audio'


export function EventPopup() {
  const newsFeed = useGameStore(s => s.newsFeed)
  const [current, setCurrent] = useState<NewsItem | null>(null)
  const [visible, setVisible] = useState(false)

  // Show latest important news as popup
  useEffect(() => {
    if (newsFeed.length === 0) return
    const latest = newsFeed[0] // most recent is first
    if (latest.id === current?.id) return
    if (latest.headline.includes('稳定') || latest.headline.includes('快讯')) return

    setCurrent(latest)
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(timer)
  }, [newsFeed, current])

  const dismiss = useCallback(() => setVisible(false), [])

  if (!visible || !current) return null

  const isCrisis = current.headline.includes('🚨') || current.headline.includes('⚠️')
  const isAction = current.headline.includes('指令')

  return (
    <div className="fixed top-16 right-4 z-40 max-w-xs animate-slide-in">
      <div className={`border-2 shadow-xl rounded-sm text-xs ${
        isCrisis ? 'bg-red-900/90 border-red-600 text-stone-100' :
        isAction ? 'bg-stone-800/90 border-amber-600 text-stone-200' :
        'bg-stone-800/80 border-stone-600 text-stone-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
          <span className="font-bold text-[10px] tracking-wider">
            {isCrisis ? '🔴 紧急通报' : isAction ? '📋 行动报告' : '📰 最新消息'}
          </span>
          <button onClick={() => { dismiss(); audioManager.playClick(); }} className="text-white/50 hover:text-white/80 text-sm leading-none">✕</button>
        </div>
        {/* Content */}
        <div className="p-3">
          <div className="font-bold text-xs mb-1">{current.headline}</div>
          <div className="text-[10px] opacity-80">{current.summary || current.headline}</div>
          <div className="text-[8px] opacity-40 mt-1 font-mono">
            {current.year}年 · 来源: {current.bias === 'PRO_USA' ? '美国' : current.bias === 'PRO_USSR' ? '苏联' : '中立'}
          </div>
        </div>
      </div>
    </div>
  )
}
