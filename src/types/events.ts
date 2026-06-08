/**
 * @file 事件与新闻类型定义
 * @desc 时间线事件、新闻条目、阵营倾向（PRO_USA/PRO_USSR/NEUTRAL）
 */
export type TimelineEventType = 'CRISIS' | 'DIPLOMACY' | 'ECONOMY' | 'TECH' | 'MILITARY' | 'SOCIAL'
export type NewsBias = 'PRO_USA' | 'PRO_USSR' | 'NEUTRAL'

export interface TimelineEvent {
  id: string
  year: number
  turn: number
  title: string
  description: string
  type: TimelineEventType
}

export interface NewsItem {
  id: string
  turn: number
  year: number
  headline: string
  summary: string
  bias: NewsBias
  sourceRegion: string
}

export interface Newspaper {
  id: string
  year: number
  headline: string
  content: string
  era: 'POST_WW2' | 'IRON_CURTAIN' | 'INFO_AGE'
}

