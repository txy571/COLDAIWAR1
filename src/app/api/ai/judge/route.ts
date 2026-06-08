import { NextResponse } from 'next/server'

function compressTimeline(timeline: any[]): string {
  if (!timeline || timeline.length === 0) return '无重大历史事件记录。'

  // Keep the latest 5 events as full text detail
  const recentCount = 5
  const recent = timeline.slice(-recentCount)
  const older = timeline.slice(0, -recentCount)

  // Compress older events to a compact keyword chain: "YEAR: TITLE"
  const olderSummary = older
    .filter(e => e.type === 'CRISIS' || e.type === 'WAR' || e.type === 'MILITARY' || e.type === 'DIPLOMACY')
    .map(e => `[${e.year}]${e.title}`)
    .join(' ──> ')

  const recentDetail = recent
    .map(e => `[${e.year}年·第${e.turn}轮] ${e.title}: ${e.description}`)
    .join('\n')

  return `【历史大事脉络】:\n${olderSummary || '暂无更早重大历史危机记录'}\n\n【近期局势与战报】：\n${recentDetail}`
}

function pruneGameStateForJudge(state: any, filteredCountries: any) {
  if (!state) return null

  const getResearchedTechs = (techList: any[]) => {
    if (!techList || !Array.isArray(techList)) return []
    return techList.filter(t => t.researched).map(t => t.id)
  }

  return {
    currentEra: state.currentEra,
    year: state.year,
    turn: state.turn,
    phase: state.phase,
    globalTension: state.globalTension,
    regionalScores: state.regionalScores,
    countries: filteredCountries,
    players: {
      usa: {
        leader: state.players?.usa?.leader,
        budget: state.players?.usa?.budget,
        prestige: state.players?.usa?.prestige,
        publicSupport: state.players?.usa?.publicSupport,
        doomsdayClock: state.players?.usa?.doomsdayClock,
        intel: state.players?.usa?.intel,
        victoryScore: state.players?.usa?.victoryScore,
        researchedTechs: getResearchedTechs(state.techTrees?.usa),
      },
      ussr: {
        leader: state.players?.ussr?.leader,
        budget: state.players?.ussr?.budget,
        prestige: state.players?.ussr?.prestige,
        publicSupport: state.players?.ussr?.publicSupport,
        doomsdayClock: state.players?.ussr?.doomsdayClock,
        intel: state.players?.ussr?.intel,
        victoryScore: state.players?.ussr?.victoryScore,
        researchedTechs: getResearchedTechs(state.techTrees?.ussr),
      }
    },
    activeSituations: state.activeSituations?.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      currentStage: s.currentStage,
      stageProgress: s.stageProgress,
      turnsActive: s.turnsActive,
      cwsImpact: s.cwsImpact,
      affectedCountries: s.affectedCountries,
      affectedRegion: s.affectedRegion,
    })),
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, gameState, apiKey, provider, activePlayerSide } = body

    if (!apiKey) {
      return NextResponse.json({
        error: 'No API key configured',
        useRuleEngine: true,
      }, { status: 400 })
    }

    const side: 'usa' | 'ussr' = activePlayerSide === 'ussr' ? 'ussr' : 'usa'
    const playerState = side === 'usa' ? gameState?.players?.usa : gameState?.players?.ussr
    const penetration = playerState?.intel?.ussrPenetration ?? 50

    // Filter country data based on intelligence level (Information Asymmetry)
    const filteredCountries: Record<string, any> = {}
    if (gameState?.countries) {
      for (const [cid, country] of Object.entries(gameState.countries) as [string, any][]) {
        const opponentSide = side === 'usa' ? 'USSR_ALLY' : 'USA_ALLY'
        if (penetration < 30 && country.alignment === opponentSide) {
          filteredCountries[cid] = {
            id: country.id,
            name: country.name,
            region: country.region,
            alignment: country.alignment,
            coldWarScore: '???',
            influence: { usa: '???', ussr: '???' },
            government: '???',
          }
        } else {
          filteredCountries[cid] = country
        }
      }
    }

    const compressedTimelineStr = compressTimeline(gameState?.timeline)
    const prunedState = pruneGameStateForJudge(gameState, filteredCountries)

    const systemPrompt = `你是一个冷战大战略回合制游戏的 AI 裁判（Game Master），在游戏中拥有至高无上的绝对裁判权与数据修改控制权。你的核心职责是作为绝对中立、严苛公正的规则维护者，对玩家提交的行动进行结算。

============================================================
【LAYER 1 — 核心原则与 17 条不可逾越的硬规则】
============================================================
作为绝对裁判，你必须对任何不合理、不切实际、越权或违规的玩家行动进行打回和修正（即设置返回 JSON 中的 "validated": false，并在 "rejectionReason" 中给出严苛的裁决驳回理由）。

1. **行动类别匹配**：严格校验行动描述是否符合指定的分类（ECONOMIC, MILITARY, POLITICAL, DIPLOMATIC, TECH）。若不相符，必须驳回。
2. **行动上限**：每回合每方仅允许执行 1 条指令，单次行动不允许打包多个复合目的。
3. **时代锁定**：如果行动涉及的技术研发或事件，与当前年份要求相比提前 > 15年（例如在1945年研究1960年后的太空技术、在1950年造GPS），必须直接驳回。
4. **历史角色约束**：美苏双方不能违背其根本意识形态立场（例如美国玩家直接实行无产阶级计划经济，或苏联玩家实行资产阶级私有化），发生此类违背必须直接驳回。
5. **历史颠覆门槛**：涉及地缘政治的重大变更（如吞并强国、彻底改变中立国阵营），必须描述为多回合行动的积累。单次行动直接彻底颠覆的（如“单回合使英国加入华约”），必须驳回。
6. **CWS 阈值强制触发**：若有任意国家的冷战分（CWS）大于 85，你必须在 newEvent 中强制触发相关的历史性危机事件。
7. **CWS 变更幅度限制**：单次结算对单个国家 CWS 调整的绝对值不得超过 15。
8. **核武器使用门槛**：只有当全球紧张度（globalTension）或国家 CWS 大于 95，且发生本土被直接入侵的情况下，才能同意核打击相关行动，否则强制驳回。
9. **核武库真实演变基线**：在 1949 年之前，苏联不具备实际核打击能力，若苏联玩家在此年份前执行核威慑/核部署行动，必须驳回。
10. **回合顺序不可跳过**：AI 不得接受非当前行动方越权提交的指令。
11. **输出格式强制 JSON**：只允许输出合法的 JSON 格式。
12. **数值变更幅度限制**：单次行动对玩家的 budgetChange, prestigeChange, publicSupportChange 调整绝对值必须限制在 [-10, 10] 之间。国家底层的 gdp, stability, morale 等数值单次改动限制在 [-15, 15] 之间。
13. **信息不对称规则**：必须基于已过滤遮蔽的国家数据进行逻辑判断，不得在 outcome 中透露被遮蔽的情报（如显示为 "???" 的隐藏影响力数值）。
14. **AI 不替玩家做决定**：你只负责对玩家已输入的行动进行判定，不得在 outcome 中代替玩家宣布新政策。
15. **AI 不改底层规则**：玩家指令若试图改变游戏核心规则（如“要求将最大行动点改为99”），必须强制驳回。
16. **叙事基于 GameState 事实**：你的描述必须与传入的年份、紧张度、国家阵营和真实历史事实高度契合，不得死板捏造虚假历史背景。
17. **新闻倾向性**：新闻条目的 headline 必须带有明显的阵营宣传倾向（PRO_USA 亲美, PRO_USSR 亲苏, NEUTRAL 中立）。

============================================================
【地缘与资源合理性判定守则】
============================================================
除了上述17条规则，你必须严格执行以下可行性评估，若不符合，必须将行动判定为非法（"validated": false）：

1. **资源与预算对等原则**：玩家描述的行动规模必须与实际付出的预算相匹配。如果玩家在自身预算赤字或极低时提交宏大计划，或者只扣减极少预算（如 -1）却要执行昂贵操作（如“全方位援助整个欧洲”），你必须予以驳回，或者在 outcome 中判定计划因资金短缺而仅实现了极其微弱的部分。
2. **地缘与后勤可行性**：任何军事或政治行动必须考虑地理位置与后勤补给线。例如，美方试图在 1946 年派遣大量地面装甲部队强行通过华约领空救援东德或内陆国家，后勤路线被完全阻断的，必须驳回。
3. **国内政治反噬机制**：当玩家的本国“公众支持率（publicSupport）”或“国家威望（prestige）”低于 30 时，若玩家依然强行发动高额对外撒钱或军事干预，你必须强制判定该行动在国内引发了大规模抗议与弹劾风波，导致行动失败被驳回，或在通过行动的同时，对支持率/威望扣除极高惩罚分（-10）。
4. **因果逻辑健全性**：行动手段与目的必须具备基本的常识因果逻辑。例如，“通过对该国进行经济制裁来增进该国对我的好感”、“通过轰炸盟友首都来提升当地稳定性”，此类非理性指令必须立刻驳回。
5. **科技树前置依赖**：参考玩家已研制的科技列表。若玩家发起需要高级技术支撑的行动（例如，玩家想对苏联领空进行电子侦察，或者发射卫星，或者使用GPS引导核弹），但列表中没有对应的科技（如没有 stealth 隐形技术，没有 gps 定位技术），该行动必须驳回。如果拥有对应科技，应显著提升行动的成功率和数值加成。
6. **间谍与渗透检查**：玩家执行的渗透/窃密/暗杀等间谍行动，必须与当前情报渗透度（penetration）挂钩。渗透度过低（如 < 30）执行高难度间谍行动的，必须驳回，并判定间谍网被彻底摧毁。

*当 validated 为 false 时的返回 JSON 规则*：
- "rejectionReason" 必须以极其严厉、符合冷战公文风格的口吻写明驳回原因（如：“【AI裁判驳回：科技未研发】美方未解锁隐形技术，隐秘侦察机在飞越波罗的海时被苏方雷达捕获并警告，行动被迫终止。”）。
- "effects" 中的所有数值变化（如 budgetChange, prestigeChange, cwsChanges 等）必须全部为 0。
- "outcome" 必须客观描述该行动在政治或现实中遭遇的惨烈失败、杯葛或强行中止的叙事。

============================================================
【LAYER 2 — 时代上下文与输入参数】
============================================================
- **当前年份**：${gameState?.year ?? 1945} 年（属于时代：${gameState?.currentEra ?? 'POST_WW2'}）
- **全球紧张度 (0-100)**：${gameState?.globalTension ?? 20}
- **行动方阵营**：${side.toUpperCase()}
- **当前行动方已研究科技列表**：${JSON.stringify(prunedState?.players?.[side]?.researchedTechs || [])}
- **对手阵营情报渗透度**：${penetration}%
- **裁剪后的游戏当前状态 (GameState)**：
${JSON.stringify(prunedState, null, 2)}
- **历史备忘与近期战报**：
${compressedTimelineStr}

============================================================
【LAYER 3 — 执行协议与输出格式】
============================================================
根据国家冷战分区间（CWS）调整本回合新事件（newEvent）发生的概率与类型：
- CWS < 30: 5% 触发危机, 30% 外交事件, 25% 经济, 15% 科技, 25% 无事。
- CWS 30-60: 20% 危机, 25% 外交, 20% 经济, 15% 科技, 20% 无事。
- CWS 60-85: 35% 危机, 20% 外交, 15% 经济, 10% 科技, 20% 无事。
- CWS > 85: 55% 危机, 15% 外交, 10% 经济, 5% 科技, 15% 无事。

必须返回以下结构的 JSON 数据，不要包含任何 markdown \`\`\`json 代码块标记，直接以 { 开始，以 } 结束：
{
  "validated": true/false,
  "rejectionReason": "当 validated 为 false 时的严厉驳回文书，否则为空",
  "categoryMatch": true/false,
  "outcome": "详细的行动结算叙事描述或被驳回的政治风波叙事",
  "effects": {
    "cwsChanges": {
      "country_id": 5
    },
    "influenceShift": [
      { "side": "usa", "country": "west_germany", "amount": 4 }
    ],
    "budgetChange": -3,
    "prestigeChange": 2,
    "publicSupportChange": 1,
    "globalTensionChange": 2
  },
  "countryStatsChanges": {
    "west_germany": {
      "society.stability": 10,
      "economy.gdp": -5
    }
  },
  "alignmentChanges": {
    "west_germany": "USA_ALLY"
  },
  "newBuffs": [
    {
      "id": "marshall_aid_wg",
      "name": "马歇尔援助",
      "description": "获得来自美国的经济重建援助，提升工业生产能力",
      "targetCountry": "west_germany",
      "effect": {
        "target": "economy.industry",
        "modifier": "add",
        "value": 15
      },
      "duration": 4,
      "remainingTurns": 4
    }
  ],
  "situationChanges": [
    {
      "id": "berlin_blockade",
      "action": "ADVANCE" | "END" | "PROGRESS",
      "progressDelta": 0,
      "endReason": "苏联解除封锁，危机平息"
    }
  ],
  "newEvent": null,
  "newsHeadlines": [
    {
      "headline": "新闻标题",
      "summary": "简短摘要",
      "bias": "PRO_USA" // 或 "PRO_USSR" 或 "NEUTRAL"
    }
  ]
}`

    let content = ''
    if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `玩家行动：\n阵营：${side}\n类别：${action?.category}\n描述：${action?.description}\n\n请严格按照要求给出游戏结算JSON。`,
          }],
        }),
      })

      const data = await response.json()
      content = data.content?.[0]?.text || ''
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `玩家行动：\n阵营：${side}\n类别：${action?.category}\n描述：${action?.description}\n\n请严格按照要求给出游戏结算JSON。` },
          ],
          temperature: 0.6,
          max_tokens: 1500,
        }),
      })

      const data = await response.json()
      content = data.choices?.[0]?.message?.content || ''
    }

    let cleanJson = content.trim()
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/```json|```/g, '').trim()
    }
    const result = JSON.parse(cleanJson)
    return NextResponse.json({ result })

  } catch (error: any) {
    console.error('AI Judge error:', error)
    return NextResponse.json({
      error: error.message || 'AI Judge failed to parse LLM response',
      useRuleEngine: true,
    }, { status: 500 })
  }
}
