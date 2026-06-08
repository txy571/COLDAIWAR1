/**
 * @file Local Fallback Retrospective Newspaper Generator
 * @desc Composes retro-appropriate headline and text retrospectively based on game stats
 *       when the user's API key is not configured.
 */

import type { GameStore } from '@/store/gameStore'

export interface LocalNewspaper {
  headline: string
  content: string
}

export function generateLocalNewspaper(
  year: number,
  era: 'POST_WW2' | 'IRON_CURTAIN' | 'INFO_AGE',
  state: GameStore
): LocalNewspaper {
  const tension = state.globalTension
  const usaScore = state.players.usa.victoryScore
  const ussrScore = state.players.ussr.victoryScore
  const leadingFaction = usaScore > ussrScore ? 'usa' : ussrScore > usaScore ? 'ussr' : 'tied'

  // Filter events and actions that happened in this year
  const yearEvents = state.timeline.filter((e) => e.year === year)
  const yearNews = state.newsFeed.filter((n) => n.year === year)

  // Construct a summary list of what transpired
  const summaryBulletPoints = [
    ...yearEvents.map((e) => `【大事记】${e.title}: ${e.description}`),
    ...yearNews.slice(0, 3).map((n) => `【快讯】${n.headline}`)
  ]

  let eventSummaryText = summaryBulletPoints.length > 0
    ? `\n\n本年度重要事件回顾：\n` + summaryBulletPoints.map(p => `• ${p}`).join('\n')
    : '\n\n本年度地缘格局在平静的对峙中度过，未爆发大规模公开危机。'

  // Templates based on Era & geostrategic conditions
  if (era === 'POST_WW2') {
    // Vintage print style (1945-1959)
    let headline = ''
    let body = ''

    if (tension > 70) {
      headline = `《全球时报》特刊：大国对立加剧，核阴云笼罩战后天空`
      body = `在刚刚过去的 ${year} 年里，战后重建的微弱和平被两极对抗的狂风彻底吹散。华盛顿与莫斯科在各个地缘热点频频角力，紧张局势已飙升至战后新高。军事部署的阴影在欧亚大陆不断蔓延，世界舆论普遍担忧，雅尔塔协议所构建的微弱平衡正处于崩溃边缘。`
    } else {
      if (leadingFaction === 'usa') {
        headline = `《自由灯塔报》：西方盟邦经济繁荣，自由阵营巩固全球优势`
        body = `回首 ${year} 年，美国及西欧盟国展现了雄厚的经济与资本优势。马歇尔计划式的援助和自由贸易体制为自由世界筑起了坚不可摧的防线。克里姆林宫在欧洲的扩张受到了强力遏制，西方观察家普遍对当前大战略优势持乐观态度。`
      } else if (leadingFaction === 'ussr') {
        headline = `《真理报》：社会主义建设突飞猛进，红色阵营威望空前高涨`
        body = `在伟大的 ${year} 年度总结中，红旗正指引着全球被压迫民族的解放事业。苏联及其兄弟盟国的重工业与军事现代化取得了令人瞩目的胜利。莫斯科正向帝国主义的封锁发起全面反击，国际进步力量在国际斗争中已经稳步占据主动。`
      } else {
        headline = `《泰晤士报》年终特稿：均势下的冷战，两极格局正式成型`
        body = `随着 ${year} 年的落幕，铁幕两端的发展均步入正轨。两大超级大国在保持克制的同时，正密锣紧鼓地进行阵营重组。势力范围的划分已经基本确立，局部和平与总体对抗成为了当今时代的双重主旋律。`
      }
    }

    return {
      headline,
      content: body + eventSummaryText + `\n\n（全球时报联合特约电 · 首席评论员）`
    }

  } else if (era === 'IRON_CURTAIN') {
    // Teletype / Grid printout style (1960-1979)
    let headline = ''
    let body = ''

    if (tension > 75) {
      headline = `[CL-DEPT-MSG] 绝密情报通报：核大战边缘边缘值突破，防空警报全面拉响`
      body = `ALERT: 针对 ${year} 年度地缘政治轨迹的计算机模型推演表明，核冲突概率已升至历史高点。太空竞赛的军事化以及局部代理人战争正使局势急剧失控。华盛顿防空地下室储备激增，莫斯科战略火箭军进入一级戒备，警惕先发制人核打击。`
    } else {
      if (leadingFaction === 'usa') {
        headline = `[RECAP-USA] 战略情报局简报：对苏技术与太空威慑见效，遏制网络有效运转`
        body = `DECLASSIFIED: 本年度情报汇总显示，美国在全球地缘太空与精确技术研发领域的投资开始转化为战略净资产。苏联在东欧及第三世界的经济负担正不断加剧，北约侧翼的安全态势在本年度内获得了可量化的战略改善。`
      } else if (leadingFaction === 'ussr') {
        headline = `[KGB-REPORT] 克格勃年终战略研判：帝国主义防线退缩，反帝爱国斗争节节胜利`
        body = `SECRET: 苏维埃社会主义共和国联盟在 ${year} 年的代理人博弈中取得了重大突破。导弹部队的战略威慑令北约不敢轻举妄动。红海军的全球航行展示了无与伦比的力量，资本主义世界的经济危机正在为其内部瓦解推波助澜。`
      } else {
        headline = `[INTEL-STATUS] 联合参谋部年度简报：缓和阴影下的暗战，常规力量均势维持`
        body = `SUMMARY: ${year} 年，美苏双方虽然签署了多项军控限制框架，但暗地里的渗透与情报战从未停歇。双方的技术研发均进入导弹与太空深度整合期。世界在核恐怖平衡（MAD）下维系着奇迹般的稳定。`
      }
    }

    return {
      headline,
      content: body + eventSummaryText + `\n\n[FILE-REF: COMINT-RETRO-${year}]`
    }

  } else {
    // Digital screen / Holo newsfeed style (1980+)
    let headline = ''
    let body = ''

    if (tension > 80) {
      headline = `【CNN 全球速递】末日钟声逼近午夜，全球局势面临终极危机`
      body = `在刚刚结束的 ${year} 年，数字化指挥系统和天基武器防御网的快速部署让大国对决的速度提升到了微秒级。网络战与太空威慑相互交织，任何一次微小的误判都可能在五分钟内引发灭世级别的热核反击。和平正依赖最脆弱的数字代码维持。`
    } else {
      if (leadingFaction === 'usa') {
        headline = `【华尔街日报】信息革命与新冷战：西方科技霸权确立，红色巨人步履蹒跚`
        body = `在 ${year} 年度的全球科技与资本大版图上，个人电脑和全球互联网的爆发为以美国为首的西方阵营注入了无限的繁荣动力。相比之下，苏联集团由于体制僵化和技术禁运，在信息时代浪潮中正逐步滑落，面临严重的结构性失衡危机。`
      } else if (leadingFaction === 'ussr') {
        headline = `【红星广播电台】坚守社会主义数字化前沿，红星战术系统全球反击成功`
        body = `经过 ${year} 年的顽强斗争，苏维埃科技工作者研发的新型数字指控系统和重工业自动化取得了跨越式进展。我们在太空武器和高超音速导弹技术上保持着对资本主义阵营的绝对优势。西方企图利用金融霸权窒息红色联盟的阴谋已被彻底粉碎。`
      } else {
        headline = `【路透社科技与地缘特稿】数字铁幕下的世界：信息鸿沟与双重网络格局`
        body = `截至 ${year} 年底，全球基本分裂为两套平行运作的数字信息网络。超级大国正通过微处理器、天基监视和先进导弹技术展开新一轮看不见硝烟的较量。这不再仅仅是传统地缘争夺，更是一场关于数字与算法霸权的生死时速。`
      }
    }

    return {
      headline,
      content: body + eventSummaryText + `\n\n（全球数字新闻社数字电播）`
    }
  }
}
