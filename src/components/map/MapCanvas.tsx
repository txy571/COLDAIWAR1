'use client'

/**
 * @file 地图主渲染器（6层SVG渲染管线）
 * @desc Layer 0-1: 背景/滤镜 → Layer 2: 国家多边形(含领土覆盖着色) →
 *       Layer 3: 血渍效果 → Layer 4: 标签+分界线 → Layer 5: 交互(tooltip)
 *       支持领土转移混色(65%新主人+35%原主人)
 *       TODO: Era II 经纬网格(geoGraticule 15°)未实现
 *       TODO: Era III 光柱可视化(DataBeams)未实现
 *       TODO: 高CWS脉冲光点动画未实现
 */
import { useMemo, useCallback, useRef } from 'react'
import { audioManager } from '@/lib/audio'
import { useGameStore } from '@/store/gameStore'
import { useProjection } from './hooks/useProjection'
import { useMapInteraction } from './hooks/useMapInteraction'
import { useMapZoom } from './hooks/useMapZoom'
import { EraFilters } from './eras/EraFilters'
import { EraPatterns } from './eras/EraPatterns'
import { Ocean } from './Ocean'
import { CountryShape } from './CountryShape'
import { BloodStains } from './eras/BloodStains'
import { CrtOverlay } from './eras/CrtOverlay'
import { CyberOverlay } from './eras/CyberOverlay'
import { DataBeams } from './eras/DataBeams'
import { Labels } from './Labels'
import { DividedBorders } from './DividedBorders'
import { MapInteraction } from './MapInteraction'
import geoData from '@/data/world.geo.json'
import type { Feature, Geometry } from 'geojson'
import type { Alignment } from '@/types'

interface MapCanvasProps {
  width: number
  height: number
}

export function MapCanvas({ width, height }: MapCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const countries = useGameStore(s => s.countries)
  const currentEra = useGameStore(s => s.currentEra)
  const selectedCountryId = useGameStore(s => s.selectedCountryId)
  const setSelectedCountryId = useGameStore(s => s.setSelectedCountryId)
  const territoryOverrides = useGameStore(s => s.territoryOverrides)
  const getEffectiveOwner = useGameStore(s => s.getEffectiveOwner)

  const features = useMemo(() => {
    return (geoData as any).features as Feature<Geometry>[]
  }, [])

  // Build a set of countries that exist in our game data (for filtering)
  const knownCountryIds = useMemo(() => new Set(Object.keys(countries)), [countries])

  // GeoFeatures that match known countries OR are claimed by someone via override
  const geoFeatures = useMemo(() => {
    return features.filter(f => {
      const props = f.properties as any
      const fid = props?.id as string
      // Include if the country exists in game data or is claimed via territory override
      if (fid && knownCountryIds.has(fid)) return true
      if (fid && territoryOverrides[fid] && knownCountryIds.has(territoryOverrides[fid])) return true
      return false
    })
  }, [features, knownCountryIds, territoryOverrides])

  const { projection, pathGenerator } = useProjection(width, height, geoFeatures)
  const { hoveredCountryId, tooltip, handleCountryHover, handleCountryLeave, handleMouseMove } = useMapInteraction()
  useMapZoom(svgRef, projection.scale(), width)

  const mapWidth = useMemo(() => {
    return projection.scale() * 2 * Math.PI
  }, [projection])

  const handleCountryClick = useCallback((countryId: string) => {
    audioManager.playClick()
    setSelectedCountryId(countryId === selectedCountryId ? null : countryId)
  }, [selectedCountryId, setSelectedCountryId])

  const countryPaths = useMemo(() => {
    const result: Record<string, string> = {}
    for (const f of geoFeatures) {
      const id = (f.properties as any)?.id as string
      if (id) {
        result[id] = pathGenerator(f as any) || ''
      }
    }
    return result
  }, [geoFeatures, pathGenerator])

  // Pre-compute territory info for all features
  const territoryInfo = useMemo(() => {
    const info: Record<string, {
      effectiveOwnerId: string
      effectiveCountryAlignment: Alignment
      isTransferred: boolean
      originalOwnerAlignment: Alignment | null
      originalOwnerName: string
      isContested: boolean
      hasLostHomeTerritory: boolean
    }> = {}

    for (const f of geoFeatures) {
      const fid = (f.properties as any)?.id as string
      if (!fid || !countries[fid]) continue

      const effectiveOwner = getEffectiveOwner(fid)
      const isTransferred = effectiveOwner !== fid
      const effectiveCountry = countries[effectiveOwner] ?? countries[fid]

      // Check if the original owner lost its core territory
      const hasLostHome = Object.entries(territoryOverrides).some(
        ([overrideFid, overrideOwner]) => overrideFid === fid && overrideOwner !== fid
      )

      // Check if this feature is contested (claimed by multiple)
      const isContested = !isTransferred && Object.values(territoryOverrides).filter(o => o === fid).length > 1

      info[fid] = {
        effectiveOwnerId: effectiveOwner,
        effectiveCountryAlignment: effectiveCountry?.alignment ?? 'NON_ALIGNED',
        isTransferred,
        originalOwnerAlignment: isTransferred ? (countries[fid]?.alignment ?? null) : null,
        originalOwnerName: isTransferred ? (countries[fid]?.name ?? fid) : '',
        isContested,
        hasLostHomeTerritory: hasLostHome,
      }
    }

    return info
  }, [geoFeatures, countries, territoryOverrides, getEffectiveOwner])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', cursor: 'grab' }}
      onMouseMove={handleMouseMove}
      data-era={currentEra.toLowerCase()}
    >
      <g className="map-content">
        {/* Layers 0-1: Background + decor */}
        <EraFilters era={currentEra} />
        <EraPatterns />

        {/* Base map content definition */}
        <g id="map-base-content">
          {currentEra === 'IRON_CURTAIN' ? (
            <CrtOverlay width={width} height={height} pathGenerator={pathGenerator} />
          ) : currentEra === 'INFO_AGE' ? (
            <CyberOverlay width={width} height={height} />
          ) : (
            <Ocean width={width} height={height} onClick={() => setSelectedCountryId(null)} />
          )}

          {/* Cyberpunk holographic Data Beams in Era III */}
          {currentEra === 'INFO_AGE' && (
            <DataBeams projection={projection} countries={countries} />
          )}

          {/* Layer 2: Country polygons with territory overrides */}
          <g className="countries-layer">
            {geoFeatures.map(f => {
              const props = f.properties as any
              const fid = props.id as string
              const country = countries[fid]
              if (!country) return null

              const tInfo = territoryInfo[fid]
              if (!tInfo) return null

              const ownerCountry = tInfo.isTransferred
                ? countries[tInfo.effectiveOwnerId]
                : country

              if (!ownerCountry) return null
              const isEastGermany = fid === 'east_germany'

              return (
                <CountryShape
                  key={fid}
                  country={ownerCountry}
                  path={countryPaths[fid] || ''}
                  isSelected={selectedCountryId === fid || selectedCountryId === tInfo.effectiveOwnerId}
                  isHovered={hoveredCountryId === fid}
                  isEastGermany={isEastGermany}
                  era={currentEra}
                  isTransferred={tInfo.isTransferred}
                  originalOwnerAlignment={tInfo.originalOwnerAlignment}
                  isContested={tInfo.isContested}
                  hasLostHomeTerritory={tInfo.hasLostHomeTerritory}
                  onClick={() => handleCountryClick(fid)}
                  onMouseEnter={(e) => {
                    const displayName = tInfo.isTransferred
                      ? `${ownerCountry.name} (${tInfo.originalOwnerName})`
                      : country.name
                    handleCountryHover(
                      fid,
                      displayName,
                      ownerCountry.coldWarScore,
                      ownerCountry.alignment,
                      e
                    )
                  }}
                  onMouseLeave={handleCountryLeave}
                />
              )
            })}
          </g>

          {/* Layer 3: Era I blood stains */}
          {currentEra === 'POST_WW2' && (
            <BloodStains countries={countries} features={geoFeatures} />
          )}

          {/* High CWS pulsating points */}
          <g className="tension-pulses" pointerEvents="none">
            {geoFeatures.map(f => {
              const fid = (f.properties as any)?.id as string
              const country = countries[fid]
              if (!country || country.coldWarScore <= 75) return null
              const centroid = pathGenerator.centroid(f as any)
              if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return null
              const [cx, cy] = centroid
              return (
                <g key={`pulse_${fid}`}>
                  <circle cx={cx} cy={cy} r={5} fill={country.coldWarScore > 85 ? '#ff0055' : '#ff9900'} opacity={0.8} />
                  <circle cx={cx} cy={cy} r={5} fill="none" stroke={country.coldWarScore > 85 ? '#ff0055' : '#ff9900'} strokeWidth={1} opacity={0.6}>
                    <animate attributeName="r" values="5;18;5" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                </g>
              )
            })}
          </g>

          {/* Layer 4: Labels + Divided borders */}
          <DividedBorders features={geoFeatures} projection={projection} />
          <Labels features={geoFeatures} projection={projection} era={currentEra} />
        </g>

        {/* Duplicate copies for infinite wrapping */}
        <use href="#map-base-content" x={-mapWidth} />
        <use href="#map-base-content" x={mapWidth} />

        {/* Layer 5: Interaction layer */}
        <MapInteraction tooltip={tooltip} />
      </g>
    </svg>
  )
}
