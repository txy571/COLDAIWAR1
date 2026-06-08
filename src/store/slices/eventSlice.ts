/**
 * @file Event Slice — 事件与新闻管理
 * @desc 历史时间线(最多200条)、新闻馈送(最多50条)、Buff系统(时长/过期)
 */
import type { StateCreator } from 'zustand'
import type { TimelineEvent, NewsItem, Buff, Newspaper } from '@/types'

export interface EventSlice {
  timeline: TimelineEvent[]
  newsFeed: NewsItem[]
  activeBuffs: Buff[]
  newspapers: Newspaper[]

  addTimelineEvent: (event: TimelineEvent) => void
  addNewsItem: (item: NewsItem) => void
  addBuff: (buff: Buff) => void
  removeBuff: (buffId: string) => void
  tickBuffs: () => void
  clearNewsFeed: () => void
  addNewspaper: (np: Newspaper) => void
}


export const createEventSlice: StateCreator<EventSlice, [["zustand/immer", never], never], [], EventSlice> = (set) => ({
  timeline: [],
  newsFeed: [],
  activeBuffs: [],
  newspapers: [],

  addTimelineEvent: (event) => set((s) => {
    s.timeline.push(event)
    if (s.timeline.length > 200) s.timeline = s.timeline.slice(-150)
  }),

  addNewsItem: (item) => set((s) => {
    s.newsFeed.unshift(item)
    if (s.newsFeed.length > 50) s.newsFeed = s.newsFeed.slice(0, 50)
  }),

  addBuff: (buff) => set((s) => { s.activeBuffs.push(buff) }),

  removeBuff: (buffId) => set((s) => { s.activeBuffs = s.activeBuffs.filter(b => b.id !== buffId) }),

  tickBuffs: () => set((s) => {
    for (let i = s.activeBuffs.length - 1; i >= 0; i--) {
      const buff = s.activeBuffs[i]
      if (buff.duration !== -1) {
        buff.remainingTurns -= 1
        if (buff.remainingTurns <= 0) s.activeBuffs.splice(i, 1)
      }
    }
  }),

  clearNewsFeed: () => set((s) => { s.newsFeed = [] }),

  addNewspaper: (np) => set((s) => {
    s.newspapers.push(np)
  }),
})
