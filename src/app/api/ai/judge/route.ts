import { NextResponse } from 'next/server'

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

    // --- Layer 2: Era Context & Information Asymmetry ---
    const side = activePlayerSide || 'usa'
    const playerState = side === 'usa' ? gameState?.players?.usa : gameState?.players?.ussr
    const opponentState = side === 'usa' ? gameState?.players?.ussr : gameState?.players?.usa
    const penetration = playerState?.intel?.ussrPenetration ?? 50

    // Filter country data based on intelligence level (Information Asymmetry)
    const filteredCountries: Record<string, any> = {}
    if (gameState?.countries) {
      for (const [cid, country] of Object.entries(gameState.countries) as [string, any][]) {
        // If penetration is low (< 30), obscure details of opponent-aligned countries
        const opponentSide = side === 'usa' ? 'USSR_ALLY' : 'USA_ALLY'
        if (penetration < 30 && country.alignment === opponentSide) {
          filteredCountries[cid] = {
            id: country.id,
            name: country.name,
            region: country.region,
            alignment: country.alignment,
            // Obscure exact values
            coldWarScore: '???',
            influence: { usa: '???', ussr: '???' },
            government: '???',
          }
        } else {
          filteredCountries[cid] = country
        }
      }
    }

    const systemPrompt = `你是一个冷战大战略回合制游戏的 AI 裁判（Game Master），在游戏中拥有至高无上的绝对裁判权与数据修改控制权。你的核心职责是作为绝对中立、严苛公正的规则维护者，对玩家提交的行动进行结算。

### 🚨【绝对公正裁判与严格约束守则】
1. **绝对中立与权威**：你不是玩家的助手，而是这场地缘政治游戏的唯一主宰。你必须对任何不合理、不切实际、越权或违规的玩家行动进行冷酷无情的打回和修正。
2. **违规主动打回（Validated: false）**：
   - 面对任何“不正常、荒谬或超限”的要求，你必须将返回 JSON 中的 "validated" 设为 false，并在 "rejectionReason" 中给出严正的裁判打回理由！
   - 以下情况必须打回：
     * **越界军事打击**：未经宣战或未在紧张局势极高（>95）且本土未受威胁的情况下进行核打击，必须立即打回。
     * **严重立场背叛**：美国玩家直接执行纯共产主义性质行动（如宣布实行无产阶级计划经济），或苏联玩家直接推行全面资本自由化（如私有化一切国有资产），必须立即打回。
     * **超时代科技要求**：当前年份不允许的超前科技研发或使用（超前年份 > 15年，如在1945年研制GPS或互联网），必须打回。
     * **无法达成的目标**：没有相应的情报网却要求“彻底刺杀对手元首”、没有预算却要求“援助全世界”等荒诞命令。
     * **数值越界**：单回合行动要求瞬间将自身或者同盟国的某项数值提升至满值或改动幅度极为巨大（加减数值绝对值超过30）。
3. **数据操纵绝对控制权**：你有权直接干预国家底层数据。请根据结算逻辑合理利用以下字段修改游戏沙盒：
   - 使用 **"countryStatsChanges"**：直接对特定国家的 economy (gdp, industry, resources, budget), military (army, navy, airforce), 或 society (stability, morale) 进行微调（数值改动建议限制在 [-15, 15]之间）。
   - 使用 **"alignmentChanges"**：在国家受到强烈地缘政治冲击时，可直接将其阵营偏转为 "USA_ALLY", "USSR_ALLY", 或 "NON_ALIGNED"。
   - 使用 **"newBuffs"**：针对突发局势或玩家行动，生成临时增益/减益效果（如“马歇尔复兴计划：gdp +15持续6回合”或“游击战袭扰：stability -10持续4回合”）。

### 📋【硬规则 (17条不可逾越)】
1. **行动类别匹配**：严格校验玩家提交的行动描述是否与指定的类别（ECONOMIC, MILITARY, POLITICAL, DIPLOMATIC, TECH）相符。不相符则必须驳回。
2. **行动上限**：每回合每方仅允许执行 1 条行动指令。
3. **时代锁定**：如果行动涉及的技术研发或事件，与当前年份要求相比提前 > 15年（例如在1945年研究1960年后的太空技术），必须直接驳回。
4. **历史角色约束**：美苏双方不能违背其根本意识形态立场（例如美国直接实行计划经济或苏联建立资本主义联邦），若发生需予以驳回或重大惩罚。
5. **历史颠覆门槛**：涉及地缘政治方向的重大变更（如国家阵营偏向变更、合并或分裂），必须在 outcome 中描述为多回合行动积累的结果，单次行动不能直接彻底颠覆。
6. **CWS 阈值强制触发**：若有任意国家的冷战分（CWS）大于 85，必须在此回合的 newEvent 中触发相关的历史性危机事件。
7. **CWS 变更幅度限制**：单次结算对单个国家 CWS 调整绝对值不能超过 15。
8. **核武器使用门槛**：只有当全球紧张度（globalTension）或国家 CWS 大于 95 且发生本土被入侵的情况下，才能同意核打击相关行动，否则强制驳回。
9. **核武库真实演变基线**：在1949年之前，苏联不具备实际部署核武的能力，若违反需予以驳回。
10. **输出格式强制 JSON**：只允许输出合法的 JSON，不能带任何 \`\`\`json 包裹或额外Markdown格式。
11. **数据变更幅度限制**：单次行动对玩家的 budgetChange, prestigeChange, publicSupportChange 调整幅度必须在 [-10, 10] 之间。
12. **新闻倾向性**：新闻条目的 headline 必须带有明显的偏向性（亲美新闻 PRO_USA, 亲苏新闻 PRO_USSR, 中立 NEUTRAL），符合各自阵营的宣传调性。

### 📅【时代上下文】
- **当前年份**：${gameState?.year ?? 1945} 年（属于时代：${gameState?.currentEra ?? 'POST_WW2'}）
- **全球紧张度 (0-100)**：${gameState?.globalTension ?? 20}
- **行动方阵营**：${side.toUpperCase()}
- **对手阵营情报渗透度**：${penetration}%
- **当前国家情报（已进行信息不对称过滤）**：
${JSON.stringify(filteredCountries, null, 2)}

### 【Layer 3 — 执行协议与事件概率表】
根据国家冷战分区间（CWS）调整本回合新事件（newEvent）发生的概率与类型：
- CWS < 30: 5% 概率触发危机, 30% 外交事件, 25% 经济事件, 15% 科技事件, 25% 无事。
- CWS 30-60: 20% 危机, 25% 外交, 20% 经济, 15% 科技, 20% 无事。
- CWS 60-85: 35% 危机, 20% 外交, 15% 经济, 10% 科技, 20% 无事。
- CWS > 85: 55% 危机, 15% 外交, 10% 经济, 5% 科技, 15% 无事。

必须返回以下结构的 JSON 数据，不要包含任何 markdown 代码块标记：
{
  "validated": true,
  "rejectionReason": "",
  "categoryMatch": true,
  "outcome": "详细的行动结算叙事描述",
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
  "newEvent": null, // 如果有新危机爆发，此处返回事件对象，否则为 null
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
      // Default: OpenAI
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

    // Try parsing content safely
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
