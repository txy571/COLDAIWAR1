'use client'

/**
 * @file 分裂国家边界线
 * @desc 动态提取并绘制东西德、南北朝分界线，支持时代主题自适应
 */
import { line } from 'd3'
import { useGameStore } from '@/store/gameStore'
import type { Feature, Geometry } from 'geojson'
import type { GeoProjection } from 'd3'

interface DividedBordersProps {
  features: Feature<Geometry>[]
  projection: GeoProjection
}

// Helper to extract points from a geometry
function getPoints(geom: any): [number, number][] {
  const points: [number, number][] = []
  if (!geom) return points
  const gtype = geom.type
  if (gtype === 'Polygon') {
    for (const ring of geom.coordinates) {
      points.push(...ring)
    }
  } else if (gtype === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        points.push(...ring)
      }
    }
  }
  return points
}

// Helper to find shared border points between two features
function findSharedPoints(featA: Feature<Geometry> | undefined, featB: Feature<Geometry> | undefined, threshold = 0.05): [number, number][] {
  if (!featA || !featB) return []
  const ptsA = getPoints(featA.geometry)
  const ptsB = getPoints(featB.geometry)

  const shared: [number, number][] = []
  for (const pA of ptsA) {
    for (const pB of ptsB) {
      const dx = pA[0] - pB[0]
      const dy = pA[1] - pB[1]
      if (dx * dx + dy * dy < threshold * threshold) {
        const exists = shared.some(p => Math.abs(p[0] - pA[0]) < 1e-4 && Math.abs(p[1] - pA[1]) < 1e-4)
        if (!exists) {
          shared.push(pA)
        }
      }
    }
  }
  return shared
}

export function DividedBorders({ features, projection }: DividedBordersProps) {
  const currentEra = useGameStore(s => s.currentEra)

  // Find Germany features
  const westGermany = features.find(f => (f.properties as any)?.id === 'west_germany')
  const eastGermany = features.find(f => (f.properties as any)?.id === 'east_germany')

  // Find Korea features
  const southKorea = features.find(f => (f.properties as any)?.id === 'south_korea')
  const northKorea = features.find(f => (f.properties as any)?.id === 'north_korea')

  // 1. Germany Border Points
  const germanyPoints = findSharedPoints(westGermany, eastGermany, 0.08)
  germanyPoints.sort((a, b) => b[1] - a[1]) // North to South

  // 2. Korea Border Points (DMZ / 38th Parallel)
  const koreaPoints = findSharedPoints(southKorea, northKorea, 0.08)
  koreaPoints.sort((a, b) => a[0] - b[0]) // West to East

  // Project points to screen coordinates
  const projectedGermany = germanyPoints.map(p => projection(p)).filter(Boolean) as [number, number][]
  const projectedKorea = koreaPoints.map(p => projection(p)).filter(Boolean) as [number, number][]

  // D3 path generator
  const pathGen = line<[number, number]>()
    .x(d => d[0])
    .y(d => d[1])

  const germanyPath = projectedGermany.length > 0 ? pathGen(projectedGermany) ?? '' : ''
  const koreaPath = projectedKorea.length > 0 ? pathGen(projectedKorea) ?? '' : ''

  // Midpoints for labels
  const getMidpoint = (pts: [number, number][]) => {
    if (pts.length === 0) return null
    const idx = Math.floor(pts.length / 2)
    return pts[idx]
  }

  const germanyMid = getMidpoint(projectedGermany)
  const koreaMid = getMidpoint(projectedKorea)

  // Style attributes based on Era
  const isDarkEra = currentEra === 'IRON_CURTAIN' || currentEra === 'INFO_AGE'
  const glowFilter = currentEra === 'IRON_CURTAIN' ? 'url(#crt-glow)' : currentEra === 'INFO_AGE' ? 'url(#neon-glow)' : undefined
  
  const strokeColor = currentEra === 'IRON_CURTAIN' 
    ? '#ff9100' // Amber warning line in CRT era
    : currentEra === 'INFO_AGE'
      ? '#ff00ff' // Cyber Magenta line
      : '#9b2c2c' // Vintage wine crimson ink line

  const textColor = currentEra === 'IRON_CURTAIN'
    ? '#33ff77' // Phosphor green
    : currentEra === 'INFO_AGE'
      ? '#00ffff' // Neon cyan
      : '#2c2724' // Vintage ink black

  const fontFamily = currentEra === 'IRON_CURTAIN'
    ? "'Share Tech Mono', monospace"
    : currentEra === 'INFO_AGE'
      ? "'Inter', sans-serif"
      : "'Playfair Display', Georgia, serif"

  return (
    <g className="divided-borders" pointerEvents="none">
      {/* ─── Germany divider line ─── */}
      {germanyPath && (
        <g>
          <path
            d={germanyPath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={isDarkEra ? 2 : 1.5}
            strokeDasharray="4,4"
            opacity={isDarkEra ? 0.9 : 0.65}
            filter={glowFilter}
          />
          {germanyMid && (
            <text
              x={germanyMid[0] + 12}
              y={germanyMid[1]}
              fill={textColor}
              fontSize={currentEra === 'POST_WW2' ? 8 : 7}
              fontFamily={fontFamily}
              fontWeight="bold"
              opacity={isDarkEra ? 0.85 : 0.7}
              dominantBaseline="middle"
              className={isDarkEra ? 'theme-text-glow' : ''}
            >
              {currentEra === 'POST_WW2' ? 'Inner-German Border' : 'IRON CURTAIN BORDER'}
            </text>
          )}
        </g>
      )}

      {/* ─── Korea DMZ divider line ─── */}
      {koreaPath && (
        <g>
          <path
            d={koreaPath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={isDarkEra ? 2 : 1.5}
            strokeDasharray="4,3"
            opacity={isDarkEra ? 0.9 : 0.65}
            filter={glowFilter}
          />
          {koreaMid && (
            <text
              x={koreaMid[0]}
              y={koreaMid[1] - 10}
              textAnchor="middle"
              fill={textColor}
              fontSize={currentEra === 'POST_WW2' ? 8 : 7}
              fontFamily={fontFamily}
              fontWeight="bold"
              opacity={isDarkEra ? 0.85 : 0.7}
              className={isDarkEra ? 'theme-text-glow' : ''}
            >
              38th Parallel
            </text>
          )}
        </g>
      )}
    </g>
  )
}
