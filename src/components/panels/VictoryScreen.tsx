/**
 * @file 胜利画面
 * @desc 全屏遮罩+胜利通知：美苏比分、胜利方式叙事、战后总结(epilogue)
 *       1.5秒后自动展示历史档案风格总结，可重新开始
 */
'use client'

import { useState, useEffect } from 'react'
import type { VictoryResult } from '@/engine/victory'
import { generateEpilogue } from '@/engine/victory'
import type { GameStore } from '@/store/gameStore'
import { audioManager } from '@/lib/audio'
import { BASE_PATH } from '@/config/multiplayer'


interface VictoryScreenProps {
  result: VictoryResult
  store: GameStore
  onRestart: () => void
}

export function VictoryScreen({ result, store, onRestart }: VictoryScreenProps) {
  const [epilogue, setEpilogue] = useState('')
  const [showEpilogue, setShowEpilogue] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const localText = generateEpilogue(result, store)
    const apiKey = localStorage.getItem('ai_judge_api_key') || ''
    const provider = localStorage.getItem('ai_judge_provider') || 'openai'

    if (apiKey) {
      setLoading(true)
      const timelineSummary = store.timeline
        .filter(e => e.type === 'CRISIS' || e.type === 'MILITARY' || e.type === 'DIPLOMACY')
        .map(e => `[${e.year}年] ${e.title}`)
        .join(' ──> ')

      const getResearchedTechs = (techList: any[]) => {
        if (!techList || !Array.isArray(techList)) return []
        return techList.filter(t => t.researched).map(t => t.id)
      }

      const winningSide = result.winner || 'usa'
      const researchedTechIds = getResearchedTechs(store.techTrees?.[winningSide])

      fetch(`${BASE_PATH}/api/ai/epilogue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winner: result.winner,
          winnerName: result.winner === 'usa' ? '美利坚合众国' : '苏维埃社会主义共和国联盟',
          loserName: result.winner === 'usa' ? '苏联' : '美国',
          victoryType: result.type === 'DOMINATION' ? '支配胜利' :
                       result.type === 'SPACE' ? '太空竞赛胜利' :
                       result.type === 'NUCLEAR' ? '核威慑绝对优势' :
                       result.type === 'IDEOLOGICAL' ? '意识形态渗透' : '经济崩溃碾压',
          year: result.year,
          turn: result.turn,
          score: {
            usa: store.players.usa.victoryScore,
            ussr: store.players.ussr.victoryScore,
          },
          timelineSummary,
          researchedTechs: researchedTechIds,
          apiKey,
          provider,
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.result) {
          setEpilogue(`===== 冷战终局 · 历史档案 =====\n\n${data.result}\n\n—— 冷战 AI 历史记录员`)
        } else {
          setEpilogue(localText)
        }
        setLoading(false)
      })
      .catch(err => {
        console.warn('Failed to fetch AI epilogue:', err)
        setEpilogue(localText)
        setLoading(false)
      })
    } else {
      setEpilogue(localText)
    }

    // Auto-show epilogue after a delay
    const timer = setTimeout(() => setShowEpilogue(true), 1500)
    return () => clearTimeout(timer)
  }, [result, store])

  const winnerName = result.winner === 'usa' ? '美国' : '苏联'
  const isUsa = result.winner === 'usa'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 font-serif">
      <div className="w-full max-w-lg bg-stone-100 border-4 border-stone-700 shadow-2xl rounded-sm overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center ${isUsa ? 'bg-blue-900' : 'bg-red-900'} text-stone-100`}>
          <div className="text-4xl mb-2">{isUsa ? '🇺🇸' : '🇷🇺'}</div>
          <h1 className="text-2xl font-bold tracking-wider">
            {isUsa ? '美国胜利' : '苏联胜利'}
          </h1>
          <p className="text-sm text-stone-300 mt-1 opacity-80">
            {result.type === 'DOMINATION' ? '全球支配' :
             result.type === 'SPACE' ? '太空竞赛' :
             result.type === 'NUCLEAR' ? '核威慑' :
             result.type === 'IDEOLOGICAL' ? '意识形态' : '经济碾压'}
          </p>
        </div>

        {/* Stats */}
        <div className="p-6 text-xs space-y-3">
          <div className="text-center text-stone-600 font-mono">
            {result.year}年 · 第{result.turn}回合
          </div>

          <div className="flex justify-center gap-8 py-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{store.players.usa.victoryScore}</div>
              <div className="text-[9px] text-stone-500 font-mono">美国得分</div>
            </div>
            <div className="text-2xl text-stone-400 flex items-center">:</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">{store.players.ussr.victoryScore}</div>
              <div className="text-[9px] text-stone-500 font-mono">苏联得分</div>
            </div>
          </div>

          <p className="text-center text-stone-600">{result.description}</p>

          {/* Epilogue */}
          {showEpilogue && (
            <div className="mt-4 p-4 bg-stone-200 border border-stone-400 rounded-sm">
              <pre className="text-[10px] text-stone-700 font-mono whitespace-pre-wrap leading-relaxed">
                {epilogue}
              </pre>
            </div>
          )}

          {!showEpilogue && (
            <div className="text-center text-stone-400 text-[10px] animate-pulse">
              生成战后总结中...
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              onClick={() => {
                audioManager.playClick()
                onRestart()
              }}
              className="brass-button flex-1 py-2 text-xs font-bold text-stone-900 rounded-sm tracking-wider"
            >
              🔄 重新开始
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
