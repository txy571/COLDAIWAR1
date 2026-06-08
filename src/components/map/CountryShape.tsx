'use client'

/**
 * @file 单个国家多边形渲染组件
 * @desc 根据阵营+时代着色，支持领土转移(混色显示)、东德条纹标记、
 *       争议领土斜线、丢失领土降饱和、选中/悬停高亮
 *       三时代配色：POST_WW2蓝/红/灰 → IRON_CURTAIN绿/暗红/暗绿 → INFO_AGE蓝/紫/黑
 */
import React from 'react'
import type { Country, Alignment, Era } from '@/types'

interface CountryShapeProps {
  country: Country | undefined
  path: string
  isSelected: boolean
  isHovered: boolean
  isEastGermany?: boolean
  era?: Era
  onClick: () => void
  onMouseEnter: (e: React.MouseEvent) => void
  onMouseLeave: () => void

  // Territory system props
  isTransferred?: boolean          // Rendered under a new owner
  originalOwnerAlignment?: Alignment | null  // Original country's alignment (for visual mix)
  transferredFromName?: string     // Original owner name for tooltip
  isContested?: boolean            // Territory is disputed
  hasLostHomeTerritory?: boolean   // Country lost some of its own land
}

function getFillColor(
  alignment: Alignment,
  era: Era,
  isTransferred: boolean,
  originalOwnerAlignment: Alignment | null
): string {
  // For transferred territory: mix of new owner color + original owner tint
  if (isTransferred && originalOwnerAlignment) {
    const base = getAlignmentColor(alignment, era)
    const original = getAlignmentColor(originalOwnerAlignment, era)
    return blendColors(base, original, 0.65) // 65% new owner, 35% original
  }

  return getAlignmentColor(alignment, era)
}

function getAlignmentColor(alignment: Alignment, era: Era): string {
  if (era === 'IRON_CURTAIN') {
    switch (alignment) {
      case 'USA_ALLY': return '#003344' // Phosphor dark teal-blue
      case 'USSR_ALLY': return '#442200' // Phosphor dark amber-orange
      default: return '#05180c' // Phosphor dark green
    }
  }
  if (era === 'INFO_AGE') {
    switch (alignment) {
      case 'USA_ALLY': return '#002233' // Cyber deep blue
      case 'USSR_ALLY': return '#33001a' // Cyber deep magenta
      default: return '#0a001a' // Cyber deep space
    }
  }
  switch (alignment) {
    case 'USA_ALLY': return '#2c5282' // Vintage navy
    case 'USSR_ALLY': return '#9b2c2c' // Vintage wine crimson
    default: return '#a0aec0' // Vintage sand gray
  }
}

/**
 * Simple hex color blending by interpolating RGB channels.
 * @param base — the dominant color (new owner)
 * @param overlay — the blended color (original owner)
 * @param weight — 0 = all overlay, 1 = all base
 */
function blendColors(base: string, overlay: string, weight: number): string {
  const parse = (c: string) => {
    const hex = c.replace('#', '')
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    }
  }

  try {
    const b = parse(base)
    const o = parse(overlay)
    const r = Math.round(b.r * weight + o.r * (1 - weight))
    const g = Math.round(b.g * weight + o.g * (1 - weight))
    const bl = Math.round(b.b * weight + o.b * (1 - weight))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
  } catch {
    return base
  }
}

function getStrokeColor(
  alignment: Alignment,
  era: Era,
  isSelected: boolean,
  isContested: boolean,
  isTransferred: boolean
): string {
  if (isSelected) return '#ffffff'
  if (isContested) return '#ffaa00'
  if (isTransferred) return '#ffff44'
  if (era === 'IRON_CURTAIN') {
    switch (alignment) {
      case 'USA_ALLY': return '#00e5ff' // Glowing phosphor teal
      case 'USSR_ALLY': return '#ff9100' // Glowing phosphor amber
      default: return '#00ff88' // Glowing phosphor green
    }
  }
  if (era === 'INFO_AGE') {
    switch (alignment) {
      case 'USA_ALLY': return '#00ffff' // Neon cyan
      case 'USSR_ALLY': return '#ff00ff' // Neon magenta
      default: return '#a600ff' // Neon violet
    }
  }
  return '#4e3f30' // Vintage dark ink
}

export const CountryShape = React.memo(function CountryShape({
  country, path, isSelected, isHovered, isEastGermany, era = 'POST_WW2',
  onClick, onMouseEnter, onMouseLeave,
  isTransferred = false,
  originalOwnerAlignment = null,
  isContested = false,
  hasLostHomeTerritory = false,
}: CountryShapeProps) {
  if (!country) return null

  const fill = getFillColor(country.alignment, era, isTransferred, originalOwnerAlignment)
  const stroke = getStrokeColor(country.alignment, era, isSelected, isContested, isTransferred)
  const isDarkEra = era === 'IRON_CURTAIN' || era === 'INFO_AGE'
  const glowFilter = era === 'IRON_CURTAIN' ? 'url(#crt-glow)' : era === 'INFO_AGE' ? 'url(#neon-glow)' : undefined

  // Base opacity: dark era lower, hover brighter, transferred slightly different
  let fillOpacity = isTransferred
    ? 0.55
    : isEastGermany
      ? 0.2
      : isHovered
        ? 0.9
        : isDarkEra
          ? 0.45
          : 0.6

  // If the country lost territory, make remaining land slightly desaturated
  if (hasLostHomeTerritory && !isHovered) {
    fillOpacity *= 0.85
  }

  // Stroke style for different territory states
  const strokeDasharray = isTransferred ? '6,3' : isContested ? '4,2' : hasLostHomeTerritory ? '4,4' : undefined
  const strokeWidth = isSelected ? 2.5 : isTransferred ? 1.8 : isContested ? 2 : isDarkEra ? 1 : 1.2

  return (
    <g>
      {/* Era glow behind */}
      {isDarkEra && !isSelected && !isTransferred && (
        <path
          d={path}
          fill="none"
          stroke={era === 'INFO_AGE' ? '#ff00ff' : '#00ff88'}
          strokeWidth={3}
          opacity={0.08}
          filter={glowFilter}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Main shape */}
      <path
        d={path}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeOpacity={isDarkEra ? 0.8 : isHovered ? 1 : 0.7}
        filter={isSelected ? glowFilter : undefined}
        style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s, fill 0.3s' }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />

      {/* East Germany stripe pattern (keep for divided countries) */}
      {isEastGermany && (
        <path
          d={path}
          fill="url(#stripe-pattern)"
          fillOpacity={isDarkEra ? 0.2 : 0.4}
          stroke="none"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Transferred territory marker */}
      {isTransferred && (
        <path
          d={path}
          fill="none"
          stroke="#ffff44"
          strokeWidth={1.5}
          strokeDasharray="3,3"
          opacity={0.5}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Contested territory hatch indicator */}
      {isContested && (
        <path
          d={path}
          fill="url(#contested-hatch)"
          fillOpacity={0.2}
          stroke="none"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  )
})
