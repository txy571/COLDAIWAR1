import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { year, era, globalTension, historyOfThisYear, apiKey, provider } = body

    if (!apiKey) {
      return NextResponse.json({
        error: 'No API key configured',
        useFallback: true,
      }, { status: 400 })
    }

    const systemPrompt = `你是一个冷战大战略回合制游戏的年度新闻主编（Newspaper Editor-in-Chief）。你的职责是根据过去一年（四个回合）中发生的大事、新闻快讯和国家属性，撰写一份复古感极强、符合时代调性的“年度特刊报纸”。

### 【重要规则：时代视觉与笔触约束】
1. **原子时代 (POST_WW2, 1945-1959)**：
   - 笔触：极其庄重、传统印刷报纸风格（如1940年代的《全球时报》、《真理报》）。
   - 调性：充满战后重建的希望，但又对雅尔塔体系下的美苏两极新对峙充满隐忧。用词考究，社论色彩浓厚。
2. **铁幕时代 (IRON_CURTAIN, 1960-1979)**：
   - 笔触：机密电传打字机（Telex）、军事情报机密报告、国家通讯社电报风格。
   - 调性：极度冷酷、克制、充满宣传（Propaganda）色彩。处处透露着核子军备竞赛、太空竞赛的紧张感。
3. **信息时代 (INFO_AGE, 1980+)**：
   - 笔触：现代电子显示屏、CNN全球直播、早期互联网数字电讯稿风格。
   - 调性：快节奏、信息爆炸、充满电子威慑、网络战与太空防御网的科技感。强调算法与数字铁幕。

### 【输入要素】
- **回顾年份**：${year} 年
- **所处时代**：${era}
- **全球紧张度 (0-100)**：${globalTension}
- **本年发生事件/快讯回顾**：
${historyOfThisYear && historyOfThisYear.length > 0
  ? historyOfThisYear.map((item: string) => ` - ${item}`).join('\n')
  : ' - 本年度未爆发公开摩擦，双方在克制中谋求重组。'}

### 【输出格式】
必须输出以下结构的 JSON，不要带有任何 markdown 包裹标记，输出必须是直接可解析的 JSON 对象（严禁包含 \`\`\`json 等任何格式化修饰字符）：
{
  "headline": "时代风格头条标题（如《真理报》：红色威望震动欧洲 或者是 《全球时报》特刊：大国阴云），控制在 25 字以内",
  "content": "报纸的正文内容。文章需要分段，逻辑清晰，行文要极度代入当时的历史环境，对两极博弈进行剖析，评价本年度发生的具体事件并予以锐评。总字数在 250 至 350 字之间。"
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
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `请为冷战 ${year} 年撰写年度报纸 JSON 数据。`,
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
            { role: 'user', content: `请为冷战 ${year} 年撰写年度报纸 JSON 数据。` },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      })

      const data = await response.json()
      content = data.choices?.[0]?.message?.content || ''
    }

    // Sanitize output
    let cleanJson = content.trim()
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/```json|```/g, '').trim()
    }
    const result = JSON.parse(cleanJson)
    return NextResponse.json({ result })

  } catch (error: any) {
    console.error('AI Newspaper generation error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to parse AI newspaper response',
      useFallback: true,
    }, { status: 500 })
  }
}
