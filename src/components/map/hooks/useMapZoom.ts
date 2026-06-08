/**
 * @file 地图缩放 Hook — 支持无限循环平移
 * @desc D3 zoom behavior：滚轮缩放(1x-10x)、双击放大(3x)、拖拽平移
 *       支持水平方向无限循环对齐
 */
'use client'

import { useRef, useEffect, useCallback } from 'react'
import { zoom as d3Zoom, zoomIdentity, select, ZoomBehavior } from 'd3'

export function useMapZoom(
  svgRef: React.RefObject<SVGSVGElement | null>,
  projectionScale: number,
  width: number
) {
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      // Constraint vertical panning but leave horizontal infinite
      .translateExtent([[-Infinity, -1000], [Infinity, 1500]])
      .on('zoom', (event) => {
        const container = svg.querySelector('.map-content') as SVGGElement
        if (container) {
          const k = event.transform.k
          const mapWidth = projectionScale * 2 * Math.PI * k

          let tx = event.transform.x
          const ty = event.transform.y
          let wrapped = false

          // Wrap tx to range [width / 2 - mapWidth, width / 2]
          const minTx = width / 2 - mapWidth
          const maxTx = width / 2

          if (tx > maxTx) {
            tx -= mapWidth
            wrapped = true
          } else if (tx < minTx) {
            tx += mapWidth
            wrapped = true
          }

          const transform = zoomIdentity.translate(tx, ty).scale(k)

          if (wrapped) {
            // Write directly to D3's internal zoom state to avoid focal jumps
            select(svg).property('__zoom', transform)
          }

          container.setAttribute('transform', transform.toString())
        }
      })

    zoomBehaviorRef.current = zoomBehavior
    select(svg).call(zoomBehavior)

    const handleDblClick = (event: MouseEvent) => {
      event.preventDefault()
      const point: [number, number] = [event.clientX, event.clientY]
      zoomBehavior.scaleTo(select(svg).transition().duration(300), 3, point)
    }

    svg.addEventListener('dblclick', handleDblClick)

    return () => {
      select(svg).on('.zoom', null)
      svg.removeEventListener('dblclick', handleDblClick)
    }
  }, [svgRef, projectionScale, width])

  const resetZoom = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    select(svg).transition().duration(500).call(
      zoomBehaviorRef.current!.transform,
      zoomIdentity
    )
  }, [svgRef])

  return { resetZoom }
}
