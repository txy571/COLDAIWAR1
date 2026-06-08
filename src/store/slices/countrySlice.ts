/**
 * @file Country Slice — 国家数据管理
 * @desc 国家属性增删改、阵营切换、CWS/影响力修改、区域分重算、焦点国家标记
 */
import type { StateCreator } from 'zustand'
import type { Country, RegionalScore, Alignment } from '@/types'
import { deriveCwsStatus } from '@/types'
import { INITIAL_COUNTRIES } from '@/data/countries'
import { createRegionalScoresFromInitial } from '@/data/regionalScores'

export interface CountrySlice {
  countries: Record<string, Country>
  regionalScores: Record<string, RegionalScore>

  updateCountry: (id: string, changes: Partial<Country>) => void
  setAlignment: (id: string, alignment: Alignment) => void
  modifyColdWarScore: (id: string, delta: number) => void
  modifyInfluence: (id: string, side: 'usa' | 'ussr', delta: number) => void
  setFlashpoint: (id: string, isFlashpoint: boolean) => void
  recalculateRegionalScores: () => void
  addTerritoryPolygon: (id: string, polygon: string) => void
}

export const createCountrySlice: StateCreator<CountrySlice, [["zustand/immer", never], never], [], CountrySlice> = (set) => ({
  countries: { ...INITIAL_COUNTRIES },
  regionalScores: createRegionalScoresFromInitial(),

  updateCountry: (id, changes) => set((s) => {
    if (s.countries[id]) Object.assign(s.countries[id], changes)
  }),

  setAlignment: (id, alignment) => set((s) => {
    if (s.countries[id]) s.countries[id].alignment = alignment
  }),

  modifyColdWarScore: (id, delta) => set((s) => {
    if (s.countries[id]) {
      s.countries[id].coldWarScore = Math.max(0, Math.min(100, s.countries[id].coldWarScore + delta))
    }
  }),

  modifyInfluence: (id, side, delta) => set((s) => {
    const country = s.countries[id]
    if (country) {
      country.influence[side] = Math.max(0, Math.min(100, country.influence[side] + delta))
      
      // Dynamic alignment transition based on influence difference
      const usa = country.influence.usa
      const ussr = country.influence.ussr
      const diff = usa - ussr
      if (diff >= 30) {
        country.alignment = 'USA_ALLY'
      } else if (diff <= -30) {
        country.alignment = 'USSR_ALLY'
      } else if (Math.abs(diff) < 15) {
        country.alignment = 'NON_ALIGNED'
      }
    }
  }),

  setFlashpoint: (id, isFlashpoint) => set((s) => {
    if (s.countries[id]) s.countries[id].isFlashpoint = isFlashpoint
  }),

  recalculateRegionalScores: () => set((s) => {
    const regionGroups: Record<string, typeof s.countries[string][]> = {}
    for (const c of Object.values(s.countries)) {
      if (!regionGroups[c.region]) regionGroups[c.region] = []
      regionGroups[c.region].push(c)
    }
    for (const [region, countries] of Object.entries(regionGroups)) {
      const cwsValues = countries.map(c => c.coldWarScore)
      const avg = cwsValues.reduce((a, b) => a + b, 0) / cwsValues.length
      const max = Math.max(...cwsValues)
      const regionalCws = Math.round(avg + 0.2 * max)
      if (s.regionalScores[region]) {
        s.regionalScores[region].cws = Math.max(0, Math.min(100, regionalCws))
        s.regionalScores[region].status = deriveCwsStatus(s.regionalScores[region].cws)
      }
    }
  }),

  addTerritoryPolygon: (id, polygon) => set((s) => {
    if (s.countries[id]) s.countries[id].territoryPolygons.push(polygon)
  }),
})
