/**
 * @file 科技树入口面板
 * @desc 侧边栏中简洁的科技树入口按钮，点击弹出全屏科技树 Modal
 */
'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { audioManager } from '@/lib/audio'
import { TechTreeModal } from './TechTreeModal'

export function TechTreePanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [side, setSide] = useState<'usa' | 'ussr'>('usa')

  const year = useGameStore(s => s.year)
  const budget = useGameStore(s => s.players[side].budget)

  return (
    <div className="p-3 space-y-3">
      {/* Side toggle */}
      <div className="flex bg-stone-300/50 rounded-sm overflow-hidden border border-stone-400/60">
        <button
          className={`flex-1 py-1.5 text-[10px] font-bold font-mono tracking-wider transition-colors ${
            side === 'usa' ? 'bg-blue-900/30 text-blue-700 border-r border-stone-400/60' : 'text-stone-500 hover:text-stone-700'
          }`} onClick={() => { setSide('usa'); audioManager.playClick(); }}
        >🇺🇸 美国</button>
        <button
          className={`flex-1 py-1.5 text-[10px] font-bold font-mono tracking-wider transition-colors ${
            side === 'ussr' ? 'bg-red-900/30 text-red-700' : 'text-stone-500 hover:text-stone-700'
          }`} onClick={() => { setSide('ussr'); audioManager.playClick(); }}
        >🇷🇺 苏联</button>
      </div>

      <div className="text-[10px] text-stone-500 font-mono flex justify-between px-1">
        <span>年份: <span className="font-bold text-stone-750">{year} 年</span></span>
        <span>资金: <span className="font-bold text-amber-600">${budget}</span></span>
      </div>

      <button
        onClick={() => { setIsOpen(true); audioManager.playClick(); }}
        className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-stone-100 border border-stone-700 rounded-sm font-bold tracking-wider transition-all text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      >
        <span className="text-base">🔬</span>
        <span>打开科技研发中心</span>
        <span className="text-[8px] text-stone-400 ml-1">⌨ 全屏</span>
      </button>

      {isOpen && (
        <TechTreeModal onClose={() => setIsOpen(false)} />
      )}
    </div>
  )
}
