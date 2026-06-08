'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { TechNode, TechCategory, TechEra, TechBranch, Side } from '@/types'
import { audioManager } from '@/lib/audio'

// Branch descriptions and icons
const BRANCHES: { id: TechBranch; label: string; icon: string }[] = [
  { id: 'NUCLEAR', label: '核技术', icon: '☢️' },
  { id: 'AEROSPACE', label: '航空航天', icon: '🚀' },
  { id: 'ELECTRONICS', label: '电子技术', icon: '📡' },
  { id: 'INDUSTRY', label: '工业技术', icon: '🏭' },
  { id: 'COMPUTING', label: '计算机', icon: '💻' },
  { id: 'WEAPONS', label: '先进武器', icon: '⚔️' },
]

const ERAS: { id: TechEra; label: string; year: string }[] = [
  { id: 'ERA0_ATOMIC', label: '原子时代', year: '1945-1949' },
  { id: 'ERA1_MISSILE', label: '导弹时代', year: '1950-1959' },
  { id: 'ERA2_SPACE', label: '太空时代', year: '1960-1969' },
  { id: 'ERA3_COMPUTER', label: '计算机时代', year: '1970-1979' },
  { id: 'ERA4_INFORMATION', label: '信息时代', year: '1980-1989' },
  { id: 'ERA5_POST_COLD', label: '冷战后时代', year: '1990-1999' },
  { id: 'ERA6_INTELLIGENCE', label: '智能时代', year: '2000+' },
]

interface TechTreeModalProps {
  onClose: () => void
}

export function TechTreeModal({ onClose }: TechTreeModalProps) {
  const [side, setSide] = useState<Side>('usa')
  const [filterCategory, setFilterCategory] = useState<TechCategory | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  
  const year = useGameStore(s => s.year)
  const currentEra = useGameStore(s => s.currentEra)
  const techTrees = useGameStore(s => s.techTrees)
  const researchTech = useGameStore(s => s.researchTech)
  const calculateResearchCost = useGameStore(s => s.calculateResearchCost)
  const modifyBudget = useGameStore(s => s.modifyBudget)
  const budget = useGameStore(s => s.players[side].budget)

  const tree = techTrees[side]

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return tree.find(n => n.id === selectedNodeId) || null
  }, [selectedNodeId, tree])

  const theme = useMemo(() => {
    switch (currentEra) {
      case 'POST_WW2':
        return {
          bg: 'bg-[#f5f0e8] text-stone-900 border-[#8b7355] font-serif',
          headerBg: 'bg-[#dfd9cb] border-[#8b7355]',
          canvasBg: 'bg-[#fcf8f2] border-stone-300',
          sidebarBg: 'bg-[#e9e0cd] border-[#8b7355] text-stone-850',
          nodeBgLocked: 'border-stone-400 bg-stone-300/40 text-stone-500 opacity-50',
          nodeBgUnlocked: 'border-stone-600 bg-[#f5f0e8] hover:border-amber-700 text-stone-850',
          nodeBgProgress: 'border-amber-600 bg-amber-50 shadow-[0_0_8px_rgba(217,119,6,0.15)] text-stone-850',
          nodeBgResearched: 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
          buttonClass: 'bg-[#8b7355] hover:bg-[#725e45] text-stone-100 border border-[#5c4c37] rounded-sm font-bold',
          lineColor: '#8b7355',
        }
      case 'IRON_CURTAIN':
        return {
          bg: 'bg-black text-[#00ff66] border-[#005511] font-mono shadow-[0_0_20px_rgba(0,255,100,0.15)]',
          headerBg: 'bg-[#051505] border-[#005511]',
          canvasBg: 'bg-[#000a00] border-[#003300]',
          sidebarBg: 'bg-[#030d03] border-[#005511] text-[#00ff66] shadow-[inset_0_0_15px_rgba(0,255,0,0.1)]',
          nodeBgLocked: 'border-stone-900 bg-stone-950 text-stone-700 opacity-40',
          nodeBgUnlocked: 'border-[#00aa44] bg-[#001100] hover:border-[#00ff66] text-[#00dd55]',
          nodeBgProgress: 'border-[#ffaa00] bg-[#1a1100] text-[#ffcc00] animate-pulse',
          nodeBgResearched: 'border-[#00ff66] bg-[#002200] text-[#33ff88] shadow-[0_0_10px_rgba(0,255,100,0.2)]',
          buttonClass: 'bg-[#004411] hover:bg-[#006622] text-[#00ff66] border border-[#00ff66]/30 rounded-sm font-bold font-mono',
          lineColor: '#00aa44',
        }
      case 'INFO_AGE':
      default:
        return {
          bg: 'bg-stone-950 text-cyan-200 border-cyan-800 font-sans shadow-2xl',
          headerBg: 'bg-stone-900/90 border-cyan-950',
          canvasBg: 'bg-stone-950/80 border-cyan-950/40',
          sidebarBg: 'bg-stone-900/70 border-cyan-950/80 text-cyan-100 backdrop-blur-md',
          nodeBgLocked: 'border-stone-850 bg-stone-950/40 text-stone-600 opacity-30',
          nodeBgUnlocked: 'border-cyan-800/80 bg-stone-900/60 hover:border-cyan-400 text-cyan-200',
          nodeBgProgress: 'border-amber-500/60 bg-amber-950/10 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
          nodeBgResearched: 'border-emerald-500 bg-emerald-950/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
          buttonClass: 'bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-sm font-bold',
          lineColor: '#0891b2',
        }
    }
  }, [currentEra])
  
  // Ref for the scrollable container to compute relative coordinates
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([])

  // Trigger SVG line update on mount, side change, filter change, or window resize
  const updateLines = () => {
    const container = containerRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()

    const newLines: typeof lines = []
    for (const node of tree) {
      // Skip if this node is hidden by category filter
      if (filterCategory && node.category !== filterCategory) continue

      const el = document.getElementById(`tech-node-${node.id}`)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const x = rect.left - containerRect.left + rect.width / 2 + container.scrollLeft
      const y = rect.top - containerRect.top + rect.height / 2 + container.scrollTop

      for (const pId of node.prerequisites) {
        const pNode = tree.find(t => t.id === pId)
        if (pNode && filterCategory && pNode.category !== filterCategory) continue

        const pEl = document.getElementById(`tech-node-${pId}`)
        if (!pEl) continue
        const pRect = pEl.getBoundingClientRect()
        const px = pRect.left - containerRect.left + pRect.width / 2 + container.scrollLeft
        const py = pRect.top - containerRect.top + pRect.height / 2 + container.scrollTop
        newLines.push({ x1: px, y1: py, x2: x, y2: y })
      }
    }
    setLines(newLines)
  }

  useEffect(() => {
    const timer = setTimeout(updateLines, 100)
    window.addEventListener('resize', updateLines)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateLines)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, filterCategory, tree])

  const handleInvest = (nodeId: string, amount: number = 10) => {
    const node = tree.find(n => n.id === nodeId)
    if (!node || node.researched) return
    const cost = calculateResearchCost(node, year)
    if (cost === Infinity) return

    const remainingProgress = node.cost - (node.researchProgress ?? 0)
    const actualInvestment = Math.min(amount, budget, remainingProgress)
    
    if (actualInvestment <= 0) return

    modifyBudget(side, -actualInvestment)
    researchTech(side, nodeId, actualInvestment)
    audioManager.playClick()
    setTimeout(updateLines, 50)
  }

  // Clear selected node if side changes to prevent mismatch
  useEffect(() => {
    setSelectedNodeId(null)
  }, [side])

  return (
    <div className={`fixed inset-0 z-50 w-screen h-screen flex flex-col overflow-hidden transition-all duration-300 ${theme.bg}`}>
      
      {/* Modal Header */}
      <header className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${theme.headerBg}`}>
        <div className="flex items-center gap-6">
          <h2 className="text-sm sm:text-base font-bold tracking-widest flex items-center gap-2">
            🔬 科技研发中心 <span className="text-xs font-mono">({year} 年)</span>
          </h2>
          
          {/* Side Toggle */}
          <div className="flex bg-stone-850/80 rounded-sm overflow-hidden border border-stone-700/50">
            <button
              className={`px-3 py-1 text-[11px] font-bold font-mono tracking-wider transition-colors ${
                side === 'usa' ? 'bg-blue-900/60 text-blue-300' : 'text-stone-400 hover:text-stone-200'
              }`} onClick={() => { setSide('usa'); audioManager.playClick(); }}
            >
              🇺🇸 美国研发树
            </button>
            <button
              className={`px-3 py-1 text-[11px] font-bold font-mono tracking-wider transition-colors ${
                side === 'ussr' ? 'bg-red-900/60 text-red-300 border-l border-stone-700/50' : 'text-stone-400 hover:text-stone-200'
              }`} onClick={() => { setSide('ussr'); audioManager.playClick(); }}
            >
              🇷🇺 苏联研发树
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-1">
            <button
              className={`px-2.5 py-1 text-[10px] rounded-sm border font-mono tracking-wider transition-colors ${
                !filterCategory ? 'bg-stone-700 text-stone-100 border-stone-600' : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
              }`} onClick={() => { setFilterCategory(null); audioManager.playClick(); }}
            >
              全部
            </button>
            {[
              { id: 'MILITARY', label: '军事', icon: '⚔️' },
              { id: 'CIVILIAN', label: '民生', icon: '🏘️' },
              { id: 'SOCIOLOGY', label: '社会', icon: '📚' }
            ].map(c => (
              <button
                key={c.id}
                className={`px-2.5 py-1 text-[10px] rounded-sm border font-mono tracking-wider transition-colors flex items-center gap-1 ${
                  filterCategory === c.id ? 'bg-stone-700 text-stone-100 border-stone-600' : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
                }`} onClick={() => { setFilterCategory(c.id as TechCategory); audioManager.playClick(); }}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Budget Display */}
          <div className="text-xs font-mono bg-stone-800/40 px-3 py-1.5 border border-stone-700/40 rounded-sm">
            资金预算: <span className="font-bold text-amber-400">${budget}</span>
          </div>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 text-xs font-bold border transition-colors flex items-center gap-1.5 ${theme.buttonClass}`}
          >
            <span>✕</span>
            <span>返回推演</span>
          </button>
        </div>
      </header>

        {/* Main Body Split Panel */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Scrollable Tree Canvas Container */}
          <div 
            ref={containerRef}
            className={`flex-1 overflow-auto relative p-6 transition-all duration-300 ${theme.canvasBg}`}
            style={{ minHeight: '400px' }}
          >
            {/* SVG Connectors Overlay */}
            <svg className="absolute top-0 left-0 w-[1760px] h-[940px] pointer-events-none z-0">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 2 L 10 5 L 0 8 z" fill={theme.lineColor} />
                </marker>
              </defs>
              {lines.map((line, i) => (
                <line
                  key={i}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={theme.lineColor}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  markerEnd="url(#arrow)"
                  opacity={0.5}
                />
              ))}
            </svg>

            {/* Grid Layout (7 Columns × 6 Rows) */}
            <div className="relative z-10 w-[1700px] flex flex-col gap-6">
              
              {/* Era Column Headers (Sticky Top Row) */}
              <div className={`grid grid-cols-[100px_repeat(7,200px)] gap-4 sticky top-0 z-30 py-2 border-b shadow-sm ${
                currentEra === 'POST_WW2' ? 'bg-[#dfd9cb] border-stone-400' :
                currentEra === 'IRON_CURTAIN' ? 'bg-[#051505] border-green-900/60' : 'bg-stone-950/95 border-cyan-950'
              }`}>
                {/* Sticky Top-Left Corner */}
                <div className={`sticky left-0 top-0 z-40 py-2 ${
                  currentEra === 'POST_WW2' ? 'bg-[#dfd9cb]' :
                  currentEra === 'IRON_CURTAIN' ? 'bg-[#051505]' : 'bg-stone-950'
                }`} />
                {ERAS.map(era => (
                  <div key={era.id} className={`text-center py-2 rounded-sm shadow-sm flex flex-col justify-center border ${
                    currentEra === 'POST_WW2' ? 'bg-[#f5f0e8] border-[#8b7355]/40 text-stone-850 font-serif' :
                    currentEra === 'IRON_CURTAIN' ? 'bg-black border-green-800/60 text-green-400 font-mono' :
                    'bg-stone-900 border-stone-800 text-stone-100 font-sans'
                  }`}>
                    <span className="text-[10px] font-bold tracking-wider text-amber-500 font-mono">{era.label}</span>
                    <span className="text-[9px] opacity-60 font-mono mt-0.5">{era.year}</span>
                  </div>
                ))}
              </div>

              {/* Branch Rows */}
              {BRANCHES.map(branch => (
                <div key={branch.id} className="grid grid-cols-[100px_repeat(7,200px)] gap-4 items-center min-h-[100px]">
                  
                  {/* Row Header (Branch - Sticky Left Column) */}
                  <div className={`sticky left-0 z-20 p-2 rounded-sm text-center flex flex-col justify-center h-full shadow-md border-r ${
                    currentEra === 'POST_WW2' ? 'bg-[#dfd9cb] border-[#8b7355]/30 text-stone-900 font-serif' :
                    currentEra === 'IRON_CURTAIN' ? 'bg-[#051505] border-green-800/50 text-[#00ff66] font-mono' :
                    'bg-stone-900 border-stone-850 text-stone-200 font-sans'
                  }`}>
                    <span className="text-base">{branch.icon}</span>
                    <span className="text-[9px] font-bold mt-1 tracking-wide">{branch.label}</span>
                  </div>

                  {/* Grid Cells per Era */}
                  {ERAS.map(era => {
                    const cellNodes = tree.filter(n => n.era === era.id && n.branch === branch.id)
                    
                    return (
                      <div key={era.id} className={`flex flex-col gap-2 p-1.5 rounded-sm min-h-[90px] justify-center border ${
                        currentEra === 'POST_WW2' ? 'bg-[#dfd9cb]/10 border-stone-300' :
                        currentEra === 'IRON_CURTAIN' ? 'bg-[#051505]/30 border-green-950/60' : 'bg-stone-900/10 border-stone-850/60'
                      }`}>
                        {cellNodes.map(node => {
                          const cost = calculateResearchCost(node, year)
                          const isLocked = cost === Infinity
                          const progress = (node.researchProgress ?? 0) / node.cost
                          const isFilteredOut = filterCategory && node.category !== filterCategory

                          if (isFilteredOut) {
                            return (
                              <div 
                                key={node.id} 
                                className="p-1 rounded-sm border border-stone-800/20 bg-stone-900/5 text-stone-600 text-[8px] text-center opacity-25 select-none"
                              >
                                {node.name}
                              </div>
                            )
                          }

                          // Visual states based on node status
                          let stateClass = ''
                          let statusBadge = null
                          const isSelected = selectedNodeId === node.id

                          if (node.researched) {
                            stateClass = theme.nodeBgResearched
                            statusBadge = <span className="text-[8px] px-1 py-0.5 rounded-sm font-bold opacity-80">✓ 已完成</span>
                          } else if (isLocked) {
                            stateClass = theme.nodeBgLocked
                            statusBadge = <span className="text-[8px] px-1 py-0.5 rounded-sm opacity-60">🔒 {node.yearRequirement}</span>
                          } else if ((node.researchProgress ?? 0) > 0) {
                            stateClass = theme.nodeBgProgress + ' cursor-pointer'
                            statusBadge = <span className="text-[8px] px-1 py-0.5 rounded-sm font-bold animate-pulse">⚙️ {Math.round(progress * 100)}%</span>
                          } else {
                            stateClass = theme.nodeBgUnlocked + ' cursor-pointer'
                            statusBadge = <span className="text-[8px] px-1 py-0.5 rounded-sm font-bold">💡 可研发</span>
                          }

                          // Selected ring styling
                          if (isSelected) {
                            stateClass += currentEra === 'POST_WW2' ? ' ring-2 ring-[#8b7355] border-[#8b7355] shadow-md scale-[1.02]' :
                                         currentEra === 'IRON_CURTAIN' ? ' ring-2 ring-[#00ff66] border-[#00ff66] shadow-[0_0_12px_rgba(0,255,100,0.3)] scale-[1.02]' :
                                         ' ring-2 ring-cyan-400 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] scale-[1.02]'
                          }

                          return (
                            <div
                              id={`tech-node-${node.id}`}
                              key={node.id}
                              className={`p-2 rounded-sm border text-[9px] select-none transition-all ${stateClass}`}
                              onClick={() => {
                                audioManager.playClick()
                                setSelectedNodeId(node.id)
                              }}
                            >
                              <div className="font-bold truncate text-[10px]" title={node.name}>{node.name}</div>
                              
                              <div className="flex justify-between items-center mt-1.5">
                                {statusBadge}
                                <span className="text-[8px] opacity-60 font-mono">
                                  {node.category === 'MILITARY' ? '⚔️' : node.category === 'CIVILIAN' ? '🏘️' : '📚'}
                                </span>
                              </div>

                              {!node.researched && !isLocked && (
                                <div className="mt-1.5 space-y-0.5">
                                  <div className="h-1 bg-stone-850/50 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-300 ${
                                      currentEra === 'POST_WW2' ? 'bg-[#8b7355]' :
                                      currentEra === 'IRON_CURTAIN' ? 'bg-[#00ff66]' : 'bg-cyan-500'
                                    }`} style={{ width: `${progress * 100}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Research Lab Details Panel */}
          <div className={`w-80 border-l shrink-0 flex flex-col p-5 transition-all duration-300 ${theme.sidebarBg}`}>
            <h3 className={`text-xs font-bold tracking-wider mb-4 border-b pb-2 flex items-center gap-2 ${
              currentEra === 'POST_WW2' ? 'border-stone-400/50' :
              currentEra === 'IRON_CURTAIN' ? 'border-green-800/50' : 'border-cyan-900/50'
            }`}>
              🔬 <span>{currentEra === 'POST_WW2' ? '国家科研所' : currentEra === 'IRON_CURTAIN' ? '莫斯科国家实验室' : 'A.I. 核心计算所'}</span>
            </h3>

            {selectedNode ? (
              <div className="flex-1 flex flex-col justify-between space-y-4 overflow-y-auto pr-1">
                <div className="space-y-4">
                  {/* Title & Branch info */}
                  <div>
                    <h4 className={`text-sm font-bold leading-tight ${
                      currentEra === 'POST_WW2' ? 'text-stone-850' :
                      currentEra === 'IRON_CURTAIN' ? 'text-[#00ff66] text-glow' : 'text-cyan-300'
                    }`}>{selectedNode.name}</h4>
                    <div className="flex justify-between items-center mt-1 text-[8px] opacity-75 font-mono">
                      <span>ID: {selectedNode.id}</span>
                      <span>{BRANCHES.find(b => b.id === selectedNode.branch)?.label}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex gap-2">
                    {selectedNode.researched ? (
                      <span className="px-2 py-0.5 text-[8px] font-bold rounded-sm bg-emerald-900/20 text-emerald-400 border border-emerald-800/40">
                        ✅ 研发已完成
                      </span>
                    ) : calculateResearchCost(selectedNode, year) === Infinity ? (
                      <span className="px-2 py-0.5 text-[8px] font-bold rounded-sm bg-red-900/20 text-red-400 border border-red-800/40">
                        🔒 项目锁闭 (时代未至)
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-sm border ${
                        (selectedNode.researchProgress || 0) > 0 
                          ? 'bg-amber-900/20 text-amber-400 border-amber-800/40 animate-pulse' 
                          : 'bg-stone-800/80 text-stone-300 border-stone-700/50'
                      }`}>
                        {(selectedNode.researchProgress || 0) > 0 ? '⚙️ 研发中' : '💡 可开展研究'}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className={`text-[10px] leading-relaxed p-2.5 rounded-sm border ${
                    currentEra === 'POST_WW2' ? 'bg-[#f5f0e8] border-[#8b7355]/30 text-stone-750' :
                    currentEra === 'IRON_CURTAIN' ? 'bg-stone-950 border-[#003300]/80 text-green-300/90 shadow-inner' :
                    'bg-stone-950/60 border-cyan-950/60 text-stone-300'
                  }`}>
                    {selectedNode.description}
                  </p>

                  {/* Effects list */}
                  {selectedNode.effects && selectedNode.effects.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold opacity-75">对国家属性的修正与加成:</div>
                      <div className={`p-2.5 rounded-sm border space-y-1 font-mono text-[9px] ${
                        currentEra === 'POST_WW2' ? 'bg-[#f5f0e8] border-stone-300' :
                        currentEra === 'IRON_CURTAIN' ? 'bg-stone-950 border-[#003300]' :
                        'bg-stone-950/30 border-cyan-950'
                      }`}>
                        {selectedNode.effects.map((eff, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="opacity-70">
                              {eff.target
                                .replace('military.army', '陆军战力')
                                .replace('military.navy', '海军战力')
                                .replace('military.airforce', '空军战力')
                                .replace('military.nuclearArsenal', '核导弹数')
                                .replace('economy.gdp', 'GDP 经济规模')
                                .replace('economy.industry', '重工业基础')
                                .replace('society.stability', '社会稳定性')
                                .replace('society.morale', '民众士气')}
                            </span>
                            <span className="font-bold text-emerald-400">
                              {eff.modifier === 'add' ? `+${eff.value}` : eff.modifier === 'set' ? `= ${eff.value}` : `* ${eff.value}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prerequisites */}
                  {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
                    <div className="space-y-1 text-[9px]">
                      <span className="opacity-75">前置路线技术需求:</span>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {selectedNode.prerequisites.map(pId => {
                          const pNode = tree.find(t => t.id === pId)
                          return (
                            <button
                              key={pId}
                              onClick={() => {
                                audioManager.playClick()
                                setSelectedNodeId(pId)
                              }}
                              className={`px-2 py-0.5 text-[8px] rounded-sm border transition-colors ${
                                pNode?.researched 
                                  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40' 
                                  : 'bg-stone-800 text-stone-400 border-stone-700/40 hover:text-stone-300'
                              }`}
                            >
                              {pNode?.name || pId} {pNode?.researched ? '✓' : '✗'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Interactive actions */}
                <div className="space-y-2 pt-4 border-t border-dashed border-stone-700/60">
                  {!selectedNode.researched && calculateResearchCost(selectedNode, year) !== Infinity ? (
                    <>
                      <div className="space-y-1 font-mono text-[9px] p-2 bg-stone-950/30 rounded-sm">
                        <div className="flex justify-between">
                          <span className="opacity-70">研发总所需:</span>
                          <span>{selectedNode.cost} RP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-70">已投入进展:</span>
                          <span className="text-amber-400 font-bold">{selectedNode.researchProgress || 0} / {selectedNode.cost} RP</span>
                        </div>
                        <div className="flex justify-between border-t border-stone-850/60 pt-1 mt-1 font-bold">
                          <span className="opacity-70">完成需资金:</span>
                          <span className="text-amber-500">${selectedNode.cost - (selectedNode.researchProgress || 0)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {/* Invest 10 */}
                        <button
                          disabled={budget < 10}
                          onClick={() => handleInvest(selectedNode.id, 10)}
                          className={`w-full py-2 text-[10px] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${theme.buttonClass}`}
                        >
                          🔬 投入 $10 研发资金
                        </button>

                        {/* Invest All */}
                        <button
                          disabled={budget <= 0}
                          onClick={() => handleInvest(selectedNode.id, selectedNode.cost - (selectedNode.researchProgress || 0))}
                          className="w-full py-2 text-[10px] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-700 text-white rounded-sm border border-amber-800/40 font-bold font-mono"
                        >
                          ⚡ 一键投入完成该研发
                        </button>
                      </div>
                    </>
                  ) : selectedNode.researched ? (
                    <div className="text-center py-2.5 bg-emerald-950/20 border border-emerald-800/40 text-emerald-400 font-bold text-[10px] rounded-sm">
                      ✅ 研发已完成并列入史册
                    </div>
                  ) : (
                    <div className="space-y-1 p-2.5 bg-red-950/20 border border-red-900/20 text-red-400 text-[9px] rounded-sm">
                      <div className="font-bold">🔒 技术封锁警告:</div>
                      <p className="opacity-80 leading-normal">
                        该项目要求处于 **{ERAS.find(e => e.id === selectedNode.era)?.label} ({selectedNode.yearRequirement}年)** 才能解锁研发。当前推演时间偏离过远。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty state (No tech selected) */
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-4 opacity-75">
                {currentEra === 'POST_WW2' ? (
                  <>
                    <div className="text-4xl text-stone-400 font-serif">📂</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-stone-850">机密科研卷卷</h4>
                      <p className="text-[9px] text-stone-500 leading-normal">请在左侧点击任意科技节点，以调阅其可行性报告和研发效益清单。</p>
                    </div>
                  </>
                ) : currentEra === 'IRON_CURTAIN' ? (
                  <>
                    <div className="text-4xl animate-pulse text-[#00ff66]">📡</div>
                    <div className="space-y-2 font-mono text-[9px]">
                      <h4 className="font-bold text-[#00ff66]">READY. AWAITING INPUT.</h4>
                      <p className="text-green-500/80 leading-normal">
                        [系统提示]：请在左侧网格中选定所需启动的研究模块。
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl text-cyan-400 animate-bounce">🔬</div>
                    <div className="space-y-2 text-[9px]">
                      <h4 className="font-bold text-cyan-400">科技网格联接就绪</h4>
                      <p className="text-stone-400 leading-normal">
                        请在左侧拓扑图中选择一个科技奇点，以激活参数微调与一键计算研发功能。
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
    </div>
  )
}
