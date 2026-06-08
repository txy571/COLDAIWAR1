# 冷战大战略回合制推演游戏 · 设计文档

> 版本：v1.0 · 日期：2026-06-01
> 状态：设计完成，待实施

---

## 1. 项目概述

玩家扮演冷战时期（1945-1991）美苏最高领导人。核心驱动力为 LLM（大语言模型）AI 裁判，进行动态事件生成与回合行动结算。游戏融合国家经营、地缘博弈、外交推演、科技竞赛。

**扩展年份**：科技树延伸至 2026 年，支持冷战延续的架空历史。

---

## 2. 阶段分解 (11 Phase)

| Phase | 名称 | 交付物 | 依赖 |
|-------|------|--------|------|
| 1 | 项目骨架 + 数据层 | Next.js 脚手架、GameState/Country 模型、Zustand store | 无 |
| 2 | 地图引擎 (Era I) | D3.js SVG 世界地图、国家点击交互、羊皮纸风格 | Phase 1 |
| 3 | GUI 外壳 | 三栏布局 + 底部新闻、CWS 排行、末日时钟、情报面板 | Phase 1 |
| 4 | CWS 引擎 | 冷战分计算公式、阈值触发器、回合结算管线 | Phase 1 |
| 5 | 科技树系统 | 军事/民生/社会学三类、时代锁定+惩罚公式、美苏独占分支 | Phase 1 |
| 6 | LLM AI 裁判 | API 集成、三层提示词架构、17条硬约束、事件生成 | Phase 4 |
| 7 | 动态领土变更 | GeoJSON 实时修改、吞并/分裂/合并、前端地图重绘 | Phase 2 |
| 8 | Cloudflare 联机 | 双人实时同步、回合计时、房间系统、断线重连 | Phase 6 |
| 9 | Era II 视觉 | CRT 雷达风格、扫描线、磷光绿国界、雷达动画 | Phase 2 |
| 10 | Era III 视觉 | 赛博全息风格、蜂巢网格、霓虹光柱、Glassmorphism | Phase 2 |
| 11 | 打磨与平衡 | 音效、动效、平衡调优、性能优化、响应式 | Phase 1-10 |

---

## 3. 技术栈

| 层级 | 技术 | 选择理由 |
|------|------|---------|
| 框架 | Next.js (App Router) + TypeScript | 全栈 React，SSR/CSR 灵活切换 |
| 地图渲染 | D3.js v7 + SVG | 完全控制视觉风格，6层渲染管线 |
| 样式 | Tailwind CSS + CSS 自定义属性 | 三套时代主题通过 CSS 变量切换 |
| 状态管理 | Zustand | 游戏全局状态密集，immer 支持不可变更新 |
| LLM 集成 | 客户端自带 API Key (OpenAI/Anthropic) | 零后端成本，Phase 6 实现 |
| 联机 | Cloudflare Durable Objects + WebSockets | Phase 8 实现 |

---

## 4. 回合系统

**时间单位**：1 轮 = 美苏各交替行动 1 次，4 轮 = 1 年
- 每轮包含 4 阶段：AI 事件 → 🇺🇸 美国行动 → 🇷🇺 苏联行动 → 结算
- 每人每轮 1 条行动指令，每年每人共 4 次行动
- 全长约 200 轮（1945-1991，每年 4 轮 × ~50 年）

**年度循环**：

```
Year N (第 N 年)
├── R1 · 春季: AI 事件 → 🇺🇸 行动 ① → 🇷🇺 行动 ① → 结算
├── R2 · 夏季: AI 事件 → 🇺🇸 行动 ② → 🇷🇺 行动 ② → 结算
├── R3 · 秋季: AI 事件 → 🇺🇸 行动 ③ → 🇷🇺 行动 ③ → 结算
└── R4 · 冬季: AI 事件 → 🇺🇸 行动 ④ → 🇷🇺 行动 ④ → 结算 ⭐ 年终
     ├── 胜利检测（5 种胜利条件）
     ├── CWS 重算 + 区域分更新
     ├── Buff 过期清理
     ├── 科技点生成
     └── 年份 +1，时代过渡检查
```

**每轮四阶段详解**：

1. **AI 事件阶段** — 推进已有局势、激活预定义历史事件（按年份触发）、时代过渡通知
2. **🇺🇸 美国行动阶段** — 美国玩家提交 1 条指令（经济/军事/政治/外交/科技），并在结束行动时**立刻交由 AI 裁判完成规则校验与数值结算**。
3. **🇷🇺 苏联行动阶段** — 苏联玩家提交 1 条指令，并在结束行动时**立刻交由 AI 裁判完成规则校验与数值结算**。
4. **结算阶段** — 进行常规系统维护结算，包括重算区域 CWS 分数、更新末日时钟、结算 Buff 过期、科技点生成以及胜利条件检查。

> 美苏交替行动在提交后立刻由 AI 判定，确保每一项具体的决策都能迅速得到 AI 裁判的公正裁决，体现冷战的"行动-反应"动态博弈。

**行动类别**（每人每轮 1 条指令，全年共 4 条）：
- 💰 **经济行动** — 援助、制裁、基建、资源开发
- ⚔️ **军事行动** — 驻军、军售、军演、代理人介入
- 🏛 **政治行动** — 声明、施压、联合国提案、条约
- 🤝 **外交活动** — 峰会、秘密接触、中立国拉拢
- 🔬 **科技行动** — 科研投入、技术窃取、太空竞赛

AI 严格校验行动与类别匹配，不匹配则驳回并引导重写。

---

## 5. 核心数据模型

### GameState

```typescript
interface GameState {
  currentEra: 'POST_WW2' | 'IRON_CURTAIN' | 'INFO_AGE'
  year: number
  turn: number
  phase: 'AI_EVENT' | 'USA_ACTION' | 'USSR_ACTION' | 'RESOLVE'
  globalTension: number              // 0-100
  regionalScores: Record<string, RegionalScore>
  countries: Record<string, Country>
  players: { usa: PlayerState; ussr: PlayerState }
  timeline: TimelineEvent[]
  newsFeed: NewsItem[]
  activeBuffs: Buff[]
  techTrees: { usa: TechNode[]; ussr: TechNode[] }
}
```

### Country

```typescript
interface Country {
  id: string
  name: string
  region: string
  territoryPolygons: string[]
  coldWarScore: number               // 0-100 核心属性
  economy: { gdp: number; industry: number; resources: number; budget: number }
  military: { army: number; navy: number; airforce: number; nuclear: boolean; nuclearArsenal: number }
  society: { stability: number; morale: number; population: number }
  influence: { usa: number; ussr: number }
  alignment: 'USA_ALLY' | 'USSR_ALLY' | 'NON_ALIGNED'
  government: string
  isFlashpoint: boolean
}
```

### PlayerState

```typescript
interface PlayerState {
  side: 'USA' | 'USSR'
  leader: string
  actionPoints: number
  budget: number
  prestige: number
  publicSupport: number
  doomsdayClock: number             // 1-100
  intel: { ussrPenetration: number; cryptanalysis: boolean }
  recentActions: PlayerAction[]
}
```

---

## 6. CWS 冷战分系统

### 计算公式

```
CWS(nation) = BASE + INFLUENCE_GAP + MILITARY + EVENT_BOOST

BASE          = 历史基准热度 (0-30)
INFLUENCE_GAP = min(|USA−USSR| × 0.3, 30)
MILITARY      = foreignTroops × 0.5 + militaryAid × 0.3
EVENT_BOOST   = AI 动态调整 (-20 ~ +30)
```

### 区域 CWS

```
RegionalCWS = AVG(CWS 区域内国家) + 0.2 × MAX(CWS 区域内国家)
```

### 阈值等级

| CWS 区间 | 状态 | 效果 |
|---------|------|------|
| < 30 | 缓和 | 偶发低烈度事件 |
| 30-60 | 紧张 | 高频外交/经济事件 |
| 60-85 | 高危 | 代理人战争概率上升 |
| **> 85** | **临界** | **触发历史级危机** |
| > 95 | 核边缘 | 末日时钟 90+ |

### 1945 初始区域 CWS

| 区域 | 初始 CWS | 焦点国家 |
|------|---------|---------|
| 东欧 | 45 | 东德(45) |
| 东亚 | 40 | 朝鲜(50)、越南(55) |
| 中东 | 35 | 伊朗(20) |
| 拉美 | 15 | 古巴(5) |
| 非洲 | 10 | - |
| 南亚 | 10 | - |
| 大洋洲 | 5 | - |

---

## 7. 科技树系统

### 分类体系

- **⚔️ 军事科技** — 武器、防御、军事理论 → 影响 military 数值
- **🏘️ 民生科技** — 经济、医疗、基建 → 影响 economy/society
- **📚 社会学研究** — 制度、宣传、意识形态 → 影响 influence/prestige

### 七时代划分

| 时代 | 年份 | 视觉风格 | 标志性科技 |
|------|------|---------|-----------|
| ERA0 原子 | 1945-1949 | Era I 羊皮纸 | 曼哈顿计划、喷气机 |
| ERA1 导弹 | 1950-1959 | Era I→II | 氢弹、Sputnik、晶体管 |
| ERA2 太空 | 1960-1969 | Era II CRT | 阿波罗、ICBM、集成电路 |
| ERA3 计算机 | 1970-1979 | Era II CRT | 微处理器、MIRV、C3I |
| ERA4 信息 | 1980-1989 | Era III 全息 | SDI、GPS、隐形技术 |
| ERA5 后冷战 | 1990-2005 | Era III 全息 | 无人机、NMD、互联网 |
| ERA6 智能 | 2006-2026 | Era III 全息 | 高超音速、AI武器、量子 |

### 时代惩罚公式

```
最终研发成本 = baseCost × max(1, 1 + (yearReq − currentYear) × 0.5)
```

- 提前 ≤ 15 年：线性惩罚（每年 +50% 成本）
- 提前 > 15 年：直接锁定，AI 驳回
- 美苏各有独占分支：APOLLO/SDI/F-117 (美) · SPUTNIK/MIR/SS-18 (苏)

### 科技节点统计

- 总计 63 节点（7 时代 × 9 节点/时代 = 每时代 3 军事 + 3 民生 + 3 社会学）
- 美国独占 16 节点，苏联独占 10 节点
- 6 大科技分支：NUCLEAR / AEROSPACE / ELECTRONICS / INDUSTRY / COMPUTING / WEAPONS

---

## 8. LLM AI 裁判系统

### 提示词三层架构

**Layer 1 — 硬规则 (17 条不可逾越)**
1. 行动类别刚性匹配（ECONOMIC/MILITARY/POLITICAL/DIPLOMATIC/TECH）
2. 行动上限（每人每轮 1 条指令，每年 4 条）
3. 时代锁定（跨时代惩罚公式，超15年直接锁）
4. 历史角色约束（美/苏不能违背阵营基本立场）
5. 历史颠覆门槛（重大变更需多回合行动累积）
6. CWS 阈值强制触发（>85 必须触发危机）
7. CWS 变更幅度限制（单次 ±15）
8. 核武器使用门槛（CWS>95 + 本土被入侵）
9. 核武库真实演变基线
10. 回合顺序严格不可跳过
11. 输出格式强制 JSON
12. 数据变更幅度限制
13. 信息不对称规则
14. AI 不替玩家做决定
15. AI 不改底层规则
16. 叙事基于 GameState 事实
17. 新闻来源阵营倾向

**Layer 2 — 时代上下文**
每回合注入 GameState 快照（年份、CWS、科技进度、历史事件摘要、活跃 Buff 等）

**Layer 3 — 执行协议**
结构化 JSON 输出（events → aiActions → resolution → newsHeadlines）

### 事件概率表

| CWS 区间 | 危机 | 外交 | 经济 | 科技 | 无事 |
|----------|:---:|:---:|:---:|:---:|:---:|
| < 30 | 5% | 30% | 25% | 15% | 25% |
| 30-60 | 20% | 25% | 20% | 15% | 20% |
| 60-85 | 35% | 20% | 15% | 10% | 20% |
| > 85 | **55%** | 15% | 10% | 5% | 15% |

---

## 9. 地图引擎 (D3.js + SVG)

### 6 层渲染管线

| Z | 层名 | 内容 | 时代可变 |
|---|------|------|:--------:|
| 5 | 交互层 | 点击/悬停/highlight | ❌ |
| 4 | 标注层 | 国家名称、战略图标 | ❌ |
| 3 | 特效覆盖 | 血渍/雷达扫描/蜂巢 | ✅ |
| 2 | 国家层 | GeoJSON 多边形+国界 | ❌ |
| 1 | 底图装饰 | 羊皮纸纹理/CRT扫描线/网格 | ✅ |
| 0 | 背景 | 海洋色 | ✅ |

### 三时代视觉方案

#### Era I · 战损羊皮纸
- SVG filter: `feTurbulence` 纹理叠加
- 血渍晕染：CWS > 60 时径向渐变
- 手绘国界线：路径坐标微抖动随机偏移
- 配色：#d4c5a9 底 / #5a4a3a 线 / #8b0000 血渍
- 字体：`Courier Prime`

#### Era II · CRT 雷达
- CSS 扫描线：`repeating-linear-gradient`
- 磷光绿发光国界：`feGaussianBlur` glow filter
- 雷达扫描：CSS `rotate` 动画
- 经纬网格：D3 `geoGraticule` 15° 间隔
- 高 CWS 脉冲光点动画

#### Era III · 赛博全息
- 霓虹国界：`feGaussianBlur` ×2 色叠
- 六边形蜂巢：程序生成 SVG pattern
- 光柱可视化：line + glow circle
- 国界双色：青(#00ffff)=亲美、洋红(#ff00ff)=亲苏
- 配色：#0a0015 底 / glassmorphism 面板

### 文件结构

```
src/components/map/
├── MapRenderer.tsx          # 主渲染器 (D3+React 桥接)
├── CountryShape.tsx         # 单国家多边形
├── MapInteraction.tsx       # 交互层
├── Labels.tsx               # 标注层
├── Ocean.tsx                # 海洋/背景
├── eras/
│   ├── EraFilters.tsx       # SVG filter 定义
│   ├── EraPatterns.tsx      # SVG pattern 定义
│   ├── BloodStains.tsx      # Era I 血渍
│   ├── RadarSweep.tsx       # Era II 雷达
│   ├── HexGrid.tsx          # Era III 蜂巢
│   └── DataBeams.tsx        # Era III 光柱
├── hooks/
│   └── useProjection.ts     # 投影缩放
└── data/
    └── world.geo.json       # 冷战 GeoJSON
```

---

## 10. GUI 布局

```
┌────────────────────────────────────────────────────────┐
│ [左侧 260px]      [中央 flex]        [右侧 300px]       │
│ ┌──────────────┐ ┌────────────────┐ ┌──────────────┐  │
│ │ CWS 热点排行  │ │   🌍 世界地图  │ │ 国家情报面板  │  │
│ │ Top 5        │ │ (D3.js SVG)   │ │ CWS/阵营/国力 │  │
│ │ 进度条+数值   │ │               │ └──────────────┘  │
│ ├──────────────┤ │  Era 切换按钮  │ ┌──────────────┐  │
│ │ ⏰ 末日时钟   │ │  tooltip 浮窗  │ │ 🔬 科技树    │  │
│ │ 仪表盘       │ └────────────────┘ │ 进度/分支    │  │
│ ├──────────────┤ ┌────────────────┐ └──────────────┘  │
│ │ 📜 大事记    │ │ 行动指令输入栏  │ ┌──────────────┐  │
│ │ 时间线       │ │ [类别] [输入]  │ │ ⚠ 战略警报   │  │
│ └──────────────┘ │ ⏳ 第 1/4 轮  │ └──────────────┘  │
│                  └────────────────┘                   │
├────────────────────────────────────────────────────────┤
│ 📰 新闻滚动条 (时代自适应字体+风格)                    │
└────────────────────────────────────────────────────────┘
```

### 响应式断点

| 宽度 | 布局 |
|------|------|
| ≥ 1440px | 三栏全展开，地图占 50% |
| 1024-1440px | 左侧折叠，右侧缩为图标 |
| 768-1024px | 左右浮动面板，地图全宽 |
| < 768px | 单栏纵向，底部导航切换 |

---

## 11. 初始世界状态 (1945)

| 国家 | 阵营 | CWS | 亲美 | 亲苏 | 军事 | 经济 | 核武 |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 🇺🇸 美国 | - | 0 | 100 | 0 | 95 | 95 | 3 |
| 🇷🇺 苏联 | - | 0 | 0 | 100 | 85 | 40 | 0 |
| 🇬🇧 英国 | 🇺🇸 | 15 | 80 | 5 | 60 | 50 | 0 |
| 🇫🇷 法国 | 🇺🇸 | 10 | 60 | 15 | 55 | 40 | 0 |
| 🇩🇪 西德 | 🇺🇸 | **45** | 70 | 10 | 20 | 25 | 0 |
| 🇩🇪 东德 | 🇷🇺 | **45** | 5 | 75 | 20 | 15 | 0 |
| 🇨🇳 中国 | 中立 | 30 | 30 | 40 | 15 | 5 | 0 |
| 🇯🇵 日本 | 🇺🇸 | 5 | 90 | 0 | 5 | 20 | 0 |
| 🇰🇷 韩国 | 🇺🇸 | **50** | 75 | 5 | 10 | 5 | 0 |
| 🇰🇵 朝鲜 | 🇷🇺 | **50** | 5 | 85 | 15 | 5 | 0 |
| 🇨🇺 古巴 | 🇺🇸 | 5 | 85 | 5 | 5 | 20 | 0 |
| 🇻🇳 越南 | 中立 | **55** | 20 | 60 | 5 | 3 | 0 |
| 🇮🇷 伊朗 | 中立 | 20 | 45 | 40 | 15 | 15 | 0 |
| 🇪🇬 埃及 | 中立 | 15 | 40 | 30 | 10 | 8 | 0 |

开局默认：中国走 CPC 胜利线（1949 年建国），美苏可通过行动影响内战走向。

---

## 12. 先决条件与依赖

- Node.js 18+ / pnpm
- GeoJSON 世界地图数据（约 40 个国家）
- D3.js v7 + @types/d3
- Zustand + immer
- Tailwind CSS v3+
- 可选：OpenAI / Anthropic API Key（Phase 6）

---

## 13. 未定事项 (Future Phase)

- Cloudflare Durable Objects 联机架构（Phase 8 详细设计）
- 音效设计（Phase 11）
- 移动端触控优化（Phase 11）
- 本地化 (i18n) 策略
- 录像回放/战报导出
