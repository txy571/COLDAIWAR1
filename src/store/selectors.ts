/**
 * @file Store 选择器
 * @desc 派生数据查询：CWS排行、区域国家、热点、可用科技、Buff、新闻
 *       避免在每个组件中重复编写过滤逻辑
 */
import type { GameStore } from './gameStore'
import type { Country, Side, PlayerState, TechNode, TimelineEvent, NewsItem } from '@/types'

export const selectCwsRanking = (state: GameStore) =>
  Object.values(state.countries)
    .sort((a: Country, b: Country) => b.coldWarScore - a.coldWarScore)
    .slice(0, 5)
    .map((c: Country) => ({ id: c.id, name: c.name, cws: c.coldWarScore }))

export const selectCountriesByRegion = (state: GameStore, region: string): Country[] =>
  Object.values(state.countries).filter((c: Country) => c.region === region)

export const selectFlashpoints = (state: GameStore): Country[] =>
  Object.values(state.countries).filter((c: Country) => c.isFlashpoint)

export const selectPlayerBySide = (state: GameStore, side: Side): PlayerState =>
  state.players[side]

export const selectGlobalStatus = (state: GameStore) => ({
  era: state.currentEra,
  year: state.year,
  turn: state.turn,
  phase: state.phase,
  hotzones: Object.values(state.countries)
    .filter((c: Country) => c.coldWarScore > 60)
    .map((c: Country) => c.name),
})

export const selectAvailableTechs = (state: GameStore, side: Side): TechNode[] =>
  state.getAvailableTechs(side, state.year)

export const selectActiveBuffsByTarget = (
  state: GameStore,
  targetCountry?: string,
  targetRegion?: string
): Buff[] =>
  state.activeBuffs.filter(
    (b: Buff) => (targetCountry !== undefined && b.targetCountry === targetCountry) ||
         (targetRegion !== undefined && b.targetRegion === targetRegion)
  )

export const selectEffectiveCountry = (state: GameStore, countryId: string): Country | null => {
  const baseCountry = state.countries[countryId]
  if (!baseCountry) return null

  // Deep clone to avoid mutating the original store object
  const country = JSON.parse(JSON.stringify(baseCountry)) as Country

  // Get active buffs for this country or its region
  const buffs = state.activeBuffs.filter(
    (b: Buff) => b.targetCountry === countryId || (b.targetRegion && b.targetRegion === baseCountry.region)
  )

  for (const buff of buffs) {
    const effect = buff.effect
    if (!effect) continue
    const { target, modifier, value } = effect
    const parts = target.split('.')
    if (parts.length === 2) {
      const category = parts[0] as 'military' | 'economy' | 'society'
      const key = parts[1]
      if (country[category] && key in country[category]) {
        const currentVal = (country[category] as any)[key]
        if (modifier === 'add') {
          if (typeof currentVal === 'number') {
            (country[category] as any)[key] = currentVal + value
          }
        } else if (modifier === 'set') {
          (country[category] as any)[key] = typeof currentVal === 'boolean' ? !!value : value
        } else if (modifier === 'multiply') {
          if (typeof currentVal === 'number') {
            (country[category] as any)[key] = currentVal * value
          }
        }
      }
    } else if (parts.length === 1) {
      const key = parts[0]
      if (key in country) {
        const currentVal = (country as any)[key]
        if (modifier === 'add') {
          if (typeof currentVal === 'number') {
            (country as any)[key] = currentVal + value
          }
        } else if (modifier === 'set') {
          (country as any)[key] = typeof currentVal === 'boolean' ? !!value : value
        } else if (modifier === 'multiply') {
          if (typeof currentVal === 'number') {
            (country as any)[key] = currentVal * value
          }
        }
      }
    }
  }

  return country
}

export const selectRecentTimeline = (state: GameStore, count: number = 10): TimelineEvent[] =>
  state.timeline.slice(-count)

export const selectNewsFeed = (state: GameStore, maxItems: number = 20): NewsItem[] =>
  state.newsFeed.slice(0, maxItems)

import type { Buff } from '@/types'
