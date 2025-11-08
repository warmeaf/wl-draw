/**
 * Pan tool composable for canvas panning functionality
 */
import type { MoveEvent } from 'leafer-ui'
import type { useCanvasStore } from '@/stores/canvas'
import type { Tree } from './types'

export function usePanTool(tree: Tree, _store: ReturnType<typeof useCanvasStore>) {
  let panStartPoint: { x: number; y: number } | null = null
  let panStartView: { x: number; y: number } | null = null

  function handleMoveStart(e: MoveEvent) {
    if (!tree) return

    const event =
      (e as unknown as { origin?: MouseEvent | TouchEvent }).origin ||
      (e as unknown as { nativeEvent?: MouseEvent | TouchEvent }).nativeEvent ||
      (e as unknown as { event?: MouseEvent | TouchEvent }).event
    if (!event) return

    const clientX =
      'clientX' in event ? event.clientX : (event as TouchEvent).touches?.[0]?.clientX || 0
    const clientY =
      'clientY' in event ? event.clientY : (event as TouchEvent).touches?.[0]?.clientY || 0

    panStartPoint = { x: clientX, y: clientY }
    const zoomLayer = tree.zoomLayer
    panStartView = {
      x: zoomLayer ? zoomLayer.x || 0 : tree.x || 0,
      y: zoomLayer ? zoomLayer.y || 0 : tree.y || 0,
    }
  }

  function handleMove(e: MoveEvent) {
    if (!tree || !panStartPoint || !panStartView) return

    const event =
      (e as unknown as { origin?: MouseEvent | TouchEvent }).origin ||
      (e as unknown as { nativeEvent?: MouseEvent | TouchEvent }).nativeEvent ||
      (e as unknown as { event?: MouseEvent | TouchEvent }).event
    if (!event) return

    const clientX =
      'clientX' in event ? event.clientX : (event as TouchEvent).touches?.[0]?.clientX || 0
    const clientY =
      'clientY' in event ? event.clientY : (event as TouchEvent).touches?.[0]?.clientY || 0

    const dx = clientX - panStartPoint.x
    const dy = clientY - panStartPoint.y
    const zoomLayer = tree.zoomLayer
    const scale = zoomLayer ? zoomLayer.scaleX || 1 : tree.scaleX || 1

    if (zoomLayer) {
      zoomLayer.x = panStartView.x + dx / scale
      zoomLayer.y = panStartView.y + dy / scale
    } else {
      tree.x = panStartView.x + dx / scale
      tree.y = panStartView.y + dy / scale
    }
  }

  function handleMoveEnd() {
    panStartPoint = null
    panStartView = null
  }

  return {
    handleMoveStart,
    handleMove,
    handleMoveEnd,
  }
}
