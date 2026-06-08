/**
 * @file 科技树面板 (折叠导航版)
 * @desc 侧边栏折叠面板，展示当前国家与研发预算，并提供打开全屏可视化科技树 Canvas 的按钮
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
    <div className="p-3 text-xs space-y-3">
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
        <span>当前年份: <span className="font-bold text-stone-750">{year} 年</span></span>
        <span>可用资金: <span className="font-bold text-amber-600">${budget}</span></span>
      </div>

      <button
        onClick={() => { setIsOpen(true); audioManager.playClick(); }}
        className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-stone-100 border border-stone-750 rounded-sm font-bold tracking-wider transition-all text-[10.5px] flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:translate-y-0.5"
      >
        <span>🔬</span>
        <span>打开科技研发中心 (Visual Tree)</span>
      </button>

      {isOpen && (
        <TechTreeModal onClose={() => setIsOpen(false)} />
      )}
    </div>
  )
}
