/**
 * @file 回合循环管线
 * @desc 每轮4阶段：AI_EVENT → USA_ACTION → USSR_ACTION → RESOLVE
 *       4轮 = 1年，每人每年4次行动
 *       1. AI_EVENT — 推进局势、激活预定义历史事件、时代过渡通知
 *       2. INTEL — 情报阶段（当前为空，预留AI裁判）
 *       3. RESOLVE — 仅自动tick Buff、推进回合计数器
 *       注意：CWS修改全部走AI裁判，这里不做
 */
import type { GameStore } from '@/store/gameStore'
import { checkEraTransition, getEraDisplayName } from './eraManager'
import { ANNUAL_EVENTS } from '@/data/annualEvents'

/**
 * AI Event phase: ONLY narrative and situation advancement.
 * NO game data changes - those require AI judge resolution.
 */
export function executeAIPhase(state: GameStore): void {
  // Advance existing situations (stage progress only, no CWS changes)
  state.advanceSituations(state.turn, state.year)

  // Activate predefined annual event if one exists for the current year
  const annualEvent = ANNUAL_EVENTS[state.year]
  if (annualEvent) {
    const hasEvent = state.timeline.some(e => e.year === state.year && e.title === annualEvent.title)
    if (!hasEvent) {
      state.addTimelineEvent({
        id: `annual_${state.year}`,
        year: state.year,
        turn: state.turn,
        title: annualEvent.title,
        description: annualEvent.description,
        type: annualEvent.type,
      })
    }
  }

  // Activate predefined historical situations by year (narrative only)
  const allSit = (state as any).allSituations as any[]
  const predefinedToActivate = [
    { id: 'berlin_blockade', year: 1948 },
    { id: 'korean_war', year: 1950 },
    { id: 'hungarian_revolution', year: 1956 },
    { id: 'suez_crisis', year: 1956 },
    { id: 'sino_soviet_split', year: 1960 },
    { id: 'berlin_wall_crisis', year: 1961 },
    { id: 'cuban_missile_crisis', year: 1962 },
    { id: 'vietnam_war', year: 1965 },
    { id: 'prague_spring', year: 1968 },
    { id: 'yom_kippur_war', year: 1973 },
    { id: 'soviet_afghan_war', year: 1979 },
    { id: 'iranian_revolution', year: 1979 },
    { id: 'able_archer_83', year: 1983 },
    { id: 'german_reunification', year: 1989 },
    { id: 'gulf_war', year: 1990 },
  ]
  for (const p of predefinedToActivate) {
    if (state.year >= p.year && !allSit.some((s: any) => s.id === p.id && s.isActive)) {
      const sit = allSit.find((s: any) => s.id === p.id)
      if (sit && !sit._activated) {
        sit._activated = true
        sit.isActive = true
        const existing = state.activeSituations.find((s: any) => s.id === p.id)
        if (!existing) {
          ;(state as any).activateSituation?.(JSON.parse(JSON.stringify(sit)))
        }
      }
    }
  }

  // Era transition notification (narrative only)
  const transition = checkEraTransition(state.year)
  if (transition) {
    state.addTimelineEvent({
      id: `era_${state.year}`, year: state.year, turn: state.turn,
      title: `时代更替 · ${getEraDisplayName(transition)}`,
      description: `世界格局发生重大变革，进入${getEraDisplayName(transition)}。`,
      type: 'DIPLOMACY',
    })
  }
}

/**
 * Intel phase: NO automatic CWS recalculation.
 * Only the AI judge can modify CWS based on player actions.
 */
export function executeIntelPhase(_state: GameStore): void {
  // Intentionally empty - AI judge handles all state changes
}

/**
 * Resolution phase: minimum automatic bookkeeping only.
 * All game state changes must go through AI judge.
 */
export function executeResolutionPhase(state: GameStore): void {
  // Only auto-tick buffs (removing expired ones)
  state.tickBuffs()

  // Advance turn counter and refresh for next round
  state.advanceTurn()
}
