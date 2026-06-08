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
  
  const year = useGameStore(s => s.year)
  const techTrees = useGameStore(s => s.techTrees)
  const researchTech = useGameStore(s => s.researchTech)
  const calculateResearchCost = useGameStore(s => s.calculateResearchCost)
  const modifyBudget = useGameStore(s => s.modifyBudget)
  const budget = useGameStore(s => s.players[side].budget)

  const tree = techTrees[side]
  
  // Ref for the scrollable container to compute relative coordinates
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([])
  const [hoveredNode, setHoveredNode] = useState<TechNode | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

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
    // Add small delay to ensure elements are fully painted before measuring
    const timer = setTimeout(updateLines, 100)
    window.addEventListener('resize', updateLines)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateLines)
    }
  }, [side, filterCategory, tree])

  const handleInvest = (nodeId: string) => {
    const node = tree.find(n => n.id === nodeId)
    if (!node || node.researched) return
    const cost = calculateResearchCost(node, year)
    if (cost === Infinity) return
    const investment = 10
    if (budget < investment) return
    modifyBudget(side, -investment)
    researchTech(side, nodeId, investment)
    audioManager.playClick()
    setTimeout(updateLines, 50)
  }

  const handleNodeMouseEnter = (node: TechNode, e: React.MouseEvent) => {
    setHoveredNode(node)
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({
      x: rect.left + rect.width + 10,
      y: rect.top - 20
    })
  }

  const handleNodeMouseLeave = () => {
    setHoveredNode(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-7xl h-[90vh] bg-stone-900 border-2 border-stone-700 rounded-sm shadow-2xl flex flex-col overflow-hidden text-stone-100">
        
        {/* Modal Header */}
        <header className="px-6 py-4 border-b border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-bold tracking-widest flex items-center gap-2">
              🔬 科技研发中心 <span className="text-xs text-stone-500 font-mono">({year} 年)</span>
            </h2>
            
            {/* Side Toggle */}
            <div className="flex bg-stone-800 rounded-sm overflow-hidden border border-stone-700">
              <button
                className={`px-4 py-1 text-xs font-bold font-mono tracking-wider transition-colors ${
                  side === 'usa' ? 'bg-blue-900/60 text-blue-300' : 'text-stone-400 hover:text-stone-200'
                }`} onClick={() => { setSide('usa'); audioManager.playClick(); }}
              >
                🇺🇸 美国研发树
              </button>
              <button
                className={`px-4 py-1 text-xs font-bold font-mono tracking-wider transition-colors ${
                  side === 'ussr' ? 'bg-red-900/60 text-red-300 border-l border-stone-700' : 'text-stone-400 hover:text-stone-200'
                }`} onClick={() => { setSide('ussr'); audioManager.playClick(); }}
              >
                🇷🇺 苏联研发树
              </button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-1.5">
              <button
                className={`px-3 py-1 text-xs rounded-sm border font-mono tracking-wider transition-colors ${
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
                  className={`px-3 py-1 text-xs rounded-sm border font-mono tracking-wider transition-colors flex items-center gap-1 ${
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
            <div className="text-xs font-mono bg-stone-800/80 px-3 py-1.5 border border-stone-700 rounded-sm">
              资金预算: <span className="font-bold text-amber-400">${budget}</span>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 text-xl font-bold font-mono px-2 py-1 leading-none rounded hover:bg-stone-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Scrollable Tree Canvas Container */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto relative p-6 bg-stone-950/80"
          style={{ minHeight: '400px' }}
        >
          {/* SVG Connectors Overlay */}
          <svg className="absolute top-0 left-0 w-[1760px] h-[940px] pointer-events-none z-0">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 10 5 L 0 8 z" fill="#44403c" />
              </marker>
            </defs>
            {lines.map((line, i) => (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#57534e"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                markerEnd="url(#arrow)"
                opacity={0.6}
              />
            ))}
          </svg>

          {/* Grid Layout (7 Eras columns × 6 Branches rows) */}
          <div className="relative z-10 w-[1700px] flex flex-col gap-6">
            
            {/* Era Column Headers */}
            <div className="grid grid-cols-[100px_repeat(7,200px)] gap-4">
              <div /> {/* Top-left empty corner */}
              {ERAS.map(era => (
                <div key={era.id} className="text-center bg-stone-900 border border-stone-800 py-2 rounded-sm shadow-sm flex flex-col justify-center">
                  <span className="text-[11px] font-bold tracking-wider text-amber-500 font-mono">{era.label}</span>
                  <span className="text-[9px] text-stone-500 font-mono mt-0.5">{era.year}</span>
                </div>
              ))}
            </div>

            {/* Branch Rows */}
            {BRANCHES.map(branch => (
              <div key={branch.id} className="grid grid-cols-[100px_repeat(7,200px)] gap-4 items-center min-h-[100px]">
                
                {/* Row Header (Branch) */}
                <div className="bg-stone-900 border border-stone-800 p-2 rounded-sm text-center flex flex-col justify-center h-full">
                  <span className="text-lg">{branch.icon}</span>
                  <span className="text-[10px] font-bold text-stone-300 mt-1">{branch.label}</span>
                </div>

                {/* Grid Cells per Era */}
                {ERAS.map(era => {
                  const cellNodes = tree.filter(n => n.era === era.id && n.branch === branch.id)
                  
                  return (
                    <div key={era.id} className="flex flex-col gap-2 p-1.5 bg-stone-900/20 border border-stone-850 rounded-sm min-h-[90px] justify-center">
                      {cellNodes.map(node => {
                        const cost = calculateResearchCost(node, year)
                        const isLocked = cost === Infinity
                        const progress = (node.researchProgress ?? 0) / node.cost
                        const isFilteredOut = filterCategory && node.category !== filterCategory

                        if (isFilteredOut) {
                          return (
                            <div 
                              key={node.id} 
                              className="p-1 rounded-sm border border-stone-800/40 bg-stone-900/10 text-stone-700 text-[9px] text-center opacity-30 select-none"
                            >
                              {node.name}
                            </div>
                          )
                        }

                        // Determine visual state
                        let stateClass = ''
                        let statusBadge = null

                        if (node.researched) {
                          stateClass = 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.15)] text-emerald-200'
                          statusBadge = <span className="text-[8px] bg-emerald-900/30 text-emerald-400 px-1 py-0.5 rounded-sm">✅ 已完成</span>
                        } else if (isLocked) {
                          stateClass = 'border-stone-800 bg-stone-950/40 opacity-40 grayscale'
                          statusBadge = <span className="text-[8px] bg-stone-850 text-stone-500 px-1 py-0.5 rounded-sm">🔒 {node.yearRequirement}</span>
                        } else if ((node.researchProgress ?? 0) > 0) {
                          stateClass = 'border-amber-500/60 bg-amber-950/15 shadow-[0_0_8px_rgba(245,158,11,0.1)] hover:border-amber-400 text-amber-200 cursor-pointer'
                          statusBadge = <span className="text-[8px] bg-amber-900/30 text-amber-400 px-1 py-0.5 rounded-sm animate-pulse">⚙️ 研发中</span>
                        } else {
                          stateClass = 'border-stone-700 bg-stone-800 hover:border-amber-500/80 hover:shadow-[0_0_8px_rgba(245,158,11,0.15)] text-stone-200 cursor-pointer'
                          statusBadge = <span className="text-[8px] bg-stone-700/50 text-stone-400 px-1 py-0.5 rounded-sm">💡 可研发</span>
                        }

                        return (
                          <div
                            id={`tech-node-${node.id}`}
                            key={node.id}
                            className={`p-2 rounded-sm border text-[10px] select-none transition-all ${stateClass}`}
                            onClick={() => {
                              if (!isLocked && !node.researched) {
                                handleInvest(node.id)
                              }
                            }}
                            onMouseEnter={(e) => handleNodeMouseEnter(node, e)}
                            onMouseLeave={handleNodeMouseLeave}
                          >
                            <div className="font-bold truncate text-[10px]" title={node.name}>{node.name}</div>
                            
                            <div className="flex justify-between items-center mt-1.5">
                              {statusBadge}
                              <span className="text-[8px] text-stone-500 font-mono">{node.category === 'MILITARY' ? '⚔️' : node.category === 'CIVILIAN' ? '🏘️' : '📚'}</span>
                            </div>

                            {!node.researched && !isLocked && (
                              <div className="mt-1.5 space-y-0.5">
                                <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
                                </div>
                                <div className="flex justify-between text-[8px] text-stone-500 font-mono">
                                  <span>{node.researchProgress ?? 0}/{node.cost} RP</span>
                                  <span>预算 ${budget}</span>
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

          {/* Floating Details Tooltip */}
          {hoveredNode && (
            <div 
              className="fixed z-50 w-72 bg-stone-900 border border-stone-700 p-3 rounded-sm shadow-2xl text-[10px] space-y-2 pointer-events-none"
              style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
            >
              <div className="flex justify-between items-start border-b border-stone-850 pb-1.5">
                <div>
                  <h4 className="font-bold text-amber-500 text-xs">{hoveredNode.name}</h4>
                  <p className="text-[8px] text-stone-500 font-mono mt-0.5">{hoveredNode.id}</p>
                </div>
                <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-stone-800 text-stone-400">
                  {hoveredNode.category === 'MILITARY' ? '⚔️ 军事' : hoveredNode.category === 'CIVILIAN' ? '🏘️ 民生' : '📚 社会'}
                </span>
              </div>
              <p className="text-stone-300 leading-normal">{hoveredNode.description}</p>
              
              <div className="border-t border-stone-850 pt-2 space-y-1 font-mono text-[9px]">
                <div className="flex justify-between">
                  <span className="text-stone-500">基础成本:</span>
                  <span className="text-stone-300">{hoveredNode.cost} RP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">时代解锁要求:</span>
                  <span className="text-stone-300">{hoveredNode.yearRequirement} 年 ({ERAS.find(e => e.id === hoveredNode.era)?.label})</span>
                </div>
                {calculateResearchCost(hoveredNode, year) !== Infinity && !hoveredNode.researched && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">当前实际研发成本:</span>
                    <span className="text-amber-500 font-bold">{calculateResearchCost(hoveredNode, year)} RP</span>
                  </div>
                )}
                {hoveredNode.effects && hoveredNode.effects.length > 0 && (
                  <div className="border-t border-stone-850 pt-1.5 mt-1">
                    <div className="text-[8px] text-stone-500 mb-0.5">科技效果:</div>
                    {hoveredNode.effects.map((eff, idx) => (
                      <div key={idx} className="flex justify-between text-emerald-400 font-bold font-mono">
                        <span>{eff.target.replace('military.', '军事.').replace('economy.', '经济.').replace('society.', '社会.')}:</span>
                        <span>{eff.modifier === 'add' ? `+${eff.value}` : eff.modifier === 'set' ? `= ${eff.value}` : `* ${eff.value}`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
