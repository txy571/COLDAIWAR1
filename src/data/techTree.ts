/**
 * @file 科技树完整数据（63节点 × 7时代 × 9节点/时代）
 * @desc 从曼哈顿计划(1945)到量子计算(2025)，覆盖冷战→架空历史
 *       6大分支：NUCLEAR/AEROSPACE/ELECTRONICS/INDUSTRY/COMPUTING/WEAPONS
 *       美苏独占分支：美国(马歇尔/麦卡锡/SDI/隐形/反恐/太空军事化)
 *                     苏联(社会主义阵营/非斯大林化/勃列日涅夫/公开化)
 *       TODO: 科技效果(researchTech)只记进度不应用effects，需接入引擎
 */
import type { TechNode } from '@/types'

// Helper to create a TechNode with runtime defaults
function node(n: Omit<TechNode, 'researched' | 'researchProgress'>): TechNode {
  return { ...n, researched: false, researchProgress: 0 }
}

export const INITIAL_TECH_TREE: TechNode[] = [
  // ========================================================================
  // ERA 0: ATOMIC (1945-1949)
  // ========================================================================
  // --- Military ---
  node({
    id: 'manhattan_project', name: '曼哈顿计划', description: '核裂变武器研发',
    era: 'ERA0_ATOMIC', yearRequirement: 1945, cost: 80,
    prerequisites: [], exclusiveTo: 'usa', category: 'MILITARY', branch: 'NUCLEAR',
    effects: [{ target: 'military.nuclear', modifier: 'set', value: 1 }, { target: 'military.nuclearArsenal', modifier: 'add', value: 3 }, { target: 'military.army', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'jet_fighter', name: '喷气式战斗机', description: '第一代喷气式战斗机',
    era: 'ERA0_ATOMIC', yearRequirement: 1945, cost: 40,
    prerequisites: [], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'WEAPONS',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 12 }],
  }),
  node({
    id: 'radar_network', name: '雷达预警网', description: '远程防空雷达体系',
    era: 'ERA0_ATOMIC', yearRequirement: 1946, cost: 30,
    prerequisites: [], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'ELECTRONICS',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 5 }],
  }),
  // --- Civilian ---
  node({
    id: 'penicillin_mass', name: '青霉素量产', description: '抗生素大规模生产',
    era: 'ERA0_ATOMIC', yearRequirement: 1945, cost: 25,
    prerequisites: [], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: 5 }],
  }),
  node({
    id: 'assembly_line', name: '流水线革命', description: '福特式流水线大规模推广',
    era: 'ERA0_ATOMIC', yearRequirement: 1945, cost: 30,
    prerequisites: [], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'economy.industry', modifier: 'add', value: 12 }, { target: 'economy.gdp', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'postwar_reconstruction', name: '战后重建计划', description: '受损城市和基础设施修复',
    era: 'ERA0_ATOMIC', yearRequirement: 1946, cost: 35,
    prerequisites: [], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: 8 }, { target: 'economy.gdp', modifier: 'add', value: 5 }],
  }),
  // --- Sociology ---
  node({
    id: 'marshall_plan', name: '马歇尔计划理念', description: '大规模经济援助重建西欧',
    era: 'ERA0_ATOMIC', yearRequirement: 1947, cost: 45,
    prerequisites: [], exclusiveTo: 'usa', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [{ target: 'economy.budget', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'socialist_bloc', name: '社会主义阵营理论', description: '苏联卫星国体系构建',
    era: 'ERA0_ATOMIC', yearRequirement: 1947, cost: 40,
    prerequisites: [], exclusiveTo: 'ussr', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),
  node({
    id: 'un_framework', name: '联合国框架', description: '战后国际秩序与外交机制',
    era: 'ERA0_ATOMIC', yearRequirement: 1945, cost: 20,
    prerequisites: [], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),

  // ========================================================================
  // ERA 1: MISSILE (1950-1959)
  // ========================================================================
  // --- Military ---
  node({
    id: 'h_bomb', name: '氢弹', description: '热核武器（百万吨级）',
    era: 'ERA1_MISSILE', yearRequirement: 1952, cost: 90,
    prerequisites: ['manhattan_project'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'NUCLEAR',
    effects: [{ target: 'military.nuclearArsenal', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'b52_strategic', name: 'B-52战略轰炸机', description: '远程战略轰炸平台',
    era: 'ERA1_MISSILE', yearRequirement: 1952, cost: 55,
    prerequisites: ['jet_fighter'], exclusiveTo: 'usa', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'nuclear_sub_propulsion', name: '核潜艇推进', description: '核动力潜艇',
    era: 'ERA1_MISSILE', yearRequirement: 1955, cost: 60,
    prerequisites: ['h_bomb'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'NUCLEAR',
    effects: [{ target: 'military.navy', modifier: 'add', value: 15 }],
  }),
  // --- Civilian ---
  node({
    id: 'transistor', name: '晶体管', description: '固态电子器件革命',
    era: 'ERA1_MISSILE', yearRequirement: 1954, cost: 45,
    prerequisites: [], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'ELECTRONICS',
    effects: [{ target: 'economy.industry', modifier: 'add', value: 15 }, { target: 'economy.gdp', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'highway_network', name: '全国道路网', description: ' Interstate / 全国公路系统',
    era: 'ERA1_MISSILE', yearRequirement: 1956, cost: 40,
    prerequisites: ['postwar_reconstruction'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 8 }],
  }),
  node({
    id: 'polio_vaccine', name: '小儿麻痹疫苗', description: '索尔克疫苗消灭小儿麻痹',
    era: 'ERA1_MISSILE', yearRequirement: 1955, cost: 25,
    prerequisites: ['penicillin_mass'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: 3 }, { target: 'society.population', modifier: 'add', value: 5 }],
  }),
  // --- Sociology ---
  node({
    id: 'mccarthyism', name: '麦卡锡主义/忠诚审查', description: '国内反共忠诚审查运动',
    era: 'ERA1_MISSILE', yearRequirement: 1950, cost: 20,
    prerequisites: [], exclusiveTo: 'usa', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),
  node({
    id: 'de_stalinization', name: '非斯大林化/二十大', description: '赫鲁晓夫秘密报告与改革',
    era: 'ERA1_MISSILE', yearRequirement: 1956, cost: 35,
    prerequisites: [], exclusiveTo: 'ussr', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: 5 }],
  }),
  node({
    id: 'non_aligned_movement', name: '不结盟运动理念', description: '第三世界中立阵营',
    era: 'ERA1_MISSILE', yearRequirement: 1955, cost: 25,
    prerequisites: ['un_framework'], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),

  // ========================================================================
  // ERA 2: SPACE (1960-1969)
  // ========================================================================
  // --- Military ---
  node({
    id: 'icbm', name: '洲际弹道导弹(ICBM)', description: '跨大陆核导弹投送',
    era: 'ERA2_SPACE', yearRequirement: 1959, cost: 80,
    prerequisites: ['h_bomb'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [{ target: 'military.nuclearArsenal', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'recon_satellite', name: '侦察卫星', description: '光学/电子侦察卫星',
    era: 'ERA2_SPACE', yearRequirement: 1962, cost: 50,
    prerequisites: ['icbm'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'abm', name: '反弹道导弹(ABM)', description: '核导弹拦截系统',
    era: 'ERA2_SPACE', yearRequirement: 1966, cost: 65,
    prerequisites: ['icbm', 'radar_network'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'WEAPONS',
    effects: [],
  }),
  // --- Civilian ---
  node({
    id: 'comm_satellite', name: '通信卫星', description: '全球卫星通信网络',
    era: 'ERA2_SPACE', yearRequirement: 1965, cost: 40,
    prerequisites: ['transistor'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'ELECTRONICS',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'integrated_circuit', name: '集成电路', description: '芯片技术的奠基',
    era: 'ERA2_SPACE', yearRequirement: 1961, cost: 50,
    prerequisites: ['transistor'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'ELECTRONICS',
    effects: [{ target: 'economy.industry', modifier: 'add', value: 20 }, { target: 'economy.gdp', modifier: 'add', value: 12 }],
  }),
  node({
    id: 'color_tv', name: '彩色电视广播', description: '彩色电视信号普及',
    era: 'ERA2_SPACE', yearRequirement: 1965, cost: 30,
    prerequisites: ['transistor'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'ELECTRONICS',
    effects: [{ target: 'society.stability', modifier: 'add', value: 5 }],
  }),
  // --- Sociology ---
  node({
    id: 'great_society', name: '伟大社会/民权法案', description: '约翰逊总统的国内改革',
    era: 'ERA2_SPACE', yearRequirement: 1964, cost: 45,
    prerequisites: ['marshall_plan'], exclusiveTo: 'usa', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: 8 }],
  }),
  node({
    id: 'limited_sovereignty', name: '有限主权论', description: '勃列日涅夫主义/卫星国控制',
    era: 'ERA2_SPACE', yearRequirement: 1968, cost: 35,
    prerequisites: ['socialist_bloc'], exclusiveTo: 'ussr', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),
  node({
    id: 'counterculture', name: '反文化运动', description: '60年代青年反文化/反战运动',
    era: 'ERA2_SPACE', yearRequirement: 1967, cost: 15,
    prerequisites: ['un_framework'], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: -5 }],
  }),

  // ========================================================================
  // ERA 3: COMPUTER (1970-1979)
  // ========================================================================
  // --- Military ---
  node({
    id: 'pgm', name: '精确制导(PGM)', description: '激光/电视制导炸弹',
    era: 'ERA3_COMPUTER', yearRequirement: 1972, cost: 50,
    prerequisites: ['integrated_circuit'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'ELECTRONICS',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'c3i', name: 'C3I指挥系统', description: '指挥、控制、通信与情报',
    era: 'ERA3_COMPUTER', yearRequirement: 1973, cost: 55,
    prerequisites: ['recon_satellite', 'integrated_circuit'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'ELECTRONICS',
    effects: [{ target: 'military.army', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'mirv', name: 'MIRV分导式弹头', description: '单弹头多目标重返大气层',
    era: 'ERA3_COMPUTER', yearRequirement: 1970, cost: 75,
    prerequisites: ['icbm'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'NUCLEAR',
    effects: [{ target: 'military.nuclearArsenal', modifier: 'add', value: 30 }],
  }),
  // --- Civilian ---
  node({
    id: 'microprocessor', name: '微处理器', description: 'CPU的发明与普及',
    era: 'ERA3_COMPUTER', yearRequirement: 1971, cost: 55,
    prerequisites: ['integrated_circuit'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'COMPUTING',
    effects: [{ target: 'economy.industry', modifier: 'add', value: 30 }, { target: 'economy.gdp', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'containerization', name: '集装箱标准化', description: '全球航运集装箱标准化',
    era: 'ERA3_COMPUTER', yearRequirement: 1970, cost: 35,
    prerequisites: ['highway_network'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'ct_mri', name: 'CT/MRI医疗影像', description: '计算机断层扫描/核磁共振',
    era: 'ERA3_COMPUTER', yearRequirement: 1973, cost: 40,
    prerequisites: ['integrated_circuit'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'COMPUTING',
    effects: [{ target: 'society.stability', modifier: 'add', value: 5 }],
  }),
  // --- Sociology ---
  node({
    id: 'helsinki_accords', name: '赫尔辛基协议', description: '东西方缓和与信任建立',
    era: 'ERA3_COMPUTER', yearRequirement: 1975, cost: 35,
    prerequisites: ['un_framework', 'non_aligned_movement'], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),
  node({
    id: 'environmentalism', name: '环保运动', description: '现代环保主义兴起',
    era: 'ERA3_COMPUTER', yearRequirement: 1972, cost: 20,
    prerequisites: [], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),
  node({
    id: 'dissident_movement', name: '持不同政见者运动', description: '苏联集团内部异见声音',
    era: 'ERA3_COMPUTER', yearRequirement: 1975, cost: 10,
    prerequisites: ['de_stalinization'], exclusiveTo: 'ussr', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: -5 }],
  }),

  // ========================================================================
  // ERA 4: INFORMATION (1980-1989)
  // ========================================================================
  // --- Military ---
  node({
    id: 'sdi', name: '星球大战(SDI)', description: '战略防御倡议/太空反导系统',
    era: 'ERA4_INFORMATION', yearRequirement: 1983, cost: 100,
    prerequisites: ['abm', 'c3i'], exclusiveTo: 'usa', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [],
  }),
  node({
    id: 'stealth', name: '隐形技术', description: '雷达隐身飞机',
    era: 'ERA4_INFORMATION', yearRequirement: 1983, cost: 85,
    prerequisites: ['pgm'], exclusiveTo: 'usa', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 25 }],
  }),
  node({
    id: 'gps', name: '全球定位系统(GPS)', description: '卫星导航定位网络',
    era: 'ERA4_INFORMATION', yearRequirement: 1983, cost: 70,
    prerequisites: ['comm_satellite'], exclusiveTo: 'usa', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [{ target: 'military.army', modifier: 'add', value: 10 }, { target: 'military.navy', modifier: 'add', value: 10 }, { target: 'military.airforce', modifier: 'add', value: 10 }],
  }),
  // --- Civilian ---
  node({
    id: 'personal_computer', name: '个人计算机', description: 'PC走进家庭与办公室',
    era: 'ERA4_INFORMATION', yearRequirement: 1981, cost: 45,
    prerequisites: ['microprocessor'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'COMPUTING',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'cellular', name: '蜂窝移动通信', description: '第一代移动电话网络',
    era: 'ERA4_INFORMATION', yearRequirement: 1983, cost: 40,
    prerequisites: ['comm_satellite'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'ELECTRONICS',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'tcp_ip', name: 'TCP/IP · 互联网', description: '网络通信协议与互联网雏形',
    era: 'ERA4_INFORMATION', yearRequirement: 1983, cost: 50,
    prerequisites: ['personal_computer', 'comm_satellite'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'COMPUTING',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 20 }],
  }),
  // --- Sociology ---
  node({
    id: 'glasnost', name: '公开化/新思维', description: '戈尔巴乔夫的改革与开放政策',
    era: 'ERA4_INFORMATION', yearRequirement: 1986, cost: 40,
    prerequisites: ['de_stalinization', 'dissident_movement'], exclusiveTo: 'ussr', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'reagan_doctrine', name: '里根主义', description: '美国在全球支持反共武装',
    era: 'ERA4_INFORMATION', yearRequirement: 1985, cost: 45,
    prerequisites: ['mccarthyism'], exclusiveTo: 'usa', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),
  node({
    id: 'human_rights_discourse', name: '国际人权话语', description: '人权外交成为国际议题',
    era: 'ERA4_INFORMATION', yearRequirement: 1985, cost: 30,
    prerequisites: ['helsinki_accords'], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),

  // ========================================================================
  // ERA 5: POST COLD WAR (1990-2005)
  // ========================================================================
  // --- Military ---
  node({
    id: 'jdam', name: 'JDAM精确打击体系', description: '低成本GPS制导炸弹',
    era: 'ERA5_POST_COLD', yearRequirement: 1997, cost: 45,
    prerequisites: ['pgm', 'gps'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'WEAPONS',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'uav', name: '全球鹰/捕食者无人机', description: '长航时侦察/打击无人机',
    era: 'ERA5_POST_COLD', yearRequirement: 1998, cost: 55,
    prerequisites: ['stealth', 'pgm'], exclusiveTo: 'usa', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 20 }],
  }),
  node({
    id: 'nmd', name: '国家导弹防御(NMD)', description: '本土弹道导弹防御系统',
    era: 'ERA5_POST_COLD', yearRequirement: 2002, cost: 90,
    prerequisites: ['sdi'], exclusiveTo: 'usa', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [],
  }),
  // --- Civilian ---
  node({
    id: 'world_wide_web', name: '万维网(WWW)', description: '全球信息网络',
    era: 'ERA5_POST_COLD', yearRequirement: 1993, cost: 40,
    prerequisites: ['tcp_ip'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'COMPUTING',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 30 }],
  }),
  node({
    id: 'human_genome', name: '人类基因组计划', description: '人类DNA序列图谱',
    era: 'ERA5_POST_COLD', yearRequirement: 2003, cost: 60,
    prerequisites: ['ct_mri'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'renewable_energy', name: '可再生能源', description: '太阳能/风能等清洁能源',
    era: 'ERA5_POST_COLD', yearRequirement: 2000, cost: 45,
    prerequisites: ['integrated_circuit'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 10 }],
  }),
  // --- Sociology ---
  node({
    id: 'globalization_theory', name: '全球化理论', description: '经济全球化的制度与理念',
    era: 'ERA5_POST_COLD', yearRequirement: 1995, cost: 30,
    prerequisites: ['helsinki_accords', 'world_wide_web'], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'democratization_wave', name: '民主化浪潮', description: '第三波民主化运动',
    era: 'ERA5_POST_COLD', yearRequirement: 1992, cost: 25,
    prerequisites: ['human_rights_discourse'], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),
  node({
    id: 'war_on_terror', name: '反恐战争框架', description: '911后的全球反恐体制',
    era: 'ERA5_POST_COLD', yearRequirement: 2001, cost: 35,
    prerequisites: ['reagan_doctrine'], exclusiveTo: 'usa', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),

  // ========================================================================
  // ERA 6: INTELLIGENCE (2006-2026)
  // ========================================================================
  // --- Military ---
  node({
    id: 'hypersonic', name: '高超音速武器', description: '速度超过5马赫的突防武器',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2018, cost: 85,
    prerequisites: ['icbm', 'jdam'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 20 }],
  }),
  node({
    id: 'ai_combat', name: 'AI自主作战系统', description: '人工智能辅助/自主战斗',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2022, cost: 90,
    prerequisites: ['uav', 'c3i'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'COMPUTING',
    effects: [{ target: 'military.army', modifier: 'add', value: 20 }],
  }),
  node({
    id: 'space_weaponization', name: '太空军事化', description: '天基武器与太空作战能力',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2019, cost: 75,
    prerequisites: ['nmd', 'sdi'], exclusiveTo: 'usa', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [],
  }),
  // --- Civilian ---
  node({
    id: 'ai_ml', name: 'AI/机器学习', description: '深度学习与人工智能商用',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2012, cost: 55,
    prerequisites: ['world_wide_web', 'personal_computer'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'COMPUTING',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 25 }],
  }),
  node({
    id: 'quantum_computing', name: '量子计算', description: '量子计算机的军用/商用',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2025, cost: 100,
    prerequisites: ['ai_ml', 'microprocessor'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'COMPUTING',
    effects: [{ target: 'economy.industry', modifier: 'add', value: 30 }],
  }),
  node({
    id: 'crispr', name: 'CRISPR基因编辑', description: '基因编辑技术的突破',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2020, cost: 50,
    prerequisites: ['human_genome'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: 10 }],
  }),
  // --- Sociology ---
  node({
    id: 'info_warfare', name: '信息战/认知战', description: '社交媒体时代的舆论作战',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2016, cost: 40,
    prerequisites: ['world_wide_web', 'globalization_theory'], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'COMPUTING',
    effects: [],
  }),
  node({
    id: 'digital_sovereignty', name: '网络主权/数字威权', description: '国家对互联网的控制体系',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2015, cost: 35,
    prerequisites: ['world_wide_web'], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'COMPUTING',
    effects: [],
  }),
  node({
    id: 'global_governance', name: '全球治理改革', description: '21世纪国际制度改革',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2020, cost: 30,
    prerequisites: ['globalization_theory', 'human_rights_discourse'], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [],
  }),

  // ========================================================================
  // ERA EXPANSIONS (2 nodes per era to reach 11 nodes per era)
  // ========================================================================
  // --- Era 0: ATOMIC ---
  node({
    id: 'active_sonar', name: '主动声纳技术', description: '先进主动潜艇探测声纳，保障海域反潜安全。',
    era: 'ERA0_ATOMIC', yearRequirement: 1946, cost: 25,
    prerequisites: [], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'ELECTRONICS',
    effects: [{ target: 'military.navy', modifier: 'add', value: 8 }],
  }),
  node({
    id: 'postwar_welfare', name: '战后福利国家构建', description: '奠定现代社会保障与全民医疗福利体制。',
    era: 'ERA0_ATOMIC', yearRequirement: 1946, cost: 30,
    prerequisites: [], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: 6 }],
  }),

  // --- Era 1: MISSILE ---
  node({
    id: 'dew_line', name: '远距离雷达警戒线', description: '北美及北极圈早期防空雷达网，严防战略轰炸机奇袭。',
    era: 'ERA1_MISSILE', yearRequirement: 1957, cost: 45,
    prerequisites: ['radar_network'], exclusiveTo: 'usa', category: 'MILITARY', branch: 'ELECTRONICS',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'sputnik_tracking', name: '苏联卫星追踪站网', description: '建立第一代全球航天器轨道跟踪与控制中心。',
    era: 'ERA1_MISSILE', yearRequirement: 1957, cost: 45,
    prerequisites: ['radar_network'], exclusiveTo: 'ussr', category: 'MILITARY', branch: 'ELECTRONICS',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 10 }],
  }),

  // --- Era 2: SPACE ---
  node({
    id: 'early_abm', name: '早期反弹道导弹防御', description: '美苏研发的初代核弹头高空防御性拦截系统。',
    era: 'ERA2_SPACE', yearRequirement: 1967, cost: 65,
    prerequisites: ['h_bomb'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'NUCLEAR',
    effects: [{ target: 'military.nuclearArsenal', modifier: 'add', value: 5 }],
  }),
  node({
    id: 'bullet_train', name: '高速铁路革命', description: '以日本新干线为标志的高速铁路网，极大地缩短了城市群通勤时间。',
    era: 'ERA2_SPACE', yearRequirement: 1964, cost: 40,
    prerequisites: ['highway_network'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 12 }, { target: 'society.stability', modifier: 'add', value: 5 }],
  }),

  // --- Era 3: COMPUTER ---
  node({
    id: 'mainframe_banking', name: '大型机银行清算系统', description: '商业银行全面接入IBM等计算机，开启实时跨国结算。',
    era: 'ERA3_COMPUTER', yearRequirement: 1973, cost: 50,
    prerequisites: ['integrated_circuit'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'COMPUTING',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'detente_diplomacy', name: '地缘战略缓和论', description: '美苏元首会晤，探索和平共处与裁军机制。',
    era: 'ERA3_COMPUTER', yearRequirement: 1972, cost: 30,
    prerequisites: ['un_framework'], exclusiveTo: 'SHARED', category: 'SOCIOLOGY', branch: 'INDUSTRY',
    effects: [{ target: 'society.stability', modifier: 'add', value: 8 }],
  }),

  // --- Era 4: INFORMATION ---
  node({
    id: 'supercomputer_nuke', name: '超算核武器模拟', description: '利用超级计算机无需实际引爆即可优化弹头模型。',
    era: 'ERA4_INFORMATION', yearRequirement: 1985, cost: 75,
    prerequisites: ['microprocessor'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'NUCLEAR',
    effects: [{ target: 'military.nuclearArsenal', modifier: 'add', value: 15 }],
  }),
  node({
    id: 'global_erp', name: '全球化资源企管软件', description: '计算机网络辅助供应链管理，大幅提高制造业运转效率。',
    era: 'ERA4_INFORMATION', yearRequirement: 1988, cost: 45,
    prerequisites: ['world_wide_web'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'COMPUTING',
    effects: [{ target: 'economy.industry', modifier: 'add', value: 15 }],
  }),

  // --- Era 5: POST_COLD ---
  node({
    id: 'f22_raptor', name: 'F-22隐身战斗机', description: 'F-22猛禽隐身重型战斗机，确保美方对空的绝对空天制空优势。',
    era: 'ERA5_POST_COLD', yearRequirement: 1997, cost: 70,
    prerequisites: ['stealth'], exclusiveTo: 'usa', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 20 }],
  }),
  node({
    id: 'glonass', name: '格洛纳斯军用卫星导航', description: '苏联/俄罗斯的全球军用三维定位导弹制导星座网。',
    era: 'ERA5_POST_COLD', yearRequirement: 1996, cost: 60,
    prerequisites: ['gps'], exclusiveTo: 'ussr', category: 'MILITARY', branch: 'AEROSPACE',
    effects: [{ target: 'military.airforce', modifier: 'add', value: 15 }],
  }),

  // --- Era 6: INTELLIGENCE ---
  node({
    id: 'cyber_defense_grid', name: '国家级网络安全防御阵线', description: '防范他国黑客入侵基础设施与保密局域网防御计划。',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2010, cost: 60,
    prerequisites: ['digital_sovereignty'], exclusiveTo: 'SHARED', category: 'MILITARY', branch: 'COMPUTING',
    effects: [{ target: 'society.stability', modifier: 'add', value: 10 }],
  }),
  node({
    id: 'clean_tech_rev', name: '新一代固态锂电池及清洁电网', description: '实现跨越式经济与能源安全的新新能源国家电网升级。',
    era: 'ERA6_INTELLIGENCE', yearRequirement: 2015, cost: 70,
    prerequisites: ['renewable_energy'], exclusiveTo: 'SHARED', category: 'CIVILIAN', branch: 'INDUSTRY',
    effects: [{ target: 'economy.gdp', modifier: 'add', value: 20 }],
  }),
]
