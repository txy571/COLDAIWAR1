/**
 * @file 国家情报面板
 * @desc 显示选中国家的详细数据：CWS/阵营/影响力/经济/军事/社会
 *       核国家标记核武库数量，CWS较低时显示警告，支持Buff加成显示
 */
'use client'

import { useGameStore } from '@/store/gameStore'
import { deriveCwsStatus } from '@/types'
import { audioManager } from '@/lib/audio'
import { selectEffectiveCountry } from '@/store/selectors'

export function CountryInfo() {
  const selectedCountryId = useGameStore(s => s.selectedCountryId)
  const baseCountry = useGameStore(s => selectedCountryId ? s.countries[selectedCountryId] : null)
  const effectiveCountry = useGameStore(s => selectedCountryId ? selectEffectiveCountry(s, selectedCountryId) : null)
  const setSelectedCountryId = useGameStore(s => s.setSelectedCountryId)

  if (!baseCountry || !effectiveCountry) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)] text-xs italic">
        <p className="mb-1">选择国家</p>
        <p className="text-[10px]">点击地图上的国家查看情报</p>
      </div>
    )
  }

  const cwsStatus = deriveCwsStatus(effectiveCountry.coldWarScore)
  const aligned = effectiveCountry.alignment === 'USA_ALLY' ? '亲美' :
    effectiveCountry.alignment === 'USSR_ALLY' ? '亲苏' : '不结盟'

  const cwsDiff = effectiveCountry.coldWarScore - baseCountry.coldWarScore
  const cwsDiffText = cwsDiff > 0 ? ` (+${cwsDiff})` : cwsDiff < 0 ? ` (${cwsDiff})` : ''
  const cwsDiffColor = cwsDiff > 0 ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'

  return (
    <div className="p-3 text-xs space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-bold text-[var(--text-primary)] text-sm">{effectiveCountry.name}</h2>
          <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-mono">{effectiveCountry.government}</p>
        </div>
        <button onClick={() => { setSelectedCountryId(null); audioManager.playClick(); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm leading-none">✕</button>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-[var(--text-primary)] mb-1">
          <span>冷战分 (CWS)</span>
          <span className={`font-mono ${effectiveCountry.coldWarScore > 85 ? 'text-red-500 font-bold' : effectiveCountry.coldWarScore > 60 ? 'text-amber-500 font-bold' : 'text-[var(--text-muted)]'}`}>
            {effectiveCountry.coldWarScore}
            {cwsDiffText && <span className={`text-[9px] ml-1 ${cwsDiffColor}`}>{cwsDiffText}</span>}
          </span>
        </div>
        <div className="h-2 bg-[var(--border-main)]/20 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${effectiveCountry.coldWarScore > 85 ? 'bg-red-500' : effectiveCountry.coldWarScore > 60 ? 'bg-amber-500' : 'bg-[var(--text-muted)]'}`} style={{ width: `${effectiveCountry.coldWarScore}%` }} />
        </div>
        <div className="flex justify-between mt-0.5 text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
          <span>阵营: {aligned}</span>
          <span>状态: {cwsStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-sm p-2 text-center">
          <div className="text-blue-500 font-bold font-mono text-sm">{effectiveCountry.influence.usa}</div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">美国影响力</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-2 text-center">
          <div className="text-red-500 font-bold font-mono text-sm">{effectiveCountry.influence.ussr}</div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">苏联影响力</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <StatRow label="经济" baseValue={baseCountry.economy.gdp} value={effectiveCountry.economy.gdp} />
        <StatRow label="工业" baseValue={baseCountry.economy.industry} value={effectiveCountry.economy.industry} />
        <StatRow label="资源" baseValue={baseCountry.economy.resources} value={effectiveCountry.economy.resources} />
        <StatRow label="陆军" baseValue={baseCountry.military.army} value={effectiveCountry.military.army} />
        <StatRow label="海军" baseValue={baseCountry.military.navy} value={effectiveCountry.military.navy} />
        <StatRow label="空军" baseValue={baseCountry.military.airforce} value={effectiveCountry.military.airforce} />
        <StatRow label="稳定" baseValue={baseCountry.society.stability} value={effectiveCountry.society.stability} warn />
        <StatRow label="人口" baseValue={baseCountry.society.population} value={effectiveCountry.society.population} max={800} unit="M" />
      </div>

      {effectiveCountry.military.nuclear && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-2 text-center">
          <span className="text-xs font-bold text-red-500">☢ 核国家 · {effectiveCountry.military.nuclearArsenal} 枚</span>
        </div>
      )}
    </div>
  )
}

function StatRow({ label, baseValue, value, max = 100, unit = '', warn = false }: {
  label: string; baseValue: number; value: number; max?: number; unit?: string; warn?: boolean
}) {
  const pct = Math.min(100, (value / max) * 100)
  const diff = value - baseValue
  const diffText = diff > 0 ? ` (+${diff})` : diff < 0 ? ` (${diff})` : ''
  const diffColor = diff > 0 ? 'text-emerald-500' : 'text-red-500'

  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[9px] text-[var(--text-muted)] font-mono">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--border-main)]/20 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${warn && pct < 30 ? 'bg-red-500' : 'bg-[var(--text-muted)]'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 text-right text-[10px] text-[var(--text-primary)] font-mono whitespace-nowrap">
        <span>{value}{unit}</span>
        {diffText && <span className={`text-[9px] font-bold ml-1 ${diffColor}`}>{diffText}</span>}
      </span>
    </div>
  )
}
