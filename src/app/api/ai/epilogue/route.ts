import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { winner, winnerName, loserName, victoryType, year, turn, score, timelineSummary, researchedTechs, apiKey, provider } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 400 })
    }

    const systemPrompt = `你是一个冷战史学家和资深军事档案记录员。
你的任务是根据这一局冷战推演的终局数据，为玩家撰写一篇客观、深邃、符合冷战纪实文学风格（约 300 - 500 字）的【冷战终局 · 历史年鉴后记】。

你拿到的终局战报要素如下：
- 胜利阵营：${winner === 'usa' ? '西方自由民主阵营（美利坚合众国）' : '东方社会主义阵营（苏维埃社会主义共和国联盟）'}
- 终局年份：${year} 年（共推进了 ${turn} 回合）
- 胜利类型：${victoryType} （如：支配胜利、太空竞赛胜利、核威慑绝对优势、意识形态渗透、经济崩溃碾压）
- 双方最终比分：美国 ${score?.usa} 分 - 苏联 ${score?.ussr} 分
- 胜利方研发的标志性终极技术：${JSON.stringify(researchedTechs || [])}
- 整局重大地缘大事记摘要：
${timelineSummary}

【写作要求】：
1. 口吻庄严、冷峻、反思，带有深刻的地缘政治史诗感，符合纪实文学或解密历史档案的调性。
2. 结合上方提供的大事记脉络和终极科技，串联描述整场冷战如何一步步推向终局。
3. 详细描写战败国倒下时的历史性一幕，以及战胜国定义的新世界秩序秩序（例如，如果美国获得太空竞赛胜利，描写星条旗在星辰大海中确立霸权；如果苏联获得核威慑胜利，描写红色核盾牌令西方最终屈服妥协）。
4. 只返回生成的文章文本，不要带任何 markdown 代码块或 json 格式包裹。`

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
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `请为这一局冷战博弈撰写年鉴后记。`,
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
            { role: 'user', content: `请为这一局冷战博弈撰写年鉴后记。` },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      })

      const data = await response.json()
      content = data.choices?.[0]?.message?.content || ''
    }

    return NextResponse.json({ result: content.trim() })

  } catch (error: any) {
    console.error('AI Epilogue error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate memoir' }, { status: 500 })
  }
}
