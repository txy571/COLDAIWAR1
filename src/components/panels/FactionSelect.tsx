/**
 * @file 阵营选择界面
 * @desc 进入游戏前的美苏二选一，展示各方初始数据(预算/GDP/军事等)
 */
'use client'

import { audioManager } from '@/lib/audio'


interface FactionSelectProps {
  onSelect: (faction: 'usa' | 'ussr') => void
}

export function FactionSelect({ onSelect }: FactionSelectProps) {
  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 font-serif">
      <div className="max-w-lg w-full bg-stone-800 border-4 border-stone-600 rounded-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-stone-700">
          <h1 className="text-3xl font-bold text-stone-100 tracking-widest mb-2">冷 战</h1>
          <p className="text-stone-400 text-sm">COLD WAR · 大战略回合推演</p>
          <div className="w-16 h-0.5 bg-amber-700 mx-auto mt-4" />
          <p className="text-stone-500 text-xs mt-4 leading-relaxed">
            1945 年。世界大战的硝烟刚刚散去，世界分裂为两大阵营。
            <br />选择你的阵营，书写历史。
          </p>
        </div>

        {/* Faction cards */}
        <div className="p-6 space-y-4">
          {/* USA */}
          <button
            onClick={() => {
              audioManager.playClick()
              onSelect('usa')
            }}
            className="w-full p-4 bg-blue-950/30 border-2 border-blue-800/50 rounded-sm hover:bg-blue-900/30 hover:border-blue-600 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🇺🇸</span>
              <div>
                <div className="text-lg font-bold text-blue-300 group-hover:text-blue-200">美利坚合众国</div>
                <div className="text-xs text-stone-400 mt-1">United States of America</div>
                <div className="text-[10px] text-stone-500 mt-1">
                  经济霸权 · 海军优势 · 核垄断 · 民主灯塔
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-3 text-[9px] text-stone-500">
              <span>💰 预算 100</span>
              <span>🏭 GDP 100</span>
              <span>⚓ 海军 95</span>
              <span>☢ 核弹 3</span>
            </div>
          </button>

          {/* USSR */}
          <button
            onClick={() => {
              audioManager.playClick()
              onSelect('ussr')
            }}
            className="w-full p-4 bg-red-950/30 border-2 border-red-800/50 rounded-sm hover:bg-red-900/30 hover:border-red-600 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🇷🇺</span>
              <div>
                <div className="text-lg font-bold text-red-300 group-hover:text-red-200">苏维埃社会主义共和国联盟</div>
                <div className="text-xs text-stone-400 mt-1">Union of Soviet Socialist Republics</div>
                <div className="text-[10px] text-stone-500 mt-1">
                  世界第一陆军 · 广阔疆域 · 卫星国体系 · 战时威望
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-3 text-[9px] text-stone-500">
              <span>💰 预算 95</span>
              <span>🏭 GDP 80</span>
              <span>⚔️ 陆军 100</span>
              <span>🏛 威望 110</span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-900/50 border-t border-stone-700 text-center">
          <p className="text-[9px] text-stone-600 font-mono">
            选择阵营后进入游戏 · 未选择前游戏不会开始
          </p>
        </div>
      </div>
    </div>
  )
}
