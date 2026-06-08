/**
 * @file Game Slice — 游戏核心状态管理
 * @desc 管理 Era/年份/回合/阶段/全球紧张度等游戏全局状态
 *       12回合=1年，回合推进自动更新时代(1945→POST_WW2, 1960→IRON_CURTAIN, 1980→INFO_AGE)
 */
import type { StateCreator } from 'zustand'
import type { Era, GamePhase, Side } from '@/types'

export interface GameSlice {
  currentEra: Era
  year: number
  turn: number
  phase: GamePhase
  globalTension: number
  selectedCountryId: string | null
  currentActor: Side | null  // whose turn to act

  setEra: (era: Era) => void
  advancePhase: () => void
  advanceTurn: () => void
  setGlobalTension: (value: number) => void
  modifyGlobalTension: (delta: number) => void
  setSelectedCountryId: (id: string | null) => void
  resetGame: () => void
  loadGameState: (state: any) => void
}

function getEraForYear(year: number): Era {
  if (year >= 1980) return 'INFO_AGE'
  if (year >= 1960) return 'IRON_CURTAIN'
  return 'POST_WW2'
}

const PHASES: GamePhase[] = ['AI_EVENT', 'USA_ACTION', 'USSR_ACTION', 'RESOLVE']

export const createGameSlice: StateCreator<GameSlice, [["zustand/immer", never], never], [], GameSlice> = (set) => ({
  currentEra: 'POST_WW2' as Era,
  year: 1945,
  turn: 1,
  phase: 'AI_EVENT' as GamePhase,
  globalTension: 20,
  selectedCountryId: null,
  currentActor: null as Side | null,

  setEra: (era) => set((s) => { s.currentEra = era }),

  advancePhase: () => set((s) => {
    const idx = PHASES.indexOf(s.phase)
    const nextPhase = PHASES[(idx + 1) % PHASES.length]
    s.phase = nextPhase
    // Update current actor based on phase
    if (nextPhase === 'USA_ACTION') s.currentActor = 'usa'
    else if (nextPhase === 'USSR_ACTION') s.currentActor = 'ussr'
    else s.currentActor = null
  }),

  advanceTurn: () => set((s) => {
    s.turn += 1
    // 4 rounds = 1 year (alternating actions, 4 per side per year)
    if (s.turn % 4 === 1) {
      s.year += 1
      s.currentEra = getEraForYear(s.year)
    }
  }),

  setGlobalTension: (value) => set((s) => { s.globalTension = Math.max(0, Math.min(100, value)) }),

  modifyGlobalTension: (delta) => set((s) => {
    s.globalTension = Math.max(0, Math.min(100, s.globalTension + delta))
  }),

  setSelectedCountryId: (id) => set((s) => { s.selectedCountryId = id }),

  resetGame: () => set((s) => {
    s.currentEra = 'POST_WW2'
    s.year = 1945
    s.turn = 1
    s.phase = 'AI_EVENT'
    s.globalTension = 20
    s.selectedCountryId = null
    if ((s as any).newspapers) (s as any).newspapers = []
  }),

  loadGameState: (state) => set((s) => {
    if (!state) return
    if (state.currentEra !== undefined) s.currentEra = state.currentEra
    if (state.year !== undefined) s.year = state.year
    if (state.turn !== undefined) s.turn = state.turn
    if (state.phase !== undefined) s.phase = state.phase
    if (state.globalTension !== undefined) s.globalTension = state.globalTension
    if (state.selectedCountryId !== undefined) s.selectedCountryId = state.selectedCountryId
    if (state.currentActor !== undefined) s.currentActor = state.currentActor
    if (state.countries !== undefined) s.countries = state.countries
    if (state.regionalScores !== undefined) s.regionalScores = state.regionalScores
    if (state.players !== undefined) s.players = state.players
    if (state.activeSituations !== undefined) s.activeSituations = state.activeSituations
    if (state.allSituations !== undefined) s.allSituations = state.allSituations
    if (state.pastSituations !== undefined) s.pastSituations = state.pastSituations
    if (state.activeBuffs !== undefined) s.activeBuffs = state.activeBuffs
    if (state.newspapers !== undefined) s.newspapers = state.newspapers
    if (state.timeline !== undefined) s.timeline = state.timeline
    if (state.newsFeed !== undefined) s.newsFeed = state.newsFeed
    if (state.techTrees !== undefined) s.techTrees = state.techTrees
  }),
})
