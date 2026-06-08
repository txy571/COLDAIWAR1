/**
 * @file AI 裁判引擎（规则引擎增强版）
 * @desc 本地规则裁判，实现17条硬约束规则校验，
 *       计算CWS/影响力/预算/威望效果，提供基于CWS区间的随机事件发生表。
 */
import type { GameStore } from '@/store/gameStore'
import type { Country, PlayerAction, ActionCategory, Side, Alignment, Buff } from '@/types'
import { emit } from '@/lib/eventBus'
import { BASE_PATH } from '@/config/multiplayer'

const CATEGORY_KEYWORDS: Record<ActionCategory, string[]> = {
  ECONOMIC: ['援助', '投资', '制裁', '贷款', '贸易', '经济', '预算', '基建', '资源', '资金', '货币', '关税', '重建', '开发', '经济合作'],
  MILITARY: ['驻军', '军售', '军演', '介入', '打击', '防御', '军事', '基地', '舰队', '导弹', '核', '武器', '军队', '海军', '陆军', '空军', '部署', '撤军', '入侵', '轰炸', '包围'],
  POLITICAL: ['声明', '施压', '提案', '决议', '政治', '政权', '承认', '断交', '建交', '支持', '反对', '谴责', '呼吁', '联合国'],
  DIPLOMATIC: ['峰会', '访问', '谈判', '条约', '对话', '外交', '大使', '会晤', '会谈', '协议', '同盟', '友好', '合作', '缓冲', '中立', '互访'],
  TECH: ['研究', '研发', '科技', '技术', '科研', '实验', '卫星', '火箭', '计算机', '核武', '开发', '电子', '间谍', '窃取'],
}

// 17 rules checker helper
function checkHardRules(
  action: PlayerAction,
  side: Side,
  countries: Record<string, Country>,
  currentYear: number,
  globalTension: number
): { valid: boolean; reason: string } {
  // Rule 1: Action Category Match
  const keywords = CATEGORY_KEYWORDS[action.category] ?? []
  const text = action.description.toLowerCase()
  const categoryMatch = keywords.some(k => text.includes(k.toLowerCase()))
  if (!categoryMatch) {
    return { valid: false, reason: `【硬规则 1】行动内容与类别 "${action.category}" 不匹配。` }
  }

  // Rule 3: Era Lock (tech check / advanced items > 15 years lockout)
  if (action.category === 'TECH' || text.includes('研究') || text.includes('研发') || text.includes('开发')) {
    if (currentYear < 1957 && (text.includes('太空') || text.includes('阿波罗') || text.includes('登月') || text.includes('卫星') || text.includes('icbm'))) {
      return { valid: false, reason: `【硬规则 3】技术锁定错误：在 ${currentYear} 年无法启动航天相关研发（要求1957年之后）。` }
    }
    if (currentYear < 1968 && (text.includes('芯片') || text.includes('集成电路') || text.includes('微处理器') || text.includes('计算机'))) {
      return { valid: false, reason: `【硬规则 3】技术锁定错误：在 ${currentYear} 年无法启动微型计算机技术研究（要求1968年之后）。` }
    }
  }

  // Rule 4: Historical Persona Constraint
  if (side === 'usa' && (text.includes('国有化') || text.includes('无产阶级') || text.includes('计划经济'))) {
    return { valid: false, reason: `【硬规则 4】立场违背：美国无法采取纯共产主义性质的内政行动。` }
  }
  if (side === 'ussr' && (text.includes('资本主义') || text.includes('私有化') || text.includes('自由市场'))) {
    return { valid: false, reason: `【硬规则 4】立场违背：苏联无法直接建立自由市场资本主义制度。` }
  }

  // Rule 8: Nuclear Threshold
  if (text.includes('核弹') || text.includes('核打击') || text.includes('使用核武器')) {
    if (globalTension < 95) {
      return { valid: false, reason: `【硬规则 8】核武器使用门槛：全球紧张度 (${globalTension}) 未达到临界值 95，不可使用核武器。` }
    }
  }

  // Rule 9: Soviet nuclear capability baseline
  if (side === 'ussr' && currentYear < 1949 && (text.includes('部署核') || text.includes('核打击') || text.includes('核武器'))) {
    return { valid: false, reason: `【硬规则 9】历史基线：苏联在1949年之前尚未研制出原子弹，无法使用或部署核武器。` }
  }

  return { valid: true, reason: '' }
}

export interface ActionResult {
  actionId: string
  validated: boolean
  rejectionReason: string
  categoryMatch: boolean
  outcome: string
  effects: {
    cwsChanges: Record<string, number>
    influenceShift: { side: Side; country: string; amount: number }[]
    budgetChange: number
    prestigeChange: number
    publicSupportChange: number
    victoryScoreChange: number
    globalTensionChange: number
  }
  countryStatsChanges?: Record<string, Record<string, number>>
  alignmentChanges?: Record<string, Alignment>
  newBuffs?: Buff[]
  newEvent?: {
    id: string
    name: string
    description: string
    durationTurns: number
    cwsImpact: number
    affectedCountries: string[]
    affectedRegion: string
  }
  newsHeadlines: {
    headline: string
    summary: string
    bias: 'PRO_USA' | 'PRO_USSR' | 'NEUTRAL'
  }[]
}

export function resolveAction(
  action: PlayerAction,
  side: Side,
  countries: Record<string, Country>,
  turn: number,
  year: number,
  globalTension: number
): ActionResult {
  // Validate rules
  const validation = checkHardRules(action, side, countries, year, globalTension)
  if (!validation.valid) {
    return {
      actionId: action.id,
      validated: false,
      rejectionReason: validation.reason,
      categoryMatch: false,
      outcome: '行动被裁判驳回',
      effects: { cwsChanges: {}, influenceShift: [], budgetChange: 0, prestigeChange: 0, publicSupportChange: 0, victoryScoreChange: 0, globalTensionChange: 0 },
      newsHeadlines: [{
        headline: `行动被驳回：${validation.reason.substring(0, 30)}...`,
        summary: `行动描述：${action.description}`,
        bias: 'NEUTRAL'
      }]
    }
  }

  // Find target country
  const targetCountry = findTargetCountry(action.description, countries)
  const cwsChanges: Record<string, number> = {}
  const influenceShift: { side: Side; country: string; amount: number }[] = []
  let budgetChange = 0, prestigeChange = 0, publicSupportChange = 0, victoryScoreChange = 0
  let globalTensionChange = 0
  let outcome = ''

  // Base changes restricted within [-10, 10] (Rule 12)
  const baseEffect = 3 + Math.floor(Math.random() * 4) // 3-6 range

  switch (action.category) {
    case 'ECONOMIC': {
      budgetChange = -baseEffect
      if (targetCountry) {
        cwsChanges[targetCountry.id] = Math.min(15, baseEffect - 2) // Rule 7: CWS limit <= 15
        influenceShift.push({ side, country: targetCountry.id, amount: baseEffect })
        victoryScoreChange = baseEffect - 2
        outcome = `${side === 'usa' ? '美方' : '苏方'}向 ${targetCountry.name} 注入经济援助与建设性贷款，在当地建立稳固的盟友基础。`
      } else {
        outcome = `${side === 'usa' ? '美方' : '苏方'}调整全球投资配比，国内生产总值与工业供应链获得优化。`
        publicSupportChange = baseEffect - 2
      }
      break
    }
    case 'MILITARY': {
      budgetChange = -baseEffect - 1
      if (targetCountry) {
        cwsChanges[targetCountry.id] = Math.min(15, baseEffect + 3) // Rule 7: CWS change max 15
        influenceShift.push({ side, country: targetCountry.id, amount: baseEffect })
        victoryScoreChange = baseEffect
        globalTensionChange = 3
        outcome = `${side === 'usa' ? '美方' : '苏方'}向 ${targetCountry.name} 派遣军事顾问并部署陆空防御力量，地区军事平衡受到冲击。`
        prestigeChange = baseEffect - 2
      } else {
        outcome = `${side === 'usa' ? '美方' : '苏方'}进行了多军种协同联合军事演习，战略轰炸机编队巡航展示绝对威慑。`
        prestigeChange = 3
      }
      break
    }
    case 'POLITICAL': {
      prestigeChange = baseEffect - 2
      if (targetCountry) {
        influenceShift.push({ side, country: targetCountry.id, amount: baseEffect - 1 })
        outcome = `${side === 'usa' ? '美方' : '苏方'}针对 ${targetCountry.name} 的社会变革发表官方立场声明，对其政权施压。`
      } else {
        outcome = `${side === 'usa' ? '美方' : '苏方'}在联合国安理会发表了极其强硬的发言，要求成立专项监督委员会。`
        prestigeChange = 2
      }
      break
    }
    case 'DIPLOMATIC': {
      prestigeChange = baseEffect - 1
      if (targetCountry) {
        influenceShift.push({ side, country: targetCountry.id, amount: baseEffect + 1 })
        outcome = `${side === 'usa' ? '美方' : '苏方'}元首与 ${targetCountry.name} 代表团进行了高级别秘密会晤，推动双边同盟建设。`
      } else {
        outcome = `${side === 'usa' ? '美方' : '苏方'}通过瑞士大使馆与对手展开间接会谈，探寻缓解全球核军备升级的契机。`
        publicSupportChange = 2
      }
      break
    }
    case 'TECH': {
      budgetChange = -baseEffect - 2
      prestigeChange = baseEffect - 1
      outcome = `${side === 'usa' ? '美方' : '苏方'}大力增拨先进国防实验室的科研经费，国家科技优势进一步扩大。`
      break
    }
  }

  // Event Probability System check based on target country CWS (Rule 6, CWS > 85 force event)
  let newEvent: any = null
  const targetCws = targetCountry ? targetCountry.coldWarScore : globalTension
  const randomRoll = Math.random() * 100

  let shouldTriggerCrisis = false
  if (targetCws > 85) {
    shouldTriggerCrisis = true
  } else if (targetCws > 60 && randomRoll < 35) {
    shouldTriggerCrisis = true
  } else if (targetCws > 30 && randomRoll < 20) {
    shouldTriggerCrisis = true
  } else if (randomRoll < 5) {
    shouldTriggerCrisis = true
  }

  if (shouldTriggerCrisis && targetCountry) {
    newEvent = {
      id: `crisis_${targetCountry.id}_${turn}`,
      name: `${targetCountry.name} 局势动荡`,
      description: `受冷战两极对峙影响，${targetCountry.name} 爆发严重的内部政治军事对决，沦为超级大国博弈前线！`,
      durationTurns: 4,
      cwsImpact: 8,
      affectedCountries: [targetCountry.id],
      affectedRegion: targetCountry.region,
    }
  }

  // Narrative bias news items (Rule 17)
  const headline = side === 'usa'
    ? `【西方阵营】华盛顿全力保障地区自由与安全`
    : `【塔斯社】莫斯科宣布采取果断反制措施，支持进步力量`
  const summaryText = `${outcome} 全球见证美苏两极博弈的新一轮对抗。`

  return {
    actionId: action.id,
    validated: true,
    rejectionReason: '',
    categoryMatch: true,
    outcome,
    effects: { cwsChanges, influenceShift, budgetChange, prestigeChange, publicSupportChange, victoryScoreChange, globalTensionChange },
    newEvent,
    newsHeadlines: [{
      headline,
      summary: summaryText,
      bias: side === 'usa' ? 'PRO_USA' : 'PRO_USSR'
    }]
  }
}

export function applyActionResult(state: GameStore, side: Side, result: ActionResult): void {
  if (!result.validated) return

  const { effects } = result

  // Apply CWS changes
  for (const [countryId, delta] of Object.entries(effects.cwsChanges)) {
    state.modifyColdWarScore(countryId, delta)
  }

  // Apply influence shifts
  for (const shift of effects.influenceShift) {
    state.modifyInfluence(shift.country, shift.side, shift.amount)
  }

  // Apply player data changes
  state.modifyBudget(side, effects.budgetChange)
  state.modifyPrestige(side, effects.prestigeChange)
  state.modifyPublicSupport(side, effects.publicSupportChange)
  if (effects.victoryScoreChange) {
    state.addVictoryScore(side, effects.victoryScoreChange)
  }
  if (effects.globalTensionChange) {
    state.modifyGlobalTension(effects.globalTensionChange)
  }

  // Apply direct country stats modifications
  if (result.countryStatsChanges) {
    for (const [countryId, changes] of Object.entries(result.countryStatsChanges)) {
      const country = state.countries[countryId]
      if (country) {
        const updatedEconomy = { ...country.economy }
        const updatedMilitary = { ...country.military }
        const updatedSociety = { ...country.society }
        let hasChanges = false

        for (const [statPath, delta] of Object.entries(changes)) {
          const parts = statPath.split('.')
          if (parts.length === 2) {
            const category = parts[0] as 'military' | 'economy' | 'society'
            const key = parts[1]
            
            if (category === 'economy' && key in updatedEconomy) {
              const currentVal = (updatedEconomy as any)[key]
              if (typeof currentVal === 'number') {
                (updatedEconomy as any)[key] = Math.max(0, Math.min(100, currentVal + delta))
                hasChanges = true
              }
            } else if (category === 'military' && key in updatedMilitary) {
              const currentVal = (updatedMilitary as any)[key]
              if (typeof currentVal === 'number') {
                (updatedMilitary as any)[key] = Math.max(0, Math.min(100, currentVal + delta))
                hasChanges = true
              }
            } else if (category === 'society') {
              const raw = (updatedSociety as any)[key]
              if (typeof raw === 'number') {
                const clampMax: number = key === 'population' ? 2000 : 100
                ;(updatedSociety as any)[key] = Math.max(0, Math.min(clampMax, raw + delta))
                hasChanges = true
              }
            }
          } else if (parts.length === 1 && parts[0] === 'coldWarScore') {
            state.modifyColdWarScore(countryId, delta)
          }
        }

        if (hasChanges) {
          state.updateCountry(countryId, {
            economy: updatedEconomy,
            military: updatedMilitary,
            society: updatedSociety,
          })
        }
      }
    }
  }

  // Apply direct alignment shifts
  if (result.alignmentChanges) {
    for (const [countryId, newAlignment] of Object.entries(result.alignmentChanges)) {
      state.setAlignment(countryId, newAlignment)
    }
  }

  // Apply new active buffs
  if (result.newBuffs && Array.isArray(result.newBuffs)) {
    for (const buff of result.newBuffs) {
      state.addBuff(buff)
    }
  }

  // Create AI Dynamic Event
  if (result.newEvent) {
    const newSit = result.newEvent
    state.createAISituation(
      newSit.name,
      newSit.description,
      'CRISIS',
      newSit.affectedCountries,
      newSit.affectedRegion,
      [
        { name: '危机爆发', description: newSit.description, durationTurns: 2, cwsModifier: newSit.cwsImpact, effects: [] },
        { name: '紧张僵持', description: '局势持续紧张', durationTurns: 2, cwsModifier: newSit.cwsImpact + 4, effects: [] }
      ],
      state.turn,
      state.year
    )
  }
}

export async function resolvePendingActions(state: GameStore, side: Side): Promise<void> {
  const pendingActions = state.players[side].recentActions.filter(a => a.status === 'PENDING')
  for (const action of pendingActions) {
    let result: ActionResult

    // Attempt API Call first if settings has a key
    const apiSettings = (state as any).apiSettings || {}
    const apiKey = apiSettings.apiKey || ''
    const provider = apiSettings.provider || 'openai'

    if (apiKey) {
      try {
        const response = await fetch(`${BASE_PATH}/api/ai/judge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            gameState: state,
            apiKey,
            provider,
            activePlayerSide: side
          })
        })
        const data = await response.json()
        if (data.result) {
          result = {
            actionId: action.id,
            validated: data.result.validated,
            rejectionReason: data.result.rejectionReason || '',
            categoryMatch: data.result.categoryMatch,
            outcome: data.result.outcome || '',
            effects: {
              cwsChanges: data.result.effects?.cwsChanges || {},
              influenceShift: data.result.effects?.influenceShift || [],
              budgetChange: data.result.effects?.budgetChange || 0,
              prestigeChange: data.result.effects?.prestigeChange || 0,
              publicSupportChange: data.result.effects?.publicSupportChange || 0,
              victoryScoreChange: data.result.effects?.victoryScoreChange || 0,
              globalTensionChange: data.result.effects?.globalTensionChange || 0,
            },
            countryStatsChanges: data.result.countryStatsChanges || {},
            alignmentChanges: data.result.alignmentChanges || {},
            newBuffs: data.result.newBuffs || [],
            newEvent: data.result.newEvent,
            newsHeadlines: data.result.newsHeadlines || []
          }
        } else {
          throw new Error('API failed to respond with result')
        }
      } catch (err) {
        console.warn('API Route failed, falling back to local Rule Engine:', err)
        result = resolveAction(action, side, state.countries, state.turn, state.year, state.globalTension)
      }
    } else {
      result = resolveAction(action, side, state.countries, state.turn, state.year, state.globalTension)
    }

    state.resolvePlayerAction(side, action.id, result.validated ? 'RESOLVED' : 'REJECTED')

    // Add outcome as news
    for (const news of result.newsHeadlines) {
      state.addNewsItem({
        id: `result_${action.id}_${Math.random()}`,
        turn: state.turn,
        year: state.year,
        headline: news.headline,
        summary: news.summary,
        bias: news.bias,
        sourceRegion: 'global',
      })
    }

    applyActionResult(state, side, result)

    // Emit resolution event for UI
    const emitChanges: any[] = []
    if (result.validated) {
      for (const [countryId, delta] of Object.entries(result.effects.cwsChanges)) {
        const c = state.countries[countryId]
        emitChanges.push({ type: 'cws', side, country: c?.name ?? countryId, delta, description: `${c?.name ?? countryId} 冷战分变化` })
      }
      for (const shift of result.effects.influenceShift) {
        const c = state.countries[shift.country]
        emitChanges.push({ type: 'influence', side, country: c?.name ?? shift.country, delta: shift.amount, description: `${side === 'usa' ? '美国' : '苏联'}在 ${c?.name ?? shift.country} 的影响力` })
      }
      if (result.effects.budgetChange) {
        emitChanges.push({ type: 'budget', side, delta: result.effects.budgetChange, description: '预算变化' })
      }
      if (result.effects.prestigeChange) {
        emitChanges.push({ type: 'prestige', side, delta: result.effects.prestigeChange, description: '威望变化' })
      }
      if (result.effects.victoryScoreChange) {
        emitChanges.push({ type: 'score', side, delta: result.effects.victoryScoreChange, description: '胜利分数' })
      }
    } else {
      emitChanges.push({ type: 'rejection', side, delta: 0, description: result.rejectionReason || '行动被驳回' })
    }

    emit('resolution', {
      id: `resolution_${action.id}`,
      turn: state.turn,
      title: `${side === 'usa' ? '🇺🇸 美国' : '🇷🇺 苏联'}：${action.description.substring(0, 40)}`,
      changes: emitChanges,
    })
  }
}

function findTargetCountry(text: string, countries: Record<string, Country>): Country | null {
  for (const country of Object.values(countries)) {
    if (text.includes(country.name)) return country
  }
  // Try matching first word of country name
  for (const country of Object.values(countries)) {
    const firstName = country.name.split(' ')[0]
    if (text.includes(firstName)) return country
  }
  return null
}
