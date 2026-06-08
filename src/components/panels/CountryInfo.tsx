/**
 * @file 国家情报面板
 * @desc 显示选中国家的详细数据：CWS/阵营/影响力/经济/军事/社会
 *       核国家标记核武库数量，CWS较低时显示警告
 */
'use client'

import { useGameStore } from '@/store/gameStore'
import { deriveCwsStatus } from '@/types'

export function CountryInfo() {
  const selectedCountryId = useGameStore(s => s.selectedCountryId)
  const country = useGameStore(s => selectedCountryId ? s.countries[selectedCountryId] : null)
  const setSelectedCountryId = useGameStore(s => s.setSelectedCountryId)

  if (!country) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)] text-xs italic">
        <p className="mb-1">选择国家</p>
        <p className="text-[10px]">点击地图上的国家查看情报</p>
      </div>
    )
  }

  const cwsStatus = deriveCwsStatus(country.coldWarScore)
  const aligned = country.alignment === 'USA_ALLY' ? '亲美' :
    country.alignment === 'USSR_ALLY' ? '亲苏' : '不结盟'

  return (
    <div className="p-3 text-xs space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-bold text-[var(--text-primary)] text-sm">{country.name}</h2>
          <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-mono">{country.government}</p>
        </div>
        <button onClick={() => setSelectedCountryId(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm leading-none">✕</button>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-[var(--text-primary)] mb-1">
          <span>冷战分 (CWS)</span>
          <span className={`font-bold font-mono ${country.coldWarScore > 85 ? 'text-red-500' : country.coldWarScore > 60 ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>{country.coldWarScore}</span>
        </div>
        <div className="h-2 bg-[var(--border-main)]/20 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${country.coldWarScore > 85 ? 'bg-red-500' : country.coldWarScore > 60 ? 'bg-amber-500' : 'bg-[var(--text-muted)]'}`} style={{ width: `${country.coldWarScore}%` }} />
        </div>
        <div className="flex justify-between mt-0.5 text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
          <span>阵营: {aligned}</span>
          <span>状态: {cwsStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-sm p-2 text-center">
          <div className="text-blue-500 font-bold font-mono text-sm">{country.influence.usa}</div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">美国影响力</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-2 text-center">
          <div className="text-red-500 font-bold font-mono text-sm">{country.influence.ussr}</div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">苏联影响力</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <StatRow label="经济" value={country.economy.gdp} />
        <StatRow label="工业" value={country.economy.industry} />
        <StatRow label="资源" value={country.economy.resources} />
        <StatRow label="陆军" value={country.military.army} />
        <StatRow label="海军" value={country.military.navy} />
        <StatRow label="空军" value={country.military.airforce} />
        <StatRow label="稳定" value={country.society.stability} warn />
        <StatRow label="人口" value={country.society.population} max={800} unit="M" />
      </div>

      {country.military.nuclear && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-2 text-center">
          <span className="text-xs font-bold text-red-500">☢ 核国家 · {country.military.nuclearArsenal} 枚</span>
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value, max = 100, unit = '', warn = false }: {
  label: string; value: number; max?: number; unit?: string; warn?: boolean
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[9px] text-[var(--text-muted)] font-mono">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--border-main)]/20 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${warn && pct < 30 ? 'bg-red-500' : 'bg-[var(--text-muted)]'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-[10px] text-[var(--text-primary)] font-mono">{value}{unit}</span>
    </div>
  )
}
