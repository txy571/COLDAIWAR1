/**
 * @file 预定义冷战年度大事件数据库
 * @desc 存储从1945年到1991年的主要冷战历史事件，在每年年初的 AI_EVENT 阶段自动激活，记入大事件年表。
 */

export interface AnnualEvent {
  year: number
  title: string
  description: string
  type: 'MILITARY' | 'ECONOMIC' | 'POLITICAL' | 'DIPLOMATIC' | 'TECH'
}

export const ANNUAL_EVENTS: Record<number, AnnualEvent> = {
  1945: { year: 1945, title: '雅尔塔会议与波茨坦公告', description: '美英苏三国元首确立战后势力范围与德国分区占领框架，联合国宪章签署。', type: 'POLITICAL' },
  1946: { year: 1946, title: '铁幕演说', description: '丘吉尔在美国富尔顿发表著名的“铁幕”演说，宣告冷战对抗的序幕正式拉开。', type: 'POLITICAL' },
  1947: { year: 1947, title: '杜鲁门主义与马歇尔计划', description: '美国承诺遏制共产主义扩张；马歇尔计划启动，大规模经济援助西欧。', type: 'ECONOMIC' },
  1948: { year: 1948, title: '关税与贸易总协定(GATT)生效', description: '23国签署的GATT正式生效，建立战后多边贸易体制与西方自由贸易体系的基础。', type: 'ECONOMIC' },
  1949: { year: 1949, title: '北大西洋公约组织成立', description: '美英法等12国结成集体安全防线，北约成立。同年苏联试爆首颗原子弹打破垄断。', type: 'MILITARY' },
  1950: { year: 1950, title: '中苏友好同盟互助条约签署', description: '毛泽东访问莫斯科，中苏结盟，确立社会主义阵营在远东的战略同盟关系。', type: 'DIPLOMATIC' },
  1953: { year: 1953, title: '斯大林逝世', description: '苏联领袖斯大林逝世，赫鲁晓夫逐步掌控苏共，美苏关系进入短暂缓和试探期。', type: 'POLITICAL' },
  1954: { year: 1954, title: '奠边府战役', description: '越盟军队彻底击败法军，日内瓦会议决定北纬17度南北分治，法国撤出印支。', type: 'MILITARY' },
  1955: { year: 1955, title: '华沙条约组织成立', description: '苏联与东欧七国在华沙缔结军事同盟，标志着北约-华约两大阵营对峙彻底成型。', type: 'MILITARY' },
  1957: { year: 1957, title: '斯普特尼克一号升空', description: '苏联成功发射人类第一颗人造卫星，引发美国国防恐慌，太空竞赛拉开帷幕。', type: 'TECH' },
  1961: { year: 1961, title: '加加林进入太空', description: '苏联宇航员尤里·加加林乘东方一号完成首次载人航天飞行，确立了苏联早期的宇宙优势。', type: 'TECH' },
  1963: { year: 1963, title: '美苏热线开通', description: '古巴危机后，美苏开通直通热线以防战略误判，并签署《部分禁止核试验条约》。', type: 'DIPLOMATIC' },
  1964: { year: 1964, title: '中国首次核试验成功', description: '中国在罗布泊成功爆破首枚原子弹，宣告打破美苏核垄断，成为第五个核国家。', type: 'TECH' },
  1969: { year: 1969, title: '阿波罗11号登月', description: '美国宇航员阿姆斯特朗成功踏足月球表面，“个人一小步，人类一大步”，美国赢得登月争霸。', type: 'TECH' },
  1970: { year: 1970, title: '不扩散核武器条约生效', description: '《不扩散核武器条约》（NPT）正式生效，试图限制核国家增加，防止核冲突全球蔓延。', type: 'POLITICAL' },
  1971: { year: 1971, title: '乒乓外交与重返联合国', description: '中美关系破冰；联大第2758号决议恢复中华人民共和国在联合国的合法席位。', type: 'POLITICAL' },
  1972: { year: 1972, title: '尼克松访华与SALT I签署', description: '中美联合发表上海公报；美苏元首签署第一阶段限制战略武器条约，缓和达到高潮。', type: 'DIPLOMATIC' },
  1975: { year: 1975, title: '阿波罗-联盟轨道握手', description: '美苏飞船在近地轨道对接，双方宇航员实现历史性握手，成为缓和时期的标志。', type: 'TECH' },
  1978: { year: 1978, title: '中国实行改革开放', description: '十一届三中全会确立经济建设为核心，开启中国波澜壮阔的改革开放与现代化进程。', type: 'ECONOMIC' },
  1980: { year: 1980, title: '莫斯科奥运会惨遭抵制', description: '因苏联入侵阿富汗，美国等60多国联合拒绝参加莫斯科奥运会，冷战再度急速冷冻。', type: 'POLITICAL' },
  1983: { year: 1983, title: '战略防御计划提出', description: '里根发表“星球大战”演习计划，提议建造陆基和天基激光反导导弹伞。', type: 'MILITARY' },
  1985: { year: 1985, title: '戈尔巴乔夫上台', description: '新一代领导人戈尔巴乔夫出任苏共总书记，开始推行“新思维”和全面政治经济改革。', type: 'POLITICAL' },
  1987: { year: 1987, title: '签署中导条约', description: '美苏在华盛顿正式签署INF条约，同意全部销毁中程与中近程导弹，冷战步入尾声。', type: 'DIPLOMATIC' },
  1991: { year: 1991, title: '苏联解体与冷战终结', description: '阿拉木图宣言发表，克里姆林宫降下红旗，苏联正式解体，宣告两极世界冷战终结。', type: 'POLITICAL' }
}
